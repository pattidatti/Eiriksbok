// Lesesalen: én forelesning på bestilling, fra start til slutt, med pause og hopp.
// Brukes av lærerlenken (/oving/auditoriet/lesesal?forelesning=...). Salene på
// universitetet går etter klokka i stedet (useDirekte).
//
// To kanaler ut:
//  - React-tilstand (segment, ord, lysbilde, status) til teksting og knapper.
//  - `anim`, en muterbar ref som 3D-scenen leser hvert bilde (munn, gest, humør).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Forelesning, Lysbilde } from './types';
import { nyAnim, siSegment, type ForelesningAnim } from './siSegment';
import { useStemme } from './useStemme';
import { pauseEtter } from './tid';
import { sisteFor } from './sisteFor';

export type Status = 'klar' | 'spiller' | 'pause' | 'ferdig';
export type { ForelesningAnim };

export function useForelesning(forelesning: Forelesning | null) {
    const [status, setStatus] = useState<Status>('klar');
    const [indeks, setIndeks] = useState(0);
    const [ord, setOrd] = useState<{ index: number; lengde: number } | null>(null);
    const stemme = useStemme();

    const anim = useRef<ForelesningAnim>(nyAnim());
    const avbrytRef = useRef<(() => void) | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef<Status>('klar');
    const ekteOrd = useRef(false);

    const settStatus = (s: Status) => {
        statusRef.current = s;
        setStatus(s);
    };

    const stoppTale = useCallback(() => {
        avbrytRef.current?.();
        avbrytRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        setOrd(null);
    }, []);

    const spillSegmentRef = useRef<(i: number) => void>(() => {});

    const spillSegment = useCallback(
        (i: number) => {
            if (!forelesning) return;
            stoppTale();
            if (i >= forelesning.segmenter.length) {
                settStatus('ferdig');
                anim.current.gest = { navn: 'nikke', start: performance.now() };
                return;
            }
            const seg = forelesning.segmenter[i];
            setIndeks(i);
            if (seg.lysbilde) anim.current.lysbildeByttet = performance.now();
            anim.current.humor = sisteFor(forelesning, i, (s) => s.humor) ?? 'noytral';

            avbrytRef.current = siSegment({
                stemme: stemme.ref.current,
                seg,
                anim: anim.current,
                ekteOrd,
                onOrd: (index, lengde) => setOrd({ index, lengde }),
                onSlutt: () => {
                    setOrd(null);
                    if (statusRef.current !== 'spiller') return;
                    timerRef.current = setTimeout(
                        () => spillSegmentRef.current(i + 1),
                        pauseEtter(forelesning.segmenter[i + 1])
                    );
                },
            });
        },
        [forelesning, stoppTale, stemme.ref]
    );

    useEffect(() => {
        spillSegmentRef.current = spillSegment;
    }, [spillSegment]);

    useEffect(() => stoppTale, [stoppTale]);

    const start = useCallback(
        (fra = 0) => {
            settStatus('spiller');
            spillSegment(fra);
        },
        [spillSegment]
    );

    const pause = useCallback(() => {
        if (statusRef.current !== 'spiller') return;
        settStatus('pause');
        stoppTale();
    }, [stoppTale]);

    /** Fortsetter fra starten av segmentet som ble avbrutt. */
    const fortsett = useCallback(() => start(indeks), [start, indeks]);

    const hopp = useCallback(
        (delta: number) => {
            if (!forelesning) return;
            const mal = Math.max(0, Math.min(forelesning.segmenter.length - 1, indeks + delta));
            if (statusRef.current === 'spiller') spillSegment(mal);
            else {
                stoppTale();
                setIndeks(mal);
                anim.current.lysbildeByttet = performance.now();
            }
        },
        [forelesning, indeks, spillSegment, stoppTale]
    );

    const byttLyd = useCallback(() => {
        const varSpiller = statusRef.current === 'spiller';
        stoppTale();
        if (varSpiller) settStatus('pause');
        stemme.byttLyd();
    }, [stoppTale, stemme]);

    const lysbilde: Lysbilde | undefined = useMemo(
        () => (forelesning ? sisteFor(forelesning, indeks, (s) => s.lysbilde) : undefined),
        [forelesning, indeks]
    );

    return {
        status,
        indeks,
        ord,
        lysbilde,
        segment: forelesning?.segmenter[indeks],
        antall: forelesning?.segmenter.length ?? 0,
        anim,
        lydPa: stemme.lydPa,
        stemmeNavn: stemme.navn,
        harNorskStemme: stemme.harNorsk,
        start,
        pause,
        fortsett,
        hopp,
        byttLyd,
    };
}
