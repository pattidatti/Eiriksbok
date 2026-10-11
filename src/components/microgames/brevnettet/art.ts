// Kunsten i Brevnettet: figurene som trappetrinn (piksel-rutenett -> 3D-klosser) og teksturene
// til veven, gløden, brevene og garnet. Alt lages én gang ved oppstart, ingen nedlastinger.

import * as THREE from 'three';
import { mergeParts, type Part } from '../kit';
import { FARGE } from './view';
import { tegnTrapp } from './trappeskrift';

const boks = new THREE.BoxGeometry(1, 1, 1);

/**
 * Et rutenett av tegn blir én geometri: hver sammenhengende rad av samme tegn blir en kloss.
 * `farger` sier fargen per tegn, `dybde` hvor langt ut fra veven tegnet står (som innslag
 * som ligger oppå hverandre). Midten av rutenettet ligger i origo, bunnen av klossene i z = 0.
 */
export function pikselGeo(
    rader: string[],
    farger: Record<string, string>,
    celle: number,
    dybde: Record<string, number>
) {
    const h = rader.length;
    const w = Math.max(...rader.map((r) => r.length));
    const deler: Part[] = [];
    rader.forEach((rad, r) => {
        let k = 0;
        while (k < rad.length) {
            const c = rad[k];
            let n = 1;
            while (k + n < rad.length && rad[k + n] === c) n++;
            if (farger[c]) {
                const d = dybde[c] ?? 0.1;
                deler.push({
                    geometry: boks,
                    position: [(k + n / 2 - w / 2) * celle, (h / 2 - r - 0.5) * celle, d / 2],
                    scale: [n * celle, celle * 1.02, d],
                    color: farger[c],
                });
            }
            k += n;
        }
    });
    return mergeParts(deler);
}

// ---------- Figurene (trappetrinn, slik de vevdes) ----------

const HUS = [
    '....r....',
    '...rrr...',
    '..rrrrr..',
    '.rrrrrrr.',
    'rrrrrrrrr',
    '.wwwwwww.',
    '.wvvwwww.',
    '.wvvwddw.',
    '.wwwwddw.',
];

/** Den tente stua: krapprødt tak, gul vegg, lyst vindu. */
export const husTentGeo = () =>
    pikselGeo(HUS, { r: FARGE.rød, w: FARGE.gul, v: '#fff4c8', d: '#6b3a22' }, 0.15, {
        r: 0.16,
        w: 0.12,
        v: 0.14,
        d: 0.13,
    });

/** Den mørke stua: ufarget brun ull, mørkt vindu. */
export const husMørkGeo = () =>
    pikselGeo(HUS, { r: '#6e5644', w: '#8f7660', v: '#3a2a1e', d: '#5e4836' }, 0.15, {
        r: 0.12,
        w: 0.1,
        v: 0.1,
        d: 0.1,
    });

/** Åttebladrosa: to kvadrater (et rett, et på skrå) med bladårer, rødt i midten. */
function roseRader(n = 6) {
    const rader: string[] = [];
    for (let y = -n; y <= n; y++) {
        let rad = '';
        for (let x = -n; x <= n; x++) {
            const ax = Math.abs(x);
            const ay = Math.abs(y);
            const kvadrat = ax <= n - 2 && ay <= n - 2;
            const skrå = ax + ay <= n;
            let c = '.';
            if (kvadrat || skrå) c = 'y';
            const åre = (x === 0 || y === 0 || ax === ay) && ax + ay > 2;
            if (åre && c === 'y') c = '.';
            if (ax + ay <= 2) c = 'r';
            if (ax + ay === 0) c = 'i';
            rad += c;
        }
        rader.push(rad);
    }
    return rader;
}

export const roseGeo = () =>
    pikselGeo(roseRader(), { y: FARGE.gul, r: FARGE.rød, i: FARGE.indigo }, 0.15, {
        y: 0.04,
        r: 0.06,
        i: 0.07,
    });

const HAUGE = [
    '..kkkkk..',
    '..kkkkk..',
    '..kkkkk..',
    'kkkkkkkkk',
    '...fff...',
    '...fff...',
    '..iiiii..',
    '.iiiiiii.',
    'iiinynii.',
    'i.nyyyn.i',
    'i.iyyyi.i',
    '..iiiii..',
    '..iiiii..',
    '..ii.ii..',
    '..kk.kk..',
];

/** Hauge forfra: svart hatt, indigo frakk, strikkepinner og garn i hendene. */
export const haugeGeo = () =>
    pikselGeo(
        HAUGE,
        { k: FARGE.svart, f: '#e8c9a4', i: '#3d64a8', n: '#c9a46a', y: FARGE.gul },
        0.14,
        { k: 0.16, f: 0.14, i: 0.14, n: 0.2, y: 0.2 }
    );

const RYTTER = [
    '..........TTT.......',
    '.......kkk.t........',
    '......kkkkkt........',
    '.......fff.t........',
    '..s...cccccc...hhh..',
    '...s.ccbcccc..hhhhh.',
    '....sccbccc..hhhhhh.',
    '.....cccccc.hhh..hh.',
    '......cccc.hhhh.....',
    '......cccchhhhh.....',
    '..hhhhhkkhhhhhh.....',
    '.hhhhhhkkhhhhhh.....',
    'h..hhhhkkhhhhhh.....',
    'h..hh........hh.....',
    '...h.h......h.h.....',
    '...h.h......h.h.....',
    '..kk.kk....kk.kk....',
];

/** Lensmannen: en stiv billedvev-rytter i krapprødt, med sabel og stempelstang. */
export const rytterGeo = () =>
    pikselGeo(
        RYTTER,
        {
            h: FARGE.rød,
            c: '#7c1f1a',
            b: FARGE.gul,
            k: FARGE.svart,
            f: '#e8c9a4',
            s: FARGE.ull,
            t: '#8a6a44',
            T: FARGE.svart,
        },
        0.11,
        { h: 0.16, c: 0.2, b: 0.22, k: 0.18, f: 0.2, s: 0.24, t: 0.22, T: 0.26 }
    );

// ---------- Teksturer ----------

function lerret(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return { c, ctx: c.getContext('2d')! };
}

/** Enkel deterministisk støy, så veven ser lik ut hver gang. */
function støy(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/** Bord med trappe-ruter (rhomber) og tagger, slik åklærne har langs kanten. */
function bord(ctx: CanvasRenderingContext2D, y: number, w: number, h: number) {
    ctx.fillStyle = FARGE.indigo;
    ctx.fillRect(0, y, w, h);
    ctx.fillStyle = FARGE.rød;
    ctx.fillRect(0, y, w, 6);
    ctx.fillRect(0, y + h - 6, w, 6);
    const c = 4;
    const midt = y + h / 2;
    for (let x0 = 0; x0 < w; x0 += 40) {
        for (let k = -4; k <= 4; k++) {
            const hw = (4 - Math.abs(k)) * c;
            ctx.fillStyle = FARGE.gul;
            ctx.fillRect(x0 + 20 - hw, midt + k * c - c / 2, hw * 2, c);
            if (Math.abs(k) < 2) {
                ctx.fillStyle = FARGE.rød;
                ctx.fillRect(x0 + 20 - c, midt + k * c - c / 2, c * 2, c);
            }
        }
    }
}

/** Tagger (sagtenner) langs sidekanten. */
function tagger(ctx: CanvasRenderingContext2D, x: number, h: number, retning: 1 | -1) {
    const c = 4;
    for (let y0 = 0; y0 < h; y0 += 24) {
        for (let k = 0; k < 6; k++) {
            ctx.fillStyle = k < 2 ? FARGE.rød : k < 4 ? FARGE.gul : FARGE.rød;
            const len = (6 - k) * c;
            ctx.fillRect(retning > 0 ? x : x - len, y0 + k * c, len, c);
        }
    }
}

export const VEV_PX = { w: 1024, h: 576 };

/**
 * Vevgrunnen: naturhvit ull med renning (loddrett) og innslag (vannrett), bord oppe og nede,
 * tagger på sidene og små rhomber i feltet. Normalkartet lages fra samme tegning, så
 * talglyset kaster små skygger i trådene.
 */
export function vevTeksturer() {
    const { w, h } = VEV_PX;
    const { c, ctx } = lerret(w, h);
    const r = støy(7);
    ctx.fillStyle = '#f1ebdd';
    ctx.fillRect(0, 0, w, h);
    // Små fyllmotiver (rhomber) i feltet, svakt.
    ctx.fillStyle = 'rgba(122,100,80,0.10)';
    for (let gy = 90; gy < h - 70; gy += 56)
        for (let gx = 50 + ((gy / 56) % 2) * 28; gx < w - 40; gx += 56)
            for (let k = -2; k <= 2; k++) {
                const hw = (2 - Math.abs(k)) * 3 + 1;
                ctx.fillRect(gx - hw, gy + k * 3, hw * 2, 3);
            }
    // Ujevn ull: litt variasjon fra innslag til innslag.
    for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = `rgba(90,70,50,${0.02 + r() * 0.05})`;
        ctx.fillRect(0, y, w, 1);
    }
    const bordH = Math.round(h * 0.085);
    bord(ctx, 0, w, bordH);
    bord(ctx, h - bordH, w, bordH);
    // Sidebordene: smale indigo striper med røde og gule tagger innover.
    const side = 22;
    ctx.fillStyle = FARGE.indigo;
    ctx.fillRect(0, 0, side, h);
    ctx.fillRect(w - side, 0, side, h);
    tagger(ctx, side, h, 1);
    tagger(ctx, w - side, h, -1);
    // Initialene vevd inn nederst til høyre, som i ekte åklær.
    tegnTrapp(ctx, 'H N H', w - 120, h - bordH / 2 - 10, 3, FARGE.ull);

    // Renningen og innslaget: høyde for normalkartet, mørke riller for fargen.
    const høyde = new Float32Array(w * h);
    const data = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const renning = 0.5 + 0.5 * Math.cos((x / 4) * Math.PI * 2);
            const innslag = 0.5 + 0.5 * Math.cos((y / 3) * Math.PI * 2 + (x % 8 < 4 ? 0 : Math.PI));
            const v = renning * 0.55 + innslag * 0.45;
            høyde[y * w + x] = v;
            const i = (y * w + x) * 4;
            const mørk = 0.84 + 0.16 * v;
            data.data[i] *= mørk;
            data.data[i + 1] *= mørk;
            data.data[i + 2] *= mørk;
        }
    ctx.putImageData(data, 0, 0);

    const n = lerret(w, h);
    const nd = n.ctx.createImageData(w, h);
    const styrke = 2.2;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const hx = høyde[y * w + Math.min(w - 1, x + 1)] - høyde[y * w + Math.max(0, x - 1)];
            const hy = høyde[Math.min(h - 1, y + 1) * w + x] - høyde[Math.max(0, y - 1) * w + x];
            const nx = -hx * styrke;
            const ny = hy * styrke;
            const l = Math.hypot(nx, ny, 1);
            const i = (y * w + x) * 4;
            nd.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
            nd.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
            nd.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
            nd.data[i + 3] = 255;
        }
    n.ctx.putImageData(nd, 0, 0);

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const normalMap = new THREE.CanvasTexture(n.c);
    return { map, normalMap, bordAndel: bordH / h };
}

/** Rund, myk glød (lagt på med additiv blanding). */
export function glødTekstur() {
    const { c, ctx } = lerret(64, 64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Et lite brettet brev med rødt segl. */
export function brevTekstur() {
    const { c, ctx } = lerret(64, 44);
    ctx.fillStyle = FARGE.ull;
    ctx.fillRect(2, 2, 60, 40);
    ctx.strokeStyle = 'rgba(43,30,22,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 60, 40);
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(32, 24);
    ctx.lineTo(62, 2);
    ctx.stroke();
    ctx.fillStyle = FARGE.rød;
    ctx.fillRect(26, 18, 12, 12);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Tvunnet garn: skrå striper langs tråden. Fargen kommer fra hver tråd. */
export function garnTekstur() {
    const { c, ctx } = lerret(32, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 5;
    for (let k = -32; k < 64; k += 10) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k + 32, 32);
        ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 3);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Tømmerveggen i stua bak veven: liggende stokker, rødbrune i talglyset. */
export function tømmerTekstur() {
    const { c, ctx } = lerret(256, 256);
    const r = støy(3);
    for (let y = 0; y < 256; y += 32) {
        const g = ctx.createLinearGradient(0, y, 0, y + 32);
        g.addColorStop(0, '#b4552c');
        g.addColorStop(0.5, '#963f1e');
        g.addColorStop(1, '#5e2410');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, 256, 32);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let k = 0; k < 12; k++) ctx.fillRect(r() * 256, y + 4 + r() * 24, 20 + r() * 50, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 3);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
