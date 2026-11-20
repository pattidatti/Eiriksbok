import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Felles 3D-hjelpere for Nav-filmen (egen fil, så komponentfilene bare eksporterer komponenter). */

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Teller sekunder siden beaten startet. Står stille på pause. */
export function useBeatTid(beat: number, playing: boolean) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
    });
    return tid;
}

const proj = new THREE.Vector3();

/** Prosjiser et punkt i scenen til prosent av bildet. */
export function tilSkjerm(p: THREE.Vector3, camera: THREE.Camera) {
    proj.copy(p).project(camera);
    return { x: ((proj.x + 1) / 2) * 100, y: ((1 - proj.y) / 2) * 100, foran: proj.z < 1 };
}
