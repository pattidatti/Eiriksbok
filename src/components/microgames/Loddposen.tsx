import { useEffect, useRef, useState } from 'react';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeLoop, useArcadeText, type ArcadeView } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { createArcadeSynth, buzz } from './arcade/synth';
import { usePlaytest, type PlaytestBot } from './playtest';
import { seeded } from './sim';
import {
    aktiv,
    bank,
    begynn,
    ekteFare,
    filialOk,
    kanVelge,
    lapper,
    newGame,
    spar,
    stillePazzi,
    tapPris,
    tipsFor,
    trekkUt,
    update,
    utsendingHer,
    velgKort,
    BAG,
    BESTIKK_LAPPER,
    MALERI_TREKNINGER,
    PAVE_BONUS,
    H,
    ALBIZZI_FRA,
    FILIALER,
    GAVE_S,
    KISTE_MAKS,
    KUNST,
    LAPP_PRIS,
    MIN_LAPPER,
    MÅ_HA,
    PAZZI_RYKK,
    PAZZI_STILLE_S,
    RANGER,
    RUN_SECONDS,
    RYSTELSE,
    TREKK_S,
    TREKKES,
    TREKNINGER,
    W,
    ÅR,
    type G,
    type Kort,
    type KortValg,
    type Rådsherre,
    type Slag,
} from './loddposen/game';
import { botTick, BOTS } from './loddposen/bots';
import { snapshotOf } from './loddposen/sim';
import { bit, ellipse, florin, FARGE, kunstbilde, lapp, mønstre, rekt, tre, type Tre } from './loddposen/art';

// LODDPOSEN - Medici-familien i Firenze, 1434-1492.
//
// Du er Medici-familiens hemmelige hånd i rådhuset. Rundt bordet sitter rådsherrene, og
// blikkene deres glir over bordet som lyse lønnestriper. Hold hånda i loddposen mens alle
// ser bort: Medici-lappene faller ned én etter én, og jo lenger du tør, jo mer betaler
// banken når vennene dine vinner trekningen. Kremter noen, må hånda ut.
//
// 2D-canvas, ikke 3D: bordet ses rett ovenfra, og intarsia er flate innlagte biter. Alt
// tegnes med prosedyrale treårer (loddposen/art.ts) og et bord som tegnes én gang per
// skjermstørrelse. Det gir full kunst på en billig Chromebook.

const GAME_ID = 'loddposen';

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.ebenholt,
    paper: '#f1e0b6',
    accent: FARGE.gull,
    cta: FARGE.rød,
    ctaText: '#f6e7c4',
    chip: '#ecd6a4',
    scrim: 'rgba(20,12,8,.62)',
    font: 'Outfit, system-ui, sans-serif',
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.14em',
    textCase: 'uppercase',
    radius: 3,
    line: 2,
    drop: 4,
    tilt: 0,
    hudText: '#ecd6a4',
    hudStroke: FARGE.ebenholt,
    bannerTop: '30%',
};

type Mode = 'menu' | 'play' | 'paused' | 'slutt' | 'over';

// ---------- Plassene på bordet (verdenskoordinater, 1000 x 700) ----------
const TABLE = { x: 500, y: 348, rx: 352, ry: 220 };
const CHEST = { x: 20, y: 448, w: 176, h: 232 };
/** Medici-banken: skapet nede til høyre, der filialene sender florin fra. */
const BANK = { x: 804, y: 448, w: 178, h: 232 };
/** Valget: to store kort ligger midt på bordet mellom trekningene, over posen. */
const CARD = { x: 236, y: 176, w: 528, h: 318 };
/** Fiendelappene i posen: hold her for å fiske. */
const FIENDE = { x: 612, y: 290, w: 140, h: 88 };
/** Vennelappene i posen (bare til å se på). */
const VENN = { x: 248, y: 290, w: 140, h: 88 };
const REST = { x: 596, y: 600 };
/** Skulderen: armen kommer inn fra nede til høyre. */
const SKULDER = { x: 720, y: 800 };
const CANDLES = [
    { x: 300, y: 500 },
    { x: 700, y: 500 },
];

interface SaveData {
    best: number;
    kunst: string[];
    runder: number;
    lengst: number;
}
const DEFAULT_SAVE: SaveData = { best: 0, kunst: [], runder: 0, lengst: 0 };

interface Outcome {
    won: boolean;
    score: number;
}

interface Part {
    k: 'mynt' | 'venn' | 'fiende' | 'flis' | 'røyk';
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    t: number;
    life: number;
    /** Mål: mynter og lapper flyr mot et punkt. */
    tx?: number;
    ty?: number;
}

interface Fx {
    parts: Part[];
    shake: number;
    bagPop: number;
    ballPop: number;
    handX: number;
    handY: number;
    zoom: number;
    focusX: number;
    focusY: number;
    nesten: number;
    tatt: number;
    tattX: number;
    tattY: number;
    endT: number;
    kremt: Map<number, number>;
    /** Rådsherrer som kremtet falskt sist (boblen viser «ehem...»). */
    kremtFalsk: Set<number>;
    /** Er Pazzi stille (fra 1478) i denne trekningen? */
    stillePazzi: boolean;
    gaver: Map<number, string>;
    reveal: number;
    stamp: boolean;
    kunstFly: { navn: string; x: number; y: number; tx: number; ty: number; t: number } | null;
    tapFlash: number;
    vinnFlash: number;
    bankPuls: number;
    /** Sekunder uten at hånda har vært i posen (hint til den som venter). */
    stille: number;
    time: number;
    cam: { s: number; ox: number; oy: number; z: number; ax: number; ay: number; shx: number; shy: number };
}

const newFx = (): Fx => ({
    parts: [],
    shake: 0,
    bagPop: 0,
    ballPop: 0,
    handX: REST.x,
    handY: REST.y,
    zoom: 1,
    focusX: BAG.x,
    focusY: BAG.y,
    nesten: 0,
    tatt: 0,
    tattX: 0,
    tattY: 0,
    endT: 0,
    kremt: new Map(),
    kremtFalsk: new Set(),
    stillePazzi: false,
    gaver: new Map(),
    reveal: 0,
    stamp: false,
    kunstFly: null,
    tapFlash: 0,
    vinnFlash: 0,
    bankPuls: 0,
    stille: 0,
    time: 0,
    cam: { s: 1, ox: 0, oy: 0, z: 1, ax: 0, ay: 0, shx: 0, shy: 0 },
});

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const TAU = Math.PI * 2;
/** Trekningen: første lapp flyr opp etter REV0 s, så én hvert REVD s, og snus REVF s etter. */
const REV0 = 0.3;
const REVD = 0.34;
const REVF = 0.3;

/** De to kortene side om side (bestikk, maleri) og «spar gullet» under, i verdenskoordinater. */
function cardButtons() {
    const bw = (CARD.w - 36) / 2;
    return [0, 1, 2].map((i) =>
        i < 2
            ? { i, x: CARD.x + 12 + i * (bw + 12), y: CARD.y + 40, w: bw, h: 222 }
            : { i, x: CARD.x + 150, y: CARD.y + 272, w: CARD.w - 300, h: 34 }
    );
}
const KORT_VALG: KortValg[] = ['bestikk', 'maleri'];

/** Hver gjest har sin farge, sitt navn og sin hatt. */
const GJEST: Record<Slag, { navn: string; hatt: Tre; kappe: Tre }> = {
    råd: { navn: 'Rådsherre', hatt: 'valnøtt', kappe: 'valnøtt' },
    albizzi: { navn: 'Albizzi', hatt: 'rød', kappe: 'ebenholt' },
    pazzi: { navn: 'Pazzi', hatt: 'blå', kappe: 'blå' },
    salviati: { navn: 'Salviati', hatt: 'blå', kappe: 'ebenholt' },
    utsending: { navn: 'Pavens mann', hatt: 'hvit', kappe: 'hvit' },
    gonf: { navn: 'Gonfaloniere', hatt: 'ebenholt', kappe: 'ebenholt' },
};
const RÅD_NAVN = ['Soderini', 'Rucellai', 'Strozzi'];
const gjestNavn = (r: Rådsherre) => (r.slag === 'råd' ? RÅD_NAVN[r.id % RÅD_NAVN.length] : GJEST[r.slag].navn);
/** Raden til filial `i` i bankskapet. */
const filialY = (i: number) => BANK.y + 58 + i * 40;

const hatTre = (r: Rådsherre): Tre => (r.slag === 'råd' ? (['valnøtt', 'honning'] as Tre[])[r.id % 2] : GJEST[r.slag].hatt);

// =====================================================================================
// Bordet og rommet: tegnes én gang per skjermstørrelse.
// =====================================================================================

let STATIC: { key: string; c: HTMLCanvasElement } | null = null;
let VIGNETT: { key: string; c: HTMLCanvasElement } | null = null;

function tegnRom(w: number, h: number, dpr: number, s: number, ox: number, oy: number) {
    const key = `${w}x${h}@${dpr}`;
    if (STATIC && STATIC.key === key) return STATIC.c;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    const P = mønstre(ctx);

    // Gulvet: brede valnøttplanker med ebenholtfuger, lagt på tvers.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const planke = 90 * s;
    for (let i = 0, y = -planke / 2; y < h; i++, y += planke) {
        ctx.fillStyle = tre(P, 'valnøtt', i % 2 ? 2 : -2, 1.4 * s, i * 70, y);
        ctx.fillRect(0, y, w, planke);
        ctx.fillStyle = 'rgba(12,8,5,.55)';
        ctx.fillRect(0, y, w, Math.max(1, 1.5 * s));
    }

    // Sidene: innlagte skap med halvåpne dører, bøker og en lutt (trompe l'oeil).
    const side = ox;
    if (side > 70) {
        for (const venstre of [true, false]) {
            const x0 = venstre ? 10 : w - side + 10;
            const bw = side - 20;
            const hyller = Math.max(2, Math.floor((h - 20) / 190));
            const hh = (h - 20) / hyller;
            for (let j = 0; j < hyller; j++) {
                const y0 = 10 + j * hh;
                bit(ctx, P, rekt(x0, y0, bw, hh - 8), 'ebenholt', 90, 4, 1.5, 0.8);
                bit(ctx, P, rekt(x0 + 6, y0 + 6, bw - 12, hh - 20), 'lønn', 90, 14, 1.2, 0.9);
                const innY = y0 + hh - 22;
                if ((j + (venstre ? 0 : 1)) % 2 === 0) {
                    // Bøker på skrå i perspektiv.
                    let bx = x0 + 12;
                    const t: Tre[] = ['honning', 'valnøtt', 'ebenholt', 'honning', 'valnøtt'];
                    for (let k = 0; bx < x0 + bw - 22 && k < 7; k++) {
                        const bh = hh * (0.42 + ((k * 37) % 20) / 100);
                        const bb = 10 + ((k * 13) % 8);
                        bit(ctx, P, rekt(bx, innY - bh, bb, bh), t[k % t.length], 90, 3, 1, 0.6);
                        if (k % 2 === 0) {
                            ctx.fillStyle = FARGE.gull;
                            ctx.fillRect(bx + 2, innY - bh * 0.8, bb - 4, 2);
                        }
                        bx += bb + 2;
                    }
                } else {
                    // En lutt og en cartellino.
                    const cx = x0 + bw * 0.5;
                    const cy = y0 + hh * 0.5;
                    const r = Math.min(bw, hh) * 0.24;
                    bit(ctx, P, ellipse(cx, cy + r * 0.3, r, r * 1.15, 0.3), 'honning', 40, 6, 1.2, 0.8);
                    ctx.fillStyle = FARGE.ebenholt;
                    ctx.beginPath();
                    ctx.arc(cx, cy + r * 0.2, r * 0.25, 0, TAU);
                    ctx.fill();
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(0.3);
                    bit(ctx, P, rekt(-r * 0.12, -r * 2.1, r * 0.24, r * 1.6), 'ebenholt', 0, 1, 1, 0.5);
                    ctx.restore();
                    ctx.save();
                    ctx.translate(x0 + bw * 0.28, y0 + hh * 0.2);
                    ctx.rotate(-0.08);
                    bit(ctx, P, rekt(0, 0, bw * 0.34, 16), 'lønn', 0, 3, 1, 0.5);
                    ctx.restore();
                }
            }
        }
    }

    // Bordet (verdenskoordinater).
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    const { x, y, rx, ry } = TABLE;
    // Skyggen under bordet.
    ctx.fillStyle = 'rgba(8,5,3,.55)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, rx + 34, ry + 30, 0, 0, TAU);
    ctx.fill();
    bit(ctx, P, ellipse(x, y, rx + 22, ry + 22), 'ebenholt', 0, 6, 2);
    // Certosina-kanten: vekselvis lønn og valnøtt rundt hele bordet.
    const N = 72;
    for (let i = 0; i < N; i++) {
        const a0 = (i / N) * TAU;
        const a1 = ((i + 1) / N) * TAU;
        const p = new Path2D();
        p.moveTo(x + Math.cos(a0) * (rx + 14), y + Math.sin(a0) * (ry + 14));
        p.lineTo(x + Math.cos(a1) * (rx + 14), y + Math.sin(a1) * (ry + 14));
        p.lineTo(x + Math.cos(a1) * (rx - 2), y + Math.sin(a1) * (ry - 2));
        p.lineTo(x + Math.cos(a0) * (rx - 2), y + Math.sin(a0) * (ry - 2));
        p.closePath();
        bit(ctx, P, p, i % 2 ? 'lønn' : 'valnøtt', (a0 * 180) / Math.PI, 2, 0.8, 0.5);
    }
    // Bordplata: åtte kiler i honningvalnøtt med årene pekende ut fra midten.
    for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * TAU + 0.2;
        const a1 = ((i + 1) / 8) * TAU + 0.2;
        const p = new Path2D();
        p.moveTo(x, y);
        p.ellipse(x, y, rx - 4, ry - 4, 0, a0, a1);
        p.closePath();
        bit(ctx, P, p, 'honning', ((a0 + a1) / 2) * (180 / Math.PI), 16, 1.2, 1.4);
    }
    // Indre ring og rosett under posen.
    bit(ctx, P, ellipse(x, y, rx * 0.64, ry * 0.64), 'valnøtt', 10, 4, 1.2);
    bit(ctx, P, ellipse(x, y, rx * 0.6, ry * 0.6), 'honning', 100, 18, 1.2, 1.2);
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        const r1 = 150;
        const r0 = 96;
        const p = new Path2D();
        p.moveTo(BAG.x + Math.cos(a) * r1, BAG.y + Math.sin(a) * r1 * 0.8);
        p.lineTo(BAG.x + Math.cos(a + 0.2) * r0, BAG.y + Math.sin(a + 0.2) * r0 * 0.8);
        p.lineTo(BAG.x + Math.cos(a - 0.2) * r0, BAG.y + Math.sin(a - 0.2) * r0 * 0.8);
        p.closePath();
        bit(ctx, P, p, i % 2 ? 'lønn' : 'ebenholt', (a * 180) / Math.PI, 3, 0.8, 0.5);
    }
    bit(ctx, P, ellipse(BAG.x, BAG.y, 100, 80), 'lønn', 45, 18, 1.4);
    bit(ctx, P, ellipse(BAG.x, BAG.y, 86, 68), 'valnøtt', 135, 10, 1);

    // Brettene for kulene: venner til venstre, fiender til høyre.
    for (const b of [VENN, FIENDE]) {
        bit(ctx, P, rekt(b.x - 5, b.y - 5, b.w + 10, b.h + 10, 6), 'ebenholt', 0, 3, 1.4);
        bit(ctx, P, rekt(b.x, b.y, b.w, b.h, 4), b === VENN ? 'lønn' : 'lønn', 0, 12, 1.2, 0.7);
    }
    // Plassen din: en bunke Medici-lapper nederst.
    for (let i = 0; i < 5; i++) lapp(ctx, P, 420 + i * 3, 628 - i * 3, 44, -0.25 + i * 0.05, true);

    // Kista: et halvåpent innlagt skap.
    const k = CHEST;
    bit(ctx, P, rekt(k.x, k.y, k.w, k.h, 4), 'valnøtt', 90, 8, 2);
    bit(ctx, P, rekt(k.x + 10, k.y + 48, k.w - 20, k.h - 58), 'lønn', 90, 22, 1.4, 1.2);
    for (let j = 1; j < 4; j++) {
        ctx.fillStyle = 'rgba(40,20,8,.35)';
        ctx.fillRect(k.x + 12, k.y + 48 + j * 44, k.w - 24, 2);
    }
    // Døra står halvåpen i perspektiv på venstre side.
    const d = new Path2D();
    d.moveTo(k.x + 10, k.y + 48);
    d.lineTo(k.x - 14, k.y + 40);
    d.lineTo(k.x - 14, k.y + k.h + 4);
    d.lineTo(k.x + 10, k.y + k.h - 10);
    d.closePath();
    bit(ctx, P, d, 'honning', 90, 4, 1.4);
    ctx.fillStyle = FARGE.gull;
    ctx.beginPath();
    ctx.arc(k.x - 6, k.y + k.h * 0.58, 3, 0, TAU);
    ctx.fill();

    // Medici-banken: et innlagt skap med en regnskapsbok for filialene.
    const b = BANK;
    bit(ctx, P, rekt(b.x - 6, b.y - 6, b.w + 12, b.h + 12, 5), 'ebenholt', 0, 3, 1.5);
    bit(ctx, P, rekt(b.x, b.y, b.w, b.h, 3), 'valnøtt', 0, 14, 1.2);
    bit(ctx, P, rekt(b.x + 10, b.y + 36, b.w - 20, b.h - 46, 2), 'lønn', 0, 12, 1.2, 0.8);
    // Seks røde kuler: Medici-våpenet over regnskapsboka.
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = FARGE.rød;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2 - 25 + i * 10, b.y + 30, 3, 0, TAU);
        ctx.fill();
    }
    for (let i = 0; i < FILIALER.length; i++) {
        ctx.fillStyle = 'rgba(40,20,8,.3)';
        ctx.fillRect(b.x + 16, filialY(i) + 17, b.w - 32, 1.5);
    }

    // Lysestakene.
    for (const l of CANDLES) {
        bit(ctx, P, ellipse(l.x, l.y, 20, 17), 'ebenholt', 0, 3, 1.4);
        ctx.strokeStyle = FARGE.gull;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(l.x, l.y, 15, 12.5, 0, 0, TAU);
        ctx.stroke();
        bit(ctx, P, ellipse(l.x, l.y, 9, 8), 'lønn', 0, 3, 0.8);
    }

    STATIC = { key, c };
    return c;
}

function vignett(w: number, h: number) {
    const key = `${w}x${h}`;
    if (VIGNETT && VIGNETT.key === key) return VIGNETT.c;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w / 2));
    c.height = Math.max(1, Math.round(h / 2));
    const ctx = c.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(c.width / 2, c.height * 0.48, c.height * 0.3, c.width / 2, c.height / 2, c.width * 0.72);
        g.addColorStop(0, 'rgba(10,6,4,0)');
        g.addColorStop(1, 'rgba(10,6,4,.78)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c.width, c.height);
    }
    VIGNETT = { key, c };
    return c;
}

// =====================================================================================
// Det som rører seg: tegnes hvert bilde.
// =====================================================================================

type P6 = Record<Tre, CanvasPattern>;

const BORDKANT = ellipse(TABLE.x, TABLE.y, TABLE.rx + 20, TABLE.ry + 20);

function tegnBlikk(ctx: CanvasRenderingContext2D, P: P6, g: G, fx: Fx, r: Rådsherre) {
    // Blikkene er innlagt lønn i bordet: de stopper ved bordkanten.
    ctx.save();
    ctx.clip(BORDKANT);
    tegnBlikkIndre(ctx, P, g, fx, r);
    ctx.restore();
}

function tegnBlikkIndre(ctx: CanvasRenderingContext2D, P: P6, g: G, fx: Fx, r: Rådsherre) {
    const hx = r.x;
    const hy = r.y;
    if (!aktiv(r)) {
        // Beundreren ser på kunstverket han fikk: en kort, grønnbeiset stripe.
        const a = r.vinkel;
        const len = 120;
        ctx.save();
        ctx.globalAlpha = 0.55;
        const p = new Path2D();
        p.moveTo(hx, hy);
        p.lineTo(hx + Math.cos(a - 0.12) * len, hy + Math.sin(a - 0.12) * len);
        p.lineTo(hx + Math.cos(a + 0.12) * len, hy + Math.sin(a + 0.12) * len);
        p.closePath();
        ctx.fillStyle = tre(P, 'grønn', (a * 180) / Math.PI, 0.5);
        ctx.fill(p);
        ctx.restore();
        return;
    }
    const tilPose = Math.hypot(BAG.x - hx, BAG.y - hy);
    const len = tilPose + 140;
    const a = r.vinkel;
    // Et falskt kremt tenner ikke blikket: det ser ut som et vanlig bortblikk.
    const blikk = r.blikk === 'varsel' && r.falsk ? 'bort' : r.blikk;
    const bredde = blikk === 'ser' ? 0.15 : blikk === 'varsel' ? 0.2 : 0.12;
    const p = new Path2D();
    p.moveTo(hx + Math.cos(a) * 18, hy + Math.sin(a) * 18);
    p.lineTo(hx + Math.cos(a - bredde) * len, hy + Math.sin(a - bredde) * len);
    p.arc(hx, hy, len, a - bredde, a + bredde);
    p.closePath();
    // Stille Pazzi: stripa blir varmere jo nærmere han er å se.
    const pazziVarme = stillePazzi(g, r) && r.blikk === 'bort' ? (r.rykk + 1) / PAZZI_RYKK : 0;
    const grad = ctx.createRadialGradient(hx, hy, 20, hx, hy, len);
    if (blikk === 'ser') {
        grad.addColorStop(0, 'rgba(255,246,222,.92)');
        grad.addColorStop(0.8, 'rgba(250,236,200,.7)');
        grad.addColorStop(1, 'rgba(250,236,200,0)');
    } else if (blikk === 'varsel') {
        // Kremtet: lyskjeglen tennes og blinker varmt rødt-gull.
        const puls = 0.7 + 0.3 * Math.sin(fx.time * 40);
        grad.addColorStop(0, `rgba(255,214,120,${0.95 * puls})`);
        grad.addColorStop(0.6, `rgba(236,120,70,${0.6 * puls})`);
        grad.addColorStop(1, 'rgba(220,90,50,0)');
    } else {
        const al = 0.44 + pazziVarme * 0.3;
        grad.addColorStop(0, `rgba(236,214,164,${al + 0.12})`);
        grad.addColorStop(0.8, `rgba(236,214,164,${al * 0.55})`);
        grad.addColorStop(1, 'rgba(236,214,164,0)');
    }
    ctx.fillStyle = grad;
    ctx.fill(p);
    // Årene i lønnestripa.
    ctx.save();
    ctx.clip(p);
    ctx.globalAlpha = blikk === 'bort' ? 0.16 : 0.24;
    ctx.fillStyle = tre(P, 'lønn', (a * 180) / Math.PI, 0.6);
    ctx.fill(p);
    ctx.restore();
    // Listene langs kanten.
    ctx.lineWidth = blikk === 'ser' ? 3 : blikk === 'varsel' ? 3 : 1.6;
    ctx.strokeStyle =
        blikk === 'ser'
            ? FARGE.rød
            : blikk === 'varsel'
              ? FARGE.rød
              : pazziVarme > 0
                ? `rgba(224,178,58,${0.25 + pazziVarme * 0.7})`
                : 'rgba(28,20,16,.45)';
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a - bredde) * 26, hy + Math.sin(a - bredde) * 26);
    ctx.lineTo(hx + Math.cos(a - bredde) * len * 0.92, hy + Math.sin(a - bredde) * len * 0.92);
    ctx.moveTo(hx + Math.cos(a + bredde) * 26, hy + Math.sin(a + bredde) * 26);
    ctx.lineTo(hx + Math.cos(a + bredde) * len * 0.92, hy + Math.sin(a + bredde) * len * 0.92);
    ctx.stroke();
}

function tegnRådsherre(ctx: CanvasRenderingContext2D, P: P6, fx: Fx, r: Rådsherre, valgbar: boolean) {
    const mot = Math.atan2(BAG.y - r.y, BAG.x - r.x);
    const k = fx.kremt.get(r.id) ?? 0;
    const ekte = r.blikk === 'varsel' && !r.falsk;
    const rykk = ekte ? Math.sin(fx.time * 70) * 3 : 0;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.scale(1.22, 1.22);
    // Kroppen vender mot bordet.
    ctx.save();
    ctx.rotate(mot - Math.PI / 2);
    ctx.fillStyle = 'rgba(10,6,4,.45)';
    ctx.beginPath();
    ctx.ellipse(4, 2, 58, 34, 0, 0, TAU);
    ctx.fill();
    const kappe: Tre = GJEST[r.slag].kappe;
    bit(ctx, P, ellipse(0, -6, 54, 30), kappe, 0, 10, 1.6, 0.8);
    // Armene fram på bordet, hendene i lys lønn.
    for (const side of [-1, 1]) {
        const arm = new Path2D();
        arm.moveTo(side * 30, -2);
        arm.lineTo(side * 38, 30);
        arm.lineTo(side * 22, 36);
        arm.lineTo(side * 16, 4);
        arm.closePath();
        bit(ctx, P, arm, kappe, 90, 4, 1.2, 0.8);
        bit(ctx, P, ellipse(side * 30, 42, 8, 10, side * 0.3), 'lønn', 0, 3, 1.1, 0.5);
    }
    if (r.slag === 'gonf') {
        ctx.strokeStyle = FARGE.gull;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.ellipse(0, 4, 30, 16, 0, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();

    // Hodet: hatten (cappuccio) ovenfra, med nese som peker dit blikket går.
    const a = r.vinkel;
    ctx.translate(Math.cos(a + Math.PI / 2) * rykk, Math.sin(a + Math.PI / 2) * rykk);
    ctx.rotate(a);
    // Hattehalen henger bakover.
    const hale = new Path2D();
    hale.moveTo(-10, -12);
    hale.quadraticCurveTo(-36, -20, -42, 4);
    hale.lineTo(-34, 8);
    hale.quadraticCurveTo(-28, -8, -12, 4);
    hale.closePath();
    bit(ctx, P, hale, hatTre(r), 0, 3, 1.1, 0.6);
    const nese = new Path2D();
    nese.moveTo(18, -6);
    nese.lineTo(30, 0);
    nese.lineTo(18, 6);
    nese.closePath();
    // Ansiktet stikker fram under hattebremmen: hud, to øyne og nesa.
    ctx.fillStyle = r.slag === 'utsending' ? '#e9c29c' : '#dcae82';
    ctx.strokeStyle = FARGE.ebenholt;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(16, 0, 11, 14, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = FARGE.ebenholt;
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(21, side * 6, 2.2, 0, TAU);
        ctx.fill();
    }
    bit(ctx, P, nese, 'lønn', 0, 2, 1, 0.4);
    // En lys ring rundt hodet gir kontrast mot det brune bordet.
    ctx.strokeStyle = 'rgba(250,238,206,.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 23, 0, 0, TAU);
    ctx.stroke();
    bit(ctx, P, ellipse(0, 0, 22, 21), hatTre(r), 30, 7, 1.6, 0.7);
    bit(ctx, P, ellipse(-3, 0, 13, 12), hatTre(r), 120, 4, 1, 0.6);
    if (r.slag === 'utsending' || r.slag === 'salviati') {
        // Kirkens menn: et gullkors på hatten.
        ctx.strokeStyle = r.slag === 'utsending' ? FARGE.gull : FARGE.lønn;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(6, 0);
        ctx.moveTo(-2, -7);
        ctx.lineTo(-2, 7);
        ctx.stroke();
    }
    if (r.slag === 'pazzi') {
        // Pazzi-delfinen innlagt i hatten.
        ctx.strokeStyle = FARGE.lønn;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-8, 4);
        ctx.quadraticCurveTo(0, -10, 9, 2);
        ctx.lineTo(4, 3);
        ctx.stroke();
    }
    if (r.slag === 'albizzi') {
        // Albizzi-ringene innlagt i hatten.
        ctx.strokeStyle = FARGE.lønn;
        ctx.lineWidth = 2;
        for (const [cx, cy] of [
            [-6, -5],
            [6, -5],
            [0, 6],
        ]) {
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, TAU);
            ctx.stroke();
        }
    }
    ctx.restore();

    // Kremtet: tre lønnebuer foran munnen og en «Ehem!»-boble over hodet (synlig uten lyd).
    if (k > 0) {
        // Boblen står godt over en sekund (kremt-verdien synker sakte), så den synes også i
        // stillbilder og uten lyd.
        const falsk = r.falsk && fx.kremtFalsk.has(r.id);
        const q2 = ease((1 - k) / 0.2);
        const bx = clamp(r.x + (r.x < BAG.x - 60 ? 56 : r.x > BAG.x + 60 ? -56 : 0), 90, W - 90);
        const by = Math.max(40, r.y - 92);
        ctx.save();
        ctx.globalAlpha = Math.min(1, k * 3);
        ctx.translate(bx, by);
        ctx.scale(0.7 + 0.3 * q2, 0.7 + 0.3 * q2);
        const bw2 = falsk ? 120 : 150;
        const bh2 = falsk ? 44 : 54;
        ctx.fillStyle = 'rgba(12,8,5,.55)';
        ctx.beginPath();
        ctx.ellipse(3, 5, bw2 / 2, bh2 / 2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = falsk ? '#d9c79c' : '#fff4d8';
        ctx.strokeStyle = falsk ? 'rgba(28,20,16,.7)' : FARGE.rød;
        ctx.lineWidth = falsk ? 2.5 : 5;
        ctx.beginPath();
        ctx.ellipse(0, 0, bw2 / 2, bh2 / 2, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, bh2 / 2 - 3);
        ctx.lineTo((r.x - bx) * 0.5, bh2 / 2 + 22);
        ctx.lineTo(10, bh2 / 2 - 4);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = falsk ? 'rgba(28,20,16,.75)' : FARGE.rød;
        ctx.font = falsk ? 'italic 700 22px Outfit, sans-serif' : '800 32px Outfit, sans-serif';
        ctx.fillText(falsk ? 'ehem...' : 'EHEM!', 0, 2);
        ctx.restore();
        const q = 1 - k;
        ctx.save();
        ctx.translate(r.x + Math.cos(a) * 30, r.y + Math.sin(a) * 30);
        ctx.rotate(a);
        ctx.strokeStyle = `rgba(250,232,190,${k})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 8 + q * 26 + i * 8, -0.6, 0.6);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Navneskiltet: en lys lønnebrikke bak hodet, så eleven vet hvem som er hvem.
    {
        const nx = r.x - Math.cos(mot) * 58;
        const ny = r.y - Math.sin(mot) * 58;
        const navn = gjestNavn(r).toUpperCase();
        ctx.font = '800 13px Outfit, sans-serif';
        const tw = ctx.measureText(navn).width + 16;
        const farge = r.slag === 'albizzi' ? FARGE.rød : r.slag === 'pazzi' || r.slag === 'salviati' ? FARGE.blå : r.slag === 'utsending' ? '#7a5a12' : FARGE.ebenholt;
        ctx.fillStyle = 'rgba(12,8,5,.5)';
        ctx.fillRect(nx - tw / 2 + 2, ny - 10, tw, 21);
        ctx.fillStyle = r.slag === 'utsending' ? '#fbf6ea' : '#f1e0b6';
        ctx.fillRect(nx - tw / 2, ny - 12, tw, 21);
        ctx.fillStyle = farge;
        ctx.fillRect(nx - tw / 2, ny - 12, 4, 21);
        ctx.strokeStyle = FARGE.ebenholt;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(nx - tw / 2, ny - 12, tw, 21);
        ctx.fillStyle = farge;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(navn, nx + 2, ny - 1);
    }
    if ((r.slag === 'pazzi' || r.slag === 'salviati') && r.beundrer <= 0 && fx.stillePazzi && r.blikk === 'bort') {
        // Tre prikker ved Pazzi: ett rykk for hver. Den tredje er blikket.
        for (let i = 0; i < PAZZI_RYKK; i++) {
            const px = r.x - 20 + i * 20;
            const py = r.y + (r.y < BAG.y - 100 ? 56 : -62);
            ctx.fillStyle = 'rgba(12,8,5,.7)';
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, TAU);
            ctx.fill();
            ctx.fillStyle = i <= r.rykk ? (i === PAZZI_RYKK - 1 ? FARGE.rød : FARGE.gull) : 'rgba(236,214,164,.25)';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, TAU);
            ctx.fill();
        }
    }
    if (valgbar) {
        const puls = 0.5 + 0.5 * Math.sin(fx.time * 8);
        ctx.strokeStyle = `rgba(224,178,58,${0.6 + puls * 0.4})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -fx.time * 20;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 62 + puls * 4, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    // Kunstverket beundreren fikk, står på bordet foran ham.
    const gave = fx.gaver.get(r.id);
    if (gave && !aktiv(r)) {
        const gx = r.x + Math.cos(mot) * 92;
        const gy = r.y + Math.sin(mot) * 92;
        kunstbilde(ctx, P, gave, gx, gy, 34);
        ctx.strokeStyle = FARGE.grønn;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 54, 0, TAU);
        ctx.stroke();
    }
}

function posePath(r: number, t: number, pop: number) {
    const p = new Path2D();
    const n = 28;
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU;
        const wob = 1 + 0.035 * Math.sin(a * 3 + t * 1.3) + 0.025 * Math.sin(a * 5 - t) + pop * 0.12 * Math.sin(a * 2);
        const x = BAG.x + Math.cos(a) * r * 1.06 * wob;
        const y = BAG.y + 4 + Math.sin(a) * r * 0.94 * wob;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
    }
    p.closePath();
    return p;
}

function tegnPose(ctx: CanvasRenderingContext2D, P: P6, g: G, fx: Fx) {
    const n = lapper(g);
    const r = BAG.r + Math.min(24, n * 1.1) + fx.bagPop * 6;
    ctx.fillStyle = 'rgba(10,6,4,.5)';
    ctx.beginPath();
    ctx.ellipse(BAG.x + 6, BAG.y + 12, r * 1.1, r * 0.95, 0, 0, TAU);
    ctx.fill();
    const p = posePath(r, fx.time, fx.bagPop);
    const lær = ctx.createRadialGradient(BAG.x - r * 0.3, BAG.y - r * 0.35, r * 0.1, BAG.x, BAG.y, r * 1.1);
    lær.addColorStop(0, '#9a6a3e');
    lær.addColorStop(0.55, '#6e4424');
    lær.addColorStop(1, '#3a2214');
    ctx.fillStyle = lær;
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = tre(P, 'valnøtt', 20, 0.35);
    ctx.fill(p);
    ctx.restore();
    ctx.strokeStyle = FARGE.ebenholt;
    ctx.lineWidth = 2;
    ctx.stroke(p);
    // Sømmene går ut fra åpningen.
    ctx.strokeStyle = 'rgba(236,214,164,.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4;
        ctx.beginPath();
        ctx.moveTo(BAG.x + Math.cos(a) * 26, BAG.y + Math.sin(a) * 24);
        ctx.quadraticCurveTo(
            BAG.x + Math.cos(a + 0.3) * r * 0.6,
            BAG.y + Math.sin(a + 0.3) * r * 0.55,
            BAG.x + Math.cos(a + 0.15) * r * 0.95,
            BAG.y + 4 + Math.sin(a + 0.15) * r * 0.86
        );
        ctx.stroke();
    }
    ctx.setLineDash([]);
    // Glanspunktet fra lysene.
    const glans = ctx.createRadialGradient(BAG.x - r * 0.35, BAG.y - r * 0.4, 1, BAG.x - r * 0.35, BAG.y - r * 0.4, r * 0.5);
    glans.addColorStop(0, 'rgba(255,230,190,.28)');
    glans.addColorStop(1, 'rgba(255,230,190,0)');
    ctx.fillStyle = glans;
    ctx.fill(p);
}

function tegnÅpning(ctx: CanvasRenderingContext2D, fx: Fx, handInne: boolean) {
    // Åpningen midt på posen, med den røde Medici-snora rundt.
    ctx.fillStyle = '#140c07';
    ctx.beginPath();
    ctx.ellipse(BAG.x, BAG.y - 2, 24, 20, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3a2214';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(BAG.x + Math.cos(a) * 24, BAG.y - 2 + Math.sin(a) * 20);
        ctx.lineTo(BAG.x + Math.cos(a) * 36, BAG.y - 2 + Math.sin(a) * 31);
        ctx.stroke();
    }
    ctx.strokeStyle = FARGE.rød;
    ctx.lineWidth = handInne ? 5 : 4;
    ctx.beginPath();
    ctx.ellipse(BAG.x, BAG.y - 2, 27, 23, 0, 0, TAU);
    ctx.stroke();
    // Snorendene med dusker.
    const sv = Math.sin(fx.time * 2) * 3;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BAG.x + 20, BAG.y + 14);
    ctx.quadraticCurveTo(BAG.x + 40, BAG.y + 40, BAG.x + 58 + sv, BAG.y + 52);
    ctx.moveTo(BAG.x + 24, BAG.y + 10);
    ctx.quadraticCurveTo(BAG.x + 52, BAG.y + 22, BAG.x + 70, BAG.y + 38 - sv);
    ctx.stroke();
    ctx.fillStyle = FARGE.gull;
    ctx.beginPath();
    ctx.arc(BAG.x + 58 + sv, BAG.y + 52, 4, 0, TAU);
    ctx.arc(BAG.x + 70, BAG.y + 38 - sv, 4, 0, TAU);
    ctx.fill();
}

function tegnArm(ctx: CanvasRenderingContext2D, P: P6, g: G, fx: Fx) {
    const inne = !!g.hånd.act;
    const hx = fx.handX;
    const hy = fx.handY;
    const sx = SKULDER.x;
    const sy = SKULDER.y;
    const a = Math.atan2(hy - sy, hx - sx);
    const len = Math.hypot(hx - sx, hy - sy);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a);
    // Skyggen av armen på bordet.
    ctx.fillStyle = 'rgba(10,6,4,.4)';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(len - 10, -6);
    ctx.lineTo(len - 10, 30);
    ctx.lineTo(0, 44);
    ctx.fill();
    // Ermet i Medici-rødt, smalere mot håndleddet, med gullkant.
    const erme = new Path2D();
    erme.moveTo(0, -30);
    erme.quadraticCurveTo(len * 0.5, -26, len - 24, -15);
    erme.lineTo(len - 24, 15);
    erme.quadraticCurveTo(len * 0.5, 26, 0, 30);
    erme.closePath();
    ctx.fillStyle = FARGE.rød;
    ctx.fill(erme);
    ctx.save();
    ctx.clip(erme);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = tre(P, 'valnøtt', 0, 0.5);
    ctx.fill(erme);
    ctx.globalAlpha = 1;
    const lys = ctx.createLinearGradient(0, -30, 0, 30);
    lys.addColorStop(0, 'rgba(255,200,170,.25)');
    lys.addColorStop(0.45, 'rgba(255,200,170,0)');
    lys.addColorStop(1, 'rgba(30,4,2,.45)');
    ctx.fillStyle = lys;
    ctx.fill(erme);
    ctx.strokeStyle = 'rgba(40,6,4,.45)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (len / 4.4), -22);
        ctx.quadraticCurveTo(i * (len / 4.4) + 14, 0, i * (len / 4.4), 22);
        ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = FARGE.ebenholt;
    ctx.lineWidth = 1.6;
    ctx.stroke(erme);
    bit(ctx, P, rekt(len - 30, -16, 10, 32, 2), 'lønn', 90, 0, 1.2);
    ctx.fillStyle = FARGE.gull;
    ctx.fillRect(len - 28, -16, 3.5, 32);
    if (!inne) {
        // Hånda hviler på bordet: håndflate, fire fingre og tommel i lys lønn.
        for (let i = 0; i < 4; i++) {
            const fy = -9 + i * 6;
            bit(ctx, P, ellipse(len + 12 - Math.abs(i - 1.5) * 2, fy, 9, 2.8), 'lønn', 0, 1, 0.9, 0.4);
        }
        bit(ctx, P, ellipse(len - 8, 13, 8, 3.4, 0.7), 'lønn', 0, 1, 0.9, 0.4);
        bit(ctx, P, ellipse(len - 6, 0, 13, 12), 'lønn', 0, 4, 1.2, 0.5);
    }
    ctx.restore();
}

function tegnKuler(ctx: CanvasRenderingContext2D, P: P6, g: G, fx: Fx, fiskeHover: boolean) {
    const tegn = (b: typeof VENN, n: number, venn: boolean) => {
        const kol = 7;
        const d = 18;
        const x0 = b.x + 16;
        const y0 = b.y + 16;
        for (let i = 0; i < Math.min(n, 28); i++) {
            const cx = x0 + (i % kol) * d;
            const cy = y0 + Math.floor(i / kol) * d;
            const siste = venn && i === n - 1 ? fx.ballPop : 0;
            const r = 7 + siste * 4;
            ctx.fillStyle = 'rgba(20,10,4,.35)';
            ctx.beginPath();
            ctx.arc(cx + 1, cy + 2, r, 0, TAU);
            ctx.fill();
            if (venn) {
                ctx.fillStyle = FARGE.rød;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, TAU);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,210,190,.5)';
                ctx.beginPath();
                ctx.arc(cx - 2, cy - 2, r * 0.35, 0, TAU);
                ctx.fill();
            } else {
                bit(ctx, P, ellipse(cx, cy, r, r), 'ebenholt', i * 40, 2, 1);
                ctx.strokeStyle = 'rgba(236,214,164,.7)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.5, 0, TAU);
                ctx.stroke();
            }
        }
        if (n > 28) {
            ctx.fillStyle = FARGE.ebenholt;
            ctx.font = '800 13px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${n}`, b.x + b.w - 6, b.y + b.h - 8);
        }
    };
    tegn(VENN, g.venner, true);
    tegn(FIENDE, g.fiender, false);
    // Fast forklaring over feltene: rød = venn, svart = fiende. Står der hele runden.
    const skilt = (b: typeof VENN, tekst: string, venn: boolean) => {
        const cx = b.x + b.w / 2;
        const cy = b.y - 16;
        ctx.font = '800 14px Outfit, sans-serif';
        const tw = ctx.measureText(tekst).width + 34;
        ctx.fillStyle = 'rgba(12,8,5,.55)';
        ctx.fillRect(cx - tw / 2 + 2, cy - 11, tw, 24);
        ctx.fillStyle = venn ? '#fff1dc' : FARGE.ebenholt;
        ctx.fillRect(cx - tw / 2, cy - 13, tw, 24);
        ctx.strokeStyle = venn ? FARGE.rød : FARGE.lønn;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - tw / 2, cy - 13, tw, 24);
        ctx.fillStyle = venn ? FARGE.rød : FARGE.ebenholt;
        ctx.strokeStyle = venn ? FARGE.ebenholt : FARGE.lønn;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - tw / 2 + 13, cy - 1, 6, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = venn ? FARGE.rød : FARGE.lønn;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tekst, cx + 8, cy);
    };
    skilt(VENN, 'RØD = VENN', true);
    skilt(FIENDE, 'SVART = FIENDE', false);
    if (fiskeHover || g.hånd.act === 'fisk') {
        ctx.strokeStyle = FARGE.gull;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(FIENDE.x - 8, FIENDE.y - 8, FIENDE.w + 16, FIENDE.h + 16);
    }
}

function tegnSjanse(ctx: CanvasRenderingContext2D, P: P6, g: G) {
    // Cartellino under posen: bare regelen. Ingen prosent - kulene i feltene viser sjansen.
    const sikret = g.fiender <= TREKKES - MÅ_HA && g.venner >= MÅ_HA;
    const x = BAG.x;
    const y = 452;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.02);
    bit(ctx, P, rekt(-92, -18, 184, 36, 2), 'lønn', 0, 5, 1.2, 0.5);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = sikret ? FARGE.rød : FARGE.ebenholt;
    ctx.font = '800 16px Outfit, sans-serif';
    ctx.fillText(sikret ? 'SIKRET: VENNENE VINNER' : '3 AV 5 RØDE VINNER', 0, 1);
    ctx.restore();
}

function tegnKiste(ctx: CanvasRenderingContext2D, g: G, fx: Fx) {
    const k = CHEST;
    const ix = k.x + 18;
    const iy0 = k.y + k.h - 18;
    const ih = k.h - 74;
    const mynter = Math.ceil(g.kiste / 12.5);
    const kol = 4;
    const perKol = 10;
    for (let i = 0; i < Math.min(mynter, kol * perKol); i++) {
        const c = Math.floor(i / perKol);
        const j = i % perKol;
        florin(ctx, ix + 18 + c * 36, iy0 - j * (ih / perKol) - 4, 15, 0.42);
    }
    // Tapslinja: så mye koster en tapt trekning i år. Under linja er kista i fare.
    const tap = tapPris(g);
    const ly = iy0 - (tap / KISTE_MAKS) * ih * 1.0;
    const fare = g.kiste < tap;
    ctx.fillStyle = fare ? FARGE.rød : 'rgba(28,20,16,.7)';
    ctx.fillRect(k.x + 8, ly - 1.5, k.w - 16, 3);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = fare ? FARGE.rød : FARGE.ebenholt;
    ctx.font = '800 10px Outfit, sans-serif';
    ctx.fillText(`ET TAP: -${tap}`, k.x + k.w - 10, ly - 3);
    // Ett stort tall: florin i kista. Rødt og blinkende når et tap vil tømme den.
    const puls = fare ? 0.5 + 0.5 * Math.sin(fx.time * 8) : 0;
    const tx = k.x + k.w / 2 - 10;
    const ty = k.y + 24;
    ctx.fillStyle = fare ? `rgba(120,16,12,${0.85 + 0.15 * puls})` : 'rgba(20,12,8,.88)';
    ctx.fillRect(k.x + 2, ty - 24, k.w - 4, 58);
    ctx.strokeStyle = fare ? FARGE.rød : FARGE.gull;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(k.x + 2, ty - 24, k.w - 4, 58);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 36px Outfit, sans-serif';
    ctx.fillStyle = fare ? '#fff1dc' : FARGE.gull;
    ctx.fillText(`${Math.floor(g.kiste)}`, tx, ty - 3);
    florin(ctx, k.x + k.w - 26, ty - 4, 12, 0.8);
    ctx.font = '800 10px Outfit, sans-serif';
    ctx.fillStyle = fare ? '#fff1dc' : FARGE.lønn;
    ctx.fillText(fare ? 'NESTEN TOM!' : 'FLORIN I KISTA', k.x + k.w / 2, ty + 22);
}

/** Regnskapsboka bufres og tegnes på nytt bare når en filial begynner å tape penger. */
let BANKBOK: { key: string; c: HTMLCanvasElement; font: boolean; t: number } | null = null;
const BANK_OPPL = 2;

function tegnBank(ctx: CanvasRenderingContext2D, g: G, fx: Fx) {
    const b = BANK;
    // Blinket når pengene sendes, under teksten.
    if (fx.bankPuls > 0)
        FILIALER.forEach((f, i) => {
            if (!filialOk(g, f)) return;
            ctx.fillStyle = `rgba(224,178,58,${0.45 * fx.bankPuls})`;
            ctx.fillRect(b.x + 14, filialY(i) - 16, b.w - 28, 32);
        });
    const key = FILIALER.map((f) => (filialOk(g, f) ? 1 : 0)).join('');
    // Tegn på nytt når en filial taper, eller (høyst hvert sekund) til fonten er lastet.
    const prøvFont = BANKBOK && !BANKBOK.font && fx.time - BANKBOK.t > 1;
    if (!BANKBOK || BANKBOK.key !== key || prøvFont) {
        const font = !document.fonts || document.fonts.check('800 13px Outfit');
        if (!BANKBOK || BANKBOK.key !== key || font) {
            const c = BANKBOK?.c ?? document.createElement('canvas');
            c.width = b.w * BANK_OPPL;
            c.height = b.h * BANK_OPPL;
            const bc = c.getContext('2d');
            if (!bc) return;
            bc.setTransform(BANK_OPPL, 0, 0, BANK_OPPL, -b.x * BANK_OPPL, -b.y * BANK_OPPL);
            tegnBankbok(bc, g);
            BANKBOK = { key, c, font, t: fx.time };
        } else BANKBOK.t = fx.time;
    }
    ctx.drawImage(BANKBOK.c, b.x, b.y, b.w, b.h);
}

function tegnBankbok(ctx: CanvasRenderingContext2D, g: G) {
    // Regnskapsboka i bankskapet: hver filial sender florin til kista i gavefasen.
    const b = BANK;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillStyle = FARGE.ebenholt;
    ctx.fillText('MEDICI-BANKEN', b.x + b.w / 2 + 1, b.y + 16 + 1);
    ctx.fillStyle = FARGE.lønn;
    ctx.fillText('MEDICI-BANKEN', b.x + b.w / 2, b.y + 16);
    FILIALER.forEach((f, i) => {
        const y = filialY(i);
        const ok = filialOk(g, f);
        ctx.textAlign = 'left';
        ctx.fillStyle = ok ? FARGE.ebenholt : 'rgba(28,20,16,.45)';
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.fillText(f.navn.toUpperCase(), b.x + 18, y + (i === 0 ? -4 : 1));
        if (i === 0) {
            ctx.font = '700 9px Inter, sans-serif';
            ctx.fillText('pavens konto', b.x + 18, y + 9);
        }
        ctx.textAlign = 'right';
        if (ok) {
            ctx.font = '800 15px Outfit, sans-serif';
            ctx.fillStyle = '#7a5a12';
            ctx.fillText(`+${f.florin}`, b.x + b.w - 34, y + 1);
            florin(ctx, b.x + b.w - 24, y, 7, 0.7);
        } else {
            // Filialen taper penger: rød strek over raden.
            ctx.font = '800 11px Outfit, sans-serif';
            ctx.fillStyle = FARGE.rød;
            ctx.fillText('TAPER', b.x + b.w - 18, y + 1);
            ctx.fillRect(b.x + 16, y - 1, b.w - 80, 2.5);
        }
    });
    ctx.textAlign = 'center';
    ctx.font = '800 10px Outfit, sans-serif';
    ctx.fillStyle = FARGE.ebenholt;
    ctx.fillText(`+${bank(g)} FLORIN PER TREKNING`, b.x + b.w / 2, b.y + b.h - 18);
}

/** Kortene bufres: de tegnes én gang per valg (og når kista ikke lenger har råd). */
let KORTBILDE: { kort: Kort; key: string; c: HTMLCanvasElement } | null = null;
const KORT_OPPL = 2;
const KORT_KANT = 12;

function tegnKortbilde(ctx: CanvasRenderingContext2D, P: P6, g: G, kort: Kort) {
    ctx.fillStyle = 'rgba(12,8,5,.55)';
    ctx.fillRect(CARD.x + 8, CARD.y + 10, CARD.w, CARD.h);
    bit(ctx, P, rekt(CARD.x, CARD.y, CARD.w, CARD.h, 3), 'valnøtt', 3, 12, 2, 0.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = FARGE.lønn;
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillText('VELG ETT KORT', CARD.x + CARD.w / 2, CARD.y + 21);
    const mål = g.rådsherrer.find((r) => r.id === kort.mål);
    const dyrere = bank(g) < 40;
    for (const b of cardButtons()) {
        if (b.i === 2) {
            bit(ctx, P, rekt(b.x, b.y, b.w, b.h, 2), 'lønn', 0, 4, 1.6, 0.5);
            ctx.fillStyle = FARGE.ebenholt;
            ctx.font = '800 14px Outfit, sans-serif';
            ctx.fillText('SPAR GULLET (3)', b.x + b.w / 2, b.y + b.h / 2 + 1);
            continue;
        }
        const v = KORT_VALG[b.i];
        const pris = kort[v];
        const ok = kanVelge(g, v);
        const cx = b.x + b.w / 2;
        ctx.globalAlpha = ok ? 1 : 0.45;
        bit(ctx, P, rekt(b.x, b.y, b.w, b.h, 3), 'lønn', 90, 8, 2.2, 0.7);
        // Fargekanten sier hva kortet gjør: rødt = venner i posen, grønt = en fiende ser bort.
        ctx.fillStyle = v === 'bestikk' ? FARGE.rød : FARGE.grønn;
        ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 30);
        ctx.fillStyle = '#fff1dc';
        ctx.font = '800 17px Outfit, sans-serif';
        ctx.fillText(v === 'bestikk' ? `BESTIKK (1)` : `BESTILL MALERI (2)`, cx, b.y + 19);
        if (v === 'bestikk') {
            // To røde lapper som skal ned i posen.
            lapp(ctx, P, cx - 30, b.y + 78, 58, -0.2, true);
            lapp(ctx, P, cx + 30, b.y + 78, 58, 0.18, true);
            ctx.fillStyle = FARGE.rød;
            ctx.font = '800 22px Outfit, sans-serif';
            ctx.fillText(`+${BESTIKK_LAPPER} RØDE LODD`, cx, b.y + 136);
            ctx.fillStyle = FARGE.ebenholt;
            ctx.font = '700 13px Inter, sans-serif';
            ctx.fillText('rett i posen, ingen risiko', cx, b.y + 158);
        } else {
            kunstbilde(ctx, P, kort.kunst.navn, cx, b.y + 78, 70);
            ctx.fillStyle = FARGE.ebenholt;
            ctx.font = '700 12px Inter, sans-serif';
            ctx.fillText(kort.kunst.navn, cx, b.y + 124);
            ctx.fillStyle = FARGE.grønn;
            ctx.font = '800 18px Outfit, sans-serif';
            ctx.fillText(mål ? `${gjestNavn(mål).toUpperCase()} SER BORT` : 'INGEN LAR SEG KJØPE', cx, b.y + 146);
            ctx.fillStyle = FARGE.ebenholt;
            ctx.font = '700 13px Inter, sans-serif';
            ctx.fillText(mål ? `blir beundrer i ${MALERI_TREKNINGER} trekninger` : 'Pazzi-familien vil ikke ha kunst', cx, b.y + 166);
        }
        // Prisen, stor og tydelig.
        ctx.fillStyle = FARGE.ebenholt;
        ctx.fillRect(b.x + 20, b.y + 180, b.w - 40, 32);
        ctx.fillStyle = ok ? FARGE.gull : '#e0705f';
        ctx.font = '800 22px Outfit, sans-serif';
        ctx.fillText(`-${pris}`, cx - 12, b.y + 197);
        florin(ctx, cx + 36, b.y + 196, 10, 0.8);
        if (!ok && g.kiste < pris) {
            ctx.fillStyle = FARGE.rød;
            ctx.font = '800 12px Outfit, sans-serif';
            ctx.fillText('FOR DYRT', cx, b.y + b.h - 4);
        }
        ctx.globalAlpha = 1;
    }
    if (dyrere) {
        ctx.fillStyle = '#e0705f';
        ctx.font = '800 12px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('BANKEN TAPER: DYRERE KORT', CARD.x + CARD.w - 14, CARD.y + 21);
        ctx.textAlign = 'center';
    }
}

function tegnKort(ctx: CanvasRenderingContext2D, g: G, fx: Fx) {
    // Valget ligger midt på bordet mellom trekningene: to kort eller spar gullet.
    const kort = g.kort;
    if (!kort || g.fase !== 'gave') return;
    const key = KORT_VALG.map((v) => (kanVelge(g, v) ? 1 : 0)).join('');
    if (!KORTBILDE || KORTBILDE.kort !== kort || KORTBILDE.key !== key) {
        const c = KORTBILDE?.c ?? document.createElement('canvas');
        c.width = (CARD.w + KORT_KANT * 2) * KORT_OPPL;
        c.height = (CARD.h + KORT_KANT * 2) * KORT_OPPL;
        const kc = c.getContext('2d');
        if (!kc) return;
        kc.setTransform(1, 0, 0, 1, 0, 0);
        kc.clearRect(0, 0, c.width, c.height);
        kc.setTransform(KORT_OPPL, 0, 0, KORT_OPPL, (KORT_KANT - CARD.x) * KORT_OPPL, (KORT_KANT - CARD.y) * KORT_OPPL);
        tegnKortbilde(kc, mønstre(kc), g, kort);
        KORTBILDE = { kort, key, c };
    }
    const inn = ease((GAVE_S - g.faseT) / 0.3);
    ctx.save();
    ctx.translate(0, (1 - inn) * 50);
    ctx.globalAlpha = inn;
    ctx.drawImage(KORTBILDE.c, CARD.x - KORT_KANT, CARD.y - KORT_KANT, CARD.w + KORT_KANT * 2, CARD.h + KORT_KANT * 2);
    // Kortene puster litt: gullkant rundt dem du har råd til.
    const puls = 0.5 + 0.5 * Math.sin(fx.time * 6);
    for (const b of cardButtons()) {
        if (b.i === 2 || !kanVelge(g, KORT_VALG[b.i])) continue;
        ctx.strokeStyle = `rgba(224,178,58,${0.4 + 0.5 * puls})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    }
    // Brennende kant: tiden kortene ligger.
    const igjen = clamp(g.faseT / GAVE_S, 0, 1);
    const bx = CARD.x + 14;
    const bw = CARD.w - 28;
    ctx.fillStyle = FARGE.ebenholt;
    ctx.fillRect(bx, CARD.y + CARD.h - 6, bw, 4);
    ctx.fillStyle = FARGE.gull;
    ctx.fillRect(bx, CARD.y + CARD.h - 6, bw * igjen, 4);
    ctx.fillStyle = `rgba(255,200,90,${0.6 + 0.4 * Math.sin(fx.time * 30)})`;
    ctx.beginPath();
    ctx.arc(bx + bw * igjen, CARD.y + CARD.h - 4, 5, 0, TAU);
    ctx.fill();
    ctx.restore();
}

function tegnLys(ctx: CanvasRenderingContext2D, fx: Fx, styrke: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    CANDLES.forEach((l, i) => {
        const fl = 0.85 + 0.1 * Math.sin(fx.time * 9 + i * 2) + 0.05 * Math.sin(fx.time * 23 + i);
        const r = 420 * fl;
        const g = ctx.createRadialGradient(l.x, l.y - 6, 4, l.x, l.y, r);
        g.addColorStop(0, `rgba(255,190,110,${0.3 * styrke})`);
        g.addColorStop(0.35, `rgba(200,120,50,${0.1 * styrke})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x, l.y, r, 0, TAU);
        ctx.fill();
    });
    ctx.restore();
    // Flammene sett ovenfra: et hvitt punkt i en gul glød som blafrer.
    CANDLES.forEach((l, i) => {
        const bl = Math.sin(fx.time * 11 + i * 3) * 1.5;
        const g = ctx.createRadialGradient(l.x + bl, l.y - 2, 0, l.x + bl, l.y - 2, 16);
        g.addColorStop(0, 'rgba(255,255,235,1)');
        g.addColorStop(0.3, 'rgba(255,210,120,.9)');
        g.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x + bl, l.y - 2, 16, 0, TAU);
        ctx.fill();
    });
}

function tegnTrekning(ctx: CanvasRenderingContext2D, P: P6, g: G) {
    const tt = TREKK_S - g.faseT;
    for (let i = 0; i < g.trukket.length; i++) {
        const q = (tt - (REV0 + REVD * i)) / 0.5;
        if (q <= 0) continue;
        const sx = BAG.x + (i - 2) * 76;
        const sy = BAG.y - 138;
        const fly = ease(q / 0.4);
        const x = lerp(BAG.x, sx, fly);
        const y = lerp(BAG.y - 6, sy, fly) - Math.sin(fly * Math.PI) * 40;
        const snu = clamp((q - 0.4) / 0.3, 0, 1);
        const sc = Math.cos(snu * Math.PI);
        const venn = g.trukket[i];
        lapp(ctx, P, x, y, 62, (1 - fly) * 0.8, sc > 0 ? null : venn, Math.max(0.08, Math.abs(sc)));
        if (snu >= 1 && venn) {
            const glød = ctx.createRadialGradient(x, y, 10, x, y, 60);
            glød.addColorStop(0, 'rgba(224,178,58,.35)');
            glød.addColorStop(1, 'rgba(224,178,58,0)');
            ctx.fillStyle = glød;
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, TAU);
            ctx.fill();
        }
    }
    // Telleren: hvor mange venner så langt.
    const vist = g.trukket.filter((v, i) => v && tt > REV0 + REVD * i + REVF).length;
    for (let i = 0; i < MÅ_HA; i++) {
        const x = BAG.x + (i - 1) * 26;
        const y = BAG.y - 196;
        ctx.fillStyle = 'rgba(10,6,4,.6)';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, TAU);
        ctx.fill();
        ctx.fillStyle = i < vist ? FARGE.rød : 'rgba(236,214,164,.25)';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, TAU);
        ctx.fill();
    }
}

function tegnDeler(ctx: CanvasRenderingContext2D, P: P6, fx: Fx) {
    for (const p of fx.parts) {
        const k = 1 - p.t / p.life;
        if (p.k === 'mynt') florin(ctx, p.x, p.y, 9, 0.5 + 0.4 * Math.sin(p.rot));
        else if (p.k === 'venn' || p.k === 'fiende') lapp(ctx, P, p.x, p.y, 30, p.rot, p.k === 'venn');
        else if (p.k === 'flis') {
            ctx.fillStyle = `rgba(236,214,164,${k})`;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-4, -1.5, 8, 3);
            ctx.restore();
        } else {
            ctx.fillStyle = `rgba(250,236,210,${0.3 * k})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + (1 - k) * 18, 0, TAU);
            ctx.fill();
        }
    }
}

function tegnMørke(ctx: CanvasRenderingContext2D, x: number, y: number, hull: number, styrke: number) {
    if (styrke <= 0.01) return;
    const g = ctx.createRadialGradient(x, y, hull, x, y, hull + 380);
    g.addColorStop(0, 'rgba(12,8,5,0)');
    g.addColorStop(0.35, `rgba(12,8,5,${styrke * 0.7})`);
    g.addColorStop(1, `rgba(12,8,5,${styrke})`);
    ctx.fillStyle = g;
    ctx.fillRect(-400, -400, W + 800, H + 800);
}

function draw(g: G, fx: Fx, view: ArcadeView, m: Mode, fiskeHover: boolean) {
    const { ctx, w, h, dpr } = view;
    const P = mønstre(ctx);
    const s = Math.min(w / W, h / H);
    const ox = (w - W * s) / 2;
    const oy = (h - H * s) / 2;
    const z = fx.zoom;
    const shx = (Math.random() - 0.5) * fx.shake * 10;
    const shy = (Math.random() - 0.5) * fx.shake * 10;
    // Kameraet zoomer rundt et fokuspunkt i verden.
    const ax = ox + s * fx.focusX;
    const ay = oy + s * fx.focusY;
    fx.cam = { s, ox, oy, z, ax, ay, shx, shy };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1a100a';
    ctx.fillRect(0, 0, w, h);
    const rom = tegnRom(w, h, dpr, s, ox, oy);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (ax * (1 - z) + shx), dpr * (ay * (1 - z) + shy));
    ctx.drawImage(rom, 0, 0, w, h);

    // Verden: skala s * z rundt fokuspunktet.
    const ws = s * z;
    ctx.setTransform(dpr * ws, 0, 0, dpr * ws, dpr * (ax * (1 - z) + ox * z + shx), dpr * (ay * (1 - z) + oy * z + shy));

    tegnLys(ctx, fx, 1);
    tegnKiste(ctx, g, fx);
    tegnBank(ctx, g, fx);
    tegnKuler(ctx, P, g, fx, fiskeHover && m === 'play');
    tegnSjanse(ctx, P, g);
    // I gavefasen ser alle på kortet: ingen blikk over bordet.
    if (g.fase !== 'gave') for (const r of g.rådsherrer) tegnBlikk(ctx, P, g, fx, r);
    // I valget lyser ringen rundt den fienden maleriet vil gjøre til beundrer.
    const mål = g.fase === 'gave' ? g.kort?.mål : null;
    for (const r of g.rådsherrer) tegnRådsherre(ctx, P, fx, r, mål === r.id);
    tegnPose(ctx, P, g, fx);
    tegnArm(ctx, P, g, fx);
    tegnÅpning(ctx, fx, !!g.hånd.act);
    if (m === 'play' && g.fase === 'smugle' && g.fri && fx.stille > 1.8 && !g.hånd.act) {
        // Alle ser bort og du venter: posen lyser opp som en invitasjon.
        const puls = 0.5 + 0.5 * Math.sin(fx.time * 7);
        ctx.strokeStyle = `rgba(224,178,58,${0.45 + 0.45 * puls})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(BAG.x, BAG.y, BAG.r + 18 + puls * 8, 0, TAU);
        ctx.stroke();
    }
    if (g.hånd.act) {
        // Ermet forsvinner ned i posen: tegn en mørk fold over håndleddet.
        ctx.fillStyle = 'rgba(20,12,7,.85)';
        ctx.beginPath();
        ctx.ellipse(BAG.x, BAG.y - 2, 16, 12, 0, 0, TAU);
        ctx.fill();
    }
    tegnKort(ctx, g, fx);
    if (fx.kunstFly) {
        const f = fx.kunstFly;
        const q = ease(f.t / 0.6);
        kunstbilde(ctx, P, f.navn, lerp(f.x, f.tx, q), lerp(f.y, f.ty, q) - Math.sin(q * Math.PI) * 80, 40 + Math.sin(q * Math.PI) * 16);
    }
    // Trekningen: alt annet dempes, lysene blafrer, lappene snus én og én.
    if (g.fase === 'trekning' && !g.ended) {
        tegnMørke(ctx, BAG.x, BAG.y - 70, 150, 0.62 * ease((TREKK_S - g.faseT) / 0.4));
        tegnTrekning(ctx, P, g);
    }
    tegnDeler(ctx, P, fx);
    // Nesten tatt: gullkant i bildet mens tiden står nesten stille.
    if (fx.nesten > 0) tegnMørke(ctx, BAG.x, BAG.y, 120, 0.4 * fx.nesten);
    // Tatt: bordet blir ebenholt, bare hånda og posen står i lyset.
    if (fx.tatt > 0) {
        tegnMørke(ctx, BAG.x, BAG.y + 60, 90, 0.88 * ease(fx.tatt));
        ctx.save();
        ctx.globalAlpha = ease(fx.tatt);
        const r = { x: fx.tattX, y: fx.tattY };
        const gr = ctx.createLinearGradient(r.x, r.y, BAG.x, BAG.y);
        gr.addColorStop(0, 'rgba(255,246,222,.0)');
        gr.addColorStop(1, 'rgba(255,246,222,.55)');
        ctx.strokeStyle = gr;
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(BAG.x, BAG.y);
        ctx.stroke();
        ctx.restore();
    }
    if (fx.tapFlash > 0) tegnMørke(ctx, CHEST.x + CHEST.w / 2, CHEST.y + 60, 60, 0.45 * fx.tapFlash);

    // Rammen rundt: vignett og varm glød ved seier.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(vignett(w, h), 0, 0, w, h);
    if (fx.nesten > 0) {
        ctx.strokeStyle = `rgba(224,178,58,${0.8 * fx.nesten})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, w - 10, h - 10);
    }
    if (fx.vinnFlash > 0) {
        ctx.fillStyle = `rgba(224,178,58,${0.16 * fx.vinnFlash})`;
        ctx.fillRect(0, 0, w, h);
    }
    if (m === 'menu') {
        ctx.fillStyle = 'rgba(12,8,5,.25)';
        ctx.fillRect(0, 0, w, h);
    }
}

// =====================================================================================
// Studioloen: kunstverkene du har gitt byen, samlet på tvers av runder.
// =====================================================================================

function Studiolo({ eid }: { eid: string[] }) {
    // Tegnes til et bilde: skallet legger alle canvas-elementer over hele spillvinduet.
    const [src, setSrc] = useState('');
    const nøkkel = eid.join('|');
    useEffect(() => {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const dpr = 2;
        const cw = 330;
        const ch = 64;
        c.width = cw * dpr;
        c.height = ch * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const P = mønstre(ctx);
        bit(ctx, P, rekt(1, 1, cw - 2, ch - 2, 3), 'valnøtt', 90, 6, 1.6);
        KUNST.forEach((k, i) => {
            const x = 30 + i * 54;
            const y = ch / 2;
            if (eid.includes(k.navn)) kunstbilde(ctx, P, k.navn, x, y, 44);
            else {
                bit(ctx, P, rekt(x - 22, y - 22, 44, 44, 3), 'ebenholt', 0, 4, 1.2, 0.4);
                ctx.fillStyle = 'rgba(236,214,164,.35)';
                ctx.font = '800 18px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', x, y + 1);
            }
        });
        setSrc(c.toDataURL());
        // nøkkel dekker eid
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nøkkel]);
    if (!src) return null;
    return (
        <img
            src={src}
            alt={`Studioloen: ${eid.length} av ${KUNST.length} kunstverk`}
            style={{ width: 330, height: 64, maxWidth: '100%', display: 'block', margin: '0 auto' }}
        />
    );
}

// =====================================================================================
// Spillet
// =====================================================================================

const BANNER: Record<number, string> = {
    0: '1434 · COSIMO ER HJEMME',
    1: '1444',
    2: '1454 · PAVENS UTSENDING',
    3: '1464 · PAZZI VED BORDET',
    4: '1469 · BANKEN SVIKTER',
    5: '1478 · PAZZI-TREKNINGEN',
    6: '1485 · PAVENS UTSENDING',
    7: '1492 · SISTE TREKNING',
};

export default function Loddposen({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const [first] = useState(() => newGame(Math.floor(Math.random() * 1e9)));
    const gRef = useRef<G>(first);
    const fxRef = useRef<Fx>(newFx());
    const holder = useRef(false);
    const hover = useRef(false);
    const outcome = useRef<Outcome | null>(null);
    const [result, setResult] = useState<(Outcome & { g: G; ny: boolean }) | null>(null);
    const botRng = useRef(seeded(1));
    const botN = useRef(0);
    const [synth] = useState(createArcadeSynth);
    const [muted, setMutedState] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const hud = {
        år: useRef<HTMLDivElement>(null),
        trekning: useRef<HTMLDivElement>(null),
        pips: useRef<HTMLDivElement>(null),
        poeng: useRef<HTMLDivElement>(null),
        mult: useRef<HTMLDivElement>(null),
    };
    const lastHud = useRef('');
    const vunnetListe = useRef<boolean[]>([]);

    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt i verden -> et punkt i spillvinduet, samme regnestykke som tegningen. */
    const toScreen = (wx: number | (() => number), wy: number | (() => number)) => () => {
        const c = fxRef.current.cam;
        const x = typeof wx === 'function' ? wx() : wx;
        const y = typeof wy === 'function' ? wy() : wy;
        const z = c.z;
        return {
            x: c.ax * (1 - z) + (c.ox + c.s * x) * z,
            y: c.ay * (1 - z) + (c.oy + c.s * y) * z,
        };
    };
    const rådAnker = (id: number) => () => {
        const r = gRef.current.rådsherrer.find((q) => q.id === id);
        return r ? toScreen(r.x, r.y - 30)() : null;
    };

    const spawn = (p: Omit<Part, 't'>) => {
        const fx = fxRef.current;
        if (fx.parts.length < 160) fx.parts.push({ ...p, t: 0 });
    };

    const handleEvents = (g: G) => {
        const fx = fxRef.current;
        for (const e of g.events) {
            switch (e.k) {
                case 'slapp': {
                    fx.bagPop = 1;
                    fx.ballPop = 1;
                    fx.shake = Math.max(fx.shake, 0.12);
                    spawn({ k: 'venn', x: BAG.x + 30, y: BAG.y + 60, vx: 0, vy: 0, rot: 0.4, vr: -6, life: 0.28, tx: BAG.x, ty: BAG.y });
                    for (let i = 0; i < 4; i++)
                        spawn({ k: 'flis', x: BAG.x, y: BAG.y - 6, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 80, rot: Math.random() * 6, vr: 8, life: 0.4 });
                    synth.noise(0.09, 0.07, 2600);
                    synth.tone(420 + Math.min(10, g.hånd.dukk) * 40, 300, 0.07, 'triangle', 0.05);
                    if (g.hånd.dukk === 3) {
                        text.point('grådig', 'Tør du én til? Poengene ganges', toScreen(BAG.x, BAG.y - 60), { once: true, seconds: 3.5 });
                    }
                    break;
                }
                case 'fisket':
                    spawn({ k: 'fiende', x: BAG.x, y: BAG.y, vx: 260, vy: -260, rot: 0, vr: 7, life: 0.7 });
                    synth.noise(0.14, 0.06, 1500);
                    synth.tone(260, 520, 0.1, 'triangle', 0.05);
                    break;
                case 'varsel': {
                    const r = g.rådsherrer.find((q) => q.x === e.x && q.y === e.y);
                    if (r) {
                        fx.kremt.set(r.id, 1);
                        if (r.falsk) fx.kremtFalsk.add(r.id);
                        else fx.kremtFalsk.delete(r.id);
                    }
                    const inne = !!g.hånd.act;
                    synth.noise(0.14, inne ? 0.14 : 0.05, 320);
                    synth.tone(150, 105, 0.12, 'sawtooth', inne ? 0.06 : 0.02);
                    if (r?.falsk) {
                        // Albizzi kremter falskt: hodet blir der det er.
                        text.point('falsk', 'Falskt kremt! Hodet snur seg ikke', rådAnker(r.id), { once: true, seconds: 3.5 });
                        break;
                    }
                    if (inne) {
                        synth.tone(62, 44, 0.12, 'sine', 0.35);
                        synth.tone(58, 40, 0.12, 'sine', 0.3, 0.18);
                        buzz(30);
                        fx.nesten = 1;
                        if (r)
                            text.beatOnce(
                                'kremt',
                                'Et kremt!',
                                'Rådsherren snur seg om et øyeblikk. Dra hånda ut av posen nå, ellers blir du tatt.',
                                { at: rådAnker(r.id), until: () => !gRef.current.hånd.act }
                            );
                    }
                    break;
                }
                case 'nesten':
                    // Ute i siste liten: stor tekst, gullramme, rist og høyere multiplikator.
                    text.float('NESTEN TATT!', ...xy(toScreen(BAG.x, BAG.y - 100)), FARGE.gull, true);
                    synth.arp(660, [0, 5, 9, 12], 0.05, 0.06);
                    buzz(20);
                    text.lesson('kremt', 'Du dro hånda ut ved kremtet. Cosimo ble tatt i 1433 og kastet ut av byen.', 0.8);
                    fx.nesten = 1;
                    fx.shake = Math.max(fx.shake, 0.3);
                    fx.handY += 40;
                    for (let i = 0; i < 10; i++)
                        spawn({ k: 'flis', x: BAG.x, y: BAG.y - 10, vx: (Math.random() - 0.5) * 320, vy: -120 - Math.random() * 160, rot: Math.random() * 6, vr: 10, life: 0.6 });
                    break;
                case 'bank': {
                    // Pengene fra filialene flyr fra bankskapet til kista.
                    fx.bankPuls = 1;
                    FILIALER.forEach((f, i) => {
                        if (!filialOk(g, f)) return;
                        for (let j = 0; j < Math.ceil(f.florin / 4); j++)
                            spawn({ k: 'mynt', x: BANK.x + BANK.w - 24, y: filialY(i), vx: 0, vy: 0, rot: Math.random() * 6, vr: 9, life: 0.9 + j * 0.08 + i * 0.1, tx: CHEST.x + 50 + Math.random() * 80, ty: CHEST.y + 110 + Math.random() * 70 });
                    });
                    for (let i = 0; i < 4; i++) synth.tone(1500 + i * 120, 1900, 0.05, 'square', 0.015, 0.3 + i * 0.09);
                    text.float(`${e.tekst ?? ''} fra banken`, ...xy(toScreen(BANK.x + BANK.w / 2, BANK.y - 10)), FARGE.gull);
                    if (g.trekning === 1) text.point('bank', 'Banken sender florin til kista', toScreen(BANK.x + BANK.w / 2, BANK.y), { once: true, seconds: 3 });
                    text.lesson('bank', 'Pengene til vennene kom fra Medici-banken og pavens konto i Roma.', 0.6);
                    break;
                }
                case 'bestikk':
                    // To røde lapper flyr fra kortet ned i posen.
                    fx.bagPop = 1;
                    fx.ballPop = 1;
                    for (let i = 0; i < BESTIKK_LAPPER; i++)
                        spawn({ k: 'venn', x: CARD.x + 130 + i * 40, y: CARD.y + 110, vx: 0, vy: 0, rot: 0.3, vr: -5, life: 0.5 + i * 0.12, tx: BAG.x, ty: BAG.y });
                    synth.noise(0.12, 0.07, 2200);
                    synth.arp(330, [0, 7, 12], 0.06, 0.06);
                    text.float(`+${BESTIKK_LAPPER} RØDE`, ...xy(toScreen(BAG.x, BAG.y - 70)), '#ff9a88', true);
                    text.lesson('bestikk', 'Medici kjøpte venner: bestikkelser fylte loddposen med folk de stolte på.', 0.8);
                    break;
                case 'pave':
                    spawn({ k: 'mynt', x: BAG.x, y: BAG.y - 20, vx: 0, vy: 0, rot: 0, vr: 9, life: 0.7, tx: CHEST.x + 90, ty: CHEST.y + 120 });
                    synth.tone(1700, 2100, 0.05, 'square', 0.02);
                    text.float(`+${PAVE_BONUS} fra paven`, ...xy(toScreen(BAG.x - 90, BAG.y - 40)), '#fbf6ea');
                    text.lesson('pave', 'Paven hadde pengene sine i Medici-banken. Kontoen i Roma ga mest.', 0.9);
                    break;
                case 'rykk':
                    synth.tone(520, 380, 0.06, 'square', 0.03);
                    fx.shake = Math.max(fx.shake, 0.05);
                    break;
                case 'tatt':
                    fx.tatt = 0.01;
                    fx.tattX = e.x ?? BAG.x;
                    fx.tattY = e.y ?? BAG.y;
                    fx.shake = 0.6;
                    synth.noise(0.5, 0.2, 200);
                    synth.tone(220, 70, 0.9, 'sawtooth', 0.09);
                    buzz([60, 40, 120]);
                    break;
                case 'trekning':
                    fx.reveal = 0;
                    fx.stamp = false;
                    synth.noise(0.6, 0.05, 500);
                    text.beatOnce(
                        'trekning',
                        'Loddtrekningen',
                        'Fem lapper trekkes. Er minst tre av dem Medici-venner, styrer Medici byen - uten å ha en krone.',
                        { at: toScreen(BAG.x, BAG.y - 150), until: () => gRef.current.fase !== 'trekning' }
                    );
                    break;
                case 'vant':
                case 'ren': {
                    fx.vinnFlash = 1;
                    vunnetListe.current.push(true);
                    for (let i = 0; i < 14; i++)
                        spawn({ k: 'mynt', x: BAG.x + (Math.random() - 0.5) * 40, y: BAG.y, vx: 0, vy: 0, rot: Math.random() * 6, vr: 10, life: 0.6 + i * 0.04, tx: CHEST.x + 60 + Math.random() * 60, ty: CHEST.y + 120 + Math.random() * 60 });
                    for (let i = 0; i < 6; i++) synth.tone(1800 + i * 90, 2300, 0.05, 'square', 0.02, 0.5 + i * 0.05);
                    synth.arp(e.k === 'ren' ? 523 : 440, e.k === 'ren' ? [0, 4, 7, 12, 16] : [0, 4, 7], 0.08, 0.07);
                    text.float(e.tekst?.replace(' i renter', '') ?? '', ...xy(toScreen(CHEST.x + CHEST.w / 2, CHEST.y + 10)), FARGE.gull, true);
                    text.lesson('makt', 'Flere venner i posen ga Medici makt uten tittel.', 1);
                    break;
                }
                case 'tapte':
                    fx.tapFlash = 1;
                    vunnetListe.current.push(false);
                    for (let i = 0; i < 8; i++)
                        spawn({ k: 'mynt', x: CHEST.x + 60 + Math.random() * 60, y: CHEST.y + 120, vx: 80 + Math.random() * 160, vy: -260 - Math.random() * 120, rot: 0, vr: 12, life: 0.9 });
                    synth.tone(300, 140, 0.55, 'sawtooth', 0.06);
                    text.float(e.tekst ?? '', ...xy(toScreen(CHEST.x + CHEST.w / 2, CHEST.y + 10)), '#e0705f', true);
                    text.lesson('tap', 'En tapt trekning kostet mer for hvert år. Uten gull forsvant vennene.', 0.7);
                    break;
                case 'kunst': {
                    const r = g.rådsherrer.find((q) => q.x === e.x && q.y === e.y);
                    if (r && e.tekst) {
                        fx.gaver.set(r.id, e.tekst);
                        fx.kunstFly = { navn: e.tekst, x: CARD.x + CARD.w / 2, y: CARD.y + 100, tx: r.x + Math.cos(Math.atan2(BAG.y - r.y, BAG.x - r.x)) * 92, ty: r.y + Math.sin(Math.atan2(BAG.y - r.y, BAG.x - r.x)) * 92, t: 0 };
                        text.float('BEUNDRER', ...xy(toScreen(r.x, r.y - 50)), '#9fc28a');
                    }
                    synth.arp(392, [0, 4, 7, 11, 14], 0.08, 0.06);
                    text.lesson('kunst', `Du ga byen ${e.tekst ?? 'kunst'}. Kunsten gjorde misunnelige til venner.`, 1);
                    break;
                }
                case 'kort':
                    synth.noise(0.12, 0.04, 3000);
                    text.banner(
                        BANNER[g.trekning] ?? `${ÅR[g.trekning]}`,
                        g.trekning === RYSTELSE || g.trekning === 4 ? FARGE.rød : utsendingHer(g) ? FARGE.gull : FARGE.valnøtt
                    );
                    if (g.trekning === 1 && g.kort)
                        text.point('kort', 'Velg ett kort - eller spar gullet', toScreen(CARD.x + CARD.w / 2, CARD.y), { once: true, seconds: 3.5, until: () => !gRef.current.kort });
                    if (utsendingHer(g)) {
                        const u = g.rådsherrer.find((r) => r.slag === 'utsending');
                        if (u) text.point(`pave-${g.trekning}`, `Smugle mens han følger med: +${PAVE_BONUS}`, rådAnker(u.id), { seconds: 5, tone: 'bra' });
                    }
                    if (g.trekning === ALBIZZI_FRA) {
                        const a = g.rådsherrer.find((r) => r.slag === 'albizzi');
                        if (a) text.point('albizzi', 'Albizzi kremter falskt - se på hodet', rådAnker(a.id), { once: true, seconds: 5 });
                    }
                    if (g.trekning === 3) {
                        const p = g.rådsherrer.find((r) => r.slag === 'pazzi');
                        if (p) text.point('pazzi-lur', 'Pazzi later som han ser bort', rådAnker(p.id), { once: true, seconds: 5 });
                    }
                    if (g.trekning === 4) {
                        text.lesson('banken', 'Fra 1469 tjente banken mindre: London tapte penger, og Lorenzo brukte mer.', 0.9);
                        text.point('svikter', 'Banken svikter: færre florin inn', toScreen(BANK.x + BANK.w / 2, BANK.y + 150), { seconds: 4, tone: 'fare' });
                    }
                    if (g.trekning === RYSTELSE) {
                        const p = g.rådsherrer.find((r) => r.slag === 'pazzi');
                        const sv = g.rådsherrer.find((r) => r.slag === 'salviati');
                        text.lesson('pazzi', 'I 1478 prøvde Pazzi-familien og erkebiskop Salviati å ta makten, med pavens støtte.', 0.9);
                        if (p)
                            text.beatOnce('pazzi', 'Pazzi og Salviati', 'De ser samtidig og kremter ikke. Hodet til Pazzi rykker tre ganger mot posen - på det tredje ser begge.', {
                                at: rådAnker(p.id),
                            });
                        if (sv) text.point('salviati', 'Salviati ser samtidig med Pazzi', rådAnker(sv.id), { once: true, seconds: 5, tone: 'fare' });
                    }
                    {
                        const gf = g.rådsherrer.find((r) => r.slag === 'gonf');
                        if (gf) text.point(`gonf-${g.trekning}`, 'Albizzis mann ser mest på posen', rådAnker(gf.id), { seconds: 4, tone: 'fare' });
                    }
                    break;
                case 'pater':
                    text.banner('PATER PATRIAE', FARGE.gull, 2.6);
                    text.lesson('pater', 'Cosimo døde i 1464. Byen kalte ham Pater Patriae - landets far.', 1.2);
                    synth.arp(392, [0, 7, 12, 16, 19], 0.1, 0.07);
                    break;
                case 'tom':
                    synth.tone(200, 60, 0.8, 'triangle', 0.08);
                    break;
                default:
                    break;
            }
        }
        g.events.length = 0;
    };

    /** Lapper som forklarer bordet første gang, og et hint til den som bare venter. */
    const hints = (g: G, dt: number) => {
        const fx = fxRef.current;
        if (g.fase !== 'smugle' || g.ended) return;
        if (g.trekning === 0) {
            if (g.venner >= 1) text.point('røde', 'Røde lapper = Medici-venner', toScreen(VENN.x + VENN.w / 2, VENN.y), { once: true, seconds: 3.5 });
            if (g.t > 4.5 && !g.hånd.act) text.point('svarte', 'Svarte lapper = fiendene dine', toScreen(FIENDE.x + FIENDE.w / 2, FIENDE.y), { once: true, seconds: 3.5 });
            if (g.t > 6.5) text.point('tre-av-fem', '3 av 5 røde = du vinner', toScreen(BAG.x, 436), { once: true, seconds: 3.5 });
        }
        // Den som venter, får et hint når alle ser bort.
        if (g.hånd.act) fx.stille = 0;
        else fx.stille += dt;
        if (fx.stille > 3.2 && g.fri && g.kiste >= LAPP_PRIS) {
            fx.stille = -4;
            text.point('vent', 'Alle ser bort - hold på posen!', toScreen(REST.x + 40, REST.y - 30), { seconds: 2.5, until: () => !!gRef.current.hånd.act });
        }
    };

    const stepFx = (g: G, dt: number, m: Mode) => {
        const fx = fxRef.current;
        fx.time += dt;
        fx.bagPop = Math.max(0, fx.bagPop - dt * 5);
        fx.ballPop = Math.max(0, fx.ballPop - dt * 4);
        fx.shake = Math.max(0, fx.shake - dt * 2.5);
        fx.nesten = Math.max(0, fx.nesten - dt * (g.frys > 0 ? 0.5 : 2.2));
        fx.tapFlash = Math.max(0, fx.tapFlash - dt * 1.4);
        fx.vinnFlash = Math.max(0, fx.vinnFlash - dt * 2);
        for (const [id, k] of fx.kremt) fx.kremt.set(id, Math.max(0, k - dt * 0.7));
    fx.bankPuls = Math.max(0, fx.bankPuls - dt * 1.2);
    fx.stillePazzi = g.trekning >= RYSTELSE;
        if (fx.tatt > 0) fx.tatt = Math.min(1, fx.tatt + dt * 2.5);
        if (fx.kunstFly) {
            fx.kunstFly.t += dt;
            if (fx.kunstFly.t > 0.6) fx.kunstFly = null;
        }
        // Hånda: hviler ved plassen din, stuper ned i posen, skjelver når noen snur seg.
        const inne = !!g.hånd.act;
        const truet = g.rådsherrer.some((r) => ekteFare(g, r));
        const pazziVarme = Math.max(0, ...g.rådsherrer.filter((r) => stillePazzi(g, r) && r.blikk === 'bort').map((r) => r.siden / PAZZI_STILLE_S));
        const skjelv = inne ? 0.8 + g.hånd.dukk * 0.35 + (truet ? 4 : 0) + pazziVarme * 2.5 : 0;
        const mx = inne ? BAG.x : REST.x;
        const my = inne ? BAG.y : REST.y;
        const k = Math.min(1, dt * (inne ? 22 : 12));
        fx.handX = lerp(fx.handX, mx, k) + (Math.random() - 0.5) * skjelv;
        fx.handY = lerp(fx.handY, my, k) + (Math.random() - 0.5) * skjelv;
        // Kameraet: dykker mot posen under trekningen, litt ved nesten tatt og når du blir tatt.
        const trekk = g.fase === 'trekning' && !g.ended;
        const målZ = trekk ? 1.3 : fx.tatt > 0 ? 1.18 : fx.nesten > 0.2 ? 1.05 : m === 'slutt' && g.ended === 'vunnet' ? 1.08 : 1;
        fx.zoom = lerp(fx.zoom, målZ, Math.min(1, dt * (trekk ? 3 : 4)));
        fx.focusX = BAG.x;
        fx.focusY = lerp(fx.focusY, trekk ? BAG.y - 80 : BAG.y, Math.min(1, dt * 3));
        // Trommeslag når en lapp snus.
        if (trekk) {
            const tt = TREKK_S - g.faseT;
            const n = g.trukket.filter((_, i) => tt > REV0 + REVD * i + REVF).length;
            while (fx.reveal < n) {
                const venn = g.trukket[fx.reveal];
                synth.tone(venn ? 110 : 80, 45, 0.22, 'sine', 0.35);
                synth.noise(0.07, 0.08, venn ? 1400 : 600);
                if (venn) synth.tone(880, 880, 0.08, 'triangle', 0.04, 0.05);
                fx.reveal += 1;
                fx.shake = Math.max(fx.shake, 0.08);
            }
            if (!fx.stamp && tt > REV0 + REVD * 4 + REVF + 0.12) {
                fx.stamp = true;
                const k2 = g.trukket.filter(Boolean).length;
                text.banner(k2 === TREKKES ? 'REN SIGNORIA!' : k2 >= MÅ_HA ? 'VENNENE STYRER' : 'ALBIZZI STYRER', k2 >= MÅ_HA ? FARGE.gull : FARGE.ebenholt, 1.2);
            }
        }
        // Delene: mynter og lapper som flyr.
        for (const p of fx.parts) {
            p.t += dt;
            if (p.tx !== undefined && p.ty !== undefined) {
                const q = ease(p.t / p.life);
                p.x = lerp(p.x, p.tx, q * 0.35);
                p.y = lerp(p.y, p.ty, q * 0.35) - Math.sin(q * Math.PI) * 6;
            } else {
                p.vy += 700 * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
            p.rot += p.vr * dt;
        }
        fx.parts = fx.parts.filter((p) => p.t < p.life);
    };

    const updateHud = (g: G) => {
        const key = `${g.trekning}|${Math.floor(g.poeng)}|${g.mult}|${vunnetListe.current.length}`;
        if (key === lastHud.current) return;
        lastHud.current = key;
        if (hud.år.current) hud.år.current.textContent = `${ÅR[g.trekning]}`;
        if (hud.trekning.current) hud.trekning.current.textContent = `Trekning ${g.trekning + 1} av ${TREKNINGER}`;
        if (hud.poeng.current) hud.poeng.current.textContent = `${Math.floor(g.poeng)}`;
        if (hud.mult.current) {
            hud.mult.current.textContent = `×${g.mult.toFixed(2).replace('.', ',')}`;
            hud.mult.current.style.opacity = g.mult > 1 ? '1' : '.35';
        }
        const pips = hud.pips.current;
        if (pips) {
            const v = vunnetListe.current;
            Array.from(pips.children).forEach((el, i) => {
                const e = el as HTMLElement;
                e.style.background = i < v.length ? (v[i] ? FARGE.rød : FARGE.ebenholt) : i === g.trekning ? FARGE.gull : 'rgba(236,214,164,.35)';
                e.style.transform = i === g.trekning ? 'scale(1.25)' : 'none';
            });
        }
    };

    const endRun = () => {
        const g = gRef.current;
        const won = g.ended === 'vunnet';
        const score = Math.floor(g.poeng);
        outcome.current = { won, score };
        const ny = score > save.best;
        updateSave((s) => ({
            best: Math.max(s.best, score),
            kunst: Array.from(new Set([...s.kunst, ...g.kunstKjøpt])),
            runder: s.runder + 1,
            lengst: Math.max(s.lengst, ÅR[g.trekning]),
        }));
        if (won) text.lesson('seier', 'Medici styrte Firenze i 58 år uten krone - makten satt i posen.', 2);
        else if (g.cause === 'tatt') text.lesson('tatt', 'Tatt med hånda i posen - som Cosimo i 1433.', 2);
        else text.lesson('tom', 'Da Lorenzo brukte mer enn banken tjente, falt Medici i 1494.', 2);
        setResult({ won, score, g, ny });
        setModeBoth('over');
        onComplete({ score: won ? 1 : Math.min(0.9, (g.trekning + 1) / TREKNINGER), completed: true });
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gRef.current;
            const m = modeRef.current;
            const fx = fxRef.current;
            // Sakte film når et blikk snur seg mens hånda er i posen.
            const truetInne = !!g.hånd.act && g.rådsherrer.some((r) => aktiv(r) && r.blikk === 'varsel');
            const slow = truetInne || g.frys > 0 ? 0.45 : 1;
            const gdt = dt * text.timeScale() * slow;
            if (m === 'play') {
                update(g, gdt);
                handleEvents(g);
                hints(g, gdt);
                if (g.ended) {
                    fx.endT = 0;
                    setModeBoth('slutt');
                    if (g.ended === 'vunnet') {
                        for (let i = 0; i < 40; i++)
                            spawn({ k: 'mynt', x: 100 + Math.random() * 800, y: -40 - Math.random() * 200, vx: (Math.random() - 0.5) * 60, vy: 100 + Math.random() * 200, rot: Math.random() * 6, vr: 8, life: 1.8 });
                        synth.arp(523, [0, 4, 7, 12, 16, 19, 24], 0.09, 0.08);
                    }
                }
            } else if (m === 'menu') {
                // Bordet lever bak menyen: blikkene sveiper, trekningene går.
                update(g, dt);
                g.events.length = 0;
                if (g.ended) gRef.current = newGame(Math.floor(Math.random() * 1e9));
            } else if (m === 'slutt') {
                fx.endT += dt;
                if (fx.endT > (g.ended === 'vunnet' ? 2.0 : 1.6)) endRun();
            }
            if (m !== 'paused') stepFx(g, m === 'play' ? gdt : dt, m);
            draw(g, fx, view, m, hover.current);
            if (m === 'play' || m === 'slutt') updateHud(g);
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        gRef.current = newGame(Math.floor(Math.random() * 1e9));
        fxRef.current = newFx();
        outcome.current = null;
        holder.current = false;
        botN.current = 0;
        vunnetListe.current = [];
        lastHud.current = '';
        setResult(null);
        text.resetRun();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.point('hold', 'Hold på posen når ingen ser', toScreen(BAG.x, BAG.y - 40), {
                once: true,
                seconds: 4,
                until: () => !!gRef.current.hånd.act,
            });
        }, 900);
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.point('kista', `Hver lapp koster ${LAPP_PRIS} florin`, toScreen(CHEST.x + CHEST.w / 2, CHEST.y), { once: true, seconds: 5 });
        }, 4200);
        synth.tone(260, 520, 0.14, 'triangle', 0.08);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        const g = gRef.current;
        if (g.hånd.act) trekkUt(g);
        holder.current = false;
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gRef.current = newGame(Math.floor(Math.random() * 1e9));
        fxRef.current = newFx();
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMutedState(synth.isMuted());
    };

    const toWorld = (e: React.PointerEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const c = fxRef.current.cam;
        const sx = e.clientX - r.left;
        const sy = e.clientY - r.top;
        // Omvendt av toScreen.
        const z = c.z;
        return { x: ((sx - c.ax * (1 - z)) / z - c.ox) / c.s, y: ((sy - c.ay * (1 - z)) / z - c.oy) / c.s };
    };
    const inBag = (p: { x: number; y: number }) => Math.hypot(p.x - BAG.x, p.y - BAG.y) < BAG.r + 34;
    const iFiende = (p: { x: number; y: number }) =>
        p.x >= FIENDE.x - 8 && p.x <= FIENDE.x + FIENDE.w + 8 && p.y >= FIENDE.y - 8 && p.y <= FIENDE.y + FIENDE.h + 8;

    /** Samme grep for mus, tastatur og roboter: velgKort eller spar i spillreglene. */
    const velgKortMedLyd = (v: KortValg | null) => {
        const g = gRef.current;
        if (v === null) {
            spar(g);
            synth.tone(500, 420, 0.06, 'triangle', 0.04);
        } else if (velgKort(g, v)) synth.tone(700, 900, 0.06, 'triangle', 0.05);
        else synth.tone(200, 160, 0.1, 'square', 0.03);
    };

    const onDown = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        synth.unlock();
        const g = gRef.current;
        const p = toWorld(e);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        if (g.kort) {
            const b = cardButtons().find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h);
            if (b) velgKortMedLyd(b.i === 2 ? null : KORT_VALG[b.i]);
            return;
        }
        // Hold på posen = hånda inne, lappene faller. Hold på fiendelappene = fisk.
        if (inBag(p)) {
            holder.current = begynn(g, 'slipp');
            if (!holder.current && g.kiste < LAPP_PRIS) text.point('fattig', 'Kista er tom - fisk fiender', toScreen(FIENDE.x + FIENDE.w / 2, FIENDE.y), { seconds: 3 });
        } else if (iFiende(p)) {
            holder.current = begynn(g, 'fisk');
            if (!holder.current && lapper(g) <= MIN_LAPPER) text.point('fem', 'Posen må ha minst fem lapper', toScreen(FIENDE.x + FIENDE.w / 2, FIENDE.y), { seconds: 3 });
        }
    };
    const onMove = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        const p = toWorld(e);
        hover.current = iFiende(p);
        (e.currentTarget as HTMLElement).style.cursor = inBag(p) || iFiende(p) ? 'grab' : 'default';
    };
    const onUp = () => {
        if (!holder.current) return;
        holder.current = false;
        trekkUt(gRef.current);
    };

    // Første gang posen har nok lapper til å fiske: vis hvor.
    useEffect(() => {
        const id = window.setInterval(() => {
            const g = gRef.current;
            if (modeRef.current === 'play' && g.fase === 'smugle' && g.trekning >= 1 && lapper(g) > MIN_LAPPER && !g.hånd.act)
                text.point('fisk', 'Hold her for å fiske fiender ut', toScreen(FIENDE.x + FIENDE.w / 2, FIENDE.y), {
                    once: true,
                    seconds: 5,
                    until: () => gRef.current.hånd.act === 'fisk',
                });
        }, 700);
        return () => window.clearInterval(id);
        // text og toScreen leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const stage = stageRef.current;
            if (stage) {
                const r = stage.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
            }
            if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) return resume();
            if (m !== 'play' || e.repeat) return;
            const g = gRef.current;
            if (e.code === 'Escape' || e.code === 'KeyP') pause();
            else if (e.code === 'Space') {
                e.preventDefault();
                synth.unlock();
                begynn(g, 'slipp');
            } else if (e.code === 'KeyF') {
                begynn(g, 'fisk');
            } else if (g.kort && (e.code === 'Digit1' || e.code === 'Digit2')) {
                velgKortMedLyd(e.code === 'Digit1' ? 'bestikk' : 'maleri');
            } else if (g.kort && e.code === 'Digit3') velgKortMedLyd(null);
        };
        const up = (e: KeyboardEvent) => {
            const g = gRef.current;
            if ((e.code === 'Space' && g.hånd.act === 'slipp') || (e.code === 'KeyF' && g.hånd.act === 'fisk')) trekkUt(g);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    usePlaytest(GAME_ID, () => {
        const bots: Record<string, PlaytestBot> = {};
        for (const [name, b] of Object.entries(BOTS))
            bots[name] = {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                tick: () => {
                    if (modeRef.current !== 'play') return;
                    botN.current += 1;
                    botTick(gRef.current, b.style, botRng.current, botN.current);
                },
            };
        return {
            maksSekunder: RUN_SECONDS + 20,
            snapshot: () => {
                const s = snapshotOf(gRef.current);
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    ...s,
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : s.poeng,
                };
            },
            start: () => {
                botRng.current = seeded(Math.floor(Math.random() * 1e9));
                start();
            },
            bots,
        };
    });

    const tips = result && !result.won && result.g.cause ? tipsFor(result.g) : null;
    const hudOn = mode === 'play' || mode === 'paused' || mode === 'slutt';
    const neste = result ? nextRank(RANGER, result.score) : null;

    return (
        <MicroGameFrame title="Loddposen" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} background="#1a100a" label="Loddposen - Medici i Firenze, 1434-1492">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onDown}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        style={{ touchAction: 'none' }}
                    />

                    {/* HUD: en cartellino festet på bordet (år og mål) og et innlagt poengskilt. */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            opacity: hudOn ? 1 : 0,
                            transition: 'opacity .3s',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: 12,
                                padding: '8px 14px 9px',
                                background: 'linear-gradient(160deg,#f4e4bc,#e2c78e)',
                                border: `2px solid ${FARGE.ebenholt}`,
                                boxShadow: '3px 4px 0 rgba(12,8,5,.55), inset 0 0 14px rgba(120,70,20,.35)',
                                transform: 'rotate(-1.6deg)',
                                color: FARGE.ebenholt,
                                minWidth: 150,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -7,
                                    left: '50%',
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: FARGE.rød,
                                    border: `2px solid ${FARGE.ebenholt}`,
                                    transform: 'translateX(-50%)',
                                }}
                            />
                            <div ref={hud.år} className="arc-display" style={{ fontSize: 30, lineHeight: 1 }}>
                                1434
                            </div>
                            <div ref={hud.trekning} className="arc-display" style={{ fontSize: 11, marginTop: 3 }}>
                                Trekning 1 av 8
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                                <div ref={hud.pips} style={{ display: 'flex', gap: 4 }}>
                                    {Array.from({ length: TREKNINGER }, (_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: 9,
                                                height: 9,
                                                borderRadius: '50%',
                                                border: `1.5px solid ${FARGE.ebenholt}`,
                                                background: 'rgba(236,214,164,.35)',
                                                transition: 'transform .2s',
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="arc-display" style={{ fontSize: 10 }}>
                                    Mål 1492
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                position: 'absolute',
                                right: 12,
                                top: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    padding: '6px 14px 7px',
                                    background: 'linear-gradient(180deg,#2a1b12,#1c1410)',
                                    border: `2px solid ${FARGE.gull}`,
                                    outline: `2px solid ${FARGE.ebenholt}`,
                                    textAlign: 'right',
                                    boxShadow: '0 4px 0 rgba(12,8,5,.6)',
                                }}
                            >
                                <div className="arc-display" style={{ fontSize: 10, color: '#ecd6a4', opacity: 0.8 }}>
                                    Poeng
                                </div>
                                <div ref={hud.poeng} className="arc-display" style={{ fontSize: 26, lineHeight: 1, color: FARGE.gull }}>
                                    0
                                </div>
                                <div ref={hud.mult} className="arc-display" style={{ fontSize: 13, color: '#ecd6a4', opacity: 0.35, marginTop: 2 }}>
                                    ×1,00
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto' }}>
                                <button type="button" className="arc-small" style={{ padding: '4px 10px', fontSize: 13 }} onClick={pause} aria-label="Pause">
                                    ❚❚
                                </button>
                                <button type="button" className="arc-small" style={{ padding: '4px 10px', fontSize: 11 }} onClick={toggleMute} aria-label="Lyd av eller på">
                                    {muted ? 'LYD' : 'STILLE'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Loddposen</ArcadeLogo>
                            <ArcadeTag>Firenze 1434-1492</ArcadeTag>
                            <p style={{ margin: '8px 0 12px', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                Hold på posen (eller mellomrom) når ingen ser. Slipp når noen kremter.
                            </p>
                            <ArcadeBigButton onClick={start}>Smugle</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 8px' }}>
                                Rekord <b className="arc-display">{save.best}</b> &nbsp;/&nbsp; Rang{' '}
                                <b className="arc-display">{rankFor(RANGER, save.best)}</b>
                            </div>
                            <div className="arc-display" style={{ fontSize: 10, marginBottom: 4 }}>
                                Studioloen: {save.kunst.length} av {KUNST.length} kunstverk
                            </div>
                            <Studiolo eid={save.kunst} />
                            <div style={{ marginTop: 10 }}>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? 'Lyd på' : 'Lyd av'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <ArcadeTag>Rådsherrene venter</ArcadeTag>
                            <div style={{ marginTop: 12 }}>
                                <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <ArcadeLogo>{result.won ? 'Medici styrer Firenze' : tips?.tittel}</ArcadeLogo>
                            {result.ny && <ArcadeTag color={FARGE.gull}>Ny rekord!</ArcadeTag>}
                            <p style={{ margin: '8px 0 0', fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>
                                {result.won
                                    ? 'Medici styrte Firenze i 58 år, og ingen av dem hadde en krone. To år senere, i 1494, ble familien kastet ut. Men de kom tilbake, som paver og storhertuger.'
                                    : tips?.tekst}
                            </p>
                            {tips && (
                                <p
                                    style={{
                                        margin: '8px auto 0',
                                        padding: '7px 10px',
                                        maxWidth: 440,
                                        background: FARGE.ebenholt,
                                        color: '#f6e7c4',
                                        border: `2px solid ${FARGE.gull}`,
                                        fontWeight: 700,
                                        fontSize: 14,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    Tips: {tips.tips}
                                </p>
                            )}
                            <ArcadeStats
                                items={[
                                    { value: result.score, label: 'poeng' },
                                    { value: rankFor(RANGER, result.score), label: 'rang' },
                                    { value: `${result.g.vunnet}/${result.won ? TREKNINGER : result.g.trekning + 1}`, label: 'trekninger vunnet' },
                                    { value: save.best, label: 'rekord' },
                                ]}
                            />
                            {neste && (
                                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                                    {neste[0] - result.score} poeng til <b className="arc-display">{neste[1]}</b>
                                </div>
                            )}
                            <ArcadeLessons items={text.lessons(3)} />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                                <ArcadeBigButton onClick={start}>Ny runde</ArcadeBigButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

/** Hjelper: anker -> [x, y] for text.float. */
function xy(a: () => { x: number; y: number }): [number, number] {
    const p = a();
    return [p.x, p.y];
}
