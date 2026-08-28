// Fond: seks fond, fire poenger.
//
// 1. Gebyrer spiser formuen. Det er hovedsaken, og det står i kroner, ikke i
//    prosent. To fond som eier de samme selskapene, der det eneste som skiller
//    dem er hva de tar betalt, og en differanse eleven kan lese rett av.
// 2. Spredning demper fallet. Det samme krakket rammer rentefondet med noen
//    få prosent og bransjefondet med nesten halvparten.
// 3. Risiko henger sammen med tidshorisont. Krakk-kortet sier ikke bare hvor
//    dypt fallet var, men hvor lenge det tok å komme tilbake.
// 4. Et fond er bare mange av de samme aksjene som ligger på børsen. Det står
//    i klartekst øverst, ikke som noe eleven skal regne seg fram til.
//
// Kursene er laget av appen. Det står synlig på skjermen, og det står her.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, TrendingDown } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { FOND, FOND_KATEGORINAVN } from '../data/fond';
import {
    finnKrakk,
    fondsbeholdning,
    krakkIgjenVed,
    kursSerie,
    sparetVerdi,
    KRAKK_MANEDER,
} from '../engine/fond';
import {
    Forklaring,
    Knapp,
    Kort,
    Kroner,
    formaterKroner,
    formaterProsent,
    formaterTall,
} from '../components/primitives';
import type { Fond } from '../types';

/** Horisontene gebyrkortet kan regne på. */
const HORISONTER = [10, 20, 30] as const;

/** Fondet gebyrsammenligningen bruker som det billige. */
const BILLIG_ID = 'global-indeks';
/** Fondet gebyrsammenligningen bruker som det dyre. Samme marked, annen pris. */
const DYRT_ID = 'global-aktiv';

/** De tre fondene krakk-kortet stiller opp mot hverandre. */
const KRAKK_IDER = ['rente', 'kombinasjon', 'teknologi'];

/** Innskuddet gebyrregnestykket bruker når eleven ikke sparer noe fast. */
const STANDARD_INNSKUDD = 1000;

const MANEDER_I_AR = 12;

export function FondModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const kjop = usePengelivStore((s) => s.kjopFond);
    const selg = usePengelivStore((s) => s.selgFond);

    const [valgtId, setValgtId] = useState(BILLIG_ID);
    const [horisont, setHorisont] = useState<number>(30);

    const fro = tilstand ? tilstand.marked.fro : 0;
    const maaned = tilstand ? tilstand.maaned : 0;

    // Ett kursforløp per fond, regnet ut fra frøet. Samme profil gir alltid
    // samme kurver, så eleven kan gå ut og inn av modulen uten at tallene
    // flytter seg.
    const serier = useMemo(() => {
        const kart = new Map<string, number[]>();
        for (const fond of FOND) kart.set(fond.id, kursSerie(fro, fond, maaned));
        return kart;
    }, [fro, maaned]);

    const krakk = useMemo(() => {
        const utvalg = KRAKK_IDER.map((id) => FOND.find((f) => f.id === id)).filter(
            (f): f is Fond => f !== undefined
        );
        return finnKrakk(fro, utvalg, maaned + 1);
    }, [fro, maaned]);

    if (!tilstand) return <Laster />;

    const profil = tilstand.profil;
    const bruks = profil.kontoer.find((k) => k.type === 'bruks');
    const ledig = bruks ? Math.max(0, bruks.saldo) : 0;

    const poster = fondsbeholdning(tilstand);
    const samletVerdi = poster.reduce((sum, p) => sum + p.verdi, 0);
    const samletGevinst = poster.reduce((sum, p) => sum + p.gevinst, 0);

    const valgt = FOND.find((f) => f.id === valgtId) ?? FOND[0];
    const billig = FOND.find((f) => f.id === BILLIG_ID) ?? FOND[0];
    const dyrt = FOND.find((f) => f.id === DYRT_ID) ?? FOND[1];

    const innskudd = Math.max(STANDARD_INNSKUDD, Math.round(profil.manedligSparing));
    const billigSum = sparetVerdi(billig, innskudd, horisont);
    const dyrtSum = sparetVerdi(dyrt, innskudd, horisont);
    const gebyrtap = billigSum - dyrtSum;

    return (
        <div className="flex flex-col gap-2.5">
            <header>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h1 className="text-2xl font-bold leading-tight text-slate-900">Fond</h1>
                    <p className="rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] leading-snug text-amber-900">
                        Kursene er laget av appen, ikke hentet fra ekte fond. Ingenting her er råd
                        om hva du bør kjøpe.
                    </p>
                </div>
                <p className="text-xs leading-snug text-slate-600">
                    Et fond er en kurv med mange aksjer. Kjøper du én andel i et fond, eier du en
                    bitteliten flis av hvert eneste selskap i kurven - de samme selskapene som
                    ligger på børsen.
                    <Forklaring begrep="Andel og kurs">
                        Kursen er prisen på én andel. Setter du inn 1 000 kr i et fond der kursen er
                        250 kr, får du 4 andeler. Stiger kursen til 300 kr, er de 4 andelene dine
                        verdt 1 200 kr. Du eier like mange andeler som før, men hver av dem er verdt
                        mer.
                    </Forklaring>
                </p>
            </header>

            <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-2.5">
                    <Kort
                        tittel="Fondene du kan velge"
                        undertittel="Klikk på et fond for å lese om det og kjøpe"
                        ikon={<PieChart className="h-4 w-4" />}
                    >
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wide text-slate-400">
                                    <th className="pb-1 font-semibold">Fond</th>
                                    <th className="pb-1 text-center font-semibold">Risiko</th>
                                    <th className="pb-1 text-right font-semibold">Gebyr/år</th>
                                    <th className="pb-1 pl-2 text-right font-semibold">Kurs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FOND.map((fond) => (
                                    <FondRad
                                        key={fond.id}
                                        fond={fond}
                                        serie={serier.get(fond.id) ?? []}
                                        valgt={fond.id === valgtId}
                                        onVelg={() => setValgtId(fond.id)}
                                    />
                                ))}
                            </tbody>
                        </table>

                        <p className="mt-1 flex items-center gap-1 text-[11px] leading-snug text-slate-500">
                            Gebyret er per år, på 100 000 kr
                            <Forklaring begrep="Forvaltningshonorar">
                                Forvaltningshonorar er lønna til dem som passer på fondet. Den
                                regnes i prosent av alt du eier, hvert eneste år - ikke av det du
                                tjener. Går fondet dårlig, betaler du like mye. Det trekkes litt om
                                gangen, rett fra kursen, så du ser det aldri som en regning.
                            </Forklaring>
                        </p>

                        <Kjopsrad
                            fond={valgt}
                            ledig={ledig}
                            onKjop={(belop) => kjop(valgt.id, belop)}
                        />
                    </Kort>
                </div>

                <div className="flex flex-col gap-2.5">
                    <GebyrKort
                        billig={billig}
                        dyrt={dyrt}
                        innskudd={innskudd}
                        horisont={horisont}
                        onHorisont={setHorisont}
                        billigSum={billigSum}
                        dyrtSum={dyrtSum}
                        tap={gebyrtap}
                    />

                    <Kort
                        tittel="Det du eier"
                        handling={
                            poster.length > 0 ? (
                                <span className="text-[11px] text-slate-500">
                                    <Kroner verdi={samletVerdi} />,{' '}
                                    <Kroner verdi={samletGevinst} visTegn />
                                </span>
                            ) : undefined
                        }
                    >
                        {poster.length === 0 ? (
                            <p className="text-[11px] leading-snug text-slate-500">
                                Du eier ingen fondsandeler ennå. Kjøper du et fond, opprettes en
                                aksjesparekonto til deg automatisk.
                                <Forklaring begrep="Aksjesparekonto">
                                    En aksjesparekonto, eller ASK, er en konto laget for fond og
                                    aksjer. Så lenge pengene blir stående der, slipper du å betale
                                    skatt av gevinsten. Skatten kommer først den dagen du tar
                                    pengene ut av kontoen.
                                </Forklaring>
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {poster.map((post) => (
                                    <div
                                        key={post.fond.id}
                                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1"
                                    >
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="truncate text-xs font-semibold text-slate-800">
                                                {post.fond.navn}
                                            </span>
                                            <span className="flex shrink-0 items-baseline gap-1.5">
                                                <Kroner verdi={post.verdi} />
                                                <span
                                                    className={`text-[11px] font-semibold tabular-nums ${
                                                        post.gevinst >= 0
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-600'
                                                    }`}
                                                >
                                                    {post.gevinst >= 0 ? 'opp ' : 'ned '}
                                                    {formaterKroner(Math.abs(post.gevinst))}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-[10px] leading-tight text-slate-500">
                                                {formaterTall(post.andeler, 1)} andeler for{' '}
                                                {formaterKroner(post.kostpris)}
                                            </span>
                                            <span className="flex shrink-0 gap-1">
                                                <Knapp
                                                    liten
                                                    variant="sekundar"
                                                    onClick={() =>
                                                        selg(post.fond.id, post.andeler / 2)
                                                    }
                                                >
                                                    Selg 50 %
                                                </Knapp>
                                                <Knapp
                                                    liten
                                                    variant="sekundar"
                                                    tittel={`Selg alt du eier av ${post.fond.navn}`}
                                                    onClick={() => selg(post.fond.id, post.andeler)}
                                                >
                                                    Alt
                                                </Knapp>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Kort>
                </div>

                <div className="flex flex-col gap-2.5">
                    <KrakkKort
                        krakk={krakk}
                        naaMaaned={maaned}
                        startAar={tilstand.startAar}
                        // Utledes fra frøet i stedet for å leses av tilstanden.
                        // Børsmodulen skriver til det samme feltet, og krakket er
                        // uansett en ren funksjon av frøet og måneden.
                        krakkPaagaar={krakkIgjenVed(fro, maaned) > 0}
                    />
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Fondslista
// ---------------------------------------------------------------------------

function FondRad({
    fond,
    serie,
    valgt,
    onVelg,
}: {
    fond: Fond;
    serie: number[];
    valgt: boolean;
    onVelg: () => void;
}) {
    const kurs = serie.length > 0 ? serie[serie.length - 1] : 100;
    const forrigeAar = serie.length > MANEDER_I_AR ? serie[serie.length - 1 - MANEDER_I_AR] : null;
    const endring = forrigeAar !== null && forrigeAar > 0 ? kurs / forrigeAar - 1 : null;

    return (
        <tr
            onClick={onVelg}
            aria-selected={valgt}
            className={`cursor-pointer border-t border-slate-100 transition-colors ${
                valgt ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
            }`}
        >
            <td className="py-1 pr-2">
                <span className="block font-semibold leading-tight text-slate-800">
                    {fond.navn}
                </span>
                <span className="block text-[10px] leading-tight text-slate-500">
                    {FOND_KATEGORINAVN[fond.kategori]} - {fond.geografi}
                </span>
            </td>
            <td className="py-1 text-center">
                <Risikoprikker nivaa={fond.risiko} />
            </td>
            <td className="py-1 text-right tabular-nums">
                <span className="block font-semibold text-slate-800">
                    {Math.round(fond.forvaltningshonorar * 100000)} kr
                </span>
                <span className="block text-[10px] leading-tight text-slate-500">
                    {formaterProsent(fond.forvaltningshonorar, 2)}
                </span>
            </td>
            <td className="py-1 pl-2 text-right tabular-nums">
                <span className="block font-semibold leading-tight text-slate-800">
                    {kurs.toFixed(0)}
                </span>
                <span
                    className={`block text-[10px] leading-tight ${
                        endring === null
                            ? 'text-slate-400'
                            : endring >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                    }`}
                >
                    {endring === null
                        ? 'nytt'
                        : `${endring >= 0 ? '+' : ''}${formaterProsent(endring, 0)} i år`}
                </span>
            </td>
        </tr>
    );
}

function Risikoprikker({ nivaa }: { nivaa: number }) {
    return (
        <span className="inline-flex gap-0.5" title={`Risiko ${nivaa} av 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                        i <= nivaa ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                />
            ))}
            <span className="sr-only">Risiko {nivaa} av 5</span>
        </span>
    );
}

/** Beskrivelsen av det valgte fondet, og knappene som kjøper det. */
function Kjopsrad({
    fond,
    ledig,
    onKjop,
}: {
    fond: Fond;
    ledig: number;
    onKjop: (belop: number) => void;
}) {
    const belop = [1000, 5000, Math.floor(ledig)];

    return (
        <motion.div
            key={fond.id}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-2.5 py-1.5"
        >
            <p className="text-[11px] leading-snug text-slate-700">
                <span className="font-bold text-slate-900">{fond.navn}.</span> {fond.beskrivelse}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Kjøp for</span>
                {belop.map((sum, i) => (
                    <Knapp
                        key={i}
                        liten
                        variant={i === 0 ? 'primar' : 'sekundar'}
                        disabled={sum < 100 || sum > ledig}
                        onClick={() => onKjop(sum)}
                    >
                        {i === 2 ? 'Alt' : `${sum} kr`}
                    </Knapp>
                ))}
                <span className="text-[11px] text-slate-500">
                    {ledig < 100 ? (
                        'Brukskontoen er tom.'
                    ) : (
                        <>
                            Du har <Kroner verdi={ledig} />
                        </>
                    )}
                </span>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Gebyrkortet: poeng 1
// ---------------------------------------------------------------------------

function GebyrKort({
    billig,
    dyrt,
    innskudd,
    horisont,
    onHorisont,
    billigSum,
    dyrtSum,
    tap,
}: {
    billig: Fond;
    dyrt: Fond;
    innskudd: number;
    horisont: number;
    onHorisont: (aar: number) => void;
    billigSum: number;
    dyrtSum: number;
    tap: number;
}) {
    const maks = Math.max(billigSum, dyrtSum, 1);
    const innskutt = innskudd * MANEDER_I_AR * horisont;

    return (
        <Kort
            tittel="Gebyret i kroner"
            handling={
                <span className="flex overflow-hidden rounded-lg border border-slate-200">
                    {HORISONTER.map((aar) => (
                        <button
                            key={aar}
                            type="button"
                            aria-pressed={aar === horisont}
                            onClick={() => onHorisont(aar)}
                            className={`px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
                                aar === horisont
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {aar} år
                        </button>
                    ))}
                </span>
            }
        >
            <p className="text-[11px] leading-snug text-slate-600">
                Du sparer <Kroner verdi={innskudd} /> i måneden i {horisont} år, til sammen{' '}
                <Kroner verdi={innskutt} />. Begge fondene eier de samme selskapene. Det eneste som
                skiller dem, er prisen.
            </p>

            <div className="mt-2 flex flex-col gap-1.5">
                <Gebyrstolpe
                    fond={billig}
                    sum={billigSum}
                    andel={billigSum / maks}
                    farge="from-emerald-400 to-emerald-600"
                />
                <Gebyrstolpe
                    fond={dyrt}
                    sum={dyrtSum}
                    andel={dyrtSum / maks}
                    farge="from-rose-400 to-rose-500"
                />
            </div>

            <p className="mt-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs leading-snug text-white">
                Det dyre fondet har tatt{' '}
                <span className="text-base font-bold tabular-nums text-amber-300">
                    {formaterKroner(tap)}
                </span>{' '}
                av pengene dine. Ingen har sendt deg en regning på dem - de er bare aldri kommet.
            </p>
        </Kort>
    );
}

function Gebyrstolpe({
    fond,
    sum,
    andel,
    farge,
}: {
    fond: Fond;
    sum: number;
    andel: number;
    farge: string;
}) {
    return (
        <div>
            <div className="flex items-baseline justify-between text-[11px]">
                <span className="font-semibold text-slate-700">
                    {fond.navn}{' '}
                    <span className="font-normal text-slate-500">
                        ({formaterProsent(fond.forvaltningshonorar, 2)} i året)
                    </span>
                </span>
                <Kroner verdi={sum} />
            </div>
            <div className="mt-0.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${farge}`}
                    initial={false}
                    animate={{ width: `${Math.max(2, andel * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Krakk-kortet: poeng 2 og 3
// ---------------------------------------------------------------------------

interface Krakkrad {
    startMaaned: number;
    fall: number;
    tilbakeEtterMaaneder: number | null;
}

function KrakkKort({
    krakk,
    naaMaaned,
    startAar,
    krakkPaagaar,
}: {
    krakk: { startMaaned: number; fasit: Krakkrad[] } | null;
    naaMaaned: number;
    startAar: number;
    krakkPaagaar: boolean;
}) {
    const fond = KRAKK_IDER.map((id) => FOND.find((f) => f.id === id)).filter(
        (f): f is Fond => f !== undefined
    );

    if (!krakk) {
        return (
            <Kort tittel="Når det smeller" ikon={<TrendingDown className="h-4 w-4" />}>
                <p className="text-xs text-slate-500">
                    Det kommer ikke noe krakk i denne simuleringen med det første.
                </p>
            </Kort>
        );
    }

    const aar = startAar + Math.floor(krakk.startMaaned / MANEDER_I_AR);
    const om = Math.max(0, Math.round((krakk.startMaaned - naaMaaned) / MANEDER_I_AR));
    const verst = Math.max(...krakk.fasit.map((f) => Math.abs(f.fall)), 0.01);

    return (
        <Kort
            tittel="Når det smeller"
            undertittel={
                krakkPaagaar
                    ? 'Det er krakk akkurat nå. Kursene faller.'
                    : `Neste krakk i denne simuleringen kommer i ${aar}, om rundt ${om} år`
            }
            ikon={<TrendingDown className="h-4 w-4" />}
        >
            <p className="text-[11px] leading-snug text-slate-600">
                Et krakk er en periode der nesten alle aksjer faller samtidig, gjerne et halvt år i
                strekk. Da rammes ikke alle fond like hardt.
                <Forklaring begrep="Spredning">
                    Spredning betyr at pengene dine ligger i mange forskjellige ting samtidig: mange
                    selskaper, mange bransjer, mange land. Går det galt for ett av dem, har du
                    fortsatt alle de andre. Ligger alt i én bransje, har du ingenting å falle
                    tilbake på.
                </Forklaring>
            </p>

            <div className="mt-2 flex flex-col gap-1.5">
                {fond.map((f, i) => {
                    const rad = krakk.fasit[i];
                    if (!rad) return null;
                    const fall = Math.abs(rad.fall);
                    return (
                        <div key={f.id}>
                            <div className="flex items-baseline justify-between text-[11px]">
                                <span className="font-semibold text-slate-700">{f.navn}</span>
                                <span className="font-bold tabular-nums text-rose-600">
                                    -{formaterProsent(fall, 0)}
                                </span>
                            </div>
                            <div className="mt-0.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-300 to-rose-500"
                                    initial={false}
                                    animate={{ width: `${(fall / verst) * 100}%` }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                                />
                            </div>
                            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                                {rad.tilbakeEtterMaaneder === null
                                    ? 'Kursen var fortsatt ikke tilbake etter 15 år.'
                                    : `Tilbake der det var etter ${manedertekst(rad.tilbakeEtterMaaneder)}.`}
                            </p>
                        </div>
                    );
                })}
            </div>

            <p className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700">
                Fallet varer rundt {KRAKK_MANEDER} måneder, men det tar mange år å hente det inn
                igjen. Det er derfor tiden din avgjør hvor mye du tåler: trenger du pengene neste
                år, har du tapt dem. Har du tjue år på deg, rekker fondet å komme seg - og det er da
                det høye fallet også gir den høyeste gevinsten.
            </p>
        </Kort>
    );
}

/** «14 måneder» eller «3 år og 2 måneder», alt etter hvor lenge det er. */
function manedertekst(maaneder: number): string {
    if (maaneder < MANEDER_I_AR) return `${maaneder} måneder`;
    const aar = Math.floor(maaneder / MANEDER_I_AR);
    const rest = maaneder % MANEDER_I_AR;
    const aarTekst = aar === 1 ? '1 år' : `${aar} år`;
    if (rest === 0) return aarTekst;
    return `${aarTekst} og ${rest} måneder`;
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Henter fondene...
        </div>
    );
}
