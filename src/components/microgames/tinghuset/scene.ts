// Scenen rundt saksbehandlingen: folkemengden utenfor tinghuset (silhuetter i papirklipp som
// blir flere og urolige med sinnet), lovsiden i den tomme protokollen de første sekundene,
// plassene der nye leirer skal åpne, og dommerne i rettssal-hylla. Ingen ansikter, aldri
// ydmykelse eller vold - folk står, venter og holder plakater.

import { BLUE, INK, RED, VIOLET, typed } from './art';
import type { Fx } from './fx';
import { COURT, CROWD, campRect, deskRect } from './layout';
import { LEVELS, monthName } from './levels';
import type { Game } from './state';

const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

/**
 * En silhuett i papirklipp med origo ved føttene: frakk, skuldre og hode, noen med hatt eller
 * skaut. `s` er størrelsen, `kind` velger hodeplagg, `robe` gir dommerkappe (bredere skuldre).
 */
export function person(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    kind: number,
    color: string,
    robe = false
) {
    const w = robe ? 9 : 7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * s, y);
    ctx.lineTo(x - (w - 1) * s, y - 15 * s);
    ctx.quadraticCurveTo(x - (w - 1) * s, y - 20 * s, x - 3 * s, y - 20.5 * s);
    ctx.lineTo(x + 3 * s, y - 20.5 * s);
    ctx.quadraticCurveTo(x + (w - 1) * s, y - 20 * s, x + (w - 1) * s, y - 15 * s);
    ctx.lineTo(x + w * s, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 25 * s, 4.4 * s, 0, Math.PI * 2);
    ctx.fill();
    if (robe) {
        // Dommerkappa: en lys krage.
        ctx.fillStyle = 'rgba(241,239,228,0.85)';
        ctx.fillRect(x - 2 * s, y - 20 * s, 4 * s, 5 * s);
        return;
    }
    const k = kind % 4;
    if (k === 0) {
        // Hatt med brem.
        ctx.fillRect(x - 6.5 * s, y - 28.6 * s, 13 * s, 1.8 * s);
        ctx.fillRect(x - 4 * s, y - 33 * s, 8 * s, 4.6 * s);
    } else if (k === 1) {
        // Skaut.
        ctx.beginPath();
        ctx.arc(x, y - 25.6 * s, 5.4 * s, Math.PI * 0.95, Math.PI * 2.05);
        ctx.lineTo(x + 3 * s, y - 19 * s);
        ctx.lineTo(x - 3 * s, y - 19 * s);
        ctx.fill();
    } else if (k === 2) {
        // Sixpence.
        ctx.beginPath();
        ctx.ellipse(x + 1.2 * s, y - 28.5 * s, 5.6 * s, 2.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Plassene i folkemengden: de første står midt foran tinghuset, de neste fyller ut mot sidene.
interface Spot {
    x: number;
    row: number;
    kind: number;
}
const SPOTS: Spot[] = (() => {
    const out: Spot[] = [];
    let r = 7;
    const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 54; i++) {
        const row = i % 3;
        out.push({ x: (rnd() - 0.5) * (0.35 + Math.min(1, i / 30) * 0.65), row, kind: i });
    }
    return out;
})();
/** Plakatene noen av dem holder opp (saklig: det folk krevde i 1945). */
const SKILT: [number, string][] = [
    [4, 'STRAFF DEM'],
    [11, 'HUSK 1940'],
    [19, 'DØM DEM'],
    [28, 'LANDSSVIK!'],
];

/**
 * Folk utenfor tinghuset: et vindu ut mot gata. Silhuettene kommer opp fra fortauet én etter
 * én når sinnet stiger, og går igjen når det legger seg. Jo sintere, jo mer uro i flokken.
 */
export function drawCrowd(ctx: CanvasRenderingContext2D, _g: Game, fx: Fx) {
    const { x, y, w, h } = CROWD;
    const anger = Math.min(1, fx.crowdShown);
    // Fra en tom plass (en og annen forbipasserende) til full trengsel ved 85 % sinne.
    const want = Math.round(Math.min(1, Math.pow(anger / 0.85, 1.3)) * SPOTS.length);
    while (fx.placards.length < SPOTS.length) fx.placards.push(0);
    ctx.save();
    // Gata: blek himmel, tinghusets søyler bak, fortauet foran.
    ctx.fillStyle = '#d8c9a3';
    ctx.fillRect(x, y, w, h);
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, `rgba(120,40,30,${0.08 + anger * 0.22})`);
    sky.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    // Tinghuset bak folkemengden: gavl, seks brede søyler og trapp (svakt, som et blyantriss).
    ctx.fillStyle = 'rgba(34,29,36,0.1)';
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 30);
    ctx.lineTo(x + w / 2, y + 8);
    ctx.lineTo(x + w - 60, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + 54, y + 30, w - 108, 5);
    for (let c = 0; c < 6; c++) ctx.fillRect(x + 70 + c * ((w - 158) / 5), y + 36, 18, h - 62);
    ctx.fillRect(x + 40, y + h - 26, w - 80, 4);
    ctx.fillStyle = 'rgba(34,29,36,0.22)';
    ctx.fillRect(x, y + h - 16, w, 16);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const shake = anger * 1.8;
    // Bakerste rad først.
    for (const row of [0, 1, 2]) {
        SPOTS.forEach((sp, i) => {
            if (sp.row !== row) return;
            const target = i < want ? 1 : 0;
            fx.placards[i] += (target - fx.placards[i]) * 0.06;
            const up = ease(fx.placards[i]);
            if (up < 0.02) return;
            const s = 1.05 + row * 0.22;
            const px = x + w / 2 + sp.x * (w - 20);
            const bob = Math.abs(Math.sin(fx.t * (2.5 + (i % 4)) + i * 1.3)) * shake;
            const base = y + h - 30 + row * 8 + (1 - up) * 50 - bob;
            const tone = row === 0 ? '#6a5a5e' : row === 1 ? '#45383f' : INK;
            const sign = SKILT.find(([k]) => k === i);
            if (sign && anger > 0.3) {
                // Plakat på stokk over hodet.
                const sx = px + 6 * s;
                const sy = base - 46 * s;
                ctx.fillStyle = '#6b4a2e';
                ctx.fillRect(sx - 1, sy, 2, 24 * s);
                ctx.font = `bold 10px "Courier New", monospace`;
                const tw = ctx.measureText(sign[1]).width + 8;
                ctx.fillStyle = '#f3e8cc';
                ctx.fillRect(sx - tw / 2, sy - 8, tw, 15);
                ctx.strokeStyle = 'rgba(34,29,36,0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx - tw / 2 + 0.5, sy - 7.5, tw - 1, 14);
                typed(ctx, sign[1], sx, sy, 10, RED, 'center');
            }
            ctx.globalAlpha = up;
            // Papirklipp: en lys kant forskjøvet bak figuren.
            person(ctx, px + 1, base + 1, s, sp.kind, 'rgba(248,240,218,0.5)');
            person(ctx, px, base, s, sp.kind, tone);
            ctx.globalAlpha = 1;
        });
    }
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // Etiketten på vinduet.
    ctx.fillStyle = 'rgba(248,240,218,0.92)';
    ctx.fillRect(x + 4, y + 4, 168, 16);
    typed(ctx, 'UTENFOR TINGHUSET', x + 10, y + 12, 11, RED);
    if (want <= 4) typed(ctx, 'stille i gatene', x + w - 8, y + 12, 11, '#4b4250', 'right', false);
}

const LOV = [
    'LANDSSVIKANORDNINGEN, 15. des. 1944',
    'NS-medlem etter 8. april 1940: straff.',
    'Angiver, statspoliti: langt fengsel.',
    'Tjent penger på tyskerne: straff.',
    'Kjæreste med en tysker: ingen lov.',
];

/**
 * Lovsiden: i den tomme protokollen skrives loven inn linje for linje de første sekundene,
 * og den blekner når protokollen fylles med dommer.
 */
export function drawLaw(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    if (g.level > 1) return;
    const fade = 1 - Math.min(1, Math.max(0, (fx.log.length - 3) / 3));
    if (fade <= 0) return;
    const x = 310;
    let left = Math.max(0, fx.t - 0.4) * 34;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x, 296);
    ctx.rotate(-0.012);
    LOV.forEach((l, i) => {
        if (left <= 0) return;
        const shown = l.slice(0, Math.ceil(left));
        left -= l.length + 6;
        const head = i === 0;
        typed(
            ctx,
            shown,
            0,
            i * 21,
            head ? 11 : 11,
            head ? VIOLET : i === 4 ? BLUE : INK,
            'left',
            head
        );
        if (head && shown.length === l.length) {
            ctx.fillStyle = VIOLET;
            ctx.fillRect(0, 9, ctx.measureText(l).width, 1.2);
        }
    });
    ctx.restore();
}

const NAVN = ['ILEBU', 'AKERSHUS', 'FALSTAD'];

/**
 * Plassene der nye leirer skal åpne: en stiplet ramme, navnet og en rekke arresterte som går
 * mot leiren. Fylles når leiren åpner.
 */
export function drawCampSlots(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    for (let i = g.camps.length; i < 3; i++) {
        const r = campRect(i);
        const opens = LEVELS.findIndex((lv) => lv.leirer.length > i);
        if (opens < 0) continue;
        ctx.save();
        ctx.strokeStyle = 'rgba(241,228,194,0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.setLineDash([]);
        typed(ctx, NAVN[i], r.x + 10, r.y + 13, 13, 'rgba(241,228,194,0.75)');
        const when = monthName(LEVELS[opens].fraMnd);
        typed(
            ctx,
            `åpner ${when}`,
            r.x + r.w - 8,
            r.y + 13,
            10,
            'rgba(241,228,194,0.75)',
            'right',
            false
        );
        // Arresterte på vei: en rolig rekke silhuetter som går mot høyre og kommer igjen.
        ctx.beginPath();
        ctx.rect(r.x + 2, r.y + 22, r.w - 4, r.h - 24);
        ctx.clip();
        const n = 7;
        for (let k = 0; k < n; k++) {
            const u = (fx.t * 0.05 + k / n + i * 0.37) % 1;
            const px = r.x - 10 + u * (r.w + 20);
            const step = Math.abs(Math.sin(fx.t * 5 + k * 1.7)) * 1.2;
            person(ctx, px, r.y + r.h - 12 - step, 0.95, k + i, 'rgba(241,228,194,0.32)');
        }
        ctx.restore();
    }
    // Mai 1945: arrestasjonene går for fullt.
    if (g.level < 1 && fx.t > 1)
        typed(
            ctx,
            'flere arresteres hver dag',
            campRect(1).x + campRect(1).w / 2,
            campRect(1).y + 44,
            11,
            'rgba(241,228,194,0.7)',
            'center',
            false
        );
}

/** Rettssal-hylla: én ramme rundt alle dommerplassene, med overskrift. */
export function drawCourtShelf(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const seats: number[] = [];
    g.desks.forEach((d, i) => d.kind === 'rett' && seats.push(i));
    if (!seats.length) return;
    const last = deskRect(seats[seats.length - 1]);
    const open = fx.deskOpen.get(seats[0]);
    const off = open === undefined ? 0 : (1 - ease(open / 0.5)) * 220;
    const { x, y, w } = COURT;
    const h = last.y + last.h + 6 - y;
    ctx.save();
    ctx.translate(off, 0);
    ctx.fillStyle = 'rgba(20,12,8,0.35)';
    ctx.fillRect(x + 4, y + 5, w, h);
    ctx.fillStyle = '#3a2a3f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,240,215,0.06)';
    for (let k = 0; k < h; k += 7) ctx.fillRect(x, y + k, w, 1);
    ctx.strokeStyle = '#1d141f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    typed(ctx, 'RETTEN', x + 10, y + 9, 11, '#f1e4c2');
    typed(
        ctx,
        `${seats.length} dommer${seats.length > 1 ? 'e' : ''}`,
        x + w - 10,
        y + 9,
        10,
        '#d6c7a6',
        'right',
        false
    );
    ctx.restore();
}

/** Klemmefargene for like saker: samme farge = samme handling. */
export const CLIPS = ['#178a6e', '#d97b1f', '#2f6fd6', '#b0368c', '#6f8a12', '#0f97b8'];
export const clipColor = (sak: number) => CLIPS[sak % CLIPS.length];

/** Klemmen øverst på en mappe som har en tvilling. `ring` 0-1: tvillingen er på vei. */
export function drawClip(ctx: CanvasRenderingContext2D, sak: number, ring: number | null) {
    const c = clipColor(sak);
    ctx.save();
    ctx.fillStyle = c;
    ctx.fillRect(-23, -19, 7, 14);
    ctx.strokeStyle = 'rgba(20,16,20,0.6)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-22.5, -18.5, 6, 13);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-21, -17, 1.5, 10);
    if (ring !== null) {
        // Tvillingen er på vei: en ring i klemmens farge som tømmes (ingen tall).
        ctx.translate(-19.5, -24);
        ctx.fillStyle = 'rgba(248,240,218,0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 4.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, ring));
        ctx.stroke();
        ctx.setLineDash([1.5, 1.5]);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = BLUE;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}
