// Hele bildet: bakgrunnen fra art.ts, figurene, partiklene, varmemåleren, datoklossen,
// tastetegningene og lappene. Leser bare spillet og spillfølelsen.

import type { ArcadeView } from '../arcade/useArcade';
import { P, bakgrunn, ripe } from './art';
import { gamma, glød, hauger, inga, nedTilStranda, patrulje, røyk, skip, stabel, endeved } from './figures';
import type { Fx } from './fx';
import type { Game } from './game';
import { dato } from './levels';
import { bakke, dagNå, iLyset, inne, stormIgjen, stormNå } from './rules';
import { TUNING } from './tuning';

export { P } from './art';

const T = TUNING;
const G = T.verden.gammaX;
const GY = bakke(G);

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}

export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / 960, h / 540);
    return { s, ox: (w - 960 * s) / 2, oy: (h - 540 * s) / 2 };
};

export interface Lapp {
    tekst: string;
    x: number;
    y: number;
    igjen: number;
    /** Hvor lenge lappen står i alt (for å sprette inn). */
    sek: number;
}

export interface TegneValg {
    meny: boolean;
    lapper: Lapp[];
    klokke: number;
    /** Vis tastetegningene (første sekunder av runden). */
    hint: { gå: boolean; legg: boolean };
}

type Ctx = CanvasRenderingContext2D;

/** Varmemåleren ved døra, skåret i tre: flamme øverst, snøfnugg nederst, strek for en varm natt. */
function måler(ctx: Ctx, g: Game, klokke: number) {
    const x = G - 96;
    const topp = GY - 128;
    const h = 100;
    const varm = Math.max(0, g.varme / T.varme.maks);
    const kaldt = g.varme < T.varme.rim;
    const blink = kaldt && Math.sin(klokke * 10) > 0;
    // Planken.
    ctx.fillStyle = P.svart;
    ctx.fillRect(x - 15, topp - 30, 30, h + 62);
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 12, topp - 27, 24, h + 56);
    // Sporet med varmen: oker over rimstreken, blått under, rødt når det er kaldt.
    ctx.fillStyle = '#0a1224';
    ctx.fillRect(x - 7, topp, 14, h);
    const fy = topp + h * (1 - varm);
    ctx.fillStyle = kaldt ? (blink ? P.fare : '#7a2a20') : P.glød;
    ctx.fillRect(x - 7, fy, 14, topp + h - fy);
    if (!kaldt) {
        const rimY = topp + h * (1 - T.varme.rim / T.varme.maks);
        ctx.fillStyle = P.blå;
        ctx.fillRect(x - 7, Math.max(fy, rimY), 14, topp + h - Math.max(fy, rimY));
    }
    // Hvite skårne hakk langs sporet.
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1;
    for (let k = 1; k < 10; k++) {
        ctx.beginPath();
        ctx.moveTo(x - 11, topp + (h * k) / 10);
        ctx.lineTo(x - 8, topp + (h * k) / 10);
        ctx.stroke();
    }
    ctx.strokeStyle = blink ? P.fare : P.snø;
    ctx.lineWidth = blink ? 3.5 : 2;
    ctx.strokeRect(x - 7, topp, 14, h);
    // Streken for en varm natt.
    const gy = topp + h * (1 - T.varme.god / T.varme.maks);
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, gy);
    ctx.lineTo(x + 12, gy);
    ctx.stroke();
    // Flammen øverst.
    ctx.fillStyle = P.fare;
    ctx.beginPath();
    ctx.moveTo(x - 7, topp - 6);
    ctx.quadraticCurveTo(x - 8, topp - 18, x, topp - 26);
    ctx.quadraticCurveTo(x + 8, topp - 18, x + 7, topp - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.glød;
    ctx.beginPath();
    ctx.moveTo(x - 3.5, topp - 6);
    ctx.quadraticCurveTo(x - 4, topp - 14, x, topp - 19);
    ctx.quadraticCurveTo(x + 4, topp - 14, x + 3.5, topp - 6);
    ctx.closePath();
    ctx.fill();
    // Snøfnugget nederst: seks skårne armer.
    ctx.strokeStyle = blink ? P.fare : '#cfe3f5';
    ctx.lineWidth = 2;
    const sy = topp + h + 16;
    for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3 + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * 9, sy - Math.sin(a) * 9);
        ctx.lineTo(x + Math.cos(a) * 9, sy + Math.sin(a) * 9);
        ctx.stroke();
    }
    if (kaldt) {
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = P.svart;
        ctx.fillRect(x - 28, topp + h + 34, 56, 22);
        ctx.fillStyle = blink ? P.fare : P.snø;
        ctx.fillText('KALDT', x, topp + h + 51);
    }
}

function partikler(ctx: Ctx, fx: Fx) {
    for (const q of fx.partikler) {
        const a = Math.max(0, q.liv / q.maks);
        if (q.slag === 'gnist') {
            ctx.strokeStyle = a > 0.5 ? `rgba(255,242,176,${a})` : `rgba(227,165,43,${a})`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03);
            ctx.stroke();
        } else if (q.slag === 'flis') {
            ctx.fillStyle = `rgba(168,116,58,${a})`;
            ctx.fillRect(q.x, q.y, 3, 1.6);
        } else {
            ctx.fillStyle = q.slag === 'damp' ? `rgba(232,241,255,${0.5 * a})` : `rgba(120,152,196,${a})`;
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r * (q.slag === 'damp' ? 2 : 1), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Kubbene i lufta: en bue fra stabelen til bålet (eller fra armene til stabelen).
    for (const k of fx.kubber) {
        if (k.t < 0) continue;
        const f = Math.min(1, k.t / k.dur);
        const x = k.fx + (k.tx - k.fx) * f;
        const y = k.fy + (k.ty - k.fy) * f - Math.sin(f * Math.PI) * (k.tilBål ? 26 : 18);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f * Math.PI * (k.tilBål ? -2 : 1));
        endeved(ctx, 0, 0, 4.2);
        ctx.restore();
    }
}

function storm(ctx: Ctx, g: Game, klokke: number) {
    if (!stormNå(g)) return;
    const tynn = Math.min(1, stormIgjen(g) / 4);
    ctx.fillStyle = `rgba(214,222,236,${0.28 * tynn})`;
    ctx.fillRect(0, 0, 960, 540);
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * tynn})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let k = 0; k < 90; k++) {
        const x = ((k * 97 + klokke * 420) % 1000) - 20;
        const y = ((k * 53 + klokke * 140) % 560) - 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 9, y + 3);
        ctx.stroke();
    }
}

/** En lapp: papirlapp med svart skåret kant, spretter inn og står fast. */
function lappTegn(ctx: Ctx, tekst: string, x: number, y: number, skala = 1) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(tekst).width + 20;
    const cx = Math.max(w / 2 + 12, Math.min(960 - w / 2 - 12, x));
    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(skala, skala);
    ctx.fillStyle = P.svart;
    ctx.fillRect(-w / 2 + 3, -14, w, 28);
    ctx.fillStyle = P.snø;
    ctx.fillRect(-w / 2, -17, w, 28);
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -17, w, 28);
    ctx.fillStyle = P.svart;
    ctx.fillText(tekst, 0, 2);
    ctx.restore();
}

/** Tastetegning: skårne hvite tastekonturer. */
function tast(ctx: Ctx, x: number, y: number, w: number, merke: string) {
    ctx.fillStyle = P.svart;
    ctx.fillRect(x - w / 2, y - 14, w, 26);
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2 + 2, y - 12, w - 4, 22);
    ctx.fillStyle = P.snø;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(merke, x, y + 4);
}

function hint(ctx: Ctx, valg: TegneValg) {
    // Faste plasser: ved døra der Inga starter, og over gamma der hun legger på.
    if (valg.hint.gå) {
        // På snøen nedenfor døra, ved føttene der hun går ut.
        const x = G + 96;
        const y = bakke(x) + 34;
        tast(ctx, x - 16, y, 28, '←');
        tast(ctx, x + 16, y, 28, '→');
        ctx.fillStyle = P.svart;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('gå', x + 48, y + 4);
    }
    if (valg.hint.legg) {
        // Til høyre for kuppelen, under banneret og unna røyksøylen.
        const y = GY - 72;
        tast(ctx, G + 150, y, 120, 'MELLOMROM');
        ctx.fillStyle = P.snø;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('= legg på ved', G + 214, y + 4);
        ctx.textAlign = 'center';
    }
    for (const l of valg.lapper) {
        const inn = Math.min(1, (l.sek - l.igjen) / 0.18);
        const sk = inn < 1 ? 0.7 + 0.45 * inn - 0.15 * inn * inn : 1;
        ctx.globalAlpha = Math.min(1, l.igjen / 0.3);
        lappTegn(ctx, l.tekst, l.x, l.y, sk);
        ctx.globalAlpha = 1;
    }
}

/** Datoen som en utskåret trekloss øverst, og en skåret strek mot februar. */
function datoKloss(ctx: Ctx, g: Game, fx: Fx) {
    const d = Math.min(T.dager, dagNå(g));
    const tekst = dato(d).toUpperCase();
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    const w = Math.max(260, ctx.measureText(tekst).width + 40);
    ctx.fillStyle = P.svart;
    ctx.fillRect(480 - w / 2, 10, w, 38);
    if (fx.varmNatt > 0) {
        ctx.strokeStyle = `rgba(227,165,43,${fx.varmNatt})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(480 - w / 2 - 2, 8, w + 4, 42);
    }
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) ripe(ctx, 480 - w / 2 + 8 + k * (w / 6), 14, 18, -0.8);
    ctx.fillStyle = P.snø;
    ctx.fillText(tekst, 480, 37);
    // Veien mot februar: hakk for hver måned og en glo for i dag.
    const x0 = 340;
    const x1 = 620;
    ctx.fillStyle = P.svart;
    ctx.fillRect(x0 - 4, 52, x1 - x0 + 8, 10);
    ctx.fillStyle = P.glød;
    ctx.fillRect(x0, 55, (x1 - x0) * (d / T.dager), 4);
    ctx.strokeStyle = P.snø;
    ctx.lineWidth = 1.5;
    for (const md of [21, 52, 83]) {
        const x = x0 + ((x1 - x0) * md) / T.dager;
        ctx.beginPath();
        ctx.moveTo(x, 52);
        ctx.lineTo(x, 62);
        ctx.stroke();
    }
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = P.snø;
    ctx.textAlign = 'right';
    ctx.fillText('nov', x0 - 8, 62);
    ctx.textAlign = 'left';
    ctx.fillText('feb: hjelpen kommer', x1 + 8, 62);
}

export function tegn(view: ArcadeView, g: Game, fx: Fx, valg: TegneValg) {
    const { ctx, w, h, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a1224';
    ctx.fillRect(0, 0, w, h);
    const k = skala(w, h);
    const rx = fx.rist > 0 ? (Math.random() - 0.5) * fx.rist : 0;
    const ry = fx.rist > 0 ? (Math.random() - 0.5) * fx.rist : 0;
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * (k.ox + rx), dpr * (k.oy + ry));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, 540);
    ctx.clip();
    ctx.drawImage(bakgrunn(dpr * k.s), 0, 0, 960, 540);
    skip(ctx, dagNå(g));
    hauger(ctx, g, valg.klokke);
    glød(ctx, g, fx, valg.klokke);
    røyk(ctx, g, valg.klokke);
    const frosset = g.mode === 'lost' && g.årsak === 'frosset' ? Math.min(1, fx.slutt / 1.4) : 0;
    gamma(ctx, g, fx, valg.klokke, frosset);
    stabel(ctx, g, fx, valg.klokke);
    if (g.mode === 'won') nedTilStranda(ctx, fx.slutt);
    else inga(ctx, g, fx, !inne(g) && iLyset(g, g.x));
    partikler(ctx, fx);
    patrulje(ctx, g, fx, valg.klokke);
    storm(ctx, g, valg.klokke);
    måler(ctx, g, valg.klokke);
    // Rammen rundt trykket.
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 952, 532);
    if (!valg.meny) {
        datoKloss(ctx, g, fx);
        hint(ctx, valg);
    }
    ctx.restore();
}
