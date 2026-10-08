// HUD-en er kartets egne deler: kartusjen (året, havet, målet og poengene som tellestreker),
// rederens regnskap med tønna øverst til høyre, og en stripe nederst med tegnforklaring og
// tidslinje fram til 1968. Tapet: bildet fryser, og årsaken lyser opp.

import { P, SERIF, tegnHvalStempel } from './ark';
import { tegnFat, skrog, tønnePos, type TegneValg } from './draw';
import type { Fx } from './fx';
import type { Game } from './game';
import { BRETT } from './levels';
import { årsKost, egne, fastKost, kvoteFull, kvoteÅpen, markedÅpent } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

function kort(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fare = false
) {
    ctx.fillStyle = 'rgba(240,232,210,0.94)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = fare ? P.rød : P.blekk;
    ctx.lineWidth = fare ? 3 : 2;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
}

/** Kartusjen: årstallet, havet, år igjen til 1968 og poengene som tellestreker. */
function kartusj(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const x = 16;
    const y = 16;
    kort(ctx, x, y, 214, 92);
    // Pynt i hjørnene, som på en kobberstukket tittelboks.
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1;
    for (const [cx, cy] of [
        [x + 4, y + 4],
        [x + 210, y + 4],
        [x + 4, y + 88],
        [x + 210, y + 88],
    ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Årstallet hopper litt ved nyttår, men aldri inn i teksten ved siden av.
    const s = 1 + 0.2 * fx.årHopp;
    ctx.save();
    ctx.translate(x + 16, y + 40);
    ctx.scale(s, s);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.font = `bold 34px ${SERIF}`;
    // Seieren kommer når 1969 begynner, men målet er 1968: kartusjen viser aldri 1969.
    ctx.fillText(`${Math.min(g.år, T.tid.seier - 1)}`, 0, 0);
    ctx.restore();
    ctx.fillStyle = P.blekk;
    ctx.font = `italic 15px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText(BRETT[g.brett].hav, x + 16, y + 60);
    ctx.font = `13px ${SERIF}`;
    ctx.textAlign = 'right';
    const igjen = T.tid.seier - 1 - g.år;
    ctx.fillText(igjen > 0 ? `${igjen} år til 1968` : 'målet nådd', x + 204, y + 30);
    // Poengene: tellestreker, fem i en bunt (én strek = 5 poeng). Grønne når du har grønne år på rad.
    ctx.strokeStyle = g.grønnRekke > 1 ? P.grønn : P.blekk;
    ctx.lineWidth = 1.6;
    const streker = Math.min(65, Math.floor(g.poeng / 5));
    for (let i = 0; i < streker; i++) {
        const gr = Math.floor(i / 5);
        const k = i % 5;
        const gx = x + 16 + gr * 15;
        const gy = y + 68;
        ctx.beginPath();
        if (k < 4) {
            ctx.moveTo(gx + k * 3, gy);
            ctx.lineTo(gx + k * 3, gy + 12);
        } else {
            ctx.moveTo(gx - 2, gy + 10);
            ctx.lineTo(gx + 12, gy + 2);
        }
        ctx.stroke();
    }
    // Grønt år: et stempel slås i en fast, tom plass i kartusjen (til høyre for havnavnet,
    // under «år til 1968», over tellestrekene), så det aldri dekker annen tekst.
    if (fx.grønt > 0) {
        const k = 1 - fx.grønt;
        const sk = k < 0.15 ? 1.12 - (k / 0.15) * 0.12 : 1;
        ctx.save();
        ctx.translate(x + 166, y + 50);
        ctx.scale(sk, sk);
        ctx.globalAlpha = Math.min(1, fx.grønt * 2.5);
        ctx.fillStyle = P.papir;
        ctx.fillRect(-38, -11, 76, 22);
        ctx.strokeStyle = P.grønn;
        ctx.fillStyle = P.grønn;
        ctx.lineWidth = 2;
        ctx.strokeRect(-38, -11, 76, 22);
        const tekst = fx.rekke > 1 ? `GRØNT ÅR x${Math.min(3, fx.rekke)}` : 'GRØNT ÅR';
        let px = 13;
        ctx.font = `bold ${px}px ${SERIF}`;
        while (px > 9 && ctx.measureText(tekst).width > 68) {
            px -= 0.5;
            ctx.font = `bold ${px}px ${SERIF}`;
        }
        ctx.textAlign = 'center';
        ctx.fillText(tekst, 0, px * 0.36);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

/** Tønna: et fat sett fra siden, fylt med tran. */
function tønne(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fyll: number,
    fare: boolean,
    hopp: number
) {
    const w = 40;
    const h = 64;
    ctx.save();
    ctx.translate(x, y);
    const s = 1 + 0.12 * hopp;
    ctx.scale(s, 2 - s);
    const kropp = () => {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, -h / 2);
        ctx.quadraticCurveTo(-w / 2 - 3, 0, -w / 2 + 4, h / 2);
        ctx.lineTo(w / 2 - 4, h / 2);
        ctx.quadraticCurveTo(w / 2 + 3, 0, w / 2 - 4, -h / 2);
        ctx.closePath();
    };
    kropp();
    ctx.fillStyle = '#e6d8b4';
    ctx.fill();
    ctx.save();
    kropp();
    ctx.clip();
    ctx.fillStyle = fare ? P.rød : P.rav;
    const top = h / 2 - h * fyll;
    ctx.fillRect(-w, top, w * 2, h);
    ctx.restore();
    kropp();
    ctx.strokeStyle = fare ? P.rød : P.blekk;
    ctx.lineWidth = fare ? 3 : 2;
    ctx.stroke();
    // Bøylene og stavene.
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    for (const by of [-h / 2 + 9, h / 2 - 9]) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 1, by);
        ctx.lineTo(w / 2 + 1, by);
        ctx.stroke();
    }
    ctx.lineWidth = 0.7;
    for (const sx of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(sx, -h / 2);
        ctx.lineTo(sx, h / 2);
        ctx.stroke();
    }
    ctx.restore();
}

/** Regnskapet ved tønna: hvor lenge oljen holder, hva som kom inn og går ut, og oljeprisen. */
function regnskap(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg, tap: boolean) {
    const x = 688;
    const y = 12;
    const W = 208;
    const kost = årsKost(g);
    const igjen = kost > 0 ? Math.floor(Math.max(0, g.tønne) / kost) : 99;
    const fare = tap || igjen < 3;
    kort(ctx, x, y, W, regnskapH(g), fare);
    const tp = tønnePos();
    // Tønna rommer seks års drift; én strek på tønna = ett år.
    const fyll = Math.max(0, Math.min(1, o.tønneVist / Math.max(12, kost * 6)));
    tønne(ctx, tp.x, tp.y, fyll, fare, fx.tønneHopp);
    ctx.strokeStyle = 'rgba(30,42,53,0.55)';
    ctx.lineWidth = 1.2;
    for (let k = 1; k < 6; k++) {
        const ly = tp.y + 32 - (64 * k) / 6;
        ctx.beginPath();
        ctx.moveTo(tp.x + 17, ly);
        ctx.lineTo(tp.x + 24, ly);
        ctx.stroke();
    }
    const vis = tap && g.sist ? g.sist : null;
    const inn = g.sist ? g.sist.inn : g.innIÅr;
    const ut = vis ? vis.ut : kost;
    const lx = x + 62;
    const rx = x + W - 12;
    // Det viktigste: hvor mange år oljen holder. Stort, og rødt når det haster.
    ctx.textAlign = 'left';
    const puls = fare ? 1 + 0.08 * Math.sin(o.klokke * 8) : 1;
    ctx.save();
    ctx.translate(lx, y + 30);
    ctx.scale(puls, puls);
    ctx.fillStyle = fare ? P.rød : P.blekk;
    ctx.font = `bold ${fare ? 21 : 19}px ${SERIF}`;
    const holder = tap
        ? 'Tønna er tom!'
        : igjen < 1
          ? 'Tom ved nyttår!'
          : igjen < 3
            ? `Tom om ${igjen} år!`
            : igjen > 9
              ? 'Holder 9+ år'
              : `Holder ${igjen} år`;
    ctx.fillText(holder, 0, 0);
    ctx.restore();
    // Regnestykket som fat, ikke tall: fat inn i fjor (fulle) over fat ut ved nyttår (røde).
    // Er den øverste rekka lengst, vokser tønna.
    ctx.font = `13px ${SERIF}`;
    ctx.fillStyle = P.blekk;
    ctx.fillText('+', lx, y + 50);
    ctx.fillText('-', lx + 1, y + 66);
    fatRekke(ctx, lx + 16, y + 45, rx, inn / T.fangst.fatVerdi, false);
    fatRekke(ctx, lx + 16, y + 61, rx, ut / T.fangst.fatVerdi, true);
    // Hva som koster: stasjonen og hver båt. Fylt båt = på havet (dyr), omriss = i havna (billig).
    let ix = lx + 2;
    const iy = y + 72;
    ctx.fillStyle = P.blekk;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.2;
    if (fastKost(g.år) > 0) {
        ctx.beginPath();
        ctx.moveTo(ix, iy + 6);
        ctx.lineTo(ix + 6, iy);
        ctx.lineTo(ix + 12, iy + 6);
        ctx.lineTo(ix + 12, iy + 12);
        ctx.lineTo(ix, iy + 12);
        ctx.closePath();
        ctx.fill();
        ix += 18;
    }
    for (const b of egne(g)) {
        const dyr = !b.hjemme;
        ctx.save();
        ctx.translate(ix + (b.kokeri ? 11 : 8), iy + 6);
        ctx.scale(b.kokeri ? 0.3 : 0.38, 0.38);
        skrog(ctx, b.kokeri);
        if (dyr) ctx.fill();
        else {
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
        ix += b.kokeri ? 24 : 17;
        if (ix > rx - 10) break;
    }
    if (markedÅpent(g)) markedsMåler(ctx, g, fx, lx, y + 96, rx - lx);
    if (kvoteÅpen(g)) kvoteMåler(ctx, g, fx, lx, y + 124, rx - lx);
}

/** Høyden på regnskapet: det vokser når oljeprisen (1929) og IWC-kvoten (1946) kommer. */
export const regnskapH = (g: Game) => (kvoteÅpen(g) ? 146 : markedÅpent(g) ? 118 : 96);

/**
 * En rekke små fat: ett fat = én fangst ved full pris. Halve fat tegnes halvt.
 * `ut` = røde fat som går ut av tønna ved nyttår.
 */
function fatRekke(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maksX: number,
    antall: number,
    ut: boolean
) {
    const halve = Math.round(antall * 2);
    const plass = Math.floor((maksX - x) / 8);
    const hele = Math.min(plass, Math.floor(halve / 2));
    const halv = hele < plass && halve % 2 === 1;
    for (let i = 0; i < hele + (halv ? 1 : 0); i++) {
        const fx = x + i * 8 + 3.5;
        ctx.save();
        if (halv && i === hele) {
            ctx.beginPath();
            ctx.rect(fx - 5, y - 6, 5, 12);
            ctx.clip();
        }
        if (ut) {
            ctx.fillStyle = '#e9c9b8';
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.ellipse(fx, y, 3.4, 4.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(fx - 3.2, y - 1.5);
            ctx.lineTo(fx + 3.2, y - 1.5);
            ctx.moveTo(fx - 3.2, y + 1.5);
            ctx.lineTo(fx + 3.2, y + 1.5);
            ctx.stroke();
        } else tegnFat(ctx, fx, y, 0.78);
        ctx.restore();
    }
    if (halve === 0) {
        ctx.strokeStyle = 'rgba(30,42,53,0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y);
        ctx.stroke();
    } else if (Math.floor(halve / 2) > plass) {
        ctx.fillStyle = ut ? P.rød : P.grønn;
        ctx.font = `bold 13px ${SERIF}`;
        ctx.textAlign = 'left';
        ctx.fillText('+', maksX + 1, y + 5);
    }
}

/** IWC-kvoten (fra 1946): én strek per hval tatt i år mot kvoten. Full = båtene stanser. */
function kvoteMåler(
    ctx: CanvasRenderingContext2D,
    g: Game,
    fx: Fx,
    x: number,
    y: number,
    w: number
) {
    const k = T.kvote.perÅr;
    const full = kvoteFull(g);
    ctx.textAlign = 'left';
    ctx.font = `13px ${SERIF}`;
    ctx.fillStyle = P.blekk;
    ctx.fillText('Kvote', x, y);
    ctx.textAlign = 'right';
    ctx.font = `bold 14px ${SERIF}`;
    ctx.fillStyle = full ? P.rød : P.blekk;
    ctx.fillText(full ? 'tatt' : `${Math.min(k, g.tattIÅr)} av ${k}`, x + w, y);
    // Strekene: en hval per strek, streken til slutt er kvoten.
    const sx = x;
    const sw = w - 4;
    const by = y + 5;
    const steg = sw / k;
    ctx.lineWidth = 2;
    for (let i = 0; i < k; i++) {
        const tatt = i < g.tattIÅr;
        ctx.strokeStyle = tatt ? (full ? P.rød : P.hval) : 'rgba(30,42,53,0.2)';
        ctx.beginPath();
        ctx.moveTo(sx + i * steg + steg / 2, by);
        ctx.lineTo(sx + i * steg + steg / 2, by + 8);
        ctx.stroke();
    }
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx + sw + 1, by - 3);
    ctx.lineTo(sx + sw + 1, by + 11);
    ctx.stroke();
    // Stempelet slås når årets kvote er tatt.
    if (full && fx.kvote >= 0) {
        const t = Math.min(1, fx.kvote / 0.3);
        const s = 1.8 - 0.8 * t;
        ctx.save();
        ctx.translate(x + w / 2 - 6, by + 4);
        ctx.rotate(-0.08);
        ctx.scale(s, s);
        ctx.globalAlpha = 0.35 + 0.65 * t;
        ctx.fillStyle = P.papir;
        ctx.fillRect(-46, -9, 92, 18);
        ctx.strokeStyle = P.rød;
        ctx.lineWidth = 2;
        ctx.strokeRect(-46, -9, 92, 18);
        ctx.fillStyle = P.rød;
        ctx.font = `bold 13px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText('BÅTENE STANSER', 0, 5);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

/** Oljeprisen (fra 1929): lageret i verden som en stav med en strek. Over streken faller prisen. */
function markedsMåler(
    ctx: CanvasRenderingContext2D,
    g: Game,
    fx: Fx,
    x: number,
    y: number,
    w: number
) {
    const m = T.marked;
    const lager = Math.min(m.grense * 2, g.lager);
    const over = g.lager > m.grense;
    const sw = w - 4;
    const by = y + 6;
    ctx.textAlign = 'left';
    ctx.font = `13px ${SERIF}`;
    ctx.fillStyle = P.blekk;
    ctx.fillText('Oljepris', x, y + 2);
    ctx.textAlign = 'right';
    ctx.font = `bold 14px ${SERIF}`;
    ctx.fillStyle = g.pris < 1 ? P.rød : P.grønn;
    const pst = Math.round(g.pris * 100);
    ctx.fillText(g.pris < 1 ? `${pst} %` : 'full', x + w, y + 2);
    // Staven: hvor mye olje som venter på kjøpere. Streken midt på = det verden kjøper i året.
    const sx = x;
    ctx.fillStyle = 'rgba(30,42,53,0.12)';
    ctx.fillRect(sx, by, sw, 9);
    const fw = (sw * lager) / (m.grense * 2);
    const rist = over ? Math.sin(fx.klokke * 30) * 1.2 : 0;
    ctx.fillStyle = over ? P.rød : P.rav;
    ctx.fillRect(sx, by + rist, fw, 9);
    const gx = sx + sw / 2;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, by - 3);
    ctx.lineTo(gx, by + 12);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, by, sw, 9);
}

/** År -> x på tidslinja. */
const X0 = 488;
const X1 = 930;
const tidX = (år: number) =>
    X0 + ((år - T.tid.start) / (T.tid.seier - 1 - T.tid.start)) * (X1 - X0);

function ringIkon(ctx: CanvasRenderingContext2D, x: number, y: number, farge: string, ut: boolean) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = farge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = P.hval;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5.5, -Math.PI / 2, ut ? Math.PI * 1.2 : 0);
    ctx.stroke();
    ctx.fillStyle = farge;
    ctx.beginPath();
    const r0 = ut ? 9 : 14;
    const r1 = ut ? 15 : 8;
    ctx.moveTo(x + r1 * 0.7, y - r1 * 0.7);
    ctx.lineTo(x + r0 * 0.7 - 3, y - r0 * 0.7 - 3);
    ctx.lineTo(x + r0 * 0.7 + 3, y - r0 * 0.7 + 3);
    ctx.closePath();
    ctx.fill();
}

/** Stripa nederst: tegnforklaringen (de tre reglene) og tidslinja til 1968. */
function stripe(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    ctx.fillStyle = 'rgba(240,232,210,0.95)';
    ctx.fillRect(0, 500, 960, 40);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(960, 500);
    ctx.stroke();
    ctx.font = `14px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = P.blekk;
    if (g.år < T.fredning.finnmark) {
        // Regel 1: båt ved flokk tar hval.
        ctx.save();
        ctx.translate(26, 521);
        ctx.scale(0.75, 0.75);
        skrog(ctx, false);
        ctx.fill();
        ctx.restore();
        ctx.fillText('tar hval', 44, 526);
    }
    // Regel 2: ringen (fra 1904 helt til venstre, så artene får plass).
    const rx0 = g.år < T.fredning.finnmark ? 126 : 28;
    ringIkon(ctx, rx0, 520, P.grønn, true);
    ctx.fillStyle = P.blekk;
    ctx.fillText('vokser', rx0 + 20, 526);
    ringIkon(ctx, rx0 + 92, 520, P.rød, false);
    ctx.fillStyle = P.blekk;
    ctx.fillText('krymper', rx0 + 112, 526);
    if (g.år < T.fredning.finnmark) {
        // Regel 3: oljen.
        tegnFat(ctx, 320, 520, 1);
        ctx.fillStyle = P.blekk;
        ctx.fillText('båt ute koster mest', 332, 526);
    } else {
        // Artene på kartet (fra 1904): form og størrelse, størst først. Ringene flyttes fram.
        const arter = (['blå', 'finn', 'sei'] as const).filter((a) =>
            g.flokker.some((f) => f.art === a)
        );
        let ax = 212;
        for (const a of arter) {
            const l = T.arter[a].lengde * 0.42;
            tegnHvalStempel(ctx, a, 0, ax + l / 2, 520, 0, l);
            ctx.fillStyle = P.blekk;
            ctx.fillText(T.arter[a].navn, ax + l + 4, 526);
            ax += l + 4 + ctx.measureText(T.arter[a].navn).width + 10;
        }
    }

    // Tidslinja.
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X0, 520);
    ctx.lineTo(X1, 520);
    ctx.stroke();
    ctx.fillStyle = P.blekk;
    ctx.fillRect(X0, 517, Math.max(0, tidX(Math.min(g.år, 1968)) - X0), 6);
    ctx.font = `13px ${SERIF}`;
    ctx.lineWidth = 1.5;
    for (const b of BRETT) {
        if (!b.kart) continue;
        const x = tidX(b.fra);
        ctx.beginPath();
        ctx.moveTo(x, 512);
        ctx.lineTo(x, 528);
        ctx.stroke();
        ctx.textAlign = b.fra === T.tid.start ? 'left' : 'center';
        ctx.fillText(`${b.fra}`, x, 538);
    }
    // Rekorden: et blyantmerke.
    if (o.rekord > T.tid.start) {
        const x = tidX(Math.min(1968, o.rekord));
        ctx.strokeStyle = 'rgba(80,80,80,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 3, 506);
        ctx.lineTo(x + 2, 532);
        ctx.stroke();
    }
    // Flagget ved 1968: målet.
    const fx = tidX(1968);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, 528);
    ctx.lineTo(fx, 486);
    ctx.stroke();
    ctx.fillStyle = P.grønn;
    ctx.beginPath();
    ctx.moveTo(fx, 486);
    ctx.lineTo(fx + 22, 492);
    ctx.lineTo(fx, 498);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.blekk;
    ctx.font = `bold 13px ${SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText('1968', fx - 5, 496);
    // Her er du nå.
    const nx = tidX(Math.min(g.år, 1968));
    ctx.beginPath();
    ctx.moveTo(nx, 515);
    ctx.lineTo(nx - 7, 506);
    ctx.lineTo(nx + 7, 506);
    ctx.closePath();
    ctx.fill();
}

/**
 * Der tapet stemples: den tomme tønna (konkurs) eller flokken som døde sist (tomt hav).
 * Holdes unna kartusjen, regnskapet og stripa. Slutt-kortet legger seg på motsatt side.
 */
export function tapMål(g: Game): { x: number; y: number; flokk: number | null } {
    if (g.årsak === 'konkurs') return { x: 770, y: 72, flokk: null };
    let mål = null as Game['flokker'][number] | null;
    for (const f of g.flokker) {
        if (!mål) mål = f;
        else if (f.død && (!mål.død || (f.dødÅr ?? 0) > (mål.dødÅr ?? 0))) mål = f;
        else if (!f.død && !mål.død && f.n < mål.n) mål = f;
    }
    if (!mål) return { x: 480, y: 270, flokk: null };
    return {
        x: Math.max(130, Math.min(830, mål.x)),
        y: Math.max(170, Math.min(400, mål.y)),
        flokk: mål.id,
    };
}

/** Det store stempelet: slås ned med et smell og blir liggende skrått over tingen. */
function stortStempel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    linje1: string,
    linje2: string,
    t: number
) {
    const k = Math.min(1, t / 0.3);
    const s = k < 1 ? 2.4 - 1.4 * k * k : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.14);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, 0.25 + k);
    ctx.font = `bold 32px ${SERIF}`;
    const w1 = ctx.measureText(linje1).width;
    ctx.font = `bold 15px ${SERIF}`;
    const w = Math.max(w1, ctx.measureText(linje2).width) + 40;
    ctx.fillStyle = P.papir;
    ctx.fillRect(-w / 2, -34, w, 68);
    ctx.strokeStyle = P.rød;
    ctx.lineWidth = 4;
    ctx.strokeRect(-w / 2, -34, w, 68);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2 + 6, -28, w - 12, 56);
    ctx.fillStyle = P.rød;
    ctx.textAlign = 'center';
    ctx.font = `bold 32px ${SERIF}`;
    ctx.fillText(linje1, 0, 6);
    ctx.font = `bold 15px ${SERIF}`;
    ctx.fillText(linje2, 0, 24);
    ctx.restore();
    ctx.globalAlpha = 1;
}

export function tegnHud(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg) {
    kartusj(ctx, g, fx);
    regnskap(ctx, g, fx, o, g.mode === 'lost' && g.årsak === 'konkurs');
    stripe(ctx, g, o);
}

/** Hvorfor runden ble tapt, i én setning (tap-bildet og slutt-skjermen). */
export function tapTekst(g: Game): string {
    if (g.årsak === 'konkurs') {
        const s = g.sist;
        if (s && g.pris < 0.8)
            return `${s.år}: For mange fat på en gang. Oljeprisen falt til ${Math.round(g.pris * 100)} %.`;
        return s
            ? `${s.år}: Fangsten ga ${Math.round(s.inn)} olje, men båtene og stasjonen kostet ${Math.round(s.ut)}.`
            : `${g.år}: Tønna er tom.`;
    }
    let sist: number | null = null;
    for (const f of g.flokker)
        if (f.død && f.dødÅr !== null && (sist === null || f.dødÅr > sist)) sist = f.dødÅr;
    return sist !== null
        ? `${g.år}: Havet er tomt. Den siste flokken forsvant i ${sist}.`
        : `${g.år}: Havet er tomt. Det er for få hval igjen til å få nok unger.`;
}

/** Tapet: bildet fryser, og årsaken lyser opp (båtene som tappet tønna, eller flokkene som forsvant). */
export function tegnTap(
    ctx: CanvasRenderingContext2D,
    g: Game,
    klokke: number,
    fx: Fx,
    slutt: boolean
) {
    const puls = 0.5 + 0.5 * Math.sin(klokke * 6);
    const mål = tapMål(g);
    if (g.årsak === 'konkurs') {
        const fra = tønnePos();
        ctx.strokeStyle = P.rød;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        for (const b of g.båter) {
            if (!g.tappere.includes(b.id)) continue;
            ctx.beginPath();
            ctx.moveTo(fra.x, fra.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        for (const b of egne(g)) {
            const ute = g.tappere.includes(b.id);
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = ute ? 2 + 2 * puls : 1;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.kokeri ? 42 : 26, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (g.pris < 0.8) {
            // Prisfallet: måleren ved tønna lyser opp.
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 2 + 2 * puls;
            ctx.strokeRect(744, 92, 146, 34);
        }
    } else {
        ctx.textAlign = 'center';
        for (const f of g.flokker) {
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 3 + 2 * puls;
            ctx.beginPath();
            ctx.arc(f.x, f.y, T.fangst.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = P.blekk;
            ctx.strokeStyle = P.papir;
            ctx.lineWidth = 4;
            ctx.font = `bold 14px ${SERIF}`;
            if (f.id === mål.flokk) continue;
            const lapp = f.død ? `tom ${f.dødÅr}` : `${f.n} hval igjen`;
            ctx.strokeText(lapp, f.x, f.y - T.fangst.radius - 14);
            ctx.fillText(lapp, f.x, f.y - T.fangst.radius - 14);
        }
    }
    // Stempelet slås på tingen som felte selskapet.
    const t = Math.max(0, fx.tap);
    if (g.årsak === 'konkurs') {
        stortStempel(
            ctx,
            mål.x,
            mål.y,
            'KONKURS',
            g.pris < 0.8 ? 'oljeprisen falt' : 'tønna er tom',
            t
        );
    } else {
        const f = g.flokker.find((k) => k.id === mål.flokk);
        const under = f ? (f.død ? `${f.navn}: tom ${f.dødÅr}` : `${f.navn}: ${f.n} hval`) : '';
        stortStempel(ctx, mål.x, mål.y, 'HAVET TOMT', under, t);
    }
    // Setningen nederst står bare mens bildet er frosset; etterpå står den i slutt-kortet.
    if (slutt) return;
    const tekst = tapTekst(g);
    ctx.font = `bold 18px ${SERIF}`;
    const bw = Math.min(940, ctx.measureText(tekst).width + 32);
    const x = 480 - bw / 2;
    kort(ctx, x, 446, bw, 42, true);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.fillText(tekst, x + 16, 473);
}
