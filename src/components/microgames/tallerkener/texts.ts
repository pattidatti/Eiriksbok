// All tekst i Elleve år: tips ved tap, rangene og sluttlinja.

import { TUNING } from './tuning';
import type { Game } from './state';
import { aarNa } from './rules';

export const TIPS = {
    kiste: 'Skipsskatten og titlene ga for lite til å betale en krig. Karl måtte til slutt kalle inn parlamentet i 1640. Spar parlamentets tallerken til skottene kommer, og bruk den da.',
    parlament:
        'Parlamentet ga penger bare mot mer makt. Tok du tallerkenen for tidlig, hadde du ingen kilder igjen da krigen kom. I 1642 endte striden i borgerkrig.',
} as const;

/** Ranger etter år alene (før første parlamentstallerken). */
export const RANKS: [number, string][] = [
    [0, 'Kronprins'],
    [5, 'Konge'],
    [9, 'Enevoldskonge'],
    [11, 'Like lenge som Karl'],
    [12, 'Lenger enn Karl'],
];

/** År kongen styrte alene: fram til første parlamentstallerken, ellers hele runden. */
export function aarAlene(g: Game): number {
    const slutt = g.forsteParlament ?? Math.floor(aarNa(g));
    return Math.max(0, slutt - TUNING.tid.start);
}

/** År kongen holdt makta totalt. */
export function aarTotalt(g: Game): number {
    return Math.max(0, Math.floor(aarNa(g)) - TUNING.tid.start);
}

export function sluttLinje(g: Game): string {
    return `Du styrte alene i ${aarAlene(g)} år. Karl klarte 11.`;
}
