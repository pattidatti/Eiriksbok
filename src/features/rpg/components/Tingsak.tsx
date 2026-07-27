// Tinget: saken, trinn for trinn (blueprint §7.2).
//
// Eleven står på vollen med en sak. Skjermen tar henne gjennom de fire trinnene
// i rekkefølge, og hvert trinn er en regel i samfunnet gjort til et valg:
//
//   Lysingen     Sa hun det høyt i tide? Ellers er det mord.
//   Vitnene      Hvem får lov å stå fram - og hvem får ikke.
//   Hjemmelen    Hva hun anfører. Feil hjemmel taper saken.
//   Dommen       Lovsigemannen sier fram, og de frie mennene avgjør.
//
// **Regnestykket står framme mens hun velger.** Samme regel som i bua: en dom
// eleven ikke kunne regnet ut selv, leser som en terning. Hun skal kunne se at
// hjemmelen er verdt to og vitnet ett, og hun skal kunne se at hun står på to
// når hun trykker.
//
// Skjermen avgjør ingenting. Den melder hva Åsa gjorde, og scenen eier følgene.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LOVHJEMLER } from '../data/ting';
import { innenforFristen, poengNaa, vitneliste } from '../engine/ting';
import { useRpgStore } from '../store/useRpgStore';
import type { Sak } from '../types';

type Trinn = 'lysing' | 'vitner' | 'hjemmel' | 'dom';

interface Props {
    sak: Sak;
    /** Melder ett skritt i saken. Scenen fører den, ikke skjermen. */
    onLys: () => void;
    onVitner: (npcIder: string[]) => void;
    onHjemmel: (id: string) => void;
    onDom: () => void;
    onLukk: () => void;
}

export function Tingsak({ sak, onLys, onVitner, onHjemmel, onDom, onLukk }: Props) {
    const aere = useRpgStore((s) => s.aere);
    const aetter = useRpgStore((s) => s.aetter);
    const klokke = useRpgStore((s) => s.klokke);
    const [trinn, setTrinn] = useState<Trinn>(sak.lyst ? 'vitner' : 'lysing');
    const [valgte, setValgte] = useState<string[]>(sak.vitner);
    const [svar, setSvar] = useState<string | null>(null);

    const kandidater = vitneliste(aetter);
    const iTide = innenforFristen(sak, klokke.dag);
    const poeng = poengNaa({ ...sak, vitner: valgte }, aere);

    return (
        <div
            data-prove="tingsak"
            className="absolute inset-0 z-50 overflow-y-auto bg-[#12151a]/97 px-3 py-5 backdrop-blur-sm"
        >
            <div className="mx-auto w-full max-w-3xl">
                <header className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">
                        Tingvollen · ingen våpen innenfor steinringen
                    </p>
                    <h2 className="font-display text-2xl font-bold text-slate-50">
                        Saken om {sak.offer}
                    </h2>
                </header>

                <Regnskap
                    poeng={poeng.poeng}
                    av={poeng.av}
                    trengs={poeng.trengs}
                    lyst={sak.lyst}
                />

                {/* ── 1. Lysingen ─────────────────────────────────────────── */}
                {trinn === 'lysing' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-slate-50">
                            Å lyse drapet
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            Det skjedde på dag {sak.skjeddeDag}. I dag er det dag {klokke.dag}.
                        </p>
                        {iTide ? (
                            <>
                                <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                                    Sier du det høyt nå, foran folk, er det drap. Drap kan bøtes, og
                                    en sak kan føres. Tier du, er det mord - og mord kan ingen bot
                                    kjøpe deg fri fra.
                                </p>
                                <Hovedknapp
                                    tekst="«Jeg drepte Gaute Gråkappe.»"
                                    onClick={() => {
                                        onLys();
                                        setTrinn('vitner');
                                    }}
                                />
                            </>
                        ) : (
                            <>
                                <p
                                    data-prove="for-sent"
                                    className="mt-2 border-l-2 border-rose-400/60 pl-3 text-[15px] leading-relaxed text-rose-200"
                                >
                                    Døgnet er ute. Du sa ingenting mens det var tid, og nå er det
                                    ikke lenger et drap du står for. Det er et mord.
                                </p>
                                <Hovedknapp tekst="Gå fram på vollen likevel" onClick={() => setTrinn('dom')} />
                            </>
                        )}
                    </Ark>
                )}

                {/* ── 2. Vitnene ──────────────────────────────────────────── */}
                {trinn === 'vitner' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-slate-50">
                            Hvem står fram?
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            Et vitne må ville stå der, og det må ha lov til å stå der. Ingen av
                            delene kan kjøpes.
                        </p>
                        <ul className="mt-3 space-y-2">
                            {kandidater.map((v) => {
                                const valgt = valgte.includes(v.npcId);
                                return (
                                    <li key={v.npcId}>
                                        <button
                                            type="button"
                                            disabled={!v.kan}
                                            data-prove={`vitne-${v.npcId}`}
                                            data-kan={v.kan}
                                            onClick={() =>
                                                setValgte((f) =>
                                                    valgt
                                                        ? f.filter((n) => n !== v.npcId)
                                                        : [...f, v.npcId]
                                                )
                                            }
                                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                                !v.kan
                                                    ? 'cursor-not-allowed border-white/10 bg-black/20 opacity-70'
                                                    : valgt
                                                      ? 'border-sky-300/60 bg-sky-400/10'
                                                      : 'border-white/15 bg-white/5 hover:border-sky-300/40'
                                            }`}
                                        >
                                            <span className="block font-display text-[15px] font-bold text-slate-50">
                                                {v.navn}
                                                {valgt && v.kan ? ' · står fram' : ''}
                                            </span>
                                            <span className="mt-0.5 block text-[13px] leading-snug text-slate-300">
                                                «{v.utsagn}»
                                            </span>
                                            {v.grunn && (
                                                <span className="mt-1 block text-[13px] leading-snug text-rose-300/90">
                                                    {v.grunn}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <Hovedknapp
                            tekst={
                                valgte.length === 0
                                    ? 'Før saken uten vitner'
                                    : `Kall ${valgte.length === 1 ? 'vitnet' : 'vitnene'}`
                            }
                            onClick={() => {
                                onVitner(valgte);
                                setTrinn('hjemmel');
                            }}
                        />
                    </Ark>
                )}

                {/* ── 3. Hjemmelen ────────────────────────────────────────── */}
                {trinn === 'hjemmel' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-slate-50">
                            Hva anfører du?
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            Tinget dømmer etter det du sier, ikke etter det du mener. Én av disse er
                            hjemmelen saken din har.
                        </p>
                        {svar === null ? (
                            <div className="mt-3 grid gap-2">
                                {LOVHJEMLER.map((l) => (
                                    <button
                                        key={l.id}
                                        type="button"
                                        onClick={() => {
                                            setSvar(l.id);
                                            onHjemmel(l.id);
                                        }}
                                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-[15px] leading-snug text-slate-100 transition hover:border-sky-300/50 hover:bg-sky-400/10"
                                    >
                                        «{l.paastand}»
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-sky-300/80">
                                    Torgeir, lovsigemann
                                </p>
                                <p className="mt-1 text-[15px] leading-relaxed text-slate-200">
                                    {LOVHJEMLER.find((l) => l.id === svar)?.fasit}
                                </p>
                                <Hovedknapp tekst="La tinget dømme" onClick={() => setTrinn('dom')} />
                            </motion.div>
                        )}
                    </Ark>
                )}

                {/* ── 4. Dommen ───────────────────────────────────────────── */}
                {trinn === 'dom' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-slate-50">
                            Lovsigemannen sier fram
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            Torgeir reiser seg. Han leser ikke opp av noe - loven står ikke skrevet
                            noe sted. Den bor i hodet på ett menneske, og han sier den fram slik han
                            har hørt den siden han var gutt.
                        </p>
                        <Hovedknapp tekst="Hør dommen" onClick={onDom} />
                    </Ark>
                )}

                {trinn !== 'dom' && (
                    <button
                        type="button"
                        onClick={onLukk}
                        className="mt-4 w-full rounded-lg border border-white/12 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5"
                    >
                        Gå fra vollen (Esc). Saken blir stående.
                    </button>
                )}
            </div>
        </div>
    );
}

/** Det saken står på nå. Framme hele tiden, som regnestykket i bua. */
function Regnskap({
    poeng,
    av,
    trengs,
    lyst,
}: {
    poeng: number;
    av: number;
    trengs: number;
    lyst: boolean;
}) {
    return (
        <div
            data-prove="sakspoeng"
            data-poeng={poeng}
            className="rounded-xl border border-white/12 bg-white/5 px-4 py-3"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-[13px] text-slate-300">
                    Hjemmelen teller to. Ett vitne teller ett. At folk kjenner deg teller ett.{' '}
                    <span className="text-slate-400">{trengs} frikjenner.</span>
                </p>
                <p
                    className={`font-display text-lg font-bold ${
                        poeng >= trengs ? 'text-emerald-300' : 'text-sky-200'
                    }`}
                >
                    {poeng} av {av}
                </p>
            </div>
            {!lyst && (
                <p className="mt-1 text-[13px] text-rose-300/90">
                    Ulyst. Alt annet er uten betydning så lenge det står slik.
                </p>
            )}
        </div>
    );
}

function Ark({ children }: { children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 rounded-2xl border border-white/12 bg-[#1a1f27] p-4 shadow-2xl sm:p-5"
        >
            {children}
        </motion.section>
    );
}

function Hovedknapp({ tekst, onClick }: { tekst: string; onClick: () => void }) {
    return (
        <button
            type="button"
            autoFocus
            onClick={onClick}
            className="mt-4 w-full rounded-xl bg-sky-400 px-5 py-3 font-display text-base font-bold text-[#12151a] transition hover:bg-sky-300"
        >
            {tekst}
        </button>
    );
}
