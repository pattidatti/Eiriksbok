// Oversikt: hjemskjermen. Skal kunne leses på fem sekunder.
//
// Fire tall på toppen (formue, gjeld, netto, til overs), og under dem
// framskrivningsgrafen som alltid viser hvor eleven havner med dagens valg.
//
// «Til overs i måneden» får en linje under seg når en vesentlig del av
// overskuddet ikke blir spart. Den sier hvor mye som blir liggende og sender
// eleven videre til Sparing, der hele regnestykket står. Her holder det med én
// linje: hjemskjermen skal fortsatt kunne leses på fem sekunder.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Coins, PiggyBank, Scale } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { nokkeltall } from '../engine/nokkeltall';
import { framskriv } from '../engine/projeksjon';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Knapp, Kort, Kroner } from '../components/primitives';

const HORISONTER = [10, 25, 40] as const;

/**
 * Hvor mange ubrukte kroner i måneden som skal til før linja vises.
 *
 * Samme grense som i Sparing-modulen: 500 kr i måneden er 6 000 kr i året.
 * Under det er beløpet for lite til å ta plass på hjemskjermen, og en melding
 * om det ville blitt mas i stedet for opplysning.
 */
const UBRUKT_TERSKEL = 500;

export function OversiktModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const [horisont, setHorisont] = useState<number>(25);
    const velgModul = usePengelivStore((s) => s.velgModul);

    const profil = tilstand?.profil ?? null;

    // Ett kall, én kilde. Formue, gjeld og utgifter regnes i nokkeltall.ts og
    // ingen andre steder, slik at denne skjermen aldri kan bli uenig med
    // toppbaren eller med motoren om hva tallene er.
    const tall = useMemo(() => {
        if (!tilstand || !satser) return null;
        return nokkeltall(tilstand, satser);
    }, [tilstand, satser]);

    const punkter = useMemo(() => {
        if (!tilstand || !satser) return [];
        return framskriv(tilstand, satser, horisont);
    }, [tilstand, satser, horisont]);

    if (!tilstand || !profil || !satser || !tall) {
        return <Laster />;
    }

    const { kontanter, eiendeler, gjeld, netto, overskudd } = tall;
    const ubrukt = overskudd - profil.manedligSparing;
    const visUbrukt = ubrukt >= UBRUKT_TERSKEL;

    const aarNaa = tilstand.startAar + Math.floor(tilstand.maaned / 12);
    const sluttpunkt = punkter.length > 0 ? punkter[punkter.length - 1] : null;

    return (
        <div className="flex flex-col gap-2">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Hei, {profil.navn || 'du'}
                    </h1>
                    <p className="text-sm text-slate-600">
                        {profil.alder} år, {profil.yrke}. Det er {aarNaa}, og dette er økonomien din
                        akkurat nå.
                    </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    Alle tall er dine. Endre dem
                    <Forklaring begrep="Dine tall">
                        Du startet med en ferdig person, men fra nå av er dette dine tall. Gå inn i
                        modulene i menyen og endre lønn, budsjett og sparing så det ligner ditt eget
                        liv, eller det livet du vil prøve ut.
                    </Forklaring>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Rute
                    etikett="På konto"
                    verdi={kontanter}
                    hjelp="Pengene du kan bruke i dag."
                    ikon={<Coins className="h-4 w-4" aria-hidden="true" />}
                />
                <Rute
                    etikett="Gjeld"
                    verdi={gjeld}
                    hjelp="Alt du skylder andre."
                    ikon={<ArrowDownRight className="h-4 w-4" aria-hidden="true" />}
                />
                {/* Boligen teller med i netto, men står ikke på noen konto. Uten
                    linja under ville tallet sett uforklarlig stort ut for den som
                    nettopp har kjøpt - og uforklarlig lite hvis vi lot være å
                    telle huset med i det hele tatt. */}
                <Rute
                    etikett="Netto"
                    verdi={netto}
                    hjelp="Det du eier når alt er gjort opp."
                    undertekst={
                        eiendeler > 0 ? (
                            <>
                                Boligen din er verdt <Kroner verdi={eiendeler} /> og er regnet med
                                her.
                            </>
                        ) : null
                    }
                    ikon={<Scale className="h-4 w-4" aria-hidden="true" />}
                    fremhevet
                />
                <Rute
                    etikett="Til overs i måneden"
                    verdi={overskudd}
                    hjelp="Lønn etter skatt, minus utgifter og regninger på lån."
                    ikon={<ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                    tone={overskudd < 0 ? 'negativ' : 'positiv'}
                />
            </div>

            {visUbrukt && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5"
                >
                    <p className="flex items-center gap-2 text-sm text-slate-700">
                        <PiggyBank
                            className="h-4 w-4 shrink-0 text-indigo-600"
                            aria-hidden="true"
                        />
                        <span>
                            Du sparer <Kroner verdi={profil.manedligSparing} /> fast hver måned. De
                            siste <Kroner verdi={ubrukt} /> blir liggende på brukskontoen.
                        </span>
                    </p>
                    <Knapp liten onClick={() => velgModul('sparing')}>
                        Se hva de kunne blitt til
                        <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    </Knapp>
                </motion.div>
            )}

            <Kort tittel="Slik går det med deg">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-600">
                        {sluttpunkt ? (
                            <>
                                Holder du kursen, står du med{' '}
                                <span className="font-semibold text-indigo-700">
                                    <Kroner verdi={sluttpunkt.nominelt} />
                                </span>{' '}
                                når du er {sluttpunkt.alder} år.
                            </>
                        ) : (
                            'Sett en lønn og et budsjett, så tegner grafen seg opp.'
                        )}
                    </p>
                    <div className="flex gap-1.5">
                        {HORISONTER.map((aar) => (
                            <Knapp
                                key={aar}
                                variant={horisont === aar ? 'primar' : 'sekundar'}
                                aktiv={horisont === aar}
                                onClick={() => setHorisont(aar)}
                            >
                                {aar} år
                            </Knapp>
                        ))}
                    </div>
                </div>
                {/* 175 px, ikke 205: grafen deler nå høyden med linja om ubrukte
                    kroner, og alt skal fortsatt få plass over folden på 1366x768 -
                    både første gang, når grafen låner 70 piksler til forklaringen
                    sin, og etterpå, når den får dem tilbake. */}
                <FramskrivningsGraf punkter={punkter} hoyde={175} />
            </Kort>
        </div>
    );
}

function Rute({
    etikett,
    verdi,
    hjelp,
    ikon,
    fremhevet = false,
    tone = 'noytral',
    undertekst = null,
}: {
    etikett: string;
    verdi: number;
    hjelp: string;
    ikon: ReactNode;
    fremhevet?: boolean;
    tone?: 'noytral' | 'positiv' | 'negativ';
    /** Én ekstra linje under hjelpeteksten, når tallet trenger en forklaring. */
    undertekst?: ReactNode;
}) {
    const tall =
        tone === 'negativ'
            ? 'text-rose-700'
            : tone === 'positiv'
              ? 'text-emerald-700'
              : 'text-slate-900';
    return (
        <motion.div
            layout
            className={`rounded-2xl border px-3 py-1.5 shadow-sm ${
                fremhevet
                    ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-white'
                    : 'border-slate-200 bg-white/80'
            }`}
        >
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="text-slate-400">{ikon}</span>
                {etikett}
            </div>
            <motion.div
                key={Math.round(verdi)}
                initial={{ y: 5, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`text-xl font-bold leading-tight ${tall}`}
            >
                <Kroner verdi={verdi} />
            </motion.div>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hjelp}</p>
            {undertekst && (
                <p className="mt-0.5 text-[11px] leading-snug text-indigo-700">{undertekst}</p>
            )}
        </motion.div>
    );
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Setter opp økonomien din...
        </div>
    );
}
