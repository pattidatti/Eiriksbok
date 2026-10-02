// Skroget og riggen som koggen og jekta deles om: et klinkbygd skrog laget av tverrsnitt langs
// skipet, stavner, ripe, dekk, mast, rå med beslått seil, vant og ror.
//
// Alt legges i en `MeshKit`, så et helt skip er ett tegnekall per materiale ('raatre' for treverket
// og seilet, 'mork' for tauverket). Skroget er tjæret og mørkt, dekket og castellene lysere, og
// seilet lyst: alt er fargefaktor per hjørne (`tint`), ikke nye materialer.
//
// Skipets eget rom: z langs skipet (forut = +z), x på tvers (styrbord = -x), y opp fra vannlinja.
// Skipet bygges med identitetsmatrise i kit-et, så hjørnene kan skrives rett i bøtta.
//
// Klinkbygd [V for jekta, SNL «jekt»; for koggen over vannlinja, SNL «kogge»]: hvert bord ligger
// litt utenpå bordet under. Her skyves den nedre kanten av hvert bord ut, som på færingen. Koggen
// var kravellbygd (bordene kant i kant) under vannlinja [V SNL «kogge»], men det synes ikke over
// vannet, så hele skroget er bygget klinkbygd.
import * as THREE from 'three';
import type { Bucket, ColliderKit, MatKey, MeshKit, Tint } from './meshkit';

export const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface SkrogSpec {
    /** Halv lengde ved ripa, fra midten til stavnen. */
    L: number;
    /** Halv bredde ved ripa midtskips. */
    B: number;
    /** Halv bredde på den flate bunnen midtskips (begge skipene var flatbunnet [V SNL]). */
    bunn: number;
    /** Hvor dypt bunnen ligger under vannlinja midtskips. */
    dyp: number;
    /** Ripa over vannlinja midtskips. */
    ripe: number;
    /** Hvor mye ripa reiser seg mot stavnene. */
    spring: number;
    /** Hvor langt stavnen heller ut fra bunnen til ripa (forut og akter), i meter. */
    rakeF: number;
    rakeA: number;
    /** Rett stavn (koggen) eller stavn som bøyer seg (jekta). */
    rund: boolean;
    /** Hvor fort skroget smalner mot endene (høyere = fyldigere). */
    fyldig: number;
    /** Bordganger per side. */
    bord: number;
    /** Hvor høyt stavnen stikker over ripa. */
    stavnOver: number;
}

/** Tverrsnitt langs skipet: u fra -1 (akter) til 1 (forut). */
const N = 34;
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();

/** Ripa og bunnen ved u. */
export function hoyder(sp: SkrogSpec, u: number): { ripe: number; kjol: number } {
    const a = Math.abs(u);
    const ripe = sp.ripe + sp.spring * Math.pow(a, 2.6) * (u > 0 ? 1 : 0.75);
    const kjol = -sp.dyp + sp.dyp * 0.35 * Math.pow(a, 3);
    return { ripe, kjol };
}

/** Hvor langt ut stavnen står i høyden `yf` (0 bunnen, 1 ripa), forut (u > 0) eller akter. */
function stavnZ(sp: SkrogSpec, u: number, yf: number): number {
    const rake = u >= 0 ? sp.rakeF : sp.rakeA;
    const f = sp.rund ? 1 - Math.pow(1 - yf, 2.2) : yf;
    return sp.L - rake * (1 - f);
}

/**
 * Punktet på skroget ved u (langs) og s (0 bunnkanten .. 1 ripa), på side `side` (+1 babord =
 * +x). `ut` skyver punktet ut fra skroget (klinkkanten), negativ `ut` legger det på innsida.
 */
export function punkt(sp: SkrogSpec, u: number, s: number, side: number, ut = 0, out = new THREE.Vector3()): THREE.Vector3 {
    const a = Math.min(1, Math.abs(u));
    const { ripe, kjol } = hoyder(sp, u);
    const psi = s * Math.PI * 0.5;
    const yf = 1 - Math.cos(psi);
    const y = kjol + yf * (ripe - kjol);
    const z = u * stavnZ(sp, u, yf);
    // Bredden: fyldig midtskips, spiss mot stavnene. Øverst litt utfall (sidene heller ut).
    const smal = Math.pow(Math.max(0, 1 - Math.pow(a, sp.fyldig)), 0.7);
    const b = sp.B * smal;
    const bb = sp.bunn * Math.pow(Math.max(0, 1 - Math.pow(a, sp.fyldig * 0.8)), 1.2);
    const x = bb + (b - bb) * Math.sin(psi) + ut * Math.min(1, smal * 4);
    return out.set(side * x, y, z);
}

/** Skriver et hjørne rett i bøtta (kit-et har identitetsmatrise mens skip bygges). */
function hjorne(b: Bucket, p: THREE.Vector3, n: THREE.Vector3, u: number, v: number, shade: number, hue: [number, number, number]): void {
    b.pos.push(p.x, p.y, p.z);
    b.nor.push(n.x, n.y, n.z);
    b.uv.push(u, v);
    b.col.push(shade * hue[0], shade * hue[1], shade * hue[2]);
}

/**
 * Et rutenett av punkter `P(i, j)` (i langs, j på tvers) som myk flate. Normalen regnes av
 * naboene og vendes bort fra `inn(p)` (et punkt inne i formen); `motInn` snur den.
 */
export function flate(
    k: MeshKit, key: MatKey, ni: number, nj: number,
    P: (i: number, j: number) => THREE.Vector3,
    uv: (i: number, j: number) => [number, number],
    shade: (i: number, j: number) => number,
    inn: (p: THREE.Vector3) => THREE.Vector3,
    motInn = false
): void {
    const b = k.bucket(key);
    const hue = k.tint.hue ?? [1, 1, 1];
    const base = b.vertexCount;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= ni; i++) for (let j = 0; j <= nj; j++) pts.push(P(i, j));
    const at = (i: number, j: number) => pts[i * (nj + 1) + j];
    for (let i = 0; i <= ni; i++) {
        for (let j = 0; j <= nj; j++) {
            _a.subVectors(at(Math.min(ni, i + 1), j), at(Math.max(0, i - 1), j));
            _b.subVectors(at(i, Math.min(nj, j + 1)), at(i, Math.max(0, j - 1)));
            _n.crossVectors(_a, _b);
            if (_n.lengthSq() < 1e-12) _n.set(0, 1, 0);
            _n.normalize();
            const p = at(i, j);
            const ut = p.clone().sub(inn(p));
            if ((_n.dot(ut) < 0) !== motInn) _n.negate();
            const [u, v] = uv(i, j);
            hjorne(b, p, _n, u, v, shade(i, j), hue);
        }
    }
    const idx = (i: number, j: number) => base + i * (nj + 1) + j;
    for (let i = 0; i < ni; i++) {
        for (let j = 0; j < nj; j++) {
            const p0 = at(i, j), p1 = at(i + 1, j), p2 = at(i + 1, j + 1);
            _a.subVectors(p1, p0);
            _b.subVectors(p2, p0);
            _n.crossVectors(_a, _b);
            // Vinden etter normalen i hjørnet, så forsida alltid vender ut (eller inn).
            const ni0 = idx(i, j) * 3;
            const vn = V3(b.nor[ni0], b.nor[ni0 + 1], b.nor[ni0 + 2]);
            if (_n.dot(vn) >= 0) b.idx.push(idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j), idx(i + 1, j + 1), idx(i, j + 1));
            else b.idx.push(idx(i, j), idx(i + 1, j + 1), idx(i + 1, j), idx(i, j), idx(i, j + 1), idx(i + 1, j + 1));
        }
    }
}

/**
 * Skroget: bordgangene på begge sider, utsida tjæret og innsida (mot dekket eller lasten) i
 * mørkere tre. `fraBord` hopper over bordene som ligger godt under vannet.
 */
export function skrog(k: MeshKit, sp: SkrogSpec, ute: Tint, inne: Tint, fraBord = 0): void {
    const midt = (p: THREE.Vector3) => V3(0, (hoyder(sp, p.z / sp.L).kjol + sp.ripe) / 2, p.z);
    for (const side of [-1, 1]) {
        for (let kb = fraBord; kb < sp.bord; kb++) {
            const s0 = kb / sp.bord;
            const s1 = (kb + 1) / sp.bord;
            const uOf = (i: number) => -1 + (2 * i) / N;
            // `ned` skyver den nedre kanten, `opp` den øvre (innsida: begge inn).
            const P = (ned: number, opp = 0) => (i: number, j: number) => punkt(sp, uOf(i), j === 0 ? s0 : s1, side, j === 0 ? ned : opp);
            const uv = (i: number, j: number): [number, number] => [kb * 0.31 + j * 0.29, uOf(i) * sp.L]; // fibrene (v) langs bordene
            // Utsida: den nedre kanten skyves ut og ligger i skyggen av bordet over.
            k.withTint(ute, () =>
                flate(k, 'raatre', N, 1, P(0.035), uv, (_i, j) => (j === 0 ? ute.bottom : ute.top), midt)
            );
            if (kb < sp.bord * 0.45) continue; // innsida under dekket synes aldri
            k.withTint(inne, () =>
                flate(k, 'raatre', N, 1, P(-0.06, -0.06), uv, (_i, j) => (j === 0 ? inne.bottom : inne.top), midt, true)
            );
        }
    }
    // Ripa: en list langs toppen av øverste bord, og en tykkere vannbord-list (barkholt) litt under.
    k.withTint({ top: ute.top * 1.25, bottom: ute.top * 1.25, hue: ute.hue }, () => {
        for (const side of [-1, 1]) {
            for (let i = 0; i < N; i++) {
                const u0 = -1 + (2 * i) / N;
                const u1 = -1 + (2 * (i + 1)) / N;
                k.log('raatre', punkt(sp, u0, 1, side, -0.02), punkt(sp, u1, 1, side, -0.02), 0.07, 5, false);
                const sb = 1 - 1.6 / sp.bord;
                k.log('raatre', punkt(sp, u0, sb, side, 0.06), punkt(sp, u1, sb, side, 0.06), 0.06, 5, false);
            }
        }
    });
}

/** Stavnene: en stokk i hver ende fra bunnen og et stykke over ripa. */
export function stavner(k: MeshKit, sp: SkrogSpec, r: number, tint: Tint): void {
    k.withTint(tint, () => {
        for (const ende of [-1, 1]) {
            const M = 10;
            let prev = punkt(sp, ende, 0, 1);
            for (let i = 1; i <= M; i++) {
                const p = punkt(sp, ende, i / M, 1);
                p.x = 0;
                if (i === 1) prev.x = 0;
                k.log('raatre', prev, p, r, 6, i === M);
                prev = p;
            }
            // Over ripa: rett opp og litt ut (koggen) eller i en bue innover (jekta).
            const top = prev.clone();
            const dz = sp.rund ? ende * sp.stavnOver * 0.35 : ende * sp.stavnOver * 0.55;
            const mid = top.clone().add(V3(0, sp.stavnOver * 0.6, dz * 0.8));
            const end = top.clone().add(V3(0, sp.stavnOver, sp.rund ? dz * 0.6 : dz));
            k.log('raatre', top, mid, r, 6, false);
            k.log('raatre', mid, end, r, 6, true, r * 0.8);
        }
    });
}

/**
 * Hvor skroget står i høyden `y` ved u: halvbredden og z (halvering langs tverrsnittet).
 * `null` der skroget ikke når opp dit.
 */
export function vedHoyde(sp: SkrogSpec, u: number, y: number): { x: number; z: number } | null {
    const { ripe, kjol } = hoyder(sp, u);
    if (y <= kjol || y >= ripe) return null;
    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 16; it++) {
        const m = (lo + hi) / 2;
        if (punkt(sp, u, m, 1).y < y) lo = m;
        else hi = m;
    }
    const p = punkt(sp, u, lo, 1, -0.05);
    return { x: p.x, z: p.z };
}

/** Dekk eller tiljer i høyden `y`, fra u0 til u1, formet etter skroget. Plankene går langs skipet. */
export function dekk(k: MeshKit, sp: SkrogSpec, y: number, u0: number, u1: number, tint: Tint): void {
    const M = 26;
    const rader: { x: number; z: number }[] = [];
    for (let i = 0; i <= M; i++) {
        const v = vedHoyde(sp, u0 + ((u1 - u0) * i) / M, y);
        if (v && v.x > 0.05) rader.push(v);
    }
    if (rader.length < 2) return;
    k.withTint(tint, () =>
        flate(
            k, 'raatre', rader.length - 1, 1,
            (i, j) => V3(j === 0 ? -rader[i].x : rader[i].x, y, rader[i].z),
            (i, j) => [j === 0 ? -rader[i].x : rader[i].x, rader[i].z],
            () => tint.top,
            (p) => V3(p.x, p.y - 1, p.z)
        )
    );
}

/** Mast med topp (`r0` nederst, `r1` øverst) fra `fot` til høyden `h`. */
export function mast(k: MeshKit, fot: THREE.Vector3, h: number, r0: number, r1: number, tint: Tint): THREE.Vector3 {
    const top = V3(fot.x, h, fot.z);
    k.withTint(tint, () => k.log('raatre', fot, top, r0, 8, true, r1));
    return top;
}

/** Lyst, ufarget seilduk: flaten får nesten én farge fra teksturen (som tørrfisken i bua). */
const SEIL: Tint = { top: 2.5, bottom: 1.9, hue: [1.04, 1.0, 0.9] };

/**
 * Råa på tvers av skipet i høyden `y` med seilet beslått (rullet sammen og surret) langs den.
 * Et skip som ligger i havn, har seilet beslått [S].
 */
export function raa(k: MeshKit, z: number, y: number, halv: number, tint: Tint, seilR: number): void {
    k.withTint(tint, () => k.log('raatre', V3(-halv, y, z), V3(halv, y, z), 0.13, 7, true, 0.13));
    // Seilet: tykkest på midten, i noen buker mellom surringene.
    const n = 9;
    k.withUv(0.04, () =>
        k.withTint(SEIL, () => {
            for (let i = 0; i < n; i++) {
                const xa = -halv * 0.92 + (halv * 1.84 * i) / n;
                const xb = xa + (halv * 1.84) / n;
                const t = Math.abs((xa + xb) / 2) / halv;
                const r = seilR * (1 - t * 0.55);
                k.log('raatre', V3(xa, y - r * 0.9, z + 0.05), V3(xb, y - r * 0.9, z + 0.05), r * 0.9, 7, i === 0 || i === n - 1, r);
            }
        })
    );
    // Surringene rundt seilet.
    k.withTint({ top: 0.9, bottom: 0.9, hue: [1.1, 1.0, 0.8] }, () => {
        for (let i = 1; i < n; i++) {
            const x = -halv * 0.92 + (halv * 1.84 * i) / n;
            const t = Math.abs(x) / halv;
            const r = seilR * (1 - t * 0.55) * 1.04;
            k.log('raatre', V3(x - 0.03, y - r * 0.85, z + 0.05), V3(x + 0.03, y - r * 0.85, z + 0.05), r, 7, false);
        }
    });
}

/**
 * Råa med seilet satt: duken henger fra råa ned til `bunn` og buker seg forut for vinden (`buk` m).
 * Begge sider tegnes (man ser seilet bakfra og forfra). Skjøtene går fra de nedre hjørnene akterut.
 */
export function seilSatt(k: MeshKit, z: number, y: number, halv: number, bunn: number, buk: number, tint: Tint): void {
    k.withTint(tint, () => k.log('raatre', V3(-halv, y, z), V3(halv, y, z), 0.13, 7, true, 0.13));
    const NX = 8;
    const NY = 6;
    const w = halv * 0.94;
    const pt = (i: number, j: number) => {
        const u = i / NX;
        const v = j / NY; // 0 nederst
        const x = -w + 2 * w * u;
        // Duken er litt smalere nederst, og buker mest midt på og litt under midten.
        const xx = x * (0.92 + 0.08 * v);
        const b = buk * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.85 * v)) ;
        return V3(xx, bunn + (y - 0.15 - bunn) * v, z + 0.1 + b);
    };
    k.withUv(0.04, () =>
        k.withTint(SEIL, () => {
            for (let i = 0; i < NX; i++) {
                for (let j = 0; j < NY; j++) {
                    const a = pt(i, j);
                    const b = pt(i + 1, j);
                    const d = pt(i, j + 1);
                    const c = pt(i + 1, j + 1);
                    // To trekantpar per rute, ett for hver side.
                    const s0 = SEIL.bottom + (SEIL.top - SEIL.bottom) * (j / NY);
                    const s1 = SEIL.bottom + (SEIL.top - SEIL.bottom) * ((j + 1) / NY);
                    k.tri('raatre', a, b, c, [a.x, a.y], [b.x, b.y], [c.x, c.y], [s0, s0, s1]);
                    k.tri('raatre', a, c, d, [a.x, a.y], [c.x, c.y], [d.x, d.y], [s0, s1, s1]);
                    k.tri('raatre', a, c, b, [a.x, a.y], [c.x, c.y], [b.x, b.y], [s0 * 0.8, s1 * 0.8, s0 * 0.8]);
                    k.tri('raatre', a, d, c, [a.x, a.y], [d.x, d.y], [c.x, c.y], [s0 * 0.8, s1 * 0.8, s1 * 0.8]);
                }
            }
        })
    );
}

/** Et tau mellom to punkter (tjæret hamp, mørkt). Litt slakk når `slakk` > 0. */
export function tau(k: MeshKit, a: THREE.Vector3, b: THREE.Vector3, r = 0.025, slakk = 0): void {
    const tint: Tint = { top: 0.7, bottom: 0.7 };
    k.withTint(tint, () => {
        if (slakk <= 0) {
            k.log('mork', a, b, r, 4, false);
            return;
        }
        const M = 6;
        let prev = a;
        for (let i = 1; i <= M; i++) {
            const t = i / M;
            const p = a.clone().lerp(b, t);
            p.y -= slakk * 4 * t * (1 - t);
            k.log('mork', prev, p, r, 4, false);
            prev = p;
        }
    });
}

/** Vantene: tau fra masta ned til ripa på hver side, litt akter for masta. */
export function vant(k: MeshKit, sp: SkrogSpec, mastZ: number, fra: number, antall: number, avstand: number): void {
    for (const side of [-1, 1]) {
        for (let i = 0; i < antall; i++) {
            const z = mastZ - 0.4 - i * avstand;
            const v = vedHoyde(sp, z / sp.L, hoyder(sp, z / sp.L).ripe - 0.05);
            if (!v) continue;
            const fot = V3(side * (v.x + 0.08), hoyder(sp, z / sp.L).ripe, z);
            tau(k, V3(side * 0.25, fra, mastZ), fot, 0.03);
            // Jomfruen: en rund kloss der vantet strammes mot ripa.
            k.withTint({ top: 0.6, bottom: 0.6 }, () => k.log('raatre', fot.clone().add(V3(0, 0.25, 0)), fot.clone().add(V3(0, 0.45, 0)), 0.09, 6, true));
        }
    }
}

/**
 * Roret på akterstevnen [V SNL «kogge»]: et bredt blad som henger langs stevnen, fra under
 * vannet til over ripa, med rorkulten inn over skipet.
 */
export function ror(k: MeshKit, sp: SkrogSpec, bredde: number, tint: Tint): void {
    const bunn = punkt(sp, -1, 0.15, 1);
    const topp = punkt(sp, -1, 1, 1);
    bunn.x = topp.x = 0;
    topp.y += 0.35;
    topp.z -= sp.rund ? 0.05 : sp.rakeA * 0.06;
    const len = bunn.distanceTo(topp);
    const vinkel = Math.atan2(topp.z - bunn.z, topp.y - bunn.y);
    k.withTint(tint, () => {
        // Bladet: bredest nede, smalt der det går opp langs stevnen.
        const m = new THREE.Matrix4().makeRotationX(vinkel);
        m.setPosition(0, (bunn.y + topp.y) / 2, (bunn.z + topp.z) / 2);
        k.push(m);
        k.box('raatre', 0, -len * 0.2, -bredde * 0.5 - 0.1, 0.16, len * 0.6, bredde);
        k.box('raatre', 0, len * 0.3, -0.32, 0.18, len * 0.42, 0.5);
        k.pop();
        // Rorkulten: inn over akterenden.
        k.log('raatre', topp.clone().add(V3(0, -0.15, -0.15)), topp.clone().add(V3(0, -0.05, 2.4)), 0.07, 6, true, 0.05);
    });
}

/** Konveks kollider rundt skroget fra litt under vannet til ripa, i skipets rom. */
export function skrogKollider(c: ColliderKit, sp: SkrogSpec): void {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
        const u = (-1 + (2 * i) / 12) * 0.995;
        const ripe = hoyder(sp, u).ripe;
        for (const side of [-1, 1]) {
            for (const y of [-0.6, ripe - 0.02]) {
                const v = vedHoyde(sp, u, y);
                if (v) pts.push(V3(side * (v.x + 0.08), y, v.z));
            }
        }
    }
    c.hull(pts);
}

/**
 * Omrisset av skroget i høyden `y` (skipets rom), for vannet (`SkrogFot` i vann.ts): halv lengde,
 * halv bredde, og hvor langt midten av omrisset står forut for skipets midte (stavnene heller
 * ulikt). Vannet tegnes ikke innenfor, så det ikke står opp gjennom bunnen.
 */
export function vannlinje(sp: SkrogSpec, y: number): { L: number; B: number; fyldig: number; forut: number } {
    let zF = 0;
    let zA = 0;
    let B = 0;
    for (let i = -60; i <= 60; i++) {
        const v = vedHoyde(sp, i / 60, y);
        if (!v) continue;
        zF = Math.max(zF, v.z);
        zA = Math.min(zA, v.z);
        B = Math.max(B, v.x);
    }
    return { L: (zF - zA) / 2 + 0.05, B: B + 0.06, fyldig: sp.fyldig, forut: (zF + zA) / 2 };
}
