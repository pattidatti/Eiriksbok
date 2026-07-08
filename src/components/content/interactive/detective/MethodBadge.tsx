import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { METHOD_LABEL, type HistoricalMethod } from './types';

interface MethodBadgeProps {
    method: HistoricalMethod;
    compact?: boolean;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, compact }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--det-accent)]/30 bg-[var(--det-accent)]/10 ${
                compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            }`}
            title="Historisk metode du nettopp øvde på"
        >
            <GraduationCap
                className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[var(--det-accent)]`}
            />
            <span className="font-semibold text-[var(--det-accent)]">
                Ferdighet: {METHOD_LABEL[method]}
            </span>
        </motion.div>
    );
};
