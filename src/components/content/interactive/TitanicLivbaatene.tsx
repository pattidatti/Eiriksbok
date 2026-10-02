import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Users, RotateCcw, ArrowRight, CheckCircle2, Ship } from 'lucide-react';

interface TitanicLivbaateneProps {
    title?: string;
}

type Phase = 'seats' | 'seatsRevealed' | 'classes' | 'complete';

// Lyspære-øyeblikket: eleven skal oppdage at hvem som overlevde Titanic ikke var flaks.
// Det var plass til litt over halvparten i livbåtene, og jo lavere klasse du reiste på,
// jo mindre var sjansen for å komme deg i en båt.
// Tallene er fra den britiske granskningen i 1912 (British Wreck Commissioner's Inquiry).
const TOTAL = 2206;
const SEATS = 1178;
const SAVED = 703;
const DOTS = 100;

interface Gruppe {
    id: string;
    label: string;
    ombord: number;
    reddet: number;
    farge: string;
}

const GRUPPER: Gruppe[] = [
    { id: 'forste', label: '1. klasse', ombord: 322, reddet: 202, farge: 'bg-amber-400' },
    { id: 'andre', label: '2. klasse', ombord: 277, reddet: 115, farge: 'bg-sky-400' },
    { id: 'tredje', label: '3. klasse', ombord: 709, reddet: 176, farge: 'bg-rose-400' },
    { id: 'mannskap', label: 'Mannskapet', ombord: 898, reddet: 210, farge: 'bg-slate-400' },
];

const pct = (a: number, b: number) => Math.round((a / b) * 100);

export function TitanicLivbaatene({ title = 'Livbåtene på Titanic' }: TitanicLivbaateneProps) {
    const [phase, setPhase] = useState<Phase>('seats');
    const [seatGuess, setSeatGuess] = useState(80);
    const [guesses, setGuesses] = useState<Record<string, number>>({
        forste: 50,
        andre: 50,
        tredje: 50,
        mannskap: 50,
    });

    const seatPct = pct(SEATS, TOTAL);
    const savedPct = pct(SAVED, TOTAL);
    const seatsShown = phase !== 'seats';

    const handleReset = () => {
        setPhase('seats');
        setSeatGuess(80);
        setGuesses({ forste: 50, andre: 50, tredje: 50, mannskap: 50 });
    };

    const dotColor = (i: number) => {
        if (!seatsShown) return i < seatGuess ? 'bg-indigo-400' : 'bg-slate-200';
        if (i < savedPct) return 'bg-emerald-500';
        if (i < seatPct) return 'bg-emerald-200';
        return 'bg-rose-300';
    };

    const feedback = (() => {
        if (phase === 'seats')
            return 'Dra glidebryteren: Hvor mange av de 2206 menneskene om bord tror du det var plass til i livbåtene?';
        if (phase === 'seatsRevealed') {
            const diff = seatGuess - seatPct;
            const omGjett =
                Math.abs(diff) <= 5
                    ? 'Du gjettet nesten helt riktig.'
                    : diff > 0
                      ? `Du gjettet ${seatGuess} prosent - det var langt færre plasser enn du trodde.`
                      : `Du gjettet ${seatGuess} prosent - det var faktisk litt flere plasser enn det.`;
            return `${omGjett} De 20 livbåtene hadde plass til ${SEATS} personer, bare ${seatPct} prosent. Og mange båter ble sendt ut halvtomme: bare ${SAVED} ble reddet (${savedPct} prosent).`;
        }
        if (phase === 'classes')
            return 'Hvor mange prosent i hver gruppe tror du kom seg i en livbåt? Still inn alle fire og trykk «Vis fasit».';
        return 'Første klasse: nesten to av tre ble reddet. Tredje klasse: bare én av fire. Plassen din på skipet bestemte mye av sjansen din.';
    })();

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <LifeBuoy className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'seats' || phase === 'seatsRevealed'
                            ? 'Steg 1 av 2: Hvor mange fikk plass?'
                            : 'Steg 2 av 2: Hvem kom seg i båtene?'}
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {(phase === 'seats' || phase === 'seatsRevealed') && (
                        <motion.div
                            key="seats"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="grid md:grid-cols-[auto_1fr] gap-6 items-center"
                        >
                            <div className="grid grid-cols-10 gap-1.5 justify-self-center">
                                {Array.from({ length: DOTS }, (_, i) => (
                                    <motion.div
                                        key={i}
                                        layout
                                        animate={{ scale: seatsShown ? [1, 1.25, 1] : 1 }}
                                        transition={{ delay: seatsShown ? i * 0.008 : 0 }}
                                        className={`w-4 h-4 rounded-full ${dotColor(i)}`}
                                    />
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Users className="w-4 h-4" />
                                    Hver prikk er rundt 22 mennesker. Til sammen {TOTAL} om bord.
                                </div>
                                {!seatsShown ? (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">
                                            Plass i livbåtene til:{' '}
                                            <span className="text-indigo-600 font-bold">
                                                {seatGuess} prosent
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={seatGuess}
                                            onChange={(e) => setSeatGuess(Number(e.target.value))}
                                            className="w-full accent-indigo-600 mt-2"
                                        />
                                    </div>
                                ) : (
                                    <motion.ul
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-1.5 text-sm text-slate-700"
                                    >
                                        <li className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                            Reddet: {SAVED} ({savedPct} %)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-200" />
                                            Tomme plasser i båtene: {SEATS - SAVED}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-rose-300" />
                                            Ingen plass i det hele tatt: {TOTAL - SEATS}
                                        </li>
                                    </motion.ul>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'classes' || phase === 'complete') && (
                        <motion.div
                            key="classes"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-3"
                        >
                            {GRUPPER.map((g) => {
                                const real = pct(g.reddet, g.ombord);
                                const guess = guesses[g.id];
                                return (
                                    <div
                                        key={g.id}
                                        className="grid grid-cols-[6.5rem_1fr_3.5rem] gap-3 items-center"
                                    >
                                        <span className="text-sm font-medium text-slate-700">
                                            {g.label}
                                        </span>
                                        <div className="relative h-7 bg-slate-100 rounded-lg overflow-hidden">
                                            {phase === 'complete' && (
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${real}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className={`absolute inset-y-0 left-0 ${g.farge}`}
                                                />
                                            )}
                                            <motion.div
                                                animate={{ left: `${guess}%` }}
                                                className="absolute inset-y-0 w-1 -ml-0.5 bg-indigo-600"
                                            />
                                            {phase === 'classes' && (
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={guess}
                                                    aria-label={`Gjett for ${g.label}`}
                                                    onChange={(e) =>
                                                        setGuesses({
                                                            ...guesses,
                                                            [g.id]: Number(e.target.value),
                                                        })
                                                    }
                                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                                />
                                            )}
                                        </div>
                                        <span className="text-sm text-right tabular-nums">
                                            {phase === 'complete' ? (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.6 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="font-bold text-slate-800"
                                                >
                                                    {real} %
                                                </motion.span>
                                            ) : (
                                                <span className="text-indigo-600 font-semibold">
                                                    {guess} %
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="inline-block w-1 h-3 bg-indigo-600" /> = din
                                gjetning. Klikk eller dra i stolpen.
                                {phase === 'complete' &&
                                    ' Fargen viser hvor mange som faktisk ble reddet.'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                        phase === 'complete'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : phase === 'seatsRevealed'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                >
                    {phase === 'complete' ? (
                        <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                        >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                        </motion.span>
                    ) : (
                        <Ship className="w-5 h-5 shrink-0" />
                    )}
                    <span>{feedback}</span>
                </motion.div>
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'seats' && (
                    <button
                        onClick={() => setPhase('seatsRevealed')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Vis svaret
                    </button>
                )}
                {phase === 'seatsRevealed' && (
                    <button
                        onClick={() => setPhase('classes')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        Hvem kom seg i båtene? <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                {phase === 'classes' && (
                    <button
                        onClick={() => setPhase('complete')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Vis fasit
                    </button>
                )}
                {phase === 'complete' && (
                    <span className="text-sm font-medium text-emerald-700">Ferdig!</span>
                )}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
