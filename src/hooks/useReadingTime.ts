import { useEffect, useRef } from 'react';
import { getFirebase } from '../lib/firebaseLazy';
import { useLocation } from 'react-router-dom';

export const useReadingTime = () => {
    const location = useLocation();
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        // Reset start time on path change
        startTimeRef.current = Date.now();
        const currentPath = location.pathname;

        return () => {
            const duration = Date.now() - startTimeRef.current;

            // Only log if duration is meaningful (> 5 seconds) and not unreasonably long (< 4 hours)
            // This filters out accidental clicks and "left tab open overnight"
            if (duration > 5000 && duration < 14400000) {
                // Sanitize path for Firebase key (replace / with _)
                const safePath = currentPath.replace(/[^a-zA-Z0-9-_]/g, '_');

                // Firebase hentes først her, altså kun når eleven faktisk har
                // lest lenge nok til at målingen teller. Ved navigasjon i appen
                // rekker importen å løse seg og skrivingen går gjennom; lukker
                // eleven fanen, går hendelsen tapt - slik den også gjorde med
                // den statiske importen.
                void getFirebase()
                    .then(({ db, ref, push, serverTimestamp }) =>
                        push(ref(db, `analytics/reading_time/${safePath}`), {
                            duration: duration,
                            timestamp: serverTimestamp(),
                            path: currentPath
                        })
                    )
                    .catch(err => console.error("Failed to log reading time", err));
            }
        };
    }, [location.pathname]);
};
