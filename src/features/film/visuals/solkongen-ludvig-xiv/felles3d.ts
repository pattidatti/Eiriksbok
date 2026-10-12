import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Felles 3D-hjelpere for Versailles: dempet glidning, frø-tall og kameraet per beat. */

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Enkelt tilfeldig tall med frø, så alt ser likt ut hver gang. */
export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Kameraet glir mot målet for beaten. Første bilde, og bytte av sted, hopper rett dit. */
export function useKamera(
    mål: (beat: number, t: number) => { pos: THREE.Vector3; se: THREE.Vector3; hopp?: boolean },
    beat: number,
    playing: boolean
) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = mål(beat, beatTid.current);
        const langt = camera.position.distanceTo(m.pos) > 150;
        const k = forste.current || langt ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}
