// Teksturene i Underskriftsrittet, malt på canvas én gang ved oppstart og gjenbrukt:
// landet (eng, lyng og åker), lyspølen, lakkseglet, blomstene i tun-ringen,
// lunta og merket på døra. Ingen bildefiler, ingen nedlasting.

import * as THREE from 'three';
import { FARGE } from './palette';
import { BRETT, type Klage } from './levels';

export const TITTEL_FONT = '"Grenze Gotisch", Georgia, serif';
export const TEKST_FONT = '"Alegreya Sans", "Trebuchet MS", sans-serif';

function lagCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return { c, ctx: c.getContext('2d')! };
}

function tekstur(c: HTMLCanvasElement, gjenta = false) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (gjenta) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Fast tilfeldighet, så kistelokket ser likt ut hver gang. */
function frø(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a * 1664525 + 1013904223) >>> 0;
        return a / 4294967296;
    };
}

let glødCache: THREE.CanvasTexture | null = null;
/** Lyspølen: gyllen midte som blekner, med en tydelig ytre kant der lyset slutter. */
export function glødTekstur(): THREE.CanvasTexture {
    if (glødCache) return glødCache;
    const S = 256;
    const { c, ctx } = lagCanvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,214,140,1)');
    g.addColorStop(0.35, 'rgba(255,170,70,0.75)');
    g.addColorStop(0.72, 'rgba(240,120,24,0.45)');
    g.addColorStop(0.78, 'rgba(240,120,24,0.15)');
    g.addColorStop(1, 'rgba(240,120,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    glødCache = tekstur(c);
    return glødCache;
}

let seglCache: THREE.CanvasTexture | null = null;
/** Lakkseglet: rødt voks med en krone og en L, og ujevn kant. */
export function seglTekstur(): THREE.CanvasTexture {
    if (seglCache) return seglCache;
    const S = 256;
    const { c, ctx } = lagCanvas(S, S);
    const r = frø(5);
    ctx.fillStyle = FARGE.blod;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const rr = 118 + (r() - 0.5) * 12;
        const x = S / 2 + Math.cos(a) * rr;
        const y = S / 2 + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.strokeStyle = '#7a221c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, 82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = FARGE.blodLys;
    // Krona
    ctx.beginPath();
    ctx.moveTo(84, 110);
    ctx.lineTo(96, 70);
    ctx.lineTo(112, 96);
    ctx.lineTo(128, 62);
    ctx.lineTo(144, 96);
    ctx.lineTo(160, 70);
    ctx.lineTo(172, 110);
    ctx.closePath();
    ctx.fill();
    ctx.font = `700 92px ${TITTEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', S / 2, 160);
    seglCache = tekstur(c);
    return seglCache;
}

let blomstCache: THREE.CanvasTexture | null = null;
/** En rosemalt tulipan i rødt og oker med kalkhvite strøk: blomstrer i ringen for hvert navn. */
export function blomstTekstur(): THREE.CanvasTexture {
    if (blomstCache) return blomstCache;
    const S = 128;
    const { c, ctx } = lagCanvas(S, S);
    ctx.translate(S / 2, S / 2);
    for (let k = 0; k < 5; k++) {
        ctx.save();
        ctx.rotate((k / 5) * Math.PI * 2);
        ctx.fillStyle = k % 2 ? FARGE.blodLys : FARGE.gull;
        ctx.beginPath();
        ctx.ellipse(0, -30, 16, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = FARGE.kalk;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -30, 10, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle = FARGE.blekk;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = FARGE.kalk;
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    blomstCache = tekstur(c);
    return blomstCache;
}

let lunteCache: THREE.CanvasTexture | null = null;
/** Lunta: korte streker som gjentas langs veien fogdens mann går. */
export function lunteTekstur(): THREE.CanvasTexture {
    if (lunteCache) return lunteCache;
    const { c, ctx } = lagCanvas(64, 16);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(4, 3, 34, 10, 5);
    ctx.fill();
    lunteCache = tekstur(c);
    lunteCache.wrapS = THREE.RepeatWrapping;
    return lunteCache;
}

let merkeCache: THREE.CanvasTexture | null = null;
/** Det malte merket på døra (Klageboka): en kalkhvit sirkel med kornband og penn. */
export function merkeTekstur(): THREE.CanvasTexture {
    if (merkeCache) return merkeCache;
    const S = 128;
    const { c, ctx } = lagCanvas(S, S);
    ctx.fillStyle = FARGE.kalk;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = FARGE.gull;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = FARGE.blod;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (const a of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(S / 2, 100);
        ctx.quadraticCurveTo(S / 2 + a * 30, 60, S / 2 + a * 44, 28);
        ctx.stroke();
    }
    ctx.strokeStyle = FARGE.blekk;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(40, 76);
    ctx.lineTo(88, 76);
    ctx.stroke();
    merkeCache = tekstur(c);
    return merkeCache;
}

// ---------------------------------------------------------------------------------------------
// Landet: eng, lyng og åker rundt hver bygd, malt for hele brettet på ett lerret (ingen gjentak).

/** Hvor stort landlerretet er i meter (samme som bakkeflaten i `Bakke`). */
export const LAND_M = 130;
const landCache = new Map<number, THREE.CanvasTexture>();

/** Bakken i et brett: eng med gresstuster, lyngflekker og åkerlapper rundt bygdene. */
export function landTekstur(brett: number): THREE.CanvasTexture {
    const hit = landCache.get(brett);
    if (hit) return hit;
    const b = BRETT[brett];
    const S = 2048;
    const k = S / LAND_M;
    const px = (m: number) => (m + LAND_M / 2) * k;
    const { c, ctx } = lagCanvas(S, S);
    const r = frø(41 + brett * 13);
    const nærTun = (x: number, z: number, d: number) =>
        b.bygder.some((t) => Math.hypot(x - t.x, z - t.z) < d);

    // Enga: grunnfarge og store, myke flekker i lysere og mørkere grønt.
    ctx.fillStyle = FARGE.eng;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 420; i++) {
        ctx.globalAlpha = 0.18 + r() * 0.2;
        ctx.fillStyle = r() < 0.5 ? FARGE.engLys : FARGE.engMørk;
        ctx.beginPath();
        ctx.ellipse(r() * S, r() * S, 20 + r() * 70, 14 + r() * 50, r() * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Lyngen: lilla-brune flekker med prikker, mest ute i kanten og rundt åsene.
    const lyng = (x: number, z: number, rad: number) => {
        const cx = px(x);
        const cz = px(z);
        const R = rad * k;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = FARGE.lyng;
        for (let n = 0; n < 7; n++) {
            ctx.beginPath();
            ctx.ellipse(
                cx + (r() - 0.5) * R,
                cz + (r() - 0.5) * R,
                R * (0.35 + r() * 0.4),
                R * (0.25 + r() * 0.35),
                r() * 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        for (let n = 0; n < rad * rad * 9; n++) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = r() < 0.5 ? FARGE.lyngLys : FARGE.lyngMørk;
            const a = r() * Math.PI * 2;
            const d = Math.sqrt(r()) * R * 0.75;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 2 + r() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    for (let i = 0; i < 30; i++) {
        const x = (r() * 2 - 1) * (LAND_M / 2 - 4);
        const z = (r() * 2 - 1) * (LAND_M / 2 - 4);
        if (nærTun(x, z, 9)) continue;
        lyng(x, z, 2 + r() * 2.5);
    }
    for (const [x, z, rad] of b.åser) lyng(x, z, rad + 1.5);

    // Åkrene: tre-fire lapper rundt hvert tun, pløyd jord eller gul stubb med furer.
    for (const t of b.bygder) {
        const n = 3 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + r() * 0.8;
            const d = 7.4 + r() * 3.2;
            const x = t.x + Math.cos(a) * d;
            const z = t.z + Math.sin(a) * d;
            const w = (3.6 + r() * 2.6) * k;
            const h = (2.6 + r() * 1.8) * k;
            const pløyd = r() < 0.45;
            ctx.save();
            ctx.translate(px(x), px(z));
            ctx.rotate(a + Math.PI / 2 + (r() - 0.5) * 0.4);
            ctx.globalAlpha = 1;
            ctx.fillStyle = pløyd ? FARGE.åkerPløyd : FARGE.åker;
            ctx.strokeStyle = FARGE.åkerKant;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.rect(-w / 2, -h / 2, w, h);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = 0.55;
            ctx.strokeStyle = pløyd ? FARGE.åkerKant : '#8e7a3e';
            ctx.lineWidth = 3;
            for (let fy = -h / 2 + 7; fy < h / 2 - 3; fy += 10) {
                ctx.beginPath();
                ctx.moveTo(-w / 2 + 4, fy);
                ctx.lineTo(w / 2 - 4, fy);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // Gresstuster og noen små blomster, så enga har korn på nært hold.
    ctx.lineCap = 'round';
    for (let i = 0; i < 9000; i++) {
        const x = r() * S;
        const y = r() * S;
        const l = 4 + r() * 6;
        ctx.globalAlpha = 0.35 + r() * 0.3;
        ctx.strokeStyle = r() < 0.7 ? FARGE.engMørk : FARGE.engLys;
        ctx.lineWidth = 1.6 + r() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x - l * 0.4, y - l);
        ctx.lineTo(x, y);
        ctx.lineTo(x + l * 0.4, y - l);
        ctx.stroke();
    }
    for (let i = 0; i < 700; i++) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = r() < 0.6 ? FARGE.kalk : FARGE.gull;
        ctx.beginPath();
        ctx.arc(r() * S, r() * S, 2 + r() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    const t = tekstur(c);
    landCache.set(brett, t);
    return t;
}

// ---------------------------------------------------------------------------------------------
// Klagene: et lite malt ikon for hver (på skiltet over tunet og i klagebrevet).

/** Tegner klage-ikonet i en kalkhvit medaljong med sentrum (cx, cy) og radius R. */
export function tegnKlage(
    ctx: CanvasRenderingContext2D,
    klage: Klage,
    cx: number,
    cy: number,
    R: number
) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(R / 50, R / 50);
    ctx.globalAlpha = 1;
    ctx.fillStyle = FARGE.kalk;
    ctx.strokeStyle = FARGE.blekk;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (klage === 'gebyr') {
        // Myntstabel: embetsmennenes gebyrer.
        for (let i = 3; i >= 0; i--) {
            ctx.fillStyle = i % 2 ? FARGE.gull : '#e8bf5c';
            ctx.beginPath();
            ctx.ellipse(-8, 22 - i * 11, 22, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = FARGE.gull;
        ctx.beginPath();
        ctx.ellipse(20, 6, 11, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, -4);
        ctx.lineTo(20, 16);
        ctx.stroke();
    } else if (klage === 'korn') {
        // Kornbånd: kornmonopolet.
        for (const a of [-0.55, -0.27, 0, 0.27, 0.55]) {
            const tx = Math.sin(a) * 34;
            const ty = -Math.cos(a) * 34 + 8;
            ctx.strokeStyle = FARGE.blekk;
            ctx.beginPath();
            ctx.moveTo(0, 34);
            ctx.quadraticCurveTo(tx * 0.3, 0, tx, ty);
            ctx.stroke();
            ctx.fillStyle = FARGE.gull;
            ctx.beginPath();
            ctx.ellipse(tx, ty, 6, 12, a, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = FARGE.blod;
        ctx.fillRect(-12, 12, 24, 8);
        ctx.strokeRect(-12, 12, 24, 8);
    } else {
        // Vekta: byborgerne bestemte prisen på tømmeret.
        ctx.strokeStyle = FARGE.blekk;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.moveTo(-18, 30);
        ctx.lineTo(18, 30);
        ctx.moveTo(-30, -18);
        ctx.lineTo(30, -24);
        ctx.stroke();
        ctx.lineWidth = 3;
        for (const [x, y] of [
            [-30, -18],
            [30, -24],
        ]) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 11, y + 22);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 11, y + 22);
            ctx.stroke();
            ctx.fillStyle = x < 0 ? FARGE.blodLys : FARGE.gull;
            ctx.beginPath();
            ctx.ellipse(x, y + 23, 14, 6, 0, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.restore();
}

const klageBildeCache = new Map<Klage, string>();
/** Klage-ikonet som bilde (data-URL) til HUD-en. */
export function klageBilde(klage: Klage): string {
    const hit = klageBildeCache.get(klage);
    if (hit) return hit;
    try {
        const { c, ctx } = lagCanvas(96, 96);
        tegnKlage(ctx, klage, 48, 48, 46);
        const url = c.toDataURL();
        klageBildeCache.set(klage, url);
        return url;
    } catch {
        return '';
    }
}

/** Lerretskorn: en liten flis med støy, laget én gang. */
export function lagKorn(): string {
    try {
        const c = document.createElement('canvas');
        c.width = c.height = 96;
        const ctx = c.getContext('2d')!;
        const img = ctx.createImageData(96, 96);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 22;
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    } catch {
        return '';
    }
}
