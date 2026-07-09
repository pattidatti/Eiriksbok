import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mountain } from 'lucide-react';
import { getLoypeStats } from './loypeStats';
import type { Difficulty, SubjectChoice } from './types';
import { DIFFICULTY_CONFIG, SUBJECT_CHOICES } from './types';

interface LoypeSetupProps {
    isBuilding: boolean;
    error: string | null;
    onStart: (subject: SubjectChoice, difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['lett', 'middels', 'vanskelig'];

// Startskjermen: velg fag og vanskelighet, se regler og beste resultater.
export const LoypeSetup: React.FC<LoypeSetupProps> = ({ isBuilding, error, onStart }) => {
    const [subject, setSubject] = useState<SubjectChoice>('blandet');
    const [difficulty, setDifficulty] = useState<Difficulty>('lett');
    const stats = getLoypeStats();

    return (
        <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <Link
                        to="/oving"
                        className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Tilbake til oversikt
                    </Link>
                </div>
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl mb-3"
                    role="img"
                    aria-label="Fjell"
                >
                    🏔️
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 text-slate-900">
                    Kunnskapsløypa
                </h1>
                <p className="text-lg text-slate-600 max-w-md mx-auto">
                    Velg vei opp fjellet, overlev utfordringene og slå Glemselens vokter på
                    toppen!
                </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Velg fag</label>
                    <div className="flex flex-wrap gap-2">
                        {SUBJECT_CHOICES.map((choice) => (
                            <button
                                key={choice.id}
                                onClick={() => setSubject(choice.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    subject === choice.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {choice.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Hvor lang løype?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {DIFFICULTIES.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                    difficulty === d
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <span className="block font-bold">{d}</span>
                                <span className="block text-xs opacity-80">
                                    {DIFFICULTY_CONFIG[d].label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1.5">
                    <p>❤️ Du har 3 hjerter - feil svar koster ett.</p>
                    <p>🎁 Plukk relikvier underveis: skjold, femti-femti og mer.</p>
                    <p>🐲 På toppen venter bossen - svar raskt for å slå den!</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
                )}

                <button
                    onClick={() => onStart(subject, difficulty)}
                    disabled={isBuilding}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isBuilding ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Bygger løypa...
                        </>
                    ) : (
                        <>
                            <Mountain className="w-5 h-5" />
                            Start løypa
                        </>
                    )}
                </button>

                {stats.totalRuns > 0 && (
                    <p className="text-center text-xs text-slate-500">
                        Fullførte løyper: {stats.completedRuns} av {stats.totalRuns} · Beste
                        poengsum: {stats.bestXp}
                    </p>
                )}
            </div>
        </div>
    );
};
