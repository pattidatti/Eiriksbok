// Sentral progresjonsstore for «Min læring». Alle moduler i appen kaller
// recordActivity() når eleven fullfører noe; storen eier XP, streak, badges,
// tellere og hendelseslogg. localStorage-persist som de andre storene;
// speiling til Firebase skjer i sync.ts når en synk-kode er aktiv.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, todayLocal } from '../../utils/reviewScheduler';
import { newlyUnlockedTiers, badgeTierKey } from './badges';
import { levelForXp, repeatBonus, XP_VALUES } from './xp';
import { DEFAULT_AVATAR_ID } from './avatars';
import { useProgressToasts } from './useProgressToasts';
import type {
    ActivityEvent,
    ActivityInput,
    DailyGoal,
    DayStats,
    ProgressProfile,
    ProgressStreak,
    RecordResult,
    SyncState,
} from './types';

const STORAGE_KEY = 'progress-store-v1';
const MAX_EVENTS = 200;
const MAX_DAY_LOG = 400;

// Feltene som persisteres og synkes - holdes samlet så sync.ts kan
// serialisere/hydrere nøyaktig det samme som localStorage.
export interface ProgressData {
    profile: ProgressProfile;
    totalXp: number;
    streak: ProgressStreak;
    events: ActivityEvent[];
    // 'kind:activityId' -> epoch ms for første fullføring
    firstCompletions: Record<string, number>;
    // 'kind:activityId' -> siste dag ('YYYY-MM-DD') repetisjonsbonus ble gitt
    lastBonusDay: Record<string, string>;
    // 'kind:activityId' -> beste normaliserte score (0-1)
    bestScores: Record<string, number>;
    // dag -> aggregert XP/aktiviteter (aktivitetskalender og grafer)
    dayLog: Record<string, DayStats>;
    // badge-grad-nøkkel ('leseren:gull') -> epoch ms opplåst
    badges: Record<string, number>;
    counters: Record<string, number>;
    goals: { day: string; items: DailyGoal[] } | null;
    checkedGoalIds: string[];
    retroDone: boolean;
    sync: SyncState;
    updatedAt: number;
}

interface ProgressState extends ProgressData {
    recordActivity: (input: ActivityInput) => RecordResult;
    setNickname: (nickname: string) => void;
    setAvatar: (avatarId: string) => void;
    setDailyGoals: (day: string, items: DailyGoal[]) => void;
    toggleGoal: (goalId: string) => void;
    applyRetroData: (data: {
        events: ActivityEvent[];
        counters: Record<string, number>;
        firstCompletions: Record<string, number>;
        bestScores: Record<string, number>;
        dayLog: Record<string, DayStats>;
        totalXp: number;
        streak: ProgressStreak;
    }) => void;
    setSyncCode: (code: string | null) => void;
    markSynced: (at: number) => void;
    hydrateFromRemote: (data: ProgressData) => void;
    resetAll: () => void;
}

const emptyStreak: ProgressStreak = { current: 0, best: 0, lastActiveDay: null };

const initialData = (): ProgressData => ({
    profile: { nickname: null, avatarId: DEFAULT_AVATAR_ID },
    totalXp: 0,
    streak: emptyStreak,
    events: [],
    firstCompletions: {},
    lastBonusDay: {},
    bestScores: {},
    dayLog: {},
    badges: {},
    counters: {},
    goals: null,
    checkedGoalIds: [],
    retroDone: false,
    sync: { code: null, lastSyncedAt: null },
    updatedAt: 0,
});

// Samme streak-logikk som review-storen: samme dag = uendret,
// dagen etter = +1, ellers tilbake til 1
export const advanceStreak = (streak: ProgressStreak, today: string): ProgressStreak => {
    const { current, best, lastActiveDay } = streak;
    let next = current;
    if (lastActiveDay === null) {
        next = 1;
    } else if (lastActiveDay >= today) {
        next = current;
    } else if (addDays(lastActiveDay, 1) === today) {
        next = current + 1;
    } else {
        next = 1;
    }
    return {
        current: next,
        best: Math.max(best, next),
        lastActiveDay: lastActiveDay && lastActiveDay > today ? lastActiveDay : today,
    };
};

// Er streaken fortsatt i live i dag? (aktiv i dag eller i går)
export const isStreakAlive = (streak: ProgressStreak, today: string): boolean =>
    streak.lastActiveDay !== null &&
    (streak.lastActiveDay >= today || addDays(streak.lastActiveDay, 1) === today);

const pruneDayLog = (dayLog: Record<string, DayStats>): Record<string, DayStats> => {
    const days = Object.keys(dayLog);
    if (days.length <= MAX_DAY_LOG) return dayLog;
    const sorted = days.sort();
    const keep = new Set(sorted.slice(-MAX_DAY_LOG));
    const next: Record<string, DayStats> = {};
    for (const day of days) {
        if (keep.has(day)) next[day] = dayLog[day];
    }
    return next;
};

const subjectFromInput = (input: ActivityInput): string | undefined =>
    input.subjectId ?? (input.activityId.includes('/') ? input.activityId.split('/')[0] : undefined);

// Avledede måltall for badge-sjekk (brukes også av BadgeGallery)
export const buildMetrics = (data: {
    counters: Record<string, number>;
    totalXp: number;
    streak: ProgressStreak;
    dayLog: Record<string, DayStats>;
}): Record<string, number> => {
    const activeSubjects = ['historie', 'norsk', 'krle', 'samfunnskunnskap', 'musikk'].filter(
        (s) => (data.counters[`subject:${s}`] ?? 0) > 0
    ).length;
    return {
        ...data.counters,
        xp: data.totalXp,
        streak: data.streak.best,
        activeSubjects,
        activeDays: Object.keys(data.dayLog).length,
    };
};

const KIND_COUNTERS: Record<string, string> = {
    'article-read': 'articlesRead',
    'quiz-completed': 'quizzesCompleted',
    'path-step-completed': 'pathStepsCompleted',
    'path-completed': 'pathsCompleted',
    'review-session': 'reviewSessions',
    'minigame-played': 'minigamesPlayed',
    'detective-solved': 'detectivesSolved',
    'scenario-completed': 'scenariosCompleted',
    'practice-game': 'practiceGames',
    'virkemiddel-exercise': 'virkemiddelExercises',
    'microgame-played': 'microgamesPlayed',
};

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            ...initialData(),

            recordActivity: (input) => {
                const today = todayLocal();
                const now = Date.now();
                const state = get();
                const key = `${input.kind}:${input.activityId}`;
                const firstTime = !state.firstCompletions[key];

                // XP: full uttelling første gang, ellers liten bonus maks
                // én gang per dag per aktivitet
                let xp = 0;
                let bonusDay = state.lastBonusDay;
                if (firstTime) {
                    xp = XP_VALUES[input.kind];
                } else if (state.lastBonusDay[key] !== today) {
                    xp = repeatBonus(input.kind);
                    bonusDay = { ...state.lastBonusDay, [key]: today };
                }

                const levelBefore = levelForXp(state.totalXp);
                const totalXp = state.totalXp + xp;
                const levelAfter = levelForXp(totalXp);

                const counters = { ...state.counters };
                if (firstTime) {
                    const counterKey = KIND_COUNTERS[input.kind];
                    counters[counterKey] = (counters[counterKey] ?? 0) + 1;
                    if (input.kind === 'quiz-completed' && input.score === 1) {
                        counters.quizzesPerfect = (counters.quizzesPerfect ?? 0) + 1;
                    }
                    const subject = subjectFromInput(input);
                    if (subject) {
                        counters[`subject:${subject}`] = (counters[`subject:${subject}`] ?? 0) + 1;
                        if (input.kind === 'article-read') {
                            counters[`articles:${subject}`] =
                                (counters[`articles:${subject}`] ?? 0) + 1;
                        }
                    }
                }

                const streak = advanceStreak(state.streak, today);

                const prevDay = state.dayLog[today] ?? { xp: 0, activities: 0 };
                const dayLog = pruneDayLog({
                    ...state.dayLog,
                    [today]: { xp: prevDay.xp + xp, activities: prevDay.activities + 1 },
                });

                const bestScores =
                    input.score !== undefined &&
                    input.score > (state.bestScores[key] ?? -1)
                        ? { ...state.bestScores, [key]: input.score }
                        : state.bestScores;

                const event: ActivityEvent = {
                    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
                    kind: input.kind,
                    activityId: input.activityId,
                    subjectId: subjectFromInput(input),
                    topicId: input.topicId,
                    score: input.score,
                    title: input.title,
                    xp,
                    day: today,
                    at: now,
                };

                const metrics = buildMetrics({ counters, totalXp, streak, dayLog });
                const unlocked = newlyUnlockedTiers(state.badges, metrics);
                const badges = { ...state.badges };
                for (const { badge, tier } of unlocked) {
                    badges[badgeTierKey(badge.id, tier)] = now;
                }

                set({
                    totalXp,
                    streak,
                    counters,
                    dayLog,
                    bestScores,
                    badges,
                    lastBonusDay: bonusDay,
                    firstCompletions: firstTime
                        ? { ...state.firstCompletions, [key]: now }
                        : state.firstCompletions,
                    events: [...state.events, event].slice(-MAX_EVENTS),
                    updatedAt: now,
                });

                const result: RecordResult = {
                    xpAwarded: xp,
                    firstTime,
                    leveledUpTo: levelAfter > levelBefore ? levelAfter : null,
                    unlockedBadges: unlocked,
                };

                // Toasts: XP først, deretter level-up og badges
                const toast = useProgressToasts.getState().push;
                if (xp > 0) toast({ type: 'xp', xp, title: input.title });
                if (result.leveledUpTo) toast({ type: 'levelup', level: result.leveledUpTo });
                for (const u of unlocked) toast({ type: 'badge', badge: u.badge, tier: u.tier });

                return result;
            },

            setNickname: (nickname) =>
                set((state) => ({
                    profile: { ...state.profile, nickname: nickname.trim() || null },
                    updatedAt: Date.now(),
                })),

            setAvatar: (avatarId) =>
                set((state) => ({
                    profile: { ...state.profile, avatarId },
                    updatedAt: Date.now(),
                })),

            setDailyGoals: (day, items) =>
                set({ goals: { day, items }, checkedGoalIds: [], updatedAt: Date.now() }),

            toggleGoal: (goalId) =>
                set((state) => ({
                    checkedGoalIds: state.checkedGoalIds.includes(goalId)
                        ? state.checkedGoalIds.filter((id) => id !== goalId)
                        : [...state.checkedGoalIds, goalId],
                    updatedAt: Date.now(),
                })),

            // Engangsimport av gammel fremdrift (retroactive.ts bygger dataene).
            // Låser opp badges stille - én samle-toast pushes av kalleren.
            applyRetroData: (data) =>
                set((state) => {
                    const now = Date.now();
                    const counters = { ...state.counters };
                    for (const [k, v] of Object.entries(data.counters)) {
                        counters[k] = (counters[k] ?? 0) + v;
                    }
                    const totalXp = state.totalXp + data.totalXp;
                    const dayLog = pruneDayLog({ ...data.dayLog, ...state.dayLog });
                    const streak =
                        data.streak.current > state.streak.current ? data.streak : state.streak;
                    const metrics = buildMetrics({ counters, totalXp, streak, dayLog });
                    const badges = { ...state.badges };
                    for (const { badge, tier } of newlyUnlockedTiers(state.badges, metrics)) {
                        badges[badgeTierKey(badge.id, tier)] = now;
                    }
                    return {
                        totalXp,
                        streak: {
                            ...streak,
                            best: Math.max(streak.best, data.streak.best, state.streak.best),
                        },
                        counters,
                        dayLog,
                        badges,
                        firstCompletions: { ...data.firstCompletions, ...state.firstCompletions },
                        bestScores: { ...data.bestScores, ...state.bestScores },
                        events: [...data.events, ...state.events].slice(-MAX_EVENTS),
                        retroDone: true,
                        updatedAt: now,
                    };
                }),

            setSyncCode: (code) =>
                set((state) => ({ sync: { ...state.sync, code }, updatedAt: Date.now() })),

            markSynced: (at) =>
                set((state) => ({ sync: { ...state.sync, lastSyncedAt: at } })),

            // Erstatter hele profilen med data fra Firebase (kode-innlogging)
            hydrateFromRemote: (data) => set({ ...data }),

            resetAll: () => set({ ...initialData(), updatedAt: Date.now() }),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);

// Serialiser nøyaktig de persisterte feltene (til Firebase-synk)
export const serializeProgress = (): ProgressData => {
    const s = useProgressStore.getState();
    return {
        profile: s.profile,
        totalXp: s.totalXp,
        streak: s.streak,
        events: s.events,
        firstCompletions: s.firstCompletions,
        lastBonusDay: s.lastBonusDay,
        bestScores: s.bestScores,
        dayLog: s.dayLog,
        badges: s.badges,
        counters: s.counters,
        goals: s.goals,
        checkedGoalIds: s.checkedGoalIds,
        retroDone: s.retroDone,
        sync: s.sync,
        updatedAt: s.updatedAt,
    };
};
