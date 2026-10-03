// Tilstanden i Taburetten. Ren data uten React, så simuleringen og nettleseren deler den.

import { seeded, type Rng } from '../sim';
import { RØDT_START, SELMER, type Farge, type HType, type Passasjer } from './levels';
import { TUNING } from './tuning';

export type Årsak = 'gata' | 'hindring';

export interface Hindring {
    x: number;
    type: HType;
    /** Toppen over brosteinen (kjerre, lav, middels). */
    topp: number;
    /** Bunnen av en telegraftråd (stolen må under). */
    bunn: number;
    forbi: boolean;
}

export interface Ark {
    x: number;
    y: number;
    tatt: boolean;
}

/** Kongens øy før dommen: livgarden bærer stolen mellom x0 og x1. */
export interface Øy {
    x0: number;
    x1: number;
}

export interface Banner {
    /** Når banneret treffer stolen (spilt tid). */
    t: number;
    tekst: string;
    rødt: number;
    /** Kandidaten som løper med banneret (null = bare et valg eller en dom). */
    passasjer: Passasjer | null;
    /** Eleven har tatt kandidaten. */
    tatt: boolean;
    dom: boolean;
    seier: boolean;
    /** Snur banneret hvem som har flertallet? */
    snur: boolean;
    vist: boolean;
    truffet: boolean;
}

/** Det spillet vil vise eleven. Komponenten tømmer lista hver frame. */
export type Ut =
    | { type: 'lapp'; nøkkel: string }
    | { type: 'banner'; tekst: string; farge: Farge | null; navn: string | null }
    | { type: 'nedtelling'; tekst: string }
    | { type: 'fin'; mult: number }
    | { type: 'dunk' | 'ark' | 'dom' | 'seier' | 'øy' | 'gap' | 'smell' }
    | { type: 'perfekt' | 'bytte' | 'unødvendig' | 'feil'; navn: string; farge: Farge }
    | { type: 'tap'; årsak: Årsak };

export interface Game {
    rng: Rng;
    t: number;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    /** Frispill etter seieren. */
    fri: boolean;

    // Stolen
    x: number;
    y: number;
    vx: number;
    vy: number;
    luft: boolean;
    hold: boolean;
    sForrige: number;

    // Hendene (løftet fra stripa)
    base: number;
    amp: number;
    rødt: number;
    vern: boolean;

    // Passasjerene
    stol: Passasjer;
    /** Den forrige som satt (flyr av i en bue i visningen). */
    forrige: Passasjer | null;
    /** Sekunder den som sitter har sittet. */
    sitteTid: number;
    lengsteRegjering: number;
    /** Når siste bytte skjedde (spilt tid), for perfekt-vinduet. */
    sisteBytte: number;
    /** Sekunder Sverdrup har sittet etter seiersbanneret. */
    seierKlokke: number;

    // Poeng
    poeng: number;
    meter: number;
    mult: number;
    kombo: number;
    /** Perfekte bytter på rad («Hør, hør!»). */
    perfektRekke: number;
    fine: number;
    dunk: number;
    arkTatt: number;
    perfekte: number;
    valg: number;

    // Verden
    brett: number;
    manus: number;
    hindringer: Hindring[];
    øyer: Øy[];
    /** Der neste øy begynner. */
    nesteØy: number;
    /** Stolen er på en øy nå (for overgangene i visningen). */
    påØy: boolean;
    ark: Ark[];
    bannere: Banner[];
    nesteHindring: number;
    nedtelling: { tekst: string; til: number } | null;

    // Frispillet
    friNr: number;
    nesteFri: number;
    synkFart: number;
    perfektVindu: number;

    ut: Ut[];
}

export const SETER = 114;
export const FLERTALL = 58;

export function newGame(seed: number): Game {
    const H = TUNING.hender;
    return {
        rng: seeded(seed),
        t: 0,
        mode: 'play',
        årsak: null,
        fri: false,
        x: 0,
        y: H.vernHøyde,
        vx: 5,
        vy: 0,
        luft: false,
        hold: false,
        sForrige: 0,
        base: H.vernHøyde,
        amp: H.vernAmp,
        rødt: RØDT_START,
        vern: true,
        stol: SELMER,
        forrige: null,
        sitteTid: 0,
        lengsteRegjering: 0,
        sisteBytte: -99,
        seierKlokke: 0,
        poeng: 0,
        meter: 0,
        mult: 1,
        kombo: 0,
        perfektRekke: 0,
        fine: 0,
        dunk: 0,
        arkTatt: 0,
        perfekte: 0,
        valg: 0,
        brett: 0,
        manus: 0,
        hindringer: [],
        øyer: [{ x0: -30, x1: TUNING.øy.førsteSlutt }],
        nesteØy: TUNING.øy.førsteSlutt + TUNING.øy.gapStart + TUNING.øy.gapK * (RØDT_START - 58),
        påØy: true,
        ark: [],
        bannere: [],
        nesteHindring: 2.5,
        nedtelling: null,
        friNr: 0,
        nesteFri: 0,
        synkFart: TUNING.synk.fart,
        perfektVindu: TUNING.bytte.perfektVindu,
        ut: [],
    };
}

/** Har fargen flertall i stripa? */
export function harFlertall(g: Game, f: Farge): boolean {
    const seter = f === 'rød' ? g.rødt : SETER - g.rødt;
    return seter >= FLERTALL;
}

export function flertallsFarge(g: Game): Farge {
    return g.rødt >= FLERTALL ? 'rød' : 'blå';
}
