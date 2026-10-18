import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookMarked, BookOpen, Check, RotateCcw, X } from 'lucide-react';
import type { FilmManus } from './types';
import { renderInlineMarkdown } from '../../components/markdownUtils';
import { sporFilm } from '../../lib/analytics';

/**
 * Sluttskjermen: tre spørsmål om det eleven nettopp så, hvilken artikkel filmen bygger
 * på og kildene den har, og knappene videre. Spørsmålene hentes fra artikkelens egen
 * Quiz, så filmen aldri spør om noe artikkelen ikke svarer på. Har artikkelen ingen quiz,
 * vises bare knappene og kildene.
 */

interface QuizSporsmal {
    question: string;
    options: string[];
    answer: number;
    explanation?: string;
}

interface Artikkelgrunnlag {
    tittel: string;
    sporsmal: QuizSporsmal[];
    kilder: string[];
}

const ANTALL_SPORSMAL = 3;

/** Leser tittel, quiz og kildeliste ut av artikkel-JSON-en. */
function lesArtikkel(data: unknown): Artikkelgrunnlag {
    const a = (data ?? {}) as { title?: string; content?: unknown[] };
    const blokker = Array.isArray(a.content) ? a.content : [];
    const komponent = (navn: string) =>
        blokker.find(
            (b): b is { props?: Record<string, unknown> } =>
                !!b && typeof b === 'object' && (b as { name?: string }).name === navn
        )?.props ?? {};
    const quiz = komponent('Quiz').questions;
    const kilder = komponent('Kildeliste').sources;
    return {
        tittel: a.title ?? '',
        sporsmal: Array.isArray(quiz)
            ? (quiz as QuizSporsmal[]).filter(
                  (q) =>
                      typeof q?.question === 'string' &&
                      Array.isArray(q.options) &&
                      typeof q.answer === 'number' &&
                      q.answer >= 0 &&
                      q.answer < q.options.length
              )
            : [],
        kilder: Array.isArray(kilder) ? (kilder as string[]).filter((k) => typeof k === 'string') : [],
    };
}

/**
 * Velger spørsmålene filmen faktisk dekker: de der flest ord i det riktige svaret og
 * spørsmålet står i manuset. Rekkefølgen fra artikkelen beholdes.
 */
function velgSporsmal(alle: QuizSporsmal[], manus: FilmManus, antall = ANTALL_SPORSMAL) {
    const tekst = manus.scener
        .flatMap((s) => s.replikker.map((r) => r.si))
        .join(' ')
        .toLowerCase();
    const ord = (s: string) => s.toLowerCase().match(/[a-zæøå0-9]{5,}/g) ?? [];
    const poeng = alle.map((q, i) => {
        const kandidater = [...ord(q.options[q.answer]), ...ord(q.question)];
        const treff = kandidater.filter((o) => tekst.includes(o)).length;
        return { i, andel: kandidater.length ? treff / kandidater.length : 0 };
    });
    return poeng
        .sort((a, b) => b.andel - a.andel || a.i - b.i)
        .slice(0, antall)
        .sort((a, b) => a.i - b.i)
        .map((p) => alle[p.i]);
}

function useArtikkelgrunnlag(sti: string) {
    const [grunnlag, setGrunnlag] = useState<Artikkelgrunnlag | null>(null);
    useEffect(() => {
        let aktiv = true;
        fetch(`/content${sti}.json`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => aktiv && setGrunnlag(lesArtikkel(d)))
            .catch(() => aktiv && setGrunnlag(lesArtikkel(null)));
        return () => {
            aktiv = false;
        };
    }, [sti]);
    return grunnlag;
}

export function FilmSlutt({
    manus,
    fraSti,
    lysbilde,
    omigjen,
}: {
    manus: FilmManus;
    fraSti: string | null;
    lysbilde: { neste: () => void } | null;
    omigjen: () => void;
}) {
    const grunnlag = useArtikkelgrunnlag(manus.kilde);
    const sporsmal = useMemo(
        () => (grunnlag ? velgSporsmal(grunnlag.sporsmal, manus) : []),
        [grunnlag, manus]
    );
    const [visKilder, setVisKilder] = useState(false);

    return (
        <div
            className="absolute inset-0 z-10 bg-white flex flex-col px-10 pt-7 pb-6 gap-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-3xl font-black text-slate-900">Slutt</h2>
                {grunnlag && (
                    <button
                        onClick={() => setVisKilder((v) => !v)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
                        aria-expanded={visKilder}
                    >
                        <BookMarked className="w-4 h-4" />
                        Bygget på artikkelen «{grunnlag.tittel || manus.tittel}»
                        {grunnlag.kilder.length > 0 && ` · Kilder (${grunnlag.kilder.length})`}
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-0 relative">
                {visKilder && grunnlag ? (
                    <div className="absolute inset-0 overflow-auto rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-600 mb-3">
                            Filmen forteller bare det som står i artikkelen. Artikkelen bygger på disse
                            kildene:
                        </p>
                        {grunnlag.kilder.length > 0 ? (
                            <ol className="space-y-2 text-sm leading-relaxed text-slate-600">
                                {grunnlag.kilder.map((k, i) => (
                                    <li key={i} className="pl-4 -indent-4">
                                        {renderInlineMarkdown(k)}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-slate-500">Artikkelen har ingen kildeliste ennå.</p>
                        )}
                    </div>
                ) : sporsmal.length > 0 ? (
                    <Minitest sporsmal={sporsmal} sti={manus.kilde} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-slate-500">
                        {grunnlag ? 'Les artikkelen for å lære mer.' : ''}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {lysbilde && (
                    <button
                        onClick={lysbilde.neste}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-base font-bold shadow-lg hover:bg-indigo-700"
                    >
                        Neste lysbilde <ArrowRight className="w-5 h-5" />
                    </button>
                )}
                {fraSti && !lysbilde && (
                    <Link
                        to={fraSti}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-base font-bold shadow-lg hover:bg-emerald-700"
                    >
                        <ArrowLeft className="w-5 h-5" /> Tilbake til stien
                    </Link>
                )}
                {!lysbilde && (
                    <Link
                        to={manus.kilde}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-base font-bold shadow-lg hover:bg-indigo-700"
                    >
                        <BookOpen className="w-5 h-5" /> Les artikkelen
                    </Link>
                )}
                <button
                    onClick={omigjen}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 text-base font-bold hover:border-indigo-300"
                >
                    <RotateCcw className="w-5 h-5" /> Se igjen
                </button>
            </div>
        </div>
    );
}

function Minitest({ sporsmal, sti }: { sporsmal: QuizSporsmal[]; sti: string }) {
    const [nr, setNr] = useState(0);
    const [valgt, setValgt] = useState<number | null>(null);
    const [riktige, setRiktige] = useState(0);
    const ferdig = nr >= sporsmal.length;
    const q = sporsmal[Math.min(nr, sporsmal.length - 1)];

    const svar = (i: number) => {
        if (valgt !== null) return;
        setValgt(i);
        const riktig = i === q.answer;
        const nyeRiktige = riktige + (riktig ? 1 : 0);
        if (riktig) setRiktige(nyeRiktige);
        if (nr === sporsmal.length - 1)
            sporFilm(sti, { type: 'quiz', riktige: nyeRiktige, antall: sporsmal.length });
    };

    const neste = () => {
        setValgt(null);
        setNr((n) => n + 1);
    };

    if (ferdig) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
            >
                <div className="text-6xl font-black text-indigo-600 tabular-nums">
                    {riktige} av {sporsmal.length}
                </div>
                <p className="text-xl font-semibold text-slate-700">
                    {riktige === sporsmal.length
                        ? 'Alle riktige. Du fulgte godt med!'
                        : 'Artikkelen har svarene, og quizen der går grundigere til verks.'}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col gap-3">
            <div className="text-sm font-bold uppercase tracking-wide text-indigo-600">
                Spørsmål {nr + 1} av {sporsmal.length}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={nr}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-h-0 flex flex-col gap-3"
                >
                    <p className="text-xl font-bold text-slate-900 leading-snug">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                        {q.options.map((o, i) => {
                            const erRiktig = i === q.answer;
                            const stil =
                                valgt === null
                                    ? 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                                    : erRiktig
                                      ? 'border-emerald-500 bg-emerald-50'
                                      : i === valgt
                                        ? 'border-rose-400 bg-rose-50'
                                        : 'border-slate-100 bg-white opacity-50';
                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => svar(i)}
                                    whileTap={valgt === null ? { scale: 0.97 } : undefined}
                                    animate={
                                        valgt === i && !erRiktig
                                            ? { x: [0, -6, 6, -4, 4, 0] }
                                            : valgt !== null && erRiktig
                                              ? { scale: [1, 1.04, 1] }
                                              : {}
                                    }
                                    transition={{ duration: 0.35 }}
                                    className={`flex items-center gap-2 text-left px-4 py-2.5 rounded-xl border-2 text-base font-semibold text-slate-800 transition-colors ${stil}`}
                                >
                                    <span className="flex-1">{o}</span>
                                    {valgt !== null && erRiktig && (
                                        <Check className="w-5 h-5 shrink-0 text-emerald-600" />
                                    )}
                                    {valgt === i && !erRiktig && (
                                        <X className="w-5 h-5 shrink-0 text-rose-500" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                    {valgt !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4"
                        >
                            <p className="flex-1 text-sm leading-snug text-slate-600 line-clamp-3">
                                {q.explanation}
                            </p>
                            <button
                                onClick={neste}
                                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-indigo-600"
                            >
                                {nr === sporsmal.length - 1 ? 'Se resultatet' : 'Neste'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
