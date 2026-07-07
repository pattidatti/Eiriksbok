import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchLesson } from '../utils/contentLoader';

export interface LessonNavTarget {
    title: string;
    path: string;
    subjectId: string;
    topicId: string;
    subTopicId?: string;
    lessonId: string;
}

export interface LessonNav {
    prev: LessonNavTarget | null;
    next: LessonNavTarget | null;
}

interface LessonNavFooterProps {
    nav: LessonNav;
}

// Forrige/Neste-navigasjon nederst i artikler. Hover prefetcher leksjons-JSON
// via samme query-nøkkel som useLesson, så neste leksjon er lastet før klikket.
export const LessonNavFooter: React.FC<LessonNavFooterProps> = ({ nav }) => {
    const queryClient = useQueryClient();

    if (!nav.prev && !nav.next) return null;

    const prefetch = (t: LessonNavTarget) => {
        queryClient.prefetchQuery({
            queryKey: ['lesson', t.subjectId, t.topicId, t.subTopicId, t.lessonId],
            queryFn: () => fetchLesson(t.subjectId, t.topicId, t.lessonId, t.subTopicId),
            staleTime: 1000 * 60 * 5,
        });
    };

    return (
        <nav aria-label="Leksjonsnavigasjon" className="mt-12 pt-8 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nav.prev ? (
                    <Link
                        to={nav.prev.path}
                        onMouseEnter={() => prefetch(nav.prev!)}
                        className="focus-ring block no-underline group"
                    >
                        <motion.div
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Forrige
                            </div>
                            <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {nav.prev.title}
                            </div>
                        </motion.div>
                    </Link>
                ) : (
                    <div className="hidden sm:block" />
                )}

                {nav.next && (
                    <Link
                        to={nav.next.path}
                        onMouseEnter={() => prefetch(nav.next!)}
                        className="focus-ring block no-underline group"
                    >
                        <motion.div
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full bg-gradient-to-br from-indigo-50 to-white backdrop-blur-md border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow text-right"
                        >
                            <div className="flex items-center justify-end gap-2 text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">
                                Neste
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {nav.next.title}
                            </div>
                        </motion.div>
                    </Link>
                )}
            </div>
        </nav>
    );
};
