import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc3, Trash2, Sparkles, RotateCcw } from 'lucide-react';

interface SamplingLabProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Sample {
    id: string;
    genre: string;
    year: string;
    element: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
}

const SAMPLES: Sample[] = [
    {
        id: 'funk',
        genre: 'Funk',
        year: '1972',
        element: 'Trommebreak',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        icon: '🥁',
    },
    {
        id: 'soul',
        genre: 'Soul',
        year: '1968',
        element: 'Basslinje',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        icon: '🎸',
    },
    {
        id: 'jazz',
        genre: 'Jazz',
        year: '1965',
        element: 'Pianoriff',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        icon: '🎹',
    },
    {
        id: 'rnb',
        genre: 'R&B',
        year: '1975',
        element: 'Vokalklipp',
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-300',
        icon: '🎤',
    },
];

const SLOT_LABELS = ['Rytme', 'Bass', 'Melodi', 'Vokal'];

export function SamplingLab({ title = 'Sampling-laboratoriet' }: SamplingLabProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [slots, setSlots] = useState<(Sample | null)[]>([null, null, null, null]);
    const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

    const usedIds = useMemo(
        () => new Set(slots.filter(Boolean).map((s) => s!.id)),
        [slots]
    );
    const filledCount = slots.filter(Boolean).length;

    const handleSelectSample = useCallback(
        (sample: Sample) => {
            if (phase === 'complete') return;
            if (usedIds.has(sample.id)) return;
            setSelectedSample(sample);
            if (phase === 'idle') setPhase('active');
        },
        [phase, usedIds]
    );

    const handlePlaceInSlot = useCallback(
        (slotIndex: number) => {
            if (!selectedSample || phase === 'complete') return;
            if (slots[slotIndex]) return;
            const newSlots = [...slots];
            newSlots[slotIndex] = selectedSample;
            setSlots(newSlots);
            setSelectedSample(null);
            if (newSlots.every(Boolean)) {
                setPhase('complete');
            }
        },
        [selectedSample, slots, phase]
    );

    const handleRemoveFromSlot = useCallback(
        (slotIndex: number) => {
            if (phase === 'complete') return;
            const newSlots = [...slots];
            newSlots[slotIndex] = null;
            setSlots(newSlots);
        },
        [slots, phase]
    );

    const handleReset = () => {
        setPhase('idle');
        setSlots([null, null, null, null]);
        setSelectedSample(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3 sm:px-6">
                <Disc3 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg samples fra gamle plater og bygg din egen hip-hop-beat
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                            Platekasse
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {SAMPLES.map((sample) => {
                                const used = usedIds.has(sample.id);
                                const selected = selectedSample?.id === sample.id;
                                return (
                                    <motion.button
                                        key={sample.id}
                                        onClick={() => handleSelectSample(sample)}
                                        disabled={used || phase === 'complete'}
                                        whileTap={!used ? { scale: 0.96 } : undefined}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-colors ${
                                            used
                                                ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-50'
                                                : selected
                                                  ? `${sample.bgColor} ${sample.borderColor} ring-2 ring-offset-1 ring-indigo-400`
                                                  : `${sample.bgColor} ${sample.borderColor} hover:shadow-md cursor-pointer`
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{sample.icon}</span>
                                            <span className={`font-semibold text-sm ${sample.color}`}>
                                                {sample.genre}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{sample.element}</p>
                                        <p className="text-xs text-slate-400">{sample.year}</p>
                                        {used && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-medium text-slate-400">
                                                    Brukt
                                                </span>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        {selectedSample && (
                            <motion.p
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-sm text-indigo-600 font-medium text-center"
                            >
                                Klikk en ledig plass i beatet for å plassere{' '}
                                {selectedSample.element.toLowerCase()}
                            </motion.p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                            Din beat
                        </p>
                        <div className="space-y-2">
                            {SLOT_LABELS.map((label, i) => {
                                const sample = slots[i];
                                return (
                                    <motion.div
                                        key={i}
                                        layout
                                        onClick={() =>
                                            sample
                                                ? handleRemoveFromSlot(i)
                                                : handlePlaceInSlot(i)
                                        }
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors min-h-[52px] ${
                                            sample
                                                ? `${sample.bgColor} ${sample.borderColor} cursor-pointer`
                                                : selectedSample
                                                  ? 'border-dashed border-indigo-300 bg-indigo-50/40 cursor-pointer hover:bg-indigo-50'
                                                  : 'border-dashed border-slate-200 bg-slate-50/50'
                                        }`}
                                    >
                                        <span className="text-xs font-medium text-slate-400 w-12 flex-shrink-0">
                                            {label}
                                        </span>
                                        <AnimatePresence mode="wait">
                                            {sample ? (
                                                <motion.div
                                                    key={sample.id}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2 flex-1"
                                                >
                                                    <span className="text-base">
                                                        {sample.icon}
                                                    </span>
                                                    <span
                                                        className={`text-sm font-medium ${sample.color}`}
                                                    >
                                                        {sample.genre} — {sample.element}
                                                    </span>
                                                    {phase !== 'complete' && (
                                                        <Trash2 className="w-3.5 h-3.5 text-slate-300 ml-auto hover:text-slate-500" />
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.span
                                                    key="empty"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-xs text-slate-300 italic"
                                                >
                                                    {selectedSample
                                                        ? 'Klikk for å plassere'
                                                        : 'Tom'}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(filledCount / 4) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {filledCount}/4 samples plassert
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 mb-4 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200 sm:mx-6"
                    >
                        <div className="flex items-start gap-3">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15,
                                }}
                            >
                                <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            </motion.div>
                            <div>
                                <p className="font-semibold text-emerald-800 text-sm">
                                    Beatet ditt er klart!
                                </p>
                                <p className="text-sm text-emerald-700 mt-1">
                                    Du tok biter fra fire forskjellige sjangre og satte dem
                                    sammen til noe nytt. Det er akkurat det hip-hop-pionerene
                                    gjorde: de fant de beste øyeblikkene i gamle plater og
                                    kombinerte dem til en helt ny lyd. Denne teknikken heter
                                    sampling, og den er hjertet i hip-hop.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pb-4 flex items-center justify-end sm:px-6 sm:pb-5">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
