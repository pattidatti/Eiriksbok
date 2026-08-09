import React, { useState, useEffect } from 'react';
import type { ChronosProfile, ChronosRunLog } from '../../../data/chronos/types';
import { TimeTravelProfileContext, STORAGE_KEY, DEFAULT_PROFILE } from './TimeTravelProfileContext';

export const TimeTravelProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load Profile. Leses én gang ved mount i stedet for i en effect: da er
    // profilen på plass allerede i første render, og isLoading trengs ikke som
    // eget mellomsteg.
    const [profile, setProfile] = useState<ChronosProfile | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_PROFILE;
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse profile", e);
            return DEFAULT_PROFILE;
        }
    });
    const isLoading = false;

    // Save Profile Effect
    useEffect(() => {
        if (profile) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
    }, [profile]);

    const saveRun = (log: ChronosRunLog) => {
        if (!profile) return;
        setProfile((prev: ChronosProfile | null) => {
            if (!prev) return null;
            return {
                ...prev,
                graveyard: [log, ...prev.graveyard],
                totalRuns: prev.totalRuns + 1,
                totalWins: log.result === 'victory' ? prev.totalWins + 1 : prev.totalWins
            };
        });
    };

    const addLegacyItem = (itemId: string) => {
        if (!profile) return;
        if (!profile.legacyItems.includes(itemId)) {
            setProfile((prev: ChronosProfile | null) => prev ? ({
                ...prev,
                legacyItems: [...prev.legacyItems, itemId]
            }) : null);
        }
    };

    const unlockScenario = (scenarioId: string) => {
        if (!profile) return;
        if (!profile.unlockedScenarios.includes(scenarioId)) {
            setProfile((prev: ChronosProfile | null) => prev ? ({
                ...prev,
                unlockedScenarios: [...prev.unlockedScenarios, scenarioId]
            }) : null);
        }
    };

    const unlockTrophy = (trophyId: string) => {
        if (!profile) return;
        if (!profile.trophies.includes(trophyId)) {
            setProfile((prev: ChronosProfile | null) => prev ? ({
                ...prev,
                trophies: [...prev.trophies, trophyId]
            }) : null);
        }
    };

    const resetProfile = () => {
        setProfile(DEFAULT_PROFILE);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <TimeTravelProfileContext.Provider value={{ profile, isLoading, saveRun, unlockScenario, unlockTrophy, addLegacyItem, resetProfile }}>
            {children}
        </TimeTravelProfileContext.Provider>
    );
};
