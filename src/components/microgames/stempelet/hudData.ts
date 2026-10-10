// Tallene HUD-en viser, lest fra spillet ti ganger i sekundet.

import { BRETT } from './levels';
import { pris } from './rules';
import { husleie, papirløse, type Game } from './state';
import { TUNING } from './tuning';

export interface HudData {
    år: number;
    årAndel: number;
    saker: number;
    kasse: number;
    husleie: number;
    papirløse: number;
    rekke: number;
    /** Pass til fornyelse: plassen og hva et slag gir (+) eller koster (-). */
    lommer: { plass: number; pris: number }[];
    frimerke: boolean;
}

export function lesHud(g: Game): HudData {
    return {
        år: BRETT[g.brett].år,
        årAndel: g.iÅr / TUNING.år.sekunder,
        saker: g.saker,
        kasse: g.kasse,
        husleie: husleie(g.brett),
        papirløse: papirløse(g),
        rekke: g.rekke,
        lommer: g.pass
            .filter((p) => p.lomme || p.grå)
            .map((p) => ({ plass: p.plass, pris: pris(p) })),
        frimerke: !!g.frimerke,
    };
}
