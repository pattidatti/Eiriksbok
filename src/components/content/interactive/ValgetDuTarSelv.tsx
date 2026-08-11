import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, Lock, RotateCcw, HelpCircle } from 'lucide-react';

interface ValgetDuTarSelvProps {
    title?: string;
}

type Phase = 'steps' | 'questions' | 'done';

interface Step {
    id: string;
    label: string;
    detail: string;
}

const STEPS: Step[] = [
    {
        id: 'laere',
        label: 'Lære',
        detail: 'Du studerer Bibelen slik Jehovas vitner leser den. Det tar som regel måneder eller år.',
    },
    {
        id: 'leve',
        label: 'Leve etter det',
        detail: 'Det du har lært, må endre hvordan du faktisk lever til vanlig.',
    },
    {
        id: 'angre',
        label: 'Angre',
        detail: 'Du må angre det du har gjort galt, og bestemme deg for å legge det bak deg.',
    },
    {
        id: 'innvielse',
        label: 'Innvielsesbønnen',
        detail: 'Alene ber du en bønn der du lover Gud å gjøre hans vilje. Ingen andre hører den.',
    },
    {
        id: 'samtalen',
        label: 'Samtalen',
        detail: 'De eldste i menigheten går gjennom spørsmål med deg for å se at du har forstått hva du sier ja til.',
    },
];

const QUESTIONS = [
    'Har du angret dine synder, innviet deg til Jehova og godtatt hans måte å frelse på gjennom Jesus Kristus?',
    'Forstår du at dåpen din viser at du er et av Jehovas vitner, og at du hører til Jehovas organisasjon?',
];

export function ValgetDuTarSelv({ title = 'Valget du tar selv' }: ValgetDuTarSelvProps) {
    const [phase, setPhase] = useState<Phase>('steps');
    const [doneSteps, setDoneSteps] = useState<string[]>([]);
    const [openStep, setOpenStep] = useState<string | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [shake, setShake] = useState(0);
    const [message, setMessage] = useState<string | null>(null);

    const allDone = doneSteps.length === STEPS.length;

    const handleStep = (step: Step) => {
        setOpenStep(step.id);
        if (!doneSteps.includes(step.id)) {
            setDoneSteps((prev) => [...prev, step.id]);
        }
        setMessage(step.detail);
    };

    const handleBaptism = () => {
        if (!allDone) {
            setShake((s) => s + 1);
            setMessage(
                `Ikke ennå. ${doneSteps.length} av ${STEPS.length} er på plass. Hos Jehovas vitner er dåpen slutten på en lang prosess, ikke starten på den.`
            );
            return;
        }
        setPhase('questions');
        setMessage('Nå står du opp sammen med de andre som skal døpes. Spørsmålene leses høyt.');
    };

    const handleAnswer = () => {
        if (questionIndex === 0) {
            setQuestionIndex(1);
            setMessage('Du svarte ja. Ett spørsmål igjen.');
            return;
        }
        setPhase('done');
        setMessage(null);
    };

    const handleReset = () => {
        setPhase('steps');
        setDoneSteps([]);
        setOpenStep(null);
        setQuestionIndex(0);
        setShake(0);
        setMessage(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Droplets className="w-5 h-5 text-sky-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sara er 15 år og vil bli døpt. Trykk på hvert kort for å få det på plass, og
                        prøv deretter dåpsknappen.
                    </p>
                </div>
            </div>

            <div className="p-6 pt-5">
                <AnimatePresence mode="wait">
                    {phase === 'steps' && (
                        <motion.div
                            key="steps"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
                        >
                            {STEPS.map((step, i) => {
                                const isDone = doneSteps.includes(step.id);
                                const isOpen = openStep === step.id;
                                return (
                                    <motion.button
                                        key={step.id}
                                        onClick={() => handleStep(step)}
                                        whileTap={{ scale: 0.95 }}
                                        animate={{
                                            scale: isOpen ? 1.03 : 1,
                                        }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                        className={`text-left rounded-xl border p-3 min-h-[92px] flex flex-col justify-between transition-colors ${
                                            isDone
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                                        }`}
                                    >
                                        <span
                                            className={`text-xs font-medium ${
                                                isDone ? 'text-emerald-600' : 'text-slate-400'
                                            }`}
                                        >
                                            Steg {i + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800 leading-snug">
                                            {step.label}
                                        </span>
                                        <span className="mt-1 h-5 flex items-center">
                                            {isDone ? (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 420,
                                                        damping: 16,
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-emerald-700"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> på plass
                                                </motion.span>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    ikke gjort
                                                </span>
                                            )}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}

                    {phase === 'questions' && (
                        <motion.div
                            key={`q-${questionIndex}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="rounded-xl border border-sky-200 bg-sky-50 p-5"
                        >
                            <div className="flex items-center gap-2 text-sky-700 text-xs font-medium mb-2">
                                <HelpCircle className="w-4 h-4" />
                                Spørsmål {questionIndex + 1} av 2, lest høyt foran hele salen
                            </div>
                            <p className="text-slate-800 text-base leading-relaxed">
                                {QUESTIONS[questionIndex]}
                            </p>
                            <button
                                onClick={handleAnswer}
                                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-2 text-sm font-medium transition-colors"
                            >
                                Svar ja
                            </button>
                        </motion.div>
                    )}

                    {phase === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative rounded-xl border border-sky-200 bg-white overflow-hidden min-h-[176px] flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ height: '0%' }}
                                animate={{ height: ['0%', '115%', '28%'] }}
                                transition={{
                                    duration: 2.1,
                                    times: [0, 0.55, 1],
                                    ease: 'easeInOut',
                                }}
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-300 to-sky-200"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 2.0,
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 18,
                                }}
                                className="relative z-10 text-center px-6"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 text-sm font-medium">
                                    <Check className="w-4 h-4" /> Sara er døpt
                                </span>
                                <p className="mt-3 text-sm text-slate-700 max-w-md mx-auto">
                                    Hun bøyes bakover og går helt under vann. Fra nå av regnes hun
                                    som et Jehovas vitne, og valget var hennes eget.
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mx-6 mb-4 min-h-[52px] px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={message ?? 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        {message ??
                            (phase === 'done'
                                ? 'Legg merke til at fire av de fem stegene skjedde før noen andre så det.'
                                : 'Trykk på et kort for å se hva som må være på plass før dåpen.')}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-4">
                {phase === 'steps' ? (
                    <motion.button
                        key={shake}
                        onClick={handleBaptism}
                        animate={shake > 0 ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                            allDone
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                        }`}
                    >
                        {allDone ? <Droplets className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        Døp meg
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {phase === 'questions' ? 'Du står oppreist i salen.' : 'Ferdig.'}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
