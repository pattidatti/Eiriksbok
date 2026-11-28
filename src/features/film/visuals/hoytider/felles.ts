/**
 * Felles for høytidsfilmen: farger, datoregning og modellen bak kurvene.
 * Alle datoer er dag i året (0 = 1. januar, 364 = 31. desember) i et vanlig år på 365 dager.
 */

export const FARGE = {
    mane: '#7c3aed',
    sol: '#d97706',
    begge: '#0f766e',
    islam: '#059669',
    jodedom: '#2563eb',
    kristen: '#4f46e5',
    india: '#db2777',
    sikh: '#ea580c',
    buddha: '#ca8a04',
    nyere: '#9333ea',
    rod: '#dc2626',
    tekst: '#0f172a',
    dempet: '#64748b',
} as const;

export const MANEDER = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mai',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'des',
];
const DAGER = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Første dag i hver måned. */
export const MANEDSTART = DAGER.reduce<number[]>((acc, _d, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + DAGER[i - 1]);
    return acc;
}, []);

/** Dag i året for en dato (måned 1-12). */
export function dag(maned: number, dato: number) {
    return MANEDSTART[maned - 1] + dato - 1;
}

/** Bringer en dag inn i 0..365. */
export function rundt(d: number) {
    return ((d % 365) + 365) % 365;
}

/**
 * Skuddårene i en nittenårsperiode med måne-og-sol-kalender (sju av nitten). Modellen:
 * datoen sklir 11 dager bakover hvert år, og et skuddår skyver den 30 dager fram igjen.
 */
const SKUDD = [3, 6, 8, 11, 14, 17, 19];

export function erSkuddAar(aar: number) {
    return SKUDD.includes(((aar - 1) % 19) + 1);
}

/** Dag i året for en høytid i en måne-og-sol-kalender, år 1, 2, 3 ... */
export function maneSol(start: number, aar: number) {
    let skudd = 0;
    for (let n = 1; n <= aar; n++) if (erSkuddAar(n)) skudd++;
    return start - 11 * (aar - 1) + 30 * skudd;
}

/** Bare måne: 11 dager bakover hvert år, rundt og rundt. */
export function bareMane(start: number, aar: number) {
    return rundt(start - 11 * (aar - 1));
}

/** Demper en verdi mot et mål (bruk i useFrame). */
export function damp(fra: number, til: number, dt: number, fart = 1.3) {
    return fra + (til - fra) * (1 - Math.exp(-fart * dt));
}
