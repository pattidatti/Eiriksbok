import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

interface ReviewProgressBarProps {
    total: number;
    current: number; // indeks på aktiv øvelse
    results: (boolean | undefined)[];
    // Viser en gamepad-prikk til slutt når økta avsluttes med dagens spill
    hasFinale?: boolean;
}

export const ReviewProgressBar: React.FC<ReviewProgressBarProps> = ({
    total,
    current,
    results,
    hasFinale = false,
}) => {
    return (
        <div className="flex items-center justify-center gap-1.5" aria-label="Fremdrift i økta">
            {Array.from({ length: total }, (_, i) => {
                const result = results[i];
                const isActive = i === current;
                let color = 'bg-slate-200';
                if (result === true) color = 'bg-emerald-400';
                if (result === false) color = 'bg-rose-400';
                return (
                    <motion.div
                        key={i}
                        className={`h-1.5 rounded-full ${color}`}
                        animate={{ width: isActive ? 24 : 12, opacity: isActive ? 1 : 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                );
            })}
            {hasFinale && (
                <Gamepad2 className="w-4 h-4 ml-1 text-indigo-400" aria-label="Dagens spill" />
            )}
        </div>
    );
};
