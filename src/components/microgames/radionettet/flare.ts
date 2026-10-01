import * as THREE from 'three';

// Lysglimt som lyser opp bakken og figurene rundt seg: eksplosjoner, kanonskudd og nedslag.
// Et fast antall punktlys (light.tsx) som gjenbrukes; antallet endres aldri, ellers må alle
// materialene kompileres på nytt midt i kampen.

export const MAX_FLARE = 4;

export interface Flare {
    pos: THREE.Vector3;
    /** Styrken nå (0 = av). */
    i: number;
    /** Styrken det startet med, og hvor fort det svinner (per sekund). */
    i0: number;
    fade: number;
    dist: number;
    col: THREE.Color;
}

export const flares: Flare[] = Array.from({ length: MAX_FLARE }, () => ({
    pos: new THREE.Vector3(),
    i: 0,
    i0: 0,
    fade: 1,
    dist: 4,
    col: new THREE.Color(),
}));

/** Hvor mange lys kvalitetsnivået har (light.tsx setter det). */
export const FLARE = { n: MAX_FLARE };

const WARM = new THREE.Color('#ffb25c');

/** Tenner et glimt (y er over bakken der det skjer). Tar det svakeste lyset som er ledig. */
export function flare(x: number, y: number, z: number, power = 1, life = 0.25, dist = 4.5, col: THREE.Color = WARM) {
    let best = flares[0];
    for (let k = 1; k < FLARE.n; k++) if (flares[k].i < best.i) best = flares[k];
    if (best.i > power * 30) return;
    best.pos.set(x, y, z);
    best.i = best.i0 = power * 30;
    best.fade = 1 / Math.max(0.03, life);
    best.dist = dist;
    best.col.copy(col);
}
