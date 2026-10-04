// Fagkjernen og grepene. Eleven og robotene bruker de samme funksjonene: styr() og trykk().
//  1. Henger kjeden sammen, vokser streiken (game.ts: krasj i egen kjede kutter alt bak).
//  2. GRENELLE gir høyere verdi på nye fabrikker (og hver ny gir mer enn den forrige), men
//     starter den blå bølgen bakfra, og den blir raskere for hver fabrikk du tar.
//  3. AVSLUTT gjør millionene til reformer. Tar bølgen hodet først, gir brettet 0.

import { BRETT } from './levels';
import { DX, MOTSATT, startBrett, type Fabrikk, type Game, type Retning } from './state';
import { TUNING } from './tuning';

/** Millionene: kjeden pluss delen av de spiste leddene som er vunnet for godt. */
export const millioner = (g: Game) => g.verdi.reduce((s, v) => s + v, g.bevart);

/** Avrundet til én desimal, slik telleren viser det. */
export const tiendeler = (m: number) => Math.round(m * 10) / 10;

export function fart(g: Game) {
    const f = TUNING.fart;
    return Math.min(g.brett.fartTak, f.tak, f.start + f.perLedd * g.body.length);
}

/** Bølgens fart (ledd/s) nå, eller 0 før Grenelle. */
export function bølgeFart(g: Game) {
    if (g.grenelle === null) return 0;
    const b = g.brett.bølge;
    return b.start * Math.pow(b.vekst, g.etterN) + b.økning * (g.bt - g.grenelle);
}

/** Sekunder til bølgen tar hodet med farten den har nå. */
export const bølgeSek = (g: Game) => {
    const f = bølgeFart(g);
    return f > 0 ? bølgeAvstand(g) / f : Infinity;
};

/** Gangetallet på neste fabrikk etter Grenelle: x1, x1,3, x1,6 ... */
export const gangetall = (g: Game) => (g.grenelle === null ? 1 : 1 + TUNING.stige * g.etterN);

/** Ledd mellom bølgefronten og hodet. */
export const bølgeAvstand = (g: Game) => Math.max(0, g.body.length - g.bølgeRest);

/** Retningen hodet får neste steg (siste i køen, ellers nåværende). */
const sisteRetning = (g: Game) => (g.kø.length ? g.kø[g.kø.length - 1] : g.retning);

/** Elevens styregrep: en pil, WASD eller et sveip. Legges i kø, så to raske svinger virker. */
export function styr(g: Game, r: Retning) {
    if (g.mode !== 'play') return;
    const sist = sisteRetning(g);
    if (r === sist || r === MOTSATT[sist]) return;
    if (g.kø.length >= TUNING.kø) return;
    g.kø.push(r);
}

export const kanGrenelle = (g: Game) =>
    g.mode === 'play' &&
    g.brett.knapp &&
    g.grenelle === null &&
    millioner(g) >= TUNING.grenelleFra;
export const kanAvslutte = (g: Game) => g.mode === 'play' && g.grenelle !== null;

export type Knapp = 'grenelle' | 'avslutt' | 'venter' | null;
export function knapp(g: Game): Knapp {
    if (!g.brett.knapp || g.mode !== 'play') return null;
    if (g.grenelle !== null) return 'avslutt';
    return kanGrenelle(g) ? 'grenelle' : 'venter';
}

/** Det ene store trykket: GRENELLE, og etterpå AVSLUTT. Samme knapp. */
export function trykk(g: Game): boolean {
    if (kanGrenelle(g)) {
        g.grenelle = g.bt;
        g.valg++;
        g.hendelser.push({ k: 'grenelle' });
        return true;
    }
    if (kanAvslutte(g)) {
        avslutt(g);
        return true;
    }
    return false;
}

/** Seiersnivået på brett 3: 0 = ingen seier, 1 = delvis, 2 = Grenelle-avtalen, 3 = landet sto stille. */
export const seierNivå = (m: number) => TUNING.seier.filter((s) => m >= s).length;

function avslutt(g: Game) {
    const m = tiendeler(millioner(g));
    g.valg++;
    g.resultat[g.bi] = m;
    if (m < g.brett.mål) {
        g.mode = 'lost';
        g.årsak = 'forLite';
    } else neste(g);
}

/** Brettet er vunnet: kortet mellom brettene, eller seier etter brett 3. */
export function neste(g: Game) {
    if (g.bi >= BRETT.length - 1) {
        g.mode = 'won';
        return;
    }
    g.mode = 'kort';
    g.kortIgjen = TUNING.kortTid;
}

/** Fra kortet til neste brett. */
export function nesteBrett(g: Game) {
    startBrett(g, g.bi + 1);
    g.hendelser.push({ k: 'brett', nr: g.brett.nr });
}

export function tap(g: Game, årsak: NonNullable<Game['årsak']>) {
    if (g.mode !== 'play') return;
    g.mode = 'lost';
    g.årsak = årsak;
    g.resultat[g.bi] = 0;
}

/** Hva en fabrikk er verdt hvis du tar den nå. */
export function verdiFor(g: Game, f: Fabrikk) {
    const fa = TUNING.fabrikk;
    let v = g.grenelle === null ? fa.før : fa.etter;
    if (g.brett.fjernBonus) {
        const b = g.brett;
        const maks = Math.hypot(Math.max(b.paris.x, b.b - b.paris.x), Math.max(b.paris.y, b.h - b.paris.y));
        v += fa.fjernBonus * (fraParis(g, f) / maks);
    }
    v *= gangetall(g);
    if (erX2(g, f)) v *= TUNING.x2.faktor;
    return Math.round(v * 10) / 10;
}

export const fraParis = (g: Game, p: { x: number; y: number }) =>
    Math.hypot(p.x - g.brett.paris.x, p.y - g.brett.paris.y);

export const erX2 = (g: Game, f: Fabrikk) => g.bt < f.x2Til;

/** Dagen i mai på kalenderen (13-30). */
export const dag = (g: Game) => Math.min(30, 13 + Math.floor(g.bt / TUNING.dagSek));

/** Sekunder igjen til de Gaulle-tilhengerne kommer uansett (bare før Grenelle). */
export const fristIgjen = (g: Game) => Math.max(0, g.brett.frist - g.bt);

/** Poeng for hele runden: tiendeler av millioner på hvert brett som ble avsluttet. */
export const poeng = (g: Game) => Math.round(g.resultat.reduce((s, m) => s + (m ?? 0), 0) * 10);

export function press(g: Game) {
    const w = TUNING.press;
    const f = TUNING.fart;
    const fartDel = ((fart(g) - f.start) / (f.tak - f.start)) * w.fart;
    if (g.grenelle === null) {
        const kal = (g.bt / g.brett.frist) * (g.brett.knapp ? w.kalender : w.kalender / 2);
        return Math.min(1, Math.max(fartDel, kal));
    }
    const nær = 1 - Math.min(1, bølgeSek(g) / w.bølgeSek);
    return Math.min(1, Math.max(fartDel, 0.5 + 0.5 * nær));
}

export function rang(m: number) {
    let r = TUNING.ranger[0][1];
    for (const [grense, navn] of TUNING.ranger) if (m >= grense) r = navn;
    return r;
}

export const iRute = (g: Game, x: number, y: number) =>
    x >= 0 && y >= 0 && x < g.brett.b && y < g.brett.h;

export const neste1 = (p: { x: number; y: number }, r: Retning) => ({
    x: p.x + DX[r][0],
    y: p.y + DX[r][1],
});
