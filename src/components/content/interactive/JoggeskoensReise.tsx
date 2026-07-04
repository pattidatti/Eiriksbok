import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    Check,
    Coins,
    Factory,
    Footprints,
    PenTool,
    Play,
    RotateCcw,
    Scissors,
    Ship,
    Store,
} from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at gevinsten
// fra globaliseringen ble delt svært ujevnt. Eleven følger pengene i én
// joggesko til 1000 kroner og oppdager at de som syr skoen i Vietnam bare får
// 25 kroner, mens merkevaren i USA tar 430. Varene ble globale, men pengene
// fulgte merkevaren, ikke arbeidet.

interface JoggeskoensReiseProps {
    title?: string;
}

type StationId = 'kina' | 'vietnam' | 'frakt' | 'usa' | 'norge';

interface Station {
    id: StationId;
    label: string;
    role: string;
    icon: typeof Factory;
    color: string;
    real: number; // faktisk andel av 1000 kr
}

const STATIONS: Station[] = [
    {
        id: 'kina',
        label: 'Kina',
        role: 'stoff og deler',
        icon: Factory,
        color: 'text-rose-600',
        real: 120,
    },
    {
        id: 'vietnam',
        label: 'Vietnam',
        role: 'syr skoen',
        icon: Scissors,
        color: 'text-amber-600',
        real: 25,
    },
    {
        id: 'frakt',
        label: 'Frakt',
        role: 'containerskip',
        icon: Ship,
        color: 'text-sky-600',
        real: 50,
    },
    {
        id: 'usa',
        label: 'USA',
        role: 'design og merke',
        icon: PenTool,
        color: 'text-indigo-600',
        real: 430,
    },
    {
        id: 'norge',
        label: 'Norge',
        role: 'butikken',
        icon: Store,
        color: 'text-emerald-600',
        real: 375,
    },
];

const TOTAL_COINS = 10;
const COIN_VALUE = 100;
const MAX_BAR_PX = 84;
const MAX_REAL = 430;

// Sentrum for hver av de fem stasjonene, i prosent av bredden
const STOP_POSITIONS = ['10%', '30%', '50%', '70%', '90%'];

type Phase = 'intro' | 'journey' | 'place' | 'reveal' | 'complete';

function emptyCoins(): Record<StationId, number> {
    return { kina: 0, vietnam: 0, frakt: 0, usa: 0, norge: 0 };
}

function barHeight(value: number): number {
    return Math.max(4, Math.min(MAX_BAR_PX, Math.round((value / MAX_REAL) * MAX_BAR_PX)));
}

function CountUp({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
    const [value, setValue] = useState(from);
    useEffect(() => {
        const controls = animate(from, to, {
            delay,
            duration: 1.1,
            ease: 'easeOut',
            onUpdate: (v) => setValue(Math.round(v)),
        });
        return () => controls.stop();
    }, [from, to, delay]);
    return <span>{value}</span>;
}

export function JoggeskoensReise({
    title = 'Hvem tjener på joggeskoen?',
}: JoggeskoensReiseProps) {
    const [phase, setPhase] = useState<Phase>('intro');
    const [coins, setCoins] = useState<Record<StationId, number>>(emptyCoins());

    const placed = STATIONS.reduce((sum, s) => sum + coins[s.id], 0);
    const potLeft = TOTAL_COINS - placed;

    const addCoin = (id: StationId) => {
        if (phase !== 'place' || potLeft <= 0) return;
        setCoins((c) => ({ ...c, [id]: c[id] + 1 }));
    };

    const removeCoin = (id: StationId) => {
        if (phase !== 'place' || coins[id] <= 0) return;
        setCoins((c) => ({ ...c, [id]: c[id] - 1 }));
    };

    const handleReset = () => {
        setPhase('intro');
        setCoins(emptyCoins());
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Footprints className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Følg joggeskoen jorda rundt, og finn ut hvor pengene havner.
                    </p>
                </div>
            </div>

            {phase !== 'complete' ? (
                <div className="p-5 sm:p-6">
                    {/* Verdensstripen med fem stasjoner */}
                    <div className="relative">
                        <svg
                            className="pointer-events-none absolute left-0 right-0 top-8 h-2 w-full"
                            viewBox="0 0 100 2"
                            preserveAspectRatio="none"
                        >
                            <motion.line
                                x1="4"
                                y1="1"
                                x2="96"
                                y2="1"
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                                vectorEffect="non-scaling-stroke"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={
                                    phase === 'intro'
                                        ? { pathLength: 0, opacity: 0 }
                                        : { pathLength: 1, opacity: 0.7 }
                                }
                                transition={
                                    phase === 'journey'
                                        ? { duration: 3, ease: 'linear' }
                                        : { duration: 0.3 }
                                }
                            />
                        </svg>

                        {/* Joggeskoen som hopper fra stasjon til stasjon */}
                        {phase === 'journey' && (
                            <motion.div
                                className="absolute -top-3 z-10 text-2xl"
                                style={{ x: '-50%' }}
                                initial={{ left: STOP_POSITIONS[0], y: 0 }}
                                animate={{
                                    left: STOP_POSITIONS,
                                    y: [0, -14, 0, -14, 0, -14, 0, -14, 0],
                                }}
                                transition={{ duration: 3, ease: 'easeInOut' }}
                                onAnimationComplete={() =>
                                    setPhase((p) => (p === 'journey' ? 'place' : p))
                                }
                            >
                                <span role="img" aria-label="joggesko">
                                    👟
                                </span>
                            </motion.div>
                        )}

                        <div className="relative grid grid-cols-5 gap-2">
                            {STATIONS.map((s, i) => {
                                const Icon = s.icon;
                                const guessVal = coins[s.id] * COIN_VALUE;
                                const delta = s.real - guessVal;
                                const close = Math.abs(delta) <= 75;
                                const clickable = phase === 'place' && potLeft > 0;
                                return (
                                    <motion.div
                                        key={s.id}
                                        onClick={() => addCoin(s.id)}
                                        whileTap={clickable ? { scale: 0.96 } : undefined}
                                        animate={
                                            phase === 'journey'
                                                ? { scale: [1, 1.07, 1] }
                                                : { scale: 1 }
                                        }
                                        transition={
                                            phase === 'journey'
                                                ? { delay: 0.15 + i * 0.72, duration: 0.35 }
                                                : undefined
                                        }
                                        className={`flex flex-col items-center rounded-xl border px-1 py-2 text-center transition-colors ${
                                            clickable
                                                ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${s.color}`} />
                                        <span className="mt-1 text-xs font-semibold text-slate-800 leading-tight">
                                            {s.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 leading-tight">
                                            {s.role}
                                        </span>

                                        {/* Mynt- og søylesone */}
                                        <div className="mt-1.5 flex h-24 w-full items-end justify-center">
                                            {phase === 'place' && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeCoin(s.id);
                                                    }}
                                                    className={`flex flex-col-reverse items-center ${
                                                        coins[s.id] > 0
                                                            ? 'cursor-pointer'
                                                            : 'cursor-default'
                                                    }`}
                                                    title={
                                                        coins[s.id] > 0
                                                            ? 'Trykk for å ta en mynt tilbake'
                                                            : undefined
                                                    }
                                                >
                                                    <AnimatePresence>
                                                        {Array.from({
                                                            length: coins[s.id],
                                                        }).map((_, c) => (
                                                            <motion.div
                                                                key={c}
                                                                initial={{
                                                                    y: -36,
                                                                    opacity: 0,
                                                                    scale: 0.5,
                                                                }}
                                                                animate={{
                                                                    y: 0,
                                                                    opacity: 1,
                                                                    scale: 1,
                                                                }}
                                                                exit={{ y: -20, opacity: 0 }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 420,
                                                                    damping: 22,
                                                                }}
                                                                className={`h-3.5 w-7 rounded-full border border-amber-500 bg-amber-300 shadow-sm ${
                                                                    c > 0 ? '-mt-2' : ''
                                                                }`}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                            {phase === 'reveal' && (
                                                <motion.div
                                                    initial={{ height: barHeight(guessVal) }}
                                                    animate={{ height: barHeight(s.real) }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 120,
                                                        damping: 16,
                                                        delay: 0.15 + i * 0.1,
                                                    }}
                                                    className="w-7 rounded-t-md border border-amber-500 bg-amber-300"
                                                />
                                            )}
                                        </div>

                                        {/* Tallrad */}
                                        <div className="mt-1 flex h-9 flex-col items-center justify-start">
                                            {phase === 'place' && (
                                                <span className="text-[11px] font-semibold text-slate-700">
                                                    {guessVal} kr
                                                </span>
                                            )}
                                            {phase === 'reveal' && (
                                                <>
                                                    <span className="text-[11px] font-bold text-slate-800">
                                                        <CountUp from={guessVal} to={s.real} /> kr
                                                    </span>
                                                    <motion.span
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 1.3 }}
                                                        className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
                                                            close
                                                                ? 'text-emerald-600'
                                                                : 'text-rose-600'
                                                        }`}
                                                    >
                                                        {delta > 0 ? (
                                                            <ArrowUp className="w-3 h-3" />
                                                        ) : (
                                                            <ArrowDown className="w-3 h-3" />
                                                        )}
                                                        {Math.abs(delta)}
                                                    </motion.span>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Oppgave- og tilbakemeldingssone */}
                    <div className="mt-4">
                        <AnimatePresence mode="wait">
                            {phase === 'intro' && (
                                <motion.div
                                    key="intro"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex flex-wrap items-center gap-3"
                                >
                                    <p className="text-sm text-amber-900 leading-snug flex-1 min-w-[200px]">
                                        Én joggesko blir til på fem steder i verden. Trykk start
                                        og følg reisen fra fabrikken til butikkhylla.
                                    </p>
                                    <button
                                        onClick={() => setPhase('journey')}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white transition-colors"
                                    >
                                        <Play className="w-4 h-4" /> Start reisen
                                    </button>
                                </motion.div>
                            )}

                            {phase === 'journey' && (
                                <motion.p
                                    key="journey"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="px-1 text-sm text-slate-500"
                                >
                                    Stoff fra Kina, sying i Vietnam, frakt over havet, design i
                                    USA og salg i Norge. Følg skoen!
                                </motion.p>
                            )}

                            {phase === 'place' && (
                                <motion.div
                                    key="place"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <Coins className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                                            <p className="text-sm text-amber-900 leading-snug">
                                                Skoen koster 1000 kroner i butikken. Fordel de ti
                                                myntene (100 kr hver) slik du tror pengene deles.
                                                Trykk på et sted for å legge en mynt der, og på
                                                mynthaugen for å ta en tilbake.
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: potLeft }).map((_, c) => (
                                                    <motion.span
                                                        key={c}
                                                        layout
                                                        className="h-3 w-6 rounded-full border border-amber-500 bg-amber-300"
                                                    />
                                                ))}
                                            </div>
                                            <motion.span
                                                key={placed}
                                                initial={{ scale: 1.2 }}
                                                animate={{ scale: 1 }}
                                                className="ml-auto text-xs font-semibold text-amber-800"
                                            >
                                                {placed} av {TOTAL_COINS} mynter plassert
                                            </motion.span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <button
                                            onClick={handleReset}
                                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Start på nytt
                                        </button>
                                        <button
                                            onClick={() => setPhase('reveal')}
                                            disabled={placed < TOTAL_COINS}
                                            className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                                                placed >= TOTAL_COINS
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Sjekk svaret
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {phase === 'reveal' && (
                                <motion.div
                                    key="reveal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.4 }}
                                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-snug flex gap-2"
                                    >
                                        <Coins className="w-5 h-5 shrink-0 text-emerald-500" />
                                        <span>
                                            Syerskene i Vietnam får 25 kroner av tusenlappen, ikke
                                            engang en halv mynt. Merkevaren i USA får mest: 430
                                            kroner. Butikken i Norge tar 375.
                                        </span>
                                    </motion.div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <button
                                            onClick={handleReset}
                                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Start på nytt
                                        </button>
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.8 }}
                                            onClick={() => setPhase('complete')}
                                            className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-2 text-sm font-medium text-white transition-colors"
                                        >
                                            Fullfør
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
                    >
                        <Check className="w-9 h-9 text-emerald-600" />
                    </motion.div>
                    <h4 className="text-lg font-bold text-slate-800">
                        Pengene fulgte merkevaren
                    </h4>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                        Varene ble globale. Pengene fulgte merkevaren, ikke arbeidet. De som
                        sydde skoen fikk 25 kroner, mens merket i USA fikk 430. Det er dette som
                        menes med at gevinsten fra globaliseringen ble delt svært ujevnt.
                    </p>
                    <div className="mt-5 flex justify-center gap-5">
                        {STATIONS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.id} className="flex flex-col items-center gap-1">
                                    <Icon className={`w-5 h-5 ${s.color}`} />
                                    <span className="text-xs font-medium text-slate-600">
                                        {s.real} kr
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleReset}
                        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Prøv igjen
                    </button>
                </motion.div>
            )}
        </div>
    );
}
