// Spillfølelsen: alt som bare er for øyet (bølger i vannet, røyk, stempler som tas, unger som
// popper fram, båtenes kurs, arkbytte). Leser spillets hendelser, rører aldri spilltilstanden.
// Tiden her er ekte tid, så rystelser og bølger ikke henger igjen i pausen.

import type { Game, Hendelse } from './game';
import type { KartId } from './levels';

export interface Bølge {
    x: number;
    y: number;
    t: number;
    /** Levetid (s) og største radius. */
    liv: number;
    r: number;
    farge: string;
    tykk: number;
}

export interface Røyk {
    x: number;
    y: number;
    t: number;
}

/** Et hvalstempel som løftes av kartet når båten tar det. */
export interface Tatt {
    x: number;
    y: number;
    bx: number;
    by: number;
    t: number;
    v: number;
}

export interface Skrift {
    x: number;
    y: number;
    t: number;
    tekst: string;
    farge: string;
}

export interface Fx {
    bølger: Bølge[];
    røyk: Røyk[];
    tatt: Tatt[];
    skrift: Skrift[];
    /** Unger som nettopp er født: flokk -> tidspunkter (vises lysere en stund). */
    unger: Map<number, number[]>;
    /** Flokker som nettopp døde: flokk -> sekunder siden. */
    døde: Map<number, number>;
    /** Båtenes kurs (radianer), dempet mot retningen de seiler. */
    kurs: Map<number, number>;
    /** Båter som nettopp ble kjøpt eller slapp: id -> sekunder siden (spretter). */
    hopp: Map<number, number>;
    /** Tønna spretter når et fat kommer inn. */
    tønneHopp: number;
    /** Årstallet stemples på nytt ved årsskiftet. */
    årHopp: number;
    /** Grønt år: stempelet i kartusjen. */
    grønt: number;
    rekke: number;
    /** Arkbytte: det gamle arket glir ut, det nye inn. */
    arkFra: KartId | null;
    arkT: number;
    klokke: number;
}

export const nyFx = (): Fx => ({
    bølger: [],
    røyk: [],
    tatt: [],
    skrift: [],
    unger: new Map(),
    døde: new Map(),
    kurs: new Map(),
    hopp: new Map(),
    tønneHopp: 0,
    årHopp: 0,
    grønt: 0,
    rekke: 0,
    arkFra: null,
    arkT: 1,
    klokke: 0,
});

export const ARK_SEK = 1.6;
export const UNGE_SEK = 5;

export function bølge(fx: Fx, x: number, y: number, r: number, farge: string, liv = 0.8, tykk = 2) {
    fx.bølger.push({ x, y, t: 0, liv, r, farge, tykk });
}

/** Hendelser fra spillet -> effekter. Kalles før hendelsene tømmes. */
export function fraHendelse(fx: Fx, g: Game, h: Hendelse, farger: { grønn: string; rød: string; blekk: string; rav: string }) {
    if (h.type === 'fangst') {
        const f = g.flokker.find((k) => k.id === h.flokk);
        if (f) {
            fx.tatt.push({ x: f.x, y: f.y, bx: h.x, by: h.y, t: 0, v: Math.floor(Math.random() * 4) });
            bølge(fx, f.x + (Math.random() - 0.5) * 20, f.y + (Math.random() - 0.5) * 14, 12, farger.blekk, 0.6, 1.2);
        }
    } else if (h.type === 'unge') {
        const l = fx.unger.get(h.flokk) ?? [];
        l.push(fx.klokke);
        fx.unger.set(h.flokk, l);
        const f = g.flokker.find((k) => k.id === h.flokk);
        if (f) bølge(fx, f.x, f.y, 20, farger.grønn, 0.9, 1.5);
    } else if (h.type === 'død') {
        fx.døde.set(h.flokk, 0);
        const f = g.flokker.find((k) => k.id === h.flokk);
        if (f) bølge(fx, f.x, f.y, 70, farger.rød, 1.4, 3);
    } else if (h.type === 'fat') {
        fx.tønneHopp = 1;
    } else if (h.type === 'slipp') {
        fx.hopp.set(h.id, 0);
        const b = g.båter.find((k) => k.id === h.id);
        if (b) {
            bølge(fx, b.tx, b.ty, 34, farger.blekk, 0.7, 2);
            bølge(fx, b.tx, b.ty, 52, farger.blekk, 1.0, 1);
        }
    } else if (h.type === 'kjøp') {
        fx.hopp.set(h.id, 0);
        const b = g.båter.find((k) => k.id === h.id);
        if (b) bølge(fx, b.x, b.y, 60, farger.rav, 1.0, 3);
    } else if (h.type === 'tilbud') {
        fx.hopp.set(h.id, 0);
        const b = g.båter.find((k) => k.id === h.id);
        if (b) bølge(fx, b.x, b.y, 44, farger.rav, 1.2, 2);
    } else if (h.type === 'reddet') {
        const f = g.flokker.find((k) => k.id === h.flokk);
        if (f) {
            bølge(fx, f.x, f.y, 80, farger.grønn, 1.6, 4);
            bølge(fx, f.x, f.y, 56, farger.grønn, 1.2, 2);
        }
    } else if (h.type === 'årsskifte') {
        fx.årHopp = 1;
        if (h.grønt) {
            fx.grønt = 1;
            fx.rekke = g.grønnRekke;
        }
    }
}

/** Ett bilde fram i ekte tid. `lav` = færre røykdotter. */
export function fxSteg(fx: Fx, g: Game, dt: number, lav: boolean) {
    fx.klokke += dt;
    for (const b of fx.bølger) b.t += dt;
    fx.bølger = fx.bølger.filter((b) => b.t < b.liv);
    for (const r of fx.røyk) r.t += dt;
    fx.røyk = fx.røyk.filter((r) => r.t < (lav ? 1.2 : 1.8));
    for (const t of fx.tatt) t.t += dt;
    fx.tatt = fx.tatt.filter((t) => t.t < 0.9);
    for (const s of fx.skrift) s.t += dt;
    fx.skrift = fx.skrift.filter((s) => s.t < 1.3);
    for (const [k, l] of fx.unger) {
        const nye = l.filter((t) => fx.klokke - t < UNGE_SEK);
        if (nye.length) fx.unger.set(k, nye);
        else fx.unger.delete(k);
    }
    for (const [k, t] of fx.døde) fx.døde.set(k, t + dt);
    for (const [k, t] of fx.hopp) {
        if (t > 1) fx.hopp.delete(k);
        else fx.hopp.set(k, t + dt);
    }
    fx.tønneHopp = Math.max(0, fx.tønneHopp - dt * 4);
    fx.årHopp = Math.max(0, fx.årHopp - dt * 2.5);
    fx.grønt = Math.max(0, fx.grønt - dt * 0.6);
    if (fx.arkT < 1) fx.arkT = Math.min(1, fx.arkT + dt / ARK_SEK);
    // Kursen: båtene snur seg mykt mot der de skal. Røyk bak båter som går.
    const sjanse = lav ? 6 : 14;
    for (const b of g.båter) {
        const dx = b.tx - b.x;
        const dy = b.ty - b.y;
        const går = Math.hypot(dx, dy) > 1;
        const nå = fx.kurs.get(b.id) ?? Math.PI;
        if (går) {
            const mål = Math.atan2(dy, dx);
            let d = mål - nå;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            fx.kurs.set(b.id, nå + d * Math.min(1, dt * 8));
            if (!b.tilbud && Math.random() < sjanse * dt)
                fx.røyk.push({ x: b.x - Math.cos(nå) * 12, y: b.y - Math.sin(nå) * 12, t: 0 });
        } else if (!fx.kurs.has(b.id)) fx.kurs.set(b.id, Math.PI);
    }
}

/** Arkbytte: det gamle arket glir ut. */
export function byttArk(fx: Fx, fra: KartId) {
    fx.arkFra = fra;
    fx.arkT = 0;
}

export const glatt = (t: number) => t * t * (3 - 2 * t);
