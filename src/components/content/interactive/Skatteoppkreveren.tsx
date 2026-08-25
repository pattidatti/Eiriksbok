import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Crown, RotateCcw, Landmark } from 'lucide-react';

interface SkatteoppkreverenProps {
    title?: string;
    /** Navnet på khanens hovedstad som skatten sendes til. */
    khanTitle?: string;
    /** Hvor mange år (runder) eleven fordeler rollen på. */
    rounds?: number;
    /** Byene som konkurrerer om å bli oppkrever. Første by er den historiske vinneren. */
    cities?: string[];
}

type Phase = 'idle' | 'chosen' | 'collecting' | 'complete';

const START_POWER = 22;
const COLLECTOR_GAIN = 17;
const OTHERS_LOSS = 5;
const MIN_POWER = 4;
const MAX_POWER = 100;
const SILVER_PER_YEAR = 30;

export function Skatteoppkreveren({
    title = 'Skatteoppkreveren',
    khanTitle = 'Khanen i Saraj',
    rounds = 3,
    cities = ['Moskva', 'Tver', 'Novgorod', 'Rjazan'],
}: SkatteoppkreverenProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [round, setRound] = useState(0);
    const [chosen, setChosen] = useState<number | null>(null);
    const [power, setPower] = useState<number[]>(() => cities.map(() => START_POWER));
    const [silver, setSilver] = useState(0);
    const [picks, setPicks] = useState<number[]>([]);

    const handleReset = () => {
        setPhase('idle');
        setRound(0);
        setChosen(null);
        setPower(cities.map(() => START_POWER));
        setSilver(0);
        setPicks([]);
    };

    const handlePick = (i: number) => {
        if (phase === 'collecting' || phase === 'complete') return;
        setChosen(i);
        setPhase('chosen');
    };

    const handleCollect = () => {
        if (chosen === null || phase !== 'chosen') return;
        setPhase('collecting');
        window.setTimeout(() => {
            setPower((prev) =>
                prev.map((p, i) =>
                    i === chosen
                        ? Math.min(MAX_POWER, p + COLLECTOR_GAIN)
                        : Math.max(MIN_POWER, p - OTHERS_LOSS)
                )
            );
            setSilver((s) => s + SILVER_PER_YEAR);
            setPicks((prev) => [...prev, chosen]);
            const nextRound = round + 1;
            setRound(nextRound);
            setPhase(nextRound >= rounds ? 'complete' : 'chosen');
        }, 1150);
    };

    // Hvem holdt rollen flest år, og holdt noen den nesten hele tiden?
    const tally = cities.map((_, i) => picks.filter((p) => p === i).length);
    const topIndex = tally.indexOf(Math.max(...tally));
    const heldByOne = tally[topIndex] >= rounds - 1 && rounds > 1;
    const strongest = power.indexOf(Math.max(...power));

    const feedback = (() => {
        if (phase === 'idle')
            return {
                tone: 'neutral' as const,
                text: 'Alle fire byene er omtrent like sterke. Khanen trenger én av dem til å kreve inn skatten for seg.',
            };
        if (phase === 'chosen' && round === 0)
            return {
                tone: 'neutral' as const,
                text: `${cities[chosen ?? 0]} er valgt. Trykk "Krev inn skatten" og se hvor sølvet tar veien.`,
            };
        if (phase === 'collecting')
            return {
                tone: 'neutral' as const,
                text: `De andre byene betaler til ${cities[chosen ?? 0]}. Derfra går det meste videre til khanen.`,
            };
        if (phase === 'complete')
            return heldByOne
                ? {
                      tone: 'success' as const,
                      text: `${cities[topIndex]} krevde inn skatten år etter år, og ble mye sterkere enn naboene. Byen slo aldri khanen. Den jobbet for ham.`,
                  }
                : {
                      tone: 'success' as const,
                      text: 'Du lot rollen gå på omgang, og da vokste ingen seg virkelig stor. Khanen gjorde det motsatte: han holdt seg til Moskva, og Moskva vokste.',
                  };
        return {
            tone: 'neutral' as const,
            text: `År ${round} av ${rounds} er unnagjort. Velg hvem som skal kreve inn neste år.`,
        };
    })();

    const toneClass =
        feedback.tone === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Coins className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hvilken by som skal kreve inn skatten for khanen. Gjør det {rounds}{' '}
                        ganger, og se hva som skjer med byene.
                    </p>
                </div>
            </div>

            {/* Byene */}
            <div className="px-6 pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {cities.map((city, i) => {
                        const isChosen = chosen === i;
                        const locked = phase === 'collecting' || phase === 'complete';
                        return (
                            <motion.button
                                key={city}
                                onClick={() => handlePick(i)}
                                disabled={locked}
                                animate={{
                                    scale: isChosen && phase === 'collecting' ? 1.05 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                className={`text-left rounded-xl border p-3 ${
                                    isChosen
                                        ? 'border-amber-300 bg-amber-50 shadow-md'
                                        : 'border-slate-200 bg-slate-50 shadow-sm hover:shadow-md'
                                } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {city}
                                    </span>
                                    {isChosen && (
                                        <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                                    )}
                                </div>

                                {/* Makt-stolpe */}
                                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${
                                            isChosen ? 'bg-amber-500' : 'bg-slate-400'
                                        }`}
                                        animate={{ width: `${power[i]}%` }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 120,
                                            damping: 20,
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Makt {Math.round(power[i])}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Sølvstrømmen ned til khanen */}
            <div className="px-6 pt-4">
                <div className="relative h-12 flex items-center justify-center">
                    <AnimatePresence>
                        {phase === 'collecting' &&
                            [0, 1, 2, 3, 4].map((n) => (
                                <motion.span
                                    key={n}
                                    initial={{ y: -22, opacity: 0, scale: 0.6 }}
                                    animate={{ y: 22, opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.7, delay: n * 0.11 }}
                                    style={{ left: `${42 + n * 4}%` }}
                                    className="absolute block w-3 h-3 rounded-full bg-amber-400 border border-amber-500"
                                />
                            ))}
                    </AnimatePresence>
                    {phase !== 'collecting' && (
                        <span className="text-xs text-slate-400">
                            Skatten går fra byene, via oppkreveren, videre til khanen
                        </span>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Landmark className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                            {khanTitle}
                        </span>
                    </div>
                    <span className="text-sm text-slate-600 shrink-0">
                        Mottatt sølv: <span className="font-semibold">{silver}</span>
                    </span>
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${phase}-${round}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-6 mt-4 px-4 py-3 rounded-lg border text-sm ${toneClass}`}
                >
                    {phase === 'complete' && (
                        <motion.span
                            initial={{ scale: 0.4, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            className="inline-flex mr-2 align-middle"
                        >
                            <Crown className="w-4 h-4 text-emerald-600" />
                        </motion.span>
                    )}
                    {feedback.text}
                    {phase === 'complete' && (
                        <span className="block mt-1 text-emerald-800/80">
                            Sterkest til slutt: {cities[strongest]} med {Math.round(power[strongest])}{' '}
                            i makt.
                        </span>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between gap-3">
                <button
                    onClick={handleCollect}
                    disabled={phase !== 'chosen'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        phase === 'chosen'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {phase === 'complete'
                        ? 'Ferdig'
                        : round === 0
                          ? 'Krev inn skatten'
                          : `Krev inn skatten (år ${round + 1})`}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
