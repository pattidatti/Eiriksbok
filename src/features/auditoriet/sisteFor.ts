import type { Forelesning, Segment } from './types';

/** Det siste feltet (lysbilde, humør) satt i eller før segment `i`. Et lysbilde står til neste bytter det. */
export function sisteFor<T>(f: Forelesning, i: number, hent: (s: Segment) => T | undefined): T | undefined {
    for (let j = Math.min(i, f.segmenter.length - 1); j >= 0; j--) {
        const v = hent(f.segmenter[j]);
        if (v !== undefined) return v;
    }
    return undefined;
}
