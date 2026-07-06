// «Anbefalt for deg» - en variert, begrunnet liste med neste steg på tvers av
// alle innholdstyper (artikler, stier, quizer, spill, detektiv, tidsreiser og
// repetisjon). Kortene er kompakte (Chromebook 1366x768) og spring-animerte.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Gamepad2,
    HelpCircle,
    Hourglass,
    Map,
    RefreshCw,
    Search,
} from 'lucide-react';
import type { Recommendation, RecommendationType } from '../recommendations/engine';

const TYPE_STYLE: Record<
    RecommendationType,
    { Icon: typeof BookOpen; bg: string; label: string; chip: string }
> = {
    path: { Icon: Map, bg: 'bg-indigo-500', label: 'Læringssti', chip: 'bg-indigo-50 text-indigo-700' },
    article: { Icon: BookOpen, bg: 'bg-sky-500', label: 'Artikkel', chip: 'bg-sky-50 text-sky-700' },
    quiz: { Icon: HelpCircle, bg: 'bg-rose-500', label: 'Quiz', chip: 'bg-rose-50 text-rose-700' },
    game: { Icon: Gamepad2, bg: 'bg-violet-500', label: 'Spill', chip: 'bg-violet-50 text-violet-700' },
    detective: { Icon: Search, bg: 'bg-amber-500', label: 'Detektiv', chip: 'bg-amber-50 text-amber-700' },
    scenario: { Icon: Hourglass, bg: 'bg-teal-500', label: 'Tidsreise', chip: 'bg-teal-50 text-teal-700' },
    review: { Icon: RefreshCw, bg: 'bg-emerald-500', label: 'Repetisjon', chip: 'bg-emerald-50 text-emerald-700' },
};

export const RecommendationsSection = ({ items }: { items: Recommendation[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-1">Anbefalt for deg</h2>
            <p className="text-xs text-slate-500 mb-3">
                Neste steg valgt ut fra hvor du er akkurat nå.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
                {items.map((item, i) => {
                    const { Icon, bg, label, chip } = TYPE_STYLE[item.type];
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26, delay: i * 0.04 }}
                        >
                            <Link
                                to={item.link}
                                className="group flex h-full items-start gap-3 rounded-xl border border-slate-100 px-3 py-3 no-underline transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                            >
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} text-white transition-transform group-hover:scale-110`}
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="mb-0.5 flex items-center gap-2">
                                        <span
                                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${chip}`}
                                        >
                                            {label}
                                        </span>
                                    </span>
                                    <span className="block truncate text-sm font-semibold text-slate-900">
                                        {item.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs leading-snug text-slate-500 line-clamp-2">
                                        {item.reason}
                                    </span>
                                </span>
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
