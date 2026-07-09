import React, { useEffect } from 'react';
import { useSnakeGame } from './hooks/useSnakeGame';
import { SnakeBoard } from './components/SnakeBoard';
import { levels } from './data/conceptData';
import { useLayout } from '../../context/LayoutContext';

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
        foodItems,
        level,
        gridSize,
        startGame,
        goToMenu,
        setCategory,
        wallsEnabled,
        setWallsEnabled
    } = useSnakeGame();

    // Prevent default scrolling when playing - Improved to catch more events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Always prevent default for arrow keys if we are on this page,
            // but strictly only when playing to avoid annoying the user in menu?
            // User feedback says "Piltastene må blockes". simpler to block when game is focused or just always on this page?
            // Let's block always if status is PLAYING, or maybe checking if e.target is body?
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                // If status is playing, definitely block
                if (status === 'PLAYING') {
                    e.preventDefault();
                }
                // Also block in menu if we want to use keys to navigate menu later? 
                // For now, let's just adhere to user request.
            }
        };

        // Aggressive blocking configuration
        window.addEventListener('keydown', handleKeyDown, { capture: false });
        // Also capture to be sure?
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

    return (
        <div className="w-full min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-2 overflow-hidden">

            {/* Header / HUD */}
            <div className="w-full max-w-[95vw] flex justify-between items-center mb-2 px-6 py-3 bg-gray-900/80 rounded-2xl backdrop-blur border border-gray-800 shadow-xl z-30">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black italic bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent transform -skew-x-12">
                        KONSEPT SLANGE
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                        <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 font-bold tracking-wide text-xs uppercase">{level.topic}</span>
                        <span className="text-lg">Finn: <strong className="text-green-400 border-b-2 border-green-500">{level.targetConcept}</strong></span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Score</span>
                        <span className="text-4xl font-mono font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">{score}</span>
                    </div>
                </div>
            </div>

            {/* Game Board Container - Full Width */}
            <div className="relative w-full max-w-[95vw] flex justify-center shadow-2xl rounded-xl border border-gray-800/50 bg-gray-900/50">
                <SnakeBoard
                    width={gridSize.width}
                    height={gridSize.height}
                    snake={snake}
                    foodItems={foodItems}
                />

                {/* MENU OVERLAY */}
                {status === 'MENU' && (
                    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-20 flex flex-col items-center justify-center animate-in fade-in duration-300 p-8">
                        <h2 className="text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            VELG KATEGORI
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-md text-center">
                            Velg et tema og spis ordene som passer til begrepet. Unngå de falske vennene!
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
                            {levels.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => {
                                        setCategory(l.id);
                                        // Small delay to let state update before starting? 
                                        // Actually startGame resets state anyway, but let's just highlight selection or auto-start?
                                        // Let's select then show start button, or just start immediately on click?
                                        // Better UX: Select -> Highlight -> Start.
                                        // For MVP: Click category -> updates level -> User clicks START.
                                    }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 active:scale-95 flex flex-col gap-1 ${level.id === l.id
                                        ? 'bg-green-900/40 border-green-500 ring-2 ring-green-500/20'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                        }`}
                                >
                                    <span className="font-bold text-lg text-white">{l.name}</span>
                                    <span className="text-xs text-gray-400">{l.description}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">

                            {/* Walls Toggle */}
                            <button
                                onClick={() => setWallsEnabled(!wallsEnabled)}
                                className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${wallsEnabled
                                    ? 'bg-red-900/30 border-red-500 text-red-100'
                                    : 'bg-green-900/30 border-green-500 text-green-100'
                                    }`}
                            >
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${wallsEnabled ? 'bg-red-500' : 'bg-green-500'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${wallsEnabled ? 'left-6' : 'left-1'}`} />
                                </div>
                                <span className="font-bold text-sm uppercase">Vegger: {wallsEnabled ? 'PÅ' : 'AV'}</span>
                            </button>

                            <button
                                onClick={startGame}
                                className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-2xl rounded-full transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:-translate-y-1 active:translate-y-0"
                            >
                                START SPILL
                            </button>
                            <div className="flex gap-8 text-xs text-gray-500 mt-4 uppercase tracking-widest">
                                <span>Piltaster for å styre</span>
                                <span>Unngå vegger</span>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'GAME_OVER' && (
                    <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
                        <h2 className="text-6xl font-black text-white mb-2 drop-shadow-md">
                            GAME OVER
                        </h2>
                        <p className="text-2xl text-red-200 mb-8 font-bold">Poeng: {score}</p>

                        <div className="flex gap-4">
                            <button
                                onClick={goToMenu}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-full transition-all hover:scale-105 shadow-xl border border-gray-500"
                            >
                                MENY
                            </button>
                            <button
                                onClick={startGame}
                                className="px-8 py-3 bg-white text-red-600 hover:bg-gray-100 font-bold text-lg rounded-full transition-all hover:scale-105 shadow-xl"
                            >
                                PRØV IGJEN
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConceptSnakeGame;
