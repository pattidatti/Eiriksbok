import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Check, KeyRound, Sparkles } from 'lucide-react';

interface Milestone {
    year: string;
    right: string;
    detail: string;
}

interface RettighetsLasProps {
    title?: string;
    intro?: string;
    milestones?: Milestone[];
}

const DEFAULT_MILESTONES: Milestone[] = [
    {
        year: '1884',
        right: 'Rett til utdanning',
        detail: 'Kvinner ble tatt opp ved alle fakultetene ved universitetet. Fra 1882 kunne de ta examen artium.',
    },
    {
        year: '1888',
        right: 'Egen lønn',
        detail: 'Gifte kvinner ble myndige og fikk råderett over det de selv tjente. Mannen bestemte fortsatt over felleseiet.',
    },
    {
        year: '1901',
        right: 'Stemme i kommunevalg',
        detail: 'Noen kvinner fikk stemme i lokalvalg. Det var et første lite skritt mot full stemmerett.',
    },
    {
        year: '1913',
        right: 'Stemme i stortingsvalg',
        detail: 'Alle kvinner i Norge fikk stemmerett. Norge var blant de første landene i verden.',
    },
];

export function RettighetsLas({
    title = 'Lås opp rettighetene',
    intro = 'Klikk på den neste låsen. Hver rettighet ble vunnet etter år med kamp.',
    milestones = DEFAULT_MILESTONES,
}: RettighetsLasProps) {
    const [unlocked, setUnlocked] = useState(0);
    const total = milestones.length;
    const done = unlocked >= total;

    const handleUnlock = (index: number) => {
        if (index !== unlocked) return;
        setUnlocked((u) => u + 1);
    };

    const handleReset = () => setUnlocked(0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Interaksjonsflate: rettighetskort */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {milestones.map((m, i) => {
                    const isOpen = i < unlocked;
                    const isNext = i === unlocked;
                    return (
                        <motion.button
                            key={m.right}
                            type="button"
                            onClick={() => handleUnlock(i)}
                            disabled={!isNext}
                            animate={
                                isNext
                                    ? { scale: [1, 1.03, 1] }
                                    : { scale: 1 }
                            }
                            transition={
                                isNext
                                    ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                                    : { duration: 0.2 }
                            }
                            whileTap={isNext ? { scale: 0.96 } : undefined}
                            className={`text-left rounded-xl border p-4 transition-colors ${
                                isOpen
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : isNext
                                      ? 'bg-white border-indigo-300 ring-2 ring-indigo-200 cursor-pointer shadow-md'
                                      : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isOpen
                                            ? 'bg-emerald-500 text-white'
                                            : isNext
                                              ? 'bg-indigo-100 text-indigo-600'
                                              : 'bg-slate-200 text-slate-400'
                                    }`}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isOpen ? (
                                            <motion.span
                                                key="open"
                                                initial={{ scale: 0, rotate: -30 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                                            >
                                                <Check className="w-4 h-4" />
                                            </motion.span>
                                        ) : isNext ? (
                                            <motion.span key="next">
                                                <Unlock className="w-4 h-4" />
                                            </motion.span>
                                        ) : (
                                            <motion.span key="locked">
                                                <Lock className="w-4 h-4" />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </span>
                                <span
                                    className={`text-sm font-semibold ${
                                        isOpen ? 'text-emerald-800' : 'text-slate-700'
                                    }`}
                                >
                                    {m.right}
                                </span>
                            </div>

                            <AnimatePresence initial={false}>
                                {isOpen ? (
                                    <motion.div
                                        key="detail"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden"
                                    >
                                        <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 mb-1">
                                            {m.year}
                                        </span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {m.detail}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        {isNext ? 'Klikk for å låse opp' : 'Låst'}
                                    </p>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm min-h-[3rem] flex items-center">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-emerald-700"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>
                                Alle disse rettighetene ble vunnet gjennom kamp. Ingen av dem kom av
                                seg selv.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.span key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {unlocked} av {total} rettigheter låst opp. Klikk det neste kortet.
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Tidsrom: {milestones[0]?.year}–{milestones[total - 1]?.year}
                </span>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
