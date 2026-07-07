// Teller opp fra 0 til målverdien med ease-out - får XP-totaler og
// streak-tall til å føles levende ved innlasting. rAF-basert (samme mønster
// som EndComparisonScreen), og respekterer prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';

export const useCountUp = (target: number, duration = 900, delay = 0): number => {
    const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const [value, setValue] = useState(reduced ? target : 0);
    const rafRef = useRef<number>(0);

    // Redusert bevegelse: hopp rett til målverdien (justering under render,
    // guarded - ingen animasjon å kjøre).
    if (reduced && value !== target) setValue(target);

    useEffect(() => {
        if (reduced) return;
        let start: number | null = null;
        const tick = (now: number) => {
            if (start === null) start = now + delay;
            const elapsed = now - start;
            if (elapsed < 0) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            const t = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(target * eased));
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration, delay, reduced]);

    return value;
};
