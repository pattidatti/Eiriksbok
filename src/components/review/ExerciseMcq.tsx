import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { SessionExercise } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

interface ExerciseMcqProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
    kicker?: string;
    // Valgfritt medieinnhold (f.eks. bilde) over spørsmålet
    media?: React.ReactNode;
    // Skjul spørsmålskortet når kicker + media sier alt (bildeoppgaver)
    showPrompt?: boolean;
}

// Flervalgsoppgave med umiddelbar feedback. Brukes både for begreps-mcq,
// quiz-repetisjon, bildeoppgaver og (via ExerciseYearPick) årstall-oppgaver.
export const ExerciseMcq: React.FC<ExerciseMcqProps> = ({
    exercise,
    onAnswer,
    onNext,
    kicker = 'Hvilket begrep passer?',
    media,
    showPrompt = true,
}) => {
    const [selected, setSelected] = useState<string | null>(null);
    const { play } = useStepSounds();
    const answered = selected !== null;
    const wasCorrect = selected === exercise.answer;

    const choose = (option: string) => {
        if (answered) return;
        setSelected(option);
        play(option === exercise.answer ? 'correct' : 'incorrect');
        onAnswer(option === exercise.answer);
    };

    const optionClasses = (option: string) => {
        if (!answered) {
            return 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
        }
        if (option === exercise.answer) {
            return 'bg-emerald-50 border-emerald-400 text-emerald-800';
        }
        if (option === selected) {
            return 'bg-rose-50 border-rose-300 text-rose-700';
        }
        return 'bg-white/50 border-slate-100 text-slate-400';
    };

    const isExternalSource = exercise.sourceLink?.startsWith('http');

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 text-center">
                {kicker}
            </p>

            {media}

            {showPrompt && (
                <div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-xl font-medium text-slate-800 leading-relaxed">
                        {exercise.prompt}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(exercise.options ?? []).map((option) => (
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
                        className={`px-4 py-3.5 rounded-xl border-2 font-semibold text-slate-700 transition-colors text-left ${optionClasses(option)}`}
                    >
                        {option}
                    </motion.button>
                ))}
            </div>

            {answered && (
                <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {!wasCorrect && exercise.sourceLink && (
                        isExternalSource ? (
                            <a
                                href={exercise.sourceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-indigo-600 hover:underline font-medium"
                            >
                                Les mer om dette
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        ) : (
                            <Link
                                to={exercise.sourceLink}
                                className="text-sm text-indigo-600 hover:underline font-medium"
                            >
                                Les mer om dette
                            </Link>
                        )
                    )}
                    <button
                        onClick={onNext}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Neste
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </div>
    );
};
