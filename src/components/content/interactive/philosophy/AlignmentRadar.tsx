import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PhilosophyAxis } from '../../../../data/philosophy/types';
import { AXIS_PAIRS, AXIS_LABELS, AXIS_DESCRIPTIONS } from '../../../../data/philosophy/types';
import { Info } from 'lucide-react';

interface AlignmentRadarProps {
    alignment: Record<PhilosophyAxis, number>;
    compact?: boolean;
}

// Aksene lagres som 12 uavhengige 0-100-verdier, men er konseptuelt 6 motpoler.
// Her vises hvert par som én bipolar skala: differansen mellom polene avgjør
// hvor markøren står (50 = nøytral midt).
const pairPosition = (
    alignment: Record<PhilosophyAxis, number>,
    left: PhilosophyAxis,
    right: PhilosophyAxis
): number => {
    const diff = (alignment[right] ?? 50) - (alignment[left] ?? 50);
    return Math.max(2, Math.min(98, 50 + diff / 2));
};

export const AlignmentRadar: React.FC<AlignmentRadarProps> = ({ alignment, compact = false }) => {
    const [showDescriptions, setShowDescriptions] = useState(false);

    return (
        <div>
            <div className={compact ? 'space-y-3' : 'space-y-4'}>
                {AXIS_PAIRS.map(([left, right]) => {
                    const pos = pairPosition(alignment, left, right);
                    const leansLeft = pos < 48;
                    const leansRight = pos > 52;
                    return (
                        <div key={left}>
                            <div className="flex items-baseline justify-between mb-1">
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                        leansLeft ? 'text-indigo-600' : 'text-slate-400'
                                    }`}
                                >
                                    {AXIS_LABELS[left]}
                                </span>
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                        leansRight ? 'text-indigo-600' : 'text-slate-400'
                                    }`}
                                >
                                    {AXIS_LABELS[right]}
                                </span>
                            </div>
                            <div className="relative h-2 rounded-full bg-slate-100">
                                {/* Nøytral midtstrek */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-3 bg-slate-300" />
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-md"
                                    initial={false}
                                    animate={{ left: `${pos}%` }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <button
                onClick={() => setShowDescriptions(!showDescriptions)}
                className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors mx-auto"
            >
                <Info size={10} />
                {showDescriptions ? 'Skjul forklaring' : 'Hva betyr skalaene?'}
            </button>
            {showDescriptions && (
                <div className="mt-3 space-y-2">
                    {AXIS_PAIRS.map(([left, right]) => (
                        <div key={left} className="text-[10px] leading-snug">
                            <p>
                                <span className="font-bold text-indigo-500">{AXIS_LABELS[left]}:</span>{' '}
                                <span className="text-slate-500">{AXIS_DESCRIPTIONS[left]}</span>
                            </p>
                            <p>
                                <span className="font-bold text-indigo-500">{AXIS_LABELS[right]}:</span>{' '}
                                <span className="text-slate-500">{AXIS_DESCRIPTIONS[right]}</span>
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
