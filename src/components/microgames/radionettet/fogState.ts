import * as THREE from 'three';

// Delt tilstand for krigståka (warfog.tsx): tida, tettheten og glimtene inne i tåka.

export const MAX = 10;
export const flashes = Array.from({ length: MAX }, () => new THREE.Vector4());
export const CLOCK = { value: 0 };
export const DENS = { value: 0.9 };

/** Varme i tåka: x, z, styrke, radius. Svinner av seg selv. */
export function fogFlash(x: number, z: number, power = 1, r = 2.2) {
    let best = flashes[0];
    for (const f of flashes) if (f.z < best.z) best = f;
    best.set(x, z, power, r);
}
