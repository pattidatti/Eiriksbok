// Ledetrådene ved siden av brettet. Klikk på en ledetråd hopper til ordet.

import { motion } from 'framer-motion';
import { Check, User } from 'lucide-react';
import type { Direction, PlacedWord } from './types';

interface ClueListProps {
    title: string;
    direction: Direction;
    words: PlacedWord[];
    activeId?: string;
    solvedAt: Record<string, number>;
    onSelect: (word: PlacedWord) => void;
}

export const ClueList = ({
    title,
    direction,
    words,
    activeId,
    solvedAt,
    onSelect,
}: ClueListProps) => {
    const list = words.filter((word) => word.dir === direction);
    const solved = list.filter((word) => solvedAt[word.id] !== undefined).length;

    return (
        <section className="flex min-h-0 flex-1 flex-col">
            <header className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="text-sm font-bold tracking-wide text-slate-500 uppercase">
                    {title}
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                    {solved}/{list.length}
                </span>
            </header>
            <ul className="min-h-0 space-y-1 overflow-y-auto pr-1">
                {list.map((word) => {
                    const isSolved = solvedAt[word.id] !== undefined;
                    const isActive = word.id === activeId;
                    return (
                        <li key={word.id}>
                            <motion.button
                                type="button"
                                onClick={() => onSelect(word)}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex w-full gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                                    isActive
                                        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                        : isSolved
                                          ? 'border-transparent bg-emerald-50/60'
                                          : 'border-transparent bg-white/60 hover:bg-slate-100'
                                }`}
                            >
                                <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                                        isSolved
                                            ? 'bg-emerald-500 text-white'
                                            : isActive
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {isSolved ? <Check size={12} strokeWidth={3} /> : word.number}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={`block text-[13px] leading-snug ${
                                            isSolved
                                                ? 'text-emerald-800/70 line-through'
                                                : 'text-slate-700'
                                        }`}
                                    >
                                        {word.clue}
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                        {word.kind === 'person' && <User size={11} />}
                                        {word.answer.length} bokstaver
                                        {isSolved && (
                                            <span className="text-emerald-600">
                                                {' '}
                                                &middot; {word.display}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </motion.button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
