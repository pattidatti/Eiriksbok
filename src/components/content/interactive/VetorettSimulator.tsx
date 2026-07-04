import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Crown, RotateCcw, ShieldCheck, Gavel, Lightbulb } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at stemmene i
// FNs sikkerhetsråd ikke teller likt. 14 land mot 1 taper - hvis den ene har
// vetorett. De fem som vant andre verdenskrig ga seg selv nøklene i 1945, og
// regelen er helt uendret i dag.

interface VetorettSimulatorProps {
    title?: string;
}

type Vote = 'ja' | 'nei';

interface Member {
    id: string;
    name: string;
    flag: string;
    permanent: boolean;
}

const MEMBERS: Member[] = [
    { id: 'usa', name: 'USA', flag: '🇺🇸', permanent: true },
    { id: 'sovjet', name: 'Sovjetunionen', flag: '🇷🇺', permanent: true },
    { id: 'storbritannia', name: 'Storbritannia', flag: '🇬🇧', permanent: true },
    { id: 'frankrike', name: 'Frankrike', flag: '🇫🇷', permanent: true },
    { id: 'kina', name: 'Kina', flag: '🇨🇳', permanent: true },
    { id: 'norge', name: 'Norge', flag: '🇳🇴', permanent: false },
    { id: 'brasil', name: 'Brasil', flag: '🇧🇷', permanent: false },
    { id: 'kenya', name: 'Kenya', flag: '🇰🇪', permanent: false },
    { id: 'japan', name: 'Japan', flag: '🇯🇵', permanent: false },
    { id: 'mexico', name: 'Mexico', flag: '🇲🇽', permanent: false },
    { id: 'polen', name: 'Polen', flag: '🇵🇱', permanent: false },
    { id: 'irland', name: 'Irland', flag: '🇮🇪', permanent: false },
    { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', permanent: false },
    { id: 'malta', name: 'Malta', flag: '🇲🇹', permanent: false },
    { id: 'ghana', name: 'Ghana', flag: '🇬🇭', permanent: false },
];

const PERMANENT_IDS = new Set(MEMBERS.filter((m) => m.permanent).map((m) => m.id));

interface Scenario {
    proposal: string;
    task: string;
    presetNei: string[];
    /** Hvis satt: bare dette kortet kan trykkes, og det pulserer som hint. */
    onlyClickable?: string;
    why: string;
}

const SCENARIOS: Scenario[] = [
    {
        proposal:
            'Krig har brutt ut mellom to land. Forslag til vedtak: Umiddelbar våpenhvile. Alle soldater trekkes tilbake.',
        task: 'Prøv deg fram: trykk på kortene og endre stemmer. Klarer du å stoppe forslaget? Legg merke til forskjellen på grå og gylne kort.',
        presetNei: [],
        why: 'Så du forskjellen? Du kan snu opptil seks grå kort uten at forslaget faller. Men ett eneste nei fra et gyllent kort blokkerer alt. 14 mot 1 taper - når den ene har vetorett.',
    },
    {
        proposal:
            'En av de fem stormaktene har selv gått til krig mot naboen sin. Forslag til vedtak: Angrepet fordømmes, og soldatene må trekkes ut.',
        task: 'Hele resten av verden stemmer ja. Men Sovjetunionen sitter selv ved bordet. Hva tror du de stemmer? Trykk på kortet deres.',
        presetNei: [],
        onlyClickable: 'sovjet',
        why: 'Angriperen dømmer i sin egen sak. Sovjetunionen trengte bare sitt eget nei, så var saken død - selv med 14 land mot seg. Slik har stormaktene blokkert FN hundrevis av ganger siden 1945, ofte i saker der de selv er part.',
    },
    {
        proposal:
            'Et lite land er angrepet av naboen sin. Ingen av de fem stormaktene er med i konflikten. Forslag til vedtak: Våpenhvile og fredsstyrker fra FN.',
        task: 'Forslaget trenger minst 9 ja-stemmer. Flere land nøler. Overbevis dem: trykk på kort for å snu dem til ja.',
        presetNei: ['brasil', 'mexico', 'polen', 'irland', 'ecuador', 'malta', 'ghana'],
        why: 'Nå virket systemet! Ingen stormakt var part i saken, så ingen brukte veto. Da teller stemmene, og FN kan sende fredsstyrker. Sikkerhetsrådet kan fungere - så lenge de fem store holder seg utenfor.',
    },
];

type Phase = 'playing' | 'complete';

function buildVotes(scenario: Scenario): Record<string, Vote> {
    const votes: Record<string, Vote> = {};
    for (const m of MEMBERS) {
        votes[m.id] = scenario.presetNei.includes(m.id) ? 'nei' : 'ja';
    }
    return votes;
}

function countJa(votes: Record<string, Vote>): number {
    return MEMBERS.filter((m) => votes[m.id] === 'ja').length;
}

function hasVeto(votes: Record<string, Vote>): boolean {
    return MEMBERS.some((m) => m.permanent && votes[m.id] === 'nei');
}

export function VetorettSimulator({
    title = 'Sikkerhetsrådet: prøv vetoretten',
}: VetorettSimulatorProps) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [votes, setVotes] = useState<Record<string, Vote>>(() => buildVotes(SCENARIOS[0]));
    const [solved, setSolved] = useState(false);

    const scenario = SCENARIOS[step];
    const jaCount = countJa(votes);
    const veto = hasVeto(votes);
    const passed = !veto && jaCount >= 9;

    const handleFlip = (id: string) => {
        if (scenario.onlyClickable && id !== scenario.onlyClickable) return;
        const next: Record<string, Vote> = { ...votes, [id]: votes[id] === 'ja' ? 'nei' : 'ja' };
        setVotes(next);
        if (solved) return;
        if (step === 0 && PERMANENT_IDS.has(id) && next[id] === 'nei') setSolved(true);
        if (step === 1 && next['sovjet'] === 'nei') setSolved(true);
        if (step === 2 && !hasVeto(next) && countJa(next) >= 9) setSolved(true);
    };

    const handleNext = () => {
        if (step + 1 >= SCENARIOS.length) {
            setPhase('complete');
            return;
        }
        const nextStep = step + 1;
        setStep(nextStep);
        setVotes(buildVotes(SCENARIOS[nextStep]));
        setSolved(false);
    };

    const handleReset = () => {
        setStep(0);
        setPhase('playing');
        setVotes(buildVotes(SCENARIOS[0]));
        setSolved(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Femten land stemmer. Men stemmene teller ikke likt.
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
                        className="p-4 sm:p-6"
                    >
                        {/* Forslag-kort */}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-4 flex gap-3">
                            <span className="mt-0.5 text-amber-500 font-bold shrink-0">
                                Forslag:
                            </span>
                            <p className="text-sm text-amber-900 leading-snug">
                                {scenario.proposal}
                            </p>
                        </div>

                        {/* Stemmebrett: 15 land */}
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                            {MEMBERS.map((m) => {
                                const vote = votes[m.id];
                                const isHint =
                                    scenario.onlyClickable === m.id && !solved && vote === 'ja';
                                const isLocked =
                                    !!scenario.onlyClickable && scenario.onlyClickable !== m.id;
                                return (
                                    <motion.button
                                        key={m.id}
                                        onClick={() => handleFlip(m.id)}
                                        disabled={isLocked}
                                        whileTap={!isLocked ? { scale: 0.94 } : undefined}
                                        animate={
                                            isHint
                                                ? { scale: [1, 1.05, 1] }
                                                : { scale: 1 }
                                        }
                                        transition={
                                            isHint
                                                ? { duration: 1.1, repeat: Infinity }
                                                : { duration: 0.2 }
                                        }
                                        className={`relative h-[4.5rem] [perspective:600px] ${
                                            isLocked ? 'cursor-default' : 'cursor-pointer'
                                        } ${isHint ? 'z-10' : ''}`}
                                        aria-label={`${m.name} stemmer ${vote === 'ja' ? 'ja' : 'nei'}`}
                                    >
                                        <motion.div
                                            className="absolute inset-0 [transform-style:preserve-3d]"
                                            animate={{ rotateY: vote === 'nei' ? 180 : 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 22,
                                            }}
                                        >
                                            {/* JA-side */}
                                            <div
                                                className={`absolute inset-0 [backface-visibility:hidden] rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 ${
                                                    m.permanent
                                                        ? 'bg-amber-50 border-amber-400'
                                                        : 'bg-white border-slate-200'
                                                } ${isHint ? 'ring-2 ring-amber-400' : ''}`}
                                            >
                                                {m.permanent && (
                                                    <Crown className="absolute top-1 right-1 w-3 h-3 text-amber-500" />
                                                )}
                                                <span className="text-base leading-none">
                                                    {m.flag}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-700 leading-tight text-center">
                                                    {m.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600">
                                                    JA
                                                </span>
                                            </div>
                                            {/* NEI-side */}
                                            <div
                                                className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 ${
                                                    m.permanent
                                                        ? 'bg-rose-50 border-rose-400'
                                                        : 'bg-rose-50 border-rose-300'
                                                }`}
                                            >
                                                {m.permanent && (
                                                    <Crown className="absolute top-1 right-1 w-3 h-3 text-rose-400" />
                                                )}
                                                <span className="text-base leading-none">
                                                    {m.flag}
                                                </span>
                                                <span className="text-[10px] font-medium text-rose-800 leading-tight text-center">
                                                    {m.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-rose-600">
                                                    NEI
                                                </span>
                                            </div>
                                        </motion.div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Forklaring av kortfarger */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-500" /> Fast medlem - har
                                vetorett
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" />
                                Valgt medlem - vanlig stemme
                            </span>
                        </div>

                        {/* Vedtak-måler */}
                        <motion.div
                            animate={veto ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                            transition={{ duration: 0.45 }}
                            className={`relative mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 overflow-hidden ${
                                veto
                                    ? 'bg-rose-50 border-rose-300'
                                    : passed
                                      ? 'bg-emerald-50 border-emerald-300'
                                      : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">{jaCount}</span> av
                                15 stemmer JA
                                <span className="text-slate-400"> (trenger minst 9)</span>
                            </div>
                            <AnimatePresence mode="wait">
                                {veto ? (
                                    <motion.div
                                        key="veto"
                                        initial={{ scale: 2.6, opacity: 0, rotate: -14 }}
                                        animate={{ scale: 1, opacity: 1, rotate: -6 }}
                                        exit={{ scale: 0.6, opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 320,
                                            damping: 16,
                                        }}
                                        className="rounded-md border-[3px] border-rose-600 px-3 py-0.5 text-sm font-black tracking-widest text-rose-600 uppercase"
                                    >
                                        Blokkert - veto
                                    </motion.div>
                                ) : passed ? (
                                    <motion.div
                                        key="vedtatt"
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.7, opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 18,
                                        }}
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 uppercase tracking-wide"
                                    >
                                        <Gavel className="w-4 h-4" /> Vedtatt
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="faller"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm font-semibold text-slate-500"
                                    >
                                        Ikke vedtatt - for få stemmer
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Feedback-sone */}
                        <div className="mt-4 min-h-[3.5rem]">
                            <AnimatePresence mode="wait">
                                {solved ? (
                                    <motion.div
                                        key="ok"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-snug flex gap-2"
                                    >
                                        <Lightbulb className="w-5 h-5 shrink-0 text-emerald-500" />
                                        <span>{scenario.why}</span>
                                    </motion.div>
                                ) : (
                                    <motion.p
                                        key="task"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="px-1 text-sm text-slate-500 leading-snug"
                                    >
                                        {scenario.task}
                                    </motion.p>
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
                        <h4 className="text-lg font-bold text-slate-800">
                            Nøklene fra 1945 virker fortsatt
                        </h4>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                            De fem som vant andre verdenskrig ga seg selv hver sin nøkkel til å låse
                            hele Sikkerhetsrådet. Regelen fra 1945 gjelder fortsatt, helt uendret.
                            14 mot 1 taper fortsatt - hvis den ene har vetorett.
                        </p>
                        <div className="mt-5 flex justify-center gap-4">
                            {MEMBERS.filter((m) => m.permanent).map((m) => (
                                <div key={m.id} className="flex flex-col items-center gap-1">
                                    <span className="relative text-xl leading-none">
                                        {m.flag}
                                        <Crown className="absolute -top-2 -right-2 w-3 h-3 text-amber-500" />
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-600">
                                        {m.name}
                                    </span>
                                </div>
                            ))}
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
