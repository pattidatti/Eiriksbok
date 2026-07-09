// Fjernstyrbar progresjons-økonomi. Alle tall som styrer XP, nivåkurve,
// streak og mål ligger her - og kan overstyres uten ny deploy ved å legge
// verdier i public/content/config/progression.json (samme mønster som
// manifest/global-timeline). Slik kan læreren kjøre f.eks. en dobbel-XP-uke
// eller justere balanse fra innhold i stedet for kode.

import type { ActivityKind } from './types';

export interface StreakTuning {
    // XP som må tjenes på en dag for at dagen teller mot streaken.
    // Hindrer at én triviell handling («1 XP») holder streaken i live.
    minXp: number;
    // Ekstra XP-andel per dag i streaken (0.05 = +5 % per dag).
    multiplierPerDay: number;
    // Tak for multiplikatoren, målt i dager.
    multiplierCapDays: number;
    // Maks antall fryser eleven kan ha samtidig.
    freezeCap: number;
    // Tjen én fryser for hver N sammenhengende dager.
    freezeEveryDays: number;
}

export interface ProgressionConfig {
    // Full uttelling første gang en unik aktivitet fullføres.
    xpValues: Record<ActivityKind, number>;
    // Repetisjon gir denne andelen av full verdi (maks én gang per dag).
    repeatBonusFactor: number;
    repeatBonusMin: number;
    // Nivåkurve: kostnad(nivå) = levelBase + (nivå - 1) * levelStep.
    levelBase: number;
    levelStep: number;
    // Ekstra XP-andel ganget med score (0-1) på scorede aktiviteter.
    // 0.5 = full pott gir +50 %, halv pott gir +25 %.
    masteryBonusMax: number;
    // Engangsbonus når alle dagens mål er fullført.
    dailyGoalBonusXp: number;
    // Ekstra XP når dagens hemmelige «gnistmål» fullføres (variabel belønning).
    surpriseGoalBonusXp: number;
    // Mål for «Tjen X XP i dag»-strekkmålet.
    dailyXpTarget: number;
    streak: StreakTuning;
}

export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
    xpValues: {
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
        'philosophy-quest': 60,
        'comparison-task': 25,
    },
    repeatBonusFactor: 0.15,
    repeatBonusMin: 5,
    levelBase: 100,
    levelStep: 50,
    masteryBonusMax: 0.5,
    dailyGoalBonusXp: 50,
    surpriseGoalBonusXp: 40,
    dailyXpTarget: 80,
    streak: {
        minXp: 30,
        multiplierPerDay: 0.05,
        multiplierCapDays: 10,
        freezeCap: 2,
        freezeEveryDays: 7,
    },
};

let active: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG;

export const getProgressionConfig = (): ProgressionConfig => active;

// Hentes ved oppstart (ProgressBoot). Grunn sammenslåing: JSON-en kan
// overstyre enkeltfelt uten å gjenta hele objektet, og ukjente felt ignoreres.
// Nettfeil er ufarlig - da beholdes standardverdiene.
export const loadProgressionConfig = async (): Promise<void> => {
    try {
        const res = await fetch('/content/config/progression.json', { cache: 'no-cache' });
        if (!res.ok) return;
        const raw = (await res.json()) as Partial<ProgressionConfig>;
        active = {
            ...DEFAULT_PROGRESSION_CONFIG,
            ...raw,
            xpValues: { ...DEFAULT_PROGRESSION_CONFIG.xpValues, ...(raw.xpValues ?? {}) },
            streak: { ...DEFAULT_PROGRESSION_CONFIG.streak, ...(raw.streak ?? {}) },
        };
    } catch {
        // Behold standardverdiene - progresjon skal aldri stoppe på config.
    }
};
