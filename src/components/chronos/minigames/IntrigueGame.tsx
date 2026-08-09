import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { MiniGameHeader } from './MiniGameHeader';

interface Character {
    id: string;
    name: string;
    role: string;
    description: string;
    isTraitor: boolean;
    feedback: string;
}

interface IntrigueGameProps {
    config: {
        onComplete: { nextNodeId: string };
        tokens: number;
        characters: Character[];
    };
    onComplete: (results: { trusted: string[]; correct: number }) => void;
}

export const IntrigueGame: React.FC<IntrigueGameProps> = ({ config, onComplete }) => {
    const [trusted, setTrusted] = useState<string[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const tokensLeft = config.tokens - trusted.length;
    const allTokensPlaced = trusted.length === config.tokens;

    const handleTrust = (id: string) => {
        if (revealed) return;
        if (trusted.includes(id)) {
            setTrusted((prev) => prev.filter((x) => x !== id));
        } else if (trusted.length < config.tokens) {
            setTrusted((prev) => [...prev, id]);
        }
    };

    const handleReveal = () => setRevealed(true);

    const handleContinue = () => {
        const correct = trusted.filter((id) => {
            const char = config.characters.find((c) => c.id === id);
            return char && !char.isTraitor;
        }).length;
        setSubmitted(true);
        setTimeout(() => onComplete({ trusted, correct }), 1500);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-stone-100 rounded-3xl border border-stone-200">
                <CheckCircle className="text-stone-600 mb-4" size={48} />
                <p className="text-stone-600 text-center text-sm">
                    Konsekvensene av din tillit vil forme hoffets dynamikk.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden">
            <MiniGameHeader
                icon={Users}
                title="Hoffets Intriger"
                badge={
                    !revealed ? (
                        <span className="text-[10px] text-stone-400">
                            <span className="text-amber-400 font-bold">{tokensLeft}</span> token{tokensLeft !== 1 ? 'er' : ''} igjen
                        </span>
                    ) : (
                        <span className="text-[10px] text-stone-400 italic">Avsløring...</span>
                    )
                }
            />

            <div className="p-4 grid grid-cols-2 gap-3">
                {config.characters.map((char) => {
                    const isTrusted = trusted.includes(char.id);
                    const isTraitor = char.isTraitor;

                    let borderClass = 'border-stone-200';
                    let bgClass = 'bg-white';
                    if (revealed) {
                        if (isTrusted && isTraitor) { bgClass = 'bg-red-50'; borderClass = 'border-red-300'; }
                        else if (isTrusted && !isTraitor) { bgClass = 'bg-emerald-50'; borderClass = 'border-emerald-300'; }
                    } else if (isTrusted) {
                        bgClass = 'bg-amber-50'; borderClass = 'border-amber-300';
                    }

                    return (
                        <motion.div
                            key={char.id}
                            layout
                            onClick={() => !revealed && handleTrust(char.id)}
                            className={`p-4 rounded-2xl border-2 transition-all ${bgClass} ${borderClass} ${!revealed ? 'cursor-pointer hover:shadow-md' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-stone-800 truncate">{char.name}</div>
                                    <div className="text-[10px] text-stone-400 uppercase tracking-wide truncate">
                                        {char.role}
                                    </div>
                                </div>
                                {isTrusted && !revealed && (
                                    <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 ml-2">
                                        <span className="text-[9px] font-black text-white">✓</span>
                                    </div>
                                )}
                                {revealed && isTrusted && (
                                    <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${isTraitor ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    >
                                        {isTraitor ? (
                                            <EyeOff size={10} className="text-white" />
                                        ) : (
                                            <Eye size={10} className="text-white" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed">{char.description}</p>
                            {revealed && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-2 text-xs font-medium leading-snug ${isTraitor ? 'text-red-600' : 'text-emerald-700'}`}
                                >
                                    {isTraitor ? '⚠ Rasputin-sympatisør' : '✓ Lojal'}: {char.feedback}
                                </motion.p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="p-4 pt-0">
                {!revealed ? (
                    <button
                        onClick={handleReveal}
                        disabled={!allTokensPlaced}
                        className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
                    >
                        {allTokensPlaced
                            ? 'Avsløring'
                            : `Plasser ${tokensLeft} token${tokensLeft !== 1 ? 'er' : ''} til`}
                    </button>
                ) : (
                    <button
                        onClick={handleContinue}
                        className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors"
                    >
                        Gå videre
                    </button>
                )}
            </div>
        </div>
    );
};
