// Bolig: fra å leie til å eie.
//
// Dette er den største enkelthendelsen i hele Pengeliv, og modulen er bygget
// rundt tre spørsmål eleven stiller i denne rekkefølgen:
//
//   1. Hvor mye får jeg lov til å låne, og hvorfor akkurat så mye?
//   2. Har jeg nok egenkapital? Hvis ikke, hvor lenge må jeg spare?
//   3. Hva koster det egentlig å eie, sammenlignet med å leie?
//
// Det siste spørsmålet er det viktigste, og det er også det appen har lettest
// for å svare feil på. Å eie er ikke automatisk lurere enn å leie. Derfor
// vises regnestykket nøkternt, med avdraget skilt ut for seg: avdraget er
// sparing, ikke en utgift, og det er nettopp den forskjellen som avgjør.

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Home, Key, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { BOLIGER } from '../data/boliger';
import type { Boligtilbud } from '../data/boliger';
import {
    AVDRAGSKRAV_GRENSE,
    DOKUMENTAVGIFT_SATS,
    EGENKAPITALKRAV,
    MAKS_GJELDSGRAD,
    STRESS_PAASLAG,
    belaaningsgrad,
    boliglaanet,
    kjopskostnader,
    laanevurdering,
    maanederTilSpart,
    manedsregnskap,
    prisindeksVed,
    salgsoppgjor,
    tenktBoliglaan,
    vedlikeholdPerManed,
} from '../engine/bolig';
import { Forklaring, Knapp, Kort, Kroner, formaterProsent } from '../components/primitives';
import type { Nedbetaling, Tilstand } from '../types';

/** Hvor mange måneder prisgrafen viser bakover. Femten år. */
const GRAF_MANEDER = 180;

export function BoligModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const kjop = usePengelivStore((s) => s.kjopBolig);
    const selg = usePengelivStore((s) => s.selgBolig);

    const [valgtId, settValgtId] = useState<string>(BOLIGER[0].id);
    const [egenkapitalValg, settEgenkapitalValg] = useState<number | null>(null);
    const [nedbetaling, settNedbetaling] = useState<Nedbetaling>('annuitet');
    const [feirer, settFeirer] = useState(false);

    if (!tilstand) return <Laster />;

    if (tilstand.bolig) {
        return <EierSkjerm tilstand={tilstand} onSelg={selg} feirer={feirer} />;
    }

    const valgt = BOLIGER.find((b) => b.id === valgtId) ?? BOLIGER[0];

    return (
        <KjoperSkjerm
            tilstand={tilstand}
            valgt={valgt}
            onVelg={(id) => {
                settValgtId(id);
                settEgenkapitalValg(null);
            }}
            egenkapitalValg={egenkapitalValg}
            onEgenkapital={settEgenkapitalValg}
            nedbetaling={nedbetaling}
            onNedbetaling={settNedbetaling}
            onKjop={(egen) => {
                kjop(valgt.id, egen, nedbetaling);
                settFeirer(true);
                window.setTimeout(() => settFeirer(false), 6000);
            }}
        />
    );
}

// ---------------------------------------------------------------------------
// Før kjøpet
// ---------------------------------------------------------------------------

interface KjoperProps {
    tilstand: Tilstand;
    valgt: Boligtilbud;
    onVelg: (id: string) => void;
    egenkapitalValg: number | null;
    onEgenkapital: (belop: number) => void;
    nedbetaling: Nedbetaling;
    onNedbetaling: (n: Nedbetaling) => void;
    onKjop: (egenkapital: number) => void;
}

function KjoperSkjerm({
    tilstand,
    valgt,
    onVelg,
    egenkapitalValg,
    onEgenkapital,
    nedbetaling,
    onNedbetaling,
    onKjop,
}: KjoperProps) {
    const vurdering = useMemo(() => laanevurdering(tilstand), [tilstand]);
    const indeks = tilstand.boligmarked.prisindeks;
    const kost = useMemo(() => kjopskostnader(valgt, indeks), [valgt, indeks]);

    const kontanter = vurdering.egenkapital;
    const husleie = tilstand.profil.budsjett.find((p) => p.id === 'husleie');

    // Det minste banken godtar: enten ti prosent av prisen, eller det som må
    // til for at lånet holder seg innenfor lånerammen.
    const minEgenkapital = Math.max(
        Math.ceil(kost.pris * EGENKAPITALKRAV),
        kost.pris - vurdering.maksLaan
    );
    const takEgenkapital = Math.max(0, Math.min(kontanter.sum - kost.omkostninger, kost.pris));
    const egen = Math.min(
        Math.max(egenkapitalValg ?? minEgenkapital, minEgenkapital),
        Math.max(minEgenkapital, takEgenkapital)
    );

    const laanebehov = Math.max(0, kost.pris - egen);
    const laan = useMemo(() => tenktBoliglaan(laanebehov, nedbetaling), [laanebehov, nedbetaling]);
    const regnskap = manedsregnskap(laan, valgt.felleskostnader, kost.pris);

    const kontantbehov = minEgenkapital + kost.omkostninger;
    const mangler = Math.max(0, kontantbehov - kontanter.sum);
    const maanederIgjen = maanederTilSpart(mangler, tilstand.profil.manedligSparing);

    const sperre = finnSperre({
        mangler,
        laanebehov,
        maksLaan: vurdering.maksLaan,
        egen,
        pris: kost.pris,
    });

    return (
        <div className="flex flex-col gap-3">
            <Topplinje
                tittel="Bolig"
                undertekst="Du leier i dag. Her ser du hva du kan låne, hva det koster, og hva som skiller det fra husleia du betaler nå."
                indeks={indeks}
                maaned={tilstand.maaned}
                fro={tilstand.marked.fro}
            />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <Kort tittel="Hva kan du kjøpe?">
                    <div className="grid grid-cols-2 gap-3">
                        <Stortall
                            etikett="Banken kan låne deg"
                            verdi={vurdering.maksLaan}
                            farge="text-indigo-700"
                        />
                        <Stortall
                            etikett="Dyreste bolig du klarer"
                            verdi={vurdering.maksPris}
                            farge="text-slate-900"
                        />
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                        <Regel
                            navn="Gjeldsgrad"
                            verdi={vurdering.gjeldsgradTak}
                            aktiv={vurdering.bindende === 'gjeldsgrad'}
                            tekst={`Gjelda di kan bli høyst ${MAKS_GJELDSGRAD} ganger lønna før skatt.`}
                            begrep="Gjeldsgrad"
                            forklaring="Gjeldsgrad er hvor mye du skylder, delt på hva du tjener i året før skatt. Skylder du 2 millioner og tjener 500 000 kr, er gjeldsgraden 4. Banken har ikke lov til å la den bli høyere enn 5."
                        />
                        <Regel
                            navn="Rentestresstest"
                            verdi={vurdering.stresstestTak}
                            aktiv={vurdering.bindende === 'stresstest'}
                            tekst={`${avrundet(vurdering.betjeningsevne)} igjen i måneden uten husleie, og renta kan bli ${formaterProsent(vurdering.stressrente)}.`}
                            begrep="Stresstest"
                            forklaring={`Banken later som om renta plutselig stiger med ${Math.round(STRESS_PAASLAG * 100)} prosentpoeng, og sjekker at du fortsatt har råd til å leve. Renta på et boliglån endrer seg gjennom hele lånets liv, så dette er ikke en fantasi.`}
                        />
                    </div>

                    <div className="mt-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="flex items-center text-xs font-semibold text-slate-800">
                                Egenkapitalen din
                                <Forklaring begrep="Egenkapital">
                                    Egenkapital er pengene du legger inn selv. Kjøper du en bolig
                                    til 2 millioner, må minst 200 000 kr være penger du har spart
                                    opp. Kravet var 15 prosent fram til 2025, og ble satt ned til 10
                                    prosent fordi det var så vanskelig for unge å komme inn på
                                    boligmarkedet.
                                </Forklaring>
                            </span>
                            <Kroner verdi={kontanter.sum} className="text-sm font-bold" />
                        </div>
                        <p className="text-[11px] leading-snug text-slate-500">
                            Brukskonto {avrundet(kontanter.bruks)} &middot; sparekonto{' '}
                            {avrundet(kontanter.spare)} &middot;{' '}
                            <span className="font-semibold text-emerald-700">
                                BSU {avrundet(kontanter.bsu)}
                            </span>
                            . Minst {formaterProsent(EGENKAPITALKRAV, 0)} av prisen må være dine
                            egne penger.
                        </p>
                        {kontanter.bsu > 0 && (
                            <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-emerald-800">
                                <PiggyBank className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                                    BSU-pengene har vært låst til bolig hele tiden. Kjøper du nå, er
                                    dette øyeblikket de endelig kan brukes.
                                </span>
                            </p>
                        )}
                    </div>

                    {mangler > 0 ? (
                        <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900">
                            For {valgt.navn.toLowerCase()} mangler du <Kroner verdi={mangler} />.{' '}
                            {maanederIgjen === null
                                ? 'Du sparer ingenting fast nå, så beløpet kommer ikke av seg selv.'
                                : `Med ${avrundet(tilstand.profil.manedligSparing)} i fast sparing tar det ${maanederIgjen} måneder.`}
                        </p>
                    ) : (
                        // Plassen er ledig først når eleven faktisk har råd, og det er
                        // nettopp da advarselen trengs. Appen skal ikke heie fram et
                        // boligkjøp bare fordi tallene går opp.
                        <p className="mt-2 text-xs leading-snug text-slate-500">
                            Du har nok til å kjøpe. Det betyr ikke at du bør. Du binder deg til et
                            lån i 25 år, du betaler vedlikeholdet selv, og boligprisene kan falle -
                            de har gjort det før. Det som taler for å eie, er at avdraget blir din
                            egen formue i stedet for utleierens.
                        </p>
                    )}
                </Kort>

                <div className="flex flex-col gap-3">
                    <Kort
                        tittel="Boliger til salgs"
                        undertittel={`${BOLIGER.length} boliger. Bla i lista for å se alle.`}
                    >
                        <ul className="-mx-1 max-h-[116px] overflow-y-auto px-1">
                            {BOLIGER.map((b) => (
                                <BoligRad
                                    key={b.id}
                                    bolig={b}
                                    pris={Math.round(b.grunnpris * indeks)}
                                    valgt={b.id === valgt.id}
                                    innenfor={
                                        Math.round(b.grunnpris * indeks) <= vurdering.maksPris
                                    }
                                    onVelg={() => onVelg(b.id)}
                                />
                            ))}
                        </ul>
                    </Kort>

                    <Kort
                        tittel={valgt.navn}
                        handling={
                            <Knapp onClick={() => onKjop(egen)} disabled={sperre !== null}>
                                <span className="flex items-center gap-1.5">
                                    <Key className="h-4 w-4" />
                                    Kjøp
                                </span>
                            </Knapp>
                        }
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Linje etikett="Prisantydning" belop={kost.pris} />
                                <Linje
                                    etikett={
                                        valgt.eierform === 'selveier'
                                            ? `Dokumentavgift (${formaterProsent(DOKUMENTAVGIFT_SATS, 1)})`
                                            : 'Dokumentavgift (borettslag)'
                                    }
                                    belop={kost.dokumentavgift}
                                    hjelp="Dokumentavgift er 2,5 prosent av kjøpesummen, rett til staten. Kjøper du en andel i et borettslag i stedet for en selveierbolig, slipper du den helt."
                                />
                                <Linje
                                    etikett="Tinglysing hos Kartverket"
                                    belop={kost.tinglysing}
                                />
                                <Linje etikett="Egenkapitalen din" belop={-egen} />
                                <Linje etikett="Boliglån" belop={laanebehov} fremhev />

                                <div className="mt-1.5 flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={minEgenkapital}
                                        max={Math.max(minEgenkapital, takEgenkapital)}
                                        step={5000}
                                        value={egen}
                                        onChange={(e) => onEgenkapital(Number(e.target.value))}
                                        disabled={takEgenkapital <= minEgenkapital}
                                        className="min-w-0 flex-1 accent-indigo-600"
                                        aria-label="Hvor mye egenkapital du legger inn"
                                    />
                                    <Knapp
                                        liten
                                        variant="sekundar"
                                        aktiv={nedbetaling === 'annuitet'}
                                        onClick={() => onNedbetaling('annuitet')}
                                        tittel="Like stor regning hver måned hele veien"
                                    >
                                        Annuitet
                                    </Knapp>
                                    <Knapp
                                        liten
                                        variant="sekundar"
                                        aktiv={nedbetaling === 'serie'}
                                        onClick={() => onNedbetaling('serie')}
                                        tittel="Like stort avdrag hver måned. Dyrest i starten, billigst til slutt."
                                    >
                                        Serielån
                                    </Knapp>
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Hva det koster å eie, hver måned
                                </p>
                                <Linje etikett="Terminbeløp til banken" belop={regnskap.termin} />
                                <Linje
                                    etikett="Felleskostnader"
                                    belop={regnskap.felleskostnader}
                                    hjelp="Felleskostnader er det du betaler til borettslaget eller sameiet hver måned: vaktmester, tak, rør og forsikring på selve bygget."
                                />
                                <Linje
                                    etikett="Vedlikehold"
                                    belop={regnskap.vedlikehold}
                                    hjelp="Bad som må pusses opp, kjøkken som må byttes, oppvaskmaskin som ryker. Det kommer ingen regning i posten, men pengene går uansett."
                                />
                                <Linje etikett="Sum hver måned" belop={regnskap.sum} fremhev />
                            </div>
                        </div>

                        <p className="mt-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] leading-snug text-slate-600">
                            {sperre ?? (
                                <>
                                    <Kroner verdi={regnskap.avdrag} /> av terminbeløpet er avdrag og
                                    fortsatt dine penger. Å eie koster deg{' '}
                                    <Kroner verdi={regnskap.ekteKostnad} /> mot{' '}
                                    <Kroner verdi={husleie ? husleie.belop : 0} /> i husleie.
                                </>
                            )}
                        </p>
                    </Kort>
                </div>
            </div>
        </div>
    );
}

/** «1 650 000 kr», til bruk midt i en setning. */
function avrundet(belop: number): string {
    return `${Math.round(belop).toLocaleString('nb-NO')} kr`;
}

/** Hvorfor knappen er grå, sagt i klartekst. Null betyr at kjøpet går. */
function finnSperre(a: {
    mangler: number;
    laanebehov: number;
    maksLaan: number;
    egen: number;
    pris: number;
}): string | null {
    if (a.mangler > 0) {
        return 'Du har ikke nok egenkapital ennå. Spar videre, eller velg en billigere bolig.';
    }
    if (a.laanebehov > a.maksLaan) {
        return 'Lånet blir større enn banken har lov til å gi deg. Velg en billigere bolig.';
    }
    if (a.egen < a.pris * EGENKAPITALKRAV) {
        return `Egenkapitalen må være minst ${Math.round(EGENKAPITALKRAV * 100)} prosent av prisen.`;
    }
    return null;
}

// ---------------------------------------------------------------------------
// Etter kjøpet
// ---------------------------------------------------------------------------

function EierSkjerm({
    tilstand,
    onSelg,
    feirer,
}: {
    tilstand: Tilstand;
    onSelg: () => void;
    feirer: boolean;
}) {
    const bolig = tilstand.bolig;
    const laan = boliglaanet(tilstand);
    const oppgjor = salgsoppgjor(tilstand);
    if (!bolig || !oppgjor) return <Laster />;

    const regnskap = manedsregnskap(laan, bolig.felleskostnader, bolig.kjopesum);
    const restgjeld = laan ? laan.restgjeld : 0;
    const egenkapitalIBolig = bolig.verdi - restgjeld;
    const grad = belaaningsgrad(tilstand);
    const eidAar = Math.floor(oppgjor.eidManeder / 12);

    return (
        <div className="flex flex-col gap-3">
            <AnimatePresence>
                {feirer && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-indigo-50 px-3 py-1.5"
                    >
                        <Key className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                        <p className="text-xs leading-snug text-emerald-950">
                            <span className="font-bold">Nøklene er dine.</span> BSU-pengene gikk
                            rett inn i boligen, og husleia er borte fra budsjettet. Fra nå betaler
                            du på ditt eget.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <Topplinje
                tittel={bolig.navn}
                undertekst={`Du kjøpte for ${Math.round(bolig.kjopesum).toLocaleString('nb-NO')} kr og har eid boligen i ${eidAar > 0 ? `${eidAar} år` : `${oppgjor.eidManeder} måneder`}.`}
                indeks={tilstand.boligmarked.prisindeks}
                maaned={tilstand.maaned}
                fro={tilstand.marked.fro}
            />

            <div className="grid gap-3 lg:grid-cols-3">
                <Kort tittel="Boligen din">
                    <div className="grid grid-cols-2 gap-3">
                        <Stortall
                            etikett="Verdt i dag"
                            verdi={bolig.verdi}
                            farge="text-slate-900"
                        />
                        <Stortall
                            etikett="Din del av verdien"
                            verdi={egenkapitalIBolig}
                            farge="text-emerald-700"
                        />
                    </div>
                    <div className="mt-2">
                        <Linje etikett="Kjøpesum" belop={bolig.kjopesum} />
                        <Linje
                            etikett="Verdiendring siden kjøpet"
                            belop={oppgjor.verdiendring}
                            tone
                        />
                        <Linje etikett="Restgjeld på boliglånet" belop={-restgjeld} />
                        <Linje
                            etikett="Formuen boligen har gitt deg"
                            belop={egenkapitalIBolig}
                            fremhev
                        />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                        Du har lånt {formaterProsent(grad, 0)} av det boligen er verdt.
                        {grad > AVDRAGSKRAV_GRENSE
                            ? ' Over 60 prosent krever loven at du betaler avdrag hver måned, og det gjør du.'
                            : ' Under 60 prosent kunne du valgt å bare betale renter en periode.'}
                    </p>
                </Kort>

                <Kort tittel="Hva boligen koster hver måned">
                    <Linje etikett="Renter til banken" belop={regnskap.renter} />
                    <Linje etikett="Avdrag på gjelda" belop={regnskap.avdrag} />
                    <Linje etikett="Termingebyr" belop={laan ? laan.gebyr : 0} />
                    <Linje etikett="Felleskostnader" belop={regnskap.felleskostnader} />
                    <Linje
                        etikett="Vedlikehold"
                        belop={vedlikeholdPerManed(bolig.kjopesum)}
                        hjelp="En halv prosent av kjøpesummen i året. Ingen sender deg regningen, men bad og kjøkken slites likevel."
                    />
                    <Linje etikett="Sum" belop={regnskap.sum} fremhev />
                    <p className="mt-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] leading-snug text-slate-600">
                        Avdraget flytter bare penger fra konto til bolig. Trekker du det fra, koster
                        det <Kroner verdi={regnskap.ekteKostnad} /> i måneden å eie - og det er
                        tallet du skal måle mot husleie.
                    </p>
                </Kort>

                <Kort tittel="Selge?">
                    <Linje etikett="Salgssum i dag" belop={oppgjor.salgssum} />
                    <Linje etikett="Megler og annonsering" belop={-oppgjor.meglerkostnader} />
                    <Linje etikett="Innfri boliglånet" belop={-oppgjor.restgjeld} />
                    <Linje etikett="Igjen på konto" belop={oppgjor.netto} fremhev tone />
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                        Har du bodd i boligen i minst 12 av de siste 24 månedene, slipper du å
                        betale skatt av gevinsten. Selger du, må du leie igjen, og husleia kommer
                        tilbake i budsjettet.
                    </p>
                    <div className="mt-2">
                        <Knapp variant="sekundar" onClick={onSelg}>
                            Selg boligen
                        </Knapp>
                    </div>
                </Kort>
            </div>

            <Kort
                tittel="Boligprisene siden du startet"
                undertittel="Prisene stiger over tid, men ikke jevnt. Den loddrette streken er måneden du kjøpte."
            >
                <StorPrisgraf
                    fro={tilstand.marked.fro}
                    maaned={tilstand.maaned}
                    kjoptMaaned={bolig.kjoptMaaned}
                />
            </Kort>
        </div>
    );
}

/**
 * Hele prisforløpet, med et merke der eleven kjøpte. Poenget er ikke å pynte:
 * en elev som ser at kurven har falt før, skjønner at den kan falle igjen.
 */
function StorPrisgraf({
    fro,
    maaned,
    kjoptMaaned,
}: {
    fro: number;
    maaned: number;
    kjoptMaaned: number;
}) {
    const serie = useMemo(() => {
        const verdier: number[] = [];
        for (let m = 0; m <= maaned; m++) verdier.push(prisindeksVed(fro, m));
        return verdier;
    }, [fro, maaned]);

    if (serie.length < 6) {
        return (
            <p className="py-6 text-center text-xs text-slate-400">
                Kurven tegner seg etter hvert som månedene går.
            </p>
        );
    }

    const B = 600;
    const H = 96;
    const lav = Math.min(...serie);
    const hoy = Math.max(...serie);
    const spenn = hoy - lav || 1;
    const x = (m: number) => (m / (serie.length - 1)) * B;
    const y = (v: number) => H - 8 - ((v - lav) / spenn) * (H - 20);
    const linje = serie.map(
        (v, m) => `${m === 0 ? 'M' : 'L'}${x(m).toFixed(1)} ${y(v).toFixed(1)}`
    );
    const flate = `${linje.join(' ')} L${B} ${H} L0 ${H} Z`;

    return (
        <div>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="none"
                className="h-16 w-full"
                role="img"
                aria-label="Kurve over boligprisene"
            >
                <path d={flate} fill="rgba(79,70,229,0.09)" />
                <path
                    d={linje.join(' ')}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                {kjoptMaaned <= maaned && (
                    <line
                        x1={x(kjoptMaaned)}
                        y1="4"
                        x2={x(kjoptMaaned)}
                        y2={H}
                        stroke="#059669"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </svg>
            <div className="flex justify-between text-[11px] text-slate-500">
                <span>Start: 100</span>
                <span>
                    Laveste: {Math.round(lav * 100)} &middot; høyeste: {Math.round(hoy * 100)}
                </span>
                <span className="font-semibold text-slate-700">
                    Nå: {Math.round(serie[serie.length - 1] * 100)}
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Småbiter
// ---------------------------------------------------------------------------

function Topplinje({
    tittel,
    undertekst,
    indeks,
    maaned,
    fro,
}: {
    tittel: string;
    undertekst: string;
    indeks: number;
    maaned: number;
    fro: number;
}) {
    const opp = indeks >= 1;
    return (
        <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-slate-900">{tittel}</h1>
                <p className="text-sm leading-snug text-slate-600">{undertekst}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5">
                <Prisgraf fro={fro} maaned={maaned} />
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        Boligprisene
                    </div>
                    <div
                        className={`flex items-center gap-1 text-sm font-bold ${
                            opp ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                    >
                        {opp ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {formaterProsent(indeks - 1, 1)}
                    </div>
                </div>
            </div>
        </header>
    );
}

/**
 * Kurven over boligprisene så langt. Den skal vise at prisene både stiger og
 * faller - et boligmarked som bare peker oppover lærer bort noe usant.
 */
function Prisgraf({ fro, maaned }: { fro: number; maaned: number }) {
    const punkter = useMemo(() => {
        const fra = Math.max(0, maaned - GRAF_MANEDER);
        const verdier: number[] = [];
        for (let m = fra; m <= maaned; m += 3) verdier.push(prisindeksVed(fro, m));
        return verdier;
    }, [fro, maaned]);

    if (punkter.length < 3) {
        return <span className="text-[10px] text-slate-400">Kurven kommer</span>;
    }

    const lav = Math.min(...punkter);
    const hoy = Math.max(...punkter);
    const spenn = hoy - lav || 1;
    const bane = punkter
        .map((v, i) => {
            const x = (i / (punkter.length - 1)) * 64;
            const y = 22 - ((v - lav) / spenn) * 20;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg width="64" height="24" viewBox="0 0 64 24" aria-hidden="true">
            <path d={bane} fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function Stortall({ etikett, verdi, farge }: { etikett: string; verdi: number; farge: string }) {
    return (
        <div className="min-w-0">
            <div className="truncate text-[11px] leading-tight text-slate-500">{etikett}</div>
            <div className="truncate">
                <Kroner verdi={verdi} className={`text-lg md:text-xl ${farge}`} />
            </div>
        </div>
    );
}

function Regel({
    navn,
    verdi,
    aktiv,
    tekst,
    begrep,
    forklaring,
}: {
    navn: string;
    verdi: number;
    aktiv: boolean;
    tekst: string;
    begrep: string;
    forklaring: string;
}) {
    return (
        <div
            className={`rounded-xl border px-2.5 py-1.5 ${
                aktiv ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-200 bg-white'
            }`}
        >
            <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center text-xs font-semibold text-slate-800">
                    {navn}
                    <Forklaring begrep={begrep}>{forklaring}</Forklaring>
                    {aktiv && (
                        <span className="ml-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            stopper deg
                        </span>
                    )}
                </span>
                <Kroner verdi={verdi} />
            </div>
            <p className="text-[11px] leading-snug text-slate-500">{tekst}</p>
        </div>
    );
}

function Linje({
    etikett,
    belop,
    fremhev = false,
    tone = false,
    hjelp,
}: {
    etikett: string;
    belop: number;
    fremhev?: boolean;
    /** Farger beløpet grønt eller rødt etter fortegnet. */
    tone?: boolean;
    hjelp?: string;
}) {
    return (
        <div
            className={`flex items-baseline justify-between gap-2 py-0.5 ${
                fremhev ? 'mt-1 border-t border-slate-300 pt-1' : ''
            }`}
        >
            <span
                className={`flex min-w-0 items-center text-xs ${
                    fremhev ? 'font-bold text-slate-900' : 'text-slate-600'
                }`}
            >
                <span className="truncate">{etikett}</span>
                {hjelp && <Forklaring begrep={etikett}>{hjelp}</Forklaring>}
            </span>
            <Kroner
                verdi={belop}
                tone={tone ? 'auto' : 'noytral'}
                visTegn={tone}
                className={fremhev ? 'text-sm font-bold' : 'text-xs'}
            />
        </div>
    );
}

function BoligRad({
    bolig,
    pris,
    valgt,
    innenfor,
    onVelg,
}: {
    bolig: Boligtilbud;
    pris: number;
    valgt: boolean;
    innenfor: boolean;
    onVelg: () => void;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={onVelg}
                aria-pressed={valgt}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${
                    valgt
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
            >
                <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        innenfor ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {bolig.eierform === 'selveier' ? (
                        <Home className="h-4 w-4" />
                    ) : (
                        <Building2 className="h-4 w-4" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-900">
                        {bolig.navn}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                        {bolig.sted} &middot; {bolig.kvadratmeter} m&sup2; &middot;{' '}
                        {bolig.eierform === 'selveier' ? 'selveier' : 'borettslag'}
                    </span>
                </span>
                <Kroner verdi={pris} className="text-xs" />
            </button>
        </li>
    );
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Henter boligmarkedet...
        </div>
    );
}
