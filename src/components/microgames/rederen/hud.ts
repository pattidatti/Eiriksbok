// HUD-en er kartets egne deler: kartusjen (året, havet, målet og poengene som tellestreker),
// rederens regnskap med tønna øverst til høyre, og en stripe nederst med tegnforklaring og
// tidslinje fram til 1968. Tapet: bildet fryser, og årsaken lyser opp.

import { P, SERIF } from './ark';
import { tegnFat, skrog, tønnePos, type TegneValg } from './draw';
import type { Fx } from './fx';
import type { Game } from './game';
import { BRETT } from './levels';
import { årsKost, egne, fastKost } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

const komma = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');

function kort(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fare = false) {
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
    const s = 1 + 0.35 * fx.årHopp;
    ctx.save();
    ctx.translate(x + 16, y + 40);
    ctx.scale(s, s);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.font = `bold 34px ${SERIF}`;
    ctx.fillText(`${g.år}`, 0, 0);
    ctx.restore();
    ctx.fillStyle = P.blekk;
    ctx.font = `italic 15px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText(BRETT[g.brett].hav, x + 16, y + 60);
    ctx.font = `13px ${SERIF}`;
    ctx.textAlign = 'right';
    const igjen = T.tid.seier - 1 - g.år;
    ctx.fillText(igjen > 0 ? `${igjen} år til 1968` : 'forbi 1968', x + 204, y + 30);
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
    // Grønt år: et stempel slås i kartusjen.
    if (fx.grønt > 0) {
        const k = 1 - fx.grønt;
        const sk = k < 0.15 ? 1.8 - (k / 0.15) * 0.8 : 1;
        ctx.save();
        ctx.translate(x + 158, y + 52);
        ctx.rotate(-0.18);
        ctx.scale(sk, sk);
        ctx.globalAlpha = Math.min(1, fx.grønt * 2.5);
        ctx.strokeStyle = P.grønn;
        ctx.fillStyle = P.grønn;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-50, -15, 100, 30);
        ctx.font = `bold 15px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText(fx.rekke > 1 ? `GRØNT ÅR x${Math.min(3, fx.rekke)}` : 'GRØNT ÅR', 0, 5);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

/** Tønna: et fat sett fra siden, fylt med tran. */
function tønne(ctx: CanvasRenderingContext2D, x: number, y: number, fyll: number, fare: boolean, hopp: number) {
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

/** Regnskapet ved tønna: hva som kom inn i år, og hva båtene og stasjonen koster ved nyttår. */
function regnskap(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg, tap: boolean) {
    const x = 688;
    const y = 12;
    const W = 208;
    const kost = årsKost(g);
    const igjen = kost > 0 ? Math.floor(g.tønne / kost) : 99;
    const fare = tap || igjen < 2;
    kort(ctx, x, y, W, 120, fare);
    const tp = tønnePos();
    const fyll = Math.max(0, Math.min(1, o.tønneVist / Math.max(12, kost * 6)));
    tønne(ctx, tp.x, tp.y, fyll, fare, fx.tønneHopp);
    // Inn: hele fjoråret (et år er kort, og fatene bruker tid hjem), eller hittil i år før første nyttår.
    const vis = tap && g.sist ? g.sist : null;
    const inn = g.sist ? g.sist.inn : g.innIÅr;
    const ut = vis ? vis.ut : kost;
    const lx = x + 62;
    const rx = x + W - 12;
    ctx.textAlign = 'left';
    ctx.font = `14px ${SERIF}`;
    ctx.fillStyle = P.blekk;
    ctx.fillText('I tønna', lx, y + 26);
    ctx.fillText(vis ? `Inn i ${vis.år}` : g.sist ? 'Inn i fjor' : 'Inn i år', lx, y + 48);
    ctx.fillText('Ut ved nyttår', lx, y + 70);
    ctx.textAlign = 'right';
    ctx.font = `bold 15px ${SERIF}`;
    ctx.fillText(komma(Math.max(0, o.tønneVist)), rx, y + 26);
    ctx.fillStyle = P.grønn;
    ctx.fillText(`+${komma(inn)}`, rx, y + 48);
    ctx.fillStyle = P.rød;
    ctx.fillText(`-${komma(ut)}`, rx, y + 70);
    // Hva som koster: stasjonen og hver båt. Fylt båt = på havet (dyr), omriss = i havna (billig).
    let ix = lx + 2;
    const iy = y + 88;
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
    ctx.textAlign = 'left';
    ctx.font = `bold 13px ${SERIF}`;
    ctx.fillStyle = fare ? P.rød : P.blekk;
    if (tap) ctx.fillText('Tønna er tom', lx, y + 114);
    else if (igjen < 4) ctx.fillText(igjen < 1 ? 'Tom ved nyttår!' : `Tom om ${igjen} år`, lx, y + 114);
}

/** År -> x på tidslinja. */
const X0 = 488;
const X1 = 930;
const tidX = (år: number) => X0 + ((år - T.tid.start) / (T.tid.seier - 1 - T.tid.start)) * (X1 - X0);

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
    // Regel 1: båt ved flokk tar hval.
    ctx.save();
    ctx.translate(26, 521);
    ctx.scale(0.75, 0.75);
    skrog(ctx, false);
    ctx.fill();
    ctx.restore();
    ctx.fillText('tar hval', 44, 526);
    // Regel 2: ringen.
    ringIkon(ctx, 126, 520, P.grønn, true);
    ctx.fillStyle = P.blekk;
    ctx.fillText('vokser', 146, 526);
    ringIkon(ctx, 218, 520, P.rød, false);
    ctx.fillStyle = P.blekk;
    ctx.fillText('krymper', 238, 526);
    // Regel 3: oljen.
    tegnFat(ctx, 320, 520, 1);
    ctx.fillStyle = P.blekk;
    ctx.fillText('båt ute koster mest', 332, 526);

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

export function tegnHud(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg) {
    kartusj(ctx, g, fx);
    regnskap(ctx, g, fx, o, g.mode === 'lost' && g.årsak === 'konkurs');
    stripe(ctx, g, o);
}

/** Tapet: bildet fryser, og årsaken lyser opp (båtene som tappet tønna, eller flokkene som forsvant). */
export function tegnTap(ctx: CanvasRenderingContext2D, g: Game, klokke: number) {
    const puls = 0.5 + 0.5 * Math.sin(klokke * 6);
    let tekst: string;
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
        const s = g.sist;
        tekst = s
            ? `${s.år}: Fangsten ga ${komma(s.inn)} olje, men båtene og stasjonen kostet ${komma(s.ut)}.`
            : `${g.år}: Tønna er tom.`;
    } else {
        let sist: { navn: string; år: number } | null = null;
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
            const lapp = f.død ? `tom ${f.dødÅr}` : `${f.n} hval igjen`;
            ctx.strokeText(lapp, f.x, f.y - T.fangst.radius - 14);
            ctx.fillText(lapp, f.x, f.y - T.fangst.radius - 14);
            if (f.død && f.dødÅr !== null && (!sist || f.dødÅr >= sist.år)) sist = { navn: f.navn, år: f.dødÅr };
        }
        tekst = sist
            ? `${g.år}: Havet er tomt. Den siste flokken forsvant i ${sist.år}.`
            : `${g.år}: Havet er tomt. Det er for få hval igjen til å få nok unger.`;
    }
    ctx.font = `bold 18px ${SERIF}`;
    const bw = Math.min(940, ctx.measureText(tekst).width + 32);
    const x = 480 - bw / 2;
    kort(ctx, x, 446, bw, 42, true);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.fillText(tekst, x + 16, 473);
}
