// Brettene: ett år per brett, 1931-1938. Opptrappingen fra designbriefen punkt 11.
// Én ny ting per år: 1931 bare stempel og bånd, 1932 gebyret (mynt, tom lomme og kassa),
// 1933 husleia, 1934 frimerkearket.
// Fra brett 4 stiger presset bare med antall pass og husleia.

export interface Brett {
    år: number;
    /** Sekunder mellom hvert nye pass. */
    nyHvert: number;
    /** Flest pass på bordet samtidig. */
    maks: number;
    /** Andel pass med tom lomme når de skal fornyes. */
    tom: number;
    /** Koster eller gir passet penger i år? 1931 har bare stempel og bånd. */
    penger: boolean;
    /** Kommer det et frimerkeark i løpet av året? */
    frimerke: boolean;
    /** En historisk hendelse: mange nye pass på en gang, `ved` sekunder inn i året. */
    bølge?: { antall: number; ved: number };
}

export const BRETT: Brett[] = [
    { år: 1931, nyHvert: 7, maks: 5, tom: 0, penger: false, frimerke: false },
    { år: 1932, nyHvert: 5.5, maks: 6, tom: 0.3, penger: true, frimerke: false },
    { år: 1933, nyHvert: 4.5, maks: 7, tom: 0.35, penger: true, frimerke: false },
    { år: 1934, nyHvert: 4, maks: 8, tom: 0.42, penger: true, frimerke: true },
    { år: 1935, nyHvert: 3.5, maks: 9, tom: 0.45, penger: true, frimerke: true, bølge: { antall: 3, ved: 3 } },
    { år: 1936, nyHvert: 3, maks: 9, tom: 0.5, penger: true, frimerke: true },
    { år: 1937, nyHvert: 2.6, maks: 10, tom: 0.53, penger: true, frimerke: true },
    { år: 1938, nyHvert: 2.2, maks: 10, tom: 0.52, penger: true, frimerke: true },
];

/** De ti plassene på bordet (verdenskoordinater, x mot høyre, z mot eleven). */
export const PLASSER: { x: number; z: number }[] = [
    { x: -1.55, z: 0.62 },
    { x: 0, z: 0.62 },
    { x: 1.55, z: 0.62 },
    { x: -1.55, z: -0.68 },
    { x: 0, z: -0.68 },
    { x: 1.55, z: -0.68 },
    { x: -3.1, z: -0.68 },
    { x: 3.1, z: -0.68 },
    { x: -3.1, z: 0.62 },
    { x: 3.1, z: 0.62 },
];

/** Lomma (gebyrfeltet) på passet, i forhold til midten av passet. Passet er 1,42 x 1. */
export const LOMME = { x: 0.454, z: -0.14 };
export const PASS_MÅL = { b: 1.42, d: 1 };

/** Der frimerkearket legger seg, myntstabelen, husleie-regningen og papirløs-hylla. */
export const FRIMERKE_PLASS = { x: -4.45, z: -0.62 };
export const KASSE_PLASS = { x: 3.0, z: 2.25 };
export const REGNING_PLASS = { x: 4.45, z: -0.62 };
export const SKUFF_PLASS = { x: -3.0, z: 2.2 };
/** Europakartet der landene tennes når passene reiser ut (midt nederst, 3,5 x 1,3). */
export const KART_PLASS = { x: 0, z: 2.15, b: 3.5, d: 1.3 };

/** En person på et pass: navn i versaler, kvinne eller mann (bildet), og hvor personen kom fra. */
export interface Person {
    navn: string;
    kvinne: boolean;
    fra: 'RUSSLAND' | 'ARMENIA' | 'SAAR';
}

const r = (navn: string, kvinne: boolean): Person => ({ navn, kvinne, fra: 'RUSSLAND' });
const a = (navn: string, kvinne: boolean): Person => ({ navn, kvinne, fra: 'ARMENIA' });
const s = (navn: string, kvinne: boolean): Person => ({ navn, kvinne, fra: 'SAAR' });

/**
 * Personene på passene. De ti første er arkivkortene (seks fra Russland, fire fra Armenia).
 * De fire siste kommer bare med bølgen i 1935 (flyktninger fra Saar).
 */
export const PERSONER: Person[] = [
    r('SERGEJ', false),
    a('ANAHIT', true),
    r('OLGA', true),
    a('ARAM', false),
    r('NIKOLAJ', false),
    a('SIRANUSH', true),
    r('VERA', true),
    a('ARMEN', false),
    r('BORIS', false),
    r('TATJANA', true),
    a('GRIGOR', false),
    r('LJUDMILA', true),
    a('MIKAEL', false),
    r('IRINA', true),
    a('HAGOP', false),
    r('PAVEL', false),
    a('NARINE', true),
    r('DMITRIJ', false),
    a('SONA', true),
    r('ALEKSEJ', false),
    s('KARL', false),
    s('MARIA', true),
    s('JOHANN', false),
    s('ELSE', true),
];

/** Vanlige personer (0-19) og bølgen fra Saar (20-23). */
export const VANLIGE = 20;

/**
 * Landene på kartet, i samme rekkefølge som REISEMÅL i texts.ts: midten av hver flis i
 * kartlerretet (700 x 260), lagt grovt geografisk. Genève (kontoret) er startpunktet.
 */
export const LAND: { x: number; y: number }[] = [
    { x: 92, y: 176 }, // Frankrike
    { x: 112, y: 128 }, // Belgia
    { x: 372, y: 176 }, // Jugoslavia
    { x: 600, y: 226 }, // Libanon
    { x: 318, y: 128 }, // Tsjekkoslovakia
    { x: 470, y: 176 }, // Bulgaria
    { x: 196, y: 176 }, // Sveits
    { x: 246, y: 36 }, // Norge
    { x: 440, y: 226 }, // Hellas
    { x: 150, y: 82 }, // Nederland
    { x: 340, y: 36 }, // Sverige
    { x: 252, y: 82 }, // Danmark
    { x: 620, y: 176 }, // Syria
];
export const ANTALL_LAND = 13;
export const GENEVE = { x: 186, y: 192 };
export const KART_LERRET = { w: 700, h: 260 };
