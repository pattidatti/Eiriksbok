import * as THREE from 'three';

/** Felles hjelpere for pilegrimsfilmen. */

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Fargene til de tre gruppene i filmen. */
export const FARGE = {
    abraham: '#0f766e',
    kristen: '#1d4ed8',
    india: '#c2410c',
    nyere: '#7c3aed',
    maria: '#be185d',
} as const;
