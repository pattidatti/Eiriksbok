/**
 * Finnes det berøringsskjerm? Da skal skjermkontrollen vises.
 *
 * Spillet tok tidligere bare tastatur og håndkontroll. På et nettbrett eller en
 * Chromebook i tablet-modus var det dermed helt uspillbart.
 */
export function harBeroring(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}
