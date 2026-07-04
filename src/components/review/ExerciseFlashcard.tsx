import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RotateCw, ThumbsUp, Brain, ArrowRight } from 'lucide-react';
import type { SessionExercise } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

interface ExerciseFlashcardProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

// Flashcard med selvvurdering: eleven snur kortet og sier selv om de kunne det.
// «Kunne den» = riktig, «Måtte tenke» = feil (kortet ned i boks 1).
export const ExerciseFlashcard: React.FC<ExerciseFlashcardProps> = ({
    exercise,
    onAnswer,
    onNext,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [graded, setGraded] = useState<boolean | null>(null);
    const { play } = useStepSounds();

    const flip = () => {
        if (isFlipped) return;
        play('select');
        setIsFlipped(true);
    };

    const grade = (correct: boolean) => {
        if (graded !== null) return;
        play(correct ? 'correct' : 'incorrect');
        setGraded(correct);
        onAnswer(correct);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Husker du dette begrepet?
            </p>

            <div
                className="w-full h-64 perspective-1000 cursor-pointer group"
                onClick={flip}
            >
                <motion.div
                    className="relative w-full h-full [transform-style:preserve-3d]"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Forside: begrepet */}
                    <div className="absolute inset-0 [backface-visibility:hidden]">
                        <div className="h-full w-full bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6 text-center">
                            <h3 className="text-3xl font-display font-bold text-slate-900">
                                {exercise.prompt}
                            </h3>
                            {!isFlipped && (
                                <div className="absolute bottom-5 flex items-center gap-2 text-indigo-500 text-xs font-medium">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>Tenk på svaret - klikk for å snu</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bakside: definisjonen */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="h-full w-full bg-indigo-50/80 backdrop-blur border border-indigo-100 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6 text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                                {exercise.prompt}
                            </p>
                            <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                {exercise.definition}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {isFlipped && graded === null && (
                <motion.div
                    className="flex gap-3 w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={() => grade(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-colors"
                    >
                        <Brain className="w-5 h-5" />
                        Måtte tenke
                    </button>
                    <button
                        onClick={() => grade(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <ThumbsUp className="w-5 h-5" />
                        Kunne den
                    </button>
                </motion.div>
            )}

            {graded !== null && (
                <motion.div
                    className="flex flex-col items-center gap-3 w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {exercise.sourceLink && !graded && (
                        <Link
                            to={exercise.sourceLink}
                            className="text-sm text-indigo-600 hover:underline font-medium"
                        >
                            Les om dette i artikkelen
                        </Link>
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
