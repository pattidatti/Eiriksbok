// Tallene HUD-en viser, lest fra spillet ti ganger i sekundet.

import { BRETT } from './levels';
import { pris } from './rules';
import { husleie, papirløse, type Game } from './state';
import { TUNING } from './tuning';

export interface HudData {
    år: number;
    brett: number;
    /** Hele sekunder til nyttår. */
    tilNyttår: number;
    saker: number;
    kasse: number;
    husleie: number;
    papirløse: number;
    rekke: number;
    /** Pass til fornyelse: plassen og hva et slag gir (+) eller koster (-). */
    lommer: { plass: number; pris: number }[];
    frimerke: boolean;
    /** Har pengene kommet (1932-)? Før det er kassa og regningen borte. */
    penger: boolean;
    /** Personer som har reist videre med gyldig pass. */
    hjulpet: number;
    /**
     * «Land som godtar passet»: vokser med én for hver reise, fra 32 til over 50 i 1938
     * (historisk godtok over 50 land passet). Kartet tegner bare de største. Bare visning.
     */
    land: number;
}

/** Telleren under kartet: start i 1931 og taket (over 50). */
export const GODTAR = { start: 32, maks: 54 };

export function lesHud(g: Game): HudData {
    return {
        år: BRETT[g.brett].år,
        brett: g.brett,
        tilNyttår: Math.max(0, Math.ceil(TUNING.år.sekunder - g.iÅr)),
        saker: g.saker,
        kasse: g.kasse,
        husleie: husleie(g.brett),
        papirløse: papirløse(g),
        rekke: g.rekke,
        lommer: g.pass
            .filter((p) => p.lomme || p.grå)
            .map((p) => ({ plass: p.plass, pris: pris(g, p) }))
            .filter((l) => l.pris !== 0),
        frimerke: !!g.frimerke,
        penger: BRETT[g.brett].penger,
        hjulpet: g.hjulpet,
        land: Math.min(GODTAR.maks, GODTAR.start + g.reiser.length),
    };
}

/** Er HUD-en lik som sist? Da slipper React å tegne den på nytt. */
export function sammeHud(a: HudData, b: HudData): boolean {
    if (
        a.år !== b.år ||
        a.tilNyttår !== b.tilNyttår ||
        a.saker !== b.saker ||
        a.kasse !== b.kasse ||
        a.husleie !== b.husleie ||
        a.papirløse !== b.papirløse ||
        a.rekke !== b.rekke ||
        a.frimerke !== b.frimerke ||
        a.penger !== b.penger ||
        a.hjulpet !== b.hjulpet ||
        a.land !== b.land ||
        a.lommer.length !== b.lommer.length
    )
        return false;
    return a.lommer.every((l, i) => l.plass === b.lommer[i].plass && l.pris === b.lommer[i].pris);
}
