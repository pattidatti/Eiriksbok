// Nivå og XP-fremdrift mot neste nivå.

import { motion } from 'framer-motion';
import { levelProgress } from '../xp';

interface LevelCardProps {
    totalXp: number;
    badgeCount: number;
}

export const LevelCard = ({ totalXp, badgeCount }: LevelCardProps) => {
    const { level, into, needed } = levelProgress(totalXp);
    const pct = Math.min(100, Math.round((into / needed) * 100));

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        Nivå
                    </span>
                    <span className="text-2xl font-display font-bold leading-none">{level}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                        <p className="text-sm font-bold text-slate-900">
                            {totalXp.toLocaleString('nb-NO')} XP
                        </p>
                        <p className="text-xs text-slate-500">
                            {needed - into} XP til nivå {level + 1}
                        </p>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                        🏅 {badgeCount} {badgeCount === 1 ? 'utmerkelse' : 'utmerkelser'} låst opp
                    </p>
                </div>
            </div>
        </div>
    );
};
