// Toppbaren i Pengeliv: saldo og klokke, alltid synlig.
//
// Klokka stopper av seg selv ved milepæler, også når hendelser er slått av.
// Da må eleven få vite hvorfor det skjedde - ellers ser det ut som en feil.
// Derfor legger baren seg ut med en melding under seg i det øyeblikket den
// stopper på en milepæl.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, RotateCcw, Sparkles } from 'lucide-react';
import type { Fart, Milepael } from '../types';
import { Kroner } from './primitives';

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

interface ToppbarProps {
    /** Formue minus gjeld. Hovedtallet eleven følger med på. */
    netto: number;
    formue: number;
    gjeld: number;
    /** Antall måneder siden start. */
    maaned: number;
    startAar: number;
    alder: number;
    fart: Fart;
    onFart: (fart: Fart) => void;
    /** Siste milepæl som er nådd, eller null hvis ingen ennå. */
    sisteMilepael: Milepael | null;
    /** Starter simuleringen på nytt med en ny persona. */
    onNullstill: () => void;
}

export function Toppbar({
    netto,
    formue,
    gjeld,
    maaned,
    startAar,
    alder,
    fart,
    onFart,
    sisteMilepael,
    onNullstill,
}: ToppbarProps) {
    // Milepælen eleven allerede har lest ferdig. Lagres på id, så neste
    // milepæl dukker opp av seg selv uten at noe må nullstilles.
    const [lest, setLest] = useState<string | null>(null);

    // Klokka står stille akkurat på den måneden en milepæl inntraff: det er
    // milepælen som stoppet den, ikke eleven.
    const stoppetAv =
        fart === 0 &&
        sisteMilepael !== null &&
        sisteMilepael.maaned === maaned &&
        sisteMilepael.id !== lest
            ? sisteMilepael
            : null;

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

                        {/* Formue og gjeld */}
                        <div className="hidden gap-5 sm:flex">
                            <div>
                                <p className="text-[11px] text-slate-500">På konto</p>
                                <Kroner verdi={formue} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500">Gjeld</p>
                                <Kroner verdi={gjeld} />
                            </div>
                        </div>

                        {/* Klokka */}
                        <div className="ml-auto flex items-center gap-4">
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
                            </div>

                            <button
                                type="button"
                                title="Start på nytt med en ny person"
                                onClick={onNullstill}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span className="sr-only">Start på nytt</span>
                            </button>
                        </div>
                    </div>

                    {/* Hvorfor klokka stoppet */}
                    <AnimatePresence initial={false}>
                        {stoppetAv && (
                            <motion.div
                                key={stoppetAv.id}
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
                                <div className="mt-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 shadow-lg">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-amber-900">
                                            Klokka stoppet: {stoppetAv.tittel}
                                        </p>
                                        <p className="text-xs leading-snug text-amber-800">
                                            {stoppetAv.tekst}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLest(stoppetAv.id);
                                            onFart(1);
                                        }}
                                        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-amber-400"
                                    >
                                        Fortsett
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
