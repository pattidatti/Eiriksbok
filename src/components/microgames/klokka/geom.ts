// Geometrien i tegningen: et virtuelt ark på 960x540 som skaleres inn i canvasen.
// Snittet av skipet krenger rundt PIVOT; vannet og båtene som henger, holder seg loddrette.
// Brukes av draw.ts (tegningen), fx.ts (effektene) og komponenten (ankere og peker).

import type { Side } from './levels';
import { krengning, vannDekk } from './rules';
import type { Båt, Game } from './state';

export const ARK = { w: 960, h: 540 };
export const MIDT = 480;
export const PIVOT = { x: 480, y: 300 };
/** Dekk i: 0 = G-dekk, 7 = båtdekket. */
export const DEKK_Y = (i: number) => 160 + (7 - i) * 38;
export const SKROG = { x0: 338, x1: 622, kjøl: 464, rund: 34 };
/** Toppen av daviten på hver side (i skipets ramme). */
export const DAVIT: Record<Side, { x: number; y: number }> = {
    B: { x: 266, y: 112 },
    S: { x: 694, y: 112 },
};
export const BÅT_W = 124;
export const BÅT_H = 24;
/** Tauet når båten henger ved dekket. */
export const TAU = 38;
/** Trappene: x, og hvilket dekk klassen bor på. */
export const TRAPP: Record<1 | 2 | 3, { x: number; fra: number }> = {
    1: { x: 392, fra: 5 },
    2: { x: 462, fra: 3 },
    3: { x: 546, fra: 0 },
};

/** Krengningen som vinkel i radianer (pluss = styrbord, høyre side ned). */
export const vinkel = (t: number) => (krengning(t) * Math.PI) / 180;

/** Et punkt i skipets ramme -> arket, etter krengningen. */
export function iVerden(x: number, y: number, a: number) {
    const dx = x - PIVOT.x;
    const dy = y - PIVOT.y;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: PIVOT.x + dx * c - dy * s, y: PIVOT.y + dx * s + dy * c };
}

/** Vannflata (y på arket). */
export const vannY = (t: number) => DEKK_Y(vannDekk(t)) + 16;

/** Skrogveggen på en side, som x på arket i høyden y (etter krengningen). */
export function skrogX(side: Side, y: number, a: number) {
    const x0 = side === 'B' ? SKROG.x0 : SKROG.x1;
    // Linja går gjennom (x0, y0) i skipets ramme; finn x der den krysser y på arket.
    const p = iVerden(x0, DEKK_Y(7), a);
    return p.x - Math.tan(a) * (y - p.y);
}

/** Hvor båten er nå: midten av relingen (x, y) og hvor langt ned den er. */
export function båtPos(g: Game, b: Båt) {
    const a = vinkel(g.t);
    const tip = iVerden(DAVIT[b.side].x, DAVIT[b.side].y, a);
    const topp = tip.y + TAU;
    const bunn = vannY(g.t) - BÅT_H * 0.45;
    const y = topp + Math.max(0, bunn - topp) * b.ned;
    let x = tip.x;
    // På den høye siden henger båten inn mot skroget og skraper langs det.
    const vegg = skrogX(b.side, y + BÅT_H, a);
    if (b.side === 'B') x = Math.min(x, vegg - BÅT_W / 2 - 3);
    else x = Math.max(x, vegg + BÅT_W / 2 + 3);
    return { x, y, tip };
}

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}
export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / ARK.w, h / ARK.h);
    return { s, ox: (w - ARK.w * s) / 2, oy: (h - ARK.h * s) / 2 };
};
/** Fra CSS-piksler i canvasen til arket. */
export const tilArk = (k: Skala, x: number, y: number) => ({
    x: (x - k.ox) / k.s,
    y: (y - k.oy) / k.s,
});
/** Fra arket til CSS-piksler i canvasen (ankere for lappene). */
export const fraArk = (k: Skala, x: number, y: number) => ({
    x: k.ox + x * k.s,
    y: k.oy + y * k.s,
});

/** Hva pekeren treffer: en båtside, landgangen (køen) eller ingenting. */
export function treff(x: number, y: number): Side | 'landgang' | null {
    // Tittelfeltene nede i hjørnene er ikke spillflate.
    if (y > 410 && (x < 168 || x > 792)) return null;
    if (y > 64 && y < 530) {
        if (x < SKROG.x0 - 4) return 'B';
        if (x > SKROG.x1 + 4) return 'S';
    }
    if (x >= SKROG.x0 - 4 && x <= SKROG.x1 + 4 && y > 70 && y < 230) return 'landgang';
    return null;
}
