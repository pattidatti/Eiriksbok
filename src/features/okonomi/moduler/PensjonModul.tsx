// Pensjon: folketrygd, innskuddspensjon fra jobb og IPS.
//
// Dette er modulen som ligger lengst fra en tenårings hverdag, og den har
// bare én jobb: gjøre 67 år til noe eleven kan se. Alt annet er støtte til
// den ene framskrivningen.
//
// De to skyveknappene er hele modulen. Innskuddssatsen viser hva forskjellen
// mellom lovens minstekrav og lovens maksimum blir i kroner etter 45 år, og
// IPS-knappen viser hva et beløp eleven faktisk kunne satt av hver måned blir
// til. Begge tallene beveger seg mens eleven drar, fordi det er bevegelsen
// som lærer bort rentes rente - ikke tallet.

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Landmark, PiggyBank } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import {
    ANTATT_AVKASTNING,
    INNSKUDD_MAKS_SATS,
    INNSKUDD_MIN_SATS,
    IPS_ARLIG_TAK,
    IPS_BINDING_ALDER,
    PENSJONSALDER,
    UTBETALINGSAAR_INNSKUDD,
    framskrivPensjon,
    ipsFradrag,
    ipsPerManed,
    sparingBlirTil,
} from '../engine/pensjon';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Knapp, Kort, Kroner } from '../components/primitives';

const MANEDER_I_AR = 12;

/** Beløpet modulen bruker som eksempel. Noe de fleste kan få til. */
const EKSEMPELBELOP = 500;

/** Skyveknappen for IPS går i hundrelapper opp til det årstaket tillater. */
const IPS_MAKS_PER_MANED = Math.floor(IPS_ARLIG_TAK / MANEDER_I_AR);
const IPS_STEG = 100;

/** Innskuddssatsen dras i halve prosentpoeng mellom 2 og 7. */
const SATS_STEG = 0.005;

const PROSENT = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });

export function PensjonModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const settInnskuddssats = usePengelivStore((s) => s.settInnskuddssats);
    const settIpsSparing = usePengelivStore((s) => s.settIpsSparing);

    // Framskrivningen er dyr nok til at den skal kjøres én gang per endring,
    // og billig nok til at den kan kjøres hver gang eleven slipper knappen.
    const fram = useMemo(() => {
        if (!tilstand || !satser) return null;
        return framskrivPensjon(tilstand, satser);
    }, [tilstand, satser]);

    if (!tilstand || !satser || !fram) {
        return (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Regner ut pensjonen din...
            </div>
        );
    }

    const sats = tilstand.pensjon.innskuddssats;
    const ips = ipsPerManed(tilstand);
    const aarIgjen = fram.aar;

    // Innskuddet fra jobben er nøyaktig satsen ganger lønna, så kapitalen ved
    // 67 er rett proporsjonal med satsen. Derfor trenger vi ikke framskrive
    // en gang til for å svare på «hva hvis»: vi skalerer det ene svaret vi
    // allerede har. Det er både raskere og nøyaktig likt.
    const kapitalVed = (annenSats: number) =>
        sats > 0 ? (fram.innskuddspensjon * annenSats) / sats : 0;
    const vedMinst = kapitalVed(INNSKUDD_MIN_SATS);
    const vedMest = kapitalVed(INNSKUDD_MAKS_SATS);
    const forskjell = vedMest - vedMinst;

    const fradragIAret = ipsFradrag(ips * MANEDER_I_AR, satser);

    // Setningen om hva sparingen blir til følger skyveknappen, slik at tallet
    // beveger seg mens eleven drar. Står knappen på null, viser vi i stedet
    // eksempelbeløpet - det er ingen vits i å fortelle noen at 0 kr blir 0 kr.
    const sparerNa = ips > 0;
    const visBelop = sparerNa ? ips : EKSEMPELBELOP;
    const blirTil = sparingBlirTil(visBelop, aarIgjen, ANTATT_AVKASTNING);
    const lagtInnSelv = visBelop * MANEDER_I_AR * aarIgjen;

    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pensjon</h1>
                    <p className="text-sm text-slate-600">
                        Pensjon er lønna du får når du har sluttet å jobbe. Den kommer fra tre
                        steder, og alle tre bygges opp mens du er ung.
                    </p>
                </div>
                <p className="text-xs text-slate-500">
                    Du er {tilstand.profil.alder} år.{' '}
                    {aarIgjen > 0
                        ? `${aarIgjen} år igjen til du er ${PENSJONSALDER}.`
                        : `Du har passert ${PENSJONSALDER}.`}
                </p>
            </header>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                {/* Framskrivningen er hovedbildet og får den største plassen. */}
                <Kort tittel={`Pensjonen din fra du er ${PENSJONSALDER}`}>
                    <div className="mb-2 flex flex-wrap items-end gap-x-6 gap-y-1">
                        <div>
                            <div className="text-[11px] text-slate-500">Til sammen i året</div>
                            {/* Kroner har text-sm i seg selv, og i Tailwind-bygget vinner den
                                over en større klasse utenfra. Derfor ropetegn på størrelsene. */}
                            <Kroner verdi={fram.deler.sum} className="text-3xl font-bold" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500">Det blir i måneden</div>
                            <Kroner
                                verdi={fram.deler.sum / MANEDER_I_AR}
                                className="text-xl font-bold text-indigo-700!"
                            />
                        </div>
                        <p className="max-w-[16rem] text-[11px] leading-snug text-slate-500">
                            Slik det faktisk vil stå på utbetalingen din. Prisene stiger underveis,
                            så det er verdt omtrent{' '}
                            <Kroner
                                verdi={fram.sumIDagensKroner}
                                className="text-[11px]! font-semibold"
                            />{' '}
                            i dagens penger.
                        </p>
                    </div>

                    <div className="mb-2 grid gap-1.5 sm:grid-cols-3">
                        <Sekk
                            ikon={<Landmark className="h-4 w-4 text-slate-500" />}
                            navn="Fra staten"
                            belop={fram.deler.folketrygd}
                            tekst="Livet ut."
                            forklaring={
                                <Forklaring begrep="Folketrygden">
                                    Folketrygden er statens felleskasse. Hvert år legger staten 18,1
                                    % av lønna di i en pott som er din. Når du blir pensjonist,
                                    deles potten på antall år staten regner med at du lever som
                                    pensjonist, og du får den summen hvert år så lenge du lever.
                                    Tjener du mer enn cirka 969 000 kr i året, teller ikke det som
                                    er over.
                                </Forklaring>
                            }
                        />
                        <Sekk
                            ikon={<Briefcase className="h-4 w-4 text-indigo-600" />}
                            navn="Fra jobben"
                            belop={fram.deler.innskudd}
                            tekst={`I ${UTBETALINGSAAR_INNSKUDD} år.`}
                            forklaring={
                                <Forklaring begrep="Innskuddspensjon">
                                    Sjefen din må sette av en del av lønna di til pensjon. Det heter
                                    innskuddspensjon. Pengene legges på toppen av lønna, ikke
                                    trekkes fra den, og de settes i fond som vokser fram til du blir
                                    pensjonist.
                                </Forklaring>
                            }
                        />
                        <Sekk
                            ikon={<PiggyBank className="h-4 w-4 text-emerald-600" />}
                            navn="Fra deg selv"
                            belop={fram.deler.ips}
                            tekst={ips > 0 ? 'IPS-sparingen din.' : 'Du sparer ikke i IPS ennå.'}
                            forklaring={
                                <Forklaring begrep="IPS">
                                    IPS betyr individuell pensjonssparing. Du sparer selv, du
                                    slipper skatt på det du setter inn, og til gjengjeld er pengene
                                    låst til du er {IPS_BINDING_ALDER} år.
                                </Forklaring>
                            }
                        />
                    </div>

                    <FramskrivningsGraf punkter={fram.punkter} hoyde={180} kompakt />
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                        Grafen viser pengene fra jobben og IPS-en din lagt sammen. Det lyse feltet
                        er det som faktisk er satt inn. Alt over er avkastning, og den delen vokser
                        fortest de siste årene - fordi den regnes av et stadig større beløp.
                    </p>
                </Kort>

                <div className="flex flex-col gap-3">
                    <Kort tittel="Hvor mye setter jobben av?">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-2xl font-bold text-slate-900">
                                {PROSENT.format(sats * 100)} %
                                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                                    av lønna di
                                </span>
                            </span>
                            <span className="flex gap-1.5">
                                <Knapp
                                    variant="sekundar"
                                    liten
                                    aktiv={sats === INNSKUDD_MIN_SATS}
                                    onClick={() => settInnskuddssats(INNSKUDD_MIN_SATS)}
                                >
                                    2 %
                                </Knapp>
                                <Knapp
                                    variant="sekundar"
                                    liten
                                    aktiv={sats === INNSKUDD_MAKS_SATS}
                                    onClick={() => settInnskuddssats(INNSKUDD_MAKS_SATS)}
                                >
                                    7 %
                                </Knapp>
                            </span>
                        </div>
                        <input
                            type="range"
                            min={INNSKUDD_MIN_SATS}
                            max={INNSKUDD_MAKS_SATS}
                            step={SATS_STEG}
                            value={sats}
                            onChange={(e) => settInnskuddssats(Number(e.target.value))}
                            className="mt-1 w-full accent-indigo-600"
                            aria-label="Hvor mye arbeidsgiveren setter av til pensjon"
                        />
                        <div className="flex justify-between text-[11px] leading-tight text-slate-500">
                            <span>2 % er lovens minstekrav</span>
                            <span>7 % er det meste som er lov</span>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs leading-snug text-slate-700"
                        >
                            Med 2 % står det <Kroner verdi={vedMinst} /> på kontoen når du er{' '}
                            {PENSJONSALDER}. Med 7 % står det <Kroner verdi={vedMest} />. Samme
                            lønn, <Kroner verdi={forskjell} /> i forskjell - verdt å spørre om i et
                            jobbintervju.
                        </motion.p>
                    </Kort>

                    <Kort tittel="Din egen pensjonssparing (IPS)">
                        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                            <span className="text-2xl font-bold text-slate-900">
                                <Kroner verdi={ips} className="text-2xl font-bold" />
                                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                                    i måneden
                                </span>
                            </span>
                            <span className="text-right">
                                <span className="block text-[11px] leading-tight text-slate-500">
                                    Lavere skatt i året
                                </span>
                                <Kroner
                                    verdi={fradragIAret}
                                    className="text-xl font-bold text-emerald-700!"
                                />
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={IPS_MAKS_PER_MANED}
                            step={IPS_STEG}
                            value={Math.min(IPS_MAKS_PER_MANED, Math.round(ips))}
                            onChange={(e) => settIpsSparing(Number(e.target.value))}
                            className="mt-1 w-full accent-emerald-600"
                            aria-label="Hvor mye du sparer i IPS hver måned"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] leading-snug text-slate-500">
                                Taket er <Kroner verdi={IPS_ARLIG_TAK} /> i året. Pengene tas fra
                                brukskontoen din.
                            </p>
                            <span className="flex shrink-0 gap-1.5">
                                <Knapp
                                    variant="sekundar"
                                    liten
                                    aktiv={Math.round(ips) === EKSEMPELBELOP}
                                    onClick={() => settIpsSparing(EKSEMPELBELOP)}
                                >
                                    {EKSEMPELBELOP} kr
                                </Knapp>
                                <Knapp
                                    variant="sekundar"
                                    liten
                                    aktiv={Math.round(ips) === 0}
                                    onClick={() => settIpsSparing(0)}
                                >
                                    Ingenting
                                </Knapp>
                            </span>
                        </div>

                        {aarIgjen > 0 ? (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs leading-snug text-slate-700"
                            >
                                {sparerNa ? 'Du sparer ' : 'Sparer du '}
                                <Kroner verdi={visBelop} /> i måneden fra nå til du er{' '}
                                {PENSJONSALDER}
                                {sparerNa ? '. Det blir ' : ', blir det '}
                                <Kroner verdi={blirTil} />. Selv legger du inn{' '}
                                <Kroner verdi={lagtInnSelv} /> - resten er avkastning.
                            </motion.p>
                        ) : null}
                    </Kort>
                </div>
            </div>
        </div>
    );
}

/** Én av de tre pengesekkene pensjonen kommer fra. */
function Sekk({
    ikon,
    navn,
    belop,
    tekst,
    forklaring,
}: {
    ikon: ReactNode;
    navn: string;
    belop: number;
    tekst: string;
    forklaring: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                {ikon}
                {navn}
                {forklaring}
            </span>
            <div className="text-base font-semibold text-slate-900">
                <Kroner verdi={belop} className="text-base font-semibold" />
            </div>
            <p className="text-[11px] leading-snug text-slate-500">{tekst}</p>
        </div>
    );
}
