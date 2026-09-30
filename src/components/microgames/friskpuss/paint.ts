// Malerne for «Frisk puss!»: canvas-teksturer tegnet én gang ved oppstart.
//
// Det sixtinske kapell slik det så ut 1508-1512: nederst malte draperier i sølv og gull, så
// veggfreskene fra Botticelli- og Perugino-tiden (landskap, folk i cangiante-drakter, Peruginos
// piazza med tempelet), vinduene med malte paver i nisjene mellom, og øverst det gamle hvelvet:
// blått med gullstjerner. Der Michelangelo har malt, er hvelvet lyst: malt arkitektur i travertin,
// profeter på troner og bildefelt i lyse, skiftende farger. Ingen papir, tusj eller trykk: dette
// er kalkpuss med farge i.
//
// Alt er rene funksjoner som tar en canvas-kontekst og banen (vinduer, bjelkehull), så begge
// banene og den speilvendte får riktige veggmalerier.

import * as THREE from 'three';
import { ROOM, type Box, type Level } from './level';

export const ART = {
    lime: '#efe4cc',
    limeDeep: '#e3d4b4',
    wet: '#6f6a62',
    trav: '#c9ad83',
    travLight: '#e2cda4',
    travDark: '#9c7f58',
    lapis: '#3f64b0',
    lapisDeep: '#2b4687',
    gold: '#e0b64a',
    green: '#8fae4c',
    red: '#c2543c',
    ink: '#3a2f22',
    skin: '#e7b58c',
    wood: '#9a6b3e',
    woodLight: '#c08a52',
    sky: '#cfe0ee',
};

/** Cangiante-par: lys tone og skyggetone i en annen farge (ikke bare mørkere). */
export const CANGIANTE: [string, string][] = [
    ['#f1b8a8', '#8fae4c'], // rosa -> grønn
    ['#e8cf6a', '#c2543c'], // gul -> rød
    ['#a9c98a', '#e0b64a'], // lysegrønn -> gull
    ['#b7a2d6', '#e39a8c'], // lilla -> rosa
    ['#8eb3de', '#8a5fa8'], // lyseblå -> fiolett
    ['#f0a25e', '#b04a3a'], // oransje -> rustrød
];

export type Rng = () => number;
export function rng(seed: number): Rng {
    let s = seed >>> 0 || 1;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function makeCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return { c, ctx: c.getContext('2d')! };
}

export function toTexture(c: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
}

// ---------------------------------------------------------------------------
// Små tegneverktøy
// ---------------------------------------------------------------------------

/** Kalkkorn: tusenvis av svake prikker, så pussen ikke ser ut som plast. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, r: Rng, a = 0.06) {
    for (let i = 0; i < n; i++) {
        const light = r() < 0.5;
        ctx.fillStyle = light ? `rgba(255,250,235,${a * (0.5 + r())})` : `rgba(90,70,45,${a * (0.4 + r())})`;
        const s = 0.6 + r() * 1.8;
        ctx.fillRect(r() * w, r() * h, s, s);
    }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = i % 2 === 0 ? R : R * 0.38;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
}

/** Det gamle hvelvet før Michelangelo: lapis med gullstjerner. */
function starSky(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ppm: number, r: Rng) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#34579f');
    g.addColorStop(1, ART.lapis);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const step = 0.9 * ppm;
    let row = 0;
    for (let yy = y + step * 0.5; yy < y + h; yy += step, row++)
        for (let xx = x + (row % 2 ? step * 0.5 : 0); xx < x + w; xx += step) {
            const jx = (r() - 0.5) * step * 0.25;
            const jy = (r() - 0.5) * step * 0.25;
            star(ctx, xx + jx, yy + jy, ppm * (0.12 + r() * 0.06), r() < 0.85 ? ART.gold : '#f3dc8a');
        }
}

/** Malt gesims i travertin: lys topp, skyggelist under, tannsnitt. */
function cornice(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, ART.travLight);
    g.addColorStop(0.45, ART.trav);
    g.addColorStop(0.75, ART.travDark);
    g.addColorStop(1, '#7c6444');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(80,60,35,.35)';
    const d = Math.max(3, h * 0.35);
    for (let xx = x; xx < x + w; xx += d * 1.6) ctx.fillRect(xx, y + h * 0.55, d * 0.8, h * 0.22);
}

/** Malt pilaster mellom feltene. */
function pilaster(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, ART.travDark);
    g.addColorStop(0.3, ART.travLight);
    g.addColorStop(0.7, ART.trav);
    g.addColorStop(1, '#8a6e4a');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(90,70,45,.35)';
    ctx.lineWidth = Math.max(1, w * 0.05);
    for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + (w * k) / 4, y + w * 0.6);
        ctx.lineTo(x + (w * k) / 4, y + h - w * 0.4);
        ctx.stroke();
    }
    ctx.fillStyle = ART.travLight;
    ctx.fillRect(x - w * 0.15, y, w * 1.3, w * 0.45);
}

/** En figur i en freske: kjortel i cangiante, hode, noen ganger glorie. */
function figure(ctx: CanvasRenderingContext2D, x: number, base: number, hgt: number, r: Rng, halo = false) {
    const [c1, c2] = CANGIANTE[Math.floor(r() * CANGIANTE.length)];
    const w = hgt * (0.26 + r() * 0.08);
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, c1);
    g.addColorStop(0.55, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, base);
    ctx.quadraticCurveTo(x - w * 0.62, base - hgt * 0.55, x - w * 0.3, base - hgt * 0.82);
    ctx.lineTo(x + w * 0.3, base - hgt * 0.82);
    ctx.quadraticCurveTo(x + w * 0.66, base - hgt * 0.5, x + w * 0.58, base);
    ctx.closePath();
    ctx.fill();
    // Kappe over skulderen
    const [k1] = CANGIANTE[Math.floor(r() * CANGIANTE.length)];
    ctx.fillStyle = k1;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, base - hgt * 0.8);
    ctx.quadraticCurveTo(x + w * 0.1, base - hgt * 0.4, x + w * 0.55, base - hgt * 0.15);
    ctx.lineTo(x + w * 0.25, base - hgt * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    const hr = hgt * 0.085;
    if (halo) {
        ctx.strokeStyle = ART.gold;
        ctx.lineWidth = Math.max(1, hr * 0.35);
        ctx.beginPath();
        ctx.arc(x, base - hgt * 0.9, hr * 1.6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.fillStyle = ART.skin;
    ctx.beginPath();
    ctx.arc(x, base - hgt * 0.9, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = r() < 0.5 ? '#6b4a2b' : '#caa46a';
    ctx.beginPath();
    ctx.arc(x, base - hgt * 0.93, hr * 0.9, Math.PI, Math.PI * 2);
    ctx.fill();
}

function tree(ctx: CanvasRenderingContext2D, x: number, base: number, hgt: number) {
    ctx.fillStyle = '#6d5a3a';
    ctx.fillRect(x - hgt * 0.02, base - hgt * 0.7, hgt * 0.04, hgt * 0.7);
    ctx.fillStyle = '#6f8f4a';
    ctx.beginPath();
    ctx.ellipse(x, base - hgt * 0.78, hgt * 0.13, hgt * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,220,150,.35)';
    ctx.beginPath();
    ctx.ellipse(x - hgt * 0.04, base - hgt * 0.84, hgt * 0.06, hgt * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
}

/** En veggfreske fra 1480-tallet: himmel, blå åser, grønn mark, figurer, kanskje Peruginos piazza. */
function fresco(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng, piazza: boolean) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, y + h * 0.6);
    sky.addColorStop(0, '#a9c4e0');
    sky.addColorStop(1, '#f1e8d4');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    // Blå åser langt borte
    ctx.fillStyle = '#9fb4c8';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.52);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x + (w * k) / 8, y + h * (0.4 + r() * 0.12));
    ctx.lineTo(x + w, y + h * 0.6);
    ctx.lineTo(x, y + h * 0.6);
    ctx.fill();
    // Marka
    const gr = ctx.createLinearGradient(0, y + h * 0.5, 0, y + h);
    gr.addColorStop(0, '#b5b27a');
    gr.addColorStop(1, '#8e8a55');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
    if (piazza) {
        // Piazzaen med perspektivfliser og det åttekantede tempelet (Peruginos nøkkeloverrekkelse)
        ctx.fillStyle = '#e4d6b8';
        ctx.fillRect(x, y + h * 0.58, w, h * 0.42);
        ctx.strokeStyle = 'rgba(120,95,60,.4)';
        ctx.lineWidth = 1;
        const vx = x + w / 2;
        const vy = y + h * 0.5;
        for (let k = -8; k <= 8; k++) {
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(vx + k * w * 0.12, y + h);
            ctx.stroke();
        }
        for (let k = 0; k < 6; k++) {
            const yy = y + h * (0.6 + 0.4 * ((k / 6) ** 1.6));
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.lineTo(x + w, yy);
            ctx.stroke();
        }
        const tw = w * 0.2;
        const th = h * 0.3;
        const tx = vx - tw / 2;
        const ty = y + h * 0.58 - th;
        ctx.fillStyle = '#efe2c4';
        ctx.fillRect(tx, ty, tw, th);
        ctx.fillStyle = '#d9c49a';
        for (let k = 0; k < 5; k++) ctx.fillRect(tx + (tw * (k + 0.3)) / 5, ty + th * 0.2, tw * 0.05, th * 0.8);
        ctx.fillStyle = '#c9a877';
        ctx.beginPath();
        ctx.ellipse(vx, ty, tw * 0.36, th * 0.4, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(vx - tw * 0.05, ty - th * 0.55, tw * 0.1, th * 0.2);
        // To triumfbuer
        for (const s of [-1, 1]) {
            const ax = vx + s * w * 0.33 - tw * 0.35;
            ctx.fillStyle = '#eadbbb';
            ctx.fillRect(ax, ty + th * 0.3, tw * 0.7, th * 0.7);
            ctx.fillStyle = '#a9c4e0';
            ctx.beginPath();
            ctx.moveTo(ax + tw * 0.22, y + h * 0.58);
            ctx.lineTo(ax + tw * 0.22, ty + th * 0.7);
            ctx.arc(ax + tw * 0.35, ty + th * 0.7, tw * 0.13, Math.PI, 0);
            ctx.lineTo(ax + tw * 0.48, y + h * 0.58);
            ctx.fill();
        }
    } else {
        for (let k = 0; k < 3; k++) tree(ctx, x + w * (0.1 + r() * 0.8), y + h * 0.6, h * (0.35 + r() * 0.15));
        // Et hus eller en ruin i bakgrunnen
        if (r() < 0.6) {
            const bx = x + w * (0.15 + r() * 0.6);
            ctx.fillStyle = '#e6d4b0';
            ctx.fillRect(bx, y + h * 0.42, w * 0.12, h * 0.18);
            ctx.fillStyle = '#c47f5a';
            ctx.beginPath();
            ctx.moveTo(bx - w * 0.01, y + h * 0.42);
            ctx.lineTo(bx + w * 0.06, y + h * 0.35);
            ctx.lineTo(bx + w * 0.13, y + h * 0.42);
            ctx.fill();
        }
    }
    // Figurene i forgrunnen, i grupper
    const groups = 2 + Math.floor(r() * 2);
    for (let gi = 0; gi < groups; gi++) {
        const gx = x + w * ((gi + 0.5) / groups) + (r() - 0.5) * w * 0.1;
        const n = 3 + Math.floor(r() * 4);
        for (let k = 0; k < n; k++)
            figure(ctx, gx + (k - n / 2) * h * 0.09, y + h * (0.93 + r() * 0.05), h * (0.36 + r() * 0.08), r, gi === 0 && k === 1);
    }
    ctx.restore();
    // Malt ramme
    ctx.strokeStyle = ART.travDark;
    ctx.lineWidth = Math.max(2, h * 0.02);
    ctx.strokeRect(x, y, w, h);
}

/**
 * De malte draperiene nederst: forheng i sølv og blek gull som henger i myke folder fra ringer
 * på en stang, med et damaskmønster og gullfrynser.
 */
function drapery(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ppm: number) {
    const panel = 2.2 * ppm;
    let k = 0;
    for (let px = x; px < x + w; px += panel, k++) {
        const silver = k % 2 === 0;
        const base = silver ? ['#d9d3c4', '#efe9dc', '#cfc7b6'] : ['#d6c28e', '#ece0b8', '#c9b27a'];
        // Tre myke folder per forheng
        const fold = panel / 3;
        for (let f = 0; f < 3; f++) {
            const fx = px + f * fold;
            const g = ctx.createLinearGradient(fx, 0, fx + fold, 0);
            g.addColorStop(0, base[2]);
            g.addColorStop(0.45, base[1]);
            g.addColorStop(1, base[0]);
            ctx.fillStyle = g;
            ctx.fillRect(fx, y, fold + 1, h);
        }
        // Damask: små liljer i en lysere tone
        ctx.fillStyle = silver ? 'rgba(255,255,255,.28)' : 'rgba(255,245,210,.35)';
        for (let yy = y + ppm * 0.6; yy < y + h - ppm * 0.5; yy += ppm * 0.7)
            for (let xx = px + ppm * 0.35 + ((yy / ppm) % 1.4 < 0.7 ? 0 : ppm * 0.35); xx < px + panel - ppm * 0.2; xx += ppm * 0.7) {
                ctx.beginPath();
                ctx.ellipse(xx, yy, ppm * 0.07, ppm * 0.14, 0, 0, Math.PI * 2);
                ctx.ellipse(xx - ppm * 0.1, yy + ppm * 0.08, ppm * 0.05, ppm * 0.1, -0.8, 0, Math.PI * 2);
                ctx.ellipse(xx + ppm * 0.1, yy + ppm * 0.08, ppm * 0.05, ppm * 0.1, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        // Bord i gull langs kanten og nederst
        ctx.fillStyle = '#c9a44f';
        ctx.fillRect(px, y + h - ppm * 0.32, panel, ppm * 0.1);
        ctx.fillRect(px + panel - ppm * 0.05, y, ppm * 0.05, h);
        // Buer øverst der forhenget henger i ringene
        ctx.fillStyle = ART.lime;
        for (let r = 0; r < 4; r++) {
            ctx.beginPath();
            ctx.ellipse(px + (r + 0.5) * (panel / 4), y + ppm * 0.08, panel / 8, ppm * 0.12, 0, 0, Math.PI);
            ctx.fill();
        }
    }
    // Stang med ringer og frynser
    ctx.fillStyle = '#7c6444';
    ctx.fillRect(x, y - ppm * 0.02, w, ppm * 0.09);
    ctx.fillStyle = '#b8964e';
    for (let xx = x; xx < x + w; xx += 2.2 * ppm / 4) ctx.fillRect(xx - ppm * 0.03, y - ppm * 0.04, ppm * 0.06, ppm * 0.14);
    ctx.fillStyle = '#c9a44f';
    for (let xx = x; xx < x + w; xx += ppm * 0.08) ctx.fillRect(xx, y + h - ppm * 0.22, ppm * 0.035, ppm * 0.22);
}

/** Nisje med en malt pave (mellom vinduene). */
function popeNiche(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, r: Rng) {
    const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, '#8d7a5c');
    g.addColorStop(0.5, '#cdb892');
    g.addColorStop(1, '#8d7a5c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y + h);
    ctx.lineTo(cx - w / 2, y + w / 2);
    ctx.arc(cx, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(cx + w / 2, y + h);
    ctx.fill();
    // Skjell i toppen
    ctx.strokeStyle = 'rgba(255,245,220,.5)';
    ctx.lineWidth = Math.max(1, w * 0.03);
    for (let k = 1; k < 6; k++) {
        const a = Math.PI + (Math.PI * k) / 6;
        ctx.beginPath();
        ctx.moveTo(cx, y + w / 2);
        ctx.lineTo(cx + Math.cos(a) * w * 0.45, y + w / 2 + Math.sin(a) * w * 0.45);
        ctx.stroke();
    }
    // Paven: hvit kjortel, rød kappe, gyllen tiara
    const px = cx;
    const base = y + h * 0.97;
    const ph = h * 0.62;
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.moveTo(px - ph * 0.2, base);
    ctx.lineTo(px - ph * 0.12, base - ph * 0.75);
    ctx.lineTo(px + ph * 0.12, base - ph * 0.75);
    ctx.lineTo(px + ph * 0.2, base);
    ctx.fill();
    ctx.fillStyle = r() < 0.5 ? ART.red : '#b34a5c';
    ctx.beginPath();
    ctx.moveTo(px - ph * 0.16, base - ph * 0.45);
    ctx.lineTo(px - ph * 0.12, base - ph * 0.8);
    ctx.lineTo(px + ph * 0.12, base - ph * 0.8);
    ctx.lineTo(px + ph * 0.16, base - ph * 0.45);
    ctx.fill();
    ctx.fillStyle = ART.skin;
    ctx.beginPath();
    ctx.arc(px, base - ph * 0.86, ph * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ART.gold;
    ctx.beginPath();
    ctx.moveTo(px - ph * 0.06, base - ph * 0.9);
    ctx.lineTo(px, base - ph * 1.05);
    ctx.lineTo(px + ph * 0.06, base - ph * 0.9);
    ctx.fill();
}

/** En profet eller sibylle på en malt trone (Michelangelos hvelv). */
function prophet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng) {
    // Tronen i malt travertin
    ctx.fillStyle = ART.travLight;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ART.trav;
    ctx.fillRect(x + w * 0.08, y + h * 0.06, w * 0.84, h * 0.88);
    ctx.fillStyle = '#b89c70';
    ctx.fillRect(x + w * 0.14, y + h * 0.1, w * 0.72, h * 0.66);
    // Den sittende figuren: kraftig, i skiftende farger
    const [c1, c2] = CANGIANTE[Math.floor(r() * CANGIANTE.length)];
    const [k1, k2] = CANGIANTE[Math.floor(r() * CANGIANTE.length)];
    const cx = x + w / 2;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, c2);
    g.addColorStop(0.4, c1);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.62, w * 0.34, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    const g2 = ctx.createLinearGradient(x, 0, x + w, 0);
    g2.addColorStop(0, k1);
    g2.addColorStop(1, k2);
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.05, y + h * 0.42, w * 0.24, h * 0.18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ART.skin;
    ctx.beginPath();
    ctx.arc(cx + w * 0.02, y + h * 0.24, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    // Boka eller rullen
    ctx.fillStyle = '#f4ecd6';
    ctx.fillRect(cx - w * 0.3, y + h * 0.5, w * 0.22, h * 0.1);
    // Navnetavla under (putto med steintavle)
    ctx.fillStyle = ART.travLight;
    ctx.fillRect(x + w * 0.2, y + h * 0.9, w * 0.6, h * 0.08);
}

/** Et bildefelt i hvelvet (Skapelsen): lys himmel og kraftige figurer. */
function ceilingScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng, adam: boolean) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#dfe6e6');
    g.addColorStop(1, '#efe4cc');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (adam) {
        paintAdam(ctx, x, y, w, h);
        return;
    }
    // Jord og himmel, to eller tre kraftige kropper
    ctx.fillStyle = '#b9ae7c';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.95, w * 0.45, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    const n = 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
        const [c1, c2] = CANGIANTE[Math.floor(r() * CANGIANTE.length)];
        const fx = x + w * (0.2 + (k / n) * 0.65);
        const fy = y + h * (0.35 + r() * 0.3);
        const gg = ctx.createRadialGradient(fx - w * 0.03, fy - h * 0.05, 1, fx, fy, w * 0.14);
        gg.addColorStop(0, c1);
        gg.addColorStop(1, c2);
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.ellipse(fx, fy, w * 0.12, h * 0.22, r() * 1.2 - 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ART.skin;
        ctx.beginPath();
        ctx.arc(fx + w * 0.02, fy - h * 0.25, h * 0.07, 0, Math.PI * 2);
        ctx.fill();
    }
}

/** Adams hånd og Guds finger: det mest kjente bildet i taket. */
export function paintAdam(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#d9e3e6');
    g.addColorStop(1, '#efe6d2');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // Jorda under Adam
    ctx.fillStyle = '#a7a06c';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.45, x + w * 0.45, y + h);
    ctx.fill();
    // Adam: liggende kropp og arm som henger slapt mot midten
    ctx.fillStyle = '#e2ad85';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.2, y + h * 0.72, w * 0.16, h * 0.1, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.1, y + h * 0.6, h * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2ad85';
    ctx.lineCap = 'round';
    ctx.lineWidth = h * 0.06;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.24, y + h * 0.62);
    ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.5, x + w * 0.46, y + h * 0.52);
    ctx.stroke();
    ctx.lineWidth = h * 0.022;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.46, y + h * 0.52);
    ctx.lineTo(x + w * 0.485, y + h * 0.535);
    ctx.stroke();
    // Gud i den røde kappa, båret av engler
    ctx.fillStyle = '#c86a5c';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.78, y + h * 0.45, w * 0.2, h * 0.3, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dfd2';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.72, y + h * 0.42, w * 0.08, h * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a07e';
    ctx.beginPath();
    ctx.arc(x + w * 0.64, y + h * 0.3, h * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2ece2';
    ctx.beginPath();
    ctx.arc(x + w * 0.635, y + h * 0.35, h * 0.05, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#d9a07e';
    ctx.lineWidth = h * 0.055;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.66, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.5, x + w * 0.52, y + h * 0.52);
    ctx.stroke();
    ctx.lineWidth = h * 0.02;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, y + h * 0.52);
    ctx.lineTo(x + w * 0.497, y + h * 0.525);
    ctx.stroke();
    // Den lille avstanden mellom fingrene lyser
    const sp = ctx.createRadialGradient(x + w * 0.491, y + h * 0.53, 1, x + w * 0.491, y + h * 0.53, h * 0.12);
    sp.addColorStop(0, 'rgba(255,248,220,.9)');
    sp.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(x + w * 0.4, y + h * 0.4, w * 0.2, h * 0.26);
}

// ---------------------------------------------------------------------------
// Vinduene: felles for veggmaleriet og glassflatene i 3D
// ---------------------------------------------------------------------------

export interface WindowDef {
    x: number;
    w: number;
    south: boolean;
}

/** Formiddagssola: inn gjennom sørvinduene, ned og mot nord (x, y, z). */
export const SUN: [number, number, number] = [0.3, -0.5, -0.83];

export const WIN_Y0 = 8.9;
export const WIN_Y1 = 12.6;

/** Vinduene i kapellet: der trekken kommer inn (bane 2), ellers jevnt fordelt på begge langveggene. */
export function windowsFor(L: Level): WindowDef[] {
    const out: WindowDef[] = [];
    const regular = [-15, -9, -3, 3, 9, 15];
    const windS = L.winds.filter((w) => w.max[2] > 0).map((w) => (w.min[0] + w.max[0]) / 2);
    for (const south of [true, false]) {
        const draft = south ? windS : L.winds.filter((w) => w.max[2] <= 0).map((w) => (w.min[0] + w.max[0]) / 2);
        if (draft.length) {
            for (const x of draft) out.push({ x, w: 2.8, south });
            // Fyll på med vanlige vinduer der det er god plass
            for (const x of regular) if (draft.every((d) => Math.abs(d - x) > 4.5)) out.push({ x, w: 2.4, south });
        } else for (const x of regular) out.push({ x, w: 2.4, south });
    }
    return out;
}

/** Bjelkehull: der en veggbjelke går inn i muren. */
function beamHoles(L: Level, south: boolean): Box[] {
    const zw = south ? ROOM.z1 : ROOM.z0;
    return L.static.filter(
        (b) => (b.kind === 'bjelke' || b.kind === 'bro' || b.kind === 'mester') && Math.abs((south ? b.max[2] : b.min[2]) - zw) < 0.05
    );
}

// ---------------------------------------------------------------------------
// Veggene
// ---------------------------------------------------------------------------

/**
 * Langveggene (40 x 20 m). `south` = sørveggen (sett innenfra står øst til venstre).
 * `finished` = hvor Michelangelo har malt hvelvet (x-intervall), ellers stjernehimmel.
 */
export function paintLongWall(L: Level, south: boolean, W: number, finished: [number, number] | null): THREE.CanvasTexture {
    const ppm = W / 40;
    const Hh = Math.round(20 * ppm);
    const { c, ctx } = makeCanvas(W, Hh);
    const r = rng(south ? 71 : 37);
    // Veggens x i canvas: nord u = x + 20, sør u = 20 - x (sett innenfra).
    const U = (x: number) => (south ? 20 - x : x + 20) * ppm;
    const V = (y: number) => (20 - y) * ppm;

    // Grunnpuss
    ctx.fillStyle = ART.lime;
    ctx.fillRect(0, 0, W, Hh);

    // 0-4,1 m: draperier
    drapery(ctx, 0, V(4.1), W, 4.1 * ppm, ppm);
    cornice(ctx, 0, V(4.55), W, 0.45 * ppm);

    // 4,55-8,3 m: veggfreskene i seks felt
    const panels = 6;
    const pw = 40 / panels;
    for (let k = 0; k < panels; k++) {
        const x0 = k * pw * ppm + 0.35 * ppm;
        fresco(ctx, x0, V(8.25), (pw - 0.7) * ppm, (8.25 - 4.6) * ppm, r, k === (south ? 3 : 2));
        pilaster(ctx, k * pw * ppm - 0.3 * ppm, V(8.25), 0.6 * ppm, (8.25 - 4.55) * ppm);
    }
    cornice(ctx, 0, V(8.75), W, 0.5 * ppm);

    // 8,75-13,4 m: vindusbeltet med paver i nisjer
    const wins = windowsFor(L).filter((w) => w.south === south);
    const xs = wins.map((w) => w.x).sort((a, b) => a - b);
    const nichesAt: number[] = [];
    for (let i = 0; i <= xs.length; i++) {
        const a = i === 0 ? -20 : xs[i - 1];
        const b = i === xs.length ? 20 : xs[i];
        if (b - a > 4.2) nichesAt.push((a + b) / 2);
    }
    for (const nx of nichesAt) popeNiche(ctx, U(nx) - 0.6 * ppm, V(12.4), 1.2 * ppm, 3.2 * ppm, r);
    for (const w of wins) {
        const cx = U(w.x);
        const hw = (w.w / 2 + 0.35) * ppm;
        // Dyp vindusomfatning i travertin
        ctx.fillStyle = ART.travDark;
        ctx.beginPath();
        ctx.moveTo(cx - hw, V(WIN_Y0 - 0.2));
        ctx.lineTo(cx - hw, V(WIN_Y1 - w.w / 2));
        ctx.arc(cx, V(WIN_Y1 - w.w / 2), hw, Math.PI, 0);
        ctx.lineTo(cx + hw, V(WIN_Y0 - 0.2));
        ctx.fill();
        ctx.fillStyle = '#fdf7e6';
        const iw = (w.w / 2) * ppm;
        ctx.beginPath();
        ctx.moveTo(cx - iw, V(WIN_Y0));
        ctx.lineTo(cx - iw, V(WIN_Y1 - w.w / 2));
        ctx.arc(cx, V(WIN_Y1 - w.w / 2), iw, Math.PI, 0);
        ctx.lineTo(cx + iw, V(WIN_Y0));
        ctx.fill();
    }
    cornice(ctx, 0, V(13.8), W, 0.4 * ppm);

    // 13,8-20 m: hvelvets fot - stjernehimmel, eller Michelangelos lunetter der han har malt
    starSky(ctx, 0, 0, W, V(13.8), ppm, r);
    if (finished) {
        const [fx0, fx1] = finished;
        const u0 = Math.min(U(fx0), U(fx1));
        const u1 = Math.max(U(fx0), U(fx1));
        ctx.fillStyle = ART.lime;
        ctx.fillRect(u0, 0, u1 - u0, V(13.8));
        // Lunetter over hvert vindu med sittende figurer, og spandreller
        for (const w of wins) {
            const cx = U(w.x);
            if (cx < u0 || cx > u1) continue;
            ctx.fillStyle = '#d9cfb4';
            ctx.beginPath();
            ctx.arc(cx, V(13.8), 2.6 * ppm, Math.PI, 0);
            ctx.fill();
            for (const s of [-1, 1]) figure(ctx, cx + s * 1.1 * ppm, V(14), 2.0 * ppm, r);
        }
        for (let x = u0; x < u1; x += 6.6 * ppm) prophet(ctx, x + 1.2 * ppm, V(19.6), 2.6 * ppm, 4.2 * ppm, r);
        ctx.strokeStyle = 'rgba(120,100,70,.25)';
        ctx.lineWidth = 1;
        // Dagsverk-skjøtene (giornate)
        for (let k = 0; k < 18; k++) {
            ctx.beginPath();
            let px = u0 + r() * (u1 - u0);
            let py = r() * V(13.8);
            ctx.moveTo(px, py);
            for (let s = 0; s < 5; s++) {
                px += (r() - 0.5) * ppm * 1.6;
                py += (r() - 0.3) * ppm * 1.2;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }

    // Bjelkehullene: mørke hull i muren der Michelangelos bjelker går inn, med jernbeslag rundt
    for (const b of beamHoles(L, south)) {
        const x0 = Math.min(U(b.min[0]), U(b.max[0]));
        const x1 = Math.max(U(b.min[0]), U(b.max[0]));
        const y0 = V(b.max[1]);
        const y1 = V(b.min[1]);
        const pad = 0.12 * ppm;
        ctx.fillStyle = 'rgba(70,52,32,.35)';
        ctx.fillRect(x0 - pad * 2, y0 - pad * 1.5, x1 - x0 + pad * 4, y1 - y0 + pad * 5);
        ctx.fillStyle = '#2d2218';
        ctx.fillRect(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2);
    }
    // Døra der paven kommer inn
    const door = L.popePath[0];
    if ((door[2] > 0) === south) {
        const dx = U(door[0]);
        ctx.fillStyle = '#5a3f26';
        ctx.fillRect(dx - 0.9 * ppm, V(3.2), 1.8 * ppm, 3.2 * ppm);
        ctx.fillStyle = ART.trav;
        ctx.fillRect(dx - 1.1 * ppm, V(3.5), 2.2 * ppm, 0.3 * ppm);
        ctx.fillStyle = '#6d4c2e';
        ctx.fillRect(dx - 0.8 * ppm, V(3.1), 0.75 * ppm, 3.1 * ppm);
        ctx.fillRect(dx + 0.05 * ppm, V(3.1), 0.75 * ppm, 3.1 * ppm);
    }

    // Vinduslyset: sola kaster sørvinduene som lyse flekker nederst på nordveggen
    if (!south) {
        const k = (ROOM.z1 - ROOM.z0) / -SUN[2];
        const sx = (L.mirror ? -SUN[0] : SUN[0]) * k;
        const sy = SUN[1] * k;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = `blur(${Math.round(ppm * 0.12)}px)`;
        for (const w of windowsFor(L).filter((q) => q.south)) {
            const cx = U(w.x + sx);
            const iw = (w.w / 2) * ppm * 1.05;
            const y0 = V(Math.max(0, WIN_Y0 + sy));
            const yTop = V(WIN_Y1 - w.w / 2 + sy);
            const g = ctx.createLinearGradient(0, yTop - iw, 0, y0);
            g.addColorStop(0, 'rgba(255,226,160,.75)');
            g.addColorStop(1, 'rgba(255,214,140,.55)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(cx - iw, y0);
            ctx.lineTo(cx - iw, yTop);
            ctx.arc(cx, yTop, iw, Math.PI, 0);
            ctx.lineTo(cx + iw, y0);
            ctx.fill();
        }
        ctx.restore();
    }
    grain(ctx, W, Hh, Math.round(W * 6), r);
    // Varmt lys høyt oppe, mer dunkelt nede
    const shade = ctx.createLinearGradient(0, 0, 0, Hh);
    shade.addColorStop(0, 'rgba(255,245,215,.12)');
    shade.addColorStop(0.6, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(90,60,30,.18)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, Hh);
    return toTexture(c);
}

/** Endeveggene (13 x 20 m): alterveggen og inngangsveggen. */
export function paintEndWall(west: boolean, W: number): THREE.CanvasTexture {
    const ppm = W / 13;
    const Hh = Math.round(20 * ppm);
    const { c, ctx } = makeCanvas(W, Hh);
    const r = rng(west ? 5 : 9);
    const V = (y: number) => (20 - y) * ppm;
    ctx.fillStyle = ART.lime;
    ctx.fillRect(0, 0, W, Hh);
    drapery(ctx, 0, V(4.1), W, 4.1 * ppm, ppm);
    cornice(ctx, 0, V(4.55), W, 0.45 * ppm);
    fresco(ctx, 0.4 * ppm, V(8.25), 6 * ppm, 3.65 * ppm, r, false);
    fresco(ctx, 6.6 * ppm, V(8.25), 6 * ppm, 3.65 * ppm, r, false);
    cornice(ctx, 0, V(8.75), W, 0.5 * ppm);
    for (const nx of [3.2, 9.8]) popeNiche(ctx, nx * ppm - 0.6 * ppm, V(12.4), 1.2 * ppm, 3.2 * ppm, r);
    cornice(ctx, 0, V(13.8), W, 0.4 * ppm);
    starSky(ctx, 0, 0, W, V(13.8), ppm, r);
    if (!west) {
        // Inngangen: stor dør
        ctx.fillStyle = '#5a3f26';
        ctx.fillRect(W / 2 - 1.4 * ppm, V(4), 2.8 * ppm, 4 * ppm);
    }
    grain(ctx, W, Hh, W * 6, r);
    return toTexture(c);
}

// ---------------------------------------------------------------------------
// Hvelvet (taket, 40 x 13 m, sett nedenfra)
// ---------------------------------------------------------------------------

/**
 * Taket sett nedenfra. u følger x (vest til venstre), v følger z. `finished` er x-intervallet
 * Michelangelo har malt; resten er det gamle hvelvet med gullstjerner.
 */
export function paintCeiling(W: number, finished: [number, number] | null, adamAt: number | null): THREE.CanvasTexture {
    const ppm = W / 40;
    const Hh = Math.round(13 * ppm);
    const { c, ctx } = makeCanvas(W, Hh);
    const r = rng(1512);
    const U = (x: number) => (x + 20) * ppm;
    // Planet er rotert opp ned: toppen av canvasen er sør (+z).
    const Vz = (z: number) => (6.5 - z) * ppm;
    starSky(ctx, 0, 0, W, Hh, ppm, r);
    if (finished) {
        const u0 = U(finished[0]);
        const u1 = U(finished[1]);
        ctx.fillStyle = ART.lime;
        ctx.fillRect(u0, 0, u1 - u0, Hh);
        // Troner langs sidene
        for (let x = u0 + 0.5 * ppm; x < u1 - 2.4 * ppm; x += 4.4 * ppm) {
            prophet(ctx, x, 0.2 * ppm, 2.4 * ppm, 3 * ppm, r);
            prophet(ctx, x, Hh - 3.2 * ppm, 2.4 * ppm, 3 * ppm, r);
        }
        // Midtstripa: bildefeltene mellom malte tverrbjelker
        const top = Vz(3.1);
        const bot = Vz(-3.1);
        let k = 0;
        for (let x = u0; x < u1 - 0.5 * ppm; x += 4.4 * ppm, k++) {
            const w = Math.min(4.4 * ppm, u1 - x);
            const big = k % 2 === 0;
            const inset = big ? 0.25 * ppm : 0.9 * ppm;
            const isAdam = adamAt !== null && Math.abs(x + w / 2 - U(adamAt)) < 2.3 * ppm;
            ceilingScene(ctx, x + 0.25 * ppm, top + inset, w - 0.5 * ppm, bot - top - inset * 2, r, isAdam);
            // Ignudi i hjørnene av de små feltene
            if (!big)
                for (const [ax, ay] of [
                    [x + 0.5 * ppm, top + 0.4 * ppm],
                    [x + w - 0.5 * ppm, bot - 0.4 * ppm],
                ]) {
                    ctx.fillStyle = ART.skin;
                    ctx.beginPath();
                    ctx.ellipse(ax, ay, 0.28 * ppm, 0.45 * ppm, 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            cornice(ctx, x, top - 0.3 * ppm, 0.35 * ppm, bot - top + 0.6 * ppm);
        }
        cornice(ctx, u0, top - 0.35 * ppm, u1 - u0, 0.35 * ppm);
        cornice(ctx, u0, bot, u1 - u0, 0.35 * ppm);
        // Grensen mot det gamle hvelvet: ujevn puss-kant
        ctx.fillStyle = '#d8ccb0';
        for (let y = 0; y < Hh; y += 0.3 * ppm) {
            const edge = finished[0] > -19 ? u0 : u1;
            ctx.fillRect(edge - 0.12 * ppm + (r() - 0.5) * 0.2 * ppm, y, 0.24 * ppm, 0.3 * ppm);
        }
    }
    // Rammen rundt hele hvelvet
    ctx.strokeStyle = ART.travDark;
    ctx.lineWidth = 0.4 * ppm;
    ctx.strokeRect(0, 0, W, Hh);
    grain(ctx, W, Hh, W * 4, r, 0.05);
    return toTexture(c);
}

// ---------------------------------------------------------------------------
// Gulvet: marmormosaikk (cosmatesk) med store sirkler i porfyr og serpentin
// ---------------------------------------------------------------------------

export function paintFloor(W: number): THREE.CanvasTexture {
    const ppm = W / 40;
    const Hh = Math.round(13 * ppm);
    const { c, ctx } = makeCanvas(W, Hh);
    const r = rng(1480);
    ctx.fillStyle = '#e9dfca';
    ctx.fillRect(0, 0, W, Hh);
    // Store kvadrater
    for (let x = 0; x < W; x += 2 * ppm)
        for (let y = 0; y < Hh; y += 2 * ppm) {
            ctx.fillStyle = (x / ppm + y / ppm) % 4 < 2 ? '#e4d8bf' : '#efe6d3';
            ctx.fillRect(x + 1, y + 1, 2 * ppm - 2, 2 * ppm - 2);
        }
    // Marmorårer
    ctx.strokeStyle = 'rgba(150,130,100,.18)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 90; k++) {
        ctx.beginPath();
        let x = r() * W;
        let y = r() * Hh;
        ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
            x += (r() - 0.5) * ppm;
            y += (r() - 0.5) * ppm;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    // Midtløperen med rotae
    const cy = Hh / 2;
    const band = 3.4 * ppm;
    ctx.fillStyle = '#d8c7a4';
    ctx.fillRect(0, cy - band / 2, W, band);
    for (let x = 2.5 * ppm; x < W; x += 5 * ppm) {
        for (const [rad, col] of [
            [1.55, '#f2ead8'],
            [1.4, '#8a3b30'],
            [1.1, '#efe4cc'],
            [0.95, '#4f7a58'],
            [0.55, '#e7d6b0'],
        ] as [number, string][]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x, cy, rad * ppm, 0, Math.PI * 2);
            ctx.fill();
        }
        // Små trekanter i ringen
        ctx.fillStyle = '#c9ad83';
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            const rr = 1.25 * ppm;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
            ctx.lineTo(x + Math.cos(a + 0.12) * rr * 0.9, cy + Math.sin(a + 0.12) * rr * 0.9);
            ctx.lineTo(x + Math.cos(a - 0.12) * rr * 0.9, cy + Math.sin(a - 0.12) * rr * 0.9);
            ctx.fill();
        }
    }
    // Borde med sjakkruter langs veggene
    for (const yb of [0.3 * ppm, Hh - 0.7 * ppm])
        for (let x = 0; x < W; x += 0.4 * ppm) {
            ctx.fillStyle = (x / (0.4 * ppm)) % 2 < 1 ? '#8a3b30' : '#4f7a58';
            ctx.fillRect(x, yb, 0.4 * ppm, 0.4 * ppm);
        }
    grain(ctx, W, Hh, W * 3, r, 0.05);
    return toTexture(c);
}

// ---------------------------------------------------------------------------
// Små flismønstre som gjentas (tre, travertin, tørr og våt puss, tau)
// ---------------------------------------------------------------------------

/** Ubehandlet gran: planker med årer. Tekstur på 1 x 1 m. */
export function paintWood(base: string, seed: number): THREE.CanvasTexture {
    const S = 256;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const col = new THREE.Color(base);
    for (let k = 0; k < 4; k++) {
        const y = (k * S) / 4;
        const t = col.clone().offsetHSL(0, 0, (r() - 0.5) * 0.08);
        ctx.fillStyle = `#${t.getHexString()}`;
        ctx.fillRect(0, y + 2, S, S / 4 - 3);
        ctx.fillStyle = 'rgba(40,25,10,.45)';
        ctx.fillRect(0, y, S, 2);
    }
    ctx.strokeStyle = 'rgba(60,35,15,.22)';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 40; k++) {
        const y = r() * S;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= S; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + k) * 2.5);
        ctx.stroke();
    }
    // Kvister
    for (let k = 0; k < 3; k++) {
        ctx.fillStyle = 'rgba(70,40,15,.35)';
        ctx.beginPath();
        ctx.ellipse(r() * S, r() * S, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    grain(ctx, S, S, 800, r, 0.05);
    return toTexture(c, true);
}

/** Travertin: lys stein med små porer i lag. */
export function paintTravertine(seed: number, fluted = false): THREE.CanvasTexture {
    const S = 256;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(seed);
    ctx.fillStyle = '#cdbb98';
    ctx.fillRect(0, 0, S, S);
    // Steinblokker med fuger
    ctx.fillStyle = 'rgba(110,90,60,.35)';
    ctx.fillRect(0, S / 2 - 1, S, 2);
    ctx.fillRect(S * 0.3, 0, 2, S / 2);
    ctx.fillRect(S * 0.75, S / 2, 2, S / 2);
    // Porer og lag i gråbeige toner, typisk for travertin
    for (let k = 0; k < 12; k++) {
        ctx.fillStyle = `rgba(${r() < 0.5 ? '235,225,205' : '150,135,110'},.18)`;
        ctx.fillRect(0, r() * S, S, 1 + r() * 5);
    }
    // Travertinens små, flate porer i lag
    for (let k = 0; k < 110; k++) {
        ctx.fillStyle = `rgba(120,100,70,${0.15 + r() * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(r() * S, r() * S, 1.5 + r() * 5, 0.5 + r() * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    if (fluted) {
        // Malt søyle: brede rifler og noen få grep (mørke hakk) å klatre i
        ctx.fillStyle = '#d8c7a4';
        ctx.fillRect(0, 0, S, S);
        for (let x = 0; x < S; x += 64) {
            const g = ctx.createLinearGradient(x, 0, x + 64, 0);
            g.addColorStop(0, 'rgba(110,85,50,.45)');
            g.addColorStop(0.5, 'rgba(255,248,225,.35)');
            g.addColorStop(1, 'rgba(110,85,50,.45)');
            ctx.fillStyle = g;
            ctx.fillRect(x, 0, 64, S);
        }
        ctx.fillStyle = 'rgba(60,45,25,.6)';
        for (let y = 40; y < S; y += 128) for (let x = 20; x < S; x += 128) ctx.fillRect(x, y, 24, 8);
    }
    grain(ctx, S, S, 900, r, 0.06);
    return toTexture(c, true);
}

/** Tørr puss som sprekker (kjeden som løsner). */
export function paintDryPlaster(): THREE.CanvasTexture {
    const S = 256;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(77);
    ctx.fillStyle = '#f3ecdc';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(120,95,60,.55)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 9; k++) {
        ctx.beginPath();
        let x = r() * S;
        let y = r() * S;
        ctx.moveTo(x, y);
        for (let s = 0; s < 7; s++) {
            x += (r() - 0.5) * 60;
            y += (r() - 0.5) * 60;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    grain(ctx, S, S, 1500, r, 0.08);
    return toTexture(c, true);
}

/** Våt puss på plankene: grå, blank og flekkete. */
export function paintWetPlaster(): THREE.CanvasTexture {
    const S = 256;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(12);
    ctx.clearRect(0, 0, S, S);
    for (let k = 0; k < 14; k++) {
        const x = r() * S;
        const y = r() * S;
        const rad = 20 + r() * 40;
        const g = ctx.createRadialGradient(x, y, 1, x, y, rad);
        g.addColorStop(0, 'rgba(111,106,98,.95)');
        g.addColorStop(0.7, 'rgba(111,106,98,.85)');
        g.addColorStop(1, 'rgba(111,106,98,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    // Blanke gjenskinn
    for (let k = 0; k < 30; k++) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath();
        ctx.ellipse(r() * S, r() * S, 3 + r() * 6, 1.2, r() * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    return toTexture(c, true);
}

/** Glass i vinduet: rundbuet, lyst, med blyinnfatning. Alfa gir buen. */
export function paintWindowGlass(): THREE.CanvasTexture {
    const Wd = 128;
    const Ht = 192;
    const { c, ctx } = makeCanvas(Wd, Ht);
    ctx.clearRect(0, 0, Wd, Ht);
    const g = ctx.createLinearGradient(0, 0, 0, Ht);
    g.addColorStop(0, '#fffdf2');
    g.addColorStop(1, '#f6e8c4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, Ht);
    ctx.lineTo(0, Wd / 2);
    ctx.arc(Wd / 2, Wd / 2, Wd / 2, Math.PI, 0);
    ctx.lineTo(Wd, Ht);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = 'rgba(160,140,100,.55)';
    ctx.lineWidth = 2;
    for (let x = 0; x < Wd; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Ht, Ht);
        ctx.moveTo(x, 0);
        ctx.lineTo(x - Ht, Ht);
        ctx.stroke();
    }
    return toTexture(c);
}

/** Myk gradient for lyssøylene: sterkt ved vinduet, blekner nedover og mot kantene. */
export function paintShaft(): THREE.CanvasTexture {
    const Wd = 64;
    const Ht = 256;
    const { c, ctx } = makeCanvas(Wd, Ht);
    const along = ctx.createLinearGradient(0, 0, 0, Ht);
    along.addColorStop(0, 'rgba(255,240,200,1)');
    along.addColorStop(0.6, 'rgba(255,235,190,.55)');
    along.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = along;
    ctx.fillRect(0, 0, Wd, Ht);
    ctx.globalCompositeOperation = 'destination-in';
    const side = ctx.createLinearGradient(0, 0, Wd, 0);
    side.addColorStop(0, 'rgba(0,0,0,0)');
    side.addColorStop(0.25, 'rgba(0,0,0,1)');
    side.addColorStop(0.75, 'rgba(0,0,0,1)');
    side.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, Wd, Ht);
    return toTexture(c);
}

/** Rund, myk flekk (lysflekk på gulvet, dis, støv). */
export function paintSoft(color = '255,240,205'): THREE.CanvasTexture {
    const S = 64;
    const { c, ctx } = makeCanvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
    g.addColorStop(0, `rgba(${color},1)`);
    g.addColorStop(0.5, `rgba(${color},.45)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return toTexture(c);
}

/** Dagens felt i taket (puss-klokka): uregelmessig kant, så tørkingen ser ekte ut. */
export function paintWetPatch(): THREE.CanvasTexture {
    const S = 128;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(33);
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = ART.wet;
    ctx.beginPath();
    for (let k = 0; k <= 28; k++) {
        const a = (k / 28) * Math.PI * 2;
        const rr = S * (0.44 + r() * 0.05);
        const x = S / 2 + Math.cos(a) * rr * 1.05;
        const y = S / 2 + Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    for (let k = 0; k < 40; k++) ctx.fillRect(S * 0.15 + r() * S * 0.7, S * 0.15 + r() * S * 0.7, 3, 1);
    return toTexture(c);
}
