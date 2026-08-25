// Spillogikken i Kryssord: markør, skriving, hint, sjekk og løste ord.
// Komponentene under er rene visninger over denne tilstanden.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Direction, DifficultyPreset, PlacedWord, Puzzle } from './types';
import { cellKey } from './types';
import { playSound } from './sfx';

export interface Cursor {
    row: number;
    col: number;
}

// To ord løst innen dette vinduet teller som kombo
const COMBO_WINDOW_MS = 25000;

export interface SolveEvent {
    word: PlacedWord;
    combo: number;
    at: number;
}

export interface FinishSummary {
    elapsedSeconds: number;
    hintsUsed: number;
    mistakes: number;
}

// Feiringen hører hjemme der handlingen skjer - i tastetrykket, ikke i en
// effekt som våkner en render for sent.
export interface CrosswordCallbacks {
    onSolve?: (event: SolveEvent) => void;
    onFinish?: (summary: FinishSummary) => void;
}

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
    { onSolve, onFinish }: CrosswordCallbacks = {}
) => {
    const [letters, setLetters] = useState<Record<string, string>>({});
    const [locked, setLocked] = useState<Record<string, boolean>>({});
    const [solvedAt, setSolvedAt] = useState<Record<string, number>>({});
    const [dir, setDir] = useState<Direction>('across');
    const [cursor, setCursor] = useState<Cursor>(() => ({
        row: puzzle.words[0].row,
        col: puzzle.words[0].col,
    }));
    const [hintsLeft, setHintsLeft] = useState(preset.hints);
    const [mistakes, setMistakes] = useState(0);
    const [shake, setShake] = useState<{ id: string; token: number } | null>(null);
    const [wrongCells, setWrongCells] = useState<Record<string, number>>({});
    const [elapsed, setElapsed] = useState(0);

    const startedAt = useRef(0);
    const lastSolve = useRef(0);
    const comboRef = useRef(0);
    const shakeToken = useRef(0);
    // Tellere vi trenger i selve løsningsøyeblikket, før React har rukket å
    // gi oss ny state
    const solvedIds = useRef<Set<string>>(new Set());
    const hintsUsed = useRef(0);
    const mistakesRef = useRef(0);

    const wordById = useMemo(() => {
        const map: Record<string, PlacedWord> = {};
        for (const word of puzzle.words) map[word.id] = word;
        return map;
    }, [puzzle]);

    const solvedCount = Object.keys(solvedAt).length;
    const finished = solvedCount === puzzle.words.length;

    // Klokka starter når brettet er på skjermen, ikke mens React rendrer
    useEffect(() => {
        startedAt.current = Date.now();
    }, []);

    useEffect(() => {
        if (finished) return;
        const timer = window.setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [finished]);

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

    // Ruter som ikke kan skrives over: hint-bokstaver og alt som hører til et
    // ferdig løst ord. Uten dette kunne et grønt ord få feil bokstav i seg.
    const frozen = useMemo(() => {
        const set = new Set<string>(Object.keys(locked));
        for (const word of puzzle.words) {
            if (solvedAt[word.id] === undefined) continue;
            for (const cell of cellsOf(word)) set.add(cellKey(cell.row, cell.col));
        }
        return set;
    }, [locked, solvedAt, puzzle.words]);

    // Sjekker om noen av ordene gjennom en rute nettopp ble ferdige eller feil
    const evaluate = useCallback(
        (nextLetters: Record<string, string>, touched: Cursor) => {
            const cell = cellAt(touched.row, touched.col);
            if (!cell) return;
            const candidates = [cell.acrossId, cell.downId]
                .filter((id): id is string => Boolean(id))
                .map((id) => wordById[id])
                .filter((word) => solvedAt[word.id] === undefined);

            for (const word of candidates) {
                const cells = cellsOf(word);
                const typed = cells.map((c) => nextLetters[cellKey(c.row, c.col)] || '');
                if (typed.some((letter) => !letter)) continue;

                if (typed.join('') === word.answer) {
                    const now = Date.now();
                    comboRef.current =
                        now - lastSolve.current < COMBO_WINDOW_MS ? comboRef.current + 1 : 1;
                    lastSolve.current = now;
                    solvedIds.current.add(word.id);
                    setSolvedAt((prev) => ({ ...prev, [word.id]: Object.keys(prev).length }));
                    playSound('solve', comboRef.current - 1);
                    onSolve?.({ word, combo: comboRef.current, at: now });
                    if (solvedIds.current.size === puzzle.words.length) {
                        onFinish?.({
                            elapsedSeconds: Math.floor((now - startedAt.current) / 1000),
                            hintsUsed: hintsUsed.current,
                            mistakes: mistakesRef.current,
                        });
                    }
                } else if (preset.autoCheck) {
                    // Fullt utfylt, men feil. På lett og middels sier vi fra med
                    // en gang - da lærer eleven mens ordet er ferskt.
                    shakeToken.current += 1;
                    setShake({ id: word.id, token: shakeToken.current });
                    mistakesRef.current += 1;
                    setMistakes(mistakesRef.current);
                    playSound('error');
                }
            }
        },
        [cellAt, wordById, solvedAt, preset.autoCheck, puzzle.words.length, onSolve, onFinish]
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
            evaluate(nextLetters, cursor);
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
        evaluate(nextLetters, spot);
    }, [hintsLeft, activeWord, solvedAt, puzzle.words, letters, evaluate]);

    const checkAll = useCallback(() => {
        const wrong: Record<string, number> = {};
        const stamp = Date.now();
        for (const word of puzzle.words) {
            if (solvedAt[word.id] !== undefined) continue;
            cellsOf(word).forEach((c, i) => {
                const key = cellKey(c.row, c.col);
                const typed = letters[key];
                if (typed && typed !== word.answer[i]) wrong[key] = stamp;
            });
        }
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
    }, [puzzle.words, solvedAt, letters]);

    return {
        letters,
        locked,
        solvedAt,
        solvedCount,
        finished,
        dir,
        cursor,
        activeWord,
        activeCells,
        hintsLeft,
        mistakes,
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
        checkAll,
        setDir,
    };
};

export type CrosswordState = ReturnType<typeof useCrossword>;
