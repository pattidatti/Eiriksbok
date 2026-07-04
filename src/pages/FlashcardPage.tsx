import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConcepts } from '../hooks/useConcepts';
import type { ConceptItem } from '../hooks/useConcepts';
import { Link } from 'react-router-dom';
import { Filter, Search, RotateCw, ArrowRight } from 'lucide-react';
import { captureFlashcardFlip } from '../utils/reviewCapture';

export const FlashcardPage: React.FC = () => {
    const concepts = useConcepts();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');

    // Get unique subjects for filter
    const subjects = useMemo(() => {
        const unique = new Set(concepts.map(c => c.subjectId).filter(Boolean));
        return Array.from(unique);
    }, [concepts]);

    // Get unique topics for selected subject
    const topics = useMemo(() => {
        const filteredBySubject = selectedSubject === 'all'
            ? concepts
            : concepts.filter(c => c.subjectId === selectedSubject);
        const unique = new Set(filteredBySubject.map(c => c.topicId).filter(Boolean));
        return Array.from(unique);
    }, [concepts, selectedSubject]);

    // Reset topic when subject changes
    useEffect(() => {
        setSelectedTopic('all');
    }, [selectedSubject]);

    const filteredConcepts = useMemo(() => {
        return concepts.filter(concept => {
            const matchesSearch = concept.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                concept.definition.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = selectedSubject === 'all' || concept.subjectId === selectedSubject;
            const matchesTopic = selectedTopic === 'all' || concept.topicId === selectedTopic;
            return matchesSearch && matchesSubject && matchesTopic;
        });
    }, [concepts, searchTerm, selectedSubject, selectedTopic]);

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <Link to="/oving" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            Tilbake til oversikt
                        </Link>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-slate-900">
                        Fagbegreper
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Øv på viktige begreper fra alle emnene dine.
                    </p>
                </div>

                {/* Controls */}
                <div className="mb-8 flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Søk i begreper..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Subject Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-500 font-medium mr-2">Fag:</span>
                            <button
                                onClick={() => setSelectedSubject('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedSubject === 'all'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Alle
                            </button>
                            {subjects.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject as string)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${selectedSubject === subject
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>

                        {/* Topic Filter (only show if subject selected or topics available) */}
                        {topics.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                                <span className="text-sm text-slate-500 font-medium mr-2">Emne:</span>
                                <button
                                    onClick={() => setSelectedTopic('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedTopic === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Alle
                                </button>
                                {topics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(topic as string)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${selectedTopic === topic
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {filteredConcepts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredConcepts.map((concept) => (
                            <Flashcard key={concept.id} concept={concept} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        Ingen begreper funnet. Prøv å endre søket eller filteret.
                    </div>
                )}
            </div>
        </div>
    );
};

const Flashcard: React.FC<{ concept: ConceptItem }> = ({ concept }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="h-60 perspective-1000 cursor-pointer group"
            onClick={() => {
                if (!isFlipped) captureFlashcardFlip(concept);
                setIsFlipped(!isFlipped);
            }}
        >
            <motion.div
                className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
                {/* Front */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    <div className="h-full w-full bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group-hover:-translate-y-1">
                        <div className="absolute top-4 left-0 right-0 flex justify-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-semibold tracking-wide uppercase border border-slate-100">
                                {concept.subjectId} • {concept.topicId}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center w-full px-2">
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight break-words hyphens-auto w-full">
                                {concept.term}
                            </h3>
                        </div>

                        <div className="absolute bottom-4 flex items-center gap-2 text-indigo-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Klikk for å snu</span>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                    <div className="h-full w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-100/50 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex flex-col h-full w-full">
                            <div className="flex-1 flex items-center justify-center overflow-y-auto scrollbar-hide">
                                <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium font-display">
                                    {concept.definition}
                                </p>
                            </div>

                            {concept.lessonId && (
                                <Link
                                    to={`/${concept.subjectId}/${concept.topicId}/${concept.lessonId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md border border-indigo-100 hover:border-indigo-200 shrink-0"
                                >
                                    <span>Les mer</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
