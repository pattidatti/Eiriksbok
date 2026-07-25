import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ArrowRight, RotateCcw, Search, CheckCircle2 } from 'lucide-react';

// Kildekjeden: eleven følger en påstand bakover, ledd for ledd, fra oss og
// tilbake til det eldste sporet. For hvert ledd som legges til, blir avstanden
// til hendelsen større. Lyspære-øyeblikket: en fortelling som har gått gjennom
// mange ledd, er ikke det samme som en fortelling mange kilder bekrefter.

interface KildeLedd {
    who: string;
    when: string;
    what: string;
    // 0-100: hvor nær hendelsen vi står etter dette leddet.
    trust: number;
}

interface KildekjedenProps {
    title?: string;
    prompt?: string;
    claim: string;
    steps: KildeLedd[];
    verdict: string;
    verdictNote?: string;
    meterLabel?: string;
}

type Phase = 'idle' | 'active' | 'complete';

export function Kildekjeden({
    title = 'Kildekjeden',
    prompt = 'Klikk deg bakover, ledd for ledd, og se hvor langt unna hendelsen vi havner.',
    claim,
    steps,
    verdict,
    verdictNote,
    meterLabel = 'Hvor nær er vi hendelsen?',
}: KildekjedenProps) {
    // Antall ledd som er avdekket. 0 = ingen ennå.
    const [revealed, setRevealed] = useState(0);

    const phase: Phase = revealed === 0 ? 'idle' : revealed >= steps.length ? 'complete' : 'active';
    const current = revealed > 0 ? steps[revealed - 1] : null;
    const trust = current ? current.trust : 100;

    const handleNext = () => {
        if (revealed < steps.length) setRevealed(revealed + 1);
    };

    const handleReset = () => setRevealed(0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            {/* Påstanden vi sporer */}
            <div className="px-6 pt-5">
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-2">
                    <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed">{claim}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: selve kjeden */}
            <div className="px-6 py-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {steps.map((step, i) => {
                        const isOpen = i < revealed;
                        const isNext = i === revealed;
                        return (
                            <div key={i} className="relative">
                                {/* Pil mellom leddene (kun på brede skjermer) */}
                                {i > 0 && (
                                    <ArrowRight
                                        className={`hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                            isOpen ? 'text-indigo-400' : 'text-slate-300'
                                        }`}
                                    />
                                )}
                                <motion.button
                                    type="button"
                                    onClick={isNext ? handleNext : undefined}
                                    disabled={!isNext}
                                    animate={
                                        isNext
                                            ? { scale: [1, 1.03, 1] }
                                            : { scale: 1 }
                                    }
                                    transition={
                                        isNext
                                            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                                            : { type: 'spring', stiffness: 260, damping: 20 }
                                    }
                                    className={`w-full h-full text-left rounded-xl border p-3 min-h-[132px] flex flex-col ${
                                        isOpen
                                            ? 'bg-white border-indigo-200 shadow-sm'
                                            : isNext
                                              ? 'bg-indigo-50 border-indigo-300 border-dashed cursor-pointer hover:bg-indigo-100 shadow-sm'
                                              : 'bg-slate-50 border-slate-200 border-dashed'
                                    }`}
                                >
                                    <span
                                        className={`text-[11px] font-bold uppercase tracking-widest ${
                                            isOpen ? 'text-indigo-500' : 'text-slate-400'
                                        }`}
                                    >
                                        Ledd {i + 1}
                                    </span>
                                    {isOpen ? (
                                        <motion.span
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex flex-col mt-1"
                                        >
                                            <span className="font-semibold text-slate-800 text-sm leading-tight">
                                                {step.who}
                                            </span>
                                            <span className="text-[11px] text-slate-400 mt-0.5">
                                                {step.when}
                                            </span>
                                            <span className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                                {step.what}
                                            </span>
                                        </motion.span>
                                    ) : (
                                        <span className="flex-1 flex items-center justify-center text-xs font-medium text-slate-400">
                                            {isNext ? 'Klikk for å åpne' : 'Skjult'}
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        );
                    })}
                </div>

                {/* Måler: hvor nær hendelsen står vi nå? */}
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600">{meterLabel}</span>
                        <span className="text-xs font-bold text-slate-500 tabular-nums">
                            {revealed} av {steps.length} ledd
                        </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            animate={{ width: `${trust}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            className={`h-full rounded-full ${
                                trust > 60
                                    ? 'bg-emerald-400'
                                    : trust > 30
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="px-6 pb-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase === 'complete' ? 'complete' : revealed}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                            phase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : phase === 'idle'
                                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                                  : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {phase === 'idle' && 'Start med det første leddet til venstre.'}
                        {phase === 'active' && current && (
                            <>
                                <span className="font-semibold">{current.who}:</span> {current.what}
                            </>
                        )}
                        {phase === 'complete' && (
                            <motion.span
                                initial={{ scale: 0.96 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                className="flex items-start gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                                <span>
                                    <span className="font-semibold block">{verdict}</span>
                                    {verdictNote && (
                                        <span className="block mt-1 text-emerald-700">
                                            {verdictNote}
                                        </span>
                                    )}
                                </span>
                            </motion.span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={phase === 'complete'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        phase === 'complete'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {phase === 'idle' ? 'Følg kjeden bakover' : 'Neste ledd'}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
