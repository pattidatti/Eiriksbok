import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wordClasses, words } from './wordSorterData';
import type { WordClassId, WordClass, WordItem } from './wordSorterData';
import { Check, X, Info, RotateCcw, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProgressStore } from '../../features/progress/useProgressStore';

// --- Game Setup Component ---
interface GameSetupProps {
    onStart: (selectedClassIds: WordClassId[]) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
    const [selected, setSelected] = useState<WordClassId[]>(['substantiv', 'verb', 'adjektiv']);

    const toggleClass = (id: WordClassId) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    const handleStart = () => {
        if (selected.length >= 2) {
            onStart(selected);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
            <h1 className="text-3xl font-display font-bold text-center mb-2 text-slate-800">
                Ordklasse-sortering
            </h1>
            <p className="text-center text-slate-500 mb-8">
                Velg hvilke ordklasser du vil øve på. Du må velge minst to.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {wordClasses.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => toggleClass(cls.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selected.includes(cls.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-indigo-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{cls.emoji}</div>
                            <div className="text-left">
                                <div className={`font-bold ${selected.includes(cls.id) ? 'text-indigo-900' : 'text-slate-600'}`}>
                                    {cls.label}
                                </div>
                                <div className="text-xs text-slate-400 group-hover:text-slate-500">
                                    {cls.description}
                                </div>
                            </div>
                        </div>
                        {selected.includes(cls.id) && (
                            <Check className="text-indigo-600 w-5 h-5" />
                        )}
                    </button>
                ))}
            </div>

            <button
                onClick={handleStart}
                disabled={selected.length < 2}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${selected.length >= 2
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
            >
                <Play className="w-5 h-5" />
                Start Spill
            </button>
        </div>
    );
};

// --- Info Panel Component ---
const InfoPanel: React.FC<{ activeClasses: WordClass[] }> = ({ activeClasses }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-24 right-4 z-10 p-3 bg-white rounded-full shadow-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-all"
                title="Vis info om ordklasser"
            >
                <Info size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Ordklasser</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {activeClasses.map(cls => (
                                    <div key={cls.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${cls.color}`} />
                                            <h3 className="font-bold text-lg">{cls.label}</h3>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {cls.descriptionLong}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// --- Game Loop Component ---
interface GameLoopProps {
    selectedClassIds: WordClassId[];
    onExit: () => void;
}

// --- Sound Utils ---
const playSound = (type: 'success' | 'error') => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }
};

// Trekningen ligger på modulnivå: Math.random() kan ikke kalles inne i en
// komponent React renderer.
const pickRandomWord = (pool: WordItem[]): WordItem | null =>
    pool[Math.floor(Math.random() * pool.length)] ?? null;

const GameLoop: React.FC<GameLoopProps> = ({ selectedClassIds, onExit }) => {
    const [score, setScore] = useState(0);
    // Første ord trekkes i useState-initialisatoren, ikke i en effect: da starter
    // spillet med et ord på skjermen i stedet for et tomt bilde først.
    const [currentWord, setCurrentWord] = useState<WordItem | null>(() =>
        pickRandomWord(words.filter(w => selectedClassIds.includes(w.classId)))
    );
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [streak, setStreak] = useState(0);
    const [animatingBucket, setAnimatingBucket] = useState<WordClassId | null>(null);
    // Spillet er endeløst - hvert 10. sorteringsforsøk teller som en fullført
    // runde i «Min læring», med andel riktige som score
    const roundStats = useRef({ attempts: 0, correct: 0 });

    // Filter classes and words
    const activeClasses = wordClasses.filter(c => selectedClassIds.includes(c.id));
    const pool = words.filter(w => selectedClassIds.includes(w.classId));

    const countAttempt = (correct: boolean) => {
        roundStats.current.attempts += 1;
        if (correct) roundStats.current.correct += 1;
        if (roundStats.current.attempts >= 10) {
            const { correct: correctCount } = roundStats.current;
            roundStats.current = { attempts: 0, correct: 0 };
            useProgressStore.getState().recordActivity({
                kind: 'practice-game',
                activityId: `ordsortering/${[...selectedClassIds].sort().join('-')}`,
                subjectId: 'norsk',
                title: 'Ordsortering',
                score: correctCount / 10,
            });
        }
    };

    const pickNewWord = () => {
        setCurrentWord(pickRandomWord(pool));
        setFeedback(null);
        setAnimatingBucket(null);
    };

    const handleBucketClick = (classId: WordClassId) => {
        if (!currentWord || feedback) return;

        setAnimatingBucket(classId);

        countAttempt(currentWord.classId === classId);

        if (currentWord.classId === classId) {
            // Correct
            setFeedback('correct');
            setScore(prev => prev + 10 + (streak * 2)); // Bonus for streak
            setStreak(prev => prev + 1);
            playSound('success');
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#22c55e', '#ffffff'] // Green and white
            });
            setTimeout(pickNewWord, 1200);
        } else {
            // Wrong
            setFeedback('wrong');
            setStreak(0);
            playSound('error');
            setTimeout(() => {
                setFeedback(null);
                setAnimatingBucket(null);
            }, 800);
        }
    };

    return (
        <div className="min-h-[600px] flex flex-col relative">
            <InfoPanel activeClasses={activeClasses} />

            {/* Header / HUD */}
            <div className="flex justify-between items-center mb-12 px-4">
                <button
                    onClick={onExit}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-2 font-medium"
                >
                    <RotateCcw size={18} /> Start på nytt
                </button>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Streak</div>
                        <div className={`text-xl font-bold ${streak > 2 ? 'text-orange-500' : 'text-slate-600'}`}>
                            {streak > 0 ? `🔥 ${streak}` : '-'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Poeng</div>
                        <div className="text-2xl font-bold text-slate-800">{score}</div>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12">

                {/* Word Card */}
                <div className="relative h-32 w-full flex justify-center items-center">
                    <AnimatePresence mode="wait">
                        {currentWord && (
                            <motion.div
                                key={currentWord.id}
                                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: 0,
                                    x: feedback === 'wrong' ? [0, -10, 10, -10, 10, 0] : 0,
                                    rotate: feedback === 'wrong' ? [0, -5, 5, -5, 5, 0] : 0
                                }}
                                exit={{ scale: 0.5, opacity: 0, y: -50 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`bg-white px-12 py-8 rounded-3xl shadow-xl border-4 flex items-center justify-center z-10 relative overflow-hidden ${feedback === 'correct' ? 'border-green-400 bg-green-50' :
                                    feedback === 'wrong' ? 'border-red-400 bg-red-50' :
                                        'border-slate-100'
                                    }`}
                            >
                                <span className={`text-4xl md:text-6xl font-display font-bold relative z-10 ${feedback === 'correct' ? 'text-green-700' :
                                    feedback === 'wrong' ? 'text-red-700' :
                                        'text-slate-800'
                                    }`}>
                                    {currentWord.text}
                                </span>

                                {/* Feedback Icon Overlay */}
                                {feedback && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`absolute -top-6 -right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    >
                                        {feedback === 'correct' ? <Check size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Buckets */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
                    {activeClasses.map(cls => {
                        const isActive = animatingBucket === cls.id;
                        const isCorrect = isActive && feedback === 'correct';
                        const isWrong = isActive && feedback === 'wrong';

                        return (
                            <motion.button
                                key={cls.id}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                animate={isCorrect ? {
                                    scale: [1, 1.2, 1],
                                    y: [0, -20, 0],
                                    transition: { duration: 0.4 }
                                } : isWrong ? {
                                    x: [0, -10, 10, -10, 10, 0],
                                    transition: { duration: 0.4 }
                                } : {}}
                                onClick={() => handleBucketClick(cls.id)}
                                className={`relative p-6 rounded-3xl shadow-sm border-b-8 transition-all flex flex-col items-center gap-4 group overflow-hidden ${isCorrect ? 'bg-green-100 border-green-500' :
                                    isWrong ? 'bg-red-100 border-red-500' :
                                        'bg-white border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                {/* Background color blob */}
                                <div className={`absolute top-0 left-0 w-full h-2 ${cls.color}`} />

                                <span className="text-5xl md:text-6xl filter drop-shadow-md transition-transform group-hover:scale-110">
                                    {cls.emoji}
                                </span>

                                <span className={`font-bold text-xl tracking-tight ${isCorrect ? 'text-green-700' :
                                    isWrong ? 'text-red-700' :
                                        'text-slate-700'
                                    }`}>
                                    {cls.label}
                                </span>

                                {/* Mouth animation for "eating" (simplified visual cue) */}
                                {isCorrect && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1.5, y: -20 }}
                                        className="absolute text-2xl font-bold text-green-600 top-2 right-4"
                                    >
                                        +10
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

// --- Main Container ---
export const WordSorterGame: React.FC = () => {
    const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
    const [selectedClasses, setSelectedClasses] = useState<WordClassId[]>([]);

    const startGame = (ids: WordClassId[]) => {
        setSelectedClasses(ids);
        setGameState('playing');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">
                {gameState === 'setup' ? (
                    <GameSetup onStart={startGame} />
                ) : (
                    <GameLoop selectedClassIds={selectedClasses} onExit={() => setGameState('setup')} />
                )}
            </div>
        </div>
    );
};

export default WordSorterGame;
