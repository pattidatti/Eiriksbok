import * as THREE from 'three';
import type { EKind, Kind } from './tuning';

// Fargene og figurene (kunstbrief versjon 2: realistisk strategispill sett ovenfra).
// Hver figur er mange små biter slått sammen til én geometri med farge i hjørnene og
// UV-er, så én felles tekstur legger kamuflasjeflekker og slitasje over alt. Lyset og
// skyggene er ekte (light.tsx). Spillreglene vet ingenting om figurene.

export const C = {
    /** Bakgrunn bak bakken (ses nesten aldri). */
    papir: '#2c3124',
    sot: '#16150f',
    fare: '#c8321f',
    radio: '#ffc629',
    egen: '#5c6139',
    fiende: '#5d6167',
    hud: '#c49a78',
    /** Bannerfargen (slagets navn). */
    himmel: '#2f3522',
    rust: '#5a3b26',
    /** Ringene på bakken: hvem er hvem. */
    ringEgen: '#58c44a',
    ringFiende: '#e0402a',
};

/** Én palett per slag: uniform, kjøretøy og detaljer. */
export type Look = 'kyst' | 'ørken' | 'steppe' | 'vinter';
export const LOOK: Record<string, Look> = { dunkerque: 'kyst', alamein: 'ørken', kursk: 'steppe', normandie: 'kyst', bastogne: 'vinter', rhinen: 'kyst' };

interface Pal {
    vogn: string;
    vognLys: string;
    uniform: string;
    hjelm: string;
    fVogn: string;
    fVognLys: string;
    fUniform: string;
    fHjelm: string;
}

const PAL: Record<Look, Pal> = {
    // Britisk khaki-grønn mot tysk panser-grå.
    kyst: { vogn: '#565b36', vognLys: '#6c6f45', uniform: '#6b6443', hjelm: '#4b4f30', fVogn: '#50555b', fVognLys: '#666b71', fUniform: '#5c6258', fHjelm: '#474c46' },
    // Ørkengul med grønne flekker mot tysk sandgul.
    ørken: { vogn: '#b7a06a', vognLys: '#8c8a58', uniform: '#b49b6b', hjelm: '#8f8558', fVogn: '#a8905e', fVognLys: '#8d7a52', fUniform: '#9d9270', fHjelm: '#7d7456' },
    // Olivengrønn mot tysk mørk gul med brune flekker (1943).
    steppe: { vogn: '#4f5530', vognLys: '#656a3c', uniform: '#5e5f3a', hjelm: '#444a2a', fVogn: '#8f7f4c', fVognLys: '#6e5c3a', fUniform: '#5c6252', fHjelm: '#4d5147' },
    // Amerikansk olivengrønn mot tyske vogner kalket hvite for snøen.
    vinter: { vogn: '#4d5230', vognLys: '#62663e', uniform: '#57553a', hjelm: '#44472c', fVogn: '#b4b8b2', fVognLys: '#8b8f8a', fUniform: '#6b6f68', fHjelm: '#c9ccc6' },
};

const METALL = '#2b2a27';
const BELTE = '#3a3530';
const GUMMI = '#222120';
const TRE = '#6a4a2c';
const HUD = '#c49a78';
const GLASS = '#2e3d48';
const SEKK = '#6e5f40';

// ---- Kamuflasje og slitasje: én gråtone-tekstur som ganges med fargen ------------------
let camoTex: THREE.CanvasTexture | null = null;

/** Flekker, slitasje og korn. Øverste høyre hjørne er glatt, for biter uten mønster. */
export function camo() {
    if (camoTex) return camoTex;
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    let s = 91;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    c.fillStyle = '#e8e8e8';
    c.fillRect(0, 0, S, S);
    // Store, myke kamuflasjeflekker i to toner.
    for (let i = 0; i < 26; i++) {
        c.fillStyle = i % 3 ? 'rgba(150,150,150,.55)' : 'rgba(255,255,255,.5)';
        c.beginPath();
        const x = r() * S;
        const y = r() * S;
        for (let k = 0; k < 7; k++) {
            const a = (k / 7) * Math.PI * 2;
            const rr = 14 + r() * 22;
            c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7);
        }
        c.fill();
    }
    // Skitt og rennende rust nedover.
    for (let i = 0; i < 60; i++) {
        c.fillStyle = `rgba(90,80,60,${0.08 + r() * 0.12})`;
        c.fillRect(r() * S, r() * S, 1 + r() * 2, 6 + r() * 20);
    }
    // Korn.
    const img = c.getImageData(0, 0, S, S);
    for (let i = 0; i < img.data.length; i += 4) {
        const n = (r() - 0.5) * 34;
        img.data[i] += n;
        img.data[i + 1] += n;
        img.data[i + 2] += n;
    }
    c.putImageData(img, 0, 0);
    c.fillStyle = '#f0f0f0';
    c.fillRect(S - 20, 0, 20, 20);
    camoTex = new THREE.CanvasTexture(cv);
    camoTex.colorSpace = THREE.SRGBColorSpace;
    camoTex.wrapS = camoTex.wrapT = THREE.RepeatWrapping;
    camoTex.anisotropy = 4;
    return camoTex;
}

let figHi: THREE.MeshStandardMaterial | null = null;
/** Samme materiale, lysere: enheten eleven peker på eller klikket. */
export function figureMaterialHi() {
    if (!figHi) {
        figHi = figureMaterial().clone();
        figHi.emissive.set('#ffd98a');
        figHi.emissiveIntensity = 0.22;
    }
    return figHi;
}

let figMat: THREE.MeshStandardMaterial | null = null;
/** Ett materiale for alle figurer: fargen ligger i hjørnene, mønsteret i teksturen. */
export function figureMaterial() {
    if (!figMat) figMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: camo(), roughness: 0.82, metalness: 0.12 });
    return figMat;
}

// ---- Bitene ---------------------------------------------------------------------------
type Shape = 'box' | 'cyl' | 'cone' | 'ball' | 'wedge' | 'rock' | 'tube';

export interface Bit {
    s: Shape;
    /** Bredde (x), høyde (y), dybde (z). For sylinder: diameter, lengde, diameter. */
    d: [number, number, number];
    p: [number, number, number];
    r?: [number, number, number];
    c: string;
    /** Uten kamuflasjemønster (glass, gummi, hud, merker). */
    plain?: boolean;
}

function geoOf(s: Shape): THREE.BufferGeometry {
    if (s === 'box') return new THREE.BoxGeometry(1, 1, 1);
    if (s === 'cyl') return new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
    if (s === 'tube') return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    if (s === 'cone') return new THREE.ConeGeometry(0.5, 1, 9);
    if (s === 'ball') return new THREE.SphereGeometry(0.5, 9, 6);
    if (s === 'rock') return new THREE.DodecahedronGeometry(0.5, 0);
    // Kile: tak, skrå front og skjold.
    const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
    g.rotateZ(Math.PI / 2);
    g.rotateX(-Math.PI / 2);
    return g;
}

const MT = new THREE.Matrix4();
const QT = new THREE.Quaternion();
const ET = new THREE.Euler();
const CT = new THREE.Color();

/** Slår bitene sammen til én geometri med farger og UV-er (mønsteret like tett overalt). */
export function build(bits: Bit[]) {
    let seed = bits.length * 31 + 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const parts = bits.map((b) => {
        const base = geoOf(b.s);
        const g = base.index ? base.toNonIndexed() : base;
        ET.set(...(b.r ?? [0, 0, 0]));
        QT.setFromEuler(ET);
        MT.compose(new THREE.Vector3(...b.p), QT, new THREE.Vector3(...b.d));
        g.applyMatrix4(MT);
        const n = g.getAttribute('position').count;
        CT.set(b.c);
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) col.set([CT.r, CT.g, CT.b], i * 3);
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const uv = g.getAttribute('uv');
        const k = Math.max(...b.d) * 1.6;
        const ox = rnd();
        const oy = rnd();
        for (let i = 0; i < uv.count; i++) {
            if (b.plain) uv.setXY(i, 0.97, 0.97);
            else uv.setXY(i, uv.getX(i) * k + ox, uv.getY(i) * k + oy);
        }
        return g;
    });
    let total = 0;
    for (const g of parts) total += g.getAttribute('position').count;
    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const uvs = new Float32Array(total * 2);
    let o = 0;
    for (const g of parts) {
        const n = g.getAttribute('position').count;
        pos.set(g.getAttribute('position').array as Float32Array, o * 3);
        nor.set(g.getAttribute('normal').array as Float32Array, o * 3);
        col.set(g.getAttribute('color').array as Float32Array, o * 3);
        uvs.set(g.getAttribute('uv').array as Float32Array, o * 2);
        o += n;
        g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    out.computeBoundingSphere();
    return out;
}

export type Model = THREE.BufferGeometry;

// ---- Figurene (x = framover, mot fienden) ----------------------------------------------
/** En soldat med hjelm, sekk og gevær. `tysk` gir stålhjelmen med skjørt. */
function soldier(x: number, z: number, cloth: string, helmet: string, o: { rifle?: boolean; tysk?: boolean; kne?: boolean; yaw?: number } = {}): Bit[] {
    const y0 = o.kne ? -0.06 : 0;
    const out: Bit[] = [
        { s: 'box', d: [0.05, 0.16, 0.05], p: [x, 0.08 + y0, z + 0.035], c: cloth },
        { s: 'box', d: [0.05, 0.16, 0.05], p: [x + (o.kne ? 0.06 : 0), 0.08 + y0 / 2, z - 0.035], r: [0, 0, o.kne ? 1.2 : 0], c: cloth },
        { s: 'box', d: [0.09, 0.15, 0.13], p: [x, 0.24 + y0, z], c: cloth },
        { s: 'box', d: [0.06, 0.1, 0.1], p: [x - 0.07, 0.25 + y0, z], c: SEKK },
        { s: 'box', d: [0.04, 0.12, 0.04], p: [x + 0.04, 0.24 + y0, z + 0.08], r: [0.3, 0, -0.9], c: cloth },
        { s: 'box', d: [0.04, 0.12, 0.04], p: [x + 0.04, 0.24 + y0, z - 0.08], r: [-0.3, 0, -0.9], c: cloth },
        { s: 'ball', d: [0.075, 0.08, 0.075], p: [x + 0.005, 0.355 + y0, z], c: HUD, plain: true },
    ];
    if (o.tysk)
        out.push(
            { s: 'ball', d: [0.1, 0.07, 0.1], p: [x, 0.385 + y0, z], c: helmet },
            { s: 'cyl', d: [0.11, 0.03, 0.11], p: [x - 0.01, 0.36 + y0, z], c: helmet }
        );
    else
        out.push(
            { s: 'cyl', d: [0.15, 0.015, 0.15], p: [x, 0.38 + y0, z], c: helmet },
            { s: 'ball', d: [0.09, 0.05, 0.09], p: [x, 0.395 + y0, z], c: helmet }
        );
    if (o.rifle !== false)
        out.push(
            { s: 'box', d: [0.24, 0.022, 0.022], p: [x + 0.1, 0.26 + y0, z], r: [0, 0, 0.25], c: TRE },
            { s: 'tube', d: [0.012, 0.12, 0.012], p: [x + 0.25, 0.3 + y0, z], r: [0, 0, -Math.PI / 2 + 0.25], c: METALL, plain: true }
        );
    return out;
}

function wheel(x: number, y: number, z: number, d: number, w: number): Bit[] {
    return [
        { s: 'cyl', d: [d, w, d], p: [x, y, z], r: [Math.PI / 2, 0, 0], c: GUMMI, plain: true },
        { s: 'cyl', d: [d * 0.55, w + 0.01, d * 0.55], p: [x, y, z], r: [Math.PI / 2, 0, 0], c: METALL },
    ];
}

/** Belter med hjul, skrog, skrå front, skjermer, eksos og kasser bak. */
function tankHull(col: string, lys: string): Bit[] {
    const out: Bit[] = [
        { s: 'box', d: [0.8, 0.14, 0.34], p: [0, 0.16, 0], c: col },
        { s: 'box', d: [0.62, 0.12, 0.5], p: [-0.06, 0.28, 0], c: col },
        { s: 'box', d: [0.2, 0.1, 0.46], p: [0.3, 0.26, 0], r: [0, 0, -0.55], c: col },
        { s: 'box', d: [0.82, 0.02, 0.6], p: [-0.01, 0.235, 0], c: lys },
        // Eksos og kasser bak, verktøy på skjermen.
        { s: 'tube', d: [0.05, 0.14, 0.05], p: [-0.42, 0.22, 0.14], r: [0, 0, Math.PI / 2], c: METALL, plain: true },
        { s: 'tube', d: [0.05, 0.14, 0.05], p: [-0.42, 0.22, -0.14], r: [0, 0, Math.PI / 2], c: METALL, plain: true },
        { s: 'box', d: [0.1, 0.08, 0.22], p: [-0.33, 0.37, 0.1], c: lys },
        { s: 'box', d: [0.36, 0.03, 0.03], p: [0, 0.255, 0.27], c: TRE },
        { s: 'box', d: [0.08, 0.02, 0.08], p: [0.2, 0.345, 0.14], c: lys },
    ];
    for (const side of [1, -1]) {
        out.push({ s: 'box', d: [0.86, 0.15, 0.12], p: [0, 0.1, side * 0.24], c: BELTE, plain: true });
        for (let i = 0; i < 5; i++) out.push(...wheel(-0.3 + i * 0.15, 0.08, side * 0.305, 0.12, 0.02));
        out.push(...wheel(0.4, 0.12, side * 0.3, 0.1, 0.03));
    }
    return out;
}

/** Tårnet: kasse, kanonskjold, løp med munningsbrems, kommandørluke og antenne. */
function tankTurret(col: string, lys: string, gun: number): Bit[] {
    return [
        { s: 'box', d: [0.36, 0.14, 0.32], p: [-0.04, 0.4, 0], c: col },
        { s: 'box', d: [0.12, 0.12, 0.28], p: [0.12, 0.4, 0], r: [0, 0, -0.35], c: col },
        { s: 'box', d: [0.06, 0.1, 0.14], p: [0.17, 0.39, 0], c: lys },
        { s: 'cyl', d: [0.12, 0.06, 0.12], p: [-0.1, 0.5, 0.07], c: col },
        { s: 'cyl', d: [0.1, 0.015, 0.1], p: [-0.1, 0.535, 0.07], c: lys },
        { s: 'box', d: [0.12, 0.08, 0.3], p: [-0.25, 0.4, 0], c: lys },
        { s: 'tube', d: [0.045, gun, 0.045], p: [0.18 + gun / 2, 0.4, 0], r: [0, 0, Math.PI / 2], c: col },
        { s: 'tube', d: [0.065, 0.06, 0.065], p: [0.18 + gun, 0.4, 0], r: [0, 0, Math.PI / 2], c: METALL, plain: true },
        { s: 'tube', d: [0.01, 0.5, 0.01], p: [-0.2, 0.7, -0.12], r: [0, 0, 0.2], c: METALL, plain: true },
    ];
}

/** Et fly: flykropp, motor, glasskupé, vinger, haleplan og merker (propellen er egen). */
function plane(span: number, len: number, col: string, under: string, mark: 'rund' | 'kors', o: { gull?: boolean; motorer?: number } = {}): Bit[] {
    const wing = (side: number): Bit[] =>
        o.gull
            ? [
                  { s: 'box', d: [0.24, 0.03, span * 0.22], p: [0.04, -0.03, side * span * 0.12], r: [side * 0.42, 0, 0], c: col },
                  { s: 'box', d: [0.2, 0.03, span * 0.3], p: [0.03, 0.0, side * span * 0.36], r: [-side * 0.1, 0, 0], c: col },
              ]
            : [
                  { s: 'box', d: [0.26, 0.03, span * 0.3], p: [0.04, 0, side * span * 0.16], c: col },
                  { s: 'box', d: [0.17, 0.025, span * 0.2], p: [0.03, 0.005, side * span * 0.4], c: col },
              ];
    const markAt = (side: number): Bit[] => {
        const z = side * span * 0.34;
        if (mark === 'rund')
            return [
                { s: 'cyl', d: [0.15, 0.036, 0.15], p: [0.03, 0.005, z], c: '#c9a92e', plain: true },
                { s: 'cyl', d: [0.13, 0.04, 0.13], p: [0.03, 0.005, z], c: '#2a3a66', plain: true },
                { s: 'cyl', d: [0.08, 0.044, 0.08], p: [0.03, 0.005, z], c: '#e9e6dc', plain: true },
                { s: 'cyl', d: [0.04, 0.048, 0.04], p: [0.03, 0.005, z], c: '#b0281f', plain: true },
            ];
        return [
            { s: 'box', d: [0.14, 0.036, 0.05], p: [0.03, 0.005, z], c: '#e9e6dc', plain: true },
            { s: 'box', d: [0.05, 0.036, 0.14], p: [0.03, 0.005, z], c: '#e9e6dc', plain: true },
            { s: 'box', d: [0.11, 0.04, 0.025], p: [0.03, 0.005, z], c: '#141414', plain: true },
            { s: 'box', d: [0.025, 0.04, 0.11], p: [0.03, 0.005, z], c: '#141414', plain: true },
        ];
    };
    const out: Bit[] = [
        { s: 'cyl', d: [0.11, len, 0.11], p: [0, 0, 0], r: [0, 0, Math.PI / 2], c: col },
        { s: 'cone', d: [0.1, len * 0.35, 0.1], p: [-len / 2 - len * 0.15, 0.01, 0], r: [0, 0, Math.PI / 2], c: col },
        { s: 'box', d: [len * 0.6, 0.02, 0.1], p: [0, -0.05, 0], c: under },
        { s: 'ball', d: [0.16, 0.09, 0.07], p: [0.06, 0.06, 0], c: GLASS, plain: true },
        ...wing(1),
        ...wing(-1),
        ...markAt(1),
        ...markAt(-1),
        { s: 'box', d: [0.1, 0.02, 0.32], p: [-len / 2 - 0.2, 0.02, 0], c: col },
        { s: 'box', d: [0.12, 0.13, 0.02], p: [-len / 2 - 0.2, 0.08, 0], c: col },
    ];
    if (!o.motorer) out.push({ s: 'cyl', d: [0.13, 0.1, 0.13], p: [len / 2, 0, 0], r: [0, 0, Math.PI / 2], c: METALL });
    else
        for (const side of [1, -1])
            out.push(
                { s: 'cyl', d: [0.11, 0.28, 0.11], p: [0.1, -0.01, side * span * 0.2], r: [0, 0, Math.PI / 2], c: col },
                { s: 'cyl', d: [0.12, 0.06, 0.12], p: [0.25, -0.01, side * span * 0.2], r: [0, 0, Math.PI / 2], c: METALL }
            );
    return out;
}

/** Propellen: to blad og nav, dreies rundt x i world.tsx. */
export function propAt(z: number, x: number, d = 0.26): Bit[] {
    return [
        { s: 'box', d: [0.015, d, 0.03], p: [x, 0, z], c: '#1d1c1a', plain: true },
        { s: 'box', d: [0.015, 0.03, d], p: [x, 0, z], c: '#1d1c1a', plain: true },
        { s: 'cone', d: [0.06, 0.07, 0.06], p: [x + 0.03, 0, z], r: [0, 0, -Math.PI / 2], c: '#9c2a20', plain: true },
    ];
}

/** Hvor propellene sitter: [z, x] lokalt, før skalering. */
export const PROPS: Partial<Record<Kind | EKind, [number, number][]>> = {
    jag: [[0, 0.34]],
    bomb: [[0.32, 0.29], [-0.32, 0.29]],
    estuka: [[0, 0.42]],
    ejag: [[0, 0.36]],
};

function crewGun(p: Pal, fiende: boolean): Bit[] {
    const col = fiende ? p.fVogn : p.vogn;
    return [
        { s: 'box', d: [0.04, 0.24, 0.2], p: [0.1, 0.18, 0.1], r: [0, 0.3, -0.12], c: col },
        { s: 'box', d: [0.04, 0.24, 0.2], p: [0.1, 0.18, -0.1], r: [0, -0.3, -0.12], c: col },
        { s: 'box', d: [0.12, 0.06, 0.08], p: [0.06, 0.18, 0], c: METALL },
        ...wheel(0.02, 0.1, 0.2, 0.2, 0.04),
        ...wheel(0.02, 0.1, -0.2, 0.2, 0.04),
        { s: 'box', d: [0.5, 0.04, 0.05], p: [-0.26, 0.05, 0.1], r: [0, 0.32, 0], c: col },
        { s: 'box', d: [0.5, 0.04, 0.05], p: [-0.26, 0.05, -0.1], r: [0, -0.32, 0], c: col },
    ];
}

function unitBits(p: Pal): Record<Kind, Bit[]> {
    return {
        // Soldatene selv er instanser som beveger seg (soldiers.tsx); her står bare kassa.
        inf: [{ s: 'box', d: [0.12, 0.06, 0.08], p: [-0.28, 0.03, -0.2], c: TRE }, { s: 'box', d: [0.1, 0.05, 0.07], p: [-0.3, 0.085, -0.2], c: SEKK }],
        vogn: tankHull(p.vogn, p.vognLys),
        pv: [...crewGun(p, false), { s: 'box', d: [0.14, 0.05, 0.08], p: [-0.4, 0.03, 0.3], c: TRE }],
        art: [
            ...wheel(-0.02, 0.14, 0.22, 0.28, 0.06),
            ...wheel(-0.02, 0.14, -0.22, 0.28, 0.06),
            { s: 'box', d: [0.22, 0.1, 0.34], p: [-0.02, 0.15, 0], c: p.vogn },
            { s: 'box', d: [0.7, 0.07, 0.1], p: [-0.42, 0.07, 0], r: [0, 0, 0.12], c: p.vogn },
            { s: 'cyl', d: [0.14, 0.05, 0.14], p: [-0.76, 0.03, 0], c: METALL },
            { s: 'box', d: [0.14, 0.06, 0.1], p: [-0.5, 0.03, -0.3], c: TRE },
            { s: 'box', d: [0.14, 0.06, 0.1], p: [-0.52, 0.09, -0.3], c: TRE },
        ],
        lv: [
            { s: 'box', d: [0.7, 0.04, 0.08], p: [0, 0.03, 0], r: [0, 0.78, 0], c: p.vogn },
            { s: 'box', d: [0.7, 0.04, 0.08], p: [0, 0.03, 0], r: [0, -0.78, 0], c: p.vogn },
            { s: 'cyl', d: [0.22, 0.14, 0.22], p: [0, 0.12, 0], c: p.vogn },
            { s: 'box', d: [0.12, 0.08, 0.08], p: [-0.1, 0.04, 0.34], c: TRE },
        ],
        jag: plane(0.95, 0.56, p.vogn, '#8e98a0', 'rund'),
        bomb: plane(1.6, 0.9, p.vogn, '#2a2a2a', 'rund', { motorer: 2 }),
        // Soldatene er instanser; her ligger fallskjermene de kom ned i, sammenrullet.
        fsk: [
            { s: 'ball', d: [0.2, 0.06, 0.16], p: [-0.3, 0.03, -0.22], c: '#d8d4c4' },
            { s: 'ball', d: [0.16, 0.05, 0.14], p: [-0.34, 0.025, 0.3], c: '#cfcab8' },
            { s: 'box', d: [0.12, 0.06, 0.08], p: [-0.2, 0.03, -0.34], c: TRE },
        ],
    };
}

/** Deler som dreier seg eller rekylerer for seg: tårn og kanonløp. */
function unitTop(p: Pal): Partial<Record<Kind, Bit[]>> {
    return {
        vogn: tankTurret(p.vogn, p.vognLys, 0.44),
        art: [
            { s: 'box', d: [0.05, 0.22, 0.3], p: [0.1, 0.1, 0], r: [0, 0, -0.18], c: p.vognLys },
            { s: 'tube', d: [0.07, 0.36, 0.07], p: [0.08, 0.16, 0], r: [0, 0, -Math.PI / 2 + 0.55], c: p.vogn },
            { s: 'tube', d: [0.045, 0.46, 0.045], p: [0.4, 0.33, 0], r: [0, 0, -Math.PI / 2 + 0.55], c: p.vogn },
        ],
        pv: [{ s: 'tube', d: [0.035, 0.62, 0.035], p: [0.34, 0.2, 0], r: [0, 0, Math.PI / 2], c: p.vogn }],
        lv: [
            { s: 'box', d: [0.2, 0.14, 0.26], p: [0, 0.26, 0], c: p.vognLys },
            { s: 'box', d: [0.04, 0.16, 0.3], p: [0.1, 0.36, 0], r: [0, 0, -0.3], c: p.vogn },
            { s: 'tube', d: [0.03, 0.55, 0.03], p: [0.22, 0.45, 0.06], r: [0, 0, -0.75], c: METALL, plain: true },
            { s: 'tube', d: [0.03, 0.55, 0.03], p: [0.22, 0.45, -0.06], r: [0, 0, -0.75], c: METALL, plain: true },
        ],
    };
}

function enemyBits(p: Pal): Partial<Record<EKind, Bit[]>> {
    return {
        evogn: [...tankHull(p.fVogn, p.fVognLys), { s: 'box', d: [0.03, 0.2, 0.46], p: [-0.12, 0.3, 0], c: p.fVognLys }],
        epak: [...crewGun(p, true), { s: 'tube', d: [0.035, 0.58, 0.035], p: [0.34, 0.2, 0], r: [0, 0, Math.PI / 2], c: p.fVogn }],
        estuka: [
            ...plane(1.05, 0.72, p.fVogn, '#9aa4ab', 'kors', { gull: true }),
            { s: 'box', d: [0.07, 0.16, 0.05], p: [0.12, -0.12, 0.18], c: p.fVogn },
            { s: 'box', d: [0.07, 0.16, 0.05], p: [0.12, -0.12, -0.18], c: p.fVogn },
            { s: 'cyl', d: [0.06, 0.26, 0.06], p: [0.03, -0.1, 0], r: [0, 0, Math.PI / 2], c: METALL },
        ],
        ejag: plane(0.82, 0.6, p.fVogn, '#9aa4ab', 'kors'),
        // Haubitsen i stilling: sandsekker rundt, løpet høyt.
        ebatt: [
            ...wheel(-0.02, 0.14, 0.22, 0.28, 0.06),
            ...wheel(-0.02, 0.14, -0.22, 0.28, 0.06),
            { s: 'box', d: [0.24, 0.12, 0.36], p: [-0.02, 0.16, 0], c: p.fVogn },
            { s: 'box', d: [0.7, 0.07, 0.1], p: [-0.42, 0.07, 0.08], r: [0, 0.2, 0.12], c: p.fVogn },
            { s: 'box', d: [0.7, 0.07, 0.1], p: [-0.42, 0.07, -0.08], r: [0, -0.2, 0.12], c: p.fVogn },
            { s: 'tube', d: [0.08, 0.5, 0.08], p: [0.2, 0.34, 0], r: [0, 0, -Math.PI / 2 + 0.7], c: p.fVognLys },
            { s: 'tube', d: [0.05, 0.45, 0.05], p: [0.44, 0.55, 0], r: [0, 0, -Math.PI / 2 + 0.7], c: p.fVogn },
            ...[-0.5, -0.25, 0, 0.25, 0.5].map((z): Bit => ({ s: 'ball', d: [0.2, 0.1, 0.22], p: [0.42, 0.05, z], c: '#8a7a58' })),
            ...[-0.38, -0.12, 0.14, 0.4].map((z): Bit => ({ s: 'ball', d: [0.2, 0.1, 0.22], p: [0.44, 0.14, z], c: '#7d6e4f' })),
        ],
    };
}

const ENEMY_TOP_BITS = (p: Pal): Partial<Record<EKind, Bit[]>> => ({ evogn: tankTurret(p.fVogn, p.fVognLys, 0.5) });

function buildMap<K extends string>(bits: Partial<Record<K, Bit[]>>) {
    return Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, build(b as Bit[])])) as Record<K, Model>;
}

export interface ModelSet {
    unit: Record<Kind, Model>;
    unitTop: Partial<Record<Kind, Model>>;
    /** Fiendens infanteri har ingen fast figur: bare soldater (soldiers.tsx). */
    enemy: Partial<Record<EKind, Model>>;
    enemyTop: Partial<Record<EKind, Model>>;
}

const SETS: Partial<Record<Look, ModelSet>> = {};
/** Figurene i slagets farger (bygges første gang de trengs). */
export function modelsFor(look: Look): ModelSet {
    const p = PAL[look];
    return (SETS[look] ??= {
        unit: buildMap(unitBits(p)),
        unitTop: buildMap(unitTop(p)),
        enemy: buildMap(enemyBits(p)),
        enemyTop: buildMap(ENEMY_TOP_BITS(p)),
    });
}

// ---- Soldatene som instanser (soldiers.tsx) ----------------------------------------------
/** Hvor soldatene står i figuren (x = framover), og om de kneler når de skyter. */
export type Post = [number, number, boolean];
export const SQUAD: Record<string, Post[]> = {
    // De fire første er troppen; sammenslåtte tropper får to til per kopi.
    inf: [[0.14, 0.2, false], [0.2, -0.14, true], [-0.12, 0.02, false], [-0.18, 0.28, true], [0.04, -0.34, true], [-0.3, -0.1, false], [0.32, 0.04, true], [-0.02, 0.42, false]],
    einf: [[0.12, 0.14, false], [-0.1, -0.12, false], [-0.02, 0.3, true], [-0.24, 0.1, false]],
    pv: [[-0.2, 0.28, true], [-0.3, -0.2, false]],
    epak: [[-0.2, 0.28, true], [-0.3, -0.2, false]],
    art: [[-0.3, 0.32, true], [0.12, -0.36, false], [-0.5, -0.1, false]],
    lv: [[-0.3, -0.24, false], [-0.28, 0.26, true]],
    fsk: [[0.14, 0.2, false], [0.2, -0.14, true], [-0.12, 0.02, false], [-0.18, 0.28, true], [0.04, -0.34, true], [-0.3, -0.1, false], [0.32, 0.04, true], [-0.02, 0.42, false]],
    ebatt: [[-0.36, 0.34, true], [0.02, -0.4, false], [-0.55, -0.12, false]],
};
/** Hofta over bakken når soldaten står. */
export const HIP = 0.16;

export interface SoldierParts {
    rifle: Model;
    crew: Model;
    leg: Model;
}
const PARTS: Record<string, SoldierParts> = {};
/** Overkroppen (med og uten gevær) med hofta i origo, og ett bein som henger fra hofta. */
export function soldierParts(look: Look, fiende: boolean): SoldierParts {
    const p = PAL[look];
    const cloth = fiende ? p.fUniform : p.uniform;
    const helmet = fiende ? p.fHjelm : p.hjelm;
    const upper = (rifle: boolean) =>
        build(soldier(0, 0, cloth, helmet, { rifle, tysk: fiende }).slice(2).map((b) => ({ ...b, p: [b.p[0], b.p[1] - HIP, b.p[2]] as [number, number, number] })));
    return (PARTS[look + fiende] ??= {
        rifle: upper(true),
        crew: upper(false),
        leg: build([
            { s: 'box', d: [0.05, 0.15, 0.05], p: [0, -0.075, 0], c: cloth },
            { s: 'box', d: [0.075, 0.03, 0.055], p: [0.012, -0.15, 0], c: '#2a241c', plain: true },
        ]),
    });
}

let propModel: Model | null = null;
export function propeller() {
    return (propModel ??= build(propAt(0, 0)));
}

let wreckModel: Model | null = null;
/** Utbrent vrak: svidd skrog, tårnet på skakke. */
export function wreck() {
    return (wreckModel ??= build([
        { s: 'box', d: [0.8, 0.14, 0.34], p: [0, 0.13, 0], r: [0, 0, 0.05], c: '#2e2a25' },
        { s: 'box', d: [0.62, 0.1, 0.48], p: [-0.06, 0.24, 0], r: [0.04, 0, 0.05], c: '#3b2c20' },
        { s: 'box', d: [0.86, 0.12, 0.12], p: [0, 0.07, 0.24], c: '#1c1a17', plain: true },
        { s: 'box', d: [0.7, 0.1, 0.12], p: [-0.05, 0.06, -0.3], r: [0.5, 0.1, 0], c: '#1c1a17', plain: true },
        { s: 'box', d: [0.34, 0.14, 0.3], p: [0.08, 0.36, 0.1], r: [0.35, 0.6, 0.25], c: '#4a3222' },
        { s: 'tube', d: [0.045, 0.4, 0.045], p: [0.3, 0.3, 0.26], r: [0.3, 0.6, 1.9], c: '#2a2520' },
    ]));
}

/** Kommandovogna: halvbelter med radiokasse, kartbord og høy antenne. */
export function hqModel(look: Look) {
    const p = PAL[look];
    return build([
        { s: 'box', d: [0.6, 0.26, 0.5], p: [-0.12, 0.26, 0], c: p.vogn },
        { s: 'box', d: [0.3, 0.2, 0.44], p: [0.34, 0.24, 0], c: p.vogn },
        { s: 'box', d: [0.12, 0.08, 0.36], p: [0.5, 0.28, 0], r: [0, 0, -0.5], c: p.vognLys },
        { s: 'box', d: [0.04, 0.1, 0.4], p: [0.2, 0.44, 0], r: [0, 0, 0.3], c: GLASS, plain: true },
        { s: 'box', d: [0.56, 0.12, 0.13], p: [-0.18, 0.09, 0.22], c: BELTE, plain: true },
        { s: 'box', d: [0.56, 0.12, 0.13], p: [-0.18, 0.09, -0.22], c: BELTE, plain: true },
        ...wheel(0.36, 0.09, 0.23, 0.18, 0.06),
        ...wheel(0.36, 0.09, -0.23, 0.18, 0.06),
        { s: 'box', d: [0.24, 0.16, 0.22], p: [-0.24, 0.47, 0.08], c: '#3d4232' },
        { s: 'box', d: [0.2, 0.02, 0.02], p: [-0.24, 0.5, 0.2], c: '#d4a93a', plain: true },
        { s: 'box', d: [0.2, 0.02, 0.16], p: [-0.02, 0.41, -0.1], c: '#d9cfae', plain: true },
        { s: 'tube', d: [0.025, 1.7, 0.025], p: [-0.3, 1.2, 0.1], c: METALL, plain: true },
        ...soldier(0.02, -0.16, p.uniform, p.hjelm, { rifle: false }),
        ...soldier(0.1, 0.42, p.uniform, p.hjelm, { rifle: false }),
    ]);
}

// ---- Pynt utenfor kartet ---------------------------------------------------------------
const tree = (lov: string, lov2: string, trunk = '#4d3a26'): Bit[] => [
    { s: 'cyl', d: [0.08, 0.36, 0.08], p: [0, 0.18, 0], c: trunk },
    { s: 'rock', d: [0.56, 0.5, 0.56], p: [0, 0.56, 0], c: lov },
    { s: 'rock', d: [0.4, 0.38, 0.4], p: [0.16, 0.74, 0.1], r: [0.5, 0.3, 0], c: lov2 },
    { s: 'rock', d: [0.42, 0.36, 0.42], p: [-0.14, 0.68, -0.12], r: [0.2, 1, 0], c: lov2 },
];

export const DECO = {
    tree: () => build(tree('#3e4f28', '#4d5e30')),
    poplar: () =>
        build([
            { s: 'cyl', d: [0.07, 0.25, 0.07], p: [0, 0.12, 0], c: '#4d3a26' },
            { s: 'ball', d: [0.36, 1.2, 0.36], p: [0, 0.8, 0], c: '#43552b' },
        ]),
    birch: () => build([...tree('#6c7d3a', '#7f8e45', '#dcd8cc')]),
    pine: () =>
        build([
            { s: 'cyl', d: [0.07, 0.3, 0.07], p: [0, 0.15, 0], c: '#4a3726' },
            { s: 'cone', d: [0.56, 0.5, 0.56], p: [0, 0.48, 0], c: '#2f3f2c' },
            { s: 'cone', d: [0.44, 0.44, 0.44], p: [0, 0.78, 0], c: '#34462f' },
            { s: 'cone', d: [0.3, 0.36, 0.3], p: [0, 1.04, 0], c: '#3a4d33' },
            { s: 'cone', d: [0.36, 0.14, 0.36], p: [0, 0.66, 0], c: '#e8ecee', plain: true },
            { s: 'cone', d: [0.24, 0.12, 0.24], p: [0, 0.94, 0], c: '#eef1f2', plain: true },
        ]),
    hedge: () =>
        build([
            { s: 'rock', d: [0.5, 0.36, 0.4], p: [-0.35, 0.18, 0], c: '#34431f' },
            { s: 'rock', d: [0.5, 0.42, 0.42], p: [0.05, 0.2, 0.02], r: [0, 1, 0], c: '#3c4b24' },
            { s: 'rock', d: [0.46, 0.34, 0.4], p: [0.42, 0.17, -0.02], r: [0.4, 0, 0], c: '#34431f' },
        ]),
    house: () =>
        build([
            { s: 'box', d: [0.9, 0.5, 0.62], p: [0, 0.25, 0], c: '#a39d8f' },
            { s: 'wedge', d: [0.98, 0.34, 0.72], p: [0, 0.66, 0], c: '#8e4631' },
            { s: 'box', d: [0.1, 0.24, 0.1], p: [0.28, 0.8, 0.12], c: '#7a6a5a' },
            { s: 'box', d: [0.12, 0.16, 0.02], p: [0.2, 0.2, 0.315], c: '#2a2a2a', plain: true },
            { s: 'box', d: [0.12, 0.26, 0.02], p: [-0.18, 0.13, 0.315], c: '#4a3424', plain: true },
        ]),
    ruin: () =>
        build([
            { s: 'box', d: [0.9, 0.36, 0.08], p: [0, 0.18, -0.28], c: '#948e80' },
            { s: 'box', d: [0.08, 0.5, 0.6], p: [-0.42, 0.25, 0], c: '#948e80' },
            { s: 'rock', d: [0.3, 0.14, 0.3], p: [0.2, 0.07, 0.1], c: '#7d776a' },
            { s: 'rock', d: [0.24, 0.1, 0.26], p: [-0.1, 0.05, 0.2], r: [0, 1, 0], c: '#8e4631' },
        ]),
    palm: () =>
        build([
            { s: 'cyl', d: [0.07, 0.9, 0.07], p: [0, 0.45, 0], r: [0, 0, 0.12], c: '#6a5234' },
            ...[0.3, -1.2, 1.9, 2.8, -2.3].map((a): Bit => ({ s: 'box', d: [0.6, 0.02, 0.12], p: [0.2 * Math.cos(a) + 0.05, 0.86, -0.2 * Math.sin(a)], r: [0, a, -0.35], c: '#56652f' })),
        ]),
    rock: () =>
        build([
            { s: 'rock', d: [0.5, 0.26, 0.4], p: [0, 0.1, 0], c: '#a28d69' },
            { s: 'rock', d: [0.28, 0.18, 0.26], p: [0.3, 0.06, 0.12], r: [0, 1, 0], c: '#8e7a58' },
        ]),
    scrub: () =>
        build([
            { s: 'rock', d: [0.26, 0.14, 0.26], p: [0, 0.07, 0], c: '#7a7148' },
            { s: 'rock', d: [0.18, 0.12, 0.18], p: [0.16, 0.06, 0.1], c: '#6c6440' },
        ]),
    sandbags: () =>
        build([
            ...[-0.3, -0.1, 0.1, 0.3].map((z): Bit => ({ s: 'ball', d: [0.22, 0.1, 0.2], p: [0, 0.05, z], c: '#b9a37a' })),
            ...[-0.2, 0, 0.2].map((z): Bit => ({ s: 'ball', d: [0.22, 0.1, 0.2], p: [0, 0.14, z], c: '#ab966e' })),
        ]),
    tent: () =>
        build([
            { s: 'wedge', d: [0.6, 0.36, 0.8], p: [0, 0.18, 0], r: [0, Math.PI / 2, 0], c: '#7a7650' },
        ]),
    ship: () =>
        build([
            { s: 'box', d: [1.4, 0.16, 0.3], p: [0, 0.06, 0], c: '#6c7278' },
            { s: 'cone', d: [0.3, 0.3, 0.16], p: [0.8, 0.06, 0], r: [0, 0, -Math.PI / 2], c: '#6c7278' },
            { s: 'box', d: [0.36, 0.18, 0.2], p: [0.05, 0.22, 0], c: '#7d8388' },
            { s: 'cyl', d: [0.1, 0.24, 0.1], p: [-0.2, 0.3, 0], c: '#3a3a3a' },
            { s: 'cyl', d: [0.03, 0.4, 0.03], p: [0.2, 0.42, 0], c: '#3a3a3a', plain: true },
        ]),
    sheaf: () =>
        build([
            { s: 'cone', d: [0.22, 0.3, 0.22], p: [0, 0.15, 0], c: '#c8a452' },
            { s: 'cone', d: [0.2, 0.26, 0.2], p: [0.26, 0.13, 0.1], c: '#bf9a48' },
        ]),
    truck: () =>
        build([
            { s: 'box', d: [0.5, 0.2, 0.34], p: [-0.12, 0.2, 0], r: [0, 0, 0.1], c: '#2f2a24' },
            { s: 'box', d: [0.22, 0.2, 0.3], p: [0.26, 0.2, 0], c: '#3a2c20' },
            ...wheel(0.26, 0.07, 0.17, 0.14, 0.05),
            ...wheel(-0.2, 0.07, -0.17, 0.14, 0.05),
        ]),
    pole: () =>
        build([
            { s: 'cyl', d: [0.05, 0.9, 0.05], p: [0, 0.45, 0], c: '#5a4632' },
            { s: 'box', d: [0.03, 0.03, 0.3], p: [0, 0.84, 0], c: '#5a4632' },
        ]),
};
