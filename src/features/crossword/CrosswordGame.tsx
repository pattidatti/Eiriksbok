// Spillskjermen: brett, ledetråder, tastatur og alt som feirer et løst ord.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Clock,
    Lightbulb,
    ListChecks,
    RotateCcw,
    Volume2,
    VolumeX,
} from 'lucide-react';
import type { DifficultyPreset, PlacedWord, Puzzle } from './types';
import type { FinishSummary, SolveEvent } from './useCrossword';
import { useCrossword } from './useCrossword';
import { CrosswordBoard } from './CrosswordBoard';
import { ClueList } from './ClueList';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { VictoryOverlay } from './VictoryOverlay';
import { isMuted, playSound, setMuted } from './sfx';
import { useProgressStore } from '../progress/useProgressStore';

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
};

interface GameProps {
    puzzle: Puzzle;
    preset: DifficultyPreset;
    subjectId: string | null;
    onNewPuzzle: () => void;
    onBackToSetup: () => void;
}

export const CrosswordGame = ({
    puzzle,
    preset,
    subjectId,
    onNewPuzzle,
    onBackToSetup,
}: GameProps) => {
    const boardRef = useRef<HTMLDivElement | null>(null);
    const cellSizeRef = useRef(38);
    const [muted, setMutedState] = useState(isMuted);
    const [combo, setCombo] = useState<{ value: number; token: number } | null>(null);
    const [showClues, setShowClues] = useState(false);
    const [summary, setSummary] = useState<{
        elapsed: number;
        hintsUsed: number;
        mistakes: number;
        xp: number;
    } | null>(null);
    const recordActivity = useProgressStore((store) => store.recordActivity);

    const handleCellSize = useCallback((size: number) => {
        cellSizeRef.current = size;
    }, []);

    // Konfetti fyres fra ordet som nettopp ble løst, ikke fra midten av skjermen
    const handleSolve = useCallback((event: SolveEvent) => {
        const board = boardRef.current;
        if (board) {
            const rect = board.getBoundingClientRect();
            const step = cellSizeRef.current + 3;
            const word = event.word;
            const centerCol = word.col + (word.dir === 'across' ? word.answer.length / 2 : 0.5);
            const centerRow = word.row + (word.dir === 'down' ? word.answer.length / 2 : 0.5);
            confetti({
                particleCount: 32 + Math.min(event.combo, 4) * 14,
                spread: 62 + event.combo * 6,
                startVelocity: 26,
                ticks: 110,
                scalar: 0.85,
                colors: CONFETTI_COLORS,
                origin: {
                    x: (rect.left + centerCol * step) / window.innerWidth,
                    y: (rect.top + centerRow * step) / window.innerHeight,
                },
            });
        }
        if (event.combo >= 2) setCombo({ value: event.combo, token: event.at });
    }, []);

    // Ferdig: fanfare, konfettikanoner og XP i «Min læring»
    const handleFinish = useCallback(
        (result: FinishSummary) => {
            playSound('win');
            const burst = (originX: number) =>
                confetti({
                    particleCount: 90,
                    spread: 80,
                    startVelocity: 45,
                    colors: CONFETTI_COLORS,
                    origin: { x: originX, y: 0.7 },
                });
            burst(0.2);
            window.setTimeout(() => burst(0.8), 220);
            window.setTimeout(() => burst(0.5), 440);

            const score = Math.max(
                0.35,
                Math.min(1, 1 - result.hintsUsed * 0.08 - result.mistakes * 0.03)
            );
            const awarded = recordActivity({
                kind: 'practice-game',
                // Ingen skråstrek: første ledd ville ellers blitt lest som fag-id
                activityId: `kryssord-${preset.id}-${subjectId ?? 'alle'}`,
                subjectId: subjectId ?? undefined,
                score,
                title: `Kryssord (${preset.label})`,
            });
            setSummary({
                elapsed: result.elapsedSeconds,
                hintsUsed: result.hintsUsed,
                mistakes: result.mistakes,
                xp: awarded.xpAwarded,
            });
        },
        [preset, subjectId, recordActivity]
    );

    const state = useCrossword(puzzle, preset, { onSolve: handleSolve, onFinish: handleFinish });

    const progress = state.solvedCount / puzzle.words.length;

    // Fysisk tastatur: skriving, piltaster, tab mellom ord
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

            if (event.key === 'Backspace') {
                event.preventDefault();
                state.backspace();
                return;
            }
            if (event.key === 'Tab') {
                event.preventDefault();
                state.jumpWord(event.shiftKey ? -1 : 1);
                return;
            }
            if (event.key === ' ') {
                event.preventDefault();
                state.setDir(state.dir === 'across' ? 'down' : 'across');
                playSound('move');
                return;
            }
            const arrows: Record<string, [number, number]> = {
                ArrowUp: [-1, 0],
                ArrowDown: [1, 0],
                ArrowLeft: [0, -1],
                ArrowRight: [0, 1],
            };
            if (arrows[event.key]) {
                event.preventDefault();
                state.moveCursor(arrows[event.key][0], arrows[event.key][1]);
                return;
            }
            if (event.key.length === 1 && /[a-zæøåA-ZÆØÅ]/.test(event.key)) {
                event.preventDefault();
                state.typeLetter(event.key);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [state]);

    useEffect(() => {
        if (!combo) return;
        const timer = window.setTimeout(() => setCombo(null), 1500);
        return () => window.clearTimeout(timer);
    }, [combo]);

    const toggleSound = useCallback(() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        if (!next) playSound('hint');
    }, [muted]);

    const handleClueSelect = useCallback(
        (word: PlacedWord) => {
            state.selectWord(word);
            setShowClues(false);
        },
        [state]
    );

    const solvedWords = useMemo(
        () =>
            puzzle.words
                .filter((word) => state.solvedAt[word.id] !== undefined)
                .sort((a, b) => state.solvedAt[a.id] - state.solvedAt[b.id]),
        [puzzle.words, state.solvedAt]
    );

    const active = state.activeWord;

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-50">
            <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200/70 bg-white/70 px-3 py-2 backdrop-blur sm:px-5">
                <button
                    type="button"
                    onClick={onBackToSetup}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                    <ArrowLeft size={16} />
                    Velg på nytt
                </button>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    {preset.label}
                </span>

                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-bold text-slate-600 tabular-nums">
                        <Clock size={15} />
                        {formatTime(state.elapsed)}
                    </div>

                    <motion.button
                        type="button"
                        onClick={state.useHint}
                        disabled={state.hintsLeft <= 0 || state.finished}
                        whileHover={state.hintsLeft > 0 ? { y: -2 } : undefined}
                        whileTap={state.hintsLeft > 0 ? { scale: 0.94 } : undefined}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm transition-colors ${
                            state.hintsLeft > 0
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/30'
                                : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                    >
                        <Lightbulb size={15} />
                        Hint {state.hintsLeft}
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={state.checkAll}
                        whileTap={{ scale: 0.94 }}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-indigo-700"
                    >
                        <ListChecks size={15} />
                        Sjekk
                    </motion.button>

                    <button
                        type="button"
                        onClick={() => setShowClues((prev) => !prev)}
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 lg:hidden"
                    >
                        Ledetråder
                    </button>

                    <button
                        type="button"
                        onClick={toggleSound}
                        aria-label={muted ? 'Skru på lyd' : 'Skru av lyd'}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>

                    <button
                        type="button"
                        onClick={onNewPuzzle}
                        aria-label="Nytt kryssord"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                    />
                </div>
            </header>

            <div className="flex min-h-0 flex-1 gap-4 px-3 py-3 sm:px-5">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                    <AnimatePresence mode="wait">
                        {active && (
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.18 }}
                                className="flex shrink-0 items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur"
                            >
                                <button
                                    type="button"
                                    onClick={() => state.jumpWord(-1)}
                                    aria-label="Forrige ord"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                                    {active.number}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-bold tracking-wide text-indigo-500 uppercase">
                                        {active.dir === 'across' ? 'Vannrett' : 'Loddrett'} &middot;{' '}
                                        {active.answer.length} bokstaver
                                    </span>
                                    <span className="line-clamp-2 block text-sm text-slate-700 sm:text-base">
                                        {active.clue}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => state.jumpWord(1)}
                                    aria-label="Neste ord"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex min-h-0 flex-1">
                        <CrosswordBoard
                            puzzle={puzzle}
                            state={state}
                            boardRef={boardRef}
                            onCellSize={handleCellSize}
                        />
                        <AnimatePresence>
                            {combo && (
                                <motion.div
                                    key={combo.token}
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: -10 }}
                                    exit={{ opacity: 0, scale: 1.4, y: -50 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                                    className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
                                >
                                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-5 py-2 text-lg font-black text-white shadow-xl">
                                        {combo.value} PÅ RAD!
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="shrink-0 lg:hidden">
                        <OnScreenKeyboard onKey={state.typeLetter} onBackspace={state.backspace} />
                    </div>
                </div>

                <aside className="hidden w-80 min-w-0 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/60 p-3 backdrop-blur lg:flex xl:w-96">
                    <ClueList
                        title="Vannrett"
                        direction="across"
                        words={puzzle.words}
                        activeId={active?.id}
                        solvedAt={state.solvedAt}
                        onSelect={handleClueSelect}
                    />
                    <ClueList
                        title="Loddrett"
                        direction="down"
                        words={puzzle.words}
                        activeId={active?.id}
                        solvedAt={state.solvedAt}
                        onSelect={handleClueSelect}
                    />
                </aside>
            </div>

            <AnimatePresence>
                {showClues && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowClues(false)}
                        className="fixed inset-0 z-40 flex items-end bg-slate-900/40 backdrop-blur-sm lg:hidden"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                            onClick={(event) => event.stopPropagation()}
                            className="flex max-h-[75vh] w-full flex-col gap-4 overflow-hidden rounded-t-3xl bg-white p-4"
                        >
                            <ClueList
                                title="Vannrett"
                                direction="across"
                                words={puzzle.words}
                                activeId={active?.id}
                                solvedAt={state.solvedAt}
                                onSelect={handleClueSelect}
                            />
                            <ClueList
                                title="Loddrett"
                                direction="down"
                                words={puzzle.words}
                                activeId={active?.id}
                                solvedAt={state.solvedAt}
                                onSelect={handleClueSelect}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {state.finished && summary && (
                    <VictoryOverlay
                        elapsed={summary.elapsed}
                        hintsUsed={summary.hintsUsed}
                        mistakes={summary.mistakes}
                        xp={summary.xp}
                        words={solvedWords}
                        onNew={onNewPuzzle}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
