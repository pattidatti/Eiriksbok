// All fast tekst i Elleve år: tips ved tap, linjene ved seier, rangene og sluttlinja.
// Tekst som vises mens eleven spiller, går gjennom useArcadeText i komponenten.

import { TUNING } from './tuning';
import type { Game } from './state';
import { aarNa } from './rules';

/** Tips når runden er tapt før 1640 (hvorfor, og hva Karl gjorde). */
export const TIPS = {
    fred: 'Tallerkenene sto stille, og kista gikk tom før krigen. En konge uten parlament må holde hver kilde i gang selv: sveip over dem som vakler, før de stopper.',
    kiste: 'Skipsskatten og titlene ga for lite til å betale krigen mot skottene. Karl måtte kalle inn parlamentet i 1640. Spar parlamentets tallerken til skottene kommer, og ta den da.',
    parlament:
        'Parlamentet ga penger bare mot mer makt. Tok du tallerkenen for tidlig, hadde du ingen kilder igjen da krigen kom. I 1642 endte striden i borgerkrig.',
} as const;

/** Linja når eleven har nådd 1640 og overtiden er over. */
export function seierLinje(g: Game): string {
    const aar = sluttAar(g);
    if (g.cause === 'parlament')
        return `I ${aar} hadde parlamentet tatt alle stengene. Slik gikk det med Karl også: han mistet makt bit for bit, og i 1642 kom borgerkrigen.`;
    return `I ${aar} ble krigen for dyr. Karl kalte inn parlamentet i 1640, og det tok mer og mer makt fra ham. I 1642 kom borgerkrigen.`;
}

/** Ranger etter år alene (før første parlamentsøkt). Karl klarte 11. */
export const RANKS: [number, string][] = [
    [0, 'Kronprins'],
    [5, 'Konge'],
    [8, 'Enevoldskonge'],
    [10, 'Nesten som Karl'],
    [11, 'Like lenge som Karl'],
    [12, 'Lenger enn Karl'],
];

/** År kongen styrte alene, med én desimal: fram til første parlamentsøkt, ellers hele runden. */
export function aarAlene(g: Game): number {
    const slutt = g.forsteParlamentT !== null ? TUNING.tid.start + g.forsteParlamentT / TUNING.tid.aar : aarNa(g);
    return Math.max(0, Math.floor((slutt - TUNING.tid.start) * 10) / 10);
}

/** Året teppet gikk ned. */
export function sluttAar(g: Game): number {
    return Math.floor(aarNa(g));
}

/** Et tall med norsk desimalkomma (10,4). */
export function fmtAar(n: number): string {
    return n.toFixed(1).replace('.', ',').replace(',0', '');
}

export function sluttLinje(g: Game): string {
    return `Du styrte alene i ${fmtAar(aarAlene(g))} år. Karl klarte 11.`;
}
