// Tallene HUD-en viser, lest fra spillet ti ganger i sekundet.

import { BRETT } from './levels';
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
    };
}
