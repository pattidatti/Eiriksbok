import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { QuizQuestion } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, XCircle, RotateCcw, ExternalLink, Target } from 'lucide-react';
import { captureQuizAnswer } from '../utils/reviewCapture';
import { getQuizCorrectAnswer } from '../utils/quizUtils';
import { useProgressStore } from '../features/progress/useProgressStore';
import { correctPop, wrongShake, celebrateCompletion } from './ui/answerFeedback';

interface QuizProps {
    questions: QuizQuestion[];
}

// Felles kortskall som matcher Oppgaver-kortet, slik at sluttsonen i artikler
// («Jobb med stoffet») får ett sammenhengende kortspråk: samme bredde, radius,
// bakgrunn og header-oppsett.
const QuizShell = ({
    headerRight,
    children,
}: {
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <section className="my-8 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-5">
        <header className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Target size={18} className="text-slate-700" />
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Test deg selv</h3>
            </div>
            {headerRight}
        </header>
        {children}
    </section>
);

const shuffle = (options: string[]) => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const Quiz = ({ questions }: QuizProps) => {
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>(() =>
        questions && questions[0] ? shuffle(questions[0].options) : []
    );

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const getCorrectAnswer = getQuizCorrectAnswer;

    // Vern mot dobbeltklikk: «Neste» rendres på samme sted som «Svar»
    // forsvinner fra, så et raskt dobbeltklikk hoppet ellers rett forbi
    // fasit-visningen uten at eleven så riktig svar.
    const answeredAtRef = React.useRef(0);

    const submitAnswer = () => {
        answeredAtRef.current = Date.now();
        setIsAnswered(true);
        const correct = getCorrectAnswer(questions[currentQuestion]);
        captureQuizAnswer(questions[currentQuestion], selectedOption === correct);
        if (selectedOption === correct) {
            setCorrectCount(correctCount + 1);
            const newStreak = streak + 1;
            setStreak(newStreak);
            setBestStreak(Math.max(bestStreak, newStreak));
        } else {
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        if (Date.now() - answeredAtRef.current < 350) return;
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setShuffledOptions(shuffle(questions[currentQuestion + 1].options));
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // «Min læring»: quiz fullført - normalisert score 0-1
            const ratio = questions.length > 0 ? correctCount / questions.length : 0;
            useProgressStore.getState().recordActivity({
                kind: 'quiz-completed',
                activityId: location.pathname.replace(/^\//, ''),
                score: ratio,
                title: 'Quiz fullført',
            });
            celebrateCompletion({ big: ratio === 1 });
            setShowResult(true);
        }
    };

    const restart = () => {
        setCurrentQuestion(0);
        setShuffledOptions(questions && questions[0] ? shuffle(questions[0].options) : []);
        setSelectedOption(null);
        setShowResult(false);
        setCorrectCount(0);
        setStreak(0);
        setBestStreak(0);
        setIsAnswered(false);
    };

    if (showResult) {
        const ratio = questions.length > 0 ? correctCount / questions.length : 0;
        const emoji = ratio === 1 ? '🏆' : ratio >= 0.7 ? '🎉' : ratio >= 0.4 ? '💪' : '📖';
        const message =
            ratio === 1
                ? 'Perfekt! Du kan dette.'
                : ratio >= 0.7
                  ? 'Sterkt! Nesten alt riktig.'
                  : ratio >= 0.4
                    ? 'Godt forsøk! Prøv en runde til.'
                    : 'Les gjennom stoffet en gang til, så sitter det.';
        return (
            <QuizShell>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="mx-auto max-w-xl px-4 py-6 text-center"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
                    className="text-6xl mb-4"
                >
                    {emoji}
                </motion.div>
                <h3 className="font-display font-bold text-2xl text-slate-900 mb-2">
                    Quiz fullført!
                </h3>
                <p className="text-slate-600 mb-6">{message}</p>
                <div className="flex justify-center gap-3 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 px-5 py-3">
                        <div className="text-2xl font-bold text-indigo-600">
                            {correctCount}/{questions.length}
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Riktige
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 px-5 py-3">
                        <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                            <Flame className="w-5 h-5" />
                            {bestStreak}
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Beste streak
                        </div>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={restart}
                    className="focus-ring inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Prøv igjen
                </motion.button>
            </motion.div>
            </QuizShell>
        );
    }

    if (!questions || questions.length === 0) return null;

    const question = questions[currentQuestion];
    const correctAnswer = getCorrectAnswer(question);
    const answeredCorrectly = isAnswered && selectedOption === correctAnswer;
    const progress = (currentQuestion + (isAnswered ? 1 : 0)) / questions.length;

    return (
        <QuizShell
            headerRight={
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500">
                        Spørsmål {currentQuestion + 1} av {questions.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <motion.span
                            key={streak}
                            animate={
                                streak > 0
                                    ? { scale: [1, 1.35, 1], rotate: [0, 8, -8, 0] }
                                    : undefined
                            }
                            transition={{ duration: 0.35 }}
                        >
                            <Flame
                                className={`w-4 h-4 ${streak > 0 ? 'text-amber-500' : 'text-slate-300'}`}
                            />
                        </motion.span>
                        <span
                            className={`text-sm font-bold ${streak > 2 ? 'text-amber-500' : streak > 0 ? 'text-slate-700' : 'text-slate-400'}`}
                        >
                            {streak} på rad
                        </span>
                    </div>
                </div>
            }
        >
            <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden mb-6">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={false}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                />
            </div>

            <div className="mx-auto max-w-xl py-2">
                <p className="text-lg sm:text-xl font-semibold text-slate-900 text-center leading-snug mb-6">
                    {question.question}
                </p>

                <div className="grid gap-3 mb-6">
                    {shuffledOptions.map((option) => {
                        const isSelected = selectedOption === option;
                        const isCorrectAnswer = isAnswered && option === correctAnswer;
                        const isWrongPick = isAnswered && isSelected && option !== correctAnswer;
                        return (
                            <motion.button
                                key={option}
                                animate={
                                    isCorrectAnswer ? correctPop : isWrongPick ? wrongShake : undefined
                                }
                                whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                                onClick={() => handleOptionClick(option)}
                                disabled={isAnswered}
                                className={`focus-ring w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 rounded-xl border-2 font-medium transition-colors ${
                                    isCorrectAnswer
                                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                        : isWrongPick
                                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                                          : isSelected
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                            : isAnswered
                                              ? 'border-slate-200 bg-white/60 text-slate-400'
                                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 cursor-pointer'
                                }`}
                            >
                                <span>{option}</span>
                                {isCorrectAnswer && (
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                                )}
                                {isWrongPick && <XCircle className="w-5 h-5 shrink-0 text-rose-400" />}
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {isAnswered && (
                        <motion.div
                            key={`feedback-${currentQuestion}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                                answeredCorrectly
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                            {answeredCorrectly ? (
                                'Riktig!'
                            ) : (
                                <>
                                    Riktig svar: <span className="font-bold">{correctAnswer}</span>
                                </>
                            )}
                            {question.explanation && (
                                <p className="mt-1 font-normal opacity-90">
                                    {question.explanation}
                                </p>
                            )}
                            {question.sourceUrl && (
                                <a
                                    href={question.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                    Les om dette i: {question.sourceTitle || 'artikkelen'}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isAnswered && (
                    <motion.button
                        onClick={submitAnswer}
                        disabled={!selectedOption}
                        initial={false}
                        animate={{ opacity: selectedOption ? 1 : 0.4 }}
                        whileTap={selectedOption ? { scale: 0.97 } : undefined}
                        className="focus-ring w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-indigo-500/25 transition-colors"
                    >
                        Svar
                    </motion.button>
                )}
                {isAnswered && (
                    <motion.button
                        onClick={nextQuestion}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        className="focus-ring w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-colors"
                    >
                        {currentQuestion < questions.length - 1 ? 'Neste' : 'Se resultat'}
                    </motion.button>
                )}
            </div>
        </QuizShell>
    );
};
