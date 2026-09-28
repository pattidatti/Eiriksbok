// Spillreglene i Spøkelseshæren. Ren TypeScript uten React, så robotene kan
// spille hundrevis av runder i en rask simulering (npx tsx).
//
// Fagkjernen (Operasjon Fortitude): tyskerne trakk slutninger av det kameraene
// deres så. Ser spionflyet en stor hær ved Dover, tror de på Calais. Ser det en
// slapp gummitank eller ekte tropper ved Portsmouth, flytter de panserreservene
// mot Normandie.

import { CAMP_SLOTS, DUMMY_SLOTS, MAST, WORLD_H, WORLD_W } from './geo';

export const RUN_SECONDS = 150;
/** Dager fra 1. mai til 6. juni kl. 06.30. */
export const DAYS = 36.27;
/** 5. juni: de ekte troppene går om bord og seiler. */
export const EMBARK_DAY = 35;
export const RADIO_FROM = 52;
export const BELIEF_START = 62;
/** Faller troen på Calais hit, ruller panserreservene mot Normandie. */
export const BELIEF_LOSE = 20;
/** Luft over dette er en stram tank. Under er den slapp - og avslører bløffen. */
export const TAUT = 0.6;
/** Sekunder eleven kan fortsette å pumpe en full tank før den smeller. */
export const POP_AFTER = 0.9;
export const PUMP_RATE = 0.95;
export const HALF_W = 96;
export const WARN = 2.2;

export type Cause = 'gummi' | 'ekte' | 'radio';

export interface Dummy {
    id: number;
    x: number;
    y: number;
    kind: 'tank' | 'fly' | 'baat';
    active: boolean;
    air: number;
    leak: number;
    /** Sekunder til en sprukket tank er lappet. 0 = hel. */
    popped: number;
    /** Sekunder pumpet etter at tanken var full. */
    over: number;
    /** Tid siden sist fotografert (for blink i tegningen). */
    shot: number;
    shotGood: boolean;
}

export interface Unit {
    id: number;
    x: number;
    y: number;
    kind: 'biler' | 'telt' | 'skip';
    active: boolean;
    covered: boolean;
    /** 0-1: nettet trekkes over. */
    net: number;
    age: number;
    shot: number;
    shotGood: boolean;
    /** 5. juni: på vei om bord. */
    leaving: number;
}

export interface Plane {
    id: number;
    ax: number;
    ay: number;
    bx: number;
    by: number;
    /** -WARN..0 = varsel (streken tegnes), 0..1 = flyr, >1 = ferdig. */
    t: number;
    dur: number;
    seen: Set<string>;
    bad: number;
    good: number;
}

export type Fx =
    | { k: 'photo'; x: number; y: number; good: boolean; what: 'gummi' | 'ekte' | 'skjult' | 'stram'; pts: number }
    | { k: 'plane'; x: number; y: number }
    | { k: 'pass'; clean: boolean; combo: number }
    | { k: 'pop'; x: number; y: number }
    | { k: 'arrive'; x: number; y: number }
    | { k: 'newDummy'; x: number; y: number }
    | { k: 'listen' }
    | { k: 'silence' }
    | { k: 'tap'; good: boolean }
    | { k: 'embark' }
    | { k: 'net'; x: number; y: number };

export interface Game {
    t: number;
    day: number;
    belief: number;
    score: number;
    combo: number;
    dummies: Dummy[];
    units: Unit[];
    planes: Plane[];
    nextPlane: number;
    nextUnit: number;
    nextId: number;
    pump: number | null;
    radio: { on: boolean; warn: number; left: number; next: number; taps: number; last: number; windows: number };
    valg: number;
    over: null | 'won' | 'lost';
    loss: Record<Cause, number>;
    cause: Cause;
    stats: { goodShots: number; hidden: number; exposed: number; slack: number; pops: number; passes: number; clean: number; taps: number };
    fx: Fx[];
    embarked: boolean;
    rng: () => number;
    /** Hvor panserreservene står nå: 0 = Calais, 1 = Normandie (tegnes mykt etter troen). */
    panzer: number;
}

export function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

/** Tidspunkter (sekunder) der en ny gummitank kommer til Kent. */
const NEW_DUMMY_AT = [0, 0, 0, 0, 18, 36, 58, 80, 104];

export function newGame(seed: number): Game {
    const rng = mulberry(seed);
    const dummies: Dummy[] = DUMMY_SLOTS.map((s, i) => ({
        id: i,
        x: s.x,
        y: s.y,
        kind: s.kind,
        active: NEW_DUMMY_AT[i] === 0,
        // Den første tanken ligger slapp, så eleven har noe å gjøre med én gang.
        air: i === 0 ? 0.25 : 0.72 + rng() * 0.25,
        leak: 0.8 + rng() * 0.4,
        popped: 0,
        over: 0,
        shot: 9,
        shotGood: true,
    }));
    const units: Unit[] = CAMP_SLOTS.map((s, i) => ({
        id: 100 + i,
        x: s.x,
        y: s.y,
        kind: s.kind,
        active: i < 2,
        covered: i === 1,
        net: i === 1 ? 1 : 0,
        age: 0,
        shot: 9,
        shotGood: true,
        leaving: 0,
    }));
    return {
        t: 0,
        day: 0,
        belief: BELIEF_START,
        score: 0,
        combo: 0,
        dummies,
        units,
        planes: [],
        nextPlane: 2.2,
        nextUnit: 7,
        nextId: 1,
        pump: null,
        radio: { on: false, warn: 0, left: 0, next: RADIO_FROM, taps: 0, last: -9, windows: 0 },
        valg: 0,
        over: null,
        loss: { gummi: 0, ekte: 0, radio: 0 },
        cause: 'gummi',
        stats: { goodShots: 0, hidden: 0, exposed: 0, slack: 0, pops: 0, passes: 0, clean: 0, taps: 0 },
        fx: [],
        embarked: false,
        rng,
        panzer: 0,
    };
}

export const progress = (g: Game) => clamp(g.t / RUN_SECONDS, 0, 1);
export const mult = (g: Game) => clamp(1 + Math.floor(g.combo / 2), 1, 4);
export const daysLeft = (g: Game) => Math.max(0, Math.ceil(EMBARK_DAY + 1 - g.day));

/** Hvor hardt spillet presser nå, 0-1. */
export function pressure(g: Game): number {
    const p = progress(g);
    const threat = 1 - clamp((g.belief - BELIEF_LOSE) / (100 - BELIEF_LOSE), 0, 1);
    return clamp(0.12 + 0.62 * p + 0.26 * threat, 0, 1);
}

/** Planlagt flyrute: en strek over en del av bildet, fra kant til kant. */
function spawnPlane(g: Game) {
    const p = progress(g);
    const r = g.rng();
    // Tidlig: mest over gummihæren, så eleven lærer at kameraet skal se den.
    const wKent = lerp(0.72, 0.45, p);
    const wSW = lerp(0.24, 0.38, p);
    let tx: number, ty: number;
    let angle: number | null = null;
    if (r < wKent) {
        tx = 1080 + g.rng() * 380;
        ty = 330 + g.rng() * 280;
    } else if (r < wKent + wSW) {
        tx = 180 + g.rng() * 520;
        ty = 380 + g.rng() * 230;
    } else {
        // Langs hele kysten - ser både Portsmouth og Dover.
        tx = 800;
        ty = 470 + g.rng() * 90;
        angle = g.rng() < 0.5 ? 0 : Math.PI;
    }
    if (angle === null) {
        const dirs = [0, Math.PI, Math.PI / 2, -Math.PI / 2, 0.5, Math.PI - 0.5, -0.6, Math.PI + 0.6];
        angle = dirs[Math.floor(g.rng() * dirs.length)];
    }
    const L = 1900;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    g.planes.push({
        id: g.nextId++,
        ax: tx - dx * L * 0.5,
        ay: ty - dy * L * 0.5,
        bx: tx + dx * L * 0.5,
        by: ty + dy * L * 0.5,
        t: -WARN,
        dur: lerp(4.8, 3.5, p),
        seen: new Set(),
        bad: 0,
        good: 0,
    });
    g.valg++;
    g.fx.push({ k: 'plane', x: tx, y: ty });
}

/** Hvor på streken (0-1) punktet ligger, og hvor langt fra den. */
export function project(pl: Plane, x: number, y: number) {
    const vx = pl.bx - pl.ax;
    const vy = pl.by - pl.ay;
    const len2 = vx * vx + vy * vy;
    const s = ((x - pl.ax) * vx + (y - pl.ay) * vy) / len2;
    const px = pl.ax + vx * s;
    const py = pl.ay + vy * s;
    return { s, d: Math.hypot(x - px, y - py) };
}

/** Vil dette flyet fotografere punktet, og om hvor mange sekunder? null = nei. */
export function willSee(pl: Plane, x: number, y: number): number | null {
    const { s, d } = project(pl, x, y);
    if (d > HALF_W || s < 0 || s > 1) return null;
    const flown = Math.max(0, pl.t);
    if (s < flown) return null;
    return (s - flown) * pl.dur + Math.max(0, -pl.t);
}

export function planePos(pl: Plane) {
    const t = clamp(pl.t, 0, 1);
    return { x: pl.ax + (pl.bx - pl.ax) * t, y: pl.ay + (pl.by - pl.ay) * t };
}

function hurt(g: Game, n: number, cause: Cause) {
    // Tidlig i mai tilgir tyskerne mer: de har ikke bestemt seg ennå.
    n *= lerp(0.55, 1, progress(g) * 2);
    g.belief = clamp(g.belief - n, 0, 100);
    g.loss[cause] += n;
}

function photograph(g: Game, pl: Plane) {
    const m = mult(g);
    for (const d of g.dummies) {
        if (!d.active) continue;
        const key = 'd' + d.id;
        if (pl.seen.has(key)) continue;
        const { s, d: dist } = project(pl, d.x, d.y);
        if (dist > HALF_W || s > pl.t) continue;
        pl.seen.add(key);
        d.shot = 0;
        if (d.popped > 0 || d.air < TAUT) {
            d.shotGood = false;
            pl.bad++;
            hurt(g, 14, 'gummi');
            g.stats.slack++;
            g.fx.push({ k: 'photo', x: d.x, y: d.y, good: false, what: 'gummi', pts: 0 });
        } else {
            d.shotGood = true;
            pl.good++;
            g.belief = clamp(g.belief + 4, 0, 100);
            const pts = 100 * m;
            g.score += pts;
            g.stats.goodShots++;
            g.fx.push({ k: 'photo', x: d.x, y: d.y, good: true, what: 'stram', pts });
        }
    }
    for (const u of g.units) {
        if (!u.active || u.leaving > 0) continue;
        const key = 'u' + u.id;
        if (pl.seen.has(key)) continue;
        const { s, d: dist } = project(pl, u.x, u.y);
        if (dist > HALF_W || s > pl.t) continue;
        pl.seen.add(key);
        u.shot = 0;
        if (u.covered) {
            u.shotGood = true;
            const pts = 60 * m;
            g.score += pts;
            g.stats.hidden++;
            g.fx.push({ k: 'photo', x: u.x, y: u.y, good: true, what: 'skjult', pts });
        } else {
            u.shotGood = false;
            pl.bad++;
            hurt(g, 10, 'ekte');
            g.stats.exposed++;
            g.fx.push({ k: 'photo', x: u.x, y: u.y, good: false, what: 'ekte', pts: 0 });
        }
    }
}

export interface Io {
    /** Spillet er over: vunnet eller tapt. */
    end?: (won: boolean) => void;
}

export function update(g: Game, dt: number) {
    if (g.over) return;
    g.t += dt;
    const p = progress(g);
    g.day = p * DAYS;

    // Luft lekker. Pumpa fyller den tanken eleven holder på.
    const leakBase = lerp(0.026, 0.07, p);
    for (const d of g.dummies) {
        d.shot += dt;
        if (!d.active) {
            const i = d.id;
            if (g.t >= NEW_DUMMY_AT[i]) {
                d.active = true;
                d.air = 0.2;
                g.valg++;
                g.fx.push({ k: 'newDummy', x: d.x, y: d.y });
            }
            continue;
        }
        if (d.popped > 0) {
            d.popped -= dt;
            if (d.popped <= 0) {
                d.popped = 0;
                d.air = 0.15;
            }
            continue;
        }
        const wasTaut = d.air >= TAUT;
        if (g.pump === d.id) {
            d.air = Math.min(1, d.air + PUMP_RATE * dt);
            d.over = d.air >= 1 ? d.over + dt : 0;
            if (d.over > POP_AFTER) {
                d.over = 0;
                d.popped = 6;
                d.air = 0;
                g.pump = null;
                g.stats.pops++;
                g.combo = 0;
                g.fx.push({ k: 'pop', x: d.x, y: d.y });
            }
        } else {
            d.over = 0;
            d.air = Math.max(0, d.air - leakBase * d.leak * dt);
        }
        if (wasTaut && d.air < TAUT) g.valg++;
    }

    // Nye ekte tropper strømmer inn mot havnene i sørvest.
    for (const u of g.units) {
        u.shot += dt;
        if (u.active) u.age += dt;
        if (u.covered && u.net < 1) u.net = Math.min(1, u.net + dt * 3);
        if (u.leaving > 0) {
            u.leaving += dt;
            if (u.leaving > 2.5) u.active = false;
        }
    }
    if (!g.embarked) {
        g.nextUnit -= dt;
        if (g.nextUnit <= 0) {
            g.nextUnit = lerp(7, 2.8, p) * (0.8 + g.rng() * 0.4);
            const free = g.units.filter((u) => !u.active);
            if (free.length) {
                const u = free[Math.floor(g.rng() * free.length)];
                u.active = true;
                u.covered = false;
                u.net = 0;
                u.age = 0;
                u.shot = 9;
                g.valg++;
                g.fx.push({ k: 'arrive', x: u.x, y: u.y });
            }
        }
        if (g.day >= EMBARK_DAY) {
            // 5. juni: troppene går om bord. Nå er det bare bløffen som teller.
            g.embarked = true;
            for (const u of g.units) if (u.active) u.leaving = 0.01;
            g.fx.push({ k: 'embark' });
        }
    }

    // Spionfly.
    g.nextPlane -= dt;
    if (g.nextPlane <= 0) {
        spawnPlane(g);
        g.nextPlane = lerp(6.6, 2.9, p) * (0.8 + g.rng() * 0.45);
    }
    for (const pl of g.planes) {
        const before = pl.t;
        pl.t += pl.t < 0 ? dt : dt / pl.dur;
        if (before < 0 && pl.t >= 0) pl.t = 0;
        if (pl.t >= 0 && pl.t <= 1.05) photograph(g, pl);
        if (before <= 1 && pl.t > 1) {
            g.stats.passes++;
            if (pl.good + pl.bad > 0) {
                const clean = pl.bad === 0 && pl.good > 0;
                if (clean) {
                    g.combo++;
                    g.stats.clean++;
                } else if (pl.bad > 0) g.combo = 0;
                g.fx.push({ k: 'pass', clean, combo: g.combo });
            }
        }
    }
    g.planes = g.planes.filter((pl) => pl.t <= 1.3);

    // Radio: fra midten av mai lytter tyskerne på eteren.
    const r = g.radio;
    if (g.t >= r.next && !r.on && r.warn <= 0) {
        r.warn = 1.2;
        g.valg++;
        g.fx.push({ k: 'listen' });
    }
    if (r.warn > 0) {
        r.warn -= dt;
        if (r.warn <= 0) {
            r.on = true;
            r.left = 5;
            r.taps = 0;
        }
    }
    if (r.on) {
        r.left -= dt;
        if (r.left <= 0) {
            r.on = false;
            r.windows++;
            r.next = g.t + lerp(15, 9, p) * (0.85 + g.rng() * 0.3);
            if (r.taps < 2) {
                hurt(g, 9, 'radio');
                g.combo = 0;
                g.fx.push({ k: 'silence' });
            }
        }
    }

    // Tyskerne tviler litt hele tiden - bløffen må mates.
    g.belief = clamp(g.belief - 0.12 * dt, 0, 100);

    const target = clamp((BELIEF_START - g.belief) / (BELIEF_START - BELIEF_LOSE), 0, 1);
    g.panzer += (target - g.panzer) * Math.min(1, dt * 2);

    // Den største kilden til tvil er dødsårsaken hvis det går galt.
    g.cause = (Object.keys(g.loss) as Cause[]).reduce((a, b) => (g.loss[b] > g.loss[a] ? b : a));

    if (g.belief <= BELIEF_LOSE) g.over = 'lost';
    else if (g.t >= RUN_SECONDS) {
        g.over = 'won';
        g.score += 1500 + Math.round(g.belief * 25);
    }
}

// ---------- Grepene. Eleven og robotene bruker de samme. ----------

export function pumpStart(g: Game, id: number) {
    const d = g.dummies.find((x) => x.id === id);
    if (!d || !d.active || d.popped > 0) return;
    g.pump = id;
}

export function pumpStop(g: Game) {
    g.pump = null;
}

export function netUnit(g: Game, id: number) {
    const u = g.units.find((x) => x.id === id);
    if (!u || !u.active || u.covered || u.leaving > 0) return false;
    u.covered = true;
    g.fx.push({ k: 'net', x: u.x, y: u.y });
    return true;
}

export function radioTap(g: Game) {
    const r = g.radio;
    if (!r.on || r.taps >= 5 || g.t - r.last < 0.22) return;
    r.last = g.t;
    r.taps++;
    g.stats.taps++;
    g.belief = clamp(g.belief + 1.6, 0, 100);
    g.score += 30 * mult(g);
    g.fx.push({ k: 'tap', good: true });
}

/** Hva ligger under pekeren? Store treffflater - trackpad på Chromebook. */
export function hitTest(g: Game, x: number, y: number): { k: 'dummy' | 'unit' | 'mast'; id: number } | null {
    let best: { k: 'dummy' | 'unit' | 'mast'; id: number } | null = null;
    let bd = 72;
    for (const d of g.dummies) {
        if (!d.active) continue;
        const dd = Math.hypot(d.x - x, d.y - y);
        if (dd < bd) {
            bd = dd;
            best = { k: 'dummy', id: d.id };
        }
    }
    for (const u of g.units) {
        if (!u.active || u.leaving > 0) continue;
        const dd = Math.hypot(u.x - x, u.y - y);
        if (dd < bd) {
            bd = dd;
            best = { k: 'unit', id: u.id };
        }
    }
    if (Math.hypot(MAST[0] - x, MAST[1] - y) < Math.max(bd, 60)) best = { k: 'mast', id: 0 };
    return best;
}

export const inWorld = (x: number, y: number) => x >= 0 && y >= 0 && x <= WORLD_W && y <= WORLD_H;
