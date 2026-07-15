import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Crown, Swords, Check, RotateCcw, Landmark } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at det fantes
// flere kilder til makt i borgerkrigstiden - kongeblod, kirkens velsignelse,
// hær og rikdom - og at det til slutt ikke var kirkens velsignelse som avgjorde
// hvem som ble konge. Det var hæren.

interface LegitimitetsvektenProps {
    title?: string;
}

type Side = 'sverre' | 'magnus';

interface Round {
    claim: string;
    correct: Side;
    why: string;
}

const ROUNDS: Round[] = [
    {
        claim: 'Kronet av erkebiskopen i 1163, bare sju år gammel',
        correct: 'magnus',
        why: 'Magnus ble kronet av erkebiskop Øystein. Det gjorde ham til den første kongen i hele Norden som fikk kirkens offisielle velsignelse.',
    },
    {
        claim: 'Hevdet å være en hemmelig sønn av kong Sigurd Munn',
        correct: 'sverre',
        why: 'Sverre kom fra Færøyene og fortalte at moren hadde holdt fødselen hans hemmelig i årevis. Ingen kunne bevise historien, men den ga ham en grunn til å kreve kronen.',
    },
    {
        claim: 'Ledet en hær av fattige krigere som kalte seg birkebeinere',
        correct: 'sverre',
        why: 'Birkebeinerne var en hær av fattigfolk som manglet skikkelig fottøy. Sverre ble deres leder i 1177, og de kjempet for ham i sju harde år.',
    },
    {
        claim: 'Hadde en mektig far og rike jordeiere i ryggen',
        correct: 'magnus',
        why: 'Faren, Erling Skakke, var en av landets mektigste menn og styrte riket for sønnen sin, med støtte fra rike stormenn - helt til han falt i kamp i 1179.',
    },
];

const SIDES: Record<Side, { label: string; icon: typeof Crown; color: string }> = {
    sverre: { label: 'Sverre', icon: Swords, color: 'text-rose-600' },
    magnus: { label: 'Magnus', icon: Crown, color: 'text-amber-600' },
};

type Phase = 'playing' | 'complete';

export function Legitimitetsvekten({
    title = 'Hvem hadde retten til tronen?',
}: LegitimitetsvektenProps) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [solved, setSolved] = useState(false);
    const [wrongPick, setWrongPick] = useState<Side | null>(null);

    const round = ROUNDS[step];

    const handlePick = (side: Side) => {
        if (solved) return;
        if (side === round.correct) {
            setSolved(true);
            setWrongPick(null);
        } else {
            setWrongPick(side);
        }
    };

    const handleNext = () => {
        if (step + 1 >= ROUNDS.length) {
            setPhase('complete');
            return;
        }
        setStep((s) => s + 1);
        setSolved(false);
        setWrongPick(null);
    };

    const handleReset = () => {
        setStep(0);
        setPhase('playing');
        setSolved(false);
        setWrongPick(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Hvem hadde denne makt-kilden - Sverre eller Magnus? Klikk for å velge.
                    </p>
                </div>
                <div className="ml-auto flex gap-1.5">
                    {ROUNDS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                i < step || (i === step && solved)
                                    ? 'bg-emerald-500'
                                    : i === step
                                      ? 'bg-indigo-400'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'playing' ? (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6"
                    >
                        {/* Påstand-kort */}
                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 mb-5 flex gap-3">
                            <Landmark className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                            <p className="text-sm text-indigo-900 leading-snug">{round.claim}</p>
                        </div>

                        {/* To sider å velge mellom */}
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(SIDES) as Side[]).map((side) => {
                                const s = SIDES[side];
                                const Icon = s.icon;
                                const isCorrect = solved && side === round.correct;
                                const isWrong = wrongPick === side;
                                return (
                                    <motion.button
                                        key={side}
                                        onClick={() => handlePick(side)}
                                        disabled={solved}
                                        whileTap={!solved ? { scale: 0.96 } : undefined}
                                        animate={
                                            isWrong
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : isCorrect
                                                  ? { scale: [1, 1.06, 1] }
                                                  : { x: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.4 }}
                                        className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-5 text-center transition-colors ${
                                            isCorrect
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : isWrong
                                                  ? 'bg-rose-50 border-rose-300'
                                                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <Icon className={`w-7 h-7 ${s.color}`} />
                                        <span className="text-sm font-semibold text-slate-800">
                                            {s.label}
                                        </span>
                                        {isCorrect && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Feedback-sone */}
                        <div className="mt-5 min-h-[3.5rem]">
                            <AnimatePresence mode="wait">
                                {solved ? (
                                    <motion.div
                                        key="ok"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-snug"
                                    >
                                        {round.why}
                                    </motion.div>
                                ) : wrongPick ? (
                                    <motion.div
                                        key="no"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                                    >
                                        Ikke helt. Tenk på hvem denne makt-kilden faktisk tilhørte. Prøv
                                        igjen.
                                    </motion.div>
                                ) : (
                                    <p className="px-1 text-sm text-slate-400">
                                        Velg siden som hadde denne makt-kilden i borgerkrigen.
                                    </p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Kontrollrad */}
                        <div className="mt-2 flex items-center justify-between">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Start på nytt
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!solved}
                                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                                    solved
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {step + 1 >= ROUNDS.length ? 'Se resultatet' : 'Neste'}
                            </button>
                        </div>
                    </motion.div>
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
                            <Swords className="w-9 h-9 text-emerald-600" />
                        </motion.div>
                        <h4 className="text-lg font-bold text-slate-800">Hæren avgjorde</h4>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                            Magnus hadde kronen fra kirken og penger fra rike stormenn. Sverre hadde bare
                            en historie ingen kunne bevise, og en hær av fattige menn. Likevel var det
                            Sverre som vant til slutt. I borgerkrigen var det ikke velsignelsen som
                            avgjorde hvem som ble konge - det var hæren.
                        </p>
                        <div className="mt-5 flex justify-center gap-8">
                            {(Object.keys(SIDES) as Side[]).map((side) => {
                                const s = SIDES[side];
                                const Icon = s.icon;
                                return (
                                    <div key={side} className="flex flex-col items-center gap-1">
                                        <Icon className={`w-6 h-6 ${s.color}`} />
                                        <span className="text-xs font-medium text-slate-600">
                                            {s.label}
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
            </AnimatePresence>
        </div>
    );
}
