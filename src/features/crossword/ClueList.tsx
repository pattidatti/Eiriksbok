// Ledetrådene ved siden av brettet. Klikk på en ledetråd hopper til ordet.

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Check, User } from 'lucide-react';
import type { Direction, PlacedWord } from './types';

interface ClueListProps {
    title: string;
    direction: Direction;
    words: PlacedWord[];
    activeId?: string;
    solvedAt: Record<string, number>;
    onSelect: (word: PlacedWord) => void;
}

// Artikkeltitlene er bygd som «Hovedtittel: undertittel». I en smal liste er
// det hovedtittelen som forteller eleven hvor lenken går; undertittelen bare
// spiser plass. Hele tittelen ligger i title-attributtet.
const articleName = (label: string): string => {
    const colon = label.indexOf(': ');
    return colon >= 12 ? label.slice(0, colon) : label;
};

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
            <ul className="min-h-0 space-y-2 overflow-y-auto pr-1">
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

                            {/* Veien videre: lenken til artikkelen ordet kommer fra. Den
                                folder seg ut i det ordet blir løst - før det ville
                                artikkeltittelen kunne røpe svaret. Ny fane, slik at
                                brettet står urørt mens eleven leser. */}
                            {isSolved && word.source && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                    className="overflow-hidden"
                                >
                                    <Link
                                        to={word.source.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={`Les «${word.source.label}» i ny fane`}
                                        className="group mt-0.5 ml-7 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                                    >
                                        <BookOpen size={11} className="shrink-0" />
                                        <span className="truncate">
                                            {articleName(word.source.label)}
                                        </span>
                                        <ArrowUpRight
                                            size={11}
                                            className="-ml-0.5 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                        />
                                    </Link>
                                </motion.div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
