import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Scissors } from 'lucide-react';
import type { SessionExercise } from '../../../types/review';
import { useStepSounds } from '../../../hooks/useStepSounds';

interface LoypeBossProps {
    exercise: SessionExercise;
    bossHp: number;
    bossMaxHp: number;
    questionNumber: number;
    fiftyCharges: number;
    shieldFlash: boolean;
    onUseFifty: () => void;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

const TIMER_SECONDS = 20;

// Boss-kampen mot Glemselens vokter: raske spørsmål med nedtelling og stor
// typografi (klasserom-projektor). Riktig svar hogger en bit av HP-baren,
// tiden ute teller som feil. Remountes med ny key per spørsmål.
export const LoypeBoss: React.FC<LoypeBossProps> = ({
    exercise,
    bossHp,
    bossMaxHp,
    questionNumber,
    fiftyCharges,
    shieldFlash,
    onUseFifty,
    onAnswer,
    onNext,
}) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [timedOut, setTimedOut] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
    const [reducedOptions, setReducedOptions] = useState<string[] | null>(null);
    const { play } = useStepSounds();

    const answered = selected !== null || timedOut;
    const wasCorrect = selected === exercise.answer;
    const options = reducedOptions ?? exercise.options ?? [];

    useEffect(() => {
        if (answered) return;
        const interval = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(interval);
                    setTimedOut(true);
                    play('incorrect');
                    onAnswer(false);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answered]);

    const choose = (option: string) => {
        if (answered) return;
        setSelected(option);
        play(option === exercise.answer ? 'correct' : 'incorrect');
        onAnswer(option === exercise.answer);
    };

    const useFifty = () => {
        const wrong = options.filter((o) => o !== exercise.answer);
        if (wrong.length < 2 || answered) return;
        const kept = wrong[Math.floor(Math.random() * wrong.length)];
        setReducedOptions(options.filter((o) => o === exercise.answer || o === kept));
        onUseFifty();
    };

    const optionClasses = (option: string) => {
        if (!answered) {
            return 'bg-white/80 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50';
        }
        if (option === exercise.answer) return 'bg-emerald-50 border-emerald-400 text-emerald-800';
        if (option === selected) return 'bg-rose-50 border-rose-300 text-rose-700';
        return 'bg-white/50 border-slate-100 text-slate-400';
    };

    const timerFraction = secondsLeft / TIMER_SECONDS;
    const timerColor =
        timerFraction > 0.5 ? 'bg-emerald-500' : timerFraction > 0.25 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="max-w-2xl mx-auto">
            {/* Bossen + HP-baren */}
            <div className="bg-white/80 backdrop-blur border border-rose-200 rounded-2xl shadow-sm p-5 mb-5">
                <div className="flex items-center gap-4">
                    <motion.span
                        key={bossHp}
                        animate={{ x: [0, -8, 8, -5, 5, 0], rotate: [0, -4, 4, 0] }}
                        transition={{ duration: 0.45 }}
                        className="text-5xl"
                        role="img"
                        aria-label="Glemselens vokter"
                    >
                        🐲
                    </motion.span>
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <h2 className="text-xl font-display font-bold text-slate-900">
                                Glemselens vokter
                            </h2>
                            <span className="text-sm font-bold text-rose-600">
                                {bossHp}/{bossMaxHp} HP
                            </span>
                        </div>
                        <div className="flex gap-1.5">
                            <AnimatePresence>
                                {Array.from({ length: bossMaxHp }, (_, i) => i < bossHp && (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-4 rounded bg-gradient-to-b from-rose-400 to-rose-600"
                                        exit={{ y: 24, opacity: 0, rotate: 12 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                ))}
                            </AnimatePresence>
                            {Array.from({ length: bossMaxHp - bossHp }, (_, i) => (
                                <div key={`tom-${i}`} className="flex-1 h-4 rounded bg-slate-100" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {shieldFlash && (
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    className="mb-4 px-4 py-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 font-bold text-center"
                >
                    🛡️ Skjoldet tok støyten!
                </motion.div>
            )}

            {/* Nedtelling */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${timerColor}`}
                        animate={{ width: `${timerFraction * 100}%` }}
                        transition={{ duration: 0.9, ease: 'linear' }}
                    />
                </div>
                <span
                    className={`text-lg font-bold tabular-nums w-8 text-right ${
                        secondsLeft <= 5 && !answered ? 'text-rose-600' : 'text-slate-500'
                    }`}
                >
                    {secondsLeft}
                </span>
                {fiftyCharges > 0 && !answered && !reducedOptions && options.length > 3 && (
                    <button
                        onClick={useFifty}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors"
                    >
                        <Scissors className="w-3.5 h-3.5" />
                        {fiftyCharges}
                    </button>
                )}
            </div>

            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
                Angrep {questionNumber} - svar riktig for å skade bossen!
            </p>

            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-6 text-center mb-4">
                <p className="text-2xl md:text-3xl font-semibold text-slate-800 leading-snug">
                    {exercise.prompt}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option) => (
                    <motion.button
                        key={option}
                        onClick={() => choose(option)}
                        disabled={answered}
                        animate={
                            answered && option === selected && !wasCorrect
                                ? { x: [0, -6, 6, -4, 4, 0] }
                                : answered && option === exercise.answer
                                  ? { scale: [1, 1.04, 1] }
                                  : {}
                        }
                        transition={{ duration: 0.35 }}
                        className={`px-4 py-4 rounded-xl border-2 font-semibold text-lg text-slate-700 transition-colors text-left ${optionClasses(option)}`}
                    >
                        {option}
                    </motion.button>
                ))}
            </div>

            {answered && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex flex-col items-center gap-2"
                >
                    {timedOut && (
                        <p className="text-sm font-bold text-rose-600">
                            Tiden er ute! Riktig svar var «{exercise.answer}».
                        </p>
                    )}
                    <button
                        onClick={onNext}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 text-white font-bold text-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20"
                    >
                        {wasCorrect ? 'Fortsett angrepet!' : 'Neste'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </div>
    );
};
