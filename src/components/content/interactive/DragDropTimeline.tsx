import React, { useState } from 'react';
import { Reorder, motion } from 'framer-motion';
import { GripVertical, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { correctPop, wrongShake, celebrateCompletion } from '../../ui/answerFeedback';

interface TimelineEvent {
    id: string;
    year: number;
    label: string;
}

interface DragDropTimelineProps {
    events: TimelineEvent[];
    title?: string;
}

export const DragDropTimeline: React.FC<DragDropTimelineProps> = ({ events, title = "Ordne tidslinjen" }) => {
    // Initial shuffle
    const [items, setItems] = useState(() => [...events].sort(() => Math.random() - 0.5));
    const [status, setStatus] = useState<'idle' | 'success' | 'failure'>('idle');

    const checkOrder = () => {
        const isCorrect = items.every((item, index) => {
            if (index === 0) return true;
            return item.year >= items[index - 1].year;
        });
        setStatus(isCorrect ? 'success' : 'failure');
        if (isCorrect) celebrateCompletion();
    };

    const reset = () => {
        setItems([...events].sort(() => Math.random() - 0.5));
        setStatus('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-lg mx-auto">
            <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center justify-between">
                {title}
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Dra og slipp
                </span>
            </h3>

            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3 mb-6">
                {items.map((item) => (
                    <Reorder.Item
                        key={item.id}
                        value={item}
                        className="bg-white"
                        animate={status === 'success' ? correctPop : status === 'failure' ? wrongShake : undefined}
                    >
                        <div className={`
                            flex items-center gap-4 p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-colors
                            ${status === 'success' ? 'border-emerald-200 bg-emerald-50' :
                                status === 'failure' ? 'border-rose-200 bg-rose-50' : 'border-slate-100 hover:border-indigo-200'}
                        `}>
                            <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                                <span className="font-medium text-slate-700">{item.label}</span>
                                {status !== 'idle' && (
                                    <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                                        ({item.year})
                                    </span>
                                )}
                            </div>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <div className="flex justify-between items-center">
                {status === 'success' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="flex items-center gap-2 text-emerald-600 font-bold"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Riktig rekkefølge!
                    </motion.div>
                ) : status === 'failure' ? (
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-rose-600 font-bold"
                    >
                        <XCircle className="w-5 h-5" />
                        Prøv igjen..
                    </motion.div>
                ) : (
                    <div />
                )}

                <div className="flex gap-2">
                    {status !== 'idle' && (
                        <button
                            onClick={reset}
                            className="pressable focus-ring px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Nullstill
                        </button>
                    )}
                    <button
                        onClick={checkOrder}
                        disabled={status === 'success'}
                        className="pressable focus-ring px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sjekk svar
                    </button>
                </div>
            </div>
        </div>
    );
};
