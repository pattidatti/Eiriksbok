import React from 'react';
import { motion } from 'framer-motion';
import { motionPresets } from '../../styles/motion-presets';
import { Link } from 'react-router-dom';
import { toolIcon } from '../../utils/toolIcon';
import { TopicCard } from '../TopicCard';
import { getTopicLink } from '../../utils/navigationUtils';
import type { ManifestSubject } from '../../types';

interface TopicViewProps {
    subjectData: ManifestSubject;
    subjectId: string;
}

export const TopicView: React.FC<TopicViewProps> = ({ subjectData, subjectId }) => {

    return (
        <div className="space-y-6">
            {/* Tools Section - Pill ribbon */}
            {subjectData.tools && subjectData.tools.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {subjectData.tools.map((tool) => {
                        const Icon = toolIcon(tool.icon);
                        return (
                            <Link
                                key={tool.id}
                                to={tool.link}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 whitespace-nowrap hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all shrink-0"
                                title={tool.description}
                            >
                                <Icon size={16} className="text-indigo-600" />
                                {tool.title}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Topics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {subjectData.topics.map((topic, index: number) => {
                    // Calculate total lessons
                    let lessonCount = 0;
                    if (topic.subTopics) {
                        topic.subTopics.forEach((st) => lessonCount += st.lessons?.length || 0);
                    } else if (topic.lessons) {
                        lessonCount = topic.lessons.length;
                    }
                    return (
                        <motion.div
                            key={topic.id}
                            {...motionPresets.slideUp}
                            transition={{ delay: index * 0.05 }}
                            className="h-full"
                        >

                            <TopicCard
                                title={topic.title}
                                description={topic.description}
                                image={topic.image}
                                path={subjectId ? getTopicLink(subjectId, topic) : '#'}
                                lessonCount={lessonCount}
                            />
                        </motion.div>
                    );
                })}
            </div>
            {subjectData.topics.length === 0 && (
                <p className="text-slate-500 text-center py-12">Ingen emner lagt til enda.</p>
            )}
        </div>
    );
};
