import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, RotateCcw, X } from 'lucide-react';

// Fra fortelling til lære.
//
// Lyspære-øyeblikket: eleven oppdager at læresetningene ikke kom først. De er
// utledet av fortellinger. Hvert kort viser et konkret sted i en fortelling -
// Gud stopper på den sjuende dagen, Buddha nekter å svare, urvesenet blir delt -
// og eleven skal finne ut hvilken lære tradisjonen har trukket ut av det.
//
// Etter siste kort får eleven se hva hen nettopp gjorde ti ganger på rad: gått
// veien fra fortelling til teologi. Det er selve arbeidsmåten religioner bruker.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface Valg {
    text: string;
    correct?: boolean;
    feedback: string;
}

interface Kort {
    id: string;
    tradition: string;
    color: string;
    beat: string;
    source?: string;
    question?: string;
    options: Valg[];
}

interface FraFortellingTilLaereProps {
    title?: string;
    intro?: string;
    questionLabel?: string;
    cards?: Kort[];
    revealTitle?: string;
    revealText?: string;
    note?: string;
}

export function FraFortellingTilLaere({
    title = 'Fra fortelling til lære',
    intro = 'Hvert kort viser et sted i en fortelling. Finn læren tradisjonen har trukket ut av det.',
    questionLabel = 'Hvilken lære er utledet av dette?',
    cards = [],
    revealTitle = 'Se hva du nettopp gjorde',
    revealText = 'Du gikk fra fortelling til lære, én gang for hvert kort. Det er slik det har skjedd i virkeligheten også: fortellingen kom først, og læren ble trukket ut av den etterpå.',
    note,
}: FraFortellingTilLaereProps) {
    const [nr, setNr] = useState(0);
    const [valgt, setValgt] = useState<number | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [ferdig, setFerdig] = useState(false);
    const [visVeien, setVisVeien] = useState(false);

    const kort = cards[nr];
    const sisteKort = nr === cards.length - 1;

    const svar = useMemo(
        () => (valgt === null || !kort ? null : kort.options[valgt]),
        [valgt, kort]
    );

    if (!cards.length || !kort) return null;

    const velg = (i: number) => {
        if (valgt !== null) return;
        setValgt(i);
        if (kort.options[i]?.correct) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (sisteKort) {
            setFerdig(true);
            return;
        }
        setNr((n) => n + 1);
        setValgt(null);
    };

    const start = () => {
        setNr(0);
        setValgt(null);
        setRiktige(0);
        setFerdig(false);
        setVisVeien(false);
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {!ferdig && (
                <>
                    {/* Framdrift: én prikk per fortelling */}
                    <div className="flex items-center gap-1.5 border-b border-slate-200 px-5 py-2.5">
                        {cards.map((c, i) => (
                            <span
                                key={c.id}
                                className="h-1.5 flex-1 rounded-full transition-colors"
                                style={{
                                    backgroundColor:
                                        i < nr ? c.color : i === nr ? c.color : '#e2e8f0',
                                    opacity: i > nr ? 1 : i === nr ? 1 : 0.4,
                                }}
                            />
                        ))}
                        <span className="ml-2 shrink-0 text-[11px] font-semibold text-slate-400">
                            {nr + 1}/{cards.length}
                        </span>
                    </div>

                    <div className="p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={kort.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Fortellingen */}
                                <div
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                    style={{ borderLeftWidth: '4px', borderLeftColor: kort.color }}
                                >
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-wide"
                                        style={{ color: kort.color }}
                                    >
                                        {kort.tradition}
                                    </span>
                                    <p className="mt-1 text-[15px] leading-snug text-slate-800">
                                        {kort.beat}
                                    </p>
                                    {kort.source && (
                                        <p className="mt-1.5 text-[11px] text-slate-400">
                                            {kort.source}
                                        </p>
                                    )}
                                </div>

                                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {kort.question ?? questionLabel}
                                </p>

                                <div className="space-y-2">
                                    {kort.options.map((o, i) => {
                                        const erValgt = valgt === i;
                                        const vis = valgt !== null;
                                        const fasit = o.correct;
                                        return (
                                            <button
                                                key={o.text}
                                                type="button"
                                                onClick={() => velg(i)}
                                                disabled={vis}
                                                className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                                                    vis && fasit
                                                        ? 'border-emerald-300 bg-emerald-50'
                                                        : erValgt
                                                          ? 'border-rose-300 bg-rose-50'
                                                          : vis
                                                            ? 'border-slate-200 bg-white opacity-60'
                                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                                }`}
                                            >
                                                {vis && (
                                                    <span className="mt-0.5 shrink-0">
                                                        {fasit ? (
                                                            <Check
                                                                className="h-4 w-4 text-emerald-600"
                                                                aria-hidden="true"
                                                            />
                                                        ) : erValgt ? (
                                                            <X
                                                                className="h-4 w-4 text-rose-600"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <span className="block h-4 w-4" />
                                                        )}
                                                    </span>
                                                )}
                                                <span className="text-slate-800">{o.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {svar && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-sm leading-snug text-slate-700">
                                                    {svar.feedback}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={neste}
                                                    className="mt-3 flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                                >
                                                    {sisteKort ? 'Se mønsteret' : 'Neste fortelling'}
                                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            )}

            {ferdig && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="p-5"
                >
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                        <h4 className="font-display text-base font-bold text-slate-900">
                            {revealTitle}
                        </h4>
                        <p className="mt-1 text-sm leading-snug text-slate-700">{revealText}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            Du traff {riktige} av {cards.length} første gang.
                        </p>
                    </div>

                    {/* Hele veien samlet, fortelling til venstre og lære til høyre.
                        Ligger bak en knapp: ti rader gjør sluttilstanden dobbelt så høy
                        som skjermbudsjettet, og eleven skal selv velge å folde den ut. */}
                    <button
                        type="button"
                        onClick={() => setVisVeien((v) => !v)}
                        className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        {visVeien ? 'Skjul veien' : `Se hele veien, alle ${cards.length}`}
                        <ArrowRight
                            className={`h-4 w-4 text-slate-400 transition-transform ${visVeien ? 'rotate-90' : ''}`}
                            aria-hidden="true"
                        />
                    </button>

                    <div className={`mt-2 space-y-1.5 ${visVeien ? '' : 'hidden'}`}>
                        {cards.map((c) => {
                            const fasit = c.options.find((o) => o.correct);
                            return (
                                <div
                                    key={c.id}
                                    className="grid gap-1 rounded-lg border border-slate-200 p-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-2"
                                >
                                    <span className="text-[13px] leading-snug text-slate-600">
                                        {c.beat}
                                    </span>
                                    <ArrowRight
                                        className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block"
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="text-[13px] font-semibold leading-snug"
                                        style={{ color: c.color }}
                                    >
                                        {fasit?.text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {note ?? 'Ingen av fortellingene er oppsummeringer. De er konkrete steder i en tekst.'}
                </span>
                <button
                    type="button"
                    onClick={start}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
