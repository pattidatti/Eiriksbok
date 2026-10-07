// Spillfølelsen: hva verden gjør når Inga plukker, bærer og legger på ved, og når båten
// og lyset kommer. Leser spillet og hendelsene, lager partikler, rykk og lyd.
// Ingen spillregler her: robotene og simuleringen kjører uten denne fila.

import type { Game, Hendelse } from './game';
import { bakke, iLyset, inne } from './rules';
import { TUNING } from './tuning';
import type { Lyd } from './sound';

const T = TUNING;
const J = T.juice;
const G = T.verden.gammaX;
const GY = bakke(G);

export type Slag = 'gnist' | 'snø' | 'flis' | 'damp';

export interface Partikkel {
    slag: Slag;
    x: number;
    y: number;
    vx: number;
    vy: number;
    liv: number;
    maks: number;
    r: number;
}

/** En kubbe i lufta: fra stabelen til bålet, eller fra armene til stabelen. */
export interface Kubbe {
    fx: number;
    fy: number;
    tx: number;
    ty: number;
    t: number;
    dur: number;
    tilBål: boolean;
}

export interface Fx {
    partikler: Partikkel[];
    kubber: Kubbe[];
    /** 0-1: flammen blusser etter en kubbe. */
    blus: number;
    /** Skjermrystelse (px), svinner i ekte tid. */
    rist: number;
    /** Ekte sekunder igjen av pusten (sakte film) når lyset går forbi. */
    pust: number;
    /** 0-1: ringen rundt gamma etter et nesten-bom. */
    nesten: number;
    /** 0-1: blitsen i lampa når lyskasteren tennes. */
    blits: number;
    /** 0-1: Inga løfter fanget (plukk) og strekker armene (lever). */
    løft: number;
    /** Gangen: fasen i steget og forrige x. */
    steg: number;
    sistX: number;
    /** Stabelen sist bilde (kubbene som ligger der vises først når de har landet). */
    iLufta: number;
    /** Båten lyset sist gikk forbi gamma for (én pust per båt). */
    forbiBåt: number;
    /** Ekte sekunder siden runden sluttet (slutt-bildet). */
    slutt: number;
    knitre: number;
    /** 0-1: datoklossen gløder etter en varm natt, og hvor mange varme netter vi har sett. */
    varmNatt: number;
    netter: number;
    /** Signal til teksten: lyset gikk så vidt forbi røyken. */
    såVidt: boolean;
}

export function nyFx(): Fx {
    return {
        partikler: [],
        kubber: [],
        blus: 0,
        rist: 0,
        pust: 0,
        nesten: 0,
        blits: 0,
        løft: 0,
        steg: 0,
        sistX: G,
        iLufta: 0,
        forbiBåt: 0,
        slutt: 0,
        knitre: 0,
        varmNatt: 0,
        netter: 0,
        såVidt: false,
    };
}

/** Hvor stabelen ved døra står (toppen), og hvor bålet er. */
export const STABEL = { x: G + 92, y: GY - 10 };
export const BÅL = { x: G, y: GY - 10 };

function spray(fx: Fx, slag: Slag, x: number, y: number, n: number, fart: number, opp: number) {
    const maks = slag === 'gnist' ? 0.9 : slag === 'damp' ? 1.4 : 0.6;
    for (let i = 0; i < n; i++) {
        if (fx.partikler.length > 220) fx.partikler.shift();
        const a = Math.random() * Math.PI * 2;
        const v = fart * (0.4 + Math.random() * 0.6);
        fx.partikler.push({
            slag,
            x,
            y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v * 0.5 - opp * (0.6 + Math.random() * 0.6),
            liv: maks * (0.6 + Math.random() * 0.4),
            maks,
            r: slag === 'snø' ? 1.5 + Math.random() * 2 : 1 + Math.random() * 1.6,
        });
    }
}

export function fxHendelse(fx: Fx, h: Hendelse, g: Game, lyd: Lyd) {
    switch (h.type) {
        case 'legg':
            fx.kubber.push({
                fx: STABEL.x,
                fy: STABEL.y,
                tx: BÅL.x,
                ty: BÅL.y,
                t: 0,
                dur: J.kubbeFlyr,
                tilBål: true,
            });
            lyd.klakk(true);
            break;
        case 'plukk':
            fx.løft = 1;
            spray(fx, 'snø', h.x, bakke(h.x) - 4, 14, 70, 60);
            spray(fx, 'flis', h.x, bakke(h.x) - 10, 5, 50, 70);
            lyd.klakk();
            break;
        case 'lever':
            fx.løft = 1;
            fx.iLufta += h.kubber;
            for (let k = 0; k < h.kubber; k++)
                fx.kubber.push({
                    fx: g.x + 10,
                    fy: bakke(g.x) - 20,
                    tx: STABEL.x + (k % 3) * 7 - 7,
                    ty: STABEL.y - 4,
                    t: -k * 0.07,
                    dur: J.leverFlyr,
                    tilBål: false,
                });
            break;
        case 'tom':
            lyd.tom();
            break;
        case 'lys':
            fx.blits = 1;
            fx.rist = Math.max(fx.rist, J.ristLys);
            lyd.klikk();
            break;
        case 'tap':
            fx.rist = J.ristTap;
            lyd.tap();
            break;
        case 'seier':
            lyd.seier();
            break;
        default:
            break;
    }
}

/** Motorduren: kommer nærmere, står på mens lyset feier, dør ut når båten drar. */
export function motorNivå(g: Game | null): number {
    const p = g?.patrulje;
    if (!p || g?.mode !== 'play') return 0;
    if (p.fase === 'kommer') return 0.35 + 0.65 * Math.max(0, Math.min(1, (1000 - p.båtX) / 90));
    if (p.fase === 'lyser') return 1;
    return Math.max(0, p.igjen / T.patrulje.drar) * 0.8;
}

/** Hvor fort spillet går akkurat nå (pusten når lyset går rett over gamma). */
export const fxFart = (fx: Fx) => (fx.pust > 0 ? J.pustFart : 1);

/**
 * Ett bilde. `ekte` er sekunder i ekte tid (risting, pust), `dt` er spilltid (partikler,
 * gange). Lager snøfokk ved føttene, gnister fra bålet og pusten når lyset går forbi.
 */
export function fxTick(fx: Fx, g: Game, dt: number, ekte: number, lyd: Lyd, spiller: boolean) {
    fx.rist = Math.max(0, fx.rist - ekte * 14);
    fx.pust = Math.max(0, fx.pust - ekte);
    fx.blus = Math.max(0, fx.blus - dt * 2.2);
    fx.nesten = Math.max(0, fx.nesten - ekte * 0.9);
    fx.blits = Math.max(0, fx.blits - ekte * 3);
    fx.løft = Math.max(0, fx.løft - dt * 3.5);
    fx.såVidt = false;
    fx.varmNatt = Math.max(0, fx.varmNatt - ekte * 1.6);
    if (!spiller) fx.slutt += ekte;
    // En varm natt: datoklossen gløder kort (ingen poengregn, ingen lyd hvert døgn).
    if (g.varmeNetter > fx.netter && spiller) fx.varmNatt = 1;
    fx.netter = g.varmeNetter;

    // Kubbene i lufta.
    for (const k of fx.kubber) {
        k.t += dt;
        if (k.t >= k.dur) {
            if (k.tilBål) {
                fx.blus = 1;
                spray(fx, 'gnist', BÅL.x, BÅL.y - 6, J.gnister, 90, 110);
                lyd.dunk();
            } else {
                fx.iLufta = Math.max(0, fx.iLufta - 1);
                spray(fx, 'snø', k.tx, k.ty, 3, 30, 20);
                lyd.klakk(true);
            }
        }
    }
    fx.kubber = fx.kubber.filter((k) => k.t < k.dur);

    // Gangen og snøfokket ved føttene: tyngre og mer snø med fullt fang.
    const dx = Math.abs(g.x - fx.sistX);
    fx.sistX = g.x;
    fx.steg += dx / (g.fang > 0 ? 16 : 13);
    if (dx > 0.2 && !inne(g)) {
        const rate = g.fang > 0 ? J.snøFang : J.snøTom;
        if (Math.random() < rate * dt) spray(fx, 'snø', g.x - g.vendt * 4, bakke(g.x) - 2, 2, 40, 35);
    }

    // Bålet: små gnister og knitring mens det brenner.
    if (g.bål > 0 && spiller) {
        if (Math.random() < dt * 6) spray(fx, 'gnist', BÅL.x, BÅL.y - 10, 1, 30, 60);
        fx.knitre -= dt;
        if (fx.knitre <= 0) {
            lyd.knitre();
            fx.knitre = 0.12 + Math.random() * 0.35;
        }
    }

    // Lyset går rett over gamma uten å se røyken: en pust, et hjerteslag og en ring.
    const p = g.patrulje;
    if (spiller && p && p.fase === 'lyser' && !p.øving && fx.forbiBåt !== g.båter && g.mode === 'play') {
        if (Math.abs(p.lysX - G) < 18 && iLyset(g, G)) {
            fx.forbiBåt = g.båter;
            fx.pust = J.pust;
            fx.nesten = 1;
            lyd.hjerte();
            if (g.røyk > J.nesten) fx.såVidt = true;
        }
    }

    for (const q of fx.partikler) {
        q.liv -= dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.slag === 'gnist') {
            q.vy -= 30 * dt;
            q.vx *= 0.98;
        } else if (q.slag === 'damp') q.vy -= 8 * dt;
        else q.vy += 160 * dt;
    }
    fx.partikler = fx.partikler.filter((q) => q.liv > 0);
}

/** Damp/rim som slippes fra familien når bålet blusser opp (rimet smelter). */
export function smeltDamp(fx: Fx) {
    spray(fx, 'damp', G - 40, GY - 32, 3, 14, 18);
    spray(fx, 'damp', G + 34, GY - 30, 2, 14, 18);
}
