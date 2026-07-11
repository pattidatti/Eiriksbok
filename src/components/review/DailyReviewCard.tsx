import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { useReviewStore } from '../../stores/useReviewStore';
import { todayLocal } from '../../utils/reviewScheduler';
import { DailyReviewHeroGraphic } from './DailyReviewHeroGraphic';

interface DailyReviewCardProps {
    variant?: 'hero' | 'compact';
}

// Inngangskort til «Dagens økt». Hero-varianten ligger øverst på Øving-siden;
// compact-varianten er en nudge på forsiden som kun vises når det finnes noe
// å repetere og dagens økt ikke er gjort.
export const DailyReviewCard: React.FC<DailyReviewCardProps> = ({ variant = 'hero' }) => {
    const today = useMemo(() => todayLocal(), []);
    const streak = useReviewStore((s) => s.streak.current);
    const dueCount = useReviewStore((s) => s.dueCount(today));
    const doneToday = useReviewStore((s) => s.hasSessionToday(today));
    const itemCount = useReviewStore((s) => Object.keys(s.items).length);

    if (variant === 'compact') {
        if (itemCount === 0 || doneToday) return null;
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <Link
                    to="/oving/dagens-okt"
                    className="group flex items-center justify-between gap-4 bg-white/70 backdrop-blur-sm border border-indigo-100 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="font-display font-semibold text-slate-800">Dagens økt venter</p>
                            <p className="text-sm text-slate-500">
                                {dueCount > 0
                                    ? `${dueCount} ting er klare for repetisjon - ca. 5 minutter`
                                    : 'En rask økt holder kunnskapen fersk - ca. 5 minutter'}
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto mb-8">
            <Link
                to="/oving/dagens-okt"
                className="group relative block bg-white/70 backdrop-blur-sm border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-t-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
                    <div className="shrink-0 group-hover:scale-110 transition-transform">
                        <DailyReviewHeroGraphic variant="square" className="w-14 h-14 rounded-2xl shadow-sm" />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-display font-bold text-slate-800 mb-1">
                            Dagens økt
                        </h2>
                        <p className="text-slate-500">
                            {doneToday
                                ? 'Dagens økt er gjort - kom tilbake i morgen, eller ta en bonusrunde!'
                                : 'En rask repetisjonsøkt som husker hva du har lært - og hva du er i ferd med å glemme.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1 text-2xl font-display font-bold text-slate-700">
                                <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-400' : 'text-slate-300'}`} />
                                {streak}
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Streak
                            </p>
                        </div>
                        {dueCount > 0 && !doneToday && (
                            <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5">
                                <div className="text-2xl font-display font-bold text-slate-700">
                                    {dueCount}
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Klare
                                </p>
                            </div>
                        )}
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
