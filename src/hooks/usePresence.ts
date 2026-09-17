import { useEffect, useRef } from 'react';
import { getFirebase } from '../lib/firebaseLazy';
import { useLocation } from 'react-router-dom';
import { getAnonId, sporDagensBesok } from '../lib/analytics';

const ANON_ID_KEY = 'gravity_anon_id';

export const usePresence = () => {
    const location = useLocation();
    const lastPathRef = useRef<string | null>(null);
    const lastSeenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Samme anonyme id som resten av målingen bruker.
        const hadde = (() => {
            try {
                return !!localStorage.getItem(ANON_ID_KEY);
            } catch {
                return true;
            }
        })();
        const anonId = getAnonId();
        const isNewUser = !hadde;

        const path = location.pathname;

        // Skip write if path hasn't changed (StrictMode double-fire guard)
        if (lastPathRef.current === path) return;
        lastPathRef.current = path;

        // Dagens unike besøkende + enhetsfordeling. Skriver maks én gang i
        // døgnet per enhet, så dette koster ingenting i navigasjon.
        sporDagensBesok();

        // Firebase lastes her, etter første tegning, i stedet for å ligge i
        // den eager pakken. Alle skrivingene under er ren analytikk.
        void getFirebase().then(({ db, ref, onDisconnect, set, serverTimestamp }) => {
            if (isNewUser) {
                set(ref(db, `analytics/unique_users/${anonId}`), {
                    firstSeen: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                    device: navigator.userAgent
                }).catch(err => console.error('Failed to track unique user', err));
            }

            // Manage "Active Now" presence - one write per navigation
            const presenceRef = ref(db, `analytics/active_users/${anonId}`);
            set(presenceRef, {
                path,
                lastActive: serverTimestamp(),
                online: true
            }).catch(err => console.error('Failed to set presence', err));

            onDisconnect(presenceRef).remove();
        });

        // Debounce lastSeen update: max one write per 30 seconds
        if (lastSeenTimerRef.current) clearTimeout(lastSeenTimerRef.current);
        lastSeenTimerRef.current = setTimeout(() => {
            void getFirebase().then(({ db, ref, set, serverTimestamp }) =>
                set(ref(db, `analytics/unique_users/${anonId}/lastSeen`), serverTimestamp())
            ).catch(() => {});
        }, 30_000);

        return () => {
            if (lastSeenTimerRef.current) clearTimeout(lastSeenTimerRef.current);
        };
    }, [location.pathname]);
};
