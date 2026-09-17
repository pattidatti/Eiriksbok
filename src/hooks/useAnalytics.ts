import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sporVisning } from '../lib/analytics';

const VIEW_SESSION_KEY = 'gravity_analytics_session';

/**
 * Teller én sidevisning per økt per side. Selve skrivingen (totalteller,
 * dagsbøtte, fagbøtte og klokkeslett) ligger i src/lib/analytics.ts.
 */
export const useAnalytics = (id: string | undefined) => {
    const countedRef = useRef(false);
    const location = useLocation();

    useEffect(() => {
        if (!id || countedRef.current) return;

        const sessionKey = `${VIEW_SESSION_KEY}_${id.replace(/[^a-zA-Z0-9-_]/g, '_')}`;

        // sessionStorage hindrer at en refresh teller på nytt.
        try {
            if (sessionStorage.getItem(sessionKey)) {
                countedRef.current = true;
                return;
            }
            sessionStorage.setItem(sessionKey, 'true');
        } catch {
            /* privat modus: da teller vi heller litt for mye */
        }

        countedRef.current = true;
        sporVisning(id, location.pathname);
    }, [id, location.pathname]);
};
