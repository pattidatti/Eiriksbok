// Selve rutenettet. Alt visuelt liv i spillet bor her: bokstaver som spretter
// inn, ord som ruller over til gull når de er riktige, og ruter som rister når
// de ikke er det.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Puzzle } from './types';
import { cellKey } from './types';
import type { CrosswordState } from './useCrossword';

interface CellProps {
    row: number;
    col: number;
    letter: string;
    number?: number;
    size: number;
    inActiveWord: boolean;
    isCursor: boolean;
    isSolved: boolean;
    solveDelay: number;
    isLocked: boolean;
    isWrong: boolean;
    shakeToken: number;
    onSelect: (row: number, col: number) => void;
}

const CellView = React.memo(
    ({
        row,
        col,
        letter,
        number,
        size,
        inActiveWord,
        isCursor,
        isSolved,
        solveDelay,
        isLocked,
        isWrong,
        shakeToken,
        onSelect,
    }: CellProps) => {
        const background = isWrong
            ? 'rgb(254 226 226)'
            : isSolved
              ? 'rgb(236 253 245)'
              : isCursor
                ? 'rgb(255 255 255)'
                : inActiveWord
                  ? 'rgb(238 242 255)'
                  : 'rgb(255 255 255)';

        const borderColor = isWrong
            ? 'rgb(244 63 94)'
            : isSolved
              ? 'rgb(110 231 183)'
              : isCursor
                ? 'rgb(79 70 229)'
                : inActiveWord
                  ? 'rgb(165 180 252)'
                  : 'rgb(203 213 225)';

        const textColor = isWrong
            ? 'rgb(190 18 60)'
            : isSolved
              ? 'rgb(4 120 87)'
              : isLocked
                ? 'rgb(180 83 9)'
                : 'rgb(30 41 59)';

        return (
            <motion.button
                type="button"
                onClick={() => onSelect(row, col)}
                aria-label={`Rute rad ${row + 1} kolonne ${col + 1}`}
                className="relative flex touch-manipulation items-center justify-center rounded-[18%] font-bold uppercase select-none"
                style={{
                    width: size,
                    height: size,
                    fontSize: size * 0.55,
                    lineHeight: 1,
                    borderWidth: Math.max(1, Math.round(size * 0.045)),
                    borderStyle: 'solid',
                    color: textColor,
                }}
                animate={{
                    backgroundColor: background,
                    borderColor,
                    scale: isCursor ? 1.06 : 1,
                    boxShadow: isCursor
                        ? '0 0 0 6px rgba(99,102,241,0.18), 0 8px 20px -6px rgba(79,70,229,0.45)'
                        : isSolved
                          ? '0 4px 10px -6px rgba(16,185,129,0.55)'
                          : '0 1px 2px rgba(15,23,42,0.05)',
                    x: isWrong ? [0, -5, 5, -4, 4, -2, 0] : 0,
                }}
                transition={{
                    backgroundColor: { duration: 0.22 },
                    borderColor: { duration: 0.22 },
                    scale: { type: 'spring', stiffness: 520, damping: 22 },
                    x: { duration: 0.45, ease: 'easeInOut' },
                }}
                key={`${row}-${col}-${shakeToken}`}
            >
                {number !== undefined && (
                    <span
                        className="absolute font-semibold text-slate-400"
                        style={{
                            top: size * 0.04,
                            left: size * 0.1,
                            fontSize: Math.max(8, size * 0.26),
                        }}
                    >
                        {number}
                    </span>
                )}
                {letter && (
                    <motion.span
                        key={letter}
                        initial={{ scale: 0.3, opacity: 0, y: -4 }}
                        animate={
                            isSolved
                                ? { scale: [1, 1.28, 1], opacity: 1, y: 0, rotateX: [0, 360] }
                                : { scale: 1, opacity: 1, y: 0 }
                        }
                        transition={
                            isSolved
                                ? { duration: 0.55, delay: solveDelay, ease: 'easeOut' }
                                : { type: 'spring', stiffness: 700, damping: 20 }
                        }
                        style={{ display: 'block' }}
                    >
                        {letter}
                    </motion.span>
                )}
            </motion.button>
        );
    }
);
CellView.displayName = 'CellView';

interface BoardProps {
    puzzle: Puzzle;
    state: CrosswordState;
    boardRef: React.RefObject<HTMLDivElement | null>;
    onCellSize: (size: number) => void;
}

export const CrosswordBoard = ({ puzzle, state, boardRef, onCellSize }: BoardProps) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [cellSize, setCellSize] = useState(38);

    // Rutene skal alltid få plass, også på en Chromebook i liggende 1366x768.
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const measure = () => {
            const { width, height } = wrapper.getBoundingClientRect();
            const gap = 3;
            const byWidth = (width - gap * (puzzle.cols - 1)) / puzzle.cols;
            const byHeight = (height - gap * (puzzle.rows - 1)) / puzzle.rows;
            const next = Math.max(22, Math.min(56, Math.floor(Math.min(byWidth, byHeight))));
            setCellSize(next);
            onCellSize(next);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [puzzle.rows, puzzle.cols, onCellSize]);

    const activeKeys = useMemo(() => {
        const set = new Set<string>();
        state.activeCells.forEach((cell) => set.add(cellKey(cell.row, cell.col)));
        return set;
    }, [state.activeCells]);

    const solvedCells = useMemo(() => {
        // Hvor mange steg ut i ordet ruten ligger - brukes til bølgen som
        // sveiper gjennom ordet i det du løser det.
        const map: Record<string, number> = {};
        for (const word of puzzle.words) {
            if (state.solvedAt[word.id] === undefined) continue;
            const dr = word.dir === 'down' ? 1 : 0;
            const dc = word.dir === 'across' ? 1 : 0;
            for (let k = 0; k < word.answer.length; k++) {
                const key = cellKey(word.row + dr * k, word.col + dc * k);
                map[key] = Math.min(map[key] ?? Infinity, k);
            }
        }
        return map;
    }, [puzzle.words, state.solvedAt]);

    const shakeKeys = useMemo(() => {
        if (!state.shake) return new Set<string>();
        const word = puzzle.words.find((candidate) => candidate.id === state.shake?.id);
        if (!word) return new Set<string>();
        const dr = word.dir === 'down' ? 1 : 0;
        const dc = word.dir === 'across' ? 1 : 0;
        const set = new Set<string>();
        for (let k = 0; k < word.answer.length; k++)
            set.add(cellKey(word.row + dr * k, word.col + dc * k));
        return set;
    }, [state.shake, puzzle.words]);

    const handleSelect = useCallback(
        (row: number, col: number) => state.selectCell(row, col),
        [state]
    );

    const rows = Array.from({ length: puzzle.rows }, (_, r) => r);
    const cols = Array.from({ length: puzzle.cols }, (_, c) => c);

    return (
        <div ref={wrapperRef} className="flex min-h-0 flex-1 items-center justify-center">
            <div
                ref={boardRef}
                className="grid rounded-2xl"
                style={{
                    gridTemplateColumns: `repeat(${puzzle.cols}, ${cellSize}px)`,
                    gridAutoRows: `${cellSize}px`,
                    gap: 3,
                }}
            >
                {rows.map((row) =>
                    cols.map((col) => {
                        const key = cellKey(row, col);
                        const cell = puzzle.cells[key];
                        if (!cell)
                            return <div key={key} style={{ width: cellSize, height: cellSize }} />;
                        const isWrong = Boolean(state.wrongCells[key]) || shakeKeys.has(key);
                        return (
                            <CellView
                                key={key}
                                row={row}
                                col={col}
                                letter={state.letters[key] || ''}
                                number={cell.number}
                                size={cellSize}
                                inActiveWord={activeKeys.has(key)}
                                isCursor={state.cursor.row === row && state.cursor.col === col}
                                isSolved={solvedCells[key] !== undefined}
                                solveDelay={(solvedCells[key] ?? 0) * 0.05}
                                isLocked={Boolean(state.locked[key])}
                                isWrong={isWrong}
                                shakeToken={isWrong ? (state.shake?.token ?? 1) : 0}
                                onSelect={handleSelect}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
