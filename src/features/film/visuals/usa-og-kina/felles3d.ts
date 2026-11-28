import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Felles hjelpere for filmen om USA og Kina: farger, dempet glidning og kamera per beat. */

export const USA_BLÅ = '#1d4ed8';
export const KINA_RØD = '#b91c1c';
export const TAIWAN_TEAL = '#0d9488';
export const EU_GUL = '#ca8a04';

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
export function useKamera(
    mål: (beat: number, t: number) => { pos: THREE.Vector3; se: THREE.Vector3 },
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
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}
