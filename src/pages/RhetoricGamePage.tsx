import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TextAnalysisGame } from '../components/games/text-analysis/TextAnalysisGame';
import { rhetoricGames } from '../data/rhetoricGameData';
import { ChevronRight, CheckCircle, Lock } from 'lucide-react';

export const RhetoricGamePage: React.FC = () => {
    const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(null);

    // Load from localStorage on mount
    const [completedLevels, setCompletedLevels] = useState<string[]>(() => {
        const saved = localStorage.getItem('rhetoric_completed_levels');
        return saved ? JSON.parse(saved) : [];
    });

    const handleLevelComplete = (id: string) => {
        // «Min læring»: nivå fullført (nøkkelen matcher retro-importen)
        import('../features/progress/useProgressStore').then(({ useProgressStore }) => {
            useProgressStore.getState().recordActivity({
                kind: 'practice-game',
                activityId: `retorikk/${id}`,
                subjectId: 'norsk',
                title: 'Retorikk-spill',
            });
        });
        if (!completedLevels.includes(id)) {
            const newCompleted = [...completedLevels, id];
            setCompletedLevels(newCompleted);
            localStorage.setItem('rhetoric_completed_levels', JSON.stringify(newCompleted));
        }
    };

    const resetProgress = () => {
        if (window.confirm('Vil du nullstille progresjonen din?')) {
            setCompletedLevels([]);
            localStorage.removeItem('rhetoric_completed_levels');
            setCurrentLevelIndex(null);
        }
    };

    const currentGame = currentLevelIndex !== null ? rhetoricGames[currentLevelIndex] : null;

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors">
                        ← Tilbake
                    </Link>
                    <h1 className="text-3xl font-bold font-serif text-slate-900">Øving: Retorikk</h1>
                </div>

                <AnimatePresence mode="wait">
                    {!currentGame ? (
                        <motion.div
                            key="level-select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="col-span-full mb-4">
                                <h2 className="text-2xl font-bold text-slate-800">Velg treningstekst</h2>
                                <p className="text-slate-600">Start med nivå 1 og jobb deg oppover til ekspertnivå.</p>
                            </div>

                            {rhetoricGames.map((game, index) => {
                                const isLocked = index > 0 && !completedLevels.includes(rhetoricGames[index - 1].id);
                                const isCompleted = completedLevels.includes(game.id);

                                return (
                                    <button
                                        key={game.id}
                                        onClick={() => !isLocked && setCurrentLevelIndex(index)}
                                        disabled={isLocked}
                                        className={`text-left p-6 rounded-xl border-2 transition-all ${isLocked
                                            ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed'
                                            : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-lg cursor-pointer'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {isCompleted ? 'Fullført' : `Nivå ${index + 1}`}
                                            </span>
                                            {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                                            {isLocked && <Lock className="w-5 h-5 text-slate-400" />}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{game.title}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2">{game.text}</p>
                                    </button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <button
                                onClick={() => setCurrentLevelIndex(null)}
                                className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                            >
                                ← Velg et annet nivå
                            </button>

                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                                <TextAnalysisGame
                                    data={currentGame}
                                    onComplete={() => handleLevelComplete(currentGame.id)}
                                />

                                {completedLevels.includes(currentGame.id) && currentLevelIndex !== null && currentLevelIndex < rhetoricGames.length - 1 && (
                                    <div className="p-4 bg-green-50 border-t border-green-100 flex justify-center">
                                        <button
                                            onClick={() => setCurrentLevelIndex(currentLevelIndex + 1)}
                                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                        >
                                            Neste nivå <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer with Reset */}
            <div className="container mx-auto px-4 max-w-5xl mt-12 pt-8 border-t border-slate-200 text-center">
                <button
                    onClick={resetProgress}
                    className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-2 mx-auto transition-colors"
                >
                    <Lock className="w-3 h-3" /> Nullstill fremdrift
                </button>
            </div>
        </div>
    );
};
