// Selvspill-kontrakten for mikrospill.
//
// Hvert nytt spill registrerer et lite test-API med usePlaytest(). Da kan
// scripts/playtest-microgame.mjs spille det headless med roboter som spillet selv
// definerer, og sjekke det et menneske ellers måtte prøve seg fram til:
//
//   - at en robot som spiller fornuftig VINNER (spillet kan vinnes),
//   - at en som ikke gjør noe, eller spiller dumt, TAPER (valgene betyr noe),
//   - at dyktig spill gir flere poeng enn slurvete spill,
//   - at bildet lever av seg selv, at tekst ikke dekker spillet, og at ingenting kræsjer.
//
// Robotene skal bruke de SAMME grepene som eleven har (flytt, kast, mal, hent),
// bare uten piksel-sikting. En robot som jukser ved å sette poeng direkte, beviser
// ingenting. Alt her kjører kun i utvikling (import.meta.env.DEV); i produksjon
// fjerner byggeren hele registreringen.
//
// Referanser: HavetKommer.tsx (2D) og Stavkirken3D.tsx (3D).

import { useEffect, useRef } from 'react';

export type PlaytestPhase = 'meny' | 'spiller' | 'vunnet' | 'tapt';

export interface PlaytestSnapshot {
    fase: PlaytestPhase;
    poeng: number;
    /** 0-1: hvor langt mot målet runden har kommet (år, avstand, bølger ...). */
    framdrift: number;
    /** Spilte sekunder i spillets egen tid. Lar harnessen skille spillets tempo fra headless-tempoet. */
    tid?: number;
}

export interface PlaytestBot {
    /** 'vinner' = skal vinne minst én av to runder. 'taper' = skal aldri vinne. */
    forventer: 'vinner' | 'taper';
    /** Én setning: hva roboten gjør. Havner i rapporten. */
    beskrivelse: string;
    /** Valg fra startmenyen roboten spiller med (f.eks. 'stolper'). Sendes til start(). */
    variant?: string;
    /** Kalles ca. hvert 200. ms mens fasen er 'spiller'. Ett grep per kall er nok. */
    tick: () => void;
}

export interface PlaytestApi {
    /** Lengste mulige runde i sekunder ved normal fart. Harnessen gir opp etter dette. */
    maksSekunder: number;
    snapshot: () => PlaytestSnapshot;
    /** Start en ny runde rett fra hvilken som helst fase (meny, slutt-skjerm, midt i). */
    start: (variant?: string) => void;
    /** Minst én 'vinner' og én 'taper'. «Passiv» (ingen input) testes alltid i tillegg. */
    bots: Record<string, PlaytestBot>;
}

type PlaytestWindow = Window & { __mgPlaytest?: Record<string, PlaytestApi> };

/**
 * Tidsakselerasjon for selvspill: ?mgfart=4 ber spillet kjøre fire simuleringssteg
 * per bilde. Headless-GPU (swiftshader) gir 5-10 bilder i sekundet, og uten dette
 * tar én runde på tre minutter en halvtime. Alltid 1 i produksjon.
 */
export function playtestSpeed(): number {
    if (!import.meta.env.DEV || typeof window === 'undefined') return 1;
    const n = Number(new URLSearchParams(window.location.search).get('mgfart'));
    return Number.isFinite(n) && n >= 1 ? Math.min(8, Math.floor(n)) : 1;
}

/**
 * Registrerer spillets test-API på window.__mgPlaytest[id]. Kall den i
 * spillkomponenten med en fabrikk som leser refs (ikke state), slik at
 * snapshot() alltid ser siste bilde.
 */
export function usePlaytest(id: string, make: () => PlaytestApi): void {
    const makeRef = useRef(make);
    useEffect(() => {
        makeRef.current = make;
    });
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as PlaytestWindow;
        // Proxy mot siste fabrikk, så API-et aldri holder en gammel closure.
        const api: PlaytestApi = {
            get maksSekunder() {
                return makeRef.current().maksSekunder;
            },
            snapshot: () => makeRef.current().snapshot(),
            start: (variant) => makeRef.current().start(variant),
            get bots() {
                return makeRef.current().bots;
            },
        };
        w.__mgPlaytest = { ...(w.__mgPlaytest ?? {}), [id]: api };
        return () => {
            if (w.__mgPlaytest) delete w.__mgPlaytest[id];
        };
    }, [id]);
}
