import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Glasses, Scale, ShieldCheck, Sprout, RotateCcw, Sparkles } from 'lucide-react';

// Signaturkomponent for artikkelen "Dyreetikk: Har dyr rettigheter?".
// Lyspaere-oyeblikket: samme dyre-sporsmal far ULIKT svar avhengig av hvilken
// etisk "brille" du ser gjennom. Eleven velger et konkret dilemma og avdekker
// hva nytteetikk, rettighetsetikk og dygdsetikk mener - og ser at de spriker.

type Stance = 'oppose' | 'depends' | 'allow';

interface LensVerdict {
    stance: Stance;
    text: string;
}

interface Dilemma {
    id: string;
    label: string;
    nytte: LensVerdict;
    rettighet: LensVerdict;
    dygd: LensVerdict;
}

const DILEMMAS: Dilemma[] = [
    {
        id: 'kjott',
        label: 'Spise kjøtt',
        nytte: {
            stance: 'depends',
            text: 'Veier dyrets lidelse mot menneskets glede og næring. En nytteetiker vil kreve at lidelsen kuttes mest mulig, for eksempel gjennom bedre dyrevelferd.',
        },
        rettighet: {
            stance: 'oppose',
            text: 'Har dyret rett til sitt eget liv, er det galt å drepe det for mat vi egentlig kan klare oss uten.',
        },
        dygd: {
            stance: 'depends',
            text: 'Spør: hva ville et medfølende og måteholdent menneske gjort? Kanskje spise mindre kjøtt og aldri kaste mat.',
        },
    },
    {
        id: 'forsok',
        label: 'Dyreforsøk for ny medisin',
        nytte: {
            stance: 'depends',
            text: 'Redder forsøket mange menneskeliv, kan nytten være større enn lidelsen. Men bare hvis lidelsen holdes lav og ingen annen metode finnes.',
        },
        rettighet: {
            stance: 'oppose',
            text: 'Å bruke dyret som et redskap for vår nytte krenker dyrets egenverdi, uansett hvor godt målet er.',
        },
        dygd: {
            stance: 'depends',
            text: 'Et ansvarlig menneske leter først etter forsøk uten dyr, og bruker dyr bare som siste utvei.',
        },
    },
    {
        id: 'katt-inne',
        label: 'Holde katten inne hele livet',
        nytte: {
            stance: 'depends',
            text: 'Veier kattens frihet og jaktlyst mot faren for biler, sykdom og at den dreper småfugler. Svaret spriker.',
        },
        rettighet: {
            stance: 'depends',
            text: 'Har katten rett til et naturlig liv ute? Men eier-ansvaret kan også bety å beskytte den mot farer.',
        },
        dygd: {
            stance: 'depends',
            text: 'Et omsorgsfullt menneske gir katten et rikt liv inne: leke, klatrestativ, vindusplass og selskap.',
        },
    },
    {
        id: 'pels',
        label: 'Pels til klær',
        nytte: {
            stance: 'oppose',
            text: 'Store lidelser for dyret, men liten reell nytte for oss når vi har varme klær helt uten pels.',
        },
        rettighet: {
            stance: 'oppose',
            text: 'Å avle og drepe dyr bare for pynt krenker dyrets rett til å leve.',
        },
        dygd: {
            stance: 'oppose',
            text: 'Få vil kalle det medfølende å ta livet av dyr for luksus vi ikke trenger.',
        },
    },
    {
        id: 'dyrehage',
        label: 'Dyrehage',
        nytte: {
            stance: 'depends',
            text: 'Kan lære oss mye og redde truede arter, men mange dyr lider i for små bur. Nytten avhenger av hvordan hagen drives.',
        },
        rettighet: {
            stance: 'oppose',
            text: 'Å sperre inne et vilt dyr for vår underholdning tar fra det friheten det har rett på.',
        },
        dygd: {
            stance: 'depends',
            text: 'Et klokt menneske støtter hager som verner arter og gir dyra gode liv, ikke rene utstillinger.',
        },
    },
];

type LensKey = 'nytte' | 'rettighet' | 'dygd';

const LENSES: {
    key: LensKey;
    name: string;
    subtitle: string;
    Icon: typeof Scale;
    accent: string;
}[] = [
    { key: 'nytte', name: 'Nytteetikk', subtitle: 'Veier lidelse mot nytte', Icon: Scale, accent: 'text-sky-500' },
    {
        key: 'rettighet',
        name: 'Rettighetsetikk',
        subtitle: 'Har dyret egne rettigheter?',
        Icon: ShieldCheck,
        accent: 'text-violet-500',
    },
    { key: 'dygd', name: 'Dygdsetikk', subtitle: 'Hva ville et godt menneske gjort?', Icon: Sprout, accent: 'text-emerald-500' },
];

const STANCE_STYLE: Record<Stance, { badge: string; label: string; box: string }> = {
    oppose: { badge: 'bg-rose-100 text-rose-700', label: 'Sier som regel nei', box: 'bg-rose-50 border-rose-200' },
    depends: {
        badge: 'bg-amber-100 text-amber-700',
        label: 'Det kommer an på',
        box: 'bg-amber-50 border-amber-200',
    },
    allow: { badge: 'bg-emerald-100 text-emerald-700', label: 'Kan forsvares', box: 'bg-emerald-50 border-emerald-200' },
};

interface DyreetikkBrilleneProps {
    title?: string;
}

export function DyreetikkBrillene({ title = 'De tre etiske brillene' }: DyreetikkBrilleneProps) {
    const [dilemmaId, setDilemmaId] = useState<string>(DILEMMAS[0].id);
    const [revealed, setRevealed] = useState<Set<LensKey>>(new Set());

    const dilemma = DILEMMAS.find((d) => d.id === dilemmaId) ?? DILEMMAS[0];
    const allRevealed = revealed.size === LENSES.length;

    const pickDilemma = (id: string) => {
        setDilemmaId(id);
        setRevealed(new Set());
    };

    const reveal = (key: LensKey) => {
        setRevealed((prev) => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    };

    const revealAll = () => setRevealed(new Set(LENSES.map((l) => l.key)));
    const handleReset = () => setRevealed(new Set());

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Glasses className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et dilemma, og se hva de tre etiske retningene svarer.
                    </p>
                </div>
            </div>

            {/* Dilemma-valg */}
            <div className="px-6 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Velg et dyre-dilemma
                </p>
                <div className="flex flex-wrap gap-2">
                    {DILEMMAS.map((d) => {
                        const active = d.id === dilemmaId;
                        return (
                            <button
                                key={d.id}
                                onClick={() => pickDilemma(d.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* De tre brillene */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                {LENSES.map(({ key, name, subtitle, Icon, accent }) => {
                    const verdict = dilemma[key];
                    const isOpen = revealed.has(key);
                    const style = STANCE_STYLE[verdict.stance];
                    return (
                        <div
                            key={key}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-5 h-5 ${accent}`} />
                                <span className="font-semibold text-slate-800 text-sm">{name}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">{subtitle}</p>

                            <AnimatePresence mode="wait">
                                {isOpen ? (
                                    <motion.div
                                        key="verdict"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0 }}
                                        className={`rounded-lg border ${style.box} p-3`}
                                    >
                                        <span
                                            className={`inline-block mb-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${style.badge}`}
                                        >
                                            {style.label}
                                        </span>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {verdict.text}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="cover"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => reveal(key)}
                                        className="mt-auto rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                    >
                                        Vis hva {name.toLowerCase()} mener
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="px-6">
                <AnimatePresence mode="wait">
                    {allRevealed ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Legg merke til hvor ulikt de tre svarer på nøyaktig samme spørsmål.
                                Dyreetikk gir sjelden ett fasitsvar. Svaret ditt henger sammen med
                                hvilken etisk brille du ser gjennom.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Avdekk alle tre brillene for å se hvor mye de spriker.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    onClick={revealAll}
                    disabled={allRevealed}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Vis alle tre
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
