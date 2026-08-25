// Spillogikken i Kryssord: markør, skriving, hint, sjekk, avsløring og løste ord.
// Komponentene under er rene visninger over denne tilstanden.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Direction, DifficultyPreset, PlacedWord, Puzzle } from './types';
import { cellKey } from './types';
import { playSound } from './sfx';

export interface Cursor {
    row: number;
    col: number;
}

// To ord løst innen dette vinduet teller som kombo. Spillskjermen tegner
// nedtellingen med det samme tallet, så det bor her og eksporteres.
export const COMBO_WINDOW_MS = 25000;
// Hvor lenge vi venter etter siste tastetrykk før brettet lagres
const SAVE_DEBOUNCE_MS = 400;

export interface SolveEvent {
    word: PlacedWord;
    combo: number;
    at: number;
    // Sant når ordet ble fylt ut av «avslør ord». Da skal det ikke feires.
    viaReveal: boolean;
}

export interface FinishSummary {
    elapsedSeconds: number;
    hintsUsed: number;
    mistakes: number;
    revealed: number;
    // Ord eleven strevde med: avslørt, eller tatt i en sjekk
    struggledIds: string[];
}

// Feiringen hører hjemme der handlingen skjer - i tastetrykket, ikke i en
// effekt som våkner en render for sent.
export interface CrosswordCallbacks {
    onSolve?: (event: SolveEvent) => void;
    onFinish?: (summary: FinishSummary) => void;
    // Nøkkel i localStorage. Uten den lagres ingenting.
    storageKey?: string;
}

// Det som skal overleve en refresh eller en PWA-oppdatering. Et halvferdig
// 15x15-brett er 15 minutters arbeid; det skal ikke forsvinne i en reload.
interface SavedGame {
    seed: number;
    letters: Record<string, string>;
    locked: Record<string, boolean>;
    solvedAt: Record<string, number>;
    hintsLeft: number;
    checksLeft: number;
    mistakes: number;
    elapsed: number;
    revealed: number;
    struggled: string[];
}

const readSaved = (storageKey: string | undefined, seed: number): SavedGame | null => {
    if (!storageKey || typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        const data = JSON.parse(raw) as Partial<SavedGame> | null;
        // Et lagret brett hører til nøyaktig ett puslespill
        if (!data || data.seed !== seed || !data.letters || typeof data.letters !== 'object') {
            return null;
        }
        return {
            seed,
            letters: data.letters,
            locked: data.locked && typeof data.locked === 'object' ? data.locked : {},
            solvedAt: data.solvedAt && typeof data.solvedAt === 'object' ? data.solvedAt : {},
            hintsLeft: typeof data.hintsLeft === 'number' ? data.hintsLeft : 0,
            checksLeft: typeof data.checksLeft === 'number' ? data.checksLeft : 0,
            mistakes: typeof data.mistakes === 'number' ? data.mistakes : 0,
            elapsed: typeof data.elapsed === 'number' ? data.elapsed : 0,
            revealed: typeof data.revealed === 'number' ? data.revealed : 0,
            struggled: Array.isArray(data.struggled) ? data.struggled : [],
        };
    } catch {
        // Ødelagt eller utilgjengelig lagring - vi starter bare på nytt
        return null;
    }
};

const writeSaved = (storageKey: string | undefined, data: SavedGame) => {
    if (!storageKey || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
        // Privat modus eller full kvote - da spiller eleven bare uten lagring
    }
};

const clearSaved = (storageKey: string | undefined) => {
    if (!storageKey || typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(storageKey);
    } catch {
        // Se writeSaved
    }
};

const cellsOf = (word: PlacedWord): Cursor[] => {
    const dr = word.dir === 'down' ? 1 : 0;
    const dc = word.dir === 'across' ? 1 : 0;
    return Array.from({ length: word.answer.length }, (_, k) => ({
        row: word.row + dr * k,
        col: word.col + dc * k,
    }));
};

export const useCrossword = (
    puzzle: Puzzle,
    preset: DifficultyPreset,
    { onSolve, onFinish, storageKey }: CrosswordCallbacks = {}
) => {
    // Leses én gang, ved mount. Passer ikke seed-en, later vi som at det ikke fantes.
    const [restored] = useState<SavedGame | null>(() => readSaved(storageKey, puzzle.seed));
    const resumed = restored !== null;

    // Ved gjenopptakelse starter markøren på første uløste ord, ikke på ord nummer én
    const startWord =
        (restored && puzzle.words.find((w) => restored.solvedAt[w.id] === undefined)) ||
        puzzle.words[0];

    const [letters, setLetters] = useState<Record<string, string>>(() => restored?.letters ?? {});
    const [locked, setLocked] = useState<Record<string, boolean>>(() => restored?.locked ?? {});
    const [solvedAt, setSolvedAt] = useState<Record<string, number>>(
        () => restored?.solvedAt ?? {}
    );
    const [dir, setDir] = useState<Direction>(startWord.dir);
    const [cursor, setCursor] = useState<Cursor>(() => ({
        row: startWord.row,
        col: startWord.col,
    }));
    const [hintsLeft, setHintsLeft] = useState(() =>
        restored ? Math.max(0, Math.min(restored.hintsLeft, preset.hints)) : preset.hints
    );
    const [checksLeft, setChecksLeft] = useState(() =>
        restored ? Math.max(0, Math.min(restored.checksLeft, preset.checks)) : preset.checks
    );
    const [mistakes, setMistakes] = useState(() => restored?.mistakes ?? 0);
    const [revealedCount, setRevealedCount] = useState(() => restored?.revealed ?? 0);
    const [shake, setShake] = useState<{ id: string; token: number } | null>(null);
    const [wrongCells, setWrongCells] = useState<Record<string, number>>({});
    const [elapsed, setElapsed] = useState(() => restored?.elapsed ?? 0);
    const [comboValue, setComboValue] = useState(0);
    const [comboUntil, setComboUntil] = useState<number | null>(null);

    const lastSolve = useRef(0);
    const comboRef = useRef(0);
    const shakeToken = useRef(0);
    // Tellere vi trenger i selve løsningsøyeblikket, før React har rukket å
    // gi oss ny state
    const solvedIds = useRef<Set<string>>(new Set(restored ? Object.keys(restored.solvedAt) : []));
    const struggled = useRef<Set<string>>(new Set(restored ? restored.struggled : []));
    const hintsUsed = useRef(restored ? Math.max(0, preset.hints - restored.hintsLeft) : 0);
    const mistakesRef = useRef(restored?.mistakes ?? 0);
    const revealedRef = useRef(restored?.revealed ?? 0);
    // Egen teller for spilletid, slik at klokka kan stå stille når fanen er skjult
    const elapsedRef = useRef(restored?.elapsed ?? 0);
    const finishedRef = useRef(false);

    const wordById = useMemo(() => {
        const map: Record<string, PlacedWord> = {};
        for (const word of puzzle.words) map[word.id] = word;
        return map;
    }, [puzzle]);

    const solvedCount = Object.keys(solvedAt).length;
    const finished = solvedCount === puzzle.words.length;

    // Alle ruter har en bokstav. På vanskelig (uten autoCheck) er dette eneste
    // signalet om at brettet er fullt, men ikke riktig.
    const allFilled = useMemo(
        () => Object.keys(puzzle.cells).every((key) => Boolean(letters[key])),
        [puzzle.cells, letters]
    );

    // Klokka teller bare når eleven faktisk ser brettet. Ellers ville «Tid» på
    // seiersskjermen bare målt hvor lenge fanen sto åpen i bakgrunnen.
    useEffect(() => {
        if (finished) return;
        const timer = window.setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            elapsedRef.current += 1;
            setElapsed(elapsedRef.current);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [finished]);

    // Kombovinduet dør av seg selv, så nedtellingen kan tegnes ærlig
    useEffect(() => {
        if (comboUntil === null) return;
        const left = comboUntil - Date.now();
        const timer = window.setTimeout(() => {
            comboRef.current = 0;
            lastSolve.current = 0;
            setComboValue(0);
            setComboUntil(null);
        }, Math.max(0, left));
        return () => window.clearTimeout(timer);
    }, [comboUntil]);

    const cellAt = useCallback(
        (row: number, col: number) => puzzle.cells[cellKey(row, col)],
        [puzzle]
    );

    const wordAt = useCallback(
        (row: number, col: number, direction: Direction): PlacedWord | undefined => {
            const cell = cellAt(row, col);
            if (!cell) return undefined;
            const id = direction === 'across' ? cell.acrossId : cell.downId;
            return id ? wordById[id] : undefined;
        },
        [cellAt, wordById]
    );

    const activeWord = useMemo(
        () =>
            wordAt(cursor.row, cursor.col, dir) ||
            wordAt(cursor.row, cursor.col, dir === 'across' ? 'down' : 'across'),
        [wordAt, cursor, dir]
    );

    const activeCells = useMemo(() => (activeWord ? cellsOf(activeWord) : []), [activeWord]);

    // Ruter som ikke kan skrives over: hint-bokstaver, avslørte ord og alt som
    // hører til et ferdig løst ord. Uten dette kunne et grønt ord få feil
    // bokstav i seg.
    const frozen = useMemo(() => {
        const set = new Set<string>(Object.keys(locked));
        for (const word of puzzle.words) {
            if (solvedAt[word.id] === undefined) continue;
            for (const cell of cellsOf(word)) set.add(cellKey(cell.row, cell.col));
        }
        return set;
    }, [locked, solvedAt, puzzle.words]);

    // Sluttrapporten skal bare gå én gang, uansett hvilken vei siste ord falt
    const emitFinish = useCallback(() => {
        if (finishedRef.current) return;
        if (solvedIds.current.size < puzzle.words.length) return;
        finishedRef.current = true;
        onFinish?.({
            elapsedSeconds: elapsedRef.current,
            hintsUsed: hintsUsed.current,
            mistakes: mistakesRef.current,
            revealed: revealedRef.current,
            struggledIds: Array.from(struggled.current),
        });
    }, [puzzle.words.length, onFinish]);

    // Sjekker om noen av ordene gjennom en rute nettopp ble ferdige eller feil.
    // `prevLetters` er bokstavene før tastetrykket: uten dem ville vi ikke visst
    // om ordet nettopp BLE fullt, eller om det har vært fullt og feil hele tiden.
    const evaluate = useCallback(
        (
            nextLetters: Record<string, string>,
            touched: Cursor,
            prevLetters: Record<string, string>,
            silent = false
        ) => {
            const cell = cellAt(touched.row, touched.col);
            if (!cell) return;
            const candidates = [cell.acrossId, cell.downId]
                .filter((id): id is string => Boolean(id))
                .map((id) => wordById[id])
                .filter((word) => word && !solvedIds.current.has(word.id));

            for (const word of candidates) {
                const cells = cellsOf(word);
                const typed = cells.map((c) => nextLetters[cellKey(c.row, c.col)] || '');
                if (typed.some((letter) => !letter)) continue;

                if (typed.join('') === word.answer) {
                    const now = Date.now();
                    comboRef.current =
                        now - lastSolve.current < COMBO_WINDOW_MS ? comboRef.current + 1 : 1;
                    lastSolve.current = now;
                    setComboValue(comboRef.current);
                    setComboUntil(now + COMBO_WINDOW_MS);
                    solvedIds.current.add(word.id);
                    setSolvedAt((prev) => ({ ...prev, [word.id]: Object.keys(prev).length }));
                    playSound('solve', comboRef.current - 1);
                    onSolve?.({ word, combo: comboRef.current, at: now, viaReveal: false });
                    emitFinish();
                } else if (preset.autoCheck && !silent) {
                    // Fullt utfylt, men feil. Vi sier bare fra i det øyeblikket
                    // ordet BLIR fullt. Ellers ville hver bokstav eleven retter i
                    // et fullt, feil ord telt som en ny bom - sju bom for å rette
                    // ett ord på åtte bokstaver.
                    const wasFull = cells.every((c) => prevLetters[cellKey(c.row, c.col)]);
                    if (wasFull) continue;
                    shakeToken.current += 1;
                    setShake({ id: word.id, token: shakeToken.current });
                    struggled.current.add(word.id);
                    mistakesRef.current += 1;
                    setMistakes(mistakesRef.current);
                    playSound('error');
                }
            }
        },
        [cellAt, wordById, preset.autoCheck, onSolve, emitFinish]
    );

    const moveWithin = useCallback(
        (word: PlacedWord, from: Cursor, nextLetters: Record<string, string>) => {
            const cells = cellsOf(word);
            const index = cells.findIndex((c) => c.row === from.row && c.col === from.col);
            const empty = cells.findIndex(
                (c, i) => i > index && !nextLetters[cellKey(c.row, c.col)]
            );
            const target = empty >= 0 ? empty : Math.min(index + 1, cells.length - 1);
            setCursor(cells[target]);
        },
        []
    );

    const selectCell = useCallback(
        (row: number, col: number) => {
            const cell = cellAt(row, col);
            if (!cell) return;
            const sameCell = cursor.row === row && cursor.col === col;
            const hasBoth = Boolean(cell.acrossId && cell.downId);
            if (sameCell && hasBoth) {
                setDir((prev) => (prev === 'across' ? 'down' : 'across'));
            } else if (!cell.acrossId) {
                setDir('down');
            } else if (!cell.downId) {
                setDir('across');
            }
            setCursor({ row, col });
            playSound('move');
        },
        [cellAt, cursor]
    );

    const selectWord = useCallback(
        (word: PlacedWord) => {
            setDir(word.dir);
            const cells = cellsOf(word);
            const firstEmpty = cells.find((c) => !letters[cellKey(c.row, c.col)]);
            setCursor(firstEmpty || cells[0]);
            playSound('move');
        },
        [letters]
    );

    const typeLetter = useCallback(
        (raw: string) => {
            const letter = raw.toUpperCase();
            if (!/^[A-ZÆØÅ]$/.test(letter)) return;
            const word = activeWord;
            if (!word) return;
            const key = cellKey(cursor.row, cursor.col);
            if (frozen.has(key)) {
                moveWithin(word, cursor, letters);
                return;
            }
            const nextLetters = { ...letters, [key]: letter };
            setLetters(nextLetters);
            setWrongCells({});
            playSound('letter');
            moveWithin(word, cursor, nextLetters);
            evaluate(nextLetters, cursor, letters);
        },
        [activeWord, cursor, letters, frozen, moveWithin, evaluate]
    );

    const backspace = useCallback(() => {
        const word = activeWord;
        if (!word) return;
        const key = cellKey(cursor.row, cursor.col);
        if (letters[key] && !frozen.has(key)) {
            const nextLetters = { ...letters };
            delete nextLetters[key];
            setLetters(nextLetters);
            playSound('erase');
            return;
        }
        const cells = cellsOf(word);
        const index = cells.findIndex((c) => c.row === cursor.row && c.col === cursor.col);
        if (index > 0) {
            const prev = cells[index - 1];
            const prevKey = cellKey(prev.row, prev.col);
            setCursor(prev);
            if (letters[prevKey] && !frozen.has(prevKey)) {
                const nextLetters = { ...letters };
                delete nextLetters[prevKey];
                setLetters(nextLetters);
            }
            playSound('erase');
        }
    }, [activeWord, cursor, letters, frozen]);

    const moveCursor = useCallback(
        (deltaRow: number, deltaCol: number) => {
            const wanted: Direction = deltaCol !== 0 ? 'across' : 'down';
            if (wanted !== dir) {
                const cell = cellAt(cursor.row, cursor.col);
                if (cell && (wanted === 'across' ? cell.acrossId : cell.downId)) {
                    setDir(wanted);
                    playSound('move');
                    return;
                }
            }
            let row = cursor.row + deltaRow;
            let col = cursor.col + deltaCol;
            // Hopp over tomme felt til vi treffer neste rute i samme retning
            while (row >= 0 && col >= 0 && row < puzzle.rows && col < puzzle.cols) {
                if (cellAt(row, col)) {
                    setCursor({ row, col });
                    playSound('move');
                    return;
                }
                row += deltaRow;
                col += deltaCol;
            }
        },
        [cursor, dir, cellAt, puzzle.rows, puzzle.cols]
    );

    const jumpWord = useCallback(
        (delta: number) => {
            const ordered = puzzle.words;
            const index = activeWord ? ordered.findIndex((word) => word.id === activeWord.id) : -1;
            for (let step = 1; step <= ordered.length; step++) {
                const next =
                    ordered[(index + delta * step + ordered.length * step) % ordered.length];
                if (solvedAt[next.id] === undefined) {
                    selectWord(next);
                    return;
                }
            }
        },
        [puzzle.words, activeWord, solvedAt, selectWord]
    );

    const useHint = useCallback(() => {
        if (hintsLeft <= 0) return;
        const word = activeWord;
        const target =
            word && solvedAt[word.id] === undefined
                ? word
                : puzzle.words.find((w) => solvedAt[w.id] === undefined);
        if (!target) return;
        const cells = cellsOf(target);
        const spot =
            cells.find((c) => !letters[cellKey(c.row, c.col)]) ||
            cells.find((c, i) => letters[cellKey(c.row, c.col)] !== target.answer[i]);
        if (!spot) return;
        const key = cellKey(spot.row, spot.col);
        const index = cells.findIndex((c) => c.row === spot.row && c.col === spot.col);
        const nextLetters = { ...letters, [key]: target.answer[index] };
        setLetters(nextLetters);
        setLocked((prev) => ({ ...prev, [key]: true }));
        hintsUsed.current += 1;
        setHintsLeft((prev) => prev - 1);
        setCursor(spot);
        setDir(target.dir);
        playSound('hint');
        evaluate(nextLetters, spot, letters);
    }, [hintsLeft, activeWord, solvedAt, puzzle.words, letters, evaluate]);

    // Veien ut av et dødpunkt: fyll det aktive ordet med fasit. Gratis i antall,
    // men det koster - ordet telles som avslørt og som et ord eleven strevde med,
    // og det gir ingen kombo.
    const revealWord = useCallback(() => {
        const word = activeWord;
        const target =
            word && solvedAt[word.id] === undefined
                ? word
                : puzzle.words.find((w) => solvedAt[w.id] === undefined);
        if (!target || solvedIds.current.has(target.id)) return;

        const cells = cellsOf(target);
        const nextLetters = { ...letters };
        const nextLocked = { ...locked };
        cells.forEach((c, i) => {
            const key = cellKey(c.row, c.col);
            nextLetters[key] = target.answer[i];
            nextLocked[key] = true;
        });
        setLetters(nextLetters);
        setLocked(nextLocked);
        setWrongCells({});
        setCursor(cells[0]);
        setDir(target.dir);

        struggled.current.add(target.id);
        revealedRef.current += 1;
        setRevealedCount(revealedRef.current);
        solvedIds.current.add(target.id);
        setSolvedAt((prev) => ({ ...prev, [target.id]: Object.keys(prev).length }));

        // En avsløring bryter kjeden. Kombo skal jaktes fram, ikke kjøpes.
        comboRef.current = 0;
        lastSolve.current = 0;
        setComboValue(0);
        setComboUntil(null);

        playSound('reveal');
        onSolve?.({ word: target, combo: 0, at: Date.now(), viaReveal: true });

        // Fasitbokstavene kan gjøre kryssende ord ferdige. De må plukkes opp,
        // ellers kunne brettet stå fullt og riktig uten å bli regnet som løst.
        // `silent` fordi et kryssende ord eleven ikke ser på ikke skal riste og
        // telle bom for bokstaver avsløringen nettopp la inn.
        for (const c of cells) evaluate(nextLetters, c, letters, true);

        emitFinish();
    }, [activeWord, solvedAt, puzzle.words, letters, locked, onSolve, evaluate, emitFinish]);

    const checkAll = useCallback(() => {
        // Uten en grense kunne et vanskelig brett brute-forces med «Sjekk»
        // mellom hvert forsøk - nettopp det autoCheck-av skulle hindre.
        if (checksLeft <= 0) return 0;
        const wrong: Record<string, number> = {};
        const stamp = Date.now();
        for (const word of puzzle.words) {
            if (solvedAt[word.id] !== undefined) continue;
            let hit = false;
            cellsOf(word).forEach((c, i) => {
                const key = cellKey(c.row, c.col);
                const typed = letters[key];
                if (typed && typed !== word.answer[i]) {
                    wrong[key] = stamp;
                    hit = true;
                }
            });
            if (hit) struggled.current.add(word.id);
        }
        setChecksLeft((prev) => Math.max(0, prev - 1));
        setWrongCells(wrong);
        if (Object.keys(wrong).length > 0) {
            mistakesRef.current += 1;
            setMistakes(mistakesRef.current);
            playSound('error');
        } else {
            playSound('hint');
        }
        window.setTimeout(() => setWrongCells({}), 1600);
        return Object.keys(wrong).length;
    }, [checksLeft, puzzle.words, solvedAt, letters]);

    // Øyeblikksbildet som lagres. Tiden leses fra ref-en, ikke fra state, slik at
    // sekundtikkene ikke trigger en ny skriving hvert sekund.
    const snapshot = useCallback(
        (): SavedGame => ({
            seed: puzzle.seed,
            letters,
            locked,
            solvedAt,
            hintsLeft,
            checksLeft,
            mistakes,
            elapsed: elapsedRef.current,
            revealed: revealedCount,
            struggled: Array.from(struggled.current),
        }),
        [puzzle.seed, letters, locked, solvedAt, hintsLeft, checksLeft, mistakes, revealedCount]
    );

    const snapshotRef = useRef(snapshot);
    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);

    // Et urørt brett er ikke verdt å gjenoppta - da ville eleven fått beskjed om
    // at «du var i gang» uten å ha skrevet en eneste bokstav
    const hasProgress = Object.keys(letters).length > 0 || solvedCount > 0;
    const hasProgressRef = useRef(hasProgress);
    useEffect(() => {
        hasProgressRef.current = hasProgress;
    }, [hasProgress]);

    // Debouncet lagring: eleven skriver fort, disken skal ikke måtte følge med
    useEffect(() => {
        if (!storageKey || finished || !hasProgress) return;
        const timer = window.setTimeout(() => writeSaved(storageKey, snapshot()), SAVE_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [storageKey, finished, hasProgress, snapshot]);

    // Bytter eleven fane eller låser Chromebooken, rekker debouncen kanskje ikke
    useEffect(() => {
        if (!storageKey) return;
        const onHide = () => {
            if (document.visibilityState !== 'hidden') return;
            if (finishedRef.current || !hasProgressRef.current) return;
            writeSaved(storageKey, snapshotRef.current());
        };
        document.addEventListener('visibilitychange', onHide);
        return () => document.removeEventListener('visibilitychange', onHide);
    }, [storageKey]);

    // Et ferdig brett skal ikke ligge igjen og be om å bli gjenopptatt
    useEffect(() => {
        if (!storageKey || !finished) return;
        clearSaved(storageKey);
    }, [storageKey, finished]);

    return {
        letters,
        locked,
        solvedAt,
        solvedCount,
        finished,
        allFilled,
        dir,
        cursor,
        activeWord,
        activeCells,
        hintsLeft,
        checksLeft,
        mistakes,
        revealedCount,
        resumed,
        comboValue,
        comboUntil,
        shake,
        wrongCells,
        elapsed,
        selectCell,
        selectWord,
        typeLetter,
        backspace,
        moveCursor,
        jumpWord,
        useHint,
        revealWord,
        checkAll,
        setDir,
    };
};

export type CrosswordState = ReturnType<typeof useCrossword>;
