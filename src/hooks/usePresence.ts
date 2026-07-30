import { useEffect, useRef } from 'react';
import { getFirebase } from '../lib/firebaseLazy';
import { useLocation } from 'react-router-dom';

const ANON_ID_KEY = 'gravity_anon_id';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const usePresence = () => {
    const location = useLocation();
    const lastPathRef = useRef<string | null>(null);
    const lastSeenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Get or create persistent Anonymous ID
        let anonId = localStorage.getItem(ANON_ID_KEY);
        const isNewUser = !anonId;
        if (!anonId) {
            anonId = generateUUID();
            localStorage.setItem(ANON_ID_KEY, anonId);
        }

        const path = location.pathname;

        // Skip write if path hasn't changed (StrictMode double-fire guard)
        if (lastPathRef.current === path) return;
        lastPathRef.current = path;

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
            const id = localStorage.getItem(ANON_ID_KEY);
            if (id) {
                void getFirebase().then(({ db, ref, set, serverTimestamp }) =>
                    set(ref(db, `analytics/unique_users/${id}/lastSeen`), serverTimestamp())
                ).catch(() => {});
            }
        }, 30_000);

        return () => {
            if (lastSeenTimerRef.current) clearTimeout(lastSeenTimerRef.current);
        };
    }, [location.pathname]);
};
