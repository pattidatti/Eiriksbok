import React from 'react';
import { Link } from 'react-router-dom';
import { PrefetchLink } from '../components/PrefetchLink';
import { motion } from 'framer-motion';
import { motionPresets } from '../styles/motion-presets';
import { LessonCard } from '../components/LessonCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useManifestData } from '../hooks/useManifestData';
import { PageSkeleton } from '../components/Skeleton';
import { getSubjectUrl, getLessonUrl, ROUTES } from '../utils/routes';
import { HomeLearningModule } from '../features/progress/components/HomeLearningModule';

export const LandingPage: React.FC = () => {
    const { manifest, recentLessons, isLoading } = useManifestData();
    usePageTitle('Eiriks lærebok', true);

    if (isLoading || !manifest) return <PageSkeleton />;

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
                <motion.div
                    {...motionPresets.slideUp}
                    className="mb-8"
                >
                    <div className="flex flex-col gap-1">
                        {manifest.subjects.map((subject: any) => (
                            <motion.div
                                key={subject.id}
                                className="mb-8"
                            >
                                <PrefetchLink
                                    to={getSubjectUrl(subject.id)}
                                    prefetchTarget="SubjectPage"
                                    className="group block"
                                >
                                    <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-bold text-text-main hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform origin-left hover:scale-105 break-words tracking-tight leading-none">
                                        {subject.title}
                                    </h2>
                                </PrefetchLink>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Min læring: streak, mål og neste steg fra anbefalingsmotoren.
                    «Dagens økt» dukker opp her som anbefaling når noe er forfalt -
                    derfor trenger den ikke et eget kort over. */}
                <HomeLearningModule />

                {recentLessons.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-text-main">
                                Nytt innhold
                            </h3>
                            <Link to={ROUTES.SEARCH} className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                                Se alle
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recentLessons.map((lesson, index) => (
                                <motion.div
                                    key={lesson.id}
                                    className="h-full"
                                    {...motionPresets.slideUp}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <LessonCard
                                        lesson={lesson}
                                        path={getLessonUrl(lesson.subjectId, lesson.topicId, lesson.id, lesson.subTopicId)}
                                        topicTitle={lesson.topicTitle}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
