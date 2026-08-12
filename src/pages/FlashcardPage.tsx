import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useConcepts } from '../hooks/useConcepts';
import { useManifest } from '../hooks/useManifest';
import type { ConceptItem } from '../hooks/useConcepts';
import { Link } from 'react-router-dom';
import { Filter, Search, RotateCw, ArrowRight } from 'lucide-react';
import { captureFlashcardFlip } from '../utils/reviewCapture';
import { getSubjectLabel } from '../utils/subjectColors';

export const FlashcardPage: React.FC = () => {
    const concepts = useConcepts();
    const { data: manifest } = useManifest();

    // Emne-chipene viste rå slugger med brutte norske tegn («Midtoesten»,
    // «Forste-verdenskrig», «Okonomi»). Manifestet har de ekte titlene.
    const topicTitles = useMemo(() => {
        const map = new Map<string, string>([['bibliotek', 'Tekstbiblioteket']]);
        for (const subject of manifest?.subjects ?? []) {
            for (const topic of subject.topics) {
                if (!map.has(topic.id)) map.set(topic.id, topic.title);
            }
        }
        return map;
    }, [manifest]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');

    // 151 av 656 begreper mangler `subject`. De var tidligere umulige å isolere
    // - de fantes kun i «Alle»-sekken. «Uten fag» er derfor en egen verdi.
    const subjects = useMemo(() => {
        const unique = new Set(concepts.map(c => c.subjectId).filter(Boolean));
        const list = Array.from(unique) as string[];
        if (concepts.some(c => !c.subjectId)) list.push('uten');
        return list;
    }, [concepts]);

    const matchesSubjectFilter = (concept: ConceptItem, subject: string) =>
        subject === 'all' ||
        (subject === 'uten' ? !concept.subjectId : concept.subjectId === subject);

    // Get unique topics for selected subject
    const topics = useMemo(() => {
        const filteredBySubject = concepts.filter(c => matchesSubjectFilter(c, selectedSubject));
        const unique = new Set(filteredBySubject.map(c => c.topicId).filter(Boolean));
        return Array.from(unique);
    }, [concepts, selectedSubject]);

    // Reset topic when subject changes. Justeres under render i stedet for i en
    // effect, så listen aldri vises ett bilde med forrige fags emne valgt.
    const [prevSubject, setPrevSubject] = useState(selectedSubject);
    if (selectedSubject !== prevSubject) {
        setPrevSubject(selectedSubject);
        setSelectedTopic('all');
    }

    const filteredConcepts = useMemo(() => {
        return concepts.filter(concept => {
            const matchesSearch = concept.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                concept.definition.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTopic = selectedTopic === 'all' || concept.topicId === selectedTopic;
            return matchesSearch && matchesSubjectFilter(concept, selectedSubject) && matchesTopic;
        });
    }, [concepts, searchTerm, selectedSubject, selectedTopic]);

    return (
        <div className="min-h-screen pt-6 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Toppen holdes lav så første kortrad er synlig på 1366x768. */}
                <div className="mb-4">
                    <Link to="/oving" className="mb-2 inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                        Tilbake til oversikt
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Fagbegreper
                    </h1>
                    <p className="text-sm text-slate-500">
                        Øv på viktige begreper fra alle emnene dine.
                    </p>
                </div>

                {/* Controls */}
                <div className="mb-4 flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
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

                    {/* Filters. Fag og emne står under hverandre og brytes over
                        flere linjer - side om side med overflow-x ble fag-radene
                        klippet slik at bare de to første fagene var synlige. */}
                    <div className="flex flex-col gap-3">
                        {/* Subject Filter */}
                        <div className="flex flex-wrap items-center gap-2">
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
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedSubject === subject
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {subject === 'uten' ? 'Uten fag' : getSubjectLabel(subject as string)}
                                </button>
                            ))}
                        </div>

                        {/* Emne-raden vises først når et fag er valgt. Med «Alle»
                            ble det 24 chips på fem linjer, og kortene ble presset
                            under skjermkanten. */}
                        {selectedSubject !== 'all' && topics.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
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
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedTopic === topic
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {topicTitles.get(topic as string) ?? topic}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="mb-4 text-sm text-slate-500" aria-live="polite">
                    Viser <span className="font-bold text-slate-900">{filteredConcepts.length}</span>{' '}
                    av {concepts.length} begreper
                </p>

                {/* Grid */}
                {filteredConcepts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredConcepts.map((concept) => (
                            <Flashcard key={concept.id} concept={concept} topicTitles={topicTitles} />
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

const Flashcard: React.FC<{ concept: ConceptItem; topicTitles: Map<string, string> }> = ({
    concept,
    topicTitles,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            // perspective-1000 finnes ikke i Tailwind v4 - flippen har derfor
            // vært helt uten dybde. content-auto lar nettleseren hoppe over
            // kort utenfor viewport, som teller nå som banken er på 656 begreper.
            className="h-60 perspective-[1000px] content-auto cursor-pointer group"
            onClick={() => {
                if (!isFlipped) captureFlashcardFlip(concept);
                setIsFlipped(!isFlipped);
            }}
        >
            <motion.div
                className="relative w-full h-full [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
                {/* Front */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    <div className="h-full w-full bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group-hover:-translate-y-1">
                        <div className="absolute top-4 left-0 right-0 flex justify-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-semibold tracking-wide uppercase border border-slate-100">
                                {[
                                    concept.subjectId && getSubjectLabel(concept.subjectId),
                                    concept.topicId && (topicTitles.get(concept.topicId) ?? concept.topicId),
                                ]
                                    .filter(Boolean)
                                    .join(' • ') || 'Begrep'}
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
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
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
