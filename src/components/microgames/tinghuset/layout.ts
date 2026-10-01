// Hvor alt står på protokollarket (verdenskoordinater 960×540), og treff for pekeren.
// Tegningen (draw.ts) og komponenten (Tinghuset.tsx) bruker de samme funksjonene, så det
// eleven ser og det eleven treffer, alltid er det samme.

import { TUNING } from './tuning';
import type { Folder, Game, Route } from './state';

export const W = TUNING.world.w;
export const H = TUNING.world.h;

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface Pt {
    x: number;
    y: number;
}

export const FOLDER_W = 50;
export const FOLDER_H = 30;

/** Avrivningskalenderen øverst til venstre, linjalen rett under. */
export const CAL: Rect = { x: 16, y: 8, w: 150, h: 92 };
export const GOAL: Rect = { x: 176, y: 14, w: 104, h: 80 };
export const RULER: Rect = { x: 16, y: 106, w: 264, h: 22 };

const CAMP_X = 16;
const CAMP_W = 264;
const CAMP_TOP = 140;
const CAMP_H = 104;
const CAMP_STEP = 110;

// Høyre kolonne: tre stempler (forelegg, avvis, interner) og under dem én rettssal-hylle
// med opptil fem dommerplasser.
const DESK_X = 662;
const DESK_W = 176;
const STAMP_H = 50;
const STAMP_Y: Record<Exclude<Route, 'rett'>, number> = { forelegg: 64, avvis: 120, interner: 176 };
const SEAT_TOP = 250;
const SEAT_H = 50;
const SEAT_STEP = 56;
/** Rettssal-hylla: én ramme rundt alle dommerplassene. */
export const COURT: Rect = { x: DESK_X - 6, y: 232, w: DESK_W + 12, h: 300 };

// Hvilken skranke som er hvilken (rekkefølgen i g.desks er den de kom i). Tegningen og
// pekeren kaller syncDesks(g) før de spør om en skranke sin plass.
let KINDS: Route[] = ['forelegg', 'avvis'];
export function syncDesks(g: Game) {
    KINDS = g.desks.map((d) => d.kind);
}

/** Domstabellen øverst på protokollarket: hva hver sakstype får i dag, og neste trinn. */
export const TABLE: Rect = { x: 300, y: 54, w: 344, h: 92 };
/** Nederst på arket: folk utenfor tinghuset, silhuetter som blir flere med sinnet. */
export const CROWD: Rect = { x: 296, y: 414, w: 352, h: 118 };

/** Avisa nederst til venstre: overskriftene skifter med året og med det eleven gjør. */
export const AVIS: Rect = { x: 16, y: 472, w: 264, h: 60 };
/** Sinnemåleren: en loddrett rødblyant-søyle i høyre marg. */
export const METER: Rect = { x: 884, y: 76, w: 24, h: 384 };
/** Telleverket (nummereringsstempelet) nederst til høyre. */
export const COUNTER: Rect = { x: 848, y: 474, w: 104, h: 58 };
/** Poeng og multiplikator over skrankene (øverste høyre hjørne er til pause og lyd). */
export const SCORE: Rect = { x: 668, y: 4, w: 170, h: 56 };

export const campRect = (i: number): Rect => ({
    x: CAMP_X,
    y: CAMP_TOP + i * CAMP_STEP,
    w: CAMP_W,
    h: CAMP_H,
});

export function deskRect(i: number): Rect {
    const kind = KINDS[i] ?? 'rett';
    if (kind !== 'rett') return { x: DESK_X, y: STAMP_Y[kind], w: DESK_W, h: STAMP_H };
    let n = 0;
    for (let k = 0; k < i; k++) if (KINDS[k] === 'rett') n++;
    return { x: DESK_X, y: SEAT_TOP + n * SEAT_STEP, w: DESK_W, h: SEAT_H };
}

/** Der streken treffer skranken (venstre kant, midt på). */
export const deskEntry = (i: number): Pt => {
    const r = deskRect(i);
    return { x: r.x - 30, y: r.y + r.h / 2 };
};

/** Mappa nummer k i køen foran skranken: en stabel som vokser mot venstre. */
export const queueSpot = (i: number, k: number): Pt => {
    const e = deskEntry(i);
    const kk = Math.min(k, 14);
    return { x: e.x - kk * 9, y: e.y - kk * 1.5 + (k % 2) * 2 };
};

export const inside = (r: Rect, x: number, y: number) =>
    x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** Hvor hver mappe i en leir ligger (midtpunkt), etter id. */
export function campSlots(g: Game): Map<number, Pt> {
    const out = new Map<number, Pt>();
    const per = new Map<number, number>();
    for (const f of g.folders) {
        if (f.state !== 'leir') continue;
        const k = per.get(f.camp) ?? 0;
        per.set(f.camp, k + 1);
        const r = campRect(f.camp);
        const col = k % 5;
        const row = Math.floor(k / 5) % 3;
        const layer = Math.floor(k / 15);
        out.set(f.id, {
            x: r.x + 36 + col * 49 + layer * 5,
            y: r.y + 39 + row * 25 - layer * 4,
        });
    }
    return out;
}

/** Hvor en mappe hører hjemme akkurat nå (leir, kø eller skranke). null = på vei. */
export function homeOf(g: Game, f: Folder, slots: Map<number, Pt>): Pt | null {
    syncDesks(g);
    if (f.state === 'leir') return slots.get(f.id) ?? null;
    if (f.state === 'ko') {
        const k = g.desks[f.desk]?.queue.indexOf(f.id) ?? 0;
        return queueSpot(f.desk, Math.max(0, k));
    }
    if (f.state === 'behandles') {
        const r = deskRect(f.desk);
        const d = g.desks[f.desk];
        return d.kind === 'rett'
            ? { x: r.x + 78, y: r.y + 26 }
            : { x: r.x + 6, y: r.y + r.h / 2 + 2 };
    }
    return null;
}

/** Mappa under pekeren (bare de som ligger i en leir kan sendes). Raus treffflate. */
export function folderAt(g: Game, x: number, y: number, slots = campSlots(g)): Folder | null {
    let best: Folder | null = null;
    let bd = Infinity;
    for (const f of g.folders) {
        if (f.state !== 'leir') continue;
        const p = slots.get(f.id);
        if (!p) continue;
        const dx = Math.abs(x - p.x);
        const dy = Math.abs(y - p.y);
        if (dx <= FOLDER_W / 2 + 4 && dy <= FOLDER_H / 2 + 4 && dx + dy < bd) {
            bd = dx + dy;
            best = f;
        }
    }
    return best;
}

/** Skranken under pekeren. Køen til venstre teller også som skranken. */
export function deskAt(g: Game, x: number, y: number): number {
    syncDesks(g);
    for (let i = 0; i < g.desks.length; i++) {
        const r = deskRect(i);
        if (inside({ x: r.x - 130, y: r.y - 3, w: r.w + 136, h: r.h + 6 }, x, y)) return i;
    }
    return -1;
}
