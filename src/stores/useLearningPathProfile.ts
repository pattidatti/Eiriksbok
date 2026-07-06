import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useProgressStore } from '../features/progress/useProgressStore';

// Profilen lagrer fremdrift for hver V2-sti eleven har påbegynt.
// localStorage-only i Fase 1; profil-interfacet er bevisst tynt slik at vi
// kan bytte til Firebase i Fase 3 uten å røre rendererne.

export interface StepResponse {
    // Generisk svar-blob per steg-kind:
    // - mini-quiz / read-article comprehension: { score: 0-1, answers: number[] }
    // - reflection: { text: string }
    // - interactive: { completed: true }
    // - scenario/detective: { completed: true, externalId?: string }
    // - concept-drill: { score: 0-1 }
    // - synthesis: { artifact: any }
    score?: number;
    answers?: number[];
    text?: string;
    completed?: boolean;
    externalId?: string;
    artifact?: unknown;
    completedAt: number;
}

export interface PathProgress {
    pathId: string;
    startedAt: number;
    lastVisitedAt: number;
    currentStepId: string | null;
    completedStepIds: string[];
    responses: Record<string, StepResponse>;
    conceptsEncountered: string[];
    finishedAt: number | null;
}

interface LearningPathProfileState {
    paths: Record<string, PathProgress>;

    // Selektorer (rene funksjoner)
    getPath: (pathId: string) => PathProgress | undefined;
    isStepCompleted: (pathId: string, stepId: string) => boolean;
    getResponse: (pathId: string, stepId: string) => StepResponse | undefined;
    getMasteryScore: (pathId: string) => number; // 0-1 gjennomsnitt av step-scores

    // Mutasjoner
    startPath: (pathId: string, firstStepId: string) => void;
    setCurrentStep: (pathId: string, stepId: string) => void;
    completeStep: (
        pathId: string,
        stepId: string,
        response: Omit<StepResponse, 'completedAt'>,
        conceptsIntroduced?: string[]
    ) => void;
    finishPath: (pathId: string) => void;
    resetPath: (pathId: string) => void;
    resetAll: () => void;
}

const STORAGE_KEY = 'learning-path-profile-v1';

export const useLearningPathProfile = create<LearningPathProfileState>()(
    persist(
        (set, get) => ({
            paths: {},

            getPath: (pathId) => get().paths[pathId],

            isStepCompleted: (pathId, stepId) => {
                const path = get().paths[pathId];
                return !!path && path.completedStepIds.includes(stepId);
            },

            getResponse: (pathId, stepId) => {
                const path = get().paths[pathId];
                return path?.responses[stepId];
            },

            getMasteryScore: (pathId) => {
                const path = get().paths[pathId];
                if (!path) return 0;
                const scores = Object.values(path.responses)
                    .map((r) => r.score)
                    .filter((s): s is number => typeof s === 'number');
                if (scores.length === 0) return 0;
                return scores.reduce((a, b) => a + b, 0) / scores.length;
            },

            startPath: (pathId, firstStepId) =>
                set((state) => {
                    if (state.paths[pathId]) {
                        return {
                            paths: {
                                ...state.paths,
                                [pathId]: {
                                    ...state.paths[pathId],
                                    lastVisitedAt: Date.now(),
                                },
                            },
                        };
                    }
                    const now = Date.now();
                    return {
                        paths: {
                            ...state.paths,
                            [pathId]: {
                                pathId,
                                startedAt: now,
                                lastVisitedAt: now,
                                currentStepId: firstStepId,
                                completedStepIds: [],
                                responses: {},
                                conceptsEncountered: [],
                                finishedAt: null,
                            },
                        },
                    };
                }),

            setCurrentStep: (pathId, stepId) =>
                set((state) => {
                    const path = state.paths[pathId];
                    if (!path) return state;
                    return {
                        paths: {
                            ...state.paths,
                            [pathId]: {
                                ...path,
                                currentStepId: stepId,
                                lastVisitedAt: Date.now(),
                            },
                        },
                    };
                }),

            completeStep: (pathId, stepId, response, conceptsIntroduced = []) => {
                // «Min læring»: hvert fullførte steg gir XP (grinding håndteres
                // av progresjonsstoren via first-time/daglig bonus)
                if (get().paths[pathId]) {
                    useProgressStore.getState().recordActivity({
                        kind: 'path-step-completed',
                        activityId: `${pathId}/${stepId}`,
                        score: response.score,
                        title: 'Steg i læringssti',
                    });
                }
                set((state) => {
                    const path = state.paths[pathId];
                    if (!path) return state;
                    const alreadyDone = path.completedStepIds.includes(stepId);
                    const mergedConcepts = Array.from(
                        new Set([...path.conceptsEncountered, ...conceptsIntroduced])
                    );
                    return {
                        paths: {
                            ...state.paths,
                            [pathId]: {
                                ...path,
                                completedStepIds: alreadyDone
                                    ? path.completedStepIds
                                    : [...path.completedStepIds, stepId],
                                responses: {
                                    ...path.responses,
                                    [stepId]: { ...response, completedAt: Date.now() },
                                },
                                conceptsEncountered: mergedConcepts,
                                lastVisitedAt: Date.now(),
                            },
                        },
                    };
                });
            },

            finishPath: (pathId) => {
                const existing = get().paths[pathId];
                if (existing && existing.finishedAt === null) {
                    useProgressStore.getState().recordActivity({
                        kind: 'path-completed',
                        activityId: pathId,
                        score: get().getMasteryScore(pathId),
                        title: 'Læringssti fullført',
                    });
                }
                set((state) => {
                    const path = state.paths[pathId];
                    if (!path) return state;
                    return {
                        paths: {
                            ...state.paths,
                            [pathId]: {
                                ...path,
                                finishedAt: Date.now(),
                            },
                        },
                    };
                });
            },

            resetPath: (pathId) =>
                set((state) => {
                    const rest = { ...state.paths };
                    delete rest[pathId];
                    return { paths: rest };
                }),

            resetAll: () => set({ paths: {} }),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);
