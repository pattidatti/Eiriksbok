// Gråboks-tegningen: scenen med primitive former (rektangler, ellipser, streker).
// Ingen kunst og ingen juice ennå - bare det som trengs for å lese spillet.

import { TUNING, type PlateKind } from './tuning';
import { SLOTS } from './levels';
import type { Game } from './state';
import { aarNa, forbruk } from './rules';
import {
    CHEST,
    H,
    TIN,
    W,
    hookPos,
    pagePos,
    plateRadius,
    platePos,
    poleFoot,
    type Pt,
} from './layout';

const C = {
    sal: '#10141f',
    himmel: '#1f3a6b',
    gull: '#d4a640',
    lys: '#f3e6c4',
    fløyel: '#8e2230',
    tinn: '#9aa3a6',
    gulv: '#2a2418',
};

export interface ViewState {
    /** Vinkelen på glansstreken per stang (roterer med snurret). */
    vinkel: number[];
    /** Buen eleven tegner nå (forsvinner etter litt). */
    spor: (Pt & { t: number })[];
    /** Tinntallerkenen eleven drar (null = ikke). */
    tinDrag: Pt | null;
    /** Tallerkenen fra siden eleven drar (null = ikke). */
    pageDrag: Pt | null;
    tid: number;
}

export function newView(): ViewState {
    return { vinkel: SLOTS.map(() => 0), spor: [], tinDrag: null, pageDrag: null, tid: 0 };
}

export function stepView(v: ViewState, g: Game, dt: number): void {
    v.tid += dt;
    g.slots.forEach((s, i) => {
        if (s.plate) v.vinkel[i] += s.plate.spin * 14 * dt;
    });
    v.spor = v.spor.filter((p) => v.tid - p.t < 0.35);
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function drawPlate(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    spin: number,
    kind: PlateKind,
    vinkel: number,
    t: number
) {
    const S = TUNING.snurr;
    // Vakler: tallerkenen heller og rister, og blir rødskjær.
    const vakl = spin < S.vakle ? (S.vakle - spin) / S.vakle : 0;
    const tilt = Math.sin(t * (6 + vakl * 8)) * vakl * 0.35;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ellipse(ctx, 0, 0, rx, ry);
    ctx.fillStyle = spin < S.slakk ? C.fløyel : vakl > 0 ? '#b07a3a' : C.gull;
    ctx.fill();
    if (spin >= S.overspinn) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = C.lys;
        ctx.stroke();
    }
    // Glansstreken som roterer med snurret.
    ctx.strokeStyle = C.lys;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(vinkel) * rx * 0.95, Math.sin(vinkel) * ry * 0.95);
    ctx.stroke();
    // Ikonet: trekant = skip (skipsskatt), sirkel = monopol, firkant = våpenskjold (titler).
    ctx.fillStyle = C.sal;
    if (kind === 'skip') {
        ctx.beginPath();
        ctx.moveTo(-8, 4);
        ctx.lineTo(8, 4);
        ctx.lineTo(0, -6);
        ctx.fill();
    } else if (kind === 'monopol') {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(-7, -6, 14, 12);
    }
    ctx.restore();
}

export function drawGame(ctx: CanvasRenderingContext2D, g: Game, v: ViewState): void {
    const aar = aarNa(g);
    // Salen og bakteppet.
    ctx.fillStyle = C.sal;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.himmel;
    ctx.fillRect(120, 70, W - 240, 260);
    ctx.fillStyle = C.gulv;
    ctx.beginPath();
    ctx.moveTo(60, 470);
    ctx.lineTo(W - 60, 470);
    ctx.lineTo(W - 180, 330);
    ctx.lineTo(180, 330);
    ctx.closePath();
    ctx.fill();

    // Stormkulissene: varsel fra 1637, fullt inn fra 1639.
    if (aar >= TUNING.tid.varsel) {
        const full = aar >= TUNING.tid.skottene;
        ctx.fillStyle = full ? '#0d1830' : '#16223d';
        const b = full ? 170 : 70;
        ctx.fillRect(40, 60, b, 400);
        if (full) ctx.fillRect(W - 40 - b, 60, b, 400);
        if (full && Math.sin(v.tid * 3.1) > 0.97) {
            ctx.fillStyle = 'rgba(220,235,255,0.25)';
            ctx.fillRect(0, 0, W, H);
        }
    }

    // Prosceniumramma og kartusjen med årstallet.
    ctx.strokeStyle = C.gull;
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 40, W - 60, 440);
    ctx.fillStyle = C.gull;
    ctx.fillRect(W / 2 - 70, 30, 140, 34);
    ctx.fillStyle = C.sal;
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.min(Math.floor(aar), 9999)), W / 2, 48);

    // Tidslinja under kartusjen: gullstripe for år alene, krone-merke ved Karls 11 år.
    const tl = { x: W / 2 - 160, y: 72, w: 320 };
    const span = 14;
    ctx.fillStyle = '#333';
    ctx.fillRect(tl.x, tl.y, tl.w, 4);
    const alene = (g.forsteParlament ?? aar) - TUNING.tid.start;
    ctx.fillStyle = C.gull;
    ctx.fillRect(tl.x, tl.y, (Math.min(span, alene) / span) * tl.w, 4);
    ctx.fillStyle = C.lys;
    ctx.fillRect(tl.x + (11 / span) * tl.w - 1, tl.y - 4, 3, 12);

    // Krokene i taket: fylt = en stang parlamentet har tatt.
    for (let i = 0; i < TUNING.parlament.kroker; i++) {
        const p = hookPos(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = i < g.tatt ? C.tinn : C.sal;
        ctx.fill();
        ctx.strokeStyle = C.tinn;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (i < g.tatt) {
            ctx.fillStyle = '#6d7375';
            ctx.fillRect(p.x - 2, p.y, 4, 30);
        }
    }

    // Stengene, bakerst først.
    const order = g.slots.map((s) => s.id).sort((a, b) => SLOTS[b].dybde - SLOTS[a].dybde);
    for (const id of order) {
        const s = g.slots[id];
        const p = platePos(id);
        const f = poleFoot(id);
        const r = plateRadius(id);
        // Rampelyset foran stanga: av når parlamentet har tatt den.
        if (s.state !== 'stengt') {
            ctx.beginPath();
            ctx.arc(f.x, 478, 5, 0, Math.PI * 2);
            ctx.fillStyle = s.state === 'tatt' ? '#222' : C.lys;
            ctx.fill();
        }
        if (s.state === 'stengt' || s.state === 'tatt') {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.setLineDash([4, 6]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.setLineDash([]);
            continue;
        }
        ctx.strokeStyle = C.gull;
        ctx.lineWidth = 4 * (r.rx / 50);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (s.plate) {
            drawPlate(ctx, p.x, p.y, r.rx, r.ry, s.plate.spin, s.plate.kind, v.vinkel[id], v.tid + id);
            if (s.plate.kombo > 1) {
                ctx.fillStyle = C.lys;
                ctx.font = 'bold 14px Outfit, sans-serif';
                ctx.fillText('×' + s.plate.kombo, p.x, p.y - r.ry - 12);
            }
        }
    }

    // Siden med en ny tallerken.
    if (g.page) {
        const pp = pagePos(g.page.slot);
        ctx.fillStyle = '#05070c';
        ctx.fillRect(pp.x - 12, pp.y - 30, 24, 70);
        ctx.beginPath();
        ctx.arc(pp.x, pp.y - 40, 11, 0, Math.PI * 2);
        ctx.fill();
        const held = v.pageDrag ?? { x: pp.x, y: pp.y - 8 };
        drawPlate(ctx, held.x, held.y, 30, 10, 0.6, g.page.kind, 0, 0);
        // Tiden siden venter: en krympende strek.
        ctx.fillStyle = C.lys;
        ctx.fillRect(pp.x - 20, pp.y + 46, 40 * (g.page.t / TUNING.sider.venter), 3);
        if (g.page.pris > 0) {
            ctx.fillStyle = C.fløyel;
            ctx.beginPath();
            ctx.arc(pp.x + 22, pp.y - 30, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Parlamentets tinntallerken.
    const tin = g.tin;
    const tp = v.tinDrag ?? (tin.state === 'nede' ? TIN.nede : tin.state === 'oser' ? TIN.oser : TIN.oppe);
    if (tin.state !== 'oser') {
        ctx.strokeStyle = C.tinn;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tp.x - 30, 0);
        ctx.lineTo(tp.x - 30, tp.y);
        ctx.moveTo(tp.x + 30, 0);
        ctx.lineTo(tp.x + 30, tp.y);
        ctx.stroke();
    }
    ellipse(ctx, tp.x, tp.y, TIN.rx * (tin.state === 'oppe' ? 0.6 : 1), TIN.ry * (tin.state === 'oppe' ? 0.6 : 1));
    ctx.fillStyle = C.tinn;
    ctx.fill();
    if (tin.state === 'nede') {
        ctx.strokeStyle = C.lys;
        ctx.lineWidth = 2 + Math.sin(v.tid * 8) * 1.5;
        ctx.stroke();
    }

    // Kista: høyden på myntberget er gullet.
    ctx.fillStyle = C.fløyel;
    ctx.fillRect(CHEST.x, CHEST.y, CHEST.w, CHEST.h);
    const fyll = Math.min(1, g.gull / 400);
    ctx.fillStyle = C.gull;
    ctx.fillRect(CHEST.x + 6, CHEST.y + CHEST.h - 4 - fyll * (CHEST.h - 10), CHEST.w - 12, fyll * (CHEST.h - 10));
    // Varsel: kista går tom innen fem sekunder med dette forbruket.
    if (g.gull < forbruk(g) * 5) {
        ctx.strokeStyle = C.fløyel;
        ctx.lineWidth = 3;
        ctx.strokeRect(CHEST.x - 6, CHEST.y - 6, CHEST.w + 12, CHEST.h + 12);
    }

    // Buen eleven tegner.
    if (v.spor.length > 1) {
        ctx.strokeStyle = C.lys;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(v.spor[0].x, v.spor[0].y);
        for (const p of v.spor) ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}
