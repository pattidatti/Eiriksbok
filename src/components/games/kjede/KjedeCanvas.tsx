// Kanvaset for Kjedereaksjonen: én rAF-løkke som steger simuleringen og tegner
// den. Ingen React-render per frame - HUD-en får et snapshot cirka 10 ganger i
// sekundet, resten lever i verdensobjektet.

import React, { useCallback, useEffect, useRef } from 'react';
import type { KjedeVerden, Verdenshendelse } from './kjedeWorld';
import { bakkeTekst, flyttMarkering, hoppOverFeilspor, kanVelge, stegVerden, velg } from './kjedeWorld';
import {
    CAMERA_ANCHOR,
    CRACK_HOLD,
    FEILSPOR_TOP,
    GAP_W,
    GROUND_TOP,
    PITCH,
    PLAYER_H,
    PLAYER_W,
    SETTLE_DUR,
    SLAB_H,
    SLAB_W,
    VIEW_H,
    clamp01,
    easeOutCubic,
    fartsandel,
    segmentX,
    wrapText,
} from '../../../utils/kjedeFysikk';
import type { Kulisse } from '../../../types/kjede';
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
}

interface Props {
    verden: KjedeVerden;
    paused: boolean;
    reducedMotion: boolean;
    onHendelse: (h: Verdenshendelse) => void;
    onSnapshot: (s: HudSnapshot) => void;
}

/**
 * Smaleste verden vi tillater. Må romme årsak-steinen, gapet og valgsteinene
 * samtidig, ellers får eleven ikke lest premisset mens hun velger.
 */
const MIN_BREDDE = PITCH + SLAB_W + 120;
const SLAB_TEXT_PAD = 30;
const SLAB_TEXT_W = SLAB_W - SLAB_TEXT_PAD * 2 - 26;
const SLAB_FONT = '600 21px Outfit, Inter, system-ui, sans-serif';

// Deterministisk «tilfeldighet» for kulissene, så bakgrunnen ser lik ut hver gang
const hash01 = (n: number): number => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};

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

/** Der landet slutter og juvet begynner. Steinene svever over dette. */
const KANT_Y = 366;

const tegnHimmel = (ctx: CanvasRenderingContext2D, viewW: number, viewH: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, KANT_Y);
    g.addColorStop(0, '#d4e6f6');
    g.addColorStop(0.6, '#eaf1f7');
    g.addColorStop(1, '#f7f1e4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, KANT_Y);

    // Juvet under kanten: dis som lysner nedover, aldri en bunn
    const juv = ctx.createLinearGradient(0, KANT_Y, 0, viewH);
    juv.addColorStop(0, '#c2d2de');
    juv.addColorStop(0.45, '#dde5ec');
    juv.addColorStop(1, '#eef2f6');
    ctx.fillStyle = juv;
    ctx.fillRect(0, KANT_Y, viewW, viewH - KANT_Y);
};

/** Fjerne åser. Samme lag for alle epoker - horisonten forandrer seg ikke. */
const tegnFjern = (ctx: CanvasRenderingContext2D, camX: number, viewW: number) => {
    const off = camX * 0.16;
    ctx.fillStyle = '#c6d9e7';
    ctx.beginPath();
    ctx.moveTo(-10, KANT_Y);
    for (let x = -200; x <= viewW + 200; x += 40) {
        const wx = x + off;
        const y = 300 + Math.sin(wx * 0.0016) * 44 + Math.sin(wx * 0.0043) * 20;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW + 10, KANT_Y);
    ctx.closePath();
    ctx.fill();
};

const tegnMiddelalderSilhuett = (ctx: CanvasRenderingContext2D, x: number, base: number, r: number) => {
    ctx.beginPath();
    if (r < 0.3) {
        // Kirke med tårn og spir
        ctx.rect(x, base - 44, 58, 44);
        ctx.rect(x + 58, base - 72, 22, 72);
        ctx.moveTo(x + 58, base - 72);
        ctx.lineTo(x + 69, base - 106);
        ctx.lineTo(x + 80, base - 72);
    } else if (r < 0.62) {
        // Langhus med saltak
        ctx.moveTo(x, base);
        ctx.lineTo(x, base - 24);
        ctx.lineTo(x + 27, base - 44);
        ctx.lineTo(x + 54, base - 24);
        ctx.lineTo(x + 54, base);
    } else {
        // Borgtårn med tinder
        ctx.rect(x + 6, base - 62, 38, 62);
        for (let i = 0; i < 3; i++) ctx.rect(x + 6 + i * 14, base - 72, 9, 12);
    }
    ctx.closePath();
    ctx.fill();
};

const tegnNaer = (
    ctx: CanvasRenderingContext2D,
    camX: number,
    viewW: number,
    kulisse: Kulisse
) => {
    const off = camX * 0.44;
    const base = KANT_Y;

    // Landstripen silhuettene står på, tegnet først så husene får bakke under seg
    ctx.fillStyle = '#b3c9d7';
    ctx.fillRect(0, base - 18, viewW, 18);
    ctx.fillStyle = '#8fa9bc';
    ctx.fillRect(0, base - 5, viewW, 5);

    // Merker langs landkanten. Den sterkeste fartsfølelsen i et sidescroller-
    // bilde kommer fra detaljer som streamer forbi, ikke fra store former.
    ctx.fillStyle = '#7f9bb0';
    const merkeSteg = 120;
    const forsteMerke = Math.floor(off / merkeSteg);
    for (let i = forsteMerke; i < forsteMerke + Math.ceil(viewW / merkeSteg) + 2; i++) {
        ctx.fillRect(i * merkeSteg - off, base - 5, 26, 5);
    }

    ctx.fillStyle = '#93aec0';
    const steg = 260;
    const antall = Math.ceil(viewW / steg) + 3;
    const first = Math.floor((off - 300) / steg);
    for (let i = first; i < first + antall; i++) {
        const r = hash01(i * 3.7 + (kulisse === 'middelalder' ? 0 : 11));
        if (r > 0.78) continue;
        tegnMiddelalderSilhuett(ctx, i * steg - off + hash01(i + 5) * 90, base - 16, r);
    }
};

/**
 * Kjettingen mellom to steiner - den synlige årsakssammenhengen. `glimtX` er
 * hvor kjedeglimtet er akkurat nå; lenken lyser opp der pulsen passerer.
 */
const tegnLenke = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    x1: number,
    y: number,
    glimtX: number | null
) => {
    const mid = (x0 + x1) / 2;
    ctx.save();
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(168, 142, 92, 0.55)';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo(mid, y + 34, x1, y);
    ctx.stroke();

    if (glimtX !== null) {
        const naerhet = clamp01(1 - Math.abs(mid - glimtX) / 420);
        if (naerhet > 0.01) {
            ctx.strokeStyle = `rgba(250, 204, 92, ${naerhet})`;
            ctx.lineWidth = 5 + naerhet * 6;
            ctx.shadowColor = 'rgba(250, 190, 60, 0.9)';
            ctx.shadowBlur = 22 * naerhet;
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
    const r = 72 * styrke;
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
    ctx.fillStyle = '#3d3323';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const lh = 26;
    const startY = y + SLAB_H / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => ctx.fillText(line, textLeft, startY + i * lh));
    ctx.restore();
};

const tegnFigur = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    lopefase: number,
    lener: boolean,
    klem: number,
    fart: number
) => {
    const bunn = y;

    // Fartsspor bak figuren - jo lengre streak, jo lengre hale
    if (fart > 0.08) {
        ctx.save();
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = fart * 0.16 * (1 - i / 4);
            ctx.fillStyle = '#4f46e5';
            roundRect(ctx, x - PLAYER_W / 2 - i * 16 * fart, bunn - PLAYER_H, PLAYER_W, PLAYER_H - 16, 12);
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

    // Bein
    ctx.strokeStyle = '#3f3a52';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const swing = Math.sin(lopefase) * 13;
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
    ctx.lineTo(-PLAYER_W / 2 - 16 - Math.sin(lopefase) * 5, -18);
    ctx.lineTo(-PLAYER_W / 2 + 8, -20);
    ctx.closePath();
    ctx.fill();

    // Hode
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(0, -PLAYER_H - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const tegnTaake = (
    ctx: CanvasRenderingContext2D,
    fogScreenX: number,
    t: number,
    viewW: number,
    viewH: number
) => {
    if (fogScreenX <= -280) return;
    const kant = Math.min(fogScreenX, viewW + 40);

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
        ctx.fillRect(0, 0, Math.max(0, kant - 220), viewH);
        ctx.fillStyle = m;
        ctx.fillRect(Math.max(0, kant - 220), 0, Math.min(220, kant), viewH);
        ctx.restore();
    }

    const g = ctx.createLinearGradient(kant - 300, 0, kant + 40, 0);
    g.addColorStop(0, 'rgba(224, 227, 232, 0.88)');
    g.addColorStop(0.65, 'rgba(224, 227, 232, 0.42)');
    g.addColorStop(1, 'rgba(224, 227, 232, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(0, kant - 300), 0, Math.max(0, kant + 40), viewH);

    ctx.fillStyle = 'rgba(238, 240, 243, 0.3)';
    for (let i = 0; i < 5; i++) {
        const r = 70 + hash01(i) * 60;
        const y = 80 + hash01(i + 9) * (viewH - 160) + Math.sin(t * 0.6 + i) * 18;
        ctx.beginPath();
        ctx.arc(kant - 40 - hash01(i + 3) * 130, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
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
                if (kanVelge(w)) {
                    e.preventDefault();
                    velg(w, w.markert);
                } else if (w.fase === 'feilspor') {
                    e.preventDefault();
                    hoppOverFeilspor(w);
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

            // Kamera. Under løping henger det etter figuren; fra det øyeblikket
            // valgene dukker opp glir det tilbake og rammer inn HELE resonnementet:
            // årsak-steinen til venstre og de tre påstandene til høyre. Uten det
            // mister eleven premisset akkurat idet hun trenger det.
            const viewW = transformRef.current.wLog;
            const rammer = w.fase !== 'lop' && w.fase !== 'mal' && w.fase !== 'tatt';
            // Jo raskere hun løper, jo lenger frem ser kameraet - klassisk
            // racing-triks som gjør fart til noe man kjenner, ikke bare et tall
            const anker = CAMERA_ANCHOR - fart * 0.06;
            const maalCamX = rammer
                ? (segmentX(w.segment) + segmentX(w.segment + 1) + SLAB_W) / 2 - viewW / 2
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

            // Kjedeglimtet løper fra forrige stein og inn i den nye
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
            tegnHimmel(ctx, wLog, hLog);
            ctx.save();
            ctx.translate(0, dy);

            // Ved redusert bevegelse står parallaksen stille i stedet for å gli
            const bakgrunnX = reducedMotion ? 0 : camX;
            tegnFjern(ctx, bakgrunnX, wLog);
            tegnNaer(ctx, bakgrunnX, wLog, w.kjede.kulisse);

            ctx.save();
            ctx.translate(-camX + rystX, -camY + rystY);

            if (!reducedMotion) tegnFartsstriper(ctx, eff);

            // Hvor sterkt glimtet lyser opp en stein med gitt senter
            const glimtPaa = (senterX: number) =>
                glimtX === null ? 0 : clamp01(1 - Math.abs(senterX - glimtX) / 230);

            // Bakkesteinene eleven allerede har bygget
            const forste = Math.max(0, w.segment - 3);
            for (let i = forste; i <= w.segment; i++) {
                const x = segmentX(i);
                if (i > forste) {
                    tegnLenke(ctx, x - GAP_W, x, GROUND_TOP + SLAB_H / 2, glimtX);
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
                const sx = segmentX(w.segment + 1) - 150;
                ctx.fillStyle = '#cbd5e1';
                roundRect(ctx, sx, FEILSPOR_TOP, SLAB_W + 200, 70, 12);
                ctx.fill();
            }

            // Figuren
            const lener = w.fase === 'tenk';
            tegnFigur(
                ctx,
                w.playerX,
                w.playerY,
                lopefaseRef.current,
                lener,
                eff.klem,
                reducedMotion ? 0 : fart
            );

            tegnPartikler(ctx, eff);

            // Glimtkula løper langs kjeden helt øverst i verdenslaget
            if (glimtX !== null && glimtP !== null) {
                const styrke = Math.sin(glimtP * Math.PI);
                tegnGlimtkule(ctx, glimtX, GROUND_TOP + SLAB_H / 2, styrke);
            }

            ctx.restore();

            tegnTaake(ctx, w.fogX - camX, naa / 1000, wLog, hLog);
            ctx.restore();

            // HUD-snapshot cirka 10 ganger i sekundet
            if (naa - sisteSnapshot > 100) {
                sisteSnapshot = naa;
                snapshotRef.current({
                    ledd: Math.min(w.segment + 1, w.kjede.ledd.length),
                    totaltLedd: w.kjede.ledd.length,
                    streak: w.streak,
                    forsprang: clamp01((w.playerX - w.fogX) / 1400),
                    tenkeandel:
                        w.fase === 'tenk' ? clamp01(1 - w.faseT / w.effekter.tenketid) : 0,
                    fase: w.fase,
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
