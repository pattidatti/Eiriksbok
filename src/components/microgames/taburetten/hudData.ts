// Det HUD-en viser, lest av spillet ti ganger i sekundet.

import { kanAnklage, løft } from './crowd';
import { aktivtBanner, anklagBonus, tilJuli, tilSeier } from './game';
import { KALENDER, KALENDER_ETTER, type Farge, type Figur } from './levels';
import { FLERTALL, SETER, type Game } from './state';

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
    neste: {
        navn: string;
        farge: Farge;
        figur: Figur;
        om: number;
        /** Har kandidaten flertallet etter banneret? (kan leses FØR eleven trykker) */
        har: boolean;
        /** Seter kandidatens farge har etter banneret. */
        seter: number;
    } | null;
    /** Anklag!-knappen: synlig før dommen, virker bare med over 60 % rødt. */
    anklag: { synlig: boolean; virker: boolean; bonus: number };
    kanBytte: boolean;
    perfektNå: boolean;
    meter: number;
    fri: boolean;
    friNr: number;
    tilSeier: number;
    /** Målet i klartekst nederst i HUD-en (endrer seg med fasen). */
    mål: string;
    /** 0-1: hvor nær gata en synkende stol er (skraveringen kryper inn). */
    fare: number;
    bæres: 'flertall' | 'vern' | 'mellom' | 'synk';
}

export function lesHud(g: Game): HudData {
    let kalender = KALENDER[0].tekst;
    if (g.anklagT === null) {
        for (const k of KALENDER) if (g.t >= k.fra) kalender = k.tekst;
    } else for (const k of KALENDER_ETTER) if (g.t - g.anklagT >= k.fra) kalender = k.tekst;
    if (g.sverdrupT !== null && tilJuli(g) <= 0) kalender = '1. juli 1884';
    // Når valgplakaten vises, hopper stripa og avishodet til valget med en gang (samme tall som plakaten).
    const plakat = g.fri ? null : g.bannere.find((b) => !b.truffet && !b.dom && !b.passasjer);
    if (plakat && g.anklagT === null) kalender = 'Valget 1882';
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
        rødt: plakat ? plakat.rødt : g.rødt,
        kalender,
        nedtelling,
        poeng: Math.floor(g.poeng),
        mult: g.mult,
        stol: g.stol.navn,
        stolFarge: g.stol.farge,
        stolFigur: g.stol.figur,
        neste: kommer?.passasjer
            ? {
                  ...kommer.passasjer,
                  om: Math.max(0, Math.ceil(kommer.t - g.t)),
                  har: (kommer.rødt >= FLERTALL ? 'rød' : 'blå') === kommer.passasjer.farge,
                  seter: kommer.passasjer.farge === 'rød' ? kommer.rødt : SETER - kommer.rødt,
              }
            : null,
        anklag: {
            synlig: !g.fri && g.vern && !g.anklaget && g.t > 4,
            virker: kanAnklage(g),
            bonus: Math.round(anklagBonus(g)),
        },
        kanBytte: !!aktiv,
        perfektNå: !!aktiv && Math.abs(g.t - aktiv.t) <= g.perfektVindu,
        meter: Math.floor(g.meter),
        fri: g.fri,
        friNr: g.friNr,
        tilSeier: Math.ceil(tilSeier(g)),
        mål: mål(g),
        fare,
        bæres: l,
    };
}

function mål(g: Game): string {
    if (g.fri) return `Frispill: ${Math.floor(g.meter)} m langs Karl Johan`;
    if (g.sverdrupT !== null) return `Hold Sverdrup oppe til 1. juli: ${Math.ceil(tilJuli(g))} s`;
    if (g.seierT !== null) {
        const om = Math.ceil(tilSeier(g));
        return om > 0
            ? `Mål: flertallets mann i stolen - 26. juni om ${om} s`
            : 'Bytt til Sverdrup!';
    }
    if (kanAnklage(g)) return `Mål: trykk A - Anklag! (+${Math.round(anklagBonus(g))})`;
    return 'Mål: surf fram til valget 1882';
}

export { SETER };
