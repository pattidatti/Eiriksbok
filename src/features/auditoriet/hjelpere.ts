// Hooks og henting som deles av salene, lesesalen og gangen.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLayout } from '../../context/LayoutContext';
import type { Sporsmal } from './types';

/** Salene fyller hele skjermen: ingen toppmeny eller brødsmuler. */
export function useHeleSkjermen() {
    const { setHideHeader, setHideBreadcrumbs } = useLayout();
    useEffect(() => {
        setHideHeader(true);
        setHideBreadcrumbs(true);
        return () => {
            setHideHeader(false);
            setHideBreadcrumbs(false);
        };
    }, [setHideHeader, setHideBreadcrumbs]);
}

export function useFullskjerm() {
    const ramme = useRef<HTMLDivElement>(null);
    const [fullskjerm, setFullskjerm] = useState(false);
    useEffect(() => {
        const endret = () => setFullskjerm(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', endret);
        return () => document.removeEventListener('fullscreenchange', endret);
    }, []);
    const bytt = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else ramme.current?.requestFullscreen?.().catch(() => {});
    };
    return { ramme, fullskjerm, bytt };
}

/** Spørsmålene i artikkelens Quiz-komponent. */
export async function hentSporsmal(artikkelUrl: string): Promise<Sporsmal[]> {
    const a = await fetch(artikkelUrl).then((r) => (r.ok ? r.json() : null));
    const quiz = a?.content?.find((b: { type: string; name?: string }) => b.type === 'component' && b.name === 'Quiz');
    const sp = (quiz?.props?.questions ?? []) as Record<string, unknown>[];
    // Innholdet bruker både `answer` (tekst) og `correctAnswer` (indeks).
    return sp
        .map((q) => {
            const options = Array.isArray(q.options) ? (q.options as string[]) : [];
            const answer = typeof q.answer === 'string' ? q.answer : typeof q.correctAnswer === 'number' ? options[q.correctAnswer] : undefined;
            return { question: String(q.question ?? ''), options, answer: answer ?? '', explanation: q.explanation as string | undefined };
        })
        .filter((q) => q.question && q.options.length >= 2 && q.options.includes(q.answer));
}


/**
 * Hurtigtaster for salene. Hver tast er en liten bokstav (eller 'escape', ' ').
 * Taster i skjemafelt ignoreres, og mellomrom på en knapp er knappens.
 */
export function useHurtigtaster(taster: Record<string, (() => void) | false | undefined>) {
    const ref = useRef(taster);
    useEffect(() => {
        ref.current = taster;
    });
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const el = e.target as HTMLElement | null;
            if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
            const k = e.key === '?' ? '?' : e.key.toLowerCase();
            // Mellomrom og Enter på en knapp er knappens egne.
            if ((k === ' ' || k === 'enter') && el?.closest('button, a')) return;
            const f = ref.current[k];
            if (!f) return;
            e.preventDefault();
            f();
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
    }, []);
}

/** En kort melding som forsvinner av seg selv. */
export function useMelding(ms = 2600) {
    const [melding, setMelding] = useState<{ tekst: string; id: number } | null>(null);
    useEffect(() => {
        if (!melding) return;
        const t = setTimeout(() => setMelding(null), ms);
        return () => clearTimeout(t);
    }, [melding, ms]);
    const vis = useCallback((tekst: string) => setMelding({ tekst, id: Date.now() }), []);
    return { melding: melding?.tekst ?? null, vis };
}
