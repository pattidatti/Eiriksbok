import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, RotateCcw } from 'lucide-react';

// Signaturkomponent til artikkelen "Bjørnegraven".
// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at respekt
// for bjørnen ikke bare var en følelse, men regler som styrte selv hvilke ord
// jegerne fikk lov til å bruke.
//
// Regelen eleven skal oppdage gjennom å prøve: si hva den er, ikke navnet -
// og aldri snakk stort om den.

interface Option {
    label: string;
    correct?: boolean;
    // Forklaring som vises etter valget.
    why: string;
}

interface Round {
    scene: string;
    sentence: string;
    options: Option[];
}

interface BjornespraketProps {
    title?: string;
    rounds?: Round[];
}

type Phase = 'playing' | 'awake' | 'done';

const DEFAULT_ROUNDS: Round[] = [
    {
        scene: 'Kvelden før jakten, inne i teltet',
        sentence: 'I morgen går vi ut for å møte',
        options: [
            {
                label: 'bjørnen',
                why: 'Du sa navnet høyt. Etter gammel samisk tro forsto bjørnen vanlig menneskeprat, men ikke omskrivninger.',
            },
            {
                label: 'bestefar',
                correct: true,
                why: 'Riktig. Et av de ekte omskrivningsordene var áddjá, som betyr bestefar.',
            },
            {
                label: 'udyret',
                why: 'Nedsettende ord var like galt som navnet. Bjørnen skulle omtales med respekt, ikke forakt.',
            },
        ],
    },
    {
        scene: 'Ute i snøen, på vei mot hiet',
        sentence: 'Vi følger sporene etter',
        options: [
            {
                label: 'guovža',
                why: 'Guovža er det vanlige nordsamiske ordet for bjørn. Det var nettopp dette ordet man skulle unngå.',
            },
            {
                label: 'byttet vårt',
                why: 'Her gjør du deg selv til eier. Etter troen var ikke bjørnen noe man eide, men noen man møtte.',
            },
            {
                label: 'han som går i pelsen',
                correct: true,
                why: 'Riktig. Du beskriver den i stedet for å navngi den. Det er akkurat det en omskrivning gjør.',
            },
        ],
    },
    {
        scene: 'Hjemme igjen, foran de andre i boplassen',
        sentence: 'Vi har med oss',
        options: [
            {
                label: 'en diger bjørn',
                why: 'To feil på én gang: du sier navnet, og du skryter av størrelsen.',
            },
            {
                label: 'den vi ikke nevner',
                correct: true,
                why: 'Riktig. Selv i seiersøyeblikket holdt jegerne seg til omskrivningen.',
            },
            {
                label: 'trofeet vårt',
                why: 'Et trofé er noe man vinner og viser fram. Bjørnen var et hellig dyr, ikke en premie.',
            },
        ],
    },
    {
        scene: 'Ved ura, der grava skal ligge',
        sentence: 'Nå legger vi',
        options: [
            {
                label: 'skrotten',
                why: 'Ordet gjør bjørnen til avfall. Beina skulle tvert imot legges tilbake med stor omhu.',
            },
            {
                label: 'bjørnen',
                why: 'Helt til slutt gjelder regelen fortsatt. Navnet ble unngått gjennom hele seremonien.',
            },
            {
                label: 'bestefar',
                correct: true,
                why: 'Riktig. Den samme respekten fulgte bjørnen helt inn i grava.',
            },
        ],
    },
];

const MAX_WAKE = 3;

export function Bjornespraket({
    title = 'Ordene som ikke måtte sies',
    rounds = DEFAULT_ROUNDS,
}: BjornespraketProps) {
    const [index, setIndex] = useState(0);
    const [wake, setWake] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>('playing');

    const round = rounds[Math.min(index, rounds.length - 1)];
    const chosen = picked === null ? null : round.options[picked];

    const handleReset = () => {
        setIndex(0);
        setWake(0);
        setPicked(null);
        setPhase('playing');
    };

    const handlePick = (i: number) => {
        if (phase !== 'playing' || picked !== null) return;
        setPicked(i);
        if (round.options[i].correct) return;
        const next = wake + 1;
        setWake(next);
        if (next >= MAX_WAKE) setPhase('awake');
    };

    const handleNext = () => {
        setPicked(null);
        if (index + 1 >= rounds.length) {
            setPhase('done');
            return;
        }
        setIndex(index + 1);
    };

    const showSentence =
        chosen && chosen.correct ? `${round.sentence} ${chosen.label}.` : `${round.sentence} ...`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg ordet jegerne kunne bruke. Bjørnen sover - hold den sovende.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-[1fr_170px] md:items-start">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        {round.scene}
                    </p>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 mb-4">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={showSentence}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-slate-800 text-lg leading-snug"
                            >
                                {showSentence}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {round.options.map((opt, i) => {
                            const isPicked = picked === i;
                            const revealed = picked !== null;
                            const tone = !revealed
                                ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                : opt.correct
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isPicked
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'bg-white border-slate-200 text-slate-400';
                            return (
                                <motion.button
                                    key={opt.label}
                                    onClick={() => handlePick(i)}
                                    disabled={revealed || phase !== 'playing'}
                                    whileTap={revealed ? undefined : { scale: 0.96 }}
                                    animate={
                                        isPicked && !opt.correct
                                            ? { x: [0, -6, 6, -4, 0] }
                                            : { x: 0 }
                                    }
                                    transition={{ duration: 0.35 }}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${tone} ${
                                        revealed ? 'cursor-default' : 'cursor-pointer'
                                    }`}
                                >
                                    {opt.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Bjørnen som våkner */}
                <div className="flex flex-col items-center gap-2">
                    <SleepingBear wake={wake} />
                    <div className="flex gap-1.5" aria-hidden="true">
                        {Array.from({ length: MAX_WAKE }).map((_, i) => (
                            <span
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${
                                    i < wake ? 'bg-rose-400' : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 text-center leading-snug">
                        {wake === 0
                            ? 'Den sover tungt.'
                            : wake < MAX_WAKE
                              ? 'Den rørte på seg.'
                              : 'Den er våken.'}
                    </p>
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${index}-${picked}-${phase}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            phase === 'awake'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : phase === 'done'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : chosen
                                    ? chosen.correct
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'awake'
                            ? 'Bjørnen våknet. Etter troen forsto den vanlig menneskeprat, og da var jakten ødelagt før den begynte. Tilbakestill og prøv igjen.'
                            : phase === 'done'
                              ? 'Du kom gjennom hele seremonien uten å vekke den. Regelen du fulgte: si hva den er, ikke navnet - og aldri snakk stort om den. Ordene på norsk her er bare eksempler. Poenget er regelen, ikke gloser.'
                              : chosen
                                ? chosen.why
                                : 'Tre måter å si det på. Bare én av dem er trygg.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'playing' ? (
                    <button
                        onClick={handleNext}
                        disabled={picked === null}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 >= rounds.length ? 'Fullfør seremonien' : 'Videre'}
                    </button>
                ) : (
                    <span className="text-sm font-semibold text-slate-600">
                        {phase === 'done'
                            ? `Ferdig - ${MAX_WAKE - wake} av ${MAX_WAKE} sjanser i behold`
                            : 'Jakten er over.'}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

// Enkel bjørn i profil. Øret reiser seg, så åpner øyet seg, så løfter den hodet.
function SleepingBear({ wake }: { wake: number }) {
    const earLift = wake >= 1 ? -6 : 0;
    const eyeOpen = wake >= 2;
    const headLift = wake >= 3 ? -10 : 0;

    return (
        <motion.svg
            viewBox="0 0 140 110"
            className="w-full max-w-[150px] h-auto"
            role="img"
            aria-label={
                wake === 0
                    ? 'En bjørn som sover'
                    : wake < 3
                      ? 'En bjørn som begynner å våkne'
                      : 'En bjørn som er våken'
            }
        >
            {/* Snø/underlag */}
            <ellipse cx="70" cy="96" rx="58" ry="9" fill="#e2e8f0" />

            {/* Kropp */}
            <motion.ellipse
                cx="72"
                cy="72"
                rx="46"
                ry="24"
                fill="#6b4f3a"
                animate={{ y: [0, -1.5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Hode */}
            <motion.g animate={{ y: headLift }} transition={{ type: 'spring', stiffness: 180, damping: 14 }}>
                <motion.circle
                    cx="34"
                    cy="62"
                    r="21"
                    fill="#7a5b42"
                    animate={{ y: [0, -1.5, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Øre */}
                <motion.circle
                    cx="26"
                    cy="45"
                    r="8"
                    fill="#7a5b42"
                    animate={{ y: earLift }}
                    transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                />
                {/* Snute */}
                <ellipse cx="18" cy="68" rx="11" ry="8" fill="#a2805e" />
                <circle cx="11" cy="66" r="3" fill="#2f2119" />
                {/* Øye */}
                {eyeOpen ? (
                    <circle cx="30" cy="58" r="3.6" fill="#2f2119" />
                ) : (
                    <path
                        d="M25 58 q5 4 10 0"
                        stroke="#2f2119"
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                    />
                )}
            </motion.g>

            {/* Zzz mens den sover */}
            {wake === 0 && (
                <motion.text
                    x="98"
                    y="34"
                    fontSize="18"
                    fill="#94a3b8"
                    fontWeight="700"
                    animate={{ opacity: [0.25, 1, 0.25], y: [0, -6, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    z z z
                </motion.text>
            )}
        </motion.svg>
    );
}
