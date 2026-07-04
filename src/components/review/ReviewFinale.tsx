import React, { Suspense, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Gamepad2, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MICRO_GAMES } from '../microgames/registry';
import type { MicroGameProps, MicroGameResult } from '../microgames/types';
import type { DailyGamePick } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

interface ReviewFinaleProps {
    game: DailyGamePick;
    onFinish: (result: MicroGameResult | null) => void;
}

// Dagens spill - finalen i Dagens økt. Spillet eier sin egen ramme internt
// (samme mønster som MicroGameStep), så vi rendrer det rett i Suspense.
export const ReviewFinale: React.FC<ReviewFinaleProps> = ({ game, onFinish }) => {
    const entry = MICRO_GAMES[game.gameId];
    const [result, setResult] = useState<MicroGameResult | null>(null);
    const { play } = useStepSounds();
    const reducedMotion = useReducedMotion();

    if (!entry) {
        // Skal ikke skje (pickDailyGame velger fra registry), men fail soft
        onFinish(null);
        return null;
    }

    const GameComponent = entry.Component as unknown as React.ComponentType<MicroGameProps>;

    const handleComplete = (r: MicroGameResult) => {
        if (result) return;
        setResult(r);
        play('complete');
        if (!reducedMotion) {
            confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#6366f1', '#f59e0b', '#10b981'],
            });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-300/40">
                    <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                        Dagens spill
                    </p>
                    <h2 className="font-display font-bold text-slate-900 leading-tight">
                        {game.title}
                    </h2>
                </div>
            </div>

            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-16 bg-slate-900 text-slate-400 rounded-2xl">
                        <Loader2 className="w-6 h-6 animate-spin mr-3" />
                        Laster {game.title}...
                    </div>
                }
            >
                <GameComponent onComplete={handleComplete} />
            </Suspense>

            {result ? (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onFinish(result)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    Til oppsummeringen
                    <ArrowRight className="w-5 h-5" />
                </motion.button>
            ) : (
                <button
                    onClick={() => onFinish(null)}
                    className="self-center text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                    Hopp over spillet
                </button>
            )}
        </div>
    );
};
