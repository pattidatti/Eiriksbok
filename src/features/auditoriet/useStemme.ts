// Hvilken stemme foreleseren bruker akkurat nå.
//
// Nettleserens norske stemme når lyden er på og maskinen har en, ellers tekstmodus
// (lydløst, men munnen og tekstingen går i lesetempo). `ref` leses i det øyeblikket
// et segment starter, så et bytte gjelder fra neste segment.

import { useCallback, useEffect, useRef, useState } from 'react';
import { lagNettleserStemme, lagTekstStemme, ventPaStemmer, type Stemme } from './stemme';

export function useStemme(startMedLyd = true) {
    const [lydPa, setLydPa] = useState(startMedLyd);
    const [navn, setNavn] = useState<string | null>(null);
    const [harNorsk, setHarNorsk] = useState<boolean | null>(null);
    const ref = useRef<Stemme>(lagTekstStemme());

    useEffect(() => {
        let avbrutt = false;
        ventPaStemmer().then(() => {
            if (avbrutt) return;
            const nett = lagNettleserStemme();
            setHarNorsk(!!nett);
            const valgt = lydPa && nett ? nett : lagTekstStemme();
            ref.current = valgt;
            setNavn(valgt.navn);
        });
        return () => {
            avbrutt = true;
        };
    }, [lydPa]);

    const byttLyd = useCallback(() => setLydPa((p) => !p), []);
    const settLyd = useCallback((pa: boolean) => setLydPa(pa), []);

    return { ref, lydPa, navn, harNorsk, byttLyd, settLyd };
}
