// Effektene som bare er til å se på: folk som går over landgangen, lanterner som tennes,
// plask, båter som driver ut i mørket og nødrakettene. Ingen spillregler her - fx leser
// hendelsene fra game.ts og tegnes av draw.ts. Tiden er spillets tid (g.t), så alt står
// stille i pausen og går i sakte film med lærings-øyeblikkene.

import type { Side } from './levels';
import type { Game, Hendelse } from './state';
import { båtPos } from './geom';

export interface Gåer {
    side: Side;
    t0: number;
    båt: number;
    seed: number;
}

export interface Fx {
    gåere: Gåer[];
    plask: { x: number; y: number; t0: number; stor: boolean }[];
    /** Når hver plass i hver båt ble tent (g.t), -1 = mørk. */
    tent: number[][];
    raketter: { t0: number; dx: number }[];
    /** Båter som er nede og driver ut i mørket. */
    driver: { båt: number; side: Side; t0: number; plass: number; x0: number }[];
    /** «FULL»-stempelet på båten som akkurat landet full. */
    stempel: { båt: number; t0: number; x: number; y: number }[];
    /** Båter vannet tok (en kort strek som synker). */
    tapt: { x: number; y: number; t0: number }[];
    nesteDrift: Record<Side, number>;
}

export function nyFx(g: Game): Fx {
    return {
        gåere: [],
        plask: [],
        tent: g.båter.map((b) => new Array(b.plasser).fill(-1)),
        raketter: [],
        driver: [],
        stempel: [],
        tapt: [],
        nesteDrift: { B: 0, S: 0 },
    };
}

/** Les hendelsene fra spillet inn i effektene. */
export function fxHendelse(fx: Fx, g: Game, h: Hendelse) {
    if (h.slag === 'ombord' && h.båt !== undefined && h.side) {
        const i = h.plass ?? -1;
        if (i >= 0 && i < fx.tent[h.båt].length) fx.tent[h.båt][i] = g.t + 0.35;
        if (fx.gåere.length < 40)
            fx.gåere.push({ side: h.side, t0: g.t, båt: h.båt, seed: Math.random() });
    } else if (h.slag === 'nede' && h.båt !== undefined && h.side) {
        const b = g.båter[h.båt];
        const p = båtPos(g, b);
        fx.plask.push({ x: p.x, y: p.y + 18, t0: g.t, stor: true });
        if (b.folk >= b.plasser) fx.stempel.push({ båt: b.nr, t0: g.t, x: p.x, y: p.y });
        fx.driver.push({
            båt: b.nr,
            side: h.side,
            t0: g.t,
            plass: fx.nesteDrift[h.side]++,
            x0: p.x,
        });
    } else if (h.slag === 'rakett') {
        fx.raketter.push({ t0: g.t, dx: (Math.random() - 0.5) * 60 });
    } else if (h.slag === 'tapt' && h.båt !== undefined) {
        const p = båtPos(g, g.båter[h.båt]);
        fx.tapt.push({ x: p.x, y: p.y, t0: g.t });
        fx.plask.push({ x: p.x, y: p.y + 12, t0: g.t, stor: false });
    }
}

/** Rydd bort det som er ferdig. */
export function fxRydd(fx: Fx, t: number) {
    fx.gåere = fx.gåere.filter((w) => t - w.t0 < 0.5);
    fx.plask = fx.plask.filter((p) => t - p.t0 < 2.5);
    fx.raketter = fx.raketter.filter((r) => t - r.t0 < 5);
    fx.stempel = fx.stempel.filter((s) => t - s.t0 < 2.4);
    fx.tapt = fx.tapt.filter((s) => t - s.t0 < 3);
}

/** Hvor sterkt rakettlyset er nå (0-1). */
export function rakettLys(fx: Fx, t: number): number {
    let l = 0;
    for (const r of fx.raketter) {
        const s = t - r.t0 - 1.1;
        if (s >= 0 && s < 3) l = Math.max(l, (1 - s / 3) ** 1.6);
    }
    return l;
}
