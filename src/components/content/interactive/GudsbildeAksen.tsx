import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, RotateCcw, Sparkles } from 'lucide-react';

// Gudsbilde-aksen: to akser, ikke én.
//
// Lyspære-øyeblikket: eleven oppdager at «hvor mange guder?» bare er det halve
// spørsmålet. Når kortene skal plasseres, holder det ikke å telle - eleven må
// også bestemme om guden er en person du kan snakke med, eller en kraft som
// gjennomsyrer alt. Og ett kort passer ikke i rutenettet i det hele tatt, fordi
// selve spørsmålet er feil for den tradisjonen.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface AksePar {
    minLabel: string;
    maxLabel: string;
}

interface Kort {
    id: string;
    name: string;
    color: string;
    correctZone: string;
    clue: string;
    feedback: string;
}

interface GudsbildeAksenProps {
    title?: string;
    intro?: string;
    axes?: { x: AksePar; y: AksePar };
    outsideLabel?: string;
    outsideHint?: string;
    cards?: Kort[];
}

type Plassering = Record<string, string>; // kort-id -> sone-id

const RUTER = [
    { id: 'en-personlig', x: 0, y: 0 },
    { id: 'mange-personlig', x: 1, y: 0 },
    { id: 'en-upersonlig', x: 0, y: 1 },
    { id: 'mange-upersonlig', x: 1, y: 1 },
];

export function GudsbildeAksen({
    title = 'Gudsbilde-aksen',
    intro = 'Velg et kort, og klikk feltet du tror det hører hjemme i.',
    axes = {
        x: { minLabel: 'Én gud', maxLabel: 'Mange guder' },
        y: { minLabel: 'Personlig og nær', maxLabel: 'Upersonlig kraft' },
    },
    outsideLabel = 'Passer ikke i rutenettet',
    outsideHint = 'Noen tradisjoner svarer ikke på spørsmålet i det hele tatt.',
    cards = [],
}: GudsbildeAksenProps) {
    const [plassert, setPlassert] = useState<Plassering>({});
    const [valgt, setValgt] = useState<string | null>(null);
    const [sistFeil, setSistFeil] = useState<string | null>(null);

    const igjen = useMemo(() => cards.filter((k) => !plassert[k.id]), [cards, plassert]);
    const riktige = useMemo(
        () => cards.filter((k) => plassert[k.id] === k.correctZone).length,
        [cards, plassert]
    );
    const ferdig = cards.length > 0 && riktige === cards.length;
    const aktivt = cards.find((k) => k.id === valgt) ?? null;

    // Siste hendelse styrer tilbakemeldingssonen. Den er alltid til stede i DOM-et.
    const [melding, setMelding] = useState<{ tekst: string; ok: boolean } | null>(null);

    const plasser = (sone: string) => {
        if (!aktivt) return;
        const ok = aktivt.correctZone === sone;
        setPlassert((p) => ({ ...p, [aktivt.id]: sone }));
        setMelding({ tekst: aktivt.feedback, ok });
        setSistFeil(ok ? null : aktivt.id);
        setValgt(null);
    };

    const taOpp = (id: string) => {
        setPlassert((p) => {
            const neste = { ...p };
            delete neste[id];
            return neste;
        });
        setValgt(id);
        setSistFeil((f) => (f === id ? null : f));
    };

    const nullstill = () => {
        setPlassert({});
        setValgt(null);
        setMelding(null);
        setSistFeil(null);
    };

    if (!cards.length) return null;

    const kortIRute = (sone: string) => cards.filter((k) => plassert[k.id] === sone);

    // Render-funksjoner, ikke nestede komponenter: da beholder React identiteten
    // mellom rendringer, og layout-animasjonen i Framer Motion holder seg rolig.
    const brikke = (kort: Kort, iRute: boolean) => {
        const erRiktig = plassert[kort.id] === kort.correctZone;
        const erValgt = valgt === kort.id;
        return (
            <motion.button
                key={kort.id}
                type="button"
                layout
                draggable
                onDragStart={() => setValgt(kort.id)}
                onClick={() => (iRute ? taOpp(kort.id) : setValgt(erValgt ? null : kort.id))}
                aria-pressed={erValgt}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    x: sistFeil === kort.id ? [0, -5, 5, -3, 0] : 0,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 24,
                    // Ristingen er flere keyframes - spring takler bare to, saa den
                    // enkeltegenskapen faar sin egen tween.
                    x: { type: 'tween', duration: 0.32 },
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    iRute
                        ? erRiktig
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-rose-300 bg-rose-50 text-rose-700'
                        : erValgt
                          ? 'border-transparent text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                }`}
                style={erValgt && !iRute ? { backgroundColor: kort.color } : undefined}
            >
                <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: iRute || !erValgt ? kort.color : '#ffffff' }}
                    aria-hidden="true"
                />
                {kort.name}
            </motion.button>
        );
    };

    const sonefelt = (sone: string) => (
        <div
            key={sone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                plasser(sone);
            }}
            onClick={() => plasser(sone)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    plasser(sone);
                }
            }}
            className={`flex min-h-[74px] flex-wrap content-start gap-1.5 rounded-lg border-2 border-dashed p-2 transition-colors ${
                aktivt ? 'cursor-pointer border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'
            }`}
        >
            {kortIRute(sone).map((k) => brikke(k, true))}
        </div>
    );

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <Compass className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Kortstokken */}
            <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 border-b border-slate-200 px-5 py-3">
                {igjen.length ? (
                    igjen.map((k) => brikke(k, false))
                ) : (
                    <span className="text-xs italic text-slate-400">
                        Alle kortene er plassert. Klikk et kort i rutenettet for å flytte det.
                    </span>
                )}
            </div>

            {/* Rutenettet med akser */}
            <div className="px-5 pt-4">
                <div className="mb-1.5 grid grid-cols-2 gap-2 pl-[86px]">
                    <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {axes.x.minLabel}
                    </span>
                    <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {axes.x.maxLabel}
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className="flex w-[78px] shrink-0 flex-col gap-2">
                        {[axes.y.minLabel, axes.y.maxLabel].map((l) => (
                            <span
                                key={l}
                                className="flex min-h-[74px] items-center text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-500"
                            >
                                {l}
                            </span>
                        ))}
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-2">
                        {RUTER.map((r) => sonefelt(r.id))}
                    </div>
                </div>

                {/* Feltet utenfor rutenettet */}
                <div className="mt-2 flex gap-2">
                    <span className="flex w-[78px] shrink-0 items-center text-[11px] font-bold uppercase leading-tight tracking-wide text-amber-700">
                        {outsideLabel}
                    </span>
                    <div className="flex-1">
                        {sonefelt('utenfor')}
                    </div>
                </div>
                <p className="mt-1.5 pl-[86px] text-[11px] italic text-slate-400">{outsideHint}</p>
            </div>

            {/* Tilbakemeldingssone - alltid i DOM-et */}
            <div className="px-5 pb-1 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={melding ? melding.tekst : aktivt ? aktivt.id : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            melding
                                ? melding.ok
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                    >
                        {melding
                            ? melding.tekst
                            : aktivt
                              ? aktivt.clue
                              : 'Velg et kort over. Da får du et hint om hva tradisjonen selv sier om Gud.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fullført */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                    >
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                        <span>
                            Alle kortene er på plass. Legg merke til at to tradisjoner som begge sier
                            «én gud» havnet i hver sin rute. Antall er bare den ene aksen.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {riktige} av {cards.length} riktig plassert
                </span>
                <button
                    type="button"
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
