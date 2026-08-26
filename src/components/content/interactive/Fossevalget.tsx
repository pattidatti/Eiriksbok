import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Banknote, Factory, Flag, RotateCcw, Sparkles } from 'lucide-react';

// Fossevalget - signaturkomponenten til artikkelen om fossekraften.
//
// Lyspære-øyeblikket: Norge valgte en mellomvei. Utenlandske penger fikk lov
// til å bygge kraftverkene, men fossene skulle bli norske igjen etterpå.
// Eleven er Stortinget i 1906 og velger én av tre regler. Deretter spilles de
// neste 60 årene av, og tre målere viser hva regelen førte til.

type Choice = 'selg' | 'hjemfall' | 'forby';

interface Outcome {
    id: Choice;
    label: string;
    blurb: string;
    Icon: typeof Banknote;
    // Målerne, 0-100
    penger: number;
    fabrikker: number;
    norskEierskap: number;
    verdict: string;
    historisk: boolean;
}

const OUTCOMES: Outcome[] = [
    {
        id: 'selg',
        label: 'Selg fossene fritt',
        blurb: 'Den som betaler best, får fossen for alltid.',
        Icon: Banknote,
        penger: 100,
        fabrikker: 90,
        norskEierskap: 15,
        verdict:
            'Pengene strømmer inn og fabrikkene reiser seg raskt. Men i 1966 eies kraften av selskaper i utlandet, og overskuddet forlater Norge hvert eneste år.',
        historisk: false,
    },
    {
        id: 'hjemfall',
        label: 'Lei ut i 60 år',
        blurb: 'Utlendinger får bygge, men staten overtar anlegget gratis til slutt.',
        Icon: Scale,
        penger: 85,
        fabrikker: 85,
        norskEierskap: 100,
        verdict:
            'Dette valgte Stortinget. Utenlandske penger bygde Rjukan og Notodden, men da leietiden var over, gikk fossene og kraftverkene til staten uten at Norge betalte en krone. Regelen heter hjemfallsrett.',
        historisk: true,
    },
    {
        id: 'forby',
        label: 'Forby alt salg',
        blurb: 'Bare nordmenn får eie foss. Ingen utenlandske penger slipper inn.',
        Icon: Flag,
        penger: 20,
        fabrikker: 25,
        norskEierskap: 100,
        verdict:
            'Fossene forblir norske, men Norge er et fattig land uten penger til å bygge dem ut. Kraften blir liggende ubrukt i fjellet, og fabrikkene kommer aldri.',
        historisk: false,
    },
];

const METERS = [
    { key: 'penger', label: 'Penger til utbygging', Icon: Banknote, color: 'bg-amber-500' },
    { key: 'fabrikker', label: 'Fabrikker og arbeidsplasser', Icon: Factory, color: 'bg-sky-500' },
    { key: 'norskEierskap', label: 'Norsk eierskap i 1966', Icon: Flag, color: 'bg-emerald-500' },
] as const;

interface FossevalgetProps {
    title?: string;
    prompt?: string;
}

export function Fossevalget({
    title = 'Hvem skal eie fossen?',
    prompt = 'Du er Stortinget i 1906. Utenlandske selskaper vil kjøpe norske fossefall. Velg regelen, og se hva som skjer de neste 60 årene.',
}: FossevalgetProps) {
    const [picked, setPicked] = useState<Choice | null>(null);

    const chosen = OUTCOMES.find((o) => o.id === picked) ?? null;

    return (
        <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Scale className="h-5 w-5" />
                </span>
                <div>
                    <h4 className="font-display text-lg font-semibold text-slate-900">{title}</h4>
                    <p className="text-sm text-slate-600">{prompt}</p>
                </div>
            </div>

            {/* Valgkortene */}
            <div className="grid gap-3 p-4 sm:grid-cols-3">
                {OUTCOMES.map((o) => {
                    const active = picked === o.id;
                    return (
                        <motion.button
                            key={o.id}
                            type="button"
                            onClick={() => setPicked(o.id)}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            aria-pressed={active}
                            className={`flex h-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                                active
                                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                    : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50'
                            }`}
                        >
                            <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                <o.Icon className="h-4 w-4" />
                            </span>
                            <span className="font-semibold text-slate-900">{o.label}</span>
                            <span className="text-sm leading-snug text-slate-600">{o.blurb}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>1906</span>
                    <span className="h-px flex-1 bg-slate-300" />
                    <span>1966</span>
                </div>

                <div className="space-y-3">
                    {METERS.map((m, i) => {
                        const value = chosen ? chosen[m.key] : 0;
                        return (
                            <div key={m.key}>
                                <div className="mb-1 flex items-center gap-2 text-sm text-slate-700">
                                    <m.Icon className="h-4 w-4 text-slate-500" />
                                    <span>{m.label}</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                    <motion.div
                                        className={`h-full rounded-full ${m.color}`}
                                        initial={false}
                                        animate={{ width: `${value}%` }}
                                        transition={{
                                            duration: 1.1,
                                            delay: i * 0.18,
                                            ease: 'easeOut',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 min-h-[84px]">
                    <AnimatePresence mode="wait">
                        {chosen ? (
                            <motion.div
                                key={chosen.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                                className={`rounded-xl border p-4 text-sm leading-relaxed ${
                                    chosen.historisk
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-blue-200 bg-blue-50 text-blue-800'
                                }`}
                            >
                                {chosen.historisk && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                        className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Dette er regelen Norge faktisk valgte
                                    </motion.div>
                                )}
                                <p>{chosen.verdict}</p>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="tom"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500"
                            >
                                Velg en regel over, så spilles de neste 60 årene av her.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setPicked(null)}
                        disabled={!picked}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
