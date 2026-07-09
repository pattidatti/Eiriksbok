import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowLeft, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RELICS } from './relics';
import type { MissedPrompt, RelicId } from './types';

interface LoypeSummaryProps {
    won: boolean;
    correct: number;
    answered: number;
    bestCombo: number;
    xp: number;
    relics: RelicId[];
    misses: MissedPrompt[];
    onRetry: () => void;
    onNewRun: () => void;
}

// Sluttskjermen: feiring ved seier, oppmuntring ved tap, og «verdt å
// repetere»-listen som gjør feilene om til neste lesestoff.
export const LoypeSummary: React.FC<LoypeSummaryProps> = ({
    won,
    correct,
    answered,
    bestCombo,
    xp,
    relics,
    misses,
    onRetry,
    onNewRun,
}) => {
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (!won || reducedMotion) return;
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'],
        });
    }, [won, reducedMotion]);

    return (
        <div className="max-w-xl mx-auto text-center">
            <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="text-7xl mb-3"
                role="img"
                aria-label={won ? 'Seier' : 'Løypa tapt'}
            >
                {won ? '🏆' : '🌫️'}
            </motion.div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">
                {won ? 'Du slo Glemselens vokter!' : 'Løypa tok deg denne gangen'}
            </h2>
            <p className="text-slate-600 mb-6">
                {won
                    ? 'Kunnskapen din var sterkere enn glemselen.'
                    : 'Hvert forsøk gjør deg sterkere - prøv en ny vei opp!'}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Riktige svar', value: `${correct}/${answered}` },
                    { label: 'Beste combo', value: `${bestCombo}` },
                    { label: 'Poeng', value: `${xp}` },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4"
                    >
                        <p className="text-2xl font-display font-bold text-indigo-600">
                            {stat.value}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {relics.length > 0 && (
                <div className="mb-6 flex items-center justify-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Relikvier:</span>
                    {relics.map((id) => (
                        <span key={id} title={RELICS[id].title} className="text-2xl">
                            {RELICS[id].emoji}
                        </span>
                    ))}
                </div>
            )}

            {misses.length > 0 && (
                <div className="mb-6 text-left bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Verdt å repetere
                    </h3>
                    <ul className="space-y-2">
                        {misses.slice(0, 5).map((miss) => (
                            <li key={miss.prompt} className="text-sm text-slate-600 leading-snug">
                                {miss.link ? (
                                    <Link
                                        to={miss.link}
                                        className="text-indigo-600 hover:underline font-medium"
                                    >
                                        {miss.prompt}
                                    </Link>
                                ) : (
                                    miss.prompt
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={onRetry}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <RotateCcw className="w-5 h-5" />
                    {won ? 'Ny løype' : 'Prøv igjen'}
                </button>
                <button
                    onClick={onNewRun}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                    Velg fag på nytt
                </button>
                <Link
                    to="/oving"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-500 font-bold hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Til øving
                </Link>
            </div>
        </div>
    );
};
