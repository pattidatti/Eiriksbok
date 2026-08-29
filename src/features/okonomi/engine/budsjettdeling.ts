// Pengeliv - hvilke budsjettposter en samboer deler på.
//
// Egen fil, ikke fordi listen er stor, men fordi den må kunne leses av både
// nøkkeltallene og klokka uten at de to må importere hverandre.

import type { BudsjettPostId } from '../types';

/**
 * Utgiftene en samboer deler på. Husleie, strøm, mat, forsikring og
 * abonnementer er husholdningens; mobil, transport, klær og moro er dine
 * egne og blir ikke billigere av at noen flytter inn.
 */
export const DELTE_UTGIFTER: ReadonlySet<BudsjettPostId> = new Set<BudsjettPostId>([
    'husleie',
    'strom',
    'mat',
    'forsikring',
    'abonnementer',
]);
