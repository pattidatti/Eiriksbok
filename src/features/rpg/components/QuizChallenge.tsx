import { useCallback, useEffect, useMemo, useState } from 'react';
import { makeRng } from '../engine/pixels';
import type { BankQuestion } from '../types';
import { KildeLenke, Ramme } from './DialogOverlay';

/** Stokker 0..n-1 med en seed utledet av teksten, så rekkefølgen er stabil. */
function stokk(n: number, seed: string): number[] {
    let tall = 0;
    for (let i = 0; i < seed.length; i++) tall = (tall * 31 + seed.charCodeAt(i)) >>> 0;
    const rng = makeRng(tall || 1);
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
}

interface Props {
    /** Overskrift over spørsmålet - questtittel eller «Kunnskapsdyst». */
    tittel: string;
    /** Hva som står på spill. Vises under tittelen. */
    innsats?: string;
    question: BankQuestion;
    /** Vises mens eleven tenker - hvor svaret finnes. */
    hint?: string;
    onSvar: (riktig: boolean) => void;
}

/**
 * Kunnskapsutfordringen. Dette er selve «kampen» mot uvitenhet: eleven svarer,
 * får se om det stemte, og får alltid en forklaring - også når hun bommer.
 */
export function QuizChallenge({ tittel, innsats, question, hint, onSvar }: Props) {
    const [valgt, setValgt] = useState<number | null>(null);
    const [vist, setVist] = useState(false);

    // Alternativene stokkes, ellers ligger fasiten ofte først i innholdet.
    // Rekkefølgen utledes av spørsmåls-id-en, så den er stabil gjennom
    // rendringer, men forskjellig fra spørsmål til spørsmål.
    const rekkefolge = useMemo(() => stokk(question.options.length, question.id), [
        question.options.length,
        question.id,
    ]);

    const riktig = valgt === question.correct;

    const velg = useCallback(
        (i: number) => {
            setValgt((forrige) => (forrige === null ? i : forrige));
            setVist(true);
        },
        []
    );

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (vist) return;
            const n = Number(e.key);
            if (n >= 1 && n <= rekkefolge.length) velg(rekkefolge[n - 1]);
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [vist, rekkefolge, velg]);

    return (
        <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/70 px-3 backdrop-blur-sm">
            <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-300/25 bg-slate-950/97 p-5 shadow-2xl sm:p-6">
                <header className="mb-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">{tittel}</p>
                    {innsats && <p className="mt-0.5 text-sm text-slate-400">{innsats}</p>}
                </header>

                <h2 className="mb-4 font-display text-xl font-bold leading-snug text-slate-50 sm:text-2xl">
                    {question.question}
                </h2>

                {!vist && hint && (
                    <p className="mb-4 rounded-lg border border-sky-400/25 bg-sky-400/5 px-3 py-2 text-sm text-sky-200">
                        {hint}
                    </p>
                )}

                <div className="space-y-2">
                    {rekkefolge.map((i, plass) => {
                        const erFasit = i === question.correct;
                        const erValgt = i === valgt;
                        let stil =
                            'border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10';
                        if (vist && erFasit) stil = 'border-emerald-400/70 bg-emerald-500/15';
                        else if (vist && erValgt) stil = 'border-rose-500/70 bg-rose-600/15';
                        else if (vist) stil = 'border-white/10 bg-white/[0.03] opacity-55';

                        return (
                            <button
                                key={i}
                                type="button"
                                disabled={vist}
                                onClick={() => velg(i)}
                                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${stil}`}
                            >
                                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-black/30 text-xs font-bold text-slate-300">
                                    {plass + 1}
                                </span>
                                <span className="text-[15px] leading-snug text-slate-100">
                                    {question.options[i]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {vist && (
                    <div className="mt-5">
                        <p
                            className={`font-display text-lg font-bold ${
                                riktig ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                        >
                            {riktig ? 'Riktig!' : 'Ikke helt.'}
                        </p>
                        {question.explanation && (
                            <p className="mt-1 text-[15px] leading-relaxed text-slate-200">
                                {question.explanation}
                            </p>
                        )}
                        <p className="mt-3 text-sm text-slate-400">
                            Vil du lese mer? <KildeLenke href={question.link} tittel={question.lessonTitle} />
                        </p>
                        <button
                            type="button"
                            autoFocus
                            onClick={() => onSvar(riktig)}
                            className="mt-4 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-amber-300"
                        >
                            Videre
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Slutt- og dødsskjermer deler ramme med resten av overleggene. */
export function Meldingsskjerm({
    tittel,
    tekst,
    knapp,
    onKlikk,
    farge = 'amber',
}: {
    tittel: string;
    tekst: string;
    knapp: string;
    onKlikk: () => void;
    farge?: 'amber' | 'rose';
}) {
    return (
        <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/92 px-4">
            <div className="max-w-lg text-center">
                <h2
                    className={`font-display text-4xl font-bold ${
                        farge === 'rose' ? 'text-rose-300' : 'text-amber-300'
                    }`}
                >
                    {tittel}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-200">{tekst}</p>
                <button
                    type="button"
                    onClick={onKlikk}
                    className="mt-6 rounded-xl bg-amber-400 px-8 py-3 font-display text-lg font-bold text-slate-900 transition hover:bg-amber-300"
                >
                    {knapp}
                </button>
            </div>
        </div>
    );
}

export { Ramme };
