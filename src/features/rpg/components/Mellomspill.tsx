// Mellomspillet: bordet med kildene (blueprint §6).
//
// Eleven er ute av året hun spilte. Foran henne står et bord, og på bordet
// legger hun ut kildene om det hun nettopp gjorde: hun leser dem, og hun veier
// dem. Ingen kamp, ingen tidspress, ingen poeng for å svare fort.
//
// **Det tredje feltet er hele poenget.** Hun får ikke opplyst at det ikke
// finnes noen norrøn kilde om Lindisfarne - hun får en knapp som sier «se etter
// en norrøn kilde», og så blir feltet stående tomt mens hun ser på det. Det er
// forskjellen på å lese en opplysning og å oppdage den, og den forskjellen er
// grunnen til at hun utførte raidet selv.
//
// To ting som ikke skjer her:
//
//   - **Bordet deler ikke ut begreper.** Det melder fra at hun la kildene fra
//     seg, og hva hun rakk. Konteringen ligger i `WorldScene.avsluttMellomspill`,
//     ved siden av alt annet som gir eleven noe.
//   - **Bordet straffer ikke et feil valg.** Fasiten står uansett hva hun
//     svarte. Uten tidspress og uten kamp er det ingenting å straffe - og et
//     bom er ofte den korteste veien inn i hvorfor.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ART_NAVN, KILDE_BY_ID, NAERHET_FORKLARING, NAERHET_NAVN } from '../data/kilder';
import { useRpgStore } from '../store/useRpgStore';
import type { MellomspillDef, Veiing } from '../types';

type Steg =
    | { art: 'apning' }
    /** Kilde nummer `i` ligger på bordet, og veies. */
    | { art: 'kort'; i: number }
    /** Feltet som blir stående tomt. */
    | { art: 'tomt' }
    | { art: 'slutt' };

interface Props {
    def: MellomspillDef;
    /** `gjennomgatt` er falsk når hun gikk før det tomme feltet. */
    onFerdig: (gjennomgatt: boolean) => void;
}

export function Mellomspill({ def, onFerdig }: Props) {
    const flagg = useRpgStore((s) => s.flagg);
    const lesKilde = useRpgStore((s) => s.lesKilde);

    const [steg, setSteg] = useState<Steg>({ art: 'apning' });
    /** Hvor mange kilder som ligger på bordet nå. Styrer feltene øverst. */
    const [lagtUt, setLagtUt] = useState(0);
    const [tomtVist, setTomtVist] = useState(false);

    const kort = steg.art === 'kort' ? def.kort[steg.i] : null;
    const kilde = kort ? KILDE_BY_ID[kort.kildeId] : null;

    const leggUt = (i: number) => {
        const neste = def.kort[i];
        if (neste) lesKilde(neste.kildeId);
        setLagtUt(i + 1);
        setSteg({ art: 'kort', i });
    };

    /** Etter siste veiing på et kort: neste kilde, eller det tomme feltet. */
    const etterKort = (i: number) => {
        if (i + 1 < def.kort.length) {
            leggUt(i + 1);
            return;
        }
        setSteg(def.tomtFelt ? { art: 'tomt' } : { art: 'slutt' });
    };

    return (
        <div
            className="absolute inset-0 z-50 overflow-y-auto bg-[#1b1410]/97 px-3 py-5 backdrop-blur-sm"
            data-prove="mellomspill"
        >
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">
                            Mellomspill {def.nr}
                        </p>
                        <h2 className="font-display text-2xl font-bold text-amber-50">
                            {def.tittel}
                        </h2>
                    </div>
                    <p className="text-xs text-amber-100/40">
                        Ingen tid å ta igjen. Les så lenge du vil.
                    </p>
                </header>

                <Bordet def={def} lagtUt={lagtUt} tomtVist={tomtVist} />

                {steg.art === 'apning' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-amber-100">
                            {def.apning.tittel}
                        </h3>
                        <Avsnitt tekst={def.apning.tekst} />
                        <Hovedknapp
                            tekst={def.kort[0]?.knapp ?? 'Begynn'}
                            onClick={() => leggUt(0)}
                        />
                    </Ark>
                )}

                {steg.art === 'kort' && kort && kilde && (
                    // To spalter på en vanlig klasseromsskjerm: kilden til
                    // venstre, spørsmålet til høyre. Under hverandre måtte
                    // eleven rulle vekk teksten hun skulle veie for å se
                    // alternativene, og det er nettopp den bevegelsen som gjør
                    // at hun svarer på hukommelsen i stedet for på kilden.
                    <Ark key={kilde.id}>
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
                            <Kildekort kildeId={kilde.id} />
                            <Veiingene
                                key={kilde.id}
                                veiinger={kort.veiinger}
                                sisteKnapp={
                                    steg.i + 1 < def.kort.length
                                        ? (def.kort[steg.i + 1]?.knapp ?? 'Videre')
                                        : (def.tomtFelt?.knapp ?? 'Videre')
                                }
                                onFerdig={() => etterKort(steg.i)}
                            />
                        </div>
                    </Ark>
                )}

                {steg.art === 'tomt' && def.tomtFelt && (
                    <Ark>
                        {!tomtVist ? (
                            <>
                                <p className="text-[15px] leading-relaxed text-amber-100/80">
                                    To kilder ligger på bordet. Begge er skrevet av dem du gikk løs
                                    på.
                                </p>
                                <p className="mt-2 text-[15px] leading-relaxed text-amber-100/80">
                                    Det er ett felt igjen. Legg ut det som er skrevet på ditt eget
                                    språk, av dine egne, om det du gjorde i sommer.
                                </p>
                                <Hovedknapp
                                    tekst={def.tomtFelt.knapp}
                                    onClick={() => setTomtVist(true)}
                                />
                            </>
                        ) : (
                            <div data-prove="tomt-felt">
                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.9, delay: 0.5 }}
                                    className="font-display text-2xl font-bold text-amber-100"
                                >
                                    {def.tomtFelt.tittel}
                                </motion.h3>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.9, delay: 1.4 }}
                                >
                                    <Avsnitt tekst={def.tomtFelt.tekst} />
                                    {def.tomtFelt.hvisFlagg &&
                                        flagg[def.tomtFelt.hvisFlagg.flagg] && (
                                            <p className="mt-4 border-l-2 border-rose-400/50 pl-3 text-[15px] leading-relaxed text-rose-200/90">
                                                {def.tomtFelt.hvisFlagg.tekst}
                                            </p>
                                        )}
                                    {/*
                                        Luft. Linja over er kapittelets tyngste
                                        setning, og et spørsmål som klistrer seg
                                        inntil den, gjør den om til en ingress.
                                    */}
                                    <div className="mt-7">
                                        <Veiingene
                                            veiinger={[def.tomtFelt.veiing]}
                                            sisteKnapp="Se på bordet"
                                            onFerdig={() => setSteg({ art: 'slutt' })}
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </Ark>
                )}

                {steg.art === 'slutt' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-amber-100">
                            {def.slutt.tittel}
                        </h3>
                        <Avsnitt tekst={def.slutt.tekst} />
                        <Hovedknapp tekst={def.slutt.knapp} onClick={() => onFerdig(true)} />
                    </Ark>
                )}

                {steg.art !== 'slutt' && (
                    <button
                        type="button"
                        onClick={() => onFerdig(false)}
                        className="mt-4 w-full rounded-lg border border-amber-100/15 px-4 py-2 text-sm text-amber-100/50 transition hover:bg-amber-100/5"
                    >
                        Gå fra bordet (Esc). Kildene blir liggende.
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Bordet ─────────────────────────────────────────────────────────────────

/**
 * De tre feltene, sett ovenfra.
 *
 * Feltet som blir stående tomt har samme størrelse som de to andre hele veien.
 * Det er med vilje: det skal se ut som en plass det mangler noe i, ikke som en
 * plass det aldri var ment å ligge noe på.
 */
function Bordet({
    def,
    lagtUt,
    tomtVist,
}: {
    def: MellomspillDef;
    lagtUt: number;
    tomtVist: boolean;
}) {
    return (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-amber-900/40 bg-[#2b2018] p-2 shadow-inner sm:gap-3 sm:p-3">
            {def.kort.map((k, i) => {
                const kilde = KILDE_BY_ID[k.kildeId];
                const pa = i < lagtUt;
                return (
                    <div
                        key={k.kildeId}
                        className={`min-h-[4.5rem] rounded-lg border px-2 py-2 sm:px-3 ${
                            pa
                                ? 'border-amber-200/30 bg-[#e8dcc2] text-[#2b2018]'
                                : 'border-dashed border-amber-100/15 bg-black/20'
                        }`}
                    >
                        {pa && kilde ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10, rotate: -1.5 }}
                                animate={{ opacity: 1, y: 0, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            >
                                <p className="font-display text-[13px] font-bold leading-tight">
                                    {kilde.navn}
                                </p>
                                <p className="mt-1 text-[11px] text-[#6b5a45]">
                                    {ART_NAVN[kilde.art]} · {NAERHET_NAVN[kilde.naerhet]}
                                </p>
                            </motion.div>
                        ) : (
                            <p className="text-[11px] uppercase tracking-widest text-amber-100/25">
                                Felt {i + 1}
                            </p>
                        )}
                    </div>
                );
            })}

            {def.tomtFelt && (
                <div
                    className={`min-h-[4.5rem] rounded-lg border border-dashed px-2 py-2 sm:px-3 ${
                        tomtVist ? 'border-rose-300/30 bg-black/30' : 'border-amber-100/15 bg-black/20'
                    }`}
                >
                    {tomtVist ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <p className="font-display text-[13px] font-bold leading-tight text-rose-200/80">
                                Norrøn kilde
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-widest text-rose-200/50">
                                Ingen
                            </p>
                        </motion.div>
                    ) : (
                        <p className="text-[11px] uppercase tracking-widest text-amber-100/25">
                            Felt {def.kort.length + 1}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Kilden og veiingen ─────────────────────────────────────────────────────

/** Kortet slik det ligger på bordet: hvem, hvor, for hvem, og hva det sier. */
function Kildekort({ kildeId }: { kildeId: string }) {
    const kilde = KILDE_BY_ID[kildeId];
    if (!kilde) return null;
    return (
        <div className="rounded-xl border border-amber-200/20 bg-[#e8dcc2] p-4 text-[#2b2018] shadow-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="font-display text-lg font-bold">{kilde.navn}</h3>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7a6549]">
                    {ART_NAVN[kilde.art]} · {kilde.aar}
                </p>
            </div>

            <dl className="mt-3 grid gap-y-1.5 text-[13px]">
                <Rad merke="Skrevet av" verdi={kilde.opphav.hvem} />
                <Rad merke="Skrevet i" verdi={kilde.opphav.hvor} />
                <Rad merke="Skrevet til" verdi={kilde.opphav.for} />
                <Rad merke="Vil oppnå" verdi={kilde.opphav.hensikt} />
            </dl>

            <p className="mt-3 inline-block rounded border border-[#7a6549]/30 px-2 py-0.5 text-[11px] font-semibold text-[#6b5a45]">
                {NAERHET_NAVN[kilde.naerhet]}: {NAERHET_FORKLARING[kilde.naerhet]}
            </p>

            <div className="mt-3 border-l-4 border-l-[#b9a179] pl-3">
                {kilde.utdrag.split('\n\n').map((a, i) => (
                    <p key={i} className={`text-[15px] italic leading-relaxed ${i ? 'mt-2' : ''}`}>
                        «{a}»
                    </p>
                ))}
            </div>

            <p className="mt-3 text-[11px] text-[#7a6549]">{kilde.henvisning}</p>
        </div>
    );
}

function Rad({ merke, verdi }: { merke: string; verdi: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#7a6549]">
                {merke}
            </dt>
            <dd className="leading-snug">{verdi}</dd>
        </div>
    );
}

/**
 * Spørsmålene som veier én kilde, ett om gangen.
 *
 * Har sin egen tilstand, og nullstilles av `key` når kilden skifter. Det er
 * enklere enn å løfte to tellere opp i bordet, og det gjør at et kort ikke kan
 * arve halvferdige svar fra det forrige.
 */
function Veiingene({
    veiinger,
    sisteKnapp,
    onFerdig,
}: {
    veiinger: Veiing[];
    sisteKnapp: string;
    onFerdig: () => void;
}) {
    const [i, setI] = useState(0);
    const [valgt, setValgt] = useState<number | null>(null);

    const naa = veiinger[i];
    if (!naa) return null;
    const sisteSporsmal = i + 1 >= veiinger.length;

    const videre = () => {
        setValgt(null);
        if (sisteSporsmal) onFerdig();
        else setI(i + 1);
    };

    return (
        <div data-prove="veiing">
            <p className="font-display text-lg font-bold text-amber-100">{naa.sporsmal}</p>

            {valgt === null ? (
                <div className="mt-3 grid gap-2">
                    {naa.svar.map((s, n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setValgt(n)}
                            className="rounded-xl border border-amber-100/15 bg-amber-100/5 px-4 py-3 text-left text-[15px] leading-snug text-amber-50 transition hover:border-amber-300/60 hover:bg-amber-300/10"
                        >
                            {s.tekst}
                        </button>
                    ))}
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3"
                    >
                        <p
                            className={`font-display text-base font-bold ${
                                naa.svar[valgt]?.riktig ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                        >
                            {naa.svar[valgt]?.respons}
                        </p>
                        <Avsnitt tekst={naa.fasit} />
                        <Hovedknapp
                            tekst={sisteSporsmal ? sisteKnapp : 'Neste spørsmål'}
                            onClick={videre}
                        />
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}

// ─── Småting ────────────────────────────────────────────────────────────────

function Ark({ children }: { children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 rounded-2xl border border-amber-900/40 bg-[#241a14] p-4 shadow-2xl sm:p-5"
        >
            {children}
        </motion.section>
    );
}

function Avsnitt({ tekst }: { tekst: string }) {
    return (
        <>
            {tekst.split('\n\n').map((a, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-amber-50/90">
                    {a}
                </p>
            ))}
        </>
    );
}

function Hovedknapp({ tekst, onClick }: { tekst: string; onClick: () => void }) {
    return (
        <button
            type="button"
            autoFocus
            onClick={onClick}
            className="mt-4 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
        >
            {tekst}
        </button>
    );
}
