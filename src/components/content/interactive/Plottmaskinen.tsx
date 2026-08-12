import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, Layers, RotateCcw, Sparkles } from 'lucide-react';

// Plottmaskinen: eleven bygger religionenes «hovedplott» i fem ledd, og stabler
// deretter flere plott oppå hverandre.
//
// Lyspære-øyeblikket: de fire første leddene ligner hverandre mistenkelig mye på
// tvers av ni tradisjoner. Det femte - hvem som gjør jobben - spriker fra ende
// til annen. Eleven oppdager altså først likheten, og så at likheten skjulte den
// største uenigheten. Derfor rendres ledd 1-4 som tette lister i
// sammenstillingen, mens det siste leddet spretter ut på en vannrett akse.
//
// Forstyrrerkortene er ikke pynt. At «paradis» ikke passer som buddhismens mål
// må kjennes feil i hånda før eleven forstår hvorfor.
//
// Chromebook-først: ett plott om gangen, loddrett stabling, ingen vannrett
// scrolling. Sammenstillingen grupperer på ledd i stedet for å lage et bredt
// rutenett, slik at tre bygde plott får plass uten at noe klippes.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface Ledd {
    id: string;
    label: string;
    hint?: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
}

interface Kort {
    id: string;
    traditionId: string;
    slotId: string;
    text: string;
}

interface RegiAkse {
    leftLabel?: string;
    rightLabel?: string;
    // tradisjon-id -> 0.0 (du gjør alt selv) til 1.0 (noe utenfor deg gjør alt)
    positions?: Record<string, number>;
    // tradisjon-id -> kort merknad som vises under aksen
    notes?: Record<string, string>;
}

interface PlottmaskinenProps {
    title?: string;
    intro?: string;
    slots?: Ledd[];
    traditions?: Tradisjon[];
    cards?: Kort[];
    /** Antall forstyrrerkort fra andre tradisjoner per runde. */
    distractors?: number;
    /** Hvor mange plott som må bygges før sammenstillingen låses opp. */
    compareAt?: number;
    regiAxis?: RegiAkse;
    revealTitle?: string;
    revealText?: string;
    sharedLabel?: string;
    spreadLabel?: string;
    completeMessage?: string;
}

type Bygg = Record<string, Record<string, string>>; // tradisjon-id -> ledd-id -> kort-id

// Deterministisk stokking. Rekkefølgen skal være den samme gjennom hele økta,
// ellers hopper kortstokken rundt hver gang komponenten rendres på nytt.
function stokk<T>(liste: T[], fro: string): T[] {
    let tall = 0;
    for (let i = 0; i < fro.length; i++) tall = (tall * 31 + fro.charCodeAt(i)) >>> 0;
    const ut = [...liste];
    for (let i = ut.length - 1; i > 0; i--) {
        tall = (tall * 1664525 + 1013904223) >>> 0;
        const j = tall % (i + 1);
        [ut[i], ut[j]] = [ut[j], ut[i]];
    }
    return ut;
}

export function Plottmaskinen({
    title = 'Plottmaskinen',
    intro = 'Velg en tradisjon, og bygg plottet dens i fem ledd.',
    slots = [],
    traditions = [],
    cards = [],
    distractors = 3,
    compareAt = 3,
    regiAxis,
    revealTitle = 'Se hva som skjedde',
    revealText = 'De fire første leddene sier omtrent det samme. Det femte gjør ikke det.',
    sharedLabel = 'Her ligner utkastene på hverandre',
    spreadLabel = 'Her skiller de lag',
    completeMessage = 'Plottet er ferdig bygget.',
}: PlottmaskinenProps) {
    const [valgtTradisjon, setValgtTradisjon] = useState<string | null>(null);
    const [bygg, setBygg] = useState<Bygg>({});
    const [valgtKort, setValgtKort] = useState<string | null>(null);
    const [feilKort, setFeilKort] = useState<string | null>(null);
    const [melding, setMelding] = useState<{ tekst: string; ok: boolean } | null>(null);
    const [sammenstilling, setSammenstilling] = useState(false);

    const regiLedd = slots.length ? slots[slots.length - 1] : null;

    // Kortstokken for den valgte tradisjonen: de fem riktige, pluss noen kort fra
    // andre tradisjoner som ser plausible ut.
    const kortstokk = useMemo(() => {
        if (!valgtTradisjon) return [];
        const riktige = cards.filter((k) => k.traditionId === valgtTradisjon);
        const andre = stokk(
            cards.filter((k) => k.traditionId !== valgtTradisjon),
            `forstyrrer-${valgtTradisjon}`
        ).slice(0, Math.max(0, distractors));
        return stokk([...riktige, ...andre], `stokk-${valgtTradisjon}`);
    }, [valgtTradisjon, cards, distractors]);

    const ferdigeIder = useMemo(
        () => traditions.filter((t) => Object.keys(bygg[t.id] ?? {}).length === slots.length),
        [traditions, bygg, slots.length]
    ).map((t) => t.id);

    const kanSammenligne = ferdigeIder.length >= compareAt;
    const aktiv = traditions.find((t) => t.id === valgtTradisjon) ?? null;
    const aktivtBygg = valgtTradisjon ? (bygg[valgtTradisjon] ?? {}) : {};
    const brukteKort = new Set(Object.values(aktivtBygg));
    const aktivFerdig = !!valgtTradisjon && ferdigeIder.includes(valgtTradisjon);

    if (!slots.length || !traditions.length || !cards.length) return null;

    const kortTekst = (id?: string) => cards.find((k) => k.id === id)?.text ?? '';

    const plasser = (leddId: string) => {
        if (!valgtKort || !valgtTradisjon) return;
        const kort = cards.find((k) => k.id === valgtKort);
        if (!kort) return;

        const riktig = kort.traditionId === valgtTradisjon && kort.slotId === leddId;
        if (!riktig) {
            setFeilKort(kort.id);
            const fraAnnen = kort.traditionId !== valgtTradisjon;
            const eier = traditions.find((t) => t.id === kort.traditionId);
            setMelding({
                ok: false,
                tekst: fraAnnen
                    ? `Det kortet hører hjemme hos ${eier?.name ?? 'en annen tradisjon'}. Kjennes det feil? Da har du skjønt noe.`
                    : 'Riktig tradisjon, men feil ledd. Les leddet en gang til.',
            });
            setValgtKort(null);
            window.setTimeout(() => setFeilKort(null), 500);
            return;
        }

        setBygg((b) => ({ ...b, [valgtTradisjon]: { ...(b[valgtTradisjon] ?? {}), [leddId]: kort.id } }));
        setValgtKort(null);
        setFeilKort(null);
        setMelding({ ok: true, tekst: 'På plass.' });
    };

    const taOpp = (leddId: string) => {
        if (!valgtTradisjon) return;
        setBygg((b) => {
            const neste = { ...(b[valgtTradisjon] ?? {}) };
            delete neste[leddId];
            return { ...b, [valgtTradisjon]: neste };
        });
        setMelding(null);
    };

    const visFasit = () => {
        if (!valgtTradisjon) return;
        const alle: Record<string, string> = {};
        slots.forEach((l) => {
            const kort = cards.find((k) => k.traditionId === valgtTradisjon && k.slotId === l.id);
            if (kort) alle[l.id] = kort.id;
        });
        setBygg((b) => ({ ...b, [valgtTradisjon]: alle }));
        setValgtKort(null);
        setMelding(null);
    };

    const nullstill = () => {
        setBygg({});
        setValgtKort(null);
        setValgtTradisjon(null);
        setMelding(null);
        setSammenstilling(false);
    };

    const velgTradisjon = (id: string) => {
        setValgtTradisjon((n) => (n === id ? null : id));
        setValgtKort(null);
        setMelding(null);
        setSammenstilling(false);
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Tradisjonsvelger */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-5 py-3">
                {traditions.map((t) => {
                    const ferdig = ferdigeIder.includes(t.id);
                    const erValgt = valgtTradisjon === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => velgTradisjon(t.id)}
                            aria-pressed={erValgt}
                            className={`flex items-center gap-1 rounded-full border border-l-4 px-3 py-1 text-xs font-semibold transition-colors ${
                                erValgt
                                    ? 'border-slate-300 bg-slate-900 text-white'
                                    : ferdig
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            style={{ borderLeftColor: t.color }}
                        >
                            {ferdig && <Check className="h-3 w-3" aria-hidden="true" />}
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {!aktiv && (
                <p className="px-5 py-6 text-center text-sm italic text-slate-500">
                    Velg en tradisjon over for å begynne å bygge.
                </p>
            )}

            {aktiv && !sammenstilling && (
                <>
                    {/* De fem leddene */}
                    <div className="space-y-2 px-5 pt-4">
                        {slots.map((ledd, i) => {
                            const fylt = aktivtBygg[ledd.id];
                            return (
                                <div
                                    key={ledd.id}
                                    className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,170px)_1fr] sm:items-stretch"
                                >
                                    <div className="flex flex-col justify-center rounded-lg bg-slate-50 px-3 py-2">
                                        <span className="text-xs font-bold text-slate-800">
                                            {i + 1}. {ledd.label}
                                        </span>
                                        {ledd.hint && (
                                            <span className="mt-0.5 text-[11px] leading-snug text-slate-500">
                                                {ledd.hint}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => (fylt ? taOpp(ledd.id) : plasser(ledd.id))}
                                        disabled={!fylt && !valgtKort}
                                        aria-label={
                                            fylt
                                                ? `${ledd.label}: ${kortTekst(fylt)}. Klikk for å ta kortet ut igjen.`
                                                : valgtKort
                                                  ? `Legg det valgte kortet i leddet ${ledd.label}`
                                                  : `Leddet ${ledd.label}. Velg et kort først.`
                                        }
                                        className={`flex min-h-[48px] items-center rounded-lg border-2 p-2.5 text-left text-sm transition-colors ${
                                            fylt
                                                ? 'border-solid border-emerald-300 bg-emerald-50 text-emerald-900'
                                                : valgtKort
                                                  ? 'cursor-pointer border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-50'
                                                  : 'border-dashed border-slate-200 bg-white'
                                        }`}
                                    >
                                        {fylt ? (
                                            <span>{kortTekst(fylt)}</span>
                                        ) : (
                                            <span className="text-[11px] italic text-slate-400">
                                                Tomt ledd
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Kortstokken */}
                    <div className="mt-4 border-t border-slate-200 px-5 py-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Kortstokk
                        </p>
                        <div className="flex min-h-[46px] flex-wrap gap-1.5">
                            {kortstokk.filter((k) => !brukteKort.has(k.id)).length ? (
                                kortstokk
                                    .filter((k) => !brukteKort.has(k.id))
                                    .map((k) => (
                                        <motion.button
                                            key={k.id}
                                            type="button"
                                            layout
                                            onClick={() =>
                                                setValgtKort((v) => (v === k.id ? null : k.id))
                                            }
                                            aria-pressed={valgtKort === k.id}
                                            animate={{
                                                x: feilKort === k.id ? [0, -5, 5, -3, 0] : 0,
                                            }}
                                            transition={{ type: 'tween', duration: 0.32 }}
                                            className={`max-w-full rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                                                valgtKort === k.id
                                                    ? 'border-slate-300 bg-slate-900 text-white shadow-md'
                                                    : feilKort === k.id
                                                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                        >
                                            {k.text}
                                        </motion.button>
                                    ))
                            ) : (
                                <span className="text-xs italic text-slate-400">
                                    Kortstokken er tom.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tilbakemeldingssone - alltid i DOM-et */}
                    <div className="px-5 pb-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={melding ? melding.tekst : (valgtKort ?? 'tom')}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className={`rounded-lg border px-4 py-3 text-sm ${
                                    melding
                                        ? melding.ok
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                            : 'border-rose-200 bg-rose-50 text-rose-800'
                                        : 'border-blue-200 bg-blue-50 text-blue-800'
                                }`}
                            >
                                {melding
                                    ? melding.tekst
                                    : valgtKort
                                      ? 'Klikk leddet du mener kortet hører hjemme i.'
                                      : `Velg et kort fra kortstokken, og legg det i riktig ledd hos ${aktiv.name.toLowerCase()}.`}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {aktivFerdig && (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                                className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                            >
                                <Sparkles
                                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                                    aria-hidden="true"
                                />
                                <span>
                                    {completeMessage}{' '}
                                    {kanSammenligne
                                        ? 'Du har nok plott til å stable dem.'
                                        : `Bygg ${compareAt - ferdigeIder.length} til, så kan du legge dem oppå hverandre.`}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Sammenstillingen: gruppert på ledd, ikke som bredt rutenett */}
            {sammenstilling && (
                <div className="space-y-3 px-5 pt-4">
                    {slots.map((ledd, i) => {
                        const erRegi = regiLedd?.id === ledd.id;
                        const rader = ferdigeIder.flatMap((tid) => {
                            const tradisjon = traditions.find((t) => t.id === tid);
                            const tekst = kortTekst(bygg[tid]?.[ledd.id]);
                            return tradisjon && tekst ? [{ tradisjon, tekst }] : [];
                        });

                        return (
                            <motion.div
                                key={ledd.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.25 }}
                                className={`rounded-lg border p-3 ${
                                    erRegi
                                        ? 'border-amber-300 bg-amber-50'
                                        : 'border-slate-200 bg-slate-50'
                                }`}
                            >
                                <p
                                    className={`mb-2 text-[11px] font-bold uppercase tracking-wide ${
                                        erRegi ? 'text-amber-700' : 'text-slate-500'
                                    }`}
                                >
                                    {i + 1}. {ledd.label} - {erRegi ? spreadLabel : sharedLabel}
                                </p>

                                <div className="space-y-1.5">
                                    {rader.map((r) => (
                                        <div key={r.tradisjon.id} className="flex gap-2">
                                            <span
                                                className="mt-0.5 w-1 shrink-0 rounded-full"
                                                style={{ backgroundColor: r.tradisjon.color }}
                                                aria-hidden="true"
                                            />
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">
                                                    {r.tradisjon.name}:
                                                </span>{' '}
                                                {r.tekst}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Bare det siste leddet får akse */}
                                {erRegi && regiAxis?.positions && (
                                    <div className="mt-4">
                                        {/* Navn over prikkene: uten dem er aksen uleselig på
                                            projektor, der fargekoden er det eneste som skiller
                                            tradisjonene. Droppes hvis det blir for trangt. */}
                                        {ferdigeIder.length <= 5 && (
                                            <div className="relative mb-1 h-4">
                                                {ferdigeIder.map((tid) => {
                                                    const pos = regiAxis.positions?.[tid];
                                                    const t = traditions.find((x) => x.id === tid);
                                                    if (pos === undefined || !t) return null;
                                                    const naerKant = pos < 0.12 || pos > 0.88;
                                                    return (
                                                        <span
                                                            key={tid}
                                                            className="absolute whitespace-nowrap text-[11px] font-bold"
                                                            style={{
                                                                left: `${Math.min(100, Math.max(0, pos * 100))}%`,
                                                                transform: naerKant
                                                                    ? pos < 0.5
                                                                        ? 'translateX(0)'
                                                                        : 'translateX(-100%)'
                                                                    : 'translateX(-50%)',
                                                                color: t.color,
                                                            }}
                                                        >
                                                            {t.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-300 to-indigo-300">
                                            {ferdigeIder.map((tid) => {
                                                const pos = regiAxis.positions?.[tid];
                                                const t = traditions.find((x) => x.id === tid);
                                                if (pos === undefined || !t) return null;
                                                return (
                                                    <motion.span
                                                        key={tid}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 300,
                                                            damping: 18,
                                                            delay: 0.5,
                                                        }}
                                                        title={t.name}
                                                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                                                        style={{
                                                            left: `${Math.min(100, Math.max(0, pos * 100))}%`,
                                                            backgroundColor: t.color,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-slate-600">
                                            <span>{regiAxis.leftLabel ?? 'Du gjør jobben selv'}</span>
                                            <span className="text-right">
                                                {regiAxis.rightLabel ?? 'Noe utenfor deg gjør jobben'}
                                            </span>
                                        </div>
                                        {regiAxis.notes && (
                                            <ul className="mt-2 space-y-0.5">
                                                {ferdigeIder
                                                    .filter((tid) => regiAxis.notes?.[tid])
                                                    .map((tid) => (
                                                        <li
                                                            key={tid}
                                                            className="text-[11px] leading-snug text-slate-500"
                                                        >
                                                            {traditions.find((t) => t.id === tid)?.name}:{' '}
                                                            {regiAxis.notes?.[tid]}
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" />
                        <span>
                            <span className="font-bold">{revealTitle}. </span>
                            {revealText}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {ferdigeIder.length} av {traditions.length} plott bygget
                </span>
                <div className="flex flex-wrap items-center gap-4">
                    {kanSammenligne && (
                        <button
                            type="button"
                            onClick={() => setSammenstilling((s) => !s)}
                            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                        >
                            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                            {sammenstilling ? 'Tilbake til byggingen' : 'Legg dem oppå hverandre'}
                        </button>
                    )}
                    {aktiv && !sammenstilling && !aktivFerdig && (
                        <button
                            type="button"
                            onClick={visFasit}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                        >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Vis svaret
                        </button>
                    )}
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
        </div>
    );
}
