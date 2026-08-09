import React from 'react';
import { motion } from 'framer-motion';
import { motionPresets } from '../../styles/motion-presets';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { TopicCard } from '../TopicCard';
import { getTopicLink } from '../../utils/navigationUtils';
import type { ManifestSubject } from '../../types';

interface TopicViewProps {
    subjectData: ManifestSubject;
    subjectId: string;
}

export const TopicView: React.FC<TopicViewProps> = ({ subjectData, subjectId }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Tools Section - Pill ribbon */}
            {subjectData.tools && subjectData.tools.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {subjectData.tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.link)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card border border-white/10 rounded-full text-sm font-medium whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 transition-all shrink-0 cursor-pointer"
                            title={tool.description}
                        >
                            <LayoutGrid size={16} className="text-indigo-600" />
                            {tool.title}
                        </button>
                    ))}
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
                    // Add tools to count
                    if (topic.tools) {
                        lessonCount += topic.tools.length;
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
                <p className="text-text-muted text-center py-12">Ingen emner lagt til enda.</p>
            )}
        </div>
    );
};
