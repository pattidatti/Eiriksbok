// Hjelperne bak reglene: terreng, navnestrømmen, hvem lykta ser, presset og rangen.
// Ren TypeScript uten tilstand.

import { BRETT, type Brett } from './levels';
import { TUNING } from './tuning';

const T = TUNING;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const dist = (ax: number, az: number, bx: number, bz: number) =>
    Math.hypot(ax - bx, az - bz);

/** Vinkel fra a til b, pakket inn i (-pi, pi]. */
export function vinkelDiff(a: number, b: number): number {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
}

function avstandTilStykke(px: number, pz: number, a: [number, number], b: [number, number]) {
    const vx = b[0] - a[0];
    const vz = b[1] - a[1];
    const l2 = vx * vx + vz * vz || 1;
    const k = clamp(((px - a[0]) * vx + (pz - a[1]) * vz) / l2, 0, 1);
    return dist(px, pz, a[0] + vx * k, a[1] + vz * k);
}

export function påVei(b: Brett, x: number, z: number): boolean {
    for (let i = 0; i + 1 < b.vei.length; i++)
        if (avstandTilStykke(x, z, b.vei[i], b.vei[i + 1]) < T.hest.veiBredde) return true;
    return false;
}

export function påÅs(b: Brett, x: number, z: number): boolean {
    return b.åser.some(([ax, az, r]) => dist(x, z, ax, az) < r);
}

/** Hvor høyt åsen er på et punkt (kuppelen er flatet til 30 %), så hesten rir oppå den. */
export function åsHøyde(b: Brett, x: number, z: number): number {
    let y = 0;
    for (const [ax, az, r] of b.åser) {
        const d = dist(x, z, ax, az);
        if (d < r) y = Math.max(y, 0.3 * Math.sqrt(r * r - d * d));
    }
    return y;
}

/** Fartsfaktoren der hesten står: landeveien er rask, åsen er tung. */
export function terreng(b: Brett, x: number, z: number): number {
    if (påÅs(b, x, z)) return T.hest.ås;
    // Landeveien gir fart på etappene mellom bygdene, men ikke inne på tunet (der rir du sakte).
    if (påVei(b, x, z) && !b.bygder.some((t) => dist(x, z, t.x, t.z) < T.tun.radius + 1))
        return T.hest.vei;
    return 1;
}

/** 0 i skritt, 1 i full galopp. */
export function galoppAndel(fart: number): number {
    return clamp((fart - T.hest.skritt) / (T.hest.galopp - T.hest.skritt), 0, 1);
}

/** Navn per sekund mens du leser klagen høyt: strømmen vokser jo lenger du holder. */
export function navneFart(ropT: number): number {
    return Math.min(T.rop.maks, T.rop.fart + T.rop.vekst * ropT);
}

/** Ser lykta hesten? På åsen ser den deg bare når den er nær. */
export function ser(b: Brett, lx: number, lz: number, hx: number, hz: number, rekkevidde: number) {
    const d = dist(lx, lz, hx, hz);
    if (d > rekkevidde) return false;
    return !påÅs(b, hx, hz) || d < T.lykt.serPåÅs;
}

/** Presset 0-1: lykter nær deg, fangstringen, måneden og hvor langt i rittet du er. */
export function pressFra(brett: number, lykterNær: number, fangst: number, månedAndel: number) {
    return clamp(
        0.12 * brett + 0.33 * Math.min(1, lykterNær / 5) + 0.25 * fangst + 0.18 * månedAndel,
        0,
        1
    );
}

export function rang(poeng: number): string {
    let r = T.ranger[0][1];
    for (const [p, navn] of T.ranger) if (poeng >= p) r = navn;
    return r;
}

export const SISTE_BRETT = BRETT.length - 1;
