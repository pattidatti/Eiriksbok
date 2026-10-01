// Visningen av Tinghuset: protokollarket rett ovenfra. Leirene til venstre, skrankene
// (gummistempler og protokollbøker) til høyre, sinnemåleren i høyre marg, og HUD-en er
// arkivet selv: avrivningskalender, straffenivå-linjal, telleverk. Kunsten (teksturene)
// bor i art.ts, bevegelsene i fx.ts, og layouten (det pekeren treffer) i layout.ts.

import {
    BLUE,
    DESK,
    INK,
    ON_LEATHER,
    PAPER_LIGHT,
    RED,
    SLIP,
    VIOLET,
    pencil,
    typed,
    type Art,
} from './art';
import { addStroke, drawFlying, drawLog, drawStrokes, drawUlik, stampPress } from './fx';
import type { Fx } from './fx';
import { secsToStep, twinEta } from './game';
import { H, W, campRect, campSlots, deskEntry, deskRect, homeOf, type Pt } from './layout';
import { LEVELS } from './levels';
import { domTekst, straffTrinn } from './rules';
import type { Folder, Game } from './state';
import {
    drawCalendar,
    drawCards,
    drawCounter,
    drawCrowd,
    drawGoal,
    drawInter,
    drawMeter,
    drawRuler,
    drawScore,
    drawTable,
} from './hud';
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
    if (f.kind === 'utenlov') return 'uten lov';
    if (f.grov) return trinn <= 4 ? 'dødsdom?' : 'livsvarig';
    return domTekst(f.kind, 'rett', trinn).replace(' fengsel', '');
}

/** Hver mappe ligger litt skjevt (±3 grader), fast per mappe. */
const tiltOf = (id: number) => (((id * 37) % 7) - 3) * (Math.PI / 180);

/**
 * Mappene glir mot plassen sin (leir, kø, skranke). En mappe på vei følger streken.
 * Kalles hver frame før tegningen.
 */
export function moveFolders(g: Game, fx: Fx, dt: number) {
    // Poengene teller opp, og folkemengden tegnes strek for strek.
    if (g.score > fx.scoreShown + 0.5) {
        if (fx.scorePop > 0.15) fx.scorePop = 0;
        fx.scoreShown += Math.max(1, (g.score - fx.scoreShown) * Math.min(1, dt * 7));
        fx.scoreShown = Math.min(fx.scoreShown, g.score);
    } else fx.scoreShown = g.score;
    fx.crowdShown += (Math.min(1, g.sinne) - fx.crowdShown) * Math.min(1, dt * 3);
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
    if (f.grov) {
        // Drap og tortur: dobbel rødblyant rundt hele mappa.
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-24, -16, 48, 32);
        ctx.strokeRect(-21, -13, 42, 26);
    }
    typed(ctx, String(f.sak), -10, -5.5, 10, INK, 'center');
    if (f.state === 'leir' || f.state === 'ko') {
        const label = shortDom(f, straffTrinn(g.mnd));
        if (blink && f.kind !== 'lett') {
            const s = Math.ceil(secsToStep(g));
            const on = Math.floor(fx.t * 4) % 2 === 0;
            typed(ctx, on ? label : `om ${s} s`, 0, 7, 10, RED, 'center');
        } else
            typed(
                ctx,
                label,
                0,
                7,
                10,
                f.kind === 'utenlov' ? BLUE : f.grov ? RED : f.kind === 'lett' ? '#3e3b44' : INK,
                'center'
            );
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
    // Leirplanen: brakker og gjerde, tegnet svakt i blekk (en plantegning fra arkivet).
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    for (let b = 0; b < 4; b++) {
        const bx = r.x + 22 + b * 60;
        ctx.strokeRect(bx, r.y + 34, 46, 72);
        for (let wy = r.y + 42; wy < r.y + 100; wy += 12) {
            ctx.fillStyle = INK;
            ctx.fillRect(bx + 3, wy, 4, 4);
            ctx.fillRect(bx + 39, wy, 4, 4);
        }
    }
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(r.x + 14, r.y + 29, r.w - 22, r.h - 34);
    ctx.setLineDash([]);
    ctx.restore();
    // Folk som venter uten dom: leiren fylles av rødblyant (rødt = det som haster).
    let heat = 0;
    for (const f of g.folders) if (f.state === 'leir' && f.camp === i) heat += g.t - f.born;
    heat = Math.min(1, heat / 40);
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
    const here = g.folders.filter((f) => f.state === 'leir' && f.camp === i);
    const n = here.length;
    // Hvor lenge den som har ventet lengst, har sittet uten dom (dager i kalenderen).
    const sek = here.reduce((m, f) => Math.max(m, g.t - f.born), 0);
    const dager = Math.round((sek / LEVELS[g.level].sekPerMnd) * 30);
    if (g.ruter.includes(i)) typed(ctx, 'FAST RUTE', r.x + r.w - 8, r.y + 13, 11, BLUE, 'right');
    else if (n > 0)
        typed(
            ctx,
            `${n} venter · ${dager} d`,
            r.x + r.w - 8,
            r.y + 13,
            11,
            n >= 6 || dager > 45 ? RED : INK,
            'right'
        );
    else typed(ctx, 'ingen uten dom', r.x + r.w - 8, r.y + 13, 11, BLUE, 'right', false);
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
    if (d.kind !== 'rett') {
        const avvis = d.kind === 'avvis';
        // Stempelet puster når det er det eleven skal bruke nå.
        const invite = avvis
            ? g.folders.some((f) => f.kind === 'utenlov' && f.state === 'leir')
            : g.level === 0 && !v.sent;
        const breathe = invite
            ? 1 + Math.sin(fx.t * 3.2) * 0.025 - st.press * 0.08
            : 1 - st.press * 0.08;
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + st.press * 2);
        ctx.scale(breathe, breathe);
        // Stempelblokka i tre med gummi under.
        ctx.fillStyle = 'rgba(20,16,14,0.30)';
        ctx.fillRect(-r.w / 2 + 3, -r.h / 2 + 5 - st.press * 2, r.w, r.h);
        ctx.fillStyle = avvis ? BLUE : VIOLET;
        ctx.fillRect(-r.w / 2 - 2, -r.h / 2 + 2, r.w + 4, r.h);
        ctx.fillStyle = DESK;
        ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h - 3);
        const grain = ctx.createLinearGradient(0, -r.h / 2, 0, r.h / 2);
        grain.addColorStop(0, 'rgba(255,230,200,0.12)');
        grain.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grain;
        ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h - 3);
        // Etiketten på toppen viser avtrykket.
        const ink = avvis ? BLUE : VIOLET;
        ctx.fillStyle = SLIP;
        ctx.fillRect(-r.w / 2 + 8, -r.h / 2 + 6, 104, 28);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-r.w / 2 + 11, -r.h / 2 + 9, 98, 22);
        typed(ctx, avvis ? 'AVVIS' : 'FORELEGG', -r.w / 2 + 60, -r.h / 2 + 20.5, 14, ink, 'center');
        typed(
            ctx,
            avvis ? 'ingen lov - ingen sak' : 'bot, fast takst',
            -r.w / 2 + 66,
            r.h / 2 - 11,
            10,
            ON_LEATHER,
            'center',
            false
        );
        const kw = art.knob.width / art.k;
        ctx.drawImage(art.knob, r.w / 2 - kw - 6, -kw / 2, kw, kw);
        ctx.restore();
        if (st.t < 0.3) {
            // Blekkring rundt stempelet når det slår ned.
            ctx.strokeStyle = st.mild ? RED : d.kind === 'avvis' ? BLUE : VIOLET;
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
        typed(ctx, `RETTSSAL ${n}`, r.x + 6, r.y + 10, 10, VIOLET);
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
            typed(ctx, shown, r.x + r.w / 2 + 4, r.y + 16, 10, INK, 'left', false);
            ctx.fillStyle = VIOLET;
            ctx.fillRect(r.x + r.w / 2 + 6, r.y + r.h - 9, (r.w / 2 - 12) * prog, 3);
            // Den blinkende markøren i skrivemaskinen.
            if (Math.floor(fx.t * 3) % 2 === 0) {
                ctx.font = `10px "Courier New", monospace`;
                const tw = ctx.measureText(shown).width;
                ctx.fillStyle = INK;
                ctx.fillRect(r.x + r.w / 2 + 7 + tw, r.y + 11, 1.2, 10);
            }
        } else {
            // Ledig sal: den trykte dommen for en angiver akkurat nå - og neste trinn.
            typed(
                ctx,
                'ledig',
                r.x + r.w * 0.75,
                r.y + 18,
                10,
                'rgba(34,29,36,0.45)',
                'center',
                false
            );
            const tr = straffTrinn(g.mnd);
            const now = domTekst('alvorlig', 'rett', tr).replace(' fengsel', '');
            const soon = LEVELS[g.level].linjal && secsToStep(g) < K.kalender.varselSek;
            const next = domTekst('alvorlig', 'rett', tr + 1).replace(' fengsel', '');
            const on = Math.floor(fx.t * 3) % 2 === 0;
            typed(
                ctx,
                soon && on ? `→ ${next}` : `nå ${now}`,
                r.x + r.w * 0.75,
                r.y + 36,
                10,
                soon ? RED : VIOLET,
                'center'
            );
        }
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
    drawTable(ctx, g, fx);
    drawCrowd(ctx, g, fx);
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
