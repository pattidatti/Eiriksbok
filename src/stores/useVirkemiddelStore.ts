import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DeviceProgress, Level } from '../data/virkemiddelverkstedet/types';
import { useProgressStore } from '../features/progress/useProgressStore';

// «Min læring»: begge øvingsmoduser rapporterer til progresjonssystemet.
// Nøkkelformatet matcher retro-importen (deviceId/exerciseId).
const reportExercise = (deviceId: string, exerciseId: string) => {
    useProgressStore.getState().recordActivity({
        kind: 'virkemiddel-exercise',
        activityId: `${deviceId}/${exerciseId}`,
        subjectId: 'norsk',
        title: 'Virkemiddel-øving',
    });
};

const DEFAULT_PROGRESS: DeviceProgress = {
    completedExercises: [],
    levelUnlocked: 1,
    bestScore: 0,
    currentStreak: 0,
    maxStreak: 0,
};

interface VirkemiddelState {
    progress: Record<string, DeviceProgress>;
    totalPoints: number;
    applyProgress: Record<string, DeviceProgress>;
    applyTotalPoints: number;

    getDeviceProgress: (deviceId: string) => DeviceProgress;
    completeExercise: (deviceId: string, exerciseId: string, points: number) => void;
    unlockLevel: (deviceId: string, level: Exclude<Level, 1>) => void;
    incrementStreak: (deviceId: string) => void;
    resetStreak: (deviceId: string) => void;
    addPoints: (points: number) => void;

    getApplyDeviceProgress: (deviceId: string) => DeviceProgress;
    completeApplyExercise: (deviceId: string, exerciseId: string, points: number) => void;
    unlockApplyLevel: (deviceId: string, level: Exclude<Level, 1>) => void;
    incrementApplyStreak: (deviceId: string) => void;
    resetApplyStreak: (deviceId: string) => void;
    addApplyPoints: (points: number) => void;

    resetAll: () => void;
}

export const useVirkemiddelStore = create<VirkemiddelState>()(
    persist(
        (set, get) => ({
            progress: {},
            totalPoints: 0,
            applyProgress: {},
            applyTotalPoints: 0,

            getDeviceProgress: (deviceId) => {
                return get().progress[deviceId] || { ...DEFAULT_PROGRESS };
            },

            completeExercise: (deviceId, exerciseId, points) => {
                reportExercise(deviceId, exerciseId);
                set((state) => {
                    const current = state.progress[deviceId] || { ...DEFAULT_PROGRESS };
                    if (current.completedExercises.includes(exerciseId)) return state;
                    return {
                        progress: {
                            ...state.progress,
                            [deviceId]: {
                                ...current,
                                completedExercises: [...current.completedExercises, exerciseId],
                                bestScore: current.bestScore + points,
                            },
                        },
                        totalPoints: state.totalPoints + points,
                    };
                });
            },

            unlockLevel: (deviceId, level) =>
                set((state) => {
                    const current = state.progress[deviceId] || { ...DEFAULT_PROGRESS };
                    if (current.levelUnlocked >= level) return state;
                    return {
                        progress: {
                            ...state.progress,
                            [deviceId]: { ...current, levelUnlocked: level },
                        },
                    };
                }),

            incrementStreak: (deviceId) =>
                set((state) => {
                    const current = state.progress[deviceId] || { ...DEFAULT_PROGRESS };
                    const newStreak = current.currentStreak + 1;
                    return {
                        progress: {
                            ...state.progress,
                            [deviceId]: {
                                ...current,
                                currentStreak: newStreak,
                                maxStreak: Math.max(current.maxStreak, newStreak),
                            },
                        },
                    };
                }),

            resetStreak: (deviceId) =>
                set((state) => {
                    const current = state.progress[deviceId] || { ...DEFAULT_PROGRESS };
                    return {
                        progress: {
                            ...state.progress,
                            [deviceId]: { ...current, currentStreak: 0 },
                        },
                    };
                }),

            addPoints: (points) =>
                set((state) => ({
                    totalPoints: state.totalPoints + points,
                })),

            // Apply mode methods
            getApplyDeviceProgress: (deviceId) => {
                return get().applyProgress[deviceId] || { ...DEFAULT_PROGRESS };
            },

            completeApplyExercise: (deviceId, exerciseId, points) => {
                reportExercise(deviceId, exerciseId);
                set((state) => {
                    const current = state.applyProgress[deviceId] || { ...DEFAULT_PROGRESS };
                    if (current.completedExercises.includes(exerciseId)) return state;
                    return {
                        applyProgress: {
                            ...state.applyProgress,
                            [deviceId]: {
                                ...current,
                                completedExercises: [
                                    ...current.completedExercises,
                                    exerciseId,
                                ],
                                bestScore: current.bestScore + points,
                            },
                        },
                        applyTotalPoints: state.applyTotalPoints + points,
                    };
                });
            },

            unlockApplyLevel: (deviceId, level) =>
                set((state) => {
                    const current = state.applyProgress[deviceId] || { ...DEFAULT_PROGRESS };
                    if (current.levelUnlocked >= level) return state;
                    return {
                        applyProgress: {
                            ...state.applyProgress,
                            [deviceId]: { ...current, levelUnlocked: level },
                        },
                    };
                }),

            incrementApplyStreak: (deviceId) =>
                set((state) => {
                    const current = state.applyProgress[deviceId] || { ...DEFAULT_PROGRESS };
                    const newStreak = current.currentStreak + 1;
                    return {
                        applyProgress: {
                            ...state.applyProgress,
                            [deviceId]: {
                                ...current,
                                currentStreak: newStreak,
                                maxStreak: Math.max(current.maxStreak, newStreak),
                            },
                        },
                    };
                }),

            resetApplyStreak: (deviceId) =>
                set((state) => {
                    const current = state.applyProgress[deviceId] || { ...DEFAULT_PROGRESS };
                    return {
                        applyProgress: {
                            ...state.applyProgress,
                            [deviceId]: { ...current, currentStreak: 0 },
                        },
                    };
                }),

            addApplyPoints: (points) =>
                set((state) => ({
                    applyTotalPoints: state.applyTotalPoints + points,
                })),

            resetAll: () =>
                set({
                    progress: {},
                    totalPoints: 0,
                    applyProgress: {},
                    applyTotalPoints: 0,
                }),
        }),
        {
            name: 'virkemiddelverkstedet',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
