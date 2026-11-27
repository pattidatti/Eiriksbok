import { useMemo } from 'react';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';

export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Lav oppløsning på svake maskiner. */
export function useDpr(): [number, number] {
    return useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
}
