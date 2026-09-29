// Tegning for Seinen snur: Bayeux-teppet. Brodert ullgarn på ubleket lin - flate
// fargefelt, synlige sting langs kantene, skip i profil med stripete seil og
// dragehoder, bølger som bølgete linjer, og en borde med årstall og poeng.
//
// Det som ikke endrer seg (lin, land, elv, trær) tegnes én gang til en canvas utenfor
// skjermen. Hvert bilde tegner bare skip, landsbyer, piler og gnister oppå.

import {
    winchAt,
    ANGER_MAX,
    CHESTS_PER_LIFE,
    H,
    HP,
    KING_U,
    MAX_LAND,
    P1,
    PARIS_Y,
    RAM_V,
    ROUEN_Y,
    SILVER_PER_LAND,
    LAND,
    VOLLEY_R,
    VOLLEY_T,
    W,
    riverHalf,
    riverX,
    speedOf,
    type Boat,
    type Game,
} from './game';

export const INK = '#2d3553';
export const LINEN = '#e9dcbf';
export const LINEN_DARK = '#d9c8a2';
export const TERRA = '#a64a2e';
export const OCHRE = '#c99531';
export const TEAL = '#3e6b64';
export const TEAL_LIGHT = '#6f978c';
export const SAGE = '#7d8a57';
export const KING = '#3b4f8f';
export const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

/** Høyden på teppets borde øverst og nederst (i kartets piksler). */
export const BORDER = 40;

export interface Transform {
    s: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
}
export function fit(w: number, h: number): Transform {
    const s = Math.min(w / W, h / H);
    return { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2, w, h };
}

// ---------------------------------------------------------------- partikler

interface Bit {
    kind: 'coin' | 'splinter' | 'splash' | 'smoke' | 'thread';
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number;
    life: number;
    r: number;
    c: string;
}

export interface DrawAssets {
    bg: HTMLCanvasElement;
    bits: Bit[];
    facing: Map<number, number>;
    t: number;
    rnd: () => number;
}

function seeded(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Gnister, sølv og spon. Bare pynt - spillreglene vet ingenting om dem. */
export function burst(a: DrawAssets, kind: 'ram' | 'silver' | 'wreck' | 'splash' | 'smoke', x: number, y: number) {
    const r = a.rnd;
    const add = (b: Omit<Bit, 't'>) => {
        if (a.bits.length < 260) a.bits.push({ ...b, t: 0 });
    };
    if (kind === 'silver')
        for (let i = 0; i < 14; i++) {
            const ang = -Math.PI / 2 + (r() - 0.5) * 2.2;
            const v = 120 + r() * 200;
            add({ kind: 'coin', x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 1 + r() * 0.5, r: 4 + r() * 2, c: r() < 0.5 ? OCHRE : '#e5e0cf' });
        }
    if (kind === 'ram' || kind === 'wreck') {
        const n = kind === 'wreck' ? 16 : 9;
        for (let i = 0; i < n; i++) {
            const ang = r() * Math.PI * 2;
            const v = 80 + r() * 180;
            add({ kind: 'splinter', x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 0.6 + r() * 0.5, r: 5 + r() * 6, c: r() < 0.5 ? '#6b4a2b' : TERRA });
        }
    }
    if (kind === 'ram' || kind === 'splash' || kind === 'wreck')
        for (let i = 0; i < 6; i++)
            add({ kind: 'splash', x: x + (r() - 0.5) * 30, y: y + (r() - 0.5) * 20, vx: 0, vy: 0, life: 0.5 + r() * 0.3, r: 8 + r() * 10, c: '#dbe7df' });
    if (kind === 'smoke')
        for (let i = 0; i < 8; i++)
            add({ kind: 'smoke', x: x + (r() - 0.5) * 20, y, vx: (r() - 0.5) * 16, vy: -30 - r() * 30, life: 1.4 + r() * 0.8, r: 6 + r() * 6, c: '#8b8578' });
}

// ---------------------------------------------------------------- bakgrunn

/** Et sting-strøk: en stiplet linje med korte, litt skjeve sting. */
function stitch(ctx: CanvasRenderingContext2D, color: string, width: number, dash = [7, 4]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
}

function riverPath(ctx: CanvasRenderingContext2D, k = 1, from = -20, to = H + 20) {
    ctx.beginPath();
    for (let y = from; y <= to; y += 8) ctx.lineTo(riverX(y) - riverHalf(y) * k, y);
    for (let y = to; y >= from; y -= 8) ctx.lineTo(riverX(y) + riverHalf(y) * k, y);
    ctx.closePath();
}

function bank(ctx: CanvasRenderingContext2D, side: number, k = 1) {
    ctx.beginPath();
    for (let y = -20; y <= H + 20; y += 8) ctx.lineTo(riverX(y) + side * riverHalf(y) * k, y);
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, r: () => number) {
    // Bayeux-trær: en stamme som krøller seg ut i flettede greiner.
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h);
    ctx.stroke();
    const cols = [SAGE, TERRA, TEAL_LIGHT, OCHRE];
    for (let i = 0; i < 3; i++) {
        const yy = -h * (0.45 + i * 0.22);
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(0, yy);
            ctx.bezierCurveTo(side * h * 0.35, yy - h * 0.1, side * h * 0.42, yy - h * 0.34, side * h * 0.16, yy - h * 0.3);
            ctx.lineWidth = 5;
            ctx.strokeStyle = cols[Math.floor(r() * cols.length)];
            ctx.stroke();
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = INK;
            ctx.stroke();
        }
    }
    ctx.restore();
}

function makeBackground(): HTMLCanvasElement {
    const S = 1.5;
    const c = document.createElement('canvas');
    c.width = W * S;
    c.height = H * S;
    const ctx = c.getContext('2d')!;
    ctx.scale(S, S);
    const r = seeded(911);

    // Lin: ubleket stoff med vev og små fiberflekker.
    ctx.fillStyle = LINEN;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#6b5a3a';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 2600; i++) ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1);
    ctx.globalAlpha = 1;

    // Marker langs elva: salviegrønne felt med skrå sting.
    for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let y = -20; y <= H + 20; y += 8) ctx.lineTo(riverX(y) + side * (riverHalf(y) + 120 + 30 * Math.sin(y / 70)), y);
        for (let y = H + 20; y >= -20; y -= 8) ctx.lineTo(riverX(y) + side * (riverHalf(y) + 6), y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(125,138,87,.28)';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(94,108,62,.35)';
        ctx.lineWidth = 1.5;
        for (let k = -H; k < W + H; k += 9) {
            ctx.beginPath();
            ctx.moveTo(k, 0);
            ctx.lineTo(k - H * 0.5, H);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Elva: blågrønt ullgarn med bølgelinjer, og en stingkant langs breddene.
    riverPath(ctx);
    ctx.fillStyle = TEAL;
    ctx.fill();
    ctx.save();
    riverPath(ctx, 0.96);
    ctx.clip();
    ctx.lineWidth = 2;
    for (let row = -1; row < 9; row++) {
        for (let y = -20 + (row % 2) * 14; y < H + 20; y += 28) {
            const off = (row - 4) / 4.5;
            ctx.beginPath();
            for (let t = -14; t <= 14; t += 2) {
                const yy = y + t;
                ctx.lineTo(riverX(yy) + off * riverHalf(yy) + Math.sin(t / 2.3) * 3, yy);
            }
            ctx.strokeStyle = row % 3 === 0 ? 'rgba(233,220,191,.35)' : 'rgba(111,151,140,.8)';
            ctx.stroke();
        }
    }
    ctx.restore();
    for (const side of [-1, 1]) {
        bank(ctx, side, 1);
        stitch(ctx, INK, 3.2, [9, 4]);
        bank(ctx, side, 1.06);
        stitch(ctx, 'rgba(45,53,83,.35)', 1.5, [3, 5]);
    }

    // Trær på landet, unna elva og landsbyene.
    for (let i = 0; i < 42; i++) {
        const y = 60 + r() * (H - 110);
        const side = r() < 0.5 ? -1 : 1;
        const x = riverX(y) + side * (riverHalf(y) + 130 + r() * 380);
        if (x < 30 || x > W - 30) continue;
        if (y > 320 && Math.abs(x - riverX(y)) < riverHalf(y) + 110) continue;
        tree(ctx, x, y + 20, 26 + r() * 22, r);
    }

    // Stedsnavn med latinske versaler, slik teppet skriver dem.
    ctx.fillStyle = INK;
    ctx.font = `700 22px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText('PARIS', riverX(PARIS_Y) + riverHalf(PARIS_Y) + 90, PARIS_Y + 36);
    ctx.font = `700 15px ${SERIF}`;

    return c;
}

export const makeAssets = (): DrawAssets => ({
    bg: makeBackground(),
    bits: [],
    facing: new Map(),
    t: 0,
    rnd: seeded(Date.now() & 0xffff),
});

// ---------------------------------------------------------------- figurer

interface ShipLook {
    hull: string[];
    sail: string[];
    len: number;
    dragon: boolean;
    shields: boolean;
    cargo?: boolean;
    crown?: boolean;
    /** Et kors på seilet: kongens kristne folk - og Rollo etter dåpen. */
    cross?: boolean;
}

const LOOK_PLAYER: ShipLook = { hull: [OCHRE, TERRA, OCHRE], sail: [TERRA, LINEN, OCHRE, LINEN], len: 70, dragon: true, shields: true };
const LOOK_VASSAL: ShipLook = { ...LOOK_PLAYER, sail: [OCHRE, LINEN, OCHRE, LINEN], cross: true };
const LOOK_VIKING: ShipLook = { hull: [TERRA, INK, TERRA], sail: [TERRA, '#8e3c24', TERRA], len: 56, dragon: true, shields: true };
const LOOK_BARGE: ShipLook = { hull: ['#6b4a2b', SAGE, '#6b4a2b'], sail: [SAGE], len: 60, dragon: false, shields: false, cargo: true, cross: true };
const LOOK_KING: ShipLook = { hull: [KING, LINEN, KING], sail: [KING], len: 64, dragon: false, shields: false, cargo: true, cross: true };

/** Et skip i profil, som på teppet. dir = 1: baugen peker mot høyre. */
function ship(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, look: ShipLook, t: number, tilt = 0) {
    const L = look.len;
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 2.4 + x * 0.05) * 1.6);
    ctx.rotate(tilt + Math.sin(t * 1.7 + y * 0.03) * 0.03);
    ctx.scale(dir, 1);
    // Skroget: en halvmåne med høy baug og akterstavn.
    const hull = () => {
        ctx.beginPath();
        ctx.moveTo(-L * 0.55, -L * 0.3);
        ctx.quadraticCurveTo(-L * 0.46, L * 0.02, -L * 0.3, L * 0.1);
        ctx.lineTo(L * 0.3, L * 0.1);
        ctx.quadraticCurveTo(L * 0.46, L * 0.02, L * 0.55, -L * 0.3);
        ctx.quadraticCurveTo(L * 0.4, -L * 0.06, L * 0.28, -L * 0.04);
        ctx.lineTo(-L * 0.28, -L * 0.04);
        ctx.quadraticCurveTo(-L * 0.4, -L * 0.06, -L * 0.55, -L * 0.3);
        ctx.closePath();
    };
    // Mast og seil bak skroget.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -L * 0.04);
    ctx.lineTo(0, -L * 0.78);
    ctx.stroke();
    const sw = L * 0.46;
    const sh = L * 0.5;
    const bulge = Math.sin(t * 3 + x) * 2;
    const bands = look.sail.length;
    for (let i = 0; i < bands; i++) {
        const x0 = -sw / 2 + (sw / bands) * i;
        ctx.fillStyle = look.sail[i];
        ctx.beginPath();
        ctx.moveTo(x0, -L * 0.74);
        ctx.lineTo(x0 + sw / bands, -L * 0.74);
        ctx.quadraticCurveTo(x0 + sw / bands + bulge, -L * 0.74 + sh * 0.6, x0 + sw / bands, -L * 0.74 + sh);
        ctx.lineTo(x0, -L * 0.74 + sh);
        ctx.closePath();
        ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-sw / 2, -L * 0.74, sw, sh);
    if (look.cross) {
        const cy = -L * 0.74 + sh / 2;
        ctx.fillStyle = look.sail[0] === KING ? LINEN : KING;
        ctx.fillRect(-2.5, cy - sh * 0.38, 5, sh * 0.76);
        ctx.fillRect(-sw * 0.36, cy - sh * 0.12, sw * 0.72, 5);
    }
    if (look.crown) {
        // Kongens merke: en krone midt på seilet.
        ctx.fillStyle = OCHRE;
        const cy = -L * 0.5;
        ctx.beginPath();
        ctx.moveTo(-8, cy + 5);
        ctx.lineTo(-8, cy - 4);
        ctx.lineTo(-4, cy);
        ctx.lineTo(0, cy - 6);
        ctx.lineTo(4, cy);
        ctx.lineTo(8, cy - 4);
        ctx.lineTo(8, cy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
    // Skroget i striper.
    ctx.save();
    hull();
    ctx.clip();
    const hb = look.hull.length;
    for (let i = 0; i < hb; i++) {
        ctx.fillStyle = look.hull[i];
        ctx.fillRect(-L, -L * 0.34 + ((L * 0.46) / hb) * i, L * 2, (L * 0.46) / hb + 1);
    }
    ctx.restore();
    hull();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    if (look.shields)
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(i * L * 0.11, -L * 0.07, L * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 ? OCHRE : LINEN;
            ctx.fill();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = INK;
            ctx.stroke();
        }
    if (look.cargo)
        for (let i = -1; i <= 1; i += 2) {
            ctx.fillStyle = '#8a6a3c';
            ctx.fillRect(i * L * 0.16 - 6, -L * 0.14, 12, 9);
            ctx.strokeStyle = INK;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(i * L * 0.16 - 6, -L * 0.14, 12, 9);
            ctx.fillStyle = '#e5e0cf';
            ctx.fillRect(i * L * 0.16 - 2, -L * 0.12, 4, 3);
        }
    if (look.dragon) {
        // Dragehodet i baugen.
        ctx.beginPath();
        ctx.moveTo(L * 0.55, -L * 0.3);
        ctx.quadraticCurveTo(L * 0.62, -L * 0.44, L * 0.52, -L * 0.46);
        ctx.quadraticCurveTo(L * 0.46, -L * 0.44, L * 0.5, -L * 0.38);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(L * 0.54, -L * 0.43, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function house(ctx: CanvasRenderingContext2D, x: number, y: number, state: 'mine' | 'lost-v' | 'lost-k' | 'grey' | 'promised', t: number) {
    ctx.save();
    ctx.translate(x, y);
    if (state === 'promised') {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.rect(-15, -10, 30, 18);
        stitch(ctx, INK, 1.6, [3, 3]);
        ctx.beginPath();
        ctx.moveTo(-19, -10);
        ctx.lineTo(0, -24);
        ctx.lineTo(19, -10);
        stitch(ctx, INK, 1.6, [3, 3]);
        ctx.restore();
        return;
    }
    const lost = state === 'lost-v' || state === 'lost-k';
    ctx.globalAlpha = state === 'grey' ? 0.55 : 1;
    ctx.fillStyle = lost ? '#b9ad93' : LINEN;
    ctx.fillRect(-15, -10, 30, 18);
    ctx.fillStyle = lost ? '#7c7466' : TERRA;
    ctx.beginPath();
    ctx.moveTo(-19, -10);
    ctx.lineTo(0, -24);
    ctx.lineTo(19, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeRect(-15, -10, 30, 18);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(0, 8, 5, Math.PI, 0);
    ctx.lineTo(5, 8);
    ctx.fill();
    // Takstein i sting.
    ctx.strokeStyle = 'rgba(45,53,83,.45)';
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i += 5) {
        ctx.beginPath();
        ctx.moveTo(i, -11);
        ctx.lineTo(i * 0.6, -19 + Math.abs(i) * 0.3);
        ctx.stroke();
    }
    if (lost) {
        // Et flagg viser hvem som tok landsbyen.
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(10, -10);
        ctx.lineTo(10, -36);
        ctx.stroke();
        ctx.fillStyle = state === 'lost-k' ? KING : TERRA;
        ctx.beginPath();
        ctx.moveTo(10, -36);
        ctx.lineTo(24 + Math.sin(t * 5) * 2, -32);
        ctx.lineTo(10, -27);
        ctx.fill();
    }
    ctx.restore();
}

function fort(ctx: CanvasRenderingContext2D, x: number, y: number, big: boolean) {
    const w = big ? 64 : 48;
    const h = big ? 38 : 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#cdbb95';
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = TERRA;
    for (const sx of [-w / 2 - 4, w / 2 - 10]) {
        ctx.fillRect(sx, -h - 12, 14, h + 12);
        ctx.beginPath();
        ctx.moveTo(sx - 3, -h - 12);
        ctx.lineTo(sx + 7, -h - 26);
        ctx.lineTo(sx + 17, -h - 12);
        ctx.fillStyle = OCHRE;
        ctx.fill();
        ctx.fillStyle = TERRA;
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h, w, h);
    for (let i = -w / 2; i < w / 2; i += 8) ctx.strokeRect(i, -h - 6, 5, 6);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(0, 0, 7, Math.PI, 0);
    ctx.fill();
    ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(9, 0);
    ctx.lineTo(5, -3);
    ctx.moveTo(9, 0);
    ctx.lineTo(5, 3);
    ctx.moveTo(-9, 0);
    ctx.lineTo(-12, -3);
    ctx.moveTo(-9, 0);
    ctx.lineTo(-12, 3);
    ctx.stroke();
    ctx.restore();
}

const facingOf = (a: DrawAssets, b: Boat) => {
    const prev = a.facing.get(b.id) ?? (b.x < riverX(b.y) ? 1 : -1);
    const vx = b.fleeing ? b.sx : riverX(b.y + Math.sign(b.v) * 20) - b.x;
    const next = Math.abs(vx) > 4 ? Math.sign(vx) : prev;
    a.facing.set(b.id, next);
    return next;
};

// ---------------------------------------------------------------- verden

export function drawWorld(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    a: DrawAssets,
    o: { menu: boolean; dt: number; best: number }
) {
    a.t += o.dt;
    const t = a.t;
    ctx.save();
    ctx.fillStyle = LINEN_DARK;
    ctx.fillRect(0, 0, tf.w, tf.h);
    let sx = 0;
    let sy = 0;
    if (g.shake > 0) {
        sx = (a.rnd() - 0.5) * 14 * g.shake;
        sy = (a.rnd() - 0.5) * 14 * g.shake;
    }
    ctx.translate(tf.ox + sx, tf.oy + sy);
    ctx.scale(tf.s, tf.s);
    ctx.drawImage(a.bg, 0, 0, W, H);

    const after = g.phase === 'avtale';

    // Strømmen: bølgesting som driver nedover elva mot havet, og fugler over landet.
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(233,220,191,.6)';
    for (let i = 0; i < 46; i++) {
        const y = ((i * 97 + t * 38) % (H + 40)) - 20;
        const off = (((i * 37) % 17) / 8.5 - 1) * 0.8;
        const x = riverX(y) + off * riverHalf(y);
        ctx.beginPath();
        for (let k = -9; k <= 9; k += 3) ctx.lineTo(x + k, y + Math.sin(k / 2 + t * 4 + i) * 2.5);
        ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
        const bx = ((i * 331 + t * (26 + i * 5)) % (W + 120)) - 60;
        const byy = 90 + i * 118 + Math.sin(t * 0.8 + i) * 14;
        const flap = Math.sin(t * 7 + i * 2) * 5;
        ctx.beginPath();
        ctx.moveTo(bx - 10, byy - flap);
        ctx.quadraticCurveTo(bx - 5, byy - 5, bx, byy);
        ctx.quadraticCurveTo(bx + 5, byy - 5, bx + 10, byy - flap);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Kongens fil langs venstre bredd: to stingrader og små kroner.
    if (after) {
        for (const k of [KING_U - 0.16, KING_U + 0.16]) {
            ctx.beginPath();
            for (let y = 0; y <= H; y += 10) ctx.lineTo(riverX(y) + k * riverHalf(y) * 0.8, y);
            stitch(ctx, 'rgba(59,79,143,.7)', 2, [3, 6]);
        }
        ctx.fillStyle = 'rgba(201,149,49,.85)';
        for (let y = 80; y < H - 40; y += 130) {
            const x = riverX(y) + KING_U * riverHalf(y) * 0.8;
            ctx.beginPath();
            ctx.moveTo(x - 7, y + 4);
            ctx.lineTo(x - 7, y - 4);
            ctx.lineTo(x - 3, y);
            ctx.lineTo(x, y - 6);
            ctx.lineTo(x + 3, y);
            ctx.lineTo(x + 7, y - 4);
            ctx.lineTo(x + 7, y + 4);
            ctx.fill();
        }
        // Kjettingen over Seinen ved Rouen. Oppe: stram, gyllen og stopper skipene.
        // Nede: slakk under vannet. Røket: to løse ender.
        const c = g.chain;
        const hw = riverHalf(ROUEN_Y) + 8;
        const rx = riverX(ROUEN_Y);
        const x0 = rx - hw;
        const x1 = rx + hw;
        const links = 18;
        for (let i = 0; i <= links; i++) {
            const q = i / links;
            if (c.broken > 0 && q > 0.35 && q < 0.65) continue;
            const sag = c.up ? 0 : Math.sin(q * Math.PI) * 16;
            const lx = x0 + (x1 - x0) * q;
            ctx.beginPath();
            ctx.ellipse(lx, ROUEN_Y + sag, 6, 3.5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = c.up ? OCHRE : c.broken > 0 ? 'rgba(166,74,46,.7)' : 'rgba(201,149,49,.45)';
            ctx.lineWidth = c.up ? 3.4 : 2;
            ctx.stroke();
        }
        if (c.up) {
            ctx.beginPath();
            ctx.moveTo(x0, ROUEN_Y);
            ctx.lineTo(x1, ROUEN_Y);
            stitch(ctx, INK, 1.4, [3, 5]);
        }
        // Vinsjen på høyre bredd, med slitasjen på kjettingen.
        const [wx, wy] = winchAt();
        ctx.beginPath();
        ctx.arc(wx, wy, 17, 0, Math.PI * 2);
        ctx.fillStyle = c.broken > 0 ? '#b9ad93' : '#8a6a3c';
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(c.up ? t * 0.3 : 0.4);
        for (let k = 0; k < 4; k++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(-24, 0);
            ctx.lineTo(24, 0);
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(45,53,83,.2)';
        ctx.fillRect(wx - 24, wy + 24, 48, 7);
        ctx.fillStyle = c.broken > 0 ? TERRA : c.hp < 0.3 ? TERRA : OCHRE;
        ctx.fillRect(wx - 24, wy + 24, 48 * (c.broken > 0 ? 1 - c.broken / 8 : c.hp), 7);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(wx - 24, wy + 24, 48, 7);
        ctx.fillStyle = INK;
        ctx.font = `700 12px ${SERIF}`;
        ctx.textAlign = 'left';
        ctx.fillText(c.broken > 0 ? 'RØKET' : c.up ? 'KJETTING OPPE' : 'KJETTING NEDE', wx + 26, wy - 4);
        ctx.font = `700 10px ${SERIF}`;
        ctx.fillText('KLIKK / MELLOMROM', wx + 26, wy + 10);
    }

    // Borgene. Før 911 viser en stiplet ring hvor langt bueskytterne når.
    g.forts.forEach((f, i) => {
        if (!after) {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.range, 0, Math.PI * 2);
            // Frankerne ruster seg: jo nærmere 911, jo tettere står bueskytterne.
            ctx.fillStyle = `rgba(166,74,46,${(0.06 + 0.34 * Math.min(1, g.t / P1)).toFixed(3)})`;
            ctx.fill();
            stitch(ctx, 'rgba(166,74,46,.7)', 2.4, [6, 7]);
        }
        fort(ctx, f.x, f.y + 16, i === 0);
    });
    ctx.fillStyle = INK;
    ctx.font = `700 22px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText('ROUEN', riverX(ROUEN_Y) + riverHalf(ROUEN_Y) + 84, ROUEN_Y - 14);

    // Landsbyene ved elvemunningen.
    g.villages.forEach((v, i) => {
        let st: 'mine' | 'lost-v' | 'lost-k' | 'grey' | 'promised' = 'mine';
        if (!after) {
            if (i < LAND) st = 'grey';
            else if (i < MAX_LAND && i < LAND + Math.floor(g.stats.silver / SILVER_PER_LAND)) st = 'grey';
            else st = 'promised';
        } else if (i >= g.land) return;
        else if (!v.alive) st = v.lost === 'kongen' ? 'lost-k' : 'lost-v';
        house(ctx, v.x, v.y, st, t);
        // Normandie vokser: landsbyene du holder, får flere hus år for år.
        if (after && st === 'mine') {
            const n = Math.min(3, Math.floor((g.year - 911) / 6));
            const side = v.x < riverX(v.y) ? -1 : 1;
            for (let k = 0; k < n; k++) {
                ctx.save();
                ctx.translate(v.x + side * (30 + k * 22), v.y + (k % 2 ? 10 : -8));
                ctx.scale(0.62, 0.62);
                house(ctx, 0, 0, 'mine', t);
                ctx.restore();
            }
        }
    });

    // Pilsalvene: pilene flyr fra borgen mot ringen der de lander.
    for (const v of g.volleys) {
        const p = 1 - v.t / VOLLEY_T;
        ctx.beginPath();
        ctx.arc(v.x, v.y, VOLLEY_R * (1.25 - 0.25 * p), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(166,74,46,${0.12 + 0.2 * p})`;
        ctx.fill();
        stitch(ctx, TERRA, 3, [8, 5]);
        const ang = Math.atan2(v.y - v.fy, v.x - v.fx);
        for (let k = 0; k < 5; k++) {
            const q = Math.min(1, p + k * 0.04);
            const ox = ((k % 3) - 1) * 16;
            const oy = (k - 2) * 7;
            const lift = Math.sin(q * Math.PI) * 60;
            arrow(ctx, v.fx + (v.x - v.fx) * q + ox, v.fy + (v.y - v.fy) * q + oy - lift, ang + (0.5 - q) * 1.2);
        }
    }

    // Båtene.
    for (const b of g.boats) {
        const look = b.kind === 'viking' ? LOOK_VIKING : after ? LOOK_KING : LOOK_BARGE;
        const dir = facingOf(a, b);
        let tilt = 0;
        ctx.globalAlpha = 1;
        if (b.fleeing > 0) {
            // Rammet: skipet snurrer rundt og seiler bort.
            tilt = Math.min(1, b.fleeing * 2) * 0.5 * dir + Math.sin(b.fleeing * 9) * 0.1;
            ctx.globalAlpha = Math.max(0, 1 - Math.max(0, b.fleeing - 1) * 1.2);
        }
        // Kjølvann.
        if (!b.fleeing) {
            ctx.beginPath();
            const back = Math.sign(b.v);
            ctx.moveTo(b.x - 14, b.y + 6);
            ctx.quadraticCurveTo(b.x - 20, b.y + 6 + back * 22, b.x - 26, b.y + back * 40);
            ctx.moveTo(b.x + 14, b.y + 6);
            ctx.quadraticCurveTo(b.x + 20, b.y + 6 + back * 22, b.x + 26, b.y + back * 40);
            stitch(ctx, 'rgba(233,220,191,.55)', 2, [4, 4]);
        }
        ship(ctx, b.x, b.y + 12, dir, look, t, tilt);
        ctx.globalAlpha = 1;
    }

    // Skipet ditt.
    const s = g.ship;
    const sp = speedOf(s);
    const ram = sp >= RAM_V;
    const pdir = a.facing.get(-1) ?? 1;
    const nd = Math.abs(s.vx) > 25 ? Math.sign(s.vx) : pdir;
    a.facing.set(-1, nd);
    // Kjølvann bak skipet - lengre jo fortere det går.
    if (sp > 30) {
        const ux = -s.vx / sp;
        const uy = -s.vy / sp;
        const len = Math.min(110, sp * 0.3);
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(s.x + uy * side * 12, s.y + 8 - ux * side * 12);
            ctx.lineTo(s.x + ux * len + uy * side * (18 + len * 0.2), s.y + 8 + uy * len - ux * side * (18 + len * 0.2));
            stitch(ctx, ram ? OCHRE : 'rgba(233,220,191,.7)', ram ? 4 : 2.4, [6, 4]);
        }
    }
    if (ram) {
        // Rammefart: en gyllen stingring rundt skipet.
        ctx.beginPath();
        ctx.arc(s.x, s.y, 42, 0, Math.PI * 2);
        ctx.lineDashOffset = -t * 40;
        stitch(ctx, OCHRE, 4, [10, 6]);
        ctx.lineDashOffset = 0;
    }
    if (g.boardWarn) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 46 + Math.sin(t * 16) * 3, 0, Math.PI * 2);
        stitch(ctx, TERRA, 5, [5, 4]);
    }
    const tiltP = Math.max(-0.35, Math.min(0.35, (s.vy / 330) * 0.35 * -nd));
    if (s.hit > 0 && Math.floor(t * 14) % 2 === 0) ctx.globalAlpha = 0.45;
    ship(ctx, s.x, s.y + 14, nd, after ? LOOK_VASSAL : LOOK_PLAYER, t, tiltP);
    ctx.globalAlpha = 1;

    // Gnister og spon.
    const dt = o.dt;
    a.bits = a.bits.filter((b) => (b.t += dt) < b.life);
    for (const b of a.bits) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const k = 1 - b.t / b.life;
        if (b.kind === 'coin') {
            b.vy += 420 * dt;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, b.r * Math.abs(Math.cos(b.t * 12)) + 1, b.r, 0, 0, Math.PI * 2);
            ctx.fillStyle = b.c;
            ctx.fill();
            ctx.strokeStyle = INK;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        } else if (b.kind === 'splinter') {
            b.vx *= 1 - 2 * dt;
            b.vy *= 1 - 2 * dt;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.t * 8 + b.r);
            ctx.globalAlpha = k;
            ctx.fillStyle = b.c;
            ctx.fillRect(-b.r / 2, -1.5, b.r, 3);
            ctx.restore();
        } else if (b.kind === 'splash') {
            ctx.globalAlpha = k;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * (1.6 - k), Math.PI * 1.1, Math.PI * 1.9);
            stitch(ctx, b.c, 2.4, [4, 3]);
        } else {
            ctx.globalAlpha = k * 0.6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * (2 - k), 0, Math.PI * 2);
            ctx.fillStyle = b.c;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

// ---------------------------------------------------------------- borden (HUD)

function roman(n: number) {
    const map: [number, string][] = [
        [900, 'CM'],
        [500, 'D'],
        [400, 'CD'],
        [100, 'C'],
        [90, 'XC'],
        [50, 'L'],
        [40, 'XL'],
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
    ];
    let out = '';
    for (const [v, s] of map)
        while (n >= v) {
            out += s;
            n -= v;
        }
    return out;
}

function band(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, t: number) {
    ctx.fillStyle = '#e2d2ad';
    ctx.fillRect(x0, y, x1 - x0, h);
    ctx.fillStyle = 'rgba(107,90,58,.08)';
    for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x0, yy, x1 - x0, 1);
    for (const yy of [y + 3, y + h - 3]) {
        ctx.beginPath();
        ctx.moveTo(x0, yy);
        ctx.lineTo(x1, yy);
        stitch(ctx, INK, 2.4, [8, 3]);
    }
    // Skrå ornamentstaver i borden, som på teppet.
    ctx.lineWidth = 3;
    for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) {
        ctx.strokeStyle = (x / 34) % 2 ? 'rgba(166,74,46,.35)' : 'rgba(62,107,100,.35)';
        ctx.beginPath();
        ctx.moveTo(x, y + h - 7);
        ctx.lineTo(x + 14, y + 7);
        ctx.stroke();
    }
    void t;
}

function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#efe3c6';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
}

function shield(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 9);
    ctx.lineTo(x + 8, y - 9);
    ctx.lineTo(x + 8, y + 1);
    ctx.quadraticCurveTo(x + 6, y + 8, x, y + 11);
    ctx.quadraticCurveTo(x - 6, y + 8, x - 8, y + 1);
    ctx.closePath();
    ctx.fillStyle = full ? TERRA : 'rgba(45,53,83,.12)';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    if (full) {
        ctx.fillStyle = OCHRE;
        ctx.beginPath();
        ctx.arc(x, y - 1, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function crown(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 6);
    ctx.lineTo(x - 9, y - 4);
    ctx.lineTo(x - 4, y + 1);
    ctx.lineTo(x, y - 7);
    ctx.lineTo(x + 4, y + 1);
    ctx.lineTo(x + 9, y - 4);
    ctx.lineTo(x + 9, y + 6);
    ctx.closePath();
    ctx.fillStyle = on ? TERRA : 'rgba(45,53,83,.12)';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
}

function chest(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
    ctx.fillStyle = on ? OCHRE : 'rgba(45,53,83,.12)';
    ctx.fillRect(x - 8, y - 6, 16, 12);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x - 8, y - 6, 16, 12);
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 1);
    ctx.lineTo(x + 8, y - 1);
    ctx.stroke();
}

export function drawHud(ctx: CanvasRenderingContext2D, g: Game, tf: Transform, best: number) {
    ctx.save();
    ctx.translate(tf.ox, tf.oy);
    ctx.scale(tf.s, tf.s);
    const x0 = -tf.ox / tf.s;
    const x1 = (tf.w - tf.ox) / tf.s;
    const T = performance.now() / 1000;
    band(ctx, x0, x1, 0, BORDER, T);
    band(ctx, x0, x1, H - BORDER, BORDER, T);
    const after = g.phase === 'avtale';
    ctx.textBaseline = 'middle';

    // Øverst til venstre: årstallet, og veien fram til 933.
    plate(ctx, 14, 5, 400, 30);
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.font = `700 17px ${SERIF}`;
    const anno = `ANNO ${roman(g.year)}`;
    ctx.fillText(anno, 24, 21);
    const yx = 24 + ctx.measureText(anno).width + 8;
    ctx.font = `700 13px ${SERIF}`;
    ctx.fillText(String(g.year), yx, 21);
    const lx0 = yx + 40;
    const lx1 = 404;
    ctx.beginPath();
    ctx.moveTo(lx0, 21);
    ctx.lineTo(lx1, 21);
    stitch(ctx, INK, 2, [4, 3]);
    const at = (y: number) => lx0 + ((lx1 - lx0) * (y - 885)) / (933 - 885);
    ctx.fillStyle = OCHRE;
    ctx.fillRect(at(911) - 2, 12, 4, 18);
    ctx.fillStyle = TERRA;
    ctx.beginPath();
    ctx.arc(at(g.year), 21, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `700 11px ${SERIF}`;
    ctx.fillStyle = INK;
    ctx.fillText('933', lx1 - 22, 31);

    // Midten: poengene og rekka.
    const cx = W / 2;
    plate(ctx, cx - 150, 3, 300, 34);
    ctx.textAlign = 'center';
    ctx.font = `700 24px ${SERIF}`;
    ctx.fillStyle = INK;
    ctx.fillText(Math.floor(g.score).toLocaleString('nb-NO'), cx - 34, 21);
    if (g.combo > 0) {
        ctx.font = `700 17px ${SERIF}`;
        ctx.fillStyle = TERRA;
        ctx.fillText(`x${(1 + g.combo * 0.1).toFixed(1)}`, cx + 92, 21);
        ctx.font = `700 11px ${SERIF}`;
        ctx.fillStyle = INK;
        ctx.fillText(`REKKE ${g.combo}`, cx + 92, 33);
    }

    // Til høyre (til venstre for lyd og pause): rekorden.
    ctx.textAlign = 'right';
    ctx.font = `700 14px ${SERIF}`;
    ctx.fillStyle = INK;
    ctx.fillText(`REKORD ${Math.max(best, Math.floor(g.score)).toLocaleString('nb-NO')}`, W - 110, 21);

    // Nederst: skjoldene (liv), landet (landsbyene) og kongen.
    const by = H - BORDER / 2;
    plate(ctx, 14, H - BORDER + 5, 150, 30);
    ctx.textAlign = 'left';
    ctx.font = `700 12px ${SERIF}`;
    ctx.fillStyle = INK;
    ctx.fillText('SKIPET', 22, by + 1);
    for (let i = 0; i < HP; i++) shield(ctx, 90 + i * 24, by, i < g.ship.hp);

    const vw = 34;
    const nL = after ? g.land : MAX_LAND;
    const lw = 90 + nL * vw;
    const lx = cx - lw / 2;
    plate(ctx, lx, H - BORDER + 5, lw, 30);
    ctx.fillText(after ? 'LANDET' : 'LOVET', lx + 10, by + 1);
    const earned = LAND + Math.min(MAX_LAND - LAND, Math.floor(g.stats.silver / SILVER_PER_LAND));
    for (let i = 0; i < nL; i++) {
        ctx.fillStyle = INK;
        const v = g.villages[i];
        const hx = lx + 84 + i * vw;
        ctx.save();
        ctx.translate(hx, by + 4);
        ctx.scale(0.62, 0.62);
        const st = after
            ? v.alive
                ? 'mine'
                : v.lost === 'kongen'
                  ? 'lost-k'
                  : 'lost-v'
            : i < earned
              ? 'mine'
              : 'promised';
        house(ctx, 0, 0, st, T);
        ctx.restore();
    }

    const rx = W - 356;
    plate(ctx, rx, H - BORDER + 5, 342, 30);
    ctx.fillStyle = INK;
    if (after) {
        ctx.fillText('KONGENS VREDE', rx + 8, by + 1);
        for (let i = 0; i < ANGER_MAX; i++) crown(ctx, rx + 132 + i * 24, by, i < g.anger);
        ctx.fillStyle = INK;
        ctx.fillText('SØLVKISTER', rx + 190, by + 1);
        for (let i = 0; i < CHESTS_PER_LIFE; i++) chest(ctx, rx + 288 + i * 19, by, i < g.chests);
    } else {
        const n = g.stats.silver % SILVER_PER_LAND;
        const full = earned >= MAX_LAND;
        ctx.fillText(full ? 'SØLV - LANDET ER FULLT' : 'SØLV TIL NESTE LANDSBY', rx + 8, by + 1);
        if (!full) for (let i = 0; i < SILVER_PER_LAND; i++) chest(ctx, rx + 248 + i * 19, by, i < n);
    }
    ctx.restore();
}

// ---------------------------------------------------------------- 911

/** Vendepunktet i 911 som et teppefelt midt på kartet: kongen, Rollo på kne og dåpen. p går 0-1. */
export function drawTreaty(ctx: CanvasRenderingContext2D, tf: Transform, p: number) {
    const a = Math.min(1, p * 5, (1 - p) * 5);
    ctx.save();
    ctx.translate(tf.ox, tf.oy);
    ctx.scale(tf.s, tf.s);
    ctx.globalAlpha = a * 0.45;
    ctx.fillStyle = INK;
    ctx.fillRect(-tf.ox / tf.s, 0, tf.w / tf.s, H);
    ctx.globalAlpha = a;
    const w = 600;
    const h = 260;
    const x = W / 2 - w / 2;
    const y = H / 2 - h / 2 - 10;
    ctx.fillStyle = LINEN;
    ctx.fillRect(x, y, w, h);
    band(ctx, x, x + w, y, 34, 0);
    band(ctx, x, x + w, y + h - 34, 34, 0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 19px ${SERIF}`;
    ctx.fillText('HIC ROLLO BAPTIZATVR · ANNO 911', W / 2, y + 18);
    ctx.font = `700 15px ${SERIF}`;
    ctx.fillText('Rollo blir døpt og kongens vasall. Nå skal han forsvare landet.', W / 2, y + h - 17);
    const gy = y + h - 44;
    // Kongen med krone og blå kappe.
    const kx = W / 2 - 150;
    ctx.fillStyle = KING;
    ctx.beginPath();
    ctx.moveTo(kx - 26, gy);
    ctx.lineTo(kx - 14, gy - 104);
    ctx.lineTo(kx + 14, gy - 104);
    ctx.lineTo(kx + 26, gy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = LINEN;
    ctx.beginPath();
    ctx.arc(kx, gy - 118, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    crown(ctx, kx, gy - 138, true);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(kx + 16, gy - 84);
    ctx.lineTo(kx + 58, gy - 70);
    ctx.stroke();
    // Døpefonten.
    const fx = W / 2 + 10;
    ctx.fillStyle = OCHRE;
    ctx.beginPath();
    ctx.moveTo(fx - 36, gy - 58);
    ctx.lineTo(fx + 36, gy - 58);
    ctx.lineTo(fx + 22, gy - 30);
    ctx.lineTo(fx - 22, gy - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(fx - 8, gy - 30, 16, 30);
    ctx.strokeRect(fx - 8, gy - 30, 16, 30);
    ctx.fillStyle = TEAL;
    ctx.fillRect(fx - 32, gy - 62, 64, 6);
    // Rollo på kne, med skjold på ryggen.
    const rx = W / 2 + 120;
    ctx.fillStyle = TERRA;
    ctx.beginPath();
    ctx.moveTo(rx - 22, gy);
    ctx.lineTo(rx - 18, gy - 34);
    ctx.lineTo(rx - 30, gy - 78);
    ctx.lineTo(rx + 2, gy - 84);
    ctx.lineTo(rx + 16, gy - 34);
    ctx.lineTo(rx + 34, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINEN;
    ctx.beginPath();
    ctx.arc(rx - 18, gy - 94, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = OCHRE;
    ctx.beginPath();
    ctx.arc(rx + 14, gy - 60, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
