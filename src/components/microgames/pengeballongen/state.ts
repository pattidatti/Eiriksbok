// Typene og en ny runde. Ingen regler her.

import { brettFor, type FunnId } from './levels';
import { bakke, lagTerreng, tidFor, veiVed, type Terreng } from './terrain';
import { TUNING } from './tuning';

export type Årsak = 'fjell' | 'valg';

export type Hendelse =
    | { slag: 'brett'; brett: number }
    | { slag: 'valg'; år: number; ekte: boolean; brukt: number; hatt: boolean }
    | { slag: 'stemtUt'; år: number; brukt: number }
    | { slag: 'funn'; id: FunnId }
    | { slag: 'ganger'; ganger: number; fra: number }
    | { slag: 'veiskille'; vei: 'over' | 'under'; hatt: boolean; konge: boolean }
    | { slag: 'krasj' }
    | { slag: 'sjanse'; årsak: Årsak; år: number; tilbake: number; straff: number }
    | { slag: 'stemme'; verdi: number }
    | { slag: 'roret' }
    | { slag: 'landet' };

/** Det som lagres ved hvert valgflagg fra 1833, så en ny sjanse starter der. */
export interface Sjekkpunkt {
    t: number;
    år: number;
    y: number;
    nesteValg: number;
    nesteVp: number;
    hatter: number;
    kongeHatter: number;
    spart: number;
    brukt: number;
    perioder: number;
    spor: number;
}

export interface Game {
    seed: number;
    ter: Terreng;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    /** Spilte sekunder (fra 1815, også når runden starter senere). */
    t: number;
    /** Når runden startet (t). Øving fra 1870 starter midt i. */
    start: number;
    /** Øvingsrunde («Øv fra 1870»): teller ikke for rekord. */
    øving: boolean;
    år: number;
    brett: number;
    /** Hvor langt ballongen har kommet (verdens-x for ballongen). */
    x: number;
    /** Bunnen av kurven (skjerm-y, 540 er bunnen). */
    y: number;
    vy: number;
    /** 0-1: hvor varm ballongen er (følger knappen med forsinkelse). */
    varme: number;
    /** Holder eleven knappen nå? */
    hold: boolean;
    /** Styrer eleven ned med roret (bare etter riksretten)? */
    ror: boolean;
    /** Har eleven roret (fra 1884)? */
    harRor: boolean;
    /** Ola-boka er tatt: brenneren er billigere resten av runden. */
    olaboka: boolean;
    /** Nye sjanser igjen, og forrige valgflagg. */
    sjanser: number;
    sjekk: Sjekkpunkt | null;
    /** Når ballongen sist startet (rolig start, også etter en ny sjanse). */
    rolig: number;
    /** Stemmer tatt i rorstrekket. */
    stemmer: number;
    /** Brukt totalt, og siden forrige valg (pengestabelen). */
    brukt: number;
    periode: number;
    /** Poengene: pengene du ikke brukte. */
    spart: number;
    ganger: number;
    gangerTid: number;
    /** Summen av ganger x sekunder fra 1833 (snittet måles av simuleringen). */
    gangerSum: number;
    gangerTidSum: number;
    /** Alle flosshatter om bord (tyngden). */
    hatter: number;
    /** Hattene fra kongeveien: hver gjør brenneren dyrere. */
    kongeHatter: number;
    /** Sekunder over båndet siden gangeren sist falt et trinn. */
    fallTid: number;
    /** Brukt i hver ekte valgperiode (til analysen og «Dette skjedde»). */
    perioder: { år: number; brukt: number }[];
    /** Neste valg i ter.valg. */
    nesteValg: number;
    /** Neste valgpunkt som ikke er telt. */
    nesteVp: number;
    valg: number;
    funn: FunnId[];
    /** Er stabelen i margen tatt i bruk (fra 1824)? */
    stabel: boolean;
    hendelser: Hendelse[];
    /** Høyden per 8 px vei (spøkelsesballongen). */
    spor: number[];
}

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function newGame(seed: number, fraÅr?: number): Game {
    const g = lagGame(seed);
    if (fraÅr) hoppTil(g, fraÅr);
    return g;
}

/** Øving: start runden i et senere år, med alt som har skjedd før lagt inn. */
function hoppTil(g: Game, år: number) {
    const ter = g.ter;
    g.øving = true;
    g.t = g.start = g.rolig = tidFor(år);
    g.år = år;
    g.x = veiVed(g.t);
    g.brett = brettFor(år);
    g.y = bakke(ter, g.x) - 150;
    g.stabel = true;
    g.nesteValg = ter.valg.findIndex((v) => v.x > g.x);
    if (g.nesteValg < 0) g.nesteValg = ter.valg.length;
    g.hatter = ter.valg.filter((v) => v.år >= TUNING.penger.hattFra && v.x <= g.x).length;
    const vp = ter.valgpunkter.findIndex((p) => p >= g.x + 640);
    g.nesteVp = vp < 0 ? ter.valgpunkter.length : vp;
    for (const k of ter.knauser) if (k.x1 < g.x) k.valgt = 'under';
    for (const f of ter.funn) if (f.x < g.x) f.tatt = true;
    g.olaboka = true;
    for (let i = 0; i <= g.x / 8; i++) g.spor.push(g.y);
}

function lagGame(seed: number): Game {
    return {
        seed,
        ter: lagTerreng(mulberry(seed)),
        mode: 'play',
        årsak: null,
        t: 0,
        start: 0,
        øving: false,
        år: TUNING.år.start,
        brett: 0,
        x: 0,
        y: TUNING.ballong.startY,
        vy: 0,
        varme: 0,
        hold: false,
        ror: false,
        harRor: false,
        olaboka: false,
        sjanser: TUNING.sjekk.sjanser,
        sjekk: null,
        rolig: 0,
        stemmer: 0,
        brukt: 0,
        periode: 0,
        spart: 0,
        ganger: 1,
        gangerTid: 0,
        gangerSum: 0,
        gangerTidSum: 0,
        hatter: 0,
        kongeHatter: 0,
        fallTid: 0,
        perioder: [],
        nesteValg: 0,
        nesteVp: 0,
        valg: 0,
        funn: [],
        stabel: false,
        hendelser: [],
        spor: [],
    };
}
