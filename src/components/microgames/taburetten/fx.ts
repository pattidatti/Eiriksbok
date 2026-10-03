// Det visningen trenger å vite om øyeblikkene (juice), utenom spilltilstanden.
// Komponenten skriver hit når spillet melder noe; world-filene leser hver frame.

import type { Passasjer } from './levels';

export interface Fx {
    /** Skjelv (0-1). Svinner i ekte tid i kameraet, ikke i spillets tidssteg. */
    skjelv: number;
    /** Ekte tid (s) for siste øyeblikk av hvert slag, for animasjonene. */
    perfekt: number;
    fin: number;
    dunk: number;
    ark: number;
    smell: number;
    bytte: number;
    /** Den som ble kastet av ved siste bytte, og hvor stolen var da. */
    kastet: Passasjer | null;
    kastX: number;
    kastY: number;
    /** Stolen i spillvinduet (piksler), for lapper og poengtekst. */
    stolSkjerm: { x: number; y: number } | null;
    /** Neste valgbanner i spillvinduet. */
    bannerSkjerm: { x: number; y: number } | null;
    /** Spilltilstanden er ny (ny runde): nullstill animasjonene. */
    runde: number;
}

export function nyFx(): Fx {
    return {
        skjelv: 0,
        perfekt: -9,
        fin: -9,
        dunk: -9,
        ark: -9,
        smell: -9,
        bytte: -9,
        kastet: null,
        kastX: 0,
        kastY: 0,
        stolSkjerm: null,
        bannerSkjerm: null,
        runde: 0,
    };
}

/** Ekte tid i sekunder. */
export const nå = () => performance.now() / 1000;
