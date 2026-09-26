// Pikselbudsjett for mikrospill.
//
// Kostnaden ved å tegne et 3D-bilde følger antall piksler, ikke antall
// CSS-piksler. I artikkelspalten (ca. 720×540) er det billig uansett. Men
// spillene åpnes i fullskjerm, og på en bærbar med tett skjerm (XPS 14,
// devicePixelRatio 2) blir det samme spillet 2880×1800 fysiske piksler - fem til
// seks ganger så mye arbeid, med bloom oppå. Eier 2026-09-26: «I artikkelstørrelse
// kjører det bra på XPS 14, men i fullskjerm er det veldig lav fps.»
//
// Derfor velges oppløsningen ut fra et budsjett i piksler: et stort vindu tegnes
// med litt lavere dpr enn et lite, så fullskjerm koster omtrent det samme som
// spalten. Budsjettet justeres opp eller ned etter hvordan maskinen faktisk
// klarer seg (PerformanceMonitor i MicroCanvas).

export const PIXEL_BUDGET = {
    /** Svak maskin eller fallende bildeflyt. */
    low: 0.8e6,
    /** Start: rundt 1366×768 ved dpr 1. */
    normal: 1.25e6,
    /** Maskinen har vist at den har god margin. */
    high: 2.0e6,
} as const;

/**
 * dpr som holder cssW × cssH × dpr² innenfor budsjettet, men aldri over skjermens
 * egen pikseltetthet (skarpere enn skjermen gir ingenting) og aldri under 0,6.
 */
export function budgetDpr(cssW: number, cssH: number, budget: number, maxDpr = 2) {
    const device = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const area = Math.max(1, cssW * cssH);
    const fit = Math.sqrt(budget / area);
    return Math.max(0.6, Math.min(device, maxDpr, fit));
}
