import * as THREE from 'three';
import { COLS, ROWS, type G } from './game';
import { toWorld } from './geo';

// Terrenget på Fredriksten: én høydefunksjon for alt. Snøen i marka, løpegravene som
// mørke kutt med jordvoll på kanten, glacis som heller opp mot vollen, muren og åsene på
// sidene. Geometrien bygges av den samme funksjonen som figurene står på (`heightAt`),
// så ingen svever og ingen synker.
//
// Verden: x = 8,5 - kolonne, z = rad. Festningen ligger ved z = 0 (nærmest kameraet),
// den svenske leiren bak z = 13.

/** Grøftebunnen, der soldatene går i dekning. */
export const FLOOR = -0.46;
const HALF = 0.28; // halv bredde på bunnen
const LIP = 0.4; // der jordvollen på kanten er høyest
const BANK = 0.62; // der vollen har flatet ut
const CREST = 0.16;
const ROAD = 0.46; // halv bredde på stien over sletta

export const WALL_TOP = 0.8;
export const VOLL_TOP = 0.42;

/** Et utsnitt av verden som må tegnes på nytt: x0, x1, z0, z1. */
export type Region = [number, number, number, number];

/** Et grøftestykke mellom to rutemidter (verden). */
type Seg = [number, number, number, number];

export interface TerrainData {
    segs: Seg[];
    /** Segmentene sortert i bøtter per rute, for rask avstand. */
    bucket: Map<number, Seg[]>;
    /** Den åpne sletta på veien: nedtrampet snø, ingen grøft. */
    road: Map<number, Seg[]>;
}

const key = (ix: number, iz: number) => iz * 64 + ix;

function hash(x: number, z: number) {
    const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function noise(x: number, z: number) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const a = hash(ix, iz);
    const b = hash(ix + 1, iz);
    const c = hash(ix, iz + 1);
    const d = hash(ix + 1, iz + 1);
    const u = fx * fx * (3 - 2 * fx);
    const v = fz * fz * (3 - 2 * fz);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a: number, b: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Løpegravene som linjestykker (fra rutenettet). Leirenden forlenges ut i mørket. */
export function trenchData(g: G): TerrainData {
    const segs: Seg[] = [];
    const road: Seg[] = [];
    const at = (x: number, z: number) => (x >= 0 && z >= 0 && x < COLS && z < ROWS ? g.cells[z][x] : null);
    const isG = (x: number, z: number) => at(x, z) === 'grav';
    // Sletta og stormen over glacis er åpen vei: tråkket snø, ingen grøft.
    const isV = (x: number, z: number) => at(x, z) === 'vei' || at(x, z) === 'glacis';
    // Grøftene følger veien celle for celle. Der veien krysser den åpne sletta, blir det
    // en nedtrampet sti i stedet (den går helt inn til grøfteendene).
    for (const r of g.routes) {
        const cells = r.cells;
        for (let i = 0; i < cells.length; i++) {
            const [x, z] = cells[i];
            const [ax, az] = toWorld(x, z);
            const n = cells[i + 1];
            if (isV(x, z)) {
                road.push([ax, az, ax, az]);
                if (n && (isV(n[0], n[1]) || isG(n[0], n[1]))) road.push([ax, az, ...toWorld(n[0], n[1])]);
                const p = cells[i - 1];
                if (p && isG(p[0], p[1])) road.push([...toWorld(p[0], p[1]), ax, az]);
            }
            if (!isG(x, z)) continue;
            segs.push([ax, az, ax, az]);
            if (z === ROWS - 1 && i === 0) segs.push([ax, az, ax, az + 3.2]);
            if (n && isG(n[0], n[1])) {
                const [bx, bz] = toWorld(n[0], n[1]);
                segs.push([ax, az, bx, bz]);
            }
        }
    }
    return { segs, bucket: bucketize(segs), road: bucketize(road) };
}

function bucketize(segs: Seg[]) {
    const bucket = new Map<number, Seg[]>();
    for (const s of segs) {
        const x0 = Math.floor(Math.min(s[0], s[2]) - BANK) + 20;
        const x1 = Math.floor(Math.max(s[0], s[2]) + BANK) + 20;
        const z0 = Math.floor(Math.min(s[1], s[3]) - BANK) + 4;
        const z1 = Math.floor(Math.max(s[1], s[3]) + BANK) + 4;
        for (let ix = x0; ix <= x1; ix++)
            for (let iz = z0; iz <= z1; iz++) {
                const k = key(ix, iz);
                const l = bucket.get(k);
                if (l) l.push(s);
                else bucket.set(k, [s]);
            }
    }
    return bucket;
}

/** Avstand til nærmeste grøft (stor verdi = ingen grøft i nærheten). */
export function trenchDist(td: TerrainData, x: number, z: number) {
    return segDist(td.bucket, x, z);
}

function segDist(bucket: Map<number, Seg[]>, x: number, z: number) {
    const l = bucket.get(key(Math.floor(x) + 20, Math.floor(z) + 4));
    if (!l) return 9;
    let best = 9;
    for (const [ax, az, bx, bz] of l) {
        const dx = bx - ax;
        const dz = bz - az;
        const L = dx * dx + dz * dz;
        let t = L > 0 ? ((x - ax) * dx + (z - az) * dz) / L : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
        if (d < best) best = d;
    }
    return best;
}

/** Bakken uten grøfter: mur, voll, glacis, mark og åsene rundt. */
function baseHeight(x: number, z: number) {
    const ax = Math.abs(x);
    // Åsene på sidene og bak leiren rammer inn slagmarka.
    const hills =
        smooth(9.6, 17, ax) * (2.2 + noise(x * 0.35, z * 0.35) * 1.6) +
        smooth(22, 34, z) * smooth(4, 14, ax) * (1.2 + noise(x * 0.2, z * 0.2) * 1.4);
    let h: number;
    if (z < 0.42) h = WALL_TOP; // festningen innenfor muren
    else if (z < 0.62) h = WALL_TOP + (VOLL_TOP - WALL_TOP) * smooth(0.42, 0.62, z);
    else if (z < 1.42) h = VOLL_TOP;
    else if (z < 1.6) h = VOLL_TOP + 0.08 * Math.sin(((z - 1.42) / 0.18) * Math.PI); // brystvern
    else if (z < 4.55) h = 0.06 + (VOLL_TOP - 0.06) * (1 - smooth(1.6, 4.55, z)) ** 1.15;
    else h = 0.05 + (noise(x * 0.9, z * 0.9) - 0.5) * 0.05;
    if (z >= 0.42 && ax > 9.6) h = Math.max(h, 0.05);
    return h + hills;
}

/** Høyden i verden, med løpegravene skåret ut. */
export function heightFn(td: TerrainData, x: number, z: number) {
    let h = baseHeight(x, z);
    if (z < 4.55) return h;
    // Sletta: stien er tråkket et lite hakk ned i snøen.
    const rd = segDist(td.road, x, z);
    if (rd < ROAD) h -= 0.05 * (1 - smooth(ROAD - 0.14, ROAD, rd));
    const d = trenchDist(td, x, z);
    if (d >= BANK) return h;
    if (d <= HALF) return FLOOR;
    if (d <= LIP) return FLOOR + (h + CREST - FLOOR) * smooth(HALF, LIP, d);
    return h + CREST * (1 - smooth(LIP, BANK, d));
}

// ---------------------------------------------------------------------------
// Høydekart: tett rutenett over brettet for rask oppslag (figurer, tårn, flekker)
// ---------------------------------------------------------------------------

const HX0 = -10;
const HZ0 = -1;
const HRES = 8;
const HW = 20 * HRES + 1;
const HD = 17 * HRES + 1;

export class HeightMap {
    data = new Float32Array(HW * HD);
    td: TerrainData = { segs: [], bucket: new Map(), road: new Map() };
    /** Bygg høydekartet på nytt - helt, eller bare innenfor `r` (verden: x0, x1, z0, z1). */
    rebuild(g: G, r: Region | null = null) {
        this.td = trenchData(g);
        const i0 = r ? Math.max(0, Math.floor((r[0] - HX0) * HRES)) : 0;
        const i1 = r ? Math.min(HW - 1, Math.ceil((r[1] - HX0) * HRES)) : HW - 1;
        const j0 = r ? Math.max(0, Math.floor((r[2] - HZ0) * HRES)) : 0;
        const j1 = r ? Math.min(HD - 1, Math.ceil((r[3] - HZ0) * HRES)) : HD - 1;
        for (let j = j0; j <= j1; j++)
            for (let i = i0; i <= i1; i++)
                this.data[j * HW + i] = heightFn(this.td, HX0 + i / HRES, HZ0 + j / HRES);
    }
    at(x: number, z: number) {
        const fx = (x - HX0) * HRES;
        const fz = (z - HZ0) * HRES;
        if (fx < 0 || fz < 0 || fx >= HW - 1 || fz >= HD - 1) return heightFn(this.td, x, z);
        const i = Math.floor(fx);
        const j = Math.floor(fz);
        const u = fx - i;
        const v = fz - j;
        const d = this.data;
        const a = d[j * HW + i];
        const b = d[j * HW + i + 1];
        const c = d[(j + 1) * HW + i];
        const e = d[(j + 1) * HW + i + 1];
        return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
    }
}

// ---------------------------------------------------------------------------
// Terrengmeshen: tett i brettet, grovere ute i mørket
// ---------------------------------------------------------------------------

function axis(parts: [number, number, number][]) {
    const out: number[] = [];
    for (const [a, b, step] of parts) for (let v = a; v < b - 1e-6; v += step) out.push(v);
    out.push(parts[parts.length - 1][1]);
    return out;
}
const XS = axis([
    [-26, -11, 1],
    [-11, 11, 0.25],
    [11, 26, 1],
]);
const ZS = axis([
    [-3, -0.5, 0.5],
    [-0.5, 15, 0.25],
    [15, 42, 1],
]);

const SNOW = new THREE.Color('#a9bbe2');
const SNOW_BLUE = new THREE.Color('#6d86c2');
const TRAMPLED = new THREE.Color('#5d6178');
const EARTH = new THREE.Color('#3a2c22');
const EARTH_DARK = new THREE.Color('#231a14');
const STONE = new THREE.Color('#77737a');
const MUD = new THREE.Color('#4a3a2a');
const CLAY = new THREE.Color('#7a5a3c');
const HILL = new THREE.Color('#34436e');
const C = new THREE.Color();
const C2 = new THREE.Color();

export function makeTerrainGeometry() {
    const geo = new THREE.BufferGeometry();
    const n = XS.length * ZS.length;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const uv = new Float32Array(n * 2);
    const idx: number[] = [];
    for (let j = 0; j < ZS.length; j++)
        for (let i = 0; i < XS.length; i++) {
            const v = j * XS.length + i;
            uv[v * 2] = XS[i] * 0.18;
            uv[v * 2 + 1] = ZS[j] * 0.18;
            if (i < XS.length - 1 && j < ZS.length - 1) {
                const a = v;
                const b = v + 1;
                const c = v + XS.length;
                const d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
}

/** Fyll terrengmeshen fra høydefunksjonen og farg snø, jord, sot og stein. */
export function fillTerrain(geo: THREE.BufferGeometry, td: TerrainData, r: Region | null = null) {
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
    for (let j = 0; j < ZS.length; j++) {
        if (r && (ZS[j] < r[2] || ZS[j] > r[3])) continue;
        for (let i = 0; i < XS.length; i++) {
            if (r && (XS[i] < r[0] || XS[i] > r[1])) continue;
            const v = j * XS.length + i;
            const x = XS[i];
            const z = ZS[j];
            const h = heightFn(td, x, z);
            pos.setXYZ(v, x, h, z);
            const n = noise(x * 2.3, z * 2.3);
            const ax = Math.abs(x);
            if (z < 0.62 && ax < 10.5) {
                // Muren: stein, med snø på toppen.
                C.copy(STONE).lerp(SNOW, z < 0.4 ? 0.55 + n * 0.3 : n * 0.2);
            } else {
                C.copy(SNOW).lerp(SNOW_BLUE, 0.25 + n * 0.35);
                if (ax > 9.8 || z > 16) C.lerp(HILL, Math.min(0.7, smooth(9.8, 16, ax) + smooth(16, 26, z)));
                if (z >= 4.55) {
                    const d = trenchDist(td, x, z);
                    if (d < HALF) {
                        // Grøftebunnen: tråkket gjørme med litt snø og halm.
                        C.copy(EARTH_DARK).lerp(n > 0.62 ? TRAMPLED : MUD, n > 0.62 ? 0.5 : 0.4 + n * 0.3);
                    } else if (d < LIP + 0.02) {
                        // Grøfteveggen: jordlag i striper, der spaden har skåret.
                        const band = Math.sin(h * 38 + n * 3) > 0.2 ? 1 : 0;
                        C.copy(EARTH).lerp(band ? CLAY : EARTH_DARK, band ? 0.45 : 0.25 + n * 0.2);
                    } else if (d < BANK + 0.15) C.copy(TRAMPLED).lerp(EARTH, 0.45 + n * 0.25);
                    else if (d < 1.1) C.lerp(TRAMPLED, 0.35 * (1 - (d - BANK) / 0.5));
                }
                // Den åpne veien (sletta og glacis): en bred sti av nedtrampet snø.
                const rd = segDist(td.road, x, z);
                if (z > 1.5 && (z < 4.55 || trenchDist(td, x, z) >= LIP + 0.02) && rd < ROAD + 0.12) {
                    const k = 1 - smooth(ROAD - 0.1, ROAD + 0.12, rd);
                    C.lerp(C2.copy(EARTH_DARK).lerp(n > 0.5 ? MUD : TRAMPLED, 0.35 + n * 0.4), 0.95 * k);
                }
            }
            col.setXYZ(v, C.r, C.g, C.b);
            if (r) {
                // Bare et lite utsnitt: normalen fra høydeforskjellen rundt punktet.
                const e = 0.12;
                const hx = heightFn(td, x + e, z) - heightFn(td, x - e, z);
                const hz = heightFn(td, x, z + e) - heightFn(td, x, z - e);
                N.set(-hx, 2 * e, -hz).normalize();
                nor.setXYZ(v, N.x, N.y, N.z);
            }
        }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    if (r) nor.needsUpdate = true;
    else {
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
    }
}
const N = new THREE.Vector3();

/** Skanskurvene langs grøftekanten: posisjoner og retning. */
export function gabionSpots(g: G, hm: HeightMap, max: number) {
    const out: [number, number, number, number][] = [];
    const isG = (x: number, z: number) =>
        x >= 0 && z >= 0 && x < COLS && z < ROWS && g.cells[z][x] === 'grav';
    const sides: [number, number][] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ];
    for (let z = 0; z < ROWS && out.length < max; z++)
        for (let x = 0; x < COLS && out.length < max; x++) {
            if (!isG(x, z)) continue;
            for (const [dx, dz] of sides) {
                if (isG(x + dx, z + dz)) continue;
                const nb = g.cells[z + dz]?.[x + dx];
                if (dz === -1 && nb === 'glacis') continue; // utgangen mot glacis
                if (nb === 'vei') continue; // grøfta åpner seg ut mot sletta
                if (dz === 1 && z === ROWS - 1) continue;
                const [wx, wz] = toWorld(x, z);
                // Kolonne +1 er -x i verden.
                const nx = -dx;
                const nz = dz;
                // Tre kurver tett i tett på kanten: en rad med skanskurver, ikke prikker.
                for (const s of [-0.31, 0, 0.31]) {
                    const px = wx + nx * 0.42 + nz * s;
                    const pz = wz + nz * 0.42 + nx * s;
                    out.push([px, hm.at(px, pz), pz, Math.atan2(nx, nz)]);
                }
            }
        }
    return out;
}
