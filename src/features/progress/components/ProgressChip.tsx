// Streak/nivå-chip i toppmenyen. Lenker til «Min læring» og spiller en
// burst (pop + glow-ring + «+XP»-floaty) i det XP-orben fra toasten lander,
// så belønningen synes uansett hvor eleven er.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgressStore, isStreakAlive } from '../useProgressStore';
import { useChipPulse } from '../useChipPulse';
import { levelForXp } from '../xp';
import { todayLocal } from '../../../utils/reviewScheduler';

export const ProgressChip = () => {
    const totalXp = useProgressStore((s) => s.totalXp);
    const streak = useProgressStore((s) => s.streak);
    const pulse = useChipPulse((s) => s.pulse);
    const clear = useChipPulse((s) => s.clear);
    const level = levelForXp(totalXp);
    const alive = isStreakAlive(streak, todayLocal());

    // Rydd bort pulsen når burst-animasjonen er ferdig avspilt
    useEffect(() => {
        if (!pulse) return;
        const timer = setTimeout(() => clear(pulse.id), 1100);
        return () => clearTimeout(timer);
    }, [pulse, clear]);

    return (
        <Link
            id="progress-chip"
            to="/min-laering"
            aria-label="Min læring"
            title="Min læring"
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all no-underline"
        >
            {/* Glow-ring som pinger utover når orben lander */}
            <AnimatePresence>
                {pulse && (
                    <motion.span
                        key={`ring-${pulse.id}`}
                        className="pointer-events-none absolute inset-0 rounded-full border-2 border-amber-400"
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.7 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                )}
            </AnimatePresence>
            {/* «+XX XP» stiger opp fra chipen og fader */}
            <AnimatePresence>
                {pulse && (
                    <motion.span
                        key={`xp-${pulse.id}`}
                        className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-amber-600 whitespace-nowrap"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -14 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    >
                        +{pulse.xp} XP
                    </motion.span>
                )}
            </AnimatePresence>
            {/* Innholdet popper når orben lander */}
            <motion.span
                key={pulse ? `pop-${pulse.id}` : 'idle'}
                initial={pulse ? { scale: 1.25 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="flex items-center gap-1.5"
            >
                <span
                    className={`text-base leading-none ${alive ? '' : 'grayscale opacity-60'}`}
                >
                    🔥
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none">
                    {alive ? streak.current : 0}
                </span>
                <span className="hidden sm:inline text-[11px] font-semibold text-indigo-600 leading-none border-l border-indigo-200 pl-1.5">
                    Niv. {level}
                </span>
            </motion.span>
        </Link>
    );
};
