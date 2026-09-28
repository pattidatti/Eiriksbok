import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import type { ComprehensionQuestion } from '../../../types';
import { useStepSounds } from '../../../hooks/useStepSounds';

interface CheckQuizProps {
    questions: ComprehensionQuestion[];
    alreadyDone: boolean;
    alreadyPerfect: boolean;
    onDone: (firstTryCorrect: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Ett spørsmål om gangen. Feil svar låser ikke - eleven ser forklaringen og prøver
// igjen til det sitter. Bare svar som var riktige på første forsøk teller mot
// tredjestjernen.
export function CheckQuiz({ questions, alreadyDone, alreadyPerfect, onDone }: CheckQuizProps) {
    const sounds = useStepSounds();
    const [replay, setReplay] = useState(!alreadyDone);
    const [index, setIndex] = useState(0);
    const [wrongPicks, setWrongPicks] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [firstTry, setFirstTry] = useState(0);

    if (!replay) {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-3 flex-1">
                    <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5" />
                    </span>
                    <p className="text-emerald-900 font-semibold">
                        {alreadyPerfect
                            ? 'Alt riktig på første forsøk. Sterkt!'
                            : 'Du har svart på spørsmålene her.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setReplay(true);
                        setIndex(0);
                        setWrongPicks([]);
                        setSolved(false);
                        setFirstTry(0);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-sm font-bold hover:bg-emerald-100 transition"
                >
                    <RotateCcw className="w-4 h-4" />
                    {alreadyPerfect ? 'Ta dem igjen' : 'Prøv igjen for full pott'}
                </button>
            </div>
        );
    }

    const q = questions[index];
    const isLast = index === questions.length - 1;

    const pick = (i: number) => {
        if (solved || wrongPicks.includes(i)) return;
        if (i === q.correct) {
            sounds.play('correct');
            setSolved(true);
            if (wrongPicks.length === 0) setFirstTry((n) => n + 1);
        } else {
            sounds.play('incorrect');
            setWrongPicks((w) => [...w, i]);
        }
    };

    const next = () => {
        if (isLast) {
            setReplay(false);
            onDone(firstTry);
            return;
        }
        sounds.play('advance');
        setIndex((n) => n + 1);
        setWrongPicks([]);
        setSolved(false);
    };

    const lastWrong = wrongPicks[wrongPicks.length - 1];

    return (
        <div>
            {/* Fremdrift: én prikk per spørsmål */}
            <div className="flex items-center gap-2 mb-3">
                {questions.map((_, i) => (
                    <span
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            i < index
                                ? 'w-6 bg-emerald-500'
                                : i === index
                                  ? 'w-10 bg-indigo-500'
                                  : 'w-6 bg-slate-200'
                        }`}
                    />
                ))}
                <span className="ml-auto text-xs font-bold text-slate-400">
                    Spørsmål {index + 1} av {questions.length}
                </span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                    <p className="text-lg font-bold text-slate-900 mb-3 leading-snug">
                        {q.question}
                    </p>
                    <div className="grid gap-2">
                        {q.options.map((opt, i) => {
                            const isRight = solved && i === q.correct;
                            const isWrong = wrongPicks.includes(i);
                            return (
                                <motion.button
                                    key={i}
                                    type="button"
                                    onClick={() => pick(i)}
                                    disabled={solved || isWrong}
                                    animate={
                                        isWrong && i === lastWrong
                                            ? { x: [0, -8, 8, -5, 5, 0] }
                                            : isRight
                                              ? { scale: [1, 1.03, 1] }
                                              : {}
                                    }
                                    transition={{ duration: 0.35 }}
                                    whileHover={!solved && !isWrong ? { x: 4 } : undefined}
                                    whileTap={!solved && !isWrong ? { scale: 0.98 } : undefined}
                                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                                        isRight
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                            : isWrong
                                              ? 'border-rose-200 bg-rose-50 text-rose-400 line-through'
                                              : solved
                                                ? 'border-slate-100 bg-white text-slate-400'
                                                : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
                                    }`}
                                >
                                    <span
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                            isRight
                                                ? 'bg-emerald-500 text-white'
                                                : isWrong
                                                  ? 'bg-rose-200 text-rose-600'
                                                  : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {isRight ? (
                                            <Check className="w-4 h-4" />
                                        ) : isWrong ? (
                                            <X className="w-4 h-4" />
                                        ) : (
                                            LETTERS[i]
                                        )}
                                    </span>
                                    {opt}
                                </motion.button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {!solved && wrongPicks.length > 0 && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 text-sm font-semibold text-rose-700"
                            >
                                Ikke helt. Se tilbake i fortellingen over, og prøv et annet svar.
                            </motion.p>
                        )}
                        {solved && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3"
                            >
                                <p className="flex-1 text-sm text-emerald-900 leading-relaxed">
                                    <span className="font-bold">
                                        {wrongPicks.length === 0 ? 'Riktig! ' : 'Der satt den. '}
                                    </span>
                                    {q.explanation}
                                </p>
                                <motion.button
                                    type="button"
                                    onClick={next}
                                    autoFocus
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 flex-shrink-0"
                                >
                                    {isLast ? 'Ferdig' : 'Neste'}
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
