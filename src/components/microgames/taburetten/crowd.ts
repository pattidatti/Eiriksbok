// Hendene og stolen: bølgene, løftet fra stripa og fysikken (lene og hoppe).
// Fagregelen bor i `løft`: fargen i stolen med flertall = høye bølger; uten = jevn synking.

import { harFlertall, SETER, type Game } from './state';
import { TUNING } from './tuning';

const H = TUNING.hender;
const F = TUNING.fysikk;
const K = (2 * Math.PI) / H.bølgelengde;

export type Løft = 'flertall' | 'vern' | 'mellom' | 'synk';

/** Er x på en av kongens øyer? */
export function påØy(g: Game, x: number): boolean {
    for (const ø of g.øyer) if (x >= ø.x0 && x <= ø.x1) return true;
    return false;
}

/**
 * Hva bærer stolen nå? Bare stripa (og kongens vern før dommen) avgjør.
 * Før dommen bærer livgarden en blå regjering, men bare på kongens øyer; imellom drar
 * den røde mengden stolen ned.
 */
export function løft(g: Game): Løft {
    if (harFlertall(g, g.stol.farge)) return 'flertall';
    if (g.vern && g.stol.farge === 'blå') return påØy(g, g.x) ? 'vern' : 'mellom';
    return 'synk';
}

/** Høyden på hendene over brosteinen i punkt x. */
export function flate(g: Game, x: number): number {
    return Math.max(0, g.base + g.amp * Math.sin(K * x));
}

/** Helningen på hendene i punkt x (dy/dx). */
export function helning(g: Game, x: number): number {
    if (g.base + g.amp * Math.sin(K * x) <= 0) return 0;
    return g.amp * K * Math.cos(K * x);
}

/** Bølgetoppene ligger der sin = 1. Neste topp etter x. */
export function nesteTopp(x: number): number {
    const L = H.bølgelengde;
    const k = Math.ceil((x - L / 4) / L);
    return L / 4 + k * L;
}

/** Målet for hendene når fargen har flertall: større flertall = høyere og raskere. */
export function flertallsMål(g: Game): { base: number; amp: number } {
    const seter = g.stol.farge === 'rød' ? g.rødt : SETER - g.rødt;
    const andel = seter / SETER - 0.5;
    return {
        base: H.flertallBase + H.flertallBaseK * andel,
        amp: H.flertallAmp + H.flertallAmpK * andel,
    };
}

const mot = (v: number, mål: number, steg: number) =>
    v < mål ? Math.min(mål, v + steg) : Math.max(mål, v - steg);

/** Hendene følger stripa: reiser seg, holder vernlinja eller synker jevnt. */
export function oppdaterHender(g: Game, dt: number) {
    const l = løft(g);
    if (l === 'flertall') {
        const m = flertallsMål(g);
        g.base = mot(g.base, m.base, H.stigFart * dt);
        g.amp = mot(g.amp, m.amp, H.ampFart * dt);
    } else if (l === 'vern') {
        g.base = mot(g.base, H.vernHøyde, H.stigFart * dt);
        g.amp = mot(g.amp, H.vernAmp, H.ampFart * dt);
    } else if (l === 'mellom') {
        g.base = Math.max(0, g.base - TUNING.øy.synk * dt);
        g.amp = mot(g.amp, TUNING.øy.amp, H.ampFart * dt);
    } else {
        g.base = Math.max(0, g.base - g.synkFart * dt);
        g.amp = mot(g.amp, H.synkAmp, H.ampFart * dt);
    }
}

export interface Landing {
    kvalitet: 'fin' | 'dunk' | 'nøytral';
}

/**
 * Ett delsteg for stolen. Hold = tung: ruller fort ned bølgene, faller fort i lufta.
 * Passerer stolen en bølgetopp uten å lene, kaster hendene den opp.
 */
export function stegStol(g: Game, h: number, marsj: number): Landing | null {
    const grav = F.tyngde * (g.hold ? F.tungFaktor : 1);
    if (g.luft) {
        g.vy -= grav * h;
        g.x += g.vx * h;
        g.y += g.vy * h;
        const ys = flate(g, g.x);
        if (g.y <= ys) {
            const s = helning(g, g.x);
            g.y = ys;
            g.vy = 0;
            g.luft = false;
            g.sForrige = s;
            if (s < -F.landHelning) {
                g.vx = Math.min(F.maksFart, g.vx + F.finBoost);
                return { kvalitet: 'fin' };
            }
            if (s > F.landHelning) {
                g.vx = Math.max(F.minFart, g.vx * F.dunkFaktor);
                return { kvalitet: 'dunk' };
            }
            return { kvalitet: 'nøytral' };
        }
        return null;
    }
    const s = helning(g, g.x);
    g.vx += ((-grav * s) / (1 + s * s)) * h;
    g.vx += (marsj - g.vx) * F.drag * h;
    g.vx = Math.max(F.minFart, Math.min(F.maksFart, g.vx));
    g.x += g.vx * h;
    const sNy = helning(g, g.x);
    g.y = flate(g, g.x);
    if (!g.hold && s > 0 && sNy <= 0 && g.amp > 0.05) {
        g.luft = true;
        g.vy = g.vx * g.amp * K * F.kast;
    }
    g.sForrige = sNy;
    return null;
}

/** Kast stolen opp (perfekt bytte). */
export function kastOpp(g: Game, vy: number) {
    g.luft = true;
    g.vy = Math.max(g.vy, vy);
}
