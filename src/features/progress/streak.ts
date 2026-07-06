// Streak-logikk: en streak er et mål for jevn innsats, ikke bare oppmøte.
// Ren logikk - ingen React, ingen store-imports.
//
// Tre ting bor her:
//   1. streakMultiplier  - hvor mye ekstra XP en levende streak gir.
//   2. advanceStreakForEffortDay - rykker streaken fram for en dag med reell
//      innsats, med fryser som dekker korte fravær.
//   3. isStreakAlive     - er streaken fortsatt i live (i dag eller i går)?

import { addDays } from '../../utils/reviewScheduler';
import { getProgressionConfig } from './progressionConfig';
import type { ProgressStreak } from './types';

// XP-multiplikator for en streak som er `days` dager lang akkurat nå.
export const streakMultiplier = (days: number): number => {
    const { multiplierPerDay, multiplierCapDays } = getProgressionConfig().streak;
    return 1 + Math.min(Math.max(days, 0), multiplierCapDays) * multiplierPerDay;
};

// Er streaken fortsatt i live? (aktiv i dag eller i går)
export const isStreakAlive = (streak: ProgressStreak, today: string): boolean =>
    streak.lastActiveDay !== null &&
    (streak.lastActiveDay >= today || addDays(streak.lastActiveDay, 1) === today);

// Antall kalenderdager fra a til b (b >= a). Sammenhengende dager => 1.
const daysBetween = (a: string, b: string): number => {
    let n = 0;
    let cur = a;
    while (cur < b && n < 400) {
        cur = addDays(cur, 1);
        n++;
    }
    return n;
};

export interface StreakAdvance {
    streak: ProgressStreak;
    // Sant hvis en fryser reddet streaken over et fravær denne gangen.
    frozen: boolean;
}

// Rykk streaken fram én dag med reell innsats. Kalles først når dagen faktisk
// har krysset innsats-terskelen (se recordActivity), ikke ved hver handling.
//
// Regler:
//   - Første dag noensinne  -> streak = 1.
//   - Allerede talt i dag    -> uendret.
//   - Dagen etter forrige    -> +1.
//   - Kort fravær + fryser    -> fryser dekker de tapte dagene, streak +1.
//   - Lengre fravær          -> streak nullstilles til 1 (mild: fryser mistes ikke).
//
// Man tjener en fryser for hver `freezeEveryDays` sammenhengende dager (opp
// til `freezeCap`), så trofaste elever bygger opp en buffer mot uflaks.
export const advanceStreakForEffortDay = (
    streak: ProgressStreak,
    today: string
): StreakAdvance => {
    const cfg = getProgressionConfig().streak;
    const { current, best, lastActiveDay } = streak;
    const freezes = streak.freezes ?? 0;

    if (lastActiveDay !== null && lastActiveDay >= today) {
        // Allerede registrert i dag (eller nyere data fra en annen enhet).
        return { streak, frozen: false };
    }

    let next: number;
    let nextFreezes = freezes;
    let frozen = false;

    if (lastActiveDay === null) {
        next = 1;
    } else {
        const gap = daysBetween(lastActiveDay, today); // 1 = sammenhengende
        const missed = gap - 1;
        if (missed <= 0) {
            next = current + 1;
        } else if (freezes >= missed) {
            // Fryser dekker fraværet - streaken lever videre.
            next = current + 1;
            nextFreezes = freezes - missed;
            frozen = true;
        } else {
            next = 1;
        }
    }

    // Tjen en fryser når streaken passerer en hel «uke» (freezeEveryDays).
    if (next > current && next % cfg.freezeEveryDays === 0 && nextFreezes < cfg.freezeCap) {
        nextFreezes += 1;
    }

    return {
        streak: {
            current: next,
            best: Math.max(best, next),
            lastActiveDay: today,
            freezes: nextFreezes,
        },
        frozen,
    };
};
