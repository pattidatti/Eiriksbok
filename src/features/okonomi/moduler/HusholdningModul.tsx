// Husholdning: samboer, barn og bryteren for om livet skal skje.
//
// Modulen har én jobb: eleven skal se hva et valg gjør med pengene i samme
// øyeblikk som valget tas. Flytter samboeren inn, faller de delte utgiftene
// med det samme. Kommer et barn, kommer barnetrygden, barnehageregninga og
// permisjonen samtidig, og framskrivningen tegner seg på nytt.
//
// Tonen er nøktern. Appen mener ingenting om familieliv, den viser tall.
//
// Her bor også `HendelseDialog`, som er valget eleven ikke skal kunne overse
// når livet slår til. Se kommentaren over komponenten for hvor den bør henge.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Sparkles, UserPlus, Users, Zap } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { beregnLonnsslipp } from '../engine/skatt';
import { framskriv } from '../engine/projeksjon';
import { BARNETRYGD_PER_MANED, MAKS_BARN, SEKS_G, husholdningstall } from '../engine/husholdning';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Knapp, Kort, Kroner } from '../components/primitives';

/** Antall år framskrivningsgrafen i modulen ser framover. */
const HORISONT_AAR = 20;

export function HusholdningModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const settSamboer = usePengelivStore((s) => s.settSamboer);
    const faaBarn = usePengelivStore((s) => s.faaBarn);
    const settHendelserPa = usePengelivStore((s) => s.settHendelserPa);

    const profil = tilstand?.profil ?? null;

    const nettoManedlig = useMemo(() => {
        if (!profil || !satser) return 0;
        return beregnLonnsslipp(profil, satser).nettoManedlig;
    }, [profil, satser]);

    const tall = useMemo(() => {
        if (!tilstand || !satser) return null;
        return husholdningstall(tilstand, satser, nettoManedlig);
    }, [tilstand, satser, nettoManedlig]);

    const punkter = useMemo(() => {
        if (!tilstand || !satser) return [];
        return framskriv(tilstand, satser, HORISONT_AAR);
    }, [tilstand, satser]);

    if (!tilstand || !profil || !satser || !tall) {
        return (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Henter husholdningen din...
            </div>
        );
    }

    const harSamboer = profil.husholdning.harSamboer;
    const antallBarn = tall.barn.length;

    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Husholdning</h1>
                    <p className="text-sm text-slate-600">
                        Du bestemmer selv når noen flytter inn og når et barn kommer. Ingenting
                        skjer av seg selv her.
                    </p>
                </div>
                <p className="text-xs text-slate-500">
                    {harSamboer ? 'Dere er to i huset' : 'Du bor alene'}
                    {antallBarn > 0
                        ? `, og du har ${antallBarn === 1 ? 'ett barn' : `${antallBarn} barn`}`
                        : ''}
                </p>
            </header>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-3">
                    <Kort tittel="Samboer" ikon={<Users className="h-4 w-4" />}>
                        <p className="text-xs leading-snug text-slate-600">
                            Flytter noen inn, deler dere husleie, strøm, mat, forsikring og
                            abonnementer på to. Det kalles utgiftsdeling.
                            <Forklaring begrep="Utgiftsdeling">
                                Dere betaler halvparten hver av det dere bruker sammen. Mobil, buss,
                                klær og moro blir ikke billigere av at det bor to i huset, så de
                                deles ikke. Samboeren har ingen egen lønn eller sparing her -
                                Pengeliv følger bare din økonomi.
                            </Forklaring>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Knapp
                                variant={harSamboer ? 'sekundar' : 'primar'}
                                onClick={() => settSamboer(!harSamboer)}
                            >
                                {harSamboer ? 'Flytt fra hverandre' : 'Få samboer'}
                            </Knapp>
                            {harSamboer && (
                                <span className="text-xs text-slate-500">
                                    Du sparer{' '}
                                    <span className="font-semibold text-emerald-700">
                                        <Kroner verdi={tall.spartPaaSamboer} />
                                    </span>{' '}
                                    i måneden
                                </span>
                            )}
                        </div>

                        {harSamboer ? (
                            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs leading-snug text-slate-700">
                                Det blir <Kroner verdi={tall.spartPaaSamboer * 12} /> på ett år, som
                                du kan bruke på noe annet.
                            </p>
                        ) : (
                            <p className="mt-2 text-xs leading-snug text-slate-500">
                                Prøv det og se hva som skjer med grafen. Du kan flytte fra hverandre
                                igjen når som helst.
                            </p>
                        )}
                    </Kort>

                    <Kort tittel="Barn" ikon={<Baby className="h-4 w-4" />}>
                        <div className="flex flex-wrap items-center gap-2">
                            <Knapp onClick={faaBarn} disabled={antallBarn >= MAKS_BARN}>
                                <span className="flex items-center gap-1.5">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Få barn
                                </span>
                            </Knapp>
                            <span className="text-xs text-slate-500">
                                Barnetrygd <Kroner verdi={BARNETRYGD_PER_MANED} /> per barn i
                                måneden
                                <Forklaring begrep="Barnetrygd">
                                    Barnetrygd er penger staten betaler til alle som har barn under
                                    18 år. I 2026 er den {BARNETRYGD_PER_MANED} kr i måneden per
                                    barn, og du får den uansett hvor mye du tjener. Den dekker en
                                    god del av det barnet koster, men ikke alt.
                                </Forklaring>
                            </span>
                        </div>

                        {antallBarn === 0 ? (
                            <p className="mt-2 text-xs leading-snug text-slate-500">
                                Du har ingen barn. Får du ett, kommer barnetrygden inn hver måned,
                                og utgifter til mat, klær og barnehage går ut. Du får også
                                foreldrepermisjon, og da endrer inntekten din seg.
                            </p>
                        ) : (
                            <>
                                {/* Lista ruller for seg selv. Fire barn skal ikke
                                    kunne skyve kortene under seg ut av en
                                    Chromebook-skjerm på 768 piksler. */}
                                <ul className="mt-2 flex max-h-[4.5rem] flex-col gap-1 overflow-y-auto pr-1">
                                    {/* To barn kan være født i samme måned, så
                                        fødselsmåneden alene er ikke en unik
                                        nøkkel. Plassen i lista er det. */}
                                    {tall.barn.map((barn, indeks) => (
                                        <li
                                            key={`${barn.fodtMaaned}-${indeks}`}
                                            className="flex items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1"
                                        >
                                            <span className="text-xs font-semibold text-slate-800">
                                                {barn.alder === 0 ? 'Nyfødt' : `${barn.alder} år`}
                                                {barn.permisjonIgjen > 0 && (
                                                    <span className="ml-1.5 font-normal text-amber-700">
                                                        {barn.permisjonUlonnet
                                                            ? 'ulønnet permisjon'
                                                            : 'permisjon'}
                                                        , {barn.permisjonIgjen} mnd igjen
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-[11px] text-slate-500">
                                                <Kroner verdi={barn.barnetrygd} /> inn,{' '}
                                                <Kroner verdi={barn.kostnad} /> ut
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs leading-snug text-slate-700">
                                    Barna gir <Kroner verdi={tall.sumBarnetrygd} /> og koster{' '}
                                    <Kroner verdi={tall.sumBarnekostnad} /> i måneden, altså{' '}
                                    <span
                                        className={
                                            tall.nettoBarn < 0
                                                ? 'font-semibold text-rose-700'
                                                : 'font-semibold text-emerald-700'
                                        }
                                    >
                                        <Kroner verdi={tall.nettoBarn} visTegn />
                                    </span>
                                    .
                                    <Forklaring begrep="Utenfor budsjettet">
                                        Barnetrygden og barneutgiftene står ikke i budsjettet ditt.
                                        De går rett inn og ut av brukskontoen, på samme måte som
                                        lønna og terminbeløpet på et lån. Budsjettet er de valgene
                                        du selv styrer.
                                    </Forklaring>{' '}
                                    {tall.barn[tall.barn.length - 1].fasetekst}
                                </div>

                                {tall.permisjonstrekk > 0 && (
                                    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs leading-snug text-amber-900">
                                        Permisjonen tar <Kroner verdi={tall.permisjonstrekk} /> av
                                        lønna denne måneden.
                                        <Forklaring begrep="Foreldrepermisjon">
                                            Foreldrepermisjon er fri fra jobb for å være hjemme med
                                            barnet. I ni av månedene får du foreldrepenger, som er
                                            like mye som lønna di, men aldri mer enn{' '}
                                            <Kroner verdi={SEKS_G} /> i året. De tre siste månedene
                                            i modellen er ulønnet: da kommer det ingen lønn inn i
                                            det hele tatt.
                                        </Forklaring>
                                    </div>
                                )}
                            </>
                        )}
                    </Kort>
                </div>

                <div className="flex flex-col gap-3">
                    <Kort tittel={`Formuen din de neste ${HORISONT_AAR} årene`}>
                        <FramskrivningsGraf punkter={punkter} hoyde={120} kompakt />
                        <p className="mt-1 text-[11px] leading-snug text-slate-500">
                            Grafen regner med valgene du har tatt her. Skru samboer av og på, og se
                            hvor mye linja flytter seg.
                        </p>
                    </Kort>

                    <Kort tittel="Livet skjer" ikon={<Zap className="h-4 w-4" />}>
                        <p className="text-xs leading-snug text-slate-600">
                            Med bryteren på kan mobilen knuse, husleia settes opp eller bilen ryke.
                            Hver gang får du et valg som treffer budsjettet. Med den av skjer det
                            ingenting uventet, og da kan du teste én endring om gangen og se
                            nøyaktig hva den gjorde.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Knapp
                                aktiv={tilstand.hendelserPa}
                                variant="sekundar"
                                onClick={() => settHendelserPa(true)}
                            >
                                Livet skjer
                            </Knapp>
                            <Knapp
                                aktiv={!tilstand.hendelserPa}
                                variant="sekundar"
                                onClick={() => settHendelserPa(false)}
                            >
                                Ingen overraskelser
                            </Knapp>
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-slate-500">
                            {tilstand.hendelserPa
                                ? 'Det kommer omtrent én hendelse annethvert år. Klokka stopper når den kommer, så du rekker å velge.'
                                : 'Ingenting uventet vil skje. Formuen din framover er bare et resultat av valgene dine.'}
                        </p>
                    </Kort>
                </div>
            </div>
        </div>
    );
}

/**
 * Valget eleven ikke skal kunne overse.
 *
 * Dialogen legger seg over hele skjermen når en hendelse treffer, fordi
 * klokka står stille til eleven har svart. Etter valget bytter den til
 * forklaringen: det er der læringen ligger, ikke i selve uflaksen.
 *
 * Komponenten renderer ingenting når `aktivHendelse` er `null`, så den kan
 * stå montert hele tiden uten å koste noe.
 */
export function HendelseDialog() {
    const hendelse = usePengelivStore((s) => s.tilstand?.aktivHendelse ?? null);
    const svarPaaHendelse = usePengelivStore((s) => s.svarPaaHendelse);
    const [valgt, settValgt] = useState<number | null>(null);

    const valg = hendelse && valgt !== null ? hendelse.valg[valgt] : null;

    return (
        <AnimatePresence>
            {hendelse && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={hendelse.tittel}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-slate-900">
                                    {hendelse.tittel}
                                </h2>
                                <p className="mt-0.5 text-sm leading-snug text-slate-600">
                                    {hendelse.tekst}
                                </p>
                            </div>
                        </div>

                        {valg ? (
                            <div className="mt-3">
                                <p className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-sm leading-snug text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {valg.tekst}.
                                    </span>{' '}
                                    {valg.forklaring}
                                </p>
                                <div className="mt-3 flex justify-end">
                                    <Knapp
                                        onClick={() => {
                                            const indeks = valgt;
                                            settValgt(null);
                                            if (indeks !== null) svarPaaHendelse(indeks);
                                        }}
                                    >
                                        Greit, gå videre
                                    </Knapp>
                                </div>
                            </div>
                        ) : (
                            <ul className="mt-3 flex flex-col gap-2">
                                {hendelse.valg.map((mulighet, indeks) => (
                                    <li key={mulighet.tekst}>
                                        <button
                                            type="button"
                                            onClick={() => settValgt(indeks)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/60"
                                        >
                                            <span className="flex items-baseline justify-between gap-3">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {mulighet.tekst}
                                                </span>
                                                <Virkning
                                                    kostnad={mulighet.kostnad}
                                                    endring={mulighet.budsjettendring?.belop}
                                                />
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Prislappen på et valg: engangsbeløpet, og hva det gjør med budsjettet. */
function Virkning({ kostnad, endring }: { kostnad?: number; endring?: number }): ReactNode {
    if (!kostnad && !endring) {
        return <span className="shrink-0 text-xs text-slate-500">Koster ingenting</span>;
    }

    return (
        <span className="flex shrink-0 items-baseline gap-2 text-xs">
            {kostnad ? <Kroner verdi={-kostnad} visTegn className="text-xs" /> : null}
            {endring ? (
                <span className={endring > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {endring > 0 ? '+' : ''}
                    {endring} kr/mnd
                </span>
            ) : null}
        </span>
    );
}
