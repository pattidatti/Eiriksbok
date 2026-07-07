import { useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useManifest } from '../hooks/useManifest';
import { useLesson } from '../hooks/useLesson';
import type { ContentBlock, SidebarConfig, ManifestLesson } from '../types';
import { DemographyPage } from './DemographyPage';
import { GovernmentExplorer } from '../components/GovernmentExplorer';
import { HistoryLongLines } from '../components/HistoryLongLines';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { InteractiveArticle } from '../components/InteractiveArticle';
// Lazy load DetectiveEngine
const DetectiveEngine = lazy(() => import('../components/content/interactive/detective/DetectiveEngine').then(module => ({ default: module.DetectiveEngine })));
import { DetectiveSkeleton } from '../components/content/interactive/detective/DetectiveSkeleton';
import { LessonSkeleton } from '../components/skeletons/LessonSkeleton';
import type { DetectiveCase } from '../components/content/interactive/detective/types';
import { useUserHistory } from '../hooks/useUserHistory';
import { usePageTitle } from '../hooks/usePageTitle';
import { useGlobalTimeline } from '../hooks/useGlobalTimeline';
import { useAnalytics } from '../hooks/useAnalytics';
import { useReadingTime } from '../hooks/useReadingTime';
import { useArticleReadTracker } from '../features/progress/useArticleReadTracker';
import { useLayout } from '../context/LayoutContext';
import { LearningPathErrorState } from '../components/content/LearningPathErrorState';
import { LessonNotFoundError } from '../utils/contentLoader';
import { ArticleContent } from '../components/ArticleContent';


const getFirstTextContent = (blocks: ContentBlock[]): string | undefined => {
    const block = blocks.find((b): b is Extract<ContentBlock, { type: 'text' | 'paragraph' }> =>
        (b.type === 'text' || b.type === 'paragraph') && !!(b.content || b.text));
    return block?.content || block?.text;
};

export const LessonPage: React.FC<{ lessonIdOverride?: string }> = ({ lessonIdOverride }) => {
    const params = useParams<{ subjectId: string; topicId: string; subTopicId?: string; lessonId: string }>();
    const subjectId = params.subjectId || '';
    const topicId = params.topicId || '';

    // If override is provided, it means we are being rendered from TopicPage where subTopicId param is actually the lessonId
    const lessonId = lessonIdOverride || params.lessonId || '';
    const subTopicId = lessonIdOverride ? undefined : params.subTopicId;

    const { data: manifest } = useManifest();
    const { data: lesson, isLoading: lessonLoading, isError, error, refetch, isFetching } = useLesson(subjectId, topicId, lessonId, subTopicId);

    const { addToHistory } = useUserHistory();
    const { setFullWidth, setHideHeader, setHideBreadcrumbs } = useLayout();

    const pageTitle = useMemo(() => {
        if (!lesson) return 'Leksjon';
        // Check for learning path type
        if (lesson.layout === 'learning-path' || lesson.category === 'Læringssti' || lesson.learningPathData) {
            // Avoid double prefix if it's already there
            if (lesson.title.startsWith('Læringssti:')) return lesson.title;
            return `Læringssti: ${lesson.title}`;
        }
        return lesson.title;
    }, [lesson]);

    usePageTitle(pageTitle, !!lesson);

    // Global Timeline Hook
    const { events: globalTimelineEvents } = useGlobalTimeline();

    // Analytics: Track view
    const analyticsPath = `${subjectId}/${topicId}${subTopicId ? `/${subTopicId}` : ''}/${lessonId}`;
    useAnalytics(lessonId ? analyticsPath : undefined);
    useReadingTime();

    // «Min læring»: artikkel regnes som lest etter åpnet + minimumstid.
    // Stier, verktøy og detektivsaker spores av sine egne fullføringspunkter.
    const isTrackableArticle =
        !!lesson &&
        lesson.layout !== 'tool' &&
        lesson.layout !== 'learning-path' &&
        lesson.layout !== 'learning-path-v2' &&
        !lesson.engine &&
        !lesson.learningPathData;
    useArticleReadTracker({
        enabled: isTrackableArticle,
        path: analyticsPath,
        subjectId,
        topicId,
        title: lesson?.title,
        readTime: lesson?.readTime,
    });

    useEffect(() => {
        if (lesson) {
            window.scrollTo(0, 0);
            addToHistory({
                id: lesson.id,
                title: lesson.title,
                subjectId: (lesson.subject || subjectId).toLowerCase(),
                type: 'lesson'
            });
        }
    }, [lesson, subjectId, addToHistory]);

    // Optimized: Derive lessonImage directly without effect
    const lessonImage = useMemo(() => {
        if (!manifest || !subjectId || !topicId || !lessonId) return undefined;

        const subject = manifest.subjects.find(s => s.id === subjectId);
        const topic = subject?.topics.find(t => t.id === topicId);
        let foundLesson: ManifestLesson | undefined;
        let topicImg = topic?.image;

        if (subTopicId && topic?.subTopics) {
            const subTopic = topic.subTopics.find(st => st.id === subTopicId);
            foundLesson = subTopic?.lessons.find((l: any) => l.id === lessonId);
            topicImg = subTopic?.image || topicImg;
        } else if (topic?.lessons) {
            foundLesson = topic.lessons.find((l: any) => l.id === lessonId);
        }

        if (foundLesson?.image) return foundLesson.image;
        if (topicImg) return topicImg;
        return undefined;
    }, [manifest, subjectId, topicId, subTopicId, lessonId]);

    // Handle Layout Context
    useEffect(() => {
        const isSpecialLayout = lesson && (
            lesson.layout === 'tool' ||
            lesson.engine === 'historical-detective'
        );

        if (isSpecialLayout) {
            setFullWidth(true);
            setHideHeader(true);
            setHideBreadcrumbs(true);
        } else {
            setFullWidth(false);
            setHideHeader(false);
            setHideBreadcrumbs(false);
        }

        return () => {
            setFullWidth(false);
            setHideHeader(false);
            setHideBreadcrumbs(false);
        };
    }, [lesson?.layout, lesson?.engine, setFullWidth, setHideHeader, setHideBreadcrumbs]);

    // --- Hooks & Memoization (Rule of Hooks: Must be top-level and unconditional) ---
    const isHistory = subjectId === 'historie';

    // Memoize Sidebar Configuration
    const sidebarConfig = useMemo((): SidebarConfig => ({
        showTimeline: isHistory,
        showRelated: true,
        showConcepts: true,
        showTools: true
    }), [isHistory]);

    // Construct fallback URL for ArticleContent
    const fallbackUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/content/${subjectId}/${topicId}${subTopicId ? `/${subTopicId}` : ''}/${lessonId}.json`;

    // Gather relevant learning paths from the manifest
    const relevantLearningPaths = useMemo(() => {
        const subject = manifest?.subjects.find(s => s.id === subjectId);
        const topic = subject?.topics.find(t => t.id === topicId);
        const subTopic = topic?.subTopics?.find(st => st.id === subTopicId);

        const allTopicTools = [
            ...(topic?.tools || []),
            ...(subTopic?.tools || [])
        ];

        return allTopicTools
            .filter(t => t.id.includes('sti') || t.title.toLowerCase().includes('læringssti'))
            .map(t => ({
                id: t.id,
                title: t.title,
                url: t.link
            }));
    }, [manifest, subjectId, topicId, subTopicId]);

    // Construct articleData with memoization
    const articleData = useMemo(() => {
        if (!lesson) return null;

        return {
            id: lesson.id,
            year: lesson.year || '',
            title: lesson.title || lesson.learningPathData?.title || 'Læringssti',
            description: lesson.title
                ? (getFirstTextContent(lesson.content || [])?.substring(0, 150) + '...' || '')
                : (lesson.learningPathData?.description || ''),
            content: lesson.content || [],
            details: lesson.keyPoints || lesson.details || lesson.concepts?.map((c: any) => `${c.title || c.term}: ${c.description || c.definition}`) || [],
            category: lesson.category || lesson.topic,
            readTime: lesson.readTime || '5 min lesning',
            heroImage: lesson.heroImage || lessonImage,
            url: lesson.externalUrl,
            layout: lesson.layout,
            fact: lesson.fact,
            mapData: lesson.mapData,
            tags: lesson.tags,
            subjectId: subjectId,
            topicId: topicId,
            learningPaths: relevantLearningPaths,
            learningPathData: lesson.learningPathData,
            learningPathV2Data: lesson.learningPathV2Data,
            lessonPlan: lesson.lessonPlan
        };
    }, [lesson, lessonImage, subjectId, topicId, relevantLearningPaths]);


    // --- Loading & Error States (After all hooks) ---

    // Show loading if:
    // 1. Initial lesson query is loading
    // 2. We have no lesson data yet but are still fetching (initial mounting phase)
    // 3. We have a lesson layout that REQUIRES learningPathData, but it's missing while fetching
    const isIncompletePathData =
        (lesson?.layout === 'learning-path' && (!lesson?.learningPathData || !lesson.learningPathData.steps)) ||
        (lesson?.layout === 'learning-path-v2' && (!lesson?.learningPathV2Data || !lesson.learningPathV2Data.steps));
    const loading = lessonLoading || (!lesson && isFetching) || (isIncompletePathData && isFetching);

    if (loading) return <LessonSkeleton />;

    if (isError) {
        if (error instanceof LessonNotFoundError) {
            return <LearningPathErrorState type="not-found" />;
        }
        return <LearningPathErrorState type="network" error={error as Error} onRetry={() => refetch()} />;
    }

    // Data Validation Guard - only show error if NOT fetching AND data is incomplete
    if (lesson && lesson.layout === 'learning-path' && !lesson.learningPathData && !isFetching) {
        return <LearningPathErrorState type="data" onRetry={() => refetch()} />;
    }
    if (lesson && lesson.layout === 'learning-path-v2' && !lesson.learningPathV2Data && !isFetching) {
        return <LearningPathErrorState type="data" onRetry={() => refetch()} />;
    }

    // Ingen data, ingen feil, ingen lasting - vis feilside i stedet for evig skeleton
    if (!lesson || !articleData) {
        return <LearningPathErrorState type="not-found" />;
    }

    // --- Conditional Rendering & Layout Logic ---

    // Special handling for Demography module
    if (topicId === 'demografi-okonomi' && lessonId === 'intro') {
        return <DemographyPage />;
    }

    if (topicId === 'styringsformer' && lessonId === 'utforsk' && lesson) {
        return <GovernmentExplorer lesson={lesson} />;
    }

    // Logic for specific layouts
    if (lesson.layout === 'tool') {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <ArticleContent
                        content={lesson.content || []}
                        concepts={lesson.concepts}
                        isTool={true}
                        fallbackUrl={fallbackUrl}
                    />
                </div>
            </div>
        );
    }

    // Check if this is a timeline event (regardless of subtopic)
    const timelineEvent = lessonId ? globalTimelineEvents.find(e =>
        e.title?.toLowerCase().replace(/\s+/g, '-') === lessonId.toLowerCase() ||
        e.title?.toLowerCase() === lessonId.toLowerCase() ||
        e.id.toString() === lessonId
    ) : null;

    // Standardize all lessons to use InteractiveArticle (Rich Layout)
    if (lesson) {
        if (lesson.engine === 'historical-detective') {
            return (
                <ErrorBoundary>
                    <div className="h-[calc(100vh-64px)] overflow-hidden">
                        <Suspense fallback={<DetectiveSkeleton />}>
                            <DetectiveEngine data={lesson as unknown as DetectiveCase} />
                        </Suspense>
                    </div>
                </ErrorBoundary>
            );
        }

        if (!articleData) return null;

        return (
            <ErrorBoundary>
                <InteractiveArticle
                    key={`${lesson.id}-${lesson.layout}-${lesson.learningPathData ? 'lp' : 'std'}`}
                    event={articleData}
                    fallbackUrl={fallbackUrl}
                    sidebarConfig={sidebarConfig}
                />
            </ErrorBoundary>
        );
    }

    if (timelineEvent && timelineEvent.type !== 'lesson') {
        return (
            <ErrorBoundary>
                <InteractiveArticle
                    event={{
                        ...timelineEvent,
                        year: timelineEvent.year || timelineEvent.displayDate || '',
                        content: timelineEvent.content || [],
                        details: timelineEvent.details || [],
                        category: timelineEvent.category || 'Historie',
                        readTime: timelineEvent.readTime || '3 min',
                    } as any}
                    fallbackUrl={fallbackUrl}
                    sidebarConfig={sidebarConfig}
                />
            </ErrorBoundary>
        );
    }

    if (subTopicId === 'lange-linjer') {
        return (
            <ErrorBoundary>
                <HistoryLongLines />
            </ErrorBoundary>
        );
    }

    if (!lesson) return <div className="p-8 text-center">Fant ikke leksjonen.</div>;

    return null;
};
