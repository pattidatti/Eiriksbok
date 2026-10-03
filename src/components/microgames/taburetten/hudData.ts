// Det HUD-en viser, lest av spillet ti ganger i sekundet.

import { kanBytte } from './game';
import { BRETT } from './levels';
import { SETER, type Game } from './state';

export interface HudData {
    rødt: number;
    blått: number;
    kalender: string;
    poeng: number;
    mult: number;
    stol: string;
    stolFarge: 'rød' | 'blå' | null;
    kø: string | null;
    køFarge: 'rød' | 'blå' | null;
    kanBytte: boolean;
    meter: number;
}

export function lesHud(g: Game): HudData {
    let kalender = g.fri
        ? `Valg nr. ${g.friNr + 1}`
        : `${BRETT[g.brett].navn} (${BRETT[g.brett].år})`;
    if (g.nedtelling && !g.fri)
        kalender = `${g.nedtelling.tekst} om ${Math.max(0, Math.ceil(g.nedtelling.til - g.t))} s`;
    return {
        rødt: g.rødt,
        blått: SETER - g.rødt,
        kalender,
        poeng: Math.floor(g.poeng),
        mult: g.mult,
        stol: g.stol?.navn ?? 'Tom stol!',
        stolFarge: g.stol?.farge ?? null,
        kø: g.køSynlig && g.kø ? g.kø.navn : g.køSynlig ? 'løper opp ...' : null,
        køFarge: g.køSynlig && g.kø ? g.kø.farge : null,
        kanBytte: kanBytte(g),
        meter: Math.floor(g.meter),
    };
}
