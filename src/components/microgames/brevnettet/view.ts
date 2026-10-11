// Delte konstanter og hjelpere for visningen (egen fil, så world.tsx bare eksporterer komponenter).

import { HAUGE, avstand, type Punkt } from './net';
import type { Game } from './game';

/** Hvor nær (i verdensenheter) pekeren må være en prikk for å treffe den. */
export const TREFF = 0.95;

export const FARGE = {
    vegg: '#2b1e16',
    ull: '#e9dfc6',
    brun: '#7a6450',
    grå: '#8a8580',
    indigo: '#2f4f86',
    gul: '#e2ae3a',
    rød: '#a8322a',
    svart: '#1a1410',
};

export interface Drag {
    fra: number;
    x: number;
    y: number;
    /** false = eleven klikket på prikken uten å dra: neste klikk fullfører tråden. */
    holder: boolean;
}

export interface Spøkelse {
    a: number;
    b: number;
}

/** Nærmeste prikk innenfor treffavstanden, eller null. */
export function treff(g: Game, p: Punkt): number | null {
    let best: number | null = null;
    let d = TREFF;
    if (!g.hauge.inne && avstand(g.hauge, p) < d) {
        d = avstand(g.hauge, p);
        best = HAUGE;
    }
    for (const s of g.stuer.values())
        if (avstand(s, p) < d) {
            d = avstand(s, p);
            best = s.id;
        }
    return best;
}
