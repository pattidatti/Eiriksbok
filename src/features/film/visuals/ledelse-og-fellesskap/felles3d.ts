import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';

export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Lav oppløsning på svake maskiner. */
export function useDpr(): [number, number] {
    return useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
}

/** Tid siden beaten startet. Står stille på pause. */
export function useBeatKlokke() {
    const forrige = useRef(-1);
    const tid = useRef(0);
    return (beat: number, dt: number) => {
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        return tid.current;
    };
}
