// Historikk: ukesoppsummering, aktivitetskalender (GitHub-stil) og
// XP-graf over de siste 30 dagene.

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from 'chart.js';
import { addDays, todayLocal } from '../../../utils/reviewScheduler';
import type { DayStats } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const WEEKS_IN_CALENDAR = 16;

interface ActivitySectionProps {
    dayLog: Record<string, DayStats>;
}

// Mandag i uka som inneholder gitt dag
const mondayOf = (day: string): string => {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    const weekday = (date.getDay() + 6) % 7; // 0 = mandag
    return addDays(day, -weekday);
};

const intensityClass = (activities: number): string => {
    if (activities === 0) return 'bg-slate-100';
    if (activities <= 2) return 'bg-indigo-200';
    if (activities <= 5) return 'bg-indigo-400';
    return 'bg-indigo-600';
};

export const ActivitySection = ({ dayLog }: ActivitySectionProps) => {
    const today = todayLocal();

    const { weekXp, weekActivities } = useMemo(() => {
        const monday = mondayOf(today);
        let xp = 0;
        let activities = 0;
        for (let i = 0; i < 7; i++) {
            const day = addDays(monday, i);
            if (day > today) break;
            const stats = dayLog[day];
            if (stats) {
                xp += stats.xp;
                activities += stats.activities;
            }
        }
        return { weekXp: xp, weekActivities: activities };
    }, [dayLog, today]);

    // Kalender: WEEKS_IN_CALENDAR uker, kolonne = uke, rad = ukedag
    const calendarWeeks = useMemo(() => {
        const thisMonday = mondayOf(today);
        const weeks: { day: string; activities: number }[][] = [];
        for (let w = WEEKS_IN_CALENDAR - 1; w >= 0; w--) {
            const monday = addDays(thisMonday, -7 * w);
            const week: { day: string; activities: number }[] = [];
            for (let d = 0; d < 7; d++) {
                const day = addDays(monday, d);
                week.push({ day, activities: day > today ? -1 : (dayLog[day]?.activities ?? 0) });
            }
            weeks.push(week);
        }
        return weeks;
    }, [dayLog, today]);

    const chart = useMemo(() => {
        const labels: string[] = [];
        const data: number[] = [];
        for (let i = 29; i >= 0; i--) {
            const day = addDays(today, -i);
            labels.push(day.slice(5).replace('-', '.'));
            data.push(dayLog[day]?.xp ?? 0);
        }
        return { labels, data };
    }, [dayLog, today]);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-slate-900">Aktiviteten din</h2>
                <p className="text-xs text-slate-500">
                    Denne uka: <span className="font-bold text-slate-700">{weekXp} XP</span> ·{' '}
                    <span className="font-bold text-slate-700">{weekActivities}</span>{' '}
                    {weekActivities === 1 ? 'aktivitet' : 'aktiviteter'}
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Kalender */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                        Siste {WEEKS_IN_CALENDAR} uker
                    </p>
                    <div className="flex gap-[3px]">
                        {calendarWeeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-[3px] flex-1">
                                {week.map(({ day, activities }) => (
                                    <div
                                        key={day}
                                        title={
                                            activities >= 0
                                                ? `${day}: ${activities} ${activities === 1 ? 'aktivitet' : 'aktiviteter'}`
                                                : undefined
                                        }
                                        className={`aspect-square rounded-[3px] ${
                                            activities < 0
                                                ? 'bg-transparent'
                                                : intensityClass(activities)
                                        }`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                        <span>Mindre</span>
                        <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-100" />
                        <span className="w-2.5 h-2.5 rounded-[3px] bg-indigo-200" />
                        <span className="w-2.5 h-2.5 rounded-[3px] bg-indigo-400" />
                        <span className="w-2.5 h-2.5 rounded-[3px] bg-indigo-600" />
                        <span>Mer</span>
                    </div>
                </div>

                {/* XP-graf */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                        XP siste 30 dager
                    </p>
                    <div className="h-36">
                        <Line
                            data={{
                                labels: chart.labels,
                                datasets: [
                                    {
                                        data: chart.data,
                                        borderColor: '#6366f1',
                                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                        fill: true,
                                        tension: 0.35,
                                        pointRadius: 0,
                                        pointHitRadius: 8,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: {
                                            maxTicksLimit: 6,
                                            font: { size: 10 },
                                            color: '#94a3b8',
                                        },
                                    },
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: '#f1f5f9' },
                                        ticks: {
                                            maxTicksLimit: 4,
                                            font: { size: 10 },
                                            color: '#94a3b8',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
