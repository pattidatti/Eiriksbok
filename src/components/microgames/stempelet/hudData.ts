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
    /** Land på kartet som passene har nådd. */
    land: number;
}

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
        land: new Set(g.reiser.map((r) => r.land)).size,
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
