// Bakken med form: gjørma er ikke et flatt golv, men søkk og små hauger, hjulspor og tråkk.
//
// Bakken var en boks med gjørme på toppen. Den er nå et rutenett (`bakke`) der hvert hjørne løftes
// eller senkes noen centimeter. Søkkene ligger nøyaktig der vætan (vaat.ts) legger pyttene, fordi
// begge bruker samme støy (`pyttStoy` her og i shaderen), så vannet blir stående i ekte groper.
// Hjulspor (`Fure`) er renner i samme flate.
//
// Kolliderne er fortsatt flate boksene. Formen holdes innenfor noen centimeter (`MIN_H`..`MAKS_H`),
// så føttene synker litt ned i haugene og står litt over søkkene, som i ekte gjørme. Kantene
// (`KANT`) ligger i høyden til boksen, så bakken møter veggene, kaia og nabocellene uten sprekk.
//
// Én bakke koster ingen tegnekall: den går i bøtta til materialet som før.
import * as THREE from 'three';
import type { MatKey, MeshKit } from '../motor/meshkit';

/** Så langt fra kanten av flaten flater formen ut. */
const KANT = 0.7;
/** Hvor høyt og lavt bakken går (meter fra toppen av boksen). */
const MIN_H = -0.09;
const MAKS_H = 0.045;
/** Hvor dypt et søkk med pytt er. */
const SOKK = 0.075;

// ── Støyen pyttene bruker (samme som i vaat.ts) ──
// Hash uten sinus (Dave Hoskins), regnet i 32-bits flyt som i GPU-en, så JS og GLSL er enige.
const f = Math.fround;
function fract(x: number): number {
    return f(x - Math.floor(x));
}
function hash(x: number, y: number): number {
    let a = fract(f(x * f(0.1031)));
    let b = fract(f(y * f(0.1031)));
    let c = a;
    const d = f(f(f(a * f(b + f(33.33))) + f(b * f(c + f(33.33)))) + f(c * f(a + f(33.33))));
    a = f(a + d);
    b = f(b + d);
    c = f(c + d);
    return fract(f(f(a + b) * c));
}
function glatt(t: number): number {
    return t * t * (3 - 2 * t);
}
/** Verdistøy 0..1 på et heltallsgitter. Samme som `pyStoy` i vaat.ts. */
export function pyttStoy(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = glatt(x - ix);
    const fy = glatt(y - iy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
/** Hvor lite «pyttstøy» det er her (lav = søkk). Samme sum som i vaat.ts. */
export function pyttGrunn(x: number, z: number): number {
    return pyttStoy(x * 0.6 + 7, z * 0.6 + 7) * 0.65 + pyttStoy(x * 2.1, z * 2.1) * 0.35;
}

/** Et hjulspor eller medespor: to renner fra `a` til `b` (lokale x, z), `sporvidde` mellom dem. */
export interface Fure {
    a: [number, number];
    b: [number, number];
    sporvidde: number;
}

/** Hjulspor fra `z0` til `z1` ved `x` som slingrer litt (samme bane som de gamle stripene i torg.ts). */
export function sporFurer(x: number, z0: number, z1: number, w: number, seed: number): Fure[] {
    const ut: Fure[] = [];
    const seg = 0.9;
    const j = (z: number) => Math.sin(z * 0.37 + seed) * 0.12 + Math.sin(z * 0.9 + seed * 2) * 0.03;
    for (let z = z0; z < z1 - 0.1; z += seg) {
        const z2 = Math.min(z + seg, z1);
        ut.push({ a: [x + j(z), z], b: [x + j(z2), z2], sporvidde: w });
    }
    return ut;
}

const _w = new THREE.Vector3();

/** Avstanden fra punktet til linjestykket a-b, i planet. */
function avstand(px: number, pz: number, a: [number, number], b: [number, number]): number {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
    return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t);
}

function smooth(e0: number, e1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
}

export interface BakkeOpts {
    /** Hjulspor og medespor (lokale koordinater). */
    furer?: Fure[];
    /** Hvor sterk formen er (1 = vanlig gjørme, mindre på fast, tråkket grunn). */
    styrke?: number;
    /** Rutestørrelsen i meter. */
    rute?: number;
    /** Steiner og flis per kvadratmeter som stikker opp av gjørma (standard 0,3; 0 = ingen). */
    rusk?: number;
}

/** En liten stein: en flat, rund kuppel av seks skjeve trekanter, det meste nede i gjørma. */
function stein(k: MeshKit, x: number, y: number, z: number, r: number, rnd: () => number): void {
    const rot = rnd() * Math.PI;
    const c = Math.cos(rot);
    const sn = Math.sin(rot);
    const lang = 0.8 + rnd() * 0.5;
    const pt = (dx: number, dy: number, dz: number) => new THREE.Vector3(x + dx * c - dz * sn, y + dy, z + dx * sn + dz * c);
    const topp = pt(0, r * (0.3 + rnd() * 0.15), 0);
    const N = 6;
    const ring: THREE.Vector3[] = [];
    const midt: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const rr = r * (0.8 + rnd() * 0.35);
        ring.push(pt(Math.cos(a) * rr * lang, -0.01, Math.sin(a) * rr));
        midt.push(pt(Math.cos(a) * rr * lang * 0.6, topp.y - y - r * 0.1, Math.sin(a) * rr * 0.6));
    }
    const uv = (p: THREE.Vector3): [number, number] => [p.x * 1.7, p.z * 1.7 + p.y];
    // Lys stein (kleberstein og gråstein i gjørma), litt mørkere nede mot kanten.
    for (let i = 0; i < N; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % N];
        const ma = midt[i];
        const mb = midt[(i + 1) % N];
        k.tri('stein', b, a, ma, uv(b), uv(a), uv(ma), [0.95, 0.95, 1.2]);
        k.tri('stein', b, ma, mb, uv(b), uv(ma), uv(mb), [0.95, 1.2, 1.2]);
        k.tri('stein', mb, ma, topp, uv(mb), uv(ma), uv(topp), [1.2, 1.2, 1.3]);
    }
}

/** En flis eller pinne: tynn, flat bit treverk som ligger skjevt. */
function flis(k: MeshKit, x: number, y: number, z: number, rnd: () => number): void {
    const l = 0.12 + rnd() * 0.22;
    const b = 0.03 + rnd() * 0.04;
    k.at(x, y, z, rnd() * Math.PI, () => k.withTint({ top: 0.55, bottom: 0.55 }, () => k.box('raatre', 0, 0.006, 0, b, 0.014, l, { skip: ['bottom'] })));
}

/**
 * Toppen av en bakkeboks som en flate med form. `x0..x1`, `z0..z1` og `y` (toppen) i det lokale
 * rommet til `k`; støyen leses i verdensrom, så nabocellene og pyttene er enige. Bruk sammen med
 * `k.box(…, { skip: ['top', 'bottom'] })` for sidene.
 */
export function bakke(k: MeshKit, key: MatKey, x0: number, x1: number, z0: number, z1: number, y: number, opts: BakkeOpts = {}): void {
    const rute = opts.rute ?? 0.5;
    const styrke = opts.styrke ?? 1;
    const cols = Math.max(1, Math.round((x1 - x0) / rute));
    const rows = Math.max(1, Math.round((z1 - z0) / rute));
    const dx = (x1 - x0) / cols;
    const dz = (z1 - z0) / rows;
    const furer = opts.furer ?? [];
    const m = k.matrix;
    // Høyden (og hvor mye mørkere) i et lokalt punkt.
    const form = (x: number, z: number): { h: number; mork: number } => {
        const kant = smooth(0, KANT, Math.min(x - x0, x1 - x, z - z0, z1 - z));
        if (kant <= 0) return { h: 0, mork: 0 };
        _w.set(x, y, z).applyMatrix4(m);
        const wx = _w.x;
        const wz = _w.z;
        const grunn = pyttGrunn(wx, wz);
        const sokk = smooth(0.42, 0.22, grunn);
        const bolge = (pyttStoy(wx * 0.22 + 3.1, wz * 0.22 + 1.7) - 0.5) * 0.09;
        const knott = (pyttStoy(wx * 1.3 + 11, wz * 1.3 + 5) - 0.5) * 0.035;
        let h = (bolge + knott) * styrke - sokk * SOKK * Math.min(1, styrke * 1.4);
        let mork = sokk * 0.25;
        for (const fu of furer) {
            const d = avstand(x, z, fu.a, fu.b);
            if (d > fu.sporvidde) continue;
            // To renner, 0,17 m brede og 4 cm dype, med en liten vold mellom.
            const fra = Math.abs(d - fu.sporvidde / 2);
            const renne = smooth(0.14, 0.04, fra);
            h -= renne * 0.04;
            mork = Math.max(mork, renne * 0.4);
        }
        h = Math.max(MIN_H, Math.min(MAKS_H, h)) * kant;
        return { h, mork: mork * kant };
    };
    // Høydene først, så normalene fra naboene.
    const H: number[] = [];
    const M: number[] = [];
    for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
            const r = form(x0 + i * dx, z0 + j * dz);
            H.push(r.h);
            M.push(r.mork);
        }
    }
    const w = cols + 1;
    const hAt = (i: number, j: number) => H[Math.max(0, Math.min(rows, j)) * w + Math.max(0, Math.min(cols, i))];
    k.grid(key, cols, rows, (i, j, v) => {
        const h = hAt(i, j);
        v.p.set(x0 + i * dx, y + h, z0 + j * dz);
        v.n.set(-(hAt(i + 1, j) - hAt(i - 1, j)) / (2 * dx), 1, -(hAt(i, j + 1) - hAt(i, j - 1)) / (2 * dz)).normalize();
        v.u = x0 + i * dx;
        v.v = z0 + j * dz;
        // Haugene tørker og blir lysere, søkkene og sporene er mørke og våte.
        v.shade *= (1 + Math.max(0, h) * 3) * (1 - M[j * w + i]);
    });

    // Rusk: steiner og flis, ikke i søkkene (der står vannet) og ikke i sporene. Eget frø fra hjørnet
    // i verden, så samme bakke får samme rusk hver gang cella lastes.
    const tetthet = opts.rusk ?? 0.3;
    if (tetthet <= 0) return;
    _w.set(x0, y, z0).applyMatrix4(m);
    let r = (Math.floor(_w.x * 73.1 + _w.z * 19.7) & 0x7fffffff) || 1;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    const n = Math.round((x1 - x0) * (z1 - z0) * tetthet);
    for (let i = 0; i < n; i++) {
        const x = x0 + KANT * 0.5 + rnd() * (x1 - x0 - KANT);
        const z = z0 + KANT * 0.5 + rnd() * (z1 - z0 - KANT);
        const s = rnd();
        const st = rnd();
        const fo = form(x, z);
        if (fo.mork > 0.08) continue;
        if (s < 0.6) stein(k, x, y + fo.h, z, 0.05 + st * st * 0.12, rnd);
        else flis(k, x, y + fo.h, z, rnd);
    }
}

/**
 * Bakkeboks: som `k.box(key, cx, cy, cz, sx, sy, sz, { skip: ['bottom'] })`, men toppen er en bakke
 * med form (`bakke`). Sidene og fargen (`withTint`) som før. Store flater får større ruter.
 */
export function bakkeBoks(k: MeshKit, key: MatKey, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, opts: BakkeOpts = {}): void {
    k.box(key, cx, cy, cz, sx, sy, sz, { skip: ['top', 'bottom'] });
    const rute = opts.rute ?? (sx * sz > 1500 ? 0.7 : 0.5);
    bakke(k, key, cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, cy + sy / 2, { ...opts, rute });
}
