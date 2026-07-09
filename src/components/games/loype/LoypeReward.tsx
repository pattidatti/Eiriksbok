import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RELICS } from './relics';
import type { RelicId } from './types';

interface LoypeRewardProps {
    mode: 'rest' | 'reward';
    offered: RelicId[];
    onPick: (relic: RelicId) => void;
    onContinue: () => void;
}

// Hvile ved bålet (+1 hjerte) eller relikvievalg etter skatt/elite.
export const LoypeReward: React.FC<LoypeRewardProps> = ({ mode, offered, onPick, onContinue }) => {
    if (mode === 'rest') {
        return (
            <div className="max-w-md mx-auto text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="text-7xl mb-4"
                    role="img"
                    aria-label="Bål"
                >
                    🔥
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
                    Du hviler ved bålet
                </h2>
                <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold text-rose-500 mb-6"
                >
                    +1 hjerte ❤️
                </motion.p>
                <button
                    onClick={onContinue}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    Videre i løypa
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto text-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="text-6xl mb-3"
                role="img"
                aria-label="Skattkiste"
            >
                🎁
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Velg en relikvie
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offered.map((id, i) => {
                    const relic = RELICS[id];
                    return (
                        <motion.button
                            key={id}
                            onClick={() => onPick(id)}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                            whileHover={{ y: -4, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-white/80 backdrop-blur border-2 border-slate-200 hover:border-indigo-400 rounded-2xl shadow-sm p-6 text-center transition-colors"
                        >
                            <span className="text-5xl block mb-3" role="img" aria-hidden>
                                {relic.emoji}
                            </span>
                            <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                                {relic.title}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {relic.description}
                            </p>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
