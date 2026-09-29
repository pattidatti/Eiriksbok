import * as THREE from 'three';
import { mergeParts, type Part } from '../kit';

// Knarren - geometri bygd én gang ved oppstart. Ingen modellfiler: skroget lages
// av bordganger som legges over hverandre som takstein (klinkbygging), akkurat
// slik artikkelen om skipsteknologi forklarer.
//
// Skipets eget koordinatsystem: baugen peker mot -z, styrbord er +x, y = 0 er
// vannlinja. Lengde ca. 16,5 m, bredde 4,6 m.

export const HALF_L = 8.25;
const STRAKES = 8;
const STATIONS = 44;

const halfBeam = (u: number) => 2.3 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.2)), 0.55);
const keelY = (u: number) => -1.05 + 0.55 * Math.pow(u, 4);
export const sheerY = (u: number) => 0.95 + 1.0 * Math.pow(u, 4);

function section(u: number, v: number): [number, number] {
    const phi = (v * Math.PI) / 2;
    const x = halfBeam(u) * Math.pow(Math.sin(phi), 0.75);
    const y = keelY(u) + (sheerY(u) - keelY(u)) * Math.pow(1 - Math.cos(phi), 0.85);
    return [x, y];
}

/** Hvor bred skipet er (halvparten) ved lengdeposisjon z. */
export function beamAt(z: number) {
    return halfBeam(z / HALF_L);
}

/** Skroget: bordgang for bordgang, begge sider, med vertex-farger. */
export function hullGeometry(): THREE.BufferGeometry {
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const c = new THREE.Color();
    const tar = new THREE.Color('#4d3726');
    const wale = new THREE.Color('#94502c');
    for (const side of [1, -1]) {
        for (let j = 0; j < STRAKES; j++) {
            const v0 = j / STRAKES;
            const v1 = Math.min(1, (j + 1) / STRAKES + 0.025);
            const rows = 3;
            const base = pos.length / 3;
            for (let s = 0; s <= STATIONS; s++) {
                const u = -0.995 + (1.99 * s) / STATIONS;
                for (let r = 0; r < rows; r++) {
                    const k = r / (rows - 1);
                    const v = v0 + (v1 - v0) * k;
                    const [x, y] = section(u, v);
                    const [x2, y2] = section(u, Math.min(1, v + 0.01));
                    let nx = y2 - y;
                    let ny = -(x2 - x);
                    const nl = Math.hypot(nx, ny) || 1;
                    nx /= nl;
                    ny /= nl;
                    // Klinken: hver bordgang står litt utenpå den under.
                    const lap = 0.045 * k;
                    pos.push((x + nx * lap) * side, y + ny * lap, u * HALF_L);
                    const shade =
                        0.82 + 0.18 * k + (j % 2) * 0.05 + Math.sin(u * 37 + j * 3) * 0.03;
                    c.copy(j === STRAKES - 1 ? wale : tar).multiplyScalar(shade);
                    col.push(c.r, c.g, c.b);
                }
            }
            for (let s = 0; s < STATIONS; s++)
                for (let r = 0; r < rows - 1; r++) {
                    const a = base + s * rows + r;
                    const b = a + rows;
                    if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
                    else idx.push(a, a + 1, b, b, a + 1, b + 1);
                }
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

function post(bow: boolean): THREE.BufferGeometry {
    const s = bow ? -1 : 1;
    const pts = [
        new THREE.Vector3(0, keelY(1) + 0.05, s * (HALF_L - 0.6)),
        new THREE.Vector3(0, 0.6, s * (HALF_L + 0.15)),
        new THREE.Vector3(0, sheerY(1) + 0.2, s * (HALF_L + 0.45)),
        new THREE.Vector3(0, sheerY(1) + 1.05, s * (HALF_L + 0.5)),
        new THREE.Vector3(0, sheerY(1) + 1.55, s * (HALF_L + 0.15)),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 6, false);
}

/** Stavner, kjøl, dekk, mast, rå og last - alt som står stille, som én geometri. */
export function fittingsGeometry(): THREE.BufferGeometry {
    const wood = '#5b4330';
    const dark = '#2b2018';
    const plank = '#8a6a48';
    const parts: Part[] = [
        { geometry: post(true), color: dark },
        { geometry: post(false), color: dark },
        {
            geometry: new THREE.BoxGeometry(0.22, 0.3, HALF_L * 1.8),
            position: [0, -1.02, 0],
            color: dark,
        },
        // Halvdekk forut og akter - midtskips er rommet åpent.
        {
            geometry: new THREE.BoxGeometry(3.3, 0.08, 3.2),
            position: [0, 0.62, -5.2],
            color: plank,
        },
        { geometry: new THREE.BoxGeometry(3.2, 0.08, 3.0), position: [0, 0.62, 5.1], color: plank },
        {
            geometry: new THREE.BoxGeometry(4.1, 0.06, 4.8),
            position: [0, -0.35, 0.6],
            color: '#4a3726',
        },
        // Tofter (tverrbjelker).
        ...[-2.6, 0, 2.6].map((z): Part => ({
            geometry: new THREE.BoxGeometry(4.3, 0.12, 0.22),
            position: [0, 0.72, z],
            color: wood,
        })),
        // Mastefisken og masta.
        { geometry: new THREE.BoxGeometry(0.5, 0.3, 2.6), position: [0, 0.82, -0.6], color: wood },
        {
            geometry: new THREE.CylinderGeometry(0.13, 0.19, 11.5, 8),
            position: [0, 5.6, -0.6],
            color: '#6b4f35',
        },
        // Rå (yard) på tvers.
        {
            geometry: new THREE.CylinderGeometry(0.09, 0.09, 9.6, 6),
            position: [0, 10.2, -0.75],
            rotation: [0, 0, Math.PI / 2],
            color: '#6b4f35',
        },
        // Last: tønner, kister og sekker.
        ...[
            [-1.2, 1.8],
            [-0.5, 2.3],
            [1.1, 2.0],
            [0.7, -2.2],
            [-1.3, -2.4],
        ].map(([x, z]): Part => ({
            geometry: new THREE.CylinderGeometry(0.34, 0.3, 0.8, 10),
            position: [x, 0.05, z],
            color: '#6d4c2e',
        })),
        {
            geometry: new THREE.BoxGeometry(0.9, 0.55, 0.6),
            position: [1.3, 0.0, -1.5],
            color: '#5a3a24',
        },
        {
            geometry: new THREE.BoxGeometry(0.8, 0.5, 0.55),
            position: [-1.4, -0.02, 3.6],
            color: '#4e3321',
        },
        {
            geometry: new THREE.SphereGeometry(0.45, 8, 6),
            position: [0.2, -0.05, 3.3],
            scale: [1.2, 0.7, 1],
            color: '#b59a6c',
        },
        {
            geometry: new THREE.SphereGeometry(0.4, 8, 6),
            position: [-0.6, -0.05, -3.0],
            scale: [1.2, 0.7, 1],
            color: '#a88d61',
        },
    ];
    return mergeParts(parts);
}

function person(tunic: string, hood: string, sit = false): THREE.BufferGeometry {
    const h = sit ? 0.75 : 1;
    return mergeParts([
        {
            geometry: new THREE.CylinderGeometry(0.2, 0.3, 1.0 * h, 8),
            position: [0, 0.5 * h, 0],
            color: tunic,
        },
        {
            geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.55, 5),
            position: [0.14, 0.12, 0],
            color: '#3a3128',
        },
        {
            geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.55, 5),
            position: [-0.14, 0.12, 0],
            color: '#3a3128',
        },
        {
            geometry: new THREE.SphereGeometry(0.17, 10, 8),
            position: [0, 1.12 * h, 0],
            color: '#d9b08c',
        },
        {
            geometry: new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
            position: [0, 1.16 * h, 0.02],
            color: hood,
        },
        {
            geometry: new THREE.SphereGeometry(0.12, 8, 6),
            position: [0, 1.02 * h, -0.12],
            scale: [1, 0.8, 0.7],
            color: '#8a6040',
        },
        {
            geometry: new THREE.CylinderGeometry(0.07, 0.07, 0.6, 5),
            position: [0.26, 0.72 * h, -0.18],
            rotation: [0.9, 0, 0.2],
            color: tunic,
        },
        {
            geometry: new THREE.CylinderGeometry(0.07, 0.07, 0.6, 5),
            position: [-0.26, 0.72 * h, -0.18],
            rotation: [0.9, 0, -0.2],
            color: tunic,
        },
    ]);
}

export const CREW = {
    styrmann: () => person('#7b2a1f', '#3c4a3a'),
    utkikk: () => person('#35506b', '#6a5438'),
    oser: () => person('#6a6d3a', '#57412c'),
    sitter1: () => person('#8b6b3e', '#2f3e52', true),
    sitter2: () => person('#4a5d4a', '#7b2a1f', true),
};

export function cowGeometry(): THREE.BufferGeometry {
    const hide = '#6b3e24';
    const white = '#e8dfcf';
    return mergeParts([
        { geometry: new THREE.BoxGeometry(0.7, 0.62, 1.45), position: [0, 0.95, 0], color: hide },
        {
            geometry: new THREE.BoxGeometry(0.72, 0.3, 0.6),
            position: [0, 0.85, 0.25],
            color: white,
        },
        {
            geometry: new THREE.BoxGeometry(0.36, 0.38, 0.5),
            position: [0, 1.15, -0.9],
            rotation: [0.35, 0, 0],
            color: hide,
        },
        {
            geometry: new THREE.BoxGeometry(0.3, 0.2, 0.2),
            position: [0, 1.02, -1.12],
            color: '#d8b8a0',
        },
        {
            geometry: new THREE.ConeGeometry(0.05, 0.22, 5),
            position: [0.17, 1.4, -0.85],
            rotation: [0, 0, -0.6],
            color: white,
        },
        {
            geometry: new THREE.ConeGeometry(0.05, 0.22, 5),
            position: [-0.17, 1.4, -0.85],
            rotation: [0, 0, 0.6],
            color: white,
        },
        ...[
            [0.24, 0.52],
            [-0.24, 0.52],
            [0.24, -0.52],
            [-0.24, -0.52],
        ].map(([x, z]): Part => ({
            geometry: new THREE.BoxGeometry(0.14, 0.7, 0.14),
            position: [x, 0.35, z],
            color: hide,
        })),
        {
            geometry: new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4),
            position: [0, 0.8, 0.8],
            rotation: [0.5, 0, 0],
            color: hide,
        },
    ]);
}

export function sheepGeometry(): THREE.BufferGeometry {
    return mergeParts([
        {
            geometry: new THREE.SphereGeometry(0.42, 10, 8),
            position: [0, 0.62, 0],
            scale: [0.85, 0.8, 1.2],
            color: '#e9e4d8',
        },
        {
            geometry: new THREE.SphereGeometry(0.16, 8, 6),
            position: [0, 0.75, -0.52],
            scale: [0.8, 1, 1.3],
            color: '#2c2621',
        },
        ...[
            [0.16, 0.25],
            [-0.16, 0.25],
            [0.16, -0.25],
            [-0.16, -0.25],
        ].map(([x, z]): Part => ({
            geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4),
            position: [x, 0.2, z],
            color: '#2c2621',
        })),
    ]);
}

/** Styreåra: festet på styrbord side akter (derav «styrbord»). */
export function rudderGeometry(): THREE.BufferGeometry {
    return mergeParts([
        {
            geometry: new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6),
            position: [0, 0, 0],
            color: '#5b4330',
        },
        {
            geometry: new THREE.BoxGeometry(0.12, 1.9, 0.62),
            position: [0, -1.9, 0.15],
            color: '#4a3726',
        },
        {
            geometry: new THREE.BoxGeometry(0.08, 0.08, 1.3),
            position: [0, 1.55, -0.6],
            color: '#3a2a1c',
        },
    ]);
}

/** Vindfløyen på mastetoppen (forgylt, som Heggen-fløyen). */
export function vaneGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.9, 0.05);
    shape.quadraticCurveTo(1.05, 0.35, 0.8, 0.62);
    shape.lineTo(0, 0.62);
    shape.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
    g.translate(0, 0, -0.015);
    return mergeParts([
        { geometry: g, rotation: [0, Math.PI / 2, 0], position: [0, 0, 0], color: '#d9a73a' },
        {
            geometry: new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4),
            position: [0, 0.3, 0],
            color: '#b58a2a',
        },
    ]);
}

/**
 * Seilet: vadmål i røde og kremhvite striper (vevd ull, sydd sammen av smale
 * render). Tegnet i canvas ved oppstart.
 */
export function sailTexture(): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    const ctx = cv.getContext('2d')!;
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#a3321f' : '#e7dcc2';
        ctx.fillRect((i * cv.width) / stripes, 0, cv.width / stripes + 1, cv.height);
    }
    // Vevstruktur og smuss.
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    for (let y = 0; y < cv.height; y++)
        for (let x = 0; x < cv.width; x++) {
            const k = (y * cv.width + x) * 4;
            const weave = ((x + y) % 4 < 2 ? 1 : 0.94) * (0.93 + Math.random() * 0.07);
            const dirt = 1 - (y / cv.height) * 0.12;
            img.data[k] *= weave * dirt;
            img.data[k + 1] *= weave * dirt;
            img.data[k + 2] *= weave * dirt;
        }
    ctx.putImageData(img, 0, 0);
    // Sømmer mellom rendene og en forsterket kant.
    ctx.strokeStyle = 'rgba(40,24,14,.35)';
    ctx.lineWidth = 2;
    for (let y = 64; y < cv.height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cv.width, y);
        ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, cv.width, cv.height);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

/** Rund, myk dråpe til sprut-partiklene (ellers tegnes de som firkanter). */
export function dropTexture(): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const ctx = cv.getContext('2d')!;
    const gr = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.8)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(cv);
}
