import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { useReviewStore } from '../../stores/useReviewStore';
import { todayLocal } from '../../utils/reviewScheduler';

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
                    className="group flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-6 py-4 shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-display font-bold text-white">Dagens økt venter</p>
                            <p className="text-sm text-indigo-100">
                                {dueCount > 0
                                    ? `${dueCount} ting er klare for repetisjon - ca. 5 minutter`
                                    : 'En rask økt holder kunnskapen fersk - ca. 5 minutter'}
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto mb-8">
            <Link
                to="/oving/dagens-okt"
                className="group relative block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transition-shadow overflow-hidden"
            >
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-display font-bold text-white mb-1">
                            Dagens økt
                        </h2>
                        <p className="text-indigo-100">
                            {doneToday
                                ? 'Dagens økt er gjort - kom tilbake i morgen, eller ta en bonusrunde!'
                                : 'En rask repetisjonsøkt som husker hva du har lært - og hva du er i ferd med å glemme.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1 text-2xl font-display font-bold text-white">
                                <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-300' : 'text-white/40'}`} />
                                {streak}
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                                Streak
                            </p>
                        </div>
                        {dueCount > 0 && !doneToday && (
                            <div className="text-center bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
                                <div className="text-2xl font-display font-bold text-white">
                                    {dueCount}
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                                    Klare
                                </p>
                            </div>
                        )}
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
