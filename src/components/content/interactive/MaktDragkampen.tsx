import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Landmark, Scale, RotateCcw, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

type Side = 'konge' | 'storting';

interface Trekk {
    year: string;
    event: string;
    winner: Side;
    // Hvor tauknuten står etter trekket: 0 = alt hos kongen, 100 = alt hos Stortinget.
    pos: number;
    explanation: string;
}

const TREKK: Trekk[] = [
    {
        year: '1872-1877',
        event: 'Stortinget vedtar tre ganger at statsrådene skal møte i Stortinget og svare på spørsmål. Kongen sier nei hver gang.',
        winner: 'konge',
        pos: 18,
        explanation:
            'Kongen hadde rett til å si nei til en grunnlovsendring. Ingenting endret seg.',
    },
    {
        year: '1880',
        event: 'Stortinget vedtar det samme for fjerde gang og sier at nå gjelder det, uansett hva kongen mener. Regjeringen nekter å gjøre vedtaket kjent.',
        winner: 'konge',
        pos: 14,
        explanation:
            'Kongen og regjeringen mente kongen kunne stoppe alt for alltid. Så lenge regjeringen nektet, sto saken fast.',
    },
    {
        year: '1882',
        event: 'Det er valg. Venstresiden, som vil at regjeringen skal svare til Stortinget, får over 60 prosent av stemmene.',
        winner: 'storting',
        pos: 38,
        explanation:
            'Velgerne ga venstresiden et stort flertall. Nå hadde Stortinget folket i ryggen.',
    },
    {
        year: 'April 1883',
        event: 'Stortinget bestemmer seg for å stille hele regjeringen for riksrett, en egen domstol for statsråder som bryter Grunnloven.',
        winner: 'storting',
        pos: 54,
        explanation:
            'Riksretten var Stortingets skarpeste våpen. Statsrådene måtte forsvare seg i retten.',
    },
    {
        year: '27. februar 1884',
        event: 'Riksretten dømmer. Statsminister Selmer og sju andre statsråder mister jobben. Tre får bøter.',
        winner: 'storting',
        pos: 72,
        explanation: 'Ingen ble frikjent. Kongen måtte gi Selmer avskjed 11. mars 1884.',
    },
    {
        year: '3. april 1884',
        event: 'Kongen prøver igjen: Han setter sammen en ny regjering som ikke har flertallet i Stortinget med seg.',
        winner: 'konge',
        pos: 62,
        explanation: 'Dette var Aprilministeriet, kongens siste forsøk på å styre uten Stortinget.',
    },
    {
        year: '26. juni 1884',
        event: 'Aprilministeriet gir opp etter under to måneder. Kongen ber lederen for flertallet, Johan Sverdrup, danne regjering.',
        winner: 'storting',
        pos: 90,
        explanation:
            'For første gang fikk Norge en regjering som hadde flertallet i Stortinget bak seg.',
    },
    {
        year: '1. juli 1884',
        event: 'Kongen skriver under på vedtaket om at statsrådene skal møte i Stortinget.',
        winner: 'storting',
        pos: 100,
        explanation: 'Saken Stortinget hadde vedtatt fire ganger, ble endelig til grunnlov.',
    },
];

const START_POS = 20;

interface MaktDragkampenProps {
    title?: string;
}

export function MaktDragkampen({ title = 'Dragkampen om makta 1872-1884' }: MaktDragkampenProps) {
    const [index, setIndex] = useState(0);
    const [guess, setGuess] = useState<Side | null>(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    const trekk = TREKK[index];
    const answered = guess !== null;
    const correct = answered && guess === trekk.winner;
    const pos = done ? 100 : answered ? trekk.pos : index === 0 ? START_POS : TREKK[index - 1].pos;

    const choose = (side: Side) => {
        if (answered || done) return;
        setGuess(side);
        if (side === trekk.winner) setScore((s) => s + 1);
    };

    const next = () => {
        if (index === TREKK.length - 1) {
            setDone(true);
            return;
        }
        setIndex((i) => i + 1);
        setGuess(null);
    };

    const reset = () => {
        setIndex(0);
        setGuess(null);
        setScore(0);
        setDone(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les hvert trekk. Trykk på den siden du tror vant det.
                    </p>
                </div>
            </div>

            {/* Tauet */}
            <div className="px-5 pt-5">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="flex items-center gap-1.5 text-amber-700">
                        <Crown className="w-4 h-4" /> Kongen og regjeringen
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-700">
                        Stortinget <Landmark className="w-4 h-4" />
                    </span>
                </div>
                <div className="relative h-4 rounded-full bg-gradient-to-r from-amber-200 via-slate-200 to-indigo-200">
                    <div className="absolute left-1/2 top-[-4px] bottom-[-4px] w-px bg-slate-400" />
                    <motion.div
                        className="absolute top-1/2 w-7 h-7 -mt-3.5 -ml-3.5 rounded-full bg-white border-2 border-slate-700 shadow-md flex items-center justify-center"
                        animate={{ left: `${pos}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    </motion.div>
                </div>
                <div className="flex gap-1 mt-3 justify-center">
                    {TREKK.map((t, i) => (
                        <span
                            key={t.year}
                            className={`h-1.5 w-6 rounded-full ${
                                done || i < index || (i === index && answered)
                                    ? 'bg-indigo-500'
                                    : i === index
                                      ? 'bg-slate-400'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Trekket */}
            <div className="p-5 min-h-[190px]">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                className="inline-flex"
                            >
                                <Landmark className="w-10 h-10 text-emerald-600" />
                            </motion.div>
                            <p className="mt-2 font-semibold text-emerald-800">
                                Stortinget vant dragkampen. Du traff {score} av {TREKK.length}.
                            </p>
                            <p className="mt-1 text-sm text-emerald-700">
                                Den nye regelen fra 1884: Regjeringen kan bare styre så lenge
                                flertallet i Stortinget vil ha den. Kongen bestemmer ikke lenger
                                hvem som styrer Norge.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                        >
                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                                Trekk {index + 1} av {TREKK.length} · {trekk.year}
                            </p>
                            <p className="mt-1 text-slate-800">{trekk.event}</p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {(['konge', 'storting'] as Side[]).map((side) => {
                                    const isPicked = guess === side;
                                    const isWinner = answered && trekk.winner === side;
                                    return (
                                        <motion.button
                                            key={side}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => choose(side)}
                                            disabled={answered}
                                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                                                isWinner
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : isPicked
                                                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                      : side === 'konge'
                                                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:shadow-md'
                                                        : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:shadow-md'
                                            }`}
                                        >
                                            {side === 'konge' ? (
                                                <Crown className="w-4 h-4" />
                                            ) : (
                                                <Landmark className="w-4 h-4" />
                                            )}
                                            {side === 'konge'
                                                ? 'Kongen vinner'
                                                : 'Stortinget vinner'}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback */}
            <div className="mx-5 mb-4 min-h-[56px]">
                <AnimatePresence mode="wait">
                    {answered && !done ? (
                        <motion.div
                            key={`fb-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-2 px-4 py-3 rounded-lg border text-sm ${
                                correct
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {correct ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>
                                {correct ? 'Riktig! ' : 'Ikke helt. '}
                                {trekk.explanation}
                            </span>
                        </motion.div>
                    ) : (
                        !done && (
                            <motion.p
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                            >
                                Følg knuten på tauet. Hvem drar den mot seg denne gangen?
                            </motion.p>
                        )
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <button
                    onClick={next}
                    disabled={!answered || done}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {index === TREKK.length - 1 ? 'Se resultatet' : 'Neste trekk'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
