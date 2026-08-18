import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Columns3, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useComparisonManifest } from '../../features/comparison/manifest';
import { compareHref, profileHref, topicHref } from '../../features/religion-nav/links';
import { getDimension } from './dimensionMeta';
import { BAND } from './surfaces';

interface ReligionNextStepsProps {
    /** Flaten båndet står på - styrer hvilke veier som er verdt å tilby */
    surface: 'sammenlign' | 'tema';
    dim: string;
    /** Tema-siden: temaet eleven står i */
    topicSlug?: string;
    /** Sammenligningen: religionene som er valgt akkurat nå */
    selectedIds?: string[];
}

/**
 * «Videre herfra» for sammenlignings- og temasidene.
 *
 * Religionsartiklene har hatt et slikt bånd siden krysslenkingen kom
 * (ReligionCrossLinks), men sammenligningen og temasidene endte blindt: eleven
 * kom dit, gjorde oppgaven, og hadde ingen dør videre. Dette lukker runddansen
 * hub -> profil -> artikkel -> tema -> sammenlign -> hub.
 */
export const ReligionNextSteps: React.FC<ReligionNextStepsProps> = ({
    surface,
    dim,
    topicSlug,
    selectedIds = [],
}) => {
    const { data } = useComparisonManifest();
    if (!data) return null;

    const dimension = getDimension(dim);
    const accent = dimension?.color ?? '#6366f1';
    const religions = data.religions;
    const nameOf = (id: string) => religions.find((r) => r.id === id)?.name ?? id;
    const colorOf = (id: string) => religions.find((r) => r.id === id)?.color ?? '#94a3b8';

    // Stier som hører til enten linsen eller temaet eleven står i
    const paths = data.learningPaths.filter((path) =>
        surface === 'tema' && topicSlug
            ? path.topics.includes(topicSlug)
            : path.dimension === dim
    );

    const topics = data.topics.filter((t) => t.slug !== topicSlug).slice(0, 8);

    return (
        <section
            aria-label="Videre herfra"
            className={`${BAND} p-5 md:p-6 space-y-5 mt-8`}
        >
            <h2 className="font-bold text-xl text-slate-900">Videre herfra</h2>

            {/* 1. Inn i profilene til dem som er på skjermen */}
            {selectedIds.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Hele profilen, én religion om gangen
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedIds.map((id) => (
                            <Link
                                key={id}
                                to={profileHref(id, { dim, visning: 'profil' })}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <span
                                    aria-hidden
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: colorOf(id) }}
                                />
                                {nameOf(id)}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Temaer på tvers */}
            {topics.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Samme spørsmål, andre temaer
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {topics.map((topic) => (
                            <Link
                                key={topic.slug}
                                to={topicHref(topic.slug, { dim })}
                                className="px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                                {topic.short ?? topic.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Stien som tar eleven gjennom det samme i rekkefølge */}
            {paths.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Ta det som en sti i stedet
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {paths.map((path) => (
                            <Link
                                key={path.id}
                                to={path.link}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <MapIcon size={16} className="text-emerald-600" />
                                {path.title}
                                <span className="text-[11px] font-medium text-slate-400">
                                    {path.steps} steg
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. De to andre flatene */}
            <div className="flex flex-wrap gap-2 pt-1">
                <Link
                    to={`/krle/religion?dim=${dim}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                    <Compass size={16} style={{ color: accent }} />
                    Tilbake til religionsrommet
                </Link>
                {surface === 'tema' ? (
                    <Link
                        to={compareHref(selectedIds, dim)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                        <Columns3 size={16} style={{ color: accent }} />
                        Sammenlign side ved side
                    </Link>
                ) : (
                    topicSlug === undefined && (
                        <Link
                            to={`/krle/religion?dim=${dim}#temaer`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                        >
                            <LayoutGrid size={16} style={{ color: accent }} />
                            Se hele innholdskartet
                        </Link>
                    )
                )}
            </div>
        </section>
    );
};
