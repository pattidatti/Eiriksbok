import React from 'react';
import { motion } from 'framer-motion';
import type { SessionExercise } from '../../types/review';
import { ExerciseMcq } from './ExerciseMcq';

interface ExerciseImageMcqProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

// Bildeoppgave: hero-bildet fra leksjonen vises, eleven velger begrepet som
// hører til. Gjenbruker flervalgsmekanikken - bildet erstatter spørsmålskortet.
export const ExerciseImageMcq: React.FC<ExerciseImageMcqProps> = ({
    exercise,
    onAnswer,
    onNext,
}) => (
    <ExerciseMcq
        exercise={exercise}
        onAnswer={onAnswer}
        onNext={onNext}
        kicker={exercise.prompt}
        showPrompt={false}
        media={
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
                <img
                    src={exercise.imageSrc}
                    alt=""
                    loading="eager"
                    className="w-full max-h-[280px] object-cover"
                />
            </motion.div>
        }
    />
);
