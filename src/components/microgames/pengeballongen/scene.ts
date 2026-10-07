// Verden: tonestein-himmel, skyer, fire fjell-lag i parallakse, forgrunnsfjellet i kornet
// kritt med skrapt hvitt på snø og kam, nær-båndet, knausene, kongens utgifter, tingstuene,
// funnene og Stortinget. Tegningen leser bare spillet.

import { blandFarge, flyttMønster, hash, hentKunst, kvalitet, P, støy } from './art';
import { krone, tegnFunn, tegnStortinget, tegnTingstue } from './figures';
import { iBåndet, nærhet } from './rules';
import { bakke, veiForÅr } from './terrain';
import { tegnBevilg } from './porter';
import type { Game } from './state';
import { TUNING } from './tuning';

const B = TUNING.ballong;
export const FONT = '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif';


/**
 * Én himmel per tiår, så filmbildene ikke er like: kjølig grågrønt i 1815, rosa morgen da
 * bøndene tok flertallet, klar blå med Ueland, rav i dampens tiår, fiolett skumring under
 * striden, varmt gull mot 1884. `tone` farger fjellene langt bak.
 */
const TIÅR = [
    { fra: 1815, topp: '#c6cbbd', bunn: '#e4e6db', tone: '#9aa597' },
    { fra: 1831, topp: '#d4b4a8', bunn: '#f0dccf', tone: '#a28a8c' },
    { fra: 1843, topp: '#a6bacb', bunn: '#e0e7ea', tone: '#8495a8' },
    { fra: 1853, topp: '#d3b07a', bunn: '#efdbb2', tone: '#9e8a66' },
    { fra: 1863, topp: '#a29fc0', bunn: '#dfdbe8', tone: '#7f7e9e' },
    { fra: 1874, topp: '#d9c9a8', bunn: '#f1e6cc', tone: '#a89a7a' },
];

/** Fargen for året: glir over to år inn i neste tiår. */
function tiår(år: number, nøkkel: 'topp' | 'bunn' | 'tone'): string {
    let i = 0;
    for (let k = 0; k < TIÅR.length; k++) if (år >= TIÅR[k].fra) i = k;
    const a = TIÅR[i];
    const b = TIÅR[i + 1];
    if (!b) return a[nøkkel];
    const t = Math.min(1, Math.max(0, (år - (b.fra - 2)) / 2));
    return blandFarge(a[nøkkel], b[nøkkel], t);
}

export function tegnHimmel(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, tiår(g.år, 'topp'));
    sky.addColorStop(1, tiår(g.år, 'bunn'));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 540);
    const k = hentKunst(ctx);
    if (k.kornLys && kvalitet() !== 'lav') {
        flyttMønster(k.kornLys, -g.x * 0.02);
        ctx.fillStyle = k.kornLys;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, 960, 420);
        ctx.globalAlpha = 1;
    }
    // Sola bryter gjennom bak Stortinget i 1884.
    if (g.år > 1882) {
        const s = Math.min(1, (g.år - 1882) / 2);
        const sx = 760;
        const sy = 250;
        ctx.save();
        ctx.globalAlpha = 0.35 * s;
        ctx.strokeStyle = P.hvit;
        ctx.lineWidth = 14;
        for (let i = 0; i < 9; i++) {
            const a = -Math.PI * (0.1 + i * 0.1) + Math.sin(tid * 0.3 + i) * 0.02;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(a) * 700, sy + Math.sin(a) * 700);
            ctx.stroke();
        }
        ctx.globalAlpha = 0.8 * s;
        ctx.fillStyle = '#f7ecd2';
        ctx.beginPath();
        ctx.arc(sx, sy, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Skyer: tre lag i ulik høyde og størrelse, så himmelen aldri gjentar seg likt.
    const lag = kvalitet() === 'lav' ? 2 : 3;
    for (let l = 0; l < lag; l++) {
        const par = [0.03, 0.07, 0.13][l];
        const span = 1500 + l * 230;
        for (let i = 0; i < 5; i++) {
            const n = i * 5 + l * 17;
            const bilde = k.skyer[(i * 3 + l) % k.skyer.length];
            const sk = (0.55 + hash(n) * 0.75) * [0.7, 1, 1.25][l];
            let x = (i * (span / 5) + hash(n + 1) * 160 - g.x * par - tid * (3 + l * 3)) % span;
            if (x < -360) x += span;
            const y = 18 + l * 52 + hash(n + 2) * 70;
            ctx.globalAlpha = [0.45, 0.6, 0.72][l];
            ctx.drawImage(bilde, x, y, bilde.width * sk * 1.25, bilde.height * sk * (0.45 + hash(n + 3) * 0.3));
        }
    }
    ctx.globalAlpha = 1;
    tegnFugler(ctx, g, tid);
}

/** Fugleflokker i V som krysser himmelen i ulik høyde (bare pynt langt borte). */
function tegnFugler(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.3;
    for (let f = 0; f < 2; f++) {
        const span = 2200 + f * 700;
        const fx = span - ((g.x * (0.1 + f * 0.05) + tid * (26 + f * 10) + f * 900) % span) - 200;
        const fy = 70 + f * 60 + Math.sin(tid * 0.4 + f) * 14;
        const n = 5 + f * 2;
        for (let i = 0; i < n; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const rad = Math.ceil(i / 2);
            const bx = fx + rad * 16;
            const by = fy + side * rad * 9;
            const vinge = Math.sin(tid * 9 + i * 1.7) * 3;
            ctx.beginPath();
            ctx.moveTo(bx - 5, by - vinge);
            ctx.quadraticCurveTo(bx - 2, by - 2, bx, by);
            ctx.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - vinge);
            ctx.stroke();
        }
    }
}

interface Lag {
    par: number;
    base: number;
    amp: number;
    frek: number;
    farge: string;
    snø: boolean;
    korn: boolean;
    dis: number;
}

const LAG: Lag[] = [
    { par: 0.025, base: 270, amp: 190, frek: 420, farge: '#c3c9c4', snø: true, korn: false, dis: 0.35 },
    { par: 0.06, base: 330, amp: 230, frek: 300, farge: '#b7beb3', snø: true, korn: false, dis: 0.45 },
    { par: 0.18, base: 390, amp: 170, frek: 200, farge: '#9ca598', snø: true, korn: true, dis: 0.5 },
    { par: 0.4, base: 440, amp: 110, frek: 140, farge: '#7d877f', snø: false, korn: true, dis: 0.55 },
];

function fjellY(l: Lag, wx: number, i: number) {
    const n = støy(wx / l.frek + i * 10) * 0.7 + støy(wx / (l.frek * 0.37) + 3 + i) * 0.3;
    return l.base - l.amp * Math.pow(n, 1.6);
}

export function tegnBakgrunn(ctx: CanvasRenderingContext2D, g: Game) {
    const k = hentKunst(ctx);
    const lav = kvalitet() === 'lav';
    const tone = tiår(g.år, 'tone');
    const dis = parseInt(tiår(g.år, 'bunn').slice(1), 16);
    const disRgb = `${(dis >> 16) & 255},${(dis >> 8) & 255},${dis & 255}`;
    LAG.forEach((l, i) => {
        const off = g.x * l.par;
        ctx.beginPath();
        ctx.moveTo(-10, 540);
        for (let sx = -10; sx <= 970; sx += 12) ctx.lineTo(sx, fjellY(l, sx + off, i));
        ctx.lineTo(970, 540);
        ctx.closePath();
        ctx.fillStyle = blandFarge(l.farge, tone, 0.3 + 0.08 * i);
        ctx.fill();
        if (l.korn && k.korn && !lav) {
            flyttMønster(k.korn, -off);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = k.korn;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        if (l.snø) {
            // Skrapt hvitt på toppene: alt over snøgrensa.
            ctx.save();
            ctx.clip();
            ctx.fillStyle = P.hvit;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            for (let sx = -10; sx <= 970; sx += 20) {
                const y = l.base - l.amp * 0.42 + Math.sin((sx + off) * 0.05) * 6 + støy((sx + off) / 40) * 14;
                ctx.lineTo(sx, y);
            }
            ctx.lineTo(970, 0);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
        }
        // Dis i dalene: lys halvtone som stiger fra bunnen.
        const d = ctx.createLinearGradient(0, l.base - 40, 0, l.base + 70);
        d.addColorStop(0, `rgba(${disRgb},0)`);
        d.addColorStop(1, `rgba(${disRgb},${l.dis})`);
        ctx.fillStyle = d;
        ctx.fillRect(0, l.base - 40, 960, 540);
    });
}

/**
 * Hver epoke har sitt eget fjell: grønne lier i Hallingdal og på Ringerike, brun kyst ved
 * Egersund, blågrå høyfjell på Filefjell, gårdsland ved Eidsvoll, mørk skifer i Jotunheimen og
 * varm stein i 1884. Fargene glir over i hverandre mellom brettene.
 */
const EPOKE: { fra: number; lys: string; mørk: string; snø: number }[] = [
    { fra: 1815, lys: '#6b7a5e', mørk: '#3c4639', snø: 395 },
    { fra: 1824, lys: '#71805a', mørk: '#3f4a35', snø: 390 },
    { fra: 1833, lys: '#7a715d', mørk: '#463f35', snø: 380 },
    { fra: 1842, lys: '#66727c', mørk: '#353d45', snø: 410 },
    { fra: 1854, lys: '#6f7b55', mørk: '#3d4632', snø: 375 },
    { fra: 1866, lys: '#5c6470', mørk: '#2c3139', snø: 425 },
    { fra: 1882, lys: '#857760', mørk: '#4a4033', snø: 380 },
];

function epoke(år: number) {
    let i = 0;
    for (let k = 0; k < EPOKE.length; k++) if (år >= EPOKE[k].fra) i = k;
    const a = EPOKE[i];
    const b = EPOKE[Math.min(EPOKE.length - 1, i + 1)];
    // Glir over de siste to årene før neste epoke.
    const u = b === a ? 0 : Math.min(1, Math.max(0, (år - (b.fra - 2)) / 2));
    return {
        lys: blandFarge(a.lys, b.lys, u),
        mørk: blandFarge(a.mørk, b.mørk, u),
        snø: a.snø + (b.snø - a.snø) * u,
    };
}

/** Forgrunnsfjellet og alt som står på det. */
export function tegnForgrunn(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const ter = g.ter;
    const x0 = g.x - B.skjermX;
    const k = hentKunst(ctx);
    const steg = 6;
    const ys: number[] = [];
    for (let sx = -12; sx <= 972; sx += steg) ys.push(bakke(ter, x0 + sx));

    // Tingstuene står bak forgrunnskammen.
    for (const v of ter.valg) {
        const sx = v.x - x0;
        // Før 1833 vinket bøndene embetsmennene gjennom: de valgene vises ikke.
        if (!v.ekte || sx < -80 || sx > 1040) continue;
        tegnTingstue(ctx, sx, bakke(ter, v.x) + 2, v.ekte, v.år, tid, !v.ekte);
    }

    // Stortinget på Løvebakken, der ballongen lander.
    const xs = veiForÅr(TUNING.år.slutt) + 140 - x0;
    if (xs > -120 && xs < 1100) tegnStortinget(ctx, xs, bakke(ter, xs + x0) + 4);

    ctx.beginPath();
    ctx.moveTo(-12, 540);
    ys.forEach((y, i) => ctx.lineTo(-12 + i * steg, y));
    ctx.lineTo(972, 540);
    ctx.closePath();
    const ep = epoke(g.år);
    const grad = ctx.createLinearGradient(0, 260, 0, 540);
    grad.addColorStop(0, ep.lys);
    grad.addColorStop(0.5, ep.mørk);
    grad.addColorStop(1, P.kritt);
    ctx.fillStyle = grad;
    ctx.fill();
    if (k.korn) {
        flyttMønster(k.korn, -x0);
        ctx.fillStyle = k.korn;
        ctx.fill();
    }

    // Lys fra sola oppe til høyre: en bred, lys kant langs overflaten, sterkest på skråninger
    // som vender mot lyset. Skyggesidene får litografiens skravur.
    ctx.save();
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(236,232,210,0.16)';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ys.forEach((y, i) => (i ? ctx.lineTo(-12 + i * steg, y) : ctx.moveTo(-12, y)));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,236,214,0.22)';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,22,24,0.32)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 1; i < ys.length; i += 1) {
        const ned = ys[i] > ys[i - 1] + 1.2;
        if (!ned) continue;
        const sx = -12 + i * steg;
        const wx = Math.floor((x0 + sx) / steg);
        const l = 10 + hash(wx) * 16;
        ctx.moveTo(sx, ys[i] + 5);
        ctx.lineTo(sx - l * 0.5, ys[i] + 5 + l);
    }
    ctx.stroke();
    ctx.restore();

    // Skrapt hvitt: snø på høye topper og lys langs kammene som vender mot venstre.
    ctx.fillStyle = P.hvit;
    ctx.beginPath();
    const dybde = (i: number) =>
        Math.min(26, Math.max(0, (ep.snø - ys[i]) * 0.4)) *
        (0.75 + 0.5 * hash(i + Math.floor(x0 / steg)));
    for (let i = 1; i < ys.length; i++) {
        const d0 = dybde(i - 1);
        const d1 = dybde(i);
        if (d0 <= 0 && d1 <= 0) continue;
        const sx = -12 + i * steg;
        ctx.moveTo(sx - steg, ys[i - 1] - 0.5);
        ctx.lineTo(sx, ys[i] - 0.5);
        ctx.lineTo(sx, ys[i] + d1);
        ctx.lineTo(sx - steg, ys[i - 1] + d0);
        ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = P.hvit;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let i = 1; i < ys.length; i++) {
        const opp = ys[i] < ys[i - 1] - 0.6;
        const sx = -12 + i * steg;
        if (opp) {
            ctx.moveTo(sx - steg, ys[i - 1] + 2.5);
            ctx.lineTo(sx, ys[i] + 2.5);
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Små graner i dalbunnene (store fjell, små figurer).
    ctx.fillStyle = '#1f2326';
    const første = Math.floor(x0 / 46);
    for (let n = første; n < første + 24; n++) {
        if (hash(n * 13) < 0.45) continue;
        const wx = n * 46 + hash(n * 7) * 30;
        const y = bakke(ter, wx);
        if (y < 448) continue;
        const sx = wx - x0;
        const h = 9 + hash(n * 3) * 10;
        ctx.beginPath();
        ctx.moveTo(sx - h * 0.32, y + 1);
        ctx.lineTo(sx, y - h);
        ctx.lineTo(sx + h * 0.32, y + 1);
        ctx.fill();
    }
}

/** Nær-båndet: en prikket strek i skrapt hvitt. Under den vokser Ueland-gangeren. */
export function tegnBånd(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    if (g.år < g.uelandÅr || g.mode !== 'play') return;
    const x0 = g.x - B.skjermX;
    const inne = iBåndet(g);
    const a = Math.min(1, (g.år - g.uelandÅr) / 0.6);
    for (let sx = 0; sx <= 960; sx += 9) {
        const y = g.y + nærhet(g.ter, x0 + sx, g.y) - TUNING.ganger.nær;
        const nær = Math.abs(sx - B.skjermX) < 70;
        ctx.globalAlpha = a * (nær && inne ? 0.95 : 0.5);
        ctx.fillStyle = nær && inne ? P.silkeLys : P.hvit;
        const r = nær && inne ? 2 + Math.sin(tid * 10 + sx) * 0.5 : 1.5;
        ctx.fillRect(sx - r / 2, y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
}

/** Brennerens glød på fjellet rett under ballongen. */
export function tegnGlød(ctx: CanvasRenderingContext2D, g: Game) {
    if (g.varme < 0.05) return;
    const by = bakke(g.ter, g.x);
    const avst = by - g.y;
    const s = g.varme * Math.max(0, 1 - avst / 260);
    if (s <= 0.01) return;
    const r = ctx.createRadialGradient(B.skjermX, by, 4, B.skjermX, by, 90);
    r.addColorStop(0, `rgba(226,140,70,${(0.45 * s).toFixed(3)})`);
    r.addColorStop(1, 'rgba(226,140,70,0)');
    ctx.fillStyle = r;
    ctx.fillRect(B.skjermX - 90, by - 90, 180, 180);
}

/** Knausene og kongens utgifter. */
export function tegnHindre(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const ter = g.ter;
    const x0 = g.x - B.skjermX;
    const k = hentKunst(ctx);
    for (const kn of ter.knauser) {
        const a = kn.x0 - x0;
        const b = kn.x1 - x0;
        if (b < -160 || a > 1120) continue;
        tegnPort(ctx, kn, a, b, k.korn, x0, tid);
    }
    tegnRegjering(ctx, g, k.korn, x0, tid);
    tegnBevilg(ctx, g, tid);
    ctx.textAlign = 'center';
    // Statens faste utgifter: en karmin plate med navnet midt på fjellet, under toppen.
    ctx.font = `bold 13px ${FONT}`;
    for (const u of ter.faste) {
        const sx = u.x - x0;
        if (sx < -80 || sx > 1040 || !u.navn) continue;
        const y = bakke(ter, u.x) + 34;
        const w = ctx.measureText(u.navn).width + 12;
        ctx.fillStyle = P.karmin;
        ctx.fillRect(sx - w / 2, y - 13, w, 19);
        ctx.strokeStyle = 'rgba(246,244,236,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - w / 2 + 2, y - 11, w - 4, 15);
        ctx.fillStyle = P.hvit;
        ctx.fillText(u.navn, sx, y + 1);
    }
    for (const u of ter.utgifter) {
        const sx = u.x - x0;
        if (sx < -80 || sx > 1040) continue;
        krone(ctx, sx, u.y - 16, 1);
        if (u.navn) {
            ctx.fillStyle = P.karmin;
            ctx.font = `italic 15px ${FONT}`;
            ctx.fillText(u.navn, sx, u.y - 32);
        }
    }
    // Stemmene i rorstrekket: stemmesedler med karmin kryss som vipper i dalen.
    for (const st of ter.stemmer) {
        if (st.tatt) continue;
        const sx = st.x - x0;
        if (sx < -30 || sx > 990) continue;
        const vipp = Math.sin(tid * 3 + st.x) * 0.15;
        ctx.save();
        ctx.translate(sx, st.y - 10 + Math.sin(tid * 2.4 + st.x) * 3);
        ctx.rotate(vipp);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = P.silkeLys;
        ctx.beginPath();
        ctx.arc(0, 0, 20 + Math.sin(tid * 5) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = P.hvit;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.4;
        ctx.fillRect(-9, -12, 18, 24);
        ctx.strokeRect(-9, -12, 18, 24);
        ctx.strokeStyle = P.karmin;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, 6);
        ctx.moveTo(5, -6);
        ctx.lineTo(-5, 6);
        ctx.stroke();
        ctx.restore();
    }
    // Riksrett-stemmene 1882-1884: store røde stempler med teller (1/3, 2/3, 3/3). En rød
    // stiplet linje går fra hvert stempel opp til tauet det kutter.
    const r = ter.regjering;
    const rcx = r.x - x0;
    const rTopp = r.bunn - REGJ.høyde;
    let nr = g.riksrett;
    for (const st of ter.riksrett) {
        if (st.tatt || st.x < g.x - 40) continue;
        const sx = st.x - x0;
        const tauNr = nr++;
        if (sx < -40 || sx > 1000 || tauNr > 2) continue;
        const sy = st.y - 10 + Math.sin(tid * 2.4 + st.x) * 3;
        if (!g.falt && rcx > -120 && rcx < 1100) {
            ctx.save();
            ctx.strokeStyle = 'rgba(179,38,45,0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -tid * 20;
            ctx.beginPath();
            ctx.moveTo(sx, sy - 28);
            ctx.lineTo(rcx + REGJ.tau[tauNr], rTopp + 10);
            ctx.stroke();
            ctx.restore();
        }
        ctx.save();
        ctx.translate(sx, sy);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = P.silkeLys;
        ctx.beginPath();
        ctx.arc(0, 0, 32 + Math.sin(tid * 5) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.rotate(-0.15);
        stempel(ctx, 26, `${tauNr + 1}/3`, 20);
        ctx.restore();
    }
    for (const f of ter.funn) {
        if (f.tatt) continue;
        const sx = f.x - x0;
        if (sx < -30 || sx > 990) continue;
        tegnFunn(ctx, sx, f.y, tid);
    }
}

/** Riksrettens stempelfarge: klar rød, så stemplene skiller seg fra kronene. */
const STEMPELRØD = '#b3262d';

/** Målene på Kongens regjering (klippa) og hvor de tre tauene sitter. */
const REGJ = { bredde: 200, høyde: 140, tau: [-64, 0, 64] };

/** Et rundt rødt stempel med hvit ring og hvit tekst, sentrert i (0, 0). */
function stempel(ctx: CanvasRenderingContext2D, rad: number, tekst: string, px: number) {
    ctx.fillStyle = STEMPELRØD;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.hvit;
    ctx.lineWidth = Math.max(1.2, rad * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = P.hvit;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${px}px ${FONT}`;
    ctx.fillText(tekst, 0, 1);
    ctx.textBaseline = 'alphabetic';
}

/**
 * Kongens regjering: en fjellklippe som henger i tre tau over dalen 1882-1884. Hver
 * riksrett-stemme kutter ett tau (et rødt stempel der tauet satt); det tredje får klippa til
 * å falle, og Stortinget får roret. Klippa henger så lavt at den aldri går bak Spart-kortet.
 */
function tegnRegjering(
    ctx: CanvasRenderingContext2D,
    g: Game,
    korn: CanvasPattern | null,
    x0: number,
    tid: number
) {
    const r = g.ter.regjering;
    const cx = r.x - x0;
    if (cx < -300 || cx > 1260) return;
    const fall = g.falt ? Math.max(0, (g.x - g.falt) / 260) : 0;
    if (fall > 2.4) return;
    const { bredde, høyde, tau } = REGJ;
    const dy = fall * fall * 260;
    const bunn = r.bunn + dy;
    const topp = bunn - høyde;
    // Tauene: fra himmelen ned i klippa. Kuttede tau henger og slenger.
    ctx.strokeStyle = '#6b5a45';
    ctx.lineWidth = 4;
    tau.forEach((tx, i) => {
        const kuttet = i < g.riksrett;
        ctx.beginPath();
        if (!kuttet) {
            ctx.moveTo(cx + tx, -10);
            ctx.lineTo(cx + tx, topp + 14);
        } else if (!g.falt) {
            const sving = Math.sin(tid * 3 + i) * 10;
            ctx.moveTo(cx + tx, -10);
            ctx.quadraticCurveTo(cx + tx + sving, 30, cx + tx + sving * 1.6, 60);
        }
        ctx.stroke();
    });
    ctx.save();
    ctx.translate(cx, (topp + bunn) / 2);
    ctx.rotate(fall * 0.25);
    ctx.globalAlpha = Math.max(0, 1 - fall / 2.4);
    ctx.beginPath();
    ctx.moveTo(-bredde / 2, -høyde / 2);
    const n = 10;
    for (let i = 0; i <= n; i++) ctx.lineTo(-bredde / 2 + (bredde * i) / n, -høyde / 2 - hash(i + 7) * 12);
    ctx.lineTo(bredde / 2 + 10, høyde * 0.1);
    for (let i = n; i >= 0; i--) {
        const istapp = i % 2 === 1 ? 10 + hash(i * 5) * 14 : 0;
        ctx.lineTo(-bredde / 2 + (bredde * i) / n, høyde / 2 - 6 + istapp);
    }
    ctx.lineTo(-bredde / 2 - 10, høyde * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#353a37';
    ctx.fill();
    if (korn) {
        flyttMønster(korn, -x0 - cx);
        ctx.fillStyle = korn;
        ctx.fill();
    }
    ctx.fillStyle = P.hvit;
    ctx.fillRect(-bredde / 2, -høyde / 2 - 4, bredde, 5);
    // Navneskiltet: krone og «Kongens regjering» på lyst papir, så det leses på avstand.
    const sw = bredde - 14;
    ctx.fillStyle = 'rgba(31,35,38,0.35)';
    ctx.fillRect(-sw / 2 + 2, -34 + 3, sw, 50);
    ctx.fillStyle = P.hvit;
    ctx.fillRect(-sw / 2, -34, sw, 50);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-sw / 2, -34, sw, 50);
    krone(ctx, 0, -20, 1.1);
    ctx.fillStyle = P.kritt;
    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText('Kongens regjering', 0, 9);
    ctx.fillStyle = P.hvit;
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillText(g.falt ? 'Felt i riksretten!' : `${3 - g.riksrett} av 3 tau holder`, 0, 40);
    ctx.restore();
    ctx.globalAlpha = 1;
    // Et rødt stempel der hvert kuttet tau satt: riksretten kuttet det.
    if (!g.falt) {
        tau.forEach((tx, i) => {
            if (i >= g.riksrett) return;
            ctx.save();
            ctx.translate(cx + tx, topp - 2);
            ctx.rotate(-0.2);
            stempel(ctx, 15, `${i + 1}/3`, 11);
            ctx.restore();
        });
    }
}

/**
 * Jernbanene fra 1854: skinner opp stigningen, et tog som puffer oppover og stasjonen med
 * navneskilt. Bare bilde - stigningen selv er terrenget.
 */
export function tegnBaner(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const x0 = g.x - B.skjermX;
    for (const b of g.ter.baner) {
        if (b.x2 + 120 - x0 < 0 || b.x0 - x0 > 1000) continue;
        // Skinnene: to streker og sviller langs bakken.
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 2;
        for (const dy of [-3, -7]) {
            ctx.beginPath();
            for (let wx = b.x0; wx <= b.x2; wx += 8) {
                const y = bakke(g.ter, wx) + dy;
                if (wx === b.x0) ctx.moveTo(wx - x0, y);
                else ctx.lineTo(wx - x0, y);
            }
            ctx.stroke();
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#5a4a3a';
        ctx.beginPath();
        for (let wx = b.x0; wx <= b.x2; wx += 14) {
            const y = bakke(g.ter, wx);
            ctx.moveTo(wx - x0 - 3, y - 1);
            ctx.lineTo(wx - x0 + 3, y - 9);
        }
        ctx.stroke();

        // Stasjonen på toppen, med navneskilt på solid papir.
        const sx = b.x2 - 70 - x0;
        ctx.fillStyle = '#8a4b2c';
        ctx.fillRect(sx - 26, b.y1 - 30, 52, 24);
        ctx.fillStyle = P.kritt;
        ctx.beginPath();
        ctx.moveTo(sx - 32, b.y1 - 30);
        ctx.lineTo(sx, b.y1 - 46);
        ctx.lineTo(sx + 32, b.y1 - 30);
        ctx.closePath();
        ctx.fill();
        ctx.font = `bold 14px ${FONT}`;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(b.navn).width + 14;
        ctx.fillStyle = P.hvit;
        ctx.fillRect(sx - tw / 2, b.y1 - 76, tw, 22);
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - tw / 2, b.y1 - 76, tw, 22);
        ctx.fillStyle = P.kritt;
        ctx.fillText(b.navn, sx, b.y1 - 60);

        // Toget: kjører opp stigningen mens ballongen nærmer seg, og røyken stiger.
        const u = Math.min(1, Math.max(0, (g.x - (b.x0 - 900)) / (b.x2 - b.x0 + 900)));
        const tx = b.x0 + 30 + u * (b.x2 - b.x0 - 140);
        for (let i = 2; i >= 0; i--) {
            const wx = tx - i * 30;
            const y = bakke(g.ter, wx) - 8;
            const yb = bakke(g.ter, wx - 12) - 8;
            const vinkel = Math.atan2(y - yb, 12);
            ctx.save();
            ctx.translate(wx - x0, y);
            ctx.rotate(vinkel);
            ctx.fillStyle = i === 0 ? P.kritt : '#6b3a26';
            ctx.fillRect(-13, -15, 26, 13);
            if (i === 0) {
                ctx.fillRect(6, -24, 6, 10);
                ctx.fillStyle = P.silke;
                ctx.fillRect(-12, -13, 7, 6);
            } else {
                ctx.fillStyle = P.hvit;
                ctx.fillRect(-9, -12, 6, 5);
                ctx.fillRect(3, -12, 6, 5);
            }
            ctx.fillStyle = P.kritt;
            for (const hx of [-8, 8]) {
                ctx.beginPath();
                ctx.arc(hx, -1, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        const ry = bakke(g.ter, tx) - 34;
        for (let i = 0; i < 5; i++) {
            const f = (tid * 0.8 + i / 5) % 1;
            ctx.globalAlpha = 0.55 * (1 - f);
            ctx.fillStyle = '#e9e6dc';
            ctx.beginPath();
            ctx.arc(tx - x0 + 10 - f * 60, ry - f * 50, 6 + f * 14, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

/**
 * Fjellet over porten i rorstrekket: en tung fjellvegg som henger ned fra himmelen og
 * blir bredere oppover, med istapper i underkanten. Bare roret når under den.
 */
function tegnPort(
    ctx: CanvasRenderingContext2D,
    kn: Game['ter']['knauser'][number],
    a: number,
    b: number,
    korn: CanvasPattern | null,
    x0: number,
    tid: number
) {
    const topp = -10;
    const bunn = kn.bunn;
    const vid = 90;
    ctx.beginPath();
    ctx.moveTo(a - vid, topp);
    // Venstre side: takket, smalner nedover.
    for (let i = 1; i <= 8; i++) {
        const u = i / 8;
        const y = topp + (bunn - topp) * u;
        ctx.lineTo(a - vid * (1 - u) - hash(i + kn.x0) * 10, y);
    }
    // Underkanten med istapper.
    const n = 10;
    for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        const istapp = i % 2 === 1 ? 6 + hash(i * 5 + kn.x0) * 10 : 0;
        ctx.lineTo(x, bunn - 2 + istapp);
    }
    for (let i = 8; i >= 1; i--) {
        const u = i / 8;
        const y = topp + (bunn - topp) * u;
        ctx.lineTo(b + vid * (1 - u) + hash(i * 3 + kn.x0) * 10, y);
    }
    ctx.lineTo(b + vid, topp);
    ctx.closePath();
    ctx.fillStyle = '#353a37';
    ctx.fill();
    if (korn) {
        flyttMønster(korn, -x0);
        ctx.fillStyle = korn;
        ctx.fill();
    }
    // Snøstriper i fjellveggen.
    ctx.strokeStyle = P.hvit;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const sx = a - 50 + i * ((b - a + 100) / 4);
        const sy = 30 + hash(i + kn.x0) * 120;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 14, sy + 30 + hash(i * 7) * 30);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Skimmer av lys i porten mens den er foran deg: her er det åpent.
    if (!kn.valgt) {
        const puls = 0.25 + 0.2 * Math.sin(tid * 5);
        const gr = ctx.createLinearGradient(0, bunn, 0, bunn + 150);
        gr.addColorStop(0, `rgba(240,200,120,${puls.toFixed(3)})`);
        gr.addColorStop(1, 'rgba(240,200,120,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(a, bunn + 4, b - a, 150);
        // Tre lyse piler nedover i porten: veien går under, ikke over.
        ctx.strokeStyle = P.hvit;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        const mx = (a + b) / 2;
        for (let i = 0; i < 3; i++) {
            const fase = (tid * 1.5 + i / 3) % 1;
            const py = bunn + 18 + fase * 60;
            ctx.globalAlpha = Math.sin(fase * Math.PI);
            ctx.beginPath();
            ctx.moveTo(mx - 16, py - 10);
            ctx.lineTo(mx, py);
            ctx.lineTo(mx + 16, py - 10);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
    }
}
