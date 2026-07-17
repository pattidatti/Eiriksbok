import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RotateCcw, Shield, Sparkles, ArrowRight } from 'lucide-react';

// Revolusjonsbolgen1848 — signaturkomponent for artikkelen om revolusjonene i 1848.
//
// Lyspære-øyeblikket: Én gnist i Paris tente revolusjoner over hele Europa på få
// uker. Men kongene slo tilbake, og nesten alle opprørene ble knust innen et år.
// Likevel forsvant ikke ideene — de la igjen et spor som vant til slutt.
//
// Interaksjon: Eleven tenner gnisten i Paris, sprer så revolusjonen by for by ved
// å klikke den neste byen som blinker. Når hele Europa brenner, slår reaksjonen
// tilbake: byene slukner én for én, men hver by legger igjen et varig spor.

interface City {
    id: string;
    name: string;
    month: string;
    demand: string;
    survived: string;
    // Posisjon i kart-boksen, i prosent (venstre / topp).
    x: number;
    y: number;
}

// Rekkefølgen er også spredningsrekkefølgen: Paris tenner, så bølgen ruller østover.
const CITIES: City[] = [
    {
        id: 'paris',
        name: 'Paris',
        month: 'Februar 1848',
        demand: 'Folket jager kong Louis-Philippe på flukt og roper på republikk.',
        survived: 'Alle voksne menn fikk stemmerett i den nye republikken.',
        x: 20,
        y: 54,
    },
    {
        id: 'munchen',
        name: 'München',
        month: 'Mars 1848',
        demand: 'Studenter og borgere krever trykkefrihet og en grunnlov.',
        survived: 'Kongen måtte gå av, og pressen ble friere.',
        x: 48,
        y: 56,
    },
    {
        id: 'wien',
        name: 'Wien',
        month: 'Mars 1848',
        demand: 'Opprør tvinger den mektige statsmannen Metternich til å rømme.',
        survived: 'Slutt på stavnsbånd: bøndene ble frie fra å måtte jobbe for herremannen.',
        x: 60,
        y: 57,
    },
    {
        id: 'berlin',
        name: 'Berlin',
        month: 'Mars 1848',
        demand: 'Folk bygger barrikader og krever et samlet, fritt Tyskland.',
        survived: 'Preussen fikk sin første grunnlov året etter.',
        x: 55,
        y: 34,
    },
    {
        id: 'milano',
        name: 'Milano',
        month: 'Mars 1848',
        demand: 'I fem dager jager byen de østerrikske soldatene ut av gatene.',
        survived: 'Drømmen om et samlet Italia ble sterkere enn før.',
        x: 45,
        y: 74,
    },
    {
        id: 'budapest',
        name: 'Budapest',
        month: 'Mars 1848',
        demand: 'Ungarerne krever egne lover og retten til å styre seg selv.',
        survived: 'Kravet om selvstyre ble aldri glemt i Ungarn.',
        x: 74,
        y: 62,
    },
];

type Phase = 'idle' | 'spreading' | 'ready' | 'reaction' | 'complete';

export function Revolusjonsbolgen1848({
    title = 'Folkenes vår: bølgen over Europa',
}: {
    title?: string;
}) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [litCount, setLitCount] = useState(0); // hvor mange byer som brenner (0-6)
    const [active, setActive] = useState<City | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const reset = () => {
        if (timer.current) clearTimeout(timer.current);
        setPhase('idle');
        setLitCount(0);
        setActive(null);
    };

    // Klikk på neste by i rekkefølgen: tenn den og spre bølgen videre.
    const igniteNext = (city: City, index: number) => {
        if (phase === 'idle' && index === 0) {
            setPhase('spreading');
        } else if (phase !== 'spreading' || index !== litCount) {
            return;
        }
        const next = index + 1;
        setLitCount(next);
        setActive(city);
        if (next >= CITIES.length) {
            setPhase('ready');
        }
    };

    // Reaksjonen: byene slukner én for én, men legger igjen et spor.
    const startReaction = () => {
        setPhase('reaction');
        setActive(null);
        timer.current = setTimeout(
            () => setPhase('complete'),
            CITIES.length * 260 + 700
        );
    };

    const nextIndex = phase === 'idle' ? 0 : litCount;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-rose-600" />
                </span>
                <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'idle'
                            ? 'Klikk Paris for å tenne den første gnisten.'
                            : phase === 'spreading'
                              ? 'Klikk den neste byen som blinker, og spre revolusjonen.'
                              : phase === 'ready'
                                ? 'Hele Europa brenner. Se hva som skjedde videre.'
                                : phase === 'reaction'
                                  ? 'Reaksjonen slår tilbake …'
                                  : 'Nesten alle opprørene ble knust. Men ideene overlevde.'}
                    </p>
                </div>
            </div>

            {/* Kart-flate */}
            <div className="p-4 sm:p-5">
                <div
                    className="relative w-full rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 border border-slate-200 overflow-hidden"
                    style={{ aspectRatio: '16 / 9' }}
                >
                    {/* Bølge-linjer fra Paris til hver tent by */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 56.25"
                        preserveAspectRatio="none"
                    >
                        {CITIES.slice(1).map((c, i) => {
                            const idx = i + 1;
                            const on = phase !== 'reaction' && phase !== 'complete' && litCount > idx;
                            return (
                                <motion.line
                                    key={c.id}
                                    x1={CITIES[0].x}
                                    y1={(CITIES[0].y / 100) * 56.25}
                                    x2={c.x}
                                    y2={(c.y / 100) * 56.25}
                                    stroke="#fb7185"
                                    strokeWidth={0.4}
                                    strokeDasharray="1.2 1"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: on ? 1 : 0,
                                        opacity: on ? 0.7 : 0,
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })}
                    </svg>

                    {/* By-noder */}
                    {CITIES.map((city, index) => {
                        const isLit = litCount > index;
                        const isNext =
                            (phase === 'idle' && index === 0) ||
                            (phase === 'spreading' && index === nextIndex);
                        const crushed = phase === 'reaction' || phase === 'complete';
                        const clickable = isNext;
                        return (
                            <button
                                key={city.id}
                                type="button"
                                disabled={!clickable}
                                onClick={() => igniteNext(city, index)}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group ${
                                    clickable ? 'cursor-pointer' : 'cursor-default'
                                }`}
                                style={{ left: `${city.x}%`, top: `${city.y}%` }}
                            >
                                <motion.span
                                    animate={
                                        isNext
                                            ? { scale: [1, 1.25, 1] }
                                            : { scale: 1 }
                                    }
                                    transition={
                                        isNext
                                            ? { repeat: Infinity, duration: 1.1 }
                                            : { type: 'spring', stiffness: 300, damping: 18 }
                                    }
                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow ${
                                        crushed && isLit
                                            ? 'bg-slate-300'
                                            : isLit
                                              ? 'bg-rose-500'
                                              : isNext
                                                ? 'bg-amber-400 ring-4 ring-amber-200'
                                                : 'bg-slate-200'
                                    }`}
                                >
                                    {crushed && isLit ? (
                                        <Shield className="w-3.5 h-3.5 text-slate-600" />
                                    ) : isLit ? (
                                        <Flame className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    )}
                                </motion.span>
                                <span
                                    className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded ${
                                        isLit || isNext
                                            ? 'bg-white/80 text-slate-700'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {city.name}
                                </span>
                                {/* Varig spor dukker opp ved reaksjonen */}
                                <AnimatePresence>
                                    {crushed && isLit && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.26 }}
                                            className="absolute top-full mt-0.5 whitespace-nowrap text-[9px] font-bold text-emerald-700"
                                        >
                                            ✓ spor
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}

                    {/* Teller oppe til venstre */}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/85 text-xs font-bold text-rose-700 shadow-sm">
                        Byer i opprør: {litCount} / {CITIES.length}
                    </div>
                </div>

                {/* Feedback-sone: alltid til stede */}
                <div className="mt-3 min-h-[64px]">
                    <AnimatePresence mode="wait">
                        {phase === 'complete' ? (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"
                            >
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-emerald-900 leading-relaxed">
                                        Innen et år var nesten hver eneste revolusjon slått ned, og
                                        kongene satt igjen med makten. Men bølgen var ikke forgjeves.
                                        Bøndene ble frie flere steder, folk hadde smakt på frihet, og
                                        kravet om egne nasjonalstater vokste seg sterkere. Under 25 år
                                        senere ble både Italia og Tyskland samlet. Ideene fra 1848 tapte
                                        slaget, men vant til slutt.
                                    </p>
                                </div>
                            </motion.div>
                        ) : active ? (
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl bg-rose-50 border border-rose-200 p-3"
                            >
                                <p className="text-xs font-bold uppercase tracking-wide text-rose-600">
                                    {active.name} · {active.month}
                                </p>
                                <p className="text-sm text-slate-700 mt-1 leading-snug">
                                    {active.demand}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500 italic"
                            >
                                {phase === 'reaction'
                                    ? 'Soldatene rykker inn, og opprørene knuses ett for ett …'
                                    : 'Én gnist i Paris kan tenne et helt kontinent. Klikk og se selv.'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Kontrollrad */}
                <div className="mt-3 flex items-center justify-between">
                    {phase === 'ready' ? (
                        <button
                            type="button"
                            onClick={startReaction}
                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                        >
                            Se reaksjonen
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="text-xs text-slate-400">
                            {phase === 'idle'
                                ? 'Steg 1: tenn gnisten'
                                : phase === 'spreading'
                                  ? 'Spre bølgen over Europa'
                                  : phase === 'reaction'
                                    ? 'Reaksjonen ruller inn'
                                    : 'Bølgen er over'}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
