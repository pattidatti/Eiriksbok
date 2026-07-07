// Hero-seksjonen på «Min læring»: streak-flamme med XP-multiplikator og
// fryser, nivå/XP-fremdrift, en stor «neste steg»-knapp med bilde, og dagens
// auto-genererte mål med avhuking fra dagens hendelser.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, Pencil, Snowflake, Sparkles } from 'lucide-react';
import { Image as LazyImage } from '../../../components/Image';
import { levelProgress } from '../xp';
import { useCelebration } from '../useCelebration';
import { useCountUp } from './useCountUp';
import type { DailyGoal } from '../types';

export interface PrimaryAction {
    title: string;
    subtitle: string;
    link: string;
    image?: string;
}

// Fagkort i velkomstvarianten for helt nye elever.
export interface WelcomeSubject {
    subjectId: string;
    title: string;
    image?: string;
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
    totalXp: number;
    badgeCount: number;
    primaryAction: PrimaryAction | null;
    goals: { goal: DailyGoal; progress: number }[];
    // Dagens gnistmål - gir ekstra XP og markeres med gnist og glød.
    bonusGoalId?: string | null;
    // Streaken lever, men dagens innsats er ikke i mål ennå.
    streakAtRisk?: boolean;
    onEditProfile: () => void;
    // Satt for helt nye elever - bytter heroen til en velkomstvariant.
    welcome?: WelcomeSubject[] | null;
}

// Nivå + XP-bar, kompakt på gradienten - erstatter det gamle LevelCard-kortet.
const LevelInline = ({ totalXp, badgeCount }: { totalXp: number; badgeCount: number }) => {
    const { level, into, needed } = levelProgress(totalXp);
    const pct = Math.min(100, Math.round((into / needed) * 100));
    const shownXp = useCountUp(totalXp);
    const celebrate = useCelebration((s) => s.celebrate);
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur px-3.5 py-2.5 md:ml-auto">
            <button
                onClick={() => celebrate({ type: 'levelup', level })}
                title="Vis frem nivået ditt"
                className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/25 text-white transition-transform hover:scale-110"
            >
                <span className="text-[8px] font-bold uppercase tracking-wide opacity-80">
                    Nivå
                </span>
                <span className="font-display text-lg font-bold leading-none">{level}</span>
            </button>
            <div className="w-36 min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-white tabular-nums">
                        {shownXp.toLocaleString('nb-NO')} XP
                    </p>
                    <p className="truncate text-[10px] text-indigo-100">
                        {needed - into} til niv. {level + 1}
                    </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400"
                    />
                </div>
                <p className="mt-1 text-[10px] text-indigo-100">
                    🏅 {badgeCount} {badgeCount === 1 ? 'utmerkelse' : 'utmerkelser'}
                </p>
            </div>
        </div>
    );
};

export const HeroCard = ({
    nickname,
    avatarEmoji,
    streak,
    streakAlive,
    bestStreak,
    freezes,
    multiplier,
    totalXp,
    badgeCount,
    primaryAction,
    goals,
    bonusGoalId = null,
    streakAtRisk = false,
    onEditProfile,
    welcome = null,
}: HeroCardProps) => {
    const shownStreak = streakAlive ? streak : 0;
    // Vis multiplikatoren bare når den faktisk gir noe (levende streak > 0).
    const showMultiplier = shownStreak > 0 && multiplier > 1;
    const countedStreak = useCountUp(shownStreak, 700, 200);

    // Mål som akkurat gikk fra uferdig til ferdig får hake-spring og gull-glød.
    // Guarded state-justering under render (React-dokumentert mønster):
    // ved sideinnlasting står alt ferdige stille, kun ekte overganger glør.
    const doneIds = goals
        .filter(({ goal, progress }) => progress >= goal.target)
        .map(({ goal }) => goal.id)
        .sort();
    const doneKey = doneIds.join(',');
    const [prevDoneKey, setPrevDoneKey] = useState<string | null>(null);
    const [glowIds, setGlowIds] = useState<string[]>([]);
    if (doneKey !== prevDoneKey) {
        const prevSet = new Set((prevDoneKey ?? '').split(','));
        setGlowIds(prevDoneKey === null ? [] : doneIds.filter((id) => !prevSet.has(id)));
        setPrevDoneKey(doneKey);
    }
    const justDone = (goalId: string): boolean => glowIds.includes(goalId);

    // Velkomstvariant: tre tydelige steg i stedet for streak og mål.
    if (welcome) {
        return (
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/20 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

                <div className="relative z-10">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
                        Velkommen{nickname ? `, ${nickname}` : ''}! 👋
                    </h2>
                    <p className="text-sm text-indigo-100 mb-5">
                        Slik kommer du i gang - tre enkle steg:
                    </p>

                    <div className="space-y-3">
                        {/* Steg 1: avatar og navn */}
                        <button
                            onClick={onEditProfile}
                            className="group flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left transition-colors hover:bg-white/20"
                        >
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                    nickname
                                        ? 'bg-emerald-400 text-white'
                                        : 'bg-white text-indigo-600'
                                }`}
                            >
                                {nickname ? <Check className="h-4 w-4" /> : '1'}
                            </span>
                            <span className="flex-1">
                                <span className="block text-sm font-bold text-white">
                                    Velg navn og avatar
                                </span>
                                <span className="block text-xs text-indigo-100">
                                    {nickname
                                        ? `Klart! Du er ${avatarEmoji} ${nickname}.`
                                        : 'Gjør profilen til din egen.'}
                                </span>
                            </span>
                            <span className="text-2xl transition-transform group-hover:scale-110">
                                {avatarEmoji}
                            </span>
                        </button>

                        {/* Steg 2: velg fag */}
                        <div className="rounded-2xl bg-white/10 px-4 py-3">
                            <div className="mb-2.5 flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-600">
                                    2
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-white">
                                        Velg et fag du vil starte med
                                    </span>
                                    <span className="block text-xs text-indigo-100">
                                        Hvert kort tar deg rett til en fin første artikkel.
                                    </span>
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                {welcome.map((subject) => (
                                    <Link
                                        key={subject.subjectId}
                                        to={subject.link}
                                        className="group relative block h-20 overflow-hidden rounded-xl no-underline shadow-md"
                                    >
                                        <LazyImage
                                            src={subject.image}
                                            alt=""
                                            seed={subject.title}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <span className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/10" />
                                        <span className="absolute inset-x-0 bottom-0 p-2 text-xs font-bold text-white">
                                            {subject.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Steg 3: første artikkel */}
                        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/30 text-sm font-bold text-white">
                                3
                            </span>
                            <span>
                                <span className="block text-sm font-bold text-white">
                                    Fullfør din første artikkel
                                </span>
                                <span className="block text-xs text-indigo-100">
                                    Da tenner du streaken 🔥 og tjener dine første XP!
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        <p className="text-4xl font-display font-bold text-white leading-none tabular-nums">
                            {countedStreak}
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

                {/* Hilsen + nivå + neste steg + dagens mål */}
                <div className="flex-1 min-w-0">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
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
                        <LevelInline totalXp={totalXp} badgeCount={badgeCount} />
                    </div>

                    {/* Stor «neste steg»-knapp - det viktigste på hele siden */}
                    {primaryAction && primaryAction.image && (
                        <Link
                            to={primaryAction.link}
                            className="group relative mb-4 block h-36 overflow-hidden rounded-2xl no-underline shadow-lg shadow-indigo-900/20 transition-transform hover:-translate-y-0.5 md:h-40"
                        >
                            <LazyImage
                                src={primaryAction.image}
                                alt=""
                                seed={primaryAction.title}
                                priority
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-transparent" />
                            <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                                <span className="min-w-0 flex-1">
                                    <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                                        Fortsett her
                                    </span>
                                    <span className="block truncate font-display text-xl font-bold text-white">
                                        {primaryAction.title}
                                    </span>
                                    <span className="block truncate text-xs text-slate-200">
                                        {primaryAction.subtitle}
                                    </span>
                                </span>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-lg transition-transform group-hover:translate-x-0.5">
                                    <ArrowRight className="h-5 w-5" />
                                </span>
                            </span>
                        </Link>
                    )}
                    {primaryAction && !primaryAction.image && (
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

                    {/* Streak i fare: vennlig dytt, ikke alarm. */}
                    {streakAtRisk && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-400/20 px-3 py-2 text-xs font-medium text-amber-100">
                            <span className="text-base">🔥</span>
                            <span>
                                Hold streaken på {streak} {streak === 1 ? 'dag' : 'dager'} i live -
                                ett mål er nok!
                                {freezes > 0 &&
                                    ` (Du har ${freezes} ${freezes === 1 ? 'fryser' : 'frysere'} i bakhånd.)`}
                            </span>
                        </div>
                    )}

                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-2">
                        Dagens mål
                    </p>
                    <div className="space-y-2">
                        {goals.map(({ goal, progress }) => {
                            const done = progress >= goal.target;
                            const showCount = goal.target > 1;
                            const isBonus = goal.id === bonusGoalId;
                            return (
                                <Link
                                    key={goal.id}
                                    to={goal.link}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all no-underline group ${
                                        done ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
                                    } ${isBonus && !done ? 'ring-2 ring-amber-300/70 bg-amber-400/15' : ''} ${
                                        justDone(goal.id) ? 'animate-goal-glow' : ''
                                    }`}
                                >
                                    <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                            done
                                                ? 'bg-emerald-400 border-emerald-300'
                                                : 'border-white/40'
                                        }`}
                                    >
                                        {done && (
                                            <motion.span
                                                initial={
                                                    justDone(goal.id) ? { scale: 0 } : false
                                                }
                                                animate={{ scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 12,
                                                }}
                                                className="flex"
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.span>
                                        )}
                                    </span>
                                    <span
                                        className={`flex-1 text-sm font-medium ${
                                            done ? 'text-white/80 line-through' : 'text-white'
                                        }`}
                                    >
                                        {goal.label}
                                    </span>
                                    {isBonus && !done && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-300/90 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                            <Sparkles className="h-3 w-3" />
                                            Bonus-XP
                                        </span>
                                    )}
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
