// Firbeinte dyr som modell: grisen og hunden, laget i kode og animert i vertex-shaderen (ingen
// skjelett, ingen klipp), i samme teknikk som rotta og katta (rotte-modell.ts, katt-modell.ts), men
// enklere: kroppen og hodet er loftede tverrsnitt, beina er rør som svinger om hofta, og ørene og
// halen følger hodet og rumpa.
//
// Hvert hjørnepunkt vet hvilken del det hører til (`aDel`) og hvilket ledd delen svinger om (`aPiv`).
// Hvert dyr sender gangfase, fart, hvor langt ned hodet er (grisen roter i gjørma, hunden snuser),
// om det ligger, tida, logring, hvor hodet er dreid og en skala (`iA`, `iB`). Alle dyr av ett slag er
// én InstancedMesh: ett tegnekall, og ett til i skyggen.
//
// Grisene i middelalderen var trolig mindre, mer langbeinte og mørkere i bustene enn griser i dag,
// mer lik villsvin [K: ikke sjekket mot beinfunnene fra Bryggen]. Hunden er en middels stor,
// spisshåret hund med opprette ører og krøllhale [S]; hvilke hunder som fantes i Bergen i 1420-årene,
// er ikke funnet [K].
import * as THREE from 'three';

export type Art = 'gris' | 'hund';

const KROPP = 0;
const HODE = 1;
const BEN = 2;
const HALE = 3;

interface Mal {
    /** Beinlengde (hofte til bakken). */
    ben: number;
    /** Hofta foran og bak (z) og hvor bredt beina står (x). */
    hofteZ: [number, number];
    hofteX: number;
    benR: [number, number];
    kropp: [number, number, number, number][];
    hode: [number, number, number, number][];
    nakke: THREE.Vector3;
    hale: [THREE.Vector3, THREE.Vector3, number];
    orer: { p: THREE.Vector3; h: number; r: number; tilt: number }[];
    farge: { kropp: number; snute: number; klov: number; mork: number };
}

// Mål i meter. Tverrsnitt: z, halv bredde, halv høyde, senter y.
const MAL: Record<Art, Mal> = {
    gris: {
        ben: 0.3,
        hofteZ: [0.27, -0.27],
        hofteX: 0.12,
        benR: [0.065, 0.04],
        kropp: [
            [-0.46, 0.07, 0.08, 0.5],
            [-0.4, 0.2, 0.21, 0.5],
            [-0.22, 0.26, 0.27, 0.51],
            [0.05, 0.26, 0.28, 0.52],
            [0.26, 0.23, 0.25, 0.53],
            [0.38, 0.16, 0.18, 0.54],
        ],
        hode: [
            [0.34, 0.15, 0.17, 0.54],
            [0.47, 0.13, 0.14, 0.51],
            [0.6, 0.085, 0.09, 0.46],
            [0.7, 0.06, 0.06, 0.43],
            [0.72, 0.05, 0.045, 0.43],
        ],
        nakke: new THREE.Vector3(0, 0.56, 0.34),
        hale: [new THREE.Vector3(0, 0.6, -0.46), new THREE.Vector3(0, 0.5, -0.53), 0.02],
        orer: [
            { p: new THREE.Vector3(0.08, 0.64, 0.44), h: 0.11, r: 0.05, tilt: 1.0 },
            { p: new THREE.Vector3(-0.08, 0.64, 0.44), h: 0.11, r: 0.05, tilt: 1.0 },
        ],
        farge: { kropp: 0x6e5a4c, snute: 0x9a7466, klov: 0x2a2420, mork: 0x1a1614 },
    },
    hund: {
        ben: 0.36,
        hofteZ: [0.21, -0.22],
        hofteX: 0.08,
        benR: [0.045, 0.03],
        kropp: [
            [-0.33, 0.06, 0.07, 0.5],
            [-0.28, 0.13, 0.14, 0.5],
            [-0.1, 0.14, 0.15, 0.51],
            [0.12, 0.155, 0.18, 0.54],
            [0.26, 0.13, 0.16, 0.6],
            [0.34, 0.09, 0.11, 0.66],
        ],
        hode: [
            [0.3, 0.09, 0.1, 0.7],
            [0.38, 0.1, 0.1, 0.72],
            [0.46, 0.075, 0.07, 0.69],
            [0.55, 0.045, 0.042, 0.67],
            [0.575, 0.03, 0.028, 0.67],
        ],
        nakke: new THREE.Vector3(0, 0.66, 0.3),
        hale: [new THREE.Vector3(0, 0.58, -0.32), new THREE.Vector3(0, 0.76, -0.4), 0.03],
        orer: [
            { p: new THREE.Vector3(0.05, 0.79, 0.37), h: 0.065, r: 0.03, tilt: -0.15 },
            { p: new THREE.Vector3(-0.05, 0.79, 0.37), h: 0.065, r: 0.03, tilt: -0.15 },
        ],
        farge: { kropp: 0xa58a6a, snute: 0x6a5440, klov: 0x3a2e24, mork: 0x141210 },
    },
};

interface Bygger {
    pos: number[];
    col: number[];
    del: number[];
    piv: number[];
    idx: number[];
}

function hjorne(b: Bygger, p: THREE.Vector3, c: THREE.Color, del: [number, number, number], piv: THREE.Vector3): number {
    b.pos.push(p.x, p.y, p.z);
    b.col.push(c.r, c.g, c.b);
    b.del.push(...del);
    b.piv.push(piv.x, piv.y, piv.z);
    return b.pos.length / 3 - 1;
}

/** Ringer av ellipser langs z, med lokk i begge ender. */
function loft(b: Bygger, st: [number, number, number, number][], farge: (i: number) => THREE.Color, del: [number, number, number], piv: THREE.Vector3): void {
    const seg = 9;
    const ringer: number[][] = st.map(([z, rx, ry, cy], i) => {
        const r: number[] = [];
        for (let k = 0; k < seg; k++) {
            const a = (k / seg) * Math.PI * 2;
            // Litt flatere buk enn rygg.
            const y = Math.sin(a) > 0 ? Math.sin(a) * ry : Math.sin(a) * ry * 0.85;
            r.push(hjorne(b, new THREE.Vector3(Math.cos(a) * rx, cy + y, z), farge(i), del, piv));
        }
        return r;
    });
    for (let i = 0; i < ringer.length - 1; i++) {
        for (let k = 0; k < seg; k++) {
            const a = ringer[i][k];
            const bb = ringer[i][(k + 1) % seg];
            const c = ringer[i + 1][k];
            const d = ringer[i + 1][(k + 1) % seg];
            b.idx.push(a, c, bb, bb, c, d);
        }
    }
    for (const [ri, ut] of [[0, -1], [ringer.length - 1, 1]] as const) {
        const [z, , , cy] = st[ri];
        const m = hjorne(b, new THREE.Vector3(0, cy, z + ut * 0.01), farge(ri), del, piv);
        for (let k = 0; k < seg; k++) {
            const a = ringer[ri][k];
            const bb = ringer[ri][(k + 1) % seg];
            if (ut < 0) b.idx.push(m, bb, a);
            else b.idx.push(m, a, bb);
        }
    }
}

/** Et rør fra `a` til `b`, smalere mot `b`, med lokk. */
function ror(b: Bygger, a: THREE.Vector3, e: THREE.Vector3, r0: number, r1: number, c0: THREE.Color, c1: THREE.Color, del: [number, number, number], piv: THREE.Vector3): void {
    const seg = 8;
    const dir = new THREE.Vector3().subVectors(e, a).normalize();
    const u = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const s1 = new THREE.Vector3().crossVectors(dir, u).normalize();
    const s2 = new THREE.Vector3().crossVectors(dir, s1).normalize();
    const ring = (p: THREE.Vector3, r: number, c: THREE.Color) => {
        const ut: number[] = [];
        for (let k = 0; k < seg; k++) {
            const t = (k / seg) * Math.PI * 2;
            ut.push(hjorne(b, p.clone().addScaledVector(s1, Math.cos(t) * r).addScaledVector(s2, Math.sin(t) * r), c, del, piv));
        }
        return ut;
    };
    const ra = ring(a, r0, c0);
    const rb = ring(e, r1, c1);
    for (let k = 0; k < seg; k++) {
        const n = (k + 1) % seg;
        b.idx.push(ra[k], rb[k], ra[n], ra[n], rb[k], rb[n]);
    }
    const m = hjorne(b, e.clone().addScaledVector(dir, r1 * 0.5), c1, del, piv);
    for (let k = 0; k < seg; k++) b.idx.push(rb[k], m, rb[(k + 1) % seg]);
}

/** Øre: en flat kjegle som står ut fra hodet. */
function ore(b: Bygger, o: Mal['orer'][number], c: THREE.Color, piv: THREE.Vector3): void {
    const side = Math.sign(o.p.x);
    const topp = o.p.clone().add(new THREE.Vector3(side * o.h * 0.35, o.h * Math.cos(o.tilt), o.h * Math.sin(o.tilt)));
    const a = o.p.clone().add(new THREE.Vector3(o.r, 0, -o.r * 0.3));
    const e = o.p.clone().add(new THREE.Vector3(-o.r, 0, -o.r * 0.3));
    const f = o.p.clone().add(new THREE.Vector3(0, 0, o.r * 0.5));
    const del: [number, number, number] = [HODE, 0, 0];
    const ia = hjorne(b, a, c, del, piv);
    const ie = hjorne(b, e, c, del, piv);
    const iff = hjorne(b, f, c, del, piv);
    const it = hjorne(b, topp, c, del, piv);
    b.idx.push(ia, ie, it, ie, iff, it, iff, ia, it, it, ie, ia);
}

/** Geometrien til ett dyr (i dyrets rom: z fram, y opp, føttene i y = 0). */
export function lagDyrGeometri(art: Art): THREE.BufferGeometry {
    const m = MAL[art];
    const b: Bygger = { pos: [], col: [], del: [], piv: [], idx: [] };
    const C = (h: number) => new THREE.Color(h);
    const kropp = C(m.farge.kropp);
    const lys = kropp.clone().multiplyScalar(1.12);
    const snute = C(m.farge.snute);
    const klov = C(m.farge.klov);
    const mork = C(m.farge.mork);
    const null3 = new THREE.Vector3();
    loft(b, m.kropp, (i) => (i === 0 || i === m.kropp.length - 1 ? kropp : i % 2 ? lys : kropp), [KROPP, 0, 0], null3);
    loft(b, m.hode, (i) => (i >= m.hode.length - 2 ? snute : kropp), [HODE, 0, 0], m.nakke);
    // Øynene og nesa: små mørke rør på hodet.
    const nese = m.hode[m.hode.length - 1];
    ror(b, new THREE.Vector3(0, nese[3], nese[0] - 0.01), new THREE.Vector3(0, nese[3], nese[0] + 0.012), nese[1] * 0.9, nese[1] * 0.8, mork, mork, [HODE, 0, 0], m.nakke);
    const oy = m.hode[1];
    for (const s of [-1, 1]) {
        const p = new THREE.Vector3(s * oy[1] * 0.8, oy[3] + oy[2] * 0.35, oy[0] + 0.02);
        ror(b, p, p.clone().add(new THREE.Vector3(s * 0.012, 0, 0.004)), 0.011, 0.01, mork, mork, [HODE, 0, 0], m.nakke);
    }
    for (const o of m.orer) ore(b, o, kropp.clone().multiplyScalar(0.9), m.nakke);
    // Beina: hver svinger om hofta si. Foran og bak på samme side går i motsatt takt (trav).
    m.hofteZ.forEach((hz, fb) => {
        for (const s of [-1, 1]) {
            const hofte = new THREE.Vector3(s * m.hofteX, m.ben, hz);
            const fase = (s > 0 ? 0 : 0.5) + (fb === 0 ? 0 : 0.5);
            const kne = new THREE.Vector3(s * m.hofteX, m.ben * 0.45, hz + (fb === 0 ? 0.01 : -0.02));
            const fot = new THREE.Vector3(s * m.hofteX, 0.03, hz);
            ror(b, hofte.clone().setY(m.ben + 0.06), kne, m.benR[0], m.benR[1] * 1.1, kropp, kropp, [BEN, fase % 1, fb], hofte);
            ror(b, kne, fot, m.benR[1] * 1.1, m.benR[1], kropp, klov, [BEN, fase % 1, fb], hofte);
        }
    });
    const [h0, h1, hr] = m.hale;
    ror(b, h0, h1, hr, hr * 0.6, kropp, kropp, [HALE, 0, 0], h0);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    g.setAttribute('aDel', new THREE.Float32BufferAttribute(b.del, 3));
    g.setAttribute('aPiv', new THREE.Float32BufferAttribute(b.piv, 3));
    g.setIndex(b.idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
}

/** Felles for fargepasset og skyggepasset: delene beveges likt i begge. */
function glsl(art: Art): string {
    const m = MAL[art];
    return /* glsl */ `
attribute vec3 aDel; // del, gangfase-forskyvning (bein), foran 0 / bak 1 (bein)
attribute vec3 aPiv; // leddet delen svinger om
attribute vec4 iA;   // gangfase (0-1), fart (0-1, 1 = løp), hodet ned (0-1), ligger (0-1)
attribute vec4 iB;   // tid (s), logrer (0-1), hodet dreid (rad), skala
mat3 dRot;
const float TAU = 6.2831853;
mat3 rX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
vec3 dyr(vec3 p) {
    float del = aDel.x;
    float lop = iA.y;
    float ligg = iA.w;
    float tid = iB.x;
    vec3 q = p;
    dRot = mat3(1.0);
    if (del > 1.5 && del < 2.5) {
        // Beina: svinger om hofta i takt med gangen, foldes inn under kroppen når dyret ligger.
        float sving = sin((iA.x + aDel.y) * TAU) * (0.25 + 0.3 * lop) * min(1.0, lop * 3.0 + 0.0001);
        float fold = ligg * (aDel.z < 0.5 ? -1.45 : 1.35);
        mat3 R = rX(-sving + fold);
        q = aPiv + R * (p - aPiv);
        dRot = R;
    } else if (del > 0.5 && del < 1.5) {
        // Hodet: ned mot bakken (roter eller snuser), dreid, og noen små nikk mens det roter.
        float ned = iA.z;
        float pitch = ned * 0.85 + sin(tid * 9.0) * 0.07 * ned + ligg * 0.25;
        mat3 R = rY(iB.z) * rX(pitch);
        q = aPiv + R * (p - aPiv);
        dRot = R;
    } else if (del > 2.5) {
        // Halen: logrer fra side til side.
        float w = sin(tid * 15.0) * 0.7 * iB.y + sin(tid * 2.0) * 0.12;
        mat3 R = rY(w);
        q = aPiv + R * (p - aPiv);
        dRot = R;
    }
    // Kroppen: hopper litt i gangen, senkes når dyret legger seg, og puster.
    float bob = abs(sin(iA.x * TAU)) * 0.018 * lop;
    q.y += bob - ligg * ${(m.ben * 0.78).toFixed(3)};
    q.y += ligg * sin(tid * 1.7) * 0.004 * step(0.4, p.y);
    return q * iB.w;
}
`;
}

const PELS = /* glsl */ `
varying vec3 vDyr;
float dHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float dStoy(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;

export function lagDyrMateriale(art: Art): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', `#include <common>\n${glsl(art)}\nvarying vec3 vDyr;`)
            .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\ndyr(position);\nobjectNormal = dRot * objectNormal;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = dyr(position);\nvDyr = position;');
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\n${PELS}`)
            // Bust og pels: strå langs kroppen og flekker, så det ikke ser ut som plast.
            .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.78 + 0.34 * dStoy(vDyr * vec3(260.0, 260.0, 60.0)) + 0.1 * (dStoy(vDyr * 18.0) - 0.5);');
    };
    mat.customProgramCacheKey = () => `bryggen-dyr-${art}`;
    return mat;
}

/** Skyggen følger stillingen (et dyr som ligger, kaster skyggen av et som ligger). */
export function lagDyrDybde(art: Art): THREE.MeshDepthMaterial {
    const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', `#include <common>\n${glsl(art)}`)
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = dyr(position);');
    };
    mat.customProgramCacheKey = () => `bryggen-dyr-${art}-dybde`;
    return mat;
}
