// Robotene. De bruker de samme grepene som eleven (hold og bytt i game.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import { PLAYTEST_DT, type PlaytestBot } from '../playtest';
import { flate, helning, kanAnklage, stegStol } from './crowd';
import { aktivtBanner, anklag, bytt, hold, marsj } from './game';
import { FLERTALL, type Game } from './state';
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
        const varHold = k.hold;
        k.hold = t < 0.2 ? først : vane(k);
        k.t += h;
        if (varHold && !k.hold) k.slippT = k.t;
        const varHøyt = k.høyt;
        const l = stegStol(k, h, marsj(g));
        if (l && varHøyt) {
            k.høyt = false;
            if (l.kvalitet === 'dunk') return v - 100 + t;
            v += l.kvalitet === 'fin' ? 3 : -3;
        }
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

/**
 * Les banneret: ta kandidaten bare når den har flertallsfargen etter valget og den som sitter
 * ikke har det. `sen` = sekunder etter at banneret treffer (0 = perfekt).
 */
function vurderBytte(g: Game, sen: number) {
    const b = aktivtBanner(g);
    if (!b || !b.passasjer) return;
    const etter = b.rødt >= FLERTALL ? 'rød' : 'blå';
    if (b.passasjer.farge !== etter || g.stol.farge === etter) return;
    if (g.t - b.t >= sen - 0.15) bytt(g);
}

/** Anklag! når Venstre har over 60 %, etter å ha våget `vent` røde soner for bonusen. */
function vurderAnklag(g: Game, vent: number) {
    if (kanAnklage(g) && g.bom >= vent) anklag(g);
}

/** Grådig vane: tung ned bølgen og videre opp, slipper først rett før toppen. */
function høytSlipp(g: Game): boolean {
    if (g.luft) return false;
    const L = TUNING.hender.bølgelengde;
    const tilTopp = (((L / 4 - g.x) % L) + L) % L;
    if (tilTopp < g.vx * 0.12) return false;
    return true;
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
            'Lener ned bølgene og slipper opp dem, planlegger landingen, våger én rød sone før han trykker Anklag! og bytter til flertallets mann akkurat når banneret treffer stolen.',
        make: () => (g) => {
            vurderAnklag(g, 1);
            vurderBytte(g, 0);
            surf(g, 2.4);
        },
    },
    nølende: {
        forventer: 'middels',
        beskrivelse:
            'Følger flertallet, men treg: handler bare hvert andre øyeblikk, ser kort framover, anklager først etter to røde soner og bytter et drøyt sekund etter banneret.',
        make: () =>
            treg(2, (g) => {
                vurderAnklag(g, 2);
                vurderBytte(g, 1.2);
                surf(g, 1.2);
            }),
    },
    'kongens-mann': {
        forventer: 'taper',
        beskrivelse:
            'Surfer like godt som flertallsmannen, men er lojal mot kongen: anklager aldri og bytter aldri.',
        make: () => (g) => surf(g, 2.4),
    },
    grådig: {
        forventer: 'taper',
        beskrivelse:
            'Anklager og bytter riktig, men jager det høye slippet hver gang: lener helt opp mot toppen og slipper i siste liten, uansett hva som henger over gata.',
        make: () => (g) => {
            vurderAnklag(g, 1);
            vurderBytte(g, 0);
            const fri = !g.hindringer.some((o) => !o.forbi && o.x > g.x && o.x < g.x + 4);
            if (fri) hold(g, høytSlipp(g));
            else surf(g, 2.4);
        },
    },
    knappemoser: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Holder, slipper, anklager og bytter på måfå.',
        make: (rng) => (g) => {
            // Like stor sjanse for hold og slipp; bytt og anklag deler den siste tredjedelen.
            const r = rng();
            if (r < 1 / 3) hold(g, true);
            else if (r < 2 / 3) hold(g, false);
            else if (r < 5 / 6) bytt(g);
            else anklag(g);
        },
    },
};
