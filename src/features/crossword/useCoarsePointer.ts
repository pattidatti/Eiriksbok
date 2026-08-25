// Har eleven fingeren eller musa som hovedverktøy?
//
// Vi kan ikke bruke skjermbredde til å svare på det. En iPad i liggende
// stilling er nøyaktig 1024 piksler bred, altså akkurat på «lg»-grensen, og
// falt derfor mellom to stoler: den fikk verken skjermtastatur eller
// ledetrådskuff, og brettet kunne ikke fylles i det hele tatt.
//
// «(pointer: coarse)» spør i stedet om hovedpekeren er grov (en finger).
// En Chromebook med styreflate svarer nei selv om skjermen er berøringsfølsom,
// og slipper dermed skjermtastaturet den ikke trenger.

import { useEffect, useState } from 'react';

const QUERY = '(pointer: coarse)';

const readMatch = (): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
};

export const useCoarsePointer = (): boolean => {
    const [coarse, setCoarse] = useState(readMatch);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const media = window.matchMedia(QUERY);
        const update = () => setCoarse(media.matches);
        update();
        // Hybridmaskiner bytter når tastaturet vippes bort eller musa kobles til
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    return coarse;
};
