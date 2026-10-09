// Figurene i Underskriftsrittet som sammenslåtte geometrier (én tegning per figur):
// hesten med rytteren, husene på tunet, fogdgården, fogdens mann og dragonen, og trærne.
// Alt er flate farger i hjørnene (vertex colors) som en rosemalt figur, med sotbrun kontur.

import * as THREE from 'three';
import { mergeParts, type Part } from '../kit';
import { FARGE } from './palette';
import { TUNING } from './tuning';

const T = TUNING;

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const kule = (r: number, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

/** Saltak: en trekant trukket ut i lengden. */
function tak(bredde: number, høyde: number, lengde: number) {
    const s = new THREE.Shape();
    s.moveTo(-bredde / 2, 0);
    s.lineTo(bredde / 2, 0);
    s.lineTo(0, høyde);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: lengde, bevelEnabled: false });
    g.translate(0, 0, -lengde / 2);
    return g;
}

/** Hesten peker langs +x. Kalkhvit kropp, rødt sal-dekken med oker kant, rytter i mørk frakk. */
export function hestKropp(): THREE.BufferGeometry {
    const kalk = FARGE.kalk;
    return mergeParts([
        { geometry: box(1.5, 0.62, 0.58), position: [0, 0.95, 0], color: kalk },
        {
            geometry: box(0.5, 0.75, 0.36),
            position: [0.78, 1.38, 0],
            rotation: [0, 0, -0.55],
            color: kalk,
        },
        {
            geometry: box(0.55, 0.3, 0.3),
            position: [1.12, 1.66, 0],
            rotation: [0, 0, 0.35],
            color: kalk,
        },
        {
            geometry: box(0.2, 0.42, 0.14),
            position: [0.7, 1.58, 0],
            rotation: [0, 0, -0.5],
            color: FARGE.blekk,
        },
        {
            geometry: box(0.5, 0.18, 0.12),
            position: [-0.86, 1.02, 0],
            rotation: [0, 0, 0.9],
            color: FARGE.blekk,
        },
        // Sal-dekkenet, rødt med oker kant
        { geometry: box(0.72, 0.36, 0.64), position: [0, 1.12, 0], color: FARGE.blod },
        { geometry: box(0.76, 0.06, 0.66), position: [0, 0.96, 0], color: FARGE.gull },
        // Rytteren: mørk frakk, kalkhvitt ansikt, bred hatt
        { geometry: box(0.36, 0.7, 0.4), position: [-0.05, 1.62, 0], color: '#2c2a33' },
        {
            geometry: box(0.16, 0.5, 0.12),
            position: [0.12, 1.55, 0.26],
            rotation: [0, 0, -0.7],
            color: '#2c2a33',
        },
        {
            geometry: box(0.16, 0.5, 0.12),
            position: [0.12, 1.55, -0.26],
            rotation: [0, 0, -0.7],
            color: '#2c2a33',
        },
        { geometry: kule(0.17), position: [0, 2.08, 0], color: '#e8c9a6' },
        { geometry: cyl(0.34, 0.34, 0.05, 14), position: [0, 2.24, 0], color: FARGE.blekk },
        { geometry: cyl(0.16, 0.18, 0.2, 10), position: [0, 2.34, 0], color: FARGE.blekk },
        // Klagebrevet i veska
        { geometry: box(0.3, 0.22, 0.06), position: [-0.4, 1.28, 0.33], color: FARGE.papir },
    ]);
}

/** Ett hestebein, festet øverst så det kan svinge. */
export function hestBein(): THREE.BufferGeometry {
    return mergeParts([
        { geometry: box(0.16, 0.66, 0.16), position: [0, -0.33, 0], color: FARGE.kalk },
        { geometry: box(0.19, 0.12, 0.19), position: [0, -0.66, 0], color: FARGE.blekk },
    ]);
}

/** Husene på et tun: tre små hus i en ring som vender mot midten. Røde i Agder, lilla i Telemark. */
export function tunHus(telemark: boolean): THREE.BufferGeometry {
    const vegg = telemark ? FARGE.telemark : FARGE.blod;
    const takFarge = telemark ? '#b76fc6' : '#c4493a';
    const deler: Part[] = [];
    for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + T.tun.husVinkel;
        const cx = Math.cos(a) * T.tun.husR;
        const cz = Math.sin(a) * T.tun.husR;
        const ry = -a + Math.PI / 2;
        // Langsida vender mot midten; skorsteinen står litt til siden.
        const sx = Math.cos(-ry) * 0.42;
        const sz = Math.sin(-ry) * 0.42;
        deler.push(
            {
                geometry: box(1.6, 1.0, 1.1),
                position: [cx, 0.5, cz],
                rotation: [0, ry, 0],
                color: vegg,
            },
            {
                geometry: box(1.66, 0.08, 1.16),
                position: [cx, 1.02, cz],
                rotation: [0, ry, 0],
                color: FARGE.kalk,
            },
            {
                geometry: tak(1.34, 0.7, 1.86),
                position: [cx, 1.04, cz],
                rotation: [0, ry + Math.PI / 2, 0],
                color: takFarge,
            },
            {
                geometry: box(1.92, 0.08, 0.12),
                position: [cx, 1.75, cz],
                rotation: [0, ry, 0],
                color: FARGE.kalk,
            },
            { geometry: box(0.22, 0.5, 0.22), position: [cx + sx, 1.5, cz + sz], color: FARGE.kalk }
        );
    }
    return mergeParts(deler);
}

/** Vinduene på tunet (lyser varmt når bygda skriver under). Plassert på sida mot midten. */
export function tunVinduer(): THREE.BufferGeometry {
    const deler: Part[] = [];
    for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + T.tun.husVinkel;
        const r = T.tun.husR - 0.56;
        const ry = -a + Math.PI / 2;
        for (const s of [-0.4, 0.4]) {
            const tx = Math.cos(a + Math.PI / 2) * s;
            const tz = Math.sin(a + Math.PI / 2) * s;
            deler.push({
                geometry: box(0.3, 0.3, 0.04),
                position: [Math.cos(a) * r + tx, 0.55, Math.sin(a) * r + tz],
                rotation: [0, ry, 0],
                color: '#ffffff',
            });
        }
    }
    return mergeParts(deler);
}

/** Fogdgården: et mørkt, høyt hus med en lykt på stolpen. Herfra kommer mennene. */
export function fogdGård(): THREE.BufferGeometry {
    return mergeParts([
        { geometry: box(2.6, 1.8, 1.7), position: [0, 0.9, 0], color: '#4a3a30' },
        {
            geometry: tak(2.0, 1.1, 2.8),
            position: [0, 1.8, 0],
            rotation: [0, Math.PI / 2, 0],
            color: '#17110e',
        },
        { geometry: box(2.66, 0.1, 1.76), position: [0, 1.82, 0], color: FARGE.fare },
        { geometry: box(0.1, 1.8, 0.1), position: [1.7, 0.9, 0.9], color: '#2a211c' },
    ]);
}

/** Fogdens mann: høy, sotbrun silhuett i kappe og hatt. Lykta er en egen kule som gløder. */
export function fogdMann(): THREE.BufferGeometry {
    const sot = '#2b1f18';
    return mergeParts([
        { geometry: cyl(0.26, 0.48, 1.55, 8), position: [0, 0.78, 0], color: sot },
        { geometry: kule(0.24, 8, 6), position: [0, 1.74, 0], color: '#5a4334' },
        { geometry: cyl(0.4, 0.4, 0.05, 10), position: [0, 1.9, 0], color: sot },
        { geometry: cyl(0.2, 0.24, 0.3, 8), position: [0, 2.05, 0], color: sot },
        {
            geometry: box(0.5, 0.12, 0.12),
            position: [0.3, 1.28, 0],
            rotation: [0, 0, -0.5],
            color: sot,
        },
    ]);
}

/** Dragonen: mørk hest, rytter i blå frakk og rød trekanthatt. Peker langs +x. */
export function dragonFigur(): THREE.BufferGeometry {
    const hest = '#3a2a20';
    return mergeParts([
        { geometry: box(1.6, 0.66, 0.6), position: [0, 1.0, 0], color: hest },
        {
            geometry: box(0.52, 0.8, 0.38),
            position: [0.82, 1.45, 0],
            rotation: [0, 0, -0.55],
            color: hest,
        },
        {
            geometry: box(0.58, 0.3, 0.3),
            position: [1.18, 1.72, 0],
            rotation: [0, 0, 0.35],
            color: hest,
        },
        { geometry: box(0.16, 0.7, 0.16), position: [0.55, 0.35, 0.18], color: hest },
        { geometry: box(0.16, 0.7, 0.16), position: [-0.55, 0.35, -0.18], color: hest },
        { geometry: box(0.16, 0.7, 0.16), position: [0.55, 0.35, -0.18], color: hest },
        { geometry: box(0.16, 0.7, 0.16), position: [-0.55, 0.35, 0.18], color: hest },
        { geometry: box(0.4, 0.75, 0.44), position: [-0.05, 1.72, 0], color: '#2c4a7a' },
        { geometry: kule(0.18), position: [0, 2.2, 0], color: '#e8c9a6' },
        { geometry: cyl(0.42, 0.42, 0.16, 3), position: [0, 2.38, 0], color: FARGE.blod },
    ]);
}

/** Et rosemalt tre: rund krone på en kort stamme. Kronen er egen så den kan få farge per tre. */
export const TRE_KRONE = new THREE.IcosahedronGeometry(1, 1);
export const TRE_STAMME = (() => {
    const g = cyl(0.14, 0.2, 1.2, 6);
    g.translate(0, 0.6, 0);
    return g;
})();
