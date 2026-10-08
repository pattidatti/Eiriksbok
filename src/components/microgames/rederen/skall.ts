// Faste ting for skallet i RederensKart.tsx: fargetemaet, kvalitetsnivået og tallene for
// hit-stop, frys og hvor oljetallene spretter. Ingen spillregler her.

import type { ArcadeTheme } from '../arcade/tokens';
import { P, SERIF } from './ark';

export const THEME: Partial<ArcadeTheme> = {
    ink: P.blekk,
    paper: '#f0e8d2',
    accent: P.rav,
    cta: P.rav,
    ctaText: P.blekk,
    chip: '#e3d3a8',
    scrim: 'rgba(30,24,16,.66)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: SERIF,
    tracking: '0.02em',
    textCase: 'none',
    radius: 2,
    line: 2,
    drop: 2,
    tilt: -1.5,
    hudText: P.blekk,
    hudStroke: '#f0e8d2',
    bannerTop: '24%',
};

/** Sekunder bildet står frosset med årsaken lyst opp før slutt-skjermen. */
export const FRYS = 2.5;
/**
 * Der tallene for olje spretter opp: en spalte til venstre for regnskapet, under landnavnene,
 * så de aldri dekker stedsnavn, kartusjen eller tallene i regnskapet.
 */
export const PENGER = { x: 630, inn: 150, ut: 185, håret: 222 };
/** Sekunder en oljedråpe bruker fra tønna til båten. */
export const DRÅPE_SEK = 0.8;

/** Kvalitetsnivået: ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. */
export function velgNivå(): 'lav' | 'middels' | 'hoy' {
    try {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        if (q === 'lav' || q === 'middels' || q === 'hoy') return q;
        const kjerner = navigator.hardwareConcurrency ?? 4;
        return kjerner >= 8 ? 'hoy' : kjerner >= 4 ? 'middels' : 'lav';
    } catch {
        return 'lav';
    }
}

/** Hit-stop: så mange sekunder står spillet stille etter et treff (bildet og lyden går videre). */
export const STOPP = { lås: 0.05, kjøp: 0.08, død: 0.12, krakk: 0.25, fredning: 0.15 };
