// Min læring-modulen på forsiden: erstatter den gamle «Nylig lest»-rekken.
// Viser streak, nivå og dagens mål som kompakte chips, pluss det viktigste
// neste steget fra anbefalingsmotoren (featured bildekort + to små kort).
// Samme visuelle språk som heroen på /min-laering: uskarpt artikkelbilde
// som bakteppe bak et mørkt slate-overlegg.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Target } from 'lucide-react';
import { Image as LazyImage } from '../../../components/Image';
import { useProgressStore, isStreakAlive } from '../useProgressStore';
import { useRecommendations } from '../useRecommendations';
import { goalProgress } from '../goals';
import { levelProgress } from '../xp';
import { todayLocal } from '../../../utils/reviewScheduler';
import type { Recommendation } from '../recommendations/engine';

const spring = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 320, damping: 26, delay },
});

// Lite anbefalingskort med thumbnail - kompakt utgave for forsiden.
const SmallRecCard = ({ item, delay }: { item: Recommendation; delay: number }) => (
    <motion.div {...spring(delay)} className="min-w-0">
        <Link
            to={item.link}
            className="group flex h-full items-center gap-3 rounded-xl bg-white/10 p-2 pr-3 no-underline backdrop-blur transition-colors hover:bg-white/20"
        >
            <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                <LazyImage
                    src={item.image}
                    alt=""
                    seed={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                    {item.title}
                </span>
                <span className="block truncate text-xs text-slate-300">{item.reason}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
        </Link>
    </motion.div>
);

export const HomeLearningModule = () => {
    const today = todayLocal();
    const { recommendations } = useRecommendations();
    const totalXp = useProgressStore((s) => s.totalXp);
    const streak = useProgressStore((s) => s.streak);
    const goals = useProgressStore((s) => s.goals);
    const events = useProgressStore((s) => s.events);
    const firstCompletions = useProgressStore((s) => s.firstCompletions);

    const primary = recommendations[0];
    if (!primary) return null;
    const rest = recommendations.slice(1, 3);

    const streakAlive = isStreakAlive(streak, today);
    const shownStreak = streakAlive ? streak.current : 0;
    const { level } = levelProgress(totalXp);
    const isNewStudent = totalXp === 0 && Object.keys(firstCompletions).length === 0;

    // Dagens mål-status - bare hvis målene alt er generert for i dag.
    const goalItems = goals?.day === today ? goals.items : [];
    const todaysEvents = events.filter((e) => e.day === today);
    const goalsDone = goalItems.filter(
        (goal) => goalProgress(goal, todaysEvents) >= goal.target
    ).length;

    return (
        <motion.div {...spring(0.05)} className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl shadow-slate-900/25 md:p-6">
                {/* Bakteppe fra det anbefalte bildet - harmonerer alltid. */}
                {primary.image && (
                    <img
                        src={primary.image}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/65 to-slate-900/50" />

                <div className="relative z-10">
                    {/* Topplinje: tittel + status-chips + lenke */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <h3 className="mr-1 font-display text-xl font-bold text-white">
                            {isNewStudent ? 'Start reisen din' : 'Min læring'}
                        </h3>
                        {shownStreak > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                                🔥 {shownStreak} {shownStreak === 1 ? 'dag' : 'dager'}
                            </span>
                        )}
                        {!isNewStudent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                                Nivå {level}
                            </span>
                        )}
                        {goalItems.length > 0 && (
                            <Link
                                to="/min-laering"
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold no-underline backdrop-blur transition-colors ${
                                    goalsDone >= goalItems.length
                                        ? 'bg-emerald-400/20 text-emerald-200'
                                        : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
                                }`}
                            >
                                <Target className="h-3 w-3" />
                                {goalsDone}/{goalItems.length} mål i dag
                            </Link>
                        )}
                        <Link
                            to="/min-laering"
                            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-slate-300 no-underline transition-colors hover:text-white"
                        >
                            Åpne Min læring
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* Innhold: featured bildekort + to små anbefalinger */}
                    <div className="grid gap-3 lg:grid-cols-2">
                        <motion.div {...spring(0.1)}>
                            <Link
                                to={primary.link}
                                className="group relative block h-36 overflow-hidden rounded-2xl no-underline shadow-lg shadow-slate-950/40 md:h-40"
                            >
                                <LazyImage
                                    src={primary.image}
                                    alt=""
                                    seed={primary.title}
                                    priority
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <span className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                                    <span className="min-w-0 flex-1">
                                        <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                                            {isNewStudent ? 'Start her' : 'Fortsett her'}
                                        </span>
                                        <span className="block truncate font-display text-lg font-bold text-white">
                                            {primary.title}
                                        </span>
                                        <span className="block truncate text-xs text-slate-200">
                                            {primary.reason}
                                        </span>
                                    </span>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-lg transition-transform group-hover:translate-x-0.5">
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </span>
                            </Link>
                        </motion.div>

                        {rest.length > 0 && (
                            <div className="flex flex-col justify-center gap-2">
                                {rest.map((item, i) => (
                                    <SmallRecCard key={item.id} item={item} delay={0.15 + i * 0.05} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
