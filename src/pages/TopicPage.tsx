import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useManifest } from '../hooks/useManifest';

import { motion } from 'framer-motion';
import { motionPresets } from '../styles/motion-presets';
import { LessonCard } from '../components/LessonCard';
import { TopicCard } from '../components/TopicCard';
import { ChevronRight, Grid, List, Map, Download } from 'lucide-react';
import { HistoryLongLines } from '../components/HistoryLongLines';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TopicInteractiveModel } from '../components/TopicInteractiveModel';
import { TopicContentRenderer } from '../components/content/TopicContentRenderer';
import { useUserHistory } from '../hooks/useUserHistory';
import { usePageTitle } from '../hooks/usePageTitle';
import { PageSkeleton } from '../components/Skeleton';
import { useAnalytics } from '../hooks/useAnalytics';
import { TopicPrintView } from '../components/TopicPrintView';

type ViewMode = 'grid' | 'list';
type SortMode = 'alphabetical' | 'year' | 'newest';

export const TopicPage: React.FC = () => {
    const { subjectId, topicId, subTopicId } = useParams<{ subjectId: string; topicId: string; subTopicId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { data: manifest, isLoading } = useManifest();
    const { addToHistory } = useUserHistory();

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
    const [showPrint, setShowPrint] = useState(false);

    const subjectData = manifest?.subjects.find((s) => s.id === subjectId);
    const currentTopic = subjectData?.topics.find((t) => t.id === topicId);
    const currentSubTopic = currentTopic?.subTopics?.find((st) => st.id === subTopicId);

    const activeItem = currentSubTopic || currentTopic;

    // Sorting Logic - Moved up to avoid early return hook violation.
    // rawLessons hentes inne i memoen: som en variabel utenfor ble `|| []` en ny
    // tom liste hver render, og memoen regnet på nytt hver gang uansett.
    const sortedLessons = React.useMemo(() => {
        const rawLessons = activeItem?.lessons ?? [];
        return [...rawLessons].sort((a, b) => {
            if (sortMode === 'alphabetical') return a.title.localeCompare(b.title);
            if (sortMode === 'year') {
                const dateA = a.date || '9999';
                const dateB = b.date || '9999';
                return dateA.localeCompare(dateB);
            }
            if (sortMode === 'newest') {
                // Assuming date field represents published/added date
                const dateA = a.date || '0000';
                const dateB = b.date || '0000';
                return dateB.localeCompare(dateA);
            }
            return 0;
        });
    }, [activeItem, sortMode]);

    // Filter by tag if present in query params - Moved up
    const queryParams = new URLSearchParams(location.search);
    const tagFilter = queryParams.get('tag');

    const filteredLessons = React.useMemo(() => {
        return tagFilter
            ? sortedLessons.filter((l) => l.tags?.includes(tagFilter))
            : sortedLessons;
    }, [sortedLessons, tagFilter]);

    usePageTitle(currentSubTopic?.title || currentTopic?.title || 'Emne', !!currentTopic);

    useEffect(() => {
        if (currentTopic && !subTopicId && subjectId) {
            addToHistory({
                id: currentTopic.id,
                title: currentTopic.title,
                subjectId: subjectId,
                type: 'topic'
            });
        }
    }, [currentTopic, subTopicId, subjectId]);

    // Analytics: Track topic view
    const analyticsPath = `${subjectId}/${topicId}${subTopicId ? `/${subTopicId}` : ''}`;
    useAnalytics(topicId ? analyticsPath : undefined);

    if (isLoading) return <PageSkeleton />;
    if (!subjectData || !currentTopic) return <div className="p-8 text-center text-text-muted">Laster emne...</div>;

    if (subTopicId === 'lange-linjer') {
        return <ErrorBoundary><HistoryLongLines /></ErrorBoundary>;
    }


    console.log('TopicPage Debug Stringified:', JSON.stringify({
        topicId,
        hasTools: !!activeItem?.tools,
        toolsLength: activeItem?.tools?.length,
        tools: activeItem?.tools
    }, null, 2));

    // Safe to assume activeItem exists here due to earlier checks
    const subTopics = !currentSubTopic && currentTopic.subTopics ? currentTopic.subTopics : [];
    const title = activeItem!.title;
    const description = activeItem?.description;
    const image = activeItem?.image;

    return (
        <div className="topic-page max-w-7xl mx-auto px-4 py-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <motion.div
                    {...motionPresets.slideUp}
                >
                    <h1 className="text-2xl font-display font-bold text-text-main mb-1">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-base text-text-muted max-w-3xl leading-relaxed">
                            {description}
                        </p>
                    )}
                </motion.div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    {activeItem?.lessons && activeItem.lessons.length > 0 && (
                        <button
                            onClick={() => setShowPrint(true)}
                            className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-white/10 transition"
                            title="Last ned emne som PDF"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex gap-0.5 bg-surface-card rounded-lg p-0.5 border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-neon-accent/20 text-neon-accent' : 'text-text-muted hover:text-text-main'}`}
                            title="Rutenett"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-neon-accent/20 text-neon-accent' : 'text-text-muted hover:text-text-main'}`}
                            title="Liste"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="text-sm bg-surface-card border border-white/10 rounded-lg px-2 py-1.5 text-text-main cursor-pointer"
                    >
                        <option value="alphabetical">A-Å</option>
                        <option value="year">Kronologisk</option>
                        <option value="newest">Nyeste</option>
                    </select>
                </div>
            </div>

            {showPrint && activeItem?.lessons && (
                <TopicPrintView
                    subjectId={subjectId!}
                    topicId={activeItem.id}
                    lessons={activeItem.lessons}
                    onClose={() => setShowPrint(false)}
                />
            )}

            {/* Tools Section - Pill ribbon */}
            {activeItem!.tools && activeItem!.tools.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
                    {activeItem!.tools.map((tool) => (
                        <Link
                            key={tool.id}
                            to={tool.link}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card border border-white/10 rounded-full text-sm font-medium whitespace-nowrap hover:bg-neon-accent/10 hover:text-neon-accent transition-all shrink-0"
                            title={tool.description}
                        >
                            <Map className="w-4 h-4 text-neon-accent" />
                            {tool.title}
                        </Link>
                    ))}
                </div>
            )}

            {/* Main Content Renderer */}
            {activeItem?.content && (
                <div className="mb-16">
                    <TopicContentRenderer content={activeItem.content} />
                </div>
            )}

            {/* Interactive Model Section */}
            {currentTopic && subjectId && (
                <TopicInteractiveModel topicId={currentTopic.id} subjectId={subjectId} />
            )}

            {subTopics.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-display font-bold text-text-main mb-4">Emner</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {subTopics.map((subTopic, index: number) => (
                            <motion.div
                                key={subTopic.id}
                                {...motionPresets.slideUp}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <TopicCard
                                    title={subTopic.title}
                                    description={subTopic.description}
                                    image={subTopic.image}
                                    path={`/${subjectId}/${topicId}/${subTopic.id}`}
                                    lessonCount={subTopic.lessons?.length || 0}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {tagFilter && (
                <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-indigo-900 font-medium mr-2">Viser resultater for emneknagg:</span>
                        <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-bold rounded-lg">#{tagFilter}</span>
                    </div>
                    <button
                        onClick={() => navigate(location.pathname)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                        Fjern filter
                    </button>
                </div>
            )}

            {filteredLessons.length > 0 && (
                <div>
                    {subTopics.length > 0 && <h2 className="text-lg font-display font-bold text-text-main mb-4">Leksjoner</h2>}
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                        {filteredLessons.map((lesson, index) => (
                            <motion.div
                                key={lesson.id}
                                {...motionPresets.slideUp}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                {viewMode === 'grid' ? (
                                    <LessonCard
                                        lesson={lesson}
                                        path={`/${subjectId}/${topicId}${currentSubTopic ? `/${currentSubTopic.id}` : ''}/${lesson.id}`}
                                        topicTitle={title}
                                        topicImage={image}
                                    />
                                ) : (
                                    <Link
                                        to={`/${subjectId}/${topicId}${currentSubTopic ? `/${currentSubTopic.id}` : ''}/${lesson.id}`}
                                        className="block bg-surface-card hover:bg-surface-card-hover border border-white/10 rounded-lg p-4 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-text-main group-hover:text-neon-accent transition-colors mb-1">{lesson.title}</h3>
                                                {lesson.description && <p className="text-text-muted">{lesson.description}</p>}
                                                {lesson.tags && (
                                                    <div className="flex gap-2 mt-2">
                                                        {lesson.tags.map(tag => (
                                                            <span key={tag} className="text-xs px-2 py-1 bg-white/5 rounded-full text-text-muted">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight className="text-text-muted group-hover:text-neon-accent transition-colors" />
                                        </div>
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {subTopics.length === 0 && filteredLessons.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-text-muted italic">Ingen leksjoner funnet i dette emnet.</p>
                </div>
            )}
        </div>
    );
};
