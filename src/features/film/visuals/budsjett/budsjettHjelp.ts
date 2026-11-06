import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

// Hjelpefunksjoner for Budsjett-filmens visualer (ikke komponenter, så egen fil for lint).

/** Et tall som glir mot målet (vinkel, høyde). Starter på `start` og går til `mal` etter montering. */
export function useGlidTall(mal: number, start = 0, varighet = 1.1) {
    const [verdi, setVerdi] = useState(start);
    const naa = useRef(start);
    useEffect(() => {
        const c = animate(naa.current, mal, {
            duration: varighet,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (x) => {
                naa.current = x;
                setVerdi(x);
            },
        });
        return () => c.stop();
    }, [mal, varighet]);
    return verdi;
}

/** Bredde på et kort som skal romme en tekst (ca. 0,55 x skriftstørrelse per tegn). */
export function kortBredde(tekst: string, str: number, luft = 48) {
    return Math.round(tekst.length * str * 0.56 + luft);
}
