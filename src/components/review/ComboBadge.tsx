import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface ComboBadgeProps {
    combo: number;
}

// Combo-pille ved progressbaren: dukker opp fra 2 riktige på rad og
// eskalerer visuelt jo lenger rekka blir.
export const ComboBadge: React.FC<ComboBadgeProps> = ({ combo }) => (
    <AnimatePresence>
        {combo >= 2 && (
            <motion.span
                key={combo}
                initial={{ opacity: 0, scale: 0.5, y: 6 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    rotate: combo >= 5 ? [0, -3, 3, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    combo >= 5
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-300/50'
                        : combo >= 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-50 text-indigo-600'
                }`}
            >
                {combo >= 3 && <Flame className="w-3.5 h-3.5" />}
                {combo} på rad!
            </motion.span>
        )}
    </AnimatePresence>
);
