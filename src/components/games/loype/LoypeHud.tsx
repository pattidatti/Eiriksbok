import React from 'react';
import { motion } from 'framer-motion';
import { Heart, LogOut } from 'lucide-react';
import { RELICS } from './relics';
import type { RelicId } from './types';

interface LoypeHudProps {
    hearts: number;
    maxHearts: number;
    relics: RelicId[];
    fiftyCharges: number;
    etappe: number; // 1-basert rad eleven står på
    totalEtapper: number;
    xp: number;
    onAbandon: () => void;
}

// Slank, sticky topplinje: hjerter, relikvier, fremdrift og poeng.
// Hjertene "popper" når de endres - tap skal kjennes.
export const LoypeHud: React.FC<LoypeHudProps> = ({
    hearts,
    maxHearts,
    relics,
    fiftyCharges,
    etappe,
    totalEtapper,
    xp,
    onAbandon,
}) => {
    return (
        <div className="sticky top-20 z-30 mb-6">
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-4 py-2.5 flex items-center gap-4">
                <div className="flex items-center gap-1" aria-label={`${hearts} av ${maxHearts} hjerter`}>
                    {Array.from({ length: maxHearts }, (_, i) => {
                        const filled = i < hearts;
                        return (
                            <motion.span
                                key={`${i}-${filled}`}
                                initial={{ scale: 1.6 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            >
                                <Heart
                                    className={`w-5 h-5 ${
                                        filled
                                            ? 'text-rose-500 fill-rose-500'
                                            : 'text-slate-300 fill-slate-100'
                                    }`}
                                />
                            </motion.span>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1.5">
                    {relics.map((id) => (
                        <motion.span
                            key={id}
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            title={`${RELICS[id].title}: ${RELICS[id].description}`}
                            className="text-lg leading-none px-1.5 py-1 bg-slate-100 rounded-lg cursor-default"
                        >
                            {RELICS[id].emoji}
                            {id === 'femti-femti' && (
                                <span className="ml-0.5 text-[10px] font-bold text-slate-500 align-top">
                                    ×{fiftyCharges}
                                </span>
                            )}
                        </motion.span>
                    ))}
                </div>

                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            animate={{ width: `${(etappe / totalEtapper) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Etappe {Math.min(etappe, totalEtapper)}/{totalEtapper}
                    </span>
                </div>

                <motion.span
                    key={xp}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-sm font-bold text-indigo-600 whitespace-nowrap"
                >
                    {xp} p
                </motion.span>

                <button
                    onClick={onAbandon}
                    title="Avslutt løypa"
                    aria-label="Avslutt løypa"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
