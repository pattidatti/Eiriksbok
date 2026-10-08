// Å si ett segment: felles for lesesalen (useForelesning) og kringkastingen (useDirekte).
//
// Lar stemmen si teksten, holder `anim` oppdatert for foreleseren (snakker, ord, gest)
// og anslår ordgrensene selv når stemmen ikke melder dem. Får vi én ekte ordgrense,
// stoler vi på stemmen resten av økta.

import type { MutableRefObject } from 'react';
import type { Gest, Humor, Segment } from './types';
import type { Stemme } from './stemme';
import { ordIndekser, ordVarighet } from './tid';

export interface ForelesningAnim {
    snakker: boolean;
    /** Ordet som sies nå: når det startet (performance.now), hvor lenge, hvor mange stavelser. */
    ord: { start: number; varighet: number; stavelser: number } | null;
    gest: { navn: Gest; start: number } | null;
    humor: Humor;
    /** Når lysbildet sist ble byttet (performance.now). */
    lysbildeByttet: number;
}

export const nyAnim = (): ForelesningAnim => ({
    snakker: false,
    ord: null,
    gest: null,
    humor: 'noytral',
    lysbildeByttet: 0,
});

const tellStavelser = (ord: string) => Math.max(1, (ord.match(/[aeiouyæøå]+/gi) ?? []).length);

export function siSegment({
    stemme,
    seg,
    anim,
    ekteOrd,
    onOrd,
    onSlutt,
}: {
    stemme: Stemme;
    seg: Segment;
    anim: ForelesningAnim;
    /** Delt mellom segmentene: sant når stemmen har vist at den melder ord selv. */
    ekteOrd: MutableRefObject<boolean>;
    onOrd: (index: number, lengde: number) => void;
    onSlutt: () => void;
}): () => void {
    const timere: ReturnType<typeof setTimeout>[] = [];
    const rydd = () => {
        timere.forEach(clearTimeout);
        timere.length = 0;
    };
    if (seg.gest) anim.gest = { navn: seg.gest, start: performance.now() };

    const settOrd = (index: number, lengde: number) => {
        const tekst = seg.si.slice(index, index + lengde);
        anim.ord = { start: performance.now(), varighet: ordVarighet(tekst) * 0.9, stavelser: tellStavelser(tekst) };
        onOrd(index, lengde);
    };

    const avbryt = stemme.si(seg.si, {
        onStart: () => {
            anim.snakker = true;
            if (stemme.melderOrd || ekteOrd.current) return;
            let t = 0;
            for (const o of ordIndekser(seg.si)) {
                timere.push(
                    setTimeout(() => {
                        if (!ekteOrd.current) settOrd(o.index, o.lengde);
                    }, t)
                );
                t += ordVarighet(seg.si.slice(o.index, o.index + o.lengde));
            }
        },
        onOrd: (index, lengde) => {
            if (!stemme.melderOrd && !ekteOrd.current) {
                ekteOrd.current = true;
                rydd();
            }
            settOrd(index, lengde);
        },
        onSlutt: () => {
            rydd();
            anim.snakker = false;
            anim.ord = null;
            onSlutt();
        },
    });

    return () => {
        rydd();
        avbryt();
        anim.snakker = false;
        anim.ord = null;
    };
}
