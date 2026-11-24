import * as THREE from 'three';

/** Felles hjelpere for filmen om geopolitikk: dempet glidning, vektorer og frø. */

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Myk overgang fra 0 til 1. */
export function myk(x: number) {
    const k = Math.min(1, Math.max(0, x));
    return k * k * (3 - 2 * k);
}

/** Fargene filmen bruker om igjen i kart og kort. */
export const FARGE = {
    hav: '#dbeafe',
    land: '#e2e8f0',
    kant: '#ffffff',
    rod: '#dc2626',
    rodLys: '#fca5a5',
    bla: '#2563eb',
    blaLys: '#93c5fd',
    gul: '#f59e0b',
    gronn: '#16a34a',
    mork: '#0f172a',
};
