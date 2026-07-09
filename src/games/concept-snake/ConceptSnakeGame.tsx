import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Pause, Play, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSnakeGame } from './hooks/useSnakeGame';
import { SnakeBoard } from './components/SnakeBoard';
import { levels } from './data/conceptData';
import { useLayout } from '../../context/LayoutContext';
import { celebrateCompletion } from '../../components/ui/answerFeedback';

const ConceptSnakeGame: React.FC = () => {
    const { setFullWidth } = useLayout();

    useEffect(() => {
        setFullWidth(true);
        return () => setFullWidth(false);
    }, [setFullWidth]);

    const {
        snake,
        status,
        score,
        bestScore,
        isNewBest,
        foodItems,
        eatenWords,
        lastEat,
        level,
        gridSize,
        startGame,
        goToMenu,
        togglePause,
        setCategory,
        wallsEnabled,
        setWallsEnabled,
    } = useSnakeGame();

    // Hindre at piltaster/mellomrom scroller siden mens spillet er aktivt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) &&
                (status === 'PLAYING' || status === 'PAUSED')
            ) {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status]);

    // «Min læring»: hver fullførte runde teller (id per kategori så nye
    // kategorier gir full XP, repetisjon gir daglig bonus)
    useEffect(() => {
        if (status !== 'GAME_OVER') return;
        import('../../features/progress/useProgressStore').then(({ useProgressStore }) => {
            useProgressStore.getState().recordActivity({
                kind: 'practice-game',
                activityId: `konsept-snake/${level.id}`,
                subjectId: 'norsk',
                title: 'Konseptslange',
            });
        });
    }, [status, level.id]);

    useEffect(() => {
        if (status === 'GAME_OVER' && isNewBest) {
            celebrateCompletion({});
        }
    }, [status, isNewBest]);

    const correctEaten = eatenWords.filter((w) => w.type === 'CORRECT');
    const wrongEaten = eatenWords.filter((w) => w.type === 'WRONG');

    return (
        <div className="w-full bg-slate-50 flex flex-col items-center p-2 sm:p-4 relative overflow-hidden">
            {/* Myk bakgrunnsdekor */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

            {/* Header / HUD */}
            <div className="w-full max-w-5xl flex justify-between items-center gap-3 mb-3 px-4 sm:px-6 py-3 bg-white/70 backdrop-blur rounded-2xl border border-slate-200 shadow-sm z-30">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        to="/oving"
                        className="shrink-0 p-2 -ml-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label="Tilbake til øving"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                            Konseptslangen
                        </h1>
                        <p className="text-sm text-slate-500 truncate">
                            {level.topic} · Spis:{' '}
                            <span className="font-semibold text-indigo-600">
                                {level.targetConcept}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    {(status === 'PLAYING' || status === 'PAUSED') && (
                        <button
                            onClick={togglePause}
                            className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label={status === 'PLAYING' ? 'Pause' : 'Fortsett'}
                        >
                            {status === 'PLAYING' ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </button>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Beste
                        </span>
                        <span className="text-lg font-bold text-amber-500 flex items-center gap-1 leading-tight">
                            <Trophy className="w-4 h-4" />
                            {bestScore}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Poeng
                        </span>
                        <motion.span
                            key={score}
                            initial={{ scale: 1.25 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-indigo-600 leading-tight"
                        >
                            {score}
                        </motion.span>
                    </div>
                </div>
            </div>

            {/* Feedback-chip når slangen spiser et ord */}
            <div className="relative w-full max-w-5xl z-30 h-0">
                <AnimatePresence>
                    {lastEat && (status === 'PLAYING' || status === 'PAUSED') && (
                        <motion.div
                            key={lastEat.id}
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={`absolute left-1/2 -translate-x-1/2 top-1 px-4 py-1.5 rounded-full text-sm font-semibold shadow-md flex items-center gap-1.5 whitespace-nowrap ${
                                lastEat.type === 'CORRECT'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                        >
                            {lastEat.type === 'CORRECT' ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            «{lastEat.text}» {lastEat.points > 0 ? `+${lastEat.points}` : lastEat.points}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Spillbrett */}
            <div className="relative w-full max-w-5xl flex justify-center z-10">
                <SnakeBoard
                    width={gridSize.width}
                    height={gridSize.height}
                    snake={snake}
                    foodItems={foodItems}
                />

                {/* MENY */}
                {status === 'MENU' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-50/95 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-2xl p-4 sm:p-8 overflow-y-auto"
                    >
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-1">
                            Velg kategori
                        </h2>
                        <p className="text-slate-500 mb-5 max-w-md text-center text-sm sm:text-base">
                            Styr slangen med piltastene og spis ordene som passer til begrepet.
                            Feil ord koster poeng!
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl mb-5">
                            {levels.map((l) => (
                                <motion.button
                                    key={l.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setCategory(l.id)}
                                    className={`p-3 rounded-xl border-2 text-left transition-colors flex flex-col gap-0.5 ${
                                        level.id === l.id
                                            ? 'bg-indigo-50 border-indigo-500'
                                            : 'bg-white border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className="font-bold text-sm sm:text-base text-slate-900">
                                        {l.icon} {l.name}
                                    </span>
                                    <span className="text-xs text-slate-500 leading-snug">
                                        {l.description}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => setWallsEnabled(!wallsEnabled)}
                                className={`flex items-center gap-3 px-5 py-2 rounded-full border-2 transition-colors text-sm font-semibold ${
                                    wallsEnabled
                                        ? 'bg-white border-slate-300 text-slate-700'
                                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                }`}
                            >
                                <div
                                    className={`w-9 h-5 rounded-full relative transition-colors ${wallsEnabled ? 'bg-slate-400' : 'bg-emerald-500'}`}
                                >
                                    <div
                                        className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${wallsEnabled ? 'left-1' : 'left-5'}`}
                                    />
                                </div>
                                Vegger: {wallsEnabled ? 'på' : 'av (gå gjennom kanten)'}
                            </button>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={startGame}
                                className="focus-ring px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                            >
                                Start spillet
                            </motion.button>
                            <p className="text-xs text-slate-400">
                                Piltaster eller WASD · Mellomrom for pause
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* PAUSE */}
                {status === 'PAUSED' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl"
                    >
                        <h2 className="font-display font-bold text-3xl text-slate-900 mb-4">Pause</h2>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={togglePause}
                            className="focus-ring flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                        >
                            <Play className="w-5 h-5" />
                            Fortsett
                        </motion.button>
                    </motion.div>
                )}

                {/* GAME OVER */}
                {status === 'GAME_OVER' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="absolute inset-0 bg-slate-50/95 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-2xl p-4 overflow-y-auto"
                    >
                        <h2 className="font-display font-bold text-3xl text-slate-900 mb-1">
                            Runden er over!
                        </h2>
                        <p className="text-slate-600 mb-4">
                            Du fikk <span className="font-bold text-indigo-600">{score}</span> poeng
                            {isNewBest && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                                    <Trophy className="w-3.5 h-3.5" />
                                    Ny rekord!
                                </span>
                            )}
                        </p>

                        {/* Læringsoppsummering */}
                        {eatenWords.length > 0 && (
                            <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-4 mb-4 text-left">
                                {correctEaten.length > 0 && (
                                    <div className="mb-2">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                            Riktige ({correctEaten.length})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {correctEaten.map((w, i) => (
                                                <span
                                                    key={`${w.text}-${i}`}
                                                    className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"
                                                >
                                                    {w.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {wrongEaten.length > 0 && (
                                    <div>
                                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                                            Feil ({wrongEaten.length})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                                            {wrongEaten.map((w, i) => (
                                                <span
                                                    key={`${w.text}-${i}`}
                                                    className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200"
                                                >
                                                    {w.text}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-600">{level.wrongHint}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={goToMenu}
                                className="focus-ring px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors"
                            >
                                Meny
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={startGame}
                                className="focus-ring px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                            >
                                Prøv igjen
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ConceptSnakeGame;
