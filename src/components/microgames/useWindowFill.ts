import { useEffect } from 'react';

// «Fullskjerm» i mikrospill fyller nettleservinduet, ikke hele skjermen (eier,
// 2026-10-09): eleven beholder fanene, klokka og resten av maskinen, og Esc
// tilhører spillet (pause) i stedet for å kaste eleven ut. Mens et spill fyller
// vinduet, låses sidescrollen og sidens klebrige meny skjules - artikkelen ligger
// i en egen stablingskontekst, så den ville ligget over spillet uansett z-index.
export function useWindowFill(active: boolean) {
    useEffect(() => {
        if (!active) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mg-pseudo-open');
        return () => {
            document.body.style.overflow = prev;
            document.body.classList.remove('mg-pseudo-open');
        };
    }, [active]);
}
