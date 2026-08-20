import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stamp, Crown, Users, ShieldQuestion, Check, X, Sparkles } from 'lucide-react';

// Signaturkomponent til artikkelen om eneveldet i Danmark-Norge.
// Lyspære-øyeblikket: eneveldet handlet ikke om at kongen ble sintere eller
// sterkere som person. Det handlet om at alle som kunne si NEI til ham, ble
// borte. Eleven prøver de samme fem befalingene i 1650 og i 1670, og ser
// tallet snu fra 0 av 5 til 5 av 5.

interface Order {
    id: string;
    // Kongens befaling, sagt i jeg-form.
    text: string;
    // Hvem som stanset den for 1660, og hvorfor.
    blocker: string;
    reason: string;
    // Hva som gjorde den mulig etter 1660.
    etter: string;
}

interface KongensSeglProps {
    title?: string;
    orders?: Order[];
}

const DEFAULT_ORDERS: Order[] = [
    {
        id: 'arv',
        text: 'Sønnen min skal bli konge etter meg.',
        blocker: 'Riksrådet',
        reason: 'Danmark-Norge var et valgkongedømme. Riksrådet, som var et råd av adelsmenn, valgte kongen. De ville ikke gi fra seg det valget.',
        etter: 'Kongeloven av 1665 gjorde kronen arvelig. Nå gikk den automatisk videre i familien.',
    },
    {
        id: 'skatt',
        text: 'Alle skal betale den nye skatten. Også adelen.',
        blocker: 'Adelen',
        reason: 'Adelen slapp å betale skatt. Det var det viktigste de eide, og de nektet å gi det fra seg.',
        etter: 'Adelen mistet den politiske makten sin i 1660, og særrettene deres ble bygd ned.',
    },
    {
        id: 'embete',
        text: 'Jeg utnevner en bondesønn til amtmann i Bergen.',
        blocker: 'Adelen',
        reason: 'De store stillingene i riket var reservert for adelsmenn. En bondesønn kom ikke inn, uansett hvor dyktig han var.',
        etter: 'Kongen utnevnte nå alle embetsmenn selv. Dyktighet begynte å telle mer enn hvilken familie du var født inn i.',
    },
    {
        id: 'lov',
        text: 'Én ny lov skal gjelde i hele Norge.',
        blocker: 'Riksrådet',
        reason: 'Kongen kunne ikke lage lover alene. Riksrådet måtte skrive under først.',
        etter: 'Kongen laget lover alene. I 1687 kom Christian 5.s Norske Lov, som gjaldt i hele landet.',
    },
    {
        id: 'handfestning',
        text: 'Jeg vil ikke skrive under på håndfestningen.',
        blocker: 'Håndfestningen',
        reason: 'Håndfestningen var kontrakten kongen måtte signere for å bli valgt. Uten signatur, ingen krone.',
        etter: 'Håndfestningen ble opphevet i 1660. Ingen kontrakt bandt kongen lenger.',
    },
];

type Year = 1650 | 1670;
type Status = 'ny' | 'venter' | 'nei' | 'ja';

export function KongensSegl({
    title = 'Kongens segl',
    orders = DEFAULT_ORDERS,
}: KongensSeglProps) {
    const [year, setYear] = useState<Year>(1650);
    const [status, setStatus] = useState<Record<Year, Record<string, Status>>>({
        1650: {},
        1670: {},
    });

    const here = status[year];
    const settled = orders.filter((o) => here[o.id] === 'ja' || here[o.id] === 'nei').length;
    const passed = (y: Year) => orders.filter((o) => status[y][o.id] === 'ja').length;
    const done = (y: Year) =>
        orders.filter((o) => status[y][o.id] === 'ja' || status[y][o.id] === 'nei').length ===
        orders.length;
    const allDone = done(1650) && done(1670);

    const setOne = (id: string, next: Status) =>
        setStatus((prev) => ({ ...prev, [year]: { ...prev[year], [id]: next } }));

    const handleOrder = (id: string) => {
        const cur = here[id] ?? 'ny';
        if (cur === 'ja' || cur === 'nei') return;
        if (year === 1670) {
            setOne(id, 'ja');
            return;
        }
        if (cur === 'ny') setOne(id, 'venter');
        else setOne(id, 'nei');
    };

    const handleReset = () => setStatus({ 1650: {}, 1670: {} });

    const yearHint =
        year === 1650
            ? 'Kongen vil, men noen andre må si ja først. Klikk befalingen, og spør så om lov.'
            : 'Kongen har fått all makt. Ett klikk gir ett segl, og saken er avgjort.';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Stamp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Prøv de samme fem befalingene i to år, og se hvor mange som går igjennom.
                    </p>
                </div>
            </div>

            {/* Årsvelger */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {([1650, 1670] as Year[]).map((y) => {
                        const active = year === y;
                        return (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                    active
                                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span
                                    className={`block text-base font-bold ${
                                        active ? 'text-indigo-700' : 'text-slate-600'
                                    }`}
                                >
                                    År {y}
                                </span>
                                <span className="block text-xs text-slate-500">
                                    {y === 1650 ? 'Før eneveldet' : 'Etter eneveldet'}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-2.5 text-sm text-slate-500">{yearHint}</p>
            </div>

            {/* Befalingene */}
            <div className="px-5 sm:px-6 py-4 space-y-2.5">
                {orders.map((o) => {
                    const st = here[o.id] ?? 'ny';
                    const tone =
                        st === 'ja'
                            ? 'bg-emerald-50 border-emerald-200'
                            : st === 'nei'
                              ? 'bg-rose-50 border-rose-200'
                              : st === 'venter'
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm';
                    return (
                        <motion.div
                            key={`${year}-${o.id}`}
                            layout
                            className={`rounded-xl border px-4 py-3 transition-colors ${tone}`}
                        >
                            <div className="flex items-start gap-3">
                                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="flex-1 text-sm text-slate-700 leading-snug">
                                    «{o.text}»
                                </p>

                                {/* Handling eller resultat, alltid til høyre */}
                                <div className="flex-shrink-0">
                                    {st === 'ny' && (
                                        <button
                                            onClick={() => handleOrder(o.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
                                        >
                                            Sett segl
                                        </button>
                                    )}
                                    {st === 'venter' && (
                                        <button
                                            onClick={() => handleOrder(o.id)}
                                            className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-700 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                        >
                                            <ShieldQuestion className="w-3.5 h-3.5" />
                                            Spør {o.blocker}
                                        </button>
                                    )}
                                    {st === 'ja' && (
                                        <motion.span
                                            initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
                                            animate={{ scale: 1, rotate: -6, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                                            className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-400 px-3 py-1 text-xs font-bold text-emerald-600"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Godkjent
                                        </motion.span>
                                    )}
                                    {st === 'nei' && (
                                        <motion.span
                                            initial={{ scale: 0.5, rotate: 10, opacity: 0 }}
                                            animate={{ scale: 1, rotate: 5, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                                            className="inline-flex items-center gap-1 rounded-full border-2 border-rose-400 px-3 py-1 text-xs font-bold text-rose-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Stanset
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {st === 'venter' && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 pl-7 text-xs text-amber-700"
                                    >
                                        Kongen kan ikke bestemme dette alene. {o.blocker} må svare
                                        først.
                                    </motion.p>
                                )}
                                {st === 'nei' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 pl-7 flex items-start gap-2"
                                    >
                                        <Users className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-700 leading-relaxed">
                                            <span className="font-semibold">{o.blocker}:</span>{' '}
                                            {o.reason}
                                        </p>
                                    </motion.div>
                                )}
                                {st === 'ja' && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 pl-7 text-xs text-emerald-700 leading-relaxed"
                                    >
                                        {year === 1670
                                            ? o.etter
                                            : 'Den gikk igjennom uten at noen andre måtte si ja.'}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-5 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">År {year}:</span> {passed(year)} av{' '}
                    {orders.length} befalinger gikk igjennom.{' '}
                    {settled < orders.length
                        ? `Du har ${orders.length - settled} igjen å prøve i dette året.`
                        : year === 1650
                          ? 'Ingen av dem. Kongen var sjefen, men han var ikke den siste som bestemte.'
                          : 'Alle sammen. Ett segl var nok.'}
                </p>
            </div>

            <AnimatePresence>
                {allDone && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className="mx-5 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                <span className="font-semibold">
                                    1650: {passed(1650)} av {orders.length}. 1670: {passed(1670)} av{' '}
                                    {orders.length}.
                                </span>{' '}
                                Kongen var like sterk som person i begge årene. Forskjellen er at i
                                1670 fantes det ingen igjen som kunne si nei til ham. Det er nettopp
                                det ordet enevelde betyr: én som råder alene.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => setYear(year === 1650 ? 1670 : 1650)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    Bytt til {year === 1650 ? '1670' : '1650'}
                </button>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
