// Gråboks-visningen av Tinghuset: bare primitive former på et grått ark. Ingen kunst,
// ingen juice. Layouten (hvor leirer, skranker og kort står) bor her, og Tinghuset.tsx
// bruker de samme funksjonene til å treffe mapper og skranker med pekeren.

import { LEVELS, monthName } from './levels';
import { TUNING } from './tuning';
import { straffNivaa } from './rules';
import type { CardId, Folder, Game, Verdict } from './state';

export const W = TUNING.world.w;
export const H = TUNING.world.h;

export const PAPER = '#d9dad2';
export const INK = '#2a2731';
export const VIOLET = '#5b3e8c';
export const BLUE = '#2e5b98';
export const RED = '#b3342a';
export const CARD = '#b49a62';
export const MONO = '"Courier New", ui-monospace, monospace';

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export const FOLDER_W = 40;
export const FOLDER_H = 26;

const CAMP_X = 24;
const CAMP_W = 250;
const CAMP_TOP = 96;
const CAMP_H = 132;
const CAMP_STEP = 144;
const DESK_X = 640;
const DESK_W = 180;
const DESK_H = 60;
const DESK_TOP = 78;
const DESK_STEP = 72;
const METER: Rect = { x: 884, y: 90, w: 30, h: 380 };

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

export function cardRects(n: number): Rect[] {
    const w = 190;
    const gap = 14;
    const x0 = (W - (n * w + (n - 1) * gap)) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y: H - 96, w, h: 84 }));
}

export const inside = (r: Rect, x: number, y: number) =>
    x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** Hvor hver mappe i en leir ligger (midtpunkt), etter id. */
export function campSlots(g: Game): Map<number, { x: number; y: number }> {
    const out = new Map<number, { x: number; y: number }>();
    const per = new Map<number, number>();
    for (const f of g.folders) {
        if (f.state !== 'leir' && f.state !== 'reiser') continue;
        const k = per.get(f.camp) ?? 0;
        per.set(f.camp, k + 1);
        const r = campRect(f.camp);
        const col = k % 5;
        const row = Math.floor(k / 5) % 3;
        out.set(f.id, {
            x: r.x + 30 + col * 46,
            y: r.y + 42 + row * 32 + Math.floor(k / 15) * 4,
        });
    }
    return out;
}

/** Mappa under pekeren (bare de som ligger i en leir kan sendes). */
export function folderAt(g: Game, x: number, y: number): Folder | null {
    const slots = campSlots(g);
    for (const f of g.folders) {
        if (f.state !== 'leir') continue;
        const p = slots.get(f.id);
        if (!p) continue;
        if (Math.abs(x - p.x) <= FOLDER_W / 2 + 3 && Math.abs(y - p.y) <= FOLDER_H / 2 + 3)
            return f;
    }
    return null;
}

export function deskAt(g: Game, x: number, y: number): number {
    for (let i = 0; i < g.desks.length; i++) {
        const r = deskRect(i);
        // Litt raus mot venstre, så køen også teller som skranken.
        if (inside({ ...r, x: r.x - 90, w: r.w + 90 }, x, y)) return i;
    }
    return -1;
}

export const CARD_TEXT: Record<CardId, [string, string]> = {
    rettssal: ['Ny rettssal', 'Én rettssal til'],
    dommere: ['Flere dommere', 'Rettssalene 10 % raskere'],
    rute: ['Fast rute', 'Grå mapper fra én leir går til forelegg av seg selv'],
    felles: ['Felles behandling', 'Et par i samme rettssal avgjøres samtidig'],
    forelegg: ['Ny forelegg-skranke', 'Én forelegg-skranke til'],
};

/** En dommerlapp i klartekst: «juni 1945: 6 år fengsel». */
export function verdictText(v: Verdict): string {
    const when = monthName(v.mnd);
    if (v.route === 'forelegg') return `${when}: ${v.mild ? 'bot - FOR MILDT' : 'bot'}`;
    return `${when}: ${String(v.aar).replace('.', ',')} år fengsel`;
}

/** Så lenge (s) lappene for et ulikt par ligger oppe. */
export const LAPP_TID = 2.5;

export interface ViewState {
    drag: { id: number; x: number; y: number } | null;
    selected: number | null;
    /** Ulike par som vises side om side midt på skjermen. */
    lapper: { a: Verdict; b: Verdict; t: number }[];
}

function box(ctx: CanvasRenderingContext2D, r: Rect, fill: string, stroke = INK, lw = 2) {
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
}

function label(
    ctx: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    size = 14,
    color = INK,
    align: CanvasTextAlign = 'left',
    bold = true
) {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${MONO}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
}

function folder(ctx: CanvasRenderingContext2D, f: Folder, x: number, y: number, hi = false) {
    const h = f.kind === 'tykk' ? FOLDER_H + 6 : FOLDER_H;
    const r = { x: x - FOLDER_W / 2, y: y - h / 2, w: FOLDER_W, h };
    box(ctx, r, f.kind === 'lett' ? '#9d9d96' : CARD, hi ? BLUE : INK, hi ? 3 : 1.5);
    if (f.kind !== 'lett') {
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(r.x + r.w, r.y);
        ctx.lineTo(r.x + r.w - 14, r.y);
        ctx.lineTo(r.x + r.w, r.y + 14);
        ctx.fill();
    }
    label(ctx, String(f.sak), x - 4, y + 1, 11, INK, 'center');
    // Venter på tvillingen sin: folk blir sintere av den (x1,5).
    if (f.twin === -1 && f.state === 'leir')
        label(ctx, 'x1,5', x, r.y + r.h + 7, 10, RED, 'center');
}

export function drawGame(ctx: CanvasRenderingContext2D, g: Game, v: ViewState, now: number) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    const lv = LEVELS[g.level];

    // Kalenderen og straffenivå-linjalen.
    box(ctx, { x: 20, y: 12, w: 230, h: 40 }, '#ecece6');
    label(ctx, monthName(g.mnd).toUpperCase(), 32, 32, 18, VIOLET);
    if (lv.linjal) {
        const s = straffNivaa(g.mnd);
        box(ctx, { x: 20, y: 58, w: 230, h: 18 }, '#ecece6', INK, 1);
        ctx.fillStyle = VIOLET;
        ctx.fillRect(21, 59, 228 * s, 16);
        label(ctx, `STRAFFENIVÅ ${Math.round(s * 100)} %`, 28, 67, 11, '#fff');
    }

    // Leirene.
    g.camps.forEach((c, i) => {
        const r = campRect(i);
        box(ctx, r, '#e6e6df');
        label(ctx, c, r.x + 10, r.y + 14, 15);
        if (g.ruter.includes(i))
            label(ctx, 'FAST RUTE', r.x + r.w - 10, r.y + 14, 11, BLUE, 'right');
    });

    // Skrankene, køene og saken som behandles.
    const slots = campSlots(g);
    g.desks.forEach((d, i) => {
        const r = deskRect(i);
        box(ctx, r, d.kind === 'forelegg' ? '#e4dcef' : '#ddd6ea', VIOLET, 3);
        label(ctx, d.kind === 'forelegg' ? 'FORELEGG' : 'RETTSSAK', r.x + 12, r.y + 18, 16, VIOLET);
        if (d.current !== null) {
            ctx.fillStyle = VIOLET;
            ctx.fillRect(r.x + 12, r.y + r.h - 16, (r.w - 24) * (1 - d.left / d.total), 8);
            const f = g.folders.find((x) => x.id === d.current);
            if (f) folder(ctx, f, r.x + r.w - 30, r.y + 22);
        }
        d.queue.forEach((id, k) => {
            const f = g.folders.find((x) => x.id === id);
            if (f) folder(ctx, f, r.x - 26 - (k % 4) * 10, r.y + r.h / 2 - Math.floor(k / 4) * 6);
        });
        if (d.queue.length > 3)
            label(ctx, `${d.queue.length} I KØ`, r.x - 6, r.y + r.h + 4, 11, RED, 'right');
    });

    // Mappene i leirene og på vei langs streken.
    for (const f of g.folders) {
        const p = slots.get(f.id);
        if (!p) continue;
        if (f.state === 'reiser') {
            const r = deskRect(f.desk);
            const k = 1 - Math.max(0, f.travel) / TUNING.skranke.reise;
            const tx = r.x - 26;
            const ty = r.y + r.h / 2;
            ctx.strokeStyle = BLUE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            folder(ctx, f, p.x + (tx - p.x) * k, p.y + (ty - p.y) * k);
        } else if (v.drag?.id !== f.id) folder(ctx, f, p.x, p.y, v.selected === f.id);
    }

    // Streken eleven drar.
    if (v.drag) {
        const f = g.folders.find((x) => x.id === v.drag!.id);
        const p = f && slots.get(f.id);
        if (f && p) {
            ctx.strokeStyle = BLUE;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(v.drag.x, v.drag.y);
            ctx.stroke();
            ctx.setLineDash([]);
            folder(ctx, f, v.drag.x, v.drag.y, true);
        }
    }

    // Sinnemåleren i høyre marg: to nyanser av rødt etter hvor fyllet kom fra.
    box(ctx, METER, '#ecece6');
    const fill = Math.min(1, g.sinne) * METER.h;
    const sum = g.fraVent + g.fraMild || 1;
    const mildPart = fill * (g.fraMild / sum);
    ctx.fillStyle = '#d9776f';
    ctx.fillRect(METER.x + 2, METER.y + METER.h - fill, METER.w - 4, fill - mildPart);
    ctx.fillStyle = RED;
    ctx.fillRect(METER.x + 2, METER.y + METER.h - mildPart, METER.w - 4, mildPart);
    if (lv.sinneTak < 1) {
        const y = METER.y + METER.h * (1 - lv.sinneTak);
        ctx.strokeStyle = INK;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(METER.x - 4, y);
        ctx.lineTo(METER.x + METER.w + 4, y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.save();
    ctx.translate(METER.x + METER.w + 22, METER.y + METER.h / 2);
    ctx.rotate(-Math.PI / 2);
    label(ctx, 'SINNET I GATENE', 0, 0, 13, RED, 'center');
    ctx.restore();

    // Telleverket nederst til høyre.
    label(
        ctx,
        `JEVNE DOMMER ${String(g.jevne).padStart(3, '0')}`,
        W - 20,
        H - 40,
        16,
        INK,
        'right'
    );
    label(ctx, `${Math.floor(g.score)} poeng  ×${g.mult}`, W - 20, H - 18, 14, VIOLET, 'right');

    // Ulike par: lappene side om side midt på skjermen, med rødt stempel «ULIK DOM» på begge
    // og straffenivået som skilte dem.
    const lapp = v.lapper[v.lapper.length - 1];
    if (lapp && now - lapp.t < LAPP_TID) {
        label(ctx, `SAK ${lapp.a.sak}. SAMME HANDLING.`, W / 2, 196, 15, RED, 'center');
        [lapp.a, lapp.b].forEach((d, k) => {
            const r = { x: W / 2 - 214 + k * 220, y: 212, w: 208, h: 92 };
            box(ctx, r, '#f2f1ea', INK, 2);
            label(ctx, verdictText(d), r.x + r.w / 2, r.y + 22, 13, INK, 'center', false);
            const prosent = Math.round(straffNivaa(d.mnd) * 100);
            label(ctx, `straffenivå ${prosent} %`, r.x + r.w / 2, r.y + 44, 13, VIOLET, 'center');
            ctx.save();
            ctx.translate(r.x + r.w / 2, r.y + 70);
            ctx.rotate(-0.12);
            ctx.strokeStyle = RED;
            ctx.lineWidth = 3;
            ctx.strokeRect(-70, -14, 140, 28);
            label(ctx, 'ULIK DOM', 0, 1, 18, RED, 'center');
            ctx.restore();
        });
    }

    // Kortvalget.
    if (g.offer) {
        const rs = cardRects(g.offer.cards.length);
        g.offer.cards.forEach((c, i) => {
            const r = rs[i];
            box(ctx, r, '#f2f1ea', BLUE, 3);
            label(ctx, CARD_TEXT[c][0].toUpperCase(), r.x + r.w / 2, r.y + 22, 14, BLUE, 'center');
            wrap(ctx, CARD_TEXT[c][1], r.x + r.w / 2, r.y + 46, r.w - 16, 12);
        });
        ctx.fillStyle = BLUE;
        ctx.fillRect(
            rs[0].x,
            rs[0].y - 8,
            (rs.at(-1)!.x + rs.at(-1)!.w - rs[0].x) * (g.offer.left / TUNING.kort.varer),
            4
        );
    }

    // Mellomsiden mellom brettene.
    if (g.inter > 0) {
        box(ctx, { x: W / 2 - 260, y: 170, w: 520, h: 150 }, '#f2f1ea', INK, 3);
        label(ctx, LEVELS[g.level].navn.toUpperCase(), W / 2, 200, 20, VIOLET, 'center');
        wrap(ctx, LEVELS[g.level].protokoll, W / 2, 240, 480, 15);
        label(ctx, 'klikk for å fortsette', W / 2, 300, 12, INK, 'center', false);
    }
}

function wrap(
    ctx: CanvasRenderingContext2D,
    t: string,
    cx: number,
    y: number,
    maxW: number,
    size: number
) {
    ctx.font = `${size}px ${MONO}`;
    const words = t.split(' ');
    let line = '';
    let yy = y;
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
            label(ctx, line, cx, yy, size, INK, 'center', false);
            line = w;
            yy += size + 4;
        } else line = test;
    }
    if (line) label(ctx, line, cx, yy, size, INK, 'center', false);
}
