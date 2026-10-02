// Robotene. De bruker de samme grepene som eleven (bytt og hold i rules.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import type { Side } from './levels';
import { bytt, hold, klarBåt, ledig, påVei, sisteStart } from './rules';
import type { Båt } from './state';
import type { Game } from './state';

type Grep = (g: Game) => void;

const SIDER: Side[] = ['B', 'S'];

/** Fortsett å fire en båt som allerede er på vei ned. */
function fortsett(g: Game): boolean {
    for (const side of SIDER) {
        const i = g.davit[side];
        if (i !== null && g.båter[i].tilstand === 'fires') {
            hold(g, side);
            return true;
        }
    }
    return false;
}

/** Pek landgangen mot en båt som har plass. Bytter bare om siden den peker mot ikke har det. */
function pekMot(g: Game, ønsket: Båt | undefined, bedreMed: number, slakk: (b: Båt) => number) {
    if (!ønsket || ønsket.side === g.landgang) return;
    const nå = klarBåt(g, g.landgang);
    if (!nå || ledig(nå) <= 0 || slakk(nå) - slakk(ønsket) > bedreMed) bytt(g, ønsket.side);
}

/**
 * Den kloke styrmannen: venter så lenge planen tåler (vannet, krengningen og båtene
 * som kommer etter), firer fulle båter med en gang, og har landgangen mot båten med
 * kortest lunte.
 */
function klok(margin: number, fullNok: number, bedreMed: number, ser: number): Grep {
    return (g) => {
        if (g.mode !== 'play') return;
        const plan = sisteStart(g);
        const klare = SIDER.map((s) => klarBåt(g, s)).filter((b) => b !== null);
        const slakk = (b: Båt) => (plan.get(b.nr) ?? Infinity) - g.t - margin;
        klare.sort((a, b) => slakk(a) - slakk(b));
        // Ingen i køen og ingen i trappene (eller bak porten) på lenge: send båten,
        // så skjønner flere at det er alvor.
        const ledigeNå = klare.reduce((s, b) => s + ledig(b), 0);
        const ingenKommer = (b: Båt) =>
            ser > 0 && !g.kø.length && b.folk >= 3 && påVei(g, ser) < ledigeNå * 0.15;
        // Landgangen flyttes også mens hånda firer den andre båten.
        const firer = fortsett(g);
        if (!firer) {
            const nå = klare.find(
                (b) => b.folk >= b.plasser * fullNok || slakk(b) <= 0 || ingenKommer(b)
            );
            if (nå) hold(g, nå.side);
            else hold(g, null);
        }
        pekMot(
            g,
            klare.find((b) => ledig(b) > 0),
            bedreMed,
            slakk
        );
    };
}

/** Ignorerer fagkjernen om tomme plasser: firer så snart det sitter noen i båten. */
function firStraks(): Grep {
    return (g) => {
        if (g.mode !== 'play' || fortsett(g)) return;
        const klare = SIDER.map((s) => klarBåt(g, s)).filter((b) => b !== null);
        for (const b of klare)
            if (b.folk > 0) {
                hold(g, b.side);
                return;
            }
        hold(g, null);
        pekMot(
            g,
            klare.find((b) => ledig(b) > 0),
            0,
            () => 0
        );
    };
}

/** Venter alltid på full båt, uansett hvor kort lunta er. */
function venterAlltid(): Grep {
    return (g) => {
        if (g.mode !== 'play' || fortsett(g)) return;
        const klare = SIDER.map((s) => klarBåt(g, s)).filter((b) => b !== null);
        for (const b of klare)
            if (ledig(b) === 0) {
                hold(g, b.side);
                return;
            }
        hold(g, null);
        pekMot(
            g,
            klare.find((b) => ledig(b) > 0),
            0,
            () => 0
        );
    };
}

function tilfeldig(rng: Rng): Grep {
    return (g) => {
        if (g.mode !== 'play') return;
        const r = Math.floor(rng() * 5);
        if (r === 0) bytt(g);
        else if (r === 1) hold(g, 'B');
        else if (r === 2) hold(g, 'S');
        else hold(g, null);
    };
}

/** Bare hvert n-te grep (en tregere elev). */
const treg = (n: number, grep: Grep): Grep => {
    let k = 0;
    return (g) => {
        if (k++ % n === 0) grep(g);
    };
};

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => Grep;
}

export const BOTS: Record<string, BotDef> = {
    klok: {
        forventer: 'vinner',
        beskrivelse:
            'Har landgangen mot båten med kortest lunte, venter så lenge vannet og krengningen tåler det og firer fulle båter straks.',
        make: () => klok(1.2, 1, 2, 22),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme plan, men reagerer bare hvert andre øyeblikk, firer med god margin og nøyer seg med nesten fulle båter.',
        make: () => treg(2, klok(6, 0.8, 6, 0)),
    },
    'fir-straks': {
        forventer: 'taper',
        beskrivelse:
            'Firer så snart det sitter noen i båten - ignorerer at tomme plasser er borte for alltid.',
        make: () => firStraks(),
    },
    'venter-alltid': {
        forventer: 'taper',
        beskrivelse: 'Venter alltid på full båt, uansett lunta - vannet og krengningen tar båtene.',
        make: () => venterAlltid(),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Bytter side, holder og slipper tilfeldig uten plan.',
        make: (rng) => tilfeldig(rng),
    },
};
