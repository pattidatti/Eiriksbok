import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sporLesetid } from '../lib/analytics';

export const useReadingTime = () => {
    const location = useLocation();
    // Settes av effecten under; Date.now() skal ikke kalles under render.
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        startTimeRef.current = Date.now();
        const currentPath = location.pathname;

        return () => {
            const duration = Date.now() - startTimeRef.current;

            // Bare målinger som betyr noe: over 5 sekunder (ikke et feilklikk)
            // og under 4 timer (ikke en fane som sto åpen over natten).
            if (duration > 5000 && duration < 14400000) {
                // Målingen skrives først her, altså kun når eleven faktisk har
                // lest lenge nok. Ved navigasjon i appen rekker den lazy
                // firebase-importen å løse seg; lukker eleven fanen, går
                // hendelsen tapt - slik den alltid har gjort.
                sporLesetid(currentPath, duration);
            }
        };
    }, [location.pathname]);
};
