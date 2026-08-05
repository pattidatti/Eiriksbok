import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Megaphone, EyeOff, CheckCircle2, RotateCcw } from 'lucide-react';

// Informasjonsgapet: to spor på samme tidslinje. Øverst det som faktisk skjedde,
// nederst det folk fikk vite. Eleven drar seg gjennom tida og ser gapet mellom
// sporene åpne og lukke seg.
//
// Lyspære: i en krise er ikke bare hendelsen farlig - det er avstanden mellom
// det som skjer og det folk får vite som skaper frykt og mistillit.

interface GapStep {
    // Kort datomerke, f.eks. "26. april 1986".
    date: string;
    // Valgfri klokke eller presisering, f.eks. "kl. 01.23".
    time?: string;
    // Det som faktisk skjedde.
    event: string;
    // Det folk fikk vite. Tom streng eller utelatt = stillhet.
    official?: string;
    // Én kort setning om hva gapet betyr akkurat her.
    gap: string;
}

interface InformasjonsgapetProps {
    title?: string;
    subtitle?: string;
    steps: GapStep[];
    // Teksten eleven møter når alle stegene er sett.
    conclusion?: string;
}

export function Informasjonsgapet({
    title = 'Informasjonsgapet',
    subtitle = 'Dra i tidslinja. Øverst ser du hva som skjedde, nederst hva folk fikk vite.',
    steps,
    conclusion = 'Legg merke til hvor lenge det nederste sporet er tomt. Det tomrommet er informasjonsgapet.',
}: InformasjonsgapetProps) {
    const [index, setIndex] = useState(0);
    const [seen, setSeen] = useState<number[]>([0]);

    const step = steps[index];
    const done = seen.length >= steps.length;
    const silent = !step?.official;

    const progress = useMemo(
        () => (steps.length > 1 ? (index / (steps.length - 1)) * 100 : 100),
        [index, steps.length]
    );

    const goTo = (next: number) => {
        const clamped = Math.max(0, Math.min(steps.length - 1, next));
        setIndex(clamped);
        setSeen((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
    };

    const handleReset = () => {
        setIndex(0);
        setSeen([0]);
    };

    if (!step) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <Radio className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Tidslinje-spak */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="relative">
                    <input
                        type="range"
                        min={0}
                        max={steps.length - 1}
                        step={1}
                        value={index}
                        onChange={(e) => goTo(Number(e.target.value))}
                        aria-label="Velg tidspunkt på tidslinja"
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="mt-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{steps[0].date}</span>
                        <span>{steps[steps.length - 1].date}</span>
                    </div>
                </div>
            </div>

            {/* De to sporene */}
            <div className="px-5 sm:px-6 py-4 space-y-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-800">{step.date}</span>
                    {step.time && <span className="text-xs text-slate-500">{step.time}</span>}
                </div>

                {/* Spor 1: det som skjedde */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`event-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                            Det som skjedde
                        </p>
                        <p className="text-sm text-slate-700 mt-1 leading-snug">{step.event}</p>
                    </motion.div>
                </AnimatePresence>

                {/* Spor 2: det folk fikk vite */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`official-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, delay: 0.08 }}
                        className={
                            silent
                                ? 'rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3'
                                : 'rounded-lg border border-blue-200 bg-blue-50 px-4 py-3'
                        }
                    >
                        <p
                            className={`text-[11px] font-bold uppercase tracking-wide ${
                                silent ? 'text-slate-400' : 'text-blue-700'
                            }`}
                        >
                            Det folk fikk vite
                        </p>
                        {silent ? (
                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 leading-snug">
                                <EyeOff className="w-4 h-4 shrink-0" />
                                Stillhet. Ingen melding.
                            </p>
                        ) : (
                            <p className="text-sm text-slate-700 mt-1 leading-snug">
                                {step.official}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 sm:px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`gap-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 flex items-start gap-2"
                    >
                        <Megaphone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span>{step.gap}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Suksess-tilstand */}
            <AnimatePresence>
                {done && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="mx-5 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{conclusion}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => goTo(index - 1)}
                        disabled={index === 0}
                        className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Forrige
                    </button>
                    <button
                        onClick={() => goTo(index + 1)}
                        disabled={index === steps.length - 1}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Neste
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                        Sett {seen.length} av {steps.length}
                    </span>
                    <button
                        onClick={handleReset}
                        aria-label="Tilbakestill"
                        className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
