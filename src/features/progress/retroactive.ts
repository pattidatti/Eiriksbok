// Engangsimport av fremdrift som fantes FØR progresjonssystemet ble lansert:
// læringsstier, daglige økter og virkemiddel-øvinger konverteres til XP,
// tellere og aktivitetsdager. Kjøres én gang fra ProgressBoot.

import { useLearningPathProfile } from '../../stores/useLearningPathProfile';
import { useReviewStore } from '../../stores/useReviewStore';
import { useVirkemiddelStore } from '../../stores/useVirkemiddelStore';
import { todayLocal } from '../../utils/reviewScheduler';
import { useProgressStore } from './useProgressStore';
import { useProgressToasts } from './useProgressToasts';
import { XP_VALUES } from './xp';
import type { DayStats, ProgressStreak } from './types';

const dayFromMs = (ms: number | null | undefined, fallback: string): string =>
    ms ? todayLocal(new Date(ms)) : fallback;

export const runRetroConversion = (): void => {
    const progress = useProgressStore.getState();
    if (progress.retroDone) return;

    const today = todayLocal();
    const existing = progress.firstCompletions;

    let totalXp = 0;
    const counters: Record<string, number> = {};
    const firstCompletions: Record<string, number> = {};
    const bestScores: Record<string, number> = {};
    const dayLog: Record<string, DayStats> = {};

    const bump = (counter: string, n = 1) => {
        counters[counter] = (counters[counter] ?? 0) + n;
    };
    const logDay = (day: string, xp: number) => {
        const prev = dayLog[day] ?? { xp: 0, activities: 0 };
        dayLog[day] = { xp: prev.xp + xp, activities: prev.activities + 1 };
    };
    const grant = (key: string, xp: number, at: number, day: string) => {
        if (existing[key] || firstCompletions[key]) return false;
        firstCompletions[key] = at;
        totalXp += xp;
        logDay(day, xp);
        return true;
    };

    // 1) Læringsstier: fullførte steg + fullførte stier
    const paths = useLearningPathProfile.getState().paths;
    for (const path of Object.values(paths)) {
        for (const stepId of path.completedStepIds) {
            const response = path.responses[stepId];
            const at = response?.completedAt ?? path.lastVisitedAt;
            const day = dayFromMs(at, today);
            const key = `path-step-completed:${path.pathId}/${stepId}`;
            if (grant(key, XP_VALUES['path-step-completed'], at, day)) {
                bump('pathStepsCompleted');
                if (response?.score !== undefined) {
                    bestScores[key] = response.score;
                }
            }
        }
        if (path.finishedAt) {
            const day = dayFromMs(path.finishedAt, today);
            const key = `path-completed:${path.pathId}`;
            if (grant(key, XP_VALUES['path-completed'], path.finishedAt, day)) {
                bump('pathsCompleted');
            }
        }
    }

    // 2) Daglige økter (spaced repetition)
    const review = useReviewStore.getState();
    for (const session of review.sessions) {
        const key = `review-session:${session.day}`;
        if (grant(key, XP_VALUES['review-session'], session.completedAt, session.day)) {
            bump('reviewSessions');
        }
    }

    // 3) Virkemiddel-øvinger (begge moduser; dag ukjent -> i dag)
    const virkemidler = useVirkemiddelStore.getState();
    const allDeviceProgress = [
        ...Object.entries(virkemidler.progress),
        ...Object.entries(virkemidler.applyProgress),
    ];
    for (const [deviceId, device] of allDeviceProgress) {
        for (const exerciseId of device.completedExercises) {
            const key = `virkemiddel-exercise:${deviceId}/${exerciseId}`;
            if (grant(key, XP_VALUES['virkemiddel-exercise'], Date.now(), today)) {
                bump('virkemiddelExercises');
            }
        }
    }

    // 4) Retorikk-nivåer (lagret rett i localStorage av RhetoricGamePage)
    try {
        const raw = localStorage.getItem('rhetoric_completed_levels');
        const levels: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(levels)) {
            for (const levelId of levels) {
                if (typeof levelId !== 'string') continue;
                const key = `practice-game:retorikk/${levelId}`;
                if (grant(key, XP_VALUES['practice-game'], Date.now(), today)) {
                    bump('practiceGames');
                }
            }
        }
    } catch {
        // Ugyldig JSON i gammel nøkkel - hopp over
    }

    // Streak: adopter review-streaken hvis den er bedre enn dagens
    const streak: ProgressStreak = {
        current: review.streak.current,
        best: review.streak.best,
        lastActiveDay: review.streak.lastSessionDay,
    };

    progress.applyRetroData({
        events: [],
        counters,
        firstCompletions,
        bestScores,
        dayLog,
        totalXp,
        streak,
    });

    if (totalXp > 0) {
        const badgeCount = Object.keys(useProgressStore.getState().badges).length;
        useProgressToasts.getState().push({ type: 'retro', xp: totalXp, badgeCount });
    }
};
