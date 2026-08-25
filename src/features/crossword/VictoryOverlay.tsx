// Seiersskjermen. Den skal føles som en premie, ikke som en kvittering.

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Lightbulb, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { PlacedWord } from './types';

interface VictoryProps {
    elapsed: number;
    hintsUsed: number;
    mistakes: number;
    xp: number;
    words: PlacedWord[];
    onNew: () => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
    <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-4 py-3">
        <span className="mb-1 text-indigo-500">{icon}</span>
        <span className="text-xl font-black text-slate-800">{value}</span>
        <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {label}
        </span>
    </div>
);

export const VictoryOverlay = ({
    elapsed,
    hintsUsed,
    mistakes,
    xp,
    words,
    onNew,
}: VictoryProps) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
        <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
        >
            <div className="mb-4 text-center">
                <motion.span
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 12 }}
                    className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/40"
                >
                    <Trophy size={30} />
                </motion.span>
                <h2 className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-3xl font-black text-transparent">
                    Alle rutene fylt!
                </h2>
                <p className="mt-1 text-slate-500">Du klarte {words.length} ord.</p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
                <Stat icon={<Clock size={18} />} value={formatTime(elapsed)} label="Tid" />
                <Stat icon={<Lightbulb size={18} />} value={String(hintsUsed)} label="Hint brukt" />
                <Stat icon={<Sparkles size={18} />} value={`+${xp}`} label="XP" />
            </div>

            {mistakes > 0 && (
                <p className="mb-4 text-center text-xs font-semibold text-slate-400">
                    {mistakes} bom underveis. Det er sånn man lærer.
                </p>
            )}

            <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                Ordene du løste
            </h3>
            <div className="mb-6 flex flex-wrap gap-1.5">
                {words.map((word, index) => {
                    const chip = (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + index * 0.03 }}
                            className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                word.link
                                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {word.display}
                        </motion.span>
                    );
                    return word.link ? (
                        <Link key={word.id} to={word.link}>
                            {chip}
                        </Link>
                    ) : (
                        <span key={word.id}>{chip}</span>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <motion.button
                    type="button"
                    onClick={onNew}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/30"
                >
                    <RotateCcw size={18} />
                    Nytt kryssord
                </motion.button>
                <Link
                    to="/oving"
                    className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                    Tilbake til øving
                </Link>
            </div>
        </motion.div>
    </motion.div>
);
