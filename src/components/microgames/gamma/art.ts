// Kunsten som lages én gang: paletten, kvalitetsnivået og bakgrunnen (himmel, nordlys,
// fjell, fjord, bjørkeskog og snøbakken) tegnet til et offscreen-canvas.
// Stilen er John Savios fargetresnitt: svart treskurd, hvite skårne riper, preussisk blå
// natt og flate farger. Ingen blur, ingen gradienter her.

import { bakke } from './rules';
import { TUNING } from './tuning';

export const P = {
    natt: '#14233f',
    nattRipe: '#1f3558',
    blå: '#2f5d8c',
    blåMørk: '#1d3a63',
    snø: '#f1ead9',
    snøSkygge: '#d8d3c4',
    svart: '#111111',
    glød: '#e3a52b',
    fare: '#c23a2b',
    lys: '#f7f3c8',
    ved: '#a8743a',
    vedMørk: '#6b4523',
    torv: '#2a1d14',
    torvLys: '#5a4330',
    nordlys: '#4f9e7c',
    nordlysLys: '#8ccf9c',
    fjord: '#0c1830',
    stein: '#4a4d58',
};

export type Kvalitet = 'lav' | 'middels' | 'hoy';
let kvalitetNå: Kvalitet | null = null;

/** ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. Samme spill på alle nivåer. */
export function kvalitet(): Kvalitet {
    if (kvalitetNå) return kvalitetNå;
    let k: Kvalitet = 'middels';
    if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        const kjerner = navigator.hardwareConcurrency || 4;
        const minne = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
        if (kjerner <= 4 || minne <= 4 || /CrOS/.test(navigator.userAgent)) k = 'lav';
        else if (kjerner >= 8) k = 'hoy';
        if (q === 'lav' || q === 'middels' || q === 'hoy') k = q;
    }
    kvalitetNå = k;
    return k;
}

/** Deterministisk «tilfeldig» tall 0-1 fra et heltall (samme bilde hver gang). */
export function hash(n: number): number {
    let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
}

/** Glatt støy for fjellkammer. */
function støy(x: number): number {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return hash(i) * (1 - s) + hash(i + 1) * s;
}

type Ctx = CanvasRenderingContext2D;

/** En kort, buet knivstrek (riper i treet). */
export function ripe(ctx: Ctx, x: number, y: number, len: number, bue: number, vinkel = 0) {
    const c = Math.cos(vinkel);
    const s = Math.sin(vinkel);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (c * len) / 2 - s * bue, y + (s * len) / 2 + c * bue, x + c * len, y + s * len);
    ctx.stroke();
}

function himmel(ctx: Ctx) {
    ctx.fillStyle = P.natt;
    ctx.fillRect(0, 0, 960, 540);
    // Treets årer: lange, avbrutte linjer i litt lysere blått.
    ctx.strokeStyle = P.nattRipe;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let y = 8, i = 0; y < 420; y += 7, i++) {
        let x = -20 + hash(i * 7) * 60;
        while (x < 960) {
            const len = 30 + hash(i * 31 + x) * 120;
            ctx.beginPath();
            ctx.moveTo(x, y + Math.sin(x * 0.01 + i) * 1.5);
            ctx.lineTo(x + len, y + Math.sin((x + len) * 0.01 + i) * 1.5);
            ctx.stroke();
            x += len + 10 + hash(i * 13 + x) * 70;
        }
    }
    // Stjerner: små skårne kryss.
    ctx.strokeStyle = P.snø;
    for (let i = 0; i < 70; i++) {
        const x = hash(i * 3 + 1) * 960;
        const y = hash(i * 5 + 2) * 330;
        const r = 0.8 + hash(i * 11) * 1.8;
        ctx.lineWidth = r > 2 ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(x - r, y);
        ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r);
        ctx.lineTo(x, y + r);
        ctx.stroke();
    }
}

/** Nordlyset: bånd av skårne loddrette streker som henger fra en buet linje. */
function nordlys(ctx: Ctx) {
    const bånd = [
        { y0: 70, a: 22, f: 0.006, fase: 0.4, x0: 260, x1: 960, len: 70, farge: P.nordlys },
        { y0: 125, a: 16, f: 0.009, fase: 2.1, x0: 560, x1: 960, len: 34, farge: P.nordlysLys },
        { y0: 40, a: 12, f: 0.011, fase: 4.0, x0: 120, x1: 640, len: 34, farge: P.nordlys },
    ];
    ctx.lineCap = 'round';
    bånd.forEach((b, bi) => {
        const yAt = (x: number) => b.y0 + b.a * Math.sin(x * b.f + b.fase) + (x - b.x0) * 0.04;
        ctx.strokeStyle = b.farge;
        for (let x = b.x0; x < b.x1; x += 7) {
            const k = Math.min(1, (x - b.x0) / 80, (b.x1 - x) / 80);
            const l = b.len * k * (0.55 + 0.45 * støy(x * 0.03 + bi * 9));
            if (l < 4) continue;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x, yAt(x));
            ctx.lineTo(x + 3, yAt(x) + l);
            ctx.stroke();
        }
        // Den skårne toppkanten.
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let x = b.x0 + 20; x < b.x1 - 20; x += 8) {
            if (x === b.x0 + 20) ctx.moveTo(x, yAt(x) - 3);
            else ctx.lineTo(x, yAt(x) - 3);
        }
        ctx.stroke();
    });
}

/** En fjellkjede med svart kontur og hvite snøriper ned fra toppene. */
function fjellkjede(
    ctx: Ctx,
    x0: number,
    x1: number,
    bunn: number,
    topp: number,
    frø: number,
    farge: string
) {
    const yAt = (x: number) =>
        topp + (bunn - topp) * (0.35 * støy(x * 0.012 + frø) + 0.65 * støy(x * 0.03 + frø * 3));
    ctx.fillStyle = farge;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, bunn + 20);
    for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, yAt(x));
    ctx.lineTo(x1, bunn + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Snøen på toppene: hvite riper som følger kammen og løper ned i dalsøkkene.
    ctx.strokeStyle = P.snø;
    ctx.lineCap = 'round';
    for (let x = x0 + 8; x < x1 - 8; x += 9) {
        const y = yAt(x);
        const høyde = (bunn - y) / (bunn - topp);
        if (høyde < 0.35) continue;
        ctx.lineWidth = 1.6;
        const l = 6 + høyde * 22 * hash(Math.round(x) + frø);
        ripe(ctx, x, y + 4, l, 2, Math.PI / 2 + (hash(Math.round(x) * 3) - 0.5) * 0.6);
    }
}

function fjord(ctx: Ctx) {
    const y0 = bakke(TUNING.verden.strandX) + 6;
    ctx.fillStyle = P.fjord;
    ctx.fillRect(0, y0, 960, 540 - y0);
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(960, y0);
    ctx.stroke();
    // Bølger: skårne streker, tettere og lysere nær land.
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
        const x = hash(i * 17) * 960;
        const y = y0 + 8 + hash(i * 19) * (540 - y0 - 12);
        ctx.strokeStyle = i % 9 === 0 ? P.nordlys : i % 3 === 0 ? P.snø : P.blå;
        ctx.lineWidth = 1.5;
        ripe(ctx, x, y, 10 + hash(i * 23) * 26, -1.5);
    }
}

/** Bjørk i tresnitt: hvit stamme med svart kontur og svarte hakk, tynne svarte greiner. */
export function bjørk(ctx: Ctx, x: number, y: number, h: number, frø: number, bredde = 5) {
    const lean = (hash(frø) - 0.5) * 0.12;
    const tx = x + lean * h;
    ctx.lineCap = 'round';
    // Greiner først, så stammen ligger over.
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 7; k++) {
        const t = 0.35 + 0.6 * hash(frø * 7 + k);
        const bx = x + (tx - x) * t;
        const by = y - h * t;
        const side = k % 2 ? 1 : -1;
        const l = 8 + 14 * hash(frø * 5 + k) * (1.1 - t);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + side * l * 0.6, by - l * 0.2, bx + side * l, by - l * 0.8);
        ctx.stroke();
    }
    ctx.fillStyle = P.snø;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - bredde / 2, y);
    ctx.lineTo(tx - bredde / 4, y - h);
    ctx.lineTo(tx + bredde / 4, y - h);
    ctx.lineTo(x + bredde / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Svarte hakk i barken.
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 5; k++) {
        const t = 0.1 + 0.8 * hash(frø * 11 + k);
        const bx = x + (tx - x) * t;
        const by = y - h * t;
        ctx.beginPath();
        ctx.moveTo(bx - bredde / 2, by);
        ctx.lineTo(bx + bredde * (hash(k + frø) - 0.2) * 0.5, by - 1);
        ctx.stroke();
    }
}

/** Snøbakken: papirhvit med blå skygger som skårne konturlinjer, tettere nedover. */
function snøbakke(ctx: Ctx) {
    const sx = TUNING.verden.strandX;
    const kant = () => {
        ctx.beginPath();
        ctx.moveTo(0, 560);
        ctx.lineTo(0, bakke(0));
        for (let x = 0; x <= sx + 20; x += 8) ctx.lineTo(x, bakke(x));
        ctx.lineTo(sx + 44, 560);
        ctx.closePath();
    };
    kant();
    ctx.fillStyle = P.snø;
    ctx.fill();
    ctx.save();
    kant();
    ctx.clip();
    // Blå skygge i bånd parallelt med overflaten: glisne knivstrek øverst, tettere nedover,
    // og til slutt et helt blått felt (der kniven ikke har tatt noe).
    ctx.lineCap = 'round';
    const bunn = 250;
    for (let rad = 0; rad < 15; rad++) {
        const dy = 22 + rad * 12;
        const tett = rad / 14;
        ctx.strokeStyle = P.blå;
        ctx.lineWidth = 1.6 + tett * 5;
        let x = -10 + hash(rad * 29) * 60;
        while (x < sx + 40) {
            const len = 14 + hash(rad * 17 + x) * (30 + 110 * tett);
            ctx.beginPath();
            ctx.moveTo(x, bakke(x) + dy);
            for (let xx = x; xx <= x + len; xx += 10) ctx.lineTo(xx, bakke(xx) + dy + Math.sin(xx * 0.05) * 1.5);
            ctx.stroke();
            x += len + (1 - tett) * (40 + hash(rad * 7 + x) * 90) + 8;
        }
    }
    ctx.fillStyle = P.blå;
    ctx.beginPath();
    ctx.moveTo(-10, 560);
    for (let x = -10; x <= sx + 40; x += 10) ctx.lineTo(x, bakke(x) + bunn);
    ctx.lineTo(sx + 40, 560);
    ctx.closePath();
    ctx.fill();
    // Hvite riper i det blå (kniven har tatt bort treet).
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 140; i++) {
        const x = hash(i * 41) * (sx + 20);
        const dy = bunn + 12 + hash(i * 43) * 150;
        ripe(ctx, x, bakke(x) + dy, 8 + hash(i * 47) * 18, -2);
    }
    // Snøfokk-riper på overflaten.
    ctx.strokeStyle = P.snøSkygge;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 60; i++) {
        const x = hash(i * 53) * sx;
        ripe(ctx, x, bakke(x) + 6 + hash(i * 59) * 8, 8 + hash(i * 61) * 12, 1.5, 0.25);
    }
    ctx.restore();
    // Den tykke svarte konturen langs overflaten.
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, bakke(0));
    for (let x = 0; x <= sx + 20; x += 8) ctx.lineTo(x, bakke(x));
    ctx.lineTo(sx + 44, 560);
    ctx.stroke();
}

/** Bjørkeskogen: lav, glissen skog langs lia, og tre bjørker ved hver vedhaug. */
function skog(ctx: Ctx) {
    for (let i = 0; i < 46; i++) {
        const x = 225 + hash(i * 67) * 600;
        if (T_HAUG.some((h) => Math.abs(h - x) < 22)) continue;
        bjørk(ctx, x, bakke(x) + 3, 26 + hash(i * 71) * 30, i + 100, 3.5);
    }
    T_HAUG.forEach((hx, i) => {
        bjørk(ctx, hx - 20, bakke(hx - 20) + 4, 64 + hash(i) * 14, i * 3 + 1, 6);
        bjørk(ctx, hx + 2, bakke(hx + 2) + 4, 82 + hash(i + 9) * 16, i * 3 + 2, 7);
        bjørk(ctx, hx + 22, bakke(hx + 22) + 4, 58 + hash(i + 4) * 12, i * 3 + 3, 5);
    });
}
const T_HAUG = TUNING.haug.map((h) => h.x);

/** Fjellet bak gamma og fjellene på andre sida av fjorden. */
function fjell(ctx: Ctx) {
    fjellkjede(ctx, 380, 980, 480, 300, 3.3, P.blåMørk);
    fjellkjede(ctx, 520, 980, 482, 360, 7.1, P.blå);
    // Fjellet gamma ligger under, høyt mot venstre.
    ctx.fillStyle = P.blåMørk;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-10, 300);
    ctx.lineTo(-10, 96);
    for (let x = 0; x <= 520; x += 12) {
        const k = x / 520;
        const y = 96 + k * k * 210 + 22 * støy(x * 0.04 + 2) - 11;
        ctx.lineTo(x, Math.min(bakke(x) - 4, y));
    }
    ctx.lineTo(540, 330);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = P.snø;
    ctx.lineCap = 'round';
    for (let x = 6; x < 440; x += 8) {
        const k = x / 520;
        const y = 96 + k * k * 210 + 22 * støy(x * 0.04 + 2) - 11;
        ctx.lineWidth = 1.6;
        ripe(ctx, x, y + 5, 8 + 24 * hash(x) * (1 - k), 2, Math.PI / 2 + 0.4);
    }
}

function korn(ctx: Ctx, n: number) {
    for (let i = 0; i < n; i++) {
        const x = hash(i * 83) * 960;
        const y = hash(i * 89) * 540;
        ctx.fillStyle = i % 2 ? 'rgba(17,17,17,0.18)' : 'rgba(241,234,217,0.10)';
        ctx.fillRect(x, y, 1.4, 1.4);
    }
}

let cache: { r: number; c: HTMLCanvasElement } | null = null;

/** Hele den faste bakgrunnen på et offscreen-canvas, tegnet én gang per oppløsning. */
export function bakgrunn(r: number): HTMLCanvasElement {
    const rr = Math.max(0.5, Math.min(2.5, Math.round(r * 4) / 4));
    if (cache && cache.r === rr) return cache.c;
    const c = document.createElement('canvas');
    c.width = Math.ceil(960 * rr);
    c.height = Math.ceil(540 * rr);
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.scale(rr, rr);
        himmel(ctx);
        nordlys(ctx);
        fjell(ctx);
        fjord(ctx);
        snøbakke(ctx);
        skog(ctx);
        korn(ctx, kvalitet() === 'lav' ? 700 : 1800);
    }
    cache = { r: rr, c };
    return c;
}
