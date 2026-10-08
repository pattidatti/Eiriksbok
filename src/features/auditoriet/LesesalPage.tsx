// Lesesalen: én forelesning på bestilling, fra begynnelsen, med pause og hopp.
// Lærerlenken til projektoren i klasserommet:
//
//   /oving/auditoriet/lesesal?forelesning=historie/vikingtiden/rikssamlingen
//
// Salene på universitetet går etter klokka (SalPage). Her bestemmer eleven selv.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Captions, CaptionsOff, ChevronLeft, ChevronRight, Keyboard, Monitor, NotebookPen, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useForelesning } from './useForelesning';
import type { Forelesning, Sporsmal } from './types';
import { hentProgram } from './kringkasting';
import { salForFag, SALER } from './saler';
import { SalScene } from './scene/SalScene';
import type { SpillerModus } from './scene/Spiller';
import { bestLedigSete, type Sete } from './scene/salGeometri';
import { Knapp, Sporsmalskort, StaHint, StortLysbilde, Teksting, Toppstripe } from './komponenter';
import { Hurtigtaster, Melding, NotatPanel } from './paneler';
import { hentSporsmal, useFullskjerm, useHeleSkjermen, useHurtigtaster, useMelding } from './hjelpere';
import { lysbildeOverskrift } from './sisteFor';
import { useStudiebevis } from './studiebevis';

const STANDARD = 'historie/vikingtiden/rikssamlingen';

const TASTER: [string, string][] = [
    ['W A S D', 'Gå'],
    ['E', 'Sett deg'],
    ['Q', 'Reis deg'],
    ['Mellomrom', 'Pause eller spill'],
    ['← →', 'Forrige eller neste (når du sitter)'],
    ['M', 'Lyd av eller på'],
    ['T', 'Teksting: vanlig, stor, av'],
    ['N', 'Noter det foreleseren sier nå'],
    ['L', 'Se lysbildet stort'],
    ['H', 'Denne lista'],
    ['Esc', 'Lukk'],
];

function useLastForelesning(sti: string) {
    const [data, setData] = useState<{ forelesning: Forelesning; sporsmal: Sporsmal[] } | null>(null);
    const [feil, setFeil] = useState<string | null>(null);

    useEffect(() => {
        let avbrutt = false;
        (async () => {
            try {
                // Programmet vet om forelesningen har et skrevet manus eller et automanus.
                const program = await hentProgram();
                const post = Object.values(program.saler)
                    .flat()
                    .find((p) => p.sti === sti);
                if (!post) throw new Error('Fant ikke forelesningen.');
                const forelesning = (await fetch(post.fil).then((r) => r.json())) as Forelesning;
                const sporsmal = await hentSporsmal(post.artikkel).catch(() => []);
                if (!avbrutt) setData({ forelesning, sporsmal });
            } catch (e) {
                if (!avbrutt) setFeil(e instanceof Error ? e.message : 'Noe gikk galt.');
            }
        })();
        return () => {
            avbrutt = true;
        };
    }, [sti]);

    return { data, feil };
}

export function LesesalPage() {
    useHeleSkjermen();
    const [params] = useSearchParams();
    const sti = params.get('forelesning') ?? STANDARD;
    const { data, feil } = useLastForelesning(sti);
    const f = useForelesning(data?.forelesning ?? null);
    const { ramme, fullskjerm, bytt } = useFullskjerm();

    const [modus, setModus] = useState<SpillerModus>('ute');
    const [sete, setSete] = useState<Sete | null>(null);
    const [naerSete, setNaerSete] = useState<Sete | null>(null);
    const [visLysbilde, setVisLysbilde] = useState(false);
    const [quizApen, setQuizApen] = useState(false);
    const [panel, setPanel] = useState<'notater' | 'hjelp' | null>(null);
    const { melding, vis } = useMelding();
    const teksting = useStudiebevis((s) => s.teksting);
    const nesteTeksting = useStudiebevis((s) => s.nesteTeksting);
    const notere = useStudiebevis((s) => s.notere);
    const stemple = useStudiebevis((s) => s.stemple);
    const antallNotater = useStudiebevis((s) => s.notater[sti]?.liste.length ?? 0);

    const settDeg = useCallback((s: Sete) => {
        setSete(s);
        setNaerSete(null);
    }, []);

    const reisDeg = useCallback(() => {
        f.pause();
        setSete(null);
        setModus('gaar');
    }, [f]);

    const fremme = useCallback(() => {
        setModus('sitter');
        if (f.status === 'pause') f.fortsett();
        else if (f.status !== 'spiller') {
            setQuizApen(false);
            f.start(0);
        }
    }, [f]);

    // Segmentene eleven faktisk har hørt (minst to sekunder av). Å hoppe gjennom gir ikke stempel.
    const hort = useRef(new Set<number>());
    useEffect(() => {
        if (f.status !== 'spiller') return;
        const i = f.indeks;
        const t = setTimeout(() => hort.current.add(i), 2000);
        return () => clearTimeout(t);
    }, [f.status, f.indeks]);

    // Forelesningen hørt til endes: stempel i studiebeviset, så spørsmålene.
    const fl0 = data?.forelesning;
    useEffect(() => {
        if (f.status !== 'ferdig' || !fl0) return;
        const sal = salForFag(fl0.fag);
        const nok = hort.current.size / fl0.segmenter.length >= 0.4;
        const ny = nok && stemple(sti, { tittel: fl0.tittel, salId: sal?.id ?? fl0.fag, fag: fl0.fag, kilde: fl0.kilde });
        const t1 = ny ? setTimeout(() => vis('Nytt stempel i studiebeviset!'), 0) : undefined;
        const t2 = (data?.sporsmal.length ?? 0) > 0 ? setTimeout(() => setQuizApen(true), 1200) : undefined;
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [f.status, data, fl0, sti, stemple, vis]);

    const noter = () => {
        if (!fl0 || !f.segment || f.status === 'ferdig') return;
        notere(sti, fl0.tittel, { tekst: f.segment.si, lysbilde: lysbildeOverskrift(f.lysbilde) });
        vis('Notert! Se notatblokka');
    };
    const byttTeksting = () => {
        nesteTeksting();
        const ny = useStudiebevis.getState().teksting;
        vis(ny === 'av' ? 'Tekstingen er av' : ny === 'stor' ? 'Stor teksting' : 'Vanlig teksting');
    };
    const sitter = modus === 'sitter';
    const harInne = modus !== 'ute';
    const veksle = (p: 'notater' | 'hjelp') => setPanel((n) => (n === p ? null : p));

    useHurtigtaster({
        e: modus === 'gaar' && !!naerSete && !sete && (() => settDeg(naerSete!)),
        q: sitter && reisDeg,
        ' ': sitter && (() => (f.status === 'spiller' ? f.pause() : f.status === 'pause' ? f.fortsett() : undefined)),
        arrowleft: sitter && (() => f.hopp(-1)),
        arrowright: sitter && (() => f.hopp(1)),
        m: harInne && f.byttLyd,
        t: harInne && byttTeksting,
        n: harInne && noter,
        l: harInne && (() => setVisLysbilde((v) => !v)),
        h: harInne && (() => veksle('hjelp')),
        '?': harInne && (() => veksle('hjelp')),
        escape: () => {
            if (panel) setPanel(null);
            else if (visLysbilde) setVisLysbilde(false);
        },
    });

    if (feil) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-slate-50 p-6 text-center">
                <div>
                    <p className="text-lg text-slate-700">{feil}</p>
                    <Link to="/oving/auditoriet" className="mt-4 inline-block text-indigo-600 underline">
                        Til universitetet
                    </Link>
                </div>
            </div>
        );
    }

    const fl = data?.forelesning;
    const sal = (fl && salForFag(fl.fag)) ?? SALER[0];

    return (
        <div ref={ramme} className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#f3ece0]">
            {fl && (
                <SalScene
                    lysbilde={f.lysbilde}
                    tittel={fl.tittel}
                    tavleTekst={fl.tittel}
                    anim={f.anim}
                    utseende={sal.foreleser.utseende}
                    farge={sal.farge}
                    salNavn="Lesesalen"
                    direkte={f.status === 'spiller'}
                    friminutt={f.status === 'ferdig'}
                    modus={modus}
                    sete={sete}
                    onVelgSete={settDeg}
                    onFremme={fremme}
                    onNaerSete={setNaerSete}
                />
            )}

            <Toppstripe
                tilbake="/oving/auditoriet"
                tilbakeTekst="Universitetet"
                fullskjerm={fullskjerm}
                onFullskjerm={bytt}
                midt={
                    fl &&
                    modus !== 'ute' && (
                        <div className="rounded-full bg-white/85 px-4 py-1.5 text-sm text-slate-700 shadow backdrop-blur">
                            Lesesalen · <span className="font-semibold">{fl.tittel}</span> med {fl.foreleser.navn}
                        </div>
                    )
                }
            />

            {modus === 'ute' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-2xl backdrop-blur">
                        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Lesesalen</p>
                        {fl ? (
                            <>
                                <h1 className="mt-1 text-3xl font-bold text-slate-900">{fl.tittel}</h1>
                                <p className="mt-1 text-slate-600">
                                    Forelesning med {fl.foreleser.navn}, {fl.foreleser.rolle}. Her starter den fra begynnelsen, og du kan pause og hoppe.
                                </p>
                                {f.harNorskStemme === false && (
                                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                        Denne maskinen har ingen norsk stemme. Du får teksten i lesetempo i stedet.
                                    </p>
                                )}
                                <button
                                    onClick={() => setModus('gaar')}
                                    className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-lg font-semibold text-white shadow transition hover:bg-indigo-700 active:scale-[0.98]"
                                >
                                    Gå inn i salen
                                </button>
                            </>
                        ) : (
                            <p className="mt-2 text-slate-600">Låser opp døra ...</p>
                        )}
                    </div>
                </div>
            )}

            {modus === 'gaar' && !sete && <StaHint naerSete={!!naerSete} onFinnPlass={() => settDeg(bestLedigSete())} />}

            {modus === 'sitter' && fl && (
                <>
                    {f.segment && f.status !== 'ferdig' && <Teksting tekst={f.segment.si} ord={f.ord} storrelse={teksting} />}
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 px-4">
                        <Knapp etikett="Forrige" onClick={() => f.hopp(-1)}>
                            <ChevronLeft size={20} />
                        </Knapp>
                        {f.status === 'ferdig' ? (
                            <Knapp
                                etikett="Hør igjen"
                                onClick={() => {
                                    setQuizApen(false);
                                    f.start(0);
                                }}
                                hoved
                            >
                                <RotateCcw size={20} />
                            </Knapp>
                        ) : (
                            <Knapp
                                etikett={f.status === 'spiller' ? 'Pause' : 'Spill'}
                                onClick={() => (f.status === 'spiller' ? f.pause() : f.fortsett())}
                                hoved
                            >
                                {f.status === 'spiller' ? <Pause size={20} /> : <Play size={20} />}
                            </Knapp>
                        )}
                        <Knapp etikett="Neste" onClick={() => f.hopp(1)}>
                            <ChevronRight size={20} />
                        </Knapp>
                        <div className="mx-2 hidden h-2 w-32 overflow-hidden rounded-full bg-white/70 shadow-inner md:block">
                            <div
                                className="h-full rounded-full bg-amber-500 transition-all"
                                style={{ width: `${((f.indeks + (f.status === 'ferdig' ? 1 : 0)) / Math.max(1, f.antall)) * 100}%` }}
                            />
                        </div>
                        <Knapp etikett={f.lydPa ? 'Lyd av (M)' : 'Lyd på (M)'} onClick={f.byttLyd}>
                            {f.lydPa ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </Knapp>
                        <Knapp etikett="Teksting (T)" onClick={byttTeksting} aktiv={teksting === 'stor'}>
                            {teksting === 'av' ? <CaptionsOff size={20} /> : <Captions size={20} />}
                        </Knapp>
                        <span className="relative">
                            <Knapp etikett="Notatblokka (N noterer)" onClick={() => veksle('notater')} aktiv={panel === 'notater'}>
                                <NotebookPen size={20} />
                            </Knapp>
                            {antallNotater > 0 && (
                                <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                                    {antallNotater}
                                </span>
                            )}
                        </span>
                        <Knapp etikett="Se lysbildet (L)" onClick={() => setVisLysbilde(true)}>
                            <Monitor size={20} />
                        </Knapp>
                        <Knapp etikett="Hurtigtaster (H)" onClick={() => veksle('hjelp')}>
                            <Keyboard size={20} />
                        </Knapp>
                        <button
                            onClick={reisDeg}
                            className="rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow backdrop-blur hover:bg-white"
                        >
                            Reis deg (Q)
                        </button>
                    </div>
                </>
            )}

            {visLysbilde && fl && (
                <StortLysbilde
                    lysbilde={f.lysbilde}
                    tittel={fl.tittel}
                    onLukk={() => setVisLysbilde(false)}
                    onForrige={() => f.hopp(-1)}
                    onNeste={() => f.hopp(1)}
                />
            )}

            {quizApen && data && fl && (
                <Sporsmalskort
                    tittel={fl.tittel}
                    kilde={fl.kilde}
                    fag={fl.fag}
                    emne={fl.emne}
                    sporsmal={data.sporsmal}
                    onLukk={() => setQuizApen(false)}
                    onIgjen={() => {
                        setQuizApen(false);
                        f.start(0);
                    }}
                />
            )}

            {panel === 'notater' && fl && <NotatPanel sti={sti} tittel={fl.tittel} onLukk={() => setPanel(null)} />}
            {panel === 'hjelp' && <Hurtigtaster taster={TASTER} onLukk={() => setPanel(null)} />}

            <Melding tekst={melding} />
        </div>
    );
}
