import React from 'react';
import type { SessionExercise } from '../../types/review';
import { ExerciseMcq } from './ExerciseMcq';

interface ExerciseYearPickProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

// Årstall-oppgave fra tidslinjen - samme mekanikk som flervalg.
// Har hendelsen et tidslinjebilde, vises det over spørsmålet.
export const ExerciseYearPick: React.FC<ExerciseYearPickProps> = ({
    exercise,
    onAnswer,
    onNext,
}) => (
    <ExerciseMcq
        exercise={exercise}
        onAnswer={onAnswer}
        onNext={onNext}
        kicker="Når skjedde dette?"
        media={
            exercise.imageSrc ? (
                <div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <img
                        src={exercise.imageSrc}
                        alt=""
                        loading="eager"
                        className="w-full max-h-[200px] object-cover"
                    />
                </div>
            ) : undefined
        }
    />
);
