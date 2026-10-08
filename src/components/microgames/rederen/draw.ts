// Gråboksen: hele bildet med enkle former. Leser bare spillet.
// Det skal forklare uten tekst: svarte båter er dine, blå prikker er hval, ringen rundt
// flokken er en målestokk (jo mer ring, jo flere hval igjen) som er grønn når flokken vokser
// og rød når den krymper, og fatene ruller hjem til tønna. Tidslinja nederst viser målet: 1968.

import type { ArcadeView } from '../arcade/useArcade';
import type { Båt, Game } from './game';
import { BRETT, KART } from './levels';
import { årsKost } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export const P = {
    papir: '#ece3cb',
    land: '#d4b783',
    blekk: '#1e2a35',
    hval: '#3a5878',
    grønn: '#5e8a58',
    rød: '#a83a26',
    rav: '#c58a2c',
    grå: '#9a9483',
};

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
}

/** En oljedråpe som flyr fra tønna til en båt ved årsskiftet. */
export interface Dråpe {
    id: number;
    /** 0-1 langs veien. */
    t: number;
}

export interface TegneValg {
    /** Tønna slik den vises: synker mykt etter årsskiftet. */
    tønneVist: number;
    dråper: Dråpe[];
    meny: boolean;
    lapper: Lapp[];
    klokke: number;
    /** Båten eleven holder i nå, og hvor pekeren er. */
    drar: { id: number; x: number; y: number } | null;
    /** Valgt båt (klikk eller tastatur). */
    valgt: number | null;
    /** Sikte for tastaturet. */
    sikte: { x: number; y: number } | null;
    /** Hint: pil fra båt til flokk (start) eller fra båt til havna (første røde ring). */
    hint: { fra: { x: number; y: number }; til: { x: number; y: number }; hånd?: boolean } | null;
    /** Rekordåret som blyantmerke i kanten. */
    rekord: number;
}

function tegnLand(ctx: CanvasRenderingContext2D, g: Game) {
    ctx.fillStyle = P.papir;
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = P.land;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    for (const l of KART[g.kart].land) {
        ctx.beginPath();
        l.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

/** Hvor tønna står ved havna (dråpene flyr herfra). */
export const tønnePos = (g: Game) => ({ x: g.havn.x + 26, y: g.havn.y - 16 });

/** Hvor mange år tønna holder med de båtene som er ute nå. */
export const årIgjen = (g: Game) => {
    const kost = årsKost(g);
    return kost > 0 ? Math.max(0, Math.floor(g.tønne / kost)) : 99;
};

function tegnHavn(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg, varsel = false) {
    const { x, y } = g.havn;
    ctx.fillStyle = P.blekk;
    ctx.fillRect(x - 8, y - 8, 16, 16);
    // Tønna er en søyle. Hver strek er ett år med de båtene som er ute nå.
    const kost = Math.max(0.5, årsKost(g));
    const ÅR = 6;
    const fyll = Math.max(0, Math.min(1, o.tønneVist / (kost * ÅR)));
    const tw = 20;
    const th = 48;
    const tx = x + 16;
    const ty = y - 40;
    const igjen = årIgjen(g);
    ctx.fillStyle = P.papir;
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = igjen < 2 ? P.rød : P.rav;
    ctx.fillRect(tx, ty + th * (1 - fyll), tw, th * fyll);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1;
    for (let i = 1; i < ÅR; i++) {
        ctx.beginPath();
        ctx.moveTo(tx, ty + (th * i) / ÅR);
        ctx.lineTo(tx + 6, ty + (th * i) / ÅR);
        ctx.stroke();
    }
    ctx.strokeStyle = varsel ? P.rød : P.blekk;
    ctx.lineWidth = varsel ? 4 : 2;
    ctx.strokeRect(tx, ty, tw, th);
    // Nedtellingen: når er tønna tom med de båtene som er ute nå?
    ctx.fillStyle = igjen < 2 ? P.rød : P.blekk;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(igjen >= 10 ? 'tom om 10+ år' : `tom om ${igjen} år`, x - 12, y - 24);
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = P.blekk;
    ctx.fillText(g.havn.navn, x - 12, y - 10);
}

function tegnFlokker(ctx: CanvasRenderingContext2D, g: Game, klokke: number) {
    for (const f of g.flokker) {
        if (f.død) {
            ctx.strokeStyle = P.grå;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(f.x, f.y, T.fangst.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = P.blekk;
            ctx.beginPath();
            ctx.moveTo(f.x - 8, f.y - 8);
            ctx.lineTo(f.x + 8, f.y + 8);
            ctx.moveTo(f.x + 8, f.y - 8);
            ctx.lineTo(f.x - 8, f.y + 8);
            ctx.stroke();
            continue;
        }
        // Ringen er en målestokk: buen er hval igjen (full ring = full flokk). Grønn når
        // flokken vokser, rød når båtene tar mer enn den føder. Blinker når den er nesten tom.
        const vokser = f.netto >= 0;
        const andel = Math.min(1, f.n / f.maks);
        ctx.strokeStyle = P.grå;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, T.fangst.radius, 0, Math.PI * 2);
        ctx.stroke();
        const blink = andel < 0.3 && Math.sin(klokke * 10) < 0;
        ctx.globalAlpha = blink ? 0.25 : 1;
        ctx.strokeStyle = vokser ? P.grønn : P.rød;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(f.x, f.y, T.fangst.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * andel);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Hvalene: én prikk per hval i en solsikke-spiral.
        ctx.fillStyle = P.hval;
        for (let i = 0; i < f.n; i++) {
            const a = i * 2.4;
            const r = 5.2 * Math.sqrt(i + 0.5);
            ctx.beginPath();
            ctx.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.8, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function tegnBåt(ctx: CanvasRenderingContext2D, b: Båt, nr: number, valgt: boolean) {
    const w = b.kokeri ? 64 : 40;
    const h = b.kokeri ? 24 : 20;
    if (valgt) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - w / 2 - 4, b.y - h / 2 - 4, w + 8, h + 8);
    }
    ctx.fillStyle = P.blekk;
    ctx.beginPath();
    ctx.moveTo(b.x - w / 2, b.y - h / 2);
    ctx.lineTo(b.x + w / 2 - 10, b.y - h / 2);
    ctx.lineTo(b.x + w / 2, b.y);
    ctx.lineTo(b.x + w / 2 - 10, b.y + h / 2);
    ctx.lineTo(b.x - w / 2, b.y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.papir;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.kokeri ? 'K' : `${nr}`, b.x - 4, b.y + 5);
}

function stiplet(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
}

function tegnBåter(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    // Prikkete linjer: fra båter som fanger, hjem til havna (eller kokeriet).
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = P.blekk;
    for (const k of g.fat) stiplet(ctx, k.x, k.y, k.tx, k.ty);
    // Kurs: båter på vei.
    ctx.strokeStyle = P.grå;
    for (const b of g.båter)
        if (b.x !== b.tx || b.y !== b.ty) stiplet(ctx, b.x, b.y, b.tx, b.ty);
    ctx.setLineDash([]);
    ctx.fillStyle = P.rav;
    for (const k of g.fat) {
        ctx.beginPath();
        ctx.arc(k.x, k.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    let nr = 0;
    for (const b of g.båter) {
        if (!b.kokeri) nr++;
        tegnBåt(ctx, b, nr, o.valgt === b.id || o.drar?.id === b.id);
    }
    // Oljedråpene fra årsskiftet: fra tønna til hver båt som er ute.
    const fra = tønnePos(g);
    ctx.fillStyle = P.rav;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    for (const d of o.dråper) {
        const b = g.båter.find((k) => k.id === d.id);
        if (!b) continue;
        const x = fra.x + (b.x - fra.x) * d.t;
        const y = fra.y + (b.y - fra.y) * d.t - Math.sin(d.t * Math.PI) * 40;
        ctx.beginPath();
        ctx.moveTo(x, y - 9);
        ctx.quadraticCurveTo(x + 6, y, x, y + 5);
        ctx.quadraticCurveTo(x - 6, y, x, y - 9);
        ctx.fill();
        ctx.stroke();
    }
    if (o.drar) {
        const b = g.båter.find((k) => k.id === o.drar!.id);
        if (b) {
            ctx.setLineDash([6, 5]);
            ctx.strokeStyle = P.blekk;
            ctx.lineWidth = 2;
            stiplet(ctx, b.x, b.y, o.drar.x, o.drar.y);
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(o.drar.x, o.drar.y, T.fangst.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    if (o.sikte) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(o.sikte.x, o.sikte.y, 10, 0, Math.PI * 2);
        ctx.moveTo(o.sikte.x - 16, o.sikte.y);
        ctx.lineTo(o.sikte.x + 16, o.sikte.y);
        ctx.moveTo(o.sikte.x, o.sikte.y - 16);
        ctx.lineTo(o.sikte.x, o.sikte.y + 16);
        ctx.stroke();
    }
}

/** En enkel hånd med pekefinger opp: hintet som drar båten. */
function tegnHånd(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 3, y - 4, 7, 16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 18, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function tegnHint(ctx: CanvasRenderingContext2D, o: TegneValg) {
    if (!o.hint) return;
    const { fra, til } = o.hint;
    if (o.hint.hånd) {
        // Hånden griper båten og drar en skyggebåt ut til flokken, om og om igjen.
        const t = Math.min(1, ((o.klokke * 0.5) % 1.3) / 1);
        const x = fra.x + (til.x - fra.x) * t;
        const y = fra.y + (til.y - fra.y) * t;
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        stiplet(ctx, fra.x, fra.y, x, y);
        ctx.setLineDash([]);
        ctx.fillStyle = P.blekk;
        ctx.fillRect(x - 20, y - 10, 40, 20);
        ctx.globalAlpha = 1;
        tegnHånd(ctx, x, y);
        return;
    }
    const puls = 0.5 + 0.5 * Math.sin(o.klokke * 5);
    ctx.globalAlpha = 0.4 + 0.6 * puls;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    stiplet(ctx, fra.x, fra.y, til.x, til.y);
    ctx.setLineDash([]);
    const a = Math.atan2(til.y - fra.y, til.x - fra.x);
    ctx.beginPath();
    ctx.moveTo(til.x, til.y);
    ctx.lineTo(til.x - 14 * Math.cos(a - 0.5), til.y - 14 * Math.sin(a - 0.5));
    ctx.moveTo(til.x, til.y);
    ctx.lineTo(til.x - 14 * Math.cos(a + 0.5), til.y - 14 * Math.sin(a + 0.5));
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/** År -> x på tidslinja nederst. */
const tidX = (år: number) => 40 + ((år - T.tid.start) / (T.tid.seier - T.tid.start)) * 860;

function tegnHud(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    // Kartusjen: året, havet og forvalter-poengene som tellestreker (én strek = 5 poeng).
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.fillRect(12, 12, 190, 80);
    ctx.strokeRect(12, 12, 190, 80);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(`${g.år}`, 24, 44);
    ctx.font = '15px Georgia, serif';
    ctx.fillText(BRETT[g.brett].hav, 24, 64);
    ctx.strokeStyle = g.grønnRekke > 1 ? P.grønn : P.blekk;
    ctx.lineWidth = 1.5;
    const streker = Math.min(60, Math.floor(g.poeng / 5));
    for (let i = 0; i < streker; i++) {
        const gr = Math.floor(i / 5);
        const k = i % 5;
        const gx = 24 + (gr % 12) * 14;
        const gy = 72;
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

    // Tidslinja: målet er å holde ut forbi 1968. Merker der du må flytte til et nytt hav.
    ctx.fillStyle = P.papir;
    ctx.fillRect(0, 516, 960, 24);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 516);
    ctx.lineTo(960, 516);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tidX(T.tid.start), 530);
    ctx.lineTo(tidX(T.tid.seier), 530);
    ctx.stroke();
    ctx.fillStyle = P.blekk;
    ctx.fillRect(tidX(T.tid.start), 527, tidX(g.år) - tidX(T.tid.start), 6);
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.lineWidth = 1.5;
    for (const b of BRETT) {
        if (!b.kart || b.fra === T.tid.start) continue;
        const x = tidX(b.fra);
        ctx.beginPath();
        ctx.moveTo(x, 522);
        ctx.lineTo(x, 538);
        ctx.stroke();
        ctx.fillText(b.hav, x + 4, 527);
    }
    if (o.rekord > T.tid.start) {
        ctx.strokeStyle = P.grå;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tidX(o.rekord), 520);
        ctx.lineTo(tidX(o.rekord), 540);
        ctx.stroke();
    }
    // Flagget ved 1968.
    const fx = tidX(1968);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, 536);
    ctx.lineTo(fx, 500);
    ctx.stroke();
    ctx.fillStyle = P.grønn;
    ctx.beginPath();
    ctx.moveTo(fx, 500);
    ctx.lineTo(fx + 22, 506);
    ctx.lineTo(fx, 512);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = P.blekk;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('1968', fx - 4, 510);
    // Her er du nå.
    const nx = tidX(g.år);
    ctx.beginPath();
    ctx.moveTo(nx, 524);
    ctx.lineTo(nx - 6, 517);
    ctx.lineTo(nx + 6, 517);
    ctx.closePath();
    ctx.fill();

    // Tegnforklaringen: de tre reglene.
    const lx = 760;
    const ly = 412;
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    ctx.fillRect(lx, ly, 188, 76);
    ctx.strokeRect(lx, ly, 188, 76);
    ctx.textAlign = 'left';
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = P.blekk;
    ctx.fillRect(lx + 8, ly + 9, 18, 10);
    ctx.fillText('båt ved flokk = tar hval', lx + 32, ly + 18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.grønn;
    ctx.beginPath();
    ctx.arc(lx + 16, ly + 38, 7, -Math.PI / 2, Math.PI * 0.9);
    ctx.stroke();
    ctx.fillText('ring = hval igjen', lx + 32, ly + 42);
    ctx.fillStyle = P.rav;
    ctx.fillRect(lx + 10, ly + 54, 12, 14);
    ctx.fillStyle = P.blekk;
    ctx.fillText('båt ute koster mest olje', lx + 32, ly + 66);
}

/** Tapet: bildet fryser, og årsaken lyser opp. */
function tegnTap(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    ctx.fillStyle = 'rgba(236,227,203,0.7)';
    ctx.fillRect(0, 0, 960, 540);
    const puls = 0.5 + 0.5 * Math.sin(o.klokke * 6);
    let tekst: string;
    if (g.årsak === 'konkurs') {
        // Båtene som var ute, og tønna de tappet.
        const fra = tønnePos(g);
        ctx.strokeStyle = P.rød;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        for (const b of g.båter) if (g.tappere.includes(b.id)) stiplet(ctx, fra.x, fra.y, b.x, b.y);
        ctx.setLineDash([]);
        // Båtene på havet (full pris) blinker tydelig, båtene i havna (lite) svakt.
        let nr = 0;
        for (const b of g.båter) {
            if (!b.kokeri) nr++;
            const ute = g.tappere.includes(b.id);
            tegnBåt(ctx, b, nr, false);
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = ute ? 2 + 2 * puls : 1;
            const w = b.kokeri ? 38 : 26;
            ctx.strokeRect(b.x - w, b.y - 16, w * 2, 32);
        }
        tegnHavn(ctx, g, o, true);
        const kost = String(Math.round(årsKost(g) * 10) / 10).replace('.', ',');
        tekst = `${g.år}: Tønna er tom. Flåten kostet ${kost} olje i året, men fangsten ga for lite.`;
    } else {
        // Flokkene som døde, med året.
        let sist: { navn: string; år: number } | null = null;
        ctx.textAlign = 'center';
        for (const f of g.flokker) {
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 3 + 2 * puls;
            ctx.beginPath();
            ctx.arc(f.x, f.y, T.fangst.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = P.blekk;
            ctx.font = 'bold 14px Georgia, serif';
            const lapp = f.død ? `${f.navn}: tom ${f.dødÅr}` : `${f.navn}: ${f.n} hval igjen`;
            ctx.fillText(lapp, f.x, f.y - T.fangst.radius - 8);
            if (f.død && f.dødÅr !== null && (!sist || f.dødÅr >= sist.år)) sist = { navn: f.navn, år: f.dødÅr };
        }
        tekst = sist
            ? `${g.år}: Havet er tomt. Den siste flokken, ${sist.navn}, forsvant i ${sist.år}.`
            : `${g.år}: Havet er tomt. Det er for få hval igjen til å få nok unger.`;
    }
    ctx.font = 'bold 18px Georgia, serif';
    const bw = Math.min(940, ctx.measureText(tekst).width + 28);
    const x = 480 - bw / 2;
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.rød;
    ctx.lineWidth = 3;
    ctx.fillRect(x, 456, bw, 36);
    ctx.strokeRect(x, 456, bw, 36);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.fillText(tekst, x + 14, 480);
}

export function tegn(view: ArcadeView, g: Game, o: TegneValg) {
    const { ctx, w, h, dpr } = view;
    const k = skala(w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = P.blekk;
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * k.ox, dpr * k.oy);
    tegnLand(ctx, g);
    tegnHavn(ctx, g, o);
    tegnFlokker(ctx, g, o.klokke);
    tegnBåter(ctx, g, o);
    tegnHint(ctx, o);
    if (!o.meny) tegnHud(ctx, g, o);
    if (!o.meny && g.mode === 'lost') {
        tegnTap(ctx, g, o);
        return;
    }
    for (const l of o.lapper) {
        ctx.font = 'bold 17px Georgia, serif';
        const bw = ctx.measureText(l.tekst).width + 24;
        const x = Math.max(8, Math.min(952 - bw, l.x - bw / 2));
        ctx.globalAlpha = Math.min(1, l.igjen * 2);
        ctx.fillStyle = P.papir;
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 2;
        ctx.fillRect(x, l.y - 22, bw, 32);
        ctx.strokeRect(x, l.y - 22, bw, 32);
        ctx.fillStyle = P.blekk;
        ctx.textAlign = 'left';
        ctx.fillText(l.tekst, x + 12, l.y);
        ctx.globalAlpha = 1;
    }
}
