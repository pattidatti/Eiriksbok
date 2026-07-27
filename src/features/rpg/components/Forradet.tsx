// Bua: forrådet, og valgene året tvinger fram (blueprint §4, kapittel 2).
//
// Dette er husfruas makt gjort til en mekanikk. Åsa har nøklene, og skjermen
// her er det de låser opp: hun ser hva gården har, hva vinteren kommer til å
// kreve, og hva hvert valg koster - *før* hun velger.
//
// **Regnestykket står framme hele tiden.** Det er hele grepet. Et spill som
// skjuler behovet til vinteren kommer, måler flaks; et spill som viser det,
// måler om eleven forsto at høsten begynner om våren. Tallene kommer fra
// `vinterregnskap`, den samme funksjonen som gjør opp til slutt - to
// regnestykker for det samme er den sikreste måten å gjøre et spill urettferdig
// på.
//
// Skjermen avgjør ingenting. Den melder hva Åsa bestemte, og scenen eier
// følgene - som for puzzlene og kildebordet.

import { motion } from 'framer-motion';
import {
    AARSVALG,
    KORN_PER_DYR,
    KORN_PER_KJOTT,
    KORN_PER_MUNN,
    MUNNER,
    VAARONN_SISTE_DAG,
    vinterregnskap,
} from '../data/aaret';
import { AARSTID, aarstidFor, dagIAarstid } from '../engine/klokke';
import { useRpgStore } from '../store/useRpgStore';
import type { Aarsvalg } from '../data/aaret';

interface Props {
    /** Valgene som står åpne nå. Scenen avgjør hvilke - den kjenner året. */
    apne: string[];
    /** Kan hun la året gå videre herfra? */
    kanGaaVidere: boolean;
    onValg: (beslutning: string, alternativ: string) => void;
    onGaaVidere: () => void;
    onLukk: () => void;
}

export function Forradet({ apne, kanGaaVidere, onValg, onGaaVidere, onLukk }: Props) {
    const forrad = useRpgStore((s) => s.forrad);
    const klokke = useRpgStore((s) => s.klokke);
    const regnskap = vinterregnskap(forrad);
    const aarstid = AARSTID[aarstidFor(klokke.dag)];
    const valg = AARSVALG.filter((v) => apne.includes(v.id));

    return (
        <div
            data-prove="forradet"
            className="absolute inset-0 z-50 overflow-y-auto bg-[#171208]/97 px-3 py-5 backdrop-blur-sm"
        >
            <div className="mx-auto w-full max-w-4xl">
                <header className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">
                            Bua · nøklene dine
                        </p>
                        <h2 className="font-display text-2xl font-bold text-amber-50">
                            Alt gården har
                        </h2>
                    </div>
                    <p className="font-display text-sm font-bold" style={{ color: aarstid.farge }}>
                        {aarstid.navn}, dag {dagIAarstid(klokke.dag)} · {klokke.aar}
                    </p>
                </header>

                <div className="grid gap-2 sm:grid-cols-4">
                    <Binge navn="Korn" verdi={forrad.korn} enhet="sekker" farge="#e0c26a" />
                    <Binge navn="Kjøtt" verdi={forrad.kjott} enhet="mål" farge="#c47a5a" />
                    <Binge navn="Dyr" verdi={forrad.dyr} enhet="kyr og sauer" farge="#a3b58a" />
                    {/*
                        Åkeren står ved siden av bingene, ikke i regnestykket
                        under: den er ikke mat før den er høstet. Det er nettopp
                        det eleven skal kjenne på gjennom sommeren.
                    */}
                    <Binge navn="Åker" verdi={forrad.aaker} enhet="står på rot" farge="#8fc46a" />
                </div>

                {/* ── Regnestykket ────────────────────────────────────────── */}
                <section
                    data-prove="vinterregnskap"
                    className="mt-3 rounded-xl border border-amber-900/50 bg-[#221a10] p-4"
                >
                    <h3 className="font-display text-lg font-bold text-amber-100">
                        Hva vinteren kommer til å kreve
                    </h3>
                    <dl className="mt-2 space-y-1 text-[14px] text-amber-50/80">
                        <Linje
                            merke={`${MUNNER} munner å mette`}
                            verdi={`${MUNNER * KORN_PER_MUNN} sekker`}
                        />
                        <Linje
                            merke={`${forrad.dyr} dyr som skal ha fôr`}
                            verdi={`${forrad.dyr * KORN_PER_DYR} sekker`}
                        />
                        <Linje
                            merke={`${forrad.kjott} mål kjøtt dekker`}
                            verdi={`${regnskap.fraKjott} sekker`}
                            gunstig
                        />
                    </dl>
                    <p
                        data-prove="margin"
                        data-margin={regnskap.margin}
                        className={`mt-3 border-t border-amber-100/10 pt-3 font-display text-lg font-bold ${
                            regnskap.margin >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                    >
                        {regnskap.margin >= 0
                            ? `Til overs: ${regnskap.margin} sekker`
                            : `Det mangler ${Math.abs(regnskap.margin)} sekker`}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/50">
                        Ett mål kjøtt metter like mye som {KORN_PER_KJOTT} sekker korn. Regnestykket
                        endrer seg med hvert valg du tar - det er derfor det står framme.
                    </p>
                </section>

                {/* ── Tavla ved døra ──────────────────────────────────────── */}
                {aarstidFor(klokke.dag) === 'vaar' && (
                    <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[13px] leading-relaxed text-amber-100/70">
                        Det står skåret i dørkarmen, av en som er død: «Kornet i jorda før våronna
                        er omme.» Våronna varer til dag {VAARONN_SISTE_DAG}.
                    </p>
                )}

                {/* ── Valgene ─────────────────────────────────────────────── */}
                {valg.map((v) => (
                    <Valgkort key={v.id} valg={v} onValg={(alt) => onValg(v.id, alt)} />
                ))}

                {valg.length === 0 && (
                    <p className="mt-4 rounded-xl border border-amber-100/10 bg-black/20 px-4 py-3 text-[15px] text-amber-100/60">
                        Ingenting mer å avgjøre i bua nå. Det som skal skje denne årstiden, skjer
                        ute på gården.
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    {kanGaaVidere && (
                        <button
                            type="button"
                            data-prove="gaa-videre"
                            onClick={onGaaVidere}
                            className="flex-1 rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
                        >
                            La året gå videre
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onLukk}
                        className="flex-1 rounded-xl border border-amber-100/15 px-5 py-3 text-sm text-amber-100/60 transition hover:bg-amber-100/5"
                    >
                        Lås bua (Esc)
                    </button>
                </div>
            </div>
        </div>
    );
}

function Binge({
    navn,
    verdi,
    enhet,
    farge,
}: {
    navn: string;
    verdi: number;
    enhet: string;
    farge: string;
}) {
    return (
        <div
            data-prove={`binge-${navn.toLowerCase()}`}
            className="rounded-xl border border-amber-900/40 bg-[#241a10] px-3 py-2.5"
        >
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/40">
                {navn}
            </p>
            <p className="font-display text-2xl font-bold" style={{ color: farge }}>
                {verdi}
            </p>
            <p className="text-[11px] text-amber-100/40">{enhet}</p>
        </div>
    );
}

function Linje({
    merke,
    verdi,
    gunstig,
}: {
    merke: string;
    verdi: string;
    gunstig?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <dt>{merke}</dt>
            <dd
                className={`font-display font-bold ${
                    gunstig ? 'text-emerald-300/90' : 'text-amber-200/90'
                }`}
            >
                {gunstig ? '+' : '−'}
                {verdi}
            </dd>
        </div>
    );
}

/**
 * Ett valg, med prisen på hvert alternativ.
 *
 * Prisen står på knappen, ikke i en forklaring under. Eleven skal aldri måtte
 * gjette hva et valg koster - det er ikke spenning, det er å skjule reglene.
 */
function Valgkort({ valg, onValg }: { valg: Aarsvalg; onValg: (alternativ: string) => void }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            data-prove={`valg-${valg.id}`}
            className="mt-3 rounded-xl border border-amber-900/50 bg-[#241a14] p-4"
        >
            <h3 className="font-display text-lg font-bold text-amber-100">{valg.tittel}</h3>
            {valg.tekst.split('\n\n').map((a, i) => (
                <p key={i} className="mt-2 text-[15px] leading-relaxed text-amber-50/85">
                    {a}
                </p>
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {valg.alternativer.map((alt) => (
                    <button
                        key={alt.id}
                        type="button"
                        onClick={() => onValg(alt.id)}
                        className="rounded-xl border border-amber-100/15 bg-amber-100/5 px-3 py-3 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10"
                    >
                        <span className="block font-display text-[15px] font-bold text-amber-50">
                            {alt.knapp}
                        </span>
                        <span className="mt-0.5 block text-[12px] font-semibold text-amber-200/80">
                            {alt.pris}
                        </span>
                        <span className="mt-1 block text-[12px] leading-snug text-amber-100/50">
                            {alt.folge}
                        </span>
                    </button>
                ))}
            </div>
        </motion.section>
    );
}
