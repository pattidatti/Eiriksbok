import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Exercise, SortData } from '../../../data/virkemiddelverkstedet/types';
import { shuffledIndices } from '../../../utils/random';

interface SortExerciseProps {
    exercise: Exercise;
    deviceColor: string;
    onCorrect: (points: number) => void;
    onWrong: () => void;
}

export const SortExercise = ({ exercise, onCorrect, onWrong }: SortExerciseProps) => {
    const data = exercise.data as SortData;
    const [placements, setPlacements] = useState<Record<number, string>>({}); // itemIndex → categoryId
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [attempts, setAttempts] = useState(0);

    // Stokkes én gang når oppgaven åpnes — se MatchExercise for samme mønster.
    const [shuffledItems] = useState(() => shuffledIndices(data.items.length));

    const handleCategoryClick = (categoryId: string) => {
        if (checked || selectedItem === null) return;

        setPlacements((prev) => ({ ...prev, [selectedItem]: categoryId }));
        setSelectedItem(null);
    };

    const handleItemClick = (itemIndex: number) => {
        if (checked) return;
        if (placements[itemIndex]) {
            // Remove placement
            setPlacements((prev) => {
                const next = { ...prev };
                delete next[itemIndex];
                return next;
            });
        } else {
            setSelectedItem(selectedItem === itemIndex ? null : itemIndex);
        }
    };

    const checkAnswers = () => {
        setChecked(true);
        setAttempts((a) => a + 1);

        const allCorrect = data.items.every(
            (item, i) => placements[i] === item.categoryId
        );

        if (allCorrect) {
            onCorrect(attempts === 0 ? 100 : 50);
        } else {
            onWrong();
        }
    };

    const retry = () => {
        setPlacements({});
        setSelectedItem(null);
        setChecked(false);
    };

    const allPlaced = Object.keys(placements).length === data.items.length;
    const allCorrect = checked && data.items.every((item, i) => placements[i] === item.categoryId);

    return (
        <div>
            <p className="text-sm font-medium text-slate-500 mb-4">{exercise.instruction}</p>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {data.categories.map((cat) => {
                    const placedHere = shuffledItems.filter((i) => placements[i] === cat.id);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={`p-3 rounded-xl border-2 transition-all min-h-[80px] ${
                                selectedItem !== null && !checked
                                    ? 'border-indigo-400 bg-indigo-50 cursor-pointer hover:shadow-md'
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <p className="font-bold text-sm text-slate-700 mb-2">{cat.label}</p>
                            <div className="space-y-1">
                                {placedHere.map((itemIdx) => {
                                    const isCorrect = data.items[itemIdx].categoryId === cat.id;
                                    return (
                                        <div
                                            key={itemIdx}
                                            className={`text-xs p-1.5 rounded ${
                                                checked
                                                    ? isCorrect
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                    : 'bg-white text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            {checked && (isCorrect ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />)}
                                            {data.items[itemIdx].text}
                                        </div>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Unplaced items */}
            {!checked && (
                <div className="space-y-1.5 mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Klikk et eksempel, så klikk riktig kategori
                    </p>
                    {shuffledItems
                        .filter((i) => !placements[i])
                        .map((itemIdx) => (
                            <motion.button
                                key={itemIdx}
                                onClick={() => handleItemClick(itemIdx)}
                                className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${
                                    selectedItem === itemIdx
                                        ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                                whileTap={{ scale: 0.98 }}
                            >
                                "{data.items[itemIdx].text}"
                            </motion.button>
                        ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {!checked && allPlaced && (
                    <button
                        onClick={checkAnswers}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all"
                    >
                        Sjekk svar
                    </button>
                )}
                {checked && !allCorrect && (
                    <button
                        onClick={retry}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                    >
                        Prøv igjen
                    </button>
                )}
            </div>

            {checked && allCorrect && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center"
                >
                    <p className="text-emerald-800 font-bold">Alle riktig!</p>
                </motion.div>
            )}
        </div>
    );
};
