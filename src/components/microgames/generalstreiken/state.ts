// Typene og en ny runde. Ingen regler her - de står i rules.ts og game.ts.

import { BRETT, type Brett } from './levels';
import { TUNING } from './tuning';

export type Retning = 'opp' | 'ned' | 'venstre' | 'høyre';
export const DX: Record<Retning, [number, number]> = {
    opp: [0, -1],
    ned: [0, 1],
    venstre: [-1, 0],
    høyre: [1, 0],
};
export const MOTSATT: Record<Retning, Retning> = {
    opp: 'ned',
    ned: 'opp',
    venstre: 'høyre',
    høyre: 'venstre',
};

export interface Fabrikk {
    x: number;
    y: number;
    verdi: number;
    navn: string | null;
    /** Regionen fabrikken dukket opp i (null for navngitte og for fabrikker etter Grenelle). */
    region: string | null;
    født: number;
    /** x2 til dette tidspunktet (brett-sekunder), ellers -1. */
    x2Til: number;
}

export type Årsak = 'bølgen' | 'frist' | 'splittet' | 'forLite' | 'stille';

/** Det som skjedde dette steget, for visning og lyd (tømmes av komponenten). */
export type Hendelse =
    | { k: 'hekt'; x: number; y: number; verdi: number; navn: string | null; x2: boolean }
    | {
          k: 'krasj';
          mistet: number;
          ledd: number;
          x: number;
          y: number;
          celler: { x: number; y: number }[];
      }
    | { k: 'grenelle' }
    | { k: 'spist'; mistet: number; x: number; y: number }
    | { k: 'varsel' }
    | { k: 'byks'; ledd: number }
    | { k: 'brett'; nr: number }
    | { k: 'tv'; steder: { x: number; y: number }[]; verdi: number };

export interface Game {
    seed: number;
    rng: () => number;
    /** Brettet som spilles nå (indeks i BRETT). */
    bi: number;
    brett: Brett;
    /** 'play' = i gang, 'kort' = plakat mellom brett, 'won'/'lost' = runden er avgjort. */
    mode: 'play' | 'kort' | 'won' | 'lost';
    årsak: Årsak | null;
    /** Spilte sekunder totalt og på dette brettet. */
    t: number;
    bt: number;
    kortIgjen: number;
    /** Hodet og kjeden (body[0] er nærmest hodet). verdi[i] hører til body[i]. */
    hode: { x: number; y: number };
    body: { x: number; y: number }[];
    verdi: number[];
    retning: Retning;
    kø: Retning[];
    /** Hvor langt hodet har kommet mot neste rute (0-1). */
    steg: number;
    fabrikker: Fabrikk[];
    brukteNavn: Set<string>;
    /** Grenelle trykket: tidspunktet (brett-sekunder), ellers null. */
    grenelle: number | null;
    /** Brøkdel av et ledd bølgen har spist på. */
    bølgeRest: number;
    /** Millioner ved AVSLUTT på hvert brett (brett 1: målet). */
    resultat: number[];
    sisteHekt: number;
    /** Fabrikker tatt siden Grenelle (bølgen blir raskere for hver). */
    etterN: number;
    /** Millioner som er vunnet for godt: delen av de spiste leddene bølgen ikke tok. */
    bevart: number;
    toppMillioner: number;
    /** Ledd kjeden skal vokse med de neste stegene (brett med leddPer > 1). */
    vekst: number;
    /** Verdien hvert av vekst-leddene får. */
    vekstVerdi: number;
    /** Regionen forrige fabrikk dukket opp i (etter Grenelle: neste i en annen). */
    sisteRegion: string | null;
    /** Neste byks i bølgen (brett-sekunder), og om varselet er gitt. */
    byksNeste: number;
    byksVarslet: boolean;
    /** Bølgens fart til neste byks ganges med dette (tilfeldig, se TUNING.slump). */
    bølgeFaktor: number;
    /** TV-kvelden (brett 3) er sendt. */
    tvSendt: boolean;
    /** Krasj i egen kjede på dette brettet. */
    krasj: number;
    valg: number;
    hendelser: Hendelse[];
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

/** Ny runde på brett `bi` (0 = brett 1). Sim og selvspill starter alltid på 0. */
export function newGame(seed: number, bi = 0): Game {
    const g = {
        seed,
        rng: mulberry(seed),
        resultat: [],
        t: 0,
        valg: 0,
        hendelser: [],
    } as unknown as Game;
    startBrett(g, bi);
    return g;
}

/** Nullstiller kjeden og kartet for brett `bi`. Totaltid, valg og resultater beholdes. */
export function startBrett(g: Game, bi: number) {
    const b = BRETT[bi];
    g.bi = bi;
    g.brett = b;
    g.mode = 'play';
    g.årsak = null;
    g.bt = 0;
    g.kortIgjen = 0;
    g.hode = { ...b.paris };
    g.body = [];
    g.verdi = [];
    for (let i = 1; i <= TUNING.start.ledd; i++) {
        g.body.push({ x: b.paris.x - i, y: b.paris.y });
        g.verdi.push(TUNING.start.verdi);
    }
    g.retning = 'høyre';
    g.kø = [];
    g.steg = 0;
    g.fabrikker = [];
    g.brukteNavn = new Set();
    g.grenelle = null;
    g.bølgeRest = 0;
    g.sisteHekt = -99;
    g.etterN = 0;
    g.bevart = 0;
    g.toppMillioner = 0;
    g.vekst = 0;
    g.vekstVerdi = 0;
    g.sisteRegion = null;
    g.byksNeste = Infinity;
    g.byksVarslet = false;
    g.bølgeFaktor = 1;
    g.tvSendt = false;
    g.krasj = 0;
}
