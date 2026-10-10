// Robotene. De bruker de samme grepene som eleven (sikt, trykk, slipp i game.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import { siktPlass, sikt, slipp, trykk } from './game';
import { BRETT, FRIMERKE_PLASS } from './levels';
import { kanStemple, pris } from './rules';
import { husleie, papirløse, type Game, type Pass } from './state';
import { TUNING } from './tuning';

type Grep = (g: Game) => void;

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => Grep;
}

type Mål = Pass | 'frimerke';

/**
 * Slagmaskinen: sikter på målet og trykker, og slipper etter `holdTikk` grep
 * (2 grep = 0,4 s = fullt slag). Etter hvert slag venter den `pause` grep, som en
 * hånd som skal finne neste pass.
 */
function slagmaskin(velg: (g: Game) => Mål | null, holdTikk: () => number, pause = 1): Grep {
    let holdt = 0;
    let mål = 2;
    let vent = 0;
    return (g) => {
        if (g.stempel.hold !== null) {
            holdt++;
            if (holdt >= mål) {
                slipp(g);
                vent = pause;
            }
            return;
        }
        if (vent > 0) {
            vent--;
            return;
        }
        const m = velg(g);
        if (!m) return;
        if (m === 'frimerke') sikt(g, FRIMERKE_PLASS.x, FRIMERKE_PLASS.z);
        else siktPlass(g, m.plass);
        holdt = 0;
        mål = holdTikk();
        trykk(g);
    };
}

const tilFornyelse = (g: Game) => g.pass.filter((p) => p.lomme || p.grå);

/**
 * Den flinke: redder først det som er i ferd med å gå ut, så frimerkearket, så mynt-passene
 * (gebyret). Tomme lommer tar den sent, rett før de går ut, og bare når kassa tåler det.
 */
function klok(g: Game, frimerker = true): Mål | null {
    const leie = husleie(g.brett);
    const igjenAvÅret = TUNING.år.sekunder - g.iÅr;
    const fare = papirløse(g) >= TUNING.tap.papirløse - 2;
    const buffer = igjenAvÅret < 10 ? leie : Math.ceil(leie / 2);
    const kandidater = tilFornyelse(g)
        .filter((p) => kanStemple(g, p))
        .filter((p) => pris(g, p) > 0 || fare || g.kasse + pris(g, p) >= buffer)
        .sort((a, b) => (a.grå ? 0 : a.igjen) - (b.grå ? 0 : b.igjen));
    const haster = kandidater.find((p) => p.grå || p.igjen < 2.5);
    if (haster) return haster;
    if (g.frimerke && frimerker) return 'frimerke';
    const mynt = kandidater.find((p) => pris(g, p) > 0);
    if (mynt) return mynt;
    return kandidater.find((p) => p.igjen < 4) ?? null;
}

export const BOTS: Record<string, BotDef> = {
    saksbehandler: {
        forventer: 'vinner',
        beskrivelse:
            'kortest bånd først, slår frimerkearket og sparer til husleia',
        make: () => slagmaskin((g) => klok(g), () => 2, 1),
    },
    nybegynner: {
        forventer: 'middels',
        beskrivelse:
            'følger samme plan, men er treg mellom slagene',
        make: () => slagmaskin((g) => klok(g), () => 2, 4),
    },
    'gratis-for-alle': {
        forventer: 'taper',
        beskrivelse: 'fornyer alle i rekkefølge og bryr seg ikke om kassa eller frimerkene',
        make: () =>
            slagmaskin(
                (g) =>
                    tilFornyelse(g)
                        .filter((p) => kanStemple(g, p))
                        .sort((a, b) => (a.grå ? 0 : a.igjen) - (b.grå ? 0 : b.igjen))[0] ?? null,
                () => 2,
                1
            ),
    },
    knappemoser: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'slår tilfeldige pass og ark uten plan',
        make: (rng) =>
            slagmaskin(
                (g) => {
                    if (rng() < 0.3) return null;
                    const alle: Mål[] = [...g.pass, ...(g.frimerke ? ['frimerke' as const] : [])];
                    return alle.length ? alle[Math.floor(rng() * alle.length)] : null;
                },
                () => 1 + Math.floor(rng() * 6),
                1
            ),
    },
};

/** For tester og rapporter: årets brett. */
export const brettNå = (g: Game) => BRETT[g.brett];
