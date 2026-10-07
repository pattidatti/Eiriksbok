// Fagkjernen som rene funksjoner: varme mot røyk, og lyset som ser alt det treffer.

import type { Game } from './game';
import { TUNING } from './tuning';

const T = TUNING;
const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

export const dagNå = (g: Game) => g.t / T.dag;
const andel = (g: Game) => dagNå(g) / T.dager;

/** Bakken: y på flata for en x (gamma høyt oppe, stranda nede). */
export function bakke(x: number): number {
    const k = Math.max(0, Math.min(1, (x - 60) / 800));
    return 210 + 260 * (k * 0.75 + k * k * 0.25);
}

export const inne = (g: Game) => g.x <= T.verden.gammaX + T.verden.inne;

export const stormNå = (g: Game) => {
    const d = dagNå(g);
    return d >= T.storm.fra && d < T.storm.til;
};
/** Sekunder igjen av stormen (0 utenfor). Snøfokket tynnes ut de siste sekundene i bildet. */
export const stormIgjen = (g: Game) =>
    stormNå(g) ? (T.storm.til - dagNå(g)) * T.dag : 0;
export const julNå = (g: Game) => {
    const d = dagNå(g);
    return d >= T.jul.fra && d < T.jul.til;
};

/** Varmefall per sekund akkurat nå. */
export function fall(g: Game): number {
    const f = lerp(T.varme.fallFra, T.varme.fallTil, andel(g));
    return stormNå(g) ? f * T.storm.fallGanger : f;
}

export const mellomrom = (g: Game) =>
    lerp(T.patrulje.mellomFra, T.patrulje.mellomTil, andel(g));
export const varsel = (g: Game) => lerp(T.patrulje.varsel, T.patrulje.varselTil, andel(g));
export const sveipFart = (g: Game) => lerp(T.patrulje.sveipFra, T.patrulje.sveipTil, andel(g));

/** Fyrer Inga akkurat nå? Bare inne, med ved i stabelen, mens hun holder. */
export const fyrer = (g: Game) => g.input.hold && inne(g) && g.stabel > 0;

/** Røyken synes for lyset (stormen skjuler den). */
export const røykSynes = (g: Game) => g.røyk > T.røyk.synlig && !stormNå(g);

/** Treffer lyset et punkt x på bakken akkurat nå? */
export function iLyset(g: Game, x: number): boolean {
    const p = g.patrulje;
    if (!p || p.fase !== 'lyser') return false;
    return Math.abs(x - p.lysX) <= T.patrulje.bredde;
}

/** Hvor høyt lyset når for en båt (laveste x). */
export const lysTopp = (øving: boolean) =>
    T.verden.gammaX - (øving ? T.patrulje.øvingRekkevidde : T.patrulje.rekkevidde);

/** 0-1: hvor hardt spillet presser nå. */
export function press(g: Game): number {
    const kulde = 1 - g.varme / T.varme.maks;
    const båt = g.patrulje ? (g.patrulje.fase === 'lyser' ? 1 : 0.6) : 0;
    const ved = 1 - Math.min(1, (g.stabel + g.fang) / 8);
    return Math.min(1, 0.4 * kulde + 0.25 * båt + 0.15 * ved + 0.2 * andel(g));
}

export function rang(dager: number): string {
    let r = T.ranger[0][1];
    for (const [d, navn] of T.ranger) if (dager >= d) r = navn;
    return r;
}

export function nesteRang(dager: number): [number, string] | null {
    for (const [d, navn] of T.ranger) if (dager < d) return [d, navn];
    return null;
}
