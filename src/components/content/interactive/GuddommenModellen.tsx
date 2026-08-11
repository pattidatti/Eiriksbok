import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, RotateCcw, Sparkles } from 'lucide-react';

interface GuddommenModellenProps {
    title?: string;
}

type Step = 0 | 1 | 2 | 3;
type Shape = 'ett' | 'tre';
type Body = 'kropp' | 'and';
type MemberId = 'faderen' | 'sonnen' | 'anden';
type Bond = 'vesen' | 'hensikt' | 'ingenting';

interface Member {
    id: MemberId;
    name: string;
    correct: Body;
}

const MEMBERS: Member[] = [
    { id: 'faderen', name: 'Faderen', correct: 'kropp' },
    { id: 'sonnen', name: 'Jesus Kristus', correct: 'kropp' },
    { id: 'anden', name: 'Den hellige ånd', correct: 'and' },
];

const BODY_LABEL: Record<Body, string> = {
    kropp: 'Kropp av kjøtt og bein',
    and: 'Ånd uten kropp',
};

const STEP_TITLES = [
    'Ett vesen, eller tre?',
    'Hvem har kropp?',
    'Hva binder dem sammen?',
    'Modellen er ferdig',
];

export function GuddommenModellen({
    title = 'Sett sammen modellen av Guddommen',
}: GuddommenModellenProps) {
    const [step, setStep] = useState<Step>(0);
    const [shape, setShape] = useState<Shape | null>(null);
    const [bodies, setBodies] = useState<Partial<Record<MemberId, Body>>>({});
    const [bond, setBond] = useState<Bond | null>(null);
    const [feedback, setFeedback] = useState<{ tone: 'ok' | 'off'; text: string } | null>(null);
    const [showWrong, setShowWrong] = useState(false);

    const handleReset = () => {
        setStep(0);
        setShape(null);
        setBodies({});
        setBond(null);
        setFeedback(null);
        setShowWrong(false);
    };

    const chooseShape = (value: Shape) => {
        setShape(value);
        if (value === 'tre') {
            setFeedback({
                tone: 'ok',
                text: 'Riktig. Siste dagers hellige lærer at Faderen, Sønnen og Den hellige ånd er tre atskilte personer.',
            });
            setStep(1);
        } else {
            setFeedback({
                tone: 'off',
                text: 'Dette er treenighetslæren, slik de fleste andre kristne kirker beskriver Gud. Siste dagers hellige svarer noe annet. Prøv igjen.',
            });
        }
    };

    const setBody = (id: MemberId, value: Body) => {
        setBodies((prev) => ({ ...prev, [id]: value }));
        setShowWrong(false);
        setFeedback(null);
    };

    const checkBodies = () => {
        const wrong = MEMBERS.filter((m) => bodies[m.id] !== m.correct);
        if (wrong.length === 0) {
            setFeedback({
                tone: 'ok',
                text: 'Riktig. Faderen og Sønnen har kropp. Den hellige ånd er en ånd, og kan derfor bo i mennesker.',
            });
            setStep(2);
        } else {
            setShowWrong(true);
            setFeedback({
                tone: 'off',
                text: `${3 - wrong.length} av 3 stemmer. De røde kortene må endres. Husk at Den hellige ånd skiller seg fra de to andre.`,
            });
        }
    };

    const chooseBond = (value: Bond) => {
        setBond(value);
        if (value === 'hensikt') {
            setFeedback({
                tone: 'ok',
                text: 'Riktig. De er tre vesener som vil det samme. Enheten ligger i viljen, ikke i selve vesenet.',
            });
            setStep(3);
        } else if (value === 'vesen') {
            setFeedback({
                tone: 'off',
                text: 'Da ville de vært ett, og ikke tre. Det er nettopp dette siste dagers hellige mener annerledes enn andre kristne. Prøv igjen.',
            });
        } else {
            setFeedback({
                tone: 'off',
                text: 'Nei, de holdes sammen av noe. Spørsmålet er av hva. Prøv igjen.',
            });
        }
    };

    const allBodiesSet = MEMBERS.every((m) => bodies[m.id]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tre valg. Svar slik Jesu Kristi Kirke av Siste Dagers Hellige lærer det.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            animate={{
                                scale: step === i ? 1.25 : 1,
                                opacity: step > i ? 1 : step === i ? 1 : 0.35,
                            }}
                            className={`w-2 h-2 rounded-full ${
                                step > i ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="px-6 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Steg {Math.min(step + 1, 3)} av 3
                </p>
                <p className="text-lg font-semibold text-slate-800 mt-0.5">{STEP_TITLES[step]}</p>
            </div>

            <div className="px-6 py-4">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid sm:grid-cols-2 gap-3"
                        >
                            <button
                                onClick={() => chooseShape('ett')}
                                className={`text-left p-4 rounded-xl border transition-colors ${
                                    shape === 'ett'
                                        ? 'bg-rose-50 border-rose-200'
                                        : 'bg-slate-50 border-slate-200 hover:shadow-md'
                                }`}
                            >
                                <svg viewBox="0 0 120 60" className="w-28 h-14 mb-2">
                                    <circle cx="45" cy="30" r="20" className="fill-indigo-200/70" />
                                    <circle cx="60" cy="30" r="20" className="fill-indigo-300/70" />
                                    <circle cx="75" cy="30" r="20" className="fill-indigo-400/60" />
                                </svg>
                                <p className="font-semibold text-slate-800">Ett vesen</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Faderen, Sønnen og Den hellige ånd er tre sider ved det samme
                                    vesenet.
                                </p>
                            </button>
                            <button
                                onClick={() => chooseShape('tre')}
                                className={`text-left p-4 rounded-xl border transition-colors ${
                                    shape === 'tre'
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-slate-50 border-slate-200 hover:shadow-md'
                                }`}
                            >
                                <svg viewBox="0 0 120 60" className="w-28 h-14 mb-2">
                                    <circle cx="25" cy="30" r="18" className="fill-indigo-300/70" />
                                    <circle cx="60" cy="30" r="18" className="fill-indigo-300/70" />
                                    <circle cx="95" cy="30" r="18" className="fill-indigo-300/70" />
                                </svg>
                                <p className="font-semibold text-slate-800">Tre vesener</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Faderen, Sønnen og Den hellige ånd er tre atskilte personer.
                                </p>
                            </button>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid sm:grid-cols-3 gap-3"
                        >
                            {MEMBERS.map((m) => {
                                const picked = bodies[m.id];
                                const isWrong = showWrong && picked !== m.correct;
                                return (
                                    <div
                                        key={m.id}
                                        className={`p-4 rounded-xl border ${
                                            isWrong
                                                ? 'bg-rose-50 border-rose-200'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <p className="font-semibold text-slate-800 mb-2">
                                            {m.name}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {(['kropp', 'and'] as Body[]).map((b) => (
                                                <button
                                                    key={b}
                                                    onClick={() => setBody(m.id, b)}
                                                    className={`text-sm text-left px-3 py-2 rounded-lg border transition-colors ${
                                                        picked === b
                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {BODY_LABEL[b]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid sm:grid-cols-3 gap-3"
                        >
                            {(
                                [
                                    { id: 'vesen', label: 'De er ett vesen' },
                                    { id: 'hensikt', label: 'De er ett i hensikt' },
                                    { id: 'ingenting', label: 'Ingenting binder dem' },
                                ] as { id: Bond; label: string }[]
                            ).map((o) => (
                                <button
                                    key={o.id}
                                    onClick={() => chooseBond(o.id)}
                                    className={`p-4 rounded-xl border text-left font-medium transition-colors ${
                                        bond === o.id
                                            ? o.id === 'hensikt'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-rose-50 border-rose-200 text-rose-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:shadow-md'
                                    }`}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative"
                        >
                            <div className="grid grid-cols-3 gap-3">
                                {MEMBERS.map((m, i) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 16, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            delay: i * 0.12,
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 18,
                                        }}
                                        className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-center"
                                    >
                                        <div className="mx-auto w-10 h-10 rounded-full bg-white border border-emerald-200 flex items-center justify-center mb-2">
                                            <Sparkles className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="font-semibold text-slate-800 text-sm">
                                            {m.name}
                                        </p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            {BODY_LABEL[m.correct]}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.45, duration: 0.5 }}
                                className="mt-4 h-1 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 origin-center"
                            />
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="text-center text-sm font-semibold text-amber-700 mt-2"
                            >
                                Tre vesener, ett i hensikt
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback ? feedback.text : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            !feedback
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : feedback.tone === 'ok'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {feedback
                            ? feedback.text
                            : 'Velg et alternativ, så får du svar med en gang.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex items-center justify-between gap-3">
                {step === 1 ? (
                    <button
                        onClick={checkBodies}
                        disabled={!allBodiesSet}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Sjekk svaret
                    </button>
                ) : step === 3 ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <Check className="w-4 h-4" /> Ferdig
                    </span>
                ) : (
                    <span className="text-sm text-slate-400">Klikk på et kort for å svare</span>
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
