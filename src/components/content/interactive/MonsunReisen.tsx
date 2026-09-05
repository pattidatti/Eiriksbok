import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Ship, RotateCcw, Sparkles, Anchor } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal kjenne at vinden bestemte alt. Du rekker ikke
// tur-retur over Indiahavet på én sesong. Derfor måtte handelsmennene bli
// boende i havnebyene i månedsvis - og det er der swahilikulturen ble til.

interface MonsunReisenProps {
    title?: string;
    homePort?: string;
    awayPort?: string;
}

type WindDir = 'mot-afrika' | 'mot-india' | 'stille';
type Side = 'hjem' | 'borte';
type Phase = 'idle' | 'seiler' | 'ferdig';
type Tone = 'nøytral' | 'feil' | 'ok';

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

const MONTH_LONG = [
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

// Nordøstmonsunen blåser mot sørvest (november-mars) og bærer skipene mot
// Afrika. Sørvestmonsunen blåser mot nordøst (april-september) og bærer dem
// mot India. Oktober er skiftet mellom dem.
const WIND: WindDir[] = [
    'mot-afrika',
    'mot-afrika',
    'mot-afrika',
    'mot-india',
    'mot-india',
    'mot-india',
    'mot-india',
    'mot-india',
    'mot-india',
    'stille',
    'mot-afrika',
    'mot-afrika',
];

const WIND_LABEL: Record<WindDir, string> = {
    'mot-afrika': 'Vinden blåser mot Afrika',
    'mot-india': 'Vinden blåser mot India',
    stille: 'Nesten vindstille',
};

export function MonsunReisen({
    title = 'Én reise over Indiahavet',
    homePort = 'Kilwa',
    awayPort = 'Cambay i India',
}: MonsunReisenProps) {
    const [month, setMonth] = useState(0);
    const [side, setSide] = useState<Side>('hjem');
    const [elapsed, setElapsed] = useState(0);
    const [phase, setPhase] = useState<Phase>('idle');
    const [tone, setTone] = useState<Tone>('nøytral');
    const [message, setMessage] = useState(
        'Skipet ligger i havna med gull og elfenbein. Velg en måned, og prøv å seile ut.'
    );
    const [shake, setShake] = useState(0);
    const timer = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (timer.current !== null) window.clearTimeout(timer.current);
        },
        []
    );

    const wind = WIND[month];
    const needed: WindDir = side === 'hjem' ? 'mot-india' : 'mot-afrika';
    const canSail = wind === needed && phase === 'idle';

    const handleMonth = useCallback(
        (i: number) => {
            if (phase !== 'idle') return;
            const steps = (i - month + 12) % 12;
            if (steps === 0) {
                setTone('nøytral');
                setMessage(`Det er allerede ${MONTH_LONG[i]}.`);
                return;
            }
            setMonth(i);
            setElapsed((e) => e + steps);
            setTone('nøytral');
            setMessage(
                steps === 1
                    ? `Du ventet én måned i havna. Nå er det ${MONTH_LONG[i]}.`
                    : `Du ventet ${steps} måneder i havna. Nå er det ${MONTH_LONG[i]}.`
            );
        },
        [month, phase]
    );

    const handleSail = useCallback(() => {
        if (phase !== 'idle') return;
        if (wind !== needed) {
            setShake((s) => s + 1);
            setTone('feil');
            setMessage(
                wind === 'stille'
                    ? 'I oktober snur monsunen, og det er nesten vindstille. Seilet henger slapt, og skipet blir liggende.'
                    : `Vinden står rett imot. Et seilskip kom ingen vei mot monsunen, så skipet blir liggende i ${MONTH_LONG[month]}.`
            );
            return;
        }
        setPhase('seiler');
        setTone('ok');
        setMessage('Seilet fylles, og skipet går for full monsun.');
        timer.current = window.setTimeout(() => {
            const nextMonth = (month + 1) % 12;
            const nextSide: Side = side === 'hjem' ? 'borte' : 'hjem';
            setMonth(nextMonth);
            setElapsed((e) => e + 1);
            setSide(nextSide);
            if (nextSide === 'hjem') {
                setPhase('ferdig');
                setTone('ok');
                setMessage('Framme i havna igjen, med porselen og silke i lasten.');
            } else {
                setPhase('idle');
                setTone('ok');
                setMessage(
                    `Framme i ${awayPort}. Gullet er solgt. Nå må du vente på vinden hjem.`
                );
            }
        }, 950);
    }, [awayPort, month, needed, phase, side, wind]);

    const handleReset = useCallback(() => {
        if (timer.current !== null) window.clearTimeout(timer.current);
        setMonth(0);
        setSide('hjem');
        setElapsed(0);
        setPhase('idle');
        setTone('nøytral');
        setMessage(
            'Skipet ligger i havna med gull og elfenbein. Velg en måned, og prøv å seile ut.'
        );
    }, []);

    const shipLeft = side === 'hjem' && phase !== 'seiler' ? '4%' : side === 'borte' ? '76%' : '40%';
    const sailingRight = side === 'hjem';

    const toneClass =
        tone === 'feil'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : tone === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Wind className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg måned i kalenderen, og seil når vinden går riktig vei.
                    </p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Kart-stripe: havna, havet og skipet */}
                <motion.div
                    key={shake}
                    animate={shake > 0 ? { x: [0, -7, 7, -4, 4, 0] } : undefined}
                    transition={{ duration: 0.36 }}
                    className="relative rounded-xl border border-slate-200 bg-gradient-to-b from-sky-50 to-cyan-100 h-32 sm:h-36 overflow-hidden"
                >
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-cyan-200/70" />
                    <div className="absolute left-0 top-0 bottom-0 w-[18%] bg-amber-200/80 border-r border-amber-300" />
                    <div className="absolute right-0 top-0 bottom-0 w-[16%] bg-amber-200/80 border-l border-amber-300" />

                    <span className="absolute left-2 top-2 text-[11px] font-semibold text-amber-800">
                        {homePort}
                    </span>
                    <span className="absolute right-2 top-2 text-[11px] font-semibold text-amber-800 text-right">
                        {awayPort}
                    </span>

                    {/* Vindpil */}
                    <div className="absolute inset-x-0 top-9 flex justify-center">
                        <motion.div
                            key={wind}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold ${
                                wind === 'stille'
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-white/85 text-slate-700 shadow-sm'
                            }`}
                        >
                            {wind === 'mot-afrika' && <span aria-hidden="true">←</span>}
                            <Wind className="w-3.5 h-3.5" />
                            <span>{WIND_LABEL[wind]}</span>
                            {wind === 'mot-india' && <span aria-hidden="true">→</span>}
                        </motion.div>
                    </div>

                    {/* Skipet */}
                    <motion.div
                        className="absolute bottom-5"
                        animate={{ left: shipLeft }}
                        transition={{ duration: phase === 'seiler' ? 0.9 : 0.35, ease: 'easeInOut' }}
                        style={{ left: shipLeft }}
                    >
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity }}
                            className="flex flex-col items-center"
                        >
                            <Ship
                                className={`w-8 h-8 text-slate-700 ${sailingRight ? '' : '-scale-x-100'}`}
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Månedsbånd */}
                <div>
                    <div className="grid grid-cols-12 gap-1">
                        {MONTHS.map((m, i) => {
                            const w = WIND[i];
                            const active = i === month;
                            const base =
                                w === 'mot-india'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : w === 'mot-afrika'
                                      ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200';
                            return (
                                <button
                                    key={m}
                                    onClick={() => handleMonth(i)}
                                    disabled={phase !== 'idle'}
                                    className={`relative rounded-lg py-2 text-[11px] sm:text-xs font-semibold transition-colors disabled:opacity-60 ${base} ${
                                        active ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                                    }`}
                                >
                                    {m}
                                    {active && (
                                        <motion.span
                                            layoutId="monsun-maaned"
                                            className="absolute inset-0 rounded-lg border-2 border-indigo-500"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-amber-200 inline-block" />
                            Sørvestmonsun: mot India
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-sky-200 inline-block" />
                            Nordøstmonsun: mot Afrika
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                            Skifte: nesten vindstille
                        </span>
                    </div>
                </div>

                {/* Reisebok */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                        <Anchor className="w-3.5 h-3.5" />
                        {side === 'hjem' ? homePort : awayPort}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                        Måneder brukt: {elapsed}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                        Last: {side === 'hjem' && phase !== 'ferdig' ? 'gull og elfenbein' : phase === 'ferdig' ? 'porselen og silke' : 'gull og elfenbein solgt'}
                    </span>
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className={`mx-5 mb-4 px-4 py-3 rounded-lg border text-sm ${toneClass}`}>
                {message}
            </div>

            <AnimatePresence>
                {phase === 'ferdig' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="mx-5 mb-4 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-800 leading-relaxed">
                                <p className="font-semibold mb-1">
                                    Tur-retur tok {elapsed} måneder.
                                </p>
                                <p>
                                    Vinden lot deg aldri seile begge veier i samme sesong. Derfor
                                    ble handelsmennene boende i havnebyene i månedsvis. Mange
                                    giftet seg og fikk barn der. Det er slik den blandede
                                    swahilikulturen vokste fram.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={handleSail}
                    disabled={phase !== 'idle'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        canSail
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-600/70 hover:bg-indigo-700 text-white'
                    } disabled:bg-slate-200 disabled:text-slate-400`}
                >
                    {phase === 'seiler' ? 'Seiler ...' : 'Seil ut'}
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
