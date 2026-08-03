import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';

import { BarChart, Activity, BookOpen, Users, Globe, Search, Clock, Gamepad2, Trophy } from 'lucide-react';

interface ViewData {
    id: string; // safe path
    count: number;
    title: string;
    type: 'topic' | 'lesson';
    avgTime?: number; // milliseconds
}

interface SearchLog {
    query: string;
    timestamp: number;
    resultsCount: number;
    type: 'text' | 'tag';
}

interface GameLog {
    outcome: 'won' | 'lost';
    timestamp: number;
    word?: string;
}

export const StatsPage: React.FC = () => {
    // Metrics State
    const [viewData, setViewData] = useState<ViewData[]>([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [uniqueUsers, setUniqueUsers] = useState(0);

    // Advanced Stats State
    const [recentSearches, setRecentSearches] = useState<SearchLog[]>([]);
    const [topSearches, setTopSearches] = useState<{ term: string, count: number }[]>([]);
    const [hangmanStats, setHangmanStats] = useState({ plays: 0, wins: 0, winRate: 0 });
    const [avgReadingTimeGlobal, setAvgReadingTimeGlobal] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- 1. Page Views & Reading Time ---
        const viewsRef = ref(db, 'analytics/views');
        const timeRef = ref(db, 'analytics/reading_time');

        // Combine views and time data effectively
        // We'll listen to both and merge in viewData
        let rawViews: Record<string, number> = {};
        let rawTimes: Record<string, Record<string, { duration: number }>> = {};

        const processMergedData = () => {
            if (!rawViews) return;

            let totalDurationGlobal = 0;
            let totalReadSessions = 0;

            const formatted: ViewData[] = Object.entries(rawViews).map(([key, count]) => {
                const parts = key.split('_');
                const type: 'topic' | 'lesson' = parts.length === 2 ? 'topic' : 'lesson';
                const title = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');

                // Calculate Avg Time for this page.
                // Målinger fra før august 2026 ligger under en nøkkel med
                // ledende understrek (pathname hadde skråstrek foran). Vi leser
                // begge, så historikken teller med.
                const timeEntry = rawTimes?.[key] ?? rawTimes?.[`_${key}`];
                let avgTime = 0;
                if (timeEntry) {
                    const sessions = Object.values(timeEntry);
                    if (sessions.length > 0) {
                        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
                        avgTime = totalDuration / sessions.length;

                        totalDurationGlobal += totalDuration;
                        totalReadSessions += sessions.length;
                    }
                }

                return { id: key, count, title, type, avgTime };
            });

            formatted.sort((a, b) => b.count - a.count);
            setViewData(formatted);

            if (totalReadSessions > 0) {
                setAvgReadingTimeGlobal(totalDurationGlobal / totalReadSessions);
            }
        };

        const unsubViews = onValue(viewsRef, (snap) => {
            rawViews = snap.val() || {};
            processMergedData();
            setLoading(false);
        });

        const unsubTime = onValue(timeRef, (snap) => {
            rawTimes = snap.val() || {};
            processMergedData();
        });

        // --- 2. Active & Unique Users ---
        const unsubActive = onValue(ref(db, 'analytics/active_users'), snap => setActiveUsers(snap.size));
        const unsubUnique = onValue(ref(db, 'analytics/unique_users'), snap => setUniqueUsers(snap.size));

        // --- 3. Search Logs ---
        const unsubSearch = onValue(ref(db, 'analytics/searches'), (snap) => {
            const raw = snap.val();
            if (!raw) return;

            const logs: SearchLog[] = Object.values(raw);
            // Sort by timestamp desc
            logs.sort((a, b) => b.timestamp - a.timestamp);
            setRecentSearches(logs.slice(0, 10)); // Last 10

            // Aggregate top searches
            const counts: Record<string, number> = {};
            logs.forEach(l => {
                const term = l.query.toLowerCase();
                counts[term] = (counts[term] || 0) + 1;
            });

            const sorted = Object.entries(counts)
                .map(([term, count]) => ({ term, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5

            setTopSearches(sorted);
        });

        // --- 4. Game Stats (Hangman) ---
        const unsubGames = onValue(ref(db, 'analytics/games/hangman'), (snap) => {
            const raw = snap.val();
            if (!raw) return;

            const logs: GameLog[] = Object.values(raw);
            const plays = logs.length;
            const wins = logs.filter(l => l.outcome === 'won').length;

            setHangmanStats({
                plays,
                wins,
                winRate: plays > 0 ? Math.round((wins / plays) * 100) : 0
            });
        });

        return () => {
            unsubViews();
            unsubTime();
            unsubActive();
            unsubUnique();
            unsubSearch();
            unsubGames();
        };
    }, []);

    const formatTime = (ms: number) => {
        if (!ms) return '-';
        const seconds = Math.round(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <BarChart className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Lesestatistikk & Innsikt</h1>
                        <p className="text-slate-500">Sanntidsoversikt over bruk, søk og engasjement.</p>
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Globe className="w-6 h-6 animate-pulse" />}
                        color="green"
                        label="Akkurat nå"
                        value={activeUsers}
                        subtext="lesere online"
                    />
                    <StatCard
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                        label="Unike lesere"
                        value={uniqueUsers}
                        subtext="totalt (siden tracking)"
                    />
                    <StatCard
                        icon={<Activity className="w-6 h-6" />}
                        color="emerald"
                        label="Totale visninger"
                        value={viewData.reduce((acc, c) => acc + c.count, 0)}
                    />
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        color="blue"
                        label="Snitt lesetid"
                        value={formatTime(avgReadingTimeGlobal)}
                        subtext="per side besøk"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Table */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" /> Mest leste innhold
                            </h2>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 w-16">#</th>
                                        <th className="px-6 py-4">Tittel</th>
                                        <th className="px-6 py-4 text-right">Tid</th>
                                        <th className="px-6 py-4 text-right">Visninger</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">Laster...</td></tr>
                                    ) : viewData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{item.title}</div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{item.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">
                                                {formatTime(item.avgTime || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs">
                                                    {item.count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar Stats (Search & Games) */}
                    <div className="space-y-6">
                        {/* Game Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Gamepad2 className="w-5 h-5 text-pink-500" /> Spill: Hengemann
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Runder</div>
                                    <div className="text-2xl font-bold text-slate-900">{hangmanStats.plays}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Seier %</div>
                                    <div className="text-2xl font-bold text-green-600">{hangmanStats.winRate}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Top Searches */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" /> Topp Søk
                                </h2>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {topSearches.length === 0 && <li className="p-4 text-center text-slate-400 text-sm">Ingen søk ennå</li>}
                                {topSearches.map((s, i) => (
                                    <li key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50">
                                        <span className="text-slate-700 font-medium capitalize">{s.term}</span>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent Searches */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Search className="w-5 h-5 text-blue-500" /> Siste Søk
                                </h2>
                            </div>
                            <ul className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {recentSearches.length === 0 && <li className="p-4 text-center text-slate-400 text-sm">Ingen data</li>}
                                {recentSearches.map((s, i) => (
                                    <li key={i} className="px-6 py-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-slate-800 font-medium capitalize">{s.query}</span>
                                            <span className="text-[10px] text-slate-400 uppercase border border-slate-200 px-1.5 rounded">{s.type === 'tag' ? 'Tag' : 'Tekst'}</span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                                            <span>{s.resultsCount} treff</span>
                                            <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Subcomponent for Cards
const StatCard = ({ icon, color, label, value, subtext }: { icon: React.ReactNode, color: string, label: string, value: string | number, subtext?: string }) => {
    // Map string color to tailwind classes (simplified)
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className={`p-3 rounded-full z-10 ${colorClasses[color] || 'bg-slate-100'}`}>
                {icon}
            </div>
            <div className="z-10">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{label}</div>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                {subtext && <div className="text-xs text-slate-400 font-medium mt-0.5">{subtext}</div>}
            </div>
        </div>
    );
};
