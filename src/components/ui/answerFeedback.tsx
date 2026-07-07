import confetti from 'canvas-confetti';

// Felles svar-feedback for interaktive komponenter (Quiz, DragDropTimeline,
// ScenarioRoleplay, Oppgaver m.fl.):
//   riktig svar  -> spring-pop:  <motion.div animate={isCorrect ? correctPop : undefined}>
//   galt svar    -> shake:       <motion.div animate={isWrong ? wrongShake : undefined}>
// Konfetti er forbeholdt fullførte sett - aldri per enkeltsvar.

export const correctPop = {
    scale: [1, 1.08, 1],
    transition: { duration: 0.45, times: [0, 0.3, 1], ease: 'easeOut' as const },
};

export const wrongShake = {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.4 },
};

// Liten konfetti-salve ved fullført sett. Respekterer prefers-reduced-motion.
export const celebrateCompletion = (opts?: { big?: boolean; origin?: { x: number; y: number } }) => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({
        particleCount: opts?.big ? 140 : 70,
        spread: opts?.big ? 90 : 65,
        startVelocity: 35,
        origin: opts?.origin ?? { x: 0.5, y: 0.7 },
        colors: ['#6366f1', '#3b82f6', '#f59e0b', '#10b981'],
        disableForReducedMotion: true,
    });
};
