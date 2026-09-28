// Tegningen i Spøkelseshæren: et tysk rekognoseringsfoto fra 1944. Sølvkorn i
// gråtoner, lange skygger mot nordvest fra morgensola, fotoanalytikerens røde og
// hvite fettstift, og spillerens egne planmerker i britisk blått.
//
// Landskapet tegnes én gang til en egen canvas. Per bilde tegnes bare det som
// beveger seg, pluss korn og vignett fra ferdige fliser.

import {
    ENGLAND,
    FRANCE,
    MAST,
    PLACES,
    VIEW,
    WIGHT,
    WORLD_H,
    WORLD_W,
    type Pt,
} from './geo';
import {
    HALF_W,
    TELEGRAM,
    POP_AFTER,
    TAUT,
    clamp,
    mulberry,
    planePos,
    willSee,
    type Dummy,
    type Game,
    type Unit,
} from './game';

export const C = {
    black: '#161714',
    field: '#7b7d74',
    light: '#d3d1c4',
    sea: '#3e4442',
    red: '#c8321f',
    white: '#f2ecd9',
    blue: '#4f86c6',
};

export interface Layout {
    s: number;
    ox: number;
    oy: number;
}

/** Hele kartet i bildet, sentrert. Resten blir filmkant. */
export function layout(W: number, H: number): Layout {
    const s = Math.min(W / VIEW.w, H / VIEW.h);
    return { s, ox: (W - VIEW.w * s) / 2 - VIEW.x * s, oy: (H - VIEW.h * s) / 2 - VIEW.y * s };
}

/** Figurene tegnes større enn kartet, så de kan leses på en Chromebook. */
const K = 1.45;

export function toScreen(L: Layout, x: number, y: number) {
    return { x: L.ox + x * L.s, y: L.oy + y * L.s };
}

export function toWorld(L: Layout, x: number, y: number) {
    return { x: (x - L.ox) / L.s, y: (y - L.oy) / L.s };
}

// ---------- Landskapet (én gang) ----------

function landPath(ctx: CanvasRenderingContext2D, line: Pt[], top: boolean) {
    ctx.beginPath();
    ctx.moveTo(line[0][0], line[0][1]);
    for (const [x, y] of line) ctx.lineTo(x, y);
    const edge = top ? -60 : WORLD_H + 60;
    ctx.lineTo(line[line.length - 1][0], edge);
    ctx.lineTo(line[0][0], edge);
    ctx.closePath();
}

function polyPath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.closePath();
}

const gray = (v: number, a = 1) => {
    const n = Math.round(clamp(v, 0, 1) * 255);
    // Litt varm sølvtone, som et gammelt fotopapir.
    return `rgba(${n + 4},${n + 3},${Math.max(0, n - 4)},${a})`;
};

function fields(ctx: CanvasRenderingContext2D, rnd: () => number, x0: number, y0: number, x1: number, y1: number, base: number) {
    // Åkerlapper med hekker mellom: rader med ulik høyde og åkrer med ulik bredde, som ekte teiger.
    for (let gy = y0; gy < y1; ) {
        const rowH = 34 + rnd() * 40;
        for (let gx = x0; gx < x1; ) {
            const cw = 30 + rnd() * 70;
            const jx = (rnd() - 0.5) * 8;
            const jy = (rnd() - 0.5) * 8;
            const w = cw + 4;
            const h = rowH * (0.9 + rnd() * 0.3);
            const cx = gx;
            gx += cw;
            const v = base + (rnd() - 0.5) * 0.24;
            ctx.save();
            ctx.translate(cx + jx, gy + jy);
            ctx.rotate((rnd() - 0.5) * 0.18);
            ctx.fillStyle = gray(v);
            ctx.fillRect(0, 0, w, h);
            if (rnd() < 0.35) {
                // Pløyd mark: tette striper.
                ctx.strokeStyle = gray(v - 0.08, 0.55);
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let k = 3; k < w; k += 4) {
                    ctx.moveTo(k, 0);
                    ctx.lineTo(k, h);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(30,31,27,.42)';
            ctx.lineWidth = 2.2;
            ctx.strokeRect(0, 0, w, h);
            ctx.restore();
        }
        gy += rowH;
    }
}

function woods(ctx: CanvasRenderingContext2D, rnd: () => number, n: number, x0: number, y0: number, x1: number, y1: number) {
    for (let i = 0; i < n; i++) {
        const cx = x0 + rnd() * (x1 - x0);
        const cy = y0 + rnd() * (y1 - y0);
        const r = 14 + rnd() * 30;
        for (let k = 0; k < r * 1.6; k++) {
            const a = rnd() * Math.PI * 2;
            const d = rnd() * r;
            const x = cx + Math.cos(a) * d;
            const y = cy + Math.sin(a) * d * 0.7;
            // Trekrone med skygge mot nordvest.
            ctx.fillStyle = 'rgba(22,23,20,.5)';
            ctx.beginPath();
            ctx.arc(x - 3, y - 3, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = gray(0.3 + rnd() * 0.08);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function town(ctx: CanvasRenderingContext2D, rnd: () => number, cx: number, cy: number, n: number, spread: number) {
    for (let i = 0; i < n; i++) {
        const x = cx + (rnd() - 0.5) * spread;
        const y = cy + (rnd() - 0.5) * spread * 0.7;
        const w = 4 + rnd() * 6;
        const h = 3 + rnd() * 5;
        ctx.fillStyle = 'rgba(22,23,20,.55)';
        ctx.fillRect(x - 2, y - 2, w, h);
        ctx.fillStyle = gray(0.84 + rnd() * 0.1);
        ctx.fillRect(x, y, w, h);
    }
}

function road(ctx: CanvasRenderingContext2D, pts: Pt[], w = 3) {
    ctx.strokeStyle = gray(0.8, 0.85);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
}

export function makeBackground(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = WORLD_W;
    cv.height = WORLD_H;
    const ctx = cv.getContext('2d')!;
    const rnd = mulberry(1944);

    // Havet: mørk sølvgrå med små krusninger.
    const sg = ctx.createLinearGradient(0, 560, 0, 820);
    sg.addColorStop(0, '#454b49');
    sg.addColorStop(1, '#353b3a');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.strokeStyle = 'rgba(220,220,205,.07)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 900; i++) {
        const x = rnd() * WORLD_W;
        const y = 540 + rnd() * 320;
        const l = 4 + rnd() * 12;
        ctx.moveTo(x, y);
        ctx.lineTo(x + l, y + 0.6);
    }
    ctx.stroke();

    // Grunt vann langs kysten: lysere bånd.
    for (const [line, dir] of [
        [ENGLAND, 1],
        [FRANCE, -1],
    ] as [Pt[], number][]) {
        for (let k = 3; k >= 1; k--) {
            ctx.strokeStyle = `rgba(190,190,176,${0.05 * (4 - k)})`;
            ctx.lineWidth = k * 9;
            ctx.beginPath();
            line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dir * k * 2) : ctx.moveTo(x, y)));
            ctx.stroke();
        }
    }

    // England.
    ctx.save();
    landPath(ctx, ENGLAND, true);
    ctx.clip();
    ctx.fillStyle = gray(0.52);
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    fields(ctx, rnd, -30, -30, WORLD_W + 30, 640, 0.55);
    woods(ctx, rnd, 20, 0, 60, WORLD_W, 560);
    road(ctx, [[438, 590], [470, 480], [620, 330], [860, 190], [1080, 80]], 3.5);
    road(ctx, [[1372, 552], [1300, 430], [1200, 300], [1120, 170], [1080, 80]], 3.5);
    road(ctx, [[60, 500], [250, 540], [438, 590]]);
    road(ctx, [[438, 590], [700, 560], [980, 540], [1180, 500], [1372, 552]]);
    road(ctx, [[1186, 300], [1300, 330], [1460, 300]], 2.5);
    road(ctx, [[250, 540], [300, 380], [420, 260], [640, 200]], 2.5);
    town(ctx, rnd, 438, 574, 60, 70);
    town(ctx, rnd, 330, 548, 34, 50);
    town(ctx, rnd, 1360, 530, 40, 56);
    town(ctx, rnd, 1080, 70, 140, 150);
    town(ctx, rnd, 1260, 380, 24, 44);
    town(ctx, rnd, 780, 470, 22, 40);
    ctx.restore();

    // Dovers hvite klipper.
    ctx.strokeStyle = gray(0.93);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ENGLAND.filter(([x]) => x > 1300 && x < 1440).forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y - 3) : ctx.moveTo(x, y - 3)
    );
    ctx.stroke();

    // Isle of Wight.
    ctx.save();
    polyPath(ctx, WIGHT);
    ctx.clip();
    ctx.fillStyle = gray(0.5);
    ctx.fillRect(390, 620, 120, 50);
    fields(ctx, rnd, 390, 620, 510, 670, 0.52);
    ctx.restore();

    // Frankrike: litt mørkere og disigere, lenger unna.
    ctx.save();
    landPath(ctx, FRANCE, false);
    ctx.clip();
    ctx.fillStyle = gray(0.46);
    ctx.fillRect(0, 600, WORLD_W, 400);
    fields(ctx, rnd, -30, 660, WORLD_W + 30, WORLD_H + 30, 0.48);
    woods(ctx, rnd, 10, 0, 780, WORLD_W, 900);
    town(ctx, rnd, 1456, 740, 40, 50);
    town(ctx, rnd, 1400, 760, 20, 34);
    town(ctx, rnd, 180, 740, 30, 40);
    town(ctx, rnd, 720, 820, 26, 40);
    ctx.fillStyle = 'rgba(62,68,66,.16)';
    ctx.fillRect(0, 600, WORLD_W, 400);
    ctx.restore();

    // Veien panserreservene må kjøre: fra Calais langs kysten til Normandie.
    road(ctx, PANZER_ROAD, 3);

    // Brenningene langs kysten.
    ctx.strokeStyle = 'rgba(236,232,216,.7)';
    ctx.lineWidth = 2;
    for (const line of [ENGLAND, FRANCE, [...WIGHT, WIGHT[0]]]) {
        ctx.beginPath();
        line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
    }
    return cv;
}

/** Kystveien i Frankrike, fra Calais (0) til Normandie (1). */
export const PANZER_ROAD: Pt[] = [
    [1470, 770], [1380, 790], [1240, 800], [1080, 812], [920, 824], [760, 846], [600, 856], [440, 866],
];

function along(pts: Pt[], t: number): Pt {
    const segs: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        segs.push(l);
        total += l;
    }
    let d = clamp(t, 0, 1) * total;
    for (let i = 0; i < segs.length; i++) {
        if (d <= segs[i]) {
            const k = d / segs[i];
            return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
        }
        d -= segs[i];
    }
    return pts[pts.length - 1];
}

// ---------- Korn og vignett (ferdige fliser) ----------

export function makeGrain(): HTMLCanvasElement[] {
    const tiles: HTMLCanvasElement[] = [];
    for (let k = 0; k < 4; k++) {
        const cv = document.createElement('canvas');
        cv.width = 160;
        cv.height = 160;
        const ctx = cv.getContext('2d')!;
        const img = ctx.createImageData(160, 160);
        const rnd = mulberry(77 + k * 13);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = rnd() < 0.5 ? 0 : 255;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = Math.floor(rnd() * 34);
        }
        ctx.putImageData(img, 0, 0);
        tiles.push(cv);
    }
    return tiles;
}

// ---------- Figurer ----------

function rotFor(id: number) {
    return ((id * 47) % 7) * 0.22 - 0.6;
}

function drawTank(ctx: CanvasRenderingContext2D, d: Dummy, t: number, pumping: boolean) {
    const air = d.popped > 0 ? 0 : d.air;
    const taut = air >= TAUT;
    const h = air; // høyde over bakken - gir skyggen
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(K, K);
    ctx.rotate(rotFor(d.id));
    if (pumping) {
        const w = Math.sin(t * 40) * 0.03 * (d.over > 0 ? 3 : 1);
        ctx.scale(1 + w, 1 - w);
    }
    const sq = 0.45 + air * 0.55; // en slapp tank flyter utover
    const spread = 1 + (1 - air) * 0.35;
    if (d.kind === 'baat') {
        // Falsk landgangsbåt i Dover havn.
        if (taut) {
            ctx.fillStyle = 'rgba(16,17,15,.5)';
            ctx.fillRect(-26 - 7 * h, -8 - 7 * h, 52, 16);
        }
        ctx.fillStyle = taut ? gray(0.72) : gray(0.64);
        ctx.beginPath();
        ctx.moveTo(-26 * spread, -7 * sq);
        ctx.lineTo(20 * spread, -7 * sq);
        ctx.lineTo(27 * spread, 0);
        ctx.lineTo(20 * spread, 7 * sq);
        ctx.lineTo(-26 * spread, 7 * sq);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = gray(0.45);
        ctx.fillRect(-20 * spread, -4 * sq, 32 * spread, 8 * sq);
    } else if (d.kind === 'fly') {
        if (taut) {
            ctx.fillStyle = 'rgba(16,17,15,.5)';
            ctx.save();
            ctx.translate(-8 * h, -8 * h);
            planeShape(ctx, 1);
            ctx.restore();
        }
        ctx.fillStyle = taut ? gray(0.9) : gray(0.66);
        planeShape(ctx, sq * 0.4 + 0.6);
    } else {
        // Gummistridsvogn: skrog, belter, tårn og kanon.
        if (taut) {
            ctx.fillStyle = 'rgba(16,17,15,.55)';
            ctx.fillRect(-19 - 9 * h, -12 - 9 * h, 38, 24);
            ctx.beginPath();
            ctx.arc(-9 * h, -9 * h, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = gray(taut ? 0.16 : 0.55);
        ctx.fillRect(-19 * spread, -12 * sq * spread, 38 * spread, 5 * sq);
        ctx.fillRect(-19 * spread, 12 * sq * spread - 5 * sq, 38 * spread, 5 * sq);
        ctx.fillStyle = taut ? gray(0.3) : gray(0.66);
        ctx.fillRect(-16 * spread, -8 * sq, 32 * spread, 16 * sq);
        ctx.fillStyle = taut ? gray(0.5) : gray(0.72);
        ctx.beginPath();
        ctx.ellipse(-1, 0, 8 * spread, 7 * sq, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gray(taut ? 0.14 : 0.55);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        if (taut) ctx.lineTo(28, 0);
        else ctx.quadraticCurveTo(16, 2, 22, 9); // kanonen henger
        ctx.stroke();
    }
    if (!taut && d.popped === 0) {
        // Rynker i gummien - det analytikeren ser etter.
        ctx.strokeStyle = 'rgba(40,40,36,.55)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let k = -2; k <= 2; k++) {
            ctx.moveTo(k * 6 - 3, -8);
            ctx.quadraticCurveTo(k * 6 + 2, 0, k * 6 - 2, 8);
        }
        ctx.stroke();
    }
    if (d.popped > 0) {
        // Sprukket: filler på bakken.
        ctx.fillStyle = gray(0.6);
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            const r = 14 + ((k * 7) % 5) * 3;
            ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.8);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function planeShape(ctx: CanvasRenderingContext2D, k: number) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * k, 3.6 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2 * k, 0, 4.5 * k, 26 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-21 * k, -8 * k, 4 * k, 16 * k);
}

function gaugeRing(ctx: CanvasRenderingContext2D, d: Dummy, t: number, danger: boolean, pumping: boolean) {
    const r = 44;
    const air = d.popped > 0 ? 0 : d.air;
    ctx.save();
    ctx.translate(d.x, d.y);
    // Bakgrunnsring.
    ctx.strokeStyle = 'rgba(242,236,217,.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (d.popped > 0) {
        ctx.restore();
        return;
    }
    const slack = air < TAUT;
    const pulse = slack ? 0.55 + 0.45 * Math.sin(t * (danger ? 16 : 7)) : 1;
    ctx.strokeStyle = slack ? `rgba(200,50,31,${pulse})` : d.over > 0 ? C.white : C.blue;
    ctx.lineWidth = pumping ? 7 : 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(air, 0, 1));
    ctx.stroke();
    // Merke der tanken blir stram.
    const a = -Math.PI / 2 + Math.PI * 2 * TAUT;
    ctx.strokeStyle = C.black;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
    ctx.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
    ctx.stroke();
    if (d.over > 0) {
        // Full - og eleven pumper fortsatt: rødt varsel om at den smeller.
        const k = d.over / POP_AFTER;
        ctx.strokeStyle = `rgba(200,50,31,${0.4 + k * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 8 + Math.sin(t * 30) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, t: number, danger: boolean) {
    const fade = u.leaving > 0 ? clamp(1 - u.leaving / 2.5, 0, 1) : clamp(u.age * 2, 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(u.x, u.y);
    if (u.leaving > 0) ctx.translate(0, u.leaving * 22); // mot havna
    ctx.scale(K, K);
    ctx.rotate(rotFor(u.id) * 0.5);
    if (u.kind === 'skip') {
        for (let k = 0; k < 2; k++) {
            const y = k * 14 - 7;
            ctx.fillStyle = 'rgba(16,17,15,.55)';
            ctx.fillRect(-28 - 5, y - 5 - 5, 56, 10);
            ctx.fillStyle = gray(0.28);
            ctx.beginPath();
            ctx.moveTo(-28, y - 5);
            ctx.lineTo(22, y - 5);
            ctx.lineTo(30, y);
            ctx.lineTo(22, y + 5);
            ctx.lineTo(-28, y + 5);
            ctx.fill();
            ctx.fillStyle = gray(0.55);
            ctx.fillRect(-10, y - 2, 12, 4);
        }
    } else {
        const rows = 3;
        const cols = u.kind === 'biler' ? 5 : 4;
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                const x = (c - (cols - 1) / 2) * 10;
                const y = (r - 1) * 11;
                ctx.fillStyle = 'rgba(16,17,15,.6)';
                if (u.kind === 'biler') {
                    ctx.fillRect(x - 5, y - 4, 8, 4);
                    ctx.fillStyle = gray(0.22);
                    ctx.fillRect(x - 3, y - 2, 8, 4);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(x - 6, y - 6);
                    ctx.lineTo(x + 3, y - 3);
                    ctx.lineTo(x - 3, y + 3);
                    ctx.fill();
                    ctx.fillStyle = gray(0.86);
                    ctx.fillRect(x - 3, y - 3, 6, 6);
                }
            }
    }
    // Kamuflasjenettet: et rutete nett med flekker som ligner åkeren rundt.
    if (u.covered) {
        const k = u.net;
        const rw = 30 * k;
        const rh = 22 * k;
        ctx.fillStyle = gray(0.5, 0.92);
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(22,23,20,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -34; i <= 34; i += 5) {
            ctx.moveTo(i - 24, -24);
            ctx.lineTo(i + 24, 24);
            ctx.moveTo(i + 24, -24);
            ctx.lineTo(i - 24, 24);
        }
        ctx.stroke();
        ctx.fillStyle = gray(0.36, 0.8);
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(((i * 13) % 36) - 18, ((i * 7) % 24) - 12, 4 * k, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
    if (!u.covered && u.leaving === 0) {
        // Spillerens eget planmerke: ekte tropper som ligger åpne.
        const p = 0.5 + 0.5 * Math.sin(t * (danger ? 14 : 5));
        ctx.strokeStyle = danger ? `rgba(200,50,31,${0.5 + p * 0.5})` : `rgba(79,134,198,${0.55 + p * 0.45})`;
        ctx.lineWidth = danger ? 5 : 4;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(u.x, u.y, 50 + p * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, k = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    // Tomotors rekognoseringsfly sett ovenfra.
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 * k, 4.5 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4 * k, -40 * k);
    ctx.lineTo(10 * k, -40 * k);
    ctx.lineTo(6 * k, 40 * k);
    ctx.lineTo(0, 40 * k);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(2 * k, -18 * k, 16 * k, 5 * k);
    ctx.fillRect(2 * k, 13 * k, 16 * k, 5 * k);
    ctx.fillRect(-28 * k, -11 * k, 5 * k, 22 * k);
    ctx.restore();
}

export interface Mark {
    x: number;
    y: number;
    good: boolean;
    word: string;
    life: number;
}

export interface RenderState {
    bg: HTMLCanvasElement;
    grain: HTMLCanvasElement[];
    marks: Mark[];
    shake: number;
    flash: number;
    frame: number;
    radioRings: number[];
    /** Fremkalte flyfoto: små fotokort med tyskernes tolkning. */
    prints: { x: number; y: number; delta: number; good: number; bad: number; life: number }[];
    /** 0-1 i sluttsekvensen etter seier: pilene mot Normandie. */
    landing: number;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = C.white, align: CanvasTextAlign = 'center') {
    ctx.font = `700 ${size}px "Courier New", ui-monospace, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(22,23,20,.8)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

export function render(ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number, g: Game, R: RenderState, menu: boolean) {
    const L = layout(W, H);
    const t = g.t;
    R.frame++;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Filmkanten rundt bildet.
    ctx.fillStyle = '#0d0e0c';
    ctx.fillRect(0, 0, W, H);

    // Perforering i filmkanten når det er plass til den.
    const mx = L.ox + VIEW.x * L.s;
    if (mx > 22) {
        ctx.fillStyle = '#2a2b27';
        for (let y = 10; y < H; y += 34) {
            ctx.fillRect(mx / 2 - 8, y, 16, 20);
            ctx.fillRect(W - mx / 2 - 8, y, 16, 20);
        }
    }
    let sx = 0;
    let sy = 0;
    if (R.shake > 0) {
        sx = (Math.random() - 0.5) * R.shake * 10;
        sy = (Math.random() - 0.5) * R.shake * 10;
    }
    ctx.setTransform(dpr * L.s, 0, 0, dpr * L.s, dpr * (L.ox + sx), dpr * (L.oy + sy));
    ctx.drawImage(R.bg, 0, 0);

    // Stedsnavn i hvit fettstift.
    label(ctx, 'DOVER', PLACES.dover[0], PLACES.dover[1] + 4, 18);
    label(ctx, 'PORTSMOUTH', PLACES.portsmouth[0] + 10, PLACES.portsmouth[1] + 44, 18);
    label(ctx, 'LONDON', PLACES.london[0], PLACES.london[1] + 50, 16);
    label(ctx, 'CALAIS', PLACES.calais[0] - 10, PLACES.calais[1] + 4, 20);
    label(ctx, 'NORMANDIE', PLACES.normandie[0], PLACES.normandie[1] - 4, 20);

    // Panserreservene: der tyskerne tror angrepet kommer.
    const pz = g.panzer;
    for (let i = 0; i < 5; i++) {
        const [x, y] = along(PANZER_ROAD, clamp(pz, 0, 1) * 0.86 + i * 0.03);
        ctx.fillStyle = 'rgba(16,17,15,.55)';
        ctx.fillRect(x - 19, y - 14, 32, 18);
        ctx.fillStyle = C.black;
        ctx.fillRect(x - 14, y - 9, 32, 18);
        ctx.beginPath();
        ctx.arc(x + 1, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#44453e';
        ctx.fill();
        ctx.strokeStyle = C.black;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x - 28, y);
        ctx.stroke();
    }
    const [px, py] = along(PANZER_ROAD, clamp(pz, 0, 1) * 0.86 + 0.06);
    label(ctx, 'PANZERRESERVEN', px + 40, py + 30, 17, pz > 0.45 ? C.red : C.white);

    // Flyrutene: varsel først, så kamerastripa.
    for (const pl of g.planes) {
        const ang = Math.atan2(pl.by - pl.ay, pl.bx - pl.ax);
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        if (pl.t < 0.02) {
            // Varsel: analytikerens planlagte rute i rød fettstift.
            const a = 0.5 + 0.5 * Math.sin(t * 12);
            ctx.fillStyle = `rgba(200,50,31,${0.07 + 0.05 * a})`;
            ctx.beginPath();
            ctx.moveTo(pl.ax + nx * HALF_W, pl.ay + ny * HALF_W);
            ctx.lineTo(pl.bx + nx * HALF_W, pl.by + ny * HALF_W);
            ctx.lineTo(pl.bx - nx * HALF_W, pl.by - ny * HALF_W);
            ctx.lineTo(pl.ax - nx * HALF_W, pl.ay - ny * HALF_W);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = `rgba(200,50,31,${0.55 + 0.4 * a})`;
            ctx.lineWidth = 4;
            ctx.setLineDash([18, 12]);
            ctx.lineDashOffset = -t * 60;
            ctx.beginPath();
            ctx.moveTo(pl.ax, pl.ay);
            ctx.lineTo(pl.bx, pl.by);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(200,50,31,.45)';
            for (const sgn of [1, -1]) {
                ctx.beginPath();
                ctx.moveTo(pl.ax + nx * HALF_W * sgn, pl.ay + ny * HALF_W * sgn);
                ctx.lineTo(pl.bx + nx * HALF_W * sgn, pl.by + ny * HALF_W * sgn);
                ctx.stroke();
            }
        }
    }

    // Figurene.
    const danger = (x: number, y: number) => g.planes.some((pl) => willSee(pl, x, y) !== null);
    for (const u of g.units) if (u.active) drawUnit(ctx, u, t, danger(u.x, u.y));
    for (const d of g.dummies) {
        if (!d.active) continue;
        const pumping = g.pump === d.id;
        drawTank(ctx, d, t, pumping);
        if (!menu) gaugeRing(ctx, d, t, danger(d.x, d.y), pumping);
        if (pumping && R.frame % 3 === 0) {
            R.marks.push({ x: d.x + (Math.random() - 0.5) * 30, y: d.y - 20, good: true, word: '', life: 0.5 });
        }
    }

    // Radiosenderen i Kent.
    ctx.save();
    ctx.translate(MAST[0], MAST[1]);
    ctx.strokeStyle = 'rgba(22,23,20,.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [dx, dy] of [[-22, -18], [22, -18], [-22, 18], [22, 18]]) {
        ctx.moveTo(0, 0);
        ctx.lineTo(dx, dy);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(16,17,15,.6)';
    ctx.fillRect(-32, -12, 34, 6);
    ctx.fillStyle = gray(0.85);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    const r = g.radio;
    if (r.on || r.warn > 0) {
        const a = 0.5 + 0.5 * Math.sin(t * 10);
        ctx.strokeStyle = `rgba(200,50,31,${0.5 + a * 0.5})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(MAST[0], MAST[1], 38 + a * 6, 0, Math.PI * 2);
        ctx.stroke();
        // Tyskernes lyttestasjon ved Calais peiler mot Kent.
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = t * 40;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1500, 740);
        ctx.lineTo(MAST[0] + 30, MAST[1] + 30);
        ctx.stroke();
        ctx.setLineDash([]);
        if (r.on) label(ctx, `SEND ${r.taps}/5`, MAST[0], MAST[1] - 56, 20, C.red);
    }
    for (let i = R.radioRings.length - 1; i >= 0; i--) {
        const k = R.radioRings[i];
        ctx.strokeStyle = `rgba(79,134,198,${1 - k})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(MAST[0], MAST[1], 20 + k * 120, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Flyet og kamerastripa over bakken.
    for (const pl of g.planes) {
        if (pl.t < 0) continue;
        const ang = Math.atan2(pl.by - pl.ay, pl.bx - pl.ax);
        const p = planePos(pl);
        if (pl.t <= 1) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(ang);
            ctx.fillStyle = 'rgba(242,236,217,.14)';
            ctx.fillRect(-40, -HALF_W, 80, HALF_W * 2);
            ctx.strokeStyle = 'rgba(242,236,217,.9)';
            ctx.lineWidth = 4;
            const q = 22;
            for (const [cx, cy, dx, dy] of [
                [-40, -HALF_W, 1, 1],
                [40, -HALF_W, -1, 1],
                [-40, HALF_W, 1, -1],
                [40, HALF_W, -1, -1],
            ]) {
                ctx.beginPath();
                ctx.moveTo(cx + dx * q, cy);
                ctx.lineTo(cx, cy);
                ctx.lineTo(cx, cy + dy * q);
                ctx.stroke();
            }
            ctx.restore();
        }
        // Flyets skygge langt under, og selve flyet.
        ctx.fillStyle = 'rgba(16,17,15,.35)';
        drawPlane(ctx, p.x + 40, p.y + 30, ang, 1.1);
        ctx.fillStyle = 'rgba(22,23,20,.92)';
        drawPlane(ctx, p.x, p.y, ang, 1.3);
    }

    // Fettstift-merkene etter hvert bilde.
    for (let i = R.marks.length - 1; i >= 0; i--) {
        const m = R.marks[i];
        if (!m.word) {
            // Luftpuff fra pumpa.
            ctx.fillStyle = `rgba(242,236,217,${m.life})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y - (0.5 - m.life) * 40, 4 + (0.5 - m.life) * 10, 0, Math.PI * 2);
            ctx.fill();
            continue;
        }
        const a = clamp(m.life, 0, 1);
        ctx.strokeStyle = m.good ? `rgba(242,236,217,${a})` : `rgba(200,50,31,${a})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, 40, 32, -0.2, 0.3, Math.PI * 2.1);
        ctx.stroke();
        if (!m.good) {
            ctx.beginPath();
            ctx.moveTo(m.x - 20, m.y - 20);
            ctx.lineTo(m.x + 20, m.y + 20);
            ctx.moveTo(m.x + 20, m.y - 20);
            ctx.lineTo(m.x - 20, m.y + 20);
            ctx.stroke();
        }
        ctx.globalAlpha = a;
        label(ctx, m.word, m.x + 44, m.y - 34, 17, m.good ? C.white : C.red, 'left');
        ctx.globalAlpha = 1;
    }

    // Garbos telegram: et gult skjema som vibrerer til det blir sendt.
    const gb = g.garbo;
    if (gb.offer > 0 || gb.pending) {
        const [tx, ty] = TELEGRAM;
        const wob = gb.offer > 0 ? Math.sin(t * 18) * 2 : 0;
        ctx.save();
        ctx.translate(tx + wob, ty);
        ctx.rotate(-0.06);
        ctx.fillStyle = 'rgba(16,17,15,.5)';
        ctx.fillRect(-72, -38, 150, 84);
        ctx.fillStyle = gb.pending ? '#cfc7ae' : '#efe6c4';
        ctx.fillRect(-78, -46, 150, 84);
        ctx.strokeStyle = C.black;
        ctx.lineWidth = 2;
        ctx.strokeRect(-78, -46, 150, 84);
        ctx.fillStyle = C.black;
        ctx.font = '700 15px "Courier New", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TELEGRAM', -3, -26);
        ctx.font = '700 12px "Courier New", ui-monospace, monospace';
        ctx.fillText(gb.pending ? 'SENDT. VENTER PÅ' : 'GARBO: «PATTON', -3, -6);
        ctx.fillText(gb.pending ? 'NESTE FLYFOTO' : 'STÅR VED DOVER»', -3, 10);
        if (gb.offer > 0) {
            // Tiden til telegrammet går ut.
            ctx.fillStyle = C.blue;
            ctx.fillRect(-70, 24, 134 * (gb.offer / 7), 6);
        }
        ctx.restore();
    }

    // Seier: de ekte troppene krysser mot Normandie.
    if (R.landing > 0) {
        ctx.strokeStyle = C.blue;
        ctx.fillStyle = C.blue;
        ctx.lineWidth = 7;
        for (const [x0, y0, x1, y1] of [
            [330, 610, 300, 800],
            [420, 640, 400, 806],
            [500, 630, 480, 812],
            [560, 630, 560, 806],
        ]) {
            const k = clamp(R.landing * 1.4 - (x0 - 330) / 600, 0, 1);
            const ex = x0 + (x1 - x0) * k;
            const ey = y0 + (y1 - y0) * k;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ex, ey + 12);
            ctx.lineTo(ex - 10, ey - 4);
            ctx.lineTo(ex + 10, ey - 4);
            ctx.fill();
        }
    }

    // Blitsen når kameraet tar et bilde.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (R.flash > 0) {
        ctx.fillStyle = `rgba(242,236,217,${R.flash * 0.22})`;
        ctx.fillRect(0, 0, W, H);
    }

    // De fremkalte bildene legger seg i nedre venstre hjørne, over Normandie.
    R.prints.forEach((pr, i) => {
        const n = R.prints.length - 1 - i;
        const a = clamp(pr.life, 0, 1) * clamp((4.5 - pr.life) * 4, 0, 1);
        const pw = Math.min(170, W * 0.14);
        const ph = pw * 0.72;
        const px = 18 + n * 16;
        const py = H - ph - 22 - n * 10;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(px + pw / 2, py + ph / 2);
        ctx.rotate(-0.05 + n * 0.04);
        ctx.fillStyle = '#ece6d2';
        ctx.fillRect(-pw / 2 - 6, -ph / 2 - 6, pw + 12, ph + 30);
        // Utsnitt av landskapet der flyet tok bildet.
        const sw = 360;
        const sh = sw * (ph / pw);
        ctx.drawImage(R.bg, clamp(pr.x - sw / 2, 0, WORLD_W - sw), clamp(pr.y - sh / 2, 0, WORLD_H - sh), sw, sh, -pw / 2, -ph / 2, pw, ph);
        ctx.fillStyle = 'rgba(40,40,36,.25)';
        ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        const txt = pr.bad > 0 ? 'NORMANDIE?' : pr.good > 0 ? 'ARMEE BEI DOVER' : 'NICHTS';
        ctx.font = '700 13px "Courier New", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = pr.bad > 0 ? C.red : C.black;
        ctx.fillText(txt, 0, ph / 2 + 12);
        const d = Math.round(pr.delta);
        ctx.save();
        ctx.rotate(-0.25);
        ctx.strokeStyle = d >= 0 ? C.blue : C.red;
        ctx.fillStyle = d >= 0 ? C.blue : C.red;
        ctx.lineWidth = 3;
        ctx.strokeRect(-46, -16, 92, 32);
        ctx.font = '700 18px "Courier New", ui-monospace, monospace';
        ctx.fillText(d >= 0 ? `CALAIS +${d}` : `CALAIS ${d}`, 0, 6);
        ctx.restore();
        ctx.restore();
    });

    // Sølvkorn: en av fire fliser, forskjøvet hvert bilde.
    const tile = R.grain[R.frame % 4];
    const pat = ctx.createPattern(tile, 'repeat');
    if (pat) {
        const ox = (R.frame * 37) % 160;
        const oy = (R.frame * 53) % 160;
        ctx.save();
        ctx.translate(-ox, -oy);
        ctx.fillStyle = pat;
        ctx.fillRect(ox, oy, W + 160, H + 160);
        ctx.restore();
    }
    // Ujevn fremkalling: lysere midt, mørkere kanter.
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.48, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,8,6,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    // En og annen ripe i filmen.
    if (R.frame % 23 < 2) {
        ctx.strokeStyle = 'rgba(236,232,216,.18)';
        ctx.lineWidth = 1;
        const x = ((R.frame * 131) % 997) / 997 * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 6, H);
        ctx.stroke();
    }
}

/** Oppdater kortlivede effekter (merker, rist, blits). */
export function stepEffects(R: RenderState, dt: number) {
    for (const m of R.marks) m.life -= dt * (m.word ? 0.45 : 1.6);
    R.marks = R.marks.filter((m) => m.life > 0);
    R.shake = Math.max(0, R.shake - dt * 2.5);
    R.flash = Math.max(0, R.flash - dt * 4);
    R.radioRings = R.radioRings.map((k) => k + dt * 1.4).filter((k) => k < 1);
    for (const p of R.prints) p.life -= dt;
    R.prints = R.prints.filter((p) => p.life > 0).slice(-3);
}

