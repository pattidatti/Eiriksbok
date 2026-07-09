import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PhilosophyProfile, PhilosophyAxis, Achievement, QuestProgress } from '../data/philosophy/types';
import { QUEST_REGISTRY } from '../data/philosophy/questRegistry';

const INITIAL_PROFILE: PhilosophyProfile = {
    xp: 0,
    level: 1,
    completedQuests: [],
    alignment: {
        rationalism: 50,
        empiricism: 50,
        stoicism: 50,
        epicureanism: 50,
        idealism: 50,
        materialism: 50,
        individualism: 50,
        collectivism: 50,
        existentialism: 50,
        essentialism: 50,
        skepticism: 50,
        dogmatism: 50,
    },
    achievements: [],
    lastActive: Date.now()
};

const XP_PER_LEVEL = 1000;

const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-quest',
        title: 'Nysgjerrig',
        description: 'Fullført din første filosofiske dialog.',
        icon: 'sparkles',
        condition: (p) => p.completedQuests.length >= 1,
    },
    {
        id: 'antikken-komplett',
        title: 'Oldtidskjenner',
        description: 'Fullført alle dialoger fra Antikken.',
        icon: 'scroll',
        condition: (p) => {
            const antikkenIds = Object.values(QUEST_REGISTRY)
                .filter(q => q.era === 'antikken' && !q.isSecondary)
                .map(q => q.id);
            return antikkenIds.every(id => p.completedQuests.includes(id));
        },
    },
    {
        id: 'five-quests',
        title: 'Filosof',
        description: 'Fullført fem filosofiske dialoger.',
        icon: 'brain',
        condition: (p) => p.completedQuests.length >= 5,
    },
    {
        id: 'ten-quests',
        title: 'Dyptenker',
        description: 'Fullført ti filosofiske dialoger.',
        icon: 'graduation-cap',
        condition: (p) => p.completedQuests.length >= 10,
    },
    {
        id: 'all-primary',
        title: 'Mester av Odysseen',
        description: 'Fullført alle primærdialoger.',
        icon: 'trophy',
        condition: (p) => {
            const primaryIds = Object.values(QUEST_REGISTRY)
                .filter(q => !q.isSecondary)
                .map(q => q.id);
            return primaryIds.every(id => p.completedQuests.includes(id));
        },
    },
];

const validAxes = Object.keys(INITIAL_PROFILE.alignment) as PhilosophyAxis[];

// Ett refleksjonssvar: spørsmålet lagres sammen med svaret slik at
// tenkedagboken kan vises uten å laste quest-JSON-filene på nytt.
export interface ReflectionEntry {
    q: string;
    a: string;
}

interface ProfileStore {
    profile: PhilosophyProfile;
    isLoaded: boolean;
    questProgress: QuestProgress | null;
    // questId -> svar, indeks-justert med questens reflectionQuestions
    reflections: Record<string, ReflectionEntry[]>;
    addXp: (amount: number) => void;
    updateAlignment: (changes: Partial<Record<string, number>>) => void;
    completeQuest: (questId: string, xpReward: number) => void;
    resetProfile: () => void;
    saveQuestProgress: (progress: QuestProgress) => void;
    clearQuestProgress: () => void;
    saveReflection: (questId: string, index: number, q: string, a: string) => void;
}

const useProfileStore = create<ProfileStore>()(
    persist(
        (set) => ({
            profile: INITIAL_PROFILE,
            isLoaded: true,
            questProgress: null as QuestProgress | null,
            reflections: {} as Record<string, ReflectionEntry[]>,

            addXp: (amount: number) =>
                set((state) => {
                    const newXp = state.profile.xp + amount;
                    return {
                        profile: {
                            ...state.profile,
                            xp: newXp,
                            level: Math.floor(newXp / XP_PER_LEVEL) + 1,
                            lastActive: Date.now(),
                        },
                    };
                }),

            updateAlignment: (changes: Partial<Record<string, number>>) =>
                set((state) => {
                    const newAlignment = { ...state.profile.alignment };
                    for (const [axis, change] of Object.entries(changes)) {
                        if (!change) continue;
                        if (validAxes.includes(axis as PhilosophyAxis)) {
                            newAlignment[axis as PhilosophyAxis] = Math.max(
                                0,
                                Math.min(100, (newAlignment[axis as PhilosophyAxis] || 50) + change)
                            );
                        }
                    }
                    return {
                        profile: {
                            ...state.profile,
                            alignment: newAlignment,
                            lastActive: Date.now(),
                        },
                    };
                }),

            completeQuest: (questId: string, xpReward: number) =>
                set((state) => {
                    if (state.profile.completedQuests.includes(questId)) return state;

                    const newXp = state.profile.xp + xpReward;
                    const newCompleted = [...state.profile.completedQuests, questId];
                    const tempProfile: PhilosophyProfile = {
                        ...state.profile,
                        completedQuests: newCompleted,
                        xp: newXp,
                        level: Math.floor(newXp / XP_PER_LEVEL) + 1,
                    };
                    const earnedIds = ACHIEVEMENTS.filter((a) => a.condition(tempProfile)).map((a) => a.id);

                    return {
                        profile: {
                            ...tempProfile,
                            achievements: earnedIds,
                            lastActive: Date.now(),
                        },
                    };
                }),

            resetProfile: () => set({ profile: INITIAL_PROFILE }),

            saveQuestProgress: (progress: QuestProgress) =>
                set({ questProgress: progress }),

            clearQuestProgress: () =>
                set({ questProgress: null }),

            saveReflection: (questId, index, q, a) =>
                set((state) => {
                    const entries = [...(state.reflections[questId] ?? [])];
                    entries[index] = { q, a };
                    return { reflections: { ...state.reflections, [questId]: entries } };
                }),
        }),
        {
            name: 'odyssey_philosophy_profile',
            // Migrate old localStorage key if present
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Eldre persistert data mangler reflections (migration)
                state.reflections = state.reflections ?? {};
                // Ensure all alignment axes exist (migration)
                const alignment = { ...INITIAL_PROFILE.alignment };
                if (state.profile.alignment) {
                    for (const key of validAxes) {
                        if (key in state.profile.alignment) {
                            alignment[key] = state.profile.alignment[key];
                        }
                    }
                }
                state.profile = { ...state.profile, alignment };
            },
        }
    )
);

export const usePhilosophyProfile = () => {
    const { profile, isLoaded, addXp, updateAlignment, completeQuest, resetProfile,
        questProgress, saveQuestProgress, clearQuestProgress,
        reflections, saveReflection } = useProfileStore();

    const earnedAchievements = useMemo(
        () => ACHIEVEMENTS.filter((a) => a.condition(profile)),
        [profile]
    );

    const progress = useMemo(() => {
        const primaryQuests = Object.values(QUEST_REGISTRY).filter((q) => !q.isSecondary);
        const completed = primaryQuests.filter((q) => profile.completedQuests.includes(q.id));
        return {
            completed: completed.length,
            total: primaryQuests.length,
            percent:
                primaryQuests.length > 0
                    ? Math.round((completed.length / primaryQuests.length) * 100)
                    : 0,
        };
    }, [profile]);

    return {
        profile,
        isLoaded,
        addXp,
        updateAlignment,
        completeQuest,
        resetProfile,
        earnedAchievements,
        progress,
        ACHIEVEMENTS,
        questProgress,
        saveQuestProgress,
        clearQuestProgress,
        reflections,
        saveReflection,
    };
};
