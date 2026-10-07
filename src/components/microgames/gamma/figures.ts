// Figurene i tresnitt: gamma snittet åpen med bålet og familien, varmemåleren, vedstablene,
// Inga, røyken og patruljebåten med lyskasteren. Leser spillet og spillfølelsen, endrer ingenting.

import { P, hash, ripe } from './art';
import type { Fx } from './fx';
import { STABEL } from './fx';
import type { Game } from './game';
import { bakke, inne, røykSynes } from './rules';
import { TUNING } from './tuning';

type Ctx = CanvasRenderingContext2D;
const T = TUNING;
const G = T.verden.gammaX;
const GY = bakke(G);
const RX = 76;
const RY = 64;

/** En vedkubbe sett fra enden: årringer i oker med svart kontur. */
export function endeved(ctx: Ctx, x: number, y: number, r: number) {
    ctx.fillStyle = P.ved;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = P.vedMørk;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
}

/** Snøterrassen gamma står på, så den ikke svever over lia. */
function terrasse(ctx: Ctx) {
    ctx.fillStyle = P.snø;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(G - RX - 22, bakke(G - RX - 22));
    ctx.lineTo(G - RX - 6, GY + 2);
    ctx.lineTo(G + RX + 10, GY + 2);
    ctx.quadraticCurveTo(G + RX + 22, GY + 4, G + RX + 34, bakke(G + RX + 34));
    ctx.lineTo(G + RX + 34, GY + 40);
    ctx.lineTo(G - RX - 22, GY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(G - RX - 6, GY + 2);
    ctx.lineTo(G + RX + 10, GY + 2);
    ctx.quadraticCurveTo(G + RX + 22, GY + 4, G + RX + 34, bakke(G + RX + 34));
    ctx.stroke();
    ctx.strokeStyle = P.blå;
    ctx.lineWidth = 2.5;
    for (let k = 0; k < 6; k++) ripe(ctx, G - 50 + k * 22, GY + 10 + (k % 2) * 5, 14, 2);
}

/** Gløden fra gamma ut over snøen: den ene radielle gradienten i spillet. */
export function glød(ctx: Ctx, g: Game, fx: Fx, klokke: number) {
    const varm = Math.max(0, g.varme / T.varme.maks);
    const r = 50 + 120 * varm + 30 * fx.blus + (g.bål > 0 ? 6 * Math.sin(klokke * 17) : 0);
    const grad = ctx.createRadialGradient(G, GY - 24, 6, G, GY - 24, r);
    grad.addColorStop(0, `rgba(227,165,43,${0.18 + 0.45 * varm + 0.15 * fx.blus})`);
    grad.addColorStop(1, 'rgba(227,165,43,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(G - r, GY - 24 - r, r * 2, r * 2);
}

/** Flammen: tre lag skårne tunger (rødt, oker, blekt). */
function flamme(ctx: Ctx, x: number, y: number, h: number, kald: boolean, klokke: number) {
    const lag: [string, number, number][] = kald
        ? [[P.fare, 1, 0.8]]
        : [
              [P.fare, 1, 1],
              [P.glød, 0.72, 0.7],
              ['#fff2b0', 0.42, 0.4],
          ];
    for (const [farge, hk, bk] of lag) {
        const hh = h * hk;
        const b = 14 * bk;
        ctx.fillStyle = farge;
        ctx.beginPath();
        ctx.moveTo(x - b, y);
        const tunger = 3;
        for (let i = 0; i <= tunger; i++) {
            const t = i / tunger;
            const tx = x - b + 2 * b * t;
            const sv = Math.sin(klokke * 13 + i * 2.1) * 2.5;
            const th = hh * (i === 1 || i === 2 ? 1 : 0.55) * (0.85 + 0.15 * Math.sin(klokke * 9 + i));
            ctx.lineTo(tx - b / 3 + sv, y - th);
            if (i < tunger) ctx.lineTo(tx + b / 3, y - th * 0.45);
        }
        ctx.lineTo(x + b, y);
        ctx.closePath();
        ctx.fill();
    }
}

interface Person {
    dx: number;
    h: number;
    b: number;
    lue: string;
    vendt: 1 | -1;
}
const FAMILIE: Person[] = [
    { dx: -44, h: 38, b: 27, lue: P.fare, vendt: 1 }, // bestemor
    { dx: -22, h: 25, b: 17, lue: P.glød, vendt: 1 }, // lillebror
    { dx: 34, h: 40, b: 27, lue: P.fare, vendt: -1 }, // mor
];

/** Familien rundt bålet: klumpete former under felt, med kofteband og lys fra bålet. */
function familie(ctx: Ctx, g: Game, fx: Fx, klokke: number, frost: number) {
    const varm = Math.max(0, g.varme / T.varme.maks);
    const skjelv = g.varme < T.varme.rim || frost > 0 ? Math.sin(klokke * 42) * (1.2 + frost) : 0;
    FAMILIE.forEach((p, i) => {
        // Når en kubbe lander, kvikner familien til: et lite hopp og et len mot bålet.
        const kvikk = Math.sin(fx.varmet * Math.PI) * (1 - i * 0.15);
        const x = G + p.dx + (i % 2 ? skjelv : -skjelv) * (frost >= 1 ? 0 : 1) - Math.sign(p.dx) * kvikk * 2.5;
        const y = GY - 1 - kvikk * 3;
        // Kroppen under feltet (reinskinn): mørk klump med svart kontur.
        ctx.fillStyle = '#3a2a1e';
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - p.b / 2, y);
        ctx.quadraticCurveTo(x - p.b / 2 - 2, y - p.h * 0.75, x, y - p.h * 0.8);
        ctx.quadraticCurveTo(x + p.b / 2 + 2, y - p.h * 0.75, x + p.b / 2, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Kofta: blått bryst med rødt og gult band.
        ctx.fillStyle = P.blå;
        ctx.fillRect(x - p.b * 0.28, y - p.h * 0.78, p.b * 0.56, p.h * 0.32);
        ctx.fillStyle = P.fare;
        ctx.fillRect(x - p.b * 0.28, y - p.h * 0.5, p.b * 0.56, 3);
        ctx.fillStyle = P.glød;
        ctx.fillRect(x - p.b * 0.28, y - p.h * 0.5 + 3, p.b * 0.56, 1.5);
        // Feltet har hvite riper (hår i skinnet).
        ctx.strokeStyle = 'rgba(241,234,217,0.55)';
        ctx.lineWidth = 1;
        for (let k = 0; k < 4; k++) ripe(ctx, x - p.b / 2 + 3 + k * (p.b / 4), y - 4, -6, 1, Math.PI / 2);
        // Hodet med lue.
        const hy = y - p.h * 0.8 - p.h * 0.16;
        const hr = p.h * 0.17;
        ctx.fillStyle = '#c99263';
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, hy, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.lue;
        ctx.beginPath();
        ctx.arc(x, hy - 1, hr + 1, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Ansiktet: én hvit skåret strek for øynene, vendt mot bålet.
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + p.vendt * 1, hy + 1);
        ctx.lineTo(x + p.vendt * hr * 0.8, hy + 1);
        ctx.stroke();
        // Lyset fra bålet på siden som vender mot det.
        if (varm > 0.3) {
            ctx.strokeStyle = `rgba(227,165,43,${Math.min(1, varm + fx.blus * 0.4)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + (p.vendt * p.b) / 2, y - 2);
            ctx.quadraticCurveTo(x + (p.vendt * (p.b / 2 + 2)), y - p.h * 0.6, x + p.vendt * 3, y - p.h * 0.82);
            ctx.stroke();
        }
        // Rimet: hvite krystaller som vokser når det er kaldt. Rødt ved siste kulde.
        const kulde = Math.max(frost, 1 - g.varme / (T.varme.rim + 10));
        if (kulde > 0) {
            const n = Math.round(4 + 14 * Math.min(1, kulde));
            ctx.strokeStyle = g.varme < 12 && frost < 1 ? P.fare : '#e8f1ff';
            ctx.lineWidth = 1.4;
            for (let k = 0; k < n; k++) {
                const a = hash(i * 31 + k) * Math.PI;
                const rr = p.b * 0.55 * (0.5 + hash(i * 7 + k) * 0.5);
                const cx = x - Math.cos(a) * rr;
                const cy = y - p.h * 0.45 - Math.sin(a) * p.h * 0.5;
                ctx.beginPath();
                ctx.moveTo(cx - 2, cy);
                ctx.lineTo(cx + 2, cy);
                ctx.moveTo(cx, cy - 2);
                ctx.lineTo(cx, cy + 2);
                ctx.stroke();
            }
            if (frost > 0) {
                ctx.fillStyle = `rgba(232,241,255,${0.65 * frost})`;
                ctx.beginPath();
                ctx.moveTo(x - p.b / 2, y);
                ctx.quadraticCurveTo(x - p.b / 2 - 2, y - p.h * 0.75, x, y - p.h * 0.8);
                ctx.quadraticCurveTo(x + p.b / 2 + 2, y - p.h * 0.75, x + p.b / 2, y);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, hy, hr + 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

/** Gamma: torvkuppel med snø på toppen, snittet åpen så bålet og familien synes. */
export function gamma(ctx: Ctx, g: Game, fx: Fx, klokke: number, utgang: number) {
    terrasse(ctx);
    const varm = Math.max(0, g.varme / T.varme.maks);
    // Ytterveggen: torv i lag, tykk svart kontur.
    ctx.fillStyle = P.torv;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(G, GY, RX, RY, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = P.torvLys;
    ctx.lineWidth = 1.6;
    for (let rad = 0; rad < 7; rad++) {
        const yy = GY - 6 - rad * 8;
        for (let x = G - RX; x < G + RX; x += 13) ripe(ctx, x + (rad % 2) * 6, yy, 9, -1.5);
    }
    // Snøen på taket.
    ctx.fillStyle = P.snø;
    ctx.beginPath();
    ctx.moveTo(G - RX, GY - 30);
    for (let x = G - RX; x <= G + RX; x += 8) ctx.lineTo(x, GY - 34 - 6 * Math.sin((x - G) * 0.2) - (RX - Math.abs(x - G)) * 0.22);
    ctx.lineTo(G + RX, GY - RY - 10);
    ctx.lineTo(G - RX, GY - RY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.blå;
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) ripe(ctx, G - 40 + k * 18, GY - 46 + (k % 2) * 3, 10, -1.5);
    ctx.restore();
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(G, GY, RX, RY, 0, Math.PI, 0);
    ctx.stroke();

    // Snittet: rommet inni, varmt eller kaldt.
    const ri = RX - 12;
    const ry = RY - 12;
    const kr = Math.round(26 + 90 * varm);
    const kg = Math.round(34 + 40 * varm);
    const kb = Math.round(58 - 34 * varm);
    ctx.fillStyle = `rgb(${kr},${kg},${kb})`;
    ctx.beginPath();
    ctx.ellipse(G, GY, ri, ry, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Flate glødringer rundt bålet (trykt i lag, ikke en gradient).
    ctx.save();
    ctx.clip();
    for (let k = 3; k >= 1; k--) {
        ctx.fillStyle = `rgba(227,165,43,${(0.08 + 0.12 * varm + 0.1 * fx.blus) * (k === 1 ? 1.6 : 1)})`;
        ctx.beginPath();
        ctx.ellipse(G, GY - 6, 12 * k + 26 * varm + 8 * fx.blus, 9 * k + 18 * varm, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Gulvet: bjørkeris som hvite riper.
    ctx.strokeStyle = 'rgba(241,234,217,0.35)';
    ctx.lineWidth = 1;
    for (let x = G - ri + 4; x < G + ri - 4; x += 6) ripe(ctx, x, GY - 2, 5, 1, -0.2);
    ctx.restore();
    // Bæringen: to staver og en bjelke, og ljoren (røykhullet) i toppen.
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(G - 56, GY);
    ctx.lineTo(G - 12, GY - ry + 2);
    ctx.moveTo(G + 56, GY);
    ctx.lineTo(G + 12, GY - ry + 2);
    ctx.moveTo(G - 14, GY - ry + 6);
    ctx.lineTo(G + 14, GY - ry + 6);
    ctx.stroke();
    ctx.fillStyle = P.natt;
    ctx.fillRect(G - 6, GY - RY - 2, 12, 14);
    ctx.strokeRect(G - 6, GY - RY - 2, 12, 14);
    // Snittkanten: torvlag i tverrsnitt.
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(G, GY, ri, ry, 0, Math.PI, 0);
    ctx.stroke();
    // Døra mot lia.
    ctx.fillStyle = `rgb(${kr},${kg},${kb})`;
    ctx.fillRect(G + RX - 16, GY - 30, 16, 30);
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 3;
    ctx.strokeRect(G + RX - 16, GY - 30, 16, 30);

    // Bålet: steiner, kubbene som ligger på, flammen.
    for (let k = 0; k < 5; k++) {
        ctx.fillStyle = P.stein;
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(G - 18 + k * 9, GY - 3, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    const påBålet = Math.ceil(g.bål / T.varme.perKubbe - 1e-6);
    for (let k = 0; k < påBålet; k++) {
        // Den øverste kubben spretter når den lander.
        const hopp = k === påBålet - 1 ? Math.sin(fx.sett * Math.PI) * 5 : 0;
        ctx.save();
        ctx.translate(G, GY - 9 - k * 4 - hopp);
        ctx.rotate(k % 2 ? 0.35 : -0.35);
        ctx.fillStyle = P.ved;
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-14, -3, 28, 6);
        ctx.strokeRect(-14, -3, 28, 6);
        ctx.restore();
    }
    const kaldt = varm < 0.25;
    // Squash og stretch: flammen trykkes ned i det kubben lander, så skyter den opp.
    const st = fx.støt > 0.85 ? 1 - (fx.støt - 0.85) * 2.5 : 1 + 0.4 * Math.sin((1 - fx.støt) * Math.PI) * (fx.støt > 0 ? 1 : 0);
    // Taket: flammen skal aldri stikke gjennom torva.
    const fl = utgang > 0 ? 3 * (1 - utgang) : Math.min(46, (8 + 30 * varm + (g.bål > 0 ? 9 : 0) + 20 * fx.blus) * st);
    if (fl > 0.5) flamme(ctx, G, GY - 8, fl, kaldt, klokke);
    // Varmebølgene: en varm ring som går ut fra bålet, gjennom gamma og ut over snøen.
    for (const b of fx.bølger) {
        const k = b / T.juice.bølge;
        ctx.strokeStyle = `rgba(255,190,90,${0.55 * (1 - k)})`;
        ctx.lineWidth = 3 * (1 - k) + 1;
        ctx.beginPath();
        ctx.ellipse(G, GY - 10, 14 + k * 150, 8 + k * 70, 0, Math.PI, 0);
        ctx.stroke();
    }

    if (g.mode !== 'won') familie(ctx, g, fx, klokke, utgang);

    // Ringen etter nesten-bom: står stille rundt gamma og pulserer ut.
    if (fx.nesten > 0) {
        const k = 1 - fx.nesten;
        ctx.strokeStyle = `rgba(247,243,200,${fx.nesten})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(G, GY - 20, RX + 8 + k * 40, RY + k * 30, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/** Vedstabelen ved døra. Tom: et rødt, stiplet felt som blinker. */
export function stabel(ctx: Ctx, g: Game, fx: Fx, klokke: number) {
    const n = Math.max(0, g.stabel - fx.iLufta);
    const x0 = STABEL.x - 7;
    const y0 = GY - 4;
    if (n === 0 && fx.iLufta === 0) {
        const blink = Math.sin(klokke * 8) > 0;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = P.fare;
        ctx.lineWidth = blink ? 3 : 2;
        ctx.fillStyle = blink ? 'rgba(194,58,43,0.35)' : 'rgba(194,58,43,0.15)';
        ctx.fillRect(x0 - 8, y0 - 22, 30, 24);
        ctx.strokeRect(x0 - 8, y0 - 22, 30, 24);
        ctx.setLineDash([]);
        return;
    }
    for (let k = 0; k < n; k++) {
        const rad = Math.floor(k / 4);
        const i = k % 4;
        endeved(ctx, x0 - 4 + i * 7 + (rad % 2) * 3, y0 - 3 - rad * 6.5, 3.6);
    }
}

/** Vedhaugene i skogen: kubber sett fra enden, med snø på toppen. */
export function hauger(ctx: Ctx, g: Game, klokke: number) {
    T.haug.forEach((h, i) => {
        const n = Math.min(12, g.haug[i]);
        if (n <= 0) return;
        const y = bakke(h.x);
        for (let k = 0; k < n; k++) {
            const rad = Math.floor(k / 4);
            endeved(ctx, h.x - 12 + (k % 4) * 8 + (rad % 2) * 4, y - 5 - rad * 7, 4.2);
        }
        const topp = y - 5 - Math.floor((n - 1) / 4) * 7 - 5;
        ctx.fillStyle = P.snø;
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(h.x, topp, 14, 3.5, 0, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Den nærmeste haugen med ved glinser svakt, så eleven ser målet.
        const først = T.haug.findIndex((_, j) => g.haug[j] > 0);
        if (først === i && g.fang === 0) {
            ctx.strokeStyle = `rgba(227,165,43,${0.5 + 0.3 * Math.sin(klokke * 3)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(h.x, y - 2, 22, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

/** Inga i kofte: går tyngre og lener seg fram med fullt fang. Sett av lyset: rød kant. */
export function inga(ctx: Ctx, g: Game, fx: Fx, sett: boolean) {
    // Inne står hun ved døra i gamma. Ute går hun inn og ut gjennom døra, ikke gjennom veggen.
    const iGamma = inne(g);
    const x = iGamma ? G + 54 : g.x;
    const y = iGamma ? GY : bakke(g.x);
    const vedDøra = !iGamma && x < G + RX + 14;
    const fang = g.fang > 0;
    const v = iGamma ? -1 : g.vendt;
    const gåt = !iGamma && g.input.dir !== 0;
    const sv = gåt ? Math.sin(fx.steg * Math.PI) : 0;
    const bob = gåt ? Math.abs(sv) * (fang ? 2.5 : 1.5) : 0;
    // Kastet: hun lener seg mot bålet i det armen svinger fram.
    const kast = iGamma ? Math.sin(fx.kast * Math.PI) : 0;
    const lean = (fang ? 0.16 * v : 0.05 * v * (gåt ? 1 : 0)) + 0.28 * v * kast;
    ctx.save();
    if (vedDøra) {
        ctx.beginPath();
        ctx.rect(G + RX - 16, 0, 960, 540);
        ctx.clip();
    }
    ctx.translate(x, y - bob);
    ctx.scale(iGamma ? 1.05 : 1.3, iGamma ? 1.05 : 1.3);
    // Beina.
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.lineTo(-2 + sv * 5, 0);
    ctx.moveTo(2, -12);
    ctx.lineTo(2 - sv * 5, 0);
    ctx.stroke();
    ctx.rotate(lean);
    // Kofta: blå, med rødt og gult band nederst og på skuldrene.
    ctx.fillStyle = P.blå;
    ctx.strokeStyle = sett ? P.fare : P.svart;
    ctx.lineWidth = sett ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(-9, -10);
    ctx.lineTo(-6, -32);
    ctx.lineTo(6, -32);
    ctx.lineTo(9, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.fare;
    ctx.fillRect(-8.5, -15, 17, 3.5);
    ctx.fillStyle = P.glød;
    ctx.fillRect(-8, -11.5, 16, 1.6);
    ctx.fillStyle = P.fare;
    ctx.fillRect(-6, -31, 12, 2.5);
    // Hodet med hette.
    ctx.fillStyle = '#c99263';
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -38, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.fare;
    ctx.beginPath();
    ctx.arc(0, -39, 6.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.glød;
    ctx.fillRect(-1.5, -47, 3, 3);
    // Armene og fanget: kubbene foran brystet. Løftet når hun plukker.
    const løft = fx.løft * 6;
    if (fang) {
        for (let k = 0; k < g.fang; k++) {
            const rad = Math.floor(k / 2);
            endeved(ctx, v * (8 + (k % 2) * 7), -20 - rad * 7 - løft, 3.8);
        }
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(v * 3, -28);
        ctx.lineTo(v * 12, -16 - løft);
        ctx.lineTo(v * 20, -18 - løft);
        ctx.stroke();
    } else if (iGamma && fx.kast > 0) {
        // Armen svinger fra bak og opp til fram og ned (overhåndskast mot bålet).
        // Tegnes som om hun ser mot høyre, og speiles etter hvilken vei hun ser.
        const fase = 1 - fx.kast;
        const vinkel = -2.3 + fase * 2.9;
        ctx.save();
        ctx.scale(v, 1);
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(3, -28);
        ctx.lineTo(3 + Math.cos(vinkel) * 14, -28 + Math.sin(vinkel) * 14);
        ctx.stroke();
        // Fartsstreker bak hånda i selve svingen.
        if (fase > 0.2 && fase < 0.7) {
            ctx.strokeStyle = 'rgba(241,234,217,0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(3, -28, 17, vinkel - 0.9, vinkel);
            ctx.stroke();
        }
        ctx.restore();
    } else {
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(v * 3, -28);
        ctx.lineTo(v * (5 + sv * 3 + løft), -16 - løft);
        ctx.stroke();
    }
    ctx.restore();
}

/** Røyksøylen fra ljoren. Usynlig for lyset: mørk og gjennomsiktig. Synlig: blek og tett. */
export function røyk(ctx: Ctx, g: Game, klokke: number) {
    if (g.røyk <= 0.02) return;
    const synlig = røykSynes(g);
    const fare = synlig && g.patrulje !== null;
    const n = Math.max(2, Math.ceil(g.røyk * 13));
    const y0 = GY - RY - 4;
    const stig = (klokke * 0.9) % 1;
    for (let k = n - 1; k >= 0; k--) {
        const kk = k + stig;
        const h = kk * 15;
        const dx = Math.sin(klokke * 1.2 + kk * 0.7) * (3 + kk * 1.4) + kk * 2.5;
        const r = 6 + kk * 1.5;
        const a = Math.min(1, (n - kk) / 2);
        ctx.fillStyle = synlig ? `rgba(222,218,206,${0.92 * a})` : `rgba(110,128,160,${0.45 * a})`;
        ctx.strokeStyle = fare ? `rgba(194,58,43,${a})` : `rgba(17,17,17,${(synlig ? 0.8 : 0.25) * a})`;
        ctx.lineWidth = fare ? 3 : 2;
        ctx.beginPath();
        ctx.arc(G + dx, y0 - h, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (synlig) {
            ctx.strokeStyle = `rgba(255,255,255,${0.8 * a})`;
            ctx.lineWidth = 1.2;
            ripe(ctx, G + dx - r * 0.5, y0 - h - 1, r, -2);
        }
    }
}

/** Patruljebåten og lyskasteren. Lyset er en kald kjegle med hard rød kant. */
export function patrulje(ctx: Ctx, g: Game, fx: Fx, klokke: number) {
    const p = g.patrulje;
    if (!p) return;
    const sy = bakke(T.verden.strandX) + 12 + Math.sin(klokke * 1.4) * 1.2;
    const bx = p.båtX;
    // Kjølvann: hvite riper bak båten.
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) ripe(ctx, bx + 40 + k * 10, sy + 6 + (k % 2) * 3, 12, -1);
    // Skroget, styrhuset og masta i svart treskurd.
    ctx.fillStyle = P.svart;
    ctx.beginPath();
    ctx.moveTo(bx - 46, sy - 6);
    ctx.lineTo(bx + 42, sy - 6);
    ctx.lineTo(bx + 36, sy + 8);
    ctx.lineTo(bx - 36, sy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx - 4, sy - 22, 26, 16);
    ctx.fillRect(bx + 6, sy - 44, 2.5, 24);
    ctx.fillStyle = '#3d4a5e';
    ctx.fillRect(bx, sy - 18, 6, 5);
    ctx.fillRect(bx + 10, sy - 18, 6, 5);
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - 40, sy - 2);
    ctx.lineTo(bx + 36, sy - 2);
    ctx.stroke();
    // Lyskasteren på taket.
    const lx = bx - 4;
    const ly = sy - 26;
    ctx.fillStyle = '#2a2f3a';
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (p.fase === 'kommer') {
        // Lampa er mørk, men båten høres: lydbuer som står fast og pulserer ut.
        const blink = Math.sin(klokke * 9) > 0;
        ctx.fillStyle = blink ? P.fare : '#5a2018';
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
        for (let k = 0; k < 3; k++) {
            const f = (klokke * 0.8 + k / 3) % 1;
            ctx.strokeStyle = `rgba(241,234,217,${0.7 * (1 - f)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bx + 8, sy - 20, 20 + f * 34, Math.PI * 1.05, Math.PI * 1.45);
            ctx.stroke();
        }
        return;
    }
    if (p.fase !== 'lyser' && !(g.mode === 'lost' && g.årsak === 'funnet')) return;
    const gy = bakke(p.lysX) - 6;
    const b = T.patrulje.bredde;
    const tapt = g.mode === 'lost';
    // Kjeglen: fra lampa mot treffpunktet, bredere jo lenger unna (vinkelrett på strålen).
    const dx = p.lysX - lx;
    const dy = gy - ly;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const kjegle = (w: number, forbi: number) => {
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(p.lysX + nx * w + (dx / len) * forbi, gy + ny * w + (dy / len) * forbi);
        ctx.lineTo(p.lysX - nx * w + (dx / len) * forbi, gy - ny * w + (dy / len) * forbi);
        ctx.closePath();
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(247,243,200,${tapt ? 0.3 + 0.08 * Math.sin(klokke * 6) : 0.24})`;
    kjegle(46, 30);
    ctx.fill();
    ctx.fillStyle = 'rgba(247,243,200,0.22)';
    kjegle(18, 20);
    ctx.fill();
    ctx.fillStyle = 'rgba(247,243,200,0.45)';
    ctx.beginPath();
    ctx.ellipse(p.lysX, gy + 2, b, 16, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Den harde kanten: rød, for dette er faren.
    ctx.strokeStyle = 'rgba(194,58,43,0.85)';
    ctx.lineWidth = 2;
    kjegle(46, 30);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(p.lysX, gy + 2, b, 16, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    // Lampa lyser, og blitser når den tennes.
    ctx.fillStyle = P.lys;
    ctx.beginPath();
    ctx.arc(lx, ly, 4 + fx.blits * 10, 0, Math.PI * 2);
    ctx.fill();
    if (tapt) {
        // Funnet: en rød ring som står stille der lyset fant dere, og pulserer ut.
        const f = (klokke * 0.9) % 1;
        ctx.strokeStyle = `rgba(194,58,43,${1 - f})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(p.lysX, gy - 20, 40 + f * 40, 26 + f * 22, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/** De allierte skipene i fjordmunningen mot slutten: mørke silhuetter uten lyskaster. */
export function skip(ctx: Ctx, dag: number) {
    if (dag < T.juice.skipDag) return;
    const k = Math.min(1, (dag - T.juice.skipDag) / 3);
    const sy = bakke(T.verden.strandX) + 34;
    for (let i = 0; i < 2; i++) {
        const x = 1000 - k * (70 + i * 48);
        ctx.fillStyle = '#0a1224';
        ctx.strokeStyle = P.blå;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 34, sy);
        ctx.lineTo(x + 34, sy);
        ctx.lineTo(x + 28, sy + 8);
        ctx.lineTo(x - 28, sy + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(x - 6, sy - 14, 14, 14);
        ctx.fillRect(x + 2, sy - 30, 2, 18);
    }
}

/** Familien går ned mot stranda når hjelpen kommer. */
export function nedTilStranda(ctx: Ctx, t: number) {
    for (let i = 0; i < 4; i++) {
        const x = G + RX + 6 + Math.max(0, t * 85 - i * 22);
        const y = bakke(x);
        const h = i === 2 ? 18 : 28;
        ctx.fillStyle = P.svart;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x - 4, y - h);
        ctx.lineTo(x + 4, y - h);
        ctx.lineTo(x + 6, y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - h - 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i % 2 ? P.glød : P.fare;
        ctx.fillRect(x - 5, y - 8, 10, 2.5);
    }
}
