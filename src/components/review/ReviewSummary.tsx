import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, RotateCcw, Check, X, Gamepad2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SessionExercise } from '../../types/review';
import { transitions } from '../../styles/motion-presets';

interface ReviewSummaryProps {
    correct: number;
    total: number;
    streak: number;
    onBonusRound: () => void;
    // Streak-milepæl nådd i denne økta (3, 7, 14, ...) - utløser ekstra feiring
    milestone?: number | null;
    // Dagens spill-resultat, hvis spilt
    gameTitle?: string;
    gameScore?: number | null;
    // Per-oppgave-oppsummering med lenker til stoffet
    exercises?: SessionExercise[];
    results?: (boolean | undefined)[];
    // Antall repetisjoner som venter i morgen
    tomorrowDue?: number;
}

const MILESTONE_TEXTS: Record<number, string> = {
    3: 'Tre dager på rad - du er i gang!',
    7: 'En hel uke! Hjernen din takker deg.',
    14: 'To uker sterkt! Dette begynner å bli en vane.',
    30: 'En måned - imponerende utholdenhet!',
    50: '50 dager på rad - du er en av de få!',
    100: '100 dager - legendarisk!',
};

const PARTICLE_COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

const Particles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const distance = 90 + (i % 4) * 45;
            return (
                <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/3 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length] }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        opacity: 0,
                        scale: 0.3,
                    }}
                    transition={{ duration: 1.1, delay: (i % 6) * 0.05, ease: 'easeOut' }}
                />
            );
        })}
    </div>
);

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
    correct,
    total,
    streak,
    onBonusRound,
    milestone = null,
    gameTitle,
    gameScore = null,
    exercises = [],
    results = [],
    tomorrowDue,
}) => {
    const reducedMotion = useReducedMotion();
    const [count, setCount] = useState(0);

    // Milepæl: fyrverkeri fra begge sider - større feiring enn vanlig burst
    useEffect(() => {
        if (!milestone || reducedMotion) return;
        const colors = ['#f59e0b', '#f97316', '#6366f1', '#10b981'];
        confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
        confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    }, [milestone, reducedMotion]);

    // Tell opp streak-tallet - liten, billig feiring
    useEffect(() => {
        if (reducedMotion || streak <= 0) return;
        let n = 0;
        const interval = setInterval(() => {
            n += 1;
            setCount(n);
            if (n >= streak) clearInterval(interval);
        }, 350 / streak);
        return () => clearInterval(interval);
    }, [streak, reducedMotion]);

    const displayStreak = reducedMotion || streak <= 0 ? streak : count;

    return (
        <div className="relative flex flex-col items-center text-center gap-6">
            {!reducedMotion && <Particles />}

            <motion.div
                initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={transitions.springBouncy}
                className="flex flex-col items-center gap-4"
            >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
                    <Flame className="w-12 h-12 text-white" />
                </div>
                <div>
                    <div className="text-6xl font-display font-bold text-slate-900">
                        {displayStreak}
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        {streak === 1 ? 'dag på rad' : 'dager på rad'}
                    </p>
                </div>
            </motion.div>

            {milestone && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={transitions.springBouncy}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-lg shadow-orange-300/40 px-6 py-4 flex items-center justify-center gap-3"
                >
                    <Trophy className="w-6 h-6 shrink-0" />
                    <p className="font-bold text-lg">{MILESTONE_TEXTS[milestone]}</p>
                </motion.div>
            )}

            <div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-8 py-4">
                <p className="text-lg text-slate-700">
                    Du klarte <span className="font-bold text-indigo-600">{correct}</span> av{' '}
                    <span className="font-bold">{total}</span> oppgaver.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    {correct === total
                        ? 'Alt riktig - hjernen din er i toppform!'
                        : 'Det du bommet på kommer tilbake i morgen. Slik lærer du det for alvor.'}
                </p>
                {gameTitle && gameScore !== null && (
                    <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 text-sm font-semibold text-indigo-600">
                        <Gamepad2 className="w-4 h-4" />
                        {gameTitle}: {Math.round(gameScore * 100)} %
                    </div>
                )}
            </div>

            {exercises.length > 0 && (
                <div className="w-full max-w-md bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4 text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">
                        Dagens oppgaver
                    </p>
                    <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {exercises.map((exercise, i) => {
                            const wasCorrect = results[i];
                            const label =
                                exercise.kind === 'flashcard' || exercise.kind === 'match-pairs'
                                    ? exercise.item.term ?? exercise.prompt
                                    : exercise.kind === 'mcq' || exercise.kind === 'image-mcq'
                                      ? (exercise.answer ?? exercise.prompt)
                                      : exercise.prompt;
                            const isInternalLink =
                                exercise.sourceLink && !exercise.sourceLink.startsWith('http');
                            return (
                                <li
                                    key={exercise.item.id}
                                    className="flex items-center gap-2.5 py-2 text-sm"
                                >
                                    {wasCorrect ? (
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <X className="w-4 h-4 text-rose-500 shrink-0" />
                                    )}
                                    <span className="flex-1 text-slate-700 truncate">{label}</span>
                                    {!wasCorrect && isInternalLink && (
                                        <Link
                                            to={exercise.sourceLink!}
                                            className="text-xs text-indigo-600 hover:underline font-semibold whitespace-nowrap"
                                        >
                                            Les mer
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <p className="text-slate-600 font-medium">
                {typeof tomorrowDue === 'number' && tomorrowDue > 0
                    ? `I morgen venter ${tomorrowDue} repetisjoner - kom tilbake og hold streaken!`
                    : 'Kom tilbake i morgen for å holde streaken!'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Link
                    to="/oving"
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 text-center"
                >
                    Tilbake til Øving
                </Link>
                <button
                    onClick={onBonusRound}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:border-indigo-300 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Ta en bonusrunde
                </button>
            </div>
        </div>
    );
};
