// Direkte: salen følger klokka. Se kringkasting.ts for planen og tid.ts for timingen.
//
// Avspilleren spør klokka hvilket segment som går nå, sier det, og spør igjen når
// det er sagt:
//  - Er vi foran planen (stemmen var rask), venter foreleseren til neste segment
//    skal starte. Pausen ser ut som et vanlig pusterom.
//  - Er vi bak (stemmen var treg), hopper vi rett til segmentet klokka sier. Da er
//    alle i salen alltid innenfor samme segment, uansett hvilken stemme maskinen har.
// Før eleven har gått inn (og nettleseren tillater lyd), «snakker» foreleseren i
// tekstmodus: munnen og lysbildene går, men det er stille.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Forelesning, Lysbilde, Segment } from './types';
import { hentProgram, sendingNaa, type ProgramPost, type Sending } from './kringkasting';
import { nyAnim, siSegment, type ForelesningAnim } from './siSegment';
import { lagTekstStemme } from './stemme';
import { segmentTider } from './tid';
import { sisteFor } from './sisteFor';
import { useStemme } from './useStemme';
import { salFor } from './saler';

/** Andel av forelesningen eleven må ha hørt for å få spørsmålene etterpå. */
const HORT_FOR_SPORSMAL = 0.4;

const manusCache = new Map<string, Promise<Forelesning>>();
function hentManus(post: ProgramPost): Promise<Forelesning> {
    let p = manusCache.get(post.fil);
    if (!p) {
        p = fetch(post.fil).then((r) => {
            if (!r.ok) throw new Error(`Fant ikke ${post.fil}`);
            return r.json();
        });
        p.catch(() => manusCache.delete(post.fil));
        manusCache.set(post.fil, p);
    }
    return p;
}

const tidCache = new WeakMap<Forelesning, number[]>();
const startTider = (f: Forelesning) => {
    let t = tidCache.get(f);
    if (!t) {
        t = segmentTider(f).starter;
        tidCache.set(f, t);
    }
    return t;
};

export function useDirekte(salId: string, inne: boolean) {
    const sal = salFor(salId);
    const stemme = useStemme();
    const tekst = useMemo(() => lagTekstStemme(), []);
    const anim = useRef<ForelesningAnim>(nyAnim());
    const ekteOrd = useRef(false);

    const [poster, setPoster] = useState<ProgramPost[] | null>(null);
    const [feil, setFeil] = useState<string | null>(null);
    const [sending, setSending] = useState<Sending | null>(null);
    const [forelesning, setForelesning] = useState<Forelesning | null>(null);
    const [indeks, setIndeks] = useState(0);
    const [ord, setOrd] = useState<{ index: number; lengde: number } | null>(null);
    const [sporsmalFor, setSporsmalFor] = useState<ProgramPost | null>(null);

    const avbryt = useRef<(() => void) | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sistSagt = useRef<{ sti: string; i: number } | null>(null);
    const hort = useRef<{ sti: string; segmenter: Set<number> }>({ sti: '', segmenter: new Set() });
    const inneRef = useRef(inne);
    const forelesningRef = useRef<Forelesning | null>(null);
    const stegRef = useRef<() => void>(() => {});

    useEffect(() => {
        hentProgram()
            .then((p) => setPoster(p.saler[salId] ?? []))
            .catch((e) => setFeil(e instanceof Error ? e.message : 'Fant ikke programmet.'));
    }, [salId]);

    const planlegg = (ms: number) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => stegRef.current(), Math.max(30, ms));
    };

    const stopp = useCallback(() => {
        avbryt.current?.();
        avbryt.current = null;
        if (timer.current) clearTimeout(timer.current);
        setOrd(null);
    }, []);

    const si = useCallback(
        (f: Forelesning, s: Sending, i: number) => {
            const seg: Segment = f.segmenter[i];
            forelesningRef.current = f;
            setForelesning(f);
            setIndeks(i);
            if (seg.lysbilde) anim.current.lysbildeByttet = performance.now();
            anim.current.humor = sisteFor(f, i, (x) => x.humor) ?? 'noytral';
            avbryt.current = siSegment({
                stemme: inneRef.current ? stemme.ref.current : tekst,
                seg,
                anim: anim.current,
                ekteOrd,
                onOrd: (index, lengde) => setOrd({ index, lengde }),
                onSlutt: () => {
                    avbryt.current = null;
                    setOrd(null);
                    sistSagt.current = { sti: s.post.sti, i };
                    if (inneRef.current) hort.current.segmenter.add(i);
                    stegRef.current();
                },
            });
        },
        [stemme.ref, tekst]
    );

    const steg = useCallback(() => {
        if (!poster || avbryt.current) return;
        const naa = Date.now();
        const s = sendingNaa(salId, poster, naa);
        setSending(s);
        if (!s) return;

        if (hort.current.sti !== s.post.sti) hort.current = { sti: s.post.sti, segmenter: new Set() };

        if (s.friminutt) {
            const f = forelesningRef.current;
            if (f && hort.current.sti === s.post.sti && hort.current.segmenter.size / f.segmenter.length >= HORT_FOR_SPORSMAL) {
                setSporsmalFor(s.post);
            }
            anim.current.humor = 'glad';
            hentManus(s.neste).catch(() => {});
            planlegg(Math.min(s.nesteStart - naa + 50, 5000));
            return;
        }

        const lagret = forelesningRef.current;
        const fortsett = (f: Forelesning) => {
            const starter = startTider(f);
            const offset = naa - s.start;
            let i = 0;
            while (i + 1 < starter.length && starter[i + 1] <= offset) i++;
            const sist = sistSagt.current;
            if (sist && sist.sti === s.post.sti && sist.i >= i) {
                // Foran klokka: vent til neste segment skal begynne.
                const neste = sist.i + 1;
                planlegg(neste < starter.length ? s.start + starter[neste] - naa : s.slutt - naa + 50);
                return;
            }
            si(f, s, i);
        };
        if (lagret && lagret.kilde === s.post.kilde) fortsett(lagret);
        else
            hentManus(s.post)
                .then((f) => {
                    forelesningRef.current = f;
                    if (sistSagt.current?.sti !== s.post.sti) sistSagt.current = null;
                    if (!avbryt.current) fortsett(f);
                })
                .catch((e) => {
                    console.error("[auditoriet]", e);
                    planlegg(5000);
                });
    }, [poster, salId, si]);

    useEffect(() => {
        stegRef.current = steg;
        const t = setTimeout(steg, 0);
        return () => clearTimeout(t);
    }, [steg]);

    // Når eleven går inn eller skrur lyden av/på: si segmentet på nytt med riktig stemme.
    useEffect(() => {
        inneRef.current = inne;
        if (!avbryt.current) return;
        avbryt.current();
        avbryt.current = null;
        if (sistSagt.current) sistSagt.current = { ...sistSagt.current, i: sistSagt.current.i - 1 };
        stegRef.current();
    }, [inne, stemme.navn]);

    // Fanen var skjult (talen kan ha stoppet): synk på nytt.
    useEffect(() => {
        const synlig = () => {
            if (document.visibilityState !== 'visible') return;
            stopp();
            stegRef.current();
        };
        document.addEventListener('visibilitychange', synlig);
        return () => document.removeEventListener('visibilitychange', synlig);
    }, [stopp]);

    useEffect(() => stopp, [stopp]);

    const lysbilde: Lysbilde | undefined = useMemo(() => {
        if (sending?.friminutt) {
            return { type: 'pause', neste: sending.neste.tittel, starter: sending.nesteStart, sal: sal?.navn ?? '' };
        }
        return forelesning ? sisteFor(forelesning, indeks, (x) => x.lysbilde) : undefined;
    }, [sending, forelesning, indeks, sal?.navn]);

    return {
        sal,
        feil,
        sending,
        forelesning,
        segment: sending && !sending.friminutt ? forelesning?.segmenter[indeks] : undefined,
        ord,
        lysbilde,
        anim,
        lydPa: stemme.lydPa,
        byttLyd: stemme.byttLyd,
        harNorskStemme: stemme.harNorsk,
        sporsmalFor,
        lukkSporsmal: () => setSporsmalFor(null),
    };
}
