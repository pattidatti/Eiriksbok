import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Anchor, RotateCcw, Check, X, Trophy } from 'lucide-react';

interface PeloponnesStrategiProps {
    title?: string;
}

interface Option {
    text: string;
    correct: boolean;
    feedback: string;
}

interface Round {
    year: string;
    situation: string;
    options: Option[];
}

const ROUNDS: Round[] = [
    {
        year: '431 fvt',
        situation:
            'Spartas hær marsjerer inn i Attika og brenner åkrene rett utenfor Athen. Hva bør Perikles gjøre?',
        options: [
            {
                text: 'Møt Spartas hoplitter i åpent feltslag',
                correct: false,
                feedback:
                    'Spartas soldater var de beste på land. I åpen kamp ville Athen blitt knust. Derfor nektet Perikles.',
            },
            {
                text: 'Trekk alle inn bak de lange murene og la flåten skaffe korn utenfra',
                correct: true,
                feedback:
                    'Klokt. Athen kunne ikke vinne på land, men havet var byens styrke. Bak murene var folket trygt, og skipene holdt byen i live.',
            },
            {
                text: 'Overgi byen med en gang',
                correct: false,
                feedback:
                    'Athen var langt fra beseiret. Flåten hersket over havet, og byen hadde rikelig med gull.',
            },
        ],
    },
    {
        year: '430 fvt',
        situation:
            'Hele befolkningen er stuet sammen bak murene. Så bryter det ut pest. Tusener dør, også Perikles selv. Hva nå?',
        options: [
            {
                text: 'Gi opp – pesten må være et tegn fra gudene',
                correct: false,
                feedback:
                    'En grufull katastrofe, men ikke et nederlag. Flåten var fortsatt hel, og byen kunne kjempe videre.',
            },
            {
                text: 'Hold ut bak murene og send flåten for å herje Spartas kyst',
                correct: true,
                feedback:
                    'Athen slår tilbake der byen er sterkest: på havet. Men et sjøangrep kan ikke erobre selve Sparta, som ligger trygt inne i landet.',
            },
            {
                text: 'Marsjer ut og møt Sparta på land for å få slutt på det',
                correct: false,
                feedback:
                    'Fortsatt håpløst. Sparta var uslåelig på land, uansett hvor sliten Athen var.',
            },
        ],
    },
    {
        year: '405 fvt',
        situation:
            'Krigen har vart i over tjue år. Sparta har fått persisk gull og bygget sin egen flåte. Hva avgjør krigen til slutt?',
        options: [
            {
                text: 'Et gigantisk landslag mellom de to hærene',
                correct: false,
                feedback:
                    'Nei. Sparta kunne aldri tvinges til et avgjørende landslag, og Athen kunne aldri vinne et slikt slag.',
            },
            {
                text: 'Kampen om havet – den som knuser den andres flåte, vinner',
                correct: true,
                feedback:
                    'Riktig. Ved Aigospotamoi i 405 fvt ødela Sparta hele Athens flåte. Uten skip kunne ikke Athen skaffe korn, og byen måtte overgi seg.',
            },
            {
                text: 'Begge gir opp og deler Hellas likt mellom seg',
                correct: false,
                feedback:
                    'Ingen av dem ville dele. De kjempet til den ene var helt knust.',
            },
        ],
    },
];

type Phase = 'playing' | 'complete';

export function PeloponnesStrategi({ title = 'Krigsrådet: Peloponneskrigen' }: PeloponnesStrategiProps) {
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [picked, setPicked] = useState<number | null>(null);
    const [wrongTries, setWrongTries] = useState<number[]>([]);

    const current = ROUNDS[round];
    // Utmattelsen vokser for hver runde eleven kommer seg gjennom.
    const exhaustion = phase === 'complete' ? 100 : Math.round((round / ROUNDS.length) * 100);
    const activeFeedback =
        picked !== null ? current.options[picked] : null;

    const handlePick = (i: number) => {
        const opt = current.options[i];
        setPicked(i);
        if (opt.correct) {
            // Kort pause så eleven rekker å lese feedbacken, så videre.
            setTimeout(() => {
                if (round + 1 >= ROUNDS.length) {
                    setPhase('complete');
                } else {
                    setRound((r) => r + 1);
                    setPicked(null);
                    setWrongTries([]);
                }
            }, 1300);
        } else {
            setWrongTries((w) => (w.includes(i) ? w : [...w, i]));
        }
    };

    const handleReset = () => {
        setRound(0);
        setPhase('playing');
        setPicked(null);
        setWrongTries([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Swords className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg strategi mot Sparta, og finn ut hvorfor ingen kunne vinne raskt.
                    </p>
                </div>
            </div>

            {/* Styrke- og utmattelseslinje mellom de to stormaktene */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="inline-flex items-center gap-1.5 text-sky-700">
                        <Anchor className="w-4 h-4" /> Athen (sjømakt)
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {phase === 'complete' ? '404 fvt' : current.year}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-700">
                        Sparta (landmakt) <Shield className="w-4 h-4" />
                    </span>
                </div>
                <div className="relative h-3 rounded-full bg-gradient-to-r from-sky-200 via-slate-100 to-rose-200 overflow-hidden">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-slate-400/50"
                        initial={false}
                        animate={{ width: `${exhaustion}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                </div>
                <p className="mt-1.5 text-center text-[11px] text-slate-400">
                    Utmattelse: {exhaustion}% – for hvert år sliter krigen ut begge sider
                </p>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'playing' ? (
                        <motion.div
                            key={round}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                {current.situation}
                            </p>
                            <div className="flex flex-col gap-2.5">
                                {current.options.map((opt, i) => {
                                    const isPicked = picked === i;
                                    const isWrong = wrongTries.includes(i);
                                    const solved = picked !== null && current.options[picked].correct;
                                    const showCorrect = isPicked && opt.correct;
                                    let cls =
                                        'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700';
                                    if (showCorrect)
                                        cls = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                                    else if (isWrong)
                                        cls = 'border-rose-200 bg-rose-50 text-rose-700';
                                    return (
                                        <motion.button
                                            key={i}
                                            onClick={() => handlePick(i)}
                                            disabled={solved || isWrong}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-default ${cls}`}
                                        >
                                            <span className="flex-shrink-0">
                                                {showCorrect ? (
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                ) : isWrong ? (
                                                    <X className="w-4 h-4 text-rose-500" />
                                                ) : (
                                                    <span className="inline-block w-4 h-4 rounded-full border border-slate-300" />
                                                )}
                                            </span>
                                            {opt.text}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-300 p-4"
                        >
                            <div className="flex items-start gap-2">
                                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-bold text-emerald-900">
                                    Krigen varte i 27 år (431–404 fvt) – og ingen vant egentlig.
                                </p>
                            </div>
                            <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                                Athen tapte til slutt flåten sin og måtte overgi seg. Men Sparta vant
                                en tom seier: hele Hellas lå utmattet etter den lange krigen. Da
                                makedonerne kom nordfra noen tiår senere, var bystatene for svake til
                                å stå imot. To motstandere som var sterke på hver sin arena, én på
                                havet og én på land, kunne bare slite hverandre ut.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone – alltid til stede */}
            <div className="mx-6 mb-4 min-h-[52px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={
                            phase === 'complete'
                                ? 'c'
                                : `${round}-${picked}-${wrongTries.length}`
                        }
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            phase === 'complete'
                                ? 'bg-slate-50 border-slate-200 text-slate-600'
                                : activeFeedback
                                  ? activeFeedback.correct
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'complete'
                            ? 'Trykk «Start på nytt» for å prøve en annen vei gjennom krigen.'
                            : activeFeedback
                              ? activeFeedback.feedback
                              : 'Athen er en sjømakt, Sparta en landmakt. Velg et trekk og se hva som skjer.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Runde {Math.min(round + 1, ROUNDS.length)} av {ROUNDS.length}
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
