import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { PageSkeleton } from '../../components/Skeleton';
import { useComparisonManifest } from './manifest';
import { EntityPicker } from './EntityPicker';
import { ComparisonCell } from './ComparisonCell';
import { ComparisonTasks } from './ComparisonTasks';
import type { ComparisonDomainConfig, ComparisonEntity, ManifestEntity } from './types';

interface ComparisonPageProps {
    config: ComparisonDomainConfig;
    // Ekstra innhold mellom intro og velger (f.eks. tema-chips for religion)
    headerExtra?: React.ReactNode;
}

const GRID_BY_COUNT: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ config, headerExtra }) => {
    const manifestQuery = useComparisonManifest();
    const [searchParams, setSearchParams] = useSearchParams();

    const availableEntities: ManifestEntity[] = useMemo(() => {
        const list = manifestQuery.data?.[config.manifestKey] ?? [];
        // Kun entiteter som faktisk har dimensjonsdata kan sammenlignes
        return list.filter((e) => Object.keys(e.dimensions).length > 0);
    }, [manifestQuery.data, config.manifestKey]);

    const availableIds = useMemo(
        () => new Set(availableEntities.map((e) => e.id)),
        [availableEntities]
    );

    const selected: string[] = useMemo(() => {
        const fromUrl = (searchParams.get('velg') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((id) => availableIds.has(id));
        // Tom URL -> hele standardutvalget. Ellers: fyll opp til minimum,
        // slik at ?velg=<én filosof> (f.eks. fra Odyssey) også fungerer.
        if (fromUrl.length === 0) {
            return config.defaultSelected
                .filter((id) => availableIds.has(id))
                .slice(0, config.maxSelected);
        }
        const base = [...fromUrl];
        for (const id of config.defaultSelected) {
            if (base.length >= config.minSelected) break;
            if (availableIds.has(id) && !base.includes(id)) base.push(id);
        }
        return base.slice(0, config.maxSelected);
    }, [searchParams, availableIds, config]);

    const toggleEntity = useCallback(
        (id: string) => {
            const next = selected.includes(id)
                ? selected.filter((s) => s !== id)
                : [...selected, id];
            setSearchParams(
                (params) => {
                    params.set('velg', next.join(','));
                    return params;
                },
                { replace: true }
            );
        },
        [selected, setSearchParams]
    );

    const entityQueries = useQueries({
        queries: selected.map((id) => ({
            queryKey: ['comparison-entity', config.domain, id],
            queryFn: () => config.fetchEntity(id),
            staleTime: Infinity,
        })),
    });

    const entities = entityQueries
        .map((q) => q.data)
        .filter((e): e is ComparisonEntity => Boolean(e));
    const entitiesLoading = entityQueries.some((q) => q.isLoading);

    // --- Dimensjonsfaner med piltastnavigasjon ---
    // ?dim=<nøkkel> lar andre sider (f.eks. religionsprofilen) lenke rett inn
    // på én dimensjon. Leses kun ved oppstart; etterpå eier fanene tilstanden.
    const [activeDimKey, setActiveDimKey] = useState(() => {
        const fromUrl = searchParams.get('dim');
        return config.dimensions.some((d) => d.key === fromUrl)
            ? (fromUrl as string)
            : config.dimensions[0].key;
    });
    const activeDim =
        config.dimensions.find((d) => d.key === activeDimKey) ?? config.dimensions[0];
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const onTablistKeyDown = (event: React.KeyboardEvent) => {
        const currentIndex = config.dimensions.findIndex((d) => d.key === activeDimKey);
        let nextIndex = -1;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % config.dimensions.length;
        if (event.key === 'ArrowLeft')
            nextIndex = (currentIndex - 1 + config.dimensions.length) % config.dimensions.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = config.dimensions.length - 1;
        if (nextIndex >= 0) {
            event.preventDefault();
            setActiveDimKey(config.dimensions[nextIndex].key);
            tabRefs.current[nextIndex]?.focus();
        }
    };

    if (manifestQuery.isLoading) return <PageSkeleton />;

    if (manifestQuery.isError || availableEntities.length === 0) {
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

    const gridClass = GRID_BY_COUNT[Math.min(Math.max(entities.length, 2), 4)];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <Link
                    to="/krle"
                    className="text-sm text-text-muted hover:text-text-main mb-4 inline-block"
                >
                    ← Tilbake til oversikt
                </Link>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-text-main mb-4">
                    {config.title}
                </h1>
                <p className="text-lg text-text-muted max-w-2xl mx-auto mb-6">{config.intro}</p>
                {headerExtra}
            </motion.div>

            {/* Velger */}
            <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-bg-main/85 backdrop-blur border-b border-border-main mb-6">
                <EntityPicker
                    entities={availableEntities}
                    selected={selected}
                    onToggle={toggleEntity}
                    maxSelected={config.maxSelected}
                    minSelected={config.minSelected}
                />
            </div>

            {/* Dimensjonsfaner */}
            <div
                role="tablist"
                aria-label="Velg dimensjon"
                onKeyDown={onTablistKeyDown}
                className="flex flex-wrap gap-2 justify-center mb-8"
            >
                {config.dimensions.map((dim, index) => (
                    <button
                        key={dim.key}
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        role="tab"
                        aria-selected={activeDimKey === dim.key}
                        tabIndex={activeDimKey === dim.key ? 0 : -1}
                        onClick={() => setActiveDimKey(dim.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            activeDimKey === dim.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                : 'bg-bg-card border border-border-main text-text-muted hover:text-text-main hover:border-indigo-500/50'
                        }`}
                    >
                        {dim.label}
                    </button>
                ))}
            </div>

            {/* Sammenligningskort */}
            {entitiesLoading ? (
                <div className={`grid ${gridClass} gap-4 md:gap-6 mb-8`}>
                    {selected.map((id) => (
                        <div
                            key={id}
                            className="h-64 rounded-2xl bg-bg-card border border-border-main animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <motion.div layout className={`grid ${gridClass} gap-4 md:gap-6 mb-8`}>
                    <AnimatePresence mode="popLayout">
                        {entities.map((entity) => (
                            <motion.article
                                key={entity.id}
                                layout
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                className="bg-bg-card border border-border-main rounded-2xl overflow-hidden flex flex-col shadow-sm"
                            >
                                <div
                                    className="p-4 border-b border-border-main flex items-center gap-3"
                                    style={{
                                        borderTop: `4px solid ${entity.color || '#6366f1'}`,
                                    }}
                                >
                                    <h3 className="font-display font-bold text-lg text-text-main">
                                        {entity.name}
                                    </h3>
                                </div>
                                <ComparisonCell
                                    content={entity.dimensions[activeDim.key]}
                                    compact={entities.length === 4}
                                    articleLinks={
                                        config.articleLinks && manifestQuery.data
                                            ? config.articleLinks(
                                                  manifestQuery.data,
                                                  entity.id,
                                                  activeDim.key
                                              )
                                            : undefined
                                    }
                                    detailLink={config.detailLink(entity.id)}
                                    detailLabel={`Les mer om ${entity.name}`}
                                />
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Aktivt læringslag */}
            {!entitiesLoading && entities.length >= 2 && (
                <ComparisonTasks
                    // Remount ved dimensjons-/utvalgsbytte nullstiller runde og oppgaver
                    key={`${activeDim.key}:${entities.map((e) => e.id).join(',')}`}
                    config={config}
                    dimension={activeDim}
                    entities={entities}
                />
            )}
        </div>
    );
};
