import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';
import type { SessionExercise } from '../../../types/review';
import { ExerciseMcq } from '../../review/ExerciseMcq';
import { ExerciseMatchPairs } from '../../review/ExerciseMatchPairs';
import { ExerciseTimelineOrder } from '../../review/ExerciseTimelineOrder';
import { subjectAccent } from '../../review/reviewTheme';

interface LoypeEncounterProps {
    exercise: SessionExercise;
    isElite: boolean;
    queueIndex: number;
    queueTotal: number;
    fiftyCharges: number;
    shieldFlash: boolean;
    onUseFifty: () => void;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

// Utfordrings-overlegget: ruter til riktig Exercise*-komponent fra «Dagens
// økt». sourceLink strippes fra rendringen (en lenke midt i løypa ville
// kastet bort hele runnet) - feilene dukker i stedet opp med lenke på
// sluttskjermen. Remountes av forelderen med ny key per øvelse.
export const LoypeEncounter: React.FC<LoypeEncounterProps> = ({
    exercise,
    isElite,
    queueIndex,
    queueTotal,
    fiftyCharges,
    shieldFlash,
    onUseFifty,
    onAnswer,
    onNext,
}) => {
    const [answered, setAnswered] = useState(false);
    const [reducedOptions, setReducedOptions] = useState<string[] | null>(null);
    const accent = subjectAccent(exercise.subjectId);

    const handleAnswer = (correct: boolean) => {
        setAnswered(true);
        onAnswer(correct);
    };

    const useFifty = () => {
        const options = exercise.options ?? [];
        const wrong = options.filter((o) => o !== exercise.answer);
        if (wrong.length < 2 || answered) return;
        const kept = wrong[Math.floor(Math.random() * wrong.length)];
        setReducedOptions(options.filter((o) => o === exercise.answer || o === kept));
        onUseFifty();
    };

    const rendered: SessionExercise = {
        ...exercise,
        sourceLink: undefined,
        options: reducedOptions ?? exercise.options,
    };

    const canFifty =
        exercise.kind === 'mcq' &&
        fiftyCharges > 0 &&
        !answered &&
        !reducedOptions &&
        (exercise.options?.length ?? 0) > 3;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {exercise.subjectId && (
                        <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${accent.chip}`}
                        >
                            {accent.label || exercise.subjectId}
                        </span>
                    )}
                    {isElite && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700"
                        >
                            👑 Elite {queueIndex + 1}/{queueTotal}
                        </motion.span>
                    )}
                </div>
                {canFifty && (
                    <button
                        onClick={useFifty}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors"
                    >
                        <Scissors className="w-3.5 h-3.5" />
                        Femti-femti ({fiftyCharges})
                    </button>
                )}
            </div>

            {shieldFlash && (
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    className="mb-4 px-4 py-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 font-bold text-center"
                >
                    🛡️ Skjoldet tok støyten - du beholder hjertene dine!
                </motion.div>
            )}

            {rendered.kind === 'mcq' && (
                <ExerciseMcq
                    key={reducedOptions ? 'redusert' : 'full'}
                    exercise={rendered}
                    onAnswer={handleAnswer}
                    onNext={onNext}
                    kicker={
                        exercise.item.type === 'quiz'
                            ? 'Quiz-utfordring'
                            : 'Hvilket begrep passer?'
                    }
                />
            )}
            {rendered.kind === 'match-pairs' && (
                <ExerciseMatchPairs exercise={rendered} onAnswer={handleAnswer} onNext={onNext} />
            )}
            {rendered.kind === 'timeline-order' && (
                <ExerciseTimelineOrder
                    exercise={rendered}
                    onAnswer={handleAnswer}
                    onNext={onNext}
                />
            )}
        </div>
    );
};
