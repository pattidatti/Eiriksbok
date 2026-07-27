import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RichText } from '../ui/RichText';
import type { Religion } from '../../types';

interface DimensionWheelProps {
    religion: Religion;
}

const DIMENSIONS = [
    { key: 'ritual', label: 'Ritualer og kult', angle: 0 },
    { key: 'narrative', label: 'Fortellinger og myter', angle: 51.4 },
    { key: 'experiential', label: 'Opplevelser og erfaringer', angle: 102.8 },
    { key: 'social', label: 'Sosial organisering', angle: 154.2 },
    { key: 'ethical', label: 'Etikk og moral', angle: 205.6 },
    { key: 'doctrinal', label: 'Lære og filosofi', angle: 257 },
    { key: 'material', label: 'Materielle uttrykk', angle: 308.4 },
] as const;

export const DimensionWheel: React.FC<DimensionWheelProps> = ({ religion }) => {
    const [selectedDim, setSelectedDim] = useState<typeof DIMENSIONS[number]['key'] | null>(null);

    // Calculate wedge path
    // 360 / 7 = ~51.4 degrees
    // We'll use SVG for the wheel
    const radius = 150;
    const center = 160; // slightly larger than radius to avoid clipping

    const createWedge = (startAngle: number, endAngle: number) => {
        const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

        return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-white/50 rounded-3xl backdrop-blur-md border border-white/20 shadow-sm">
            {/* The Wheel */}
            <div
                className="relative w-[320px] h-[320px] flex-shrink-0"
                role="radiogroup"
                aria-label={`Velg dimensjon for ${religion.name}`}
                onKeyDown={(event) => {
                    const currentIndex = DIMENSIONS.findIndex((d) => d.key === selectedDim);
                    let nextIndex = -1;
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
                        nextIndex = (currentIndex + 1) % DIMENSIONS.length;
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
                        nextIndex = (currentIndex - 1 + DIMENSIONS.length) % DIMENSIONS.length;
                    if (nextIndex >= 0) {
                        event.preventDefault();
                        setSelectedDim(DIMENSIONS[nextIndex].key);
                    }
                }}
            >
                <svg width="320" height="320" viewBox="0 0 320 320" className="transform -rotate-90">
                    {DIMENSIONS.map((dim, index) => {
                        const startAngle = index * (360 / 7);
                        const endAngle = (index + 1) * (360 / 7);
                        const isSelected = selectedDim === dim.key;

                        return (
                            <motion.path
                                key={dim.key}
                                d={createWedge(startAngle, endAngle)}
                                fill={isSelected ? (religion.color || '#6366f1') : 'var(--bg-card)'}
                                stroke="var(--border)"
                                strokeWidth="2"
                                whileHover={{ scale: 1.05, originX: 0.5, originY: 0.5 }}
                                onClick={() => setSelectedDim(dim.key)}
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={dim.label}
                                tabIndex={isSelected || (!selectedDim && index === 0) ? 0 : -1}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedDim(dim.key);
                                    }
                                }}
                                className="cursor-pointer transition-colors duration-300 hover:fill-indigo-500/20 focus:outline-none focus-visible:stroke-indigo-500 focus-visible:[stroke-width:4]"
                                style={{
                                    fill: isSelected ? (religion.color || '#6366f1') : undefined
                                }}
                            />
                        );
                    })}
                    {/* Center Circle */}
                    <circle cx={center} cy={center} r="40" fill="var(--bg-main)" stroke="var(--border)" strokeWidth="2" />
                </svg>

                {/* Labels positioned around */}
                {DIMENSIONS.map((dim, index) => {
                    const angle = index * (360 / 7) + (360 / 14); // middle of wedge
                    // Adjust radius for label placement
                    const labelRadius = 110;
                    const x = 160 + labelRadius * Math.cos((angle - 90) * Math.PI / 180);
                    const y = 160 + labelRadius * Math.sin((angle - 90) * Math.PI / 180);

                    return (
                        <div
                            key={dim.key}
                            className="absolute text-xs font-bold text-center pointer-events-none text-slate-700 drop-shadow-sm"
                            style={{
                                left: x,
                                top: y,
                                transform: 'translate(-50%, -50%)',
                                width: '80px'
                            }}
                        >
                            {dim.label.split(' ')[0]}
                        </div>
                    );
                })}

                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {religion.name}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[300px] w-full">
                <AnimatePresence mode="wait">
                    {selectedDim ? (
                        <motion.div
                            key={selectedDim}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white/80 p-6 rounded-2xl border border-white/50 h-full shadow-sm"
                        >
                            <h3 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                                {DIMENSIONS.find(d => d.key === selectedDim)?.label}
                            </h3>
                            <div className="prose prose-slate max-w-none">
                                {religion.dimensions[selectedDim] ? (
                                    <RichText content={religion.dimensions[selectedDim]} />
                                ) : (
                                    <p className="text-slate-500 italic">Ingen beskrivelse lagt til ennå.</p>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center h-full text-slate-500 italic text-center p-8 border-2 border-dashed border-slate-300 rounded-2xl"
                        >
                            Klikk på en del av hjulet for å utforske de 7 dimensjonene.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
