import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, History } from 'lucide-react';
import type { ChoiceHistoryEntry } from '../../data/chronos/types';
import { scatter } from '../../utils/random';

interface EndComparisonScreenProps {
    choiceHistory: ChoiceHistoryEntry[];
}

function useCountUp(target: number, duration = 1200, delay = 800) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const timeout = setTimeout(() => {
            const start = performance.now();
            const step = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                setCount(Math.round(progress * target));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);
    return count;
}

export const EndComparisonScreen: React.FC<EndComparisonScreenProps> = ({ choiceHistory }) => {
    const historicalCount = choiceHistory.filter((e) => e.isHistorical).length;
    const animatedCount = useCountUp(historicalCount);

    // Vaktsjekken må stå etter hooks — React krever lik hook-rekkefølge hver render.
    if (choiceHistory.length === 0) return null;

    const isHighScore = historicalCount >= choiceHistory.length * 0.7;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden relative"
        >
            {/* Confetti for high accuracy */}
            {isHighScore && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 1,
                                x: `${20 + scatter(i, 1) * 60}%`,
                                y: '-10%',
                                rotate: scatter(i, 2) * 360,
                                scale: 0.6 + scatter(i, 3) * 0.6,
                            }}
                            animate={{
                                y: '110%',
                                rotate: scatter(i, 4) * 720 - 360,
                                opacity: [1, 1, 0],
                            }}
                            transition={{
                                duration: 2 + scatter(i, 5) * 1.5,
                                delay: 0.8 + i * 0.15,
                                ease: 'easeIn',
                            }}
                            className="absolute w-2 h-3 rounded-sm"
                            style={{
                                backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'][i % 5],
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                    <History size={16} className="text-amber-700" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                        Historisk fasit
                    </p>
                    <h4 className="font-bold text-stone-800 text-sm leading-tight">
                        Dine valg vs. historiens gang
                    </h4>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-stone-800">
                        {animatedCount}
                        <span className="text-sm font-bold text-stone-400">/{choiceHistory.length}</span>
                    </p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        historisk
                    </p>
                </div>
            </div>

            <div className="divide-y divide-stone-100">
                {choiceHistory.map((entry, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.12 }}
                        className="p-4"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 line-clamp-1">
                            {entry.nodeText}
                        </p>
                        <div className="flex items-start gap-2 mb-1">
                            {entry.isHistorical ? (
                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <XCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                            )}
                            <p className="text-sm text-stone-700 leading-snug">{entry.choiceText}</p>
                        </div>
                        {!entry.isHistorical && entry.historicalChoiceText && (
                            <p className="text-xs text-stone-500 ml-5 mt-1">
                                Historisk valg:{' '}
                                <span className="text-emerald-700 font-medium">
                                    {entry.historicalChoiceText}
                                </span>
                            </p>
                        )}
                        {entry.historicalConsequence && (
                            <p className="text-xs text-amber-700 italic ml-5 mt-1 leading-snug">
                                {entry.historicalConsequence}
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
