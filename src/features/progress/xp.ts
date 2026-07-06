// XP-økonomien: hvor mye hver aktivitet gir, og nivåkurven.
// Ren logikk - ingen React, ingen store-imports.

import type { ActivityKind } from './types';

// Full uttelling første gang en unik aktivitet fullføres
export const XP_VALUES: Record<ActivityKind, number> = {
    'article-read': 40,
    'quiz-completed': 30,
    'path-step-completed': 25,
    'path-completed': 150,
    'review-session': 30,
    'minigame-played': 60,
    'detective-solved': 100,
    'scenario-completed': 80,
    'practice-game': 20,
    'virkemiddel-exercise': 10,
    'microgame-played': 15,
};

// Repetisjon gir en liten bonus, maks én gang per dag per aktivitet -
// belønner øving uten at systemet kan grindes
export const repeatBonus = (kind: ActivityKind): number =>
    Math.max(5, Math.round(XP_VALUES[kind] * 0.15));

// Kostnad for å gå fra nivå L til L+1. Starter lavt så de første nivåene
// kommer raskt, og vokser lineært etterpå.
const levelCost = (level: number): number => 100 + (level - 1) * 50;

// Total-XP-terskelen der et nivå begynner (nivå 1 = 0 XP)
export const xpForLevel = (level: number): number => {
    let sum = 0;
    for (let l = 1; l < level; l++) sum += levelCost(l);
    return sum;
};

export const levelForXp = (totalXp: number): number => {
    let level = 1;
    let remaining = totalXp;
    while (remaining >= levelCost(level)) {
        remaining -= levelCost(level);
        level++;
    }
    return level;
};

export interface LevelProgress {
    level: number;
    // XP opptjent innenfor gjeldende nivå
    into: number;
    // XP som trengs for å nå neste nivå
    needed: number;
}

export const levelProgress = (totalXp: number): LevelProgress => {
    const level = levelForXp(totalXp);
    const into = totalXp - xpForLevel(level);
    return { level, into, needed: levelCost(level) };
};
