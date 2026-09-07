import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Check, X, RotateCcw, Trophy } from 'lucide-react';

// Lyspære-øyeblikket: hver gang urfolk i Nord-Amerika fikk et løfte på papir,
// ble området deres mindre etterpå. Eleven gjetter selv hva som skjedde etter
// hvert løfte, og ser søylen krympe for hvert svar - helt til loven i 1934
// endelig snur retningen. Løftebrudd var mønsteret, ikke unntaket.

interface KrympeSteg {
    year: string;
    title: string;
    // Det som ble sagt eller lovt, med elevens ord.
    said: string;
    // Nøyaktig to valg. `answer` peker på det som faktisk skjedde.
    options: string[];
    answer: number;
    truth: string;
    // Hvor mye land urfolk rådde over etter dette steget (0-100).
    areaPercent: number;
    areaLabel: string;
}

interface LandetSomKrympetProps {
    title?: string;
    lead?: string;
    barLabel?: string;
    barNote?: string;
    startPercent?: number;
    startLabel?: string;
    steps: KrympeSteg[];
    conclusion?: string;
}

type Phase = 'asking' | 'revealed' | 'done';

export function LandetSomKrympet({
    title = 'Landet som krympet',
    lead = 'Les hva som ble lovt. Gjett hva som faktisk skjedde.',
    barLabel = 'Land urfolk rådde over',
    barNote = 'Søylen viser retningen, ikke nøyaktige tall.',
    startPercent = 100,
    startLabel = 'Nesten alt land vest for Appalachene',
    steps,
    conclusion = 'Seks avtaler og lover. Hver eneste gang sto det noe annet på papiret enn det som skjedde med kartet.',
}: LandetSomKrympetProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('asking');
    const [picked, setPicked] = useState<number | null>(null);
    const [right, setRight] = useState(0);

    const step = steps[index];
    const shown =
        phase === 'asking'
            ? index === 0
                ? startPercent
                : steps[index - 1].areaPercent
            : step.areaPercent;
    const shownLabel =
        phase === 'asking'
            ? index === 0
                ? startLabel
                : steps[index - 1].areaLabel
            : step.areaLabel;

    const pick = (i: number) => {
        if (phase !== 'asking') return;
        setPicked(i);
        setPhase('revealed');
        if (i === step.answer) setRight((r) => r + 1);
    };

    const next = () => {
        if (index + 1 >= steps.length) {
            setPhase('done');
            return;
        }
        setIndex((n) => n + 1);
        setPicked(null);
        setPhase('asking');
    };

    const reset = () => {
        setIndex(0);
        setPicked(null);
        setRight(0);
        setPhase('asking');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scroll className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{lead}</p>
                </div>
            </div>

            {/* Landsøyla - alltid synlig, krymper for hvert svar */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {barLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                        Steg {Math.min(index + 1, steps.length)} av {steps.length}
                    </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                        animate={{ width: `${Math.max(2, Math.min(100, shown))}%` }}
                        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={shownLabel}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-slate-500 mt-1.5"
                    >
                        {shownLabel}
                    </motion.p>
                </AnimatePresence>
                <p className="text-[11px] text-slate-400 mt-0.5">{barNote}</p>
            </div>

            {/* Kjerneinteraksjonen */}
            {phase !== 'done' && (
                <div className="px-5 sm:px-6 pt-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step.year}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                    {step.year}
                                </span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {step.title}
                                </span>
                            </div>
                            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                                    Dette ble sagt
                                </p>
                                <p className="text-sm text-blue-900 leading-relaxed">{step.said}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <p className="text-sm font-medium text-slate-600 mt-4 mb-2">
                        Hva skjedde etterpå?
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                        {step.options.map((opt, i) => {
                            const isAnswer = i === step.answer;
                            const isPicked = picked === i;
                            const revealed = phase === 'revealed';
                            const tone = !revealed
                                ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-700'
                                : isAnswer
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isPicked
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-400';
                            return (
                                <motion.button
                                    key={opt}
                                    onClick={() => pick(i)}
                                    disabled={revealed}
                                    whileTap={revealed ? undefined : { scale: 0.98 }}
                                    className={`text-left px-4 py-3 rounded-xl border shadow-sm text-sm leading-snug transition-colors ${tone}`}
                                >
                                    <span className="flex items-start gap-2">
                                        {revealed && isAnswer && (
                                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        )}
                                        {revealed && isPicked && !isAnswer && (
                                            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        )}
                                        <span>{opt}</span>
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feedback-sone - alltid i DOM-et */}
            <div className="px-5 sm:px-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'revealed' && (
                        <motion.div
                            key={`truth-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200"
                        >
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
                                Slik gikk det
                            </p>
                            <p className="text-sm text-amber-900 leading-relaxed">{step.truth}</p>
                        </motion.div>
                    )}
                    {phase === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200"
                        >
                            <div className="flex items-start gap-2">
                                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-900">
                                        Du gjettet riktig {right} av {steps.length} ganger.
                                    </p>
                                    <p className="text-sm text-emerald-800 leading-relaxed mt-1">
                                        {conclusion}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {phase === 'asking' && (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-400"
                        >
                            Velg ett av de to svarene for å se hva som skjedde.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 py-5 flex items-center justify-between gap-3">
                {phase === 'revealed' ? (
                    <button
                        onClick={next}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 >= steps.length ? 'Se hele bildet' : 'Neste avtale'}
                    </button>
                ) : (
                    <span className="text-xs text-slate-400">
                        {phase === 'done' ? 'Ferdig' : 'Venter på svaret ditt'}
                    </span>
                )}
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
