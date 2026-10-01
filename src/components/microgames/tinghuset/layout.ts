// Hvor alt står på protokollarket (verdenskoordinater 960×540), og treff for pekeren.
// Tegningen (draw.ts) og komponenten (Tinghuset.tsx) bruker de samme funksjonene, så det
// eleven ser og det eleven treffer, alltid er det samme.

import { TUNING } from './tuning';
import type { Folder, Game } from './state';

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

export const FOLDER_W = 46;
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

// Plass til sju skranker: forelegg, avvis og opptil fem rettssaler.
const DESK_X = 662;
const DESK_W = 176;
const DESK_H = 58;
const DESK_TOP = 64;
const DESK_STEP = 67;

/** Domstabellen øverst på protokollarket: hva hver sakstype får i dag, og neste trinn. */
export const TABLE: Rect = { x: 300, y: 54, w: 344, h: 92 };
/** Nederst på arket: folk utenfor tinghuset, én rødblyant-strek per 1,5 % sinne. */
export const CROWD: Rect = { x: 300, y: 470, w: 344, h: 62 };

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

export const deskRect = (i: number): Rect => ({
    x: DESK_X,
    y: DESK_TOP + i * DESK_STEP,
    w: DESK_W,
    h: DESK_H,
});

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

/** Kortene: tre maskinskrevne lapper midt på arket, aldri over leirene eller skrankene. */
export function cardRects(n: number): Rect[] {
    return Array.from({ length: n }, (_, i) => ({ x: 318, y: 292 + i * 78, w: 250, h: 68 }));
}

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
            x: r.x + 34 + col * 49 + layer * 5,
            y: r.y + 40 + row * 24 - layer * 4,
        });
    }
    return out;
}

/** Hvor en mappe hører hjemme akkurat nå (leir, kø eller skranke). null = på vei. */
export function homeOf(g: Game, f: Folder, slots: Map<number, Pt>): Pt | null {
    if (f.state === 'leir') return slots.get(f.id) ?? null;
    if (f.state === 'ko') {
        const k = g.desks[f.desk]?.queue.indexOf(f.id) ?? 0;
        return queueSpot(f.desk, Math.max(0, k));
    }
    if (f.state === 'behandles') {
        const r = deskRect(f.desk);
        const d = g.desks[f.desk];
        const second = d.joint === f.id;
        return d.kind === 'rett'
            ? { x: r.x + 44 + (second ? 8 : 0), y: r.y + 34 + (second ? 4 : 0) }
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
    for (let i = 0; i < g.desks.length; i++) {
        const r = deskRect(i);
        if (inside({ x: r.x - 130, y: r.y - 6, w: r.w + 136, h: r.h + 12 }, x, y)) return i;
    }
    return -1;
}
