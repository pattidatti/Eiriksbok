import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Columns3, LayoutGrid, Map as MapIcon, Sparkles } from 'lucide-react';
import { useManifest } from '../hooks/useManifest';
import { usePageTitle } from '../hooks/usePageTitle';
import { PageSkeleton } from '../components/Skeleton';
import { ReligionShellHeader } from '../components/religion/ReligionShellHeader';
import { ReligionTopicMap } from '../components/religion/ReligionTopicMap';
import { MiniWheel } from '../components/religion/MiniWheel';
import { DIMENSIONS, getDimension } from '../components/religion/dimensionMeta';
import { useComparisonManifest } from '../features/comparison/manifest';
import { compareHref, profileHref, topicHref, useLens } from '../features/religion-nav/links';
import {
    loadVisitedDimensions,
    loadVisitedTopics,
    religionProgress,
} from '../features/religion-nav/progress';
import { BAND, GLASS_CARD } from '../components/religion/surfaces';

/**
 * Religionsrommet - landingssiden for KRLE sitt største emne.
 *
 * Før dette var /krle/religion en naken emneside med elleve kort: ingen vei til
 * sammenligningen, ingen temaer, intet innholdskart, og ingen antydning om at
 * hver religion har en profil med sju sider. Nå er det ett rom med én linse:
 * eleven velger et spørsmål øverst, og alle religionene svarer på det samtidig.
 */
export const ReligionHubPage: React.FC = () => {
    const { data: manifest, isLoading } = useManifest();
    const { data: comparison } = useComparisonManifest();
    const { dim } = useLens();
    const location = useLocation();
    const [mapOpen, setMapOpen] = useState(false);
    usePageTitle('Verdensreligioner');

    const dimension = getDimension(dim) ?? DIMENSIONS[0];

    const subTopics = useMemo(
        () =>
            manifest?.subjects
                .find((s) => s.id === 'krle')
                ?.topics.find((t) => t.id === 'religion')?.subTopics ?? [],
        [manifest]
    );

    // Fremdriften leses på nytt ved hver navigasjon, slik at ringene har vokst
    // når eleven kommer tilbake fra en profil hen nettopp leste.
    const religions = useMemo(() => {
        const profiles = new Map((comparison?.religions ?? []).map((r) => [r.id, r] as const));
        const rows = subTopics.map((st) => {
            const profile = profiles.get(st.id);
            const lessonsTotal = st.lessons?.length ?? 0;
            return {
                id: st.id,
                // Manifestet skriver navnet slik eleven skal lese det («Bahá'í»)
                name: st.title || profile?.name || st.id,
                description: st.description,
                color: profile?.color || '#94a3b8',
                hasProfile: Boolean(profile),
                summary: profile?.summaries?.[dimension.key] ?? null,
                visited: loadVisitedDimensions(st.id),
                progress: religionProgress(st.id, lessonsTotal),
                lessonsTotal,
            };
        });
        return [...rows.filter((r) => r.hasProfile), ...rows.filter((r) => !r.hasProfile)];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subTopics, comparison, dimension.key, location.key]);

    // location.key er med med vilje: localStorage er ikke reaktiv, så listen
    // må leses på nytt hver gang eleven navigerer tilbake hit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const visitedTopics = useMemo(() => loadVisitedTopics(), [location.key]);

    const overview = useMemo(() => {
        const withProfile = religions.filter((r) => r.hasProfile);
        return {
            dimensionsRead: withProfile.reduce((sum, r) => sum + r.progress.dimensionsRead, 0),
            dimensionsTotal: withProfile.length * DIMENSIONS.length,
            profilesDone: withProfile.filter((r) => r.progress.profileComplete).length,
            profilesTotal: withProfile.length,
            topicsSeen: visitedTopics.size,
            topicsTotal: comparison?.topics.length ?? 0,
        };
    }, [religions, visitedTopics, comparison]);

    if (isLoading) return <PageSkeleton />;

    const topics = comparison?.topics ?? [];
    const paths = comparison?.learningPaths ?? [];

    return (
        <div className="max-w-7xl mx-auto px-6 py-6">
            <ReligionShellHeader
                eyebrow="KRLE"
                title="Verdensreligioner"
                subtitle="Sju spørsmål. Elleve svar. Velg et spørsmål, så svarer alle religionene på det samtidig."
                surface="hub"
            />

            {/* Religionsrutenettet. Kortene snur innhold når linsen endres. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {religions.map((religion, index) => (
                    <motion.div
                        key={religion.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.24) }}
                    >
                        <Link
                            to={
                                religion.hasProfile
                                    ? profileHref(religion.id, { dim: dimension.key, visning: 'profil' })
                                    : profileHref(religion.id, { visning: 'leksjoner' })
                            }
                            className={`group h-full flex flex-col ${GLASS_CARD} p-4 hover:shadow-md hover:border-white transition-all`}
                            style={{ borderTop: `4px solid ${religion.color}` }}
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-bold text-lg text-slate-900 leading-tight truncate">
                                        {religion.name}
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {religion.hasProfile
                                            ? `${religion.progress.dimensionsRead}/${DIMENSIONS.length} sider · ${religion.lessonsTotal} leksjoner`
                                            : `${religion.lessonsTotal} leksjoner`}
                                    </p>
                                </div>
                                {religion.hasProfile && (
                                    <MiniWheel
                                        visited={religion.visited}
                                        active={dimension.key}
                                        color={religion.color}
                                    />
                                )}
                            </div>

                            {/* Svaret på linsens spørsmål. Dette er hele poenget
                                med huben: bytt spørsmål, og alle kortene snur. */}
                            <div className="flex-1 min-h-[4.5rem]">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={dimension.key}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                        className="text-sm text-slate-600 leading-snug line-clamp-4"
                                    >
                                        {religion.summary ??
                                            religion.description ??
                                            'Ingen profil ennå - men leksjonene ligger her.'}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                {religion.hasProfile ? 'Åpne profilen' : 'Se leksjonene'}
                                <ArrowRight
                                    size={14}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Tre dører videre */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <Link
                    to={compareHref([], dimension.key)}
                    className="group flex items-start gap-3 p-4 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                    <span
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${dimension.color}1a` }}
                    >
                        <Columns3 size={20} style={{ color: dimension.color }} />
                    </span>
                    <span className="min-w-0">
                        <span className="block font-bold text-slate-900">Sammenlign side ved side</span>
                        <span className="block text-sm text-slate-500 leading-snug">
                            Opptil fire religioner samtidig på «{dimension.question.toLowerCase()}»
                        </span>
                    </span>
                </Link>

                <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm" id="temaer">
                    <div className="flex items-center gap-2 mb-2.5">
                        <LayoutGrid size={18} className="text-indigo-600" />
                        <h2 className="font-bold text-slate-900">Temaer på tvers</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {topics.map((topic) => (
                            <Link
                                key={topic.slug}
                                to={topicHref(topic.slug, { dim: dimension.key })}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                                    visitedTopics.has(topic.slug)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                            >
                                {topic.short ?? topic.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                        <MapIcon size={18} className="text-emerald-600" />
                        <h2 className="font-bold text-slate-900">Læringsstier</h2>
                    </div>
                    <ul className="space-y-1.5">
                        {paths.map((path) => (
                            <li key={path.id}>
                                <Link
                                    to={path.link}
                                    className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900"
                                >
                                    <ArrowRight
                                        size={14}
                                        className="text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0"
                                    />
                                    <span className="min-w-0 truncate">{path.title}</span>
                                    <span className="ml-auto text-[11px] font-medium text-slate-400 shrink-0">
                                        {path.steps} steg
                                    </span>
                                </Link>
                            </li>
                        ))}
                        {paths.length === 0 && (
                            <li className="text-sm text-slate-400 italic">Ingen stier ennå.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Din vei gjennom religionene */}
            <div className={`${BAND} p-5 mb-8`}>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-amber-500" />
                    <h2 className="font-bold text-slate-900">Din vei gjennom religionene</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        {
                            label: 'Sider lest',
                            value: `${overview.dimensionsRead} av ${overview.dimensionsTotal}`,
                            ratio: overview.dimensionsTotal
                                ? overview.dimensionsRead / overview.dimensionsTotal
                                : 0,
                            color: '#6366f1',
                        },
                        {
                            label: 'Profiler fullført',
                            value: `${overview.profilesDone} av ${overview.profilesTotal}`,
                            ratio: overview.profilesTotal
                                ? overview.profilesDone / overview.profilesTotal
                                : 0,
                            color: '#10b981',
                        },
                        {
                            label: 'Temaer besøkt',
                            value: `${overview.topicsSeen} av ${overview.topicsTotal}`,
                            ratio: overview.topicsTotal ? overview.topicsSeen / overview.topicsTotal : 0,
                            color: '#f59e0b',
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </p>
                            <p className="text-xl font-bold text-slate-900 mt-0.5 mb-2">{stat.value}</p>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: stat.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round(stat.ratio * 100)}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Innholdskartet: religioner x temaer. Lå før begravet i bunnen av
                sammenligningssiden, men er en orienteringsflate - den hører hjemme her. */}
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                    type="button"
                    onClick={() => setMapOpen((open) => !open)}
                    aria-expanded={mapOpen}
                    className="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                    <LayoutGrid size={18} className="text-slate-400" />
                    <span className="font-bold text-slate-900">Hele innholdskartet</span>
                    <span className="text-sm text-slate-500">
                        alle religioner mot alle temaer
                    </span>
                    <ChevronDown
                        size={18}
                        className={`ml-auto text-slate-400 transition-transform ${mapOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                {mapOpen && (
                    <div className="px-5 pb-5">
                        <ReligionTopicMap />
                    </div>
                )}
            </section>
        </div>
    );
};
