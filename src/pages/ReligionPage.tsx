import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReligion } from '../hooks/useReligion';
import { useManifest } from '../hooks/useManifest';
import { ReligionProfile } from '../components/religion/ReligionProfile';
import { LessonCard } from '../components/LessonCard';
import { PageSkeleton } from '../components/Skeleton';
import { List, Compass } from 'lucide-react';

export const ReligionPage: React.FC = () => {
    const { religionId } = useParams<{ religionId: string }>();
    const { data: religion, isLoading: religionLoading } = useReligion(religionId || '');
    const { data: manifest, isLoading: manifestLoading } = useManifest();
    const [searchParams] = useSearchParams();
    // ?dim=<nøkkel> er en dyplenke til én dimensjon - da åpnes profilen med
    // en gang, slik at læreren kan projisere den rett fra adressefeltet.
    const [viewMode, setViewMode] = useState<'lessons' | 'profil'>(
        searchParams.get('dim') ? 'profil' : 'lessons'
    );

    if (religionLoading || manifestLoading) return <PageSkeleton />;
    if (!religion) return <div className="p-12 text-center text-xl">Fant ikke religionen.</div>;

    // Find lessons for this religion from manifest
    // KRLE -> religion -> [religionId]
    const krleSubject = manifest?.subjects.find(s => s.id === 'krle');
    const religionTopic = krleSubject?.topics.find(t => t.id === 'religion');
    const religionSubTopic = religionTopic?.subTopics?.find(st => st.id === religionId);
    const lessons = religionSubTopic?.lessons || [];

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header - holdes lav så innholdet er over folden på 1366x768 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <Link to="/krle" className="text-sm text-slate-500 hover:text-indigo-500 mb-2 inline-block">
                    ← Tilbake til oversikt
                </Link>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
                    {religion.name}
                </h1>

                <div className="flex justify-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full inline-flex mx-auto max-w-full shadow-sm border border-slate-200">
                    <button
                        onClick={() => setViewMode('lessons')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${viewMode === 'lessons'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                    >
                        <List size={18} />
                        Leksjoner
                    </button>
                    <button
                        onClick={() => setViewMode('profil')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${viewMode === 'profil'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                    >
                        <Compass size={18} />
                        Religionsprofilen
                    </button>
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                key={viewMode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {viewMode === 'lessons' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessons.map((lesson, index) => (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <LessonCard
                                    lesson={lesson}
                                    path={`/krle/religion/${religionId}/${lesson.id}`}
                                    topicTitle={religion.name}
                                />
                            </motion.div>
                        ))}
                        {lessons.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-500 italic">Ingen leksjoner funnet.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'profil' && <ReligionProfile religion={religion} />}
            </motion.div>
        </div>
    );
};
