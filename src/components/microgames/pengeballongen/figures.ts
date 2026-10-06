// Figurene: ballongen med mannskapet (bonden, Ueland, flosshattene, Sverdrup), spøkelset av
// rekordrunden, tingstua med bøndene, funnene, kronen og Stortinget på Løvebakken.

import { P } from './art';
import { TUNING } from './tuning';

/** Ballongen er tegnet for 78 px høyde; den skaleres til høyden i tuning.ts. */
const STØRRELSE = TUNING.ballong.høyde / 78;

export interface Mannskap {
    varme: number;
    hold: boolean;
    hatter: number;
    ueland: boolean;
    sverdrup: boolean;
    /** Ueland-gangeren (1-5): Ueland jubler høyere. */
    ganger: number;
    /** Ekte sekunder, til animasjon. */
    tid: number;
    vy: number;
}

/** Konvolutten (pæra) som sti, med munningen i (0, -30) og toppen i (0, -82). */
function pære(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(-7, -30);
    ctx.bezierCurveTo(-14, -40, -30, -48, -28, -62);
    ctx.bezierCurveTo(-26, -78, -12, -84, 0, -84);
    ctx.bezierCurveTo(12, -84, 26, -78, 28, -62);
    ctx.bezierCurveTo(30, -48, 14, -40, 7, -30);
    ctx.closePath();
}

export function tegnBallong(ctx: CanvasRenderingContext2D, x: number, y: number, m: Mannskap) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.08, Math.min(0.08, -m.vy * 0.0004)));
    ctx.scale(STØRRELSE, STØRRELSE);
    const pust = 1 + m.varme * 0.03 + Math.sin(m.tid * 2.1) * 0.006;

    // Flammen inn i munningen: tre rammer, størst når du holder.
    if (m.varme > 0.05) {
        const r = Math.floor(m.tid * 18) % 3;
        const h = (10 + 16 * m.varme) * (1 + r * 0.12);
        ctx.fillStyle = P.silke;
        ctx.globalAlpha = Math.min(1, m.varme * 1.6);
        ctx.beginPath();
        ctx.moveTo(-5, -18);
        ctx.quadraticCurveTo(-6 + r, -18 - h * 0.6, 0, -18 - h);
        ctx.quadraticCurveTo(6 - r, -18 - h * 0.6, 5, -18);
        ctx.fill();
        ctx.fillStyle = P.hvit;
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.quadraticCurveTo(0, -18 - h * 0.5, 2, -18);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Tauene fra kurven til munningen.
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -13);
    ctx.lineTo(-7, -30);
    ctx.moveTo(11, -13);
    ctx.lineTo(7, -30);
    ctx.moveTo(-4, -13);
    ctx.lineTo(-3, -30);
    ctx.moveTo(4, -13);
    ctx.lineTo(3, -30);
    ctx.stroke();

    // Silken: akvarell som går litt utenfor streken.
    ctx.save();
    ctx.translate(0, -30);
    ctx.scale(pust, pust);
    ctx.translate(0, 30);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = P.silkeLys;
    ctx.save();
    ctx.translate(1.8, -1.5);
    pære(ctx);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.silke;
    pære(ctx);
    ctx.fill();
    // Skygge på høyre side (lyset kommer fra venstre).
    ctx.save();
    pære(ctx);
    ctx.clip();
    ctx.fillStyle = P.silkeMørk;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(18, -58, 16, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = P.silkeLys;
    ctx.beginPath();
    ctx.ellipse(-14, -66, 7, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Glød innenfra når brenneren går.
    if (m.varme > 0.1) {
        ctx.globalAlpha = m.varme * 0.35;
        ctx.fillStyle = '#f2b26b';
        ctx.beginPath();
        ctx.ellipse(0, -42, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Krittstripene (bane-sømmene) og nettet.
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (const s of [-0.55, 0, 0.55]) {
        ctx.moveTo(s * 10, -31);
        ctx.bezierCurveTo(s * 36, -46, s * 34, -78, 0, -84);
    }
    ctx.moveTo(-28, -60);
    ctx.quadraticCurveTo(0, -54, 28, -60);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    pære(ctx);
    ctx.stroke();
    ctx.restore();

    // Kurven (vidje) og mannskapet bak kanten.
    mannskap(ctx, m);
    ctx.fillStyle = '#6b5a45';
    ctx.fillRect(-13, -13, 26, 13);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-13, -13, 26, 13);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = -10; i <= 10; i += 4) {
        ctx.moveTo(i, -13);
        ctx.lineTo(i + 2, 0);
    }
    ctx.moveTo(-13, -6.5);
    ctx.lineTo(13, -6.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Pengesekken på utsiden.
    ctx.fillStyle = '#a89c84';
    ctx.beginPath();
    ctx.ellipse(-16, -4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function hode(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3.4) {
    ctx.fillStyle = '#e8d6bf';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 0.8;
    ctx.stroke();
}

function mannskap(ctx: CanvasRenderingContext2D, m: Mannskap) {
    const hopp = (fase: number, styrke: number) =>
        -Math.max(0, Math.sin(m.tid * (6 + styrke) + fase)) * styrke;

    // Flosshattene: embetsmennene trenger seg på til høyre.
    const n = Math.min(m.hatter, 9);
    for (let i = 0; i < n; i++) {
        const hx = 6 + (i % 3) * 4 - Math.floor(i / 3) * 1.5;
        const hy = -16 - Math.floor(i / 3) * 3.5;
        ctx.fillStyle = P.kritt;
        ctx.fillRect(hx - 3, hy - 9, 6, 9);
        ctx.fillRect(hx - 4.5, hy - 1, 9, 2);
    }

    // Bonden med pengesekken (til venstre). Kaster mynter når du holder.
    const by = -16;
    hode(ctx, -8, by - 4);
    ctx.fillStyle = '#8a8a7a';
    ctx.fillRect(-12, by - 1, 8, 4);
    ctx.fillStyle = P.karmin;
    ctx.beginPath();
    ctx.arc(-8, by - 6.5, 3.6, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, by);
    if (m.hold) ctx.lineTo(-1, by - 9 - Math.sin(m.tid * 20) * 2);
    else ctx.lineTo(-3, by + 3);
    ctx.stroke();

    // Ueland fra 1833: skjegg og lue, jubler høyere jo større gangeren er.
    if (m.ueland) {
        const j = m.ganger > 1 ? hopp(1, 1 + m.ganger * 0.8) : 0;
        const ux = 0;
        const uy = -17 + j;
        hode(ctx, ux, uy - 3);
        ctx.fillStyle = P.halv;
        ctx.beginPath();
        ctx.moveTo(ux - 3, uy - 2);
        ctx.lineTo(ux, uy + 3);
        ctx.lineTo(ux + 3, uy - 2);
        ctx.fill();
        ctx.fillStyle = P.kritt;
        ctx.fillRect(ux - 3.5, uy - 8, 7, 2.5);
        if (m.ganger > 2) {
            ctx.strokeStyle = P.kritt;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(ux - 3, uy);
            ctx.lineTo(ux - 6, uy - 8);
            ctx.moveTo(ux + 3, uy);
            ctx.lineTo(ux + 6, uy - 8);
            ctx.stroke();
        }
    }

    // Sverdrup i 1884: stort helskjegg, står ved roret.
    if (m.sverdrup) {
        const sx = 9;
        const sy = -20;
        hode(ctx, sx, sy - 4, 3.8);
        ctx.fillStyle = P.hvit;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 1, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Roret bak kurven.
        ctx.strokeStyle = '#6b5a45';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(13, -8);
        ctx.lineTo(24, 2);
        ctx.stroke();
        ctx.fillStyle = '#6b5a45';
        ctx.fillRect(22, -2, 6, 10);
    }
}

/** Rekordrunden: samme ballong, bare omrisset i halvtone. */
export function tegnSpøkelse(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(STØRRELSE, STØRRELSE);
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = P.halv;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    pære(ctx);
    ctx.stroke();
    ctx.strokeRect(-13, -13, 26, 13);
    ctx.beginPath();
    ctx.moveTo(-11, -13);
    ctx.lineTo(-7, -30);
    ctx.moveTo(11, -13);
    ctx.lineTo(7, -30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

export function krone(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = P.karmin;
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.lineTo(-11, -5);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, -8);
    ctx.lineTo(5, 0);
    ctx.lineTo(11, -5);
    ctx.lineTo(10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.hvit;
    for (const dx of [-11, 0, 11]) {
        ctx.beginPath();
        ctx.arc(dx, dx === 0 ? -8 : -5, 1.6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/** Tingstua der bøndene teller pengene. `jubel` 0-1 kaster luene i lufta. */
export function tegnTingstue(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ekte: boolean,
    år: number,
    tid: number,
    vinker: boolean
) {
    // Flaggstanga med valgåret.
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 22, y);
    ctx.lineTo(x + 22, y - 62);
    ctx.stroke();
    const vift = Math.sin(tid * 5 + x) * 3;
    ctx.fillStyle = ekte ? P.karmin : P.halv;
    ctx.beginPath();
    ctx.moveTo(x + 22, y - 62);
    ctx.lineTo(x + 46, y - 57 + vift);
    ctx.lineTo(x + 22, y - 50);
    ctx.fill();
    // Huset (laftet tømmer med torvtak).
    ctx.fillStyle = '#5b4d3d';
    ctx.fillRect(x - 16, y - 20, 32, 20);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1;
    for (let i = 4; i < 20; i += 4) {
        ctx.beginPath();
        ctx.moveTo(x - 16, y - i);
        ctx.lineTo(x + 16, y - i);
        ctx.stroke();
    }
    ctx.fillStyle = P.kritt;
    ctx.beginPath();
    ctx.moveTo(x - 21, y - 19);
    ctx.lineTo(x, y - 34);
    ctx.lineTo(x + 21, y - 19);
    ctx.fill();
    ctx.fillStyle = P.hvit;
    ctx.fillRect(x - 4, y - 12, 7, 12);
    // Bøndene utenfor. Vinker (før 1833) eller står og teller.
    for (let i = 0; i < 4; i++) {
        const bx = x - 34 - i * 9;
        const opp = vinker ? Math.max(0, Math.sin(tid * 7 + i)) * 3 : 0;
        ctx.fillStyle = '#e8d6bf';
        ctx.beginPath();
        ctx.arc(bx, y - 13 - opp, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i % 2 ? P.kritt : '#6f6a5d';
        ctx.fillRect(bx - 3, y - 10 - opp, 6, 10 + opp);
        ctx.fillStyle = P.karmin;
        ctx.fillRect(bx - 2.6, y - 17 - opp, 5.2, 2.4);
        if (vinker) {
            ctx.strokeStyle = P.kritt;
            ctx.beginPath();
            ctx.moveTo(bx + 2, y - 9 - opp);
            ctx.lineTo(bx + 5, y - 18 - opp - Math.sin(tid * 9 + i) * 2);
            ctx.stroke();
        }
    }
    ctx.fillStyle = ekte ? P.karmin : P.kritt;
    ctx.font = 'italic 13px "Bodoni Moda", Didot, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Valg ${år}`, x + 34, y - 66);
}

/** Et funn: et lite dokument med segl som henger og glitrer. */
export function tegnFunn(ctx: CanvasRenderingContext2D, x: number, y: number, tid: number) {
    const b = Math.sin(tid * 3 + x * 0.01) * 3;
    ctx.save();
    ctx.translate(x, y + b);
    ctx.rotate(Math.sin(tid * 2 + x) * 0.12);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(0, -40);
    ctx.stroke();
    ctx.fillStyle = P.hvit;
    ctx.fillRect(-8, -11, 16, 20);
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-8, -11, 16, 20);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = -6; i <= 2; i += 3) {
        ctx.moveTo(-5, i);
        ctx.lineTo(5, i);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.karmin;
    ctx.beginPath();
    ctx.arc(3, 5, 3, 0, Math.PI * 2);
    ctx.fill();
    // Glimt.
    const g = (Math.sin(tid * 4 + x) + 1) / 2;
    ctx.strokeStyle = P.hvit;
    ctx.globalAlpha = g;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(-12, -22);
    ctx.moveTo(-16, -18);
    ctx.lineTo(-8, -18);
    ctx.stroke();
    ctx.restore();
}

/** Stortinget på Løvebakken (1866), der ballongen lander i 1884. */
export function tegnStortinget(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#b9a989';
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.3;
    // Fløyene.
    ctx.fillRect(x - 90, y - 34, 180, 34);
    ctx.strokeRect(x - 90, y - 34, 180, 34);
    // Den runde salen i midten.
    ctx.beginPath();
    ctx.moveTo(x - 38, y);
    ctx.lineTo(x - 38, y - 52);
    ctx.quadraticCurveTo(x, y - 74, x + 38, y - 52);
    ctx.lineTo(x + 38, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.kritt;
    for (let i = -80; i <= 80; i += 14) if (Math.abs(i) > 40) ctx.fillRect(x + i - 3, y - 26, 6, 12);
    for (let i = -28; i <= 28; i += 14) ctx.fillRect(x + i - 3, y - 44, 6, 16);
    // Løvene på bakken.
    ctx.fillRect(x - 60, y - 6, 12, 6);
    ctx.fillRect(x + 48, y - 6, 12, 6);
    ctx.fillStyle = P.karmin;
    ctx.beginPath();
    ctx.moveTo(x, y - 66);
    ctx.lineTo(x, y - 92);
    ctx.lineTo(x + 20, y - 86);
    ctx.lineTo(x, y - 80);
    ctx.fill();
}
