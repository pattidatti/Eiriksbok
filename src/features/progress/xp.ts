// XP-økonomien: hvor mye hver aktivitet gir, og nivåkurven.
// Ren logikk - ingen React. Tallene leses fra progressionConfig, som kan
// fjernstyres via public/content/config/progression.json.

import type { ActivityKind } from './types';
import { getProgressionConfig, DEFAULT_PROGRESSION_CONFIG } from './progressionConfig';

// Standardtabellen (uten fjernstyring) - brukes av engangs-retroimporten,
// der historiske verdier skal være stabile.
export const XP_VALUES: Record<ActivityKind, number> = DEFAULT_PROGRESSION_CONFIG.xpValues;

// Aktiv full-verdi (kan være fjernstyrt).
export const xpValueFor = (kind: ActivityKind): number => getProgressionConfig().xpValues[kind];

// Repetisjon gir en liten bonus, maks én gang per dag per aktivitet -
// belønner øving uten at systemet kan grindes.
export const repeatBonus = (kind: ActivityKind): number => {
    const cfg = getProgressionConfig();
    return Math.max(cfg.repeatBonusMin, Math.round(xpValueFor(kind) * cfg.repeatBonusFactor));
};

// Mestringsbonus: scorede aktiviteter belønner å gjøre det godt, ikke bare å
// møte opp. Full pott (score 1) gir størst påslag, svakt resultat gir lite.
// Uten score (kind uten resultat) er multiplikatoren 1.
export const masteryMultiplier = (score?: number): number => {
    if (score === undefined) return 1;
    const clamped = Math.max(0, Math.min(1, score));
    return 1 + getProgressionConfig().masteryBonusMax * clamped;
};

// Kostnad for å gå fra nivå L til L+1. Starter lavt så de første nivåene
// kommer raskt, og vokser lineært etterpå.
const levelCost = (level: number): number => {
    const cfg = getProgressionConfig();
    return cfg.levelBase + (level - 1) * cfg.levelStep;
};

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
