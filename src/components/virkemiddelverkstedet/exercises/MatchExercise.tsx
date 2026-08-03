import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { Exercise, MatchData } from '../../../data/virkemiddelverkstedet/types';
import { shuffledIndices } from '../../../utils/random';

interface MatchExerciseProps {
    exercise: Exercise;
    deviceColor: string;
    onCorrect: (points: number) => void;
    onWrong: () => void;
}

export const MatchExercise = ({ exercise, onCorrect, onWrong }: MatchExerciseProps) => {
    const data = exercise.data as MatchData;
    const [selectedExample, setSelectedExample] = useState<number | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<number | null>(null);
    const [matched, setMatched] = useState<Map<number, number>>(new Map()); // example index → label index
    const [wrongPair, setWrongPair] = useState<{ example: number; label: number } | null>(null);
    const [attempts, setAttempts] = useState(0);

    // Shuffle labels separately so they don't align with examples.
    // useState-initialisator, ikke useMemo: stokkingen skal skje én gang når
    // oppgaven åpnes, ikke potensielt på nytt midt i besvarelsen.
    const [shuffledLabelIndices] = useState(() => shuffledIndices(data.pairs.length));

    const tryMatch = (exIdx: number, lbIdx: number) => {
        setAttempts((a) => a + 1);

        // Check if example[exIdx] should pair with the label at shuffledLabelIndices[lbIdx]
        const actualLabelIndex = shuffledLabelIndices[lbIdx];
        if (exIdx === actualLabelIndex) {
            // Correct match
            const newMatched = new Map(matched);
            newMatched.set(exIdx, lbIdx);
            setMatched(newMatched);
            setSelectedExample(null);
            setSelectedLabel(null);

            // All matched?
            if (newMatched.size === data.pairs.length) {
                onCorrect(attempts === 0 ? 100 : Math.max(50, 100 - (attempts - data.pairs.length) * 10));
            }
        } else {
            // Wrong match
            setWrongPair({ example: exIdx, label: lbIdx });
            onWrong();
            setTimeout(() => {
                setWrongPair(null);
                setSelectedExample(null);
                setSelectedLabel(null);
            }, 800);
        }
    };

    const handleExampleClick = (index: number) => {
        if (matched.has(index)) return;
        setSelectedExample(index);
        if (selectedLabel !== null) {
            tryMatch(index, selectedLabel);
        }
    };

    const handleLabelClick = (index: number) => {
        // Check if this label is already matched
        const isLabelMatched = [...matched.values()].includes(index);
        if (isLabelMatched) return;

        setSelectedLabel(index);
        if (selectedExample !== null) {
            tryMatch(selectedExample, index);
        }
    };

    const allMatched = matched.size === data.pairs.length;

    return (
        <div>
            <p className="text-sm font-medium text-slate-500 mb-4">{exercise.instruction}</p>

            <div className="grid grid-cols-2 gap-4">
                {/* Examples (left side) */}
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Eksempler
                    </p>
                    {data.pairs.map((pair, i) => {
                        const isMatched = matched.has(i);
                        const isSelected = selectedExample === i;
                        const isWrong = wrongPair?.example === i;

                        return (
                            <motion.button
                                key={i}
                                onClick={() => handleExampleClick(i)}
                                disabled={isMatched}
                                className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all ${
                                    isMatched
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : isWrong
                                          ? 'border-red-400 bg-red-50'
                                          : isSelected
                                            ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 cursor-pointer'
                                }`}
                                animate={isWrong ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start gap-2">
                                    {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                                    <span className="italic">"{pair.example}"</span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Labels (right side) */}
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Virkemidler
                    </p>
                    {shuffledLabelIndices.map((actualIndex, displayIndex) => {
                        const isMatched = [...matched.values()].includes(displayIndex);
                        const isSelected = selectedLabel === displayIndex;
                        const isWrong = wrongPair?.label === displayIndex;

                        return (
                            <motion.button
                                key={displayIndex}
                                onClick={() => handleLabelClick(displayIndex)}
                                disabled={isMatched}
                                className={`w-full p-3 rounded-xl border-2 text-left text-sm font-bold transition-all ${
                                    isMatched
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : isWrong
                                          ? 'border-red-400 bg-red-50'
                                          : isSelected
                                            ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 cursor-pointer'
                                }`}
                                animate={isWrong ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center gap-2">
                                    {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                    {data.pairs[actualIndex].label}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* All matched feedback */}
            <AnimatePresence>
                {allMatched && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center"
                    >
                        <p className="text-emerald-800 font-bold">Alle riktig!</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
