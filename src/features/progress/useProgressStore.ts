// Sentral progresjonsstore for «Min læring». Alle moduler i appen kaller
// recordActivity() når eleven fullfører noe; storen eier XP, streak, badges,
// tellere og hendelseslogg. localStorage-persist som de andre storene;
// speiling til Firebase skjer i sync.ts når en synk-kode er aktiv.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { todayLocal } from '../../utils/reviewScheduler';
import { newlyUnlockedTiers, badgeTierKey } from './badges';
import { levelForXp, repeatBonus, xpValueFor, masteryMultiplier } from './xp';
import { advanceStreakForEffortDay, streakMultiplier, isStreakAlive } from './streak';
import { getProgressionConfig } from './progressionConfig';
import { DEFAULT_AVATAR_ID } from './avatars';
import { useProgressToasts } from './useProgressToasts';
import { useCelebration } from './useCelebration';
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
const PERSIST_DEBOUNCE_MS = 500;

// Debounced localStorage-persist: recordActivity kan fyre mange set() på kort
// tid (quiz, spill), og synkron stringify + skriving av hele profilen på hvert
// kall blokkerer main thread. Vi holder siste snapshot i minnet og flusher
// etter en kort pause - og umiddelbart når fanen skjules/lukkes, så ingenting
// går tapt. Firebase-synk (sync.ts) leser fra store-state og er upåvirket.
const debouncedProgressStorage: PersistStorage<ProgressData> = (() => {
    let pending: StorageValue<ProgressData> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (!pending) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
        } catch {
            // Kvote overskredet eller utilgjengelig - profilen lever videre i minnet
        }
        pending = null;
    };

    if (typeof window !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') flush();
        });
        window.addEventListener('pagehide', flush);
    }

    return {
        getItem: (name) => {
            if (pending) return pending;
            try {
                const raw = localStorage.getItem(name);
                if (!raw) return null;
                return JSON.parse(raw) as StorageValue<ProgressData>;
            } catch {
                return null;
            }
        },
        setItem: (_name, value) => {
            pending = value;
            if (timer) clearTimeout(timer);
            timer = setTimeout(flush, PERSIST_DEBOUNCE_MS);
        },
        removeItem: (name) => {
            pending = null;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            try {
                localStorage.removeItem(name);
            } catch {
                // Utilgjengelig - ignorer
            }
        },
    };
})();

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
    goals: { day: string; items: DailyGoal[]; bonusGoalId?: string | null } | null;
    checkedGoalIds: string[];
    // Siste dag ('YYYY-MM-DD') dagsbonusen for «alle mål fullført» ble gitt
    lastGoalBonusDay: string | null;
    // Siste dag overraskelsesbonusen (gnistmålet) ble gitt
    lastSurpriseBonusDay: string | null;
    retroDone: boolean;
    sync: SyncState;
    updatedAt: number;
}

// Re-eksport så eksisterende importer (ProgressChip, MyLearningPage) består.
export { isStreakAlive } from './streak';

interface ProgressState extends ProgressData {
    recordActivity: (input: ActivityInput) => RecordResult;
    setNickname: (nickname: string) => void;
    setAvatar: (avatarId: string) => void;
    setDailyGoals: (day: string, items: DailyGoal[], bonusGoalId?: string | null) => void;
    setBonusGoalId: (bonusGoalId: string | null) => void;
    toggleGoal: (goalId: string) => void;
    awardDailyGoalBonus: (day: string) => void;
    awardSurpriseGoalBonus: (day: string) => void;
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

const emptyStreak: ProgressStreak = { current: 0, best: 0, lastActiveDay: null, freezes: 0 };

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
    lastGoalBonusDay: null,
    lastSurpriseBonusDay: null,
    retroDone: false,
    sync: { code: null, lastSyncedAt: null },
    updatedAt: 0,
});

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
    'philosophy-quest': 'philosophyQuests',
    'comparison-task': 'comparisonTasks',
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

                // Grunn-XP: full uttelling første gang, ellers liten bonus maks
                // én gang per dag per aktivitet.
                let baseXp = 0;
                let bonusDay = state.lastBonusDay;
                if (firstTime) {
                    baseXp = xpValueFor(input.kind);
                } else if (state.lastBonusDay[key] !== today) {
                    baseXp = repeatBonus(input.kind);
                    bonusDay = { ...state.lastBonusDay, [key]: today };
                }

                // Påslag: mestring (gjøre det godt) kun på scorede førstegangs-
                // fullføringer, og streak (jevn innsats) basert på streaken som
                // er i live akkurat nå.
                const masteryMult = firstTime ? masteryMultiplier(input.score) : 1;
                const aliveStreak = isStreakAlive(state.streak, today)
                    ? state.streak.current
                    : 0;
                const streakMult = streakMultiplier(aliveStreak);
                const xp = Math.round(baseXp * masteryMult * streakMult);

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

                const prevDay = state.dayLog[today] ?? { xp: 0, activities: 0 };
                const dayXpAfter = prevDay.xp + xp;
                const dayLog = pruneDayLog({
                    ...state.dayLog,
                    [today]: { xp: dayXpAfter, activities: prevDay.activities + 1 },
                });

                // Streaken rykker fram først når dagen krysser innsats-terskelen -
                // ikke ved hver bitte lille handling. Da betyr en streak faktisk noe.
                const { minXp } = getProgressionConfig().streak;
                const alreadyCountedToday = state.streak.lastActiveDay === today;
                const streakAdvance =
                    !alreadyCountedToday && dayXpAfter >= minXp
                        ? advanceStreakForEffortDay(state.streak, today)
                        : null;
                const streak = streakAdvance ? streakAdvance.streak : state.streak;

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

                // Belønning: små ting blir toasts, de store øyeblikkene blir en
                // fullskjerms feiringsseremoni.
                const toast = useProgressToasts.getState().push;
                const celebrate = useCelebration.getState().celebrate;
                if (xp > 0) toast({ type: 'xp', xp, title: input.title });
                if (streakAdvance?.frozen) {
                    toast({
                        type: 'info',
                        emoji: '❄️',
                        title: 'En fryser reddet streaken din!',
                        subtitle: 'Du var borte en dag, men streaken lever videre.',
                    });
                }
                if (result.leveledUpTo) celebrate({ type: 'levelup', level: result.leveledUpTo });
                for (const u of unlocked) {
                    if (u.tier === 'gull') {
                        celebrate({ type: 'badge-gull', title: u.badge.title, emoji: u.badge.emoji });
                    } else {
                        toast({ type: 'badge', badge: u.badge, tier: u.tier });
                    }
                }

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

            setDailyGoals: (day, items, bonusGoalId = null) =>
                set({
                    goals: { day, items, bonusGoalId },
                    checkedGoalIds: [],
                    updatedAt: Date.now(),
                }),

            // Backfill for dager der målene alt er generert uten gnistmål
            // (f.eks. rett etter oppdatering av appen).
            setBonusGoalId: (bonusGoalId) =>
                set((state) =>
                    state.goals
                        ? { goals: { ...state.goals, bonusGoalId }, updatedAt: Date.now() }
                        : {}
                ),

            toggleGoal: (goalId) =>
                set((state) => ({
                    checkedGoalIds: state.checkedGoalIds.includes(goalId)
                        ? state.checkedGoalIds.filter((id) => id !== goalId)
                        : [...state.checkedGoalIds, goalId],
                    updatedAt: Date.now(),
                })),

            // Engangsbonus når alle dagens mål er huket av. Idempotent per dag:
            // kalles fritt fra siden, men gir bare uttelling én gang.
            awardDailyGoalBonus: (day) => {
                const state = get();
                if (state.lastGoalBonusDay === day) return;
                const now = Date.now();
                const xp = getProgressionConfig().dailyGoalBonusXp;

                const levelBefore = levelForXp(state.totalXp);
                const totalXp = state.totalXp + xp;
                const levelAfter = levelForXp(totalXp);

                const prevDay = state.dayLog[day] ?? { xp: 0, activities: 0 };
                const dayLog = pruneDayLog({
                    ...state.dayLog,
                    [day]: { xp: prevDay.xp + xp, activities: prevDay.activities },
                });

                const metrics = buildMetrics({
                    counters: state.counters,
                    totalXp,
                    streak: state.streak,
                    dayLog,
                });
                const unlocked = newlyUnlockedTiers(state.badges, metrics);
                const badges = { ...state.badges };
                for (const { badge, tier } of unlocked) {
                    badges[badgeTierKey(badge.id, tier)] = now;
                }

                set({ totalXp, dayLog, badges, lastGoalBonusDay: day, updatedAt: now });

                const celebrate = useCelebration.getState().celebrate;
                celebrate({ type: 'goals', xp });
                if (levelAfter > levelBefore) celebrate({ type: 'levelup', level: levelAfter });
                const toast = useProgressToasts.getState().push;
                for (const u of unlocked) {
                    if (u.tier === 'gull') {
                        celebrate({ type: 'badge-gull', title: u.badge.title, emoji: u.badge.emoji });
                    } else {
                        toast({ type: 'badge', badge: u.badge, tier: u.tier });
                    }
                }
            },

            // Overraskelsesbonus når dagens gnistmål fullføres. Samme
            // idempotente mønster som dagsbonusen: én gang per dag.
            awardSurpriseGoalBonus: (day) => {
                const state = get();
                if (state.lastSurpriseBonusDay === day) return;
                const now = Date.now();
                const xp = getProgressionConfig().surpriseGoalBonusXp;

                const levelBefore = levelForXp(state.totalXp);
                const totalXp = state.totalXp + xp;
                const levelAfter = levelForXp(totalXp);

                const prevDay = state.dayLog[day] ?? { xp: 0, activities: 0 };
                const dayLog = pruneDayLog({
                    ...state.dayLog,
                    [day]: { xp: prevDay.xp + xp, activities: prevDay.activities },
                });

                const metrics = buildMetrics({
                    counters: state.counters,
                    totalXp,
                    streak: state.streak,
                    dayLog,
                });
                const unlocked = newlyUnlockedTiers(state.badges, metrics);
                const badges = { ...state.badges };
                for (const { badge, tier } of unlocked) {
                    badges[badgeTierKey(badge.id, tier)] = now;
                }

                set({ totalXp, dayLog, badges, lastSurpriseBonusDay: day, updatedAt: now });

                const toast = useProgressToasts.getState().push;
                toast({
                    type: 'info',
                    emoji: '✨',
                    title: 'Overraskelsesbonus!',
                    subtitle: `Du traff dagens gnistmål - +${xp} XP ekstra.`,
                });
                const celebrate = useCelebration.getState().celebrate;
                if (levelAfter > levelBefore) celebrate({ type: 'levelup', level: levelAfter });
                for (const u of unlocked) {
                    if (u.tier === 'gull') {
                        celebrate({ type: 'badge-gull', title: u.badge.title, emoji: u.badge.emoji });
                    } else {
                        toast({ type: 'badge', badge: u.badge, tier: u.tier });
                    }
                }
            },

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
            storage: debouncedProgressStorage,
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
        lastGoalBonusDay: s.lastGoalBonusDay,
        lastSurpriseBonusDay: s.lastSurpriseBonusDay,
        retroDone: s.retroDone,
        sync: s.sync,
        updatedAt: s.updatedAt,
    };
};
