import { seeded } from '../sim';

// LODDPOSEN - kunsten. Florentinsk intarsia (innlagt tre) tegnet i 2D-canvas.
//
// Én gang ved oppstart tegner vi seks treslag som små fliser med årer (støy og bølger som
// går rundt, så flisene kan legges side om side uten skjøt). Alt på bordet fylles med disse
// flisene, dreid i hver sin retning, slik intarsiamestrene la årene på tvers av hverandre.
// Hver bit får sandsvidd kant (mørk ytterst, lys midt i) og en tynn ebenholtlist rundt.

/** Treslagene i intarsiaen. «rød» er rødbeiset pære, «hvit» er kristtorn (det lyseste treet). */
export type Tre = 'valnøtt' | 'honning' | 'lønn' | 'ebenholt' | 'grønn' | 'blå' | 'rød' | 'hvit';

export const FARGE = {
    valnøtt: '#4a2c1a',
    honning: '#a8743f',
    lønn: '#ecd6a4',
    ebenholt: '#1c1410',
    rød: '#a8231c',
    gull: '#e0b23a',
    grønn: '#5d7a4e',
    blå: '#3e5068',
};

type RGB = [number, number, number];
const TRESLAG: Record<Tre, { base: RGB; mørk: RGB; lys: RGB; årer: number; seed: number }> = {
    valnøtt: { base: [74, 44, 26], mørk: [38, 21, 11], lys: [110, 70, 40], årer: 9, seed: 11 },
    honning: { base: [168, 116, 63], mørk: [118, 74, 36], lys: [204, 152, 92], årer: 7, seed: 23 },
    lønn: { base: [236, 214, 164], mørk: [204, 174, 118], lys: [250, 238, 206], årer: 12, seed: 37 },
    ebenholt: { base: [30, 21, 16], mørk: [14, 10, 8], lys: [58, 42, 32], årer: 16, seed: 41 },
    grønn: { base: [93, 122, 78], mørk: [58, 80, 48], lys: [128, 156, 106], årer: 10, seed: 53 },
    blå: { base: [62, 80, 104], mørk: [38, 50, 68], lys: [92, 112, 138], årer: 10, seed: 67 },
    rød: { base: [158, 40, 30], mørk: [104, 22, 16], lys: [196, 74, 54], årer: 9, seed: 71 },
    hvit: { base: [242, 236, 222], mørk: [214, 206, 188], lys: [253, 251, 245], årer: 13, seed: 83 },
};

const S = 256;
const TAU = Math.PI * 2;

/** Tegner én treflis med årer. Alle bølger har hele perioder over flisa, så den kan gjentas. */
function treflis(t: Tre): HTMLCanvasElement {
    const { base, mørk, lys, årer, seed } = TRESLAG[t];
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x2 = c.getContext('2d');
    if (!x2) return c;
    const img = x2.createImageData(S, S);
    const rng = seeded(seed);
    const p = Array.from({ length: 6 }, () => rng() * TAU);
    // Rad-støy: lange lyse og mørke strøk langs årene.
    const rad = new Float32Array(S);
    for (let y = 0; y < S; y++) rad[y] = rng();
    for (let k = 0; k < 3; k++) {
        const kopi = rad.slice();
        for (let y = 0; y < S; y++) rad[y] = (kopi[(y + S - 1) % S] + kopi[y] * 2 + kopi[(y + 1) % S]) / 4;
    }
    for (let y = 0; y < S; y++) {
        const v = y / S;
        for (let x = 0; x < S; x++) {
            const u = x / S;
            const bølge =
                0.035 * Math.sin(TAU * u + p[0]) +
                0.018 * Math.sin(TAU * 2 * u + p[1]) +
                0.01 * Math.sin(TAU * 5 * u + p[2]) +
                0.02 * Math.sin(TAU * 2 * v + p[3]) * Math.sin(TAU * u + p[4]);
            const ring = 0.5 + 0.5 * Math.sin(TAU * årer * (v + bølge) + 0.6 * Math.sin(TAU * 3 * v + p[5]));
            const å = Math.pow(ring, 2.4);
            const strøk = (rad[y] - 0.5) * 1.6;
            const korn = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            const i = (y * S + x) * 4;
            for (let ch = 0; ch < 3; ch++) {
                let c0 = base[ch] + (mørk[ch] - base[ch]) * å * 0.8 + (lys[ch] - base[ch]) * (1 - å) * 0.3;
                c0 += (lys[ch] - base[ch]) * strøk * 0.35 + korn * 5;
                img.data[i + ch] = Math.max(0, Math.min(255, c0));
            }
            img.data[i + 3] = 255;
        }
    }
    x2.putImageData(img, 0, 0);
    return c;
}

let FLISER: Record<Tre, HTMLCanvasElement> | null = null;
const MØNSTRE = new WeakMap<CanvasRenderingContext2D, Record<Tre, CanvasPattern>>();

/** Treslagene som mønstre for denne canvasen (flisene lages én gang). */
export function mønstre(ctx: CanvasRenderingContext2D): Record<Tre, CanvasPattern> {
    let m = MØNSTRE.get(ctx);
    if (m) return m;
    if (!FLISER) {
        FLISER = {} as Record<Tre, HTMLCanvasElement>;
        for (const t of Object.keys(TRESLAG) as Tre[]) FLISER[t] = treflis(t);
    }
    m = {} as Record<Tre, CanvasPattern>;
    for (const t of Object.keys(TRESLAG) as Tre[]) {
        const p = ctx.createPattern(FLISER[t], 'repeat');
        if (p) m[t] = p;
    }
    MØNSTRE.set(ctx, m);
    return m;
}

/** Et mønster med årene dreid `rot` grader og skalert `k`. */
export function tre(P: Record<Tre, CanvasPattern>, t: Tre, rot = 0, k = 1, ox = 0, oy = 0): CanvasPattern {
    const p = P[t];
    p.setTransform(new DOMMatrix().translateSelf(ox, oy).rotateSelf(rot).scaleSelf(k));
    return p;
}

/**
 * Én innlagt bit: tre med årer, sandsvidd kant og ebenholtlist.
 * `svi` er hvor bred den brente kanten er i verdensenheter.
 */
export function bit(
    ctx: CanvasRenderingContext2D,
    P: Record<Tre, CanvasPattern>,
    path: Path2D,
    t: Tre,
    rot = 0,
    svi = 10,
    list = 1.4,
    k = 1
) {
    ctx.fillStyle = tre(P, t, rot, k);
    ctx.fill(path);
    // Små biter får ikke sviing: klippingen koster mer enn den synes på en Chromebook.
    if (svi >= 4.5) {
        ctx.save();
        ctx.clip(path);
        ctx.strokeStyle = 'rgba(28,12,4,.22)';
        ctx.lineWidth = svi * 2;
        ctx.stroke(path);
        ctx.lineWidth = svi * 0.9;
        ctx.stroke(path);
        ctx.restore();
    }
    if (list > 0) {
        ctx.strokeStyle = FARGE.ebenholt;
        ctx.lineWidth = list;
        ctx.stroke(path);
    }
}

export function ellipse(x: number, y: number, rx: number, ry: number, rot = 0) {
    const p = new Path2D();
    p.ellipse(x, y, rx, ry, rot, 0, TAU);
    return p;
}
export function rekt(x: number, y: number, w: number, h: number, r = 0) {
    const p = new Path2D();
    if (r > 0) p.roundRect(x, y, w, h, r);
    else p.rect(x, y, w, h);
    return p;
}

/** Florin: gullmynt med lilje, sett ovenfra. */
export function florin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tilt = 0.55) {
    ctx.fillStyle = '#8a6618';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.22, r, r * tilt, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = FARGE.gull;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * tilt, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#7a5a12';
    ctx.lineWidth = Math.max(0.6, r * 0.12);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,200,.7)';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.25, y - r * 0.05);
    ctx.lineTo(x, y - r * 0.35);
    ctx.lineTo(x + r * 0.25, y - r * 0.05);
    ctx.stroke();
}

/** En lapp: lønneflak med seks røde Medici-kuler eller tre svarte Albizzi-ringer. */
export function lapp(
    ctx: CanvasRenderingContext2D,
    P: Record<Tre, CanvasPattern>,
    x: number,
    y: number,
    w: number,
    rot: number,
    venn: boolean | null,
    sx = 1
) {
    const h = w * 0.68;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, 1);
    const p = rekt(-w / 2, -h / 2, w, h, w * 0.06);
    ctx.fillStyle = 'rgba(20,10,4,.35)';
    ctx.translate(2, 3);
    ctx.fill(p);
    ctx.translate(-2, -3);
    bit(ctx, P, p, 'lønn', 90, w * 0.08, Math.max(0.8, w * 0.03), 0.4);
    if (venn === true) {
        // Seks palle i skjoldform: 3-2-1.
        const r = w * 0.075;
        const rader = [
            [-1, 0, 1],
            [-0.5, 0.5],
            [0],
        ];
        rader.forEach((rad, j) =>
            rad.forEach((i) => {
                ctx.fillStyle = FARGE.rød;
                ctx.beginPath();
                ctx.arc(i * w * 0.2, (j - 1) * h * 0.26, r, 0, TAU);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,220,200,.45)';
                ctx.beginPath();
                ctx.arc(i * w * 0.2 - r * 0.3, (j - 1) * h * 0.26 - r * 0.3, r * 0.35, 0, TAU);
                ctx.fill();
            })
        );
    } else if (venn === false) {
        ctx.strokeStyle = FARGE.ebenholt;
        ctx.lineWidth = w * 0.055;
        for (const [i, j] of [
            [-1, -0.6],
            [1, -0.6],
            [0, 0.6],
        ]) {
            ctx.beginPath();
            ctx.arc(i * w * 0.2, j * h * 0.3, w * 0.1, 0, TAU);
            ctx.stroke();
        }
    }
    ctx.restore();
}

/** Små innlagte bilder av kunstverkene (brukes på gavekortet, ved beundrerne og i studioloen). */
export function kunstbilde(
    ctx: CanvasRenderingContext2D,
    P: Record<Tre, CanvasPattern>,
    navn: string,
    x: number,
    y: number,
    s: number
) {
    ctx.save();
    ctx.translate(x, y);
    const u = s / 40;
    ctx.scale(u, u);
    bit(ctx, P, rekt(-20, -20, 40, 40, 3), 'valnøtt', 30, 5, 1.2, 0.3);
    ctx.lineJoin = 'round';
    if (navn.startsWith('Bøker')) {
        const b: [number, number, Tre][] = [
            [-13, 26, 'lønn'],
            [-6, 22, 'honning'],
            [1, 28, 'ebenholt'],
            [8, 24, 'lønn'],
        ];
        for (const [bx, bh, t] of b) bit(ctx, P, rekt(bx, 14 - bh, 6, bh), t, 90, 1.5, 0.8, 0.2);
        ctx.fillStyle = FARGE.gull;
        ctx.fillRect(1, -6, 6, 2);
        ctx.fillRect(-13, -4, 6, 2);
        ctx.fillStyle = FARGE.ebenholt;
        ctx.fillRect(-17, 14, 34, 3);
    } else if (navn.startsWith('Brunelleschi')) {
        const k = new Path2D();
        k.moveTo(-14, 10);
        k.bezierCurveTo(-14, -8, -4, -14, 0, -14);
        k.bezierCurveTo(4, -14, 14, -8, 14, 10);
        k.closePath();
        ctx.fillStyle = FARGE.rød;
        ctx.fill(k);
        ctx.strokeStyle = FARGE.lønn;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 10);
        ctx.moveTo(-6, -11);
        ctx.quadraticCurveTo(-9, 0, -8, 10);
        ctx.moveTo(6, -11);
        ctx.quadraticCurveTo(9, 0, 8, 10);
        ctx.stroke();
        bit(ctx, P, rekt(-3, -19, 6, 5), 'lønn', 0, 1, 0.8, 0.2);
        bit(ctx, P, rekt(-17, 10, 34, 6), 'lønn', 0, 1.5, 0.8, 0.2);
    } else if (navn.startsWith('Donatello')) {
        bit(ctx, P, rekt(-10, -18, 20, 34, 10), 'ebenholt', 0, 2, 0.8, 0.3);
        const f = new Path2D();
        f.arc(0, -9, 3.6, 0, TAU);
        f.moveTo(-4, -5);
        f.lineTo(4, -5);
        f.lineTo(3, 5);
        f.lineTo(5, 14);
        f.lineTo(1, 14);
        f.lineTo(0, 7);
        f.lineTo(-1, 14);
        f.lineTo(-5, 14);
        f.lineTo(-3, 5);
        f.closePath();
        bit(ctx, P, f, 'lønn', 90, 1, 0.8, 0.2);
        ctx.fillStyle = FARGE.gull;
        ctx.beginPath();
        ctx.ellipse(0, -12.5, 5.5, 1.6, 0, 0, TAU);
        ctx.fill();
    } else if (navn.startsWith('Ficino')) {
        const tak = new Path2D();
        tak.moveTo(-16, -8);
        tak.lineTo(0, -17);
        tak.lineTo(16, -8);
        tak.closePath();
        bit(ctx, P, tak, 'lønn', 0, 1.5, 0.8, 0.2);
        for (let i = 0; i < 4; i++) bit(ctx, P, rekt(-13 + i * 7.5, -6, 4, 18), 'lønn', 90, 1, 0.7, 0.2);
        bit(ctx, P, rekt(-17, 12, 34, 4), 'honning', 0, 1, 0.8, 0.2);
    } else if (navn.startsWith('Botticelli')) {
        ctx.fillStyle = FARGE.gull;
        ctx.fillRect(-16, -16, 32, 32);
        bit(ctx, P, rekt(-12, -12, 24, 24), 'blå', 0, 2, 0.8, 0.2);
        ctx.fillStyle = FARGE.lønn;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        for (let i = 0; i <= 6; i++) {
            const a = Math.PI + (i / 6) * Math.PI;
            ctx.lineTo(Math.cos(a) * 10, 10 + Math.sin(a) * 12);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = FARGE.honning;
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 6; i++) {
            const a = Math.PI + (i / 6) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.lineTo(Math.cos(a) * 10, 10 + Math.sin(a) * 12);
            ctx.stroke();
        }
    } else {
        // Unge Michelangelo: en marmorblokk med en figur på vei ut, og meiselen.
        bit(ctx, P, rekt(-14, -14, 22, 30, 1), 'lønn', 10, 2, 0.8, 0.2);
        ctx.strokeStyle = FARGE.valnøtt;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-3, -6, 3.5, 0, TAU);
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(-3, -3, 2, 0);
        ctx.lineTo(1, 12);
        ctx.stroke();
        ctx.save();
        ctx.translate(12, 2);
        ctx.rotate(0.6);
        bit(ctx, P, rekt(-2, -12, 4, 12), 'ebenholt', 90, 1, 0.6, 0.2);
        ctx.fillStyle = '#b8b0a0';
        ctx.fillRect(-1.2, 0, 2.4, 8);
        ctx.restore();
    }
    ctx.restore();
}
