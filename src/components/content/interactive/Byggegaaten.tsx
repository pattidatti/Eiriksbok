import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Lightbulb, Check, X, RotateCcw, Trophy, ArrowRight } from 'lucide-react';

// Signaturkomponent for "Hvordan ble pyramidene bygd?".
// Lyspære-øyeblikket: Etter denne interaksjonen forstår eleven at hver
// "umulige" ting med pyramidene har en jordnær, menneskelig forklaring, og at
// svaret finner du ved å se hva bevisene viser, ikke ved å gjette på
// slaver eller romvesener. Eleven ser én byggeutfordring om gangen og velger
// hvilken løsning bevisene støtter. Feil svar gir mild retting og nytt forsøk;
// riktig svar avdekker det arkeologene faktisk har funnet.

interface Option {
    text: string;
    correct: boolean;
    // Vises naar valget er gjort. For riktig svar: hva bevisene viser.
    // For feil svar: hvorfor bevisene ikke stoetter det.
    respons: string;
}

interface Challenge {
    id: string;
    // Selve byggeutfordringen, formulert som et spoersmaal.
    utfordring: string;
    options: Option[];
}

interface ByggegaatenProps {
    title?: string;
    intro?: string;
    challenges?: Challenge[];
}

const DEFAULT_CHALLENGES: Challenge[] = [
    {
        id: 'flytte',
        utfordring: 'Hvordan flyttet egypterne steinblokker på 2 til 3 tonn over den løse ørkensanden?',
        options: [
            {
                text: 'De dro blokkene på sleder og helte vann på sanden foran',
                correct: true,
                respons: 'Riktig. Vann gjør sanden hard og glatt, så sleden glir mye lettere. Egypterne dro blokkene på sleder og fuktet sanden foran (Bettum, 2024).',
            },
            {
                text: 'De brukte store maskiner med motor',
                correct: false,
                respons: 'Nei. Egypterne hadde verken hjul med aksel til tunge lass eller motorer. Bevisene peker på sleder, tau og muskelkraft.',
            },
            {
                text: 'Romvesener løftet dem med ukjent teknologi',
                correct: false,
                respons: 'Nei. Det finnes ingen bevis for dette. Arkeologene har funnet både slederester og bilder som viser mennesker som drar stein.',
            },
        ],
    },
    {
        id: 'hoyt',
        utfordring: 'Hvordan fikk de blokkene høyt opp, helt til toppen av pyramiden?',
        options: [
            {
                text: 'De bygde lange ramper som steinen ble slept opp',
                correct: true,
                respons: 'Riktig. Ved steinbruddet i Hatnub har arkeologer funnet en rampe med trapper på hver side, brukt til å hale stein oppover (Illustrert Vitenskap, 2022).',
            },
            {
                text: 'De kastet blokkene opp med katapulter',
                correct: false,
                respons: 'Nei. En 2,5-tonns blokk kan ikke kastes, og den ville knust alt under seg. Løsningen var ramper, ikke kast.',
            },
            {
                text: 'De hadde store kraner av stål',
                correct: false,
                respons: 'Nei. Stål og kraner fantes ikke for 4500 år siden. Egypterne løste høyden med skråe ramper i stedet.',
            },
        ],
    },
    {
        id: 'arbeiderne',
        utfordring: 'Hvem gjorde det tunge arbeidet, og hvordan orket de?',
        options: [
            {
                text: 'Frie, betalte arbeidere som fikk brød, øl og kjøtt',
                correct: true,
                respons: 'Riktig. Ved Giza har arkeologer gravd fram en hel arbeiderlandsby med bakerier og bevis for at arbeiderne fikk brød, øl og oksekjøtt (Handwerk, 2025).',
            },
            {
                text: 'Slaver som ble pisket til å jobbe til de døde',
                correct: false,
                respons: 'Nei. Dette er en gammel myte. Funnene viser frie arbeidere som ble matet godt og til og med fikk legehjelp (Handwerk, 2025).',
            },
            {
                text: 'Bare noen få menn med magiske krefter',
                correct: false,
                respons: 'Nei. Det trengtes tusenvis av hender. Mange var bønder som jobbet på byggeplassen når Nilen oversvømte åkrene (Bettum, 2024).',
            },
        ],
    },
    {
        id: 'kappe',
        utfordring: 'Hvordan kappet og formet de steinen uten verktøy av jern?',
        options: [
            {
                text: 'Med verktøy av kobber, hardere stein og sand som slipemiddel',
                correct: true,
                respons: 'Riktig. Egypterne brukte meisler av kobber, banket hardere stein mot steinen og slipte med sand. Det tok tid, men det virket.',
            },
            {
                text: 'De smeltet steinen med laser',
                correct: false,
                respons: 'Nei. Laser er moderne teknologi. Sporene i steinen viser slag- og slipemerker fra enkle redskaper.',
            },
            {
                text: 'Steinen var egentlig myk leire som størknet',
                correct: false,
                respons: 'Nei. Blokkene er ekte kalkstein og granitt fra steinbrudd. Vi vet hvor de ble hugget ut.',
            },
        ],
    },
];

type Phase = 'playing' | 'complete';

export function Byggegaaten({
    title = 'Byggegåten',
    intro = 'Fire ting virker umulige med pyramidene. Velg løsningen bevisene faktisk støtter.',
    challenges = DEFAULT_CHALLENGES,
}: ByggegaatenProps) {
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [solved, setSolved] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');

    const challenge = challenges[index];
    const total = challenges.length;
    const isCorrect = picked !== null && challenge.options[picked].correct;

    const reset = () => {
        setIndex(0);
        setPicked(null);
        setSolved(0);
        setPhase('playing');
    };

    const pick = (i: number) => {
        if (picked !== null && challenge.options[picked].correct) return; // allerede løst
        setPicked(i);
    };

    const next = () => {
        setSolved((s) => s + 1);
        if (index + 1 >= total) {
            setPhase('complete');
        } else {
            setIndex((n) => n + 1);
            setPicked(null);
        }
    };

    if (phase === 'complete') {
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <HardHat className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="p-8 text-center"
                >
                    <motion.div
                        initial={{ rotate: -12, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                        className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
                    >
                        <Trophy className="w-8 h-8 text-emerald-600" />
                    </motion.div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">
                        Alle {total} byggegåtene løst!
                    </h4>
                    <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                        Ingen av gåtene trengte slaver eller romvesener. Hver "umulige" ting hadde en
                        jordnær løsning: ramper, sleder, vann, kobberverktøy og tusenvis av frie
                        hender. Når du møter en gåte om fortiden, spør alltid: hva viser bevisene?
                    </p>
                    <button
                        onClick={reset}
                        className="mt-6 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Spill igjen
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <HardHat className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                    {index + 1} / {total}
                </span>
            </div>

            {/* Framdriftslinje */}
            <div className="h-1 bg-slate-100">
                <motion.div
                    className="h-full bg-amber-400"
                    initial={false}
                    animate={{ width: `${(solved / total) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                />
            </div>

            {/* Utfordring */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={challenge.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-slate-800 font-medium mb-4"
                    >
                        {challenge.utfordring}
                    </motion.p>
                </AnimatePresence>

                <div className="space-y-2">
                    {challenge.options.map((opt, i) => {
                        const chosen = picked === i;
                        const showState = chosen;
                        const stateClass = !showState
                            ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                            : opt.correct
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-rose-50 border-rose-300';
                        return (
                            <motion.button
                                key={i}
                                onClick={() => pick(i)}
                                whileTap={{ scale: 0.98 }}
                                animate={chosen && !opt.correct ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                transition={{ duration: 0.35 }}
                                className={`w-full text-left flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${stateClass}`}
                            >
                                <span
                                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                        showState
                                            ? opt.correct
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-rose-500 text-white'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    {showState ? (
                                        opt.correct ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <X className="w-4 h-4" />
                                        )
                                    ) : (
                                        <span className="text-xs font-semibold">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                    )}
                                </span>
                                <span className="text-slate-700">{opt.text}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {picked !== null ? (
                        <motion.div
                            key={`${challenge.id}-${picked}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm ${
                                isCorrect
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                            }`}
                        >
                            <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{challenge.options[picked].respons}</span>
                        </motion.div>
                    ) : (
                        <p className="px-1 py-3 text-sm text-slate-400">
                            Klikk et svar for å teste det mot bevisene.
                        </p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 pt-3 flex items-center justify-between">
                <button
                    onClick={next}
                    disabled={!isCorrect}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        isCorrect
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {index + 1 >= total ? 'Fullfør' : 'Neste gåte'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={reset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
