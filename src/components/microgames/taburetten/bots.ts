// Robotene. De bruker de samme grepene som eleven (hold og bytt i game.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import { PLAYTEST_DT, type PlaytestBot } from '../playtest';
import { flate, helning, iRødSone, stegStol } from './crowd';
import { aktivtBanner, bytt, hold, marsj } from './game';
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
 * krasj er katastrofe, fin landing og avisark er bra, dunk er dårlig. `anklag` er hva en
 * fin landing på de røde hendene er verdt (negativ for den som er lojal mot kongen).
 */
function utsikt(g: Game, først: boolean, horisont: number, anklag: number): number {
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
        if (l?.kvalitet === 'fin') v += iRødSone(k, k.x) ? anklag : 0.5;
        if (l?.kvalitet === 'dunk') v -= 0.5;
    }
    return v + k.vx * 0.4;
}

/** Len og hopp. `horisont` > 0: se framover og velg det beste; 0: bare grunnvanen. */
function surf(g: Game, horisont: number, anklag = 6) {
    if (horisont <= 0) {
        hold(g, vane(g));
        return;
    }
    const på = utsikt(g, true, horisont, anklag);
    const av = utsikt(g, false, horisont, anklag);
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

/** Bytter på hvert banner, uansett farge: av gammel vane. */
function vaneBytte(g: Game, rng: Rng) {
    const b = aktivtBanner(g);
    if (b && g.t - b.t >= -0.2 + rng() * 0.4) bytt(g);
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
            'Lener ned bølgene og slipper opp dem, planlegger landingen, anklager på første røde sone og bytter til flertallets mann akkurat når banneret treffer stolen.',
        make: () => (g) => {
            vurderBytte(g, 0);
            surf(g, 2.4);
        },
    },
    nølende: {
        forventer: 'middels',
        beskrivelse:
            'Følger flertallet, men treg: handler bare hvert andre øyeblikk, ser kort framover og bytter et drøyt sekund etter banneret.',
        make: () =>
            treg(2, (g) => {
                vurderBytte(g, 1.2);
                surf(g, 1.2);
            }),
    },
    'kongens-mann': {
        forventer: 'taper',
        beskrivelse:
            'Surfer like godt som flertallsmannen, men er lojal mot kongen: anklager aldri og bytter aldri.',
        make: () => (g) => surf(g, 2.4, -6),
    },
    nervøs: {
        forventer: 'taper',
        beskrivelse:
            'Surfer godt, men bytter av gammel vane på hvert banner, også når kandidaten ikke har flertallet (Schweigaard-fella).',
        make: (rng) => (g) => {
            vaneBytte(g, rng);
            surf(g, 2.4);
        },
    },
    knappemoser: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Holder, slipper og bytter på måfå.',
        make: (rng) => (g) => {
            // Like stor sjanse for hvert av de tre grepene.
            const r = rng();
            if (r < 1 / 3) hold(g, true);
            else if (r < 2 / 3) hold(g, false);
            else bytt(g);
        },
    },
};
