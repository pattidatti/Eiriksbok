// Gråboksen: snittet av skipet med primitive former. Ingen kunst, ingen juice.
// Alt tegnes i et virtuelt ark på 960x540 som skaleres inn i canvasen.

import type { ArcadeView } from '../arcade/useArcade';
import { BRETT, type Side } from './levels';
import { frist, høySide, klokke, krengning, ledig, tomme, brukt, vannDekk } from './rules';
import type { Båt, Game } from './state';
import { TUNING } from './tuning';

export const ARK = { w: 960, h: 540 };
const MIDT = 480;
const DEKK_Y = (i: number) => 150 + (7 - i) * 45; // 0 = G-dekk, 7 = båtdekket
const SKROG = { x0: 340, x1: 620, bunn: 500 };
const BÅT_X: Record<Side, number> = { B: 230, S: 730 };
const BÅT_W = 150;
/** Trappene: x, og hvilket dekk klassen bor på. */
const TRAPP: Record<1 | 2 | 3, { x: number; fra: number }> = {
    1: { x: 430, fra: 5 },
    2: { x: 500, fra: 3 },
    3: { x: 580, fra: 0 },
};

const F = {
    bg: '#2a2f38',
    linje: '#c9d1dc',
    svak: '#6b7585',
    gul: '#f2c25a',
    rød: '#e05a4a',
    vann: '#0d1a33',
};

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}
export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / ARK.w, h / ARK.h);
    return { s, ox: (w - ARK.w * s) / 2, oy: (h - ARK.h * s) / 2 };
};
/** Fra CSS-piksler i canvasen til arket. */
export const tilArk = (k: Skala, x: number, y: number) => ({
    x: (x - k.ox) / k.s,
    y: (y - k.oy) / k.s,
});

/** Hva pekeren treffer: en båtside, køen eller ingenting. */
export function treff(x: number, y: number): Side | 'kø' | null {
    if (y > 80 && y < 520) {
        if (Math.abs(x - BÅT_X.B) < BÅT_W / 2 + 20) return 'B';
        if (Math.abs(x - BÅT_X.S) < BÅT_W / 2 + 20) return 'S';
    }
    if (x > SKROG.x0 && x < SKROG.x1 && y > 70 && y < 165) return 'kø';
    return null;
}

export const båtY = (b: Båt) => 128 + b.ned * (SKROG.bunn - 150);

function tekst(
    c: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    px = 14,
    farge = F.linje,
    align: CanvasTextAlign = 'center'
) {
    c.fillStyle = farge;
    c.font = `600 ${px}px system-ui, sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(t, x, y);
}

function profil(c: CanvasRenderingContext2D, g: Game) {
    const n = g.båter.length;
    const bw = 24;
    const x0 = MIDT - (n * (bw + 4)) / 2;
    tekst(c, 'BÅTENE', x0 - 40, 26, 12, F.svak);
    g.båter.forEach((b, i) => {
        const x = x0 + i * (bw + 4);
        c.strokeStyle = b.tilstand === 'tapt' ? F.rød : b.tilstand === 'venter' ? F.svak : F.linje;
        c.lineWidth = 1.5;
        c.strokeRect(x, 16, bw, 20);
        if (b.tilstand === 'nede') {
            c.fillStyle = F.gul;
            c.fillRect(
                x + 2,
                18 + 16 * (1 - b.folk / b.plasser),
                bw - 4,
                16 * (b.folk / b.plasser)
            );
        }
        if (b.tilstand === 'henger' || b.tilstand === 'fires') {
            c.fillStyle = F.linje;
            c.fillRect(x + 2, 38, bw - 4, 3);
        }
    });
}

function snitt(c: CanvasRenderingContext2D, g: Game) {
    c.save();
    c.translate(MIDT, 320);
    c.rotate((krengning(g.t) * Math.PI) / 180);
    c.translate(-MIDT, -320);
    c.strokeStyle = F.linje;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(SKROG.x0, DEKK_Y(7));
    c.lineTo(SKROG.x0, SKROG.bunn);
    c.lineTo(SKROG.x1, SKROG.bunn);
    c.lineTo(SKROG.x1, DEKK_Y(7));
    c.stroke();
    const navn = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'BÅTDEKK'];
    for (let i = 0; i <= 7; i++) {
        c.strokeStyle = i === 7 ? F.linje : F.svak;
        c.lineWidth = i === 7 ? 3 : 1;
        c.beginPath();
        c.moveTo(i === 7 ? SKROG.x0 - 60 : SKROG.x0, DEKK_Y(i));
        c.lineTo(i === 7 ? SKROG.x1 + 60 : SKROG.x1, DEKK_Y(i));
        c.stroke();
        tekst(c, navn[i], SKROG.x0 + 6, DEKK_Y(i) + 12, 10, F.svak, 'left');
    }
    // Trappene og porten for tredje klasse.
    for (const k of [1, 2, 3] as const) {
        const tr = TRAPP[k];
        c.strokeStyle = g.t >= TUNING.klasser[k].åpner ? F.linje : F.svak;
        c.lineWidth = 1;
        c.strokeRect(tr.x - 10, DEKK_Y(7), 20, DEKK_Y(tr.fra) - DEKK_Y(7));
        tekst(c, `${k}. kl`, tr.x, DEKK_Y(tr.fra) + 12, 10, F.svak);
    }
    const portY = DEKK_Y(0) + (DEKK_Y(7) - DEKK_Y(0)) * TUNING.port.pos;
    c.strokeStyle = g.t < g.portÅpner ? F.rød : F.svak;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(TRAPP[3].x - 12, portY);
    c.lineTo(TRAPP[3].x + 12, portY);
    c.stroke();
    // Gruppene på vei opp.
    for (const gr of g.grupper) {
        const tr = TRAPP[gr.klasse];
        const y = DEKK_Y(tr.fra) + (DEKK_Y(7) - DEKK_Y(tr.fra)) * gr.pos;
        c.fillStyle = F.gul;
        c.beginPath();
        c.arc(tr.x, y - 6, 2 + Math.sqrt(gr.antall) * 1.6, 0, Math.PI * 2);
        c.fill();
    }
    c.restore();
}

function vann(c: CanvasRenderingContext2D, g: Game) {
    const y = DEKK_Y(vannDekk(g.t)) + 20;
    c.fillStyle = F.vann;
    c.globalAlpha = 0.85;
    c.fillRect(0, Math.min(y, SKROG.bunn), ARK.w, ARK.h);
    c.globalAlpha = 1;
    c.strokeStyle = F.linje;
    c.beginPath();
    c.moveTo(0, Math.min(y, SKROG.bunn));
    c.lineTo(ARK.w, Math.min(y, SKROG.bunn));
    c.stroke();
}

function kø(c: CanvasRenderingContext2D, g: Game) {
    const n = g.kø.reduce((s, x) => s + x.antall, 0);
    const vis = Math.min(n, 120);
    for (let i = 0; i < vis; i++) {
        const x = MIDT - 110 + (i % 30) * 7.5;
        const y = 135 - Math.floor(i / 30) * 9;
        c.fillStyle = i < (g.kø[0]?.antall ?? 0) ? F.gul : '#b8954a';
        c.fillRect(x, y, 5, 7);
    }
    tekst(c, `KØ ${n}`, MIDT, 92, 16, n ? F.gul : F.svak);
    if (g.kø[0]) tekst(c, `forrest: ${g.kø[0].antall}`, MIDT, 74, 12, F.svak);
}

function båt(c: CanvasRenderingContext2D, g: Game, side: Side) {
    const x = BÅT_X[side];
    const i = g.davit[side];
    tekst(c, side === 'B' ? 'BABORD' : 'STYRBORD', x, 66, 12, F.svak);
    if (høySide(g.t) === side) tekst(c, 'HØY SIDE', x, 82, 11, F.rød);
    if (i === null) return;
    const b = g.båter[i];
    const y = båtY(b);
    const fr = frist(b);
    const fare = fr.t - g.t < TUNING.varsel;
    c.strokeStyle = fare && Math.floor(g.t * 4) % 2 ? F.rød : F.linje;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - BÅT_W / 2 + 10, 100);
    c.lineTo(x - BÅT_W / 2 + 10, y);
    c.moveTo(x + BÅT_W / 2 - 10, 100);
    c.lineTo(x + BÅT_W / 2 - 10, y);
    c.stroke();
    c.strokeStyle = F.linje;
    c.strokeRect(x - BÅT_W / 2, y, BÅT_W, 30);
    // Plassene: en prikk per plass, gul når den er tatt.
    const per = Math.ceil(b.plasser / 2);
    for (let p = 0; p < b.plasser; p++) {
        const px = x - BÅT_W / 2 + 6 + (p % per) * ((BÅT_W - 12) / per);
        const py = y + 9 + Math.floor(p / per) * 11;
        c.fillStyle = p < b.folk ? F.gul : '#3d4452';
        c.fillRect(px, py, 3, 6);
    }
    tekst(c, `${b.folk} / ${b.plasser}`, x, y - 14, 18, b.folk === b.plasser ? F.gul : F.linje);
    tekst(c, b.navn, x, y + 44, 12, F.svak);
    if (fare) tekst(c, fr.årsak === 'lås' ? 'LÅSES SNART' : 'VANNET KOMMER', x, y + 60, 12, F.rød);
    if (b.ned === 0 && b.folk > 0 && ledig(b) >= 0)
        tekst(c, side === 'B' ? 'hold A' : 'hold D', x, y + 76, 11, F.svak);
}

function hud(c: CanvasRenderingContext2D, g: Game) {
    c.strokeStyle = F.linje;
    c.lineWidth = 1;
    c.strokeRect(760, 440, 190, 90);
    tekst(c, klokke(g.t), 855, 470, 34, F.linje);
    tekst(c, `Brukt ${brukt(g)}   Tomme ${tomme(g)}`, 855, 508, 13, F.linje);
    const br = BRETT[Math.min(g.brett, BRETT.length - 1)];
    tekst(c, br.tittel, 20, 470, 14, F.linje, 'left');
    tekst(
        c,
        `Brett ${Math.min(g.brett + 1, BRETT.length)} av ${BRETT.length}`,
        20,
        492,
        12,
        F.svak,
        'left'
    );
}

function kort(c: CanvasRenderingContext2D, g: Game) {
    if (g.t >= g.kortTil + 0.6 && g.t > 2.5) return;
    const br = BRETT[Math.min(g.brett, BRETT.length - 1)];
    c.fillStyle = 'rgba(20,24,30,0.85)';
    c.fillRect(MIDT - 220, 200, 440, 90);
    c.strokeStyle = F.linje;
    c.strokeRect(MIDT - 220, 200, 440, 90);
    tekst(c, br.tittel, MIDT, 230, 24, F.linje);
    tekst(c, br.tekst, MIDT, 264, 14, F.linje);
}

export function tegn(view: ArcadeView, g: Game) {
    const { ctx: c, w, h } = view;
    c.fillStyle = F.bg;
    c.fillRect(0, 0, w, h);
    const k = skala(w, h);
    c.save();
    c.translate(k.ox, k.oy);
    c.scale(k.s, k.s);
    profil(c, g);
    snitt(c, g);
    vann(c, g);
    kø(c, g);
    båt(c, g, 'B');
    båt(c, g, 'S');
    hud(c, g);
    kort(c, g);
    c.restore();
}
