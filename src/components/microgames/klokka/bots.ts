// Robotene. De bruker de samme grepene som eleven (bytt og hold i rules.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import type { Side } from './levels';
import {
    bytt,
    hold,
    kanSendeStuert,
    klarBåt,
    køAntall,
    ledig,
    påVei,
    sendStuert,
    sisteStart,
} from './rules';
import { kl, TUNING } from './tuning';
import type { Båt, StuertMål } from './state';
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
/** Folk fra tredje klasse som står bak den stengte porten. */
const bakPort = (g: Game) =>
    g.grupper
        .filter((gr) => gr.klasse === 3 && !g.portÅpen && gr.pos >= TUNING.port.pos - 1e-6)
        .reduce((s, gr) => s + gr.antall, 0);

/**
 * Hvor stuerten skal (eller null). Den kloke sender ham når køen er kort (da koster det
 * lite at landgangen står): til porten når mange venter der, og til de sammenleggbare
 * båtene fra `riggFra`. Den halvgode husker ham bare av og til.
 */
type Stuert = (g: Game) => StuertMål | null;
const stuertKlok =
    (riggFra: string, minPort: number, kort: number): Stuert =>
    (g) => {
        const rolig = køAntall(g) < 8;
        // Ingen båt som henger, har kort lunte: da tåler landgangen en pause.
        const plan = sisteStart(g);
        const romslig = SIDER.every((s) => {
            const b = klarBåt(g, s);
            return !b || (plan.get(b.nr) ?? Infinity) - g.t > TUNING.stuert.borte + 4;
        });
        // Kort kø og mange bak porten: hent dem. Lang kø: rigg heller en båt til.
        const trengerFolk = bakPort(g) >= minPort && køAntall(g) < kort;
        if (kanSendeStuert(g, 'port') && trengerFolk && (rolig || romslig)) return 'port';
        if (g.t >= kl(riggFra) && kanSendeStuert(g, 'rigg') && romslig && !trengerFolk)
            return 'rigg';
        return null;
    };
const stuertGlemsk = (rng: Rng, hvert: [number, number], riggFra: string): Stuert => {
    let neste = kl('01.20') + rng() * hvert[1];
    return (g) => {
        if (g.t < neste) return null;
        neste = g.t + hvert[0] + rng() * (hvert[1] - hvert[0]);
        if (g.t >= kl(riggFra) && kanSendeStuert(g, 'rigg') && rng() < 0.5) return 'rigg';
        return kanSendeStuert(g, 'port') ? 'port' : null;
    };
};

function klok(
    margin: number,
    fullNok: number,
    bedreMed: number,
    ser: number,
    stuert: Stuert
): Grep {
    return (g) => {
        if (g.mode !== 'play') return;
        const mål = stuert(g);
        if (mål) sendStuert(g, mål);
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
        const r = Math.floor(rng() * 6);
        if (r === 5) sendStuert(g, rng() < 0.5 ? 'port' : 'rigg');
        else if (r === 0) bytt(g);
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
            'Har landgangen mot båten med kortest lunte, venter så lenge vannet og krengningen tåler det, firer fulle båter straks og sender stuerten når køen er kort: til porten når mange venter der, og til de sammenleggbare båtene mot slutten.',
        make: () => klok(1.2, 1, 2, 22, stuertKlok('01.42', 25, 60)),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme plan, men reagerer bare hvert andre øyeblikk, firer med god margin, nøyer seg med nesten fulle båter og husker stuerten bare av og til.',
        make: (rng) => treg(2, klok(6, 0.8, 6, 0, stuertGlemsk(rng, [25, 45], '01.50'))),
    },
    'fir-straks': {
        forventer: 'taper',
        beskrivelse:
            'Firer så snart det sitter noen i båten - ignorerer at tomme plasser er borte for alltid. Sender aldri stuerten.',
        make: () => firStraks(),
    },
    'venter-alltid': {
        forventer: 'taper',
        beskrivelse:
            'Venter alltid på full båt, uansett lunta - vannet og krengningen tar båtene. Sender aldri stuerten.',
        make: () => venterAlltid(),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Bytter side, holder, slipper og sender stuerten tilfeldig uten plan.',
        make: (rng) => tilfeldig(rng),
    },
};
