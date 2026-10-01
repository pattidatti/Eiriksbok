// HUD-en i Tinghuset er arkivet selv: avrivningskalender, mål-kortet, straffenivå-linjalen,
// sinnemåleren, poenglappen, telleverket, domstabellen, folkemengden i margen, kortvalget og
// mellomsiden. Tegnes av drawGame i draw.ts.

import {
    BLUE,
    INK,
    ON_LEATHER,
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
import { drawLeaves } from './fx';
import type { Fx } from './fx';
import { secsToStep } from './game';
import {
    AVIS,
    CAL,
    COUNTER,
    CROWD,
    GOAL,
    TABLE,
    H,
    METER,
    RULER,
    SCORE,
    W,
    cardRects,
} from './layout';
import { LEVELS, monthName } from './levels';
import { domTekst, nesteTrinnMnd, straffTrinn } from './rules';
import type { Game } from './state';
import { CARD_TEXT } from './texts';
import { TUNING } from './tuning';

const K = TUNING;
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
}

export function drawCalendar(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
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

export function drawGoal(ctx: CanvasRenderingContext2D, g: Game) {
    const { x, y, w } = GOAL;
    // Et lite kartotekkort på læret.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - 4, y - 5, w + 10, 96);
    ctx.fillStyle = PAPER_LIGHT;
    ctx.fillRect(x - 7, y - 8, w + 10, 96);
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

export function drawRuler(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const lv = LEVELS[g.level];
    const tr = straffTrinn(g.mnd);
    // Linjalen kommer først når det første trinnet nærmer seg - færre tall før de trengs.
    if (!lv.linjal || (tr === 0 && secsToStep(g) > 8)) return;
    const { x, y, w, h } = RULER;
    const T = K.kalender.trinn;
    const steps = Math.round((1 - T.min) / T.pp);
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
    typed(ctx, `STRAFF ${100 - tr * 5} %`, x + 5, y + h / 2 + 0.5, 11, VIOLET);
    // Nedtelling når neste trinn er nær.
    const s = secsToStep(g);
    if (s < K.kalender.varselSek && Math.floor(fx.t * 4) % 2 === 0) {
        const nx = x + 88 + (tr + 1) * sw;
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.strokeRect(nx, y + 1, sw, h - 2);
        typed(ctx, `-5 % om ${Math.ceil(s)} s`, x + w, y + h + 10, 11, ON_LEATHER, 'right');
    }
}

export function drawMeter(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, art: Art) {
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
    const sum = g.fraVent + g.fraMild + g.fraAvvist || 1;
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
    typed(ctx, 'SINNET I GATENE', 0, 0, 13, '#f39a88', 'center');
    ctx.restore();
    typed(
        ctx,
        `${Math.round(Math.min(1, g.sinne) * 100)} %`,
        x + w / 2,
        y - 10,
        12,
        '#f39a88',
        'center'
    );
}

export function drawScore(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w } = SCORE;
    // Poengene står på en lapp på læret og teller opp; lappen hopper når det kommer poeng.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - 3, y + 1, w + 6, 56);
    ctx.fillStyle = PAPER_LIGHT;
    ctx.fillRect(x - 6, y - 2, w + 6, 56);
    typed(ctx, 'POENG', x, y + 8, 10, INK);
    const sp = fx.scorePop < 0.2 ? 1 + (1 - fx.scorePop / 0.2) * 0.12 : 1;
    ctx.save();
    ctx.translate(x, y + 28);
    ctx.scale(sp, sp);
    big(ctx, Math.floor(fx.scoreShown).toLocaleString('nb-NO'), 0, 0, 22, INK);
    ctx.restore();
    // Multiplikatoren vises bare når den betyr noe (over x1, eller like etter at den falt).
    if (g.mult <= 1 && fx.multPop > 1.2) return;
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
    typed(ctx, 'jevnt par i retten: +×1', x, y + 47, 10, VIOLET, 'left', false);
}

export function drawCounter(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
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

/** Domstabellen øverst på arket: hva hver sakstype får i dag, og hva den får etter neste trinn.
 *  Radene kommer etter hvert som sakstypene dukker opp (opptrappingen). */
export function drawTable(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w } = TABLE;
    const lv = LEVELS[g.level];
    const tr = straffTrinn(g.mnd);
    const next = lv.linjal && nesteTrinnMnd(g.mnd) !== null ? tr + 1 : null;
    const soon = lv.linjal && secsToStep(g) < K.kalender.varselSek;
    const pop = lv.linjal ? 1 + (1 - ease(fx.trinnT / 0.4)) * 0.25 : 1;
    const rows: [string, string, string | null, string][] = [
        ['NS-medlem', 'forelegg', null, INK],
        ['tyskerjente', 'avvis saken', null, BLUE],
    ];
    const aar = (kind: 'alvorlig' | 'tykk', t: number) =>
        domTekst(kind, 'rett', t).replace(' fengsel', '');
    if (g.firstSerious)
        rows.push([
            'angiver',
            `retten ${aar('alvorlig', tr)}`,
            next !== null ? aar('alvorlig', next) : null,
            RED,
        ]);
    if (g.level >= 3 || g.firstThick)
        rows.push([
            'profittør',
            `retten ${aar('tykk', tr)}`,
            next !== null ? aar('tykk', next) : null,
            RED,
        ]);
    typed(ctx, 'DOMMEN I DAG', x + 4, y + 7, 11, VIOLET);
    const s = secsToStep(g);
    if (lv.linjal && s < 8) {
        typed(
            ctx,
            Number.isFinite(s) ? `neste trinn om ${Math.ceil(s)} s` : 'laveste trinn',
            x + w - 4,
            y + 7,
            11,
            soon ? RED : VIOLET,
            'right',
            false
        );
    }
    rows.forEach(([label, now, nxt, c], i) => {
        const ry = y + 24 + i * 15;
        typed(ctx, label, x + 4, ry, 11, c);
        ctx.save();
        ctx.translate(x + 112, ry);
        if (nxt) ctx.scale(pop, pop);
        typed(ctx, now, 0, 0, 11, INK, 'left', false);
        ctx.restore();
        if (nxt && s < 8)
            typed(ctx, `→ ${nxt}`, x + w - 4, ry, 11, soon ? RED : '#6d5f78', 'right', false);
    });
    const lines = rows.length + (lv.par ? 1 : 0);
    if (lv.par)
        typed(ctx, 'JEVNT PAR: samme nr., samme dom', x + 4, y + 24 + rows.length * 15, 11, BLUE);
    ctx.fillStyle = 'rgba(34,29,36,0.35)';
    ctx.fillRect(x, y + 16 + lines * 15, w, 1);
}

/** Plakatene folk holder opp utenfor tinghuset. Ingen ansikter - bare papp på stokker. */
const SKILT = [
    'STRAFF DEM',
    'DØM DEM',
    'LANDSSVIK!',
    'FENGSEL!',
    'HUSK 1940',
    'HARDERE!',
    'STRAFF!',
    'RETT NÅ',
    'IKKE GLEM',
    'SKAM!',
];

/**
 * Folk utenfor tinghuset: plakater på stokker som heves én etter én når sinnet stiger, og
 * senkes når det legger seg. De rister mer jo sintere folk er.
 */
export function drawCrowd(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w, h } = CROWD;
    const want = Math.round(fx.crowdShown * SKILT.length * 1.15);
    while (fx.placards.length < SKILT.length) fx.placards.push(0);
    typed(ctx, 'FOLK UTENFOR TINGHUSET', x + 4, y + 6, 11, RED);
    if (want === 0 && fx.placards.every((p) => p < 0.05))
        typed(ctx, 'stille i gatene', x + w - 4, y + 6, 11, '#6d5f78', 'right', false);
    const shake = Math.min(1, g.sinne) * 2.4;
    ctx.save();
    rect(ctx, x - 4, y + 12, w + 8, h - 10);
    ctx.clip();
    // Bakerste rad først (de odde), så forreste.
    for (const back of [true, false]) {
        SKILT.forEach((txt, i) => {
            if ((i % 2 === 0) === back) return;
            const target = i < want ? 1 : 0;
            fx.placards[i] += (target - fx.placards[i]) * 0.08;
            const up = ease(fx.placards[i]);
            if (up < 0.02) return;
            // Fem plasser per rad; bakre rad forskjøvet en halv plass og høyere opp.
            const px = x + 6 + Math.floor(i / 2) * 60 + (back ? 26 : 0);
            const jx = Math.sin(fx.t * (4 + (i % 3)) + i * 1.7) * shake;
            const jy = Math.abs(Math.cos(fx.t * (5 + (i % 4)) + i)) * shake;
            const base = y + (back ? 30 : 40) + (1 - up) * 44 - jy;
            ctx.save();
            ctx.translate(px + jx, base);
            ctx.rotate(Math.sin(i * 2.3) * 0.12 + jx * 0.02);
            ctx.font = `bold 10px "Courier New", monospace`;
            const tw = ctx.measureText(txt).width + 10;
            ctx.fillStyle = '#6b4a2e';
            ctx.fillRect(tw / 2 - 1.5, 6, 3, 30);
            ctx.fillStyle = 'rgba(30,20,14,0.3)';
            ctx.fillRect(2, -6, tw, 16);
            ctx.fillStyle = back ? '#e6d8b4' : '#f3e8cc';
            ctx.fillRect(0, -8, tw, 16);
            ctx.strokeStyle = 'rgba(34,29,36,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, -7.5, tw - 1, 15);
            typed(ctx, txt, tw / 2, 0, 10, RED, 'center');
            ctx.restore();
        });
    }
    ctx.restore();
}

/** Avisa: dagens overskrift etter kalenderen, eller et svar på det eleven nettopp gjorde. */
const NYHETER: [number, string][] = [
    [0, 'Freden er her - tusenvis arrestert'],
    [1, '«Døm dem nå!» Leirene fylles'],
    [4, 'Quisling dømt til døden'],
    [5, 'Quisling henrettet på Akershus'],
    [8, 'Rettssakene tar tid - køen vokser'],
    [12, 'Ett år etter freden: mange venter fortsatt'],
    [17, 'Mildere dommer i retten'],
    [24, 'Færre i gatene - sinnet legger seg'],
    [31, 'Mange landssvikere prøveløslatt'],
    [36, 'Oppgjøret nærmer seg slutten'],
];

export function drawAvis(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const { x, y, w, h } = AVIS;
    let text = NYHETER[0][1];
    let key = 0;
    for (const [m, t] of NYHETER)
        if (g.mnd >= m) {
            text = t;
            key = m;
        }
    let born = -1;
    if (fx.news && fx.t - fx.news.t < 6) {
        text = fx.news.text;
        born = fx.news.t;
    } else if (g.sinne > 0.75) text = 'Uro utenfor tinghuset';
    // Ny overskrift: avisa slås opp på nytt (glir inn fra venstre).
    const since = born >= 0 ? fx.t - born : fx.t - (fx.newsMonth.get(key) ?? 0);
    if (!fx.newsMonth.has(key)) fx.newsMonth.set(key, fx.t);
    const k = ease(since / 0.35);
    ctx.save();
    ctx.translate(x - (1 - k) * 40, y);
    ctx.rotate(-0.015);
    ctx.globalAlpha = 0.4 + 0.6 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(3, 4, w, h);
    ctx.fillStyle = '#e8dfc8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK;
    ctx.fillRect(6, 17, w - 12, 1.5);
    typed(ctx, 'AVISA', 8, 9, 11, INK);
    typed(ctx, monthName(g.mnd), w - 8, 9, 10, '#5e5560', 'right', false);
    // Overskriften, brutt over to linjer.
    ctx.font = `bold 13px "Courier New", monospace`;
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const wd of words) {
        const test = line ? `${line} ${wd}` : wd;
        if (ctx.measureText(test).width > w - 16 && line) {
            lines.push(line);
            line = wd;
        } else line = test;
    }
    if (line) lines.push(line);
    const red = born >= 0 || g.sinne > 0.75;
    lines.slice(0, 2).forEach((l, i) => typed(ctx, l, 8, 30 + i * 16, 13, red ? RED : INK));
    ctx.restore();
}

export function drawCards(ctx: CanvasRenderingContext2D, g: Game) {
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
        typed(ctx, CARD_TEXT[c][1], -r.w / 2 + 14, -r.h / 2 + 38, 11, INK, 'left', false);
        typed(ctx, `trykk for å velge`, r.w / 2 - 10, r.h / 2 - 10, 10, BLUE, 'right', false);
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

export function drawInter(ctx: CanvasRenderingContext2D, g: Game) {
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
    // Teksten skrives fort nok til at hele setningen står lenge før siden forsvinner.
    const shown = t.slice(0, Math.floor(Math.max(0, age - 0.15) * 180));
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
