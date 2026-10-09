import { Suspense, createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Maximize,
    Minimize,
    Pause,
    Play,
    RotateCcw,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    BookOpen,
} from 'lucide-react';
import type { FilmManus } from './types';
import { useFilmNarrator, type FlatReplikk } from './useFilmNarrator';
import { hentVisual } from './visuals';
import { hentManus, merkSomSett } from './filmIndex';
import { ErrorBoundary } from '../../components/ErrorBoundary';

/**
 * Artikkelfilm: spiller av en artikkel som fortalt film med animasjoner, 2D/3D-
 * grafikk, teksting og nettleserens innebygde stemme.
 * Rute: /film/:subjectId/:topicId/:lessonId (og /film/:subjectId/:topicId/:subTopicId/:lessonId)
 */
export function FilmPage() {
    const { subjectId, topicId, subTopicId, lessonId } = useParams();
    const sti = '/' + [subjectId, topicId, subTopicId, lessonId].filter(Boolean).join('/');
    const [manus, setManus] = useState<FilmManus | null>(null);
    const [feil, setFeil] = useState(false);

    useEffect(() => {
        let aktiv = true;
        hentManus(sti)
            .then((d) => {
                if (!aktiv) return;
                if (d) setManus(d);
                else setFeil(true);
            })
            .catch(() => aktiv && setFeil(true));
        return () => {
            aktiv = false;
        };
    }, [sti]);

    if (feil) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-700">
                <p className="text-xl font-semibold">Denne artikkelen har ingen film ennå.</p>
                <Link
                    to={sti}
                    className="text-indigo-600 font-bold underline"
                >
                    Til artikkelen
                </Link>
            </div>
        );
    }
    if (!manus) return <div className="fixed inset-0 bg-slate-100" />;
    return <FilmSpiller manus={manus} />;
}

function FilmSpiller({ manus }: { manus: FilmManus }) {
    const f = useFilmNarrator(manus);
    const rammeRef = useRef<HTMLDivElement>(null);
    const [fullskjerm, setFullskjerm] = useState(false);

    // Kun i utvikling: ?scene=3&beat=2 låser bildet på ett øyeblikk, til skjermbilder.
    const [sok] = useSearchParams();
    const laast = import.meta.env.DEV && sok.has('scene');
    const sceneNr = laast ? Number(sok.get('scene')) : f.scene;
    const beat = laast ? Number(sok.get('beat') ?? 0) : f.beat;

    useEffect(() => {
        if (f.status === 'ferdig') merkSomSett(manus.kilde);
    }, [f.status, manus.kilde]);

    const scene = manus.scener[sceneNr];
    const Visual = hentVisual(scene.visual.type);
    const playing = laast || f.status === 'spiller';
    const klokke = scene.klokke?.[Math.min(beat, scene.klokke.length - 1)] ?? null;
    const kapittel = kapittelFor(manus, f.scene);

    const byttFullskjerm = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else rammeRef.current?.requestFullscreen?.().catch(() => {});
    }, []);

    useEffect(() => {
        const h = () => setFullskjerm(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    // Tastatur: mellomrom spiller/pauser, piler hopper mellom scener, F gir fullskjerm.
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key === ' ' || e.key === 'k') {
                e.preventDefault();
                f.toggle();
            } else if (e.key === 'ArrowRight')
                f.gaTilScene(Math.min(manus.scener.length - 1, f.scene + 1));
            else if (e.key === 'ArrowLeft') f.gaTilScene(Math.max(0, f.scene - 1));
            else if (e.key === 'f') byttFullskjerm();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [f, manus.scener.length, byttFullskjerm]);

    return (
        <div ref={rammeRef} className="fixed inset-0 z-50 flex flex-col bg-slate-200 select-none">
            {!fullskjerm && (
                <header className="h-12 shrink-0 flex items-center gap-3 px-3 sm:px-5 bg-white border-b border-slate-200">
                    <Link
                        to={manus.kilde}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-indigo-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Til artikkelen
                    </Link>
                    <div className="flex-1 min-w-0 text-center truncate font-black text-slate-900">
                        {manus.tittel}
                    </div>
                    <div className="hidden sm:block text-sm font-semibold text-slate-500 w-40 text-right truncate">
                        {kapittel}
                    </div>
                </header>
            )}

            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <div
                    className="flex flex-col rounded-xl shadow-2xl overflow-hidden bg-white"
                    style={{
                        width: fullskjerm
                            ? 'min(100%, calc((100vh - 9.5rem) * 16 / 9))'
                            : 'min(100%, calc((100vh - 13rem) * 16 / 9))',
                    }}
                >
                    <div
                        className="relative aspect-video overflow-hidden bg-slate-900"
                        onClick={() => f.status !== 'klar' && f.toggle()}
                    >
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={sceneNr}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.7 }}
                            >
                                <ErrorBoundary>
                                    <Suspense
                                        fallback={<div className="absolute inset-0 bg-slate-900" />}
                                    >
                                        {Visual ? (
                                            // Visualen er bufret per navn i hentVisual, så den er stabil mellom renderinger.
                                            createElement(Visual, {
                                                beat,
                                                playing,
                                                props: scene.visual.props ?? {},
                                            })
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500">
                                                Mangler visual: {scene.visual.type}
                                            </div>
                                        )}
                                    </Suspense>
                                </ErrorBoundary>
                            </motion.div>
                        </AnimatePresence>

                        {/* Kapittelskilt når et nytt kapittel starter */}
                        <AnimatePresence>
                            {scene.kapittel && beat === 0 && (laast || f.status !== 'klar') && (
                                <motion.div
                                    key={scene.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="absolute top-[4%] left-[3%] px-4 py-1.5 rounded-full bg-white/90 text-slate-900 text-sm md:text-lg font-black shadow"
                                >
                                    {scene.kapittel}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Klokka */}
                        <AnimatePresence>
                            {klokke && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-[4%] right-[3%] px-4 py-1.5 rounded-xl bg-slate-900/80 text-amber-300 font-mono text-2xl md:text-4xl font-bold tabular-nums shadow-lg"
                                >
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={klokke}
                                            initial={{ y: -14, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 14, opacity: 0 }}
                                            className="inline-block"
                                        >
                                            {klokke}
                                        </motion.span>
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!laast && f.status === 'klar' && <Startskjerm manus={manus} f={f} />}
                        {f.status === 'ferdig' && (
                            <Sluttskjerm
                                manus={manus}
                                omigjen={() => f.gaTilScene(0)}
                                spill={f.play}
                            />
                        )}
                        {f.status === 'pause' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 rounded-full bg-white/85 flex items-center justify-center shadow-xl">
                                    <Play className="w-9 h-9 text-slate-900 ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Teksting: alltid på, i eget felt rett under bildet så den aldri dekker grafikken */}
                    <div className="h-[4.5rem] md:h-20 shrink-0 flex items-center justify-center px-6 border-t border-slate-200">
                        {/* Ingen exit-animasjon: AnimatePresence mode="wait" ble hengende på gammel
                            tekst når replikken byttet raskt (tempobytte, scenehopp). */}
                        <motion.p
                            key={
                                laast
                                    ? `${sceneNr}-${beat}`
                                    : f.status === 'klar'
                                      ? 'klar'
                                      : f.indeks
                            }
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-slate-900 text-base md:text-xl font-semibold leading-snug text-center line-clamp-3"
                        >
                            {laast
                                ? scene.replikker[beat]?.si
                                : f.status === 'klar'
                                  ? ''
                                  : f.replikk?.si}
                        </motion.p>
                    </div>
                </div>
            </div>

            <Kontroller
                manus={manus}
                f={f}
                fullskjerm={fullskjerm}
                byttFullskjerm={byttFullskjerm}
            />
        </div>
    );
}

type Narrator = ReturnType<typeof useFilmNarrator>;

function kapittelFor(manus: FilmManus, scene: number) {
    for (let i = scene; i >= 0; i--) if (manus.scener[i].kapittel) return manus.scener[i].kapittel!;
    return '';
}

function Startskjerm({ manus, f }: { manus: FilmManus; f: Narrator }) {
    const minutter = Math.round(f.totalTid / 60);
    return (
        <div className="absolute inset-0 z-10">
            {manus.bilde && (
                <img
                    src={manus.bilde}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-6">
                <h1 className="text-white text-3xl md:text-5xl font-black drop-shadow-xl max-w-3xl">
                    {manus.tittel}
                </h1>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        f.play();
                    }}
                    className="group w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Spill av"
                >
                    <Play className="w-11 h-11 text-slate-900 ml-1.5 group-hover:text-indigo-600" />
                </button>
                <div className="text-white/90 font-semibold text-base md:text-lg">
                    Film · ca. {minutter} min · {manus.scener.length} scener
                </div>
                <div className="text-white/75 text-sm">
                    {!f.stemmerLastet
                        ? 'Ser etter norsk stemme …'
                        : f.stemmeNavn
                          ? `Stemme: ${f.stemmeNavn}`
                          : 'Fant ingen norsk stemme på denne maskinen. Filmen går med tekst.'}
                </div>
            </div>
        </div>
    );
}

function Sluttskjerm({
    manus,
    omigjen,
    spill,
}: {
    manus: FilmManus;
    omigjen: () => void;
    spill: () => void;
}) {
    return (
        <div
            className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">Slutt</h2>
            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    to={manus.kilde}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-lg font-bold shadow-lg hover:bg-indigo-700"
                >
                    <BookOpen className="w-5 h-5" /> Les artikkelen og ta quizen
                </Link>
                <button
                    onClick={() => {
                        omigjen();
                        spill();
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 text-lg font-bold hover:border-indigo-300"
                >
                    <RotateCcw className="w-5 h-5" /> Se igjen
                </button>
            </div>
        </div>
    );
}

function Kontroller({
    manus,
    f,
    fullskjerm,
    byttFullskjerm,
}: {
    manus: FilmManus;
    f: Narrator;
    fullskjerm: boolean;
    byttFullskjerm: () => void;
}) {
    const knapp =
        'w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 disabled:opacity-30';
    return (
        <div className="h-16 shrink-0 flex items-center gap-1.5 sm:gap-3 px-3 sm:px-5 bg-white border-t border-slate-200">
            <button
                className={knapp}
                onClick={() => f.gaTilScene(Math.max(0, f.scene - 1))}
                aria-label="Forrige scene"
                title="Forrige scene (←)"
            >
                <SkipBack className="w-5 h-5" />
            </button>
            <button
                className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                onClick={f.toggle}
                aria-label={f.status === 'spiller' ? 'Pause' : 'Spill av'}
                title="Spill av / pause (mellomrom)"
            >
                {f.status === 'spiller' ? (
                    <Pause className="w-5 h-5" />
                ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                )}
            </button>
            <button
                className={knapp}
                onClick={() => f.gaTilScene(Math.min(manus.scener.length - 1, f.scene + 1))}
                aria-label="Neste scene"
                title="Neste scene (→)"
            >
                <SkipForward className="w-5 h-5" />
            </button>
            <Tidslinje manus={manus} f={f} />
            <button
                className="px-2.5 h-9 shrink-0 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-100 tabular-nums"
                onClick={() => f.setRate(f.rate === 1 ? 1.15 : f.rate === 1.15 ? 0.9 : 1)}
                title="Tempo"
            >
                {f.rate.toString().replace('.', ',')}x
            </button>
            <button
                className={knapp}
                onClick={() => f.setLydPaa(!f.lydPaa)}
                disabled={!f.harStemme}
                aria-label={f.lydPaa ? 'Slå av lyd' : 'Slå på lyd'}
                title={
                    f.harStemme
                        ? f.lydPaa
                            ? 'Lyd av (bare tekst)'
                            : 'Lyd på'
                        : 'Ingen norsk stemme på maskinen'
                }
            >
                {f.lydPaa && f.harStemme ? (
                    <Volume2 className="w-5 h-5" />
                ) : (
                    <VolumeX className="w-5 h-5" />
                )}
            </button>
            <button
                className={knapp}
                onClick={byttFullskjerm}
                aria-label="Fullskjerm"
                title="Fullskjerm (F)"
            >
                {fullskjerm ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
        </div>
    );
}

/** Tidslinja: ett felt per scene, bredde etter anslått lengde. Klikk for å hoppe. */
function Tidslinje({ manus, f }: { manus: FilmManus; f: Narrator }) {
    const [tid, setTid] = useState(0);
    const replikkRef = useRef<FlatReplikk | undefined>(f.replikk);
    const statusRef = useRef(f.status);
    useEffect(() => {
        replikkRef.current = f.replikk;
        statusRef.current = f.status;
    }, [f.replikk, f.status]);

    useEffect(() => {
        let raf = 0;
        const tikk = () => {
            const r = replikkRef.current;
            if (r) {
                const inni =
                    statusRef.current === 'spiller'
                        ? Math.min(r.anslag, (performance.now() - f.replikkStartRef.current) / 1000)
                        : 0;
                setTid(statusRef.current === 'ferdig' ? f.totalTid : r.start + inni);
            }
            raf = requestAnimationFrame(tikk);
        };
        raf = requestAnimationFrame(tikk);
        return () => cancelAnimationFrame(raf);
    }, [f.replikkStartRef, f.totalTid]);

    const scener = manus.scener.map((s, i) => {
        const rs = f.replikker.filter((r) => r.scene === i);
        const start = rs[0]?.start ?? 0;
        const slutt = rs.length ? rs[rs.length - 1].start + rs[rs.length - 1].anslag : start;
        return { s, i, start, slutt };
    });
    const total = f.totalTid || 1;
    const fmt = (s: number) =>
        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    return (
        <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="flex-1 flex h-3 gap-[3px] items-center">
                {scener.map(({ s, i, start, slutt }) => {
                    const andel = Math.max(
                        0,
                        Math.min(1, (tid - start) / Math.max(0.1, slutt - start))
                    );
                    return (
                        <button
                            key={s.id}
                            onClick={() => f.gaTilScene(i)}
                            className="group relative h-full rounded-full bg-slate-200 hover:bg-slate-300 overflow-hidden"
                            style={{ flexGrow: slutt - start, flexBasis: 0 }}
                            title={s.kapittel ?? kapittelFor(manus, i)}
                        >
                            <span
                                className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                                style={{ width: `${andel * 100}%` }}
                            />
                        </button>
                    );
                })}
            </div>
            <div className="hidden sm:block text-xs font-bold text-slate-500 tabular-nums w-20 text-right">
                {fmt(tid)} / {fmt(total)}
            </div>
        </div>
    );
}
