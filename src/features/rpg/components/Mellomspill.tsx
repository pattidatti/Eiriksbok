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
import type { MellomspillDef, Tidsrekke, Veiing } from '../types';

type Steg =
    | { art: 'apning' }
    /** Alle kildene på én linje. Bare Mellomspill V har dette steget. */
    | { art: 'tidsrekke' }
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

                {/*
                    Feltene står ikke framme mens tidsrekka gjør det. På bordet i
                    1066 ligger alt allerede ute - på linja - og to tomme felter
                    over den ville sagt at det manglet noe der akkurat i det
                    øyeblikket hun ser at ingenting mangler. De kommer når det
                    siste kortet legges ut.
                */}
                {(!def.tidsrekke ||
                    (steg.art !== 'apning' && steg.art !== 'tidsrekke')) && (
                    <Bordet def={def} lagtUt={lagtUt} tomtVist={tomtVist} />
                )}

                {steg.art === 'apning' && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-amber-100">
                            {def.apning.tittel}
                        </h3>
                        <Avsnitt tekst={def.apning.tekst} />
                        <Hovedknapp
                            tekst={
                                def.tidsrekke?.knapp ?? def.kort[0]?.knapp ?? 'Begynn'
                            }
                            onClick={() =>
                                def.tidsrekke ? setSteg({ art: 'tidsrekke' }) : leggUt(0)
                            }
                        />
                    </Ark>
                )}

                {steg.art === 'tidsrekke' && def.tidsrekke && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-amber-100">
                            {def.tidsrekke.tittel}
                        </h3>
                        <Avsnitt tekst={def.tidsrekke.tekst} />
                        <Linja rekke={def.tidsrekke} />
                        <div className="mt-6">
                            <Veiingene
                                veiinger={[def.tidsrekke.veiing]}
                                sisteKnapp={def.kort[0]?.knapp ?? 'Videre'}
                                onFerdig={() => leggUt(0)}
                            />
                        </div>
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
                                {/*
                                    Oppfordringen er data. Sto den fast her, ville
                                    bordet i 872 påstått at Snorre var skrevet av
                                    noen eleven hadde angrepet - og bordet i 1066
                                    at det lå to kort framme når det ligger ni.
                                */}
                                <Avsnitt tekst={def.tomtFelt.oppfordring} />
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
                                    {/*
                                        Linjene eleven selv har satt. I 793 og 1030
                                        er det én; i 1066 er det hele livet hennes,
                                        kapittel for kapittel, og lengden på lista
                                        er halve poenget mot feltet som står tomt.
                                    */}
                                    {def.tomtFelt.hvisFlagg
                                        ?.filter((l) => flagg[l.flagg])
                                        .map((l) => (
                                            <p
                                                key={l.flagg}
                                                className="mt-4 border-l-2 border-rose-400/50 pl-3 text-[15px] leading-relaxed text-rose-200/90"
                                            >
                                                {l.tekst}
                                            </p>
                                        ))}
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
    // Antall felter følger bordet, ikke et fast tall. Bordene i 793-1030 har to
    // kort og et tomt felt; bordet i 1066 har lagt ut åtte kilder på linja alt,
    // og har ett kort igjen. Tre spalter der ville etterlatt et hull som leser
    // som at noe manglet - og det er nettopp den betydningen det tomme feltet
    // eier.
    const spalter = def.kort.length + (def.tomtFelt ? 1 : 0);
    return (
        <div
            className="grid gap-2 rounded-xl border border-amber-900/40 bg-[#2b2018] p-2 shadow-inner sm:gap-3 sm:p-3"
            style={{ gridTemplateColumns: `repeat(${spalter}, minmax(0, 1fr))` }}
        >
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
                                {def.tomtFelt.feltNavn}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-widest text-rose-200/50">
                                {def.tomtFelt.feltSvar}
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

            {/*
                Merkene følger kilden. Sju av åtte er tekster, og for dem står
                «Skrevet av». Det åttende er et skrin, og et skrin er ikke
                skrevet av noen - sto merket fast, ville kortet påstått at en
                gjenstand har en forfatter.
            */}
            <dl className="mt-3 grid gap-y-1.5 text-[13px]">
                <Rad merke={kilde.merker?.hvem ?? 'Skrevet av'} verdi={kilde.opphav.hvem} />
                <Rad merke={kilde.merker?.hvor ?? 'Skrevet i'} verdi={kilde.opphav.hvor} />
                <Rad merke={kilde.merker?.for ?? 'Skrevet til'} verdi={kilde.opphav.for} />
                <Rad
                    merke={kilde.merker?.hensikt ?? 'Vil oppnå'}
                    verdi={kilde.opphav.hensikt}
                />
            </dl>

            <p className="mt-3 inline-block rounded border border-[#7a6549]/30 px-2 py-0.5 text-[11px] font-semibold text-[#6b5a45]">
                {NAERHET_NAVN[kilde.naerhet]}: {NAERHET_FORKLARING[kilde.naerhet]}
            </p>

            <div className="mt-3 border-l-4 border-l-[#b9a179] pl-3">
                {/*
                    `whitespace-pre-line` fordi en av kildene er et kvad.
                    Verselinjene i Haraldskvadet er ikke ombrekking - de er
                    formen som gjorde at diktet lot seg huske utenat i tre
                    hundre år, og det er nettopp det den første veiingen spør
                    om. Kildene i prosa deler avsnitt med blank linje og merker
                    ikke forskjellen.
                */}
                {/*
                    En gjenstand siteres ikke. Hermetegnene står om det kilden
                    *sier*, og skrinet fra Melhus sier ingenting - kortet
                    beskriver det. Sto anførselen der, ville bordet gitt et stykke
                    barlind en stemme det ikke har, i det ene mellomspillet som
                    handler om at det ikke finnes noen.
                */}
                {kilde.utdrag.split('\n\n').map((a, i) => (
                    <p
                        key={i}
                        className={`whitespace-pre-line text-[15px] italic leading-relaxed ${i ? 'mt-2' : ''}`}
                    >
                        {kilde.art === 'arkeologi' ? a : `«${a}»`}
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

// ─── Tidsrekka ──────────────────────────────────────────────────────────────

/**
 * Alle kildene i kampanjen, tegnet på én linje (blueprint §6).
 *
 * Hver kilde er en strek fra året den forteller om til året den ble til.
 * Alkuins strek er et punkt; Snorres er tre og et halvt hundreår lang, og den
 * ligger nederst slik at eleven ser den strekke seg under alle de andre.
 *
 * **De to uten lengde har egen farge.** Kulisteinen og skrinet fra Melhus er de
 * eneste to på bordet som ikke er en bok noen skrev om noe som hadde hendt - og
 * det er nettopp den forskjellen veiingen spør om. Fargen sier det før
 * spørsmålet gjør, og det er meningen: hun skal kunne se svaret sitt i formen.
 */
function Linja({ rekke }: { rekke: Tidsrekke }) {
    const fra = Math.min(...rekke.punkter.map((p) => p.omAar)) - 15;
    const til = Math.max(...rekke.punkter.map((p) => p.aar)) + 15;
    const spenn = til - fra;
    const andel = (aar: number) => ((aar - fra) / spenn) * 100;

    /** Hundreårene som står som hjelpelinjer bak strekene. */
    const merkeaar = [800, 900, 1000, 1100, 1200];

    return (
        <div className="mt-5 rounded-xl border border-amber-900/40 bg-[#2b2018] p-3 sm:p-4">
            <div className="relative mb-2 h-4 text-[10px] text-amber-100/40">
                {merkeaar.map((a) => (
                    <span
                        key={a}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${andel(a)}%` }}
                    >
                        {a}
                    </span>
                ))}
            </div>

            <ol className="grid gap-2.5">
                {rekke.punkter.map((p, i) => {
                    const utenLengde = p.art === 'arkeologi' || p.art === 'innskrift';
                    const start = andel(p.omAar);
                    // Et punkt uten lengde ville blitt usynlig. Minstebredden er
                    // ikke pynt - den er forskjellen på «ingen strek» og «ingen
                    // kilde», og de to betyr stikk motsatte ting her.
                    const bredde = Math.max(andel(p.aar) - start, 1.1);
                    return (
                        <li key={p.navn}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                <p className="font-display text-[13px] font-bold text-amber-50">
                                    {p.navn}
                                </p>
                                <p className="text-[11px] uppercase tracking-widest text-amber-100/45">
                                    {ART_NAVN[p.art]} · {p.merke}
                                </p>
                            </div>
                            <div className="relative mt-1 h-2 rounded-full bg-black/30">
                                {merkeaar.map((a) => (
                                    <span
                                        key={a}
                                        className="absolute inset-y-0 w-px bg-amber-100/10"
                                        style={{ left: `${andel(a)}%` }}
                                    />
                                ))}
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                                    style={{
                                        left: `${start}%`,
                                        width: `${bredde}%`,
                                        transformOrigin: 'left',
                                    }}
                                    className={`absolute inset-y-0 rounded-full ${
                                        utenLengde ? 'bg-emerald-300/80' : 'bg-amber-300/70'
                                    }`}
                                />
                            </div>
                            <p className="mt-1 text-[12px] leading-snug text-amber-100/60">
                                {p.om}
                            </p>
                        </li>
                    );
                })}
            </ol>
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
