import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { motionPresets } from '../styles/motion-presets';
import { Search, Filter, BookOpen, Tag } from 'lucide-react';
import { textLibraryData, type TextEntry } from '../data/textLibraryData';
import { usePageTitle } from '../hooks/usePageTitle';

type SortOption = 'title' | 'year_asc' | 'year_desc';

// Fast liste - defineres på modulnivå så den ikke får ny identitet hver render
// (og dermed river ned memoiseringen av tekstfiltreringen).
const periods = [
    { label: 'Før 1900', filter: (year: number) => year < 1900 },
    { label: '1900 - 1950', filter: (year: number) => year >= 1900 && year <= 1950 },
    { label: '1950 - 2000', filter: (year: number) => year > 1950 && year <= 2000 },
    { label: 'Etter 2000', filter: (year: number) => year > 2000 }
];

export const TextLibraryPage: React.FC = () => {
    usePageTitle('Bibliotek');

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Sorting State
    const [sortOption, setSortOption] = React.useState<SortOption>('title');

    // Read Status State (Local Storage)
    const [readTexts, setReadTexts] = React.useState<string[]>(() => {
        const saved = localStorage.getItem('readTexts');
        return saved ? JSON.parse(saved) : [];
    });

    const toggleRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setReadTexts(prev => {
            const newReadTexts = prev.includes(id)
                ? prev.filter(textId => textId !== id)
                : [...prev, id];
            localStorage.setItem('readTexts', JSON.stringify(newReadTexts));
            return newReadTexts;
        });
    };

    const searchTerm = searchParams.get('search') || '';
    const selectedGenre = searchParams.get('genre');
    const selectedTheme = searchParams.get('theme');
    const selectedPeriod = searchParams.get('period');

    const hasActiveFilters = searchTerm || selectedGenre || selectedTheme || selectedPeriod;

    const updateFilter = (key: string, value: string | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const genres = useMemo(() => Array.from(new Set(textLibraryData.map((t: TextEntry) => t.genre))), []);
    const themes = useMemo(() => Array.from(new Set(textLibraryData.flatMap((t: TextEntry) => t.theme || []))), []);

    const filteredAndSortedTexts = useMemo(() => {
        const result = textLibraryData.filter(text => {
            const matchesSearch = text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                text.author.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGenre = selectedGenre ? text.genre === selectedGenre : true;
            const matchesTheme = selectedTheme ? text.theme?.includes(selectedTheme) : true;

            let matchesPeriod = true;
            if (selectedPeriod) {
                const period = periods.find(p => p.label === selectedPeriod);
                if (period && text.publishedYear) {
                    matchesPeriod = period.filter(text.publishedYear);
                } else if (period && !text.publishedYear) {
                    matchesPeriod = false;
                }
            }

            return matchesSearch && matchesGenre && matchesTheme && matchesPeriod;
        });

        // Sorting Logic
        return result.sort((a, b) => {
            if (sortOption === 'title') {
                return a.title.localeCompare(b.title);
            } else if (sortOption === 'year_asc') {
                return (a.publishedYear || 9999) - (b.publishedYear || 9999);
            } else if (sortOption === 'year_desc') {
                return (b.publishedYear || -9999) - (a.publishedYear || -9999);
            }
            return 0;
        });
    }, [searchTerm, selectedGenre, selectedTheme, selectedPeriod, sortOption]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Bibliotek</h1>
                    <p className="text-xl text-slate-600 max-w-3xl">
                        Utforsk et utvalg av noveller, romanutdrag og andre tekster til bruk i norskfaget.
                    </p>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-medium text-slate-500 pl-2">Sorter etter:</span>
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                        <option value="title">Tittel (A-Å)</option>
                        <option value="year_asc">År (Eldst først)</option>
                        <option value="year_desc">År (Nyest først)</option>
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Filter size={20} />
                                <h2>Filter</h2>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => setSearchParams({})}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                >
                                    Nullstill
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Søk etter tittel eller forfatter..."
                                    value={searchTerm}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Genre Filter */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Sjanger</h3>
                                {selectedGenre && (
                                    <button
                                        onClick={() => updateFilter('genre', null)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        Nullstill
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => updateFilter('genre', null)}
                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedGenre ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Alle sjangre
                                </button>
                                {genres.map((genre: string) => (
                                    <button
                                        key={genre}
                                        onClick={() => updateFilter('genre', genre)}
                                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedGenre === genre ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Periode</h3>
                                {selectedPeriod && (
                                    <button
                                        onClick={() => updateFilter('period', null)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        Nullstill
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => updateFilter('period', null)}
                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedPeriod ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Alle perioder
                                </button>
                                {periods.map((period: { label: string; filter: (year: number) => boolean }) => (
                                    <button
                                        key={period.label}
                                        onClick={() => updateFilter('period', period.label)}
                                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPeriod === period.label ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Filter */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tema</h3>
                                {selectedTheme && (
                                    <button
                                        onClick={() => updateFilter('theme', null)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        Nullstill
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {themes.map((theme: string) => (
                                    <button
                                        key={theme}
                                        onClick={() => updateFilter('theme', selectedTheme === theme ? null : theme)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedTheme === theme ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3">
                    {filteredAndSortedTexts.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">Ingen tekster funnet med valgte filter.</p>
                            <button
                                onClick={() => setSearchParams({})}
                                className="mt-4 text-indigo-600 hover:underline text-sm"
                            >
                                Nullstill filter
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {filteredAndSortedTexts.map((text: TextEntry, index: number) => {
                            const isRead = readTexts.includes(text.id);
                            return (
                                <motion.div
                                    key={text.id}
                                    {...motionPresets.slideUp}
                                    transition={{ delay: index * 0.03 }}
                                    className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-all group ${isRead ? 'border-green-200 bg-green-50/30' : 'border-slate-100'}`}
                                >
                                    <div className="p-6 flex-grow relative">
                                        {/* Read Status Toggle */}
                                        <button
                                            onClick={(e) => toggleRead(e, text.id)}
                                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isRead ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`}
                                            title={isRead ? "Marker som ulest" : "Marker som lest"}
                                        >
                                            <BookOpen size={16} className={isRead ? "fill-current" : ""} />
                                        </button>

                                        <h3
                                            onClick={() => navigate(`/norsk/bibliotek/${text.id}`)}
                                            className="text-xl font-semibold text-slate-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors pr-8"
                                        >
                                            {text.title}
                                        </h3>
                                        <p
                                            onClick={() => updateFilter('search', text.author)}
                                            className="text-slate-600 text-sm mb-4 cursor-pointer hover:text-indigo-600 transition-colors inline-block"
                                        >
                                            Av {text.author}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateFilter('genre', text.genre); }}
                                                className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                            >
                                                <Tag className="mr-1" size={12} /> {text.genre}
                                            </button>
                                            {text.theme && text.theme.map((t: string) => (
                                                <button
                                                    key={t}
                                                    onClick={(e) => { e.stopPropagation(); updateFilter('theme', t); }}
                                                    className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                                                >
                                                    <BookOpen className="mr-1" size={12} /> {t}
                                                </button>
                                            ))}
                                            {text.publishedYear && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const period = periods.find(p => p.filter(text.publishedYear!));
                                                        if (period) updateFilter('period', period.label);
                                                    }}
                                                    className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                                                >
                                                    {text.publishedYear}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isRead && (
                                        <div className="bg-green-100 px-6 py-2 text-xs font-medium text-green-700 flex items-center justify-center gap-2">
                                            <BookOpen size={12} /> Lest
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};
