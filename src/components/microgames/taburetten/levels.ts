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
    /** Starter når så mange sekunder er spilt. */
    fra: number;
    /** Farten mengden bærer stolen med (m/s). */
    marsj: number;
    /** Sekunder mellom hindringene. */
    hindringHver: number;
    typer: HType[];
    /** Et avisark mellom hver hindring. */
    ark: boolean;
}

export const BRETT: Brett[] = [
    {
        navn: 'Selmers stol',
        år: '1880-1882',
        fra: 0,
        marsj: 5,
        hindringHver: 4,
        typer: ['lav'],
        ark: true,
    },
    {
        navn: 'Riksretten',
        år: '1883-1884',
        fra: 25,
        marsj: 5.5,
        hindringHver: 6,
        typer: ['kjerre'],
        ark: true,
    },
    {
        navn: 'Sverdrup',
        år: 'juni 1884',
        fra: 45,
        marsj: 6,
        hindringHver: 4.5,
        typer: ['kjerre'],
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

/** Lappene (teksten står i texts.ts under samme nøkkel). */
export const MANUS: Manus[] = [
    { t: 1, type: 'lapp', nøkkel: 'hold' },
    { t: 7, type: 'lapp', nøkkel: 'vern' },
    { t: 22, type: 'banner', tekst: 'Valget 1882', rødt: 83 },
    { t: 25, type: 'nedtelling', tekst: 'Dommen 27. februar 1884', til: 33 },
    { t: 33, type: 'banner', tekst: 'Dommen i riksretten', rødt: 83, dom: true },
    // Fella: kongens nye mann er også blå. Den som bytter av vane, synker fortere.
    { t: 40, type: 'banner', tekst: '3. april: Schweigaard', rødt: 83, passasjer: SCHWEIGAARD },
    {
        t: 50,
        type: 'banner',
        tekst: '26. juni: Sverdrup',
        rødt: 83,
        passasjer: SVERDRUP,
        seier: true,
    },
];

/** Etter seieren: det første tenkte valget snur ikke flertallet (fella), det andre snur. */
export const FRI_FØRSTE = [false, true];

/** Datoen i masthodet (kalenderen), etter spilt tid i kampanjen. */
export const KALENDER: { fra: number; tekst: string }[] = [
    { fra: 0, tekst: 'Våren 1882' },
    { fra: 22, tekst: 'Høsten 1882' },
    { fra: 25, tekst: 'Februar 1884' },
    { fra: 33, tekst: '27. februar 1884' },
    { fra: 36, tekst: 'Mars 1884' },
    { fra: 40, tekst: '3. april 1884' },
    { fra: 43, tekst: 'Juni 1884' },
    { fra: 50, tekst: '26. juni 1884' },
];
