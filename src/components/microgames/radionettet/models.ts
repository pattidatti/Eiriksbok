import * as THREE from 'three';
import { mergeParts, type Part as KitPart } from '../kit';
import type { EKind, Kind } from './tuning';

// Fargene (kunstbriefen) og figurene. Hver figur er små biter slått sammen til én geometri
// med trykkfarger i hjørnene, pluss et «skall» av de samme bitene litt større i sot: den
// tykke konturen fra silketrykket. Skyggesidene er trykt med mørkere farge (tre toner),
// ikke regnet ut av lys. Spillreglene vet ingenting om figurene.

export const C = {
    papir: '#efe4c9',
    mark: '#e3d5b0',
    vei: '#b9a476',
    egen: '#627340',
    egenLys: '#8a9a5a',
    fiende: '#7a7c75',
    fiendeLys: '#9a9c94',
    sot: '#1a1a1a',
    fare: '#b3261e',
    radio: '#d9a21b',
    himmel: '#1d2b4f',
    røyk: '#8a8577',
    hud: '#c9a37a',
    rust: '#4a3a2c',
};

/** Retningen trykkeren «lyser» fra: øvre venstre på skjermen. */
const LIGHT = new THREE.Vector3(-0.35, 1, -0.55).normalize();
const N = new THREE.Vector3();

/** Tre trykktoner: topp, halvskygge, skygge. */
function shade(geo: THREE.BufferGeometry) {
    geo.computeVertexNormals();
    const n = geo.getAttribute('normal');
    const c = geo.getAttribute('color');
    for (let i = 0; i < n.count; i++) {
        N.fromBufferAttribute(n, i);
        const d = N.dot(LIGHT);
        const k = d > 0.55 ? 1.25 : d > -0.05 ? 0.95 : 0.74;
        c.setXYZ(i, Math.min(1, c.getX(i) * k), Math.min(1, c.getY(i) * k), Math.min(1, c.getZ(i) * k));
    }
    return geo;
}

type Shape = 'box' | 'cyl' | 'cone' | 'ball' | 'wedge';

export interface Bit {
    s: Shape;
    /** Bredde (x), høyde (y), dybde (z). For sylinder: diameter, lengde, diameter. */
    d: [number, number, number];
    p: [number, number, number];
    r?: [number, number, number];
    c: string;
    /** Ingen kontur rundt denne biten (tynne ting som ville blitt en svart strek). */
    bare?: boolean;
}

function geoOf(s: Shape): THREE.BufferGeometry {
    if (s === 'box') return new THREE.BoxGeometry(1, 1, 1);
    if (s === 'cyl') return new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    if (s === 'cone') return new THREE.ConeGeometry(0.5, 1, 7);
    if (s === 'ball') return new THREE.IcosahedronGeometry(0.5, 0);
    // Kile: tak og skjold.
    const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
    g.rotateZ(Math.PI / 2);
    g.rotateX(-Math.PI / 2);
    return g;
}

const HULL = 0.03;

/** Figuren og konturskallet som to geometrier. */
export function build(bits: Bit[]) {
    const body: KitPart[] = bits.map((b) => ({ geometry: geoOf(b.s), position: b.p, rotation: b.r, scale: b.d, color: b.c }));
    const hull: KitPart[] = bits
        .filter((b) => !b.bare)
        .map((b) => ({
            geometry: geoOf(b.s),
            position: b.p,
            rotation: b.r,
            scale: [b.d[0] + HULL, b.d[1] + HULL, b.d[2] + HULL] as [number, number, number],
            color: C.sot,
        }));
    // Bare tynne biter (to kanonløp): ingen kontur, men en tom geometri så figuren er lik.
    return { body: shade(mergeParts(body)), hull: hull.length ? mergeParts(hull) : new THREE.BufferGeometry() };
}

export type Model = ReturnType<typeof build>;

// ---- Figurene (x = framover, mot fienden) ----------------------------------------------------
function soldier(x: number, z: number, cloth: string, helmet: string, rifle = true): Bit[] {
    const out: Bit[] = [
        { s: 'box', d: [0.1, 0.17, 0.12], p: [x, 0.09, z], c: cloth },
        { s: 'box', d: [0.13, 0.16, 0.16], p: [x, 0.25, z], c: cloth },
        { s: 'ball', d: [0.1, 0.1, 0.1], p: [x, 0.37, z], c: C.hud, bare: true },
        { s: 'cyl', d: [0.17, 0.05, 0.17], p: [x, 0.42, z], c: helmet },
    ];
    if (rifle) out.push({ s: 'box', d: [0.26, 0.025, 0.025], p: [x + 0.1, 0.27, z + 0.08], r: [0, 0, 0.35], c: C.rust, bare: true });
    return out;
}

function tankHull(col: string, dark: string): Bit[] {
    return [
        { s: 'box', d: [0.78, 0.2, 0.5], p: [0, 0.18, 0], c: col },
        { s: 'box', d: [0.84, 0.14, 0.14], p: [0, 0.09, 0.24], c: dark },
        { s: 'box', d: [0.84, 0.14, 0.14], p: [0, 0.09, -0.24], c: dark },
        { s: 'box', d: [0.14, 0.08, 0.46], p: [0.34, 0.3, 0], r: [0, 0, -0.5], c: col },
    ];
}

function tankTurret(col: string, gun: number): Bit[] {
    return [
        { s: 'box', d: [0.36, 0.17, 0.32], p: [-0.02, 0.37, 0], c: col },
        { s: 'cyl', d: [0.12, 0.08, 0.12], p: [-0.08, 0.49, 0.06], c: col },
        { s: 'cyl', d: [0.06, gun, 0.06], p: [0.16 + gun / 2, 0.39, 0], r: [0, 0, Math.PI / 2], c: C.sot, bare: true },
    ];
}

function plane(span: number, len: number, col: string, mark: 'rund' | 'kors', gull = false): Bit[] {
    const wing = (side: number): Bit[] =>
        gull
            ? [
                  { s: 'box', d: [0.24, 0.04, span * 0.22], p: [0.04, -0.03, side * span * 0.12], r: [side * 0.45, 0, 0], c: col },
                  { s: 'box', d: [0.22, 0.04, span * 0.3], p: [0.04, 0.0, side * span * 0.36], r: [-side * 0.12, 0, 0], c: col },
              ]
            : [{ s: 'box', d: [0.26, 0.04, span / 2], p: [0.04, 0, side * span * 0.25], c: col }];
    const markAt = (side: number): Bit[] =>
        mark === 'rund'
            ? [
                  { s: 'cyl', d: [0.17, 0.05, 0.17], p: [0.04, 0.012, side * span * 0.34], c: C.himmel, bare: true },
                  { s: 'cyl', d: [0.11, 0.055, 0.11], p: [0.04, 0.014, side * span * 0.34], c: C.papir, bare: true },
                  { s: 'cyl', d: [0.05, 0.06, 0.05], p: [0.04, 0.016, side * span * 0.34], c: C.fare, bare: true },
              ]
            : [
                  { s: 'box', d: [0.15, 0.05, 0.04], p: [0.04, 0.02, side * span * 0.34], c: C.sot, bare: true },
                  { s: 'box', d: [0.04, 0.05, 0.15], p: [0.04, 0.02, side * span * 0.34], c: C.sot, bare: true },
              ];
    return [
        { s: 'box', d: [len, 0.12, 0.12], p: [0, 0, 0], c: col },
        { s: 'cone', d: [0.12, 0.14, 0.12], p: [len / 2 + 0.06, 0, 0], r: [0, 0, -Math.PI / 2], c: C.sot },
        { s: 'box', d: [0.14, 0.09, 0.08], p: [0.12, 0.08, 0], c: C.himmel, bare: true },
        ...wing(1),
        ...wing(-1),
        ...markAt(1),
        ...markAt(-1),
        { s: 'box', d: [0.14, 0.03, 0.4], p: [-len / 2 + 0.06, 0.02, 0], c: col },
        { s: 'box', d: [0.12, 0.16, 0.03], p: [-len / 2 + 0.06, 0.1, 0], c: col },
    ];
}

const UNIT_BITS: Record<Kind, Bit[]> = {
    inf: [...soldier(0.12, 0.18, C.egen, C.egenLys), ...soldier(0.16, -0.16, C.egen, C.egenLys), ...soldier(-0.16, 0, C.egen, C.egenLys)],
    vogn: tankHull(C.egen, C.sot),
    pv: [
        { s: 'box', d: [0.05, 0.26, 0.44], p: [0.08, 0.2, 0], r: [0, 0, -0.2], c: C.egenLys },
        { s: 'cyl', d: [0.05, 0.6, 0.05], p: [0.3, 0.22, 0], r: [0, 0, Math.PI / 2], c: C.sot, bare: true },
        { s: 'cyl', d: [0.2, 0.05, 0.2], p: [-0.02, 0.1, 0.22], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'cyl', d: [0.2, 0.05, 0.2], p: [-0.02, 0.1, -0.22], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'box', d: [0.5, 0.04, 0.05], p: [-0.28, 0.06, 0.12], r: [0, 0.35, 0], c: C.egen },
        { s: 'box', d: [0.5, 0.04, 0.05], p: [-0.28, 0.06, -0.12], r: [0, -0.35, 0], c: C.egen },
        ...soldier(-0.3, 0.3, C.egen, C.egenLys, false),
    ],
    art: [
        { s: 'box', d: [0.3, 0.14, 0.34], p: [-0.05, 0.14, 0], c: C.egen },
        { s: 'cyl', d: [0.26, 0.07, 0.26], p: [-0.05, 0.13, 0.22], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'cyl', d: [0.26, 0.07, 0.26], p: [-0.05, 0.13, -0.22], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'box', d: [0.62, 0.05, 0.06], p: [-0.4, 0.06, 0.1], r: [0, 0.25, 0], c: C.egen },
        { s: 'box', d: [0.62, 0.05, 0.06], p: [-0.4, 0.06, -0.1], r: [0, -0.25, 0], c: C.egen },
        ...soldier(-0.2, 0.36, C.egen, C.egenLys, false),
        ...soldier(0.1, -0.36, C.egen, C.egenLys, false),
    ],
    lv: [
        { s: 'cyl', d: [0.6, 0.12, 0.6], p: [0, 0.06, 0], c: C.egenLys },
        { s: 'box', d: [0.3, 0.2, 0.3], p: [0, 0.2, 0], c: C.egen },
        { s: 'box', d: [0.06, 0.2, 0.3], p: [-0.12, 0.34, 0], c: C.egen },
        ...soldier(-0.28, -0.22, C.egen, C.egenLys, false),
    ],
    jag: plane(0.95, 0.62, C.egen, 'rund'),
    bomb: [
        ...plane(1.55, 0.95, C.egen, 'rund'),
        { s: 'cyl', d: [0.1, 0.22, 0.1], p: [0.12, -0.02, 0.36], r: [0, 0, Math.PI / 2], c: C.egenLys },
        { s: 'cyl', d: [0.1, 0.22, 0.1], p: [0.12, -0.02, -0.36], r: [0, 0, Math.PI / 2], c: C.egenLys },
    ],
};

/** Deler som dreier seg eller rekylerer for seg: tårn og kanonløp. */
const UNIT_TOP: Partial<Record<Kind, Bit[]>> = {
    vogn: tankTurret(C.egen, 0.48),
    art: [
        { s: 'cyl', d: [0.08, 0.72, 0.08], p: [0.28, 0.12, 0], r: [0, 0, -Math.PI / 2 + 0.62], c: C.sot, bare: true },
        { s: 'box', d: [0.06, 0.24, 0.3], p: [0.1, 0.02, 0], r: [0, 0, -0.2], c: C.egenLys },
    ],
    lv: [
        { s: 'cyl', d: [0.04, 0.55, 0.04], p: [0.18, 0.18, 0.06], r: [0, 0, -0.7], c: C.sot, bare: true },
        { s: 'cyl', d: [0.04, 0.55, 0.04], p: [0.18, 0.18, -0.06], r: [0, 0, -0.7], c: C.sot, bare: true },
    ],
};

const ENEMY_BITS: Record<EKind, Bit[]> = {
    einf: [...soldier(0.1, 0.12, C.fiende, C.fiendeLys), ...soldier(-0.12, -0.12, C.fiende, C.fiendeLys)],
    evogn: [...tankHull(C.fiende, C.sot), { s: 'box', d: [0.05, 0.12, 0.05], p: [-0.2, 0.22, 0.26], c: C.sot, bare: true }],
    epak: [
        { s: 'box', d: [0.05, 0.24, 0.42], p: [0.08, 0.18, 0], r: [0, 0, -0.2], c: C.fiendeLys },
        { s: 'cyl', d: [0.05, 0.56, 0.05], p: [0.3, 0.2, 0], r: [0, 0, Math.PI / 2], c: C.sot, bare: true },
        { s: 'cyl', d: [0.18, 0.05, 0.18], p: [-0.02, 0.09, 0.2], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'cyl', d: [0.18, 0.05, 0.18], p: [-0.02, 0.09, -0.2], r: [Math.PI / 2, 0, 0], c: C.sot },
        { s: 'box', d: [0.46, 0.04, 0.05], p: [-0.26, 0.06, 0], c: C.fiende },
    ],
    estuka: [
        ...plane(1.05, 0.8, C.fiende, 'kors', true),
        { s: 'box', d: [0.07, 0.14, 0.07], p: [0.12, -0.12, 0.18], c: C.sot },
        { s: 'box', d: [0.07, 0.14, 0.07], p: [0.12, -0.12, -0.18], c: C.sot },
        { s: 'cyl', d: [0.07, 0.24, 0.07], p: [0.04, -0.1, 0], r: [0, 0, Math.PI / 2], c: C.fare, bare: true },
    ],
    ejag: plane(0.85, 0.66, C.fiende, 'kors'),
};

const ENEMY_TOP: Partial<Record<EKind, Bit[]>> = {
    evogn: tankTurret(C.fiende, 0.42),
};

function buildAll<K extends string>(bits: Record<K, Bit[]>) {
    return Object.fromEntries(Object.entries<Bit[]>(bits).map(([k, b]) => [k, build(b)])) as Record<K, Model>;
}

function buildSome<K extends string>(bits: Partial<Record<K, Bit[]>>) {
    return Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, build(b as Bit[])])) as Partial<Record<K, Model>>;
}

export const UNIT_MODEL = buildAll(UNIT_BITS);
export const UNIT_TOP_MODEL = buildSome<Kind>(UNIT_TOP);
export const ENEMY_MODEL = buildAll(ENEMY_BITS);
export const ENEMY_TOP_MODEL = buildSome<EKind>(ENEMY_TOP);

/** Utbrent vrak: samme figur i sot og rust. */
export const WRECK = build([
    { s: 'box', d: [0.78, 0.18, 0.5], p: [0, 0.14, 0], r: [0, 0, 0.08], c: C.rust },
    { s: 'box', d: [0.84, 0.12, 0.14], p: [0, 0.07, 0.24], c: C.sot },
    { s: 'box', d: [0.84, 0.12, 0.14], p: [0, 0.07, -0.24], c: C.sot },
    { s: 'box', d: [0.34, 0.14, 0.3], p: [0.05, 0.3, 0.04], r: [0.3, 0.5, 0.2], c: C.sot },
]);

/** Kommandovogna: halvbelter med høy antenne. */
export const HQ_MODEL = build([
    { s: 'box', d: [0.9, 0.3, 0.5], p: [0, 0.22, 0], c: C.egen },
    { s: 'box', d: [0.34, 0.24, 0.48], p: [0.42, 0.2, 0], c: C.egenLys },
    { s: 'box', d: [0.5, 0.14, 0.14], p: [-0.18, 0.08, 0.24], c: C.sot },
    { s: 'box', d: [0.5, 0.14, 0.14], p: [-0.18, 0.08, -0.24], c: C.sot },
    { s: 'cyl', d: [0.16, 0.08, 0.16], p: [0.44, 0.08, 0.24], r: [Math.PI / 2, 0, 0], c: C.sot },
    { s: 'cyl', d: [0.16, 0.08, 0.16], p: [0.44, 0.08, -0.24], r: [Math.PI / 2, 0, 0], c: C.sot },
    { s: 'box', d: [0.3, 0.18, 0.3], p: [-0.2, 0.46, 0], c: C.radio },
    { s: 'cyl', d: [0.03, 1.7, 0.03], p: [-0.3, 1.2, 0.1], c: C.sot, bare: true },
    { s: 'box', d: [0.24, 0.16, 0.02], p: [-0.18, 1.95, 0.1], c: C.fare, bare: true },
    ...soldier(0.1, 0.42, C.egen, C.egenLys, false),
]);

/** Pynt utenfor kartet: trær, hus, sandsekker, telt. */
export const TREE = build([
    { s: 'cyl', d: [0.08, 0.3, 0.08], p: [0, 0.15, 0], c: C.rust, bare: true },
    { s: 'ball', d: [0.55, 0.62, 0.55], p: [0, 0.55, 0], c: '#4a5a30' },
]);
export const POPLAR = build([
    { s: 'cyl', d: [0.07, 0.2, 0.07], p: [0, 0.1, 0], c: C.rust, bare: true },
    { s: 'cone', d: [0.36, 1.2, 0.36], p: [0, 0.75, 0], c: '#4a5a30' },
]);
export const HOUSE = build([
    { s: 'box', d: [0.9, 0.55, 0.7], p: [0, 0.28, 0], c: C.papir },
    { s: 'wedge', d: [1, 0.4, 0.8], p: [0, 0.72, 0], r: [0, 0, 0], c: C.fare },
    { s: 'box', d: [0.14, 0.24, 0.02], p: [0.2, 0.12, 0.36], c: C.himmel, bare: true },
]);
export const PALM = build([
    { s: 'cyl', d: [0.07, 0.9, 0.07], p: [0, 0.45, 0], r: [0, 0, 0.12], c: C.rust, bare: true },
    { s: 'box', d: [0.7, 0.04, 0.14], p: [0.05, 0.92, 0], r: [0, 0.3, -0.3], c: '#4a5a30' },
    { s: 'box', d: [0.7, 0.04, 0.14], p: [0.05, 0.92, 0], r: [0, -1.2, -0.3], c: '#4a5a30' },
    { s: 'box', d: [0.7, 0.04, 0.14], p: [0.05, 0.92, 0], r: [0, 1.9, -0.3], c: '#4a5a30' },
]);
export const SANDBAGS = build([
    { s: 'box', d: [0.22, 0.12, 0.8], p: [0, 0.06, 0], c: '#c9b88a' },
    { s: 'box', d: [0.22, 0.12, 0.7], p: [0, 0.18, 0], c: '#c9b88a' },
]);
export const TENT = build([
    { s: 'wedge', d: [0.6, 0.4, 0.8], p: [0, 0.2, 0], r: [0, Math.PI / 2, 0], c: C.egenLys },
]);
export const SHIP = build([
    { s: 'box', d: [1.2, 0.2, 0.36], p: [0, 0.1, 0], c: C.fiende },
    { s: 'box', d: [0.4, 0.26, 0.26], p: [-0.1, 0.32, 0], c: C.papir },
    { s: 'cyl', d: [0.1, 0.3, 0.1], p: [0.1, 0.5, 0], c: C.sot },
]);
