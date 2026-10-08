// Gråboksen: hele bildet med enkle former. Leser bare spillet.
// Det skal forklare uten tekst: svarte båter er dine, blå prikker er hval, ringen rundt
// flokken er grønn når den vokser og rød når den tømmes, og fatene ruller hjem til tønna.

import type { ArcadeView } from '../arcade/useArcade';
import type { Båt, Game } from './game';
import { BRETT, KART } from './levels';
import { fangerFra, årsKost } from './rules';
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

export interface TegneValg {
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
    hint: { fra: { x: number; y: number }; til: { x: number; y: number } } | null;
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

function tegnHavn(ctx: CanvasRenderingContext2D, g: Game) {
    const { x, y } = g.havn;
    ctx.fillStyle = P.blekk;
    ctx.fillRect(x - 8, y - 8, 16, 16);
    // Tønna: fylles med rav etter hvor mange år flåten tåler.
    const kost = Math.max(1, årsKost(g));
    const fyll = Math.max(0, Math.min(1, g.tønne / (kost * 4)));
    const tx = x + 16;
    const ty = y - 22;
    ctx.fillStyle = P.papir;
    ctx.fillRect(tx, ty, 18, 30);
    ctx.fillStyle = g.tønne < kost ? P.rød : P.rav;
    ctx.fillRect(tx, ty + 30 * (1 - fyll), 18, 30 * fyll);
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, 18, 30);
    ctx.fillStyle = P.blekk;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(g.tønne)}`, tx + 22, ty + 12);
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`-${String(kost).replace('.', ',')} i året`, tx + 22, ty + 27);
    ctx.fillText(g.havn.navn, x - 20, y + 22);
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
        // Ringen: grønn når flokken vokser, rød når båtene tar mer enn den føder.
        const vokser = f.netto >= 0;
        ctx.strokeStyle = vokser ? P.grønn : P.rød;
        ctx.lineWidth = vokser ? 3 : 3 + Math.min(4, -f.netto * 2) + Math.sin(klokke * 8) * 0.8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, T.fangst.radius, 0, Math.PI * 2);
        ctx.stroke();
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
    const w = b.kokeri ? 38 : 20;
    const h = b.kokeri ? 12 : 10;
    if (valgt) {
        ctx.strokeStyle = P.rav;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - w / 2 - 4, b.y - h / 2 - 4, w + 8, h + 8);
    }
    ctx.fillStyle = P.blekk;
    ctx.beginPath();
    ctx.moveTo(b.x - w / 2, b.y - h / 2);
    ctx.lineTo(b.x + w / 2 - 5, b.y - h / 2);
    ctx.lineTo(b.x + w / 2, b.y);
    ctx.lineTo(b.x + w / 2 - 5, b.y + h / 2);
    ctx.lineTo(b.x - w / 2, b.y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.papir;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.kokeri ? 'K' : `${nr}`, b.x - 2, b.y + 3);
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
        if (fangerFra(g, b)) {
            ctx.strokeStyle = P.rav;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 14 + (o.klokke * 20) % 8, 0, Math.PI * 2);
            ctx.stroke();
        }
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

function tegnHint(ctx: CanvasRenderingContext2D, o: TegneValg) {
    if (!o.hint) return;
    const { fra, til } = o.hint;
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

function tegnHud(ctx: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    // Kartusjen: året og havet.
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.fillRect(12, 12, 190, 62);
    ctx.strokeRect(12, 12, 190, 62);
    ctx.fillStyle = P.blekk;
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(`${g.år}`, 24, 44);
    ctx.font = '15px Georgia, serif';
    ctx.fillText(BRETT[g.brett].hav, 24, 64);
    // Forvalter-poengene og grønne år på rad.
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`${g.poeng}`, 192, 40);
    ctx.font = '11px Georgia, serif';
    ctx.fillText(g.grønnRekke > 1 ? `grønt x${Math.min(3, g.grønnRekke)}` : 'poeng', 192, 56);
    // Rekorden: blyantmerke i nedre kant.
    if (o.rekord > T.tid.start) {
        const x = 12 + ((o.rekord - T.tid.start) / (T.tid.seier - T.tid.start)) * 936;
        ctx.strokeStyle = P.grå;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 528);
        ctx.lineTo(x, 540);
        ctx.stroke();
    }
    const nå = 12 + ((g.år - T.tid.start) / (T.tid.seier - T.tid.start)) * 936;
    ctx.fillStyle = P.blekk;
    ctx.fillRect(12, 534, nå - 12, 3);

    // Tegnforklaringen: de tre reglene.
    const lx = 760;
    const ly = 448;
    ctx.fillStyle = P.papir;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1.5;
    ctx.fillRect(lx, ly, 188, 76);
    ctx.strokeRect(lx, ly, 188, 76);
    ctx.textAlign = 'left';
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = P.blekk;
    ctx.fillRect(lx + 10, ly + 10, 14, 8);
    ctx.fillText('båt ved flokk = tar hval', lx + 32, ly + 18);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = P.grønn;
    ctx.beginPath();
    ctx.arc(lx + 12, ly + 38, 6, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = P.rød;
    ctx.beginPath();
    ctx.arc(lx + 12, ly + 38, 6, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.fillText('ring = født mot tatt', lx + 32, ly + 42);
    ctx.fillStyle = P.rav;
    ctx.fillRect(lx + 10, ly + 54, 12, 14);
    ctx.fillStyle = P.blekk;
    ctx.fillText('tønne: hver båt koster', lx + 32, ly + 66);
}

export function tegn(view: ArcadeView, g: Game, o: TegneValg) {
    const { ctx, w, h, dpr } = view;
    const k = skala(w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = P.blekk;
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * k.ox, dpr * k.oy);
    tegnLand(ctx, g);
    tegnHavn(ctx, g);
    tegnFlokker(ctx, g, o.klokke);
    tegnBåter(ctx, g, o);
    tegnHint(ctx, o);
    if (!o.meny) tegnHud(ctx, g, o);
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
