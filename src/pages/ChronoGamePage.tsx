import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGlobalTimeline } from '../hooks/useGlobalTimeline';
import { useManifest } from '../hooks/useManifest';
import { ChronoBoard } from '../components/games/chrono/ChronoBoard';
import type { TimelineEvent } from '../components/games/chrono/ChronoCard';
import { ChronoSetup, type ChronoFilterOptions } from '../components/games/chrono/ChronoSetup';
import { ChronoTutorial } from '../components/games/chrono/ChronoTutorial';
import { hasSeenTutorial } from '../utils/chronoStats';
import { PageSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';

const ChronoGamePage: React.FC = () => {
    const { events, loading: timelineLoading, error: timelineError } = useGlobalTimeline();
    const { data: manifest, isLoading: manifestLoading } = useManifest();
    const { setFullWidth } = useLayout();
    const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
    const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [showTutorial, setShowTutorial] = useState<boolean>(() => !hasSeenTutorial());
    const [startError, setStartError] = useState<string | null>(null);

    React.useEffect(() => {
        setFullWidth(false); // No longer 100% widescreen
    }, [setFullWidth]);

    const titleLookups = useMemo(() => {
        const subjectMap: Record<string, string> = {};
        const topicMap: Record<string, string> = {};

        if (manifest?.subjects) {
            manifest.subjects.forEach(s => {
                subjectMap[s.id] = s.title;
                s.topics.forEach(t => {
                    topicMap[t.id] = t.title;
                });
            });
        }

        return { subjectMap, topicMap };
    }, [manifest]);

    // Extract unique subjects and topics for the setup screen
    const availableSubjects = useMemo(() => {
        const subjects = new Set<string>();
        events.forEach(e => {
            if (e.subjectId) {
                const title = titleLookups.subjectMap[e.subjectId] || e.subjectId;
                subjects.add(title);
            }
        });
        return Array.from(subjects).sort();
    }, [events, titleLookups]);

    const availableTopics = useMemo(() => {
        const topics = new Set<string>();
        events.forEach(e => {
            if (e.topicId) {
                const title = titleLookups.topicMap[e.topicId] || e.topicId;
                topics.add(title);
            }
        });
        return Array.from(topics).sort();
    }, [events, titleLookups]);

    const handleStart = (options: ChronoFilterOptions) => {
        const filtered = events.filter(e => {
            // Filter by subject (options.subjects has titles, e.subjectId is slug)
            if (options.subjects.length > 0) {
                const subjectTitle = titleLookups.subjectMap[e.subjectId] || e.subjectId;
                if (!options.subjects.includes(subjectTitle)) return false;
            }
            // Filter by topic - hendelser uten topicId skal også bort når
            // eleven har valgt emner, ellers lyver filteret
            if (options.topics.length > 0) {
                if (!e.topicId) return false;
                const topicTitle = titleLookups.topicMap[e.topicId] || e.topicId;
                if (!options.topics.includes(topicTitle)) return false;
            }
            // Date range filter
            if (e.startDate < options.yearRange[0] || e.startDate > options.yearRange[1]) {
                return false;
            }
            // Basic quality check
            return e.description && e.description.length > 10;
        }).map(e => ({
            id: e.id,
            title: e.title,
            description: e.description || '',
            startDate: e.startDate,
            displayDate: e.displayDate,
            sourceUrl: e.link
        }));

        if (filtered.length < 5) {
            setStartError('For få hendelser med dette valget. Prøv å velge flere fag eller emner.');
            window.setTimeout(() => setStartError(null), 4000);
            return;
        }

        setStartError(null);
        setDifficulty(options.difficulty);
        setFilteredEvents(filtered);
        setGameState('playing');
    };

    if (timelineLoading || manifestLoading) return <PageSkeleton />;
    if (timelineError) return <div className="p-8 text-center text-red-500">Klarte ikke laste spilldata. Prøv igjen senere.</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm font-sans">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/oving" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            <span>Tilbake</span>
                        </Link>
                        <div className="h-6 w-px bg-slate-200" />
                        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Chrono Cards
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
                            title="Vis introduksjon"
                        >
                            Hjelp
                        </button>
                        {gameState === 'playing' && (
                            <button
                                onClick={() => setGameState('setup')}
                                className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
                            >
                                Endre valg
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showTutorial && <ChronoTutorial onComplete={() => setShowTutorial(false)} />}
            </AnimatePresence>

            {/* Game Content */}
            <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8 font-sans">
                {gameState === 'setup' ? (
                    <>
                        {/* ChronoSetup er et fullskjerms-overlegg (z-50), så
                            feilmeldingen må ligge over det som en toast */}
                        <AnimatePresence>
                            {startError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="fixed top-6 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
                                >
                                    <span className="px-5 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold shadow-lg">
                                        {startError}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <ChronoSetup
                            availableSubjects={availableSubjects}
                            availableTopics={availableTopics}
                            minYear={-4000}
                            maxYear={2100}
                            onStart={handleStart}
                        />
                    </>
                ) : (
                    <ChronoBoard
                        events={filteredEvents}
                        onGameOver={(finalScore) => console.log('Game over with score:', finalScore)}
                        difficulty={difficulty}
                    />
                )}
            </main>
        </div>
    );
};

export default ChronoGamePage;
