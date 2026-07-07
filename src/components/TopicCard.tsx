import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface TopicCardProps {
    title: string;
    description?: string;
    image?: string;
    path: string;
    lessonCount: number;
}

export const TopicCard: React.FC<TopicCardProps> = ({ title, description, image, path, lessonCount }) => {
    return (
        <Link to={path} className="block group no-underline h-full">
            <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="h-full bg-surface-card border border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
                {/* Image Area - Updated to h-40 to match ExplorerView */}
                <div className="h-32 bg-slate-100 relative overflow-hidden">
                    <ImageWithFallback
                        src={image}
                        alt={title}
                        seed={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/5">
                        {lessonCount} leksjoner
                    </div>
                </div>

                {/* Content Area - Updated spacing/typography to match ExplorerView */}
                <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {title}
                    </h3>

                    {description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 flex-grow">
                            {description}
                        </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center text-indigo-600 font-medium text-[10px]">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Gå til emne
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};
