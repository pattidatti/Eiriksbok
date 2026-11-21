import * as THREE from 'three';

/** Felles hjelpere for filmen om Freavnantjahke gievrie. */

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Enkelt tilfeldig tall med frø, så bildet ser likt ut hver gang. */
export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Rød-brun malerfarge, som på skinnet. */
export const MALING = '#8b2a1a';
