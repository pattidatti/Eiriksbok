// Kongens øyer før dommen: livgarden bærer en blå stol bare på øyene. Gapet mellom dem
// vokser når stripa flytter seg mot rødt (vernet krymper), og dommen fjerner dem helt.

import type { Game } from './state';
import { TUNING } from './tuning';

const Ø = TUNING.øy;

/** Lengden på gapet etter en øy som legges ut nå. */
export function gap(g: Game): number {
    return Ø.gapStart + Ø.gapK * Math.max(0, g.rødt - 58);
}

/** Legg ut øyer foran stolen så lenge vernet finnes. */
export function nyeØyer(g: Game) {
    if (!g.vern) return;
    while (g.nesteØy < g.x + Ø.foran) {
        const x0 = g.nesteØy;
        g.øyer.push({ x0, x1: x0 + Ø.lengde });
        g.nesteØy = x0 + Ø.lengde + gap(g);
    }
    if (g.øyer.length > 8) g.øyer = g.øyer.filter((ø) => ø.x1 > g.x - 30);
}
