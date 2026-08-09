import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Map, ChevronDown, ChevronUp, Volume2, Pause, Play, Square, History, ShieldCheck } from 'lucide-react';
import { TimelineComponent, type TimelineEvent } from './TimelineComponent';
import { formatNorwegianDate } from '../utils/dateUtils';
import type { MapData, SidebarConfig } from '../types';
import type { RelatedLesson } from '../hooks/useRelatedContent';

interface RichSidebarProps {
    details: string[];
    timelineEvents: TimelineEvent[];
    relatedArticles: RelatedLesson[];
    mapData?: MapData;
    tags?: string[];
    config?: SidebarConfig;
    learningPaths?: { id: string; title: string; url: string }[];
    audioState?: {
        isPlaying: boolean;
        isPaused: boolean;
        hasVoice: boolean;
        onToggle: () => void;
        onStop?: () => void;
        rate?: number;
        setRate?: (rate: number) => void;
    };
    metadata?: {
        year: string;
        readTime: string;
        category: string;
        lastUpdated?: string;
        factChecked?: string;
    };
}

const InteractiveMapPlaceholder: React.FC = () => (
    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 aspect-video flex flex-col items-center justify-center text-slate-500 mb-8">
        <Map className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm font-medium">Interaktivt kart kommer</span>
    </div>
);

const ExpandableSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-3 text-left group"
            >
                <span className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {title}
                </span>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 text-sm text-slate-600">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const RichSidebar: React.FC<RichSidebarProps> = React.memo(({ details, timelineEvents, relatedArticles, mapData, tags, config, learningPaths, audioState, metadata }) => {
    const lastUpdatedText = formatNorwegianDate(metadata?.lastUpdated);
    const factCheckedText = formatNorwegianDate(metadata?.factChecked);

    return (
        <div className="space-y-8">
            <div className="sticky top-8">
                {/* Desktop: Audio Player & Key Info */}
                <div className="hidden md:block space-y-4 mb-8">
                    {config?.showAudio !== false && audioState?.hasVoice && (
                        <div className="flex gap-2">
                            {audioState.isPlaying ? (
                                /* Active player bar */
                                <div className="flex-1 flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl">
                                    <Volume2 className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                                    <span className="text-xs text-slate-500 flex-1 font-medium">
                                        {audioState.isPaused ? 'Pauset' : 'Leser...'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={audioState.onToggle}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                            title={audioState.isPaused ? 'Fortsett' : 'Pause'}
                                        >
                                            {audioState.isPaused
                                                ? <Play className="w-3.5 h-3.5 ml-0.5" />
                                                : <Pause className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                        {audioState.onStop && (
                                            <button
                                                onClick={audioState.onStop}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Stopp"
                                            >
                                                <Square className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Idle - start button */
                                <button
                                    onClick={audioState.onToggle}
                                    className="flex-1 flex items-center p-4 rounded-xl transition-all shadow-sm border bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md"
                                >
                                    <Volume2 className="w-5 h-5 mr-3 text-indigo-600" />
                                    <span className="font-bold text-sm">Lytt til artikkel</span>
                                </button>
                            )}
                            {audioState.rate !== undefined && audioState.setRate && (
                                <button
                                    onClick={() => {
                                        const rates = [0.8, 1.0, 1.2, 1.5];
                                        const idx = rates.indexOf(audioState.rate!);
                                        audioState.setRate!(rates[(idx + 1) % rates.length]);
                                    }}
                                    className="px-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-indigo-300 hover:shadow-md transition-all"
                                    title="Endre hastighet"
                                >
                                    {audioState.rate}x
                                </button>
                            )}
                        </div>
                    )}

                    {metadata && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Periode</span>
                                <span className="font-mono text-sm font-bold text-slate-700">{metadata.year}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Lesetid</span>
                                <span className="font-mono text-sm font-bold text-slate-700">{metadata.readTime}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sist oppdatert / faktasjekket - i klartekst, også på mobil */}
                {(lastUpdatedText || factCheckedText) && (
                    <div className="mb-8 space-y-1 text-xs text-slate-500">
                        {lastUpdatedText && (
                            <p className="flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                    Sist oppdatert{' '}
                                    <time dateTime={metadata!.lastUpdated} className="font-semibold text-slate-600">
                                        {lastUpdatedText}
                                    </time>
                                </span>
                            </p>
                        )}
                        {factCheckedText && (
                            <p className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>
                                    Faktasjekket{' '}
                                    <time dateTime={metadata!.factChecked} className="font-semibold text-slate-600">
                                        {factCheckedText}
                                    </time>
                                </span>
                            </p>
                        )}
                    </div>
                )}

                {learningPaths && learningPaths.length > 0 && (
                    <div className="space-y-3 mb-8">
                        {learningPaths.map(path => (
                            <Link
                                key={path.id}
                                to={path.url}
                                className="block bg-indigo-600 hover:bg-indigo-700 p-4 rounded-2xl text-white shadow-lg transition-all group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all">
                                    <Map className="w-12 h-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Denne artikkelen er en del av en læringssti</div>
                                    <div className="font-bold flex items-center gap-2">
                                        <Map className="w-4 h-4" />
                                        {path.title}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {(details.length > 0) && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                        {details.length > 0 && (
                            <>
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider text-sm">
                                    <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
                                    Nøkkelpunkter
                                </h3>
                                <ul className="space-y-3">
                                    {details.map((detail, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-slate-600">
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}


                    </div>
                )}

                {mapData && <InteractiveMapPlaceholder />}

                <div className="mt-8">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Fordypning</h3>

                    {config?.showRelated !== false && relatedArticles.length > 0 && (
                        <ExpandableSection title="Relatert innhold" defaultOpen={true}>
                            <div className="space-y-3">
                                {relatedArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        to={article.url}
                                        className="block py-2 px-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md hover:bg-slate-50 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-0.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors text-sm truncate pr-2">
                                                {article.title}
                                            </span>
                                            {article.date && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {article.date}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </ExpandableSection>
                    )}

                    {tags && tags.length > 0 && (
                        <ExpandableSection title="Nøkkelord">
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <Link
                                        key={tag}
                                        to={`/sok?tag=${tag}`}
                                        className="px-2.5 py-1 bg-white text-slate-600 text-xs font-medium rounded-md border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        </ExpandableSection>
                    )}
                </div>

                {config?.showTimeline !== false && timelineEvents.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <TimelineComponent
                            events={timelineEvents}
                            title="Tidslinje"
                            compact={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});
