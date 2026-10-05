// Kunsten som tegnes én gang: Inigo Jones' maskeradescene i Banqueting House.
// Bakteppet (Rubens-himmel og havn med skip), kulissene i sentralperspektiv, scenegulvet,
// den forgylte prosceniumramma, skyrekka i snorloftet, teppet, vignett og lerretskorn.
// Alt tegnes i logiske koordinater (960x540) på et offscreen-lerret i skjermens oppløsning.

import { seeded, type Rng } from '../sim';
import { H, STAGE, VP, W } from './layout';
import type { PlateKind } from './tuning';

export const PAL = {
    sal: '#4a1844',
    ultra: '#1f3a6b',
    ultraLys: '#3d64a3',
    gull: '#d4a640',
    gullMork: '#8a6420',
    gullLys: '#f0d58a',
    lys: '#f3e6c4',
    flo: '#8e2230',
    floMork: '#4e101a',
    tinn: '#9aa3a6',
    tinnMork: '#5d6669',
    gulv: '#3a2a1a',
};

function mk(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return [c, c.getContext('2d')!];
}

/** Penselstrøk: mange korte, gjennomsiktige streker i en farge (malt lerret). */
function strokes(
    ctx: CanvasRenderingContext2D,
    r: Rng,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    n: number,
    alpha = 0.08
) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
        const sx = x + r() * w;
        const sy = y + r() * h;
        const len = 6 + r() * 22;
        const a = -0.5 + r() * 0.5;
        ctx.globalAlpha = alpha * (0.4 + r() * 0.8);
        ctx.lineWidth = 1 + r() * 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * En malt barokksky: myke, flate dotter med mørk underside og lys, solbelyst overkant
 * (radielle toninger uten harde kanter, så det ligner pensel og ikke bobler).
 */
function cloud(ctx: CanvasRenderingContext2D, r: Rng, cx: number, cy: number, w: number, h: number, base: string, top: string) {
    const n = 5 + Math.floor(r() * 4);
    const puff = (x: number, y: number, rr: number, color: string, a: number) => {
        const g = ctx.createRadialGradient(x, y, rr * 0.1, x, y, rr);
        g.addColorStop(0, color);
        g.addColorStop(0.55, color);
        g.addColorStop(1, color.replace('rgb(', 'rgba(').replace(')', ',0)'));
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1.5, 0.75);
        ctx.translate(-x, -y);
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };
    const pts: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
        const u = i / Math.max(1, n - 1) - 0.5;
        pts.push([cx + u * w + (r() - 0.5) * w * 0.15, cy + (r() - 0.5) * h * 0.4 + Math.abs(u) * h * 0.3, h * (0.45 + r() * 0.35)]);
    }
    for (const [x, y, rr] of pts) puff(x, y + rr * 0.15, rr, base, 0.8);
    for (const [x, y, rr] of pts) puff(x - rr * 0.1, y - rr * 0.3, rr * 0.6, top, 0.45);
    ctx.globalAlpha = 1;
}

function goldGrad(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, PAL.gullMork);
    g.addColorStop(0.35, PAL.gullLys);
    g.addColorStop(0.55, PAL.gull);
    g.addColorStop(1, PAL.gullMork);
    return g;
}

/** Bakre lag: bakteppe, kulisser og scenegulv. */
function drawBack(ctx: CanvasRenderingContext2D, r: Rng, lav: boolean) {
    ctx.fillStyle = PAL.sal;
    ctx.fillRect(0, 0, W, H);
    const { x0, x1, y0, floorBack, edge } = STAGE;

    // Bakteppet: Rubens-himmel, ultramarin øverst og et varmt rosa-gyllent kveldslys nede.
    const sky = ctx.createLinearGradient(0, y0, 0, floorBack);
    sky.addColorStop(0, '#1d2a55');
    sky.addColorStop(0.4, PAL.ultra);
    sky.addColorStop(0.68, '#8a6a8c');
    sky.addColorStop(0.88, '#c98f6a');
    sky.addColorStop(1, '#e0b46e');
    ctx.fillStyle = sky;
    ctx.fillRect(x0, y0, x1 - x0, floorBack - y0);
    // Malte skyer med figurer som bare antydes (lyse dotter).
    for (let i = 0; i < 7; i++) {
        cloud(ctx, r, x0 + 60 + r() * (x1 - x0 - 120), y0 + 60 + r() * 130, 160 + r() * 140, 30 + r() * 20, 'rgb(52,82,138)', 'rgb(236,222,190)');
    }
    if (!lav) strokes(ctx, r, x0, y0, x1 - x0, floorBack - y0, '#e9dcc0', 260, 0.06);
    strokes(ctx, r, x0, y0, x1 - x0, floorBack - y0, '#0c1a36', 160, 0.1);

    // Havna i sentralperspektiv: kaier mot forsvinningspunktet og skip på reden (skipsskatten).
    const hy = floorBack - 26;
    ctx.fillStyle = '#5c7398';
    ctx.fillRect(x0, hy, x1 - x0, floorBack - hy);
    ctx.fillStyle = '#7d8fae';
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 40; i++) ctx.fillRect(x0 + r() * (x1 - x0), hy + 4 + r() * 20, 10 + r() * 30, 1);
    ctx.globalAlpha = 1;
    const ship = (sx: number, sy: number, k: number) => {
        ctx.fillStyle = '#26324a';
        ctx.beginPath();
        ctx.moveTo(sx - 20 * k, sy);
        ctx.lineTo(sx + 22 * k, sy);
        ctx.lineTo(sx + 16 * k, sy + 7 * k);
        ctx.lineTo(sx - 15 * k, sy + 7 * k);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(sx - 1 * k, sy - 30 * k, 1.6 * k, 30 * k);
        ctx.fillRect(sx - 12 * k, sy - 22 * k, 1.4 * k, 22 * k);
        ctx.fillStyle = '#d9cba6';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(sx - 7 * k, sy - 27 * k, 12 * k, 9 * k);
        ctx.fillRect(sx - 6 * k, sy - 16 * k, 11 * k, 8 * k);
        ctx.fillRect(sx - 17 * k, sy - 19 * k, 9 * k, 8 * k);
        ctx.globalAlpha = 1;
    };
    ship(330, hy + 4, 0.8);
    ship(600, hy + 2, 0.65);
    ship(700, hy + 6, 0.9);
    ship(250, hy + 1, 0.5);
    // Kaimurene som løper mot forsvinningspunktet.
    ctx.fillStyle = '#9a8a6a';
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(VP.x + side * 40, hy);
        ctx.lineTo(VP.x + side * 360, floorBack);
        ctx.lineTo(VP.x + side * 300, floorBack);
        ctx.lineTo(VP.x + side * 30, hy);
        ctx.closePath();
        ctx.fill();
    }

    // Scenegulvet: fliser mot forsvinningspunktet, varmt lys fra rampen.
    const fl = ctx.createLinearGradient(0, floorBack, 0, edge);
    // Malt marmorgulv i fiolett og grått, som i Inigo Jones' perspektivscener.
    fl.addColorStop(0, '#3c3a6a');
    fl.addColorStop(0.6, '#58528a');
    fl.addColorStop(1, '#8278a8');
    ctx.fillStyle = fl;
    ctx.fillRect(x0, floorBack, x1 - x0, edge - floorBack);
    ctx.strokeStyle = 'rgba(16,10,6,0.55)';
    ctx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
        ctx.beginPath();
        const fx = VP.x + i * 62;
        const t = (floorBack - VP.y) / (edge - VP.y);
        ctx.moveTo(VP.x + (fx - VP.x) * t, floorBack);
        ctx.lineTo(fx, edge);
        ctx.stroke();
    }
    // Tverrfuger som tettes bakover.
    for (let i = 0; i < 7; i++) {
        const y = floorBack + (edge - floorBack) * Math.pow(i / 7, 1.6);
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    strokes(ctx, r, x0, floorBack, x1 - x0, edge - floorBack, '#120b05', lav ? 60 : 160, 0.12);

    // Kulissene: fire par malte søylevinger som trappes innover mot forsvinningspunktet.
    for (let i = 3; i >= 0; i--) {
        const k = 1 - i * 0.16;
        const top = y0 + 10 + i * 8;
        const bot = edge - (edge - floorBack) * (i / 4);
        const wdt = 54 * k;
        for (const side of [-1, 1]) {
            const outer = side < 0 ? x0 + i * 40 : x1 - i * 40;
            const inner = outer - side * wdt;
            const xa = Math.min(outer, inner);
            // Lerretet: mørk søylehall, opplyst kant mot scenen.
            const lg = ctx.createLinearGradient(outer, 0, inner, 0);
            lg.addColorStop(0, '#22305a');
            lg.addColorStop(0.7, i === 0 ? '#2b3c62' : '#24365c');
            lg.addColorStop(1, '#5a6f96');
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.moveTo(outer, top - 10);
            ctx.quadraticCurveTo((outer + inner) / 2, top - 26, inner, top + 6);
            ctx.lineTo(inner, bot);
            ctx.lineTo(outer, bot);
            ctx.closePath();
            ctx.fill();
            // Malt søyle med forgylt kapitel.
            const cx = xa + wdt * 0.5;
            const cw = wdt * 0.34;
            const cg = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
            cg.addColorStop(0, '#9c8c6c');
            cg.addColorStop(0.4, '#e6d8b4');
            cg.addColorStop(1, '#6d6048');
            ctx.fillStyle = cg;
            ctx.globalAlpha = 0.9 - i * 0.12;
            ctx.fillRect(cx - cw / 2, top + 26, cw, bot - top - 40);
            ctx.fillStyle = goldGrad(ctx, cx - cw, 0, cx + cw, 0);
            ctx.fillRect(cx - cw * 0.8, top + 18, cw * 1.6, 10);
            ctx.fillRect(cx - cw * 0.75, bot - 16, cw * 1.5, 8);
            ctx.globalAlpha = 1;
            strokes(ctx, r, xa, top, wdt, bot - top, '#e6d8b4', lav ? 10 : 30, 0.07);
        }
    }

    // Lemmene i scenegulvet der nye stenger heises opp.
    ctx.strokeStyle = 'rgba(10,6,3,0.6)';
    ctx.lineWidth = 1.2;
}

/** Fremre lag: prosceniumramma, skyrekka i snorloftet, vignett og lerretskorn. */
function drawFront(ctx: CanvasRenderingContext2D, r: Rng, lav: boolean) {
    const { x0, x1, y0, edge } = STAGE;
    // Salens mørke rundt åpningen.
    ctx.fillStyle = PAL.sal;
    ctx.fillRect(0, 0, W, y0 - 22);
    ctx.fillRect(0, 0, x0 - 30, H);
    ctx.fillRect(x1 + 30, 0, W - x1 - 30, H);
    // Rubens' takfelt i salen: ultramarine ovaler i forgylte rammer i hjørnene.
    for (const ox of [120, W - 120]) {
        ctx.fillStyle = goldGrad(ctx, ox - 70, 0, ox + 70, 0);
        ctx.beginPath();
        ctx.ellipse(ox, 8, 74, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        const og = ctx.createRadialGradient(ox, 4, 4, ox, 8, 66);
        og.addColorStop(0, '#5578b4');
        og.addColorStop(1, '#1a2f5a');
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.ellipse(ox, 8, 66, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        cloud(ctx, r, ox, 10, 80, 12, 'rgb(217,198,160)', 'rgb(243,230,196)');
    }

    // Skyrekka (bordunen) som skjuler snorloftet.
    for (let i = 0; i < 11; i++) {
        cloud(ctx, r, x0 + 10 + i * 80, y0 + 12 + r() * 6, 130, 24, 'rgb(34,56,104)', 'rgb(214,198,160)');
    }
    const vg = ctx.createLinearGradient(0, y0, 0, y0 + 30);
    vg.addColorStop(0, 'rgba(16,20,31,0.9)');
    vg.addColorStop(1, 'rgba(16,20,31,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(x0, y0, x1 - x0, 30);

    // Karmosin draperier i hjørnene av åpningen.
    for (const side of [-1, 1]) {
        const ox = side < 0 ? x0 : x1;
        ctx.fillStyle = PAL.flo;
        ctx.beginPath();
        ctx.moveTo(ox, y0 - 2);
        ctx.lineTo(ox - side * 170, y0 - 2);
        ctx.quadraticCurveTo(ox - side * 80, y0 + 60, ox, y0 + 210);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = PAL.floMork;
        ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.moveTo(ox - side * (145 - k * 30), y0);
            ctx.quadraticCurveTo(ox - side * (70 - k * 14), y0 + 40 + k * 8, ox, y0 + 70 + k * 35);
            ctx.stroke();
        }
        ctx.fillStyle = goldGrad(ctx, ox - 10, 0, ox + 10, 0);
        ctx.beginPath();
        ctx.arc(ox - side * 6, y0 + 210, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Prosceniumramma: forgylte pilastre og bjelke med profiler.
    const frame = (x: number, y: number, w: number, h: number, vertical: boolean) => {
        ctx.fillStyle = vertical ? goldGrad(ctx, x, 0, x + w, 0) : goldGrad(ctx, 0, y, 0, y + h);
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(70,46,12,0.7)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.strokeStyle = 'rgba(255,240,200,0.35)';
        ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
    };
    frame(x0 - 30, y0 - 24, 30, edge - y0 + 30, true);
    frame(x1, y0 - 24, 30, edge - y0 + 30, true);
    frame(x0 - 30, y0 - 24, x1 - x0 + 60, 26, false);
    // Rosetter langs bjelken og akantusvolutter på pilastrene.
    for (let i = 0; i < 14; i++) {
        const rx = x0 + 10 + i * ((x1 - x0 - 20) / 13);
        if (Math.abs(rx - W / 2) < 120) continue;
        ctx.fillStyle = PAL.gullLys;
        ctx.beginPath();
        ctx.arc(rx, y0 - 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.gullMork;
        ctx.beginPath();
        ctx.arc(rx + 1, y0 - 10, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
    for (const px of [x0 - 15, x1 + 15]) {
        for (let k = 0; k < 6; k++) {
            const py = y0 + 40 + k * 68;
            ctx.strokeStyle = PAL.gullMork;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, 7, 0.3, Math.PI * 1.7);
            ctx.stroke();
            ctx.strokeStyle = PAL.gullLys;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0.3, Math.PI * 1.7);
            ctx.stroke();
        }
    }
    // Scenekanten (rampen) med forgylt list, og orkestergraven i plommefarget fløyel foran.
    ctx.fillStyle = '#4a2048';
    ctx.fillRect(x0 - 30, edge + 6, x1 - x0 + 60, H - edge);
    ctx.fillStyle = goldGrad(ctx, 0, edge, 0, edge + 8);
    ctx.fillRect(x0 - 30, edge, x1 - x0 + 60, 7);

    // Vignett: varm midte, vinrøde hjørner (salen i plommefarget fløyel).
    const vig = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, W * 0.68);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(40,12,40,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Lerretskorn over alt (statisk, tegnes én gang).
    const n = lav ? 2500 : 7000;
    for (let i = 0; i < n; i++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(255,240,210,0.05)' : 'rgba(0,0,0,0.07)';
        ctx.fillRect(r() * W, r() * H, 1.2, 1.2);
    }
}

/** Teppet (karmosin fløyel med folder), tegnet én gang og skjøvet opp og ned. */
function drawCurtain(ctx: CanvasRenderingContext2D, r: Rng) {
    const { x0, x1 } = STAGE;
    const w = x1 - x0;
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    const folds = 18;
    for (let i = 0; i <= folds; i++) {
        const t = i / folds;
        g.addColorStop(t, i % 2 ? '#5a1220' : '#a3303d');
    }
    ctx.fillStyle = g;
    ctx.fillRect(x0, 0, w, H);
    strokes(ctx, r, x0, 0, w, H, '#2a0710', 200, 0.12);
    // Gullfrynser nederst.
    ctx.fillStyle = PAL.gull;
    ctx.fillRect(x0, H - 14, w, 5);
    for (let x = x0; x < x1; x += 7) ctx.fillRect(x, H - 9, 2, 9);
}

/** Stormkulissen (1637-): mørke, malte uværsskyer med lynlys i kanten. Tegnes for venstre side. */
function drawStormFlat(ctx: CanvasRenderingContext2D, r: Rng) {
    const w = 360;
    const h = STAGE.floorBack - STAGE.y0;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(10,14,26,0.95)');
    g.addColorStop(0.6, 'rgba(18,26,46,0.85)');
    g.addColorStop(1, 'rgba(18,26,46,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
        cloud(ctx, r, 50 + r() * 120, 40 + i * (h / 5), 220, 64, 'rgb(22,30,52)', 'rgb(96,118,160)');
    }
    // Myk kant innover, så kulissen ikke slutter i en rett strek.
    ctx.globalCompositeOperation = 'destination-in';
    const m = ctx.createLinearGradient(0, 0, w, 0);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.55, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
}

export interface Art {
    key: string;
    storm: HTMLCanvasElement;
    back: HTMLCanvasElement;
    front: HTMLCanvasElement;
    curtain: HTMLCanvasElement;
    icons: Record<PlateKind, HTMLCanvasElement>;
}

/** Ikonet preget midt i tallerkenen (tegnet rundt (0,0), radius ca. 20). */
export function drawIcon(ctx: CanvasRenderingContext2D, kind: PlateKind) {
    ctx.lineJoin = 'round';
    if (kind === 'skip') {
        // Skipsskatten: et skip med seil.
        ctx.beginPath();
        ctx.moveTo(-17, 5);
        ctx.lineTo(17, 5);
        ctx.lineTo(11, 13);
        ctx.lineTo(-12, 13);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-1, -17, 2.4, 22);
        ctx.beginPath();
        ctx.moveTo(1.5, -15);
        ctx.quadraticCurveTo(13, -6, 1.5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-1.5, -11);
        ctx.quadraticCurveTo(-11, -4, -1.5, 3);
        ctx.closePath();
        ctx.fill();
    } else if (kind === 'vapen') {
        // Adelstittel: våpenskjold med sparre og krone over.
        ctx.beginPath();
        ctx.moveTo(-13, -9);
        ctx.lineTo(13, -9);
        ctx.lineTo(13, 3);
        ctx.quadraticCurveTo(13, 13, 0, 18);
        ctx.quadraticCurveTo(-13, 13, -13, 3);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, 8);
        ctx.lineTo(0, -2);
        ctx.lineTo(10, 8);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(-9, -12);
        ctx.lineTo(-9, -19);
        ctx.lineTo(-4.5, -15);
        ctx.lineTo(0, -21);
        ctx.lineTo(4.5, -15);
        ctx.lineTo(9, -19);
        ctx.lineTo(9, -12);
        ctx.closePath();
        ctx.fill();
    } else {
        // Monopol: kongens segl med krone (enerett til å selge en vare).
        ctx.beginPath();
        ctx.arc(0, 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-7, 14);
        ctx.lineTo(-11, 22);
        ctx.lineTo(-4, 19);
        ctx.closePath();
        ctx.moveTo(7, 14);
        ctx.lineTo(11, 22);
        ctx.lineTo(4, 19);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(-7, 6);
        ctx.lineTo(-7, -3);
        ctx.lineTo(-3.5, 1);
        ctx.lineTo(0, -5);
        ctx.lineTo(3.5, 1);
        ctx.lineTo(7, -3);
        ctx.lineTo(7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function iconSprite(kind: PlateKind, scale: number): HTMLCanvasElement {
    const sz = 48;
    const [c, ctx] = mk(sz * scale, sz * scale);
    ctx.scale(scale, scale);
    ctx.translate(sz / 2, sz / 2);
    // Preget: mørk skygge nede til høyre, lys kant oppe til venstre, gullflate.
    ctx.fillStyle = 'rgba(70,44,10,0.85)';
    ctx.save();
    ctx.translate(1.2, 1.4);
    drawIcon(ctx, kind);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,244,210,0.8)';
    ctx.save();
    ctx.translate(-0.8, -0.8);
    drawIcon(ctx, kind);
    ctx.restore();
    ctx.fillStyle = '#b8892c';
    drawIcon(ctx, kind);
    return c;
}

/** Lager (eller gjenbruker) de statiske lagene for en gitt oppløsning. */
export function buildArt(prev: Art | null, scale: number, lav: boolean): Art {
    const key = `${scale.toFixed(3)}-${lav}`;
    if (prev && prev.key === key) return prev;
    const make = (fn: (ctx: CanvasRenderingContext2D, r: Rng) => void, seed: number) => {
        const [c, ctx] = mk(W * scale, H * scale);
        ctx.scale(scale, scale);
        fn(ctx, seeded(seed));
        return c;
    };
    return {
        key,
        back: make((ctx, r) => drawBack(ctx, r, lav), 11),
        front: make((ctx, r) => drawFront(ctx, r, lav), 12),
        curtain: make((ctx, r) => drawCurtain(ctx, r), 13),
        storm: (() => {
            const [c, ctx] = mk(360 * scale, (STAGE.floorBack - STAGE.y0) * scale);
            ctx.scale(scale, scale);
            drawStormFlat(ctx, seeded(14));
            return c;
        })(),
        icons: {
            skip: iconSprite('skip', Math.max(1, scale)),
            monopol: iconSprite('monopol', Math.max(1, scale)),
            vapen: iconSprite('vapen', Math.max(1, scale)),
        },
    };
}
