import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { QuizQuestion } from '../types';
import './Quiz.css';
import { motion } from 'framer-motion';
import { captureQuizAnswer } from '../utils/reviewCapture';
import { useProgressStore } from '../features/progress/useProgressStore';
import { correctPop, wrongShake, celebrateCompletion } from './ui/answerFeedback';

interface QuizProps {
    questions: QuizQuestion[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    useEffect(() => {
        if (questions && questions[currentQuestion]) {
            const options = [...questions[currentQuestion].options];
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            setShuffledOptions(options);
        }
    }, [currentQuestion, questions]);

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const getCorrectAnswer = (q: QuizQuestion) => {
        if (typeof q.correctAnswer === 'number') {
            return q.options[q.correctAnswer];
        }
        return q.answer || '';
    };

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
            setScore(score + 1);
            setCorrectCount(correctCount + 1);
            setStreak(streak + 1);
        } else {
            setScore(score - 1);
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        if (Date.now() - answeredAtRef.current < 350) return;
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
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

    if (showResult) {
        const ratio = questions.length > 0 ? correctCount / questions.length : 0;
        const emoji = ratio === 1 ? '🏆' : ratio >= 0.7 ? '🎉' : ratio >= 0.4 ? '💪' : '📖';
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="quiz-container quiz-result"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
                    className="text-5xl text-center mb-4"
                >
                    {emoji}
                </motion.div>
                <h3>Quiz fullført!</h3>
                <p>Du fikk {correctCount} av {questions.length} riktige.</p>
                <button className="next-btn pressable focus-ring" onClick={() => window.location.reload()}>Start på nytt</button>
            </motion.div>
        )
    }

    if (!questions || questions.length === 0) return null;

    const question = questions[currentQuestion];
    const correctAnswer = getCorrectAnswer(question);

    return (
        <div className="quiz-container">
            {/* Gamification Header */}
            <div className="flex justify-between items-center mb-6 px-4">
                {/* Streak */}
                <div className="flex items-center gap-2">
                    <motion.div
                        key={streak}
                        initial={{ scale: 1 }}
                        animate={streak > 0 ? { scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] } : { scale: [1, 0.8, 1], x: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                    >
                        {streak > 0 ? (
                            <span className="text-2xl">⭐</span>
                        ) : (
                            <span className="text-2xl grayscale opacity-50">⭐</span>
                        )}
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Streak</span>
                        <span className={`text-xl font-bold ${streak > 2 ? 'text-amber-500' : 'text-slate-700'}`}>{streak}</span>
                    </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poeng</span>
                    <span className={`text-xl font-bold ${score >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>{score}</span>
                </div>
            </div>

            <div className="question-card">
                <p className="question-text">{question.question}</p>

                {question.sourceUrl && (
                    <div className="text-center mb-6">
                        <a
                            href={question.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium flex items-center justify-center gap-1"
                        >
                            <span>Les om dette i: {question.sourceTitle || 'artikkelen'}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    </div>
                )}

                <div className="options-grid">
                    {shuffledOptions.map((option) => {
                        const isCorrectAnswer = isAnswered && option === correctAnswer;
                        const isWrongPick = isAnswered && selectedOption === option && option !== correctAnswer;
                        return (
                            <motion.button
                                key={option}
                                animate={isCorrectAnswer ? correctPop : isWrongPick ? wrongShake : undefined}
                                whileTap={!isAnswered ? { scale: 0.97 } : undefined}
                                className={`option-btn focus-ring ${selectedOption === option ? 'selected' : ''} ${isCorrectAnswer ? 'correct' : ''} ${isWrongPick ? 'wrong' : ''}`}
                                onClick={() => handleOptionClick(option)}
                                disabled={isAnswered}
                            >
                                {option}
                            </motion.button>
                        );
                    })}
                </div>
                {!isAnswered && selectedOption && (
                    <motion.button
                        className="submit-btn focus-ring"
                        onClick={submitAnswer}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Svar
                    </motion.button>
                )}
                {isAnswered && (
                    <div className="flex flex-col gap-4">
                        <motion.button
                            className="next-btn focus-ring"
                            onClick={nextQuestion}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {currentQuestion < questions.length - 1 ? 'Neste' : 'Se resultat'}
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
};
