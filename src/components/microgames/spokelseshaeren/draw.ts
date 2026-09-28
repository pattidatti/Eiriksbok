// Tegningen av Spøkelseshæren: et tysk svart-hvitt rekognoseringsfoto med
// fettstift oppå (se kunstbriefen i docs/microgames/briefer/spokelseshaeren.md).
//
// Selve flybildet (jorder, hekker, veier, byer, kyst og hav) tegnes ÉN gang til et
// canvas utenfor skjermen. Hvert bilde tegner bare det som beveger seg: tanker,
// skip, nett, fly, kameraruter og fettstift - pluss en korn-flis og en vignett.

import {
    BURST,
    DOVER,
    FRAME_H,
    FRAME_W,
    H,
    LONDON,
    NET_R,
    OK_MIN,
    W,
    coastY,
    isLand,
    planePos,
    shipCovered,
    upcomingFrames,
    dateLabel,
    END_DAY,
    DDAY,
    type Frame,
    zoneOf,
    type Game,
} from './game';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const INK = '#16140f';
export const PAPER = '#e6dfcd';
export const RED = '#d7372b';
export const YELLOW = '#f1c232';
export const MONO = "'Courier New', Courier, 'Liberation Mono', monospace";

export interface Transform {
    s: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
}

export function fit(w: number, h: number): Transform {
    // Bredt vindu (fullskjerm): fyll bredden og skjær litt av himmel og hav.
    // Smalt vindu (spalten): vis hele fotoet.
    const s = Math.max(Math.min(w / W, h / H), Math.min(w / W, h / (H * 0.88)));
    return { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2, w, h };
}

function prng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const gray = (v: number, a = 1) => {
    const c = Math.round(Math.max(0, Math.min(255, v)));
    // Litt varm sølvtone, som et fotopapir.
    return `rgba(${c + 6},${c + 3},${c - 4},${a})`;
};

// ---------------------------------------------------------------------------
// Flybildet (én gang)
// ---------------------------------------------------------------------------

export function makePhoto(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const r = prng(1944);

    // Hav
    const sea = ctx.createLinearGradient(0, 500, 0, H);
    sea.addColorStop(0, '#4d5154');
    sea.addColorStop(1, '#2b2e30');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(210,210,200,.07)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 900; i++) {
        const x = r() * W;
        const y = 480 + r() * 440;
        if (isLand(x, y)) continue;
        ctx.beginPath();
        ctx.arc(x, y, 6 + r() * 10, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
    }

    // Land
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    for (let x = W; x >= 0; x -= 8) ctx.lineTo(x, coastY(x));
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = gray(140);
    ctx.fillRect(0, 0, W, H);

    // Jorder: et skjevt rutenett, hver rute sin gråtone, noen med plogfurer.
    const cw = 66;
    const ch = 52;
    const cols = Math.ceil(W / cw) + 2;
    const rows = Math.ceil(H / ch) + 2;
    const pts: [number, number][][] = [];
    for (let j = 0; j < rows; j++) {
        pts[j] = [];
        for (let i = 0; i < cols; i++)
            pts[j][i] = [
                (i - 1) * cw + (r() - 0.5) * cw * 0.55,
                (j - 1) * ch + (r() - 0.5) * ch * 0.55,
            ];
    }
    for (let j = 0; j < rows - 1; j++)
        for (let i = 0; i < cols - 1; i++) {
            const q = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]];
            const v = 105 + r() * 90;
            ctx.fillStyle = gray(v);
            ctx.beginPath();
            q.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fill();
            if (r() < 0.45) {
                ctx.save();
                ctx.clip();
                const a = r() * Math.PI;
                const [cx, cy] = q[0];
                ctx.strokeStyle = gray(v + (r() < 0.5 ? 18 : -18), 0.55);
                ctx.lineWidth = 1;
                for (let k = -12; k < 12; k++) {
                    ctx.beginPath();
                    ctx.moveTo(
                        cx + Math.cos(a) * -120 + Math.sin(a) * k * 5,
                        cy + Math.sin(a) * -120 - Math.cos(a) * k * 5
                    );
                    ctx.lineTo(
                        cx + Math.cos(a) * 120 + Math.sin(a) * k * 5,
                        cy + Math.sin(a) * 120 - Math.cos(a) * k * 5
                    );
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    // Hekker med trær langs kantene
    for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
            const [x, y] = pts[j][i];
            for (const [nx, ny] of [pts[j]?.[i + 1], pts[j + 1]?.[i]].filter(Boolean) as [
                number,
                number,
            ][]) {
                if (r() < 0.2) continue;
                ctx.strokeStyle = 'rgba(38,36,32,.75)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nx, ny);
                ctx.stroke();
                const n = Math.floor(r() * 4);
                for (let k = 0; k < n; k++) {
                    const u = r();
                    const tx = x + (nx - x) * u;
                    const ty = y + (ny - y) * u;
                    const rr = 2.5 + r() * 3;
                    ctx.fillStyle = 'rgba(20,19,17,.55)';
                    ctx.beginPath();
                    ctx.arc(tx + 2, ty + 2, rr, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = gray(55 + r() * 25);
                    ctx.beginPath();
                    ctx.arc(tx, ty, rr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    // Skoger
    for (let k = 0; k < 16; k++) {
        const cx = r() * W;
        const cy = 40 + r() * 460;
        if (Math.abs(cx - LONDON.x) < 120 && Math.abs(cy - LONDON.y) < 90) continue;
        const n = 30 + Math.floor(r() * 50);
        for (let i = 0; i < n; i++) {
            const x = cx + (r() - 0.5) * 110;
            const y = cy + (r() - 0.5) * 60;
            const rr = 4 + r() * 5;
            ctx.fillStyle = 'rgba(16,15,13,.5)';
            ctx.beginPath();
            ctx.arc(x + 3, y + 2.5, rr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = gray(48 + r() * 30);
            ctx.beginPath();
            ctx.arc(x, y, rr, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Veier
    const road = (p: [number, number][]) => {
        for (const [wdt, col] of [
            [5, 'rgba(40,38,34,.5)'],
            [3, gray(215)],
        ] as [number, string][]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = wdt;
            ctx.beginPath();
            ctx.moveTo(p[0][0], p[0][1]);
            for (let i = 1; i < p.length - 1; i++) {
                const mx = (p[i][0] + p[i + 1][0]) / 2;
                const my = (p[i][1] + p[i + 1][1]) / 2;
                ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
            }
            ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
            ctx.stroke();
        }
    };
    road([
        [340, 480],
        [420, 380],
        [560, 300],
        [700, 230],
        [LONDON.x, LONDON.y],
    ]);
    road([
        [LONDON.x, LONDON.y],
        [960, 250],
        [1120, 330],
        [1300, 400],
        [1480, 520],
    ]);
    road([
        [LONDON.x, LONDON.y],
        [880, 120],
        [1060, 60],
        [1300, 40],
        [1600, 30],
    ]);
    road([
        [0, 300],
        [140, 360],
        [260, 420],
        [340, 480],
    ]);
    road([
        [1120, 330],
        [1160, 460],
        [1200, 560],
    ]);
    // Byer
    const town = (cx: number, cy: number, n: number, spread: number) => {
        for (let i = 0; i < n; i++) {
            const x = cx + (r() - 0.5) * spread;
            const y = cy + (r() - 0.5) * spread * 0.6;
            if (!isLand(x, y)) continue;
            const w = 5 + r() * 9;
            const h = 4 + r() * 6;
            ctx.fillStyle = 'rgba(15,14,12,.55)';
            ctx.fillRect(x + 2, y + 2, w, h);
            ctx.fillStyle = gray(r() < 0.5 ? 70 + r() * 30 : 175 + r() * 40);
            ctx.fillRect(x, y, w, h);
        }
    };
    town(LONDON.x, LONDON.y, 420, 190);
    town(360, 470, 160, 120);
    town(1490, 510, 90, 90);
    town(1180, 320, 40, 60);
    town(620, 330, 30, 50);
    ctx.restore();

    // Kyst: brenning og hvite klipper ved Dover.
    for (let x = 0; x < W; x += 3) {
        const y = coastY(x);
        const cliff = x > 1240;
        ctx.fillStyle = cliff ? gray(235) : gray(215, 0.85);
        ctx.fillRect(x, y - (cliff ? 12 : 3), 3.5, cliff ? 14 : 5 + r() * 3);
        ctx.fillStyle = 'rgba(230,228,220,.25)';
        ctx.fillRect(x, y + 4 + r() * 6, 3, 2);
    }
    // Brygger i Portsmouth
    ctx.fillStyle = gray(200);
    for (const [x, y, len] of [
        [250, 520, 40],
        [380, 500, 50],
        [520, 540, 44],
    ] as [number, number, number][]) {
        ctx.fillRect(x, coastY(x) - 4, 6, len);
        void y;
    }

    // Fettstift som aldri endrer seg: Dover-sonen og navnene.
    crayonRect(
        ctx,
        (DOVER.x0 + DOVER.x1) / 2,
        (DOVER.y0 + DOVER.y1 - 30) / 2,
        DOVER.x1 - DOVER.x0,
        DOVER.y1 - DOVER.y0 - 30,
        'rgba(241,194,50,.55)',
        3,
        11,
        [14, 10]
    );
    label(ctx, 'DOVER - HER STÅR «HÆREN»', DOVER.x0 + 12, DOVER.y0 + 20, YELLOW, 20, 'left');
    label(ctx, 'LONDON', LONDON.x, LONDON.y - 70, PAPER, 16);

    // Korn og vignett bakes inn i fotoet - billig på en Chromebook.
    const grain = makeGrain();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(grain, 'repeat') ?? 'transparent';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,7,6,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    return c;
}

/** Skyggen av en sky, tegnet én gang. */
export function makeCloud(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    const r = prng(7);
    for (let k = 0; k < 7; k++) {
        const x = 60 + r() * 136;
        const y = 50 + r() * 60;
        const g = ctx.createRadialGradient(x, y, 4, x, y, 60);
        g.addColorStop(0, 'rgba(8,8,8,.32)');
        g.addColorStop(1, 'rgba(8,8,8,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 160);
    }
    return c;
}

/** Filmkorn: en flis med støy som legges oppå med tilfeldig forskyvning. */
export function makeGrain(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.5 ? 0 : 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 60;
    }
    ctx.putImageData(img, 0, 0);
    return c;
}

// ---------------------------------------------------------------------------
// Fettstift
// ---------------------------------------------------------------------------

function crayonLine(
    ctx: CanvasRenderingContext2D,
    pts: [number, number][],
    color: string,
    width: number,
    seed: number,
    dash?: number[]
) {
    const r = prng(seed);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    for (let pass = 0; pass < 2; pass++) {
        ctx.lineWidth = width * (pass ? 0.55 : 1);
        ctx.globalAlpha = pass ? 0.5 : 0.9;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
            const jx = (r() - 0.5) * width * 0.6;
            const jy = (r() - 0.5) * width * 0.6;
            if (i) ctx.lineTo(x + jx, y + jy);
            else ctx.moveTo(x + jx, y + jy);
        });
        ctx.stroke();
    }
    ctx.restore();
}

function crayonCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rad: number,
    color: string,
    width: number,
    seed: number
) {
    const pts: [number, number][] = [];
    const r = prng(seed);
    const start = r() * Math.PI * 2;
    for (let a = 0; a <= Math.PI * 2.25; a += 0.3) {
        const k = 1 + (r() - 0.5) * 0.12 + (a > Math.PI * 2 ? 0.08 : 0);
        pts.push([x + Math.cos(start + a) * rad * k, y + Math.sin(start + a) * rad * k * 0.9]);
    }
    crayonLine(ctx, pts, color, width, seed + 7);
}

function crayonRect(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: string,
    width: number,
    seed: number,
    dash?: number[]
) {
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    crayonLine(
        ctx,
        [
            [x0, y0],
            [x0 + w, y0],
            [x0 + w, y0 + h],
            [x0, y0 + h],
            [x0, y0 - 2],
        ],
        color,
        width,
        seed,
        dash
    );
}

function label(
    ctx: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    color: string,
    size: number,
    align: CanvasTextAlign = 'center',
    rot = -0.04
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `bold ${size}px ${MONO}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.28;
    ctx.strokeStyle = 'rgba(15,14,12,.7)';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(t, 0, 0);
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Ting i verden
// ---------------------------------------------------------------------------

/**
 * Analytikerens stempel på bildet i det øyeblikket kameraet har tatt det. Dette er
 * fagkjernen i ett blikk: tyskerne trodde det bildet viste. Stempelet slår ned
 * (stort -> normalt) de første 0,25 sekundene.
 */
function stamp(ctx: CanvasRenderingContext2D, f: Frame, age: number) {
    if (f.verdict === 'noytral' || !f.verdict) return;
    const labels = f.marks.map((m) => m.label);
    const [text, col] =
        f.verdict === 'bra' && zoneOf(f.x, f.y) === 'ports'
            ? ['FLÅTE SKJULT', YELLOW]
            : f.verdict === 'bra'
              ? ['HÆR BEKREFTET', YELLOW]
              : f.verdict === 'ok'
                ? ['HÆR?', YELLOW]
                : labels.includes('SKIP!')
                  ? ['FLÅTE SETT!', RED]
                  : labels.includes('GUMMI?')
                    ? ['FALSK?', RED]
                    : ['TOMT!', RED];
    const pop = age < 0.25 ? 1.7 - (age / 0.25) * 0.7 : 1;
    ctx.save();
    ctx.translate(f.x, f.y + FRAME_H / 2 - 30);
    ctx.rotate(-0.1);
    ctx.scale(pop, pop);
    ctx.font = `900 ${text.length > 8 ? 26 : 32}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 22;
    ctx.fillStyle = 'rgba(20,18,15,.78)';
    ctx.fillRect(-w / 2, -21, w, 42);
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.strokeRect(-w / 2 + 4, -17, w - 8, 34);
    ctx.fillStyle = col;
    ctx.fillText(text, 0, 1);
    ctx.restore();
}

function drawTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fill: number,
    pumping: boolean,
    wobble: number,
    t: number,
    id: number
) {
    const f = Math.min(fill, 1.15);
    const ok = fill >= OK_MIN;
    const sc = (0.45 + 0.55 * Math.min(1, f)) * 1.85;
    const wob = pumping ? Math.sin(t * 22 + id) * 0.06 * wobble : 0;
    const ang = -0.35 + ((id * 0.37) % 0.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(sc * (1 + wob), sc * (1 - wob));
    // Slagskygge: en stiv tank kaster en skarp, lang skygge. En slapp har nesten ingen.
    const sh = ok ? 8 : 2 + 4 * f;
    ctx.fillStyle = `rgba(6,5,4,${ok ? 0.7 : 0.3})`;
    ctx.beginPath();
    ctx.roundRect(-17 + sh, -10 + sh * 0.8, 34, 20, 4);
    ctx.fill();
    if (!ok && !pumping) {
        // Slapp: rynket, lysere og uten form.
        ctx.fillStyle = gray(150);
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            const rr = (k % 2 ? 13 : 17) + Math.sin(k * 3.1 + id) * 2;
            ctx.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.7);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(30,28,25,.6)';
        ctx.lineWidth = 1.2;
        for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(k * 5 - 3, -7);
            ctx.lineTo(k * 5 + 2, 7);
            ctx.stroke();
        }
        ctx.strokeStyle = gray(80);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(4, 1);
        ctx.quadraticCurveTo(12, 6, 16, 10);
        ctx.stroke();
    } else {
        // Belter
        ctx.fillStyle = gray(38);
        ctx.fillRect(-17, -10, 34, 5);
        ctx.fillRect(-17, 5, 34, 5);
        // Skrog
        ctx.fillStyle = gray(ok ? 58 : 90);
        ctx.beginPath();
        ctx.roundRect(-15, -6.5, 30, 13, 2.5);
        ctx.fill();
        ctx.fillStyle = gray(ok ? 118 : 120, 0.8);
        ctx.fillRect(-14, -6, 28, 2);
        ctx.fillStyle = gray(ok ? 84 : 110);
        ctx.fillRect(-13, -4, 12, 9);
        // Tårn og kanon
        ctx.fillStyle = gray(ok ? 40 : 80);
        ctx.beginPath();
        ctx.arc(2, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = gray(ok ? 150 : 120, 0.55);
        ctx.beginPath();
        ctx.arc(0.5, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gray(ok ? 45 : 75);
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(24 * Math.min(1, f), 0);
        ctx.stroke();
        ctx.fillStyle = gray(150, 0.5);
        ctx.beginPath();
        ctx.arc(0, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawBurst(ctx: CanvasRenderingContext2D, x: number, y: number, id: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = gray(70, 0.9);
    const r = prng(id * 13);
    for (let k = 0; k < 7; k++) {
        const a = r() * Math.PI * 2;
        const d = 6 + r() * 14;
        ctx.beginPath();
        ctx.ellipse(
            Math.cos(a) * d,
            Math.sin(a) * d * 0.7,
            4 + r() * 6,
            2 + r() * 3,
            a,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    ctx.restore();
}

function drawShip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rot: number,
    len: number,
    t: number,
    wake: number
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (wake > 0) {
        ctx.strokeStyle = `rgba(235,232,222,${0.5 * wake})`;
        ctx.lineWidth = 2;
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.lineTo(-len / 2 - 60, s * 22);
            ctx.stroke();
        }
    }
    ctx.fillStyle = 'rgba(8,8,8,.45)';
    ctx.beginPath();
    ctx.ellipse(4, 4, len / 2, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gray(52);
    ctx.beginPath();
    ctx.moveTo(-len / 2, -7);
    ctx.lineTo(len / 2 - 8, -7);
    ctx.lineTo(len / 2, 0);
    ctx.lineTo(len / 2 - 8, 7);
    ctx.lineTo(-len / 2, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = gray(120);
    ctx.fillRect(-len / 2 + 5, -4, len * 0.5, 8);
    ctx.fillStyle = gray(190);
    ctx.fillRect(-len / 2 + 3, -3, 6, 6);
    for (let k = 0; k < 3; k++) ctx.fillRect(-len / 2 + 14 + k * 8, -2.5, 5, 5);
    ctx.restore();
    void t;
}

function drawNet(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dragging: boolean,
    rolled: boolean,
    id: number,
    t: number
) {
    const rad = rolled ? 26 : NET_R;
    ctx.save();
    ctx.translate(x, y);
    if (dragging) ctx.scale(1.06, 1.06);
    const r = prng(id * 31 + 5);
    // Skygge når nettet løftes
    if (dragging) {
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath();
        ctx.arc(8, 10, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        const rr = rad * (0.9 + r() * 0.12);
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.85);
    }
    ctx.closePath();
    ctx.fillStyle = rolled ? gray(96, 0.95) : gray(118, 0.93);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // Flekker i jordfarger og et maskenett
    for (let k = 0; k < (rolled ? 8 : 26); k++) {
        ctx.fillStyle = gray(70 + r() * 90, 0.7);
        ctx.beginPath();
        ctx.ellipse(
            (r() - 0.5) * rad * 1.8,
            (r() - 0.5) * rad * 1.5,
            6 + r() * 14,
            4 + r() * 8,
            r() * 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,20,18,.35)';
    ctx.lineWidth = 1;
    for (let k = -rad; k < rad; k += 7) {
        ctx.beginPath();
        ctx.moveTo(k, -rad);
        ctx.lineTo(k + rad, rad);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(k, rad);
        ctx.lineTo(k + rad, -rad);
        ctx.stroke();
    }
    ctx.restore();
    if (dragging || rolled) {
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 5]);
        ctx.lineDashOffset = -t * 20;
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();
}

function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
    // Skyggen på bakken, og flyet selv litt forskjøvet (det er høyt oppe).
    for (const [dx, dy, col, sc] of [
        [26, 22, 'rgba(8,8,8,.35)', 1],
        [0, 0, gray(40), 1.05],
    ] as [number, number, string, number][]) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.rotate(ang);
        ctx.scale(sc, sc);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-44, 2);
        ctx.lineTo(44, 2);
        ctx.lineTo(40, -6);
        ctx.lineTo(-40, -6);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-14, 18, 28, 5);
        ctx.beginPath();
        ctx.ellipse(-16, -4, 4, 11, 0, 0, Math.PI * 2);
        ctx.ellipse(16, -4, 4, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Hele bildet
// ---------------------------------------------------------------------------

export interface DrawAssets {
    photo: HTMLCanvasElement;
    cloud: HTMLCanvasElement;
}

// Veiene kolonnene kjører på (samme punkter som veiene i fotoet).
const CONVOYS: [number, number][][] = [
    [
        [340, 480],
        [420, 380],
        [560, 300],
        [700, 230],
        [LONDON.x, LONDON.y],
    ],
    [
        [LONDON.x, LONDON.y],
        [960, 250],
        [1120, 330],
        [1300, 400],
        [1480, 520],
    ],
    [
        [1120, 330],
        [1160, 460],
        [1200, 560],
    ],
];

function along(p: [number, number][], u: number): [number, number, number] {
    const n = p.length - 1;
    const f = u * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = f - i;
    const [x0, y0] = p[i];
    const [x1, y1] = p[i + 1];
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.atan2(y1 - y0, x1 - x0)];
}

export interface DrawState {
    shake: number;
    menu: boolean;
    hoverX: number | null;
    hoverY: number | null;
}

export function drawWorld(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    a: DrawAssets,
    st: DrawState
) {
    const { s, ox, oy, w, h } = tf;
    const T = g.t + (performance.now() / 1000) * (st.menu ? 1 : 0);
    // Lysbordet rundt fotoet
    ctx.fillStyle = '#1a1916';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    const sx = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 10 : 0;
    const sy = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 10 : 0;
    ctx.translate(ox + sx, oy + sy);
    ctx.scale(s, s);
    ctx.drawImage(a.photo, 0, 0, W, H);

    // Skyskygger som driver over landet - bildet lever selv når ingen trykker.
    for (let k = 0; k < 4; k++) {
        const cx = ((T * (16 + k * 5) + k * 520) % (W + 800)) - 400;
        const cy = 60 + k * 190 + Math.sin(T * 0.1 + k) * 30;
        ctx.drawImage(a.cloud, cx - 300, cy - 180, 600 + k * 60, 360);
    }

    // Storm: mørkere og regnstriper
    if (g.stormOn) {
        ctx.fillStyle = 'rgba(20,20,22,.22)';
        ctx.fillRect(0, 0, W, H);
    }

    // Dover-sonen i gul fettstift
    if (!g.fleetSailed)
        label(
            ctx,
            g.convoys ? 'PORTSMOUTH - FORSTERKNINGENE' : 'PORTSMOUTH - DEN EKTE FLÅTEN',
            40,
            395,
            PAPER,
            18,
            'left',
            0.02
        );

    // Kolonner av lastebiler på veiene: England er fullt av soldater på vei mot kysten.
    for (let k = 0; k < 9; k++) {
        const road = CONVOYS[k % CONVOYS.length];
        const u = (((T * 0.018 + k * 0.137) % 1) + 1) % 1;
        const [x, y, a] = along(road, u);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = 'rgba(8,8,8,.45)';
        ctx.fillRect(-7, -2, 16, 8);
        ctx.fillStyle = gray(45);
        ctx.fillRect(-9, -4, 16, 8);
        ctx.fillStyle = gray(150);
        ctx.fillRect(3, -3, 4, 6);
        ctx.restore();
    }

    // Skip
    for (const sh of g.ships) {
        const leave = sh.leaving;
        const x = sh.x + leave * leave * 10;
        const y = sh.y + leave * leave * 16;
        const wake = leave > 0 ? 1 : 1 - sh.arrive;
        ctx.globalAlpha = Math.min(1, sh.arrive * 1.5);
        drawShip(ctx, x, y, sh.rot + (leave > 0 ? 0.9 : 0), sh.len, T, wake);
        ctx.globalAlpha = 1;
    }
    // Nett
    if (!g.fleetSailed)
        g.nets.forEach((n, i) => {
            const covering = g.ships.some(
                (sh) => (n.x - sh.x) ** 2 + (n.y - sh.y) ** 2 < NET_R * NET_R
            );
            drawNet(ctx, n.x, n.y, n.dragging, !covering && !n.dragging && isLand(n.x, n.y), i, T);
        });
    // Udekkede skip får en diskret gul markering, så eleven ser hva som ligger åpent.
    if (!g.fleetSailed && !st.menu)
        for (const sh of g.ships)
            if (sh.arrive > 0.6 && !shipCovered(g, sh)) {
                ctx.strokeStyle = `rgba(215,55,43,${0.55 + 0.35 * Math.sin(T * 6)})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(sh.x, sh.y, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

    // Tanker
    for (const t of g.tanks) {
        if (t.burst > 0) drawBurst(ctx, t.x, t.y, t.id);
        else drawTank(ctx, t.x, t.y, t.fill, t.pumping, t.wobble, T, t.id);
    }
    // Ring rundt tanken som pumpes: grå -> gul (slipp nå) -> rød (sprekker).
    for (const t of g.tanks) {
        if (!t.pumping || t.burst !== 0) continue;
        const R = 44;
        const frac = Math.min(1, t.fill / BURST);
        ctx.lineWidth = 7;
        ctx.strokeStyle = 'rgba(15,14,12,.6)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, R, 0, Math.PI * 2);
        ctx.stroke();
        // Den gule sonen
        ctx.strokeStyle = 'rgba(241,194,50,.35)';
        ctx.beginPath();
        ctx.arc(
            t.x,
            t.y,
            R,
            -Math.PI / 2 + (OK_MIN / BURST) * Math.PI * 2,
            -Math.PI / 2 + (1.06 / BURST) * Math.PI * 2
        );
        ctx.stroke();
        ctx.strokeStyle = t.fill < OK_MIN ? PAPER : t.fill < 1.06 ? YELLOW : RED;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
    }

    // Telegrammet fra Garbo
    if (g.telegram) {
        const tg = g.telegram;
        const pulse = 1 + 0.05 * Math.sin(T * 7);
        ctx.save();
        ctx.translate(tg.x, tg.y);
        ctx.rotate(-0.05);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        ctx.fillRect(-58, -30, 124, 68);
        ctx.fillStyle = PAPER;
        ctx.fillRect(-64, -36, 124, 68);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3;
        ctx.strokeRect(-64, -36, 124, 68);
        ctx.fillStyle = INK;
        ctx.font = `bold 15px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText('TELEGRAM', -2, -14);
        ctx.font = `bold 20px ${MONO}`;
        ctx.fillStyle = RED;
        ctx.fillText('GARBO', -2, 8);
        ctx.fillStyle = INK;
        ctx.fillRect(-52, 20, 100 * (tg.life / 11), 5);
        ctx.restore();
    }

    // Flyruter, kameraruter og fly
    const up = upcomingFrames(g);
    for (const p of g.planes) {
        const pos = planePos(p);
        const ex = p.x0 + p.dx * p.len;
        const ey = p.y0 + p.dy * p.len;
        if (p.s < p.len) {
            crayonLine(
                ctx,
                [
                    [pos.x, pos.y],
                    [ex, ey],
                ],
                `rgba(215,55,43,${p.warn > 0 ? 0.5 + 0.4 * Math.sin(T * 10) : 0.75})`,
                4,
                p.id,
                [18, 12]
            );
            // Pilspiss der flyet kommer inn i bildet
            const ay = Math.min(H - 30, Math.max(pos.y, 40));
            const ax = pos.x + (ay - pos.y) * (p.dx / p.dy);
            if (pos.y > H - 20) {
                crayonLine(
                    ctx,
                    [
                        [ax - 16, ay + 14],
                        [ax, ay - 6],
                        [ax + 16, ay + 14],
                    ],
                    RED,
                    5,
                    p.id + 3
                );
            }
        }
        for (const f of p.frames) {
            if (!f.taken) continue;
            if (f.shownFor <= 0) continue;
            const al = Math.min(1, f.shownFor / 0.8);
            ctx.globalAlpha = al;
            const col = f.verdict === 'mistanke' ? RED : f.verdict === 'noytral' ? PAPER : YELLOW;
            crayonRect(
                ctx,
                f.x,
                f.y,
                FRAME_W,
                FRAME_H,
                col,
                f.verdict === 'mistanke' ? 5 : 3.5,
                p.id * 7 + Math.floor(f.x)
            );
            for (const m of f.marks) {
                crayonCircle(ctx, m.x, m.y, m.r, RED, 5, Math.floor(m.x * 3 + m.y));
                // «TOMT» står allerede i stempelet; de andre merkene peker ut hvilken tank eller hvilket skip.
                if (m.label !== 'TOMT')
                    label(ctx, m.label, m.x + m.r + 6, m.y - m.r, RED, 22, 'left', -0.08);
            }
            stamp(ctx, f, 2.6 - f.shownFor);
            ctx.globalAlpha = 1;
        }
        if (p.warn <= 0 && p.s < p.len)
            drawPlane(ctx, pos.x, pos.y, Math.atan2(p.dy, p.dx) + Math.PI / 2);
    }
    // Kommende kameraruter: gule stiplede rammer med nedtelling. Bare flyet som kommer
    // først, vises for fullt - de andre er svake, så eleven ser hva som haster.
    const firstPlane = up.length ? up.reduce((a, b) => (b.eta < a.eta ? b : a)).p.id : -1;
    for (const u of up) {
        const { f, eta } = u;
        ctx.globalAlpha = u.p.id === firstPlane ? 1 : 0.35;
        const soon = eta < 1.6;
        const col = soon
            ? `rgba(241,194,50,${0.7 + 0.3 * Math.sin(T * 14)})`
            : 'rgba(241,194,50,.8)';
        crayonRect(
            ctx,
            f.x,
            f.y,
            FRAME_W,
            FRAME_H,
            col,
            soon ? 4 : 3,
            Math.floor(f.x * 5 + f.y),
            [16, 9]
        );
        // Hjørnemerker som i en kamerasøker
        ctx.save();
        ctx.fillStyle = 'rgba(15,14,12,.72)';
        ctx.fillRect(f.x - FRAME_W / 2 + 6, f.y - FRAME_H / 2 + 6, 46, 26);
        ctx.fillStyle = YELLOW;
        ctx.font = `bold 20px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(eta)}s`, f.x - FRAME_W / 2 + 29, f.y - FRAME_H / 2 + 20);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Blits når kameraet tar bildet
    for (const fx of g.fx)
        if (fx.kind === 'flash') {
            ctx.fillStyle = `rgba(255,252,240,${0.55 * (1 - fx.t / fx.life)})`;
            ctx.fillRect(fx.x - FRAME_W / 2, fx.y - FRAME_H / 2, FRAME_W, FRAME_H);
        }

    // Pekeren ved Dover: en svak ring der en ny tank vil havne.
    if (st.hoverX !== null && st.hoverY !== null && g.hold.kind === 'none' && !st.menu) {
        const hx = st.hoverX;
        const hy = st.hoverY;
        if (hx > DOVER.x0 && hx < DOVER.x1 && hy > DOVER.y0 && isLand(hx, hy)) {
            ctx.strokeStyle = 'rgba(241,194,50,.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hx, hy, 22, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    if (g.stormOn) {
        ctx.strokeStyle = 'rgba(220,220,215,.18)';
        ctx.lineWidth = 1.5;
        const r = prng(Math.floor(T * 20));
        for (let k = 0; k < 90; k++) {
            const x = r() * W;
            const y = r() * H;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 14, y + 30);
            ctx.stroke();
        }
    }
    // Referansemerker i kanten av fotoet, som på et ekte luftbilde
    ctx.strokeStyle = 'rgba(240,236,224,.7)';
    ctx.lineWidth = 3;
    for (const [fx0, fy0] of [
        [W / 2, 52],
        [W / 2, H - 14],
        [14, H / 2],
        [W - 14, H / 2],
    ]) {
        ctx.beginPath();
        ctx.moveTo(fx0 - 12, fy0);
        ctx.lineTo(fx0 + 12, fy0);
        ctx.moveTo(fx0, fy0 - 12);
        ctx.lineTo(fx0, fy0 + 12);
        ctx.stroke();
    }
    ctx.save();
    ctx.translate(26, H / 2 + 150);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `bold 15px ${MONO}`;
    ctx.fillStyle = 'rgba(240,236,224,.75)';
    ctx.fillText('RB 50/30 · 3000 M · SÜDENGLAND · GEHEIM', 0, 0);
    ctx.restore();
    ctx.restore();
}

// ---------------------------------------------------------------------------
// HUD: filmkanten, Rommels kart, manometeret og telleren
// ---------------------------------------------------------------------------

export function drawHud(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    st: { mult: number }
) {
    const { w, h } = tf;
    const u = Math.max(0.72, Math.min(1.25, Math.min(w / 1366, h / 768) * 1.1));

    // Filmkanten øverst
    const bh = 40 * u;
    ctx.fillStyle = '#0d0c0a';
    ctx.fillRect(0, 0, w, bh);
    ctx.fillStyle = '#26241f';
    for (let x = 8; x < w; x += 22 * u) ctx.fillRect(x, 4 * u, 11 * u, 7 * u);
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${22 * u}px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = PAPER;
    const date = `${dateLabel(g.day).toUpperCase()} 1944`;
    ctx.fillText(date, 14 * u, bh * 0.62);
    const dw = ctx.measureText(date).width;
    ctx.font = `bold ${15 * u}px ${MONO}`;
    ctx.fillStyle = g.day >= DDAY ? YELLOW : '#a9a291';
    const left = Math.max(0, Math.ceil(END_DAY - g.day));
    const goal =
        g.day < DDAY
            ? `D-DAGEN OM ${Math.ceil(DDAY - g.day)} DAGER`
            : `HOLD UT: ${left} DAGER TIL 25. JULI`;
    ctx.fillText(goal, 30 * u + dw, bh * 0.62);
    // Framdrift som en filmrull
    const px0 = 30 * u + dw + ctx.measureText(goal).width + 18 * u;
    const px1 = w - 120 * u;
    if (px1 - px0 > 60) {
        ctx.fillStyle = '#3a3730';
        ctx.fillRect(px0, bh * 0.52, px1 - px0, 5 * u);
        const ddx = px0 + ((px1 - px0) * DDAY) / END_DAY;
        ctx.fillStyle = PAPER;
        ctx.fillRect(px0, bh * 0.52, ((px1 - px0) * g.day) / END_DAY, 5 * u);
        ctx.fillStyle = RED;
        ctx.fillRect(ddx - 1.5, bh * 0.3, 3, bh * 0.5);
        ctx.font = `bold ${11 * u}px ${MONO}`;
        ctx.fillStyle = '#a9a291';
        ctx.textAlign = 'center';
        ctx.fillText('D', ddx, bh * 0.2);
    }

    // Rommels kart nede til høyre (over Kanalen)
    const cw = 250 * u;
    const ch = 150 * u;
    const cx = w - cw - 14 * u;
    const cy = h - ch - 14 * u;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.012);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(5 * u, 6 * u, cw, ch);
    ctx.fillStyle = '#e9e1cc';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, cw, ch);
    ctx.fillStyle = INK;
    ctx.font = `bold ${13 * u}px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText('ROMMELS KART', 10 * u, 16 * u);
    const kickT = g.kick.t;
    if (kickT < 1.4 && g.kick.d !== 0) {
        ctx.globalAlpha = Math.min(1, (1.4 - kickT) * 2);
        ctx.fillStyle = g.kick.d < 0 ? '#2f6b2f' : RED;
        ctx.font = `bold ${14 * u}px ${MONO}`;
        ctx.textAlign = 'right';
        ctx.fillText(g.kick.d < 0 ? 'TROR PÅ CALAIS' : 'TVILER ...', cw - 10 * u, ch - 10 * u);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }
    // Kysten av Frankrike
    ctx.strokeStyle = '#6d675a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8 * u, 64 * u);
    ctx.quadraticCurveTo(70 * u, 52 * u, 110 * u, 62 * u);
    ctx.quadraticCurveTo(170 * u, 70 * u, 205 * u, 40 * u);
    ctx.lineTo(cw - 8 * u, 30 * u);
    ctx.stroke();
    const nX = 62 * u;
    const nY = 64 * u;
    const kX = 206 * u;
    const kY = 44 * u;
    ctx.font = `bold ${12 * u}px ${MONO}`;
    ctx.fillStyle = g.tro > 0.6 ? RED : INK;
    ctx.textAlign = 'center';
    ctx.fillText('NORMANDIE', nX, nY + 18 * u);
    ctx.fillStyle = g.tro < 0.45 ? '#2f6b2f' : INK;
    ctx.fillText('CALAIS', kX - 6 * u, kY + 18 * u);
    // Reservene: en boks med stridsvogner som pila går ut fra.
    const rX = 150 * u;
    const rY = 118 * u;
    // Hvert flybilde rykker i pila: tyskerne leste bildene, og troen flyttet seg.
    const kick = kickT < 0.9 ? g.kick.d * 3 * Math.cos(kickT * 14) * (1 - kickT / 0.9) : 0;
    const tro = clamp01(g.troShown + kick);
    const tipX = kX + (nX - kX) * tro;
    const tipY = kY + (nY - kY) * tro;
    ctx.fillStyle = INK;
    ctx.fillRect(rX - 26 * u, rY - 12 * u, 52 * u, 24 * u);
    ctx.fillStyle = PAPER;
    ctx.font = `bold ${10 * u}px ${MONO}`;
    ctx.fillText('RESERVER', rX, rY + 4 * u);
    // Pila
    const ang = Math.atan2(tipY - (rY - 12 * u), tipX - rX);
    ctx.strokeStyle = tro > 0.66 ? RED : tro > 0.4 ? '#b8862a' : '#2f6b2f';
    ctx.lineWidth = 6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rX, rY - 12 * u);
    ctx.lineTo(tipX, tipY + 6 * u);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(tipX + Math.cos(ang) * 10 * u, tipY + 6 * u + Math.sin(ang) * 10 * u);
    ctx.lineTo(tipX + Math.cos(ang + 2.4) * 14 * u, tipY + 6 * u + Math.sin(ang + 2.4) * 14 * u);
    ctx.lineTo(tipX + Math.cos(ang - 2.4) * 14 * u, tipY + 6 * u + Math.sin(ang - 2.4) * 14 * u);
    ctx.closePath();
    ctx.fill();
    // Tekst under
    ctx.textAlign = 'right';
    ctx.font = `bold ${12 * u}px ${MONO}`;
    ctx.fillStyle = tro > 0.66 ? RED : INK;
    const tt = tro < 0.4 ? 'VENTER VED CALAIS' : tro < 0.66 ? 'USIKRE' : 'SNUR MOT NORMANDIE!';
    ctx.fillText(tt, cw - 8 * u, 16 * u);
    ctx.restore();

    // Manometeret: lufta i kompressoren
    const mR = 38 * u;
    const mX = 14 * u + mR + 4 * u;
    const mY = h - mR - 18 * u;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.arc(mX + 4, mY + 5, mR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9e1cc';
    ctx.beginPath();
    ctx.arc(mX, mY, mR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let k = 0; k <= 8; k++) {
        const a = Math.PI * 0.75 + (k / 8) * Math.PI * 1.5;
        ctx.lineWidth = k % 4 === 0 ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(mX + Math.cos(a) * mR * 0.72, mY + Math.sin(a) * mR * 0.72);
        ctx.lineTo(mX + Math.cos(a) * mR * 0.88, mY + Math.sin(a) * mR * 0.88);
        ctx.stroke();
    }
    ctx.strokeStyle = RED;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mX, mY, mR * 0.8, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 0.3);
    ctx.stroke();
    const na = Math.PI * 0.75 + g.air * Math.PI * 1.5;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mX, mY);
    ctx.lineTo(mX + Math.cos(na) * mR * 0.78, mY + Math.sin(na) * mR * 0.78);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(mX, mY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${11 * u}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('LUFT', mX, mY + mR * 0.5);

    // Telleren: bilder som lurte tyskerne
    const tX = mX + mR + 18 * u;
    ctx.textAlign = 'left';
    ctx.font = `bold ${30 * u}px ${MONO}`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(12,11,9,.85)';
    const sc = Math.floor(g.score).toLocaleString('nb-NO');
    ctx.strokeText(sc, tX, h - 42 * u);
    ctx.fillStyle = PAPER;
    ctx.fillText(sc, tX, h - 42 * u);
    ctx.font = `bold ${13 * u}px ${MONO}`;
    ctx.strokeText('POENG', tX, h - 18 * u);
    ctx.fillStyle = '#b9b2a1';
    ctx.fillText('POENG', tX, h - 18 * u);
    if (st.mult > 1) {
        const mw = ctx.measureText('POENG').width;
        ctx.fillStyle = YELLOW;
        ctx.fillRect(tX + mw + 10 * u, h - 30 * u, 44 * u, 22 * u);
        ctx.fillStyle = INK;
        ctx.font = `bold ${16 * u}px ${MONO}`;
        ctx.fillText(`×${st.mult}`, tX + mw + 16 * u, h - 19 * u);
    }
}
