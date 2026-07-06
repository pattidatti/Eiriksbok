// Fullskjerms feiringsseremoni for de store øyeblikkene. Viser ett innslag om
// gangen fra køen, med konfetti og spring-animasjon, og forsvinner av seg selv
// (eller ved klikk). Monteres én gang i Layout ved siden av ProgressToaster.

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCelebration } from '../useCelebration';
import type { Celebration } from '../useCelebration';

const CELEBRATION_DURATION_MS = 3200;

// Deterministiske konfetti-biter så vi slipper Math.random i render.
const CONFETTI_COLORS = ['#818cf8', '#f472b6', '#facc15', '#34d399', '#60a5fa', '#fb923c'];
const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    left: (i * 37) % 100,
    delay: (i % 9) * 0.06,
    duration: 1.6 + ((i * 7) % 12) / 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: (i * 53) % 360,
    drift: ((i % 5) - 2) * 24,
}));

const headline = (
    c: Celebration
): { emoji: string; title: string; subtitle: string; glow: string } => {
    if (c.type === 'levelup') {
        return {
            emoji: '🚀',
            title: `Nivå ${c.level}!`,
            subtitle: 'Du har gått opp et helt nivå. Sterkt jobbet!',
            glow: 'from-indigo-500 to-purple-600',
        };
    }
    if (c.type === 'badge-gull') {
        return {
            emoji: c.emoji,
            title: `Gull: ${c.title}`,
            subtitle: 'Den øverste utmerkelsen er din!',
            glow: 'from-amber-400 to-orange-500',
        };
    }
    return {
        emoji: '🎯',
        title: 'Alle dagens mål fullført!',
        subtitle: `Full innsats i dag - bonus på +${c.xp} XP.`,
        glow: 'from-emerald-400 to-teal-500',
    };
};

const Confetti = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiPieces.map((p) => (
            <motion.span
                key={p.id}
                className="absolute top-[-8%] block h-2.5 w-2.5 rounded-sm"
                style={{ left: `${p.left}%`, backgroundColor: p.color }}
                initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
                animate={{
                    y: '110vh',
                    x: p.drift,
                    opacity: [0, 1, 1, 0],
                    rotate: p.rotate + 360,
                }}
                transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            />
        ))}
    </div>
);

export const CelebrationOverlay = () => {
    const current = useCelebration((s) => s.queue[0] ?? null);
    const dismiss = useCelebration((s) => s.dismissCurrent);

    useEffect(() => {
        if (!current) return;
        const timer = setTimeout(dismiss, CELEBRATION_DURATION_MS);
        return () => clearTimeout(timer);
    }, [current, dismiss]);

    const view = useMemo(() => (current ? headline(current) : null), [current]);

    return (
        <AnimatePresence>
            {current && view && (
                <motion.div
                    key={current.id}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={dismiss}
                    role="status"
                    aria-live="polite"
                >
                    <Confetti />
                    <motion.div
                        className="relative mx-4 max-w-sm rounded-3xl bg-white px-8 py-10 text-center shadow-2xl"
                        initial={{ scale: 0.5, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    >
                        <motion.div
                            className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${view.glow} text-5xl shadow-lg`}
                            initial={{ rotate: -20, scale: 0.6 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
                        >
                            {view.emoji}
                        </motion.div>
                        <h2 className="mb-1 font-display text-2xl font-bold text-slate-900">
                            {view.title}
                        </h2>
                        <p className="text-sm text-slate-500">{view.subtitle}</p>
                        <p className="mt-4 text-[11px] uppercase tracking-wider text-slate-400">
                            Trykk for å lukke
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
