// «Anbefalt for deg» - en variert, begrunnet liste med neste steg på tvers av
// alle innholdstyper (artikler, stier, quizer, spill, detektiv, tidsreiser og
// repetisjon). Første kort er «featured» med stort bilde; resten er kompakte
// kort med thumbnail (Chromebook 1366x768). Alt er spring-animert.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Bookmark,
    ChevronRight,
    Clock,
    Gamepad2,
    HelpCircle,
    Hourglass,
    Map,
    RefreshCw,
    Search,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { Image as LazyImage } from '../../../components/Image';
import type { Recommendation, RecommendationType } from '../recommendations/engine';

const TYPE_STYLE: Record<
    RecommendationType,
    { Icon: typeof BookOpen; bg: string; label: string; chip: string }
> = {
    path: { Icon: Map, bg: 'bg-indigo-500', label: 'Læringssti', chip: 'bg-indigo-50 text-indigo-700' },
    article: { Icon: BookOpen, bg: 'bg-sky-500', label: 'Artikkel', chip: 'bg-sky-50 text-sky-700' },
    finish: { Icon: Trophy, bg: 'bg-emerald-500', label: 'Fullfør emnet', chip: 'bg-emerald-50 text-emerald-700' },
    quiz: { Icon: HelpCircle, bg: 'bg-rose-500', label: 'Quiz', chip: 'bg-rose-50 text-rose-700' },
    game: { Icon: Gamepad2, bg: 'bg-violet-500', label: 'Spill', chip: 'bg-violet-50 text-violet-700' },
    detective: { Icon: Search, bg: 'bg-amber-500', label: 'Detektiv', chip: 'bg-amber-50 text-amber-700' },
    scenario: { Icon: Hourglass, bg: 'bg-teal-500', label: 'Tidsreise', chip: 'bg-teal-50 text-teal-700' },
    discovery: { Icon: Sparkles, bg: 'bg-fuchsia-500', label: 'Oppdag', chip: 'bg-fuchsia-50 text-fuchsia-700' },
    review: { Icon: RefreshCw, bg: 'bg-emerald-500', label: 'Repetisjon', chip: 'bg-emerald-50 text-emerald-700' },
    recent: { Icon: Clock, bg: 'bg-slate-500', label: 'Nylig lest', chip: 'bg-slate-50 text-slate-700' },
    started: { Icon: Bookmark, bg: 'bg-orange-500', label: 'Påbegynt', chip: 'bg-orange-50 text-orange-700' },
};

const spring = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 320, damping: 26, delay },
});

// Stort kort med bilde i toppen - det mest fristende neste steget.
const FeaturedCard = ({ item }: { item: Recommendation }) => {
    const { Icon, bg, label } = TYPE_STYLE[item.type];
    return (
        <motion.div {...spring(0)}>
            <Link
                to={item.link}
                className="group relative block h-32 overflow-hidden rounded-xl no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
                {item.image ? (
                    <LazyImage
                        src={item.image}
                        alt=""
                        seed={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <span className={`absolute inset-0 ${bg} opacity-90`} />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 backdrop-blur">
                    <Icon className="h-3 w-3" />
                    {label}
                </span>
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3.5">
                    <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-bold text-white">
                            {item.title}
                        </span>
                        <span className="block text-xs leading-snug text-slate-200 line-clamp-1">
                            {item.reason}
                        </span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90 text-indigo-600 transition-transform group-hover:translate-x-0.5">
                        <ChevronRight className="h-4 w-4" />
                    </span>
                </span>
            </Link>
        </motion.div>
    );
};

// Kompakt kort med thumbnail til venstre (ikonrute når bilde mangler).
// Eksportert for gjenbruk i andre lister (f.eks. ArticleListSection).
export const SmallCard = ({ item, delay }: { item: Recommendation; delay: number }) => {
    const { Icon, bg, label, chip } = TYPE_STYLE[item.type];
    return (
        <motion.div {...spring(delay)}>
            <Link
                to={item.link}
                className="group flex h-full items-center gap-3 overflow-hidden rounded-xl border border-slate-100 p-2 pr-3 no-underline transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
                {item.image ? (
                    <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <LazyImage
                            src={item.image}
                            alt=""
                            seed={item.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </span>
                ) : (
                    <span
                        className={`flex h-14 w-16 shrink-0 items-center justify-center rounded-lg ${bg} text-white transition-transform group-hover:scale-105`}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span
                        className={`mb-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${chip}`}
                    >
                        {label}
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-900">
                        {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500 line-clamp-1">
                        {item.reason}
                    </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>
        </motion.div>
    );
};

export const RecommendationsSection = ({ items }: { items: Recommendation[] }) => {
    if (items.length === 0) return null;
    const [featured, ...rest] = items;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-1">Anbefalt for deg</h2>
            <p className="text-xs text-slate-500 mb-3">
                Neste steg og nye oppdagelser, valgt ut fra hva du liker og hvor du er nå.
            </p>
            <div className="space-y-2">
                <FeaturedCard item={featured} />
                {rest.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {rest.map((item, i) => (
                            <SmallCard key={item.id} item={item} delay={(i + 1) * 0.04} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
