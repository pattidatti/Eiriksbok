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
    // Skyer: to lag (et tredje på høy kvalitet).
    const lag = kvalitet() === 'hoy' ? 3 : 2;
    for (let l = 0; l < lag; l++) {
        const par = [0.06, 0.12, 0.035][l];
        const sk = [1, 0.75, 0.5][l];
        const span = 1300;
        for (let i = 0; i < 4; i++) {
            const bilde = k.skyer[(i + l) % k.skyer.length];
            let x = (i * 340 + l * 170 - g.x * par - tid * (4 + l * 3)) % span;
            if (x < -300) x += span;
            const y = 30 + l * 46 + hash(i * 7 + l) * 70;
            ctx.globalAlpha = 0.6 - l * 0.12;
            ctx.drawImage(bilde, x, y, bilde.width * sk * 1.3, bilde.height * sk * 0.6);
        }
    }
    ctx.globalAlpha = 1;
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
    const grad = ctx.createLinearGradient(0, 240, 0, 540);
    grad.addColorStop(0, '#5f675e');
    grad.addColorStop(0.55, '#3f453f');
    grad.addColorStop(1, P.kritt);
    ctx.fillStyle = grad;
    ctx.fill();
    if (k.korn) {
        flyttMønster(k.korn, -x0);
        ctx.fillStyle = k.korn;
        ctx.fill();
    }

    // Skrapt hvitt: snø på høye topper og lys langs kammene som vender mot venstre.
    ctx.fillStyle = P.hvit;
    ctx.beginPath();
    const dybde = (i: number) =>
        Math.min(26, Math.max(0, (395 - ys[i]) * 0.4)) *
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
            ctx.fillStyle = P.karmin;
            ctx.font = `italic 14px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText('Kongeveien: +1 flosshatt', cx, kn.topp - 48);
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
    for (const f of ter.funn) {
        if (f.tatt) continue;
        const sx = f.x - x0;
        if (sx < -30 || sx > 990) continue;
        tegnFunn(ctx, sx, f.y, tid);
    }
}
