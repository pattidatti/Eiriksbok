import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useManifest } from '../hooks/useManifest';
import type { ManifestLesson } from '../types';
import { motion } from 'framer-motion';
import { motionPresets } from '../styles/motion-presets';

import { TopicView } from '../components/views/TopicView';
import { ExplorerView } from '../components/views/ExplorerView';
import { LayoutGrid, Search } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PageSkeleton } from '../components/Skeleton';

export const SubjectPage: React.FC = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const { data: manifest, isLoading } = useManifest();
    const [viewMode, setViewMode] = useState<'hierarchical' | 'explorer'>('hierarchical');

    const subjectData = manifest?.subjects.find((s) => s.id === subjectId);

    usePageTitle(subjectData?.title || 'Fag', !!subjectData);

    if (isLoading) return <PageSkeleton />;
    if (!subjectData) return <div className="p-8 text-center text-text-muted">Finner ikke faget...</div>;

    // Flatten lessons for timeline and explorer
    const allLessons: (ManifestLesson & { path: string; topicTitle: string; topicImage?: string })[] = [];
    subjectData.topics.forEach((topic) => {
        if (topic.subTopics) {
            topic.subTopics.forEach((subTopic) => {
                if (subTopic.lessons) {
                    subTopic.lessons.forEach((lesson) => {
                        allLessons.push({
                            ...lesson,
                            path: `/${subjectId}/${topic.id}/${subTopic.id}/${lesson.id}`,
                            topicTitle: subTopic.title,
                            topicImage: subTopic.image
                        });
                    });
                }
            });
        } else if (topic.lessons) {
            topic.lessons.forEach((lesson) => {
                allLessons.push({
                    ...lesson,
                    path: `/${subjectId}/${topic.id}/${lesson.id}`,
                    topicTitle: topic.title,
                    topicImage: topic.image
                });
            });
        }
    });

    // Sort lessons by date for timeline (default sort)
    allLessons.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return (
        <div className="subject-page max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <motion.h1
                    {...motionPresets.slideInLeft}
                    className="text-3xl font-display font-bold text-text-main"
                >
                    {subjectData.title}
                </motion.h1>

                <div className="bg-white border border-slate-200 p-1 rounded-lg flex gap-1 shadow-sm self-start md:self-auto overflow-x-auto max-w-full">
                    <button
                        onClick={() => setViewMode('hierarchical')}
                        className={`flex items-center px-4 py-2 rounded-md font-sans text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'hierarchical'
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Emneoversikt
                    </button>
                    <button
                        onClick={() => setViewMode('explorer')}
                        className={`flex items-center px-4 py-2 rounded-md font-sans text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'explorer'
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Alle artikler
                    </button>
                </div>
            </div>

            <div className="min-h-[500px]">

                {viewMode === 'hierarchical' && <TopicView subjectData={subjectData} subjectId={subjectId || ''} />}
                {viewMode === 'explorer' && <ExplorerView lessons={allLessons} />}
            </div>
        </div>
    );
};
