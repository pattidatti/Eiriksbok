import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DetectiveClue, DetectiveSuspect } from './types';

interface TheoryBalanceProps {
    suspects: DetectiveSuspect[];
    collectedClues: DetectiveClue[];
}

interface TheoryScore {
    suspect: DetectiveSuspect;
    score: number;
}

function calculateScores(
    suspects: DetectiveSuspect[],
    clues: DetectiveClue[]
): { scores: TheoryScore[]; max: number } {
    const scoreMap = new Map<string, number>();
    suspects.forEach((s) => scoreMap.set(s.id, 0));

    for (const clue of clues) {
        const weight = clue.weight ?? 1;
        for (const id of clue.supports ?? []) {
            scoreMap.set(id, (scoreMap.get(id) ?? 0) + weight);
        }
    }

    const scores: TheoryScore[] = suspects.map((s) => ({
        suspect: s,
        score: scoreMap.get(s.id) ?? 0,
    }));
    const max = Math.max(1, ...scores.map((s) => s.score));
    return { scores, max };
}

export const TheoryBalance: React.FC<TheoryBalanceProps> = ({ suspects, collectedClues }) => {
    const { scores, max } = useMemo(
        () => calculateScores(suspects, collectedClues),
        [suspects, collectedClues]
    );

    if (suspects.length === 0) return null;

    return (
        <div>
            <p className="text-xs text-[var(--det-text-muted)] mb-2">
                Bevisene styrker teoriene du har funnet støtte for.
            </p>
            <div
                className="grid gap-2"
                style={{
                    gridTemplateColumns: `repeat(${Math.min(scores.length, 3)}, minmax(0, 1fr))`,
                }}
            >
                {scores.map(({ suspect, score }) => {
                    const fillPct = max > 0 ? (score / max) * 100 : 0;
                    const color = suspect.color ?? 'var(--det-accent)';
                    return (
                        <div
                            key={suspect.id}
                            className="rounded-lg border border-[var(--det-border)] bg-[var(--det-bg)] p-2 flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-lg leading-none flex-shrink-0">
                                    {suspect.icon}
                                </span>
                                <span className="text-sm font-bold text-[var(--det-text)] truncate">
                                    {suspect.name}
                                </span>
                                <motion.span
                                    key={score}
                                    initial={{ scale: 1.4 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                                    className="ml-auto text-base font-bold tabular-nums"
                                    style={{ color }}
                                >
                                    {score}
                                </motion.span>
                            </div>

                            <div className="relative h-2 rounded-full bg-[var(--det-elevated)] overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fillPct}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ background: color, opacity: score === 0 ? 0.25 : 0.9 }}
                                />
                            </div>

                            <p className="text-xs text-[var(--det-text-muted)] leading-tight line-clamp-2">
                                {suspect.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
