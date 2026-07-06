// Fag-mestring: en ring per fag (dekning). Klikk på et fag åpner
// emnelisten med kvalitetsstatus (grønn/gul/rød) per emne.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { getSubjectColor } from '../../../utils/subjectColors';
import type { MasteryTrend, SubjectMastery } from '../mastery';

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const Ring = ({ coverage, hex }: { coverage: number; hex: string }) => (
    <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={RING_RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <motion.circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke={hex}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - coverage) }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        />
    </svg>
);

const QUALITY_STYLE: Record<string, { dot: string; label: string }> = {
    green: { dot: 'bg-emerald-500', label: 'Sitter godt' },
    yellow: { dot: 'bg-amber-400', label: 'På vei' },
    red: { dot: 'bg-rose-500', label: 'Trenger øving' },
};

// Liten pil som viser om resultatene i emnet går opp eller ned.
const TrendArrow = ({ trend }: { trend: MasteryTrend }) => {
    if (trend === 'up') {
        return (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-label="Du blir bedre" />
        );
    }
    if (trend === 'down') {
        return (
            <TrendingDown
                className="w-3.5 h-3.5 text-rose-500 shrink-0"
                aria-label="Resultatene har gått ned"
            />
        );
    }
    return null;
};

export const SubjectRings = ({ mastery }: { mastery: SubjectMastery[] }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = mastery.find((m) => m.subjectId === selectedId) ?? null;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4">Fagene dine</h2>

            <div className="grid grid-cols-5 gap-2">
                {mastery.map((subject) => {
                    const color = getSubjectColor(subject.subjectId);
                    const isSelected = selectedId === subject.subjectId;
                    return (
                        <button
                            key={subject.subjectId}
                            onClick={() =>
                                setSelectedId(isSelected ? null : subject.subjectId)
                            }
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                                isSelected ? color.bgSoft : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="relative w-14 h-14 md:w-16 md:h-16">
                                <Ring coverage={subject.coverage} hex={color.hex} />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                    {Math.round(subject.coverage * 100)}%
                                </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 leading-tight text-center">
                                {subject.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-baseline justify-between mb-2">
                                <p className="text-sm font-bold text-slate-900">
                                    {selected.title}: {selected.completedUnits} av{' '}
                                    {selected.totalUnits} fullført
                                </p>
                                <Link
                                    to={`/${selected.subjectId}`}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                    Gå til faget →
                                </Link>
                            </div>
                            <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                {selected.topics.map((topic) => (
                                    <li key={topic.topicId}>
                                        <Link
                                            to={`/${selected.subjectId}/${topic.topicId}`}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 no-underline"
                                        >
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                    topic.qualityLevel
                                                        ? QUALITY_STYLE[topic.qualityLevel].dot
                                                        : 'bg-slate-200'
                                                }`}
                                                title={
                                                    topic.qualityLevel
                                                        ? QUALITY_STYLE[topic.qualityLevel].label
                                                        : 'Ingen quiz tatt ennå'
                                                }
                                            />
                                            <span className="flex-1 text-sm text-slate-700 truncate">
                                                {topic.title}
                                            </span>
                                            <TrendArrow trend={topic.trend} />
                                            <span className="text-xs text-slate-400 tabular-nums">
                                                {topic.completedLessons}/{topic.totalLessons}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sitter
                                    godt
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" /> På vei
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Trenger
                                    øving
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-slate-200" /> Ikke
                                    målt
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
