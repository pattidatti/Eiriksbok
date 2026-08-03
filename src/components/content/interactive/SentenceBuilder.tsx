import React, { useState } from 'react';
import { Check, X, RefreshCw } from 'lucide-react';
import { Reorder } from 'framer-motion';

import { renderInlineMarkdown } from '../../markdownUtils';

interface Segment {
    id: string;
    text: string;
    type?: string;
}

interface SentenceBuilderProps {
    segments: (string | Segment)[];
    correctOrder: string[]; // List of IDs (or text if string-based) in correct order
    instruction?: string;
}

const TYPE_COLORS: Record<string, string> = {
    subject: "border-green-400 bg-green-50 text-green-900",
    verbal: "border-red-400 bg-red-50 text-red-900",
    object: "border-blue-400 bg-blue-50 text-blue-900",
    adverbial: "border-yellow-400 bg-yellow-50 text-yellow-900",
    val: "border-indigo-300 bg-white" // Default
};

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ segments, correctOrder, instruction }) => {
    // Normalize segments to objects with IDs
    const normalizedSegments: Segment[] = React.useMemo(() => {
        return segments.map((s, i) => {
            if (typeof s === 'string') {
                return { id: `seg-${i}`, text: s };
            }
            return s;
        });
    }, [segments]);

    const [items, setItems] = useState(normalizedSegments);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // If segments prop changes, reset. Justeres under render i stedet for i en
    // effect, så eleven aldri ser forrige oppgaves brikker i den nye oppgaven.
    const [prevSegments, setPrevSegments] = useState(normalizedSegments);
    if (normalizedSegments !== prevSegments) {
        setPrevSegments(normalizedSegments);
        setItems(normalizedSegments);
        setIsCorrect(null);
    }

    const checkAnswer = () => {
        // Build array of current IDs
        const currentIds = items.map(item => item.id);

        // If correctOrder contains IDs, match IDs. 
        // If correctOrder was originally strings (legacy), we might need to match text? 
        // But the new JSONs use IDs ("1", "2"...). 
        // Let's assume correctOrder is a list of expected IDs in order.

        const isMatch = currentIds.length === correctOrder.length &&
            currentIds.every((id, index) => id === correctOrder[index]);

        setIsCorrect(isMatch);
    };

    const reset = () => {
        // Shuffle
        const shuffled = [...normalizedSegments].sort(() => Math.random() - 0.5);
        setItems(shuffled);
        setIsCorrect(null);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 my-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h4 className="font-bold text-indigo-900">{instruction ? renderInlineMarkdown(instruction) : "Bygg setningen riktig"}</h4>
                <div className="flex gap-2">
                    {isCorrect === true && (
                        <span className="flex items-center gap-1 text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">
                            <Check className="w-4 h-4" /> Riktig!
                        </span>
                    )}
                    {isCorrect === false && (
                        <span className="flex items-center gap-1 text-red-600 font-bold bg-red-100 px-3 py-1 rounded-full text-sm">
                            <X className="w-4 h-4" /> Prøv igjen
                        </span>
                    )}
                </div>
            </div>

            <div className="min-h-[80px] p-4 bg-white/50 rounded-lg border-2 border-dashed border-indigo-200 mb-6 flex justify-center">
                <Reorder.Group
                    axis="x"
                    values={items}
                    onReorder={setItems}
                    className="flex flex-wrap gap-3 justify-center"
                >
                    {items.map((item) => {
                        const styleClass = TYPE_COLORS[item.type || ''] || TYPE_COLORS.val;

                        return (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                drag={!isCorrect} // Disable drag if correct
                                className={`
                                    px-4 py-3 rounded-lg shadow-sm font-medium text-lg cursor-grab active:cursor-grabbing border-b-4
                                    transition-colors select-none
                                    ${isCorrect === true ? 'bg-green-500 text-white border-green-600' : styleClass}
                                `}
                            >
                                {item.text}
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={checkAnswer}
                    disabled={isCorrect === true}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Sjekk Setning
                </button>
                {isCorrect !== null && (
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-full font-bold hover:bg-indigo-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>

            <p className="text-center text-xs text-indigo-300 mt-4">
                Dra brikkene for å endre rekkefølge
            </p>
        </div>
    );
};
