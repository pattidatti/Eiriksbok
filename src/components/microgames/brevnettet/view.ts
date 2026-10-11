// Delte konstanter og hjelpere for visningen (egen fil, så world.tsx bare eksporterer komponenter).

import { InstancedBufferAttribute, type InstancedMesh } from 'three';
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

/**
 * Åkleet på veven (verdensenheter): bredde, høyde, midten i y, og hvor stor del av høyden
 * hvert bord (øverst og nederst) tar. `syn*` er utsnittet kameraet alltid får med seg.
 */
export const VEV = {
    w: 16,
    h: 9,
    midtY: 0.15,
    bord: 49 / 576,
    synB: 19,
    synH: 10.9,
    synMidtY: -0.2,
};

/** Fengselet står under veven, midt på. */
export const FENGSEL = { x: 0, y: -4.8 };

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

/**
 * Gi instansene farger fra første bilde. Kommer fargene først senere, må three.js lage
 * shaderen på nytt midt i spillet (et synlig hakk).
 */
export function sikreFarger(...m: (InstancedMesh | null)[]) {
    for (const x of m) {
        if (!x || x.instanceColor) continue;
        const n = x.instanceMatrix.count;
        x.instanceColor = new InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
    }
}
