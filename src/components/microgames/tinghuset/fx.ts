// Juicen i Tinghuset: alt som beveger seg uten å være spillregel. Mappene glir mot plassen
// sin, streken tegnes, stempelet slår ned, dommerlappen flyr ut i margen, kalenderbladet
// rives av, og lappene for et ulikt par slås ned midt på arket. Ren visning - spillet
// (game.ts) vet ingenting om dette.

import { BLUE, INK, RED, SLIP, VIOLET, inkAlpha, pencil, typed } from './art';
import { COUNTER, METER, deskEntry, deskRect, type Pt } from './layout';
import { MONTHS, monthName } from './levels';
import type { Game, GameEvent, Verdict } from './state';
import { TUNING } from './tuning';

export interface Slip {
    from: Pt;
    to: Pt;
    t: number;
    life: number;
    text: string;
    ink: number;
    mild: boolean;
    rot: number;
}
export interface Stroke {
    id: number;
    from: Pt;
    to: Pt;
    t: number;
    seed: number;
}
interface Bit {
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number;
    life: number;
    color: string;
    size: number;
}
interface Leaf {
    t: number;
    text: string;
    vx: number;
    vr: number;
}

/** En linje i protokollen midt på arket: hver avgjort sak skrives inn. */
export interface LogLine {
    sak: number;
    dom: string;
    when: string;
    ink: number;
    mark: 'jevn' | 'ulik' | 'mild' | null;
    t: number;
}

export interface Fx {
    shake: number;
    log: LogLine[];
    /** Mappenes synlige posisjon (glir mot plassen sin). */
    pos: Map<number, Pt>;
    /** Når mappa dukket opp på arket (for innfløyningen). */
    born: Map<number, number>;
    strokes: Stroke[];
    slips: Slip[];
    stamps: { desk: number; t: number; mild: boolean; rett: boolean }[];
    leaves: Leaf[];
    ulik: { a: Verdict; b: Verdict; t: number }[];
    checks: { x: number; y: number; t: number }[];
    bits: Bit[];
    multPop: number;
    jevnePop: number;
    meterHit: number;
    trinnT: number;
    lastMonth: number;
    lastDay: number;
    campOpen: Map<number, number>;
    deskOpen: Map<number, number>;
    t: number;
}

export function newFx(): Fx {
    return {
        shake: 0,
        log: [],
        pos: new Map(),
        born: new Map(),
        strokes: [],
        slips: [],
        stamps: [],
        leaves: [],
        ulik: [],
        checks: [],
        bits: [],
        multPop: 9,
        jevnePop: 9,
        meterHit: 9,
        trinnT: 9,
        lastMonth: 0,
        lastDay: 0,
        campOpen: new Map(),
        deskOpen: new Map(),
        t: 0,
    };
}

const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

/** Så mange linjer protokollen viser. */
export const LOG_ROWS = 14;

/** «jun 45» */
function shortMonth(m: number) {
    const abs = 4 + Math.floor(m);
    return `${MONTHS[abs % 12].slice(0, 3)} ${String(45 + Math.floor(abs / 12))}`;
}

/** Så lenge lappene for et ulikt par ligger midt på arket (s). */
export const ULIK_TID = 2.6;

/** En kort dom til lappen som flyr ut i margen. */
const slipText = (v: Verdict) => `${v.dom} - ${monthName(v.mnd)}`;

function dust(fx: Fx, x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 30 + Math.random() * 70;
        fx.bits.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 20,
            t: 0,
            life: 0.35 + Math.random() * 0.3,
            color,
            size: 1 + Math.random() * 1.6,
        });
    }
}

/** Elevens strek: lagres så den kan tegnes mens mappa glir langs den. */
export function addStroke(fx: Fx, id: number, from: Pt, desk: number) {
    fx.strokes.push({ id, from, to: deskEntry(desk), t: 0, seed: id * 1.7 });
}

/** Gjør spillets hendelser om til bevegelse. Lydene og tekstene tar komponenten seg av. */
export function fxEvent(fx: Fx, g: Game, e: GameEvent, particles: number) {
    if (e.kind === 'avgjort' || e.kind === 'formildt') {
        const v = e.v;
        const r = deskRect(v.desk);
        fx.stamps.push({
            desk: v.desk,
            t: 0,
            mild: e.kind === 'formildt',
            rett: v.route === 'rett',
        });
        const from = { x: r.x + r.w * 0.5, y: r.y + r.h * 0.5 };
        // Et forelegg på en alvorlig sak flyr rett inn i sinnemåleren.
        const to =
            e.kind === 'formildt'
                ? { x: METER.x + METER.w / 2, y: METER.y + METER.h * (1 - Math.min(1, g.sinne)) }
                : { x: COUNTER.x + COUNTER.w / 2, y: COUNTER.y + 6 };
        fx.slips.push({
            from,
            to,
            t: 0,
            life: e.kind === 'formildt' ? 0.75 : 0.6,
            text: slipText(v),
            ink: inkAlpha(v.mnd),
            mild: e.kind === 'formildt',
            rot: (Math.random() - 0.5) * 0.5,
        });
        dust(fx, r.x + 40, r.y + r.h / 2, Math.round(5 * particles), '#8d8a80');
        if (particles > 0.6) dust(fx, r.x + 40, r.y + r.h / 2, 3, VIOLET);
        fx.shake = Math.max(fx.shake, v.route === 'rett' ? 0.08 : 0.05);
        fx.log.push({
            sak: v.sak,
            dom: v.route === 'forelegg' ? 'forelegg' : v.dom.replace(' fengsel', ''),
            when: shortMonth(v.mnd),
            ink: inkAlpha(v.mnd),
            mark: e.kind === 'formildt' ? 'mild' : null,
            t: 0,
        });
        if (fx.log.length > LOG_ROWS) fx.log.shift();
        fx.pos.delete(v.id);
        fx.born.delete(v.id);
        if (e.kind === 'formildt') {
            fx.meterHit = 0;
            fx.multPop = 0;
            fx.shake = 0.14;
        }
    }
    if (e.kind === 'jevnt' || e.kind === 'ulikt')
        for (const l of fx.log)
            if (l.sak === e.a.sak) l.mark = e.kind === 'jevnt' ? 'jevn' : 'ulik';
    if (e.kind === 'jevnt') {
        fx.jevnePop = 0;
        if (e.a.route === 'rett') fx.multPop = 0;
        fx.checks.push({ x: COUNTER.x + COUNTER.w / 2, y: COUNTER.y - 14, t: 0 });
    } else if (e.kind === 'ulikt') {
        fx.ulik.push({ a: e.a, b: e.b, t: 0 });
        fx.multPop = 0;
        fx.shake = 0.12;
    } else if (e.kind === 'trinn') {
        fx.trinnT = 0;
    } else if (e.kind === 'leir') {
        fx.campOpen.set(g.camps.indexOf(e.camp), 0);
    } else if (e.kind === 'brett' || e.kind === 'kort') {
        // Nye skranker glir inn.
        g.desks.forEach((_, i) => {
            if (!fx.deskOpen.has(i)) fx.deskOpen.set(i, 0);
        });
    }
}

/** Kalenderbladet rives av når en ny måned begynner. */
export function tearCalendar(fx: Fx, g: Game) {
    // Brett 1 (mai 1945) går i dager: ett blad rives av hver dag.
    if (g.level === 0) {
        const d = Math.floor((g.mnd % 1) * 23);
        if (d > fx.lastDay) {
            fx.leaves.push({
                t: 0,
                text: `${7 + d}. mai 1945`,
                vx: 40 + Math.random() * 80,
                vr: 1 + Math.random() * 2.5,
            });
            fx.lastDay = d;
            return true;
        }
    }
    const m = Math.floor(g.mnd);
    if (m > fx.lastMonth) {
        fx.leaves.push({
            t: 0,
            text: monthName(fx.lastMonth),
            vx: 60 + Math.random() * 60,
            vr: 1.5 + Math.random() * 2,
        });
        fx.lastMonth = m;
        return true;
    }
    return false;
}

export function stepFx(fx: Fx, dt: number) {
    fx.t += dt;
    fx.shake = Math.max(0, fx.shake - dt);
    fx.multPop += dt;
    fx.jevnePop += dt;
    fx.meterHit += dt;
    fx.trinnT += dt;
    for (const [k, v] of fx.campOpen) fx.campOpen.set(k, v + dt);
    for (const [k, v] of fx.deskOpen) fx.deskOpen.set(k, v + dt);
    fx.strokes = fx.strokes.filter((s) => (s.t += dt) < TUNING.skranke.reise + 0.5);
    fx.slips = fx.slips.filter((s) => (s.t += dt) < s.life);
    fx.stamps = fx.stamps.filter((s) => (s.t += dt) < 0.9);
    for (const l of fx.log) l.t += dt;
    fx.leaves = fx.leaves.filter((l) => (l.t += dt) < 1.4);
    fx.ulik = fx.ulik.filter((u) => (u.t += dt) < ULIK_TID);
    fx.checks = fx.checks.filter((c) => (c.t += dt) < 0.9);
    for (const b of fx.bits) {
        b.t += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += 160 * dt;
        b.vx *= 0.94;
    }
    fx.bits = fx.bits.filter((b) => b.t < b.life);
}

/** Skjermrist: 2 px i 80 ms på stempeldunk (sterkere ved FOR MILDT og ULIK DOM). */
export function shakeOffset(fx: Fx): Pt {
    if (fx.shake <= 0) return { x: 0, y: 0 };
    const a = Math.min(1, fx.shake / 0.08) * 2;
    return { x: (Math.random() - 0.5) * 2 * a, y: (Math.random() - 0.5) * 2 * a };
}

/** Streken mappa glir langs: tegnes fram, står mens mappa glir, og blekner. */
export function drawStrokes(ctx: CanvasRenderingContext2D, fx: Fx) {
    const reise = TUNING.skranke.reise;
    for (const s of fx.strokes) {
        const k = ease(s.t / 0.12);
        const fade = s.t > reise ? 1 - (s.t - reise) / 0.5 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        pencil(ctx, s.from.x, s.from.y, s.to.x, s.to.y, BLUE, s.seed, k, 1.6);
        ctx.restore();
    }
}

/** Dommerlappene som flyr ut i margen, støv og blekk fra stemplene. */
export function drawFlying(ctx: CanvasRenderingContext2D, fx: Fx) {
    for (const b of fx.bits) {
        ctx.globalAlpha = 1 - b.t / b.life;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.size, b.size);
    }
    ctx.globalAlpha = 1;
    for (const s of fx.slips) {
        const k = ease(s.t / s.life);
        const arc = Math.sin(k * Math.PI) * -40;
        const x = s.from.x + (s.to.x - s.from.x) * k;
        const y = s.from.y + (s.to.y - s.from.y) * k + arc;
        const sc = 1 - k * 0.55;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s.rot + k * 0.6);
        ctx.scale(sc, sc);
        ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
        ctx.fillStyle = 'rgba(30,26,34,0.25)';
        ctx.fillRect(-62, -12, 128, 28);
        ctx.fillStyle = SLIP;
        ctx.fillRect(-64, -14, 128, 28);
        typed(ctx, s.text, 0, -4, 9.5, INK, 'center', false);
        ctx.globalAlpha *= s.mild ? 0.95 : s.ink;
        ctx.strokeStyle = s.mild ? RED : VIOLET;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-36, 2, 72, 10);
        typed(ctx, s.mild ? 'FOR MILDT' : 'AVGJORT', 0, 7.5, 8.5, s.mild ? RED : VIOLET, 'center');
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const c of fx.checks) {
        const k = c.t / 0.9;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const y = c.y - k * 16;
        ctx.beginPath();
        ctx.moveTo(c.x - 12, y);
        ctx.lineTo(c.x - 3, y + 9);
        ctx.lineTo(c.x + 14, y - 12);
        ctx.stroke();
        ctx.restore();
    }
}

/** Kalenderbladene som rives av og faller ut av bildet. */
export function drawLeaves(ctx: CanvasRenderingContext2D, fx: Fx, cal: { x: number; y: number }) {
    for (const l of fx.leaves) {
        const k = l.t;
        ctx.save();
        ctx.translate(cal.x + 75 + l.vx * k, cal.y + 50 + 30 * k + 260 * k * k);
        ctx.rotate(l.vr * k * k + 0.1 * k);
        ctx.globalAlpha = Math.max(0, 1 - k / 1.4);
        ctx.fillStyle = '#f3f2ea';
        ctx.fillRect(-75, -40, 150, 72);
        ctx.strokeStyle = 'rgba(42,39,49,0.35)';
        ctx.strokeRect(-75, -40, 150, 72);
        typed(ctx, l.text.toUpperCase(), 0, -4, 13, VIOLET, 'center');
        ctx.restore();
    }
}

/** Ulikt par: to lapper side om side midt på arket, stempelet «ULIK DOM» slår ned på dem. */
export function drawUlik(ctx: CanvasRenderingContext2D, fx: Fx) {
    const u = fx.ulik[fx.ulik.length - 1];
    if (!u) return;
    const inK = ease(u.t / 0.18);
    const out = u.t > ULIK_TID - 0.35 ? (ULIK_TID - u.t) / 0.35 : 1;
    const cx = 466;
    const cy = 214;
    ctx.save();
    ctx.globalAlpha = Math.max(0, out);
    ctx.fillStyle = 'rgba(42,39,49,0.10)';
    ctx.fillRect(cx - 176, cy - 66, 352, 148);
    typed(ctx, `SAK ${u.a.sak} - SAMME HANDLING`, cx, cy - 52, 12, RED, 'center');
    [u.a, u.b].forEach((v, i) => {
        const x = cx - 168 + i * 172 + (1 - inK) * (i ? 80 : -80);
        const y = cy - 36;
        ctx.save();
        ctx.translate(x + 82, y + 50);
        ctx.rotate(i ? 0.04 : -0.035);
        ctx.fillStyle = 'rgba(30,26,34,0.25)';
        ctx.fillRect(-80, -48, 164, 104);
        ctx.fillStyle = SLIP;
        ctx.fillRect(-82, -50, 164, 104);
        typed(ctx, monthName(v.mnd).toUpperCase(), 0, -34, 11, INK, 'center');
        typed(ctx, v.dom, 0, -14, 12.5, INK, 'center');
        typed(ctx, `straffenivå ${100 - v.trinn * 5} %`, 0, 4, 10.5, VIOLET, 'center', false);
        // Stempelet slår ned litt etter lappene.
        const st = (u.t - 0.2 - i * 0.12) / 0.12;
        if (st > 0) {
            const sc = 1 + (1 - ease(st)) * 1.2;
            ctx.translate(0, 30);
            ctx.rotate(-0.1);
            ctx.scale(sc, sc);
            ctx.globalAlpha = Math.max(0, out) * Math.min(1, st);
            ctx.strokeStyle = RED;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-56, -12, 112, 24);
            typed(ctx, 'ULIK DOM', 0, 1, 15, RED, 'center');
        }
        ctx.restore();
    });
    ctx.restore();
}

/** Er et stempel i ferd med å slå ned på skranke i? 0-1 trykk (1 = helt nede). */
export function stampPress(fx: Fx, desk: number): { press: number; mild: boolean; t: number } {
    let best = { press: 0, mild: false, t: 9 };
    for (const s of fx.stamps) {
        if (s.desk !== desk) continue;
        const press = s.t < 0.06 ? s.t / 0.06 : Math.max(0, 1 - (s.t - 0.06) / 0.2);
        if (s.t < best.t) best = { press, mild: s.mild, t: s.t };
    }
    return best;
}

/** Protokollen: hver avgjort sak skrives inn tegn for tegn. Blekket blekner år for år. */
export function drawLog(ctx: CanvasRenderingContext2D, fx: Fx) {
    const x = 304;
    fx.log.forEach((l, i) => {
        const y = 160 + i * 22 - 6;
        const line = `${String(l.sak).padStart(3, ' ')}  ${l.dom.padEnd(10, ' ')} ${l.when}`;
        const shown = line.slice(0, Math.ceil(l.t * 70));
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.6 * l.ink;
        typed(ctx, shown, x, y, 10.5, l.mark === 'mild' ? RED : INK, 'left', false);
        ctx.restore();
        if (l.mark === 'jevn') {
            ctx.strokeStyle = BLUE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 168, y);
            ctx.lineTo(x + 173, y + 5);
            ctx.lineTo(x + 182, y - 6);
            ctx.stroke();
        } else if (l.mark === 'ulik') {
            pencil(ctx, x - 2, y + 6, x + 162, y + 5, RED, l.sak, 1, 1);
            typed(ctx, 'ULIK', x + 168, y, 10, RED);
        } else if (l.mark === 'mild') typed(ctx, 'MILDT', x + 168, y, 10, RED);
    });
}
