// Varig småstatistikk for Kunnskapsløypa (localStorage, chronoStats-mønsteret)
// + registrering i «Min læring» ved fullført løype.

import type { Difficulty, SubjectChoice } from './types';

const STATS_KEY = 'loype_stats_v1';

export interface LoypeStats {
    totalRuns: number;
    completedRuns: number;
    bestCorrect: number;
    bestXp: number;
    lastPlayed: number;
}

const EMPTY: LoypeStats = {
    totalRuns: 0,
    completedRuns: 0,
    bestCorrect: 0,
    bestXp: 0,
    lastPlayed: 0,
};

const read = (): LoypeStats => {
    if (typeof window === 'undefined') return { ...EMPTY };
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return { ...EMPTY };
        return { ...EMPTY, ...(JSON.parse(raw) as Partial<LoypeStats>) };
    } catch {
        return { ...EMPTY };
    }
};

const write = (stats: LoypeStats) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        /* kvote eller deaktivert - ignorer stille */
    }
};

export const getLoypeStats = (): LoypeStats => read();

export interface RunResult {
    won: boolean;
    correct: number;
    answered: number;
    xp: number;
    subjectId: SubjectChoice;
    difficulty: Difficulty;
}

export const recordRunEnd = (result: RunResult) => {
    const s = read();
    s.totalRuns += 1;
    s.lastPlayed = Date.now();
    if (result.won) {
        s.completedRuns += 1;
        s.bestCorrect = Math.max(s.bestCorrect, result.correct);
        s.bestXp = Math.max(s.bestXp, result.xp);
    }
    write(s);

    // «Min læring»: kun fullførte løyper teller - det gjør bossen til målet
    if (result.won) {
        import('../../../features/progress/useProgressStore').then(({ useProgressStore }) => {
            useProgressStore.getState().recordActivity({
                kind: 'practice-game',
                activityId: `loype/${result.subjectId}/${result.difficulty}`,
                subjectId: result.subjectId === 'blandet' ? undefined : result.subjectId,
                score: result.answered > 0 ? result.correct / result.answered : undefined,
                title: 'Kunnskapsløypa',
            });
        });
    }
};
