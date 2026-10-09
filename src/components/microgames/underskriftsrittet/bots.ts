// Robotene. De bruker samme grep som eleven (styr i game.ts: hold en retning eller slipp, og
// rop: hold for å lese klagen høyt på tunet) og ser bare det eleven ser: hesten, tunene,
// lyktene og dragonene.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { brettAv, rop, styr, type Game } from './game';
import { dist } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => (g: Game) => void;
}

interface Vett {
    /** Rir unna når en lykt er nærmere enn lys + flukt. */
    flukt: number;
    /** Velger ikke en bygd der en lykt står nærmere tunet enn dette. */
    unngåTun: number;
    /** Leser høyt så mange sekunder før den slipper uansett (Infinity = til lyset kommer). */
    tålmod: number;
    /** Handler bare hvert n-te tick (treg elev). */
    hvert: number;
    /** Ser så mange sekunder fram: i galopp må du svinge unna tidligere. */
    forut: number;
    /** Bryr seg ikke om lyset i det hele tatt. */
    blind: boolean;
}

function vett(v: Vett) {
    return (rng: Rng) => {
        let n = 0;
        let mål = -1;
        let brett = -1;
        void rng;
        return (g: Game) => {
            if (n++ % v.hvert !== 0) return;
            const h = g.hest;
            const b = brettAv(g);
            if (g.brett !== brett) {
                brett = g.brett;
                mål = -1;
            }
            const farlige = v.blind ? [] : g.lykter.filter((l) => l.farlig);
            const lys = (l: { dragon: boolean }) => (l.dragon ? T.dragon.lys : T.lykt.lys);
            const trygg = (x: number, z: number) =>
                Math.min(30, ...farlige.map((l) => dist(l.x, l.z, x, z) - lys(l)));

            // Unngå lyset: rir bort fra lyktene som er for nær.
            let fx = 0;
            let fz = 0;
            for (const l of farlige) {
                const d = dist(l.x, l.z, h.x, h.z);
                const grense = lys(l) + v.flukt + (l.dragon ? 2 : 0) + h.fart * v.forut;
                if (d < grense) {
                    const k = (grense - d) / grense / Math.max(0.5, d);
                    fx += (h.x - l.x) * k;
                    fz += (h.z - l.z) * k;
                }
            }
            const fare = fx !== 0 || fz !== 0;
            if (fare || g.ropT > v.tålmod) rop(g, false);

            // Målet: en bygd uten segl der lyktene ikke er, eller utgangen når alle har segl.
            const velg = (unntak: number) => {
                let best = -Infinity;
                let i = -1;
                g.tun.forEach((t, k) => {
                    if (t.segl || k === unntak) return;
                    const s = v.blind
                        ? -dist(h.x, h.z, t.x, t.z)
                        : Math.min(trygg(t.x, t.z), v.unngåTun * 3) -
                          dist(h.x, h.z, t.x, t.z) * 0.25;
                    if (s > best) {
                        best = s;
                        i = k;
                    }
                });
                return i < 0 && unntak >= 0 && !g.tun[unntak].segl ? unntak : i;
            };
            if (mål >= 0 && g.tun[mål]?.segl) mål = -1;
            if (mål < 0) mål = velg(-1);
            const t = mål >= 0 ? g.tun[mål] : null;
            const dMål = t ? dist(h.x, h.z, t.x, t.z) : 99;
            // Lykta er på tunet: ri videre til en annen bygd.
            if (t && !v.blind && fare && dMål < T.tun.radius + 2) mål = velg(mål);
            if (t && !v.blind && trygg(t.x, t.z) < v.unngåTun && dMål > T.tun.radius)
                mål = velg(mål);
            const m = mål >= 0 ? g.tun[mål] : { x: b.ut[0], z: b.ut[1] };
            const mx = m.x;
            const mz = m.z;
            const d = Math.max(1, dist(h.x, h.z, mx, mz));

            if (fare) {
                // Se etter åpningen: prøv seksten retninger og ta den som holder lengst
                // avstand til lyset det neste halvannet sekundet, helst mot målet.
                const fart = Math.max(h.fart, 6);
                let best = -Infinity;
                let bx = 0;
                let bz = 0;
                for (let k = 0; k < 16; k++) {
                    const a = (k / 16) * Math.PI * 2;
                    const cx = Math.cos(a);
                    const cz = Math.sin(a);
                    let fri = 99;
                    for (let s = 1; s <= 4; s++) {
                        const px = h.x + cx * fart * s * 0.4;
                        const pz = h.z + cz * fart * s * 0.4;
                        const kant = T.grense - Math.max(Math.abs(px), Math.abs(pz));
                        fri = Math.min(fri, kant + 2);
                        for (const l of farlige)
                            fri = Math.min(fri, dist(l.x, l.z, px, pz) - lys(l));
                    }
                    const score =
                        Math.min(fri, 6) + ((cx * (mx - h.x) + cz * (mz - h.z)) / d) * 1.2;
                    if (score > best) {
                        best = score;
                        bx = cx;
                        bz = cz;
                    }
                }
                styr(g, bx, bz, 1);
                return;
            }
            if (mål >= 0 && d < T.tun.radius - 1.5) {
                // Stans og les klagen høyt til lyset kommer for nær (eller tålmodet tar slutt).
                styr(g, 0, 0, 0);
                if (g.ropT <= v.tålmod) rop(g, true);
                else if (g.ropT > v.tålmod) styr(g, h.x - mx, h.z - mz, 1);
                return;
            }
            rop(g, false);
            const nær = mål >= 0 && d < T.tun.radius + 3;
            styr(g, mx - h.x, mz - h.z, nær ? 0.35 : 1);
        };
    };
}

export const BOTS: Record<string, BotDef> = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Rir rolige sløyfer midt på tunet, rir ut når en lykt kommer nær, og velger bygda der lyktene ikke er.',
        make: vett({ flukt: 3.5, unngåTun: 4, tålmod: 99, hvert: 1, forut: 0.5, blind: false }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Gjør det samme, men reagerer seint (hvert tredje grep) og rir for fort over tunet.',
        make: vett({ flukt: 3, unngåTun: 2, tålmod: 3, hvert: 3, forut: 0.2, blind: false }),
    },
    grådig: {
        forventer: 'taper',
        beskrivelse: 'Samler navn som om lyset ikke fantes, og rir rett gjennom lyktene.',
        make: vett({ flukt: 0, unngåTun: 0, tålmod: 99, hvert: 1, forut: 0, blind: true }),
    },
    redd: {
        forventer: 'taper',
        beskrivelse:
            'Tør ikke samle mens det finnes lykter i nærheten, og holder seg unna til de har gått hjem.',
        make: vett({ flukt: 11, unngåTun: 14, tålmod: 99, hvert: 1, forut: 0.5, blind: false }),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Holder tilfeldige piltaster uten å se på tunene eller lyktene.',
        make: (rng) => (g) => {
            if (rng() < 0.1) rop(g, rng() < 0.4);
            if (rng() < 0.3) {
                if (rng() < 0.2) styr(g, 0, 0, 0);
                else styr(g, rng() * 2 - 1, rng() * 2 - 1, 1);
            }
        },
    },
};
