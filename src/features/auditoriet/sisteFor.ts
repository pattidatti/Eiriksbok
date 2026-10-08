import type { Forelesning, Lysbilde, Segment } from './types';

/** Det siste feltet (lysbilde, humør) satt i eller før segment `i`. Et lysbilde står til neste bytter det. */
export function sisteFor<T>(f: Forelesning, i: number, hent: (s: Segment) => T | undefined): T | undefined {
    for (let j = Math.min(i, f.segmenter.length - 1); j >= 0; j--) {
        const v = hent(f.segmenter[j]);
        if (v !== undefined) return v;
    }
    return undefined;
}

/** Overskriften på et lysbilde, til notater. */
export function lysbildeOverskrift(l: Lysbilde | undefined): string | undefined {
    if (!l) return undefined;
    switch (l.type) {
        case 'tittel':
            return l.tekst;
        case 'punkter':
        case 'tidslinje':
        case 'kart':
        case 'fakta':
            return l.tittel;
        case 'aarstall':
            return l.aar;
        case 'ord':
            return l.ord;
        default:
            return undefined;
    }
}
