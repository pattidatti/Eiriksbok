// Kanvaset for Kjedereaksjonen: én rAF-løkke som steger simuleringen og tegner
// den. Ingen React-render per frame - HUD-en får et snapshot cirka 10 ganger i
// sekundet, resten lever i verdensobjektet.

import React, { useCallback, useEffect, useRef } from 'react';
import type { KjedeVerden, Verdenshendelse } from './kjedeWorld';
import {
    bakkeTekst,
    flyttMarkering,
    hoppOverFeilspor,
    hoppOverPust,
    kanVelge,
    sceneForSegment,
    fasitTekst,
    stegVerden,
    velg,
} from './kjedeWorld';
import {
    CAMERA_ANCHOR,
    CRACK_HOLD,
    FEILSPOR_TOP,
    FORSPRANG_MAKS,
    GAP_W,
    GROUND_TOP,
    JUV_BUNN,
    PLAYER_H,
    PLAYER_W,
    RAMME_BREDDE,
    SCENE_FADE,
    SETTLE_DUR,
    SLAB_H,
    SLAB_W,
    VIEW_H,
    broStart,
    broSlutt,
    clamp01,
    easeInOutCubic,
    easeOutCubic,
    fartsandel,
    rammeSenter,
    segmentX,
    wrapText,
} from '../../../utils/kjedeFysikk';
import {
    KULISSE_SCENE,
    hash01,
    hentScene,
    tegnScene,
    type Scene,
} from './kjedeScener';
import {
    GLIMT_VARIGHET,
    nyeEffekter,
    oppdaterEffekter,
    smuldreSprut,
    steinSlam,
    stoevSprut,
    tennGlimt,
    tegnFartsstriper,
    tegnPartikler,
    tegnSjokkbolge,
    type Effekter,
} from './kjedeEffekter';

export interface HudSnapshot {
    ledd: number;
    totaltLedd: number;
    streak: number;
    /** Hvor mange piksler forsprang eleven har på Glemselen, 0-1 normalisert. */
    forsprang: number;
    tenkeandel: number;
    fase: string;
    /** Teksten i steinen under føttene - premisset eleven resonnerer fra. */
    arsak: string;
    /** Fasiten for leddet eleven står i. Vises når tiden gikk ut. */
    fasit: string;
    /** Gikk tenketiden ut uten at eleven valgte noe? */
    tidUt: boolean;
    /**
     * Påstandene som svever akkurat nå, på formen «2: Kongen stenger ...».
     * Finnes bare for skjermlesere: all fagtekst i spillet er tegnet i kanvas
     * og dermed usynlig for hjelpemidler, markering og oversettelse.
     */
    valg: string[];
}

interface Props {
    verden: KjedeVerden;
    paused: boolean;
    reducedMotion: boolean;
    onHendelse: (h: Verdenshendelse) => void;
    onSnapshot: (s: HudSnapshot) => void;
}

/**
 * Smaleste verden vi tillater.
 *
 * Rammen i valgøyeblikket er enden av broa, gapet og de tre påstandene - ikke
 * hele plattformen. Det var det som gjorde det mulig å gjøre løpestrekket over
 * tre ganger så langt uten at skriften på steinene krympet.
 */
const MIN_BREDDE = RAMME_BREDDE;
const SLAB_TEXT_PAD = 30;
const SLAB_TEXT_W = SLAB_W - SLAB_TEXT_PAD * 2 - 26;
const SLAB_FONT = '600 21px Outfit, Inter, system-ui, sans-serif';

/** Glimtet skyter fort ut og bremser inn mot den nye steinen. */
const easeUt = easeOutCubic;

// ---------------------------------------------------------------------------
// Tegnehjelpere
// ---------------------------------------------------------------------------

const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const wrapCache = new Map<string, string[]>();
const wrapCached = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
    const key = `${maxW}|${text}`;
    const hit = wrapCache.get(key);
    if (hit) return hit;
    ctx.font = SLAB_FONT;
    const lines = wrapText(text, maxW, (s) => ctx.measureText(s).width);
    wrapCache.set(key, lines);
    return lines;
};

/**
 * Kjettingen mellom to plattformer - den synlige årsakssammenhengen. `glimtX` er
 * hvor kjedeglimtet er akkurat nå; lenken lyser opp der pulsen passerer.
 */
const tegnLenke = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    glimtX: number | null
) => {
    const mid = (x0 + x1) / 2;
    ctx.save();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(150, 124, 78, 0.6)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mid, Math.max(y0, y1) + 44, x1, y1);
    ctx.stroke();
    // Enkeltledd i kjettingen, så den leser som lenker og ikke som et tau
    ctx.strokeStyle = 'rgba(96, 78, 48, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([9, 11]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (glimtX !== null) {
        const naerhet = clamp01(1 - Math.abs(mid - glimtX) / 420);
        if (naerhet > 0.01) {
            ctx.strokeStyle = `rgba(250, 204, 92, ${naerhet})`;
            ctx.lineWidth = 5 + naerhet * 6;
            ctx.shadowColor = 'rgba(250, 190, 60, 0.9)';
            ctx.shadowBlur = 22 * naerhet;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(mid, Math.max(y0, y1) + 44, x1, y1);
            ctx.stroke();
        }
    }
    ctx.restore();
};

/**
 * Kjedeglimtet: en lyskule som løper langs kjeden fra årsak til virkning når
 * eleven har valgt riktig. Dette ER spillets navn, metafor og belønning i én
 * effekt - uten den ser eleven aldri at hun bygger en kjede mens hun spiller.
 */
const tegnGlimtkule = (ctx: CanvasRenderingContext2D, x: number, y: number, styrke: number) => {
    ctx.save();
    const r = 96 * styrke;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255, 255, 255, ${styrke})`);
    g.addColorStop(0.18, `rgba(255, 244, 198, ${0.95 * styrke})`);
    g.addColorStop(0.45, `rgba(250, 190, 60, ${0.55 * styrke})`);
    g.addColorStop(1, 'rgba(250, 190, 60, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Liten hvit kjerne som holder seg synlig også mot den gylne steinen
    ctx.fillStyle = `rgba(255, 255, 255, ${styrke})`;
    ctx.beginPath();
    ctx.arc(x, y, 7 * styrke, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

/** Hvor langt ned fjellet under en bakkestein rekker før det mister seg i disen. */
const PILAR_H = 190;

/**
 * Fjellet bakkesteinen står på.
 *
 * Uten dette leser hele banen som et flatt jorde med tekstbokser oppå, og
 * «årsaken er steinen under deg, virkningen er hullet foran deg» blir en
 * påstand eleven aldri ser. Søylen smalner nedover og tones ut i disen, så
 * juvet får dybde uten å få en bunn.
 *
 * `alpha` brukes når en valgstein senker seg på plass: fjellet vokser fram
 * under den i takt med at den lander.
 */
const tegnPilar = (ctx: CanvasRenderingContext2D, x: number, steinY: number, alpha = 1) => {
    if (alpha <= 0.01) return;
    const topp = steinY + SLAB_H;
    const halvTopp = SLAB_W / 2 - 16;
    const halvBunn = SLAB_W * 0.17;
    const midt = x + SLAB_W / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(midt - halvTopp, topp);
    ctx.lineTo(midt + halvTopp, topp);
    ctx.lineTo(midt + halvBunn, topp + PILAR_H);
    ctx.lineTo(midt - halvBunn, topp + PILAR_H);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, topp, 0, topp + PILAR_H);
    g.addColorStop(0, 'rgba(150, 138, 116, 0.85)');
    g.addColorStop(0.35, 'rgba(158, 156, 152, 0.52)');
    g.addColorStop(0.72, 'rgba(180, 190, 200, 0.22)');
    g.addColorStop(1, 'rgba(205, 216, 226, 0)');
    ctx.fillStyle = g;
    ctx.fill();

    // Skyggesiden gir søylen volum, ellers leser den som en flat trekant
    const s = ctx.createLinearGradient(midt, 0, midt + halvTopp, 0);
    s.addColorStop(0, 'rgba(92, 82, 66, 0)');
    s.addColorStop(1, 'rgba(92, 82, 66, 0.26)');
    ctx.fillStyle = s;
    ctx.fill();

    // Mørk stripe rett under steinen: nå sitter den PÅ fjellet i stedet for å
    // sveve foran det
    ctx.fillStyle = 'rgba(84, 72, 54, 0.32)';
    ctx.fillRect(midt - halvTopp, topp, halvTopp * 2, 7);

    ctx.restore();
};

// --- Broa ------------------------------------------------------------------

const BRO_DEKK_H = 34;
const BUE_BREDDE = 190;
const BUE_H = 76;

/**
 * Steinbroa mellom steinen og hoppkanten.
 *
 * Dette er det nye løpestrekket, og det trengte noe å være. En flat stripe over
 * juvet leser som ingenting; en akveduktbro med buer gir bildet rytme, viser
 * hvor fort eleven faktisk beveger seg, og passer det spillet handler om - noen
 * har bygget dette, stein for stein, av det som kom før.
 */
const tegnBro = (ctx: CanvasRenderingContext2D, x0: number, x1: number) => {
    const bredde = x1 - x0;
    if (bredde <= 0) return;
    const dekkBunn = GROUND_TOP + BRO_DEKK_H;
    const antall = Math.max(1, Math.round(bredde / BUE_BREDDE));
    const bay = bredde / antall;
    const fjaering = dekkBunn + BUE_H * 0.5;

    ctx.save();

    // Underbygget med buene stanset ut. evenodd bryr seg om kryssinger, ikke om
    // hvilken vei subpath-ene går, så hullene blir hull uansett tegnerekkefølge.
    ctx.beginPath();
    ctx.rect(x0, dekkBunn, bredde, BUE_H + 30);
    for (let i = 0; i < antall; i++) {
        const cx = x0 + bay * (i + 0.5);
        const r = bay * 0.33;
        ctx.moveTo(cx - r, dekkBunn + BUE_H + 30);
        ctx.lineTo(cx - r, fjaering);
        ctx.arc(cx, fjaering, r, Math.PI, 0, false);
        ctx.lineTo(cx + r, dekkBunn + BUE_H + 30);
        ctx.closePath();
    }
    const g = ctx.createLinearGradient(0, dekkBunn, 0, dekkBunn + BUE_H + 30);
    g.addColorStop(0, 'rgba(148, 136, 114, 0.92)');
    g.addColorStop(0.5, 'rgba(158, 154, 148, 0.6)');
    g.addColorStop(1, 'rgba(196, 206, 216, 0.05)');
    ctx.fillStyle = g;
    ctx.fill('evenodd');

    // Dekket eleven løper på
    ctx.fillStyle = '#d9cdb4';
    ctx.fillRect(x0, GROUND_TOP, bredde, BRO_DEKK_H);
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(x0, GROUND_TOP, bredde, 6);
    ctx.fillStyle = 'rgba(112, 98, 74, 0.35)';
    ctx.fillRect(x0, dekkBunn - 5, bredde, 5);

    // Brostein. Det er disse som streamer forbi og gjør farten til noe man ser.
    ctx.fillStyle = 'rgba(150, 132, 100, 0.4)';
    const forste = Math.ceil(x0 / 34);
    for (let i = forste; i * 34 < x1; i++) {
        ctx.fillRect(i * 34, GROUND_TOP + 6, 2, BRO_DEKK_H - 11);
    }

    // Rekkverksstolper: små, men de gir broa en overkant
    ctx.fillStyle = 'rgba(180, 166, 138, 0.75)';
    const stolpeForste = Math.ceil(x0 / 100);
    for (let i = stolpeForste; i * 100 < x1; i++) {
        ctx.fillRect(i * 100, GROUND_TOP - 13, 7, 13);
    }

    ctx.restore();
};

const tegnStein = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tekst: string,
    opts: {
        nummer?: number;
        markert?: boolean;
        gyllen?: boolean;
        alpha?: number;
        skjev?: number;
        /** 0-1: hvor sterkt kjedeglimtet lyser opp akkurat denne steinen. */
        glimt?: number;
    } = {}
) => {
    const { nummer, markert, gyllen, alpha = 1, skjev = 0, glimt = 0 } = opts;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (skjev) {
        ctx.translate(x + SLAB_W / 2, y + SLAB_H / 2);
        ctx.rotate(skjev);
        ctx.translate(-(x + SLAB_W / 2), -(y + SLAB_H / 2));
    }

    // Skygge under
    ctx.fillStyle = 'rgba(60, 50, 35, 0.14)';
    roundRect(ctx, x + 4, y + 8, SLAB_W, SLAB_H, 14);
    ctx.fill();

    const g = ctx.createLinearGradient(0, y, 0, y + SLAB_H);
    if (gyllen) {
        g.addColorStop(0, '#fdf1cf');
        g.addColorStop(1, '#f0d79a');
    } else {
        g.addColorStop(0, '#f6efe1');
        g.addColorStop(1, '#e5d9c3');
    }
    ctx.fillStyle = g;
    roundRect(ctx, x, y, SLAB_W, SLAB_H, 14);
    ctx.fill();

    // Hoggmerker: korte streker langs kanten, deterministisk plassert. Gjør
    // flaten til hugget stein i stedet for en avrundet firkant.
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(150, 132, 100, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
        const hx = x + 14 + hash01(i * 3.1) * (SLAB_W - 28);
        const hy = y + 6 + hash01(i * 7.7) * (SLAB_H - 12);
        const l = 6 + hash01(i * 2.3) * 12;
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + l, hy + 2);
    }
    ctx.stroke();
    ctx.restore();

    roundRect(ctx, x, y, SLAB_W, SLAB_H, 14);
    ctx.strokeStyle = markert ? '#c98a17' : gyllen ? '#d9b464' : '#cbbb9e';
    ctx.lineWidth = markert ? 5 : 2;
    ctx.stroke();

    // Glimtet vasker over steinen og setter en lysende ramme rundt den
    if (glimt > 0.01) {
        roundRect(ctx, x, y, SLAB_W, SLAB_H, 14);
        ctx.fillStyle = `rgba(255, 236, 176, ${0.62 * glimt})`;
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = `rgba(255, 214, 110, ${glimt})`;
        ctx.lineWidth = 3 + glimt * 4;
        ctx.shadowColor = 'rgba(250, 190, 60, 0.85)';
        ctx.shadowBlur = 26 * glimt;
        ctx.stroke();
        ctx.restore();
    }

    if (nummer !== undefined) {
        ctx.fillStyle = markert ? '#c98a17' : '#9c8a68';
        ctx.beginPath();
        ctx.arc(x + 30, y + SLAB_H / 2, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffdf6';
        ctx.font = '700 20px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(nummer), x + 30, y + SLAB_H / 2 + 1);
    }

    const textLeft = x + SLAB_TEXT_PAD + (nummer !== undefined ? 26 : 0);
    const lines = wrapCached(ctx, tekst, SLAB_TEXT_W);
    ctx.font = SLAB_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const lh = 26;
    const startY = y + SLAB_H / 2 - ((lines.length - 1) * lh) / 2;
    // Teksten er hugget INN i steinen: en lys linje under gir den dybde
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    lines.forEach((line, i) => ctx.fillText(line, textLeft, startY + i * lh + 1.5));
    ctx.fillStyle = '#3d3323';
    lines.forEach((line, i) => ctx.fillText(line, textLeft, startY + i * lh));
    ctx.restore();
};

/**
 * Løperen. Armer, bein, kappe og en skygge under føttene.
 *
 * Hun er liten i bildet, så alt må leses på silhuetten alene: hvor fort hun går,
 * om hun står stille og tenker, og om hun akkurat traff bakken.
 */
const tegnFigur = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    lopefase: number,
    lener: boolean,
    klem: number,
    fart: number,
    iLufta: boolean
) => {
    const bunn = y;

    // Skygge på steinen under. Faller bort når hun er i lufta.
    if (!iLufta) {
        ctx.save();
        ctx.fillStyle = 'rgba(70, 58, 40, 0.22)';
        ctx.beginPath();
        ctx.ellipse(x, bunn + 3, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Fartsspor bak figuren - jo lengre streak, jo lengre hale
    if (fart > 0.08) {
        ctx.save();
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = fart * 0.16 * (1 - i / 4);
            ctx.fillStyle = '#4f46e5';
            roundRect(
                ctx,
                x - PLAYER_W / 2 - i * 16 * fart,
                bunn - PLAYER_H,
                PLAYER_W,
                PLAYER_H - 16,
                12
            );
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x, bunn);
    if (lener) ctx.rotate(-0.12);
    // Klem og strekk ved nedslag. Volumet bevares, så figuren blir bred når den
    // er lav - ellers leser det som at hun krymper, ikke som at hun lander.
    if (klem > 0.01) ctx.scale(1 + klem * 0.28, 1 - klem * 0.3);
    // Kroppen hopper litt i takt med skrittene
    const bob = iLufta ? 0 : Math.abs(Math.sin(lopefase)) * 2.5 * (0.3 + fart);
    ctx.translate(0, -bob);

    const swing = Math.sin(lopefase) * 13;

    // Bakerste arm - tegnes før kroppen så den havner bak
    ctx.strokeStyle = '#3a3550';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_H + 12);
    ctx.lineTo(-swing * 0.8, -PLAYER_H + 30);
    ctx.stroke();

    // Bein
    ctx.strokeStyle = '#3f3a52';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(swing, 0);
    ctx.moveTo(0, -18);
    ctx.lineTo(-swing, 0);
    ctx.stroke();

    // Kropp
    ctx.fillStyle = '#4f46e5';
    roundRect(ctx, -PLAYER_W / 2, -PLAYER_H, PLAYER_W, PLAYER_H - 16, 12);
    ctx.fill();

    // Kappe
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(-PLAYER_W / 2 + 2, -PLAYER_H + 10);
    ctx.lineTo(-PLAYER_W / 2 - 16 - Math.sin(lopefase) * 5 - fart * 14, -18);
    ctx.lineTo(-PLAYER_W / 2 + 8, -20);
    ctx.closePath();
    ctx.fill();

    // Fremste arm
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_H + 12);
    ctx.lineTo(swing * 0.9, -PLAYER_H + 28);
    ctx.stroke();

    // Hode
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(0, -PLAYER_H - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    // Hår, som blåser bakover når hun løper fort
    ctx.fillStyle = '#3f3a52';
    ctx.beginPath();
    ctx.moveTo(-2, -PLAYER_H - 21);
    ctx.quadraticCurveTo(
        -18 - fart * 10,
        -PLAYER_H - 20,
        -14 - fart * 12,
        -PLAYER_H - 4
    );
    ctx.quadraticCurveTo(-8, -PLAYER_H - 14, -2, -PLAYER_H - 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

const tegnTaake = (
    ctx: CanvasRenderingContext2D,
    fogScreenX: number,
    t: number,
    viewW: number,
    viewH: number,
    dy: number
) => {
    if (fogScreenX <= -280) return;
    const kant = Math.min(fogScreenX, viewW + 40);
    const topp = -dy;

    // Fargen forsvinner bak tåka - selve metaforen. Metningen tones ut over en
    // sone i stedet for å kuttes rett av, ellers leser kanten som en skjøt i
    // bildet i stedet for som tåke.
    if (kant > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'saturation';
        const m = ctx.createLinearGradient(kant - 220, 0, kant, 0);
        m.addColorStop(0, 'hsla(0, 0%, 50%, 1)');
        m.addColorStop(1, 'hsla(0, 0%, 50%, 0)');
        ctx.fillStyle = 'hsl(0, 0%, 50%)';
        ctx.fillRect(0, topp, Math.max(0, kant - 220), viewH);
        ctx.fillStyle = m;
        ctx.fillRect(Math.max(0, kant - 220), topp, Math.min(220, kant), viewH);
        ctx.restore();
    }

    const g = ctx.createLinearGradient(kant - 300, 0, kant + 40, 0);
    g.addColorStop(0, 'rgba(224, 227, 232, 0.88)');
    g.addColorStop(0.65, 'rgba(224, 227, 232, 0.42)');
    g.addColorStop(1, 'rgba(224, 227, 232, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(0, kant - 300), topp, Math.max(0, kant + 40), viewH);

    ctx.fillStyle = 'rgba(238, 240, 243, 0.3)';
    for (let i = 0; i < 5; i++) {
        const r = 70 + hash01(i) * 60;
        const y = topp + 80 + hash01(i + 9) * (viewH - 160) + Math.sin(t * 0.6 + i) * 18;
        ctx.beginPath();
        ctx.arc(kant - 40 - hash01(i + 3) * 130, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
};

/** Mørke i hjørnene. Holder blikket der teksten er. */
const tegnVignett = (
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    dy: number
) => {
    const topp = -dy;
    const g = ctx.createRadialGradient(
        viewW / 2,
        topp + viewH / 2,
        viewW * 0.32,
        viewW / 2,
        topp + viewH / 2,
        viewW * 0.78
    );
    g.addColorStop(0, 'rgba(40, 46, 58, 0)');
    g.addColorStop(1, 'rgba(40, 46, 58, 0.17)');
    ctx.fillStyle = g;
    ctx.fillRect(0, topp, viewW, viewH);
};

// ---------------------------------------------------------------------------
// Komponenten
// ---------------------------------------------------------------------------

export const KjedeCanvas: React.FC<Props> = ({
    verden,
    paused,
    reducedMotion,
    onHendelse,
    onSnapshot,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const verdenRef = useRef(verden);
    const pausedRef = useRef(paused);
    const transformRef = useRef({ skala: 1, dx: 0, dy: 0, camX: 0, camY: 0, wLog: 0, hLog: 0 });
    const lopefaseRef = useRef(0);
    const camXRef = useRef<number | null>(null);
    const effRef = useRef<Effekter>(nyeEffekter());
    const forrigeFaseRef = useRef<string>('lop');
    const slamGjortRef = useRef(false);
    // Bakgrunnen tones fra én scene til den neste i pusterommet, så skiftet
    // leser som en følge av valget eleven nettopp tok.
    const sceneRef = useRef<{ fra: Scene; til: Scene; t: number } | null>(null);
    // Egen tilfeldighetskilde til partikler. Math.random er greit her - dette er
    // ren pynt, og ingenting i simuleringen henger av den.
    const rngRef = useRef<() => number>(() => Math.random());
    // Callbackene holdes i refs slik at en ny funksjonsidentitet fra forelderen
    // ikke river ned og bygger opp igjen rAF-løkken
    const hendelseRef = useRef(onHendelse);
    const snapshotRef = useRef(onSnapshot);

    // Ny runde = nytt verdensobjekt. Kameraet må snappe, ikke gli tilbake fra
    // der forrige runde endte.
    useEffect(() => {
        camXRef.current = null;
        effRef.current = nyeEffekter();
        forrigeFaseRef.current = 'lop';
        slamGjortRef.current = false;
        const start = hentScene(
            sceneForSegment(verden.kjede, 0),
            KULISSE_SCENE[verden.kjede.kulisse] ?? 'bygdeliv'
        );
        sceneRef.current = { fra: start, til: start, t: 1 };
    }, [verden]);

    // Speiler propsene inn i refs slik at rAF-løkken alltid ser de ferskeste
    // verdiene uten å måtte bygges opp på nytt for hver render
    useEffect(() => {
        verdenRef.current = verden;
        pausedRef.current = paused;
        hendelseRef.current = onHendelse;
        snapshotRef.current = onSnapshot;
    });

    // ------------------------------------------------------------------ input
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const w = verdenRef.current;
            if (e.key === '1' || e.key === '2' || e.key === '3') {
                if (kanVelge(w)) {
                    e.preventDefault();
                    velg(w, Number(e.key) - 1);
                }
                return;
            }
            if (e.key === 'ArrowUp' || e.key === 'w') {
                if (kanVelge(w)) {
                    e.preventDefault();
                    flyttMarkering(w, -1);
                }
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 's') {
                if (kanVelge(w)) {
                    e.preventDefault();
                    flyttMarkering(w, 1);
                }
                return;
            }
            if (e.key === ' ' || e.key === 'Enter') {
                // Mellomrom velger bare når eleven selv har pekt ut en påstand.
                // Ingenting er markert på forhånd, så det finnes ingenting å
                // bekrefte før hun har brukt piltastene.
                if (kanVelge(w) && w.markert !== null) {
                    e.preventDefault();
                    velg(w, w.markert);
                } else if (w.fase === 'feilspor') {
                    e.preventDefault();
                    hoppOverFeilspor(w);
                } else if (w.fase === 'pust') {
                    e.preventDefault();
                    hoppOverPust(w);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const onPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const w = verdenRef.current;
        if (w.fase === 'feilspor') {
            hoppOverFeilspor(w);
            return;
        }
        if (w.fase === 'pust') {
            hoppOverPust(w);
            return;
        }
        if (!kanVelge(w) || !w.valg) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const { skala, dy, camX, camY } = transformRef.current;
        const worldX = (e.clientX - rect.left) / skala + camX;
        const worldY = (e.clientY - rect.top) / skala - dy + camY;
        for (const stein of w.valg) {
            if (stein.tilstand !== 'svever') continue;
            const sx = segmentX(w.segment + 1);
            if (
                worldX >= sx &&
                worldX <= sx + SLAB_W &&
                worldY >= stein.y &&
                worldY <= stein.y + SLAB_H
            ) {
                velg(w, stein.row);
                return;
            }
        }
    }, []);

    // ------------------------------------------------------------------- løkke
    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let forrige = performance.now();
        let sisteSnapshot = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        const tilpassStorrelse = () => {
            const rect = wrap.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            // Høyden bestemmer skalaen, så bredden fylles helt ut. Breie skjermer
            // ser mer av verden i stedet for å få grå kanter. På smale skjermer
            // sikrer MIN_BREDDE at hele valgkolonnen fortsatt får plass.
            const skala = Math.min(rect.height / VIEW_H, rect.width / MIN_BREDDE);
            transformRef.current.skala = skala;
            transformRef.current.wLog = rect.width / skala;
            transformRef.current.hLog = rect.height / skala;
            transformRef.current.dx = 0;
            transformRef.current.dy = Math.max(0, (transformRef.current.hLog - VIEW_H) / 2);
        };
        tilpassStorrelse();
        const ro = new ResizeObserver(tilpassStorrelse);
        ro.observe(wrap);

        const frame = (naa: number) => {
            raf = requestAnimationFrame(frame);
            const dt = Math.min((naa - forrige) / 1000, 0.05);
            forrige = naa;
            const w = verdenRef.current;

            if (!pausedRef.current) {
                stegVerden(w, dt);
                if (w.hendelser.length) {
                    const koe = w.hendelser.splice(0, w.hendelser.length);
                    for (const h of koe) hendelseRef.current(h);
                }
            }

            // --- Effekter knyttet til faseskifter -------------------------------
            const eff = effRef.current;
            const rng = rngRef.current;
            const fart = fartsandel(w.streak);

            if (w.fase !== forrigeFaseRef.current) {
                if (w.fase === 'landing') {
                    // Første kontakt med steinen: en liten dusj under føttene
                    stoevSprut(eff, w.playerX, w.playerY, rng, 8);
                    eff.rystelse = Math.max(eff.rystelse, 4);
                } else if (w.fase === 'fall') {
                    // Steinen svikter under henne
                    smuldreSprut(eff, segmentX(w.segment + 1), w.playerY, rng);
                }
                slamGjortRef.current = false;
                forrigeFaseRef.current = w.fase;
            }

            // Det store slaget: steinen dunker ned på plass og kjeden fyrer
            if (w.fase === 'landing' && !slamGjortRef.current && w.faseT >= SETTLE_DUR * 0.55) {
                slamGjortRef.current = true;
                // Glimtet går uansett - det er informasjon, ikke pynt. Støvet og
                // rystelsen er pynt, og faller bort ved redusert bevegelse.
                tennGlimt(eff, segmentX(w.segment + 1));
                if (!reducedMotion) steinSlam(eff, segmentX(w.segment + 1), rng);
            }

            if (!pausedRef.current) {
                oppdaterEffekter(
                    eff,
                    dt,
                    reducedMotion || w.fase !== 'lop' ? 0 : fart,
                    transformRef.current.wLog,
                    camXRef.current ?? 0,
                    rng
                );
            }

            // --- Scenebytte -----------------------------------------------------
            const standard = KULISSE_SCENE[w.kjede.kulisse] ?? 'bygdeliv';
            const onsket = hentScene(sceneForSegment(w.kjede, w.segment), standard);
            let sc = sceneRef.current;
            if (!sc) {
                sc = { fra: onsket, til: onsket, t: 1 };
                sceneRef.current = sc;
            }
            if (onsket.id !== sc.til.id) {
                sc.fra = sc.til;
                sc.til = onsket;
                sc.t = 0;
            }
            if (sc.t < 1 && !pausedRef.current) {
                sc.t = clamp01(sc.t + dt / SCENE_FADE);
                // Ferdig tonet: slipp den gamle scenen, ellers hadde begge blitt
                // tegnet hver frame resten av runden
                if (sc.t >= 1) sc.fra = sc.til;
            }

            // Kamera. Under løping henger det etter figuren; fra det øyeblikket
            // valgene dukker opp glir det tilbake og rammer inn selve
            // resonnementet: kanten hun står på, gapet og de tre påstandene.
            const viewW = transformRef.current.wLog;
            const rammerFase =
                w.fase !== 'lop' && w.fase !== 'mal' && w.fase !== 'tatt';
            // I pusterommet er hun allerede flyttet ett segment fram, men det er
            // leddet BAK henne som nettopp ble bygget, og det er det kameraet skal
            // vise
            const rammeSeg = w.fase === 'pust' ? w.segment - 1 : w.segment;
            // Jo raskere hun løper, jo lenger frem ser kameraet - klassisk
            // racing-triks som gjør fart til noe man kjenner, ikke bare et tall
            const anker = CAMERA_ANCHOR - fart * 0.06;
            const maalCamX =
                rammerFase && rammeSeg >= 0
                    ? rammeSenter(rammeSeg) - viewW / 2
                    : w.playerX - viewW * anker;
            // Eksponentiell utjevning, uavhengig av bildefrekvens
            const glid = 1 - Math.exp(-dt * 6);
            camXRef.current =
                camXRef.current === null
                    ? maalCamX
                    : camXRef.current + (maalCamX - camXRef.current) * glid;
            const camX = camXRef.current;
            const camY = w.camY;
            transformRef.current.camX = camX;
            transformRef.current.camY = camY;

            // Rystelsen legges bare på tegningen, aldri på treff-testingen
            const ryst = eff.rystelse;
            const rystX = ryst ? (rng() - 0.5) * ryst * 2 : 0;
            const rystY = ryst ? (rng() - 0.5) * ryst * 2 : 0;

            // Kjedeglimtet løper fra broa bak henne og inn i den nye steinen
            const glimtP = eff.glimt === null ? null : clamp01(eff.glimt / GLIMT_VARIGHET);
            const glimtX =
                glimtP === null
                    ? null
                    : eff.glimtFra + (eff.glimtTil - eff.glimtFra) * easeUt(glimtP);

            if (!reducedMotion && (w.fase === 'lop' || w.fase === 'tenk')) {
                lopefaseRef.current += dt * (w.fase === 'tenk' ? 3 : 13);
            }

            const { skala, dy, wLog, hLog } = transformRef.current;
            ctx.setTransform(skala * dpr, 0, 0, skala * dpr, 0, 0);
            ctx.save();
            // Bakgrunnen følger etter kameraet når det panorerer ned i feilsporet,
            // men bare litt - den ligger langt unna
            ctx.translate(0, dy - camY * 0.28);

            // Ved redusert bevegelse står parallaksen stille i stedet for å gli
            const bakgrunnX = reducedMotion ? 0 : camX;
            const tid = naa / 1000;
            tegnScene(ctx, sc.fra, bakgrunnX, wLog, hLog, dy, JUV_BUNN, tid, reducedMotion);
            if (sc.fra.id !== sc.til.id) {
                ctx.save();
                ctx.globalAlpha = easeInOutCubic(sc.t);
                tegnScene(ctx, sc.til, bakgrunnX, wLog, hLog, dy, JUV_BUNN, tid, reducedMotion);
                ctx.restore();
            }
            ctx.restore();

            ctx.save();
            ctx.translate(0, dy);
            ctx.save();
            ctx.translate(-camX + rystX, -camY + rystY);

            if (!reducedMotion) tegnFartsstriper(ctx, eff);

            // Hvor sterkt glimtet lyser opp en stein med gitt senter
            const glimtPaa = (senterX: number) =>
                glimtX === null ? 0 : clamp01(1 - Math.abs(senterX - glimtX) / 230);

            // Plattformene eleven allerede har bygget: stein, fjell under, bro
            // videre, og kjettingen over gapet til den forrige.
            const forste = Math.max(0, w.segment - 2);
            for (let i = forste; i <= w.segment; i++) {
                const x = segmentX(i);
                tegnPilar(ctx, x, GROUND_TOP);
                tegnBro(ctx, broStart(i), broSlutt(i));
                if (i > forste) {
                    tegnLenke(
                        ctx,
                        x - GAP_W,
                        GROUND_TOP + 22,
                        x,
                        GROUND_TOP + SLAB_H / 2,
                        glimtX
                    );
                }
                tegnStein(ctx, x, GROUND_TOP, bakkeTekst(w.kjede, i), {
                    gyllen: i > 0,
                    glimt: glimtPaa(x + SLAB_W / 2),
                });
            }

            // Valgsteinene. Smuldrende steiner tegnes FØRST, så de aldri legger
            // seg oppå det riktige svaret på vei ned.
            if (w.valg) {
                const sx = segmentX(w.segment + 1);
                // Fjellet vokser fram under den steinen som lander, før alle
                // valgsteinene, slik at det aldri maler over en som faller
                const lander = w.valg.find((s) => s.tilstand === 'senkes');
                if (lander) {
                    tegnPilar(ctx, sx, lander.y, lander.anim);
                    // Kjettingen strekkes ut mens steinen synker på plass.
                    // Uten den var kjeden borte i de sekundene landingen varer -
                    // altså nøyaktig i belønningsøyeblikket, der glimtet løp
                    // over et tomt gap.
                    tegnLenke(
                        ctx,
                        sx - GAP_W,
                        GROUND_TOP + 22,
                        sx,
                        lander.y + SLAB_H / 2,
                        glimtX
                    );
                }
                const rekkefolge = [
                    ...w.valg.filter((s) => s.tilstand === 'smuldrer'),
                    ...w.valg.filter((s) => s.tilstand !== 'smuldrer'),
                ];
                for (const stein of rekkefolge) {
                    if (stein.tilstand === 'borte') continue;
                    const smuldrer = stein.tilstand === 'smuldrer';
                    // Smuldrende steiner holder full farge til de har begynt å
                    // falle, ellers rekker eleven aldri å se hva som forsvant
                    const fallDel = clamp01((stein.anim - CRACK_HOLD) / (1 - CRACK_HOLD));
                    tegnStein(ctx, sx, stein.y, stein.tekst, {
                        nummer: stein.tilstand === 'senkes' ? undefined : stein.row + 1,
                        markert: w.fase === 'tenk' && w.markert === stein.row,
                        gyllen: stein.tilstand === 'senkes',
                        alpha: smuldrer ? 1 - fallDel * fallDel : 1,
                        skjev: smuldrer ? fallDel * 0.55 : 0,
                        glimt: stein.tilstand === 'senkes' ? glimtPaa(sx + SLAB_W / 2) : 0,
                    });
                }
            }

            // Feilsporet
            if (w.fase === 'fall' || w.fase === 'feilspor' || w.fase === 'klatre') {
                // Må dekke begge landingspunktene: der hun faller fra en stein
                // som smuldret, og der hun går utfor kanten fordi tiden gikk ut
                const fra = Math.min(w.fallFraX - 190, segmentX(w.segment + 1) - 150);
                const til = segmentX(w.segment + 1) + SLAB_W + 50;
                ctx.fillStyle = '#cbd5e1';
                roundRect(ctx, fra, FEILSPOR_TOP, til - fra, 70, 12);
                ctx.fill();
            }

            // Trykkbølgen fra nedslaget, langs steinflaten og under figuren
            if (!reducedMotion) tegnSjokkbolge(ctx, eff, GROUND_TOP + 4);

            // Figuren
            const iLufta = w.fase === 'sprang' || w.fase === 'fall' || w.fase === 'klatre';
            tegnFigur(
                ctx,
                w.playerX,
                w.playerY,
                lopefaseRef.current,
                w.fase === 'tenk',
                eff.klem,
                reducedMotion ? 0 : fart,
                iLufta
            );

            tegnPartikler(ctx, eff);

            // Glimtkula løper langs kjeden helt øverst i verdenslaget
            if (glimtX !== null && glimtP !== null) {
                // Rask opptenning, lang platåtid, myk utfading. Den gamle
                // sin(p*PI) var nær null i begge ender, så pulsen var svak
                // akkurat idet den forlot årsaken og idet den traff virkningen.
                const styrke = clamp01(Math.sin(glimtP * Math.PI) * 1.75);
                const y = GROUND_TOP + SLAB_H / 2;
                // Hale: noen svakere ekko bakover langs banen gjør farten synlig
                for (let i = 4; i >= 1; i--) {
                    const bakP = clamp01(glimtP - i * 0.045);
                    const bakX = eff.glimtFra + (eff.glimtTil - eff.glimtFra) * easeUt(bakP);
                    tegnGlimtkule(ctx, bakX, y, styrke * (0.13 * (5 - i)) * 0.5);
                }
                tegnGlimtkule(ctx, glimtX, y, styrke);
            }

            ctx.restore();

            tegnTaake(ctx, w.fogX - camX, tid, wLog, hLog, dy);
            tegnVignett(ctx, wLog, hLog, dy);
            ctx.restore();

            // HUD-snapshot cirka 10 ganger i sekundet
            if (naa - sisteSnapshot > 100) {
                sisteSnapshot = naa;
                snapshotRef.current({
                    ledd: Math.min(w.segment + 1, w.kjede.ledd.length),
                    totaltLedd: w.kjede.ledd.length,
                    streak: w.streak,
                    forsprang: clamp01((w.playerX - w.fogX) / FORSPRANG_MAKS),
                    tenkeandel: w.fase === 'tenk' ? clamp01(1 - w.faseT / w.tenketid) : 0,
                    fase: w.fase,
                    arsak: bakkeTekst(w.kjede, w.segment),
                    fasit: fasitTekst(w) ?? '',
                    tidUt: w.tidUt,
                    valg:
                        w.fase === 'tenk' && w.valg
                            ? w.valg
                                  .filter((v) => v.tilstand === 'svever')
                                  // Punktum strippes: teksten settes sammen med
                                  // skilletegn under, og «England.. 2:» leses rart
                                  .map((v) => `${v.row + 1}: ${v.tekst.replace(/\.$/, '')}`)
                            : [],
                });
            }
        };

        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [reducedMotion]);

    return (
        <div
            ref={wrapRef}
            className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
            style={{ height: 'clamp(360px, calc(100vh - 250px), 700px)' }}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={onPointer}
                className="block h-full w-full touch-none"
            />
        </div>
    );
};
