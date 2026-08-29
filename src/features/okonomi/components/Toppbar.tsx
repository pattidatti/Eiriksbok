// Toppbaren i Pengeliv: saldo og klokke, alltid synlig.
//
// Klokka stopper av seg selv ved milepæler, også når hendelser er slått av.
// Da må eleven få vite hvorfor det skjedde - ellers ser det ut som en feil.
//
// ---------------------------------------------------------------------------
// HVORFOR MILEPÆLENE KØER
// ---------------------------------------------------------------------------
//
// Baren viste før bare den aller siste milepælen, og bare mens den måneden var
// den gjeldende. Flere milepæler i samme måned er ikke uvanlig - ved hvert
// årsskifte treffer bursdagen, den nye BSU-plassen og skatteoppgjøret samtidig
// - og alle unntatt den siste forsvant ulest. Målt over tjue simulerte år ble
// 30 av 56 milepæler aldri sett av eleven. Det er tretti læringsøyeblikk appen
// selv hadde regnet ut at var verdt å stoppe klokka for.
//
// Nå køes de: eleven leser én, trykker videre, og får neste. Og alt som har
// skjedd, blir liggende i loggen bak «Livet ditt».

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronRight,
    FastForward,
    History,
    Pause,
    RotateCcw,
    Sparkles,
    X,
    Zap,
    ZapOff,
} from 'lucide-react';
import type { Fart, Milepael } from '../types';
import { Knapp, Kroner } from './primitives';

const MANEDER = [
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'desember',
];

/** Gjør «måned 27» om til «april 2028». */
function datoTekst(startAar: number, maaned: number): string {
    const aar = startAar + Math.floor(maaned / 12);
    return `${MANEDER[((maaned % 12) + 12) % 12]} ${aar}`;
}

const FARTER: { verdi: Fart; merke: string; tittel: string }[] = [
    { verdi: 1, merke: '1x', tittel: 'Vanlig fart' },
    { verdi: 2, merke: '2x', tittel: 'Dobbel fart' },
    { verdi: 4, merke: '4x', tittel: 'Fire ganger fart' },
];

/**
 * Aldrene eleven kan spole fram til.
 *
 * Uten dette var eneste vei framover 4x, altså 180 ms per måned: førti år er
 * halvannet minutt sammenhengende venting, brutt av rundt femti tvungne stopp.
 *
 * Spolingen stopper av seg selv når en hendelse krever et svar. Milepæler
 * stopper den ikke - de samles i køen under og i loggen, så ingenting går tapt
 * av å spole forbi dem.
 */
const SPOLEMAAL = [25, 30, 40, 50, 67] as const;

/**
 * Køen er for lang til å klikkes gjennom én om gangen.
 *
 * Tre meldinger er en rekke eleven leser; tretti er en oppgave. En spoling
 * over ti år kan fint samle opp tretti, og da skal veien ut være loggen.
 */
const KO_FOR_LANG = 3;

interface ToppbarProps {
    /** Formue minus gjeld. Hovedtallet eleven følger med på. */
    netto: number;
    /** Alt som står på kontoene. */
    kontanter: number;
    gjeld: number;
    /** Antall måneder siden start. */
    maaned: number;
    startAar: number;
    alder: number;
    fart: Fart;
    onFart: (fart: Fart) => void;
    /** Alle milepæler som er nådd, eldst først. */
    milepaeler: Milepael[];
    /** Spoler fram til eleven er så gammel, eller til noe stopper klokka. */
    onSpolTilAlder: (alder: number) => void;
    /** Livet skjer, av eller på. */
    hendelserPa: boolean;
    onHendelser: (pa: boolean) => void;
    /** Starter simuleringen på nytt med en ny persona. */
    onNullstill: () => void;
}

export function Toppbar({
    netto,
    kontanter,
    gjeld,
    maaned,
    startAar,
    alder,
    fart,
    onFart,
    milepaeler,
    onSpolTilAlder,
    hendelserPa,
    onHendelser,
    onNullstill,
}: ToppbarProps) {
    // Id-ene eleven har lest ferdig. Alt som ikke står her og har inntruffet,
    // ligger i kø og vises én om gangen.
    const [lest, setLest] = useState<string[]>([]);
    const [loggApen, setLoggApen] = useState(false);
    const [bekreftNullstill, setBekreftNullstill] = useState(false);
    const [spolApen, setSpolApen] = useState(false);

    const kø = useMemo(() => {
        const sett = new Set(lest);
        return milepaeler.filter((m) => !sett.has(m.id));
    }, [milepaeler, lest]);

    // Bare mens klokka faktisk står stille. Går den, har eleven valgt å la den
    // gå, og et banner som stjeler oppmerksomheten er da i veien.
    const naa = fart === 0 && kø.length > 0 ? kø[0] : null;

    useEffect(() => {
        if (!loggApen && !spolApen && !bekreftNullstill) return;
        const paaTast = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setLoggApen(false);
            setSpolApen(false);
            setBekreftNullstill(false);
        };
        window.addEventListener('keydown', paaTast);
        return () => window.removeEventListener('keydown', paaTast);
    }, [loggApen, spolApen, bekreftNullstill]);

    const lesFerdig = (id: string, fortsett: boolean) => {
        setLest((f) => [...f, id]);
        // Bare start klokka igjen når køen er tom. Ellers ville neste melding
        // rukket å bli borte før eleven hadde lest den.
        if (fortsett && kø.length <= 1) onFart(1);
    };

    return (
        <div className="sticky top-0 z-30 -mx-3 mb-4 px-3">
            <div className="relative">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {/* Hovedtallet */}
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Det du eier minus det du skylder
                            </p>
                            <Kroner verdi={netto} stor tone="auto" />
                        </div>

                        {/* På konto og gjeld */}
                        <div className="hidden gap-5 sm:flex">
                            <div>
                                <p className="text-[11px] text-slate-500">På konto</p>
                                <Kroner verdi={kontanter} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500">Gjeld</p>
                                <Kroner verdi={gjeld} />
                            </div>
                        </div>

                        {/* Klokka */}
                        <div className="ml-auto flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold capitalize text-slate-900">
                                    {datoTekst(startAar, maaned)}
                                </p>
                                <p className="text-[11px] text-slate-500">Du er {alder} år</p>
                            </div>

                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    title="Stopp klokka"
                                    onClick={() => onFart(0)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                        fart === 0
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <Pause className="h-3.5 w-3.5" />
                                    <span className="sr-only">Stopp klokka</span>
                                </button>
                                {FARTER.map((f) => (
                                    <button
                                        key={f.verdi}
                                        type="button"
                                        title={f.tittel}
                                        onClick={() => onFart(f.verdi)}
                                        className={`h-7 rounded-lg px-2 text-xs font-bold tabular-nums transition-colors ${
                                            fart === f.verdi
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {f.merke}
                                    </button>
                                ))}

                                {/* Spol fram. Motoren har alltid kunnet dette; det
                                    var bare ingen knapp som spurte om det. */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        title="Spol fram i tid"
                                        aria-expanded={spolApen}
                                        onClick={() => setSpolApen((v) => !v)}
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                            spolApen
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <FastForward className="h-3.5 w-3.5" />
                                        <span className="sr-only">Spol fram i tid</span>
                                    </button>

                                    <AnimatePresence>
                                        {spolApen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-9 z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                                            >
                                                <p className="px-2 pb-1.5 text-[11px] leading-snug text-slate-500">
                                                    Klokka stopper av seg selv hvis noe viktig skjer
                                                    underveis.
                                                </p>
                                                <div className="flex flex-col">
                                                    {SPOLEMAAL.filter((m) => m > alder).map(
                                                        (maal) => (
                                                            <button
                                                                key={maal}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSpolApen(false);
                                                                    onSpolTilAlder(maal);
                                                                }}
                                                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                                                            >
                                                                Fram til jeg er {maal}
                                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                            </button>
                                                        )
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSpolApen(false);
                                                            onSpolTilAlder(alder + 1);
                                                        }}
                                                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                                                    >
                                                        Ett år fram
                                                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Bryteren hører til her, ved klokka den styrer, ikke
                                nederst i den siste modulen i menyen. Den avgjør om
                                Pengeliv er en livssimulator eller et rent
                                analyseverktøy, og en lærer som vil isolere årsak og
                                virkning skal finne den. */}
                            <button
                                type="button"
                                title={
                                    hendelserPa
                                        ? 'Livet skjer: uventede ting kan treffe deg'
                                        : 'Livet er avslått: ingenting uventet skjer'
                                }
                                aria-pressed={hendelserPa}
                                onClick={() => onHendelser(!hendelserPa)}
                                className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
                                    hendelserPa
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {hendelserPa ? (
                                    <Zap className="h-3.5 w-3.5" />
                                ) : (
                                    <ZapOff className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden lg:inline">Livet skjer</span>
                            </button>

                            <button
                                type="button"
                                title="Livet ditt så langt"
                                aria-expanded={loggApen}
                                onClick={() => setLoggApen((v) => !v)}
                                className="relative flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <History className="h-3.5 w-3.5" />
                                <span className="sr-only">Livet ditt så langt</span>
                                {kø.length > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                                        {kø.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                title="Start på nytt med en ny person"
                                onClick={() => setBekreftNullstill(true)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span className="sr-only">Start på nytt</span>
                            </button>
                        </div>
                    </div>

                    {/* Hvorfor klokka stoppet */}
                    <AnimatePresence initial={false}>
                        {naa && (
                            <motion.div
                                key={naa.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                // Banneret legger seg OVER innholdet i stedet for å
                                // skyve det. Alle modulene fyller nøyaktig de 768
                                // pikslene en Chromebook har, så et banner som tok
                                // plass i flyten dyttet bunnen av hver eneste modul
                                // under skjermkanten - og det skjer nettopp i det
                                // øyeblikket eleven skal lese noe viktig.
                                className="absolute inset-x-3 top-full z-20 overflow-hidden"
                            >
                                {/* Ugjennomsiktig strimmel bak banneret. Uten den
                                    skar banneret overskriften under seg på midten,
                                    og halve setningen stakk ut nedenfor som om noe
                                    var i ferd med å rendre feil. */}
                                <div className="bg-slate-50 pb-2 pt-2">
                                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 shadow-lg">
                                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-amber-900">
                                                {naa.tittel}
                                                {kø.length > 1 && (
                                                    <span className="ml-2 font-normal text-amber-700">
                                                        ({kø.length - 1} til)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs leading-snug text-amber-800">
                                                {naa.tekst}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => lesFerdig(naa.id, true)}
                                                className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-amber-400"
                                            >
                                                {kø.length > 1 ? 'Neste' : 'Fortsett'}
                                            </button>
                                            {/* En lang spoling kan legge opp tjue-tretti
                                            milepæler. Ingen skal måtte trykke «Neste»
                                            tretti ganger for å komme videre - de ligger
                                            alle i loggen, og der kan de leses i fred. */}
                                            {kø.length > KO_FOR_LANG && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLoggApen(true)}
                                                    className="text-[11px] font-semibold text-amber-700 underline decoration-amber-300 underline-offset-2 transition-colors hover:text-amber-900"
                                                >
                                                    Les alle {kø.length} i loggen
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {loggApen && (
                        <Logg
                            milepaeler={milepaeler}
                            startAar={startAar}
                            onLukk={() => {
                                // Å ha lest loggen er å ha lest meldingene.
                                setLest(milepaeler.map((m) => m.id));
                                setLoggApen(false);
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {bekreftNullstill && (
                    <BekreftNullstill
                        alder={alder}
                        onAvbryt={() => setBekreftNullstill(false)}
                        onBekreft={() => {
                            setBekreftNullstill(false);
                            onNullstill();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Alt som har skjedd, nyeste først.
 *
 * Uten denne fantes milepælene bare i det øyeblikket de dukket opp. En elev som
 * kikket bort, eller som fikk tre samtidig ved et årsskifte, mistet dem for
 * godt - og de er appens egne læringsøyeblikk.
 */
function Logg({
    milepaeler,
    startAar,
    onLukk,
}: {
    milepaeler: Milepael[];
    startAar: number;
    onLukk: () => void;
}) {
    const nyesteForst = [...milepaeler].reverse();

    return (
        <motion.div
            role="dialog"
            aria-label="Livet ditt så langt"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-40 mt-2 flex max-h-[min(60vh,460px)] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Livet ditt så langt</h2>
                    <p className="text-xs text-slate-500">
                        {milepaeler.length === 0
                            ? 'Ingenting har skjedd ennå. Start klokka.'
                            : `${milepaeler.length} ting verdt å stoppe for`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onLukk}
                    className="text-slate-400 transition-colors hover:text-slate-700"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Lukk loggen</span>
                </button>
            </header>

            <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                {nyesteForst.map((m) => (
                    <li key={m.id} className="px-4 py-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{m.tittel}</p>
                            <span className="shrink-0 text-[11px] capitalize tabular-nums text-slate-400">
                                {datoTekst(startAar, m.maaned)}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-slate-600">{m.tekst}</p>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

/**
 * Bekreftelse før alt slettes.
 *
 * Knappen sto rett ved siden av «4x» og kalte rett inn i butikken. Ett klikk på
 * et lite ikon kastet timer med elevarbeid, uten spørsmål og uten angremulighet.
 */
function BekreftNullstill({
    alder,
    onAvbryt,
    onBekreft,
}: {
    alder: number;
    onAvbryt: () => void;
    onBekreft: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Start på nytt"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
                <h2 className="text-base font-bold text-slate-900">Starte på nytt?</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    Da slettes økonomien du har bygget opp til nå. Du er {alder} år i simuleringen,
                    og alt du har spart, kjøpt og valgt forsvinner. Det kan ikke angres.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <Knapp variant="sekundar" onClick={onAvbryt}>
                        Behold økonomien min
                    </Knapp>
                    <Knapp onClick={onBekreft}>Start på nytt</Knapp>
                </div>
            </motion.div>
        </motion.div>
    );
}
