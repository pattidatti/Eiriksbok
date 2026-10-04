import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    GraduationCap,
    Plane,
    Lock,
    Globe2,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Sparkles,
} from 'lucide-react';

type Autoritet = 'universitet' | 'krig' | 'kommunisme' | 'vesten';

interface Protest {
    id: string;
    place: string;
    year: string;
    event: string;
    answer: Autoritet;
    explanation: string;
}

const AUTORITETER: { id: Autoritet; label: string; icon: typeof GraduationCap }[] = [
    { id: 'universitet', label: 'Universitetet som styrte studentene', icon: GraduationCap },
    { id: 'krig', label: 'USAs krig i Vietnam', icon: Plane },
    { id: 'kommunisme', label: 'Et kommunistisk styre', icon: Lock },
    { id: 'vesten', label: 'Vestens makt over gamle kolonier', icon: Globe2 },
];

const PROTESTER: Protest[] = [
    {
        id: 'berkeley',
        place: 'Berkeley, USA',
        year: 'Høsten 1964',
        event: 'Ledelsen ved universitetet forbyr studentene å drive politikk på campus. Studentene aksjonerer.',
        answer: 'universitet',
        explanation:
            'Studentene ville ha rett til å si meningen sin der de studerte. Det var her opprøret startet på gata.',
    },
    {
        id: 'chicago',
        place: 'Chicago, USA',
        year: 'Høsten 1968',
        event: 'Unge fra hele USA samles utenfor møtet til Det demokratiske partiet for å protestere.',
        answer: 'krig',
        explanation:
            'De ville stoppe krigen i Vietnam. Etter Tet-offensiven i januar 1968 vokste motstanden mot krigen raskt.',
    },
    {
        id: 'paris',
        place: 'Paris, Frankrike',
        year: 'Mai 1968',
        event: 'Studentene tar over universitetene og stanser all undervisning. De krever en helt ny skole.',
        answer: 'universitet',
        explanation:
            'Det startet med krav om en annen utdanning. Etter hvert streiket 8-10 millioner arbeidere, og hele landet sto stille.',
    },
    {
        id: 'praha',
        place: 'Praha, Tsjekkoslovakia',
        year: '1968',
        event: 'Studenter står i sentrum når folk krever mer frihet under Praha-våren.',
        answer: 'kommunisme',
        explanation:
            'Her protesterte de unge ikke mot kapitalismen, men mot det kommunistiske maktapparatet. Studentene tapte denne gangen.',
    },
    {
        id: 'addis',
        place: 'Addis Abeba, Etiopia',
        year: '1968',
        event: 'Studenter angriper et moteshow der det nyeste fra Vesten, miniskjørtet, skal vises fram.',
        answer: 'vesten',
        explanation:
            'Studentene så miniskjørtet som et tegn på at Vesten fortsatt prøvde å styre tidligere kolonier.',
    },
    {
        id: 'blindern',
        place: 'Blindern, Oslo',
        year: 'Slutten av 1960-tallet',
        event: 'Pedagogikkstudentene krever å få være med og bestemme hva de skal lære.',
        answer: 'universitet',
        explanation:
            'De vant fram og fikk et helt nytt studium i sosialpedagogikk. Det norske opprøret var stort sett fredelig.',
    },
];

type Phase = 'active' | 'complete';

export function Opprorstavla1968() {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('active');
    const [picked, setPicked] = useState<Autoritet | null>(null);
    const [correctFirstTry, setCorrectFirstTry] = useState(0);
    const [triedThisCard, setTriedThisCard] = useState(false);
    const [done, setDone] = useState<string[]>([]);

    const current = PROTESTER[index];
    const isCorrect = picked !== null && picked === current.answer;

    const handlePick = (a: Autoritet) => {
        if (isCorrect) return;
        setPicked(a);
        if (a === current.answer && !triedThisCard) setCorrectFirstTry((n) => n + 1);
        setTriedThisCard(true);
    };

    const handleNext = () => {
        const nextDone = [...done, current.id];
        setDone(nextDone);
        setPicked(null);
        setTriedThisCard(false);
        if (index + 1 >= PROTESTER.length) {
            setPhase('complete');
        } else {
            setIndex(index + 1);
        }
    };

    const handleReset = () => {
        setIndex(0);
        setPhase('active');
        setPicked(null);
        setCorrectFirstTry(0);
        setTriedThisCard(false);
        setDone([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">Opprørstavla 1968</h3>
                    <p className="text-sm text-slate-500">
                        Les protesten. Hvem eller hva sa de unge nei til? Velg én.
                    </p>
                </div>
            </div>

            {/* Fremdrift */}
            <div className="px-6 pt-4 flex gap-1.5">
                {PROTESTER.map((p, i) => (
                    <motion.div
                        key={p.id}
                        className="h-1.5 flex-1 rounded-full"
                        animate={{
                            backgroundColor: done.includes(p.id)
                                ? '#10b981'
                                : i === index && phase === 'active'
                                  ? '#6366f1'
                                  : '#e2e8f0',
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {phase === 'active' ? (
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.25 }}
                        className="p-6"
                    >
                        {/* Protestkort */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                                <span className="font-display font-semibold text-slate-800">
                                    {current.place}
                                </span>
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                                    {current.year}
                                </span>
                            </div>
                            <p className="text-slate-700">{current.event}</p>
                        </div>

                        {/* Valg */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AUTORITETER.map((a) => {
                                const Icon = a.icon;
                                const chosen = picked === a.id;
                                const right = chosen && a.id === current.answer;
                                const wrong = chosen && a.id !== current.answer;
                                return (
                                    <motion.button
                                        key={a.id}
                                        onClick={() => handlePick(a.id)}
                                        whileHover={isCorrect ? undefined : { scale: 1.02 }}
                                        whileTap={isCorrect ? undefined : { scale: 0.97 }}
                                        animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                                        transition={{ duration: 0.35 }}
                                        disabled={isCorrect}
                                        className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 text-sm font-medium ${
                                            right
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                : wrong
                                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                  : 'bg-white border-slate-200 text-slate-700 hover:shadow-md'
                                        } ${isCorrect && !right ? 'opacity-50' : ''}`}
                                    >
                                        <Icon className="w-5 h-5 shrink-0" />
                                        {a.label}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Feedback-sone */}
                        <div className="min-h-[4.5rem] mt-4">
                            <AnimatePresence mode="wait">
                                {picked === null ? (
                                    <motion.p
                                        key="hint"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                                    >
                                        Protest {index + 1} av {PROTESTER.length}. Tenk: Hvem
                                        bestemte over de unge her?
                                    </motion.p>
                                ) : isCorrect ? (
                                    <motion.div
                                        key="right"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <span>{current.explanation}</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={`wrong-${picked}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2"
                                    >
                                        <XCircle className="w-5 h-5 shrink-0" />
                                        <span>
                                            Ikke helt. Les kortet en gang til og prøv et annet svar.
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="p-6"
                    >
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 12,
                                    delay: 0.1,
                                }}
                                className="inline-flex"
                            >
                                <Sparkles className="w-8 h-8 text-emerald-500" />
                            </motion.div>
                            <p className="font-display text-lg font-semibold text-emerald-800 mt-2">
                                Den røde tråden
                            </p>
                            <p className="text-emerald-700 mt-1">
                                Seks steder, fire ulike motstandere. Men i alle seks sa unge nei til
                                noen som bestemte over dem. Det er derfor vi snakker om «1968» som
                                ett opprør.
                            </p>
                            <p className="text-sm text-emerald-600 mt-3">
                                Riktig på første forsøk: {correctFirstTry} av {PROTESTER.length}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'active' ? (
                    <button
                        onClick={handleNext}
                        disabled={!isCorrect}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 >= PROTESTER.length ? 'Se mønsteret' : 'Neste protest'}
                    </button>
                ) : (
                    <span />
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
