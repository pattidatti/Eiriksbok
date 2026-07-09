import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { ref, onValue, update, runTransaction, push, set, get } from 'firebase/database';
import { Trophy, CheckCircle, XCircle, Clock, Heart, ThumbsUp, Flame, Rocket, ArrowRight } from 'lucide-react';
import { useQuizAudio } from '../../hooks/useQuizAudio';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { QuizQuestion } from '../../types';
import { useProgressStore } from '../../features/progress/useProgressStore';

// Korrekthetssjekk delt mellom «anbefalt lesing»-rapporten og XP-registreringen
const isAnswerCorrect = (
    q: { correctAnswer?: unknown; options?: string[]; answer?: string | string[] },
    myAns: unknown
): boolean => {
    if (!myAns) return false;
    if (typeof q.correctAnswer === 'number') {
        return !!q.options && q.options[q.correctAnswer] === myAns;
    }
    if (q.answer) {
        if (Array.isArray(q.answer)) return JSON.stringify(myAns) === JSON.stringify(q.answer);
        return myAns === q.answer;
    }
    return false;
};

export const QuizPlayer: React.FC = () => {
    const { pin } = useParams();
    const navigate = useNavigate();
    const { playSound } = useQuizAudio();

    // Local State
    const [status, setStatus] = useState<string>('LOBBY');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [showResult, setShowResult] = useState(false);
    const [myName, setMyName] = useState('');
    const [myScore, setMyScore] = useState(0);
    const [myStreak, setMyStreak] = useState(0);
    const [lastPoints, setLastPoints] = useState<number>(0);
    const [isVisitingMe, setIsVisitingMe] = useState(false);

    const [isLobbyLocked, setIsLobbyLocked] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | string[] | null>(null);
    const [sortingOrder, setSortingOrder] = useState<string[]>([]);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [serverResult, setServerResult] = useState<any>(null);
    const [answerTime, setAnswerTime] = useState<number>(0);
    const [scoreProcessed, setScoreProcessed] = useState(false);

    // Lobby Juice
    const [localEmojis, setLocalEmojis] = useState<{ id: number, emoji: string, x: number, y: number }[]>([]);
    const [bgHue, setBgHue] = useState(0);


    const [questionStartTime, setQuestionStartTime] = useState<number>(0);

    const [allQuestions, setAllQuestions] = useState<any[]>([]);
    const [privateQuestions, setPrivateQuestions] = useState<any[]>([]);
    const [myAnswers, setMyAnswers] = useState<Record<string, any>>({}); // To store answer history from DB

    useEffect(() => {
        const playerId = sessionStorage.getItem('quiz_player_id');
        if (!playerId || !pin) {
            navigate('/quiz-battle');
            return;
        }

        // Listen to Room Status
        const roomRef = ref(db, `rooms/${pin}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                navigate('/quiz-battle');
                return;
            }

            setStatus(data.status);
            setCurrentQuestionIndex(data.currentQuestion);
            setShowResult(data.showResult);
            if (data.questions) setAllQuestions(data.questions);
            if (data.questionStartTime) setQuestionStartTime(data.questionStartTime);
            if (data.currentResult) setServerResult(data.currentResult);
            else setServerResult(null);

            // Get my own data
            const myData = data.players?.[playerId];
            if (myData) {
                setMyName(myData.name);
                setMyScore(myData.score);
                setMyStreak(myData.streak || 0);
                if (myData.answers) {
                    setMyAnswers(myData.answers);
                }

                // Restore Answer State if exists
                if (data.currentQuestion !== -1 && myData.answers && myData.answers[data.currentQuestion]) {
                    const savedAnswer = myData.answers[data.currentQuestion];
                    if (savedAnswer && !hasAnswered) {
                        setSelectedOption(savedAnswer);
                        setHasAnswered(true);
                        // Restore time if available
                        if (myData.answerTimes && myData.answerTimes[data.currentQuestion]) {
                            setAnswerTime(myData.answerTimes[data.currentQuestion]);
                        }
                    }
                }
            }
        });

        // Balloon Journey Listener
        const visitRef = ref(db, `rooms/${pin}/lobby/visitingPlayerId`);
        const unsubscribeVisit = onValue(visitRef, (snapshot) => {
            const visitingId = snapshot.val();
            const myId = sessionStorage.getItem('quiz_player_id');
            if (visitingId && visitingId === myId) {
                setIsVisitingMe(true);
                playSound('whoosh');
                setTimeout(() => setIsVisitingMe(false), 2000);
            }
        });

        // Lobby Lock Listener
        const lockRef = ref(db, `rooms/${pin}/lobby/isLocked`);
        const unsubscribeLock = onValue(lockRef, (snapshot) => {
            setIsLobbyLocked(snapshot.val() || false);
        });

        return () => {
            unsubscribe();
            unsubscribeVisit();
            unsubscribeLock();
        };
    }, [pin, navigate, playSound, hasAnswered]);

    // Fetch Private Questions on Finish for Report
    const [reportReady, setReportReady] = useState(false);
    useEffect(() => {
        if (status === 'FINISHED' && pin) {
            get(ref(db, `quiz-data/${pin}/questions`))
                .then((snap) => {
                    if (snap.exists()) {
                        setPrivateQuestions(snap.val());
                    }
                })
                .finally(() => setReportReady(true));
        }
    }, [status, pin]);

    // «Min læring»: registrer runden én gang når spillet er ferdig, med
    // andel riktige som score der fasiten finnes
    const progressRecorded = useRef(false);
    useEffect(() => {
        if (status !== 'FINISHED' || !reportReady || !pin || progressRecorded.current) return;
        progressRecorded.current = true;
        const total = privateQuestions.length;
        const correct = privateQuestions.filter((q, i) => isAnswerCorrect(q, myAnswers[i])).length;
        useProgressStore.getState().recordActivity({
            kind: 'quiz-completed',
            activityId: `quiz-battle/${pin}`,
            title: 'Quiz Battle',
            score: total > 0 ? correct / total : undefined,
        });
    }, [status, reportReady, pin, privateQuestions, myAnswers]);

    // Handle Question Change
    useEffect(() => {
        setHasAnswered(false);
        setSelectedOption(null);
        setSortingOrder([]);
        setIsCorrect(null);
        setServerResult(null);
        setScoreProcessed(false);
        setAnswerTime(0);
    }, [currentQuestionIndex]);

    // Handle Result Reveal & Score Calculation
    useEffect(() => {
        // If we haven't answered, we can't be correct.
        if (!showResult || !serverResult || scoreProcessed) return;

        // If we didn't answer, we don't calculate score, just mark processed
        if (!hasAnswered || !selectedOption) {
            setScoreProcessed(true);
            setIsCorrect(false); // Or null? treating as wrong for now.
            setMyStreak(0);
            return;
        }

        setScoreProcessed(true);

        // Check Correctness
        let isAnswerCorrect = false;
        if (typeof serverResult.correctAnswer === 'number') {
            // If answer is index, we need to map to our options.
            // NOTE: QuizHost shuffles options. Ensure indices match.
            // Assuming allQuestions[currentQuestionIndex] has the SAME shuffled order as Host
            // which it should if sync worked.
            const q = allQuestions[currentQuestionIndex];
            if (q && q.options) {
                const correctOptionText = q.options[serverResult.correctAnswer];
                isAnswerCorrect = selectedOption === correctOptionText;
            }
        } else if (serverResult.answer) {
            if (Array.isArray(serverResult.answer)) {
                // Sorting Check (Arrays must match exactly)
                isAnswerCorrect = JSON.stringify(selectedOption) === JSON.stringify(serverResult.answer);
            } else {
                isAnswerCorrect = selectedOption === serverResult.answer;
            }
        }

        setIsCorrect(isAnswerCorrect);

        if (isAnswerCorrect) {
            playSound('correct');
            // Speed Calculation
            const now = answerTime; // Use stored answer time
            const elapsed = now - questionStartTime;
            const duration = 30000; // 30s
            const timeLeft = Math.max(0, duration - elapsed);

            const speedRatio = timeLeft / duration;
            // Base score: Linear from 30 (instant) down to 1 (last second)
            const baseScore = 1 + Math.round(29 * speedRatio);

            // Streak Calculation
            const newStreak = myStreak + 1;
            let multiplier = 1 + (newStreak > 1 ? (newStreak - 1) * 0.1 : 0);
            if (multiplier > 2) multiplier = 2; // Cap at 2x

            // Final score with multiplier
            const points = Math.floor(baseScore * multiplier);

            const newScore = myScore + points;

            setLastPoints(points);

            // Update Firebase
            const playerId = sessionStorage.getItem('quiz_player_id');
            if (playerId && pin) {
                update(ref(db, `rooms/${pin}/players/${playerId}`), {
                    score: newScore,
                    streak: newStreak
                });
            }

            // Optimistic update
            setMyScore(newScore);
            setMyStreak(newStreak);
        } else {
            playSound('wrong');
            // Reset Streak
            const playerId = sessionStorage.getItem('quiz_player_id');
            if (playerId && pin) {
                update(ref(db, `rooms/${pin}/players/${playerId}`), { streak: 0 });
            }
            setMyStreak(0);
        }
    }, [showResult, hasAnswered, serverResult, scoreProcessed, allQuestions, currentQuestionIndex, selectedOption, answerTime, questionStartTime, myScore, myStreak, pin, playSound]);

    const submitAnswer = async (option: string | string[]) => {
        if (hasAnswered || showResult) return;

        const playerId = sessionStorage.getItem('quiz_player_id');
        if (!playerId) return;

        // eslint-disable-next-line react-hooks/purity -- event handler, not render path
        const now = Date.now();
        setAnswerTime(now);
        setSelectedOption(option);
        setHasAnswered(true);
        playSound('click');

        const updates: any = {};
        updates[`rooms/${pin}/players/${playerId}/answers/${currentQuestionIndex}`] = option;
        updates[`rooms/${pin}/players/${playerId}/answerTimes/${currentQuestionIndex}`] = now;
        updates[`rooms/${pin}/players/${playerId}/lastAnswer`] = option;

        await update(ref(db), updates);
    };

    // --- RENDER ---

    if (status === 'LOBBY' || currentQuestionIndex === -1) {
        return (
            <div
                className="fixed inset-0 top-0 left-0 w-screen h-screen flex flex-col items-center justify-start pt-16 p-6 text-center transition-colors duration-300 overflow-hidden z-50"
                style={{ backgroundColor: `hsl(${220 + bgHue}, 90%, 95%)` }}
            >
                {/* Local Floating Emojis */}
                <AnimatePresence>
                    {localEmojis.map(emoji => (
                        <motion.div
                            key={emoji.id}
                            initial={{ x: emoji.x, y: emoji.y, opacity: 1, scale: 0.5 }}
                            animate={{ y: -100, opacity: 0, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="fixed text-4xl pointer-events-none z-50"
                        >
                            {emoji.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div className="animate-bounce mb-8">
                    <Clock className="w-24 h-24 text-indigo-600 opacity-80" />
                </div>
                <h1 className="text-7xl font-black mb-4 text-slate-800">Du er inne! 🎉</h1>
                <p className="text-3xl text-slate-600 mb-12 max-w-md mx-auto font-bold">Venter på at læreren skal starte spillet...</p>

                <div className="p-8 w-full max-w-md border-b-4 border-slate-200 mb-8">
                    <div className="text-xl uppercase tracking-widest text-slate-400 mb-2 font-bold">Ditt navn</div>
                    <div className="text-6xl font-black text-indigo-600">{myName}</div>
                </div>

                <div className="text-3xl font-mono text-slate-400 font-bold mb-12">PIN: {pin}</div>

                {/* Minigame Controls */}
                <div className="w-full max-w-sm">
                    <button
                        disabled={isLobbyLocked}
                        onClick={() => {
                            if (isLobbyLocked) return;
                            const lobbyRef = ref(db, `rooms/${pin}/lobby/balloonSize`);
                            runTransaction(lobbyRef, (current) => (current || 0) + 5);
                            playSound('click');
                        }}
                        className={`w-full text-white font-black text-2xl py-6 rounded-3xl shadow-xl transition-transform mb-8 flex items-center justify-center gap-4 ${isLobbyLocked ? 'bg-slate-400 opacity-50 cursor-not-allowed' : 'bg-red-500 active:scale-95'}`}
                    >
                        <span className="text-4xl">🎈</span> {isLobbyLocked ? 'Venter...' : 'PUMP!'}
                    </button>

                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500 bg-blue-50' },
                            { emoji: '❤️', icon: Heart, color: 'text-red-500 bg-red-50' },
                            { emoji: '🔥', icon: Flame, color: 'text-orange-500 bg-orange-50' },
                            { emoji: '🚀', icon: Rocket, color: 'text-purple-500 bg-purple-50' }
                        ].map((item, i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.8 }}
                                onClick={() => {
                                    const reactionRef = ref(db, `rooms/${pin}/reactions`);
                                    const newRef = push(reactionRef);
                                    set(newRef, { emoji: item.emoji, timestamp: Date.now() });

                                    // Local Juice
                                    setBgHue(prev => (prev + 10) % 360);
                                    const id = Date.now() + Math.random();
                                    const btnRect = (document.activeElement as HTMLElement)?.getBoundingClientRect();
                                    const startX = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2;
                                    const startY = btnRect ? btnRect.top : window.innerHeight / 2;

                                    setLocalEmojis(prev => [...prev, { id, emoji: item.emoji, x: startX - 20 + Math.random() * 40, y: startY }]);

                                    // Cleanup emoji after 1s
                                    setTimeout(() => {
                                        setLocalEmojis(prev => prev.filter(e => e.id !== id));
                                    }, 1000);

                                    // Also pump the balloon slightly if NOT locked
                                    if (!isLobbyLocked) {
                                        const lobbyRef = ref(db, `rooms/${pin}/lobby/balloonSize`);
                                        runTransaction(lobbyRef, (current) => (current || 0) + 1);
                                    }

                                    playSound('join');
                                }}
                                className={`${item.color} p-4 rounded-2xl flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer`}
                            >
                                <item.icon className="w-8 h-8" />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Balloon Journey Overlay (Lobby) */}
                <AnimatePresence>
                    {isVisitingMe && (
                        <motion.div
                            initial={{ x: '-100vw', y: 0, scale: 0.5 }}
                            animate={{ x: '100vw', y: -200, scale: 1.5, rotate: 10 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                            className="fixed top-1/2 left-0 z-[100] text-9xl pointer-events-none drop-shadow-2xl"
                        >
                            🎈
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (status === 'FINISHED') {
        const hasPrivateData = privateQuestions.length > 0;

        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center overflow-y-auto">
                <Trophy className="w-32 h-32 text-yellow-500 mb-8 shrink-0" />
                <h1 className="text-7xl font-black mb-6 shrink-0">Spillet er ferdig</h1>
                <p className="text-3xl mb-4 text-slate-600 font-bold shrink-0">Du fikk</p>
                <div className="text-9xl font-black text-indigo-600 mb-12 shrink-0">{myScore}</div>

                {/* Study Recommendations */}
                {hasPrivateData && (
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden mb-8 text-left shrink-0">
                        <div className="bg-slate-100 p-4 font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span>📚</span> Anbefalt lesing
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {(() => {
                                const wrongLinks: any[] = [];
                                privateQuestions.forEach((q, i) => {
                                    const isCorrect = isAnswerCorrect(q, myAnswers[i]);

                                    if (!isCorrect) {
                                        if (q.sourceLessonId && q.sourceSubjectId && q.sourceTopicId) {
                                            // Deduplicate
                                            const link = `/fag/${q.sourceSubjectId}/${q.sourceTopicId}/${q.sourceSubTopicId ? `${q.sourceSubTopicId}/` : ''}${q.sourceLessonId}`;
                                            const title = q.sourceTitle;
                                            if (!wrongLinks.find(l => l.link === link)) {
                                                wrongLinks.push({ link, title });
                                            }
                                        }
                                    }
                                });

                                if (wrongLinks.length === 0) return <div className="p-4 text-center text-green-600 font-bold">Alt riktig! Du er en stjerne! 🌟</div>;

                                return wrongLinks.map((l, idx) => (
                                    <a
                                        key={idx}
                                        href={l.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-4 hover:bg-indigo-50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700">{l.title}</span>
                                            <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600" />
                                        </div>
                                    </a>
                                ));
                            })()}
                        </div>
                    </div>
                )}
                {!hasPrivateData && <div className="mb-8 text-slate-400">Laster statistikk...</div>}

                <button onClick={() => navigate('/quiz-battle')} className="bg-indigo-600 text-white px-12 py-6 rounded-full font-bold shadow-lg active:scale-95 transition-transform text-3xl shrink-0">Spill igjen</button>
            </div>
        );
    }

    // GAMEPLAY
    const currentQ: QuizQuestion = allQuestions[currentQuestionIndex];
    if (!currentQ) return <div className="p-8 text-center h-screen flex items-center justify-center text-slate-500 font-bold text-3xl">Laster...</div>;

    // Initial Sort Order Setup
    if (currentQ.type === 'sorting' && sortingOrder.length === 0 && !hasAnswered) {
        setSortingOrder([...currentQ.options]); // Start with shuffled options
    }

    if (showResult) {
        const currentMultiplier = Math.min(2, 1 + (myStreak > 1 ? (myStreak - 1) * 0.1 : 0));

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`h-screen flex flex-col items-center justify-center p-4 text-center ${isCorrect ? 'bg-green-50' : 'bg-red-50'} transition-colors duration-500`}
                >
                    {isCorrect ? (
                        <>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring' }}>
                                <CheckCircle className="w-40 h-40 mb-8 text-green-600" />
                            </motion.div>
                            <h1 className="text-8xl font-black mb-4 text-green-800">Riktig!</h1>
                            <p className="text-5xl text-green-700 font-black mb-2">+{lastPoints} poeng</p>
                            {myStreak > 1 && (
                                <div className="text-3xl text-orange-500 font-bold animate-pulse">
                                    🔥 {myStreak} på rad! ({currentMultiplier.toFixed(1)}x)
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <motion.div initial={{ x: -50 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 10 }}>
                                <XCircle className="w-40 h-40 mb-8 text-red-600" />
                            </motion.div>
                            <h1 className="text-8xl font-black mb-4 text-red-800">
                                {hasAnswered ? "Feil..." : "For sent!"}
                            </h1>
                            <p className="text-4xl text-red-700 font-bold">
                                {hasAnswered ? "Bedre lykke neste gang!" : "Du svarte ikke i tide ⏳"}
                            </p>
                        </>
                    )}
                    <div className="mt-20 text-slate-400 animate-pulse font-bold text-2xl">Se resultatliste på storskjermen</div>
                </motion.div>
            </AnimatePresence >
        );
    }

    return (
        <div className="h-screen p-2 flex flex-col overflow-hidden">
            {/* Header - Transparent & HUGE */}
            <div className="flex justify-between items-end p-4 mb-4 border-b-2 border-slate-100 pb-4">
                <div className="flex flex-col">
                    <span className="text-xl text-slate-500 uppercase font-bold mb-1">Spørsmål</span>
                    <span className="text-slate-900 font-black text-6xl leading-none">{currentQuestionIndex + 1}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl text-slate-500 uppercase font-bold mb-1">Din Score</span>
                    <span className="text-indigo-600 font-black text-6xl leading-none">{myScore}</span>
                </div>
            </div>

            {/* Question Type Rendering */}
            {currentQ.type === 'sorting' ? (
                <div className="flex-1 px-4 pb-32 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                    <p className="text-slate-500 mb-4 font-bold uppercase tracking-widest text-center">Dra kortene i riktig rekkefølge 👇</p>

                    <Reorder.Group axis="y" values={sortingOrder} onReorder={setSortingOrder} className="w-full space-y-3">
                        {sortingOrder.map((item) => (
                            <Reorder.Item key={item} value={item}>
                                <div className="bg-white border-4 border-indigo-100 p-6 rounded-2xl shadow-lg flex items-center gap-4 active:scale-105 transition-transform touch-none">
                                    <div className="text-slate-300">☰</div>
                                    <span className="font-bold text-xl text-slate-800">{item}</span>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {!hasAnswered && (
                        <button
                            onClick={() => submitAnswer(sortingOrder)}
                            className="mt-8 w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-transform"
                        >
                            SEND SVAR 🚀
                        </button>
                    )}
                </div>
            ) : currentQ.type === 'boolean' ? (
                <div className="flex-1 content-center grid grid-cols-2 gap-4 pb-safe px-2">
                    {['Sant', 'Usant'].map((opt, i) => (
                        <button
                            key={opt}
                            onClick={() => submitAnswer(opt)}
                            disabled={hasAnswered}
                            className={`
                                h-64 rounded-2xl border-b-[12px] font-black text-5xl shadow-xl transition-all flex items-center justify-center
                                ${i === 0 ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white'}
                                ${hasAnswered && selectedOption !== opt ? 'opacity-30 scale-95 grayscale' : ''}
                                ${hasAnswered && selectedOption === opt ? 'scale-105 ring-8 ring-slate-900 z-10' : 'active:scale-95'}
                            `}
                        >
                            {opt === 'Sant' ? '👍 SANT' : '👎 USANT'}
                        </button>
                    ))}
                </div>
            ) : (
                // STANDARD MULTIPLE CHOICE
                <div className="flex-1 content-center grid grid-cols-2 gap-4 pb-safe px-2">
                    {currentQ.options.map((opt: string, i: number) => {
                        // Colors for buttons
                        const colors = [
                            'bg-red-500 border-red-600 text-white',
                            'bg-blue-500 border-blue-600 text-white',
                            'bg-yellow-500 border-yellow-600 text-white',
                            'bg-green-500 border-green-600 text-white'
                        ];

                        return (
                            <button
                                key={i}
                                onClick={() => submitAnswer(opt)}
                                disabled={hasAnswered}
                                className={`
                                    h-48 rounded-2xl border-b-[12px] font-black text-3xl md:text-5xl shadow-xl transition-all flex items-center justify-center p-4 leading-none
                                    ${colors[i % 4]}
                                    ${hasAnswered && selectedOption !== opt ? 'opacity-30 scale-95 grayscale' : ''}
                                    ${hasAnswered && selectedOption === opt ? 'scale-105 ring-8 ring-slate-900 z-10' : 'active:scale-95'}
                                `}
                            >
                                <span className="line-clamp-4 drop-shadow-md">{opt}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {hasAnswered && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-20 animate-in fade-in duration-200">
                    <div className="bg-white text-slate-900 px-12 py-8 rounded-3xl font-black text-4xl shadow-2xl transform scale-110 border-8 border-indigo-50 animate-pulse">
                        Svar sendt! 🚀
                        <div className="text-lg text-slate-400 font-normal mt-4 text-center">Vent på resultat... 🤞</div>
                    </div>
                </div>
            )}

            {/* Balloon Journey Overlay */}
            <AnimatePresence>
                {isVisitingMe && (
                    <motion.div
                        initial={{ x: '-100vw', y: 0, scale: 0.5 }}
                        animate={{ x: '100vw', y: -200, scale: 1.5, rotate: 10 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        className="fixed top-1/2 left-0 z-[100] text-9xl pointer-events-none drop-shadow-2xl"
                    >
                        🎈
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
