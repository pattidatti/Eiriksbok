import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { ref, onValue, update, remove, set, onChildAdded } from 'firebase/database';
import { useManifest } from '../../hooks/useManifest';
import { fetchLesson } from '../../utils/contentLoader';
import { ArrowRight } from 'lucide-react';
import { useQuizAudio } from '../../hooks/useQuizAudio';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';

import type { QuizQuestion } from '../../types';

export const QuizHost: React.FC = () => {
    const { pin } = useParams();
    const navigate = useNavigate();
    const { data: manifest } = useManifest();
    const { playSound } = useQuizAudio();

    const [roomData, setRoomData] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [privateQuestions, setPrivateQuestions] = useState<any[]>([]); // Full questions with answers
    const [debugStatus, setDebugStatus] = useState<string>('');

    // Setup State
    const [isSetup, setIsSetup] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    // Lobby State
    const [balloonSize, setBalloonSize] = useState(0);
    const [floatingEmojis, setFloatingEmojis] = useState<any[]>([]);
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ '👍': 0, '❤️': 0, '🔥': 0, '🚀': 0 });
    const [flyingBalloonStatus, setFlyingBalloonStatus] = useState<'IDLE' | 'FLYING_OUT' | 'VISITING' | 'RETURNING'>('IDLE');

    const [cooldownTimer, setCooldownTimer] = useState(0);

    // Refs for stale closure fix
    const playersRef = useRef(players);
    useEffect(() => { playersRef.current = players; }, [players]);

    // Game State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [showResult, setShowResult] = useState(false); // Result of current question
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Sync Room Data
    useEffect(() => {
        if (!pin) return;
        const roomRef = ref(db, `rooms/${pin}`);
        const privateRef = ref(db, `quiz-data/${pin}/questions`);

        // Reset balloon on load (if host refreshes)
        set(ref(db, `rooms/${pin}/lobby/balloonSize`), 0);

        // Lobby Minigame Listeners
        const reactionsRef = ref(db, `rooms/${pin}/reactions`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Play sound throttled
                setRoomData(data);
                if (data.players) {
                    setPlayers(Object.entries(data.players).map(([id, p]: any) => ({ ...p, id })));
                }

                // Sync local state with remote state
                if (data.questions) setIsSetup(false);
                setCurrentQuestionIndex(data.currentQuestion);
                setShowResult(data.showResult);
            } else {
                // Room deleted
                navigate('/quiz-battle/admin-999');
            }
        });

        const unsubscribePrivate = onValue(privateRef, (snapshot) => {
            if (snapshot.exists()) {
                setPrivateQuestions(snapshot.val());
            }
        });

        const unsubscribeBalloonWatch = onValue(ref(db, `rooms/${pin}/lobby/balloonSize`), (snapshot) => {
            const val = snapshot.val() || 0;
            if (val >= 100 && flyingBalloonStatus === 'IDLE') {
                startBalloonJourney();
            }
            setBalloonSize(val);
        });

        const unsubscribeReactions = onChildAdded(reactionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const id = snapshot.key || Date.now();

                // Track counts
                setReactionCounts(prev => ({
                    ...prev,
                    [data.emoji]: (prev[data.emoji] || 0) + 1
                }));

                // Add to floating emojis
                setFloatingEmojis(prev => [...prev, { id, emoji: data.emoji, x: Math.random() * 80 + 10 }]);

                // Cleanup floating emoji
                setTimeout(() => {
                    setFloatingEmojis(prev => prev.filter(e => e.id !== id));
                }, 3000);

                // Remove from firebase to keep it clean (and act as event stream)
                remove(ref(db, `rooms/${pin}/reactions/${snapshot.key}`));
            }
        });

        return () => {
            unsubscribe();
            unsubscribePrivate();
            unsubscribeBalloonWatch();
            unsubscribeReactions();
        };
    }, [pin, navigate, playSound, flyingBalloonStatus]);

    // Auto-advance Logic
    const [optionsVisible, setOptionsVisible] = useState(false);

    useEffect(() => {
        setOptionsVisible(false);
        if (currentQuestionIndex !== -1 && !showResult && !showLeaderboard) {
            const t = setTimeout(() => setOptionsVisible(true), 4000); // 4s delay
            return () => clearTimeout(t);
        }
    }, [currentQuestionIndex, showResult, showLeaderboard]);

    useEffect(() => {
        if (!roomData || roomData.status !== 'PLAYING' || showResult || showLeaderboard || currentQuestionIndex === -1) return;

        // Count answers
        let answeredCount = 0;
        players.forEach(p => {
            if (p.answers && p.answers[currentQuestionIndex] !== undefined) {
                answeredCount++;
            }
        });

        if (players.length > 0 && answeredCount === players.length) {
            // All players answered!
            const timer = setTimeout(() => {
                revealResult();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [roomData, players, currentQuestionIndex, showResult, showLeaderboard, pin]);

    // Data Filtering
    const subjects = useMemo(() => manifest?.subjects.map(s => s.id) || [], [manifest]);
    const topics = useMemo(() => {
        if (!manifest) return [];
        if (selectedSubject === 'all') return manifest.subjects.flatMap(s => s.topics.map(t => t.id));
        const subject = manifest.subjects.find(s => s.id === selectedSubject);
        return subject ? subject.topics.map(t => t.id) : [];
    }, [manifest, selectedSubject]);

    // Timer Logic
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: any;
        if (roomData?.status === 'PLAYING' && !showResult && !showLeaderboard && currentQuestionIndex !== -1) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 5 && prev > 1) {
                        playSound('timer_warn');
                    }
                    if (prev <= 1) {
                        // Auto-skip logic
                        clearInterval(interval);
                        // Trigger next step via Firebase
                        playSound('timer_end');
                        revealResult();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(30); // Reset when not in question
        }
        return () => clearInterval(interval);
    }, [roomData?.status, showResult, showLeaderboard, currentQuestionIndex, pin, playSound]);

    // Cooldown Timer
    useEffect(() => {
        let interval: any;
        if (cooldownTimer > 0) {
            interval = setInterval(() => {
                setCooldownTimer(prev => prev - 1);
            }, 1000);
        } else if (cooldownTimer === 0 && flyingBalloonStatus === 'RETURNING') {
            // Reset after cooldown
            setFlyingBalloonStatus('IDLE');
            set(ref(db, `rooms/${pin}/lobby/balloonSize`), 0);
            set(ref(db, `rooms/${pin}/lobby/isLocked`), false);
        }
        return () => clearInterval(interval);
    }, [cooldownTimer, flyingBalloonStatus, pin]);

    // BALLOON JOURNEY LOGIC
    const startBalloonJourney = () => {
        setFlyingBalloonStatus('FLYING_OUT');
        set(ref(db, `rooms/${pin}/lobby/isLocked`), true); // Lock pumping
        playSound('whoosh');

        // 1. Fly Out Animation (Host)
        setTimeout(() => {
            setFlyingBalloonStatus('VISITING');
            visitNextPlayer(0);
        }, 2000);
    };

    const visitNextPlayer = (index: number) => {
        const currentPlayers = playersRef.current;
        if (index >= currentPlayers.length) {
            // All visited, return home
            set(ref(db, `rooms/${pin}/lobby/visitingPlayerId`), null);
            setFlyingBalloonStatus('RETURNING');
            setCooldownTimer(5); // Start 5s cooldown
            playSound('whoosh');
            return;
        }

        const currentPlayer = currentPlayers[index];
        if (currentPlayer) {
            // Tell Firebase who is being visited
            set(ref(db, `rooms/${pin}/lobby/visitingPlayerId`), currentPlayer.id);
        }

        // Next player in 2 seconds (fly time)
        setTimeout(() => {
            visitNextPlayer(index + 1);
        }, 2000);
    };

    const resetGame = async () => {
        // Reset everything to handle "Play Again" flow if needed
        // For now just standard start
        update(ref(db, `rooms/${pin}`), { currentQuestion: 0, status: 'PLAYING', questionStartTime: Date.now() });
    };

    const startGameSetup = async () => {
        setDebugStatus('Start clicked...');
        console.log('startGameSetup clicked. Pin:', pin, 'Manifest:', manifest ? 'Loaded' : 'Missing');

        if (!pin) {
            setDebugStatus('Mangler PIN!');
            alert('Feil: Mangler PIN-kode for rommet.');
            return;
        }
        if (!manifest) {
            setDebugStatus('Mangler manifest!');
            alert('Feil: Innholdsoversikten (manifest) er ikke lastet inn ennå. Prøv å laste siden på nytt.');
            return;
        }
        setIsLoadingQuestions(true);

        try {
            setDebugStatus('Henter leksjonsliste... (Logger inn)');

            // Ensure auth
            try {
                await signInAnonymously(auth);
            } catch (authError) {
                console.warn("Anonymous auth failed, trying to proceed anyway:", authError);
            }

            // 1. Fetch Questions
            const lessonsToFetch: any[] = [];

            console.log('Starting game setup...');
            manifest.subjects.forEach(subject => {
                if (selectedSubject !== 'all' && subject.id !== selectedSubject) return;

                subject.topics.forEach(topic => {
                    if (selectedTopic !== 'all' && topic.id !== selectedTopic) return;

                    // Add topic lessons
                    topic.lessons?.forEach(lesson => {
                        lessonsToFetch.push({ subjectId: subject.id, topicId: topic.id, lessonId: lesson.id });
                    });

                    // Add subtopic lessons (SAFE ACCESS)
                    topic.subTopics?.forEach(subTopic => {
                        subTopic.lessons?.forEach(lesson => {
                            lessonsToFetch.push({ subjectId: subject.id, topicId: topic.id, subTopicId: subTopic.id, lessonId: lesson.id });
                        });
                    });
                });
            });

            console.log('Lessons to fetch:', lessonsToFetch);

            if (lessonsToFetch.length === 0) {
                alert('Fant ingen leksjoner med valgte filtre!');
                setIsLoadingQuestions(false);
                setDebugStatus('Ingen leksjoner funnet.');
                return;
            }

            setDebugStatus(`Henter ${lessonsToFetch.length} leksjoner...`);
            const results = await Promise.all(lessonsToFetch.map(l => fetchLesson(l.subjectId, l.topicId, l.lessonId, l.subTopicId).catch(() => null)));
            let allQuestions: QuizQuestion[] = [];

            setDebugStatus('Prosesserer spørsmål...');
            results.forEach((lesson, index) => {
                if (!lesson) return;
                const meta = lessonsToFetch[index];

                if (lesson?.quiz && Array.isArray(lesson.quiz)) {
                    // Shuffle Options for each question
                    const textQuestions = lesson.quiz.map(q => {
                        // Create a copy of options with original indices
                        const optionsWithIndex = q.options.map((opt, i) => ({ opt, i }));

                        // Shuffle the options
                        optionsWithIndex.sort(() => Math.random() - 0.5);

                        // Map back to string array
                        const shuffledOptions = optionsWithIndex.map(o => o.opt);

                        // Find where the correct answer moved
                        let newCorrectAnswer = q.correctAnswer;
                        if (typeof q.correctAnswer === 'number') {
                            const newIndex = optionsWithIndex.findIndex(o => o.i === q.correctAnswer);
                            newCorrectAnswer = newIndex;
                        }

                        return {
                            ...q,
                            sourceTitle: lesson.title,
                            sourceSubjectId: meta.subjectId,
                            sourceTopicId: meta.topicId,
                            sourceLessonId: meta.lessonId,
                            sourceSubTopicId: meta.subTopicId || null,
                            options: shuffledOptions,
                            correctAnswer: newCorrectAnswer
                        };
                    });

                    allQuestions.push(...textQuestions);
                }
            });

            setDebugStatus(`Fant ${allQuestions.length} spørsmål. Blander...`);

            // Shuffle and limit
            allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 15);

            if (allQuestions.length === 0) {
                alert('Fant ingen spørsmål i de valgte leksjonene!');
                setIsLoadingQuestions(false);
                setDebugStatus('Ingen spørsmål funnet.');
                return;
            }

            // 2. Save to Firebase
            setDebugStatus('Lagrer til database...');
            const updates: any = {};

            // Public Questions (Sanitized)
            const publicQuestions = allQuestions.map(q => {
                const { correctAnswer, answer, ...rest } = q; // Remove answer keys
                return rest;
            });

            // Store Private Questions separately
            updates[`quiz-data/${pin}/questions`] = allQuestions;

            // Store Public Data
            updates[`rooms/${pin}/questions`] = publicQuestions;
            updates[`rooms/${pin}/status`] = 'LOBBY';
            updates[`rooms/${pin}/currentQuestion`] = -1;
            updates[`rooms/${pin}/showResult`] = false;
            updates[`rooms/${pin}/currentResult`] = null; // Clear old results
            updates[`rooms/${pin}/lobby/balloonSize`] = 0; // Reset balloon
            updates[`rooms/${pin}/lobby/isLocked`] = false;
            updates[`rooms/${pin}/questionStartTime`] = 0;

            await update(ref(db), updates);
            setDebugStatus('Ferdig! Starter spill...');
            setIsSetup(false);

        } catch (e) {
            console.error(e);
            setDebugStatus('Feil: ' + (e as any).message);

            // Helpful Error Message for Firebase Permissions
            if ((e as any).message && (e as any).message.includes('PERMISSION_DENIED')) {
                alert('FEIL: Kunne ikke opprette rom. Firebase-tilgang nektet.\n\nÅrsak: Sikkerhetsreglene i Firebase Console har sannsynligvis utløpt.\n\nLøsning: Gå til Firebase Console -> Realtime Database -> Rules og oppdater reglene.');
            } else {
                alert('Feil ved henting av spørsmål: ' + (e as any).message);
            }
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const nextStep = async () => {
        // Use privateQuestions for length check if available, else fallback
        const questions = privateQuestions.length > 0 ? privateQuestions : roomData?.questions;
        if (!questions) return;

        const total = questions.length;

        if (showLeaderboard) {
            // Was showing leaderboard, move to next question
            const nextIdx = currentQuestionIndex + 1;
            if (nextIdx >= total) {
                // End game
                update(ref(db, `rooms/${pin}`), { status: 'FINISHED' });
            } else {
                update(ref(db, `rooms/${pin}`), {
                    currentQuestion: nextIdx,
                    showResult: false,
                    currentResult: null, // Reset result
                    questionStartTime: Date.now() // Start timer for scoring
                });
                setShowLeaderboard(false);
            }
        } else if (showResult) {
            // Was showing result, move to leaderboard
            setShowLeaderboard(true);
        } else {
            // Was showing question, reveal result
            playSound('reveal');
            revealResult();
        }
    };

    function revealResult() {
        const q = privateQuestions[currentQuestionIndex];
        if (!q) return;

        // Construct result object
        const result: any = {
            correctAnswer: q.correctAnswer
        };

        // Only add answer string if it exists (Firebase crashes on undefined)
        if (q.answer !== undefined) {
            result.answer = q.answer;
        }

        update(ref(db, `rooms/${pin}`), {
            showResult: true,
            currentResult: result
        });
    }

    // Renders
    if (!roomData) return <div className="p-8 text-center">Laster rom...</div>;

    // 1. Setup Screen
    if (isSetup) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-6 text-slate-800">Sett opp spill for rom {pin}</h1>
                <div className="bg-white p-6 rounded-xl shadow border border-slate-200 mb-6">
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Velg fag</label>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setSelectedSubject('all')} className={`px-3 py-1 rounded ${selectedSubject === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>Alle</button>
                            {subjects.map(s => (
                                <button key={s} onClick={() => setSelectedSubject(s)} className={`px-3 py-1 rounded ${selectedSubject === s ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block font-bold mb-2">Velg emne</label>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setSelectedTopic('all')} className={`px-3 py-1 rounded ${selectedTopic === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100'}`}>Alle</button>
                            {topics.map(t => (
                                <button key={t} onClick={() => setSelectedTopic(t)} className={`px-3 py-1 rounded ${selectedTopic === t ? 'bg-purple-600 text-white' : 'bg-slate-100'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={startGameSetup}
                        disabled={isLoadingQuestions}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoadingQuestions ? 'Laster spørsmål...' : 'Gjør klart spill (DEBUG MODE)'}
                    </button>
                    {debugStatus && <div className="mt-4 text-center text-slate-500 font-mono">{debugStatus}</div>}
                </div>
            </div>
        );
    }

    // 2. Lobby Screen (Waiting to start 1st question)
    if (currentQuestionIndex === -1 && roomData.status !== 'FINISHED') {
        return (
            <div className="min-h-screen p-8 flex flex-col items-center relative overflow-hidden">
                {/* Floating Emojis Layer */}
                {floatingEmojis.map(e => (
                    <motion.div
                        key={e.id}
                        initial={{ y: '100vh', opacity: 1 }}
                        animate={{ y: '-10vh', opacity: 0 }}
                        transition={{ duration: 3, ease: 'easeOut' }}
                        className="absolute text-6xl pointer-events-none"
                        style={{ left: `${e.x}%` }}
                    >
                        {e.emoji}
                    </motion.div>
                ))}

                <div className="text-center mb-12 z-10">
                    <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-4">Gå til <span className="text-indigo-600">bok.haaland.de/quiz-battle</span></h2>
                    <div className="text-9xl font-black font-mono text-indigo-600 tracking-tighter mb-4 inline-block drop-shadow-sm">{pin}</div>
                    <div className="flex items-center justify-center gap-2 mt-4 mb-8">
                        <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">Spillere:</span>
                        <span className="text-3xl font-black text-slate-800">{players.length}</span>
                    </div>

                    {/* Emoji Counters (Moved here) */}
                    <div className="flex justify-center gap-8">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <div key={emoji} className="flex flex-col items-center">
                                <span className="text-2xl mb-1">{emoji}</span>
                                <span className="text-xl font-black text-slate-700">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl mb-12 z-10">
                    {players.map((p: any, i) => (
                        <div key={i} className="bg-white border-2 border-indigo-100 p-6 rounded-2xl text-center font-bold text-xl animate-bounce-in shadow-sm text-indigo-900">
                            {p.name}
                        </div>
                    ))}
                </div>

                {/* Balloon Minigame Display */}
                <div className="flex-1 flex items-center justify-center mb-12 z-10">
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={flyingBalloonStatus} // Force re-mount to reset initial position
                                animate={{
                                    scale: flyingBalloonStatus === 'IDLE' ? 1 + balloonSize / 50 : 1,
                                    x: (flyingBalloonStatus === 'FLYING_OUT' || flyingBalloonStatus === 'VISITING') ? '100vw' : 0,
                                    y: (flyingBalloonStatus === 'FLYING_OUT' || flyingBalloonStatus === 'VISITING') ? -200 : 0,
                                    opacity: cooldownTimer > 0 ? 0.5 : 1
                                }}
                                initial={
                                    flyingBalloonStatus === 'RETURNING' ? { x: '-100vw', y: 0 } :
                                        flyingBalloonStatus === 'FLYING_OUT' ? { x: 0, y: 0 } :
                                            flyingBalloonStatus === 'VISITING' ? { x: '100vw', y: -200 } : {}
                                }
                                transition={{ duration: 1.5, type: 'spring' }}
                                exit={{ opacity: 0, transition: { duration: 0 } }}
                                className="text-9xl cursor-pointer select-none transition-transform"
                            >
                                🎈
                            </motion.div>
                        </AnimatePresence>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-2xl drop-shadow-md">
                            {cooldownTimer > 0 ? (
                                <span className="text-6xl">{cooldownTimer}</span>
                            ) : flyingBalloonStatus === 'IDLE' ? (
                                `${Math.min(100, balloonSize)}%`
                            ) : ''}
                        </div>
                    </div>
                </div>

                <div className="z-10 bg-white/80 backdrop-blur p-4 rounded-3xl">
                    <button
                        onClick={resetGame}
                        className="bg-indigo-600 text-white px-16 py-8 rounded-full text-4xl font-black shadow-2xl hover:scale-105 transition-transform hover:bg-indigo-700"
                    >
                        Start Spillet 🚀
                    </button>
                    <div className="text-center mt-4 text-slate-500 font-bold">
                        {players.length} spillere er klare
                    </div>
                </div>
            </div>
        );
    }

    // 3. Finished Screen
    if (roomData.status === 'FINISHED') {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen p-8 text-center pt-20 bg-slate-50"
            >
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    {/* Simple Confetti Placeholder or particles would go here */}
                </div>

                <h1 className="text-6xl font-black mb-16 text-indigo-900 drop-shadow-sm">Resultatliste 🏆</h1>
                <div className="max-w-3xl mx-auto space-y-6">
                    {sortedPlayers.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.2, type: 'spring' }}
                            className={`flex justify-between items-center p-8 rounded-3xl shadow-lg border-b-8 transition-transform hover:scale-[1.02] ${i === 0 ? 'bg-yellow-100 border-yellow-300 text-yellow-900 scale-110 z-10' :
                                i === 1 ? 'bg-slate-100 border-slate-300 text-slate-700' :
                                    i === 2 ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                        'bg-white border-slate-100 text-slate-600'
                                }`}
                        >
                            <span className="text-3xl font-bold flex items-center">
                                <span className="w-12 inline-block text-center mr-4 opacity-50">#{i + 1}</span>
                                {p.name}
                                {i === 0 && <span className="ml-4 text-4xl">👑</span>}
                                {p.streak > 2 && <span className="ml-2 text-2xl animate-pulse">🔥</span>}
                            </span>
                            <span className="text-4xl font-black">{p.score}p</span>
                        </motion.div>
                    ))}
                </div>
                <div className="flex justify-center gap-4 mt-20">
                    <button onClick={resetGame} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-transform">
                        Spill Igjen 🔄
                    </button>
                    <button onClick={() => navigate('/quiz-battle/admin-999')} className="bg-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-xl hover:bg-slate-300">
                        Avslutt
                    </button>
                </div>
            </motion.div>
        );
    }

    // 4. Gameplay Screen
    // Use privateQuestions for Host visualization (so we see the answers)
    const question = privateQuestions[currentQuestionIndex] || roomData.questions[currentQuestionIndex];
    if (!question) return <div>Laster spørsmål...</div>;

    if (showLeaderboard) {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
        return (
            <div className="min-h-screen p-8">
                <h2 className="text-5xl font-black text-center mb-16 text-indigo-900">Topp 5</h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    <AnimatePresence>
                        {sortedPlayers.map((p, i) => (
                            <motion.div
                                layout
                                key={p.id || i}
                                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-2xl shadow-sm"
                            >
                                <span className="text-2xl font-bold text-slate-700">
                                    <span className="inline-block w-8 text-slate-400">#{i + 1}</span>
                                    {p.name}
                                </span>
                                <div className="flex items-center gap-4">
                                    {p.score > 0 && <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">+{p.score % 100 || 100} speed!</span>}
                                    <span className="text-2xl font-black text-indigo-600">{p.score}p</span>
                                    {p.streak > 2 && <div className="ml-2 text-orange-500 font-bold flex flex-col items-center leading-none">
                                        <span className="text-2xl">🔥</span>
                                        <span className="text-xs">{p.streak}x</span>
                                    </div>}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <div className="flex justify-end mt-12 fixed bottom-8 right-8">
                    <button onClick={nextStep} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-2xl hover:bg-indigo-700 shadow-xl transition-transform hover:scale-105">
                        Neste Spørsmål <ArrowRight className="inline ml-2" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 w-full">
            {/* Top Bar */}
            <div className="flex w-full justify-between items-center mb-12 max-w-7xl">
                <div className="font-mono font-bold text-xl text-slate-400">PIN: {pin}</div>
                <div className="font-bold text-2xl text-slate-400">Spørsmål <span className="text-indigo-600 text-3xl">{currentQuestionIndex + 1}</span> / {privateQuestions.length || roomData.questions.length}</div>

                {/* Timer */}
                <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-lg transition-all duration-300
                    ${timer <= 5 ? 'bg-red-100 text-red-600 border-red-500 scale-125 shadow-red-200' : 'bg-white text-slate-700 border-slate-200'}
                `}>
                    {timer}
                </div>

                <button onClick={nextStep} className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-100 transition-colors text-lg shadow-sm border border-slate-200">
                    {showResult ? 'Neste ➡️' : 'Vis Svar 👀'}
                </button>
            </div>

            {/* Content - Full Screen / Immersive */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={question.question}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl lg:text-7xl font-black text-center mb-20 leading-tight max-w-6xl mx-auto text-slate-900"
                    >
                        {question.question}
                    </motion.h2>
                </AnimatePresence>


                {question.type === 'sorting' ? (
                    <div className={`flex flex-col gap-4 w-full max-w-2xl transition-opacity duration-500 ${optionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="text-center text-slate-500 font-bold uppercase tracking-widest mb-4">Riktig Rekkefølge</div>
                        {question.options.map((opt: string, i: number) => {
                            // Correct order is just the initial order in privateQuestions because we store the answer-key as index order?
                            // Wait, our logic for sorting shuffle was: options shuffled.
                            // But for result display, we want to show the correct order.
                            // Ideally, `question` here is the *original* strict ordered question from privateQuestions.
                            // YES, privateQuestions has the original order (or should have).

                            // BUT, wait. In startGameSetup we shuffle options.
                            // For sorting, the "Correct Answer" is defined by the order in the JSON file.
                            // So `privateQuestions[index]` actually has keys shuffled?
                            // Let's check startGameSetup.

                            return (
                                <div key={i} className="flex items-center gap-6 animate-in slide-in-from-left fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-indigo-400 font-bold text-2xl text-slate-800 flex-1">
                                        {opt}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : question.type === 'boolean' ? (
                    <div className={`flex gap-8 transition-opacity duration-500 ${optionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {['Sant', 'Usant'].map((opt) => {
                            const isCorrect = opt === question.answer;
                            return (
                                <div key={opt} className={`
                                     w-80 h-80 rounded-full flex flex-col items-center justify-center border-[12px] shadow-2xl transition-all duration-500
                                     ${showResult
                                        ? (isCorrect ? 'bg-green-500 border-green-400 scale-110 opacity-100 z-10' : 'bg-slate-200 border-slate-300 opacity-20 scale-90 grayscale')
                                        : (opt === 'Sant' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600')
                                    }
                                 `}>
                                    <span className="text-8xl mb-4">{opt === 'Sant' ? '👍' : '👎'}</span>
                                    <span className="text-5xl font-black text-white uppercase">{opt}</span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className={`grid grid-cols-2 gap-8 w-full max-w-[90vw] h-[45vh] transition-opacity duration-500 ${optionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {question.options.map((opt: string, i: number) => {
                            const isCorrect = i === question.correctAnswer || opt === question.answer;
                            const showColor = showResult;

                            return (
                                <motion.div
                                    layout
                                    key={i}
                                    className={`
                                    ${showColor
                                            ? (isCorrect ? 'bg-green-500 border-green-600 shadow-green-500/20 opacity-100 scale-105 z-10' : 'bg-slate-200 border-slate-300 opacity-20 scale-90 grayscale')
                                            : [
                                                'bg-red-500 border-red-600',
                                                'bg-blue-500 border-blue-600',
                                                'bg-yellow-500 border-yellow-600',
                                                'bg-green-500 border-green-600'
                                            ][i % 4]
                                        }
                                    rounded-3xl flex items-center justify-center p-8
                                    text-3xl md:text-5xl font-bold text-center transition-all duration-500 border-b-8
                                    cursor-default select-none
                                `}
                                >
                                    <span className="drop-shadow-sm leading-tight">{opt}</span>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
