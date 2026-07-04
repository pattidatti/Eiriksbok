import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { SessionExercise } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

interface ExerciseMatchPairsProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

// Koble par: trykk et begrep, så forklaringen som hører til. Riktig par låses
// med grønn glød, feil par rister rødt. Null feiltrykk = riktig svar.
export const ExerciseMatchPairs: React.FC<ExerciseMatchPairsProps> = ({
    exercise,
    onAnswer,
    onNext,
}) => {
    const pairs = exercise.pairs ?? [];
    const definitions = exercise.shuffledDefinitions ?? [];
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    // term -> definisjon for låste par
    const [matched, setMatched] = useState<Record<string, string>>({});
    const [shakeDefinition, setShakeDefinition] = useState<string | null>(null);
    const [done, setDone] = useState<boolean | null>(null);
    const mistakesRef = useRef(0);
    const { play } = useStepSounds();

    const matchedDefinitions = new Set(Object.values(matched));
    const definitionByTerm = new Map(pairs.map((p) => [p.term, p.definition]));

    const chooseTerm = (term: string) => {
        if (done !== null || matched[term]) return;
        play('select');
        setSelectedTerm(term);
    };

    const chooseDefinition = (definition: string) => {
        if (done !== null || !selectedTerm || matchedDefinitions.has(definition)) return;
        const isMatch = definitionByTerm.get(selectedTerm) === definition;
        if (!isMatch) {
            mistakesRef.current += 1;
            play('incorrect');
            setShakeDefinition(definition);
            setSelectedTerm(null);
            window.setTimeout(() => setShakeDefinition(null), 400);
            return;
        }
        play('correct');
        const nextMatched = { ...matched, [selectedTerm]: definition };
        setMatched(nextMatched);
        setSelectedTerm(null);
        if (Object.keys(nextMatched).length === pairs.length) {
            const wasCorrect = mistakesRef.current === 0;
            setDone(wasCorrect);
            onAnswer(wasCorrect);
        }
    };

    const termClasses = (term: string) => {
        if (matched[term]) return 'bg-emerald-50 border-emerald-400 text-emerald-800';
        if (selectedTerm === term)
            return 'bg-indigo-50 border-indigo-400 text-indigo-800 ring-2 ring-indigo-200';
        return 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
    };

    const definitionClasses = (definition: string) => {
        if (matchedDefinitions.has(definition))
            return 'bg-emerald-50 border-emerald-400 text-emerald-800';
        if (!selectedTerm) return 'bg-white/50 border-slate-100 text-slate-500';
        return 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
    };

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 text-center">
                {exercise.prompt}
            </p>

            <div className="grid grid-cols-[2fr_3fr] gap-3">
                <div className="flex flex-col gap-2.5">
                    {pairs.map((pair) => (
                        <motion.button
                            key={pair.term}
                            onClick={() => chooseTerm(pair.term)}
                            animate={matched[pair.term] ? { scale: [1, 1.04, 1] } : {}}
                            transition={{ duration: 0.3 }}
                            className={`flex-1 px-3 py-3 rounded-xl border-2 font-semibold text-left transition-colors ${termClasses(pair.term)}`}
                        >
                            {pair.term}
                        </motion.button>
                    ))}
                </div>
                <div className="flex flex-col gap-2.5">
                    {definitions.map((definition) => (
                        <motion.button
                            key={definition}
                            onClick={() => chooseDefinition(definition)}
                            animate={
                                shakeDefinition === definition
                                    ? { x: [0, -6, 6, -4, 4, 0] }
                                    : matchedDefinitions.has(definition)
                                      ? { scale: [1, 1.03, 1] }
                                      : {}
                            }
                            transition={{ duration: 0.35 }}
                            className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm text-left leading-snug transition-colors ${definitionClasses(definition)}`}
                        >
                            <span className="line-clamp-3">{definition}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {done !== null && (
                <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p
                        className={`text-sm font-semibold ${done ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                        {done
                            ? 'Alle par riktig på første forsøk!'
                            : 'Alle par koblet - men med noen bomskudd underveis.'}
                    </p>
                    {!done && exercise.sourceLink && (
                        <Link
                            to={exercise.sourceLink}
                            className="text-sm text-indigo-600 hover:underline font-medium"
                        >
                            Les mer om dette
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
