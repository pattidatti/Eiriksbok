// Teksturene i Underskriftsrittet, malt på canvas én gang ved oppstart og gjenbrukt:
// kistelokket (bakken med akantusranker), lyspølen, lakkseglet, blomstene i tun-ringen,
// lunta og merket på døra. Ingen bildefiler, ingen nedlasting.

import * as THREE from 'three';
import { FARGE } from './palette';

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

/** En akantusranke: en S-bue med C-bøyer og kalkhvite høylys-strøk, som på en kiste. */
function ranke(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    a: number,
    farge: string,
    høylys: string
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = farge;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.bezierCurveTo(-20, -30, 20, 30, 40, -10);
    ctx.stroke();
    // C-bøyer som krøller seg ut fra stengelen
    for (const [cx, cy, r, f] of [
        [-28, -4, 12, 1],
        [2, 4, 10, -1],
        [30, -12, 9, 1],
    ] as const) {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(
            cx,
            cy + f * 8,
            r,
            f > 0 ? Math.PI * 0.9 : -Math.PI * 0.1,
            f > 0 ? Math.PI * 2.2 : Math.PI * 1.2
        );
        ctx.stroke();
    }
    ctx.strokeStyle = høylys;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-36, 4);
    ctx.bezierCurveTo(-18, -26, 16, 22, 34, -14);
    ctx.stroke();
    ctx.restore();
}

let grunnCache: THREE.CanvasTexture | null = null;
/** Bakken: mørk blågrønn grunn med synlige penselstrøk og svake ranker, som et kistelokk. */
export function grunnTekstur(): THREE.CanvasTexture {
    if (grunnCache) return grunnCache;
    const S = 512;
    const { c, ctx } = lagCanvas(S, S);
    const r = frø(17);
    ctx.fillStyle = FARGE.grunn;
    ctx.fillRect(0, 0, S, S);
    // Penselstrøk i to toner
    for (let i = 0; i < 260; i++) {
        const x = r() * S;
        const y = r() * S;
        const l = 20 + r() * 60;
        ctx.strokeStyle = r() < 0.5 ? FARGE.grunnMørk : FARGE.strøk;
        ctx.globalAlpha = 0.25 + r() * 0.3;
        ctx.lineWidth = 3 + r() * 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + l * 0.5, y + (r() - 0.5) * 16, x + l, y + (r() - 0.5) * 10);
        ctx.stroke();
    }
    // Ranker, også over kantene så teksturen går i ett når den gjentas
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 9; i++) {
        const x = r() * S;
        const y = r() * S;
        const s = 0.9 + r() * 0.8;
        const a = r() * Math.PI * 2;
        for (const [ox, oy] of [
            [0, 0],
            [S, 0],
            [-S, 0],
            [0, S],
            [0, -S],
        ])
            ranke(ctx, x + ox, y + oy, s, a, FARGE.skog, 'rgba(241,231,204,0.35)');
    }
    // Korn
    ctx.globalAlpha = 1;
    const img = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < img.data.length; i += 4) {
        const n = (r() - 0.5) * 14;
        img.data[i] += n;
        img.data[i + 1] += n;
        img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    grunnCache = tekstur(c, true);
    return grunnCache;
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
