import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ScrollText, RotateCcw } from 'lucide-react';

// Signaturkomponent til artikkelen om den forsvunne kolonien Roanoke.
// Lyspære-øyeblikket: Når en gåte ikke har fasit, veier vi spor mot flere
// forklaringer. Flest spor kan peke ett sted uten å BEVISE noe. Eleven trykker
// på hvert spor, ser hvilke forklaringer det styrker, og oppdager at den
// sterkeste forklaringen (Croatoan) likevel ikke når linja "Bevist".

interface Theory {
    id: string;
    label: string;
    barClass: string;
    textClass: string;
}

interface Clue {
    id: string;
    label: string;
    reveal: string;
    support: { theory: string; weight: number }[];
}

interface SporTavlenProps {
    title?: string;
}

const THEORIES: Theory[] = [
    {
        id: 'croatoan',
        label: 'De flyttet til Croatoan',
        barClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
    },
    {
        id: 'katastrofe',
        label: 'Sult og tørke tok dem',
        barClass: 'bg-amber-500',
        textClass: 'text-amber-700',
    },
    {
        id: 'angrep',
        label: 'De ble angrepet og drept',
        barClass: 'bg-rose-500',
        textClass: 'text-rose-700',
    },
];

const CLUES: Clue[] = [
    {
        id: 'croatoan-ord',
        label: 'Ordet CROATOAN skåret i stolpen',
        reveal: 'Kolonistene hadde avtalt å skjære inn navnet på stedet de dro til. Croatoan var en øy rett i nærheten.',
        support: [{ theory: 'croatoan', weight: 30 }],
    },
    {
        id: 'ingen-nodtegn',
        label: 'Ingen nødtegn (kors) funnet',
        reveal: 'De skulle skjære inn et kors hvis de ble tvunget bort i fare. Krysset var ikke der. Altså dro de i ro, ikke i panikk.',
        support: [{ theory: 'croatoan', weight: 16 }],
    },
    {
        id: 'engelske-ting',
        label: 'Engelske ting i landsbyer på Croatoan-øya',
        reveal: 'Arkeologer har gravd fram et sverdhåndtak og engelsk glass akkurat der urfolket bodde. Slikt havner ikke dit av seg selv.',
        support: [{ theory: 'croatoan', weight: 26 }],
    },
    {
        id: 'torke',
        label: 'Den verste tørken på 800 år (1587-1589)',
        reveal: 'Årringer i gamle trær viser at avlingene slo feil nettopp disse årene. Uten mat blir det umulig å bli værende.',
        support: [{ theory: 'katastrofe', weight: 30 }],
    },
    {
        id: 'ingen-graver',
        label: 'Ingen graver eller lik funnet',
        reveal: 'Hadde alle sultet i hjel eller blitt drept på stedet, ville vi ventet å finne graver. Det gjorde vi ikke. Trolig dro de levende.',
        support: [{ theory: 'croatoan', weight: 12 }],
    },
    {
        id: 'strid-om-mat',
        label: 'Strid om mat med naboene',
        reveal: 'Da tørken kom, hadde ikke urfolket nok mat å dele heller. Det finnes kilder om harde ord og kamp mellom folk i området.',
        support: [
            { theory: 'angrep', weight: 22 },
            { theory: 'katastrofe', weight: 14 },
        ],
    },
];

const PROVEN = 100; // "Bevist"-linja ingen forklaring når fram til

export function SporTavlen({ title = 'Spor-tavlen' }: SporTavlenProps) {
    const [examined, setExamined] = useState<string[]>([]);
    const [lastReveal, setLastReveal] = useState<string | null>(null);

    const done = examined.length === CLUES.length;

    const scores = useMemo(() => {
        const s: Record<string, number> = { croatoan: 0, katastrofe: 0, angrep: 0 };
        for (const cid of examined) {
            const clue = CLUES.find((c) => c.id === cid);
            if (!clue) continue;
            for (const sup of clue.support) s[sup.theory] += sup.weight;
        }
        return s;
    }, [examined]);

    const examine = (clue: Clue) => {
        if (examined.includes(clue.id)) return;
        setExamined((prev) => [...prev, clue.id]);
        setLastReveal(clue.reveal);
    };

    const reset = () => {
        setExamined([]);
        setLastReveal(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk på hvert spor og se hvilken forklaring det styrker.
                    </p>
                </div>
            </div>

            {/* Teori-barer (alltid synlige) */}
            <div className="px-6 pt-5 space-y-3">
                {THEORIES.map((t) => {
                    const val = Math.min(PROVEN, scores[t.id]);
                    return (
                        <div key={t.id}>
                            <div className="flex items-baseline justify-between mb-1">
                                <span className={`text-sm font-medium ${t.textClass}`}>
                                    {t.label}
                                </span>
                                <span className="text-xs text-slate-400 tabular-nums">
                                    {val} / {PROVEN}
                                </span>
                            </div>
                            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${t.barClass}`}
                                    initial={false}
                                    animate={{ width: `${val}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                />
                            </div>
                        </div>
                    );
                })}
                <div className="flex items-center justify-end gap-1 pt-0.5">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        Linja helt til høyre = Bevist
                    </span>
                </div>
            </div>

            {/* Spor-kort */}
            <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CLUES.map((clue) => {
                    const isDone = examined.includes(clue.id);
                    return (
                        <motion.button
                            key={clue.id}
                            onClick={() => examine(clue)}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-start gap-2 text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                                isDone
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-indigo-300'
                            }`}
                        >
                            <span className="mt-0.5 shrink-0">
                                {isDone ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <Search className="w-4 h-4 text-slate-400" />
                                )}
                            </span>
                            <span>{clue.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="px-6 pt-4 pb-2 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="verdict"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 140, damping: 14 }}
                            className="flex items-start gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3"
                        >
                            <ScrollText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-indigo-900">
                                Sporene peker klarest mot Croatoan. Men ingen forklaring når helt
                                fram til <strong>Bevist</strong>. Gåten er fortsatt uløst - og det
                                er det ærlige svaret.
                            </p>
                        </motion.div>
                    ) : lastReveal ? (
                        <motion.div
                            key={lastReveal}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800"
                        >
                            {lastReveal}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400 px-1 py-2"
                        >
                            Ingen spor undersøkt ennå. Start med stolpen der det stod CROATOAN.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400 tabular-nums">
                    {examined.length} av {CLUES.length} spor undersøkt
                </span>
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
