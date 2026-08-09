import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useManifest } from '../hooks/useManifest';
import { useScrollLock } from '../hooks/useScrollLock';
import type { Manifest, ManifestLesson } from '../types';
import { Search, X, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { textLibraryData } from '../data/textLibraryData';
import { learningPathsData } from '../data/learningPathsHelper';
import Fuse from 'fuse.js';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    type: 'lesson' | 'topic' | 'concept' | 'library' | 'learning-path';
    title: string;
    path: string;
    description?: string;
    tags?: string[];
}

// Fuse-indeksen bygges én gang per manifest-referanse (modulcache), ikke per
// tastetrykk/åpning - indeksering av 1000+ items blokkerer ellers main thread.
let fuseCache: { manifest: Manifest; fuse: Fuse<SearchResult> } | null = null;

function getFuse(manifest: Manifest): Fuse<SearchResult> {
    if (fuseCache && fuseCache.manifest === manifest) return fuseCache.fuse;

    const allItems: SearchResult[] = [];

    // 1. Manifest Content
    manifest.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
            // Add Topic
            allItems.push({
                type: 'topic',
                title: topic.title,
                path: `/${subject.id}`,
                description: `Emne i ${subject.title}`,
                tags: []
            });

            const processLesson = (lesson: ManifestLesson, path: string, contextTitle: string) => {
                // List of generic titles that need context
                const genericTitles = [
                    'Bønn', 'Sentrale trekk', 'Introduksjon', 'Overgangsriter',
                    'Gudsbilde', 'Frelse', 'Hellige tekster', 'Grunnleggere',
                    'Etikk', 'Arkitektur', 'Kunst', 'Bakgrunn'
                ];

                const shouldAppendContext = genericTitles.includes(lesson.title) ||
                    (lesson.title.startsWith('Bønn') && lesson.title.length < 20);

                const displayTitle = shouldAppendContext
                    ? `${lesson.title} - ${contextTitle}`
                    : lesson.title;

                allItems.push({
                    type: 'lesson',
                    title: displayTitle,
                    path: path,
                    description: lesson.description || `Leksjon i ${contextTitle}`,
                    tags: lesson.tags || []
                });
            };

            if (topic.subTopics) {
                topic.subTopics.forEach((subTopic) => {
                    subTopic.lessons.forEach((lesson) => {
                        processLesson(lesson, `/${subject.id}/${topic.id}/${subTopic.id}/${lesson.id}`, subTopic.title);
                    });
                });
            } else if (topic.lessons) {
                topic.lessons.forEach((lesson) => {
                    processLesson(lesson, `/${subject.id}/${topic.id}/${lesson.id}`, topic.title);
                });
            }
        });
    });

    // 2. Library Texts
    textLibraryData.forEach(text => {
        const tags = [text.genre, ...(text.theme || []), text.author];
        allItems.push({
            type: 'library',
            title: text.title,
            path: `/norsk/bibliotek/${text.id}`,
            description: `Av ${text.author}`,
            tags: tags.filter(Boolean) as string[]
        });
    });

    // 3. Learning Paths
    learningPathsData.paths.forEach(path => {
        allItems.push({
            type: 'learning-path',
            title: path.title,
            path: path.path,
            description: path.description,
            tags: (path as any).tags || []
        });
    });

    const fuse = new Fuse(allItems, {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'tags', weight: 0.5 },
            { name: 'description', weight: 0.3 }
        ],
        threshold: 0.3, // 0.0 = perfect match, 1.0 = match anything
        includeScore: true
    });

    fuseCache = { manifest, fuse };
    return fuse;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { data: manifest } = useManifest();
    const navigate = useNavigate();

    useScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            // Focus input on open
            if (inputRef.current) {
                inputRef.current.focus();
            }
            // Reset selection
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    navigate(results[selectedIndex].path);
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, results, selectedIndex, navigate]);

    // Auto-scroll to selected item
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    useEffect(() => {
        if (!manifest || !query.trim()) {
            setResults([]);
            return;
        }

        const searchResults = getFuse(manifest).search(query);
        setResults(searchResults.map(result => result.item).slice(0, 50)); // Limit to 50 results
        setSelectedIndex(0); // Reset selection on new results

        // Log search to Firebase (Debounced)
        const logTimer = setTimeout(() => {
            if (query.length > 2) { // Only log if length > 2
                import('../lib/firebase').then(({ db }) => {
                    import('firebase/database').then(({ ref, push, serverTimestamp }) => {
                        const searchRef = ref(db, 'analytics/searches');
                        // Analytikk er best-effort: manglende skrivetilgang
                        // (f.eks. localhost) skal aldri gi feil i konsollen
                        push(searchRef, {
                            query: query,
                            type: 'text',
                            timestamp: serverTimestamp(),
                            resultsCount: searchResults.length
                        }).catch(() => {});
                    }).catch(() => {});
                }).catch(() => {});
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(logTimer);

    }, [query, manifest]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col items-center pt-[10vh]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="w-full max-w-2xl px-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                            <input
                                ref={inputRef}
                                type="text"
                                role="combobox"
                                aria-expanded="true"
                                aria-controls="search-results"
                                aria-activedescendant={results.length > 0 ? `result-${selectedIndex}` : undefined}
                                placeholder="Søk etter begreper, leksjoner, tekster..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 text-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-display"
                            />
                            <button
                                onClick={onClose}
                                aria-label="Lukk søk"
                                className="focus-ring absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div
                            ref={listRef}
                            id="search-results"
                            role="listbox"
                            className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar scroll-p-2"
                        >
                            {results.map((result, index) => (
                                <Link
                                    key={index}
                                    to={result.path}
                                    onClick={onClose}
                                    className="block no-underline"
                                >
                                    <motion.div
                                        id={`result-${index}`}
                                        role="option"
                                        aria-selected={index === selectedIndex}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2, ease: 'easeOut' }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`border rounded-xl p-4 flex justify-between items-center transition-all group cursor-pointer ${index === selectedIndex
                                            ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                            : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors truncate flex items-center gap-2">
                                                {result.type === 'learning-path' && <Map className="w-4 h-4 text-emerald-400" />}
                                                {result.title}
                                            </div>
                                            <div className="text-sm text-slate-400 truncate">
                                                {result.description}
                                            </div>
                                            {result.tags && result.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {result.tags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {result.tags.length > 3 && (
                                                        <span className="text-xs px-2 py-0.5 text-slate-500">
                                                            +{result.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded whitespace-nowrap ${result.type === 'learning-path'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : result.type === 'library'
                                                ? 'bg-white/10 text-slate-300'
                                                : 'bg-white/10 text-slate-300'
                                            }`}>
                                            {result.type === 'learning-path' ? 'læringssti' : result.type === 'library' ? 'bibliotek' : result.type}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                            {query && results.length === 0 && (
                                <div className="text-center text-slate-400 py-8">
                                    Ingen resultater funnet for "{query}"
                                </div>
                            )}
                            {!query && (
                                <div className="text-center text-slate-500 py-8 text-sm">
                                    Skriv for å søke...
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div >
            )}
        </AnimatePresence >
    );
};
