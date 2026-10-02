// Robotene. De bruker de samme grepene som eleven (vink og hold i rules.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import type { Side } from './levels';
import { hold, klarBåt, ledig, sisteStart, vink } from './rules';
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

/**
 * Den kloke styrmannen: venter så lenge planen tåler (vannet, krengningen og båtene
 * som kommer etter), firer fulle båter med en gang, og vinker til båten med kortest tid igjen.
 */
function klok(margin: number, fullNok: number): Grep {
    return (g) => {
        if (g.mode !== 'play' || fortsett(g)) return;
        const plan = sisteStart(g);
        const klare = SIDER.map((s) => klarBåt(g, s)).filter((b) => b !== null);
        const slakk = (nr: number) => (plan.get(nr) ?? Infinity) - g.t - margin;
        klare.sort((a, b) => slakk(a.nr) - slakk(b.nr));
        for (const b of klare) {
            if (b.folk >= b.plasser * fullNok) {
                hold(g, b.side);
                return;
            }
            if (slakk(b.nr) <= 0) {
                // Tiden er ute: fyll det som står i køen, så fir.
                if (g.kø.length && ledig(b) > 0) vink(g, b.side);
                else hold(g, b.side);
                return;
            }
        }
        const plass = klare.filter((b) => ledig(b) > 0);
        if (g.kø.length && plass.length) {
            vink(g, plass[0].side);
            return;
        }
        hold(g, null);
    };
}

function firStraks(): Grep {
    return (g) => {
        if (g.mode !== 'play' || fortsett(g)) return;
        for (const side of SIDER) {
            const b = klarBåt(g, side);
            if (!b) continue;
            if (g.kø.length && ledig(b) > 0) {
                vink(g, side);
                return;
            }
            if (b.folk > 0) {
                hold(g, side);
                return;
            }
        }
    };
}

function venterAlltid(): Grep {
    return (g) => {
        if (g.mode !== 'play' || fortsett(g)) return;
        for (const side of SIDER) {
            const b = klarBåt(g, side);
            if (!b) continue;
            if (ledig(b) === 0) {
                hold(g, side);
                return;
            }
            if (g.kø.length) {
                vink(g, side);
                return;
            }
        }
    };
}

function tilfeldig(rng: Rng): Grep {
    return (g) => {
        if (g.mode !== 'play') return;
        const r = Math.floor(rng() * 5);
        if (r === 0) vink(g, 'B');
        else if (r === 1) vink(g, 'S');
        else if (r === 2) hold(g, 'B');
        else if (r === 3) hold(g, 'S');
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
            'Venter på gruppene i trappene så lenge vannet og krengningen tåler det, firer fulle båter straks og vinker til båten med kortest tid igjen.',
        make: () => klok(1.5, 1),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme plan, men reagerer bare hvert andre øyeblikk, firer med god margin og nøyer seg med nesten fulle båter.',
        make: () => treg(2, klok(8, 0.85)),
    },
    'fir-straks': {
        forventer: 'vinner',
        beskrivelse: 'Firer så snart det sitter noen i båten og køen er tom - mange tomme plasser.',
        make: () => firStraks(),
    },
    'venter-alltid': {
        forventer: 'taper',
        beskrivelse: 'Ignorerer vannet og krengningen: firer bare helt fulle båter.',
        make: () => venterAlltid(),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Vinker, holder og slipper på tilfeldige sider uten plan.',
        make: (rng) => tilfeldig(rng),
    },
};
