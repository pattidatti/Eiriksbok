// Kunsten i Tinghuset: landssvikarkivet fra 1945-48. Gjennomslagspapir, arkivpapp,
// fiolett stempelblekk og rød-blå blyant. Alt som er dyrt (papirfiber, korn, vignett,
// rødblyant-skravering, mappene) tegnes ÉN gang i offscreen-canvas og gjenbrukes.
// `lav` ser ferdig ut: vignett og korn er bakt inn; høyere nivåer legger bare til flere
// fibre og blekkspruting.

import { seeded } from '../sim';
import { H, W } from './layout';
import type { Kind } from './state';

export const PAPER = '#d9dad2';
export const PAPER_LIGHT = '#e7e7e0';
export const SLIP = '#efeee6';
export const INK = '#2a2731';
export const VIOLET = '#5b3e8c';
export const BLUE = '#2e5b98';
export const RED = '#b3342a';
export const RED_SOFT = '#cf7a6f';
export const CARD = '#b49a62';
export const CARD_GREY = '#a7a69c';
export const DESK = '#3b3530';
export const MONO = '"Courier New", Courier, ui-monospace, monospace';
export const BIG = 'Outfit, Inter, system-ui, sans-serif';

export type Tier = 'lav' | 'middels' | 'hoy';

/** Kvalitetsnivået: ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. */
export function pickTier(): Tier {
    try {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        if (q === 'lav' || q === 'middels' || q === 'hoy') return q;
        const cores = navigator.hardwareConcurrency ?? 4;
        return cores >= 8 ? 'hoy' : cores >= 4 ? 'middels' : 'lav';
    } catch {
        return 'lav';
    }
}

/** Stempelblekket blekner år for år: 100 % i 1945, 75 % i 1946, 50 % i 1947, 30 % i 1948. */
export function inkAlpha(mnd: number): number {
    const year = Math.floor((4 + mnd) / 12);
    return [1, 0.75, 0.5, 0.3][Math.min(3, year)];
}

function mk(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return [c, c.getContext('2d')!] as const;
}

/** Maskinskrift: litt ujevnt blekk (en svak dobbelttegning, som et fargebånd som går tomt). */
export function typed(
    ctx: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    size: number,
    color = INK,
    align: CanvasTextAlign = 'left',
    bold = true
) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${MONO}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * 0.28;
    ctx.fillText(t, x + 0.6, y + 0.4);
    ctx.globalAlpha = a * 0.92;
    ctx.fillText(t, x, y);
    ctx.globalAlpha = a;
}

/** Store tall i Outfit, fet. */
export function big(
    ctx: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    size: number,
    color = INK,
    align: CanvasTextAlign = 'left'
) {
    ctx.font = `800 ${size}px ${BIG}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
}

/**
 * En blyantstrek: tre tynne, litt forskjøvne linjer med korn - aldri en glatt vektorstrek.
 * `k` (0-1) tegner bare så stor del av streken (streken «tegnes»).
 */
export function pencil(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    seed = 1,
    k = 1,
    width = 1.4
) {
    const ex = x0 + (x1 - x0) * k;
    const ey = y0 + (y1 - y0) * k;
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const len = Math.hypot(nx, ny) || 1;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 1.1 + Math.sin(seed * 7.3 + i * 2.1) * 0.5;
        const bow = Math.sin(seed * 3.1 + i) * 5;
        const ox = (nx / len) * off;
        const oy = (ny / len) * off;
        ctx.globalAlpha = i === 1 ? 0.85 : 0.45;
        ctx.lineWidth = i === 1 ? width : width * 0.7;
        ctx.setLineDash(i === 1 ? [] : [7 + i * 3, 2.5, 3, 1.5]);
        ctx.beginPath();
        ctx.moveTo(x0 + ox, y0 + oy);
        const mx = (x0 + ex) / 2 + (nx / len) * bow * k;
        const my = (y0 + ey) / 2 + (ny / len) * bow * k;
        ctx.quadraticCurveTo(mx + ox, my + oy, ex + ox, ey + oy);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

export interface Art {
    /** Device-piksler per verdensenhet teksturene er tegnet i. */
    k: number;
    paper: HTMLCanvasElement;
    hatch: HTMLCanvasElement;
    dark: HTMLCanvasElement;
    folders: Record<Kind, HTMLCanvasElement>;
    knob: HTMLCanvasElement;
    tier: Tier;
}

/** Protokollarket: papir med fiber, linjering, svake gamle stempler og bakt vignett. */
function makePaper(k: number, tier: Tier) {
    const [c, x] = mk(W * k, H * k);
    x.scale(k, k);
    const rng = seeded(1945);
    x.fillStyle = PAPER;
    x.fillRect(0, 0, W, H);
    // Svake skjolder i papiret.
    for (let i = 0; i < 14; i++) {
        const cx = rng() * W;
        const cy = rng() * H;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, 60 + rng() * 140);
        g.addColorStop(0, `rgba(${rng() < 0.5 ? '255,255,250' : '170,168,150'},0.10)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
    }
    // Papirfiber og korn.
    const fibers = tier === 'lav' ? 1400 : tier === 'middels' ? 2600 : 4200;
    x.lineWidth = 0.5;
    for (let i = 0; i < fibers; i++) {
        const px = rng() * W;
        const py = rng() * H;
        const a = rng() * Math.PI;
        const l = 2 + rng() * 7;
        x.strokeStyle = rng() < 0.5 ? 'rgba(60,58,70,0.07)' : 'rgba(255,255,255,0.18)';
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
        x.stroke();
    }
    for (let i = 0; i < 2600; i++) {
        x.fillStyle = `rgba(42,39,49,${0.03 + rng() * 0.06})`;
        x.fillRect(rng() * W, rng() * H, 0.8, 0.8);
    }
    // Linjeringen i protokollen (midtfeltet) og margstrekene.
    x.strokeStyle = 'rgba(46,91,152,0.10)';
    x.lineWidth = 0.8;
    for (let y = 150; y < H - 10; y += 22) {
        x.beginPath();
        x.moveTo(296, y);
        x.lineTo(640, y);
        x.stroke();
    }
    x.strokeStyle = 'rgba(179,52,42,0.22)';
    x.beginPath();
    x.moveTo(292, 0);
    x.lineTo(292, H);
    x.moveTo(296, 0);
    x.lineTo(296, H);
    x.stroke();
    // Arkhodet, maskinskrevet.
    x.globalAlpha = 0.75;
    typed(x, 'PÅTALEMYNDIGHETEN', 466, 22, 11, INK, 'center');
    typed(x, 'PROTOKOLL FOR LANDSSVIKSAKER', 466, 38, 13, INK, 'center');
    x.globalAlpha = 0.35;
    x.fillStyle = INK;
    x.fillRect(330, 50, 272, 1);
    x.globalAlpha = 1;
    // Gamle, falmede stempelavtrykk på arket.
    const ghost = (t: string, gx: number, gy: number, r: number) => {
        x.save();
        x.translate(gx, gy);
        x.rotate(r);
        x.globalAlpha = 0.07;
        x.strokeStyle = VIOLET;
        x.lineWidth = 2.5;
        x.strokeRect(-70, -13, 140, 26);
        typed(x, t, 0, 1, 14, VIOLET, 'center');
        x.restore();
        x.globalAlpha = 1;
    };
    ghost('LANDSSVIKSAK', 520, 120, -0.08);
    ghost('DOM AVSAGT', 400, 505, 0.05);
    ghost('FORELEGG VEDTATT', 560, 470, -0.12);
    if (tier !== 'lav') {
        // Blekkspruting fra stemplene.
        for (let i = 0; i < 40; i++) {
            x.fillStyle = `rgba(91,62,140,${0.04 + rng() * 0.08})`;
            x.beginPath();
            x.arc(300 + rng() * 600, rng() * H, 0.6 + rng() * 1.6, 0, Math.PI * 2);
            x.fill();
        }
    }
    // Lampevignett i hjørnene (flatt kontorlys ovenfra).
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.66);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(30,26,34,0.30)');
    x.fillStyle = v;
    x.fillRect(0, 0, W, H);
    return c;
}

/** Rødblyant-skravering som kryper inn fra høyre marg når sinnet stiger. */
function makeHatch(k: number) {
    const [c, x] = mk(W * k, H * k);
    x.scale(k, k);
    const rng = seeded(1948);
    x.strokeStyle = RED;
    for (let i = 0; i < 900; i++) {
        const px = rng() * (W + 60) - 30;
        const py = rng() * H;
        const l = 14 + rng() * 26;
        x.globalAlpha = 0.12 + rng() * 0.22;
        x.lineWidth = 0.7 + rng() * 0.9;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + l * 0.55, py - l);
        x.stroke();
    }
    return c;
}

/** Kantene mørkner med sinnet (tegnes med globalAlpha = sinne). */
function makeDark(k: number) {
    const s = Math.min(1, k);
    const [c, x] = mk(W * s, H * s);
    x.scale(s, s);
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.7, 'rgba(40,10,12,0.25)');
    v.addColorStop(1, 'rgba(40,10,12,0.75)');
    x.fillStyle = v;
    x.fillRect(0, 0, W, H);
    return c;
}

/** En mappe i arkivpapp, ferdigtegnet. Alvorlige har rødblyant-hjørne, tykke har binders. */
function makeFolder(kind: Kind, k: number) {
    const fw = 46;
    const fh = kind === 'tykk' ? 36 : 30;
    const pad = 4;
    const [c, x] = mk((fw + pad * 2) * k, (fh + pad * 2) * k);
    x.scale(k, k);
    x.translate(pad, pad);
    const rng = seeded(kind === 'lett' ? 3 : kind === 'alvorlig' ? 5 : 7);
    // Skygge.
    x.fillStyle = 'rgba(30,26,34,0.22)';
    x.fillRect(1.5, 2.5, fw, fh);
    if (kind === 'tykk') {
        // Papirene som stikker ut av en tykk mappe.
        x.fillStyle = '#e9e7dc';
        x.fillRect(2, -2, fw - 6, fh);
        x.fillStyle = '#dcd9cc';
        x.fillRect(4, -3.5, fw - 10, 4);
    }
    // Fliken.
    x.fillStyle = kind === 'lett' ? '#9a998f' : '#a58b55';
    x.fillRect(4, -3, 16, 5);
    x.fillStyle = kind === 'lett' ? CARD_GREY : CARD;
    x.fillRect(0, 0, fw, fh);
    // Pappfiber.
    for (let i = 0; i < 70; i++) {
        x.fillStyle = rng() < 0.5 ? 'rgba(60,45,20,0.12)' : 'rgba(255,250,235,0.16)';
        x.fillRect(rng() * fw, rng() * fh, 1.6, 0.6);
    }
    // Etikett.
    x.fillStyle = '#efece0';
    x.fillRect(4, 4, fw - 8, 11);
    x.strokeStyle = 'rgba(42,39,49,0.6)';
    x.lineWidth = 0.8;
    x.strokeRect(0.5, 0.5, fw - 1, fh - 1);
    if (kind !== 'lett') {
        // Rødblyant-hjørne: grove streker.
        x.strokeStyle = RED;
        x.lineWidth = 1.6;
        for (let i = 0; i < 6; i++) {
            x.globalAlpha = 0.85;
            x.beginPath();
            x.moveTo(fw - 15 + i * 2.4, 0.5);
            x.lineTo(fw - 0.5, 15 - i * 2.4);
            x.stroke();
        }
        x.globalAlpha = 1;
    }
    if (kind === 'tykk') {
        // Binders.
        x.strokeStyle = '#7d7f86';
        x.lineWidth = 1.3;
        x.beginPath();
        x.moveTo(10, -6);
        x.lineTo(10, 6);
        x.arc(13, 6, 3, Math.PI, 0, true);
        x.lineTo(16, -4);
        x.arc(14, -4, 2, 0, Math.PI, true);
        x.lineTo(12, 3);
        x.stroke();
    }
    return c;
}

/** Treskaftet på et gummistempel sett ovenfra. */
function makeKnob(k: number) {
    const r = 17;
    const [c, x] = mk((r * 2 + 8) * k, (r * 2 + 8) * k);
    x.scale(k, k);
    x.translate(r + 4, r + 4);
    x.fillStyle = 'rgba(20,16,14,0.35)';
    x.beginPath();
    x.arc(2, 3, r, 0, Math.PI * 2);
    x.fill();
    const g = x.createRadialGradient(-5, -6, 2, 0, 0, r);
    g.addColorStop(0, '#b98c5a');
    g.addColorStop(0.6, '#8a5f36');
    g.addColorStop(1, '#5a3b20');
    x.fillStyle = g;
    x.beginPath();
    x.arc(0, 0, r, 0, Math.PI * 2);
    x.fill();
    // Årringer.
    x.strokeStyle = 'rgba(60,35,15,0.35)';
    x.lineWidth = 0.7;
    for (let i = 3; i < r; i += 3.5) {
        x.beginPath();
        x.ellipse(1, 1, i, i * 0.86, 0.4, 0, Math.PI * 2);
        x.stroke();
    }
    x.fillStyle = 'rgba(255,240,215,0.25)';
    x.beginPath();
    x.ellipse(-6, -7, 6, 3.5, -0.6, 0, Math.PI * 2);
    x.fill();
    return c;
}

export function makeArt(k: number, tier: Tier): Art {
    return {
        k,
        tier,
        paper: makePaper(k, tier),
        hatch: makeHatch(Math.min(k, 1.5)),
        dark: makeDark(k),
        folders: {
            lett: makeFolder('lett', k),
            alvorlig: makeFolder('alvorlig', k),
            tykk: makeFolder('tykk', k),
        },
        knob: makeKnob(k),
    };
}
