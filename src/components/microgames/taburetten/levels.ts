// Brettene og manuset i kampanjen (punkt 11 i briefen), som data.
// Tider er sekunder spilt. Bannerne treffer stolen på `t` og vises `TUNING.banner.varsel` før.

export type Farge = 'rød' | 'blå';
export type HType = 'kjerre' | 'lav' | 'middels' | 'tråd';

/** Karikaturen som tegnes i stolen (tegning.ts). */
export type Figur = 'selmer' | 'schweigaard' | 'sverdrup' | 'venstre' | 'høyre';

export interface Passasjer {
    navn: string;
    farge: Farge;
    figur: Figur;
}

export const SELMER: Passasjer = { navn: 'Selmer', farge: 'blå', figur: 'selmer' };
export const SCHWEIGAARD: Passasjer = { navn: 'Schweigaard', farge: 'blå', figur: 'schweigaard' };
export const SVERDRUP: Passasjer = { navn: 'Sverdrup', farge: 'rød', figur: 'sverdrup' };
/** Frispillet: tenkte regjeringer, ingen oppdiktede navn. */
export const FRI_PASSASJER: Record<Farge, Passasjer> = {
    rød: { navn: 'Venstre-mann', farge: 'rød', figur: 'venstre' },
    blå: { navn: 'Høyre-mann', farge: 'blå', figur: 'høyre' },
};

export interface Brett {
    navn: string;
    år: string;
    /** Farten mengden bærer stolen med (m/s). */
    marsj: number;
    /** Sekunder mellom hindringene. */
    hindringHver: number;
    typer: HType[];
    /** Et avisark mellom hver hindring. */
    ark: boolean;
}

/**
 * Brettene skifter på hendelser, ikke på klokka: valget 1882 (1), dommen (2) og
 * Sverdrup i stolen (3). Etter dommen stiger presset: raskere, og til slutt høye hindringer.
 */
export const BRETT: Brett[] = [
    {
        navn: 'Selmers stol',
        år: '1872-1882',
        marsj: 5,
        hindringHver: 2.8,
        typer: ['lav', 'tråd'],
        ark: true,
    },
    {
        navn: 'Odelstinget',
        år: '1882-1883',
        marsj: 5.5,
        hindringHver: 3.5,
        typer: ['kjerre', 'tråd'],
        ark: true,
    },
    {
        navn: 'Riksretten',
        år: '1884',
        marsj: 8,
        hindringHver: 99,
        typer: ['kjerre'],
        ark: true,
    },
    {
        navn: 'Sverdrup',
        år: 'juni 1884',
        marsj: 10.5,
        hindringHver: 2.1,
        typer: ['middels', 'tråd', 'lav'],
        ark: true,
    },
];

/** Røde seter av 114 fra start (rundt 60 %). */
export const RØDT_START = 68;

export type Manus =
    | { t: number; type: 'lapp'; nøkkel: string }
    | {
          t: number;
          type: 'banner';
          tekst: string;
          /** Røde seter etter banneret (uendret om flertallet ikke flytter seg). */
          rødt: number;
          /** Kandidaten som løper med banneret og kan hoppe opp i stolen (Bytt). */
          passasjer?: Passasjer;
          /** Fjerner kongens vern (dommen i riksretten). */
          dom?: boolean;
          /** Seiersbanneret: Sverdrup i stolen etter dette = seier. */
          seier?: boolean;
      }
    | { t: number; type: 'nedtelling'; tekst: string; til: number };

/** Lappene (teksten står i texts.ts under samme nøkkel). Fram til anklagen. */
export const MANUS: Manus[] = [
    { t: 1, type: 'lapp', nøkkel: 'hold' },
    { t: 7, type: 'lapp', nøkkel: 'vern' },
    { t: 22, type: 'banner', tekst: 'Valget 1882', rødt: 83 },
];

/**
 * Etter anklagen: tidene er sekunder etter at eleven trykket Anklag!.
 * Dommen kommer bare fordi eleven anklaget - ingen nedtelling gjør det for eleven.
 * Ved dommen kastes Selmer av, og kongen setter inn Schweigaard (Aprilministeriet) av seg selv.
 */
export const ETTER_ANKLAG: Manus[] = [
    { t: 3, type: 'banner', tekst: 'Dommen i riksretten', rødt: 83, dom: true },
    { t: 4.2, type: 'lapp', nøkkel: 'april' },
    {
        t: 11,
        type: 'banner',
        tekst: '26. juni: Sverdrup',
        rødt: 83,
        passasjer: SVERDRUP,
        seier: true,
    },
];

/** Etter seieren: det første tenkte valget snur ikke flertallet (fella), det andre snur. */
export const FRI_FØRSTE = [false, true];

/** Datoen i masthodet (kalenderen), etter spilt tid fram til anklagen. */
export const KALENDER: { fra: number; tekst: string }[] = [
    { fra: 0, tekst: '1872: Kongens nei' },
    { fra: 7, tekst: '1880' },
    { fra: 22, tekst: 'Valget 1882' },
];

/** Kalenderen etter anklagen (sekunder etter anklagen). Selmer sitter aldri etter 27.2.1884. */
export const KALENDER_ETTER: { fra: number; tekst: string }[] = [
    { fra: 0, tekst: '23. april 1883' },
    { fra: 1.5, tekst: 'Februar 1884' },
    { fra: 4, tekst: 'April 1884' },
    { fra: 8, tekst: 'Juni 1884' },
    { fra: 11, tekst: '26. juni 1884' },
];
