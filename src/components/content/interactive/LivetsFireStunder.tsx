import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Church, Target, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal oppdage at sekulariseringen ikke har truffet
// hele livet likt. Færrest bruker kirken ved livets begynnelse, flest ved
// livets slutt - og gravferden ligger til og med høyere enn medlemstallet.
// Eleven gjetter først, og blir dermed overrasket av sitt eget svar.

interface Stund {
    id: string;
    label: string;
    question: string;
    unit: string;
    answer: number;
    note: string;
}

const STUNDER: Stund[] = [
    {
        id: 'medlem',
        label: 'Medlem i Den norske kirke',
        question: 'Hvor mange av 100 som bor i Norge er medlem i Den norske kirke?',
        unit: 'av 100 som bor i Norge',
        answer: 61,
        note: 'I 1994 var tallet 85 av 100. På tretti år har altså rundt en fjerdedel av befolkningen forsvunnet ut av kirken.',
    },
    {
        id: 'daap',
        label: 'Døpt som barn',
        question: 'Hvor mange av 100 nyfødte blir døpt i Den norske kirke?',
        unit: 'av 100 som blir født',
        answer: 52,
        note: 'I 2001 ble 80 av 100 barn døpt. Dåpen er det stedet i livet der kirken har mistet flest, og raskest.',
    },
    {
        id: 'konfirmasjon',
        label: 'Konfirmert i kirken',
        question: 'Hvor mange av 100 femtenåringer konfirmerer seg i Den norske kirke?',
        unit: 'av 100 femtenåringer',
        answer: 49,
        note: 'Under halvparten. Resten velger borgerlig konfirmasjon, et annet trossamfunn, eller ingenting.',
    },
    {
        id: 'gravferd',
        label: 'Gravferd i kirken',
        question: 'Hvor mange av 100 som dør får en gravferd i regi av Den norske kirke?',
        unit: 'av 100 som dør',
        answer: 80,
        note: 'Legg merke til at dette tallet er høyere enn medlemstallet. Kirken holder aller lengst på slutten av livet.',
    },
];

type Phase = 'guessing' | 'revealed';

interface LivetsFireStunderProps {
    title?: string;
}

export function LivetsFireStunder({
    title = 'Fire tall om kirken i Norge',
}: LivetsFireStunderProps) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>('guessing');
    const [guess, setGuess] = useState(50);
    const [guesses, setGuesses] = useState<number[]>([]);

    const done = step >= STUNDER.length;
    const stund = done ? STUNDER[STUNDER.length - 1] : STUNDER[step];

    const diff = Math.abs(guess - stund.answer);
    const treff = diff <= 5 ? 'blink' : diff <= 15 ? 'nær' : 'unna';

    const handleReveal = () => {
        setGuesses((g) => [...g, guess]);
        setPhase('revealed');
    };

    const handleNext = () => {
        setStep((s) => s + 1);
        setPhase('guessing');
        setGuess(50);
    };

    const handleReset = () => {
        setStep(0);
        setPhase('guessing');
        setGuess(50);
        setGuesses([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Church className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra spaken til det tallet du tror er riktig, og se fasiten.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                {!done ? (
                    <>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                                {step + 1} av {STUNDER.length}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                {stund.label}
                            </span>
                        </div>
                        <p className="text-slate-800 font-medium mb-5">{stund.question}</p>

                        {/* Måleren */}
                        <div className="relative h-12 rounded-lg bg-slate-100 overflow-hidden mb-2">
                            {/* Fasit-søyle */}
                            <AnimatePresence>
                                {phase === 'revealed' && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stund.answer}%` }}
                                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                                        className="absolute inset-y-0 left-0 bg-emerald-400/70"
                                    />
                                )}
                            </AnimatePresence>
                            {/* Elevens gjett som markør */}
                            <motion.div
                                animate={{ left: `${guess}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                className="absolute inset-y-0 w-1 bg-indigo-600"
                            />
                            <motion.div
                                animate={{ left: `${guess}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                className="absolute top-1 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold tabular-nums"
                            >
                                {guess}
                            </motion.div>
                            {phase === 'revealed' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute bottom-1 left-0 w-full flex"
                                >
                                    <span
                                        className="text-[11px] font-bold text-emerald-800 tabular-nums pl-2"
                                        style={{ marginLeft: `${Math.max(0, stund.answer - 12)}%` }}
                                    >
                                        Fasit: {stund.answer}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={guess}
                            disabled={phase === 'revealed'}
                            onChange={(e) => setGuess(Number(e.target.value))}
                            aria-label={stund.question}
                            className="w-full accent-indigo-600 disabled:opacity-40"
                        />
                        <p className="text-xs text-slate-400 mt-1">{stund.unit}</p>
                    </>
                ) : (
                    <div className="space-y-3">
                        {STUNDER.map((s, i) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.12 }}
                            >
                                <div className="flex items-baseline justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700">{s.label}</span>
                                    <span className="tabular-nums text-slate-500">
                                        du gjettet {guesses[i]} - riktig var {s.answer}
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${s.answer}%` }}
                                        transition={{ delay: i * 0.12 + 0.1, duration: 0.6 }}
                                        className={
                                            s.id === 'gravferd'
                                                ? 'h-full bg-indigo-500'
                                                : 'h-full bg-slate-400'
                                        }
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed flex gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Se på den siste søylen. Flere får gravferd i kirken enn det er
                                medlemmer i kirken, og langt flere enn det er barn som blir døpt.
                                Sekulariseringen har altså ikke truffet hele livet likt: kirken har
                                mistet begynnelsen av livet raskest, og holder fortsatt på slutten.
                            </span>
                        </motion.div>
                    ) : phase === 'revealed' ? (
                        <motion.div
                            key={`svar-${stund.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                                treff === 'unna'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}
                        >
                            <span className="font-semibold">
                                {treff === 'blink'
                                    ? 'Blink! '
                                    : treff === 'nær'
                                      ? 'Nesten. '
                                      : `Du bommet med ${diff}. `}
                            </span>
                            {stund.note}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="venter"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Tallene gjelder Norge i 2025. Gjett først, så får du fasiten.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {!done ? (
                    phase === 'guessing' ? (
                        <button
                            onClick={handleReveal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <Target className="w-4 h-4" />
                            Vis fasiten
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {step === STUNDER.length - 1 ? 'Se alle fire' : 'Neste tall'}
                        </button>
                    )
                ) : (
                    <span className="text-sm text-slate-500">Kilde: Statistisk sentralbyrå.</span>
                )}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
