// Verden: tonestein-himmel, skyer, fire fjell-lag i parallakse, forgrunnsfjellet i kornet
// kritt med skrapt hvitt på snø og kam, nær-båndet, knausene, kongens utgifter, tingstuene,
// funnene og Stortinget. Tegningen leser bare spillet.

import { blandFarge, flyttMønster, hash, hentKunst, kvalitet, P, støy } from './art';
import { krone, tegnFunn, tegnStortinget, tegnTingstue } from './figures';
import { iBåndet, nærhet } from './rules';
import { bakke, veiForÅr } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

const B = TUNING.ballong;
export const FONT = '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif';

/** Hvor varm himmelen er (0 = kjølig morgen, 1 = 1884). */
const varme = (år: number) => Math.min(1, Math.max(0, (år - 1874) / 10));

export function tegnHimmel(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const v = varme(g.år);
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, blandFarge('#c6cbbd', '#d9c9a8', v));
    sky.addColorStop(1, blandFarge(P.steinLys, '#f1e6cc', v));
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
    LAG.forEach((l, i) => {
        const off = g.x * l.par;
        ctx.beginPath();
        ctx.moveTo(-10, 540);
        for (let sx = -10; sx <= 970; sx += 12) ctx.lineTo(sx, fjellY(l, sx + off, i));
        ctx.lineTo(970, 540);
        ctx.closePath();
        ctx.fillStyle = l.farge;
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
        d.addColorStop(0, 'rgba(228,230,219,0)');
        d.addColorStop(1, `rgba(228,230,219,${l.dis})`);
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
        if (sx < -80 || sx > 1040) continue;
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
    if (g.år < TUNING.ganger.fra - 0.6 || g.mode !== 'play') return;
    const x0 = g.x - B.skjermX;
    const inne = iBåndet(g);
    const a = Math.min(1, (g.år - (TUNING.ganger.fra - 0.6)) / 0.6);
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
        if (b < -40 || a > 1000) continue;
        // Fjellhammeren: kornet kritt med takket underkant og snø på toppen.
        ctx.beginPath();
        ctx.moveTo(a - 6, kn.topp + 8);
        const n = 12;
        for (let i = 0; i <= n; i++) {
            const x = a + ((b - a) * i) / n;
            ctx.lineTo(x, kn.topp - 2 - hash(i + kn.x0) * 7);
        }
        ctx.lineTo(b + 6, kn.topp + 8);
        for (let i = n; i >= 0; i--) {
            const x = a + ((b - a) * i) / n;
            const istapp = i % 2 === 0 ? 6 + hash(i * 3 + kn.x0) * 8 : 0;
            ctx.lineTo(x, kn.bunn - 3 + istapp * 0.6);
        }
        ctx.closePath();
        ctx.fillStyle = '#3a3f3b';
        ctx.fill();
        if (k.korn) {
            flyttMønster(k.korn, -x0);
            ctx.fillStyle = k.korn;
            ctx.fill();
        }
        ctx.fillStyle = P.hvit;
        ctx.fillRect(a, kn.topp - 3, b - a, 4);
        // Kronen: kongens veiskille. Etter riksretten faller kronene én etter én.
        const cx = (a + b) / 2;
        if (kn.konge) {
            ctx.strokeStyle = P.kritt;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, kn.topp - 2);
            ctx.lineTo(cx, kn.topp - 26);
            ctx.stroke();
            krone(ctx, cx, kn.topp - 32, 1.1);
            // Skiltet: solid papir, mørk tekst (ikke blek kursiv mot himmelen).
            // Både gaven (gull) og prisen (karmin) står på skiltet, så det er et ekte valg.
            const gave = 'Kongeveien: gave ×2';
            const pris = ', men +1 embetsmann';
            ctx.font = `bold 14px ${FONT}`;
            const gw = ctx.measureText(gave).width;
            const sw = gw + ctx.measureText(pris).width + 14;
            ctx.fillStyle = '#f8f4e8';
            ctx.fillRect(cx - sw / 2, kn.topp - 66, sw, 22);
            ctx.strokeStyle = P.karmin;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - sw / 2, kn.topp - 66, sw, 22);
            ctx.fillStyle = P.silke;
            ctx.fillRect(cx - sw / 2, kn.topp - 66, 5, 22);
            ctx.textAlign = 'left';
            ctx.fillStyle = P.silkeMørk;
            ctx.fillText(gave, cx - sw / 2 + 7, kn.topp - 50);
            ctx.fillStyle = P.karmin;
            ctx.fillText(pris, cx - sw / 2 + 7 + gw, kn.topp - 50);
        } else {
            const fall = Math.max(0, (g.x - (kn.x0 - 520)) / 220);
            if (fall < 2.2) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - fall / 2.2);
                ctx.translate(cx + fall * 14, kn.topp - 32 + fall * fall * 120);
                ctx.rotate(fall * 1.8);
                krone(ctx, 0, 0, 1.1);
                ctx.restore();
            }
        }
        // Valgt vei: et lite merke når ballongen er forbi.
        if (kn.valgt && kn.konge) {
            ctx.fillStyle = kn.valgt === 'under' ? P.silke : P.karmin;
            ctx.font = `italic 14px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText(kn.valgt === 'under' ? 'Under bommen' : 'Kongeveien', cx, kn.bunn + 18);
        }
    }
    ctx.textAlign = 'center';
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
    for (const f of ter.funn) {
        if (f.tatt) continue;
        const sx = f.x - x0;
        if (sx < -30 || sx > 990) continue;
        tegnFunn(ctx, sx, f.y, tid);
    }
}
