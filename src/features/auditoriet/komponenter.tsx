// Felles knapper og overlegg for salene, lesesalen og gangen.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import { tegnLysbilde } from './tegnLysbilde';
import type { Lysbilde, Sporsmal } from './types';
import type { Teksting as TekstingValg } from './studiebevis';

const PILLE =
    'pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow backdrop-blur hover:bg-white';

export function Toppstripe({
    tilbake,
    tilbakeTekst,
    midt,
    fullskjerm,
    onFullskjerm,
}: {
    tilbake: string;
    tilbakeTekst: string;
    midt?: React.ReactNode;
    fullskjerm: boolean;
    onFullskjerm: () => void;
}) {
    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
            <Link to={tilbake} className={PILLE}>
                <ArrowLeft size={16} /> {tilbakeTekst}
            </Link>
            {midt}
            <button onClick={onFullskjerm} className={PILLE} aria-label={fullskjerm ? 'Avslutt fullskjerm' : 'Fullskjerm'}>
                {fullskjerm ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {fullskjerm ? 'Avslutt fullskjerm' : 'Fullskjerm'}
            </button>
        </div>
    );
}

export function Knapp({
    etikett,
    onClick,
    hoved,
    aktiv,
    children,
}: {
    etikett: string;
    onClick: () => void;
    hoved?: boolean;
    /** Et panel knappen åpner er åpent, eller en innstilling er slått på. */
    aktiv?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={etikett}
            title={etikett}
            className={`flex items-center justify-center rounded-full shadow transition active:scale-90 ${
                hoved
                    ? 'h-12 w-12 bg-indigo-600 text-white hover:bg-indigo-700'
                    : aktiv
                      ? 'h-11 w-11 bg-amber-300 text-slate-900 hover:bg-amber-200'
                      : 'h-11 w-11 bg-white/85 text-slate-700 backdrop-blur hover:bg-white'
            }`}
        >
            {children}
        </button>
    );
}

/** Tekstingen: står der blikket er, med ordet som sies nå markert. */
export function Teksting({
    tekst,
    ord,
    storrelse = 'normal',
}: {
    tekst: string;
    ord: { index: number; lengde: number } | null;
    storrelse?: TekstingValg;
}) {
    if (storrelse === 'av') return null;
    const stor = storrelse === 'stor';
    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4">
            <p
                className={`rounded-2xl bg-white/90 text-center leading-snug text-slate-800 shadow-lg backdrop-blur ${
                    stor ? 'max-w-5xl px-6 py-4 text-3xl' : 'max-w-4xl px-5 py-3 text-xl'
                }`}
            >
                {ord ? (
                    <>
                        {tekst.slice(0, ord.index)}
                        <span className="rounded bg-amber-200 text-slate-900">{tekst.slice(ord.index, ord.index + ord.lengde)}</span>
                        {tekst.slice(ord.index + ord.lengde)}
                    </>
                ) : (
                    tekst
                )}
            </p>
        </div>
    );
}

/** Hint mens eleven står: hvordan man går, og en snarvei til en god plass. */
export function StaHint({ naerSete, onFinnPlass }: { naerSete: boolean; onFinnPlass: () => void }) {
    return (
        <>
            <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
                {naerSete && (
                    <div className="rounded-full bg-amber-400 px-5 py-2 text-base font-bold text-slate-900 shadow-lg">
                        Trykk E for å sette deg
                    </div>
                )}
                <button
                    onClick={onFinnPlass}
                    className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg hover:bg-indigo-700 active:scale-95"
                >
                    Finn en plass for meg
                </button>
            </div>
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/85 px-4 py-2.5 text-sm text-slate-700 shadow backdrop-blur">
                <b>WASD</b> eller <b>piltaster</b>: gå · <b>Dra med musa</b>: se deg rundt · <b>Klikk på et gult sete</b>: sett deg · <b>H</b>: hurtigtaster
            </div>
        </>
    );
}

/** «Se lysbildet»: samme tegning som lerretet, men skarpt og stort, til projektor. */
export function StortLysbilde({
    lysbilde,
    tittel,
    onLukk,
    onForrige,
    onNeste,
}: {
    lysbilde: Lysbilde | undefined;
    tittel: string;
    onLukk: () => void;
    onForrige?: () => void;
    onNeste?: () => void;
}) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [lastet, setLastet] = useState(0);
    const [sekund, setSekund] = useState(0);

    // Friminuttet teller ned.
    useEffect(() => {
        if (lysbilde?.type !== 'pause') return;
        const t = setInterval(() => setSekund((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [lysbilde?.type]);

    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = 1600;
        const H = 900;
        c.width = W * dpr;
        c.height = H * dpr;
        const ctx = c.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        tegnLysbilde(ctx, W, H, lysbilde, { forelesning: tittel, nårLastet: () => setLastet((n) => n + 1) });
    }, [lysbilde, tittel, lastet, sekund]);

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" onClick={onLukk}>
            <div className="relative w-full max-w-[min(100%,calc((100dvh-6rem)*16/9))]" onClick={(e) => e.stopPropagation()}>
                <canvas ref={canvas} className="aspect-video w-full rounded-2xl shadow-2xl" />
                <div className="mt-3 flex justify-center gap-2">
                    {onForrige && (
                        <Knapp etikett="Forrige" onClick={onForrige}>
                            <ChevronLeft size={20} />
                        </Knapp>
                    )}
                    <Knapp etikett="Lukk" onClick={onLukk} hoved>
                        <X size={20} />
                    </Knapp>
                    {onNeste && (
                        <Knapp etikett="Neste" onClick={onNeste}>
                            <ChevronRight size={20} />
                        </Knapp>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Spørsmålene etter forelesningen. Gir XP i «Min læring». */
export function Sporsmalskort({
    tittel,
    kilde,
    fag,
    emne,
    sporsmal,
    onLukk,
    onIgjen,
}: {
    tittel: string;
    kilde: string;
    fag: string;
    emne?: string;
    sporsmal: Sporsmal[];
    onLukk: () => void;
    onIgjen?: () => void;
}) {
    const [nr, setNr] = useState(0);
    const [valgt, setValgt] = useState<string | null>(null);
    const [riktige, setRiktige] = useState(0);
    const ferdig = nr >= sporsmal.length;
    const sp = sporsmal[nr];

    useEffect(() => {
        if (!ferdig || sporsmal.length === 0) return;
        import('../progress/useProgressStore').then(({ useProgressStore }) => {
            useProgressStore.getState().recordActivity({
                kind: 'quiz-completed',
                // Egen id, så forelesningen ikke regnes som artikkelens egen quiz.
                activityId: `${kilde.slice(1)}#forelesning`,
                subjectId: fag,
                topicId: emne,
                score: riktige / sporsmal.length,
                title: `Forelesning: ${tittel}`,
            });
        });
    }, [ferdig, kilde, fag, emne, tittel, riktige, sporsmal.length]);

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                {!ferdig ? (
                    <>
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-amber-700">
                                {tittel} · spørsmål {nr + 1} av {sporsmal.length}
                            </p>
                            <button onClick={onLukk} aria-label="Lukk" className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">{sp.question}</h2>
                        <div className="mt-4 grid gap-2">
                            {sp.options.map((o) => {
                                const svart = valgt !== null;
                                const riktig = o === sp.answer;
                                return (
                                    <button
                                        key={o}
                                        disabled={svart}
                                        onClick={() => {
                                            setValgt(o);
                                            if (riktig) setRiktige((n) => n + 1);
                                        }}
                                        className={`rounded-xl border-2 px-4 py-3 text-left text-base transition ${
                                            !svart
                                                ? 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                                                : riktig
                                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                                  : o === valgt
                                                    ? 'border-rose-400 bg-rose-50 text-rose-900'
                                                    : 'border-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {o}
                                    </button>
                                );
                            })}
                        </div>
                        {valgt !== null && (
                            <>
                                {sp.explanation && <p className="mt-3 text-sm text-slate-600">{sp.explanation}</p>}
                                <button
                                    onClick={() => {
                                        setValgt(null);
                                        setNr((n) => n + 1);
                                    }}
                                    className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
                                >
                                    {nr + 1 < sporsmal.length ? 'Neste spørsmål' : 'Se resultatet'}
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {riktige} av {sporsmal.length} riktige
                        </h2>
                        <p className="mt-1 text-slate-600">Takk for at du var med på forelesningen!</p>
                        <div className="mt-5 grid gap-2">
                            <Link
                                to={kilde}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
                            >
                                <BookOpen size={18} /> Les artikkelen
                            </Link>
                            {onIgjen && (
                                <button onClick={onIgjen} className="rounded-xl border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50">
                                    Hør forelesningen igjen
                                </button>
                            )}
                            <button onClick={onLukk} className="py-2 text-sm text-slate-500 hover:text-slate-700">
                                Lukk
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
