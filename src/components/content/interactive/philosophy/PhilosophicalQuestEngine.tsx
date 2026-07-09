import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhilosophyQuest, DialogueChoice, PhilosophyAxis } from '../../../../data/philosophy/types';
import { AXIS_LABELS, AXIS_DESCRIPTIONS } from '../../../../data/philosophy/types';
import { Sparkles, MessageSquare, ArrowRight, Brain, Zap, History, Lightbulb } from 'lucide-react';
import { usePhilosophyProfile } from '../../../../hooks/usePhilosophyProfile';
import { QuestCompletionScreen } from './QuestCompletionScreen';

interface PhilosophicalQuestEngineProps {
    quest: PhilosophyQuest;
    mentorImage?: string;
    onExit?: () => void;
    onStartNextQuest?: (questId: string) => void;
}

export const PhilosophicalQuestEngine: React.FC<PhilosophicalQuestEngineProps> = ({
    quest,
    mentorImage,
    onExit,
    onStartNextQuest,
}) => {
    const { profile, updateAlignment, completeQuest, questProgress, saveQuestProgress, clearQuestProgress, ACHIEVEMENTS } = usePhilosophyProfile();

    // Resume from saved progress if available
    const resumed = questProgress?.questId === quest.id ? questProgress : null;
    const [currentStepId, setCurrentStepId] = useState(resumed?.stepId || quest.initialStepId);
    const [history, setHistory] = useState<string[]>(resumed?.history || []);
    const [isCompleted, setIsCompleted] = useState(false);
    const [pendingFeedback, setPendingFeedback] = useState<{ text: string; nextStepId?: string; impact?: Partial<Record<PhilosophyAxis, number>> } | null>(null);
    const [alignmentDelta, setAlignmentDelta] = useState<Partial<Record<PhilosophyAxis, number>> | null>(null);
    const [choicesMade, setChoicesMade] = useState<DialogueChoice[]>([]);
    const [newlyEarnedAchievementIds, setNewlyEarnedAchievementIds] = useState<string[]>([]);

    // Save progress whenever step changes
    useEffect(() => {
        if (!isCompleted) {
            saveQuestProgress({ questId: quest.id, stepId: currentStepId, history });
        }
    }, [currentStepId, history, isCompleted, quest.id, saveQuestProgress]);

    // Clear alignment delta after 2s
    useEffect(() => {
        if (alignmentDelta) {
            const timer = setTimeout(() => setAlignmentDelta(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [alignmentDelta]);

    if (isCompleted) {
        return (
            <QuestCompletionScreen
                quest={quest}
                choicesMade={choicesMade}
                newlyEarnedAchievementIds={newlyEarnedAchievementIds}
                onClose={onExit || (() => {})}
                onStartNextQuest={onStartNextQuest}
            />
        );
    }

    const currentStep = quest.steps.find(s => s.id === currentStepId);
    const currentIndex = quest.steps.findIndex(s => s.id === currentStepId);
    const totalSteps = quest.steps.length;

    const navigateTo = (stepId?: string) => {
        if (!stepId || stepId === 'End') {
            // Detect achievements that will be unlocked by completing this quest
            const futureProfile = {
                ...profile,
                completedQuests: profile.completedQuests.includes(quest.id)
                    ? profile.completedQuests
                    : [...profile.completedQuests, quest.id],
            };
            const willEarn = ACHIEVEMENTS.filter(a => a.condition(futureProfile)).map(a => a.id);
            const newOnes = willEarn.filter(id => !profile.achievements.includes(id));
            setNewlyEarnedAchievementIds(newOnes);

            completeQuest(quest.id, quest.rewardXp);
            clearQuestProgress();
            setIsCompleted(true);

            // «Min læring»: filosofisk dialog fullført
            import('../../../../features/progress/useProgressStore').then(
                ({ useProgressStore }) => {
                    useProgressStore.getState().recordActivity({
                        kind: 'philosophy-quest',
                        activityId: `filosofi/${quest.id}`,
                        subjectId: 'krle',
                        topicId: 'filosofi',
                        title: quest.title,
                    });
                }
            );
        } else {
            setHistory(prev => [...prev, currentStepId]);
            setCurrentStepId(stepId);
        }
    };

    const handleChoice = (choice: DialogueChoice) => {
        setChoicesMade(prev => [...prev, choice]);
        if (choice.impact) {
            updateAlignment(choice.impact);
        }

        if (choice.feedback) {
            setPendingFeedback({
                text: choice.feedback,
                nextStepId: choice.nextStepId,
                impact: choice.impact,
            });
        } else {
            // Show alignment delta as toast (only when no feedback)
            if (choice.impact && Object.keys(choice.impact).length > 0) {
                setAlignmentDelta(choice.impact);
            }
            navigateTo(choice.nextStepId);
        }
    };

    const dismissFeedback = () => {
        const next = pendingFeedback?.nextStepId;
        setPendingFeedback(null);
        navigateTo(next);
    };

    const goBack = () => {
        if (history.length > 0) {
            const previousStepId = history[history.length - 1];
            // Reverser alignment-effekten av valget som førte hit, slik at
            // tilbake + nytt valg ikke teller dobbelt. Ved gjenopptatt quest
            // finnes ikke tidligere valg i minnet - da lar vi alignment stå.
            const lastChoice = choicesMade[choicesMade.length - 1];
            if (lastChoice?.impact) {
                const reversed: Partial<Record<PhilosophyAxis, number>> = {};
                for (const [axis, value] of Object.entries(lastChoice.impact)) {
                    if (value) reversed[axis as PhilosophyAxis] = -value;
                }
                updateAlignment(reversed);
            }
            setChoicesMade(prev => prev.slice(0, -1));
            setHistory(prev => prev.slice(0, -1));
            setCurrentStepId(previousStepId);
            setPendingFeedback(null);
            setAlignmentDelta(null);
        }
    };

    // Bevar lagret fremgang ved avslutning - eleven skal kunne fortsette
    // dialogen senere. Kun fullføring rydder questProgress.
    const handleExit = () => {
        onExit?.();
    };

    if (!currentStep) return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-red-500">
            <h3 className="font-bold text-xl mb-2">Feil: Steg ikke funnet</h3>
            <p className="font-mono bg-red-50 p-2 rounded">ID: &quot;{currentStepId}&quot;</p>
            <button onClick={handleExit} className="mt-4 px-6 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                Tilbake
            </button>
        </div>
    );

    const stepImage = currentStep.image || mentorImage;

    return (
        <div className="max-w-5xl mx-auto min-h-[500px] flex flex-col">
            {/* Quest Header */}
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md overflow-hidden">
                        {mentorImage ? (
                            <img src={mentorImage} alt={quest.mentor} className="w-full h-full object-cover" />
                        ) : (
                            <Brain size={20} />
                        )}
                    </div>
                    <div>
                        <h2 className="text-base font-black tracking-tight leading-tight">{quest.title}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{quest.mentor}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {history.length > 0 && (
                        <button
                            onClick={goBack}
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Gå tilbake"
                        >
                            <History size={16} />
                        </button>
                    )}
                    <button
                        onClick={handleExit}
                        className="px-5 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                        Avslutt
                    </button>
                </div>
            </header>

            {/* Progress Dots */}
            <div className="flex items-center gap-1 mb-5">
                {quest.steps.map((step, i) => (
                    <div
                        key={step.id}
                        className={`h-1 rounded-full transition-all ${
                            i < currentIndex ? 'bg-indigo-500 flex-1' :
                            i === currentIndex ? 'bg-indigo-400 flex-[2]' :
                            'bg-slate-200 flex-1'
                        }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-10 gap-5 flex-1">
                {/* Visual Panel */}
                <div className="md:col-span-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStepId + '-image'}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-900 border border-black/5 group"
                        >
                            {stepImage && (
                                <img
                                    src={stepImage}
                                    alt={quest.mentor}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                    loading="lazy"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-[10px] font-bold uppercase tracking-widest mb-2">
                                    <Sparkles size={10} className="text-amber-400" />
                                    <span>Filosofisk Mentor</span>
                                </div>
                                <p className="text-lg font-display font-black text-white">{currentStep.speaker || quest.mentor}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dialogue Panel */}
                <div className="md:col-span-6 flex flex-col justify-center py-1 relative">
                    {/* Alignment Delta Toast */}
                    <AnimatePresence>
                        {alignmentDelta && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -top-2 left-0 right-0 z-10 flex flex-col gap-1.5 items-center"
                            >
                                {Object.entries(alignmentDelta).map(([axis, value]) => (
                                    <AlignmentDeltaPill key={axis} axis={axis as PhilosophyAxis} value={value} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {pendingFeedback ? (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                {/* Show delta inside feedback card */}
                                {pendingFeedback.impact && Object.keys(pendingFeedback.impact).length > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(pendingFeedback.impact).map(([axis, value]) => (
                                            <AlignmentDeltaPill key={axis} axis={axis as PhilosophyAxis} value={value} />
                                        ))}
                                    </div>
                                )}

                                <div className="relative bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Innsikt</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-serif italic">
                                                {pendingFeedback.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={dismissFeedback}
                                    className="group w-full p-3.5 text-center rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all font-bold text-sm text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-2"
                                >
                                    Fortsett <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={currentStepId + '-text'}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="relative">
                                    <div className="absolute -left-3 -top-3 text-indigo-100 opacity-50">
                                        <MessageSquare size={40} fill="currentColor" />
                                    </div>
                                    <p className="relative z-10 text-lg md:text-xl font-serif text-slate-800 leading-relaxed">
                                        &ldquo;{currentStep.text}&rdquo;
                                    </p>
                                </div>

                                {/* Ett valg = ikke et reelt valg. Da rendres det som
                                    elevens svar med en fortsett-knapp, ikke som valgliste. */}
                                {currentStep.choices.length === 1 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="pt-3"
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            Ditt svar
                                        </p>
                                        <button
                                            onClick={() => handleChoice(currentStep.choices[0])}
                                            className="group w-full p-4 text-left rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-between"
                                        >
                                            <p className="font-bold text-sm text-white leading-snug flex-1">
                                                {currentStep.choices[0].text}
                                            </p>
                                            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white transition-all ml-3 shrink-0 group-hover:translate-x-0.5">
                                                <ArrowRight size={16} />
                                            </div>
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-2.5 pt-3">
                                        {currentStep.choices.map((choice, idx) => (
                                            <motion.button
                                                key={choice.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 + idx * 0.08 }}
                                                onClick={() => handleChoice(choice)}
                                                className="group w-full p-4 text-left rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center justify-between"
                                            >
                                                <p className="font-bold text-sm text-slate-700 group-hover:text-indigo-600 transition-colors leading-snug flex-1">
                                                    {choice.text}
                                                </p>
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all ml-3 shrink-0">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm">
                        <Zap size={14} fill="currentColor" />
                        <span>+{quest.rewardXp} XP</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-slate-400 font-medium">
                        Steg {currentIndex + 1} av {totalSteps}
                    </span>
                </div>
            </footer>
        </div>
    );
};

interface AlignmentDeltaPillProps {
    axis: PhilosophyAxis;
    value: number | undefined;
}

const AlignmentDeltaPill: React.FC<AlignmentDeltaPillProps> = ({ axis, value }) => {
    if (!value) return null;
    const label = AXIS_LABELS[axis] || axis;
    const description = AXIS_DESCRIPTIONS[axis];
    const positive = value > 0;
    return (
        <div className={`flex items-baseline gap-2 px-3 py-1.5 rounded-xl border ${
            positive
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-rose-50 border-rose-100'
        }`}>
            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
                positive ? 'text-emerald-700' : 'text-rose-700'
            }`}>
                {positive ? '↑' : '↓'} {label} {positive ? '+' : ''}{value}
            </span>
            <span className="text-[11px] text-slate-600 leading-snug">{description}</span>
        </div>
    );
};
