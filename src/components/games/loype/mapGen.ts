// Seedet kartgenerering for Kunnskapsløypa. Samme seed + vanskelighet gir
// alltid samme kart. Rad 0 er start-valgene, siste rad er bossen.

import { mulberry32 } from '../../../utils/reviewScheduler';
import type { Difficulty, MapNode } from './types';
import { DIFFICULTY_CONFIG } from './types';

const pickRowCols = (rng: () => number): number[] => {
    if (rng() < 0.4) return [0, 1, 2];
    const twoOptions: number[][] = [
        [0, 1],
        [1, 2],
        [0, 2],
    ];
    return twoOptions[Math.floor(rng() * twoOptions.length)];
};

export const generateMap = (difficulty: Difficulty, seed: number): MapNode[] => {
    const rng = mulberry32(seed);
    const rows = DIFFICULTY_CONFIG[difficulty].rows;
    const byRow: MapNode[][] = [];

    for (let row = 0; row < rows; row++) {
        const cols = row === rows - 1 ? [1] : pickRowCols(rng);
        byRow.push(
            cols.map((col) => ({
                id: `n${row}-${col}`,
                row,
                col,
                type: row === rows - 1 ? ('boss' as const) : ('challenge' as const),
                edges: [] as string[],
            }))
        );
    }

    // Nodetyper: garantert hvile nest sist, én belønning midt i, 15 % elite
    // fra rad 2 (maks 2 per løype). Rad 0-1 er alltid vanlige utfordringer.
    const restRow = byRow[rows - 2];
    restRow[Math.floor(rng() * restRow.length)].type = 'rest';

    const rewardRow = byRow[Math.floor((rows - 1) / 2)];
    const rewardCandidates = rewardRow.filter((n) => n.type === 'challenge');
    if (rewardCandidates.length > 0) {
        rewardCandidates[Math.floor(rng() * rewardCandidates.length)].type = 'reward';
    }

    let elites = 0;
    for (let row = 2; row < rows - 2 && elites < 2; row++) {
        for (const node of byRow[row]) {
            if (node.type === 'challenge' && rng() < 0.15 && elites < 2) {
                node.type = 'elite';
                elites++;
            }
        }
    }

    // Kanter: nærmeste nabo + av og til én til (|kolonneavstand| <= 1)
    for (let row = 0; row < rows - 1; row++) {
        const next = byRow[row + 1];
        for (const node of byRow[row]) {
            let candidates = next.filter((n) => Math.abs(n.col - node.col) <= 1);
            if (candidates.length === 0) {
                // Ingen nabo innen rekkevidde - koble til nærmeste
                candidates = [...next].sort(
                    (a, b) => Math.abs(a.col - node.col) - Math.abs(b.col - node.col)
                );
                candidates = [candidates[0]];
            }
            const sorted = [...candidates].sort(
                (a, b) => Math.abs(a.col - node.col) - Math.abs(b.col - node.col)
            );
            node.edges.push(sorted[0].id);
            if (sorted.length > 1 && rng() < 0.45) {
                node.edges.push(sorted[1].id);
            }
        }

        // Fjern kryssende kanter der begge nodene beholder minst én utkant
        const rowSorted = [...byRow[row]].sort((a, b) => a.col - b.col);
        const colOf = (id: string) => next.find((n) => n.id === id)!.col;
        for (let i = 0; i < rowSorted.length - 1; i++) {
            const a = rowSorted[i];
            const b = rowSorted[i + 1];
            const aMax = Math.max(...a.edges.map(colOf));
            const bMin = Math.min(...b.edges.map(colOf));
            if (aMax > bMin) {
                if (a.edges.length > 1) {
                    a.edges = a.edges.filter((id) => colOf(id) !== aMax);
                } else if (b.edges.length > 1) {
                    b.edges = b.edges.filter((id) => colOf(id) !== bMin);
                }
            }
        }

        // Alle noder i neste rad skal kunne nås
        for (const target of next) {
            const hasIncoming = byRow[row].some((n) => n.edges.includes(target.id));
            if (!hasIncoming) {
                const nearest = [...byRow[row]].sort(
                    (a, b) => Math.abs(a.col - target.col) - Math.abs(b.col - target.col)
                )[0];
                nearest.edges.push(target.id);
            }
        }
    }

    return byRow.flat();
};
