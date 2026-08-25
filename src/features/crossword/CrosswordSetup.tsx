// Startskjermen: dagens kryssord øverst, så vanskelighetsgrad og hva
// kryssordet skal handle om.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BookMarked,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Feather,
    Flame,
    Layers,
    RotateCcw,
    Users,
    Zap,
} from 'lucide-react';
import type { BankEntry, ContentFilter, Difficulty, PuzzleFilters } from './types';
import { DIFFICULTIES } from './types';
import { filterBank } from './wordBank';
import { SUBJECT_LABELS } from './subjects';

const CONTENT_OPTIONS: { id: ContentFilter; label: string; icon: typeof Layers }[] = [
    { id: 'blandet', label: 'Alt', icon: Layers },
    { id: 'begreper', label: 'Begreper', icon: BookOpen },
    { id: 'personer', label: 'Personer', icon: Users },
];

const DIFFICULTY_ICONS = { lett: Feather, middels: Zap, vanskelig: Flame } as const;

// Under dette blir brettet for tynt til å bli et kryssord
const MIN_WORDS = 14;

// Et fag må ha så mange ord for å kunne velges i det hele tatt ...
const MIN_SUBJECT_WORDS = 25;
// ... og under dette sier vi ærlig fra om at brettene kommer til å ligne.
const THIN_SUBJECT_WORDS = 80;

interface SetupProps {
    entries: BankEntry[];
    eras: { key: string; label: string }[];
    // Artikkelstier eleven har lest ferdig, fra progresjonssystemet
    readArticles: Set<string>;
    difficulty: Difficulty;
    filters: PuzzleFilters;
    // Har eleven alt løst dagens kryssord?
    dailySolved: boolean;
    // Kort beskrivelse av et påbegynt brett, eller null om det ikke finnes noe
    resumeLabel: string | null;
    onDaily: () => void;
    onResume: () => void;
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
    readArticles,
    difficulty,
    filters,
    dailySolved,
    resumeLabel,
    onDaily,
    onResume,
    onDifficulty,
    onFilters,
    onStart,
}: SetupProps) => {
    const preset = DIFFICULTIES.find((item) => item.id === difficulty) || DIFFICULTIES[0];

    // Hvor mange ord har hvert fag? Tallet står på knappen, så eleven ser hva
    // hun får. Ord uten fag faller ut så snart et fag er valgt.
    const subjects = useMemo(() => {
        const counts: Record<string, number> = {};
        entries.forEach((entry) => {
            if (entry.subject) counts[entry.subject] = (counts[entry.subject] || 0) + 1;
        });
        return Object.keys(SUBJECT_LABELS)
            .map((subject) => ({ id: subject, count: counts[subject] || 0 }))
            .filter((subject) => subject.count >= MIN_SUBJECT_WORDS);
    }, [entries]);

    const thinSubject = useMemo(() => {
        if (!filters.subject) return null;
        const chosen = subjects.find((subject) => subject.id === filters.subject);
        return chosen && chosen.count < THIN_SUBJECT_WORDS ? chosen : null;
    }, [filters.subject, subjects]);

    const available = useMemo(() => {
        const pool = filterBank(entries, filters, readArticles);
        return pool.filter(
            (entry) =>
                entry.answer.length >= preset.minLength &&
                entry.answer.length <= Math.min(preset.maxLength, preset.maxSize)
        ).length;
    }, [entries, filters, preset, readArticles]);

    // Hvor mye har eleven å gå på i lest-modus? Vi teller ord, ikke artikler:
    // det er ordene som skal fylle rutene.
    const readWordCount = useMemo(
        () =>
            readArticles.size === 0
                ? 0
                : entries.filter((entry) => entry.articles?.some((path) => readArticles.has(path)))
                      .length,
        [entries, readArticles]
    );
    const hasReadEnough = readWordCount >= MIN_WORDS;
    // Er lest-modus alt på (for eksempel fra en delt lenke), skal eleven alltid
    // få skru den av igjen. Ellers står hun fast med et brett som ikke bygges.
    const readToggleDisabled = !hasReadEnough && !filters.onlyRead;

    const canStart = available >= MIN_WORDS;
    // Tidsrom gjelder bare personer. Før viste vi det også for «Alt», og da så
    // filteret ut til å virke uten å gjøre det.
    const showEras = filters.content === 'personer';

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pt-3 pb-2">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="mb-3 text-center"
            >
                <div className="mb-2 flex justify-center gap-1.5">
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
                            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-indigo-200 bg-white text-sm font-black text-indigo-600 shadow-sm sm:h-10 sm:w-10 sm:text-base"
                        >
                            {letter}
                        </motion.span>
                    ))}
                </div>
                <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-xl font-black text-transparent sm:text-2xl">
                    Fyll rutene med det du kan
                </h1>
                <p className="mx-auto max-w-2xl text-xs text-slate-600 sm:text-sm">
                    Ordene er hentet fra begrepene og personene i boka.
                </p>
            </motion.header>

            {/* Dagens kryssord: samme brett for alle, nytt hver dag. Det er
                grunnen til å komme tilbake i morgen, så det står øverst. */}
            <motion.button
                type="button"
                onClick={onDaily}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 160, damping: 18 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className={`mb-2.5 flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left shadow-lg transition-colors ${
                    dailySolved
                        ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-emerald-500/10'
                        : 'border-indigo-700 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/30'
                }`}
            >
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        dailySolved ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'
                    }`}
                >
                    {dailySolved ? <CheckCircle2 size={22} /> : <CalendarDays size={22} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span
                        className={`block text-base font-black sm:text-lg ${
                            dailySolved ? 'text-emerald-900' : 'text-white'
                        }`}
                    >
                        {dailySolved ? 'Dagens kryssord er løst!' : 'Dagens kryssord'}
                    </span>
                    <span
                        className={`block text-xs leading-snug ${
                            dailySolved ? 'text-emerald-800' : 'text-indigo-100'
                        }`}
                    >
                        {dailySolved
                            ? 'Godt jobbet. Et nytt venter i morgen. Vil du spille mer nå, lager du ditt eget under.'
                            : 'Alle får det samme brettet i dag. Nytt kryssord hver dag.'}
                    </span>
                </span>
                <ArrowRight
                    size={20}
                    className={`shrink-0 ${dailySolved ? 'text-emerald-700' : 'text-white'}`}
                />
            </motion.button>

            {resumeLabel && (
                <motion.button
                    type="button"
                    onClick={onResume}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="mb-2.5 flex w-full items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-left transition-colors hover:border-amber-400"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-white">
                        <RotateCcw size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-amber-900">
                            Fortsett kryssordet
                        </span>
                        <span className="block text-xs leading-snug text-amber-800">
                            Du har et brett du ikke ble ferdig med: {resumeLabel}.
                        </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-amber-700" />
                </motion.button>
            )}

            <section className="mb-3">
                <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                    Lag ditt eget
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
                                className={`relative overflow-hidden rounded-2xl border p-3 text-left transition-shadow ${
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

            <motion.button
                type="button"
                disabled={readToggleDisabled}
                onClick={() => onFilters({ ...filters, onlyRead: !filters.onlyRead })}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={readToggleDisabled ? undefined : { y: -2 }}
                whileTap={readToggleDisabled ? undefined : { scale: 0.99 }}
                className={`mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    filters.onlyRead
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-lg shadow-indigo-500/10'
                        : readToggleDisabled
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                          : 'border-slate-200 bg-white/70 hover:border-indigo-300'
                }`}
            >
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        filters.onlyRead
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    <BookMarked size={18} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-slate-800">
                        Bare det du har lest
                    </span>
                    <span className="block text-xs leading-snug text-slate-500">
                        {readArticles.size === 0
                            ? 'Du har ikke lest ferdig noen artikler ennå. Les én, så bygger vi kryssord av ordene i den.'
                            : hasReadEnough
                              ? `Ord fra de ${readArticles.size} artiklene du har lest. ${readWordCount} ord å velge mellom.`
                              : `Du har lest ${readArticles.size} ${readArticles.size === 1 ? 'artikkel' : 'artikler'}, og det gir bare ${readWordCount} ord. Les én til.`}
                    </span>
                </span>
                <span
                    className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                        filters.onlyRead ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                    <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                        className={`block h-5 w-5 rounded-full bg-white shadow ${
                            filters.onlyRead ? 'ml-auto' : ''
                        }`}
                    />
                </span>
            </motion.button>

            <section className="mb-3 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
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
                                    key={subject.id}
                                    active={filters.subject === subject.id}
                                    onClick={() => onFilters({ ...filters, subject: subject.id })}
                                >
                                    {SUBJECT_LABELS[subject.id]}
                                    <span className="text-xs font-medium opacity-70">
                                        {subject.count}
                                    </span>
                                </Chip>
                            ))}
                        </div>
                        {thinSubject && (
                            <p className="mt-2 text-xs leading-snug text-amber-700">
                                {SUBJECT_LABELS[thinSubject.id]} har bare {thinSubject.count} ord i
                                banken. Da kommer brettene til å ligne mye på hverandre. Velg «Alle
                                fag» hvis du vil ha mer variasjon.
                            </p>
                        )}
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
                                                // Tidsrom gjelder bare personer.
                                                // Bytter eleven bort, nullstiller
                                                // vi det i stedet for å la et
                                                // usynlig filter henge igjen.
                                                era: option.id === 'personer' ? filters.era : null,
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
                            Tidsrom
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

            {/* Klebrig bunn: knappen skal være innenfor rekkevidde på en
                Chromebook uansett hvor mange filterrader som er åpne. */}
            <div className="sticky bottom-0 -mx-4 flex flex-col items-center gap-1.5 border-t border-slate-200/70 bg-white/85 px-4 pt-2.5 pb-3 backdrop-blur">
                <motion.p
                    key={available}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-sm font-semibold ${canStart ? 'text-slate-500' : 'text-rose-600'}`}
                >
                    {canStart
                        ? `${available} ord passer til valget ditt`
                        : filters.onlyRead
                          ? `Bare ${available} ord fra det du har lest passer her. Prøv en lettere grad, eller les en artikkel til.`
                          : `Bare ${available} ord passer. Prøv et bredere valg eller en lettere grad.`}
                </motion.p>
                <motion.button
                    type="button"
                    disabled={!canStart}
                    onClick={onStart}
                    whileHover={canStart ? { scale: 1.04, y: -2 } : undefined}
                    whileTap={canStart ? { scale: 0.96 } : undefined}
                    className={`flex items-center gap-2 rounded-2xl px-8 py-3 text-lg font-bold text-white shadow-xl transition-colors ${
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
