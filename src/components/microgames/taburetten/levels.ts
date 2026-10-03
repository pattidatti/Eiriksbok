// Brettene og manuset i kampanjen (punkt 11 i briefen), som data.
// Tider er sekunder spilt. Bannerne treffer stolen på `t` og vises `TUNING.banner.varsel` før.

export type Farge = 'rød' | 'blå';
export type HType = 'kjerre' | 'lav' | 'middels' | 'tråd';

export interface Passasjer {
    navn: string;
    farge: Farge;
}

export const SELMER: Passasjer = { navn: 'Selmer', farge: 'blå' };
export const SCHWEIGAARD: Passasjer = { navn: 'Schweigaard', farge: 'blå' };
export const SVERDRUP: Passasjer = { navn: 'Sverdrup', farge: 'rød' };
/** Frispillet: tenkte regjeringer, ingen oppdiktede navn. */
export const FRI_PASSASJER: Record<Farge, Passasjer> = {
    rød: { navn: 'Venstre-mann', farge: 'rød' },
    blå: { navn: 'Høyre-mann', farge: 'blå' },
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
    | { t: number; type: 'lapp'; tekst: string }
    | {
          t: number;
          type: 'banner';
          tekst: string;
          /** Røde seter etter banneret (uendret om flertallet ikke flytter seg). */
          rødt: number;
          /** Fjerner kongens vern (dommen i riksretten). */
          dom?: boolean;
          /** Seiersbanneret: Sverdrup i stolen etter dette = seier. */
          seier?: boolean;
      }
    | { t: number; type: 'innsett'; passasjer: Passasjer; tekst: string }
    | { t: number; type: 'kø'; passasjer: Passasjer; tekst: string }
    | { t: number; type: 'nedtelling'; tekst: string; til: number };

export const MANUS: Manus[] = [
    {
        t: 1.5,
        type: 'lapp',
        tekst: 'Venstre har flertallet. Men kongen velger regjeringen, og livgarden hans bærer Selmer.',
    },
    { t: 22, type: 'banner', tekst: 'Valget 1882: 83 rødt', rødt: 83 },
    { t: 25, type: 'nedtelling', tekst: 'Dommen 27. februar 1884', til: 33 },
    {
        t: 33,
        type: 'banner',
        tekst: 'Dommen: Selmer må gå',
        rødt: 83,
        dom: true,
    },
    {
        t: 39,
        type: 'innsett',
        passasjer: SCHWEIGAARD,
        tekst: '3. april: Kongen prøver igjen. Heller ikke Schweigaard har flertallet.',
    },
    { t: 45, type: 'kø', passasjer: SVERDRUP, tekst: 'Bytt når banneret treffer stolen.' },
    {
        t: 49.5,
        type: 'banner',
        tekst: 'Sverdrup danner regjering',
        rødt: 83,
        seier: true,
    },
];

/** Etter seieren: det første tenkte valget snur ikke flertallet (fella), det andre snur. */
export const FRI_FØRSTE = [false, true];
