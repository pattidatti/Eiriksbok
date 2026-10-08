// Hvor lang tid ting tar å si. Én kilde for både avspilleren og programplanen.
//
// Kringkastingen (kringkasting.ts) regner ut hvor langt en forelesning har kommet
// ut fra klokka. Da må planen og avspilleren være enige om hvor lenge hvert segment
// varer, ellers sier klokka «segment 12» mens foreleseren er på 9. Derfor bor alle
// varigheter her, og både nettleseren og scripts/generate-forelesninger.mts bruker dem.
// Rene funksjoner, ingen DOM.

import type { Forelesning, Segment } from './types';

/** Tempoet eieren valgte i stemmetesten (2026-10-08). */
export const TEMPO = 1.1;

/** Anslått taletempo ved TEMPO. Tekstmodus snakker nøyaktig så fort. */
export const ORD_PER_MINUTT = 150 * TEMPO;

/** Pause mellom segmentene, og ekstra pause når lysbildet byttes. */
export const PAUSE_MS = 380;
export const PAUSE_NYTT_LYSBILDE_MS = 450;

/** Friminutt mellom to forelesninger i samme sal. */
export const FRIMINUTT_MS = 60_000;

/** Ordene i en tekst med posisjon. */
export function ordIndekser(tekst: string): { index: number; lengde: number }[] {
    const ut: { index: number; lengde: number }[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tekst))) ut.push({ index: m.index, lengde: m[0].length });
    return ut;
}

/** Hvor lenge et ord tar å si, i ms. Lange ord tar lengre tid; tegnsetting gir pause. */
export function ordVarighet(ord: string): number {
    const base = 60000 / ORD_PER_MINUTT;
    const lengde = Math.max(0.6, Math.min(1.8, ord.length / 5));
    const pause = /[.!?]$/.test(ord) ? 260 : /[,:;]$/.test(ord) ? 140 : 0;
    return base * lengde + pause;
}

/** Hvor lenge selve talen i et segment varer, uten pausen etter. */
export function taleVarighet(tekst: string): number {
    let t = 0;
    for (const o of ordIndekser(tekst)) t += ordVarighet(tekst.slice(o.index, o.index + o.lengde));
    return t;
}

/** Pausen etter et segment, før det neste begynner. */
export function pauseEtter(neste: Segment | undefined): number {
    return PAUSE_MS + (neste?.lysbilde ? PAUSE_NYTT_LYSBILDE_MS : 0);
}

/** Når hvert segment starter, i ms fra forelesningens start, og total varighet. */
export function segmentTider(f: Pick<Forelesning, 'segmenter'>): { starter: number[]; total: number } {
    const starter: number[] = [];
    let t = 0;
    f.segmenter.forEach((s, i) => {
        starter.push(t);
        t += taleVarighet(s.si) + pauseEtter(f.segmenter[i + 1]);
    });
    return { starter, total: Math.round(t) };
}
