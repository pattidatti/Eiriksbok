import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReviewItem, ReviewSessionRecord, ReviewStreak } from '../types/review';
import { addDays, gradeLeitner } from '../utils/reviewScheduler';
import { useProgressStore } from '../features/progress/useProgressStore';

// Repetisjonskøen for «Dagens økt». localStorage-only, samme fase-1-strategi
// som useLearningPathProfile. Flere faner: last-write-wins via persist -
// akseptabelt for en personlig øvingskø.

const STORAGE_KEY = 'review-store-v1';
const MAX_ITEMS = 300;
const MAX_SESSIONS = 60;

interface ReviewState {
    items: Record<string, ReviewItem>;
    streak: ReviewStreak;
    sessions: ReviewSessionRecord[];

    // Selektorer
    hasSessionToday: (today: string) => boolean;
    dueCount: (today: string) => number;

    // Mutasjoner
    addItem: (
        item: Omit<ReviewItem, 'box' | 'dueDate' | 'lapses' | 'reps' | 'addedAt' | 'lastReviewedAt'>,
        today: string
    ) => void;
    gradeItem: (id: string, correct: boolean, today: string) => void;
    demoteItem: (id: string, today: string) => void;
    completeSession: (record: Omit<ReviewSessionRecord, 'day'>, today: string) => void;
    recordGameResult: (today: string, gameId: string, score: number) => void;
    resetAll: () => void;
}

// Ved overflow: kast boks-5-items (best lærte) med eldst lastReviewedAt først
const evictIfNeeded = (items: Record<string, ReviewItem>): Record<string, ReviewItem> => {
    const all = Object.values(items);
    if (all.length <= MAX_ITEMS) return items;
    const sorted = [...all].sort((a, b) => {
        if (a.box !== b.box) return b.box - a.box;
        return (a.lastReviewedAt ?? 0) - (b.lastReviewedAt ?? 0);
    });
    const toEvict = new Set(sorted.slice(0, all.length - MAX_ITEMS).map((i) => i.id));
    const next: Record<string, ReviewItem> = {};
    for (const item of all) {
        if (!toEvict.has(item.id)) next[item.id] = item;
    }
    return next;
};

export const useReviewStore = create<ReviewState>()(
    persist(
        (set, get) => ({
            items: {},
            streak: { current: 0, best: 0, lastSessionDay: null },
            sessions: [],

            hasSessionToday: (today) => {
                const last = get().streak.lastSessionDay;
                // lastSessionDay i fremtiden = klokka har rullet tilbake;
                // behandles som «gjort i dag» så streaken ikke dobbelttelles
                return last !== null && last >= today;
            },

            dueCount: (today) =>
                Object.values(get().items).filter((i) => i.dueDate <= today).length,

            addItem: (item, today) =>
                set((state) => {
                    if (state.items[item.id]) return state;
                    const newItem: ReviewItem = {
                        ...item,
                        box: 1,
                        dueDate: today,
                        lapses: 0,
                        reps: 0,
                        addedAt: Date.now(),
                        lastReviewedAt: null,
                    };
                    return {
                        items: evictIfNeeded({ ...state.items, [item.id]: newItem }),
                    };
                }),

            gradeItem: (id, correct, today) =>
                set((state) => {
                    const item = state.items[id];
                    if (!item) return state;
                    return {
                        items: { ...state.items, [id]: gradeLeitner(item, correct, today) },
                    };
                }),

            demoteItem: (id, today) =>
                set((state) => {
                    const item = state.items[id];
                    if (!item) return state;
                    return {
                        items: { ...state.items, [id]: gradeLeitner(item, false, today) },
                    };
                }),

            completeSession: (record, today) => {
                // «Min læring»: dagens økt gir XP og teller på streaken
                useProgressStore.getState().recordActivity({
                    kind: 'review-session',
                    activityId: today,
                    score: record.total > 0 ? record.correct / record.total : undefined,
                    title: 'Dagens økt',
                });
                set((state) => {
                    const { current, best, lastSessionDay } = state.streak;
                    let nextCurrent = current;
                    if (lastSessionDay === null) {
                        nextCurrent = 1;
                    } else if (lastSessionDay >= today) {
                        // Bonusrunde samme dag (eller klokke rullet tilbake): uendret
                        nextCurrent = current;
                    } else if (addDays(lastSessionDay, 1) === today) {
                        nextCurrent = current + 1;
                    } else {
                        nextCurrent = 1;
                    }
                    return {
                        streak: {
                            current: nextCurrent,
                            best: Math.max(best, nextCurrent),
                            lastSessionDay: lastSessionDay && lastSessionDay > today
                                ? lastSessionDay
                                : today,
                        },
                        sessions: [...state.sessions, { ...record, day: today }].slice(
                            -MAX_SESSIONS
                        ),
                    };
                });
            },

            // Dagens spill spilles ETTER at økta er fullført (streaken er
            // allerede sikret) - resultatet flettes inn i dagens session-record
            recordGameResult: (today, gameId, score) => {
                useProgressStore.getState().recordActivity({
                    kind: 'practice-game',
                    activityId: `review-game/${gameId}`,
                    title: 'Dagens spill',
                    score: undefined,
                });
                set((state) => {
                    const sessions = [...state.sessions];
                    for (let i = sessions.length - 1; i >= 0; i--) {
                        if (sessions[i].day === today) {
                            sessions[i] = { ...sessions[i], gameId, gameScore: score };
                            return { sessions };
                        }
                    }
                    return state;
                });
            },

            resetAll: () =>
                set({
                    items: {},
                    streak: { current: 0, best: 0, lastSessionDay: null },
                    sessions: [],
                }),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);
