// Startskjermen: velg vanskelighetsgrad og hva kryssordet skal handle om.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Feather, Flame, Layers, Users, Zap } from 'lucide-react';
import type { BankEntry, ContentFilter, Difficulty, PuzzleFilters } from './types';
import { DIFFICULTIES } from './types';
import { filterBank } from './wordBank';

const SUBJECT_LABELS: Record<string, string> = {
    historie: 'Historie',
    norsk: 'Norsk',
    krle: 'KRLE',
    samfunnskunnskap: 'Samfunnskunnskap',
    musikk: 'Musikk',
};

const CONTENT_OPTIONS: { id: ContentFilter; label: string; icon: typeof Layers }[] = [
    { id: 'blandet', label: 'Alt', icon: Layers },
    { id: 'begreper', label: 'Begreper', icon: BookOpen },
    { id: 'personer', label: 'Personer', icon: Users },
];

const DIFFICULTY_ICONS = { lett: Feather, middels: Zap, vanskelig: Flame } as const;

// Under dette blir brettet for tynt til å bli et kryssord
const MIN_WORDS = 14;

interface SetupProps {
    entries: BankEntry[];
    eras: { key: string; label: string }[];
    difficulty: Difficulty;
    filters: PuzzleFilters;
    onDifficulty: (value: Difficulty) => void;
    onFilters: (value: PuzzleFilters) => void;
    onStart: () => void;
}

const Chip = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.94 }}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            active
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'
        }`}
    >
        {children}
    </motion.button>
);

export const CrosswordSetup = ({
    entries,
    eras,
    difficulty,
    filters,
    onDifficulty,
    onFilters,
    onStart,
}: SetupProps) => {
    const preset = DIFFICULTIES.find((item) => item.id === difficulty) || DIFFICULTIES[0];

    const subjects = useMemo(() => {
        const counts: Record<string, number> = {};
        entries.forEach((entry) => {
            if (entry.subject) counts[entry.subject] = (counts[entry.subject] || 0) + 1;
        });
        return Object.keys(SUBJECT_LABELS).filter((subject) => (counts[subject] || 0) >= 25);
    }, [entries]);

    const available = useMemo(() => {
        const pool = filterBank(entries, filters);
        return pool.filter(
            (entry) =>
                entry.answer.length >= preset.minLength &&
                entry.answer.length <= Math.min(preset.maxLength, preset.maxSize)
        ).length;
    }, [entries, filters, preset]);

    const canStart = available >= MIN_WORDS;
    const showEras = filters.content !== 'begreper';

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="mb-5 text-center"
            >
                <div className="mb-3 flex justify-center gap-1.5">
                    {'KRYSSORD'.split('').map((letter, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.4, rotateX: -90 }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                            transition={{
                                delay: 0.1 + index * 0.06,
                                type: 'spring',
                                stiffness: 380,
                                damping: 16,
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-indigo-200 bg-white text-base font-black text-indigo-600 shadow-sm sm:h-11 sm:w-11 sm:text-lg"
                        >
                            {letter}
                        </motion.span>
                    ))}
                </div>
                <h1 className="mb-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                    Fyll rutene med det du kan
                </h1>
                <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
                    Ordene er hentet fra begrepene og personene i boka.
                </p>
            </motion.header>

            <section className="mb-4">
                <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                    Vanskelighetsgrad
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    {DIFFICULTIES.map((item, index) => {
                        const Icon = DIFFICULTY_ICONS[item.id];
                        const active = item.id === difficulty;
                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => onDifficulty(item.id)}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.07 }}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.97 }}
                                className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-shadow ${
                                    active
                                        ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-500/20'
                                        : 'border-slate-200 bg-white/70 hover:shadow-lg'
                                }`}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="difficulty-glow"
                                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                                    />
                                )}
                                <span className="flex gap-3">
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                            active
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-base font-bold text-slate-800">
                                            {item.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                                            {item.tagline}
                                        </span>
                                        <span className="mt-1.5 block text-xs font-semibold text-indigo-500">
                                            {item.targetWords} ord &middot; {item.maxSize}x
                                            {item.maxSize} ruter
                                        </span>
                                    </span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </section>

            <section className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                            Fag
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Chip
                                active={filters.subject === null}
                                onClick={() => onFilters({ ...filters, subject: null })}
                            >
                                Alle fag
                            </Chip>
                            {subjects.map((subject) => (
                                <Chip
                                    key={subject}
                                    active={filters.subject === subject}
                                    onClick={() => onFilters({ ...filters, subject })}
                                >
                                    {SUBJECT_LABELS[subject]}
                                </Chip>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                            Innhold
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <Chip
                                        key={option.id}
                                        active={filters.content === option.id}
                                        onClick={() =>
                                            onFilters({
                                                ...filters,
                                                content: option.id,
                                                era: option.id === 'begreper' ? null : filters.era,
                                            })
                                        }
                                    >
                                        <Icon size={14} />
                                        {option.label}
                                    </Chip>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {showEras && (
                    <>
                        <h2 className="mt-4 mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                            Tidsrom <span className="normal-case">(gjelder personer)</span>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Chip
                                active={filters.era === null}
                                onClick={() => onFilters({ ...filters, era: null })}
                            >
                                Hele historien
                            </Chip>
                            {eras.map((era) => (
                                <Chip
                                    key={era.key}
                                    active={filters.era === era.key}
                                    onClick={() => onFilters({ ...filters, era: era.key })}
                                >
                                    {era.label}
                                </Chip>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <div className="flex flex-col items-center gap-2">
                <motion.p
                    key={available}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-sm font-semibold ${canStart ? 'text-slate-500' : 'text-rose-600'}`}
                >
                    {canStart
                        ? `${available} ord passer til valget ditt`
                        : `Bare ${available} ord passer. Prøv et bredere valg eller en lettere grad.`}
                </motion.p>
                <motion.button
                    type="button"
                    disabled={!canStart}
                    onClick={onStart}
                    whileHover={canStart ? { scale: 1.04, y: -2 } : undefined}
                    whileTap={canStart ? { scale: 0.96 } : undefined}
                    className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-lg font-bold text-white shadow-xl transition-colors ${
                        canStart
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/40'
                            : 'cursor-not-allowed bg-slate-300 shadow-none'
                    }`}
                >
                    Lag kryssordet
                    <ArrowRight size={20} />
                </motion.button>
            </div>
        </div>
    );
};
