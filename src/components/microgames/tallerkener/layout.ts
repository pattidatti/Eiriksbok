// Hvor alt står på skjermen (logisk flate 960x540) og treff for pekeren.
// Gråboks: scenen sett rett forfra; stenger bakover står høyere og er mindre.

import { SLOTS } from './levels';
import { TUNING } from './tuning';

export const W = 960;
export const H = 540;

export interface Pt {
    x: number;
    y: number;
}

/** Skalaen for en stang etter dybden (1 ved rampen). */
export function dybdeSkala(dybde: number): number {
    return 1 - dybde * 0.17;
}

/** Midten av tallerkenen på stang `slot`. */
export function platePos(slot: number): Pt {
    const d = SLOTS[slot];
    const k = dybdeSkala(d.dybde);
    return { x: W / 2 + d.x * 330 * k, y: 290 - d.dybde * 52 };
}

/** Foten av stanga (på scenegulvet). */
export function poleFoot(slot: number): Pt {
    const d = SLOTS[slot];
    const p = platePos(slot);
    return { x: p.x, y: 452 - d.dybde * 40 };
}

/** Halvaksene til tallerkenens ellipse. */
export function plateRadius(slot: number): { rx: number; ry: number } {
    const k = dybdeSkala(SLOTS[slot].dybde);
    return { rx: 50 * k, ry: 16 * k };
}

/** Kista foran rampen. */
export const CHEST = { x: W / 2 - 60, y: 470, w: 120, h: 56 };

/** Parlamentets tinntallerken: oppe i taket, nede i rekkevidde, og foran rampen når den øser. */
export const TIN = {
    oppe: { x: W / 2 + 230, y: 112 },
    nede: { x: W / 2 + 230, y: 178 },
    oser: { x: 840, y: 440 },
    rx: 66,
    ry: 20,
};

/** Krokene i taket der parlamentet henger stengene det har tatt. */
export function hookPos(i: number): Pt {
    const n = TUNING.parlament.kroker;
    return { x: W / 2 - 250 + (500 / (n - 1)) * i, y: 22 };
}

/** Siden står litt til høyre for stanga den bærer tallerkenen til. */
export function pagePos(slot: number): Pt {
    const p = platePos(slot);
    const f = poleFoot(slot);
    return { x: p.x + 70 * dybdeSkala(SLOTS[slot].dybde), y: f.y - 40 };
}

/** Avstand fra et punkt til en tallerken, målt i ellipsens egne enheter (1 = på kanten). */
export function ellipseDist(slot: number, q: Pt): number {
    const c = platePos(slot);
    const r = plateRadius(slot);
    return Math.hypot((q.x - c.x) / r.rx, (q.y - c.y) / r.ry);
}

/** Krysser linjestykket a-b tallerkenen? Testes i ellipsens enheter med litt slingringsmonn. */
export function segmentHits(slot: number, a: Pt, b: Pt, slark = 1.25): boolean {
    const c = platePos(slot);
    const r = plateRadius(slot);
    // Gjør ellipsen til en sirkel med radius 1 og test avstanden til linjestykket.
    const ax = (a.x - c.x) / r.rx;
    const ay = (a.y - c.y) / (r.ry * 2.2);
    const bx = (b.x - c.x) / r.rx;
    const by = (b.y - c.y) / (r.ry * 2.2);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    return Math.hypot(ax + dx * t, ay + dy * t) <= slark;
}

/** Sveipefart i logiske piksler per sekund som tilsvarer fart 1 (et raskt kast). */
export const FART_REF = 1300;
