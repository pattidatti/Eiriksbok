// Tegning for Inn mot stranda: et alliert rekognoseringsfoto av Omaha 6. juni 1944,
// svart-hvitt sølvkorn, med rød og gul fettstift oppå. Alt statisk (skrent, sand,
// hav, korn, vignett) tegnes én gang til canvaser utenfor skjermen; hvert bilde
// legger bare på vann, hindre, båter, granater og røyk.

import {
    BEACH_TOP,
    BOAT_L,
    BOAT_W,
    H,
    LANE_W,
    NEED,
    OBST_Y0,
    OBST_Y1,
    RELOAD,
    SALVO_SPREAD,
    SHELL_R,
    W,
    WAVES,
    clock,
    waterline,
    type Boat,
    type Game,
} from './game';

export const INK = '#15130f';
export const PAPER = '#e7e0cd';
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

const LANE_TOP = OBST_Y0 - 40;
const LANE_H = OBST_Y1 - OBST_Y0 + 100;

function drawLaneLayer(a: DrawAssets, g: Game) {
    if (!a.laneLayer) {
        a.laneLayer = document.createElement('canvas');
        a.laneLayer.width = W;
        a.laneLayer.height = LANE_H;
    }
    const ctx = a.laneLayer.getContext('2d')!;
    ctx.clearRect(0, 0, W, LANE_H);
    ctx.save();
    ctx.translate(0, -LANE_TOP);
    g.lanes.forEach((l, i) => {
        if (!g.lanes.slice(0, i).some((o) => Math.abs(o - l) < 130))
            label(ctx, 'SPOR', l, OBST_Y1 + 38, YELLOW, 18);
        for (const s of [-1, 1]) {
            const x = l + s * (LANE_W / 2 + 6);
            crayonLine(
                ctx,
                [
                    [x, OBST_Y1 + 18],
                    [x, OBST_Y0 - 16],
                ],
                'rgba(241,194,50,.95)',
                3.5,
                i * 13 + (s > 0 ? 5 : 0),
                [10, 8]
            );
            for (const fy of [OBST_Y0 - 14, OBST_Y1 + 14]) {
                ctx.fillStyle = YELLOW;
                ctx.beginPath();
                ctx.moveTo(x, fy);
                ctx.lineTo(x + 12 * s, fy - 4);
                ctx.lineTo(x, fy - 9);
                ctx.fill();
                ctx.fillStyle = gray(20);
                ctx.fillRect(x - 1, fy - 10, 2, 14);
            }
        }
    });
    ctx.restore();
    a.laneCount = g.lanes.length;
}

export interface DrawAssets {
    land: HTMLCanvasElement;
    sea: HTMLCanvasElement;
    /** Vignett og filmkorn, tegnet én gang og lagt oppå hvert bilde med drawImage. */
    film: HTMLCanvasElement;
    smoke: HTMLCanvasElement;
    laneLayer?: HTMLCanvasElement;
    world?: HTMLCanvasElement;
    worldKey?: string;
    worldTop?: number;
    worldGone?: number;
    /** Ferdigtegnet båt (skrog, lasterom, soldater), én for din og én for de andre. */
    boatMine?: HTMLCanvasElement;
    boatOther?: HTMLCanvasElement;
    laneCount?: number;
}

/**
 * Alt det statiske på én gang. Korn legges rett inn i land og hav (overlay-blanding er
 * dyrt og skal aldri skje per bilde på en Chromebook), og vignetten får sin egen canvas.
 */
export function makeAssets(): DrawAssets {
    const land = makeLand();
    const sea = makeSea();
    const grain = makeGrain();
    for (const c of [land, sea]) {
        const ctx = c.getContext('2d')!;
        ctx.globalCompositeOperation = 'overlay';
        const pat = ctx.createPattern(grain, 'repeat');
        if (pat) {
            ctx.fillStyle = pat;
            ctx.fillRect(0, 0, W, H);
        }
        ctx.globalCompositeOperation = 'source-over';
    }
    const film = document.createElement('canvas');
    film.width = W / 2;
    film.height = H / 2;
    const fctx = film.getContext('2d')!;
    const vg = fctx.createRadialGradient(W / 4, H / 4, H * 0.17, W / 4, H / 4, W * 0.32);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.5)');
    fctx.fillStyle = vg;
    fctx.fillRect(0, 0, W / 2, H / 2);
    const smoke = document.createElement('canvas');
    smoke.width = smoke.height = 128;
    const sctx = smoke.getContext('2d')!;
    const sm = sctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    sm.addColorStop(0, 'rgba(40,38,34,.32)');
    sm.addColorStop(1, 'rgba(40,38,34,0)');
    sctx.fillStyle = sm;
    sctx.fillRect(0, 0, 128, 128);
    for (const c of [land, sea]) c.getContext('2d')!.drawImage(film, 0, 0, W, H);
    return {
        land,
        sea,
        film,
        smoke,
        boatMine: makeBoatSprite(true),
        boatOther: makeBoatSprite(false),
    };
}

export interface DrawState {
    shake: number;
    menu: boolean;
    hoverX: number | null;
    hoverY: number | null;
}

export function fit(w: number, h: number): Transform {
    const s = Math.max(Math.min(w / W, h / H), Math.min(w / W, h / (H * 0.9)));
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
    return `rgba(${c + 6},${c + 3},${c - 4},${a})`;
};

// ---------------------------------------------------------------------------
// Statisk: land og hav (tegnes én gang)
// ---------------------------------------------------------------------------

export function makeLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const r = prng(1944);
    // Sand: lys øverst (tørr), mørkere og glatt nedover (våt fjære).
    const sand = ctx.createLinearGradient(0, BEACH_TOP, 0, H);
    sand.addColorStop(0, gray(196));
    sand.addColorStop(0.25, gray(170));
    sand.addColorStop(1, gray(118));
    ctx.fillStyle = sand;
    ctx.fillRect(0, BEACH_TOP - 10, W, H);
    // Ribber i sanden etter tidevannet
    ctx.strokeStyle = gray(90, 0.18);
    ctx.lineWidth = 2;
    for (let y = BEACH_TOP + 70; y < H; y += 9 + r() * 6) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 40)
            ctx.lineTo(x, y + Math.sin(x * 0.012 + y) * 4 + (r() - 0.5) * 3);
        ctx.stroke();
    }
    // Rullestein-beltet under skrenten
    for (let i = 0; i < 2600; i++) {
        const x = r() * W;
        const y = BEACH_TOP - 4 + r() * 30;
        ctx.fillStyle = gray(120 + r() * 90, 0.9);
        ctx.fillRect(x, y, 2 + r() * 2, 2 + r() * 2);
    }
    // Skrenten: mørk vegetasjon, bølget kant ned mot stranda
    ctx.fillStyle = gray(82);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    for (let x = W; x >= 0; x -= 20)
        ctx.lineTo(x, BEACH_TOP - 8 + Math.sin(x * 0.011) * 10 + (r() - 0.5) * 6);
    ctx.closePath();
    ctx.fill();
    // Jorder på platået
    for (let i = 0; i < 26; i++) {
        const x = r() * W;
        const y = r() * 90;
        ctx.fillStyle = gray(96 + r() * 60, 0.8);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 90 + r() * 120, y + (r() - 0.5) * 30);
        ctx.lineTo(x + 70 + r() * 120, y + 50 + r() * 30);
        ctx.lineTo(x - 20, y + 40 + r() * 30);
        ctx.closePath();
        ctx.fill();
    }
    // Kratt og trær som prikkeklynger
    for (let i = 0; i < 900; i++) {
        const x = r() * W;
        const y = 20 + r() * (BEACH_TOP - 50);
        const rad = 2 + r() * 5;
        ctx.fillStyle = gray(40 + r() * 30, 0.75);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    // Dalene (draws) som går opp fra stranda: lysere striper med vei
    for (const dx of [330, 900, 1380]) {
        ctx.strokeStyle = gray(150, 0.55);
        ctx.lineWidth = 34;
        ctx.beginPath();
        ctx.moveTo(dx, BEACH_TOP);
        ctx.quadraticCurveTo(dx + 30, BEACH_TOP - 110, dx - 20, 0);
        ctx.stroke();
        ctx.strokeStyle = gray(200, 0.8);
        ctx.lineWidth = 5;
        ctx.stroke();
    }
    // Bombekratere fra natta
    for (let i = 0; i < 40; i++) {
        const x = r() * W;
        const y = 10 + r() * (BEACH_TOP + 30);
        const rad = 4 + r() * 9;
        ctx.fillStyle = gray(30, 0.6);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = gray(200, 0.4);
        ctx.beginPath();
        ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    return c;
}

export function makeSea(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const r = prng(606);
    const sea = ctx.createLinearGradient(0, 300, 0, H);
    sea.addColorStop(0, gray(70));
    sea.addColorStop(1, gray(30));
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, W, H);
    // Bølgekammer: korte lyse streker
    for (let i = 0; i < 1500; i++) {
        const x = r() * W;
        const y = 280 + r() * (H - 280);
        const len = 8 + r() * 26;
        ctx.strokeStyle = gray(150 + r() * 70, 0.18 + r() * 0.25);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len / 2, y - 2, x + len, y);
        ctx.stroke();
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
        img.data[i + 3] = Math.random() * 55;
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
        ctx.globalAlpha *= pass ? 0.55 : 1;
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
    seed: number,
    part = 1
) {
    const pts: [number, number][] = [];
    const r = prng(seed);
    const start = -Math.PI / 2;
    for (let a = 0; a <= Math.PI * 2 * part + 0.01; a += 0.25) {
        const k = 1 + (r() - 0.5) * 0.1;
        pts.push([x + Math.cos(start + a) * rad * k, y + Math.sin(start + a) * rad * k]);
    }
    crayonLine(ctx, pts, color, width, seed + 7);
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
    ctx.font = `900 ${size}px ${MONO}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.28;
    ctx.strokeStyle = 'rgba(12,11,9,.8)';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(t, 0, 0);
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Ting i verden
// ---------------------------------------------------------------------------

function makeBoatSprite(mine: boolean): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = BOAT_W + 16;
    c.height = BOAT_L + 16;
    const ctx = c.getContext('2d')!;
    ctx.translate(BOAT_W / 2 + 4, BOAT_L / 2 + 4);
    const b = { mine };
    // Skygge
    ctx.fillStyle = 'rgba(8,7,5,.45)';
    ctx.fillRect(-BOAT_W / 2 + 5, -BOAT_L / 2 + 6, BOAT_W, BOAT_L);
    // Skrog
    ctx.fillStyle = gray(48);
    ctx.beginPath();
    ctx.roundRect(-BOAT_W / 2, -BOAT_L / 2, BOAT_W, BOAT_L, [4, 4, 9, 9]);
    ctx.fill();
    ctx.strokeStyle = b.mine ? YELLOW : gray(190, 0.55);
    ctx.lineWidth = b.mine ? 3 : 1.5;
    ctx.stroke();
    // Lasterommet med soldater (prikker i rader)
    ctx.fillStyle = gray(118);
    ctx.fillRect(-BOAT_W / 2 + 4, -BOAT_L / 2 + 8, BOAT_W - 8, BOAT_L - 20);
    ctx.fillStyle = gray(48);
    for (let row = 0; row < 5; row++)
        for (let col = 0; col < 3; col++) {
            ctx.beginPath();
            ctx.arc(-7 + col * 7, -BOAT_L / 2 + 13 + row * 7, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    return c;
}

function drawBoat(ctx: CanvasRenderingContext2D, b: Boat, T: number, a: DrawAssets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(1.25, 1.25);
    const sinking = b.sunk > 0;
    if (sinking) {
        ctx.rotate(0.35 * Math.min(1, b.sunk));
        ctx.globalAlpha = Math.max(0, 1 - b.sunk / 3);
    }
    // Kjølvann: en hvit V bak båten
    if (!sinking && b.landed === 0) {
        // Skumstripe bak båten: brede, bleknende flekker
        for (let k = 0; k < 4; k++) {
            const y = BOAT_L * 0.5 + k * 18;
            const w = BOAT_W * (0.5 + k * 0.28);
            ctx.fillStyle = `rgba(236,233,222,${0.5 - k * 0.11})`;
            ctx.beginPath();
            ctx.ellipse(Math.sin(T * 5 + k + b.id) * 2, y, w / 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Baugbølge
        ctx.strokeStyle = 'rgba(236,233,222,.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-BOAT_W / 2 - 4, -BOAT_L / 2 + 10);
        ctx.quadraticCurveTo(0, -BOAT_L / 2 - 10, BOAT_W / 2 + 4, -BOAT_L / 2 + 10);
        ctx.stroke();
    }
    // Skrog, lasterom og soldater er ferdigtegnet (drawBoatSprite) - ett drawImage per båt.
    const spr = b.mine ? a.boatMine : a.boatOther;
    if (spr) {
        if (sinking) ctx.filter = 'brightness(0.6)';
        ctx.drawImage(spr, -BOAT_W / 2 - 4, -BOAT_L / 2 - 4);
        ctx.filter = 'none';
    }
    // Rampa foran: nede når båten har gått på grunn
    ctx.fillStyle = gray(150);
    if (b.landed > 0) ctx.fillRect(-BOAT_W / 2 + 2, -BOAT_L / 2 - 16, BOAT_W - 4, 18);
    else ctx.fillRect(-BOAT_W / 2 + 2, -BOAT_L / 2, BOAT_W - 4, 6);
    ctx.restore();
    // Soldatene løper opp stranda fra en landet båt
    if (b.landed > 0 && b.landed < 5) {
        const k = Math.min(1, b.landed / 4);
        ctx.fillStyle = gray(30, 1 - Math.max(0, b.landed - 4));
        for (let i = 0; i < 9; i++) {
            const x = b.x + ((i % 3) - 1) * 9 + Math.sin(i * 7) * 4;
            const y = b.y - BOAT_L / 2 - 20 - k * (70 + (i % 4) * 14);
            ctx.beginPath();
            ctx.arc(x, y, 2.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawObstacle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    kind: 'kryss' | 'pale',
    alpha: number
) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    // Skygge mot nordøst
    ctx.strokeStyle = 'rgba(8,7,5,.45)';
    ctx.lineWidth = 3;
    if (kind === 'kryss') {
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(14, 4);
        ctx.moveTo(8, -8);
        ctx.lineTo(18, 6);
        ctx.stroke();
        ctx.strokeStyle = gray(30);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-9, -9);
        ctx.lineTo(9, 9);
        ctx.moveTo(9, -9);
        ctx.lineTo(-9, 9);
        ctx.moveTo(0, -11);
        ctx.lineTo(0, 11);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(16, 8);
        ctx.stroke();
        ctx.strokeStyle = gray(38);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(0, -8);
        ctx.stroke();
        // Mina på toppen
        ctx.fillStyle = gray(20);
        ctx.beginPath();
        ctx.arc(0, -9, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Verden
// ---------------------------------------------------------------------------

export function drawWorld(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    a: DrawAssets,
    st: DrawState
) {
    const T = performance.now() / 1000;
    const sh = st.shake * 10;
    ctx.fillStyle = '#12110e';
    ctx.fillRect(0, 0, tf.w, tf.h);
    ctx.save();
    ctx.translate(tf.ox + (Math.random() - 0.5) * sh, tf.oy + (Math.random() - 0.5) * sh);
    ctx.scale(tf.s, tf.s);

    const wl = waterline(g);
    // Land, hindrene på tørr sand og havet opp til vannkanten ligger i ett ferdig lag.
    // Vannkanten flytter seg omtrent én piksel i sekundet, så laget tegnes bare om når
    // den har flyttet seg eller et hinder er sprengt - ikke hvert bilde.
    const top = Math.floor(wl);
    const gone = g.obstacles.reduce((n, o) => n + (o.gone ? 1 : 0), 0);
    if (a.world && a.worldGone === gone && a.worldTop !== undefined && top < a.worldTop) {
        // Vannet har steget: tegn bare den nye havstripa.
        const h = a.worldTop - top;
        a.world.getContext('2d')!.drawImage(a.sea, 0, top, W, h, 0, top, W, h);
        a.worldTop = top;
    }
    const key = `${gone}`;
    if (a.worldKey !== key || !a.world || a.worldTop === undefined || top > a.worldTop) {
        if (!a.world) {
            a.world = document.createElement('canvas');
            a.world.width = W;
            a.world.height = H;
        }
        const w = a.world.getContext('2d')!;
        w.drawImage(a.land, 0, 0);
        for (const o of g.obstacles)
            if (!o.gone && o.y < wl - 2) drawObstacle(w, o.x, o.y, o.kind, 1);
        w.drawImage(a.sea, 0, top, W, H - top, 0, top, W, H - top);
        a.worldKey = key;
        a.worldTop = top;
        a.worldGone = gone;
    }
    ctx.drawImage(a.world, 0, 0);
    // Hindre like under vannflaten: bare en krusning (den som ser godt etter, ser dem)
    for (const o of g.obstacles) {
        if (o.gone || o.y < wl - 2) continue;
        const depth = o.y - wl;
        if (depth > 26) continue;
        ctx.strokeStyle = `rgba(210,206,194,${0.28 * (1 - depth / 26)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, 9, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Brenningene langs vannkanten
    ctx.strokeStyle = 'rgba(236,233,222,.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, wl + Math.sin(x * 0.02 + T * 1.6) * 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236,233,222,.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, wl + 16 + Math.sin(x * 0.017 + T * 1.2 + 2) * 4);
    ctx.stroke();

    // Sprengte spor: gule fettstiftlinjer og flagg gjennom hinderbeltet
    // Sporene tegnes til et eget lag bare når et nytt spor kommer til (fettstift med
    // skjelving er for dyrt å regne ut hvert bilde på en Chromebook).
    if (a.laneCount !== g.lanes.length || !a.laneLayer) drawLaneLayer(a, g);
    ctx.drawImage(a.laneLayer!, 0, LANE_TOP);

    // Bunkerne på skrenten
    for (const b of g.bunkers) {
        ctx.save();
        ctx.translate(b.x, b.y);
        if (b.dead > 0) {
            // Ruiner, flammer og en høy røyksøyle som blir stående
            ctx.fillStyle = `rgba(240,138,42,${0.6 + 0.3 * Math.sin(T * 11 + b.id)})`;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            for (let k = 0; k < 6; k++) {
                const q = (T * 0.35 + k / 6) % 1;
                ctx.globalAlpha = 0.6 * (1 - q);
                ctx.drawImage(a.smoke, -25 + q * 50, -30 - q * 170, 50 + q * 90, 50 + q * 90);
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = gray(60);
            for (let k = 0; k < 6; k++)
                ctx.fillRect(-18 + ((k * 13) % 30), -8 + ((k * 7) % 16), 8, 6);
            for (let k = 0; k < 4; k++) {
                const t = (T * 0.6 + k * 0.25) % 1;
                ctx.fillStyle = `rgba(30,28,24,${0.45 * (1 - t)})`;
                ctx.beginPath();
                ctx.arc(8 + t * 30, -10 - t * 50, 8 + t * 18, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.scale(1.35, 1.35);
            ctx.fillStyle = 'rgba(8,7,5,.55)';
            ctx.fillRect(-16, -9, 38, 26);
            ctx.fillStyle = gray(b.active ? 176 : 120);
            ctx.fillRect(-20, -13, 38, 26);
            ctx.fillStyle = gray(b.active ? 140 : 100);
            ctx.fillRect(-20, -13, 38, 6);
            ctx.fillStyle = gray(15);
            ctx.fillRect(-12, 6, 22, 5); // skyteskåret mot havet
            if (b.active) {
                // Kanonløpet peker ut mot havet
                ctx.strokeStyle = gray(25);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-1, 10);
                ctx.lineTo(-1, 22);
                ctx.stroke();
            }
            ctx.scale(1 / 1.35, 1 / 1.35);
            if (b.active) {
                const pulse = 36 + Math.sin(T * 5 + b.id) * 3;
                ctx.strokeStyle = 'rgba(215,55,43,.9)';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(0, 0, pulse, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (b.flash > 0) {
                ctx.fillStyle = `rgba(255,250,230,${b.flash * 4})`;
                ctx.beginPath();
                ctx.arc(-1, 16, 10 + b.flash * 30, 0, Math.PI * 2);
                ctx.fill();
            }
            // Innskytingen: røde streker - jo flere, jo bedre treffer bunkeren
            if (b.active) {
                const n = Math.round(b.zero * 5);
                for (let k = 0; k < n; k++)
                    crayonLine(
                        ctx,
                        [
                            [-20 + k * 8, -22],
                            [-16 + k * 8, -30],
                        ],
                        RED,
                        3,
                        b.id * 9 + k
                    );
            }
        }
        ctx.restore();
    }

    // Båtene
    for (const b of g.boats) drawBoat(ctx, b, T, a);
    // Din båt: gul ring
    if (g.me) crayonCircle(ctx, g.me.x, g.me.y, BOAT_L * 0.72, YELLOW, 4, 77);

    // Granater på vei: rød ring som fylles
    for (const s of g.shells) {
        const k = 1 - Math.max(0, s.t) / 1.6;
        const blink = s.t < 0.45 && Math.sin(T * 40) > 0;
        crayonCircle(ctx, s.x, s.y, SHELL_R, blink ? '#ff6a55' : RED, s.atMe ? 5 : 3, s.id * 3, 1);
        ctx.fillStyle = `rgba(215,55,43,${0.1 + 0.25 * k})`;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.arc(s.x, s.y, SHELL_R - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
        ctx.closePath();
        ctx.fill();
    }

    // Flåtens granater: en lysstripe fra havet opp mot bunkeren
    for (const n of g.navals) {
        const k = 1 - n.t / 1.1;
        const y = H + 60 - (H + 60 - n.y) * k;
        ctx.strokeStyle = 'rgba(255,250,235,.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(n.x + (1 - k) * 60, y + 60);
        ctx.lineTo(n.x + (1 - k) * 40, y);
        ctx.stroke();
        crayonCircle(ctx, n.x, n.y, 30, YELLOW, 4, n.id);
    }

    // Effekter
    for (const f of g.fx) {
        const p = f.t / f.life;
        if (f.kind === 'splash') {
            // Vannsøyle: en høy, lys søyle som faller sammen
            const hgt = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 70;
            ctx.fillStyle = `rgba(240,238,228,${0.75 * (1 - p)})`;
            ctx.beginPath();
            ctx.ellipse(f.x, f.y - hgt / 2, 12 + p * 10, hgt / 2 + 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(240,238,228,${1 - p})`;
            ctx.lineWidth = 4;
            for (let k = 0; k < 10; k++) {
                const ang = (k / 10) * Math.PI * 2;
                const r0 = 6 + p * 20;
                const r1 = r0 + 14 + p * 26;
                ctx.beginPath();
                ctx.moveTo(f.x + Math.cos(ang) * r0, f.y + Math.sin(ang) * r0);
                ctx.lineTo(f.x + Math.cos(ang) * r1, f.y + Math.sin(ang) * r1);
                ctx.stroke();
            }
            ctx.fillStyle = `rgba(240,238,228,${0.6 * (1 - p)})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 10 + p * 36, 0, Math.PI * 2);
            ctx.fill();
        } else if (f.kind === 'boom' || f.kind === 'mine' || f.kind === 'naval') {
            const big = f.kind === 'naval' ? 2.2 : f.kind === 'mine' ? 1.4 : 1;
            if (p < 0.25) {
                ctx.fillStyle = `rgba(255,250,235,${1 - p * 4})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, (20 + p * 160) * big, 0, Math.PI * 2);
                ctx.fill();
            }
            // Ildkule: den eneste oransje fargen i bildet er ild.
            if (p < 0.55) {
                const q = p / 0.55;
                ctx.fillStyle = `rgba(240,138,42,${0.9 * (1 - q)})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y - q * 20 * big, (14 + q * 26) * big, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(255,214,120,${0.8 * (1 - q)})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y - q * 20 * big, (7 + q * 12) * big, 0, Math.PI * 2);
                ctx.fill();
            }
            // Splinter og jord som kastes ut
            ctx.strokeStyle = `rgba(20,18,14,${0.8 * (1 - p)})`;
            ctx.lineWidth = 2.5;
            for (let k = 0; k < 9; k++) {
                const ang = k * 0.7 + f.x;
                const r0 = (8 + p * 60) * big;
                ctx.beginPath();
                ctx.moveTo(f.x + Math.cos(ang) * r0, f.y + Math.sin(ang) * r0 * 0.7);
                ctx.lineTo(f.x + Math.cos(ang) * (r0 + 10), f.y + Math.sin(ang) * (r0 + 10) * 0.7);
                ctx.stroke();
            }
            for (let k = 0; k < 7; k++) {
                const ang = k * 2.4;
                const rr = (10 + p * 40) * big;
                ctx.fillStyle = `rgba(22,20,16,${0.6 * (1 - p)})`;
                ctx.beginPath();
                ctx.arc(
                    f.x + Math.cos(ang) * rr * 0.6,
                    f.y + Math.sin(ang) * rr * 0.5 - p * 30 * big,
                    rr * 0.7,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else if (f.kind === 'tracer' && f.x2 !== undefined && f.y2 !== undefined) {
            // Sporlys: en glødende strek fra bunkeren ut mot målet
            const k = Math.min(1, p * 2.2);
            const x1 = f.x + (f.x2 - f.x) * k;
            const y1 = f.y + (f.y2 - f.y) * k;
            const x0 = f.x + (f.x2 - f.x) * Math.max(0, k - 0.3);
            const y0 = f.y + (f.y2 - f.y) * Math.max(0, k - 0.3);
            ctx.strokeStyle = `rgba(255,150,60,${1 - p})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,236,190,${1 - p})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
        } else if (f.kind === 'wreck') {
            // Brennende vrak: en røyksøyle som driver mot land
            const fade = Math.min(1, (f.life - f.t) / 3);
            for (let k = 0; k < 3; k++) {
                const q = (f.t * 0.5 + k * 0.33) % 1;
                ctx.globalAlpha = 0.55 * (1 - q) * fade;
                ctx.drawImage(
                    a.smoke,
                    f.x - 30 - q * 40 + q * 60,
                    f.y - 30 - q * 120,
                    60 + q * 90,
                    60 + q * 90
                );
            }
            // Oljeflak som brer seg ut
            ctx.globalAlpha = 0.45 * fade;
            ctx.fillStyle = '#0c0b09';
            ctx.beginPath();
            ctx.ellipse(
                f.x,
                f.y + 6,
                20 + Math.min(40, f.t * 6),
                10 + Math.min(18, f.t * 3),
                0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            // Flammer
            ctx.globalAlpha = fade * (0.7 + 0.3 * Math.sin(T * 13 + f.x));
            ctx.fillStyle = 'rgba(240,138,42,.9)';
            for (let k = 0; k < 3; k++) {
                ctx.beginPath();
                ctx.arc(
                    f.x - 8 + k * 8,
                    f.y - 4 - Math.abs(Math.sin(T * 9 + k)) * 6,
                    6,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,220,140,.9)';
            ctx.beginPath();
            ctx.arc(f.x, f.y - 3, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (f.kind === 'barrage') {
            // Flåtens sperreild på skrenten: blits, jord og en røyksøyle
            if (p < 0.12) {
                ctx.fillStyle = `rgba(255,250,235,${1 - p * 8})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, 14 + p * 200, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 0.8 * (1 - p);
            ctx.drawImage(a.smoke, f.x - 40 - p * 30, f.y - 50 - p * 70, 80 + p * 90, 80 + p * 90);
            ctx.globalAlpha = 1;
        } else if (f.kind === 'lane') {
            ctx.fillStyle = `rgba(241,194,50,${0.35 * (1 - p)})`;
            ctx.fillRect(f.x - LANE_W / 2, OBST_Y0 - 20, LANE_W, OBST_Y1 - OBST_Y0 + 40);
        }
    }

    // Siktet: der pekeren er på skrenten, viser en gul ring hvor salven vil spre seg.
    if (!st.menu && st.hoverX !== null && st.hoverY !== null && st.hoverY < BEACH_TOP + 24) {
        const ready = g.reload <= 0;
        const hx = st.hoverX;
        const hy = st.hoverY;
        const col = ready ? YELLOW : 'rgba(231,224,205,.55)';
        crayonCircle(ctx, hx, hy, SALVO_SPREAD, col, ready ? 4 : 2.5, 5);
        crayonLine(
            ctx,
            [
                [hx - SALVO_SPREAD - 16, hy],
                [hx - 10, hy],
            ],
            col,
            3,
            6
        );
        crayonLine(
            ctx,
            [
                [hx + 10, hy],
                [hx + SALVO_SPREAD + 16, hy],
            ],
            col,
            3,
            7
        );
        crayonLine(
            ctx,
            [
                [hx, hy - SALVO_SPREAD - 12],
                [hx, hy - 10],
            ],
            col,
            3,
            8
        );
        crayonLine(
            ctx,
            [
                [hx, hy + 10],
                [hx, hy + SALVO_SPREAD + 12],
            ],
            col,
            3,
            9
        );
    }

    // Røyk som driver langs stranda fra brennende vrak og nedslag
    for (let k = 0; k < 4; k++) {
        const x = ((k * 263 + T * (14 + k * 3)) % (W + 400)) - 200;
        const y = BEACH_TOP + 20 + ((k * 71) % 170);
        const rad = 70 + ((k * 37) % 60);
        ctx.drawImage(a.smoke, x - rad, y - rad, rad * 2, rad * 2);
    }

    // Vignett (kornet ligger allerede i land og hav)
    // (Vignetten er bakt inn i land og hav.)
    ctx.restore();
}

// ---------------------------------------------------------------------------
// HUD: filmkanten øverst, båtkortet og slagskipene nederst
// ---------------------------------------------------------------------------

export function drawHud(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    st: { mult: number }
) {
    const u = Math.max(0.72, Math.min(1.25, Math.min(tf.w / 1366, tf.h / 768) * 1.1));
    // Filmkant
    ctx.fillStyle = '#0d0c0a';
    ctx.fillRect(0, 0, tf.w, 34 * u);
    ctx.fillStyle = 'rgba(231,224,205,.25)';
    for (let x = 8; x < tf.w; x += 44 * u) ctx.fillRect(x, 3 * u, 20 * u, 5 * u);
    ctx.font = `900 ${17 * u}px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PAPER;
    ctx.fillText(`6. JUNI 1944 · OMAHA · KL ${clock(g)}`, 12 * u, 21 * u);
    // Tidevannsmåler
    const tide = (waterline(g) - 452) / (318 - 452);
    const tx = 12 * u + ctx.measureText(`6. JUNI 1944 · OMAHA · KL ${clock(g)}`).width + 26 * u;
    ctx.font = `900 ${14 * u}px ${MONO}`;
    ctx.fillStyle = tide > 0.45 ? '#ff8a78' : YELLOW;
    ctx.fillText(
        tide > 0.45 ? 'FLO - HINDRENE ER UNDER VANN' : 'LAVVANN - HINDRENE SYNES',
        tx,
        21 * u
    );

    // Båtkortet nede til venstre: én båt per bølge
    const bx = 14 * u;
    const by = tf.h - 74 * u;
    ctx.fillStyle = 'rgba(231,224,205,.94)';
    ctx.fillRect(bx, by, 248 * u, 60 * u);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 248 * u, 60 * u);
    ctx.fillStyle = INK;
    ctx.font = `900 ${13 * u}px ${MONO}`;
    ctx.fillText(`I LAND ${g.landed} - MÅL ${NEED} AV ${WAVES}`, bx + 10 * u, by + 14 * u);
    for (let i = 0; i < WAVES; i++) {
        const x = bx + 12 * u + i * 29 * u;
        const y = by + 26 * u;
        const done = i < g.landed;
        const lost = i >= g.landed && i < g.landed + g.lost;
        ctx.fillStyle = done ? '#2f6b2f' : lost ? RED : 'rgba(21,19,15,.18)';
        ctx.fillRect(x, y, 16 * u, 26 * u);
        if (lost) {
            ctx.strokeStyle = PAPER;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 3 * u, y + 5 * u);
            ctx.lineTo(x + 13 * u, y + 21 * u);
            ctx.moveTo(x + 13 * u, y + 5 * u);
            ctx.lineTo(x + 3 * u, y + 21 * u);
            ctx.stroke();
        }
    }

    // Mållinja etter den femte båten
    const gx = bx + 12 * u + NEED * 29 * u - 6.5 * u;
    ctx.strokeStyle = '#b8862a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx, by + 22 * u);
    ctx.lineTo(gx, by + 56 * u);
    ctx.stroke();

    // Poeng og multiplikator
    ctx.font = `900 ${28 * u}px ${MONO}`;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = 'rgba(12,11,9,.85)';
    ctx.lineWidth = 5;
    const sx = bx + 262 * u;
    ctx.strokeText(Math.floor(g.score).toLocaleString('nb-NO'), sx, tf.h - 44 * u);
    ctx.fillText(Math.floor(g.score).toLocaleString('nb-NO'), sx, tf.h - 44 * u);
    if (st.mult > 1) {
        ctx.font = `900 ${16 * u}px ${MONO}`;
        ctx.fillStyle = YELLOW;
        ctx.fillText(`×${st.mult}`, sx, tf.h - 20 * u);
    }

    // Slagskipene nede til høyre: klar eller lader
    const cx = tf.w - 70 * u;
    const cy = tf.h - 62 * u;
    const ready = g.reload <= 0;
    ctx.fillStyle = 'rgba(231,224,205,.94)';
    ctx.beginPath();
    ctx.arc(cx, cy, 44 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = ready ? '#b8862a' : '#6d675a';
    ctx.lineWidth = 7 * u;
    ctx.beginPath();
    ctx.arc(
        cx,
        cy,
        34 * u,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * (1 - Math.max(0, g.reload) / RELOAD)
    );
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `900 ${11 * u}px ${MONO}`;
    ctx.fillText('SLAGSKIP', cx, cy - 10 * u);
    ctx.font = `900 ${16 * u}px ${MONO}`;
    ctx.fillStyle = ready ? '#8a2a20' : INK;
    ctx.fillText(ready ? 'KLAR' : `${Math.ceil(g.reload)}s`, cx, cy + 10 * u);
    ctx.textAlign = 'left';
}

/** Punkt i verden -> punkt på skjermen (for lapper og flytetekst). */
export function toScreenPt(tf: Transform, x: number, y: number) {
    return { x: tf.ox + x * tf.s, y: tf.oy + y * tf.s };
}
