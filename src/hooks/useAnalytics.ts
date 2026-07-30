import { useEffect, useRef } from 'react';
import { getFirebase } from '../lib/firebaseLazy';

const VIEW_SESSION_KEY = 'gravity_analytics_session';

export const useAnalytics = (id: string | undefined) => {
    const countedRef = useRef(false);

    useEffect(() => {
        if (!id || countedRef.current) return;

        // Sanitize ID for Firebase path (replace / with _)
        const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
        const sessionKey = `${VIEW_SESSION_KEY}_${safeId}`;

        // Check sessionStorage to prevent counted views in same session (refresh)
        if (sessionStorage.getItem(sessionKey)) {
            countedRef.current = true;
            return;
        }

        // Increment view count in Firebase
        getFirebase()
            .then(({ db, ref, runTransaction }) =>
                runTransaction(ref(db, `analytics/views/${safeId}`), (currentViews) => {
                    return (currentViews || 0) + 1;
                })
            )
            .then(() => {
                sessionStorage.setItem(sessionKey, 'true');
                countedRef.current = true;
            })
            .catch((err) => {
                console.error('[Analytics] Failed to track view:', err);
            });

    }, [id]);
};
