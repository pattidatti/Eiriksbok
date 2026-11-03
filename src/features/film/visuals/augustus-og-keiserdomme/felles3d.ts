import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Felles 3D-hjelpere for Actium og Roma: dempet glidning, kamera per beat og merkelapper. */

export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface KameraMal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. Gir tida i beaten. */
export function useBeatKamera(
    mal: (beat: number, t: number) => KameraMal,
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
        const m = mal(beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

/** En merkelapp over 3D: et punkt i verden og en tekst. Plasseres som DOM over lerretet. */
export interface Merkelapp {
    id: string;
    tekst: string;
    farge: string;
    synlig: boolean;
    punkt: () => THREE.Vector3;
}

const tmp = new THREE.Vector3();

/**
 * Flytter DOM-merkene til der punktene havner på skjermen. Skriver stilen direkte via ref,
 * aldri via setState i bildeløkka (den holder document.fonts i «loading»).
 */
export function useMerkelapper(
    merker: Merkelapp[],
    finn: (id: string) => HTMLDivElement | null | undefined
) {
    useFrame(({ camera, size }) => {
        for (const m of merker) {
            const el = finn(m.id);
            if (!el) continue;
            tmp.copy(m.punkt()).project(camera);
            const bak = tmp.z > 1;
            const x = ((tmp.x + 1) / 2) * size.width;
            const y = ((1 - tmp.y) / 2) * size.height;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.opacity = m.synlig && !bak ? '1' : '0';
        }
    });
}
