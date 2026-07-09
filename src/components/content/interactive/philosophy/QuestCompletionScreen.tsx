import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Trophy, ArrowRight, Star, Sparkles, MessageCircle, Target, Compass, Scale } from 'lucide-react';
import type { DialogueChoice, PhilosophyAxis, PhilosophyQuest } from '../../../../data/philosophy/types';
import { AXIS_DESCRIPTIONS, AXIS_LABELS } from '../../../../data/philosophy/types';
import { usePhilosophyProfile } from '../../../../hooks/usePhilosophyProfile';
import { findQuestConfig, getLevelTitle, getNextQuest } from '../../../../data/philosophy/questRegistry';
import { AchievementUnlockedModal } from './AchievementUnlockedModal';
import confetti from 'canvas-confetti';

interface QuestCompletionScreenProps {
    quest: PhilosophyQuest;
    choicesMade?: DialogueChoice[];
    newlyEarnedAchievementIds?: string[];
    onClose: () => void;
    onStartNextQuest?: (questId: string) => void;
}

export const QuestCompletionScreen: React.FC<QuestCompletionScreenProps> = ({ quest, choicesMade = [], newlyEarnedAchievementIds = [], onClose, onStartNextQuest }) => {
    const { profile, ACHIEVEMENTS, reflections, saveReflection } = usePhilosophyProfile();
    const [xpAnimated, setXpAnimated] = useState(0);
    const [achievementModalDismissed, setAchievementModalDismissed] = useState(false);

    const nextQuest = getNextQuest(profile);
    const questConfig = findQuestConfig(quest.id);
    const newlyEarnedAchievements = useMemo(
        () => ACHIEVEMENTS.filter(a => newlyEarnedAchievementIds.includes(a.id)),
        [ACHIEVEMENTS, newlyEarnedAchievementIds]
    );

    const aggregatedImpact = useMemo(() => {
        const totals: Partial<Record<PhilosophyAxis, number>> = {};
        for (const choice of choicesMade) {
            if (!choice.impact) continue;
            for (const [axis, value] of Object.entries(choice.impact)) {
                if (!value) continue;
                const key = axis as PhilosophyAxis;
                totals[key] = (totals[key] || 0) + value;
            }
        }
        return Object.entries(totals)
            .filter(([, v]) => v && v !== 0)
            .sort(([, a], [, b]) => Math.abs(b!) - Math.abs(a!))
            .slice(0, 3) as [PhilosophyAxis, number][];
    }, [choicesMade]);

    useEffect(() => {
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#fbbf24'],
        });

        const step = Math.max(10, Math.round(quest.rewardXp / 30));
        const interval = setInterval(() => {
            setXpAnimated(prev => {
                if (prev < quest.rewardXp) return Math.min(prev + step, quest.rewardXp);
                return prev;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [quest.rewardXp]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 relative overflow-hidden">
            {!achievementModalDismissed && newlyEarnedAchievements.length > 0 && (
                <AchievementUnlockedModal
                    achievements={newlyEarnedAchievements}
                    onDismiss={() => setAchievementModalDismissed(true)}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/50 to-transparent pointer-events-none" />

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/30 relative z-10"
            >
                <Trophy size={40} />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black mb-2 font-display"
            >
                Dialog fullført!
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 text-sm mb-6 max-w-md"
            >
                Du har navigert gjennom &laquo;{quest.title}&raquo; med visdom.
            </motion.p>

            {/* Learning Goal — hva du nettopp lærte */}
            {questConfig?.learningGoal && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-5 w-full max-w-md bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-left relative z-10"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={14} className="text-indigo-500" />
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Hva du lærte</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{questConfig.learningGoal}</p>
                </motion.div>
            )}

            {/* Dominant Alignment — dine valg flyttet kompasset hit */}
            {aggregatedImpact.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="mb-5 w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 text-left relative z-10"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Compass size={14} className="text-purple-500" />
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Dine valg trakk deg mot</p>
                    </div>
                    <ul className="space-y-2">
                        {aggregatedImpact.map(([axis, value]) => {
                            const positive = value > 0;
                            return (
                                <li key={axis} className="flex items-baseline gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 px-2 py-0.5 rounded-md ${
                                        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                        {positive ? '↑' : '↓'} {AXIS_LABELS[axis]} {positive ? '+' : ''}{value}
                                    </span>
                                    <span className="text-[11px] text-slate-600 leading-snug">{AXIS_DESCRIPTIONS[axis]}</span>
                                </li>
                            );
                        })}
                    </ul>
                </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6 relative z-10">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white p-4 rounded-2xl border border-black/5 shadow-lg flex flex-col items-center"
                >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">XP opptjent</div>
                    <div className="text-2xl font-black flex items-center gap-1.5">
                        <Zap className="text-amber-400" fill="currentColor" size={18} />
                        {xpAnimated}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white p-4 rounded-2xl border border-black/5 shadow-lg flex flex-col items-center"
                >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-1">Nivå {profile.level}</div>
                    <div className="text-2xl font-black flex items-center gap-1.5">
                        <Star className="text-purple-400" fill="currentColor" size={18} />
                        <span className="text-base">{getLevelTitle(profile.level)}</span>
                    </div>
                </motion.div>
            </div>

            {/* Reflection Questions - besvarbare, lagres i tenkedagboken */}
            {quest.reflectionQuestions && quest.reflectionQuestions.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mb-6 w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left relative z-10"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <MessageCircle size={14} className="text-indigo-500" />
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Hva tenker du?</p>
                    </div>
                    <div className="space-y-4">
                        {quest.reflectionQuestions.map((q, i) => (
                            <ReflectionField
                                key={i}
                                question={q}
                                initialAnswer={reflections[quest.id]?.[i]?.a ?? ''}
                                onSave={(text) => saveReflection(quest.id, i, q, text)}
                            />
                        ))}
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">
                        Svarene dine lagres i tenkedagboken på oversikten.
                    </p>
                </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-col gap-3 w-full max-w-xs"
            >
                {nextQuest && onStartNextQuest && (
                    <button
                        onClick={() => onStartNextQuest(nextQuest.id)}
                        className="w-full px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Sparkles size={14} />
                        Neste: {nextQuest.title}
                    </button>
                )}
                {questConfig?.philosopherId && (
                    <Link
                        to={`/krle/filosofi/sammenlign?velg=${questConfig.philosopherId}`}
                        className="w-full px-8 py-3 rounded-2xl bg-white text-indigo-600 border border-indigo-200 font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Scale size={14} />
                        Sammenlign {quest.mentor} med andre
                    </Link>
                )}
                <button
                    onClick={onClose}
                    className={`w-full px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${
                        nextQuest && onStartNextQuest
                            ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            : 'bg-black text-white hover:bg-slate-800'
                    }`}
                >
                    <span>Tilbake til oversikt</span>
                    <ArrowRight size={14} />
                </button>
            </motion.div>
        </div>
    );
};

interface ReflectionFieldProps {
    question: string;
    initialAnswer: string;
    onSave: (text: string) => void;
}

// Tekstfelt for ett refleksjonsspørsmål. Lagrer ved blur, og viser en kort
// bekreftelse så eleven vet at svaret er tatt vare på.
const ReflectionField: React.FC<ReflectionFieldProps> = ({ question, initialAnswer, onSave }) => {
    const [value, setValue] = useState(initialAnswer);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    useEffect(() => {
        if (savedAt === null) return;
        const timer = setTimeout(() => setSavedAt(null), 2000);
        return () => clearTimeout(timer);
    }, [savedAt]);

    const handleBlur = () => {
        if (value.trim() === initialAnswer.trim() && !value.trim()) return;
        onSave(value.trim());
        if (value.trim()) setSavedAt(Date.now());
    };

    return (
        <div>
            <p className="text-sm text-slate-600 font-serif italic leading-relaxed mb-1.5">{question}</p>
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    rows={2}
                    placeholder="Skriv tanken din her..."
                    className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                />
                {savedAt !== null && (
                    <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-1 right-1 text-[10px] font-bold text-emerald-600"
                    >
                        Lagret ✓
                    </motion.span>
                )}
            </div>
        </div>
    );
};
