// Hooks og henting som deles av salene, lesesalen og gangen.

import { useEffect, useRef, useState } from 'react';
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

