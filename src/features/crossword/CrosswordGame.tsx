// Spillskjermen: brett, ledetråder, tastatur og alt som feirer et løst ord.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    AlertCircle,
    ArrowLeft,
    BookMarked,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    History,
    Lightbulb,
    Link2,
    ListChecks,
    RotateCcw,
    Volume2,
    VolumeX,
    Zap,
} from 'lucide-react';
import type { DifficultyPreset, PlacedWord, Puzzle } from './types';
import type { FinishSummary, SolveEvent } from './useCrossword';
import { COMBO_WINDOW_MS, useCrossword } from './useCrossword';
import { CrosswordBoard } from './CrosswordBoard';
import { ClueList } from './ClueList';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { VictoryOverlay } from './VictoryOverlay';
import { useCoarsePointer } from './useCoarsePointer';
import { isMuted, playSound, setMuted } from './sfx';
import { useProgressStore } from '../progress/useProgressStore';
import { captureCrosswordWords } from '../../utils/reviewCapture';

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
};

// Komboklokka: en tynn ring som tømmes mens vinduet løper, så eleven ser at
// det er noe å jage. Den teller ned for seg selv - ellers ville hele brettet
// blitt tegnet på nytt ti ganger i sekundet.
const ComboRing = ({ value, until }: { value: number; until: number }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => {
            const tick = Date.now();
            setNow(tick);
            if (tick >= until) window.clearInterval(id);
        }, 150);
        return () => window.clearInterval(id);
    }, [until]);

    const left = Math.max(0, until - now);
    if (left <= 0) return null;

    const fraction = Math.max(0, Math.min(1, left / COMBO_WINDOW_MS));
    const hot = value >= 2;

    return (
        <div
            title={`Kombo: ${value} ord på rad. Løs et nytt ord innen ${Math.ceil(left / 1000)} sekunder for å holde den i live.`}
            className="pointer-events-none absolute top-1 right-1 flex flex-col items-center gap-0.5"
        >
            <span className="relative flex h-11 w-11 items-center justify-center">
                <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r="17"
                        fill="none"
                        strokeWidth="3.5"
                        className="stroke-slate-200"
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r="17"
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={1 - fraction}
                        className={hot ? 'stroke-amber-500' : 'stroke-indigo-400'}
                    />
                </svg>
                <span
                    className={`absolute text-xs font-black ${
                        hot ? 'text-amber-600' : 'text-indigo-400'
                    }`}
                >
                    {hot ? `x${value}` : <Zap size={14} />}
                </span>
            </span>
            <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Kombo
            </span>
        </div>
    );
};

interface GameProps {
    puzzle: Puzzle;
    preset: DifficultyPreset;
    subjectId: string | null;
    // Vises som merke ved siden av vanskelighetsgraden, f.eks. «Det du har lest»
    modeLabel?: string;
    // Hele XP-id-en, regnet ut av siden
    activityId: string;
    isDaily: boolean;
    // Nøkkel for å lagre og hente igjen et påbegynt brett
    storageKey: string;
    onNewPuzzle: () => void;
    onBackToSetup: () => void;
}

export const CrosswordGame = ({
    puzzle,
    preset,
    subjectId,
    modeLabel,
    activityId,
    isDaily,
    storageKey,
    onNewPuzzle,
    onBackToSetup,
}: GameProps) => {
    const boardRef = useRef<HTMLDivElement | null>(null);
    const cellSizeRef = useRef(38);
    const timersRef = useRef<number[]>([]);
    const solvedAtRef = useRef<Record<string, number>>({});
    const [muted, setMutedState] = useState(isMuted);
    const [combo, setCombo] = useState<{ value: number; token: number } | null>(null);
    const [showClues, setShowClues] = useState(false);
    const [copyState, setCopyState] = useState<'idle' | 'ok' | 'feil'>('idle');
    const [resumedHidden, setResumedHidden] = useState(false);
    const [showVictory, setShowVictory] = useState(false);
    const [summary, setSummary] = useState<{
        elapsed: number;
        hintsUsed: number;
        mistakes: number;
        revealed: number;
        xp: number;
        alreadyEarnedToday: boolean;
    } | null>(null);
    const recordActivity = useProgressStore((store) => store.recordActivity);
    const isTouch = useCoarsePointer();
    const reduceMotion = useReducedMotion();

    // Alle utsatte kall samles her, så ingenting fyrer etter at siden er forlatt
    const later = useCallback((fn: () => void, ms: number) => {
        timersRef.current.push(window.setTimeout(fn, ms));
    }, []);

    useEffect(
        () => () => {
            timersRef.current.forEach((id) => window.clearTimeout(id));
            timersRef.current = [];
        },
        []
    );

    const handleCellSize = useCallback((size: number) => {
        cellSizeRef.current = size;
    }, []);

    // Konfetti fyres fra ordet som nettopp ble løst, ikke fra midten av skjermen
    const handleSolve = useCallback(
        (event: SolveEvent) => {
            // Er dette det siste ordet? Vi teller alle andre løste ord, så
            // svaret blir riktig enten telleren er oppdatert ennå eller ikke.
            const others = puzzle.words.filter(
                (word) => word.id !== event.word.id && solvedAtRef.current[word.id] !== undefined
            ).length;
            const isLast = others >= puzzle.words.length - 1;
            const board = boardRef.current;
            // Et ord du fikk servert er ingen seier, så det får ingen feiring
            if (board && !event.viaReveal) {
                const rect = board.getBoundingClientRect();
                const step = cellSizeRef.current + 3;
                const word = event.word;
                const centerCol = word.col + (word.dir === 'across' ? word.answer.length / 2 : 0.5);
                const centerRow = word.row + (word.dir === 'down' ? word.answer.length / 2 : 0.5);
                confetti({
                    particleCount: (isLast ? 120 : 32) + Math.min(event.combo, 4) * 14,
                    spread: (isLast ? 110 : 62) + event.combo * 6,
                    startVelocity: isLast ? 42 : 26,
                    ticks: isLast ? 160 : 110,
                    scalar: isLast ? 1.1 : 0.85,
                    colors: CONFETTI_COLORS,
                    disableForReducedMotion: true,
                    origin: {
                        x: (rect.left + centerCol * step) / window.innerWidth,
                        y: (rect.top + centerRow * step) / window.innerHeight,
                    },
                });
            }
            if (event.combo >= 2) setCombo({ value: event.combo, token: event.at });
        },
        [puzzle.words]
    );

    // Ferdig: fanfare, konfettikanoner og XP i «Min læring»
    const handleFinish = useCallback(
        (result: FinishSummary) => {
            playSound('win');
            const burst = (originX: number, scale: number) =>
                confetti({
                    particleCount: Math.round(90 * scale),
                    spread: 80 + scale * 20,
                    startVelocity: 45,
                    colors: CONFETTI_COLORS,
                    disableForReducedMotion: true,
                    origin: { x: originX, y: 0.7 },
                });
            // Siste ord skal kjennes større enn ord nummer sju: tre kanoner som
            // vokser, og et lite pust før seiersskjermen faller ned
            burst(0.2, 1);
            later(() => burst(0.8, 1.2), 200);
            later(() => burst(0.5, 1.6), 420);

            const score = Math.max(
                0.35,
                Math.min(
                    1,
                    1 - result.hintsUsed * 0.08 - result.mistakes * 0.03 - result.revealed * 0.07
                )
            );
            const awarded = recordActivity({
                kind: 'practice-game',
                activityId,
                subjectId: subjectId ?? undefined,
                score,
                title: `Kryssord (${preset.label})`,
            });
            setSummary({
                elapsed: result.elapsedSeconds,
                hintsUsed: result.hintsUsed,
                mistakes: result.mistakes,
                revealed: result.revealed,
                xp: awarded.xpAwarded,
                alreadyEarnedToday: awarded.xpAwarded === 0,
            });

            // Ordene eleven slet med skal komme tilbake i repetisjonen senere.
            // Innsamling må aldri kunne ødelegge seiersøyeblikket.
            try {
                const struggled = new Set(result.struggledIds);
                const toItem = (word: PlacedWord) => ({
                    display: word.display,
                    kind: word.kind,
                });
                const hard = puzzle.words.filter((word) => struggled.has(word.id));
                const easy = puzzle.words.filter((word) => !struggled.has(word.id));
                if (easy.length > 0) captureCrosswordWords(easy.map(toItem), true);
                if (hard.length > 0) captureCrosswordWords(hard.map(toItem), false);
            } catch {
                // stille: repetisjonsdata er et ekstra gode, ikke en forutsetning
            }

            later(() => setShowVictory(true), reduceMotion ? 120 : 950);
        },
        [preset, subjectId, activityId, recordActivity, puzzle.words, later, reduceMotion]
    );

    const state = useCrossword(puzzle, preset, {
        onSolve: handleSolve,
        onFinish: handleFinish,
        storageKey,
    });

    // Speiler siste kjente løsningsstatus, brukt av feiringen over. Den skrives i
    // en effekt, ikke under render: refen leses i tastetrykket, og da er siste
    // committede verdi den riktige.
    useEffect(() => {
        solvedAtRef.current = state.solvedAt;
    }, [state.solvedAt]);

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

    // Si fra hvis vi fortsatte på et brett eleven begynte på tidligere
    // Meldingen utledes av tilstanden og skjules av en timer. Å sette den i
    // selve effekten ville vært en ekstra render uten grunn.
    const showResumed = state.resumed && !resumedHidden;
    useEffect(() => {
        if (!state.resumed) return;
        const id = window.setTimeout(() => setResumedHidden(true), 7000);
        return () => window.clearTimeout(id);
    }, [state.resumed]);

    const toggleSound = useCallback(() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        if (!next) playSound('hint');
    }, [muted]);

    // Lenken inneholder frø og valg, så hele klassen kan få nøyaktig samme brett
    const copyLink = useCallback(async () => {
        const url = window.location.href;
        let ok = false;
        try {
            await navigator.clipboard.writeText(url);
            ok = true;
        } catch {
            // Noen skolenettlesere nekter utklippstavla. Da bruker vi det gamle
            // trikset med et usynlig tekstfelt.
            try {
                const field = document.createElement('textarea');
                field.value = url;
                field.setAttribute('readonly', '');
                field.style.position = 'fixed';
                field.style.top = '-1000px';
                field.style.opacity = '0';
                document.body.appendChild(field);
                field.select();
                ok = document.execCommand('copy');
                document.body.removeChild(field);
            } catch {
                ok = false;
            }
        }
        setCopyState(ok ? 'ok' : 'feil');
        later(() => setCopyState('idle'), 2400);
    }, [later]);

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
    const stuck = state.allFilled && !state.finished;

    const clueLists = (
        <>
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
        </>
    );

    return (
        <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-50">
            <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-slate-200/70 bg-white/70 px-3 py-2 backdrop-blur sm:px-5">
                <button
                    type="button"
                    onClick={onBackToSetup}
                    aria-label="Velg kryssord på nytt"
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Velg på nytt</span>
                </button>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    {preset.label}
                </span>
                {modeLabel && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                        <BookMarked size={12} />
                        {modeLabel}
                    </span>
                )}

                <div className="ml-auto flex items-center gap-1.5">
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
                        aria-label={`Hint, ${state.hintsLeft} igjen`}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold shadow-sm transition-colors ${
                            state.hintsLeft > 0
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/30'
                                : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                    >
                        <Lightbulb size={15} />
                        <span className="hidden sm:inline">Hint</span> {state.hintsLeft}
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={state.checkAll}
                        disabled={state.checksLeft <= 0 || state.finished}
                        whileTap={state.checksLeft > 0 ? { scale: 0.94 } : undefined}
                        aria-label={`Sjekk svarene, ${state.checksLeft} igjen`}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold shadow-sm transition-colors ${
                            state.checksLeft > 0
                                ? 'bg-white text-slate-600 ring-1 ring-slate-200 ring-inset hover:text-indigo-700'
                                : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                    >
                        <ListChecks size={15} />
                        <span className="hidden sm:inline">Sjekk</span> {state.checksLeft}
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={state.revealWord}
                        disabled={state.finished}
                        whileTap={{ scale: 0.94 }}
                        aria-label="Vis hele ordet du står i"
                        title="Fyller ut hele ordet du står i. Bruk den bare hvis du står helt fast."
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Eye size={15} />
                        <span className="hidden md:inline">Vis ordet</span>
                        {state.revealedCount > 0 && (
                            <span className="rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-500">
                                {state.revealedCount}
                            </span>
                        )}
                    </motion.button>

                    {isTouch && (
                        <button
                            type="button"
                            onClick={() => setShowClues((prev) => !prev)}
                            className="rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"
                        >
                            Ledetråder
                        </button>
                    )}

                    <div className="relative flex items-center gap-0.5 rounded-lg bg-white/70 p-0.5 ring-1 ring-slate-200 ring-inset">
                        <button
                            type="button"
                            onClick={toggleSound}
                            aria-label={muted ? 'Skru på lyd' : 'Skru av lyd'}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => void copyLink()}
                            aria-label="Kopier lenke til dette kryssordet"
                            title="Kopier lenke: alle som åpner den får akkurat dette kryssordet"
                            className={`rounded-md p-1.5 transition-colors hover:bg-slate-100 ${
                                copyState === 'ok'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {copyState === 'ok' ? <Check size={16} /> : <Link2 size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={onNewPuzzle}
                            aria-label="Nytt kryssord"
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                            <RotateCcw size={16} />
                        </button>

                        <AnimatePresence>
                            {copyState !== 'idle' && (
                                <motion.span
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className={`pointer-events-none absolute top-full right-0 z-20 mt-1 rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap shadow-sm ${
                                        copyState === 'ok'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-700 text-white'
                                    }`}
                                >
                                    {copyState === 'ok'
                                        ? 'Kopiert!'
                                        : 'Fikk ikke kopiert. Kopier adressen øverst i nettleseren.'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
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
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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

                    <AnimatePresence>
                        {showResumed && (
                            <motion.p
                                key="resumed"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-600"
                            >
                                <History size={14} className="shrink-0" />
                                Vi fortsatte der du slapp sist.
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {stuck && (
                            <motion.div
                                key="stuck"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex shrink-0 items-start gap-2 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900"
                            >
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                <span>
                                    {state.checksLeft > 0 ? (
                                        <>
                                            Alle rutene er fylt, men minst ett ord er feil. Trykk
                                            «Sjekk» øverst, så lyser de gale bokstavene rødt.
                                        </>
                                    ) : (
                                        <>
                                            Alle rutene er fylt, men minst ett ord er feil. Du har
                                            ingen sjekk igjen. Les ledetrådene en gang til, eller
                                            bruk «Vis ordet» hvis du står helt fast.
                                        </>
                                    )}
                                </span>
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

                        {state.comboUntil !== null && !state.finished && (
                            <ComboRing value={state.comboValue} until={state.comboUntil} />
                        )}

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

                    {isTouch && (
                        <div className="shrink-0">
                            <OnScreenKeyboard
                                onKey={state.typeLetter}
                                onBackspace={state.backspace}
                            />
                        </div>
                    )}
                </div>

                {!isTouch && (
                    <aside className="hidden w-80 min-w-0 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/60 p-3 backdrop-blur lg:flex xl:w-96">
                        {clueLists}
                    </aside>
                )}
            </div>

            <AnimatePresence>
                {showClues && isTouch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowClues(false)}
                        className="fixed inset-0 z-40 flex items-end bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                            onClick={(event) => event.stopPropagation()}
                            className="flex max-h-[75dvh] w-full flex-col gap-4 overflow-hidden rounded-t-3xl bg-white p-4"
                        >
                            {clueLists}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {state.finished && summary && showVictory && (
                    <VictoryOverlay
                        elapsed={summary.elapsed}
                        hintsUsed={summary.hintsUsed}
                        mistakes={summary.mistakes}
                        revealed={summary.revealed}
                        xp={summary.xp}
                        alreadyEarnedToday={summary.alreadyEarnedToday}
                        words={solvedWords}
                        isDaily={isDaily}
                        shareUrl={window.location.href}
                        onNew={onNewPuzzle}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
