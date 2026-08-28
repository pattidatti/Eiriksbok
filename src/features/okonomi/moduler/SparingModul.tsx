// Sparing: brukskonto, sparekonto og BSU.
//
// BSU er stjerna. Eleven skal se rommet som er igjen i år og totalt, hva
// fradraget er verdt i kroner akkurat nå, og få en klar beskjed når det ikke
// er mer å spare.
//
// Den andre jobben modulen har, er å si fra om kronene som blir liggende
// igjen. Fast sparing er nesten alltid lavere enn overskuddet, og differansen
// renner inn på brukskonto til nesten null rente uten at eleven noen gang tar
// stilling til den. Appen bestemmer ikke - den viser beløpet, viser hva det
// ville blitt til, og lar valget stå.

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Home, Landmark, Wallet } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { beregnLonnsslipp } from '../engine/skatt';
import { framskriv } from '../engine/projeksjon';
import { bsuFradrag, bsuRom, sumFormue } from '../engine/sparing';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Knapp, Kort, Kroner } from '../components/primitives';
import type { Konto } from '../types';

const SPARING_MAKS = 15000;
const SPARING_STEG = 100;

/** Antall år framskrivningsgrafen og regnestykkene i modulen ser framover. */
const HORISONT_AAR = 20;

/**
 * Hvor mange ubrukte kroner i måneden som skal til før appen sier fra.
 *
 * 500 kr i måneden er 6 000 kr i året. Under det er beløpet så lite at en
 * melding om det ville vært mas mer enn opplysning, og eleven ville sluttet å
 * lese den. Over det er det ekte penger, og da har appen plikt til å nevne dem.
 */
const UBRUKT_TERSKEL = 500;

const PROSENT = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

export function SparingModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const settManedligSparing = usePengelivStore((s) => s.settManedligSparing);
    const settSparingTilKonto = usePengelivStore((s) => s.settSparingTilKonto);

    const profil = tilstand?.profil ?? null;

    const slipp = useMemo(() => {
        if (!profil || !satser) return null;
        return beregnLonnsslipp(profil, satser);
    }, [profil, satser]);

    const punkter = useMemo(() => {
        if (!tilstand || !satser) return [];
        return framskriv(tilstand, satser, HORISONT_AAR);
    }, [tilstand, satser]);

    // Regnes før den tidlige returen, fordi useMemo-en under trenger tallene.
    // Dette er ikke hooks, så rekkefølgen er trygg.
    const sumUtgifter = profil ? profil.budsjett.reduce((sum, post) => sum + post.belop, 0) : 0;
    const overskudd = slipp ? slipp.nettoManedlig - sumUtgifter : 0;
    const sparing = profil ? profil.manedligSparing : 0;
    const restEtterSparing = overskudd - sparing;
    const visUbrukt = restEtterSparing >= UBRUKT_TERSKEL;

    // Hva de ubrukte kronene faktisk ville blitt til. Vi gjetter ikke og vi
    // bruker ingen formel: vi kjører den samme framskrivningen en gang til med
    // sparingen skrudd opp til hele overskuddet, og leser av forskjellen. Da
    // tar regnestykket høyde for BSU-takene på samme måte som resten av appen.
    // Kjøres bare når meldingen faktisk skal vises, så den vanlige veien
    // gjennom modulen koster like mye som før.
    const gevinst = useMemo(() => {
        if (!tilstand || !satser || !visUbrukt || punkter.length === 0) return 0;
        const medFullSparing = framskriv(
            { ...tilstand, profil: { ...tilstand.profil, manedligSparing: overskudd } },
            satser,
            HORISONT_AAR
        );
        if (medFullSparing.length === 0) return 0;
        return (
            medFullSparing[medFullSparing.length - 1].nominelt -
            punkter[punkter.length - 1].nominelt
        );
    }, [tilstand, satser, visUbrukt, overskudd, punkter]);

    if (!profil || !satser || !slipp) {
        return <Laster />;
    }

    const bruks = finnKonto(profil.kontoer, 'bruks');
    const spare = finnKonto(profil.kontoer, 'spare');
    const bsu = finnKonto(profil.kontoer, 'bsu');

    const formue = sumFormue(profil.kontoer);

    const rom = bsu ? bsuRom(bsu, profil.alder, satser) : null;
    const fradragIAr = bsu ? bsuFradrag(bsu.innskuddIAr, satser) : 0;
    const sparingTil = profil.kontoer.find((k) => k.id === profil.sparingTilKontoId) ?? null;

    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sparing</h1>
                    <p className="text-sm text-slate-600">
                        Du har <Kroner verdi={formue} /> spredt på kontoene dine.
                    </p>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                    Renta legges til saldoen, og året etter får du rente av renta også
                    <Forklaring begrep="Rentes rente">
                        Har du 10 000 kr til 3 % rente, får du 300 kr etter ett år. Året etter får
                        du rente av 10 300 kr, ikke bare av 10 000 kr. Det høres smått ut, men over
                        tjue år er det denne effekten som gjør mesteparten av jobben.
                    </Forklaring>
                </p>
            </header>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                {/* BSU er stjerna og får den største plassen. */}
                <div className="flex flex-col gap-3">
                    <Kort tittel="BSU">
                        <div className="mb-2 flex items-start gap-2 text-xs text-slate-600">
                            <Home
                                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                                aria-hidden="true"
                            />
                            <p>
                                BSU betyr Boligsparing for ungdom. Det er en sparekonto med to
                                fordeler: du får {Math.round(satser.bsu.fradragssats * 100)} % av
                                det du sparer tilbake som lavere skatt, og renta er bedre enn på
                                vanlig sparekonto. Til gjengjeld er pengene låst til bolig.
                                <Forklaring begrep="Låst til bolig">
                                    Du kan bare bruke BSU-pengene til å kjøpe bolig, eller til å
                                    pusse opp en bolig du allerede eier. Tar du dem ut til noe
                                    annet, må du betale tilbake all skatten du har spart.
                                </Forklaring>
                            </p>
                        </div>

                        {bsu ? (
                            <>
                                <div className="mb-3 flex flex-wrap items-end gap-6">
                                    <div>
                                        <div className="text-xs text-slate-500">På BSU-kontoen</div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            <Kroner verdi={bsu.saldo} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">
                                            Spart i skatt i år
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-700">
                                            <Kroner verdi={fradragIAr} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Rente</div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {PROSENT.format(bsu.arligRente * 100)} %
                                        </div>
                                    </div>
                                </div>

                                <Stolpe
                                    etikett="I år"
                                    brukt={bsu.innskuddIAr}
                                    tak={satser.bsu.arligTak}
                                    igjen={rom ? rom.arligIgjen : 0}
                                />
                                <Stolpe
                                    etikett="Til sammen"
                                    brukt={bsu.innskuddTotalt}
                                    tak={satser.bsu.samletTak}
                                    igjen={rom ? rom.samletIgjen : 0}
                                />

                                {rom && !rom.kanSpare ? (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                                    >
                                        {rom.grunn ??
                                            'Du kan ikke spare mer i BSU nå. Sparepengene bør gå til sparekontoen i stedet.'}
                                    </motion.p>
                                ) : (
                                    <p className="mt-3 text-xs text-slate-500">
                                        Sparer du de siste{' '}
                                        <Kroner verdi={rom ? rom.arligIgjen : 0} /> i år, får du{' '}
                                        <Kroner
                                            verdi={bsuFradrag(rom ? rom.arligIgjen : 0, satser)}
                                        />{' '}
                                        mindre i skatt. Det er penger du får igjen bare for å legge
                                        dem på riktig konto.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Du har ingen BSU-konto ennå.</p>
                        )}
                    </Kort>

                    <Kort tittel="Sparingen din de neste 20 årene">
                        <FramskrivningsGraf punkter={punkter} hoyde={85} kompakt />
                    </Kort>
                </div>

                <div className="flex flex-col gap-3">
                    <Kort tittel="De andre kontoene">
                        <div className="flex flex-col gap-2">
                            <KontoRad
                                ikon={<Wallet className="h-4 w-4 text-slate-500" />}
                                navn={bruks ? bruks.navn : 'Brukskonto'}
                                saldo={bruks ? bruks.saldo : 0}
                                rente={bruks ? bruks.arligRente : 0}
                                tekst="Lønna inn og regningene ut. Renta er nesten null her."
                            />
                            <KontoRad
                                ikon={<Landmark className="h-4 w-4 text-indigo-600" />}
                                navn={spare ? spare.navn : 'Sparekonto'}
                                saldo={spare ? spare.saldo : 0}
                                rente={spare ? spare.arligRente : 0}
                                tekst="Fritt uttak og trygg rente. Bra for uventede utgifter."
                            />
                        </div>
                    </Kort>

                    <Kort tittel="Fast sparing hver måned">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-900">
                                <Kroner verdi={sparing} />
                            </span>
                            <span className="text-xs text-slate-500">i måneden</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={SPARING_MAKS}
                            step={SPARING_STEG}
                            value={Math.round(sparing)}
                            onChange={(e) => settManedligSparing(Number(e.target.value))}
                            className="mt-2 w-full accent-indigo-600"
                            aria-label="Fast sparing per måned"
                        />
                        {restEtterSparing < 0 ? (
                            <p className="mt-2 text-xs text-rose-700">
                                Du sparer mer enn du har til overs. Da må{' '}
                                <Kroner verdi={-restEtterSparing} /> tas fra brukskontoen hver
                                måned, og den tømmes til slutt.
                            </p>
                        ) : visUbrukt ? (
                            <UbruktMelding
                                ubrukt={restEtterSparing}
                                gevinst={gevinst}
                                aar={HORISONT_AAR}
                                bsuTak={sparingTil?.type === 'bsu' ? satser.bsu.arligTak : null}
                                bruksrente={bruks ? bruks.arligRente : 0}
                            />
                        ) : (
                            <p className="mt-2 text-xs text-slate-500">
                                Du har <Kroner verdi={restEtterSparing} /> igjen etter at sparingen
                                er trukket fra.
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Knapp
                                variant={visUbrukt ? 'primar' : 'sekundar'}
                                onClick={() =>
                                    settManedligSparing(Math.max(0, Math.round(overskudd)))
                                }
                            >
                                Spar alt jeg har til overs
                            </Knapp>
                            <Knapp
                                variant="sekundar"
                                onClick={() =>
                                    settManedligSparing(Math.max(0, Math.round(overskudd * 0.5)))
                                }
                            >
                                Spar halvparten
                            </Knapp>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">Sparepengene går til</span>
                            {profil.kontoer
                                .filter((k) => k.type !== 'bruks')
                                .map((konto) => {
                                    const valgt = konto.id === profil.sparingTilKontoId;
                                    return (
                                        <button
                                            key={konto.id}
                                            type="button"
                                            onClick={() => settSparingTilKonto(konto.id)}
                                            aria-pressed={valgt}
                                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                                                valgt
                                                    ? 'border-indigo-300 bg-indigo-600 text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                                            }`}
                                        >
                                            {konto.navn}
                                        </button>
                                    );
                                })}
                        </div>
                    </Kort>
                </div>
            </div>
        </div>
    );
}

function finnKonto(kontoer: Konto[], type: Konto['type']): Konto | null {
    return kontoer.find((k) => k.type === type) ?? null;
}

/**
 * Meldingen om kronene som blir liggende igjen hver måned.
 *
 * Den skal opplyse, ikke skjenne. Ingen røde varseltrekanter og ingen «du burde»:
 * eleven får beløpet, får se hva det ville blitt til, og bestemmer selv.
 *
 * Gevinsten kommer fra framskrivningen, og noen ganger er den liten. Da sier
 * meldingen hvorfor i stedet for å love noe den ikke kan holde: BSU tar bare
 * imot et visst beløp i året, og penger over det taket blir liggende på
 * brukskontoen uansett hvor høyt sparingen skrus.
 */
function UbruktMelding({
    ubrukt,
    gevinst,
    aar,
    bsuTak,
    bruksrente,
}: {
    ubrukt: number;
    gevinst: number;
    aar: number;
    /** Årstaket på BSU, når sparingen går dit. Null ellers. */
    bsuTak: number | null;
    bruksrente: number;
}) {
    // Gevinsten må være større enn ett år med ubrukte kroner før vi lover eleven
    // noe. Blir 20 års sparing mindre verdt enn det ett år legger til side, er
    // det ikke gevinsten som er poenget - da er det taket som er poenget.
    const verdtAaLove = gevinst >= ubrukt * 12;

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5"
        >
            <p className="text-xs leading-snug text-slate-700">
                <Kroner verdi={ubrukt} /> blir liggende på brukskontoen hver måned, til{' '}
                {PROSENT.format(bruksrente * 100)} % rente.{' '}
                {!verdtAaLove && bsuTak !== null ? (
                    <>
                        Å spare mer hjelper lite nå: du fyller allerede BSU-taket på{' '}
                        <Kroner verdi={bsuTak} /> i året. Resten må til en konto uten tak, som
                        sparekontoen.
                    </>
                ) : (
                    <>
                        Sparer du dem også, står du med <Kroner verdi={gevinst} /> mer om {aar} år.
                    </>
                )}
            </p>
        </motion.div>
    );
}

function Stolpe({
    etikett,
    brukt,
    tak,
    igjen,
}: {
    etikett: string;
    brukt: number;
    tak: number;
    igjen: number;
}) {
    const andel = tak > 0 ? Math.min(1, Math.max(0, brukt / tak)) : 0;
    return (
        <div className="mb-2">
            <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-700">{etikett}</span>
                <span className="text-slate-500">
                    <Kroner verdi={brukt} /> av <Kroner verdi={tak} />, igjen{' '}
                    <span className="font-semibold text-slate-700">
                        <Kroner verdi={igjen} />
                    </span>
                </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                    initial={false}
                    animate={{ width: `${andel * 100}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                />
            </div>
        </div>
    );
}

function KontoRad({
    ikon,
    navn,
    saldo,
    rente,
    tekst,
}: {
    ikon: ReactNode;
    navn: string;
    saldo: number;
    rente: number;
    tekst: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    {ikon}
                    {navn}
                </span>
                <span className="text-base font-semibold text-slate-900">
                    <Kroner verdi={saldo} />
                </span>
            </div>
            {/* Rente og beskrivelse deler linje. Kortet skal få plass sammen med
                meldingen om ubrukte kroner uten at siden begynner å scrolle. */}
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] leading-snug text-slate-500">
                <span>{PROSENT.format(rente * 100)} % rente i året.</span>
                <Forklaring begrep="Rente og effektiv rente">
                    Renta er det banken betaler deg for å ha pengene dine der. 3 % rente på 10 000
                    kr blir 300 kr i året. Effektiv rente er tallet du sitter igjen med når renta
                    legges til kontoen flere ganger i året og begynner å gi rente selv. Den er litt
                    høyere enn tallet banken skilter med, og det er den du bør sammenligne banker
                    med.
                </Forklaring>
                <span>{tekst}</span>
            </p>
        </div>
    );
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Henter kontoene dine...
        </div>
    );
}
