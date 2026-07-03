import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Gavel, Crown, Scale, Check, RotateCcw, ShieldCheck } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at de tre
// statsmaktene i USA passer på hverandre. Når én av dem prøver å ta for mye
// makt, er det en av de andre som kan stoppe den. Det er derfor ingen kan bli
// konge igjen: makten er delt, og hver del kontrollerer de andre.

interface MaktfordelingSjekkProps {
    title?: string;
}

type BranchId = 'kongress' | 'president' | 'hoyesterett';

interface Branch {
    id: BranchId;
    label: string;
    role: string;
    icon: typeof Landmark;
    color: string;
}

const BRANCHES: Record<BranchId, Branch> = {
    kongress: {
        id: 'kongress',
        label: 'Kongressen',
        role: 'lager lovene',
        icon: Landmark,
        color: 'text-blue-600',
    },
    president: {
        id: 'president',
        label: 'Presidenten',
        role: 'styrer landet',
        icon: Crown,
        color: 'text-rose-600',
    },
    hoyesterett: {
        id: 'hoyesterett',
        label: 'Høyesterett',
        role: 'dømmer etter loven',
        icon: Gavel,
        color: 'text-emerald-600',
    },
};

interface Scenario {
    threat: string;
    overreach: BranchId; // hvem som prøver å ta for mye makt
    checker: BranchId; // hvem som kan stoppe det
    why: string;
}

const SCENARIOS: Scenario[] = [
    {
        threat: 'Presidenten vil sende hæren i krig mot et annet land helt på egen hånd.',
        overreach: 'president',
        checker: 'kongress',
        why: 'Bare Kongressen kan erklære krig og bestemme over pengene. Uten et ja fra Kongressen får ikke presidenten penger til krigen. Kongressen kan til og med avsette en president som går for langt.',
    },
    {
        threat: 'Kongressen vedtar en lov som gir alle rike familier lavere skatt enn andre.',
        overreach: 'kongress',
        checker: 'president',
        why: 'Presidenten kan legge ned veto. Det betyr at presidenten nekter å skrive under, og da blir loven stoppet med mindre et stort flertall i Kongressen vil ha den likevel.',
    },
    {
        threat: 'Kongressen presser gjennom en lov som forbyr folk å kritisere staten.',
        overreach: 'kongress',
        checker: 'hoyesterett',
        why: 'Høyesterett kan kjenne loven grunnlovsstridig. Loven bryter ytringsfriheten som grunnloven verner om, og da gjelder den ikke lenger.',
    },
];

type Phase = 'playing' | 'complete';

export function MaktfordelingSjekk({
    title = 'Hvem stopper hvem?',
}: MaktfordelingSjekkProps) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [solved, setSolved] = useState(false);
    const [wrongPick, setWrongPick] = useState<BranchId | null>(null);

    const scenario = SCENARIOS[step];

    const handlePick = (id: BranchId) => {
        if (solved || id === scenario.overreach) return;
        if (id === scenario.checker) {
            setSolved(true);
            setWrongPick(null);
        } else {
            setWrongPick(id);
        }
    };

    const handleNext = () => {
        if (step + 1 >= SCENARIOS.length) {
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
                        Én statsmakt tar for mye makt. Klikk den som kan stoppe den.
                    </p>
                </div>
                <div className="ml-auto flex gap-1.5">
                    {SCENARIOS.map((_, i) => (
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
                        {/* Trussel-kort */}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-5 flex gap-3">
                            <span className="mt-0.5 text-amber-500 font-bold">Faren:</span>
                            <p className="text-sm text-amber-900 leading-snug">{scenario.threat}</p>
                        </div>

                        {/* Tre statsmakter */}
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(BRANCHES) as BranchId[]).map((id) => {
                                const b = BRANCHES[id];
                                const Icon = b.icon;
                                const isOverreach = id === scenario.overreach;
                                const isCorrect = solved && id === scenario.checker;
                                const isWrong = wrongPick === id;
                                return (
                                    <motion.button
                                        key={id}
                                        onClick={() => handlePick(id)}
                                        disabled={isOverreach || solved}
                                        whileTap={!isOverreach && !solved ? { scale: 0.96 } : undefined}
                                        animate={
                                            isWrong
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : isCorrect
                                                  ? { scale: [1, 1.06, 1] }
                                                  : { x: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.4 }}
                                        className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-colors ${
                                            isCorrect
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : isWrong
                                                  ? 'bg-rose-50 border-rose-300'
                                                  : isOverreach
                                                    ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed'
                                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <Icon
                                            className={`w-6 h-6 ${isOverreach ? 'text-slate-400' : b.color}`}
                                        />
                                        <span className="text-sm font-semibold text-slate-800">
                                            {b.label}
                                        </span>
                                        <span className="text-[11px] text-slate-500 leading-tight">
                                            {b.role}
                                        </span>
                                        {isOverreach && (
                                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                                <Crown className="w-3 h-3" /> tar for mye makt
                                            </span>
                                        )}
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
                                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-snug flex gap-2"
                                    >
                                        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
                                        <span>{scenario.why}</span>
                                    </motion.div>
                                ) : wrongPick ? (
                                    <motion.div
                                        key="no"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                                    >
                                        Ikke helt. Den statsmakten har ikke noe grep her. Prøv en
                                        annen.
                                    </motion.div>
                                ) : (
                                    <p className="px-1 text-sm text-slate-400">
                                        Velg den statsmakten som har et grep som stopper faren.
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
                                {step + 1 >= SCENARIOS.length ? 'Fullfør' : 'Neste'}
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
                            <ShieldCheck className="w-9 h-9 text-emerald-600" />
                        </motion.div>
                        <h4 className="text-lg font-bold text-slate-800">Republikken står</h4>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                            Hver gang én statsmakt prøvde å ta for mye, var det en annen som kunne
                            stoppe den. Kongressen, presidenten og Høyesterett passer på hverandre.
                            Det er derfor ingen kan samle all makten og bli en ny konge.
                        </p>
                        <div className="mt-5 flex justify-center gap-6">
                            {(Object.keys(BRANCHES) as BranchId[]).map((id) => {
                                const b = BRANCHES[id];
                                const Icon = b.icon;
                                return (
                                    <div key={id} className="flex flex-col items-center gap-1">
                                        <Icon className={`w-6 h-6 ${b.color}`} />
                                        <span className="text-xs font-medium text-slate-600">
                                            {b.label}
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
