import React, { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { Columns3 } from 'lucide-react';
import { PageSkeleton } from '../components/Skeleton';
import { ArticleContent } from '../components/ArticleContent';
import { useComparisonManifest, fetchJsonAsset } from '../features/comparison/manifest';
import { compareHref, profileHref, topicHref, resolveLens } from '../features/religion-nav/links';
import { getDimension } from '../components/religion/dimensionMeta';
import { normalizeTagSlug } from '../utils/slug';

export const TopicComparisonPage: React.FC = () => {
    const { tag } = useParams<{ tag: string }>();
    const [searchParams] = useSearchParams();
    const manifestQuery = useComparisonManifest();

    // ?fra=<religion> forteller hvor eleven kom fra, så vi kan framheve den
    // religionens kort og tilby veien tilbake
    const fra = searchParams.get('fra');
    const lens = resolveLens(searchParams.get('dim'));

    // Manifestet er kilden til sannhet: det lister nøyaktig hvilke artikler
    // som finnes for temaet (ingen blind fetching mot gjettede mappenavn)
    const topic = useMemo(() => {
        if (!tag || !manifestQuery.data) return null;
        const slug = normalizeTagSlug(tag);
        return (
            manifestQuery.data.topics.find(
                // Sammenslåtte tema (f.eks. /tema/doden) løses til temaet de
                // ble slått sammen med, så gamle lenker ikke dør
                (t) => t.slug === slug || t.aliases?.includes(slug)
            ) ?? null
        );
    }, [tag, manifestQuery.data]);

    const religionMeta = useMemo(() => {
        const map = new Map<string, { name: string; color: string | null }>();
        for (const religion of manifestQuery.data?.religions ?? []) {
            map.set(religion.id, { name: religion.name, color: religion.color });
        }
        return map;
    }, [manifestQuery.data]);

    // Hvilken dimensjon artiklene i dette temaet stort sett hører til. Den
    // styrer hvilken linse «sammenlign»-knappene nederst åpner.
    const topicDimension = useMemo(() => {
        if (!topic || !manifestQuery.data) return null;
        const counts = new Map<string, number>();
        for (const entry of topic.entries) {
            const dim = manifestQuery.data.religionArticles.find(
                (a) => a.link === entry.link
            )?.dimension;
            if (dim) counts.set(dim, (counts.get(dim) ?? 0) + 1);
        }
        const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        return getDimension(best) ?? null;
    }, [topic, manifestQuery.data]);

    const dimensionByLink = useMemo(() => {
        const map = new Map<string, string>();
        for (const article of manifestQuery.data?.religionArticles ?? []) {
            if (article.dimension) map.set(article.link, article.dimension);
        }
        return map;
    }, [manifestQuery.data]);

    const articleQueries = useQueries({
        queries: (topic?.entries ?? []).map((entry) => ({
            queryKey: ['topic-article', entry.file],
            queryFn: () => fetchJsonAsset<Record<string, unknown>>(entry.file),
            staleTime: Infinity,
        })),
    });

    if (manifestQuery.isLoading || (topic && articleQueries.some((q) => q.isLoading))) {
        return <PageSkeleton />;
    }

    if (manifestQuery.isError) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                <h1 className="text-2xl font-display font-bold text-text-main mb-3">
                    Kunne ikke laste sammenligningen
                </h1>
                <p className="text-text-muted mb-6">
                    Noe gikk galt da vi hentet innholdet. Sjekk netttilkoblingen og prøv igjen.
                </p>
                <button
                    type="button"
                    onClick={() => manifestQuery.refetch()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                    Prøv igjen
                </button>
            </div>
        );
    }

    // Religionen eleven kom fra ligger først, så hen kjenner seg igjen med en gang
    const articles = (topic?.entries ?? [])
        .map((entry, index) => ({ entry, data: articleQueries[index]?.data }))
        .filter((a) => a.data)
        .sort((a, b) => Number(b.entry.religion === fra) - Number(a.entry.religion === fra));

    const allTopics = manifestQuery.data?.topics ?? [];
    // Sammenligningen tar maks fire: den eleven kom fra, så de neste i temaet
    const compareIds = [
        ...(fra ? [fra] : []),
        ...(topic?.entries ?? []).map((e) => e.religion).filter((id) => id !== fra),
    ].slice(0, 3);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                    <Link
                        to={compareHref([], lens)}
                        className="text-sm text-text-muted hover:text-text-main"
                    >
                        ← Tilbake til sammenligningen
                    </Link>
                    {fra && religionMeta.has(fra) && (
                        <Link
                            to={profileHref(fra, { dim: lens, visning: 'profil' })}
                            className="text-sm text-text-muted hover:text-text-main"
                        >
                            ← Tilbake til {religionMeta.get(fra)?.name}
                        </Link>
                    )}
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-2">
                    {topic?.label ?? tag}
                </h1>
                {topic && (
                    <p className="text-text-muted mb-4">
                        Slik behandler {topic.count} av {topic.total} religioner dette temaet.
                    </p>
                )}

                {/* Temarailen: hopp rett videre til neste tema uten å gå tilbake */}
                {allTopics.length > 1 && (
                    <nav aria-label="Bytt tema" className="flex flex-wrap gap-2">
                        {allTopics.map((other) => {
                            const isActive = other.slug === topic?.slug;
                            return (
                                <Link
                                    key={other.slug}
                                    to={topicHref(other.slug, {
                                        fra: fra ?? undefined,
                                        dim: lens,
                                    })}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                                        isActive
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-bg-card text-text-muted border-border-main hover:text-text-main hover:border-indigo-400'
                                    }`}
                                >
                                    #{other.label}
                                    <span className="ml-1.5 text-xs opacity-70">
                                        {other.count}/{other.total}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(({ entry, data }) => {
                    const meta = religionMeta.get(entry.religion);
                    const isOrigin = entry.religion === fra;
                    const dim = dimensionByLink.get(entry.link) ?? lens;
                    return (
                        <motion.div
                            key={entry.file}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-bg-card border rounded-2xl overflow-hidden flex flex-col shadow-sm ${
                                isOrigin ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-border-main'
                            }`}
                        >
                            <div
                                className="p-4 border-b border-border-main bg-bg-subtle flex items-center gap-3"
                                style={{
                                    borderLeft: meta?.color ? `4px solid ${meta.color}` : undefined,
                                }}
                            >
                                {/* Religionsnavnet er alltid veien inn til profilen */}
                                <Link
                                    to={profileHref(entry.religion, {
                                        dim,
                                        visning: 'profil',
                                    })}
                                    className="font-display font-bold text-lg text-text-main capitalize hover:underline decoration-2 underline-offset-2"
                                    style={{ textDecorationColor: meta?.color ?? '#6366f1' }}
                                >
                                    {meta?.name ?? entry.religion}
                                </Link>
                                {isOrigin && (
                                    <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                                        Du kom herfra
                                    </span>
                                )}
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <h4 className="text-xl font-bold mb-4 text-text-main">
                                    {entry.title}
                                </h4>
                                <div className="flex-grow prose prose-indigo max-w-none mb-6">
                                    {data && Array.isArray(data.content) ? (
                                        <ArticleContent content={data.content as never} />
                                    ) : (
                                        <p className="text-text-muted italic">
                                            Ingen innhold tilgjengelig.
                                        </p>
                                    )}
                                </div>
                                <div className="mt-auto pt-4 border-t border-border-subtle">
                                    <Link
                                        to={entry.link}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                    >
                                        Gå til full artikkel →
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Utgangen: fra tema tilbake til dimensjonssammenligningen */}
            {topic && compareIds.length >= 2 && (
                <div className="mt-8 pt-6 border-t border-border-main text-center">
                    <Link
                        to={compareHref(compareIds, topicDimension?.key ?? lens)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                    >
                        <Columns3 size={18} />
                        {topicDimension
                            ? `Sammenlign «${topicDimension.question}» side ved side`
                            : 'Sammenlign religionene side ved side'}
                    </Link>
                </div>
            )}

            {(!topic || articles.length === 0) && (
                <div className="text-center text-text-muted py-12 bg-bg-subtle rounded-2xl border border-dashed border-border-main">
                    <p>Ingen artikler funnet for dette temaet.</p>
                    <p className="text-sm mt-2">
                        Gå tilbake til oversikten og velg et av temaene der.
                    </p>
                </div>
            )}
        </div>
    );
};
