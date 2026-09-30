// De ni skapelsesbildene midt i taket, i rekkefølgen Michelangelo malte dem: fra inngangen mot
// alteret. Han begynte med Noah og malte bibelhistorien baklengs, så skapelsen av lyset kom sist.
//
// Hver runde eleven fullfører, fyller ut neste felt. Fremgangen lagres og vises i menyen som et
// tak som fylles, og i mål maler mesteren feltet ferdig. Maleriene er enkle komposisjoner i
// cangiante-farger (kalkpuss med farge i), tegnet på canvas: kjente nok til å kjennes igjen.

import { ART, makeCanvas, paintAdam, rng, type Rng } from './paint';

export interface Panel {
    name: string;
    /** Ett faktum eleven ikke så i spillet (vises i «Dette skjedde» og i menyen). */
    fact: string;
}

export const PANELS: Panel[] = [
    {
        name: 'Noahs rus',
        fact: 'Michelangelo begynte ved inngangen og malte bibelhistorien baklengs. Noah kommer sist i fortellingen, men ble malt først.',
    },
    {
        name: 'Syndfloden',
        fact: 'Det fortelles at det kom mugg i pussen kort tid etter at Syndfloden var malt. Kalken var for våt, og Michelangelo måtte lære en ny blanding.',
    },
    {
        name: 'Noahs offer',
        fact: 'Figurene i de første feltene er små. Fra gulvet 20 meter under var de vanskelige å se, så senere malte Michelangelo færre og større figurer.',
    },
    {
        name: 'Syndefallet',
        fact: 'To ting skjer i samme felt: til venstre tar Adam og Eva frukten fra treet, til høyre jager en engel dem ut av paradiset.',
    },
    {
        name: 'Skapelsen av Eva',
        fact: 'Skapelsen av Eva ligger midt i taket. Da den var ferdig, ble stillaset tatt ned, og Michelangelo så halve taket fra gulvet for første gang.',
    },
    {
        name: 'Skapelsen av Adam',
        fact: 'Gud strekker seg mot Adam, og fingrene deres rører nesten hverandre. Det er blitt et av de mest kjente bildene i verden.',
    },
    {
        name: 'Skillet mellom vann og land',
        fact: 'Gud svever over vannet, malt rett nedenfra. For den som står i kapellet, ser det ut som han flyr over hodet ditt.',
    },
    {
        name: 'Sol og måne',
        fact: 'Gud er malt to ganger i samme felt: forfra når han lager sola og månen, og bakfra når han flyr videre for å lage plantene.',
    },
    {
        name: 'Skillet mellom lys og mørke',
        fact: 'Det fortelles at Michelangelo malte dette siste feltet over alteret på én eneste dag. Høsten 1512 var hele taket ferdig.',
    },
];

/** Hvilket felt denne runden maler: neste tomme, eller et som retusjeres når taket er ferdig. */
export function panelFor(done: number, wins: number): number {
    return done < PANELS.length ? done : wins % PANELS.length;
}

// ---------------------------------------------------------------------------
// Små tegneverktøy
// ---------------------------------------------------------------------------

type C = CanvasRenderingContext2D;

function sky(ctx: C, w: number, h: number, top: string, bottom: string) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

/** En kropp i cangiante: lys tone med skygge i en annen farge. */
function body(ctx: C, x: number, y: number, rx: number, ry: number, rot: number, c1: string, c2: string) {
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
}

function head(ctx: C, x: number, y: number, r: number, hair = '#6b4a2b', beard = false) {
    ctx.fillStyle = ART.skin;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.2, r * 0.95, Math.PI, Math.PI * 2);
    ctx.fill();
    if (beard) {
        ctx.fillStyle = '#f2ece2';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.8, y + r * 0.2);
        ctx.quadraticCurveTo(x, y + r * 2.4, x + r * 0.8, y + r * 0.2);
        ctx.fill();
    }
}

function limb(ctx: C, x0: number, y0: number, x1: number, y1: number, wd: number, color = '#e2ad85') {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = wd;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

/** Naken skikkelse (Adam, Eva, Noahs sønner): kropp, hode, armer. */
function nude(ctx: C, x: number, y: number, s: number, rot = 0, hair = '#6b4a2b') {
    body(ctx, x, y, s * 0.28, s * 0.5, rot, '#f0c29c', '#b9805e');
    head(ctx, x + Math.sin(rot) * s * 0.55, y - Math.cos(rot) * s * 0.62, s * 0.16, hair);
}

/** Gud i den store kappa, med hvitt skjegg. */
function god(ctx: C, x: number, y: number, s: number, robe: string, shade: string, rot = 0) {
    body(ctx, x, y, s * 0.55, s * 0.36, rot, robe, shade);
    head(ctx, x - s * 0.42, y - s * 0.22, s * 0.13, '#eee6da', true);
}

function ground(ctx: C, w: number, h: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, y);
    ctx.quadraticCurveTo(w * 0.5, y - h * 0.08, w, y + h * 0.04);
    ctx.lineTo(w, h);
    ctx.fill();
}

function grain(ctx: C, w: number, h: number, r: Rng) {
    for (let i = 0; i < 900; i++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(255,250,235,.07)' : 'rgba(90,70,45,.06)';
        ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
}

// ---------------------------------------------------------------------------
// De ni maleriene
// ---------------------------------------------------------------------------

const PAINTERS: ((ctx: C, w: number, h: number, r: Rng) => void)[] = [
    // 1. Noahs rus: Noah sover i vinhagen, sønnene står ved siden av
    (ctx, w, h) => {
        sky(ctx, w, h, '#e3e1cf', '#efe4cc');
        ground(ctx, w, h, h * 0.72, '#b9ae7c');
        ctx.strokeStyle = '#6f8f4a';
        ctx.lineWidth = w * 0.012;
        for (let k = 0; k < 5; k++) {
            ctx.beginPath();
            ctx.arc(w * (0.08 + k * 0.05), h * 0.4, w * 0.04, 0, Math.PI * 1.6);
            ctx.stroke();
        }
        ctx.fillStyle = '#8a5a31';
        ctx.fillRect(w * 0.06, h * 0.55, w * 0.12, h * 0.17);
        body(ctx, w * 0.4, h * 0.7, w * 0.19, h * 0.07, -0.05, '#f0c29c', '#b9805e');
        head(ctx, w * 0.2, h * 0.64, h * 0.06, '#eee6da', true);
        nude(ctx, w * 0.66, h * 0.5, h * 0.42, 0.05);
        nude(ctx, w * 0.78, h * 0.52, h * 0.4, -0.05);
        body(ctx, w * 0.9, h * 0.5, w * 0.06, h * 0.2, 0.1, '#e8cf6a', '#c2543c');
        head(ctx, w * 0.9, h * 0.25, h * 0.06);
    },
    // 2. Syndfloden: storm, vann, arken og folk som klatrer opp på en klippe
    (ctx, w, h, r) => {
        sky(ctx, w, h, '#8f9aa0', '#cfd3cc');
        ctx.strokeStyle = 'rgba(80,90,100,.35)';
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 40; k++) {
            const x = r() * w;
            const y = r() * h * 0.6;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 8, y + 26);
            ctx.stroke();
        }
        ctx.fillStyle = '#5f7f86';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = '#7a5530';
        ctx.fillRect(w * 0.64, h * 0.42, w * 0.3, h * 0.2);
        ctx.fillStyle = '#5b3b22';
        ctx.beginPath();
        ctx.moveTo(w * 0.62, h * 0.42);
        ctx.lineTo(w * 0.79, h * 0.3);
        ctx.lineTo(w * 0.96, h * 0.42);
        ctx.fill();
        ctx.fillStyle = '#9c8a64';
        ctx.beginPath();
        ctx.ellipse(w * 0.24, h * 0.72, w * 0.22, h * 0.14, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        for (let k = 0; k < 5; k++) nude(ctx, w * (0.1 + k * 0.07), h * (0.6 - (k % 2) * 0.05), h * 0.22, (k - 2) * 0.2);
    },
    // 3. Noahs offer: alteret med ild i midten, folk rundt
    (ctx, w, h) => {
        sky(ctx, w, h, '#e6e2d2', '#efe4cc');
        ground(ctx, w, h, h * 0.78, '#b9ae7c');
        ctx.fillStyle = '#d8ccb0';
        ctx.fillRect(w * 0.38, h * 0.5, w * 0.24, h * 0.3);
        const fl = ctx.createRadialGradient(w * 0.5, h * 0.44, 2, w * 0.5, h * 0.44, h * 0.16);
        fl.addColorStop(0, '#fff2b0');
        fl.addColorStop(0.5, '#f0a25e');
        fl.addColorStop(1, 'rgba(194,84,60,0)');
        ctx.fillStyle = fl;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.4, w * 0.09, h * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        god(ctx, w * 0.2, h * 0.5, h * 0.4, '#b7a2d6', '#e39a8c', 1.3);
        nude(ctx, w * 0.3, h * 0.66, h * 0.3, 0.3);
        nude(ctx, w * 0.72, h * 0.62, h * 0.34, -0.2);
        body(ctx, w * 0.86, h * 0.56, w * 0.07, h * 0.2, 0, '#a9c98a', '#e0b64a');
        head(ctx, w * 0.86, h * 0.31, h * 0.06);
    },
    // 4. Syndefallet: treet og slangen i midten, engelen jager dem ut til høyre
    (ctx, w, h) => {
        sky(ctx, w, h, '#dfe6e6', '#efe4cc');
        ctx.fillStyle = '#a7a06c';
        ctx.fillRect(0, h * 0.74, w * 0.5, h * 0.26);
        ctx.fillStyle = '#c9b48e';
        ctx.fillRect(w * 0.5, h * 0.74, w * 0.5, h * 0.26);
        ctx.fillStyle = '#6d5a3a';
        ctx.fillRect(w * 0.47, h * 0.3, w * 0.05, h * 0.46);
        ctx.fillStyle = '#6f8f4a';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.25, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8fae4c';
        ctx.lineWidth = w * 0.02;
        ctx.beginPath();
        ctx.moveTo(w * 0.49, h * 0.7);
        ctx.bezierCurveTo(w * 0.56, h * 0.6, w * 0.42, h * 0.5, w * 0.5, h * 0.38);
        ctx.stroke();
        nude(ctx, w * 0.26, h * 0.6, h * 0.36, 0.3);
        nude(ctx, w * 0.36, h * 0.64, h * 0.3, 0.5, '#caa46a');
        body(ctx, w * 0.8, h * 0.32, w * 0.09, h * 0.12, 0.6, '#e3574a', '#8a2a20');
        limb(ctx, w * 0.74, h * 0.34, w * 0.64, h * 0.44, w * 0.012, '#d8d2c6');
        nude(ctx, w * 0.66, h * 0.66, h * 0.3, -0.3);
        nude(ctx, w * 0.74, h * 0.68, h * 0.28, -0.4, '#caa46a');
    },
    // 5. Skapelsen av Eva: Adam sover, Eva reiser seg, Gud står foran henne
    (ctx, w, h) => {
        sky(ctx, w, h, '#dde3e2', '#efe4cc');
        ground(ctx, w, h, h * 0.8, '#a7a06c');
        body(ctx, w * 0.24, h * 0.76, w * 0.18, h * 0.07, 0.1, '#f0c29c', '#b9805e');
        head(ctx, w * 0.08, h * 0.72, h * 0.055);
        ctx.fillStyle = '#6d5a3a';
        ctx.fillRect(w * 0.04, h * 0.5, w * 0.03, h * 0.28);
        nude(ctx, w * 0.5, h * 0.54, h * 0.44, 0.35, '#caa46a');
        body(ctx, w * 0.76, h * 0.52, w * 0.12, h * 0.32, -0.05, '#b7a2d6', '#8a5fa8');
        head(ctx, w * 0.74, h * 0.2, h * 0.07, '#eee6da', true);
        limb(ctx, w * 0.68, h * 0.4, w * 0.58, h * 0.36, w * 0.02);
    },
    // 6. Skapelsen av Adam (maleren finnes fra før)
    (ctx, w, h) => paintAdam(ctx, 0, 0, w, h),
    // 7. Skillet mellom vann og land: Gud svever over havet, sett nedenfra
    (ctx, w, h) => {
        sky(ctx, w, h, '#d9e3e6', '#b9c9c4');
        ctx.fillStyle = '#6f9a9a';
        ctx.fillRect(0, h * 0.7, w, h * 0.3);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        for (let k = 0; k < 8; k++) ctx.fillRect(w * (k / 8), h * (0.74 + (k % 3) * 0.06), w * 0.08, 2);
        god(ctx, w * 0.52, h * 0.42, h * 0.62, '#c86a5c', '#8a3a30', -0.15);
        limb(ctx, w * 0.36, h * 0.36, w * 0.14, h * 0.24, w * 0.025);
        limb(ctx, w * 0.62, h * 0.32, w * 0.86, h * 0.2, w * 0.025);
        for (let k = 0; k < 3; k++) head(ctx, w * (0.56 + k * 0.08), h * (0.56 + (k % 2) * 0.04), h * 0.045, '#caa46a');
    },
    // 8. Sol og måne: Gud bakfra til venstre, forfra med sola og månen til høyre
    (ctx, w, h) => {
        sky(ctx, w, h, '#dfe6e6', '#efe4cc');
        ctx.fillStyle = '#8fae4c';
        ctx.beginPath();
        ctx.ellipse(w * 0.12, h * 0.9, w * 0.12, h * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        body(ctx, w * 0.22, h * 0.48, w * 0.14, h * 0.18, 0.9, '#c86a5c', '#8a3a30');
        ctx.fillStyle = '#e2ad85';
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.62, w * 0.05, h * 0.08, 0.6, 0, Math.PI * 2);
        ctx.fill();
        const sun = ctx.createRadialGradient(w * 0.86, h * 0.26, 2, w * 0.86, h * 0.26, h * 0.13);
        sun.addColorStop(0, '#fff2b0');
        sun.addColorStop(1, ART.gold);
        ctx.fillStyle = sun;
        ctx.beginPath();
        ctx.arc(w * 0.86, h * 0.26, h * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d9d7cf';
        ctx.beginPath();
        ctx.arc(w * 0.46, h * 0.2, h * 0.07, 0, Math.PI * 2);
        ctx.fill();
        god(ctx, w * 0.66, h * 0.5, h * 0.5, '#c86a5c', '#8a3a30', 0.1);
        limb(ctx, w * 0.62, h * 0.4, w * 0.5, h * 0.24, w * 0.022);
        limb(ctx, w * 0.74, h * 0.38, w * 0.82, h * 0.3, w * 0.022);
    },
    // 9. Skillet mellom lys og mørke: Gud vrir seg mellom lyset og mørket
    (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#fbf2d6');
        g.addColorStop(0.45, '#e2cda4');
        g.addColorStop(0.7, '#8a7a66');
        g.addColorStop(1, '#3b3632');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,248,220,.45)';
        ctx.lineWidth = w * 0.02;
        ctx.beginPath();
        for (let k = 0; k < 60; k++) {
            const a = k * 0.22;
            const rr = w * 0.03 + k * w * 0.005;
            ctx.lineTo(w * 0.5 + Math.cos(a) * rr, h * 0.5 + Math.sin(a) * rr * 0.8);
        }
        ctx.stroke();
        body(ctx, w * 0.5, h * 0.52, w * 0.13, h * 0.26, 0.5, '#e39a8c', '#8a5fa8');
        head(ctx, w * 0.44, h * 0.24, h * 0.06, '#eee6da', true);
        limb(ctx, w * 0.44, h * 0.32, w * 0.3, h * 0.12, w * 0.024);
        limb(ctx, w * 0.56, h * 0.32, w * 0.7, h * 0.1, w * 0.024);
    },
];

/** Maler feltet `i` inn i et rektangel (med travertinramme og kalkkorn). */
export function paintPanel(ctx: C, i: number, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    const r = rng(101 + i * 17);
    PAINTERS[i % PAINTERS.length](ctx, w, h, r);
    grain(ctx, w, h, r);
    ctx.restore();
}

/** Et lite bilde av feltet (menyens tak). Lages én gang per felt. */
const THUMBS = new Map<number, string>();
export function panelThumb(i: number): string {
    let url = THUMBS.get(i);
    if (!url) {
        const { c, ctx } = makeCanvas(96, 72);
        paintPanel(ctx, i, 0, 0, 96, 72);
        url = c.toDataURL('image/png');
        THUMBS.set(i, url);
    }
    return url;
}

/** Mesterens malesekvens i mål (sekunder etter at bøtta er oppe). */
export const PAINT_START = 0.5;
export const PAINT_DUR = 3.4;
