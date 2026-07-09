import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { PageSkeleton } from '../components/Skeleton';
import { ArticleContent } from '../components/ArticleContent';
import { useComparisonManifest, fetchJsonAsset } from '../features/comparison/manifest';
import { normalizeTagSlug } from '../utils/slug';

export const TopicComparisonPage: React.FC = () => {
    const { tag } = useParams<{ tag: string }>();
    const manifestQuery = useComparisonManifest();

    // Manifestet er kilden til sannhet: det lister nøyaktig hvilke artikler
    // som finnes for temaet (ingen blind fetching mot gjettede mappenavn)
    const topic = useMemo(() => {
        if (!tag || !manifestQuery.data) return null;
        const slug = normalizeTagSlug(tag);
        return manifestQuery.data.topics.find((t) => t.slug === slug) ?? null;
    }, [tag, manifestQuery.data]);

    const religionMeta = useMemo(() => {
        const map = new Map<string, { name: string; color: string | null }>();
        for (const religion of manifestQuery.data?.religions ?? []) {
            map.set(religion.id, { name: religion.name, color: religion.color });
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

    const articles = (topic?.entries ?? [])
        .map((entry, index) => ({ entry, data: articleQueries[index]?.data }))
        .filter((a) => a.data);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <Link
                    to="/krle/sammenlign"
                    className="text-sm text-text-muted hover:text-text-main mb-4 inline-block"
                >
                    ← Tilbake til oversikt
                </Link>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-text-main mb-6">
                    {topic?.label ?? tag}
                </h1>
                {topic && (
                    <p className="text-xl text-text-muted max-w-2xl mx-auto">
                        Slik behandler {topic.count} av {topic.total} religioner dette temaet.
                    </p>
                )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(({ entry, data }) => {
                    const meta = religionMeta.get(entry.religion);
                    return (
                        <motion.div
                            key={entry.file}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-bg-card border border-border-main rounded-2xl overflow-hidden flex flex-col shadow-sm"
                        >
                            <div
                                className="p-4 border-b border-border-main bg-bg-subtle flex items-center gap-3"
                                style={{
                                    borderLeft: meta?.color
                                        ? `4px solid ${meta.color}`
                                        : undefined,
                                }}
                            >
                                <h3 className="font-display font-bold text-lg text-text-main capitalize">
                                    {meta?.name ?? entry.religion}
                                </h3>
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
