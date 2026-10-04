// Fagkjernen og grepene. Eleven og robotene bruker de samme funksjonene: styr() og trykk().
//  1. Henger kjeden sammen, vokser streiken (game.ts: krasj i egen kjede kutter alt bak).
//  2. GRENELLE starter den blå bølgen bakfra (de Gaulles marsj). Arbeiderne sa nei og streiket
//     videre, så hvert sekund etter GRENELLE vokser gangetallet på hele streiken. Bølgen blir
//     raskere for hver fabrikk du tar, og bytter fart tilfeldig ved hvert byks.
//  3. AVSLUTT gjør millionene til reformer. Tar bølgen hodet først, gir brettet 0.

import { BRETT } from './levels';
import { DX, MOTSATT, startBrett, type Fabrikk, type Game, type Retning } from './state';
import { TUNING } from './tuning';

/** Grunnverdien: kjeden pluss delen av de spiste leddene som er vunnet for godt. */
export const rå = (g: Game) => g.verdi.reduce((s, v) => s + v, g.bevart);

/** Millionene på telleren: grunnverdien ganget med gangetallet etter GRENELLE. */
export const millioner = (g: Game) => rå(g) * gangetall(g);

/** Avrundet til én desimal, slik telleren viser det. */
export const tiendeler = (m: number) => Math.round(m * 10) / 10;

export function fart(g: Game) {
    const f = TUNING.fart;
    return Math.min(g.brett.fartTak, f.tak, f.start + f.perLedd * g.body.length);
}

/**
 * Bølgens snittfart (ledd/s) nå, eller 0 før Grenelle. Delen `kryp` går jevnt, resten
 * kommer i byks (se game.ts), så den faktiske farten er rykkvis.
 */
export function bølgeFart(g: Game) {
    if (g.grenelle === null) return 0;
    const b = g.brett.bølge;
    return (b.start * Math.pow(b.vekst, g.etterN) + b.økning * (g.bt - g.grenelle)) * g.bølgeFaktor;
}

/** Sekunder til bølgen tar hodet med farten den har nå. */
export const bølgeSek = (g: Game) => {
    const f = bølgeFart(g);
    return f > 0 ? bølgeAvstand(g) / f : Infinity;
};

/** Gangetallet på hele streiken: x1 før GRENELLE, så litt mer for hvert sekund, opp til taket. */
export const gangetall = (g: Game) =>
    g.grenelle === null
        ? 1
        : Math.min(TUNING.vent.tak, 1 + TUNING.vent.perSek * (g.bt - g.grenelle));

/** Grovt hvor nær bølgen er: 0 = langt unna, 1 = nærmer seg, 2 = rett bak (ikke et eksakt tall). */
export function nærhet(g: Game): 0 | 1 | 2 {
    if (g.grenelle === null) return 0;
    const sek = bølgeSek(g);
    const ledd = bølgeAvstand(g);
    if (sek < 3.5 || ledd <= 3) return 2;
    if (sek < 8 || ledd <= 7) return 1;
    return 0;
}

/** Sekunder til neste byks i bølgen, tilfeldig mellom `hvert[0]` og `hvert[1]`. */
export function planleggByks(g: Game) {
    const [a, b] = TUNING.byks.hvert;
    g.byksNeste = g.bt + a + g.rng() * (b - a);
    g.byksVarslet = false;
    // Marsjen går ujevnt: ny fart til neste byks, som ingen kan vite på forhånd.
    const [lo, hi] = TUNING.slump;
    g.bølgeFaktor = lo + g.rng() * (hi - lo);
}

/** Blinker bølgen nå (varselet ca. 1 s før et byks)? */
export const byksVarsel = (g: Game) =>
    g.grenelle !== null && g.bt >= g.byksNeste - TUNING.byks.varsel;

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
    g.mode === 'play' && g.brett.knapp && g.grenelle === null && millioner(g) >= TUNING.grenelleFra;
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
        planleggByks(g);
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

/** Hva en fabrikk er verdt på telleren hvis du tar den nå (grunnverdi x gangetallet). */
export const verdiFor = (g: Game, f: Fabrikk) =>
    Math.round(grunnverdi(g, f) * gangetall(g) * 10) / 10;

/** Fabrikkens egen verdi (det som lagres i kjeden). */
export function grunnverdi(g: Game, f: Fabrikk) {
    const fa = TUNING.fabrikk;
    let v = g.grenelle === null ? fa.før : fa.etter;
    if (g.brett.fjernBonus) {
        const b = g.brett;
        const maks = Math.hypot(
            Math.max(b.paris.x, b.b - b.paris.x),
            Math.max(b.paris.y, b.h - b.paris.y)
        );
        v += fa.fjernBonus * (fraParis(g, f) / maks);
    }
    if (erX2(g, f)) v *= TUNING.x2.faktor;
    return v;
}

export const fraParis = (g: Game, p: { x: number; y: number }) =>
    Math.hypot(p.x - g.brett.paris.x, p.y - g.brett.paris.y);

export const erX2 = (g: Game, f: Fabrikk) => g.bt < f.x2Til;

/** Dagen i mai på kalenderen (brett 3 starter 17. mai, fristen er 30.). */
export const dag = (g: Game) => Math.min(30, g.brett.startDag + Math.floor(g.bt / TUNING.dagSek));

/** Hvor langt mai har kommet (0 = 13. mai, 1 = 30. mai): kalenderens del av presset. */
const mai = (g: Game, bt: number) => {
    const forsprang = (g.brett.startDag - 13) * TUNING.dagSek;
    return (bt + forsprang) / (g.brett.frist + forsprang);
};

/** Sekunder igjen til de Gaulle-tilhengerne kommer uansett (bare før Grenelle). */
export const fristIgjen = (g: Game) => Math.max(0, g.brett.frist - g.bt);

/** Poeng for hele runden: tiendeler av millioner på hvert brett som ble avsluttet. */
export const poeng = (g: Game) => Math.round(g.resultat.reduce((s, m) => s + (m ?? 0), 0) * 10);

export function press(g: Game) {
    const w = TUNING.press;
    const f = TUNING.fart;
    const fartDel = ((fart(g) - f.start) / (f.tak - f.start)) * w.fart;
    const vekt = g.brett.knapp ? w.kalender : w.kalender / 2;
    if (g.grenelle === null) {
        const kal = mai(g, g.bt) * vekt;
        return Math.min(1, Math.max(fartDel + w.trangt * trangt(g), kal));
    }
    // Presset faller ikke av å trykke GRENELLE: kalenderen den dagen er et gulv.
    const kalVed = mai(g, g.grenelle) * vekt;
    // Etter GRENELLE: hvor nær bølgen er, og hvor mye som står på spill (gangetallet vokser).
    const nær = 1 - Math.min(1, bølgeSek(g) / w.bølgeSek);
    const innsats = (gangetall(g) - 1) / (TUNING.vent.tak - 1);
    return Math.min(1, Math.max(fartDel, kalVed, 0.45 + 0.55 * Math.max(nær, innsats)));
}

/** 0-1: hvor tett egen kjede ligger rundt hodet (fare for krasj). Ledd innen 2 ruter, ikke de to nærmeste. */
export function trangt(g: Game) {
    let n = 0;
    for (let i = 2; i < g.body.length; i++) {
        const c = g.body[i];
        if (Math.abs(c.x - g.hode.x) <= 2 && Math.abs(c.y - g.hode.y) <= 2) n++;
    }
    return Math.min(1, n / 6);
}

export function rang(m: number) {
    let r = TUNING.ranger[0][1];
    for (const [grense, navn] of TUNING.ranger) if (m >= grense) r = navn;
    return r;
}

export const iRute = (g: Game, x: number, y: number) =>
    x >= 0 && y >= 0 && x < g.brett.b && y < g.brett.h && !g.sperret?.[y * g.brett.b + x];

export const neste1 = (p: { x: number; y: number }, r: Retning) => ({
    x: p.x + DX[r][0],
    y: p.y + DX[r][1],
});
