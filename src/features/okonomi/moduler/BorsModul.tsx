// Børs: ni ekte norske selskaper med oppdiktede kurser.
//
// Modulen har tre jobber, i denne rekkefølgen:
//
// 1. Si tydelig fra at kursene ikke er ekte. Det står i stripa under
//    overskriften, i korttittelen og i handelskortet. En elev skal ikke kunne
//    bli sittende med inntrykk av at dette er Oslo Børs.
// 2. Vise skyggeregnskapet hele tiden. Det er hele grunnen til at modulen
//    finnes: på aksjesparekonto venter skatten til du tar pengene ut, og
//    tallet på hva du har utsatt skal stå framme, ikke gjemmes bak et klikk.
// 3. Gjøre kurtasjen synlig som en kostnad. Gebyret står som egen linje i
//    regnestykket før eleven trykker, ikke som en overraskelse etterpå.
//
// Modulen anbefaler ingenting. Den viser at alt står i ett selskap hvis alt
// står i ett selskap, og lar eleven trekke slutningen selv. Samtalen om flaks
// versus dyktighet tas av læreren.
//
// Tre kolonner, ikke to. Hele modulen må få plass på 768 piksler uten at
// siden begynner å scrolle, og en Chromebook har ikke en piksel til overs.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { AKSJER, SIMULERT_ADVARSEL } from '../data/aksjer';
import {
    aksjebeholdning,
    aksjekurs,
    antallEid,
    beregnHandel,
    kurshistorikk,
    maksAntall,
    skattVedSalg,
    SKATTESATS_AKSJEINNTEKT,
} from '../engine/bors';
import {
    Forklaring,
    Knapp,
    Kort,
    Kroner,
    Tallrad,
    formaterProsent,
} from '../components/primitives';

/** Hvor mange måneder kurslinja viser. To år er nok til å se en trend. */
const GRAF_MANEDER = 24;

/** Fargene spredningsstolpen bruker, i den rekkefølgen selskapene står. */
const ANDELSFARGER = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-sky-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-slate-500',
];

/** «95,00». Kurser vises med to desimaler, slik nettmeglere gjør det. */
function kursTekst(kurs: number): string {
    return kurs.toFixed(2).replace('.', ',');
}

export function BorsModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const kjopAksje = usePengelivStore((s) => s.kjopAksje);
    const selgAksje = usePengelivStore((s) => s.selgAksje);

    const [valgtId, settValgtId] = useState(AKSJER[0].id);
    const [antall, settAntall] = useState(1);

    // Kurslinjene regnes ut fra frøet og trenger bare gjøres om igjen når
    // klokka har flyttet seg. Uten dette ville ni serier blitt regnet på nytt
    // hver gang eleven trykket på en pluss-knapp.
    const kurver = useMemo(() => {
        if (!tilstand) return new Map<string, number[]>();
        const kart = new Map<string, number[]>();
        for (const aksje of AKSJER) {
            kart.set(aksje.id, kurshistorikk(tilstand, aksje.id, GRAF_MANEDER));
        }
        return kart;
    }, [tilstand]);

    const beholdning = useMemo(() => (tilstand ? aksjebeholdning(tilstand) : []), [tilstand]);

    if (!tilstand) return <Laster />;

    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    const ledig = bruks ? bruks.saldo : 0;

    const valgt = AKSJER.find((a) => a.id === valgtId) ?? AKSJER[0];
    const eid = antallEid(tilstand, valgt.id);
    const maks = maksAntall(tilstand, valgt.id);
    const handel = beregnHandel(tilstand, valgt.id, antall);
    const skattNaa = skattVedSalg(tilstand, valgt.id, Math.min(antall, eid));

    const kanKjope = handel.antall > 0 && handel.sumKjop <= ledig;
    const kanSelge = handel.antall > 0 && handel.antall <= eid;

    const samletVerdi = beholdning.reduce((sum, post) => sum + post.verdi, 0);
    const samletGevinst = beholdning.reduce((sum, post) => sum + post.gevinst, 0);
    const { utsattSkatt, urealisertGevinst } = tilstand.skyggeregnskap;

    const velg = (id: string) => {
        settValgtId(id);
        settAntall(1);
    };

    return (
        <div className="flex flex-col gap-2">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <h1 className="text-xl font-bold text-slate-900">Børs</h1>
                <p className="flex flex-wrap items-center gap-x-1 text-xs text-slate-600">
                    Kjøp og selg aksjer
                    <Forklaring begrep="Aksje">
                        En aksje er en liten bit av et selskap. Eier du én aksje i Orkla, eier du en
                        ørliten del av alt Orkla har og tjener. Går det bra med selskapet, vil flere
                        kjøpe biten din, og da stiger prisen. Går det dårlig, faller den.
                    </Forklaring>
                    i norske selskaper. Alt ligger på aksjesparekonto.
                    <span className="ml-2 flex items-center gap-1 text-slate-500">
                        <Wallet className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Til å handle for: <Kroner verdi={ledig} />
                    </span>
                </p>
            </header>

            {/* Advarselen står øverst og alltid. Den er ikke en tooltip eleven
                kan la være å åpne. */}
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] leading-snug text-amber-900">
                <span className="font-bold">Oppdiktede kurser.</span> {SIMULERT_ADVARSEL}
            </p>

            <div className="grid gap-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
                {/* --- Kolonne 1: selskapene ---------------------------------- */}
                <Kort tittel="Selskapene" undertittel="Trykk på en rad for å handle">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        <span className="min-w-0 flex-1">Selskap</span>
                        <span className="w-12 text-center">2 år</span>
                        <span className="flex w-[68px] items-center justify-end">
                            Kurs
                            <Forklaring begrep="Kurs">
                                Kursen er prisen på én aksje akkurat nå. Den endrer seg hele tiden,
                                fordi den bestemmes av hvor mange som vil kjøpe og hvor mange som
                                vil selge.
                            </Forklaring>
                        </span>
                        <span className="w-14 text-right">Siste mnd</span>
                        <span className="w-8 text-right">Eier</span>
                    </div>

                    {AKSJER.map((aksje) => {
                        const kurve = kurver.get(aksje.id) ?? [];
                        const kurs = aksjekurs(tilstand, aksje.id);
                        const forrige = kurve.length > 1 ? kurve[kurve.length - 2] : kurs;
                        const endring = forrige > 0 ? kurs / forrige - 1 : 0;
                        const mitt = antallEid(tilstand, aksje.id);
                        const erValgt = aksje.id === valgtId;

                        return (
                            <button
                                key={aksje.id}
                                type="button"
                                onClick={() => velg(aksje.id)}
                                aria-pressed={erValgt}
                                className={`flex w-full items-center gap-1.5 rounded-md px-1 py-[3px] text-left transition-colors ${
                                    erValgt
                                        ? 'bg-indigo-50 ring-1 ring-indigo-300'
                                        : 'hover:bg-slate-50'
                                }`}
                            >
                                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800">
                                    {aksje.navn}
                                    <span className="ml-1.5 font-normal text-[10px] text-slate-400">
                                        {aksje.bransje}
                                    </span>
                                </span>
                                <Kurslinje kurve={kurve} />
                                <span className="w-[68px] text-right text-[12px] font-semibold tabular-nums text-slate-900">
                                    {kursTekst(kurs)}
                                </span>
                                <span
                                    className={`w-14 text-right text-[12px] font-semibold tabular-nums ${
                                        endring >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                >
                                    {endring >= 0 ? '+' : ''}
                                    {formaterProsent(endring, 1)}
                                </span>
                                <span className="w-8 text-right text-[12px] tabular-nums text-slate-500">
                                    {mitt > 0 ? mitt : '-'}
                                </span>
                            </button>
                        );
                    })}
                </Kort>

                {/* --- Kolonne 2: handelen ------------------------------------ */}
                <Kort
                    tittel={valgt.navn}
                    undertittel={`${valgt.bransje} - oppdiktet kurs`}
                    handling={<Kroner verdi={aksjekurs(tilstand, valgt.id)} desimaler={2} />}
                >
                    <p className="line-clamp-3 text-[10px] leading-snug text-slate-600">
                        {valgt.beskrivelse}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <Knapp
                            liten
                            variant="sekundar"
                            onClick={() => settAntall((n) => Math.max(1, n - 1))}
                            tittel="Én færre"
                        >
                            -
                        </Knapp>
                        <span className="w-12 rounded-lg border border-slate-200 bg-white py-0.5 text-center text-sm font-bold tabular-nums text-slate-900">
                            {handel.antall}
                        </span>
                        <Knapp
                            liten
                            variant="sekundar"
                            onClick={() => settAntall((n) => n + 1)}
                            tittel="Én til"
                        >
                            +
                        </Knapp>
                        <Knapp
                            liten
                            variant="sekundar"
                            onClick={() => settAntall(Math.max(1, maks))}
                            disabled={maks <= 0}
                            tittel="Så mange du har råd til"
                        >
                            Maks
                        </Knapp>
                        {eid > 0 && (
                            <Knapp
                                liten
                                variant="sekundar"
                                onClick={() => settAntall(eid)}
                                tittel="Alle du eier"
                            >
                                Alle
                            </Knapp>
                        )}
                    </div>

                    <div className="mt-1">
                        <Tallrad
                            etikett={`${handel.antall} aksjer til ${kursTekst(handel.kurs)}`}
                            belop={handel.belop}
                            className="py-1"
                        />
                        <Tallrad
                            etikett="Kurtasje"
                            belop={handel.kurtasje}
                            forklaring="Meglerens gebyr: 0,15 %, men aldri under 29 kr. Du betaler det både når du kjøper og når du selger."
                            className="py-1"
                        />
                        <Tallrad
                            etikett="Å betale"
                            belop={handel.sumKjop}
                            fremhevet
                            className="py-1"
                        />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Knapp
                            liten
                            onClick={() => kjopAksje(valgt.id, handel.antall)}
                            disabled={!kanKjope}
                        >
                            Kjøp for {Math.round(handel.sumKjop)} kr
                        </Knapp>
                        <Knapp
                            liten
                            variant="sekundar"
                            onClick={() => selgAksje(valgt.id, handel.antall)}
                            disabled={!kanSelge}
                        >
                            Selg for {Math.round(handel.sumSalg)} kr
                        </Knapp>
                    </div>

                    <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-slate-500">
                        {!kanKjope && handel.antall > 0 ? (
                            <span className="text-rose-700">
                                Du mangler <Kroner verdi={handel.sumKjop - ledig} /> på brukskontoen
                                for å kjøpe så mange.
                            </span>
                        ) : eid > 0 && Math.abs(skattNaa) >= 1 ? (
                            skattNaa > 0 ? (
                                <>
                                    Selger du nå, ville staten uten aksjesparekonto tatt{' '}
                                    <Kroner verdi={skattNaa} tone="negativ" /> av gevinsten med en
                                    gang.
                                </>
                            ) : (
                                <>
                                    Selger du nå, ville tapet uten aksjesparekonto gitt deg{' '}
                                    <Kroner verdi={-skattNaa} tone="positiv" /> mindre i skatt med
                                    en gang.
                                </>
                            )
                        ) : (
                            <>
                                Kurtasjen betales to ganger: én gang når du kjøper og én gang når du
                                selger.
                            </>
                        )}
                    </p>
                </Kort>

                {/* --- Kolonne 3: skyggeregnskap og beholdning ---------------- */}
                <div className="flex flex-col gap-2">
                    <Kort tittel="Skyggeregnskapet">
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5">
                            {utsattSkatt >= 0 ? (
                                <>
                                    <div className="flex items-center gap-0.5 text-[10px] text-slate-600">
                                        Du har utsatt
                                        <Forklaring begrep="Utsatt skatt">
                                            Skatt du skal betale, men ikke ennå. Pengene ligger og
                                            jobber for deg i mellomtiden i stedet for å ligge hos
                                            staten. Det er ikke penger du slipper unna - det er
                                            penger regningen venter på litt lenger.
                                        </Forklaring>
                                        i skatt
                                    </div>
                                    <Kroner verdi={utsattSkatt} stor tone="noytral" />
                                </>
                            ) : (
                                <>
                                    <div className="text-[10px] text-slate-600">
                                        Tapene dine har utsatt et fradrag på
                                    </div>
                                    <Kroner verdi={-utsattSkatt} stor tone="noytral" />
                                </>
                            )}
                        </div>

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1 text-[10px] leading-snug text-slate-600">
                            Alt du eier ligger på en aksjesparekonto.
                            <Forklaring begrep="Aksjesparekonto (ASK)">
                                En konto laget for aksjer og aksjefond. Så lenge pengene blir
                                liggende inne på kontoen, betaler du ingen skatt av gevinsten, selv
                                om du selger og kjøper noe annet. Skatten kommer først den dagen du
                                tar penger ut av kontoen - og du får ta ut det du selv har satt inn,
                                uten skatt, før gevinsten regnes med.
                            </Forklaring>
                            Uten den ville {formaterProsent(SKATTESATS_AKSJEINNTEKT, 2)} av hver
                            gevinst gått rett til skatt i samme sekund som du solgte.
                        </p>

                        <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-1 text-[10px] text-slate-600">
                            <span className="flex items-center gap-0.5">
                                Gevinst du sitter på nå
                                <Forklaring begrep="Gevinst">
                                    Gevinst er forskjellen mellom det du betalte og det aksjene er
                                    verdt nå. Den er ikke ekte før du selger: faller kursen igjen,
                                    forsvinner den like stille som den kom.
                                </Forklaring>
                            </span>
                            <Kroner verdi={urealisertGevinst} visTegn />
                        </div>
                    </Kort>

                    <Kort tittel="Det du eier" undertittel={`Verdi ${Math.round(samletVerdi)} kr`}>
                        {beholdning.length === 0 ? (
                            <p className="text-[10px] leading-snug text-slate-500">
                                Du eier ingen aksjer ennå. Velg et selskap i lista og kjøp så mange
                                du vil - men husk at kurtasjen på 29 kr betales uansett hvor lite du
                                handler for.
                            </p>
                        ) : (
                            <>
                                {/* Stolpen sier ingenting om hva som er lurt. Den viser
                                    bare hvor pengene faktisk står. */}
                                <div className="mb-1 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                    {beholdning.map((post, i) => (
                                        <motion.div
                                            key={post.aksje.id}
                                            className={ANDELSFARGER[i % ANDELSFARGER.length]}
                                            initial={false}
                                            animate={{ width: `${post.andel * 100}%` }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 30,
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="mb-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
                                    {beholdning.length === 1
                                        ? `Alt du eier står i ${beholdning[0].aksje.navn}.`
                                        : `Pengene dine står i ${beholdning.length} selskaper. Det største er ${beholdning[0].aksje.navn} med ${Math.round(beholdning[0].andel * 100)} %.`}
                                </p>

                                <div className="flex max-h-[96px] flex-col overflow-y-auto">
                                    {beholdning.map((post, i) => (
                                        <button
                                            key={post.aksje.id}
                                            type="button"
                                            onClick={() => velg(post.aksje.id)}
                                            className="flex items-center gap-1.5 rounded-md px-1 py-[2px] text-left transition-colors hover:bg-slate-50"
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${ANDELSFARGER[i % ANDELSFARGER.length]}`}
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-800">
                                                {post.aksje.navn}
                                            </span>
                                            <span className="w-7 text-right text-[10px] tabular-nums text-slate-500">
                                                {post.antall}
                                            </span>
                                            <span className="w-[70px] text-right">
                                                <Kroner verdi={post.verdi} />
                                            </span>
                                            <span className="w-[70px] text-right">
                                                <Kroner verdi={post.gevinst} visTegn />
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-0.5 flex items-baseline justify-between border-t border-slate-200 pt-1 text-[11px] font-semibold text-slate-700">
                                    <span>Gevinst til sammen</span>
                                    <Kroner verdi={samletGevinst} visTegn />
                                </div>
                            </>
                        )}
                    </Kort>
                </div>
            </div>
        </div>
    );
}

/**
 * Kursen de siste to årene som en liten linje.
 *
 * Kursene er ikke lagret noe sted. De regnes ut fra frøet på nytt hver gang,
 * og treffer derfor nøyaktig den kursen klokka ville kommet fram til. Har
 * klokka ikke gått ennå, finnes det ingen fortid å tegne, og da tegnes ingen.
 */
function Kurslinje({ kurve }: { kurve: number[] }) {
    if (kurve.length < 2) return <span className="w-12 shrink-0" />;

    const hoy = Math.max(...kurve);
    const lav = Math.min(...kurve);
    const spenn = hoy - lav || 1;
    const punkter = kurve
        .map((verdi, i) => {
            const x = (i / (kurve.length - 1)) * 60;
            const y = 18 - ((verdi - lav) / spenn) * 16;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    const opp = kurve[kurve.length - 1] >= kurve[0];

    return (
        <svg
            viewBox="0 0 60 20"
            className="h-4 w-12 shrink-0"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <polyline
                points={punkter}
                fill="none"
                stroke={opp ? '#059669' : '#e11d48'}
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Henter kursene...
        </div>
    );
}
