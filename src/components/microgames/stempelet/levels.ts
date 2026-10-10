// Brettene: ett år per brett, 1931-1938. Opptrappingen fra designbriefen punkt 11.
// Brett 1 har bare stempelet, brett 2 tar inn tom lomme, brett 3 frimerkearket.
// Fra brett 4 stiger presset bare med antall pass og husleia.

export interface Brett {
    år: number;
    /** Sekunder mellom hvert nye pass. */
    nyHvert: number;
    /** Flest pass på bordet samtidig. */
    maks: number;
    /** Andel pass med tom lomme når de skal fornyes. */
    tom: number;
    /** Kommer det et frimerkeark i løpet av året? */
    frimerke: boolean;
}

export const BRETT: Brett[] = [
    { år: 1931, nyHvert: 7, maks: 5, tom: 0, frimerke: false },
    { år: 1932, nyHvert: 5.5, maks: 6, tom: 0.3, frimerke: false },
    { år: 1933, nyHvert: 4.5, maks: 7, tom: 0.35, frimerke: true },
    { år: 1934, nyHvert: 4, maks: 8, tom: 0.4, frimerke: true },
    { år: 1935, nyHvert: 3.5, maks: 8, tom: 0.42, frimerke: true },
    { år: 1936, nyHvert: 3, maks: 9, tom: 0.45, frimerke: true },
    { år: 1937, nyHvert: 2.6, maks: 10, tom: 0.48, frimerke: true },
    { år: 1938, nyHvert: 2.2, maks: 10, tom: 0.5, frimerke: true },
];

/** De ti plassene på bordet (verdenskoordinater, x mot høyre, z mot eleven). */
export const PLASSER: { x: number; z: number }[] = [
    { x: -1.6, z: -0.7 },
    { x: 0, z: -0.7 },
    { x: 1.6, z: -0.7 },
    { x: -1.6, z: 0.65 },
    { x: 0, z: 0.65 },
    { x: 1.6, z: 0.65 },
    { x: -3.2, z: -0.7 },
    { x: 3.2, z: -0.7 },
    { x: -3.2, z: 0.65 },
    { x: 3.2, z: 0.65 },
];

/** Der frimerkearket legger seg, kassa og venteskuffen. */
export const FRIMERKE_PLASS = { x: 4.7, z: -0.4 };
export const KASSE_PLASS = { x: 4.7, z: 1.5 };
export const SKUFF_PLASS = { x: -4.8, z: 1.2 };

/** Personene på passene. De ti første er arkivkortene (seks fra Russland, fire fra Armenia). */
export const PERSONER: string[] = [
    'SERGEJ',
    'ANAHIT',
    'OLGA',
    'ARAM',
    'NIKOLAJ',
    'SIRANUSH',
    'VERA',
    'ARMEN',
    'BORIS',
    'TATJANA',
    'GRIGOR',
    'LJUDMILA',
    'MIKAEL',
    'IRINA',
    'HAGOP',
    'PAVEL',
    'NARINE',
    'DMITRIJ',
    'SONA',
    'ALEKSEJ',
];
