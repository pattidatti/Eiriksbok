// Hodet og ansiktet til figurene (se figur.ts).
//
// Mannequinens hode er et grovt egg med spiss hake og hjørner 6 cm fra hverandre: det er ikke
// plass til et ansikt på det. Det byttes ut med en kule formet til skalle, kjeve og rund hake,
// med hår, skjegg eller hette farget inn per hjørne, ører, og en hals ned i kragen. Ansiktet
// (øyne, bryn, nese, munn) legges på huden etterpå, funnet med en stråle mot hodets trekanter.
import * as THREE from 'three';
import type { Del, Drakt } from './figur';

const smooth = THREE.MathUtils.smoothstep;

/** Det hodet trenger fra figuren som bygges (`Kledd` i figur.ts). */
export interface Kropp {
    readonly d: Drakt;
    readonly pos: number[];
    readonly index: number[];
    readonly headC: THREE.Vector3;
    readonly headR: number;
    readonly headBox: THREE.Box3;
    readonly snittHals: number;
    /** Det grove nivået for figurer langt unna: færre hjørner, ingen småting i ansiktet. */
    readonly grov: boolean;
    bone(name: string): number;
    p(name: string): THREE.Vector3;
    vert(v: THREE.Vector3, c: THREE.Color, bones: [number, number][]): number;
    tube(rings: number[][], closed: boolean): void;
    color(del: Del, c: THREE.Color): THREE.Color;
}

/**
 * Et nytt hode i stedet for mannequinens egg: en kule formet til skalle, kjeve og rund hake,
 * med hår, skjegg eller hette farget inn per hjørne og blåst litt ut. Like stort som egget,
 * så animasjonene og kollideren passer som før. Gir tilbake trekantene, så ansiktet kan
 * legges på huden.
 */
export function hodet(k: Kropp): [number, number] {
    const d = k.d;
    const headI = k.bone('DEF-head');
    const hb = k.headBox;
    const R = k.headR;
    const c0 = k.headC.clone().add(new THREE.Vector3(0, R * 0.02, 0));
    const RX = ((hb.max.x - hb.min.x) / 2) * 1.0;
    const RY = R * 0.88;
    const RZf = (hb.max.z - k.headC.z) * 0.95;
    const RZb = (k.headC.z - hb.min.z) * 0.95;
    const NI = k.grov ? 14 : 36;
    const NJ = k.grov ? 10 : 28;
    const col = new THREE.Color();
    const rings: number[][] = [];
    const i0 = k.index.length;
    for (let j = 0; j <= NJ; j++) {
        const phi = (j / NJ) * Math.PI;
        const ring: number[] = [];
        for (let i = 0; i < NI; i++) {
            const th = (i / NI) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th));
            const p = new THREE.Vector3(dir.x * RX, dir.y * RY, dir.z * (dir.z > 0 ? RZf : RZb));
            // Kjeven smalner mot en rund hake, og bakhodet går inn mot nakken.
            const kj = smooth(-dir.y, 0.05, 1);
            p.x *= 1 - 0.2 * kj * kj;
            p.y *= 1 - 0.1 * kj * kj;
            if (dir.z < 0) p.z *= 1 - 0.45 * kj;
            else p.z *= 1 - 0.08 * kj;
            const [del, ut, shade] = hodeDel(k, dir);
            p.addScaledVector(dir, ut).add(c0);
            k.color(del, col).multiplyScalar(shade);
            ring.push(k.vert(p, col, [[headI, 1]]));
        }
        rings.push(ring);
    }
    k.tube(rings, true);
    if (!d.hetteOppe) for (const side of [-1, 1]) ore(k, side, c0, RX, RY);
    hals(k, c0.y - RY * 0.5, c0.z - RZb * 0.15);
    return [i0, k.index.length];
}

/**
 * Halsen fra inne i hodet og ned i kragen. Der mannequinhodet satt fast i halsen, ble det
 * et hull når hodet ble byttet ut.
 */
function hals(k: Kropp, topY: number, cz: number): void {
    const headI = k.bone('DEF-head');
    const neckI = k.bone('DEF-neck');
    const neck = k.p('DEF-neck');
    const r = (k.snittHals || 0.05) * (1 - (k.d.slank ?? 0) * 0.1);
    const col = new THREE.Color();
    k.color(k.d.hetteOppe ? 'hette' : 'hud', col).multiplyScalar(0.88);
    const N = 10;
    const levels: [number, number, number][] = [
        [topY, cz, 1],
        [neck.y + (topY - neck.y) * 0.4, (cz + neck.z) / 2, 0.5],
        [neck.y - 0.02, neck.z, 0],
    ];
    const rings = levels.map(([y, z, w]) => {
        const ring: number[] = [];
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            const p = new THREE.Vector3(Math.sin(a) * r, y, z + Math.cos(a) * r * 0.95);
            ring.push(k.vert(p, col, [[headI, w], [neckI, 1 - w]]));
        }
        return ring;
    });
    k.tube(rings, true);
}

/** Hva et punkt på hodet er (retning fra midten, ansiktet mot +z): hud, hår, skjegg, hette. */
function hodeDel(k: Kropp, dir: THREE.Vector3): [Del, number, number] {
    const d = k.d;
    const hette = d.hetteOppe;
    const ansikt = dir.z > 0.2 && Math.abs(dir.x) < 0.78 && dir.y < (hette ? 0.4 : 0.42) && (!hette || dir.y > -0.88);
    // Skjegget: under nesa og langs kjeven, med bart. Leppene holdes fri.
    const kjeve = dir.y < -0.42 + 0.25 * smooth(-dir.z, -0.2, 0.3) && dir.z > -0.3;
    if (d.skjegg !== undefined && kjeve && (ansikt || !hette)) {
        const lepper = Math.abs(dir.y + 0.62) < 0.045 && Math.abs(dir.x) < 0.2;
        if (!lepper) return ['skjegg', 0.008 + 0.006 * smooth(-dir.y, 0.6, 0.9), 1];
    }
    if (ansikt) return ['hud', 0, 1];
    if (hette) return ['hette', 0.026 + 0.01 * Math.max(0, dir.y), 1];
    // Kort hår: over ørene på sidene, ned i nakken bak.
    const haar = dir.y > 0.05 || (dir.z < -0.3 && dir.y > -0.55) || (dir.z > 0.2 && dir.y > 0.35);
    if (haar) return ['haar', 0.012 + 0.012 * Math.max(0, dir.y), 1];
    return ['hud', 0, 0.96];
}

/** Et øre: en liten skål på siden av hodet, litt bak midten. */
function ore(k: Kropp, side: number, c0: THREE.Vector3, RX: number, RY: number): void {
    const headI = k.bone('DEF-head');
    const c = new THREE.Color(k.d.hud).multiplyScalar(0.9);
    const mid = c0.clone().add(new THREE.Vector3(side * RX * 0.97, -RY * 0.1, -RX * 0.08));
    const m = k.vert(mid.clone().add(new THREE.Vector3(side * 0.006, 0, 0)), c, [[headI, 1]]);
    const ring: number[] = [];
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const y = Math.sin(a) * 0.03;
        const z = Math.cos(a) * 0.019;
        // Bakkanten står ut fra hodet, framkanten ligger inntil.
        const out = 0.012 + 0.01 * Math.max(0, -Math.cos(a));
        ring.push(k.vert(mid.clone().add(new THREE.Vector3(side * out, y, z)), c, [[headI, 1]]));
    }
    for (let i = 0; i < 8; i++) k.index.push(m, ring[i], ring[(i + 1) % 8]);
}

/**
 * Ansiktet: øyne med hvitt og iris, bryn, nese og munn, lagt like foran huden på det nye
 * hodet. Nesa er en liten kile, så den kaster skygge og ansiktet får en midte.
 */
export function ansikt(k: Kropp, [t0, t1]: [number, number]): void {
    const headI = k.bone('DEF-head');
    const s = k.d.hode ?? 1;
    const R = k.headR;
    const c0 = k.headC;
    const hud = new THREE.Color(k.d.hud);
    const hvit = new THREE.Color(0xe6ddd0);
    const iris = new THREE.Color(0x3a3024);
    const bryn = new THREE.Color(k.d.haar).multiplyScalar(0.6);
    const munn = hud.clone().multiplyScalar(0.6).lerp(new THREE.Color(0x8a3a32), 0.4);
    // Huden foran punktet (x, y): kast en stråle langs z mot hodets trekanter.
    const P = k.pos;
    const front = (x: number, y: number) => {
        let z = -1;
        for (let t = t0; t < t1; t += 3) {
            const [a, b, c] = [k.index[t] * 3, k.index[t + 1] * 3, k.index[t + 2] * 3];
            if (P[a + 2] < c0.z || P[b + 2] < c0.z || P[c + 2] < c0.z) continue;
            const den = (P[b + 1] - P[c + 1]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 1] - P[c + 1]);
            if (Math.abs(den) < 1e-12) continue;
            const u = ((P[b + 1] - P[c + 1]) * (x - P[c]) + (P[c] - P[b]) * (y - P[c + 1])) / den;
            const w = ((P[c + 1] - P[a + 1]) * (x - P[c]) + (P[a] - P[c]) * (y - P[c + 1])) / den;
            if (u < 0 || w < 0 || u + w > 1) continue;
            z = Math.max(z, u * P[a + 2] + w * P[b + 2] + (1 - u - w) * P[c + 2]);
        }
        return z;
    };
    const v = (x: number, y: number, z: number, c: THREE.Color) => k.vert(new THREE.Vector3(x, y, z), c, [[headI, 1]]);
    /** En flat ellipse (åtte kanter) like foran huden. */
    const flekk = (x: number, y: number, w: number, h: number, ut: number, c: THREE.Color) => {
        const z = front(x, y);
        if (z < 0) return;
        const mid = v(x, y, z + ut, c);
        const ring: number[] = [];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const px = x + Math.cos(a) * w;
            const py = y + Math.sin(a) * h;
            ring.push(v(px, py, Math.max(front(px, py), z - 0.01) + ut * 0.7, c));
        }
        for (let i = 0; i < 8; i++) k.index.push(mid, ring[i], ring[(i + 1) % 8]);
    };
    const eyeY = c0.y + R * 0.02;
    for (const side of [-1, 1]) {
        const x = side * R * 0.29;
        flekk(x, eyeY, 0.0125 * s, 0.0065 * s, 0.0025, hvit);
        flekk(x - side * 0.001, eyeY - 0.0005, 0.0072 * s, 0.0068 * s, 0.004, iris);
        flekk(x + side * 0.002, eyeY + 0.021 * s, 0.018 * s, 0.0042 * s, 0.0035, bryn);
    }
    // Nesa: fra mellom øynene og ned, tuppen et par centimeter ut.
    const nTop = eyeY - 0.004;
    const nTip = c0.y - R * 0.3;
    const zTop = front(0, nTop);
    const zTip = front(0, nTip);
    if (zTop > 0 && zTip > 0) {
        const nc = hud.clone().multiplyScalar(0.98);
        const top = v(0, nTop, zTop + 0.003, nc);
        const tip = v(0, nTip + 0.004, zTip + 0.024 * s, nc);
        const l = v(-0.016 * s, nTip - 0.004, front(-0.016 * s, nTip) + 0.002, nc);
        const r = v(0.016 * s, nTip - 0.004, front(0.016 * s, nTip) + 0.002, nc);
        const bunn = v(0, nTip - 0.009, zTip + 0.006, hud.clone().multiplyScalar(0.78));
        k.index.push(top, l, tip, top, tip, r, l, bunn, tip, tip, bunn, r);
    }
    flekk(0, c0.y - R * 0.52, 0.018 * s, 0.0035 * s, 0.003, munn);
}
