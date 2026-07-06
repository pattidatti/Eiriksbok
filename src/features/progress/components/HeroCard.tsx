// Hero-seksjonen på «Min læring»: streak-flamme med XP-multiplikator og
// fryser, en stor «neste steg»-knapp, og dagens auto-genererte mål med
// avhuking fra dagens hendelser.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, Pencil, Snowflake } from 'lucide-react';
import type { DailyGoal } from '../types';

export interface PrimaryAction {
    title: string;
    subtitle: string;
    link: string;
}

interface HeroCardProps {
    nickname: string | null;
    avatarEmoji: string;
    streak: number;
    streakAlive: boolean;
    bestStreak: number;
    freezes: number;
    multiplier: number;
    primaryAction: PrimaryAction | null;
    goals: { goal: DailyGoal; progress: number }[];
    onEditProfile: () => void;
}

export const HeroCard = ({
    nickname,
    avatarEmoji,
    streak,
    streakAlive,
    bestStreak,
    freezes,
    multiplier,
    primaryAction,
    goals,
    onEditProfile,
}: HeroCardProps) => {
    const shownStreak = streakAlive ? streak : 0;
    // Vis multiplikatoren bare når den faktisk gir noe (levende streak > 0).
    const showMultiplier = shownStreak > 0 && multiplier > 1;
    return (
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/20 overflow-hidden">
            {/* Bakgrunns-orbs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start">
                {/* Streak */}
                <div className="flex md:flex-col items-center gap-3 md:gap-1 shrink-0 md:w-32">
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        className={`text-6xl md:text-7xl ${shownStreak > 0 ? '' : 'grayscale opacity-50'}`}
                    >
                        🔥
                    </motion.div>
                    <div className="text-center">
                        <p className="text-4xl font-display font-bold text-white leading-none">
                            {shownStreak}
                        </p>
                        <p className="text-xs text-indigo-100 mt-1">
                            {shownStreak === 1 ? 'dag på rad' : 'dager på rad'}
                        </p>
                        {bestStreak > shownStreak && (
                            <p className="text-[10px] text-indigo-200 mt-0.5">
                                Rekord: {bestStreak}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                            {showMultiplier && (
                                <span className="inline-flex items-center rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                    ×{multiplier.toFixed(2).replace(/\.?0+$/, '')} XP
                                </span>
                            )}
                            {freezes > 0 && (
                                <span
                                    className="inline-flex items-center gap-0.5 rounded-full bg-sky-300/90 px-2 py-0.5 text-[11px] font-bold text-sky-900"
                                    title="Fryser dekker en dag du er borte, så streaken ikke ryker"
                                >
                                    <Snowflake className="w-3 h-3" />
                                    {freezes}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hilsen + neste steg + dagens mål */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={onEditProfile}
                            className="group flex items-center gap-2 text-left"
                            aria-label="Rediger profil"
                        >
                            <span className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {avatarEmoji}
                            </span>
                            <span>
                                <span className="block text-xl md:text-2xl font-display font-bold text-white">
                                    Hei{nickname ? `, ${nickname}` : ''}!
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-indigo-100 group-hover:text-white transition-colors">
                                    <Pencil className="w-3 h-3" />
                                    {nickname ? 'Endre navn og avatar' : 'Velg navn og avatar'}
                                </span>
                            </span>
                        </button>
                    </div>

                    {/* Stor «neste steg»-knapp - det viktigste på hele siden */}
                    {primaryAction && (
                        <Link
                            to={primaryAction.link}
                            className="group mb-4 flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 no-underline shadow-lg shadow-indigo-900/10 transition-transform hover:-translate-y-0.5"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                                    Fortsett her
                                </span>
                                <span className="block truncate font-display text-lg font-bold text-slate-900">
                                    {primaryAction.title}
                                </span>
                                <span className="block truncate text-xs text-slate-500">
                                    {primaryAction.subtitle}
                                </span>
                            </span>
                        </Link>
                    )}

                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-2">
                        Dagens mål
                    </p>
                    <div className="space-y-2">
                        {goals.map(({ goal, progress }) => {
                            const done = progress >= goal.target;
                            const showCount = goal.target > 1;
                            return (
                                <Link
                                    key={goal.id}
                                    to={goal.link}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all no-underline group ${
                                        done ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                            done
                                                ? 'bg-emerald-400 border-emerald-300'
                                                : 'border-white/40'
                                        }`}
                                    >
                                        {done && <Check className="w-4 h-4 text-white" />}
                                    </span>
                                    <span
                                        className={`flex-1 text-sm font-medium ${
                                            done ? 'text-white/80 line-through' : 'text-white'
                                        }`}
                                    >
                                        {goal.label}
                                    </span>
                                    {showCount && !done && (
                                        <span className="text-xs font-bold text-indigo-100 tabular-nums">
                                            {progress}/{goal.target}
                                        </span>
                                    )}
                                    {!done && (
                                        <ChevronRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                </Link>
                            );
                        })}
                        {goals.length === 0 && (
                            <p className="text-sm text-indigo-100">
                                Ingen mål i dag - utforsk fagene og kom tilbake!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
