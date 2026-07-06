// Streak/nivå-chip i toppmenyen. Lenker til «Min læring» og pulserer
// kort når XP tjenes, så belønningen synes uansett hvor eleven er.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProgressStore, isStreakAlive } from '../useProgressStore';
import { levelForXp } from '../xp';
import { todayLocal } from '../../../utils/reviewScheduler';

export const ProgressChip = () => {
    const totalXp = useProgressStore((s) => s.totalXp);
    const streak = useProgressStore((s) => s.streak);
    const level = levelForXp(totalXp);
    const alive = isStreakAlive(streak, todayLocal());

    return (
        <Link
            to="/min-laering"
            aria-label="Min læring"
            title="Min læring"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all no-underline"
        >
            {/* Remount på XP-endring gir en liten puls når eleven tjener XP */}
            <motion.span
                key={totalXp}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`text-base leading-none ${alive ? '' : 'grayscale opacity-60'}`}
            >
                🔥
            </motion.span>
            <span className="text-sm font-bold text-slate-800 leading-none">
                {alive ? streak.current : 0}
            </span>
            <span className="hidden sm:inline text-[11px] font-semibold text-indigo-600 leading-none border-l border-indigo-200 pl-1.5">
                Niv. {level}
            </span>
        </Link>
    );
};
