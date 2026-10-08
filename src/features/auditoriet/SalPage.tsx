// En sal på universitetet: forelesningene går hele tiden, etter klokka.
//
//   /oving/auditoriet/historie
//
// Kommer du midt i en forelesning, kommer du midt i. Alle i salen er på samme sted.
// Etter hver forelesning er det friminutt, og har du hørt nok av den, kan du ta
// spørsmålene mens du venter på neste.

import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { HelpCircle, Monitor, Volume2, VolumeX } from 'lucide-react';
import { useDirekte } from './useDirekte';
import { klokkeslett, tidIgjen } from './kringkasting';
import type { Sporsmal } from './types';
import { SalScene } from './scene/SalScene';
import type { SpillerModus } from './scene/Spiller';
import { bestLedigSete, type Sete } from './scene/salGeometri';
import { Knapp, Sporsmalskort, StaHint, StortLysbilde, Teksting, Toppstripe } from './komponenter';
import { hentSporsmal, useFullskjerm, useHeleSkjermen } from './hjelpere';
import { UNIVERSITET } from './saler';

/** Tikker hvert sekund, så nedtelling og fremdrift holder seg oppdatert. */
function useKlokke() {
    const [naa, setNaa] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNaa(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    return naa;
}

export function SalPage() {
    useHeleSkjermen();
    const { salId = '' } = useParams();
    // Kommer eleven fra gangen, har hen allerede gått inn: ingen introkort, og lyden er lov.
    const fraGangen = !!(useLocation().state as { fraGangen?: boolean } | null)?.fraGangen;
    const [inne, setInne] = useState(fraGangen);
    const d = useDirekte(salId, inne);
    const naa = useKlokke();
    const { ramme, fullskjerm, bytt } = useFullskjerm();

    const [modus, setModus] = useState<SpillerModus>(fraGangen ? 'gaar' : 'ute');
    const [sete, setSete] = useState<Sete | null>(null);
    const [naerSete, setNaerSete] = useState<Sete | null>(null);
    const [visLysbilde, setVisLysbilde] = useState(false);
    const [sporsmal, setSporsmal] = useState<Sporsmal[] | null>(null);

    const settDeg = useCallback((s: Sete) => {
        setSete(s);
        setNaerSete(null);
    }, []);
    const reisDeg = useCallback(() => {
        setSete(null);
        setModus('gaar');
    }, []);

    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.closest('input, textarea, button')) return;
            const k = e.key.toLowerCase();
            if (k === 'e' && modus === 'gaar' && naerSete && !sete) settDeg(naerSete);
            if (k === 'q' && modus === 'sitter') reisDeg();
            if (k === 'escape' && visLysbilde) setVisLysbilde(false);
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
    }, [modus, naerSete, sete, settDeg, reisDeg, visLysbilde]);

    const sal = d.sal;
    if (!sal || d.feil) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-slate-50 p-6 text-center">
                <div>
                    <p className="text-lg text-slate-700">{d.feil ?? 'Den salen finnes ikke.'}</p>
                    <Link to="/oving/auditoriet" className="mt-4 inline-block text-indigo-600 underline">
                        Til universitetet
                    </Link>
                </div>
            </div>
        );
    }

    const s = d.sending;
    const tittel = s?.post.tittel ?? sal.navn;
    const fremdrift = s && !s.friminutt ? Math.min(1, (naa - s.start) / (s.slutt - s.start)) : 0;

    const status = !s ? (
        'Henter programmet ...'
    ) : s.friminutt ? (
        <>
            Friminutt · neste: <b>{s.neste.tittel}</b> kl. {klokkeslett(s.nesteStart)}
        </>
    ) : (
        <>
            <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500 align-middle" />
            <b>{s.post.tittel}</b> · {tidIgjen(s.slutt - naa)}
        </>
    );

    return (
        <div ref={ramme} className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#f3ece0]">
            <SalScene
                lysbilde={d.lysbilde}
                tittel={tittel}
                tavleTekst={s?.friminutt ? sal.navn : tittel}
                anim={d.anim}
                utseende={sal.foreleser.utseende}
                modus={modus}
                sete={sete}
                onVelgSete={settDeg}
                onFremme={() => setModus('sitter')}
                onNaerSete={setNaerSete}
            />

            <Toppstripe
                tilbake="/oving/auditoriet"
                tilbakeTekst="Til gangen"
                fullskjerm={fullskjerm}
                onFullskjerm={bytt}
                midt={
                    modus !== 'ute' && (
                        <div className="min-w-0 truncate rounded-full bg-white/85 px-4 py-1.5 text-sm text-slate-700 shadow backdrop-blur">
                            {sal.navn} · {status}
                        </div>
                    )
                }
            />

            {modus === 'ute' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-2xl backdrop-blur">
                        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: sal.farge }}>
                            {UNIVERSITET}
                        </p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900">{sal.navn}</h1>
                        <p className="mt-1 text-slate-600">
                            {sal.foreleser.navn}, {sal.foreleser.rolle}, foreleser her hele døgnet.
                        </p>
                        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{status}</div>
                        {d.harNorskStemme === false && (
                            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                Denne maskinen har ingen norsk stemme. Du får teksten i lesetempo i stedet.
                            </p>
                        )}
                        <button
                            onClick={() => {
                                setInne(true);
                                setModus('gaar');
                            }}
                            className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-lg font-semibold text-white shadow transition hover:bg-indigo-700 active:scale-[0.98]"
                        >
                            Gå inn i salen
                        </button>
                    </div>
                </div>
            )}

            {modus === 'gaar' && !sete && <StaHint naerSete={!!naerSete} onFinnPlass={() => settDeg(bestLedigSete())} />}

            {inne && d.segment && <Teksting tekst={d.segment.si} ord={d.ord} />}

            {modus === 'sitter' && (
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 px-4">
                    <div className="mx-2 hidden h-2 w-48 overflow-hidden rounded-full bg-white/70 shadow-inner sm:block" title="Hvor langt forelesningen har kommet">
                        <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${fremdrift * 100}%` }} />
                    </div>
                    <Knapp etikett={d.lydPa ? 'Lyd av' : 'Lyd på'} onClick={d.byttLyd}>
                        {d.lydPa ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </Knapp>
                    <Knapp etikett="Se lysbildet" onClick={() => setVisLysbilde(true)}>
                        <Monitor size={20} />
                    </Knapp>
                    <button
                        onClick={reisDeg}
                        className="rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow backdrop-blur hover:bg-white"
                    >
                        Reis deg (Q)
                    </button>
                </div>
            )}

            {/* Spørsmålene etter en forelesning du har hørt */}
            {d.sporsmalFor && !sporsmal && modus !== 'ute' && (
                <div className="absolute right-4 top-16 z-10 max-w-xs rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                    <p className="text-sm text-slate-600">Du hørte forelesningen om</p>
                    <p className="font-semibold text-slate-900">{d.sporsmalFor.tittel}</p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => {
                                const post = d.sporsmalFor!;
                                hentSporsmal(post.artikkel)
                                    .then((sp) => (sp.length ? setSporsmal(sp) : d.lukkSporsmal()))
                                    .catch(() => d.lukkSporsmal());
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            <HelpCircle size={16} /> Ta spørsmålene
                        </button>
                        <button onClick={d.lukkSporsmal} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
                            Nei takk
                        </button>
                    </div>
                </div>
            )}

            {sporsmal && d.sporsmalFor && (
                <Sporsmalskort
                    tittel={d.sporsmalFor.tittel}
                    kilde={d.sporsmalFor.kilde}
                    fag={sal.fag}
                    emne={d.sporsmalFor.sti.split('/')[1]}
                    sporsmal={sporsmal}
                    onLukk={() => {
                        setSporsmal(null);
                        d.lukkSporsmal();
                    }}
                />
            )}

            {visLysbilde && <StortLysbilde lysbilde={d.lysbilde} tittel={tittel} onLukk={() => setVisLysbilde(false)} />}
        </div>
    );
}
