// Robotene. De bruker de samme grepene som eleven (gå og leggPå i game.ts) og ser bare det
// eleven ser: båten, lyset, varmen (rimet), stabelen og haugene. Ikke når neste båt kommer.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { gå, leggPå, type Game } from './game';
import { inne, stormIgjen } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => (g: Game) => void;
}

interface Vett {
    /** Begynner å fyre under denne varmen, og fyrer opp til fyrTil. */
    fyrUnder: number;
    fyrTil: number;
    /** Går ut etter ved når stabelen er under dette (og den ikke fyrer). */
    vedUnder: number;
    /** Sekunder før roboten reagerer på en båt (0 = med en gang). */
    treg: number;
    /** Bryr seg om båten mens den fyrer / er ute. */
    røykVett: boolean;
    lysVett: boolean;
}

const nærmesteHaug = (g: Game) => {
    const i = g.haug.findIndex((n) => n > 0);
    return T.haug[i < 0 ? T.haug.length - 1 : i].x;
};

function vett(v: Vett) {
    return (rng: Rng) => {
        let settBåt = -1;
        let fyrer = false;
        void rng;
        return (g: Game) => {
            const p = g.patrulje;
            if (p && p.fase !== 'drar') {
                if (settBåt < 0) settBåt = g.t;
            } else settBåt = -1;
            const fare = settBåt >= 0 && g.t - settBåt >= v.treg;
            if (g.varme < v.fyrUnder) fyrer = true;
            if (g.varme >= v.fyrTil || g.stabel === 0) fyrer = false;
            if (inne(g)) {
                // I stormen ser ingen røyken - det ser eleven på snøfokket.
                const kanFyre = !(fare && v.røykVett && stormIgjen(g) < 4) && g.stabel > 0;
                if (fyrer && kanFyre) {
                    gå(g, 0);
                    // Én kubbe om gangen: legg på når den forrige nesten har brent ut.
                    if (g.bål < 0.25) leggPå(g);
                    return;
                }
                const ut = g.stabel < v.vedUnder && !(fare && v.lysVett);
                gå(g, ut ? 1 : 0);
                return;
            }
            if (fare && v.lysVett) return gå(g, -1);
            if (g.fang > 0) return gå(g, -1);
            // Kaldt og ved i stabelen: gå inn og fyr før neste tur.
            if (fyrer && g.stabel > 0) return gå(g, -1);
            gå(g, nærmesteHaug(g) > g.x ? 1 : -1);
        };
    };
}

export const BOTS: Record<string, BotDef> = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Slipper fyringen og går inn med en gang båten synes, henter ved når båten er borte, og fyrer jevnt.',
        make: vett({ fyrUnder: 65, fyrTil: 95, vedUnder: 10, treg: 0, røykVett: true, lysVett: true }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Gjør det riktige, men ser båten litt seint og venter for lenge med å hente ved.',
        make: vett({ fyrUnder: 50, fyrTil: 85, vedUnder: 7, treg: 0.8, røykVett: true, lysVett: true }),
    },
    'fyrer-uansett': {
        forventer: 'taper',
        beskrivelse: 'Henter ved når båten er borte, men fyrer videre mens lyset kommer.',
        make: vett({ fyrUnder: 55, fyrTil: 100, vedUnder: 10, treg: 0, røykVett: false, lysVett: true }),
    },
    'går-i-lyset': {
        forventer: 'taper',
        beskrivelse: 'Slipper fyringen når båten kommer, men henter ved hele tida som om lyset ikke fantes.',
        make: vett({ fyrUnder: 55, fyrTil: 92, vedUnder: 10, treg: 0, røykVett: true, lysVett: false }),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Går og fyrer tilfeldig uten å se på båten, lyset eller varmen.',
        make: (rng) => (g) => {
            if (rng() < 0.3) gå(g, rng() < 0.5 ? -1 : rng() < 0.5 ? 0 : 1);
            if (rng() < 0.3) leggPå(g);
        },
    },
};
