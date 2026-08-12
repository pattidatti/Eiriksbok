import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Check, X, RotateCcw, Eye, EyeOff, HelpCircle } from 'lucide-react';

// Stemmene fra fortiden: sitatkort fra grunnleggerne, blandet.
//
// Lyspære-øyeblikket: eleven leser et sitat uten å vite hvem som sa det, og
// oppdager to ting samtidig. Det ene er hvor like de etiske ideene er. Det
// andre er at flere av skikkelsene bruker sine egne ord på å nekte for at de
// er guddommelige - mens én tradisjon ikke har noen stemme å spille av i det
// hele tatt.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
}

interface Sitatkort {
    id: string;
    text: string;
    speaker: string;
    traditionId: string;
    source: string;
    reveal: string;
    options?: string[];
}

interface UtenGrunnlegger {
    name?: string;
    color?: string;
    title: string;
    text: string;
}

interface StemmeneFraFortidenProps {
    title?: string;
    intro?: string;
    traditions?: Tradisjon[];
    quotes?: Sitatkort[];
    noFounder?: UtenGrunnlegger;
}

const NOYTRAL = '#94a3b8';

// Religionsfargene er lyse nok (amber, oransje) til at hvit tekst blir uleselig
// på storskjerm. Velg svart eller hvit tekst ut fra hvor lys fargen er.
function lesbarTekst(hex?: string) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const kanal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
    return lum > 0.45 ? '#0f172a' : '#ffffff';
}

export function StemmeneFraFortiden({
    title = 'Stemmene fra fortiden',
    intro = 'Les sitatet, og gjett hvilken tradisjon stemmen hører hjemme i.',
    traditions = [],
    quotes = [],
    noFounder,
}: StemmeneFraFortidenProps) {
    const [aktivIndeks, setAktivIndeks] = useState(0);
    const [svar, setSvar] = useState<Record<string, string>>({});
    const [visAlt, setVisAlt] = useState(false);

    const finnTradisjon = useMemo(() => {
        const kart = new Map(traditions.map((t) => [t.id, t]));
        return (id: string) => kart.get(id);
    }, [traditions]);

    const aktivt = quotes[aktivIndeks] ?? null;
    const besvart = aktivt ? svar[aktivt.id] : undefined;
    const avdekket = Boolean(besvart) || visAlt;

    const riktige = quotes.filter((s) => svar[s.id] === s.traditionId).length;
    const antallSvar = quotes.filter((s) => svar[s.id]).length;

    const valgFor = (kort: Sitatkort) => {
        const ider = kort.options?.length ? kort.options : traditions.slice(0, 4).map((t) => t.id);
        return ider.map((id) => finnTradisjon(id)).filter((t): t is Tradisjon => Boolean(t));
    };

    const gjett = (id: string) => {
        if (!aktivt || besvart) return;
        setSvar((forrige) => ({ ...forrige, [aktivt.id]: id }));
    };

    const nullstill = () => {
        setSvar({});
        setAktivIndeks(0);
        setVisAlt(false);
    };

    if (quotes.length === 0) return null;

    const fasit = aktivt ? finnTradisjon(aktivt.traditionId) : undefined;
    const kantfarge = avdekket && fasit ? fasit.color : NOYTRAL;

    return (
        <div className="my-8 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">{intro}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setVisAlt((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    {visAlt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {visAlt ? 'Skjul fasit' : 'Vis fasit'}
                </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {quotes.map((kort, i) => {
                    const gjettet = svar[kort.id];
                    const ok = gjettet === kort.traditionId;
                    const erAktiv = i === aktivIndeks;
                    return (
                        <button
                            key={kort.id}
                            type="button"
                            onClick={() => setAktivIndeks(i)}
                            aria-label={`Sitat ${i + 1} av ${quotes.length}`}
                            aria-current={erAktiv ? 'true' : undefined}
                            className={`h-8 w-8 rounded-full border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                erAktiv
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : gjettet
                                      ? ok
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                          : 'border-rose-300 bg-rose-50 text-rose-700'
                                      : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
                <span className="ml-auto text-sm text-slate-500">
                    {antallSvar > 0
                        ? `${riktige} riktige av ${antallSvar} forsøk`
                        : `${quotes.length} stemmer`}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {aktivt && (
                    <motion.div
                        key={aktivt.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                        style={{ borderLeftWidth: 6, borderLeftColor: kantfarge }}
                    >
                        <Quote className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        <blockquote className="mt-2 font-display text-lg leading-snug text-slate-900 sm:text-xl">
                            {aktivt.text}
                        </blockquote>

                        {!avdekket && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-700">
                                    Hvem er stemmen?
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {valgFor(aktivt).map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => gjett(t.id)}
                                            className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                            style={{ borderColor: t.color }}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {avdekket && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                                    {besvart && (
                                        <p
                                            className={`flex items-center gap-2 text-sm font-semibold ${
                                                besvart === aktivt.traditionId
                                                    ? 'text-emerald-700'
                                                    : 'text-rose-700'
                                            }`}
                                        >
                                            {besvart === aktivt.traditionId ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                            {besvart === aktivt.traditionId
                                                ? 'Riktig'
                                                : `Du svarte ${finnTradisjon(besvart)?.name ?? besvart}`}
                                        </p>
                                    )}
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {aktivt.speaker}
                                        <span
                                            className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                                            style={{
                                                backgroundColor: fasit?.color ?? NOYTRAL,
                                                color: lesbarTekst(fasit?.color ?? NOYTRAL),
                                            }}
                                        >
                                            {fasit?.name ?? aktivt.traditionId}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">{aktivt.source}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                        {aktivt.reveal}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setAktivIndeks((i) => (i + 1) % Math.max(quotes.length, 1))
                                }
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                Neste stemme
                            </button>
                            <button
                                type="button"
                                onClick={nullstill}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Start på nytt
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {noFounder && (
                <div
                    className="mt-4 rounded-xl border border-dashed bg-white p-4"
                    style={{ borderColor: noFounder.color ?? NOYTRAL }}
                >
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <HelpCircle className="h-4 w-4" style={{ color: noFounder.color }} />
                        {noFounder.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{noFounder.text}</p>
                </div>
            )}

            <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                    Alle sitatene i en liste
                </summary>
                <ul className="mt-2 space-y-3">
                    {quotes.map((kort) => {
                        const t = finnTradisjon(kort.traditionId);
                        return (
                            <li key={kort.id} className="text-sm text-slate-700">
                                <span className="block italic">«{kort.text}»</span>
                                <span className="mt-0.5 block font-semibold text-slate-900">
                                    {kort.speaker}
                                    {t ? ` - ${t.name}` : ''}
                                </span>
                                <span className="block text-slate-500">{kort.source}</span>
                            </li>
                        );
                    })}
                </ul>
            </details>
        </div>
    );
}
