// Det HUD-en viser, lest av spillet ti ganger i sekundet.

import { løft } from './crowd';
import { aktivtBanner, tilSeier } from './game';
import { KALENDER, type Farge, type Figur } from './levels';
import { SETER, type Game } from './state';

export interface HudData {
    rødt: number;
    kalender: string;
    nedtelling: string | null;
    poeng: number;
    mult: number;
    stol: string;
    stolFarge: Farge;
    stolFigur: Figur;
    /** Neste kandidat på et banner som kommer. */
    neste: { navn: string; farge: Farge; figur: Figur; om: number } | null;
    kanBytte: boolean;
    perfektNå: boolean;
    meter: number;
    fri: boolean;
    friNr: number;
    tilSeier: number;
    /** 0-1: hvor nær gata en synkende stol er (skraveringen kryper inn). */
    fare: number;
    bæres: 'flertall' | 'vern' | 'mellom' | 'synk';
}

export function lesHud(g: Game): HudData {
    let kalender = KALENDER[0].tekst;
    for (const k of KALENDER) if (g.t >= k.fra) kalender = k.tekst;
    if (g.fri) kalender = `Valg nr. ${g.friNr + 1}`;
    const nedtelling =
        g.nedtelling && !g.fri
            ? `${g.nedtelling.tekst} om ${Math.max(0, Math.ceil(g.nedtelling.til - g.t))} s`
            : null;
    const kommer = g.bannere.find((b) => b.passasjer && !b.tatt && g.t - b.t < 2.5);
    const aktiv = aktivtBanner(g);
    const l = løft(g);
    const fare = l === 'synk' || l === 'mellom' ? Math.max(0, Math.min(1, 1 - g.base / 1.6)) : 0;
    return {
        rødt: g.rødt,
        kalender,
        nedtelling,
        poeng: Math.floor(g.poeng),
        mult: g.mult,
        stol: g.stol.navn,
        stolFarge: g.stol.farge,
        stolFigur: g.stol.figur,
        neste: kommer?.passasjer
            ? { ...kommer.passasjer, om: Math.max(0, Math.ceil(kommer.t - g.t)) }
            : null,
        kanBytte: !!aktiv,
        perfektNå: !!aktiv && Math.abs(g.t - aktiv.t) <= g.perfektVindu,
        meter: Math.floor(g.meter),
        fri: g.fri,
        friNr: g.friNr,
        tilSeier: Math.ceil(tilSeier(g)),
        fare,
        bæres: l,
    };
}

export { SETER };
