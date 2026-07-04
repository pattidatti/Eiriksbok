import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, ArrowDown, GripVertical, Check, X } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrderOption, SessionExercise } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

interface ExerciseTimelineOrderProps {
    exercise: SessionExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

interface RowProps {
    option: OrderOption;
    index: number;
    total: number;
    checked: boolean;
    correct: boolean;
    onMove: (index: number, direction: -1 | 1) => void;
}

const SortableRow: React.FC<RowProps> = ({ option, index, total, checked, correct, onMove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: option.id,
        disabled: checked,
    });

    const rowClasses = checked
        ? correct
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-rose-50 border-rose-300'
        : isDragging
          ? 'bg-indigo-50 border-indigo-300 shadow-lg z-10'
          : 'bg-white/70 border-slate-200';

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 backdrop-blur transition-colors ${rowClasses}`}
        >
            {!checked && (
                <button
                    {...attributes}
                    {...listeners}
                    className="touch-none text-slate-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing"
                    aria-label={`Flytt ${option.title}`}
                >
                    <GripVertical className="w-5 h-5" />
                </button>
            )}
            <span className="flex-1 font-semibold text-slate-700 leading-snug">
                {option.title}
            </span>
            {checked ? (
                <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-1.5 text-sm font-bold ${correct ? 'text-emerald-700' : 'text-rose-700'}`}
                >
                    {correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {option.displayDate}
                </motion.span>
            ) : (
                <span className="flex flex-col gap-0.5">
                    <button
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Flytt opp"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onMove(index, 1)}
                        disabled={index === total - 1}
                        className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Flytt ned"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </span>
            )}
        </div>
    );
};

// Tidslinje-sortering: dra hendelsene i kronologisk rekkefølge (eldst øverst).
// Pilknapper som alternativ til dra-og-slipp for tastatur og Chromebook-touchpad.
export const ExerciseTimelineOrder: React.FC<ExerciseTimelineOrderProps> = ({
    exercise,
    onAnswer,
    onNext,
}) => {
    const [order, setOrder] = useState<OrderOption[]>(exercise.orderOptions ?? []);
    const [checked, setChecked] = useState(false);
    const { play } = useStepSounds();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const facit = [...(exercise.orderOptions ?? [])].sort((a, b) => a.year - b.year);
    const rowCorrect = order.map((option, i) => option.id === facit[i]?.id);
    const allCorrect = rowCorrect.every(Boolean);

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        play('drop');
        setOrder((prev) => {
            const from = prev.findIndex((o) => o.id === active.id);
            const to = prev.findIndex((o) => o.id === over.id);
            return arrayMove(prev, from, to);
        });
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        if (checked) return;
        play('pick');
        setOrder((prev) => arrayMove(prev, index, index + direction));
    };

    const handleCheck = () => {
        if (checked) return;
        setChecked(true);
        play(allCorrect ? 'correct' : 'incorrect');
        onAnswer(allCorrect);
    };

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 text-center">
                {exercise.prompt}
            </p>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => play('pick')}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={order.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2.5">
                        {order.map((option, index) => (
                            <SortableRow
                                key={option.id}
                                option={option}
                                index={index}
                                total={order.length}
                                checked={checked}
                                correct={rowCorrect[index]}
                                onMove={handleMove}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {!checked && (
                <button
                    onClick={handleCheck}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    Sjekk rekkefølgen
                </button>
            )}

            {checked && (
                <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {!allCorrect && exercise.sourceLink && (
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
