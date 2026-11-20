import * as THREE from 'three';

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Enkel, fast «tilfeldig» tallrekke, så bildet blir likt hver gang. */
export function tilfeldig(start: number) {
    let s = start;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}
