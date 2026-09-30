import * as THREE from 'three';
import { mergeParts, type Part } from '../kit/mergeParts';

// HAMMER OG AMBOLT - figurene.
//
// Alle figurer er lav-poly biter slått sammen til én geometri per del (mergeParts), og
// tegnes som InstancedMesh: én draw call per del for hele slagmarken. Hvite flater
// fargelegges per instans (hærens farge); faste farger (hud, bronse, tre) står i
// hjørnefargene. Figuren ser langs +z, føttene står på y = 0.
//
// Kunstbriefen: Aleksandermosaikken. Kalkhvitt, sot, rød og gul oker, umbra, blod.
// Ingen blå farge noe sted.

export const PAL = {
    kalk: '#efe3c8',
    sot: '#1c1714',
    rod: '#a4402a',
    gul: '#d9a441',
    umbra: '#6b4a2c',
    blod: '#8e1c14',
    sand: '#cdb68a',
};

const WHITE = '#ffffff';
const SKIN = '#b07b52';
const LEATHER = '#3a2a1e';
const WOOD = '#6a4a2c';
const METAL = '#e6d6b0';

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r: number, ws = 8, hs = 6) => new THREE.SphereGeometry(r, ws, hs);

/** Kropp og kappe (fargelegges med hærens farge). */
function clothParts(): Part[] {
    return [
        { geometry: box(0.3, 0.3, 0.19), position: [0, 0.56, 0], color: WHITE },
        { geometry: cyl(0.15, 0.22, 0.17, 8), position: [0, 0.36, 0], color: WHITE },
        // Kappa (chlamys) som henger bak.
        { geometry: box(0.32, 0.38, 0.04), position: [0, 0.5, -0.12], rotation: [0.12, 0, 0], color: '#e8e0d0' },
        // Beltet
        { geometry: box(0.31, 0.04, 0.2), position: [0, 0.43, 0], color: '#5a4030' },
    ];
}

/** Hud, armer, bein og sandaler (faste farger). */
function gearParts(): Part[] {
    return [
        { geometry: box(0.09, 0.3, 0.1), position: [-0.065, 0.17, 0], color: SKIN },
        { geometry: box(0.09, 0.3, 0.1), position: [0.065, 0.17, 0], color: SKIN },
        { geometry: box(0.1, 0.05, 0.15), position: [-0.065, 0.025, 0.02], color: LEATHER },
        { geometry: box(0.1, 0.05, 0.15), position: [0.065, 0.025, 0.02], color: LEATHER },
        { geometry: box(0.08, 0.3, 0.08), position: [-0.2, 0.55, 0.03], rotation: [0.3, 0, 0.1], color: SKIN },
        { geometry: box(0.08, 0.3, 0.08), position: [0.2, 0.55, 0.05], rotation: [-0.5, 0, -0.1], color: SKIN },
        { geometry: sph(0.1, 8, 6), position: [0, 0.82, 0], color: SKIN },
        { geometry: box(0.07, 0.07, 0.07), position: [0, 0.7, 0], color: SKIN },
    ];
}

/** Hjelm eller lue (fargelegges: bronse, kalk-lue, umbra-skinnlue, turban). */
function helmParts(): Part[] {
    return [
        {
            geometry: new THREE.SphereGeometry(0.118, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55),
            position: [0, 0.84, 0],
            color: WHITE,
        },
        { geometry: cyl(0.125, 0.125, 0.03, 8), position: [0, 0.83, 0], color: WHITE },
        { geometry: box(0.03, 0.08, 0.03), position: [0, 0.79, 0.11], color: WHITE },
    ];
}

/** Hjelmbusk (hærførere og stjerne-enheter). */
function crestParts(): Part[] {
    return [
        { geometry: box(0.04, 0.12, 0.3), position: [0, 0.99, -0.02], color: WHITE },
        { geometry: box(0.04, 0.24, 0.07), position: [0, 0.88, -0.2], rotation: [0.3, 0, 0], color: WHITE },
    ];
}

/** Rundskjold (aspis): fargelegges; kanten og bulen er mørkere. */
function shieldParts(): Part[] {
    return [
        { geometry: cyl(0.25, 0.25, 0.045, 12), rotation: [Math.PI / 2, 0, 0], color: WHITE },
        {
            geometry: new THREE.TorusGeometry(0.25, 0.028, 4, 12),
            color: '#8a6a40',
        },
        { geometry: sph(0.065, 6, 4), position: [0, 0, 0.03], color: '#f4ead2' },
        // Stjerna fra Vergina, grovt: fire stråler
        { geometry: box(0.3, 0.025, 0.01), position: [0, 0, 0.026], color: '#7a5a30' },
        { geometry: box(0.025, 0.3, 0.01), position: [0, 0, 0.026], color: '#7a5a30' },
    ];
}

/** Spyd: skaftet går fra z = -0.3 til z = 0.7 (grepet i origo), skaleres i lengden. */
function spearParts(): Part[] {
    return [
        { geometry: box(0.028, 0.028, 1), position: [0, 0, 0.2], color: WOOD },
        { geometry: new THREE.ConeGeometry(0.03, 0.08, 4), position: [0, 0, 0.73], rotation: [Math.PI / 2, 0, 0], color: METAL },
        { geometry: box(0.035, 0.035, 0.04), position: [0, 0, -0.3], color: METAL },
    ];
}

function bowParts(): Part[] {
    return [
        {
            geometry: new THREE.TorusGeometry(0.26, 0.018, 3, 10, Math.PI),
            rotation: [0, Math.PI / 2, Math.PI / 2],
            color: '#4a3020',
        },
        { geometry: box(0.008, 0.52, 0.008), position: [0, 0, -0.02], color: '#e8dcc0' },
    ];
}

/** Hest (pelsen fargelegges). */
function horseParts(): Part[] {
    const mane = '#2a1f18';
    const hoof = '#1c1714';
    const p: Part[] = [
        { geometry: box(0.3, 0.32, 0.8), position: [0, 0.68, 0], color: WHITE },
        { geometry: box(0.28, 0.3, 0.2), position: [0, 0.72, 0.36], color: WHITE },
        { geometry: box(0.19, 0.44, 0.22), position: [0, 0.94, 0.42], rotation: [-0.55, 0, 0], color: WHITE },
        { geometry: box(0.16, 0.16, 0.36), position: [0, 1.12, 0.62], rotation: [0.55, 0, 0], color: WHITE },
        { geometry: box(0.05, 0.36, 0.12), position: [0, 1.0, 0.33], rotation: [-0.55, 0, 0], color: mane },
        { geometry: box(0.06, 0.08, 0.06), position: [-0.05, 1.24, 0.52], color: mane },
        { geometry: box(0.06, 0.08, 0.06), position: [0.05, 1.24, 0.52], color: mane },
        { geometry: box(0.07, 0.36, 0.07), position: [0, 0.64, -0.46], rotation: [0.45, 0, 0], color: mane },
        // Sadelteppe
        { geometry: box(0.34, 0.06, 0.36), position: [0, 0.85, -0.04], color: '#e6d8b8' },
    ];
    for (const [x, z] of [
        [-0.1, 0.3],
        [0.1, 0.3],
        [-0.1, -0.3],
        [0.1, -0.3],
    ]) {
        p.push({ geometry: box(0.08, 0.5, 0.09), position: [x, 0.27, z], color: WHITE });
        p.push({ geometry: box(0.09, 0.06, 0.1), position: [x, 0.03, z], color: hoof });
    }
    return p;
}

/** Ljåvogn: kassen fargelegges, hjul og ljåer har faste farger. */
function chariotParts(): Part[] {
    const wheel = '#3b2a1c';
    const p: Part[] = [
        { geometry: box(0.66, 0.1, 0.52), position: [0, 0.42, 0], color: WOOD },
        { geometry: box(0.66, 0.36, 0.06), position: [0, 0.64, 0.24], color: WHITE },
        { geometry: box(0.06, 0.3, 0.46), position: [-0.31, 0.6, 0.02], color: WHITE },
        { geometry: box(0.06, 0.3, 0.46), position: [0.31, 0.6, 0.02], color: WHITE },
        { geometry: box(0.05, 0.05, 1.0), position: [0, 0.42, 0.72], color: WOOD },
        { geometry: box(0.9, 0.04, 0.04), position: [0, 0.5, 1.12], color: WOOD },
    ];
    for (const s of [-1, 1]) {
        p.push({ geometry: cyl(0.32, 0.32, 0.06, 10), position: [s * 0.4, 0.32, 0], rotation: [0, 0, Math.PI / 2], color: wheel });
        p.push({ geometry: cyl(0.07, 0.07, 0.1, 6), position: [s * 0.45, 0.32, 0], rotation: [0, 0, Math.PI / 2], color: METAL });
        // Ljåene som stikker ut fra navet
        p.push({ geometry: box(0.55, 0.025, 0.07), position: [s * 0.74, 0.32, 0], color: METAL });
        p.push({ geometry: box(0.3, 0.025, 0.05), position: [s * 0.95, 0.32, 0.08], rotation: [0, s * 0.6, 0], color: METAL });
    }
    return p;
}

function elephantParts(): Part[] {
    const hide = '#a39584';
    const dark = '#85786a';
    const p: Part[] = [
        { geometry: sph(0.5, 10, 8), position: [0, 1.08, 0], scale: [1, 0.95, 1.45], color: hide },
        { geometry: sph(0.36, 8, 6), position: [0, 1.3, 0.74], color: hide },
        { geometry: box(0.08, 0.46, 0.36), position: [-0.36, 1.28, 0.62], rotation: [0, -0.45, 0], color: dark },
        { geometry: box(0.08, 0.46, 0.36), position: [0.36, 1.28, 0.62], rotation: [0, 0.45, 0], color: dark },
        { geometry: cyl(0.07, 0.13, 0.8, 6), position: [0, 0.88, 1.02], rotation: [0.28, 0, 0], color: hide },
        { geometry: new THREE.ConeGeometry(0.05, 0.5, 5), position: [-0.15, 1.0, 1.08], rotation: [Math.PI / 2 - 0.55, 0, 0], color: '#f2e8d0' },
        { geometry: new THREE.ConeGeometry(0.05, 0.5, 5), position: [0.15, 1.0, 1.08], rotation: [Math.PI / 2 - 0.55, 0, 0], color: '#f2e8d0' },
        { geometry: box(0.05, 0.3, 0.05), position: [0, 0.9, -0.72], rotation: [0.3, 0, 0], color: dark },
        // Teppet under tårnet
        { geometry: box(0.9, 0.08, 0.9), position: [0, 1.52, -0.05], color: '#a4402a' },
    ];
    for (const [x, z] of [
        [-0.27, 0.42],
        [0.27, 0.42],
        [-0.27, -0.42],
        [0.27, -0.42],
    ])
        p.push({ geometry: cyl(0.15, 0.14, 0.74, 7), position: [x, 0.37, z], color: hide });
    return p;
}

function towerParts(): Part[] {
    const p: Part[] = [{ geometry: box(0.64, 0.34, 0.64), position: [0, 1.73, -0.08], color: WHITE }];
    for (const [x, z] of [
        [-0.26, 0.2],
        [0.26, 0.2],
        [-0.26, -0.36],
        [0.26, -0.36],
    ])
        p.push({ geometry: box(0.12, 0.14, 0.12), position: [x, 1.96, z], color: WHITE });
    return p;
}

/** Fanen: stang og duk (fargelegges). */
function standardParts(): Part[] {
    return [
        { geometry: box(0.04, 2.3, 0.04), position: [0, 1.15, 0], color: WOOD },
        { geometry: box(0.6, 0.03, 0.03), position: [0, 2.2, 0], color: WOOD },
        { geometry: box(0.56, 0.5, 0.02), position: [0, 1.94, 0.02], color: WHITE },
        { geometry: sph(0.07, 6, 4), position: [0, 2.32, 0], color: '#f2d690' },
    ];
}

function arrowParts(): Part[] {
    return [
        { geometry: box(0.02, 0.02, 0.56), color: '#3a2a1e' },
        { geometry: new THREE.ConeGeometry(0.03, 0.08, 4), position: [0, 0, 0.3], rotation: [Math.PI / 2, 0, 0], color: '#2a221c' },
        { geometry: box(0.07, 0.005, 0.1), position: [0, 0, -0.24], color: '#efe3c8' },
        { geometry: box(0.005, 0.07, 0.1), position: [0, 0, -0.24], color: '#efe3c8' },
    ];
}

/** En uregelmessig flekk som ligger flatt på bakken. */
function splatGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const n = 14;
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = 0.5 * (0.65 + 0.35 * Math.abs(Math.sin(i * 2.7 + 1.3)) + (i % 3 === 0 ? 0.25 : 0));
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
}

export interface Geos {
    cloth: THREE.BufferGeometry;
    gear: THREE.BufferGeometry;
    helm: THREE.BufferGeometry;
    crest: THREE.BufferGeometry;
    shield: THREE.BufferGeometry;
    spear: THREE.BufferGeometry;
    bow: THREE.BufferGeometry;
    horse: THREE.BufferGeometry;
    chariot: THREE.BufferGeometry;
    elephant: THREE.BufferGeometry;
    tower: THREE.BufferGeometry;
    standard: THREE.BufferGeometry;
    arrow: THREE.BufferGeometry;
    splat: THREE.BufferGeometry;
    blob: THREE.BufferGeometry;
    quad: THREE.BufferGeometry;
}

let cached: Geos | null = null;

export function geos(): Geos {
    if (cached) return cached;
    const blob = new THREE.CircleGeometry(0.5, 12);
    blob.rotateX(-Math.PI / 2);
    cached = {
        cloth: mergeParts(clothParts()),
        gear: mergeParts(gearParts()),
        helm: mergeParts(helmParts()),
        crest: mergeParts(crestParts()),
        shield: mergeParts(shieldParts()),
        spear: mergeParts(spearParts()),
        bow: mergeParts(bowParts()),
        horse: mergeParts(horseParts()),
        chariot: mergeParts(chariotParts()),
        elephant: mergeParts(elephantParts()),
        tower: mergeParts(towerParts()),
        standard: mergeParts(standardParts()),
        arrow: mergeParts(arrowParts()),
        splat: splatGeometry(),
        blob,
        quad: new THREE.PlaneGeometry(1, 1),
    };
    return cached;
}

// ---------------------------------------------------------------------------
// Teksturer tegnet i canvas ved oppstart
// ---------------------------------------------------------------------------

function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Tessera-bakken: små steiner i okertoner med mørke fuger. Synes bare når kameraet
 * dykker ned - på avstand blander mipmappene dem til en varm, støvete slette.
 */
export function tesseraTexture(tones: string[], grout: string, seed = 7): THREE.CanvasTexture {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, S, S);
    const r = rng(seed);
    const step = 16;
    // Rader med lett forskjøvne steiner, som i en ekte mosaikk (opus tessellatum).
    for (let y = 0; y < S; y += step) {
        const off = (y / step) % 2 ? step * 0.5 : 0;
        for (let x = -step; x < S + step; x += step) {
            const w = step - 2.2 - r() * 1.6;
            const h = step - 2.2 - r() * 1.6;
            ctx.fillStyle = tones[Math.floor(r() * tones.length)];
            const px = x + off + (r() - 0.5) * 1.6;
            const py = y + (r() - 0.5) * 1.6;
            ctx.beginPath();
            ctx.moveTo(px + r() * 1.5, py + r() * 1.5);
            ctx.lineTo(px + w - r() * 1.5, py + r() * 1.5);
            ctx.lineTo(px + w - r() * 1.5, py + h - r() * 1.5);
            ctx.lineTo(px + r() * 1.5, py + h - r() * 1.5);
            ctx.closePath();
            ctx.fill();
            // Et lite lys på steinen
            ctx.fillStyle = 'rgba(255,245,220,0.07)';
            ctx.fillRect(px + 1.5, py + 1.5, w * 0.45, 2);
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}
