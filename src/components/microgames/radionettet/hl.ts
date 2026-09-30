// Delt mellom figurene (world.tsx), soldatene (soldiers.tsx) og markeringen (markers.tsx).

/** Markeringen: enheten musa står over, og enheten eleven nettopp klikket eller plasserte. */
export interface Hl {
    hover: number;
    pick: number;
    /** performance.now() / 1000 da den ble klikket. */
    pickT: number;
    /** Den linja går fra (kommandovogna eller en stafett-enhet): lyser opp samtidig med klikket. */
    src: number;
    srcT: number;
}
/** Kommandovogna i markeringen (enhetene har id fra 1). */
export const HQ_ID = -2;
export const HL_PICK = 0.9;
export const hlOn = (h: Hl, id: number) => h.hover === id || (h.pick === id && performance.now() / 1000 - h.pickT < HL_PICK);

/** Retningen figurene peker, så soldatene (soldiers.tsx) snur seg med kanonen de betjener. */
export const unitYaw = new Map<number, number>();
export const enemyYaw = new Map<number, number>();
