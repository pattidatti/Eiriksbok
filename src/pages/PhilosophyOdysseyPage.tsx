import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    BrainCircuit,
    Star,
    Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageSkeleton } from '../components/Skeleton';
import { usePhilosophyProfile } from '../hooks/usePhilosophyProfile';
import { PhilosophicalQuestEngine } from '../components/content/interactive/philosophy/PhilosophicalQuestEngine';
import type { PhilosophyQuest } from '../data/philosophy/types';
import { findQuestConfig, getLevelTitle } from '../data/philosophy/questRegistry';
import { QuestList } from '../components/content/interactive/philosophy/QuestList';
import { HeroSection } from '../components/content/interactive/philosophy/HeroSection';
import { AlignmentRadar } from '../components/content/interactive/philosophy/AlignmentRadar';
import { PhilosophyTimeline } from '../components/content/interactive/philosophy/PhilosophyTimeline';
import { ReflectionJournal } from '../components/content/interactive/philosophy/ReflectionJournal';

export const PhilosophyOdysseyPage: React.FC = () => {
    const [activeQuest, setActiveQuest] = useState<PhilosophyQuest | null>(null);
    const [activeQuestId, setActiveQuestId] = useState<string | null>(null);

    const { profile, isLoaded: profileLoaded, progress, earnedAchievements } = usePhilosophyProfile();

    const { data: fetchedQuest, error: questError } = useQuery({
        queryKey: ['quest', activeQuestId],
        queryFn: async () => {
            if (!activeQuestId) return null;
            const config = findQuestConfig(activeQuestId);
            if (!config) throw new Error(`Quest "${activeQuestId}" finnes ikke.`);

            const res = await fetch(config.path);
            if (!res.ok) throw new Error(`Kunne ikke laste quest (${res.status})`);
            return res.json() as Promise<PhilosophyQuest>;
        },
        enabled: !!activeQuestId,
        retry: false,
    });

    useEffect(() => {
        if (fetchedQuest) {
            setActiveQuest(fetchedQuest);
            setActiveQuestId(null);
        }
    }, [fetchedQuest]);

    if (!profileLoaded) return <PageSkeleton />;

    const mentorImagePath = activeQuest
        ? `/images/filosofi/${activeQuest.mentor.toLowerCase().replace(/ /g, '_')}_hero.webp`
        : undefined;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Breadcrumb Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link to="/krle/filosofi" className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                        <ArrowLeft size={16} />
                        Filosofi
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Zap size={14} className="text-indigo-500" />
                            <span>{profile.xp} XP</span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <BrainCircuit size={16} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeQuest ? (
                        <motion.div
                            key="active-quest"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <PhilosophicalQuestEngine
                                quest={activeQuest}
                                mentorImage={mentorImagePath}
                                onExit={() => setActiveQuest(null)}
                                onStartNextQuest={(questId) => {
                                    setActiveQuest(null);
                                    setActiveQuestId(questId);
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* Page Title */}
                            <div>
                                <h1 className="text-3xl font-display font-black tracking-tight mb-1">Den Filosofiske Odysseen</h1>
                                <p className="text-slate-400 text-sm">Reis gjennom filosofiens historie i dialog med de store tenkerne.</p>
                            </div>

                            {/* Error State */}
                            {questError && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
                                    Kunne ikke laste quest: {(questError as Error).message}
                                </div>
                            )}

                            {/* Loading State */}
                            {activeQuestId && !questError && (
                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm animate-pulse">
                                    Laster dialog...
                                </div>
                            )}

                            {/* Hero */}
                            <HeroSection profile={profile} progress={progress} onStartQuest={setActiveQuestId} />

                            {/* Philosophy Timeline */}
                            <PhilosophyTimeline onStartQuest={setActiveQuestId} />

                            {/* Main Grid: Quests + Sidebar */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Quest List */}
                                <div className="lg:col-span-7">
                                    <QuestList onSelectQuest={setActiveQuestId} />
                                </div>

                                {/* Sidebar */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Profile Card */}
                                    <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <BrainCircuit size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">{getLevelTitle(profile.level)}</h3>
                                                <p className="text-xs text-slate-400">Nivå {profile.level}</p>
                                            </div>
                                        </div>

                                        {/* XP Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                <span>Framgang</span>
                                                <span>{profile.xp % 1000} / 1000 XP</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(profile.xp % 1000) / 10}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 text-center py-4 border-t border-black/5">
                                            <div>
                                                <p className="text-lg font-black">{progress.completed}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Fullført</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{progress.percent}%</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Progresjon</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{earnedAchievements.length}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Merker</p>
                                            </div>
                                        </div>

                                        {/* Achievements */}
                                        {earnedAchievements.length > 0 && (
                                            <div className="pt-4 border-t border-black/5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Siste merke</p>
                                                <div className="flex items-center gap-2">
                                                    <Star size={14} className="text-amber-500" />
                                                    <span className="text-sm font-bold">{earnedAchievements[earnedAchievements.length - 1].title}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Alignment Radar */}
                                    <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-6">
                                        <h3 className="font-bold text-sm mb-1">Filosofisk Kompass</h3>
                                        <p className="text-xs text-slate-400 mb-4">Basert på dine valg i dialogene.</p>
                                        <AlignmentRadar alignment={profile.alignment} compact />
                                    </div>

                                    {/* Tenkedagbok - vises først når eleven har svart på noe */}
                                    <ReflectionJournal />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
