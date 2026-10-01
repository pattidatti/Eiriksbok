// Visningen av Tinghuset: protokollarket rett ovenfra. Leirene til venstre, skrankene
// (gummistempler og protokollbøker) til høyre, sinnemåleren i høyre marg, og HUD-en er
// arkivet selv: avrivningskalender, straffenivå-linjal, telleverk. Kunsten (teksturene)
// bor i art.ts, bevegelsene i fx.ts, og layouten (det pekeren treffer) i layout.ts.

import {
    BLUE,
    DESK,
    INK,
    PAPER_LIGHT,
    RED,
    RED_SOFT,
    SLIP,
    VIOLET,
    big,
    pencil,
    typed,
    type Art,
} from './art';
import {
    addStroke,
    drawFlying,
    drawLog,
    drawLeaves,
    drawStrokes,
    drawUlik,
    stampPress,
} from './fx';
import type { Fx } from './fx';
import { secsToStep, twinEta } from './game';
import {
    CAL,
    COUNTER,
    GOAL,
    H,
    METER,
    RULER,
    SCORE,
    W,
    campRect,
    campSlots,
    cardRects,
    deskEntry,
    deskRect,
    homeOf,
    type Pt,
} from './layout';
import { LEVELS, monthName } from './levels';
import { domTekst, straffTrinn } from './rules';
import type { Folder, Game } from './state';
import { CARD_TEXT } from './texts';
import { TUNING } from './tuning';

const K = TUNING;
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

export interface ViewState {
    drag: { id: number; x: number; y: number } | null;
    selected: number | null;
    /** Skranken streken peker på nå (magnet). */
    over: number;
    /** Har eleven sendt noe ennå? (hint-streken i brett 1) */
    sent: boolean;
}

export const newView = (): ViewState => ({ drag: null, selected: null, over: -1, sent: false });

/** Kort dom på mappa: det den får NÅ om den går til retten. */
function shortDom(f: Folder, trinn: number): string {
    if (f.kind === 'lett') return 'medlem';
    return domTekst(f.kind, 'rett', trinn).replace(' fengsel', '');
}

/** Hver mappe ligger litt skjevt (±3 grader), fast per mappe. */
const tiltOf = (id: number) => (((id * 37) % 7) - 3) * (Math.PI / 180);

/**
 * Mappene glir mot plassen sin (leir, kø, skranke). En mappe på vei følger streken.
 * Kalles hver frame før tegningen.
 */
export function moveFolders(g: Game, fx: Fx, dt: number) {
    const slots = campSlots(g);
    const k = 1 - Math.exp(-dt * 14);
    for (const f of g.folders) {
        if (!fx.born.has(f.id)) fx.born.set(f.id, fx.t);
        let p = fx.pos.get(f.id);
        if (f.state === 'reiser') {
            let s = fx.strokes.find((x) => x.id === f.id);
            if (!s) {
                addStroke(fx, f.id, p ?? deskEntry(f.desk), f.desk);
                s = fx.strokes[fx.strokes.length - 1];
            }
            const kk = ease(1 - Math.max(0, f.travel) / K.skranke.reise);
            fx.pos.set(f.id, {
                x: s.from.x + (s.to.x - s.from.x) * kk,
                y: s.from.y + (s.to.y - s.from.y) * kk,
            });
            continue;
        }
        const home = homeOf(g, f, slots);
        if (!home) continue;
        if (!p) {
            // Ny mappe: legges ned ovenfra-venstre i leiren.
            p = { x: home.x - 26, y: home.y - 34 };
            fx.pos.set(f.id, p);
        }
        p.x += (home.x - p.x) * k;
        p.y += (home.y - p.y) * k;
    }
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
}

function drawFolder(
    ctx: CanvasRenderingContext2D,
    art: Art,
    g: Game,
    fx: Fx,
    f: Folder,
    p: Pt,
    hi: boolean,
    blink: boolean
) {
    const age = fx.t - (fx.born.get(f.id) ?? 0);
    const inK = ease(age / 0.28);
    const sprite = art.folders[f.kind];
    const sw = sprite.width / art.k;
    const sh = sprite.height / art.k;
    const wob = f.state === 'leir' ? Math.sin(fx.t * 2.2 + f.id) * 0.02 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(tiltOf(f.id) + wob);
    const sc = 1 + (1 - inK) * 0.35 + (hi ? 0.08 : 0);
    ctx.scale(sc, sc);
    ctx.globalAlpha = inK;
    ctx.drawImage(sprite, -sw / 2, -sh / 2 + (f.kind === 'tykk' ? -3 : 0), sw, sh);
    if (hi) {
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(-25, -17, 50, 34);
    }
    typed(ctx, String(f.sak), -10, -5.5, 10, INK, 'center');
    if (f.state === 'leir' || f.state === 'ko') {
        const label = shortDom(f, straffTrinn(g.mnd));
        if (blink && f.kind !== 'lett') {
            const s = Math.ceil(secsToStep(g));
            const on = Math.floor(fx.t * 4) % 2 === 0;
            typed(ctx, on ? label : `om ${s} s`, 0, 7, 10, RED, 'center');
        } else typed(ctx, label, 0, 7, 10, f.kind === 'lett' ? '#3e3b44' : INK, 'center');
    }
    ctx.restore();
    // Tvillingen er på vei: blyantring med sekundene.
    const eta = f.state === 'leir' ? twinEta(g, f) : null;
    if (eta !== null) {
        ctx.save();
        ctx.translate(p.x + 22, p.y - 15);
        ctx.fillStyle = SLIP;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, eta / 14));
        ctx.stroke();
        typed(ctx, String(Math.ceil(eta)), 0, 0.5, 10, BLUE, 'center');
        ctx.restore();
    }
}

function drawCalendar(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w, h } = CAL;
    // Blokka under (flere blader).
    ctx.fillStyle = 'rgba(30,26,34,0.25)';
    ctx.fillRect(x + 3, y + 5, w, h);
    ctx.fillStyle = '#d8d6cb';
    ctx.fillRect(x + 1.5, y + 2.5, w, h);
    ctx.fillStyle = '#f3f2ea';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = VIOLET;
    ctx.fillRect(x, y, w, 20);
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#cfcfd4';
        ctx.beginPath();
        ctx.arc(x + 14 + i * 24.5, y + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    const abs = 4 + Math.floor(g.mnd);
    typed(ctx, String(1945 + Math.floor(abs / 12)), x + w / 2, y + 12, 12, '#f2f1ea', 'center');
    const name = monthName(g.mnd).split(' ')[0].toUpperCase();
    big(ctx, name, x + w / 2, y + 46, name.length > 7 ? 21 : 26, INK, 'center');
    if (g.level === 0) {
        // Brett 1: kalenderen går i dager.
        const day = 8 + Math.floor((g.mnd % 1) * 23);
        typed(ctx, `${day}. dag`, x + w / 2, y + 74, 11, INK, 'center', false);
    } else {
        const pct = g.mnd % 1;
        ctx.fillStyle = 'rgba(91,62,140,0.18)';
        ctx.fillRect(x + 14, y + 72, w - 28, 5);
        ctx.fillStyle = VIOLET;
        ctx.fillRect(x + 14, y + 72, (w - 28) * pct, 5);
    }
    drawLeaves(ctx, fx, CAL);
}

function drawGoal(ctx: CanvasRenderingContext2D, g: Game) {
    const { x, y, w } = GOAL;
    typed(ctx, 'MÅL', x, y + 6, 11, VIOLET);
    typed(ctx, 'aug. 1948', x, y + 22, 12, INK);
    typed(ctx, 'uten at sinnet', x, y + 37, 10, INK, 'left', false);
    typed(ctx, 'sprekker', x, y + 50, 10, INK, 'left', false);
    const k = Math.min(1, g.mnd / K.kalender.sluttMnd);
    ctx.fillStyle = 'rgba(42,39,49,0.12)';
    ctx.fillRect(x, y + 62, w, 6);
    ctx.fillStyle = BLUE;
    ctx.fillRect(x, y + 62, w * k, 6);
    const left = Math.max(0, Math.ceil(K.kalender.sluttMnd - g.mnd));
    typed(ctx, `${left} mnd igjen`, x, y + 78, 10, BLUE, 'left', false);
}

function drawRuler(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const lv = LEVELS[g.level];
    if (!lv.linjal) return;
    const { x, y, w, h } = RULER;
    const T = K.kalender.trinn;
    const steps = Math.round((1 - T.min) / T.pp);
    const tr = straffTrinn(g.mnd);
    ctx.fillStyle = '#e9e1c8';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(42,39,49,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const sw = (w - 90) / (steps + 1);
    for (let i = 0; i <= steps; i++) {
        const sx = x + 88 + i * sw;
        const done = i < tr;
        const now = i === tr;
        ctx.fillStyle = now ? VIOLET : done ? 'rgba(91,62,140,0.25)' : 'rgba(42,39,49,0.10)';
        const pop = now ? 1 + (1 - ease(fx.trinnT / 0.35)) * 0.6 : 1;
        const bh = (h - 8) * pop;
        ctx.fillRect(sx + 1, y + h / 2 - bh / 2, sw - 2, bh);
    }
    typed(ctx, `NIVÅ ${100 - tr * 5} %`, x + 6, y + h / 2 + 0.5, 11, VIOLET);
    // Nedtelling når neste trinn er nær.
    const s = secsToStep(g);
    if (s < K.kalender.varselSek && Math.floor(fx.t * 4) % 2 === 0) {
        const nx = x + 88 + (tr + 1) * sw;
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.strokeRect(nx, y + 1, sw, h - 2);
        typed(ctx, `-5 % om ${Math.ceil(s)} s`, x + w, y + h + 9, 10, RED, 'right');
    }
}

function drawCamp(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, art: Art, i: number) {
    const r = campRect(i);
    const open = fx.campOpen.get(i);
    const off = open === undefined ? 0 : (1 - ease(open / 0.6)) * -320;
    ctx.save();
    ctx.translate(off, 0);
    ctx.fillStyle = 'rgba(30,26,34,0.12)';
    ctx.fillRect(r.x + 2, r.y + 3, r.w, r.h);
    ctx.fillStyle = PAPER_LIGHT;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = INK;
    ctx.fillRect(r.x, r.y + 24, r.w, 1);
    // Folk som venter uten dom: leiren fylles av rødblyant (rødt = det som haster).
    let heat = 0;
    for (const f of g.folders) if (f.state === 'leir' && f.camp === i) heat += g.t - f.born;
    heat = Math.min(1, heat / 24);
    if (heat > 0.02) {
        ctx.save();
        rect(ctx, r.x + 1, r.y + 25, r.w - 2, r.h - 26);
        ctx.clip();
        ctx.globalAlpha = heat * 0.9;
        ctx.drawImage(art.hatch, r.x - 40, r.y - 60, W * 0.6, H * 0.6);
        ctx.fillStyle = `rgba(179,52,42,${heat * 0.16})`;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
    }
    // Hullmaskin-hull.
    for (const hy of [r.y + 40, r.y + r.h - 22]) {
        ctx.fillStyle = '#9fa097';
        ctx.beginPath();
        ctx.arc(r.x + 8, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    typed(ctx, g.camps[i], r.x + 10, r.y + 13, 14, INK);
    const n = g.folders.filter((f) => f.state === 'leir' && f.camp === i).length;
    if (g.ruter.includes(i)) typed(ctx, 'FAST RUTE', r.x + r.w - 8, r.y + 13, 11, BLUE, 'right');
    else if (n >= 6) typed(ctx, `${n} VENTER`, r.x + r.w - 8, r.y + 13, 11, RED, 'right');
    ctx.restore();
}

function drawRoutes(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const fi = g.desks.findIndex((d) => d.kind === 'forelegg');
    if (fi < 0) return;
    for (const ci of g.ruter) {
        const r = campRect(ci);
        const e = deskEntry(fi);
        ctx.save();
        ctx.globalAlpha = 0.4;
        pencil(ctx, r.x + r.w, r.y + r.h / 2, e.x, e.y, BLUE, ci + 9, 1, 1.1);
        // Små piler som går langs ruten.
        const k = (fx.t * 0.6) % 1;
        const px = r.x + r.w + (e.x - r.x - r.w) * k;
        const py = r.y + r.h / 2 + (e.y - r.y - r.h / 2) * k;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawDesk(
    ctx: CanvasRenderingContext2D,
    art: Art,
    g: Game,
    fx: Fx,
    v: ViewState,
    i: number
) {
    const d = g.desks[i];
    const r = deskRect(i);
    const open = fx.deskOpen.get(i);
    const off = open === undefined ? 0 : (1 - ease(open / 0.5)) * 220;
    const st = stampPress(fx, i);
    ctx.save();
    ctx.translate(off, 0);
    // Gyldige mål mens eleven drar: en rolig blå ramme (står stille, ingen flimmer).
    if (v.drag) {
        ctx.strokeStyle = BLUE;
        ctx.globalAlpha = v.over === i ? 0.9 : 0.3;
        ctx.lineWidth = v.over === i ? 3 : 1.5;
        ctx.strokeRect(r.x - 6, r.y - 5, r.w + 12, r.h + 10);
        ctx.globalAlpha = 1;
    }
    if (d.kind === 'forelegg') {
        const breathe =
            g.level === 0 && !v.sent ? 1 + Math.sin(fx.t * 3.2) * 0.025 : 1 - st.press * 0.04;
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + st.press * 2);
        ctx.scale(breathe, breathe);
        // Stempelblokka i tre med gummi under.
        ctx.fillStyle = 'rgba(20,16,14,0.30)';
        ctx.fillRect(-r.w / 2 + 3, -r.h / 2 + 5 - st.press * 2, r.w, r.h);
        ctx.fillStyle = VIOLET;
        ctx.fillRect(-r.w / 2 - 2, -r.h / 2 + 2, r.w + 4, r.h);
        ctx.fillStyle = DESK;
        ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h - 3);
        const grain = ctx.createLinearGradient(0, -r.h / 2, 0, r.h / 2);
        grain.addColorStop(0, 'rgba(255,230,200,0.12)');
        grain.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grain;
        ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h - 3);
        // Etiketten på toppen viser avtrykket.
        ctx.fillStyle = SLIP;
        ctx.fillRect(-r.w / 2 + 8, -r.h / 2 + 8, 104, 30);
        ctx.strokeStyle = VIOLET;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-r.w / 2 + 11, -r.h / 2 + 11, 98, 24);
        typed(ctx, 'FORELEGG', -r.w / 2 + 60, -r.h / 2 + 23.5, 14, VIOLET, 'center');
        typed(ctx, 'fast takst', -r.w / 2 + 60, r.h / 2 - 12, 10, '#e8e3da', 'center', false);
        const kw = art.knob.width / art.k;
        ctx.drawImage(art.knob, r.w / 2 - kw - 6, -kw / 2, kw, kw);
        ctx.restore();
        if (st.t < 0.3) {
            // Blekkring rundt stempelet når det slår ned.
            ctx.strokeStyle = st.mild ? RED : VIOLET;
            ctx.globalAlpha = 1 - st.t / 0.3;
            ctx.lineWidth = 2;
            const grow = st.t * 40;
            ctx.strokeRect(r.x - grow / 2, r.y - grow / 2, r.w + grow, r.h + grow);
            ctx.globalAlpha = 1;
        }
    } else {
        // Rettssalen: en oppslått protokollbok der dommen skrives tegn for tegn.
        ctx.fillStyle = 'rgba(30,26,34,0.28)';
        ctx.fillRect(r.x + 3, r.y + 4, r.w, r.h);
        ctx.fillStyle = '#4a3a5c';
        ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
        ctx.fillStyle = '#f1efe4';
        ctx.fillRect(r.x, r.y, r.w / 2 - 1, r.h);
        ctx.fillRect(r.x + r.w / 2 + 1, r.y, r.w / 2 - 1, r.h);
        const spine = ctx.createLinearGradient(r.x + r.w / 2 - 10, 0, r.x + r.w / 2 + 10, 0);
        spine.addColorStop(0, 'rgba(0,0,0,0)');
        spine.addColorStop(0.5, 'rgba(30,26,34,0.35)');
        spine.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = spine;
        ctx.fillRect(r.x + r.w / 2 - 10, r.y, 20, r.h);
        const n = g.desks.slice(0, i + 1).filter((x) => x.kind === 'rett').length;
        typed(ctx, `RETTSSAL ${n}`, r.x + 8, r.y + 10, 10, VIOLET);
        ctx.strokeStyle = 'rgba(46,91,152,0.18)';
        ctx.lineWidth = 0.8;
        for (let ly = r.y + 22; ly < r.y + r.h - 4; ly += 11) {
            ctx.beginPath();
            ctx.moveTo(r.x + r.w / 2 + 6, ly);
            ctx.lineTo(r.x + r.w - 6, ly);
            ctx.stroke();
        }
        const f = d.current !== null ? g.folders.find((x) => x.id === d.current) : undefined;
        if (f) {
            const prog = 1 - d.left / d.total;
            const line = `Sak ${f.sak}: ${domTekst(f.kind, 'rett', straffTrinn(g.mnd)).replace(' fengsel', '')}`;
            const shown = line.slice(0, Math.ceil(line.length * Math.min(1, prog * 1.15)));
            typed(ctx, shown, r.x + r.w / 2 + 6, r.y + 16, 9.5, INK, 'left', false);
            ctx.fillStyle = VIOLET;
            ctx.fillRect(r.x + r.w / 2 + 6, r.y + r.h - 9, (r.w / 2 - 12) * prog, 3);
            // Den blinkende markøren i skrivemaskinen.
            if (Math.floor(fx.t * 3) % 2 === 0) {
                ctx.font = `9.5px "Courier New", monospace`;
                const tw = ctx.measureText(shown).width;
                ctx.fillStyle = INK;
                ctx.fillRect(r.x + r.w / 2 + 7 + tw, r.y + 11, 1.2, 10);
            }
        } else
            typed(
                ctx,
                'ledig',
                r.x + r.w * 0.75,
                r.y + 30,
                10,
                'rgba(42,39,49,0.35)',
                'center',
                false
            );
        if (st.t < 0.5 && st.press > 0) {
            ctx.save();
            ctx.translate(r.x + r.w * 0.75, r.y + 36);
            ctx.rotate(-0.12);
            ctx.globalAlpha = Math.min(1, 1.2 - st.t * 2);
            ctx.strokeStyle = VIOLET;
            ctx.lineWidth = 2;
            ctx.strokeRect(-38, -9, 76, 18);
            typed(ctx, 'DOM AVSAGT', 0, 0.5, 10, VIOLET, 'center');
            ctx.restore();
        }
    }
    // Køen som stabel: tallet når den blir lang.
    if (d.queue.length > 3) {
        const c = d.queue.length >= 6 ? RED : INK;
        typed(ctx, `${d.queue.length} i kø`, r.x - 34, r.y - 2, 11, c, 'right');
    }
    ctx.restore();
}

function drawMeter(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, art: Art) {
    const { x, y, w, h } = METER;
    const lv = LEVELS[g.level];
    const hot = g.sinne > 0.7;
    const pulse = hot ? 1 + Math.sin(fx.t * 9) * 0.06 : 1;
    const hit = fx.meterHit < 0.4 ? 1 - fx.meterHit / 0.4 : 0;
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    ctx.scale(pulse + hit * 0.15, 1);
    ctx.fillStyle = '#ecebe3';
    ctx.fillRect(-w / 2, -h, w, h);
    const fill = Math.min(1, g.sinne) * h;
    const sum = g.fraVent + g.fraMild || 1;
    const mildPart = fill * (g.fraMild / sum);
    ctx.fillStyle = RED_SOFT;
    ctx.fillRect(-w / 2 + 2, -fill, w - 4, fill - mildPart);
    ctx.fillStyle = RED;
    ctx.fillRect(-w / 2 + 2, -mildPart, w - 4, mildPart);
    // Rødblyant-korn oppå fyllet.
    ctx.save();
    rect(ctx, -w / 2 + 2, -fill, w - 4, fill);
    ctx.clip();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(art.hatch, 0, 0, art.hatch.width, art.hatch.height, -w / 2 - 300, -h, W, H);
    ctx.restore();
    if (hit > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hit * 0.6})`;
        ctx.fillRect(-w / 2, -fill, w, fill);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-w / 2, -h, w, h);
    for (let i = 1; i < 10; i++) {
        ctx.fillStyle = 'rgba(42,39,49,0.4)';
        ctx.fillRect(-w / 2, -h * (i / 10), i % 5 ? 5 : 9, 1);
    }
    if (lv.sinneTak < 1) {
        const ty = -h * lv.sinneTak;
        ctx.strokeStyle = INK;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 5, ty);
        ctx.lineTo(w / 2 + 5, ty);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(x + w + 18, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    typed(ctx, 'SINNET I GATENE', 0, 0, 13, RED, 'center');
    ctx.restore();
    typed(
        ctx,
        `${Math.round(Math.min(1, g.sinne) * 100)} %`,
        x + w / 2,
        y + h + 10,
        11,
        RED,
        'center'
    );
}

function drawScore(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w } = SCORE;
    typed(ctx, 'POENG', x, y + 8, 10, INK);
    big(ctx, Math.floor(g.score).toLocaleString('nb-NO'), x, y + 28, 22, INK);
    const pop = fx.multPop < 0.35 ? 1 + (1 - fx.multPop / 0.35) * 0.5 : 1;
    ctx.save();
    ctx.translate(x + w - 18, y + 26);
    ctx.scale(pop, pop);
    ctx.rotate(-0.08);
    ctx.globalAlpha = 0.5 + Math.min(1, g.mult / 5) * 0.5;
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    big(ctx, `×${g.mult}`, 0, 1, g.mult >= 10 ? 13 : 16, VIOLET, 'center');
    ctx.restore();
    typed(ctx, 'jevne par i retten øker ×', x, y + 50, 9.5, VIOLET, 'left', false);
}

function drawCounter(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w, h } = COUNTER;
    ctx.fillStyle = 'rgba(30,26,34,0.25)';
    ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = '#4b4651';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6a6470';
    ctx.fillRect(x, y, w, 3);
    typed(ctx, 'JEVNE DOMMER', x + w / 2, y + 11, 10, '#e9e6dc', 'center');
    const digits = String(Math.min(999, g.jevne)).padStart(3, '0');
    const roll = fx.jevnePop < 0.25 ? (1 - fx.jevnePop / 0.25) * 14 : 0;
    for (let i = 0; i < 3; i++) {
        const dx = x + 14 + i * 27;
        ctx.fillStyle = '#1e1b22';
        ctx.fillRect(dx, y + 21, 23, 31);
        ctx.save();
        rect(ctx, dx, y + 21, 23, 31);
        ctx.clip();
        big(ctx, digits[i], dx + 11.5, y + 37 + (i === 2 ? roll : 0), 22, '#f2efe6', 'center');
        ctx.restore();
    }
}

function drawCards(ctx: CanvasRenderingContext2D, g: Game) {
    const o = g.offer;
    if (!o) return;
    const age = K.kort.varer - o.left;
    const rs = cardRects(o.cards.length);
    o.cards.forEach((c, i) => {
        const r = rs[i];
        const k = ease((age - i * 0.06) / 0.3);
        const dy = (1 - k) * 260;
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + dy);
        ctx.rotate((i - 1) * 0.015);
        ctx.fillStyle = 'rgba(30,26,34,0.3)';
        ctx.fillRect(-r.w / 2 + 3, -r.h / 2 + 4, r.w, r.h);
        ctx.fillStyle = SLIP;
        ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(-r.w / 2 + 0.5, -r.h / 2 + 0.5, r.w - 1, r.h - 1);
        // Binders.
        ctx.strokeStyle = '#7d7f86';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-r.w / 2 + 14, -r.h / 2 - 7);
        ctx.lineTo(-r.w / 2 + 14, -r.h / 2 + 12);
        ctx.arc(-r.w / 2 + 18, -r.h / 2 + 12, 4, Math.PI, 0, true);
        ctx.lineTo(-r.w / 2 + 22, -r.h / 2 - 4);
        ctx.stroke();
        typed(ctx, CARD_TEXT[c][0].toUpperCase(), -r.w / 2 + 32, -r.h / 2 + 16, 14, BLUE);
        typed(ctx, CARD_TEXT[c][1], -r.w / 2 + 14, -r.h / 2 + 40, 10.5, INK, 'left', false);
        typed(ctx, `trykk for å velge`, r.w / 2 - 10, r.h / 2 - 10, 9.5, BLUE, 'right', false);
        ctx.restore();
    });
    // Tiden som er igjen: en blyantstrek som krymper.
    const last = rs[rs.length - 1];
    pencil(
        ctx,
        rs[0].x,
        rs[0].y - 12,
        rs[0].x + last.w * (o.left / K.kort.varer),
        rs[0].y - 12,
        BLUE,
        4,
        1,
        2
    );
}

function drawInter(ctx: CanvasRenderingContext2D, g: Game) {
    if (g.inter <= 0) return;
    const age = K.mellomside - g.inter;
    const k = ease(age / 0.35);
    const lv = LEVELS[g.level];
    ctx.fillStyle = `rgba(30,26,34,${0.25 * k})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, 250 - (1 - k) * 320);
    ctx.rotate(-0.012);
    ctx.fillStyle = 'rgba(30,26,34,0.3)';
    ctx.fillRect(-256, -96, 520, 196);
    ctx.fillStyle = SLIP;
    ctx.fillRect(-260, -100, 520, 196);
    ctx.strokeStyle = 'rgba(179,52,42,0.4)';
    ctx.beginPath();
    ctx.moveTo(-226, -100);
    ctx.lineTo(-226, 96);
    ctx.stroke();
    typed(ctx, 'PROTOKOLL', -210, -76, 11, VIOLET);
    big(ctx, lv.navn, -210, -46, 24, VIOLET);
    const t = lv.protokoll;
    const shown = t.slice(0, Math.floor(Math.max(0, age - 0.2) * 60));
    // Enkel ordbryting for maskinskriften.
    ctx.font = `bold 14px "Courier New", monospace`;
    let line = '';
    let yy = -10;
    for (const word of shown.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > 440 && line) {
            typed(ctx, line, -210, yy, 14, INK);
            line = word;
            yy += 22;
        } else line = test;
    }
    if (line) typed(ctx, line, -210, yy, 14, INK);
    typed(ctx, 'trykk for å fortsette', 236, 78, 10.5, BLUE, 'right', false);
    ctx.restore();
}

/** Hint-streken i brett 1 før første grep: en stiplet blåblyant-strek som blinker. */
function drawHint(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, v: ViewState) {
    if (g.level !== 0 || v.sent || v.drag) return;
    const f = g.folders.find((x) => x.state === 'leir');
    const p = f && fx.pos.get(f.id);
    if (!p) return;
    const e = deskEntry(0);
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(fx.t * 4) * 0.3;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -fx.t * 20;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 24, p.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.restore();
}

/** Like saker i leirene: en tynn stiplet blyantstrek mellom tvillingene. */
function drawPairs(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    ctx.save();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([3, 4]);
    for (const f of g.folders) {
        if (f.twin === null || f.twin < 0 || f.id > f.twin || f.state !== 'leir') continue;
        const t = g.folders.find((x) => x.id === f.twin);
        if (!t || t.state !== 'leir') continue;
        const a = fx.pos.get(f.id);
        const b = fx.pos.get(t.id);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
    ctx.restore();
}

export function drawGame(ctx: CanvasRenderingContext2D, g: Game, v: ViewState, fx: Fx, art: Art) {
    ctx.drawImage(art.paper, 0, 0, W, H);
    // Sinnet: rødblyant-skravering kryper inn fra høyre marg.
    if (g.sinne > 0.04) {
        const sw = Math.min(1, g.sinne) * 340;
        ctx.save();
        rect(ctx, W - sw, 0, sw, H);
        ctx.clip();
        ctx.globalAlpha = Math.min(0.9, g.sinne);
        ctx.drawImage(art.hatch, 0, 0, W, H);
        ctx.restore();
    }
    drawLog(ctx, fx);
    drawCalendar(ctx, g, fx);
    drawGoal(ctx, g);
    drawRuler(ctx, g, fx);
    g.camps.forEach((_, i) => drawCamp(ctx, g, fx, art, i));
    drawRoutes(ctx, g, fx);
    g.desks.forEach((_, i) => drawDesk(ctx, art, g, fx, v, i));
    drawPairs(ctx, g, fx);
    drawHint(ctx, g, fx, v);
    drawStrokes(ctx, fx);

    const blink = LEVELS[g.level].linjal && secsToStep(g) < K.kalender.varselSek;
    // Mappene: kø og skranke først, så leirene, så de som glir (øverst).
    const order = { behandles: 0, ko: 1, leir: 2, reiser: 3 } as const;
    const list = g.folders
        .filter((f) => v.drag?.id !== f.id)
        .sort((a, b) => order[a.state] - order[b.state]);
    for (const f of list) {
        const p = fx.pos.get(f.id);
        if (p) drawFolder(ctx, art, g, fx, f, p, v.selected === f.id, blink);
    }

    // Streken eleven drar, med magnet mot skranken.
    if (v.drag) {
        const f = g.folders.find((x) => x.id === v.drag!.id);
        const p = f && fx.pos.get(f.id);
        if (f && p) {
            const end = v.over >= 0 ? deskEntry(v.over) : { x: v.drag.x, y: v.drag.y };
            pencil(ctx, p.x, p.y, end.x, end.y, BLUE, f.id, 1, 1.8);
            ctx.save();
            ctx.globalAlpha = 0.35;
            drawFolder(ctx, art, g, fx, f, p, false, false);
            ctx.restore();
            drawFolder(ctx, art, g, fx, f, end, true, blink);
        }
    }

    drawFlying(ctx, fx);
    drawMeter(ctx, g, fx, art);
    drawScore(ctx, g, fx);
    drawCounter(ctx, g, fx);
    drawUlik(ctx, fx);
    drawCards(ctx, g);
    if (g.sinne > 0.1) {
        ctx.globalAlpha = Math.min(1, (g.sinne - 0.1) * 1.1);
        ctx.drawImage(art.dark, 0, 0, W, H);
        ctx.globalAlpha = 1;
    }
    drawInter(ctx, g);
}

/** Slutten: stempelet slår ned over hele arket (seier eller tap). */
export function drawEnd(ctx: CanvasRenderingContext2D, g: Game, t: number) {
    const won = g.mode === 'won';
    const k = Math.min(1, t / 0.18);
    ctx.fillStyle = won ? `rgba(242,241,234,${0.35 * k})` : `rgba(60,10,14,${0.35 * k})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.09);
    const sc = 1 + (1 - k) * 1.5;
    ctx.scale(sc, sc);
    ctx.globalAlpha = k;
    ctx.strokeStyle = won ? VIOLET : RED;
    ctx.lineWidth = 6;
    ctx.strokeRect(-230, -44, 460, 88);
    ctx.font = `bold 46px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = won ? VIOLET : RED;
    ctx.fillText(won ? 'AVSLUTTET 1948' : 'UTEN DOM', 0, 3);
    ctx.restore();
}
