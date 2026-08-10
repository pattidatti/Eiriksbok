import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, RotateCcw, Search, Infinity as InfinityIcon, Sparkles } from 'lucide-react';

interface UniversetsAandedragProps {
    title?: string;
}

type Phase = 'cycling' | 'searching' | 'complete';

/** En dag for Brahma varer 4 320 millioner år, altså 4,32 milliarder år. */
const KALPA_MRD = 4.32;

const RADIUS = 90;
const CIRC = 2 * Math.PI * RADIUS;
const HALF = CIRC / 2;

const formatMrd = (n: number) => n.toFixed(2).replace('.', ',');

export function UniversetsAandedrag({ title = 'Universets åndedrag' }: UniversetsAandedragProps) {
    const [step, setStep] = useState(0);
    const [spin, setSpin] = useState(0);
    const [phase, setPhase] = useState<Phase>('cycling');
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        };
    }, []);

    const isDay = step % 2 === 0;
    const canSearch = step >= 4 && phase === 'cycling';
    const years = step * KALPA_MRD;

    const advance = () => {
        if (phase !== 'cycling') return;
        setStep((s) => s + 1);
        setSpin((s) => s + 180);
    };

    const searchForStart = () => {
        setPhase('searching');
        setSpin((s) => s - 1440);
        timerRef.current = window.setTimeout(() => setPhase('complete'), 1600);
    };

    const handleReset = () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        setStep(0);
        setSpin(0);
        setPhase('cycling');
    };

    const stateLabel =
        phase === 'complete' ? 'Ingen begynnelse' : isDay ? 'Brahmas dag' : 'Brahmas natt';

    const feedback =
        phase === 'complete'
            ? 'Du spolte bakover, og bakover, og bakover. Det kom aldri en første runde. I hinduistisk tidsregning har verden ingen absolutt start, bare en ny og en ny og en ny.'
            : phase === 'searching'
              ? 'Spoler bakover gjennom kalpa etter kalpa ...'
              : step === 0
                ? 'Akkurat nå er Brahma våken, og verden finnes. Trykk for å la ham sovne.'
                : isDay
                  ? 'Brahma våkner. Verden folder seg ut på nytt, og alt begynner om igjen.'
                  : 'Brahma sover. Verden er løst opp. Ingenting av det du kjenner finnes nå.';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <InfinityIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk for å skifte mellom Brahmas dag og natt. Prøv å finne begynnelsen.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-6 sm:grid-cols-[220px_1fr] items-center">
                <div className="relative w-[220px] h-[220px] mx-auto">
                    <svg viewBox="0 0 220 220" className="w-full h-full">
                        <circle
                            cx="110"
                            cy="110"
                            r={RADIUS}
                            fill="none"
                            stroke="#c7d2fe"
                            strokeWidth="16"
                            strokeDasharray={`${HALF} ${HALF}`}
                        />
                        <circle
                            cx="110"
                            cy="110"
                            r={RADIUS}
                            fill="none"
                            stroke="#fde68a"
                            strokeWidth="16"
                            strokeDasharray={`${HALF} ${HALF}`}
                            strokeDashoffset={-HALF}
                        />
                    </svg>

                    {/* Markør som går rundt hjulet */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: spin }}
                        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                    >
                        <div className="absolute left-1/2 top-[10px] -translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-indigo-500 shadow-md" />
                    </motion.div>

                    {/* Sentrum: finnes verden eller ikke */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isDay ? 'dag' : 'natt'}
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.4, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                className="flex flex-col items-center gap-1"
                            >
                                {isDay ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                                            <Sun className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <span className="text-xs font-medium text-amber-700">
                                            Verden finnes
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                            <Moon className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-medium text-indigo-700">
                                            Alt er oppløst
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div>
                    <motion.p
                        key={stateLabel}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-semibold text-slate-800"
                    >
                        {stateLabel}
                    </motion.p>

                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                            Tid du har spolt gjennom
                        </p>
                        <motion.p
                            key={step}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                            className="text-2xl font-bold text-slate-800 tabular-nums"
                        >
                            {formatMrd(years)} milliarder år
                        </motion.p>
                        <p className="text-xs text-slate-500">
                            {step} halvrunde{step === 1 ? '' : 'r'} av Brahmas døgn
                        </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={advance}
                            disabled={phase !== 'cycling'}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {isDay ? 'La Brahma sovne' : 'Vekk Brahma'}
                        </button>
                        <AnimatePresence>
                            {canSearch && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={searchForStart}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    Spol tilbake til starten
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase + String(step)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className={
                            phase === 'complete'
                                ? 'px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm'
                                : 'px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm'
                        }
                    >
                        <span className="flex items-start gap-2">
                            {phase === 'complete' ? (
                                <motion.span
                                    initial={{ rotate: -180, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                >
                                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                                </motion.span>
                            ) : (
                                <InfinityIcon className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                            )}
                            <span>{feedback}</span>
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Én dag for Brahma varer 4 320 millioner år. Natten er like lang.
                </p>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
