// Juice: partikler, risting, telleren som ruller, rakel-sveipet, folk som går hjem og
// merkene etter fabrikkene som ble med. Alt her er pynt og leses bare av draw.ts - reglene
// rører det aldri. Tiden er ekte tid (risting svinner også i pausen).

import type { Tier } from './art';

export interface Partikkel {
    x: number;
    y: number;
    vx: number;
    vy: number;
    liv: number;
    maks: number;
    r: number;
    /** 'rød' og 'blå' er blekk, 'papir' er hvite biter, 'røyk' er grå. */
    f: 'rød' | 'blå' | 'papir' | 'røyk' | 'tynn';
    rot: number;
}

export interface Sveip {
    t0: number;
    tittel: string;
    under: string;
    farge: string;
    tekst: string;
}

export interface Fx {
    tier: Tier;
    tid: number;
    rist: number;
    part: Partikkel[];
    /** Ledd bølgen tok: små blå figurer som går rolig hjem (rutekoordinater). */
    gående: { x: number; y: number; tx: number; ty: number; liv: number }[];
    /** Ledd som falt av ved et krasj: tynn rød, blekner (rutekoordinater). */
    falt: { x: number; y: number; liv: number }[];
    /** Fabrikker som ble med: små røde merker på kartet (rutekoordinater). */
    okkupert: { x: number; y: number; t: number }[];
    /** Nye fabrikker: en ring som vokser ut fra stedet (står stille). */
    ringer: { x: number; y: number; t: number; farge: string }[];
    visTall: number;
    sprett: number;
    hodeSprett: number;
    sveip: Sveip | null;
    /** Når GRENELLE ble trykket (ekte tid), for de Gaulle-trykket. */
    grenelleT: number | null;
    /** Brettet merkene hører til. */
    brett: number;
    /** Hit-stop: spillet står stille så mange sekunder til (ekte tid). */
    stopp: number;
}

export function nyFx(tier: Tier): Fx {
    return {
        tier,
        tid: 0,
        rist: 0,
        part: [],
        gående: [],
        falt: [],
        okkupert: [],
        ringer: [],
        visTall: 0,
        sprett: 0,
        hodeSprett: 0,
        sveip: null,
        grenelleT: null,
        brett: 0,
        stopp: 0,
    };
}

const maksPart = (fx: Fx) => (fx.tier === 'lav' ? 60 : fx.tier === 'middels' ? 160 : 320);
const maksGående = (fx: Fx) => (fx.tier === 'lav' ? 8 : fx.tier === 'middels' ? 24 : 48);

/** Ny runde eller nytt brett: alt på kartet forsvinner. */
export function nullstillKart(fx: Fx, brett: number) {
    fx.part.length = 0;
    fx.gående.length = 0;
    fx.falt.length = 0;
    fx.okkupert.length = 0;
    fx.ringer.length = 0;
    fx.grenelleT = null;
    fx.brett = brett;
}

/** Blekksprut og papirbiter fra et punkt (i plakat-piksler). */
export function sprut(fx: Fx, x: number, y: number, n: number, f: Partikkel['f'], fart = 160) {
    const plass = maksPart(fx) - fx.part.length;
    const k = Math.min(n, plass);
    for (let i = 0; i < k; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = fart * (0.35 + Math.random() * 0.8);
        const maks = 0.35 + Math.random() * 0.45;
        fx.part.push({
            x,
            y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            liv: maks,
            maks,
            r: f === 'papir' ? 2 + Math.random() * 3 : 1.5 + Math.random() * 4,
            f,
            rot: Math.random() * 6,
        });
    }
}

/** Røyk fra en pipe: noen få grå dotter som stiger (færre på lav). */
export function røyk(fx: Fx, x: number, y: number) {
    if (fx.part.length >= maksPart(fx) * 0.6) return;
    fx.part.push({
        x: x + (Math.random() - 0.5) * 2,
        y,
        vx: 6 + Math.random() * 6,
        vy: -14 - Math.random() * 8,
        liv: 1.6,
        maks: 1.6,
        r: 2 + Math.random() * 2,
        f: 'røyk',
        rot: 0,
    });
}

export function gåHjem(fx: Fx, x: number, y: number) {
    if (fx.gående.length >= maksGående(fx)) fx.gående.shift();
    const mål = fx.okkupert.length
        ? fx.okkupert[Math.floor(Math.random() * fx.okkupert.length)]
        : { x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6 };
    fx.gående.push({ x, y, tx: mål.x, ty: mål.y, liv: 3 });
}

export function sveip(fx: Fx, tittel: string, under: string, farge: string, tekst = '#f2f2ef') {
    fx.sveip = { t0: fx.tid, tittel, under, farge, tekst };
}

/** Ett bilde fram i ekte tid. `millioner` er tallet telleren skal rulle mot. */
export function oppdaterFx(fx: Fx, dt: number, millioner: number) {
    fx.tid += dt;
    fx.rist = Math.max(0, fx.rist - dt * 18);
    fx.sprett = Math.max(0, fx.sprett - dt * 3.2);
    fx.hodeSprett = Math.max(0, fx.hodeSprett - dt * 4);
    // Telleren ruller: fort når avstanden er stor, aldri forbi målet.
    const d = millioner - fx.visTall;
    if (Math.abs(d) < 0.005) fx.visTall = millioner;
    else fx.visTall += d * Math.min(1, dt * 7) + Math.sign(d) * Math.min(Math.abs(d), dt * 0.6);
    for (let i = fx.part.length - 1; i >= 0; i--) {
        const p = fx.part[i];
        p.liv -= dt;
        if (p.liv <= 0) {
            fx.part.splice(i, 1);
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const brems = p.f === 'røyk' ? 0.4 : 5;
        p.vx -= p.vx * Math.min(1, brems * dt);
        p.vy -= p.vy * Math.min(1, brems * dt);
        if (p.f === 'røyk') p.r += dt * 3;
        p.rot += dt * 8;
    }
    for (let i = fx.gående.length - 1; i >= 0; i--) {
        const w = fx.gående[i];
        w.liv -= dt;
        if (w.liv <= 0) {
            fx.gående.splice(i, 1);
            continue;
        }
        const dx = w.tx - w.x;
        const dy = w.ty - w.y;
        const L = Math.hypot(dx, dy) || 1;
        w.x += (dx / L) * Math.min(L, dt * 1.6);
        w.y += (dy / L) * Math.min(L, dt * 1.6);
    }
    for (let i = fx.falt.length - 1; i >= 0; i--) {
        fx.falt[i].liv -= dt;
        if (fx.falt[i].liv <= 0) fx.falt.splice(i, 1);
    }
    for (let i = fx.ringer.length - 1; i >= 0; i--)
        if (fx.tid - fx.ringer[i].t > 0.9) fx.ringer.splice(i, 1);
}
