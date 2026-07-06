import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HangmanFigure } from './HangmanFigure';
import { WordDisplay } from './WordDisplay';
import { Keyboard } from './Keyboard';

type GameStatus = 'playing' | 'won' | 'lost';

type WordData = {
    term: string;
    definition: string;
    subject?: string;
    topic?: string;
};

type HangmanGameProps = {
    words: WordData[];
    onExit: () => void;
};

export const HangmanGame = ({ words, onExit }: HangmanGameProps) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [shuffledWords, setShuffledWords] = useState<WordData[]>([]);
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
    const MAX_WRONG_GUESSES = 10;

    // Shuffle words on mount
    useEffect(() => {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
        setCurrentWordIndex(0);
        setGuessedLetters([]);
        setGameStatus('playing');
    }, [words]);

    const currentWordData = shuffledWords[currentWordIndex];
    const wordToGuess = currentWordData?.term.toUpperCase() || "";

    const wrongGuesses = guessedLetters.filter(
        letter => !wordToGuess.includes(letter)
    ).length;

    const isWinner = wordToGuess
        .split("")
        .filter(char => ![" ", "-", ":", ","].includes(char))
        .every(letter => guessedLetters.includes(letter));

    // Check win/loss condition
    useEffect(() => {
        if (gameStatus !== 'playing') return;

        if (wrongGuesses >= MAX_WRONG_GUESSES) {
            setGameStatus('lost');
        } else if (isWinner && wordToGuess) {
            setGameStatus('won');
        }
    }, [guessedLetters, wrongGuesses, isWinner, gameStatus, wordToGuess]);

    // Log Game Result
    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            import('../../../lib/firebase').then(({ db }) => {
                import('firebase/database').then(({ ref, push, serverTimestamp }) => {
                    const gameRef = ref(db, 'analytics/games/hangman');
                    push(gameRef, {
                        outcome: gameStatus,
                        timestamp: serverTimestamp(),
                        word: wordToGuess
                    });
                });
            });
            // «Min læring»: bare seier teller som fullført runde
            if (gameStatus === 'won') {
                import('../../../features/progress/useProgressStore').then(
                    ({ useProgressStore }) => {
                        useProgressStore.getState().recordActivity({
                            kind: 'practice-game',
                            activityId: `hengemann/${wordToGuess.toLowerCase()}`,
                            title: 'Hengemann',
                        });
                    }
                );
            }
        }
    }, [gameStatus, wordToGuess]);

    const handleGuess = useCallback((letter: string) => {
        if (gameStatus !== 'playing' || guessedLetters.includes(letter)) return;
        setGuessedLetters(prev => [...prev, letter]);
    }, [gameStatus, guessedLetters]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const char = e.key.toUpperCase();
            if (/^[A-ZÆØÅ]$/.test(char)) {
                handleGuess(char);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGuess]);

    const handleNextWord = () => {
        setGuessedLetters([]);
        setGameStatus('playing');

        if (currentWordIndex < shuffledWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            // Loop or finish? Let's reshuffle loop for now
            const shuffled = [...words].sort(() => Math.random() - 0.5);
            setShuffledWords(shuffled);
            setCurrentWordIndex(0);
        }
    };

    if (!currentWordData) return <div>Loading...</div>;

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
            <div className="flex justify-between w-full mb-4">
                <button
                    onClick={onExit}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    ← Tilbake til meny
                </button>
                <div className="text-sm font-bold text-slate-500">
                    Ord {currentWordIndex + 1} / {shuffledWords.length}
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 mb-8">
                <HangmanFigure wrongGuesses={wrongGuesses} />

                <div className="flex-1 flex flex-col items-center">
                    <WordDisplay
                        key={currentWordIndex}
                        wordToGuess={currentWordData.term}
                        guessedLetters={guessedLetters}
                        reveal={gameStatus === 'lost'}
                    />

                    <AnimatePresence>
                        {gameStatus !== 'playing' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-6 bg-slate-100 rounded-xl max-w-lg text-center shadow-lg border-2 border-slate-200"
                            >
                                <h3 className={clsx("text-2xl font-bold mb-2", gameStatus === 'won' ? "text-green-600" : "text-red-500")}>
                                    {gameStatus === 'won' ? "Riktig!" : "Beklager, du tapte."}
                                </h3>
                                <p className="text-lg text-slate-700 mb-4 italic">
                                    "{currentWordData.definition}"
                                </p>
                                <button
                                    onClick={handleNextWord}
                                    autoFocus
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                                >
                                    Neste ord →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Keyboard
                activeLetters={guessedLetters.filter(l => wordToGuess.includes(l))}
                inactiveLetters={guessedLetters.filter(l => !wordToGuess.includes(l))}
                addGuessedLetter={handleGuess}
                disabled={gameStatus !== 'playing'}
            />
        </div>
    );
};

// Helper for conditional classes
function clsx(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
