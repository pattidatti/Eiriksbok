// Scenen: kartarket, flokkene som blå stempler med ring, båtene sett ovenfra, fatene som ruller
// hjem, effektene og lampelyset. HUD-en (kartusj, regnskap, tidslinje) ligger i hud.ts.
// Leser bare spillet og effektene.

import type { ArcadeView } from '../arcade/useArcade';
import { ark, P, SERIF, tegnHvalKant, tegnHvalStempel } from './ark';
import { glatt, UNGE_SEK, type Fx } from './fx';
import type { Båt, Flokk, Game } from './game';
import { tegnHud, tegnTap } from './hud';
import { KART, type Kart } from './levels';
import { fangerFra, kvoteFull } from './rules';
import { TUNING } from './tuning';

const T = TUNING;
const R = T.fangst.radius;

export { P };

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}

/** Kartarket ligger på rederens skrivebord: litt kant av bordet synes rundt arket. */
const BORD = { x: 34, y: 22 };

export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / (960 + BORD.x * 2), h / (540 + BORD.y * 2));
    return { s, ox: (w - 960 * s) / 2, oy: (h - 540 * s) / 2 };
};

/** Skrivebordet: mørk eik med årer, og skyggen av arket. */
function tegnBord(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#3a2717';
    ctx.fillRect(-300, -300, 1560, 1140);
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
        const y = -40 + i * 16;
        ctx.strokeStyle = i % 3 ? 'rgba(20,10,4,0.28)' : 'rgba(120,80,40,0.18)';
        ctx.beginPath();
        ctx.moveTo(-300, y);
        for (let x = -300; x <= 1260; x += 60) ctx.lineTo(x, y + Math.sin(x * 0.011 + i * 1.7) * 5);
        ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 10, 960, 540);
}

/** En oljedråpe som flyr fra tønna til en båt ved årsskiftet. */
export interface Dråpe {
    id: number;
    /** 0-1 langs veien. */
    t: number;
}

export interface TegneValg {
    tønneVist: number;
    dråper: Dråpe[];
    meny: boolean;
    klokke: number;
    drar: { id: number; x: number; y: number } | null;
    valgt: number | null;
    sikte: { x: number; y: number } | null;
    /** Start-hintet: fast pil fra båten til den grønne flokken. */
    hint: { fra: { x: number; y: number }; til: { x: number; y: number } } | null;
    rekord: number;
    /** Slutt-kortet står: tap-setningen tegnes ikke på kartet (den står i kortet). */
    slutt: boolean;
    /** Ukesnivået: lav tegner færre småting (samme spill). */
    lav: boolean;
}

/** Hvor tønna står (dråpene flyr herfra). Den står i regnskapet øverst til høyre. */
export const tønnePos = () => ({ x: 702, y: 60 });

// ---------------------------------------------------------------- flokkene

function tegnDødFlokk(ctx: CanvasRenderingContext2D, f: Flokk, t: number) {
    // Ringen trekker seg sammen til et blekk-kryss, som et vrak på et sjøkart.
    const k = Math.min(1, t / 0.9);
    const r = R * (1 - 0.55 * glatt(k));
    ctx.strokeStyle = k < 1 ? P.rød : 'rgba(30,42,53,0.35)';
    ctx.lineWidth = k < 1 ? 3 : 1.2;
    ctx.setLineDash(k < 1 ? [] : [3, 4]);
    ctx.beginPath();
    ctx.arc(f.x, f.y, k < 1 ? r : R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const s = 9 * glatt(k);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(f.x - s, f.y - s);
    ctx.lineTo(f.x + s, f.y + s);
    ctx.moveTo(f.x + s, f.y - s);
    ctx.lineTo(f.x - s, f.y + s);
    ctx.stroke();
}

/**
 * Grensa rundt flokken: en tynn strek som viser hvor nær båten må ligge. Fargen og
 * størrelsen bærer hvalen selv (se `tegnHval`). Når eleven drar en båt hit, lyser den rav.
 */
function tegnGrense(ctx: CanvasRenderingContext2D, f: Flokk, mål: boolean) {
    ctx.strokeStyle = 'rgba(30,42,53,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, Math.PI * 2);
    ctx.stroke();
    if (mål) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(f.x, f.y, R + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

/**
 * Lengden på den tegnede hvalen: artens lengde når flokken er full, og den krymper med
 * flokken. Én stor hval per flokk, så eleven ser hvor mye som er igjen - og hvilken art.
 */
export const hvalLengde = (f: Flokk) =>
    T.arter[f.art].lengde * (0.25 + 0.75 * Math.min(1, f.n / f.maks));

/** Fredet flokk: grå stiplet ring uten piler - her fanger ingen. */
function tegnFredetRing(ctx: CanvasRenderingContext2D, f: Flokk) {
    ctx.strokeStyle = P.grå;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(f.x, f.y, R + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function tegnFredStempel(ctx: CanvasRenderingContext2D, f: Flokk, finnmark: boolean, t: number) {
    const k = Math.min(1, t / 0.35);
    const s = k < 1 ? 2.2 - 1.2 * glatt(k) : 1;
    ctx.save();
    ctx.translate(f.x, f.y + 4);
    ctx.rotate(-0.2);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, 0.3 + k);
    const farge = finnmark ? P.rød : P.blekk;
    ctx.strokeStyle = farge;
    ctx.fillStyle = P.papir;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-46, -13, 92, 26);
    ctx.strokeRect(-46, -13, 92, 26);
    ctx.fillStyle = farge;
    ctx.font = `bold 15px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText(finnmark ? 'FORBUDT' : 'FREDET', 0, 5);
    ctx.restore();
    ctx.globalAlpha = 1;
}

function tegnHval(ctx: CanvasRenderingContext2D, f: Flokk, fx: Fx, klokke: number) {
    const unger = fx.unger.get(f.id) ?? [];
    // Retningen flokken svømmer langs sløyfa.
    const kurs = Math.atan2(f.ry * Math.cos(f.fase), -f.rx * Math.sin(f.fase));
    const t = fx.klokke;
    const l = hvalLengde(f);
    const vri = kurs + Math.sin(t * 1.3 + f.id) * 0.07;
    const cx = Math.cos(vri);
    const cy = Math.sin(vri);
    // Kjølvannet: to korte blekkstreker bak halen.
    ctx.strokeStyle = 'rgba(30,42,53,0.3)';
    ctx.lineWidth = 1;
    for (const k of [-1, 1]) {
        const bx = f.x - cx * l * 0.55;
        const by = f.y - cy * l * 0.55;
        ctx.beginPath();
        ctx.moveTo(bx - cy * k * 4, by + cx * k * 4);
        ctx.lineTo(bx - cx * l * 0.18 - cy * k * 8, by - cy * l * 0.18 + cx * k * 8);
        ctx.stroke();
    }
    // Hvalen selv bærer fargen: grønn kant når flokken vokser, rød når den krymper (og
    // blinker når den nesten er borte). En fredet flokk har ingen kant.
    if (f.fredet) tegnHvalStempel(ctx, f.art, f.id, f.x, f.y, vri, l);
    else {
        const vokser = f.netto >= 0;
        const blink = !vokser && f.n < f.maks * 0.3 && Math.sin(klokke * 9) < 0;
        const farge = vokser ? P.grønn : blink ? '#e8a090' : P.rød;
        // Skyggen i vannet under hvalen, i samme farge: synes på avstand.
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(vri);
        ctx.globalAlpha = 0.36;
        ctx.fillStyle = farge;
        ctx.beginPath();
        ctx.ellipse(0, 0, l * 0.62, l * 0.24 + 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        tegnHvalKant(ctx, f.art, f.id, f.x, f.y, vri, l, farge, 3.5);
    }
    // Sprut: hvalen blåser - en søyle av damp over blåsehullet som stiger og brer seg.
    const fase = (t * 0.42 + f.id * 0.37) % 1;
    if (fase < 0.28) {
        const p = fase / 0.28;
        const hx = f.x + cx * l * 0.32;
        const hy = f.y + cy * l * 0.32;
        const st = 0.6 + 0.5 * (l / 90);
        ctx.globalAlpha = 0.9 * (1 - p * p);
        ctx.fillStyle = '#f6f3ea';
        ctx.strokeStyle = P.hval;
        ctx.lineWidth = 1;
        for (let d = 0; d < 5; d++) {
            const side = (d % 2 ? 1 : -1) * Math.ceil(d / 2);
            const dx = side * (3 + 7 * p) * st;
            const dy = (-8 - 26 * p + Math.abs(side) * 5) * st;
            ctx.beginPath();
            ctx.arc(hx + dx, hy + dy, (2.5 + 4 * p) * st, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    // Ungene: en liten hval av samme art svømmer inn fra kanten av ringen og blir en del av flokken.
    for (let j = 0; j < Math.min(1, unger.length); j++) {
        const alder = t - unger[unger.length - 1 - j];
        const inn = Math.min(1, alder / UNGE_SEK);
        const pop = alder < 0.35 ? 0.4 + 0.6 * (alder / 0.35) : 1;
        const a = kurs + Math.PI * 0.75 + j * 0.9;
        const r = 34 - 22 * glatt(inn);
        const ux = f.x + Math.cos(a) * r;
        const uy = f.y + Math.sin(a) * r * 0.8;
        ctx.globalAlpha = 0.95 * (1 - inn * inn);
        const ul = T.arter[f.art].lengde * 0.36 * pop;
        tegnHvalStempel(ctx, f.art, j + 1, ux, uy, Math.atan2(f.y - uy, f.x - ux), ul);
        ctx.globalAlpha = 1;
    }
}

function tegnFlokker(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg) {
    let mål: Flokk | null = null;
    if (o.drar) {
        let bd = R;
        for (const f of g.flokker) {
            const d = Math.hypot(f.x - o.drar.x, f.y - o.drar.y);
            if (!f.død && d < bd) {
                bd = d;
                mål = f;
            }
        }
    }
    for (const f of g.flokker) {
        if (f.død) tegnDødFlokk(ctx, f, fx.døde.get(f.id) ?? 9);
        else if (f.fredet) tegnFredetRing(ctx, f);
        else tegnGrense(ctx, f, f === mål);
        // Låst: ringen blinker rav og strammer seg inn rundt flokken når båten slippes der.
        const l = fx.lås.get(f.id);
        if (l !== undefined && !f.død) {
            const k = l / 0.6;
            ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = P.rav;
            ctx.lineWidth = 5 * (1 - k) + 1;
            ctx.beginPath();
            ctx.arc(f.x, f.y, R + 30 * (1 - glatt(k)), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    for (const f of g.flokker) if (!f.død) tegnHval(ctx, f, fx, o.klokke);
    // Hval som tas: en liten hval løftes fra flokken til båten, krymper og blir et fat.
    for (const t of fx.tatt) {
        const k = Math.min(1, t.t / 0.9);
        const x = t.x + (t.bx - t.x) * glatt(k);
        const y = t.y + (t.by - t.y) * glatt(k) - Math.sin(k * Math.PI) * 18;
        ctx.globalAlpha = 1 - k * 0.7;
        const l = T.arter[t.art].lengde * (0.34 - k * 0.2);
        tegnHvalStempel(ctx, t.art, 2, x, y, k * 1.2 + Math.atan2(t.by - t.y, t.bx - t.x), l);
        ctx.globalAlpha = 1;
    }
}

// ---------------------------------------------------------------- båtene

/** Et lite fat (tran) sett fra siden. */
export function tegnFat(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
    ctx.fillStyle = P.rav;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4.2 * s, y - 2 * s);
    ctx.lineTo(x + 4.2 * s, y - 2 * s);
    ctx.moveTo(x - 4.2 * s, y + 2 * s);
    ctx.lineTo(x + 4.2 * s, y + 2 * s);
    ctx.stroke();
}

/** Skroget sett ovenfra, baugen mot +x. Hvalbåten: smal med kanon i baugen. Kokeriet: langt, slipp akter. */
export function skrog(ctx: CanvasRenderingContext2D, kokeri: boolean) {
    ctx.beginPath();
    if (kokeri) {
        ctx.moveTo(38, 0);
        ctx.quadraticCurveTo(30, -12, 14, -12);
        ctx.lineTo(-34, -12);
        ctx.lineTo(-34, -5);
        ctx.lineTo(-26, -3);
        ctx.lineTo(-26, 3);
        ctx.lineTo(-34, 5);
        ctx.lineTo(-34, 12);
        ctx.lineTo(14, 12);
        ctx.quadraticCurveTo(30, 12, 38, 0);
    } else {
        ctx.moveTo(21, 0);
        ctx.quadraticCurveTo(14, -8, 2, -8);
        ctx.lineTo(-15, -7);
        ctx.quadraticCurveTo(-20, 0, -15, 7);
        ctx.lineTo(2, 8);
        ctx.quadraticCurveTo(14, 8, 21, 0);
    }
    ctx.closePath();
}

function tegnBåt(
    ctx: CanvasRenderingContext2D,
    b: Båt,
    nr: number,
    fx: Fx,
    valgt: boolean,
    klokke: number
) {
    const kurs = fx.kurs.get(b.id) ?? Math.PI;
    const h = fx.hopp.get(b.id);
    const sprett = h !== undefined ? 1 + 0.35 * Math.sin(Math.min(1, h / 0.5) * Math.PI) : 1;
    const vipp = Math.sin(klokke * 2.1 + b.id) * 0.05;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.save();
    ctx.rotate(kurs + vipp);
    ctx.scale(sprett, sprett);
    if (valgt) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 6;
        skrog(ctx, b.kokeri);
        ctx.stroke();
    }
    if (b.tilbud) {
        // Til salgs: bare omrisset, stiplet, som en båt tegnet med blyant på kartet.
        ctx.fillStyle = 'rgba(236,227,203,0.85)';
        skrog(ctx, b.kokeri);
        ctx.fill();
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        ctx.fillStyle = P.blekk;
        skrog(ctx, b.kokeri);
        ctx.fill();
        // Dekk og pipe.
        ctx.strokeStyle = 'rgba(236,227,203,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (b.kokeri) {
            ctx.moveTo(-24, 0);
            ctx.lineTo(28, 0);
        } else {
            ctx.moveTo(-12, 0);
            ctx.lineTo(14, 0);
        }
        ctx.stroke();
        ctx.fillStyle = P.papir;
        for (const px of b.kokeri ? [-6, 6] : [-6]) {
            ctx.beginPath();
            ctx.arc(px, 0, b.kokeri ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
        if (!b.kokeri) {
            ctx.fillStyle = P.rav;
            ctx.beginPath();
            ctx.arc(15, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
    if (!b.kokeri && !b.tilbud) {
        // Nummeret står rett, så det kan leses (og tastes).
        ctx.fillStyle = P.papir;
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 3;
        ctx.font = `bold 13px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.strokeText(`${nr}`, 0, -11);
        ctx.fillText(`${nr}`, 0, -11);
    }
    if (b.tilbud) {
        // Prislappen: et fat og prisen, festet med en snor.
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(10, -20);
        ctx.stroke();
        ctx.fillStyle = P.rav;
        ctx.fillRect(4, -36, 40, 18);
        ctx.strokeRect(4, -36, 40, 18);
        tegnFat(ctx, 13, -27, 0.75);
        ctx.fillStyle = P.blekk;
        ctx.font = `bold 13px ${SERIF}`;
        ctx.textAlign = 'left';
        ctx.fillText(`${b.pris}`, 20, -22);
    }
    ctx.restore();
}

function tegnBåter(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg) {
    // Røyken bak båtene.
    for (const r of fx.røyk) {
        const k = r.t / (o.lav ? 1.2 : 1.8);
        ctx.fillStyle = `rgba(30,42,53,${0.28 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2 + k * 6, 0, Math.PI * 2);
        ctx.fill();
    }
    // Prikkete fangstlinjer fra båter som fanger, hjem til havna eller kokeriet. De flyter hjemover.
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(30,42,53,0.7)';
    ctx.lineDashOffset = -o.klokke * 24;
    for (const b of g.båter) {
        if (!fangerFra(g, b)) continue;
        const m = mottakFor(g, b);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
    }
    // Kursen: båter på vei (blyant).
    ctx.lineDashOffset = 0;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30,42,53,0.35)';
    for (const b of g.båter) {
        if (Math.hypot(b.x - b.tx, b.y - b.ty) < 2) continue;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.tx, b.ty);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const k of g.fat) tegnFat(ctx, k.x, k.y, Math.sqrt(k.verdi / T.fangst.fatVerdi));
    let nr = 0;
    for (const b of g.båter) {
        if (!b.kokeri && !b.tilbud) nr++;
        tegnBåt(ctx, b, nr, fx, o.valgt === b.id || o.drar?.id === b.id, o.klokke);
    }
    // Årets kvote er tatt: båtene på havet stanser. Et rødt pausemerke over hver av dem.
    if (kvoteFull(g)) {
        for (const b of g.båter) {
            if (b.hjemme || b.kokeri || b.tilbud) continue;
            ctx.fillStyle = P.papir;
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 20, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = P.rød;
            ctx.fillRect(b.x - 4, b.y - 24, 3, 8);
            ctx.fillRect(b.x + 1, b.y - 24, 3, 8);
        }
    }
}

function mottakFor(g: Game, b: Båt) {
    let best = { x: g.havn.x, y: g.havn.y };
    let bd = Math.hypot(b.x - best.x, b.y - best.y);
    for (const k of g.båter) {
        if (!k.kokeri || k.tilbud) continue;
        const d = Math.hypot(b.x - k.x, b.y - k.y);
        if (d < bd) {
            bd = d;
            best = { x: k.x, y: k.y };
        }
    }
    return best;
}

// ---------------------------------------------------------------- havna, drag og hint

function tegnHavn(ctx: CanvasRenderingContext2D, g: Game, k: Kart, o: TegneValg) {
    const s = k.sone;
    const lyser = o.drar !== null;
    const inne =
        o.drar && o.drar.x >= s.x0 && o.drar.x <= s.x1 && o.drar.y >= s.y0 && o.drar.y <= s.y1;
    ctx.fillStyle = inne
        ? 'rgba(197,138,44,0.35)'
        : lyser
          ? 'rgba(197,138,44,0.16)'
          : 'rgba(30,42,53,0.04)';
    ctx.fillRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
    ctx.strokeStyle = lyser ? P.rav : 'rgba(30,42,53,0.45)';
    ctx.lineWidth = lyser ? 2.5 : 1.2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
    ctx.setLineDash([]);
    // Ankeret: havnas tegn på sjøkartet.
    const { x, y } = g.havn;
    ctx.strokeStyle = P.blekk;
    ctx.fillStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 9, 3, 0, Math.PI * 2);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 8);
    ctx.moveTo(x - 5, y - 2);
    ctx.lineTo(x + 5, y - 2);
    ctx.moveTo(x - 8, y + 3);
    ctx.quadraticCurveTo(x, y + 12, x + 8, y + 3);
    ctx.stroke();
}

function pil(
    ctx: CanvasRenderingContext2D,
    fra: { x: number; y: number },
    til: { x: number; y: number },
    kort = 0
) {
    const a = Math.atan2(til.y - fra.y, til.x - fra.x);
    const ex = til.x - Math.cos(a) * kort;
    const ey = til.y - Math.sin(a) * kort;
    ctx.beginPath();
    ctx.moveTo(fra.x, fra.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 14 * Math.cos(a - 0.45), ey - 14 * Math.sin(a - 0.45));
    ctx.lineTo(ex - 14 * Math.cos(a + 0.45), ey - 14 * Math.sin(a + 0.45));
    ctx.closePath();
    ctx.fill();
}

/** En hånd med pekefinger, som griper båten. */
function tegnHånd(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 2, 7, 16, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 20, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function tegnDragOgHint(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    if (o.hint) {
        // Fast hint: en stiplet pil fra båten til den grønne flokken, og en hånd på båten. Den
        // pulserer litt i styrke, men står stille.
        const puls = 0.55 + 0.45 * Math.sin(o.klokke * 3.2);
        ctx.globalAlpha = 0.45 + 0.4 * puls;
        ctx.strokeStyle = P.blekk;
        ctx.fillStyle = P.blekk;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 7]);
        pil(ctx, o.hint.fra, o.hint.til, R + 14);
        ctx.globalAlpha = 1;
        tegnHånd(ctx, o.hint.fra.x + 6, o.hint.fra.y + 4);
    }
    if (o.drar) {
        const b = g.båter.find((k) => k.id === o.drar!.id);
        if (b) {
            ctx.strokeStyle = P.blekk;
            ctx.fillStyle = P.blekk;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            pil(ctx, b, o.drar, 6);
            // Skyggebåten der den slippes.
            ctx.save();
            ctx.translate(o.drar.x, o.drar.y);
            ctx.rotate(Math.atan2(o.drar.y - b.y, o.drar.x - b.x));
            ctx.globalAlpha = 0.45;
            skrog(ctx, b.kokeri);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }
    if (o.sikte) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(o.sikte.x, o.sikte.y, 12, 0, Math.PI * 2);
        ctx.moveTo(o.sikte.x - 20, o.sikte.y);
        ctx.lineTo(o.sikte.x + 20, o.sikte.y);
        ctx.moveTo(o.sikte.x, o.sikte.y - 20);
        ctx.lineTo(o.sikte.x, o.sikte.y + 20);
        ctx.stroke();
    }
}

function tegnDråper(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    const fra = tønnePos();
    ctx.fillStyle = P.rav;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    for (const d of o.dråper) {
        const b = g.båter.find((k) => k.id === d.id);
        if (!b) continue;
        const x = fra.x + (b.x - fra.x) * d.t;
        const y = fra.y + (b.y - fra.y) * d.t - Math.sin(d.t * Math.PI) * 60;
        const s = b.hjemme ? 0.6 : 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y - 9 * s);
        ctx.quadraticCurveTo(x + 6 * s, y, x, y + 5 * s);
        ctx.quadraticCurveTo(x - 6 * s, y, x, y - 9 * s);
        ctx.fill();
        ctx.stroke();
    }
}

function tegnBølger(ctx: CanvasRenderingContext2D, fx: Fx) {
    for (const b of fx.bølger) {
        const k = b.t / b.liv;
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = b.farge;
        ctx.lineWidth = b.tykk;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4 + b.r * glatt(k), 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

/** Lampelyset: varmt fra øvre venstre hjørne, mild skygge nede til høyre. Kaldere etter 1946. */
function tegnLys(ctx: CanvasRenderingContext2D, år: number) {
    const kald = år >= 1946;
    const lys = ctx.createRadialGradient(40, 20, 20, 40, 20, 760);
    lys.addColorStop(0, kald ? 'rgba(235,240,255,0.22)' : 'rgba(255,205,120,0.32)');
    lys.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = lys;
    ctx.fillRect(-200, -200, 1360, 940);
    const skygge = ctx.createRadialGradient(960, 540, 40, 960, 540, 700);
    skygge.addColorStop(0, kald ? 'rgba(20,30,50,0.4)' : 'rgba(50,30,10,0.38)');
    skygge.addColorStop(1, 'rgba(50,30,10,0)');
    ctx.fillStyle = skygge;
    ctx.fillRect(-200, -200, 1360, 940);
}

/** Stempelet over det gamle arket når Finnmark stenges. */
function tegnForbudt(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(480, 300);
    ctx.rotate(-0.12);
    ctx.strokeStyle = P.rød;
    ctx.fillStyle = P.rød;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.85;
    ctx.strokeRect(-190, -40, 380, 80);
    ctx.font = `bold 34px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText('FANGST FORBUDT 1904', 0, 12);
    ctx.restore();
    // Skravering: kysten er stengt.
    ctx.strokeStyle = 'rgba(30,42,53,0.18)';
    ctx.lineWidth = 1;
    for (let x = -540; x < 960; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 540);
        ctx.lineTo(x + 540, 0);
        ctx.stroke();
    }
}

export function tegn(view: ArcadeView, g: Game, fx: Fx, o: TegneValg) {
    const { ctx, w, h, dpr } = view;
    const k = skala(w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#3a2717';
    ctx.fillRect(0, 0, w, h);
    // Rykket: hele bordet og arket hopper litt (HUD-en også - det er ett kart på et bord).
    const rx = fx.rykk ? (Math.random() - 0.5) * 2 * fx.rykk : 0;
    const ry = fx.rykk ? (Math.random() - 0.5) * 2 * fx.rykk : 0;
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * (k.ox + rx * k.s), dpr * (k.oy + ry * k.s));
    tegnBord(ctx);
    // Arket og alt på det klippes til arket, så arkbyttet ikke tegner utover bordet.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, 540);
    ctx.clip();
    const r = k.s * dpr;
    // Arkbytte: det gamle arket glir opp og ut, det nye kommer nedenfra.
    const e = fx.arkFra ? glatt(fx.arkT) : 1;
    const dy = (1 - e) * 540;
    if (fx.arkFra && fx.arkT < 1) {
        ctx.save();
        ctx.translate(0, -e * 540);
        ctx.drawImage(ark(fx.arkFra, r), 0, 0, 960, 540);
        if (fx.arkFra === 'finnmark') tegnForbudt(ctx);
        ctx.restore();
    }
    ctx.save();
    ctx.translate(0, dy);
    ctx.drawImage(ark(g.kart, r), 0, 0, 960, 540);
    const kart = KART[g.kart];
    if (!o.meny) tegnHavn(ctx, g, kart, o);
    tegnFlokker(ctx, g, fx, o);
    tegnBølger(ctx, fx);
    tegnBåter(ctx, g, fx, o);
    // Fredet: et stempel over flokken («FREDET» eller «FORBUDT»), slått på med et smell. Tegnes
    // over båtene, så båtene som seiler hjem ikke skjuler det.
    for (const f of g.flokker)
        if (f.fredet && !f.død)
            tegnFredStempel(ctx, f, g.kart === 'finnmark', fx.fred.get(f.id) ?? 9);
    if (!o.meny) tegnDragOgHint(ctx, g, o);
    ctx.restore();
    ctx.restore();
    tegnLys(ctx, g.år);
    if (o.meny) return;
    tegnDråper(ctx, g, o);
    tegnHud(ctx, g, fx, o);
    if (g.mode === 'lost') tegnTap(ctx, g, o.klokke, fx, o.slutt);
}
