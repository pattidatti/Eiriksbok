// Robotene. De bruker de samme grepene som eleven (hold og bytt i game.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import { PLAYTEST_DT, type PlaytestBot } from '../playtest';
import { flate, helning, stegStol } from './crowd';
import { bytt, hold, kanBytte, marsj } from './game';
import { harFlertall, type Game } from './state';
import { TUNING } from './tuning';

type Grep = (g: Game) => void;

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => Grep;
}

/** Grunnvanen: tung ned bølgene, lett opp dem og i lufta. */
function vane(g: Game): boolean {
    if (g.luft) return false;
    const foran = g.x + g.vx * 0.1;
    return helning(g, foran) < 0 && flate(g, foran) > 0;
}

/**
 * Spill videre i en kopi: `først` de neste 0,2 s, så grunnvanen. Gir en verdi:
 * krasj er katastrofe, fin landing og avisark er bra, dunk er dårlig.
 */
function utsikt(g: Game, først: boolean, horisont: number): number {
    const k = { ...g } as Game;
    const h = PLAYTEST_DT / TUNING.fysikk.delsteg;
    // Litt sikkerhetsmargin rundt hindringene.
    const halv = TUNING.hindring.bredde / 2 + 0.15;
    const m = 0.15;
    const tatt = new Set<number>();
    let v = 0;
    for (let t = 0; t < horisont; t += h) {
        k.hold = t < 0.2 ? først : vane(k);
        const l = stegStol(k, h, marsj(g));
        for (const o of g.hindringer) {
            if (Math.abs(k.x - o.x) > halv) continue;
            if (o.type === 'tråd' ? k.y + TUNING.fysikk.stolHøyde > o.bunn - m : k.y < o.topp + m)
                return v - 100 + t;
        }
        g.ark.forEach((a, i) => {
            if (!a.tatt && !tatt.has(i) && Math.hypot(k.x - a.x, k.y + 0.45 - a.y) < 0.95) {
                tatt.add(i);
                v += 2;
            }
        });
        if (l?.kvalitet === 'fin') v += 0.5;
        if (l?.kvalitet === 'dunk') v -= 0.5;
    }
    return v + k.vx * 0.4;
}

/** Len og hopp. `horisont` > 0: se framover og velg det beste; 0: bare grunnvanen. */
function surf(g: Game, horisont: number) {
    if (horisont <= 0) {
        hold(g, vane(g));
        return;
    }
    const på = utsikt(g, true, horisont);
    const av = utsikt(g, false, horisont);
    hold(g, på === av ? vane(g) : på > av);
}

/** Bytt når et banner gir køen flertallet - akkurat når det treffer, eller etter `sen` sekunder. */
function vurderBytte(g: Game, sen: number) {
    if (!kanBytte(g) || !g.kø) return;
    const ny = g.kø.farge;
    const sitter = g.stol?.farge;
    for (const b of g.bannere) {
        const flertallEtter = b.rødt >= 58 ? 'rød' : 'blå';
        if (flertallEtter !== ny || flertallEtter === sitter) continue;
        const dt = g.t - b.t;
        if (dt >= sen - 0.15 && dt < sen + 2) {
            bytt(g);
            return;
        }
    }
    // Sitter det en uten flertall og køen har det, bytt uansett (sent er bedre enn aldri).
    const uten = g.stol && !harFlertall(g, g.stol.farge);
    const ventende = g.bannere.some((b) => !b.truffet);
    const sist = Math.max(-99, ...g.bannere.filter((b) => b.truffet).map((b) => b.t));
    if (sen > 0 && uten && harFlertall(g, ny) && !ventende && g.t - sist > sen) bytt(g);
}

/** Bare hvert n-te tick: en treg elev. */
function treg(n: number, grep: Grep): Grep {
    let i = 0;
    return (g) => {
        if (i++ % n === 0) grep(g);
    };
}

export const BOTS: Record<string, BotDef> = {
    flertallsmann: {
        forventer: 'vinner',
        beskrivelse:
            'Lener ned bølgene og slipper opp dem, planlegger landingen, og bytter til flertallets mann akkurat når banneret treffer stolen.',
        make: () => (g) => {
            vurderBytte(g, 0);
            surf(g, 2.4);
        },
    },
    nølende: {
        forventer: 'middels',
        beskrivelse:
            'Følger flertallet, men treg: handler bare hvert andre øyeblikk, planlegger ikke landingen og bytter et drøyt sekund etter banneret.',
        make: () =>
            treg(2, (g) => {
                vurderBytte(g, 1.2);
                surf(g, 0.6);
            }),
    },
    'kongens-mann': {
        forventer: 'taper',
        beskrivelse:
            'Surfer like godt som flertallsmannen, men bytter aldri: holder på kongens embetsmann i stolen.',
        make: () => (g) => surf(g, 2.4),
    },
    knappemoser: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Holder, slipper og bytter på måfå.',
        make: (rng) => (g) => {
            const r = rng();
            if (r < 0.45) hold(g, true);
            else if (r < 0.9) hold(g, false);
            else bytt(g);
        },
    },
};
