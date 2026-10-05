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
    aar1649: '',
} as const;

/** Linja når eleven har nådd 1640: hva stengene du beholdt, betydde i borgerkrigen. */
export function seierLinje(g: Game): string {
    const aar = sluttAar(g);
    if (g.cause === 'aar1649')
        return 'Du hadde stenger igjen helt til 1649. Karl hadde ikke det: han tapte borgerkrigen som begynte i 1642.';
    if (g.cause === 'parlament')
        return `Parlamentets hær tok den siste stanga i ${aar}. Jo flere stenger du beholdt i 1640, jo lenger holdt du ut.`;
    return `Kista ble tom i ${aar}. Krigen mot parlamentet kostet mer enn noen konge kunne betale alene.`;
}

/** Ranger etter året du nådde. Karl ga seg i 1640, borgerkrigen kom i 1642, dommen i 1649. */
export const RANKS: [number, string][] = [
    [0, 'Kronprins'],
    [1635, 'Konge uten penger'],
    [1639, 'Konge i krig'],
    [1640, 'Holdt ut som Karl'],
    [1642, 'Konge i borgerkrigen'],
    [1645, 'Seig konge'],
    [1649, 'Holdt ut til 1649'],
];

/** År kongen styrte alene, med én desimal: fram til første parlamentsøkt, ellers hele runden. */
export function aarAlene(g: Game): number {
    const T = TUNING.tid;
    const t = g.forsteParlamentT !== null ? g.forsteParlamentT : g.t;
    const slutt = T.start + Math.min(t, (T.seier - T.start) * T.aar) / T.aar;
    return Math.max(0, Math.floor((slutt - T.start) * 10) / 10);
}

/** Året teppet gikk ned. */
export function sluttAar(g: Game): number {
    return Math.floor(aarNa(g));
}

/** Et tall med norsk desimalkomma (10,4). */
export function fmtAar(n: number): string {
    return n.toFixed(1).replace('.', ',').replace(',0', '');
}

/** Overskriften på slutt-skjermen: året du nådde og stengene du hadde i 1640. */
export function sluttLinje(g: Game): string {
    const aar = sluttAar(g);
    if (!g.won) return `Teppet falt i ${aar}, før du nådde 1640.`;
    const n = g.beholdt1640 ?? 0;
    return `Du nådde 1640 med ${n} ${n === 1 ? 'stang' : 'stenger'}. Teppet falt i ${aar}.`;
}
