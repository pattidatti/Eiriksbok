import { useEffect, useState } from 'react';

/** `performance.now()` oppdatert hvert bilde, så aktivitetene kan animere jevnt mellom HUD-oppdateringene. */
export function useNaa(): number {
    const [naa, setNaa] = useState(() => performance.now());
    useEffect(() => {
        let id = 0;
        const tikk = () => {
            setNaa(performance.now());
            id = requestAnimationFrame(tikk);
        };
        id = requestAnimationFrame(tikk);
        return () => cancelAnimationFrame(id);
    }, []);
    return naa;
}
