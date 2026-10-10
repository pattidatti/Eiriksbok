// Delt mellom visningen og komponenten: tidspunkt for slag (til animasjonen) og
// kameraet, så lapper kan festes til ting på bordet. Ingen React.

import * as THREE from 'three';

export interface Fx {
    /** performance.now()/1000 da siste slag traff. */
    slag: number;
    /** Kameraet og lerretets størrelse (settes av Kamera i world.tsx). */
    kamera: THREE.Camera | null;
    w: number;
    h: number;
}

export const nyFx = (): Fx => ({ slag: -10, kamera: null, w: 1000, h: 600 });

export const nå = () => performance.now() / 1000;

const v = new THREE.Vector3();

/** Et punkt på bordet i piksler i spillvinduet, eller null før kameraet finnes. */
export function tilSkjerm(fx: Fx, x: number, y: number, z: number) {
    if (!fx.kamera) return null;
    v.set(x, y, z).project(fx.kamera);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * fx.w, y: (-v.y * 0.5 + 0.5) * fx.h };
}
