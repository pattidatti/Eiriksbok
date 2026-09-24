import * as THREE from 'three';

// Borgund stavkirke som spillbrett. Kirka ligger øst-vest med inngangen i vest
// (-x) og koret i øst (+x). Vinden og regnet kommer fra vest, så vestvendte
// flater slites mest - det er spillets romlige kjerne.
//
// Hver flate eleven kan male med tjære, er et PANEL: en plan polygon med sitt
// eget rutenett av celler (se paint.ts). Resten av kirka er statisk pynt.

export type V3 = [number, number, number];
export type Side = 'N' | 'S' | 'V' | 'Ø';

// Mål (1 enhet ≈ 1,3 m). Holdes samlet her så modellen og fundamentet henger sammen.
export const M = {
    base: 0.55, // toppen av svillen - her begynner veggene
    naveX: 3, // skipets halve lengde
    naveZ: 2, // skipets halve bredde
    naveWall: 3.3, // skipets yttervegg (under sideskipstaket)
    clereZ: 1.35, // det hevede midtrommet
    clereBottom: 4.2,
    clereTop: 5.0,
    ridge: 7.4,
    svalOut: 3.4, // svalgangens ytterkant (z)
    svalWest: -4.4,
    korX0: 3,
    korX1: 4.6,
    korZ: 1.3,
    korRidge: 4.8,
};

export interface PanelDef {
    id: string;
    label: string;
    kind: 'roof' | 'wall';
    geo: THREE.BufferGeometry;
    center: THREE.Vector3;
    normal: THREE.Vector3;
    side: Side;
    /** Hvor mye vær flaten tar (vest og tak mest). */
    exposure: number;
    /** Flatens størrelse i verdensenheter langs u og v - brukes til cellerutenettet. */
    size: [number, number];
    /** Fra flatens uv (0-1) til et punkt i verden. */
    uvToWorld: (u: number, v: number, out?: THREE.Vector3) => THREE.Vector3;
}

const CHURCH_CENTER = new THREE.Vector3(0, 3.5, 0);

/**
 * Plan polygon -> geometri med to UV-sett:
 *  uv  (kanal 0): 0-1 over hele flaten - her ligger cellenes tjære/råte-tekstur.
 *  uv1 (kanal 1): i verdensenheter - her ligger spon-mønsteret, så skjellene
 *                 har samme størrelse på alle flater.
 */
function polyGeo(pts: V3[], shingleScale: number) {
    let p = pts.map((v) => new THREE.Vector3(...v));
    const center = p.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / p.length);
    let n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0])).normalize();
    // Normalen skal peke UT fra kirka.
    const out = new THREE.Vector3().subVectors(center, CHURCH_CENTER);
    out.y *= 0.3;
    if (n.dot(out) < 0) {
        p = p.reverse();
        n = n.negate();
    }
    const e1 = new THREE.Vector3().subVectors(p[1], p[0]).normalize();
    const e2 = new THREE.Vector3().crossVectors(n, e1).normalize();
    const us = p.map((v) => new THREE.Vector3().subVectors(v, p[0]).dot(e1));
    const vs = p.map((v) => new THREE.Vector3().subVectors(v, p[0]).dot(e2));
    const u0 = Math.min(...us);
    const u1 = Math.max(...us);
    const v0 = Math.min(...vs);
    const v1 = Math.max(...vs);
    const pos: number[] = [];
    const uv: number[] = [];
    const uv1: number[] = [];
    const push = (i: number) => {
        pos.push(p[i].x, p[i].y, p[i].z);
        uv.push((us[i] - u0) / (u1 - u0), (vs[i] - v0) / (v1 - v0));
        uv1.push(us[i] / shingleScale, vs[i] / shingleScale);
    };
    for (let i = 1; i < p.length - 1; i++) {
        push(0);
        push(i);
        push(i + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
    geo.computeVertexNormals();
    const origin = p[0].clone();
    const uvToWorld = (u: number, v: number, out = new THREE.Vector3()) =>
        out
            .copy(origin)
            .addScaledVector(e1, u0 + u * (u1 - u0))
            .addScaledVector(e2, v0 + v * (v1 - v0));
    return { geo, center, normal: n, size: [u1 - u0, v1 - v0] as [number, number], uvToWorld };
}

function sideOf(n: THREE.Vector3): Side {
    if (Math.abs(n.x) > Math.abs(n.z)) return n.x < 0 ? 'V' : 'Ø';
    return n.z < 0 ? 'N' : 'S';
}

const { naveX: X, naveZ: Z, naveWall, clereZ: CZ, clereBottom, clereTop, ridge, svalOut: SO, svalWest: SW, korX0, korX1, korZ: KZ, korRidge } = M;

const RAW: { id: string; label: string; kind: 'roof' | 'wall'; pts: V3[] }[] = [
    // 1. Svalgangen: lave pulttak rundt skipet (nord, sør, vest).
    { id: 'sval-N', label: 'svalgangstaket i nord', kind: 'roof', pts: [[SW, 1.95, -SO], [korX0 + 0.2, 1.95, -SO], [korX0, 2.95, -Z - 0.05], [SW + 1.25, 2.95, -Z - 0.05]] },
    { id: 'sval-S', label: 'svalgangstaket i sør', kind: 'roof', pts: [[SW, 1.95, SO], [korX0 + 0.2, 1.95, SO], [korX0, 2.95, Z + 0.05], [SW + 1.25, 2.95, Z + 0.05]] },
    { id: 'sval-V', label: 'svalgangstaket i vest', kind: 'roof', pts: [[SW, 1.95, -SO], [SW, 1.95, SO], [SW + 1.25, 2.95, Z + 0.05], [SW + 1.25, 2.95, -Z - 0.05]] },
    // 2. Sideskipstaket: fra ytterveggen opp mot det hevede midtrommet.
    { id: 'side-N', label: 'sideskipstaket i nord', kind: 'roof', pts: [[-X - 0.25, naveWall, -Z - 0.25], [X + 0.25, naveWall, -Z - 0.25], [X - 0.6, clereBottom, -CZ], [-X + 0.6, clereBottom, -CZ]] },
    { id: 'side-S', label: 'sideskipstaket i sør', kind: 'roof', pts: [[-X - 0.25, naveWall, Z + 0.25], [X + 0.25, naveWall, Z + 0.25], [X - 0.6, clereBottom, CZ], [-X + 0.6, clereBottom, CZ]] },
    { id: 'side-V', label: 'sideskipstaket i vest', kind: 'roof', pts: [[-X - 0.25, naveWall, -Z - 0.25], [-X - 0.25, naveWall, Z + 0.25], [-X + 0.6, clereBottom, CZ], [-X + 0.6, clereBottom, -CZ]] },
    { id: 'side-Ø', label: 'sideskipstaket i øst', kind: 'roof', pts: [[X + 0.25, naveWall, -Z - 0.25], [X + 0.25, naveWall, Z + 0.25], [X - 0.6, clereBottom, CZ], [X - 0.6, clereBottom, -CZ]] },
    // 3. Midtrommets vegger (lysåpningen) og hovedtaket.
    { id: 'mur-N', label: 'midtromsveggen i nord', kind: 'wall', pts: [[-X + 0.6, clereBottom - 0.05, -CZ], [X - 0.6, clereBottom - 0.05, -CZ], [X - 0.6, clereTop, -CZ], [-X + 0.6, clereTop, -CZ]] },
    { id: 'mur-S', label: 'midtromsveggen i sør', kind: 'wall', pts: [[-X + 0.6, clereBottom - 0.05, CZ], [X - 0.6, clereBottom - 0.05, CZ], [X - 0.6, clereTop, CZ], [-X + 0.6, clereTop, CZ]] },
    { id: 'tak-N', label: 'hovedtaket i nord', kind: 'roof', pts: [[-X + 0.25, clereTop - 0.12, -CZ - 0.35], [X - 0.25, clereTop - 0.12, -CZ - 0.35], [X - 0.25, ridge + 0.04, 0], [-X + 0.25, ridge + 0.04, 0]] },
    { id: 'tak-S', label: 'hovedtaket i sør', kind: 'roof', pts: [[-X + 0.25, clereTop - 0.12, CZ + 0.35], [X - 0.25, clereTop - 0.12, CZ + 0.35], [X - 0.25, ridge + 0.04, 0], [-X + 0.25, ridge + 0.04, 0]] },
    { id: 'gavl-V', label: 'vestgavlen', kind: 'wall', pts: [[-X + 0.6, clereBottom - 0.05, -CZ], [-X + 0.6, clereBottom - 0.05, CZ], [-X + 0.6, clereTop, CZ], [-X + 0.6, ridge, 0], [-X + 0.6, clereTop, -CZ]] },
    { id: 'gavl-Ø', label: 'østgavlen', kind: 'wall', pts: [[X - 0.6, clereBottom - 0.05, -CZ], [X - 0.6, clereBottom - 0.05, CZ], [X - 0.6, clereTop, CZ], [X - 0.6, ridge, 0], [X - 0.6, clereTop, -CZ]] },
    // 4. Koret i øst.
    { id: 'kor-N', label: 'kortaket i nord', kind: 'roof', pts: [[korX0 - 0.1, naveWall - 0.1, -KZ - 0.25], [korX1 + 0.2, naveWall - 0.1, -KZ - 0.25], [korX1 + 0.2, korRidge, 0], [korX0 - 0.1, korRidge, 0]] },
    { id: 'kor-S', label: 'kortaket i sør', kind: 'roof', pts: [[korX0 - 0.1, naveWall - 0.1, KZ + 0.25], [korX1 + 0.2, naveWall - 0.1, KZ + 0.25], [korX1 + 0.2, korRidge, 0], [korX0 - 0.1, korRidge, 0]] },
    // 5. Takrytteren: skjørt og spir.
    { id: 'skjort-N', label: 'takrytterens skjørt i nord', kind: 'roof', pts: [[-0.95, 7.75, -0.95], [0.95, 7.75, -0.95], [0.5, 8.25, -0.5], [-0.5, 8.25, -0.5]] },
    { id: 'skjort-S', label: 'takrytterens skjørt i sør', kind: 'roof', pts: [[-0.95, 7.75, 0.95], [0.95, 7.75, 0.95], [0.5, 8.25, 0.5], [-0.5, 8.25, 0.5]] },
    { id: 'skjort-V', label: 'takrytterens skjørt i vest', kind: 'roof', pts: [[-0.95, 7.75, -0.95], [-0.95, 7.75, 0.95], [-0.5, 8.25, 0.5], [-0.5, 8.25, -0.5]] },
    { id: 'skjort-Ø', label: 'takrytterens skjørt i øst', kind: 'roof', pts: [[0.95, 7.75, -0.95], [0.95, 7.75, 0.95], [0.5, 8.25, 0.5], [0.5, 8.25, -0.5]] },
    { id: 'spir-N', label: 'spiret i nord', kind: 'roof', pts: [[-0.62, 8.9, -0.62], [0.62, 8.9, -0.62], [0, 10.9, 0]] },
    { id: 'spir-S', label: 'spiret i sør', kind: 'roof', pts: [[-0.62, 8.9, 0.62], [0.62, 8.9, 0.62], [0, 10.9, 0]] },
    { id: 'spir-V', label: 'spiret i vest', kind: 'roof', pts: [[-0.62, 8.9, -0.62], [-0.62, 8.9, 0.62], [0, 10.9, 0]] },
    { id: 'spir-Ø', label: 'spiret i øst', kind: 'roof', pts: [[0.62, 8.9, -0.62], [0.62, 8.9, 0.62], [0, 10.9, 0]] },
];


export const PANELS: PanelDef[] = RAW.map((d) => {
    const { geo, center, normal, size, uvToWorld } = polyGeo(d.pts, d.kind === 'roof' ? 0.42 : 0.55);
    const west = Math.max(0, -normal.x);
    const up = Math.max(0, normal.y);
    const exposure = 0.5 + 1.1 * west + 0.5 * up + (d.kind === 'roof' ? 0.15 : 0);
    return { id: d.id, label: d.label, kind: d.kind, geo, center, normal, side: sideOf(normal), exposure, size, uvToWorld };
});

/** Dragehoder: [posisjon, retning (+1 øst / -1 vest)] */
export const DRAGONS: [V3, number][] = [
    [[-X + 0.3, ridge + 0.05, 0], -1],
    [[X - 0.3, ridge + 0.05, 0], 1],
    [[korX1 + 0.25, korRidge + 0.02, 0], 1],
    [[-0.95, 7.8, 0], -1],
    [[0.95, 7.8, 0], 1],
];

/** Tjæremila nede i dalen. */
export const MILE_POS = new THREE.Vector3(-13, 0, 9);
