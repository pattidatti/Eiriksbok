// Gråboksen: hele bildet med enkle former. Leser bare spillet.
// Designet skal forklare: det varme lyset er gamma, det eneste lyse ute er veden,
// og det kalde lyset fra båten er faren.

import type { ArcadeView } from '../arcade/useArcade';
import type { Game } from './game';
import { dato } from './levels';
import { bakke, dagNå, inne, stormIgjen, stormNå } from './rules';
import { TUNING } from './tuning';

const T = TUNING;
const G = T.verden.gammaX;

export const P = {
    himmel: '#14233f',
    fjell: '#2f5d8c',
    snø: '#d9dde6',
    svart: '#111111',
    glød: '#e3a52b',
    fare: '#c23a2b',
    lys: '#f7f3c8',
    ved: '#8a5a2b',
};

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}

export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / 960, h / 540);
    return { s, ox: (w - 960 * s) / 2, oy: (h - 540 * s) / 2 };
};

export interface Lapp {
    tekst: string;
    x: number;
    y: number;
    igjen: number;
}

export interface TegneValg {
    meny: boolean;
    lapper: Lapp[];
    klokke: number;
    /** Vis tastetegningene (første sekunder av runden). */
    hint: { gå: boolean; hold: boolean };
}

function tegnBakke(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = P.himmel;
    ctx.fillRect(0, 0, 960, 540);
    // Fjorden nede til høyre.
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, bakke(T.verden.strandX) + 6, 960, 200);
    // Fjellsida.
    ctx.fillStyle = P.snø;
    ctx.beginPath();
    ctx.moveTo(0, 540);
    ctx.lineTo(0, bakke(0));
    for (let x = 0; x <= T.verden.strandX + 20; x += 10) ctx.lineTo(x, bakke(x));
    ctx.lineTo(T.verden.strandX + 40, 540);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function tegnHauger(ctx: CanvasRenderingContext2D, g: Game) {
    T.haug.forEach((h, i) => {
        const n = Math.min(12, g.haug[i]);
        const y = bakke(h.x);
        // Bjørkestammer bak haugen.
        ctx.fillStyle = P.svart;
        for (let k = -1; k <= 1; k++) ctx.fillRect(h.x + k * 16 - 2, y - 46, 4, 46);
        if (n <= 0) return;
        for (let k = 0; k < n; k++) {
            const r = Math.floor(k / 4);
            ctx.fillStyle = P.ved;
            ctx.fillRect(h.x - 16 + (k % 4) * 8, y - 8 - r * 7, 7, 6);
        }
    });
}

function tegnGamma(ctx: CanvasRenderingContext2D, g: Game, klokke: number) {
    const y = bakke(G);
    const varm = g.varme / T.varme.maks;
    // Gløden ut over snøen.
    const r = 40 + 90 * varm + (g.input.hold && inne(g) && g.stabel > 0 ? 8 * Math.sin(klokke * 20) : 0);
    const grad = ctx.createRadialGradient(G, y - 20, 4, G, y - 20, r);
    grad.addColorStop(0, `rgba(227,165,43,${0.25 + 0.5 * varm})`);
    grad.addColorStop(1, 'rgba(227,165,43,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(G - r, y - 20 - r, r * 2, r * 2);
    // Gamma: torvkuppel, snittet åpen.
    ctx.fillStyle = '#3b2a1c';
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(G, y, 46, 40, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgb(${40 + 150 * varm},${30 + 90 * varm},${20 + 20 * varm})`;
    ctx.beginPath();
    ctx.ellipse(G, y, 36, 30, 0, Math.PI, 0);
    ctx.fill();
    // Familien: tre runde former. Rimet legger seg som blått når det blir kaldt.
    const kald = Math.max(0, 1 - g.varme / 55);
    for (let k = 0; k < 3; k++) {
        const fx = G - 22 + k * 14;
        ctx.fillStyle = `rgb(${120 - 60 * kald},${80 + 40 * kald},${60 + 140 * kald})`;
        ctx.beginPath();
        ctx.arc(fx, y - 8 - (k === 1 ? 4 : 0), 6 + (k === 1 ? 2 : 0), 0, Math.PI * 2);
        ctx.fill();
    }
    // Stabelen ved døra.
    for (let k = 0; k < g.stabel; k++) {
        ctx.fillStyle = P.ved;
        ctx.fillRect(G + 30 + (k % 3) * 7, y - 6 - Math.floor(k / 3) * 6, 6, 5);
    }
}

function tegnRøyk(ctx: CanvasRenderingContext2D, g: Game, klokke: number) {
    if (g.røyk <= 0.02) return;
    const y = bakke(G) - 40;
    const synlig = g.røyk > T.røyk.synlig;
    const n = Math.ceil(g.røyk * 12);
    for (let k = 0; k < n; k++) {
        const h = k * 14;
        const dx = Math.sin(klokke * 1.5 + k) * (4 + k);
        ctx.fillStyle = synlig ? 'rgba(200,200,205,0.75)' : 'rgba(200,200,205,0.35)';
        ctx.beginPath();
        ctx.arc(G + dx, y - h, 7 + k * 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function tegnPatrulje(ctx: CanvasRenderingContext2D, g: Game) {
    const p = g.patrulje;
    if (!p) return;
    const sy = bakke(T.verden.strandX) + 10;
    ctx.fillStyle = P.svart;
    ctx.fillRect(p.båtX - 30, sy - 4, 60, 12);
    ctx.fillRect(p.båtX - 8, sy - 16, 16, 12);
    if (p.fase === 'lyser') {
        const ly = bakke(p.lysX);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(247,243,200,0.28)';
        ctx.beginPath();
        ctx.moveTo(p.båtX - 6, sy - 14);
        ctx.lineTo(p.lysX - T.patrulje.bredde, ly - 140);
        ctx.lineTo(p.lysX + T.patrulje.bredde, ly + 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(247,243,200,0.6)';
        ctx.beginPath();
        ctx.ellipse(p.lysX, ly, T.patrulje.bredde, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (p.fase === 'kommer') {
        // Lyskasteren varmes opp: en rød prikk som blinker.
        ctx.fillStyle = P.fare;
        ctx.beginPath();
        ctx.arc(p.båtX - 6, sy - 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function tegnInga(ctx: CanvasRenderingContext2D, g: Game) {
    const y = bakke(g.x);
    if (inne(g)) return;
    ctx.fillStyle = P.glød;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.fillRect(g.x - 7, y - 30, 14, 30);
    ctx.strokeRect(g.x - 7, y - 30, 14, 30);
    for (let k = 0; k < g.fang; k++) {
        ctx.fillStyle = P.ved;
        ctx.fillRect(g.x - 10 + k * 5 * g.vendt, y - 24 - k * 3, 12, 5);
    }
}

function tegnStorm(ctx: CanvasRenderingContext2D, g: Game, klokke: number) {
    if (!stormNå(g)) return;
    const tynn = Math.min(1, stormIgjen(g) / 4);
    ctx.fillStyle = `rgba(230,235,245,${0.35 * tynn})`;
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = `rgba(255,255,255,${0.8 * tynn})`;
    for (let k = 0; k < 80; k++) {
        const x = (k * 97 + klokke * 400) % 960;
        const y = (k * 53 + klokke * 120) % 540;
        ctx.fillRect(x, y, 3, 2);
    }
}

function tegnHint(ctx: CanvasRenderingContext2D, g: Game, valg: TegneValg) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const kort = (tekst: string, x: number, y: number) => {
        const w = ctx.measureText(tekst).width + 16;
        ctx.fillStyle = '#f1ead9';
        ctx.fillRect(x - w / 2, y - 16, w, 24);
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - 16, w, 24);
        ctx.fillStyle = P.svart;
        ctx.fillText(tekst, x, y + 1);
    };
    if (valg.hint.gå) kort('← →  gå', g.x + 70, bakke(g.x) - 50);
    if (valg.hint.hold) kort('hold MELLOMROM', G, bakke(G) - 70);
    for (const l of valg.lapper) kort(l.tekst, l.x, l.y);
}

function tegnDato(ctx: CanvasRenderingContext2D, g: Game) {
    const d = Math.min(T.dager, dagNå(g));
    const tekst = dato(d).toUpperCase();
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1ead9';
    ctx.fillText(tekst, 480, 36);
    // Veien mot februar: en tynn strek med et merke.
    ctx.fillStyle = 'rgba(241,234,217,0.3)';
    ctx.fillRect(330, 48, 300, 4);
    ctx.fillStyle = P.glød;
    ctx.fillRect(330, 48, 300 * (d / T.dager), 4);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#f1ead9';
    ctx.textAlign = 'right';
    ctx.fillText('nov', 326, 54);
    ctx.textAlign = 'left';
    ctx.fillText('feb: hjelpen', 636, 54);
}

export function tegn(view: ArcadeView, g: Game, valg: TegneValg) {
    const { ctx, w, h, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a1224';
    ctx.fillRect(0, 0, w, h);
    const k = skala(w, h);
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * k.ox, dpr * k.oy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, 540);
    ctx.clip();
    tegnBakke(ctx);
    tegnHauger(ctx, g);
    tegnRøyk(ctx, g, valg.klokke);
    tegnGamma(ctx, g, valg.klokke);
    tegnInga(ctx, g);
    tegnPatrulje(ctx, g);
    tegnStorm(ctx, g, valg.klokke);
    if (!valg.meny) {
        tegnDato(ctx, g);
        tegnHint(ctx, g, valg);
    }
    ctx.restore();
}
