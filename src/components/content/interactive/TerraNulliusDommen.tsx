import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Check, X, Stamp, RotateCcw, Gavel } from 'lucide-react';

interface EvidenceItem {
    title: string;
    detail: string;
}

interface TerraNulliusDommenProps {
    title?: string;
    criteria?: string[];
    evidence?: EvidenceItem[];
}

type Phase = 'samler' | 'dom1788' | 'dom1992';

const DEFAULT_CRITERIA = [
    'Pløyer de åkrer?',
    'Bygger de hus av stein som blir stående?',
    'Har de en konge som kan skrive under en avtale?',
    'Har de gjerder rundt eiendommen sin?',
];

const DEFAULT_EVIDENCE: EvidenceItem[] = [
    {
        title: 'Boplass som er 65 000 år gammel',
        detail: 'Under berget Madjedbebe nord i Australia ligger redskaper og kullrester fra folk som bodde der for opptil 65 000 år siden.',
    },
    {
        title: 'Bergkunst som er 28 000 år gammel',
        detail: 'I Arnhem Land finnes malerier på bergvegger som er datert til 28 000 år tilbake. Noen motiver er malt opp igjen av nye slekter i tusenvis av år.',
    },
    {
        title: 'Kvernsteiner for korn',
        detail: 'Steiner brukt til å male frø til mel er 30 000 år gamle. Folk høstet og bearbeidet korn her lenge før noen gjorde det i Europa.',
    },
    {
        title: 'Landet ble stelt med ild',
        detail: 'I over 20 000 år har folk brent småflater av krattet med vilje for å styre hva som vokser og hvor dyrene beiter. Det er jordbruk, bare uten plog.',
    },
    {
        title: 'Fiskefeller i stein',
        detail: 'Lange steinmurer i elver og laguner ledet fisken inn i kamre. Det ligner det vi i dag kaller oppdrett.',
    },
    {
        title: 'Rundt 250 egne språk',
        detail: 'Ved koloniseringen ble det snakket omtrent 250 forskjellige språk i Australia. Hvert språk hørte til et folk med sitt eget område.',
    },
    {
        title: 'Klanområder med faste grenser',
        detail: 'Folk levde i klaner på 20 til 50 personer. Hver klan hadde sitt eget land med grenser alle kjente, selv om ingen satte opp gjerder.',
    },
];

export function TerraNulliusDommen({
    title = 'Rettssaken om et helt land',
    criteria = DEFAULT_CRITERIA,
    evidence = DEFAULT_EVIDENCE,
}: TerraNulliusDommenProps) {
    const [opened, setOpened] = useState<number[]>([]);
    const [phase, setPhase] = useState<Phase>('samler');
    const [active, setActive] = useState<number | null>(null);

    const allOpened = opened.length === evidence.length;

    const handleOpen = (i: number) => {
        setActive(i);
        if (opened.includes(i)) return;
        const next = [...opened, i];
        setOpened(next);
        if (next.length === evidence.length) {
            window.setTimeout(() => setPhase('dom1788'), 700);
        }
    };

    const handleReset = () => {
        setOpened([]);
        setPhase('samler');
        setActive(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk hvert bevis og legg det på bordet. Se så hva dommen ble.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
                {/* Bevisbordet */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Bevis fra Australia i 1788
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {evidence.map((e, i) => {
                            const isOpen = opened.includes(i);
                            return (
                                <motion.button
                                    key={e.title}
                                    onClick={() => handleOpen(i)}
                                    whileTap={{ scale: 0.97 }}
                                    animate={
                                        active === i
                                            ? { scale: [1, 1.04, 1] }
                                            : { scale: 1 }
                                    }
                                    transition={{ duration: 0.28 }}
                                    className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                                        isOpen
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:shadow-md'
                                    }`}
                                >
                                    <span className="flex items-start gap-2">
                                        {isOpen ? (
                                            <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                                        ) : (
                                            <span className="w-4 h-4 mt-0.5 shrink-0 rounded-full border border-slate-300" />
                                        )}
                                        <span className="font-medium leading-snug">{e.title}</span>
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Feedback-sone: alltid i DOM-et */}
                    <div className="mt-3 min-h-[76px] rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <AnimatePresence mode="wait">
                            {active === null ? (
                                <motion.p
                                    key="tom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-blue-700/80"
                                >
                                    Velg et bevis for å lese hva arkeologene har funnet.
                                </motion.p>
                            ) : (
                                <motion.div
                                    key={active}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <p className="leading-relaxed">{evidence[active].detail}</p>
                                    <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5">
                                            Bodde det folk her? JA
                                        </span>
                                        <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5">
                                            Teller i den britiske testen? NEI
                                        </span>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Den britiske testen */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Den britiske testen
                    </p>
                    <ul className="space-y-2">
                        {criteria.map((c) => (
                            <li key={c} className="flex items-start gap-2 text-sm text-slate-600">
                                <X className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                                <span className="leading-snug">{c}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                        Alle svarene ble nei. Testen spurte bare etter et europeisk liv.
                    </p>
                </div>
            </div>

            {/* Dommen */}
            <div className="px-5 pb-2 min-h-[104px]">
                <AnimatePresence mode="wait">
                    {phase === 'dom1788' && (
                        <motion.div
                            key="d1788"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
                        >
                            <div className="flex items-start gap-3">
                                <motion.span
                                    initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
                                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 14 }}
                                >
                                    <Stamp className="w-6 h-6 text-rose-600 shrink-0" />
                                </motion.span>
                                <div>
                                    <p className="font-semibold text-rose-800">
                                        Dommen i 1788: terra nullius, ingenmannsland
                                    </p>
                                    <p className="text-sm text-rose-700 leading-relaxed mt-0.5">
                                        Du la {evidence.length} av {evidence.length} bevis på bordet
                                        for at folk bodde her. Loven fant likevel landet tomt, fordi
                                        testen var laget slik at bare ett svar var mulig.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'dom1992' && (
                        <motion.div
                            key="d1992"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                        >
                            <div className="flex items-start gap-3">
                                <motion.span
                                    initial={{ scale: 0.4, rotate: 24, opacity: 0 }}
                                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                                >
                                    <Gavel className="w-6 h-6 text-emerald-600 shrink-0" />
                                </motion.span>
                                <div>
                                    <p className="font-semibold text-emerald-800">
                                        3. juni 1992: dommen blir snudd
                                    </p>
                                    <p className="text-sm text-emerald-700 leading-relaxed mt-0.5">
                                        Australias høyesterett slo fast at terra nullius aldri burde
                                        vært brukt på Australia. Bevisene hadde ligget der hele
                                        tiden. Det som endret seg, var hvem retten var villig til å
                                        høre på. Det tok 204 år.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3">
                {phase === 'dom1788' ? (
                    <button
                        onClick={() => setPhase('dom1992')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Gå til 1992
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {allOpened
                            ? 'Alle bevisene ligger på bordet.'
                            : `${opened.length} av ${evidence.length} bevis lagt fram`}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
