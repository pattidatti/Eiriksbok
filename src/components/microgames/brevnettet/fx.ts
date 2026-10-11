// Juice i Brevnettet: det som bare er for øyet (tråder som pisker, fnugg, risting, flakkende
// talglys). Komponenten fyller det fra spillets hendelser, visningen leser og tømmer det.
// Ingen spillregler her - simuleringen bryr seg ikke om dette.

import type { Punkt } from './net';

export interface Brudd {
    a: Punkt;
    b: Punkt;
    hauge: boolean;
    /** Sekunder siden tråden røk. */
    t: number;
}

export interface Fnugg {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    t: number;
    liv: number;
    r: number;
    g: number;
    b: number;
    str: number;
}

export interface Fx {
    /** Skjermrystelse (0-1), svinner i ekte tid i kameraet. */
    traume: number;
    /** Talglyset flakker (0-1) etter en arrestasjon. */
    flakk: number;
    /** Morgensola fra høyre i 1814 (0-1). */
    morgen: number;
    brudd: Brudd[];
    fnugg: Fnugg[];
    /** Tråd-id -> sekunder siden den ble knyttet om (dirrer igjen). */
    dirr: Map<number, number>;
}

export const lagFx = (): Fx => ({
    traume: 0,
    flakk: 0,
    morgen: 0,
    brudd: [],
    fnugg: [],
    dirr: new Map(),
});

export const MAKS_BRUDD = 16;
export const MAKS_FNUGG = 90;

const hex = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Strø fnugg (ullfibre eller gnister) ut fra et punkt på veven. */
export function strø(fx: Fx, p: Punkt, n: number, farge: string, fart = 2.4, opp = 0.6) {
    const [r, g, b] = hex(farge);
    for (let i = 0; i < n; i++) {
        if (fx.fnugg.length >= MAKS_FNUGG) fx.fnugg.shift();
        const v = Math.random() * Math.PI * 2;
        const s = fart * (0.4 + Math.random() * 0.6);
        fx.fnugg.push({
            x: p.x,
            y: p.y,
            z: 0.4,
            vx: Math.cos(v) * s,
            vy: Math.sin(v) * s + opp,
            vz: Math.random() * 1.5,
            t: 0,
            liv: 0.6 + Math.random() * 0.6,
            r,
            g,
            b,
            str: 0.05 + Math.random() * 0.06,
        });
    }
}

export function brekk(fx: Fx, a: Punkt, b: Punkt, hauge: boolean) {
    if (fx.brudd.length >= MAKS_BRUDD) fx.brudd.shift();
    fx.brudd.push({ a, b, hauge, t: 0 });
}

/** Ett bilde i ekte tid: trådender faller, fnugg flyr, rysting og flakking svinner. */
export function stegFx(fx: Fx, dt: number) {
    for (const b of fx.brudd) b.t += dt;
    fx.brudd = fx.brudd.filter((b) => b.t <= 1.1);
    for (const f of fx.fnugg) {
        f.t += dt;
        f.vy -= 4 * dt;
        f.vx *= 1 - 2 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.z += f.vz * dt;
    }
    fx.fnugg = fx.fnugg.filter((f) => f.t <= f.liv);
    fx.traume = Math.max(0, fx.traume - dt * 1.6);
    fx.flakk = Math.max(0, fx.flakk - dt * 1.4);
    for (const [id, t] of fx.dirr) {
        if (t > 2) fx.dirr.delete(id);
        else fx.dirr.set(id, t + dt);
    }
}

/** Rist kameraet (legges til, maks 1). */
export function rist(fx: Fx, n: number) {
    fx.traume = Math.min(1, fx.traume + n);
}

/** Talglyset flakker (arrestasjon). */
export function flakk(fx: Fx) {
    fx.flakk = 1;
}

/** Tråden er knyttet om: den dirrer på nytt. */
export function dirr(fx: Fx, id: number) {
    fx.dirr.set(id, 0);
}

/** Morgensola stiger (1814, seier). */
export function morgen(fx: Fx, dt: number) {
    fx.morgen = Math.min(1, fx.morgen + dt * 0.8);
}

/** Ny runde: ingen rester fra forrige. */
export function nullstill(fx: Fx) {
    fx.morgen = 0;
    fx.traume = 0;
    fx.flakk = 0;
    fx.brudd.length = 0;
    fx.fnugg.length = 0;
    fx.dirr.clear();
}
