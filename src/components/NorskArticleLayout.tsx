import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { ArticleContent } from './ArticleContent';
import type { ContentBlock } from '../types';

interface NorskArticleLayoutProps {
    article: {
        title: string;
        description?: string;
        heroImage?: string;
        content: ContentBlock[];
        tags?: string[];
        relatedLink?: { text: string; url: string; };
    };
    relatedLessons?: { title: string; url: string }[];
    onClose: () => void;
}

export const NorskArticleLayout: React.FC<NorskArticleLayoutProps> = ({ article, relatedLessons, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
        >
            {/* ... navigation ... */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <BookOpen size={20} className="text-indigo-600" />
                    <span className="font-medium text-sm uppercase tracking-wider">Norskfaget</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* ... header ... */}
                <header className="mb-12 text-center">
                    {article.tags && (
                        <div className="flex justify-center gap-2 mb-6">
                            {article.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight">
                        {article.title}
                    </h1>
                    {article.description && (
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-serif italic leading-relaxed">
                            {article.description}
                        </p>
                    )}
                </header>

                {/* Hero Image */}
                {article.heroImage && (
                    <div className="mb-16 rounded-xl overflow-hidden shadow-2xl aspect-video relative">
                        <ImageWithFallback
                            src={article.heroImage}
                            alt={article.title}
                            seed={article.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                )}

                {/* Related Link Button */}
                {article.relatedLink && (
                    <div className="flex justify-center -mt-8 mb-16 relative z-10">
                        <Link
                            to={article.relatedLink.url}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                        >
                            <BookOpen size={20} />
                            {article.relatedLink.text}
                        </Link>
                    </div>
                )}

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Text */}
                    <div className="lg:col-span-8 font-serif text-lg leading-loose text-slate-800">
                        <ArticleContent content={article.content} />
                    </div>

                    {/* Sidebar / Metadata */}
                    <aside className="lg:col-span-4 space-y-8">

                        {/* Related Lessons Sidebar */}
                        {relatedLessons && relatedLessons.length > 0 && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 sticky top-24">
                                <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">
                                    Andre emner
                                </h3>
                                <ul className="space-y-3">
                                    {relatedLessons.map(lesson => (
                                        <li key={lesson.url}>
                                            <Link
                                                to={lesson.url}
                                                className="block p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600"
                                            >
                                                {lesson.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">
                                Om sjangeren
                            </h3>
                            <div className="prose prose-sm prose-slate">
                                <p>
                                    Dette er en tekst innenfor sjangeren <strong>{article.title}</strong>.
                                    Legg merke til hvordan teksten er bygget opp og hvilke virkemidler som brukes.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </motion.div>
    );
};
