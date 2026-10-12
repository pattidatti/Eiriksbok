import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Felles 3D-hjelpere for kobbergruva og presidentpalasset: dempet glidning og kamera per beat. */

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

/** Lager en tekstur fra et 2D-lerret (flagg, skilt). */
export function lerretTekstur(b: number, h: number, tegn: (g: CanvasRenderingContext2D) => void) {
    const c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    tegn(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Chiles flagg: hvit og rød stripe, blått felt med hvit stjerne. */
export function tegnChile(g: CanvasRenderingContext2D) {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 300, 90);
    g.fillStyle = '#d52b1e';
    g.fillRect(0, 90, 300, 90);
    g.fillStyle = '#0039a6';
    g.fillRect(0, 0, 90, 90);
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 30 : 12;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        g.lineTo(45 + Math.cos(a) * r, 47 + Math.sin(a) * r);
    }
    g.fill();
}

/** USAs flagg, forenklet: striper og blått felt med prikker. */
export function tegnUsa(g: CanvasRenderingContext2D) {
    for (let i = 0; i < 13; i++) {
        g.fillStyle = i % 2 === 0 ? '#b22234' : '#ffffff';
        g.fillRect(0, (i * 180) / 13, 300, 180 / 13 + 1);
    }
    g.fillStyle = '#3c3b6e';
    g.fillRect(0, 0, 130, 97);
    g.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++)
        for (let k = 0; k < 6; k++) {
            g.beginPath();
            g.arc(12 + k * 21, 12 + r * 18, 4, 0, Math.PI * 2);
            g.fill();
        }
}
