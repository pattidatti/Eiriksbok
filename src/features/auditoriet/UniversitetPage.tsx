// Universitetet: gangen med dørene til salene. Inngangen til Auditoriet.
//
//   /oving/auditoriet
//
// Alle salene sender hele tiden. Introkortet viser hva som går nå, med snarveier
// rett inn; eller så går eleven inn i bygget og finner døra selv.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { hentProgram, klokkeslett, sendingNaa, tidIgjen, type Program } from './kringkasting';
import { SALER, UNIVERSITET, type Sal } from './saler';
import { GangScene } from './scene/GangScene';
import type { SpillerModus } from './scene/Spiller';
import { Toppstripe } from './komponenter';
import { useFullskjerm, useHeleSkjermen, useHurtigtaster } from './hjelpere';
import { Grad, StudiebevisPanel, Tast } from './paneler';
import { grad, useStudiebevis } from './studiebevis';

/** Tikker hvert femte sekund; skiltene trenger ikke mer. */
function useKlokke(ms = 5000) {
    const [naa, setNaa] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNaa(Date.now()), ms);
        return () => clearInterval(t);
    }, [ms]);
    return naa;
}

export function UniversitetPage() {
    useHeleSkjermen();
    const navigate = useNavigate();
    const naa = useKlokke();
    const { ramme, fullskjerm, bytt } = useFullskjerm();
    const [program, setProgram] = useState<Program | null>(null);
    const [feil, setFeil] = useState<string | null>(null);
    const [modus, setModus] = useState<SpillerModus>('ute');
    const [naerDor, setNaerDor] = useState<Sal | null>(null);
    const [visBevis, setVisBevis] = useState(false);
    const hort = useStudiebevis((s) => s.hort);
    const antall = Object.keys(hort).length;
    const bevis = useMemo(() => ({ antall, tittel: grad(antall).tittel }), [antall]);

    useEffect(() => {
        hentProgram()
            .then(setProgram)
            .catch((e) => setFeil(e instanceof Error ? e.message : 'Fant ikke programmet.'));
    }, []);

    // Fra gangen går man rett inn i salen; nettleseren har allerede fått et klikk.
    const gaInn = (sal: Sal) => navigate(`/oving/auditoriet/${sal.id}`, { state: { fraGangen: true } });

    useHurtigtaster({
        e: modus === 'gaar' && !!naerDor && (() => gaInn(naerDor!)),
        b: () => setVisBevis((v) => !v),
        escape: () => setVisBevis(false),
    });

    return (
        <div ref={ramme} className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#f3ece0]">
            <GangScene program={program} naa={naa} modus={modus} bevis={bevis} onNaerDor={setNaerDor} onGaInn={gaInn} />

            <Toppstripe
                tilbake="/oving"
                tilbakeTekst="Øving"
                fullskjerm={fullskjerm}
                onFullskjerm={bytt}
                midt={
                    modus === 'gaar' && (
                        <button
                            onClick={() => setVisBevis(true)}
                            title="Studiebeviset (B)"
                            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow hover:bg-amber-200"
                        >
                            <GraduationCap size={16} /> {bevis.tittel} · {antall} hørt
                        </button>
                    )
                }
            />

            {modus === 'ute' && (
                <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-slate-900/15 p-4">
                    <div className="w-full max-w-xl rounded-3xl bg-white/92 p-6 shadow-2xl backdrop-blur">
                        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Auditoriet</p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900">{UNIVERSITET}</h1>
                        <p className="mt-1 text-slate-600">
                            Her går det forelesninger hele døgnet, i alle salene. Gå inn når du vil, og sett deg der det er ledig.
                        </p>
                        <button onClick={() => setVisBevis(true)} className="mt-4 block w-full rounded-2xl bg-amber-50 p-3 text-left hover:bg-amber-100">
                            <Grad kompakt />
                        </button>
                        {feil && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{feil}</p>}
                        <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
                            {SALER.map((sal) => {
                                const s = program ? sendingNaa(sal.id, program.saler[sal.id] ?? [], naa) : null;
                                return (
                                    <li key={sal.id}>
                                        <button
                                            onClick={() => gaInn(sal)}
                                            className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                                        >
                                            <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: sal.farge }} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold text-slate-900">{sal.navn}</span>
                                                <span className="block truncate text-sm text-slate-500">
                                                    {!s
                                                        ? 'Henter programmet ...'
                                                        : s.friminutt
                                                          ? `Friminutt · neste kl. ${klokkeslett(s.nesteStart)}: ${s.neste.tittel}`
                                                          : `Nå: ${s.post.tittel} · ${tidIgjen(s.slutt - naa)}`}
                                                </span>
                                            </span>
                                            {s && !s.friminutt && hort[s.post.sti] && (
                                                <Check size={16} className="shrink-0 text-emerald-600" aria-label="Du har hørt denne" />
                                            )}
                                            <ArrowRight size={18} className="shrink-0 text-slate-300 group-hover:text-indigo-600" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <button
                            onClick={() => setModus('gaar')}
                            className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-lg font-semibold text-white shadow transition hover:bg-indigo-700 active:scale-[0.98]"
                        >
                            Gå inn i bygget
                        </button>
                    </div>
                </div>
            )}

            {modus === 'gaar' && (
                <>
                    {naerDor && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-5 py-2 text-base font-bold text-slate-900 shadow-lg">
                            Trykk E for å gå inn i {naerDor.navn}
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 rounded-2xl bg-white/85 px-4 py-2.5 text-sm text-slate-700 shadow backdrop-blur">
                        <b>WASD</b> eller <b>piltaster</b>: gå · <b>Dra med musa</b>: se deg rundt · <b>Klikk på en dør</b>: gå inn · <Tast>B</Tast> studiebeviset
                    </div>
                </>
            )}

            {visBevis && <StudiebevisPanel onLukk={() => setVisBevis(false)} />}
        </div>
    );
}
