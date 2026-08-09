import { createContext, useContext } from 'react';
import type { ChronosProfile, ChronosRunLog } from '../../../data/chronos/types';

export interface TimeTravelProfileContextType {
    profile: ChronosProfile | null;
    isLoading: boolean;
    saveRun: (log: ChronosRunLog) => void;
    unlockScenario: (scenarioId: string) => void;
    unlockTrophy: (trophyId: string) => void;
    addLegacyItem: (itemId: string) => void;
    resetProfile: () => void;
}

export const STORAGE_KEY = 'chronos_profile_v1';

export const DEFAULT_PROFILE: ChronosProfile = {
    id: 'local_user',
    name: 'Tidsreisende',
    created: Date.now(),
    unlockedScenarios: ['roman-soldier'], // Default unlocked
    trophies: [],
    graveyard: [],
    legacyItems: [],
    totalRuns: 0,
    totalWins: 0
};

export const TimeTravelProfileContext = createContext<TimeTravelProfileContextType | undefined>(undefined);

export const useTimeTravelProfile = () => {
    const context = useContext(TimeTravelProfileContext);
    if (context === undefined) {
        throw new Error('useTimeTravelProfile must be used within a TimeTravelProfileProvider');
    }
    return context;
};
