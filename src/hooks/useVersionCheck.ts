import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useVersionCheck Hook
 * Periodically checks for a new version of the site by fetching /version.json
 */
export const useVersionCheck = (intervalMs = 60000) => {
    const [needRefresh, setNeedRefresh] = useState(false);
    // Versjonen vi startet med er en ren husk-verdi, ikke noe som skal tegnes.
    // Som state gjorde den checkVersion ustabil, og intervallet ble revet ned og
    // satt opp på nytt hver gang den ble satt.
    const currentVersionRef = useRef<string | null>(null);

    const checkVersion = useCallback(async () => {
        try {
            // Fetch with cache-busting query param to ensure we get the latest file from server
            const response = await fetch(`/version.json?v=${Date.now()}`, {
                cache: 'no-store'
            });

            if (!response.ok) return;

            const data = await response.json();
            const newVersion = data.version;
            if (!newVersion) return;

            if (currentVersionRef.current === null) {
                currentVersionRef.current = newVersion;
            } else if (currentVersionRef.current !== newVersion) {
                console.log(`[VersionCheck] New version detected: ${newVersion} (Current: ${currentVersionRef.current})`);
                setNeedRefresh(true);
            }
        } catch (error) {
            console.error('[VersionCheck] Failed to check version:', error);
        }
    }, []);

    useEffect(() => {
        // Initial check.
        // checkVersion er async og setter først state etter at nettverkskallet
        // har svart — altså aldri synkront i effect-kroppen. Å polle serveren
        // for en ny versjon er nettopp den abonnements-jobben effects er til for.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkVersion();

        // Set up periodic check
        const interval = setInterval(checkVersion, intervalMs);
        return () => clearInterval(interval);
    }, [checkVersion, intervalMs]);

    const updateNow = useCallback(() => {
        window.location.reload();
    }, []);

    return {
        needRefresh,
        setNeedRefresh,
        updateNow
    };
};
