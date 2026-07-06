// «Fortsett der du slapp» + anbefalinger: påbegynt sti, neste uleste
// artikkel, svakt emne og dagens repetisjon.

import { Link } from 'react-router-dom';
import { ChevronRight, Map, BookOpen, Target, RefreshCw } from 'lucide-react';

export interface Recommendation {
    id: string;
    icon: 'path' | 'article' | 'weak' | 'review';
    title: string;
    subtitle: string;
    link: string;
}

const ICONS = {
    path: { Icon: Map, bg: 'bg-indigo-500' },
    article: { Icon: BookOpen, bg: 'bg-sky-500' },
    weak: { Icon: Target, bg: 'bg-rose-500' },
    review: { Icon: RefreshCw, bg: 'bg-emerald-500' },
};

export const ContinueSection = ({ items }: { items: Recommendation[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-3">
                Fortsett der du slapp
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
                {items.map((item) => {
                    const { Icon, bg } = ICONS[item.icon];
                    return (
                        <Link
                            key={item.id}
                            to={item.link}
                            className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 hover:border-indigo-200 hover:shadow-md transition-all no-underline"
                        >
                            <span
                                className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                            >
                                <Icon className="w-[18px] h-[18px]" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-slate-900 truncate">
                                    {item.title}
                                </span>
                                <span className="block text-xs text-slate-500 truncate">
                                    {item.subtitle}
                                </span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
