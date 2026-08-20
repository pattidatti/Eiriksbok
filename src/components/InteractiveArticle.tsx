import React, { useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Info,
    Volume2,
    PauseCircle,
    PlayCircle,
    ArrowLeft,
    BookOpen,
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArticleContent } from './ArticleContent';
import { RichSidebar } from './RichSidebar';
import { LearningPath } from './content/LearningPath';
import { LearningPathV2 } from './content/LearningPathV2';
import type { ContentBlock, LearningPathData, LearningPathV2Data, MapData, Concept, GlobalTimelineEvent } from '../types';
import { useTTS } from '../hooks/useTTS';
import { cleanForTTS } from '../utils/speechUtils';
import { useGlobalTimeline } from '../hooks/useGlobalTimeline';
import { parseYearRange } from '../utils/dateUtils';
import { ImageWithFallback } from './ImageWithFallback';
import { useRelatedContent } from '../hooks/useRelatedContent';
import { renderInlineMarkdown } from './markdownUtils';
import { LessonNavFooter } from './LessonNavFooter';
import { AudioPlayerBar } from './AudioPlayerBar';
import type { LessonNav } from './LessonNavFooter';
import type { SidebarConfig } from '../types';

// Generic Article Data Type
export type ArticleData = {
    id: string | number;
    year: string;
    title: string;
    description: string;
    layout?: 'standard' | 'rich' | 'tool' | 'learning-path' | 'learning-path-v2';
    content: ContentBlock[];
    details: string[];
    icon?: React.ReactNode;
    category: string;
    url?: string;
    readTime: string;
    heroImage?: string;
    lastUpdated?: string;
    factChecked?: string;

    fact?: string;
    mapData?: MapData;
    tags?: string[];
    concepts?: Concept[];
    topicId?: string;
    subjectId?: string;
    learningPathData?: LearningPathData;
    learningPathV2Data?: LearningPathV2Data;
    learningPaths?: { id: string; title: string; url: string }[];
    lessonPlan?: import('../types').LessonPlan;
};

interface InteractiveArticleProps {
    event: ArticleData;
    sidebarConfig?: SidebarConfig;
    lessonNav?: LessonNav;
    // Fagspesifikke krysslenker, vist rett over forrige/neste-navigasjonen
    footerSlot?: React.ReactNode;
}


// Helper Components
const FactBox: React.FC<{ content: string }> = React.memo(({ content }) => (
    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <h3 className="font-bold text-indigo-900 mb-2 flex items-center">
            <Info className="w-5 h-5 mr-2 text-indigo-600" />
            Visste du at?
        </h3>
        <p className="text-indigo-800 leading-relaxed">
            {content}
        </p>
    </div>
));



export const InteractiveArticle: React.FC<InteractiveArticleProps> = ({ event, sidebarConfig, lessonNav, footerSlot }) => {
    const navigate = useNavigate();
    const { events: globalEvents } = useGlobalTimeline();
    const { speak, pause, resume, cancel, playBlock, isPlaying, isPaused, hasVoice, activeBlockIndex, rate, setRate } = useTTS();

    // Calculate speech blocks and mapping
    const speechData = React.useMemo(() => {
        if (!event?.content) return { blocks: [], mapSpeechToContent: [], mapContentToSpeech: {} };

        const blocks: string[] = [];
        const mapSpeechToContent: number[] = [];
        const mapContentToSpeech: Record<number, number> = {};

        // Add title as first block
        blocks.push(event.title);
        mapSpeechToContent.push(-1); // -1 indicates title

        event.content.forEach((block, index) => {
            if (block.type === 'text' || block.type === 'paragraph') {
                const rawText = block.content || block.text || '';
                const cleanText = cleanForTTS(rawText);
                if (cleanText) {
                    blocks.push(cleanText);
                    const speechIndex = blocks.length - 1;
                    mapSpeechToContent.push(index);
                    mapContentToSpeech[index] = speechIndex;
                }
            }
        });

        return { blocks, mapSpeechToContent, mapContentToSpeech };
    }, [event]);

    // Stop speaking when leaving the component
    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    // Stabilize handlers with useCallback
    const handleListenClick = useCallback(() => {
        if (isPlaying) {
            if (isPaused) {
                resume();
            } else {
                pause();
            }
        } else {
            if (speechData.blocks.length > 0) {
                speak(speechData.blocks);
            }
        }
    }, [isPlaying, isPaused, resume, pause, speak, speechData.blocks]);

    const handleBlockClick = useCallback((contentIndex: number) => {
        const speechIndex = speechData.mapContentToSpeech[contentIndex];
        if (speechIndex === undefined) return;

        // Nytt trykk på avsnittet som leses akkurat nå = pause/fortsett.
        // Et trykk startet opplesningen, så det samme trykket bør kunne stanse den.
        if (isPlaying && speechIndex === activeBlockIndex) {
            if (isPaused) resume();
            else pause();
            return;
        }

        if (isPlaying) {
            playBlock(speechIndex);
        } else {
            speak(speechData.blocks, speechIndex);
        }
    }, [speechData.mapContentToSpeech, speechData.blocks, playBlock, speak, isPlaying, isPaused, activeBlockIndex, pause, resume]);

    // Memoize sidebar props to prevent re-renders in RichSidebar
    const audioState = useMemo(() => ({
        isPlaying,
        isPaused,
        hasVoice,
        onToggle: handleListenClick,
        onStop: cancel,
        rate,
        setRate,
    }), [isPlaying, isPaused, hasVoice, handleListenClick, cancel, rate, setRate]);

    const metadata = useMemo(() => ({
        year: event.year,
        readTime: event.readTime,
        category: event.category,
        lastUpdated: event.lastUpdated,
        factChecked: event.factChecked
    }), [event.year, event.readTime, event.category, event.lastUpdated, event.factChecked]);

    // Determine active content block for highlighting
    const activeContentIndex = activeBlockIndex !== -1 ? speechData.mapSpeechToContent[activeBlockIndex] : undefined;

    // Smart Context Logic for Timeline
    const combinedTimeline = React.useMemo(() => {
        const currentRange = parseYearRange(event.year);
        // If we can't parse a start year, return empty
        if (!currentRange.start) return [];

        const duration = currentRange.end - currentRange.start;
        // Dynamic buffer: 20% of duration, min 5 years, max 100 years
        // Example: 1929-1933 (4y) -> buffer 5y
        // Example: 800-1050 (250y) -> buffer 50y
        const buffer = Math.max(5, Math.min(100, Math.ceil(duration * 0.2)));

        const contextStart = currentRange.start - buffer;
        const contextEnd = currentRange.end + buffer;

        // Helper to judge relevance
        const getScore = (e: GlobalTimelineEvent) => {
            let score = 0;
            const eStart = e.startDate;
            const eEnd = e.endDate || e.startDate;

            // 1. Strict Overlap (+100)
            // Event must overlap with the core article range
            if (eStart <= currentRange.end && eEnd >= currentRange.start) {
                score += 100;
            }

            // 2. Topic Match (+50)
            if (e.topicId && event.topicId && e.topicId === event.topicId) {
                score += 50;
            }

            // 3. Subject Match (+20)
            if (e.subjectId && event.subjectId && e.subjectId === event.subjectId) {
                score += 20;
            }

            // 4. Distance Penalty (-0.5 per year from center)
            const eventCenter = (currentRange.start + currentRange.end) / 2;
            const eCenter = (eStart + eEnd) / 2;
            const distance = Math.abs(eventCenter - eCenter);
            score -= (distance * 0.5);

            return score;
        };

        const scoredEvents = globalEvents
            .filter(e => e.id?.toString() !== event.id?.toString())
            .map(e => ({ ...e, score: getScore(e) }))
            .filter(e => {
                const eStart = e.startDate;
                const eEnd = e.endDate || e.startDate;
                // Hard filter: Must physically fall within the buffered window
                return (eStart <= contextEnd && eEnd >= contextStart);
            });

        // Sort: High score first, then chronological
        scoredEvents.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.startDate - b.startDate;
        });

        // Density Control: Max 20 items
        const topEvents = scoredEvents.slice(0, 20);

        // Final Sort: Chronological for display
        return topEvents.sort((a, b) => a.startDate - b.startDate).map(e => ({
            year: e.displayDate || e.year || '',
            startDate: e.startDate,
            title: e.title,
            description: e.description || '',
            link: e.link
        }));
    }, [event, globalEvents]);

    // Find related articles using the shared hook
    // We use the event's subjectId and topicId if available, otherwise defaults or empty strings
    // Note: The hook handles empty strings gracefully by returning empty array
    // Find related articles using the shared hook
    // We use the event's subjectId and topicId if available, otherwise defaults or empty strings
    // Note: The hook handles empty strings gracefully by returning empty array
    const relatedArticlesResult = useRelatedContent(
        event.subjectId || '',
        event.topicId || '',
        event.id?.toString() || '',
        event.tags || []
    );

    const relatedArticles = useMemo(() => relatedArticlesResult.slice(0, 5), [relatedArticlesResult]);

    // Diagnostic logging
    console.log(`[InteractiveArticle] Rendering: title="${event.title}", layout="${event.layout}", hasContent=${!!event.content}, hasLPData=${!!event.learningPathData}, LPSteps=${event.learningPathData?.steps?.length}`);

    if (event.layout === 'learning-path' && !event.learningPathData) {
        console.warn(`[InteractiveArticle] WARNING: layout is learning-path but learningPathData is MISSING`);
    }

    return (
        <div className="min-h-screen pb-20 relative z-20" data-article-rendering="true">
            {/* Progress Bar */}
            <motion.div
                className="fixed top-16 left-0 h-1 bg-indigo-600 z-50"
                initial={{ width: "0%", opacity: 1 }}
                animate={{ width: "100%", opacity: 0 }}
                transition={{
                    width: { duration: 1.5, ease: "easeInOut" },
                    opacity: { duration: 0.3, delay: 1.5, ease: "easeIn" }
                }}
            />

            {/* Navigation Bar */}
            {/* Knappen ligger i normal flyt øverst (over meta-raden) så den ikke
                overlapper tittelen. Først fra xl er skjermen bred nok til at det er
                margin utenfor innholdsspalten (max-w-5xl) å flyte i - under det la
                den seg oppå overskriften, f.eks. på Galaxy Fold utbrettet (~950px). */}
            <div className="relative top-0 xl:fixed xl:top-32 left-0 w-full p-4 flex justify-between items-center z-40 pointer-events-none">
                <div className="pointer-events-auto flex gap-2">

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-slate-900 font-bold hover:bg-white transition-all shadow-sm hover:shadow-md group border border-slate-200/50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Tilbake
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <div className="pt-4 pb-4 md:pt-8 md:pb-6 px-0 sm:px-4 md:px-6 max-w-5xl mx-auto text-center">
                <div>
                    {/* Mobile-Only Meta Row */}
                    <div className="md:hidden flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-slate-500 mb-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md uppercase tracking-wide">
                            {event.category}
                        </span>
                        <span>•</span>
                        <span>{event.year}</span>
                        <span>•</span>
                        <span>{event.readTime}</span>
                        {hasVoice && (
                            <>
                                <span>•</span>
                                <button
                                    onClick={handleListenClick}
                                    className={`flex items-center gap-1.5 transition-colors ${isPlaying ? 'text-indigo-600' : 'text-slate-500'}`}
                                >
                                    {isPlaying ? (
                                        isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4 animate-pulse" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        const rates = [0.8, 1.0, 1.2, 1.5];
                                        const idx = rates.indexOf(rate);
                                        setRate(rates[(idx + 1) % rates.length]);
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Endre hastighet"
                                >
                                    {rate}x
                                </button>
                            </>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-2 leading-tight">
                        {event.title}
                    </h1>
                </div>
            </div>

            {/* Hero Image Banner */}
            {event.layout !== 'tool' && (
                <div className="max-w-6xl mx-auto px-0 sm:px-4 md:px-6 mb-8 md:mb-12">
                    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl">
                        <ImageWithFallback
                            src={event.heroImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            seed={event.title}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Container */}
            <div className={`${(event.layout === 'tool' || event.layout === 'learning-path' || event.layout === 'learning-path-v2') ? 'w-full' : 'max-w-6xl mx-auto px-0 sm:px-4 md:px-6'}`}>
                <div className={`${(event.layout === 'tool' || event.layout === 'learning-path' || event.layout === 'learning-path-v2') ? 'w-full' : 'bg-white rounded-3xl p-3 sm:p-5 md:p-10'}`}>
                    {event.layout === 'learning-path-v2' && event.learningPathV2Data ? (
                        <LearningPathV2 data={event.learningPathV2Data} />
                    ) : event.layout === 'learning-path' && event.learningPathData ? (
                        <LearningPath data={event.learningPathData} />
                    ) : (
                        <div className={`grid gap-8 md:gap-12 ${event.layout === 'tool' ? 'grid-cols-1 w-full' : 'grid-cols-1 lg:grid-cols-[1fr_350px]'}`}>
                            {/* Left Column: Article Text */}
                            {/* min-w-0 + article-main-column: lar 1fr-kolonnen krympe under
                                barnas egen bredde, så en bred komponent aldri kan presse ut
                                sidebaren (klassisk CSS-grid-felle). Se index.css. */}
                            <div className="space-y-8 min-w-0 article-main-column">
                                <ArticleContent
                                    content={event.content}
                                    concepts={event.concepts}
                                    activeBlockIndex={activeContentIndex}
                                    onBlockClick={handleBlockClick}
                                    isTool={event.layout === 'tool'}
                                    audioControls={isPlaying ? {
                                        isPlaying,
                                        isPaused,
                                        onToggle: handleListenClick,
                                        onStop: cancel,
                                    } : undefined}
                                />

                                {event.fact && <FactBox content={event.fact} />}

                                {event.lessonPlan && (
                                    <div className="mt-12">
                                        <details className="group bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden">
                                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none text-emerald-900 font-bold hover:bg-emerald-50 transition-colors">
                                                <span className="flex items-center gap-2">
                                                    <BookOpen size={20} className="text-emerald-600" />
                                                    Oppgaver
                                                </span>
                                                <span className="transform group-open:rotate-180 transition-transform duration-200">
                                                    <ChevronDown className="w-5 h-5" />
                                                </span>
                                            </summary>
                                            <div className="px-6 pb-6 pt-2 text-slate-700 space-y-6">
                                                <div>
                                                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2 uppercase tracking-wider text-xs">
                                                        Læringsmål
                                                    </h4>
                                                    <ul className="list-disc list-outside ml-5 space-y-1 text-sm italic">
                                                        {event.lessonPlan.learningObjectives.map((obj: string, i: number) => (
                                                            <li key={i}>{obj}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">Før lesing</h4>
                                                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-slate-600">
                                                            {event.lessonPlan.preReading.map((task: string, i: number) => (
                                                                <li key={i}>{task}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">Under lesing</h4>
                                                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-slate-600">
                                                            {event.lessonPlan.whileReading.map((task: string, i: number) => (
                                                                <li key={i}>{task}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">Etter lesing</h4>
                                                    <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-slate-600">
                                                        {event.lessonPlan.postReading.map((task: string, i: number) => (
                                                            <li key={i}>{task}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {event.lessonPlan.writingTask && (
                                                    <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                                                        <h4 className="font-bold text-emerald-900 mb-2 uppercase tracking-wide text-xs">Skriveoppgave</h4>
                                                        {Array.isArray(event.lessonPlan.writingTask) ? (
                                                            <div className="space-y-4">
                                                                {event.lessonPlan.writingTask.map((task, i) => (
                                                                    <div key={i} className={i > 0 ? "pt-4 border-t border-emerald-50" : ""}>
                                                                        <div className="text-xs font-bold text-emerald-600 mb-1 uppercase">Alternativ {i + 1}</div>
                                                                        <p className="text-sm leading-relaxed text-slate-700">
                                                                            {renderInlineMarkdown(task, event.concepts)}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed text-slate-700">
                                                                {renderInlineMarkdown(event.lessonPlan.writingTask, event.concepts)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    </div>
                                )}

                                {footerSlot && event.layout !== 'tool' && footerSlot}

                                {lessonNav && event.layout !== 'tool' && (
                                    <LessonNavFooter nav={lessonNav} />
                                )}
                            </div>

                            {/* Right Column: Sidebar / Interactive Elements */}
                            {event.layout !== 'tool' && (
                                <RichSidebar
                                    details={event.details}
                                    timelineEvents={combinedTimeline}
                                    relatedArticles={relatedArticles}
                                    mapData={event.mapData}
                                    tags={event.tags}
                                    config={sidebarConfig}
                                    learningPaths={event.learningPaths}
                                    audioState={audioState}
                                    metadata={metadata}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AudioPlayerBar
                isPlaying={isPlaying}
                isPaused={isPaused}
                onToggle={handleListenClick}
                onStop={cancel}
                rate={rate}
                setRate={setRate}
                current={activeBlockIndex > 0 ? activeBlockIndex : undefined}
                total={speechData.blocks.length - 1}
                hideOnDesktop={event.layout !== 'tool'}
            />
        </div>
    );
};
