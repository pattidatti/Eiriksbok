import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ManifestLesson } from '../types';
import { Clock } from 'lucide-react';
import { Image as LazyImage } from './Image';
import { usePrefetchLesson } from '../hooks/usePrefetchLesson';

interface LessonCardProps {
    lesson: ManifestLesson;
    path: string;
    topicTitle: string;
    topicImage?: string;
}

export const LessonCard = React.memo<LessonCardProps & { badgeText?: string }>(({ lesson, path, topicTitle, topicImage, badgeText }) => {
    const displayImage = lesson.image || topicImage;
    const prefetchHandlers = usePrefetchLesson(path);

    return (
        <Link to={path} className="block group no-underline h-full" {...prefetchHandlers}>
            <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full bg-surface-card border border-white/5 hover:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col"
            >
                {/* Image Area */}
                <div className="h-32 relative overflow-hidden">
                    <LazyImage
                        src={displayImage}
                        alt={lesson.title}
                        seed={lesson.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {badgeText && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
                            {badgeText}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-grow">
                    <div className="text-[10px] font-medium text-blue-400 mb-1 uppercase tracking-wide">
                        {topicTitle}
                    </div>

                    {/* To linjer er reservert: titler med tema-prefiks ("Bønn: Å snakke med
                        det hellige") får plass, og alle kort i samme rad flukter. */}
                    <h3
                        title={lesson.title}
                        className="text-base font-bold text-text-main mb-1 leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-blue-400 transition-colors"
                    >
                        {lesson.title}
                    </h3>

                    {lesson.description && (
                        <div className="flex-grow mb-2">
                            <p className="text-xs text-text-muted line-clamp-2">
                                {lesson.description}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <div className="flex items-center text-[10px] text-text-muted">
                            {lesson.date && (
                                <span className="flex items-center mr-3">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {lesson.date}
                                </span>
                            )}
                        </div>

                        {lesson.tags && lesson.tags.length > 0 && (
                            <div className="flex gap-1">
                                {lesson.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-text-muted rounded text-[10px]">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
});
