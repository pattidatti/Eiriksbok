// HUD-en er kartets egne deler: kartusjen (året, havet og år igjen til 1968), rederens
// regnskap med tønna øverst til høyre (med vanlige ord, ingen tegn å lære), og en stripe
// nederst med tegnforklaring og tidslinje fram til 1968. Tapet: bildet fryser, og årsaken
// lyser opp.

import { P, SERIF, tegnHvalKant, tegnHvalStempel } from './ark';
import { skrog, tegnFat, tønnePos, type TegneValg } from './draw';
import type { Fx } from './fx';
import type { Game } from './game';
import { BRETT } from './levels';
import { årsKost, egne, fatPåVei, kvoteFull, kvoteÅpen, markedÅpent } from './rules';
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

/** Høyden på kartusjen. */
const KARTUSJ_H = 72;

/** Kartusjen: årstallet, havet og år igjen til 1968. Ingen koder, bare det eleven trenger. */
function kartusj(ctx: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const x = 16;
    const y = 16;
    const h = KARTUSJ_H;
    kort(ctx, x, y, 214, h);
    // Pynt i hjørnene, som på en kobberstukket tittelboks.
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1;
    for (const [cx, cy] of [
        [x + 4, y + 4],
        [x + 210, y + 4],
        [x + 4, y + h - 4],
        [x + 210, y + h - 4],
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

/** Regnskapet: kortet øverst til høyre. Tønna til venstre, linjene med vanlige ord til høyre. */
export const REGNSKAP = { x: 672, y: 12, w: 224 };

interface Linje {
    deler: { t: string; farge: string }[];
    px: number;
    puls?: boolean;
}

/**
 * Linjene ved tønna, øverst først: «Tom om N år!» bare når det haster, så hva som kommer inn
 * og går ut i året (i fat), og fra 1929 oljeprisen og fra 1946 kvoten - med ord, ikke tegn.
 */
function linjer(g: Game, tap: boolean): Linje[] {
    const ut: Linje[] = [];
    const kost = årsKost(g);
    const igjen = kost > 0 ? Math.floor(Math.max(0, g.tønne) / kost) : 99;
    const haster = tap
        ? 'Tønna er tom!'
        : igjen < 1
          ? 'Tom ved nyttår!'
          : igjen < 3
            ? `Tom om ${igjen} år!`
            : null;
    if (haster) ut.push({ deler: [{ t: haster, farge: P.rød }], px: 19, puls: !tap });
    const vis = tap && g.sist ? g.sist : null;
    const fv = T.fangst.fatVerdi;
    const inn = Math.round((g.sist ? g.sist.inn : g.innIÅr) / fv);
    const kostFat = (vis ? vis.ut : kost) / fv;
    const utFat = kostFat > 0 ? Math.max(1, Math.round(kostFat)) : 0;
    ut.push({
        deler: [
            { t: 'Inn ', farge: P.blekk },
            { t: `${inn}`, farge: inn >= utFat ? P.grønn : P.rød },
            { t: ' - ut ', farge: P.blekk },
            { t: `${utFat}`, farge: P.rød },
            { t: ' fat i året', farge: P.blekk },
        ],
        px: 16,
    });
    if (markedÅpent(g)) {
        const snart = g.lager + fatPåVei(g) > T.marked.grense * 0.85;
        const t =
            g.pris < 1
                ? `Oljeprisen: ${Math.round(g.pris * 100)} %`
                : snart
                  ? 'Prisen faller snart!'
                  : 'Oljeprisen: full';
        ut.push({ deler: [{ t, farge: g.pris < 1 || snart ? P.rød : P.blekk }], px: 15 });
    }
    if (kvoteÅpen(g)) {
        const full = kvoteFull(g);
        const t = full ? 'Kvoten er tatt!' : `Kvote: ${g.tattIÅr} av ${T.kvote.perÅr} hval`;
        ut.push({ deler: [{ t, farge: full ? P.rød : P.blekk }], px: 15 });
    }
    return ut;
}

const LINJE_Y0 = 32;
const LINJE_DY = 22;

/** Høyden på regnskapet: like høyt som tønna, og litt høyere når det er fire linjer. */
export const regnskapH = (g: Game, tap = false) =>
    Math.max(96, LINJE_Y0 + LINJE_DY * (linjer(g, tap).length - 1) + 16);

/** Regnskapet ved tønna: hvor full den er, og linjene med vanlige ord. */
function regnskap(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, o: TegneValg, tap: boolean) {
    const { x, y, w } = REGNSKAP;
    const kost = årsKost(g);
    const igjen = kost > 0 ? Math.floor(Math.max(0, g.tønne) / kost) : 99;
    const fare = tap || igjen < 3;
    const ls = linjer(g, tap);
    kort(ctx, x, y, w, regnskapH(g, tap), fare);
    const tp = tønnePos();
    // Tønna rommer seks års drift: full tønne = trygt lenge.
    const fyll = Math.max(0, Math.min(1, o.tønneVist / Math.max(12, kost * 6)));
    tønne(ctx, tp.x, tp.y, fyll, fare, fx.tønneHopp);
    const lx = tp.x + 30;
    const maks = x + w - 10 - lx;
    ctx.textAlign = 'left';
    ls.forEach((l, i) => {
        // Krymper skrifta til linja får plass.
        let px = l.px;
        const hel = l.deler.map((d) => d.t).join('');
        ctx.font = `bold ${px}px ${SERIF}`;
        while (px > 11 && ctx.measureText(hel).width > maks) {
            px -= 0.5;
            ctx.font = `bold ${px}px ${SERIF}`;
        }
        const ly = y + LINJE_Y0 + i * LINJE_DY;
        const puls = l.puls ? 1 + 0.06 * Math.sin(o.klokke * 8) : 1;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(puls, puls);
        let dx = 0;
        for (const d of l.deler) {
            ctx.fillStyle = d.farge;
            ctx.fillText(d.t, dx, 0);
            dx += ctx.measureText(d.t).width;
        }
        ctx.restore();
    });
}

/** Der linja om oljeprisen står (tap-bildet lyser den opp). */
export function prisLinje(g: Game): { x: number; y: number; w: number; h: number } | null {
    const ls = linjer(g, true);
    const i = ls.findIndex(
        (l) => l.deler[0].t.includes('prisen') || l.deler[0].t.includes('Prisen')
    );
    if (i < 0) return null;
    const tp = tønnePos();
    const ly = REGNSKAP.y + LINJE_Y0 + i * LINJE_DY;
    return { x: tp.x + 24, y: ly - 17, w: REGNSKAP.x + REGNSKAP.w - tp.x - 30, h: 23 };
}

/** År -> x på tidslinja. */
const X0 = 488;
const X1 = 930;
const tidX = (år: number) =>
    X0 + ((år - T.tid.start) / (T.tid.seier - 1 - T.tid.start)) * (X1 - X0);

/** Tegnforklaringen for regel 2: en liten hval med grønn eller rød kant. */
function hvalIkon(ctx: CanvasRenderingContext2D, x: number, y: number, farge: string) {
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = farge;
    ctx.beginPath();
    ctx.ellipse(x, y, 19, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    tegnHvalKant(ctx, 'finn', 0, x, y, 0, 30, farge, 2);
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
    // Regel 2: kanten rundt hvalen (fra 1904 helt til venstre, så artene får plass).
    const rx0 = g.år < T.fredning.finnmark ? 126 : 28;
    hvalIkon(ctx, rx0, 520, P.grønn);
    ctx.fillStyle = P.blekk;
    ctx.fillText('vokser', rx0 + 20, 526);
    hvalIkon(ctx, rx0 + 92, 520, P.rød);
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
    // Konkurs: under regnskapet, så stempelet aldri dekker teksten ved tønna.
    if (g.årsak === 'konkurs')
        return { x: 784, y: REGNSKAP.y + regnskapH(g, true) + 52, flokk: null };
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
        const pl = prisLinje(g);
        if (g.pris < 0.8 && pl) {
            // Prisfallet: linja om oljeprisen ved tønna lyser opp.
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 2 + 2 * puls;
            ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
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
