import React, { useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { PageSkeleton } from '../../components/Skeleton';
import { useComparisonManifest, fetchJsonAsset } from './manifest';
import { EntityPicker } from './EntityPicker';
import { ComparisonMatrix } from './ComparisonMatrix';
import { ComparisonCell } from './ComparisonCell';
import { ComparisonTasks } from './ComparisonTasks';
import { readStoredLens, storeLens } from '../religion-nav/links';
import type {
    ComparisonDomainConfig,
    ComparisonEntity,
    ComparisonMatrixData,
    ManifestEntity,
} from './types';

interface ComparisonPageProps {
    config: ComparisonDomainConfig;
    // Ekstra innhold nederst på siden (f.eks. tema-chips for religion)
    footerExtra?: React.ReactNode;
}

const GRID_BY_COUNT: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ config, footerExtra }) => {
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
    // ?dim=<nøkkel> er fasit så lenge siden står åpen: andre sider lenker rett
    // inn på én dimensjon, og fanebytte skrives tilbake til URL-en slik at
    // lenken eleven deler eller bokmerker beholder linsen.
    const activeDimKey = useMemo(() => {
        const fromUrl = searchParams.get('dim');
        if (config.dimensions.some((d) => d.key === fromUrl)) return fromUrl as string;
        // Kom eleven hit uten `dim`, arves linsen fra forrige side i økta.
        const stored = config.domain === 'religion' ? readStoredLens() : null;
        if (stored && config.dimensions.some((d) => d.key === stored)) return stored;
        return config.dimensions[0].key;
    }, [searchParams, config]);

    const setActiveDimKey = useCallback(
        (key: string) => {
            storeLens(key);
            setSearchParams(
                (params) => {
                    params.set('dim', key);
                    return params;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );
    const activeDim =
        config.dimensions.find((d) => d.key === activeDimKey) ?? config.dimensions[0];
    const accent = activeDim.color ?? '#6366f1';
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

    // --- Sammenligningsmatrisen ---
    const { data: matrix } = useQuery({
        queryKey: ['comparison-matrix', config.domain],
        queryFn: () =>
            config.matrixUrl
                ? fetchJsonAsset<ComparisonMatrixData>(config.matrixUrl)
                : Promise.resolve(null),
        staleTime: Infinity,
    });
    const matrixRows = matrix?.dimensions?.[activeDim.key] ?? [];

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
    const ActiveIcon = activeDim.icon;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-center"
            >
                <Link
                    to="/krle"
                    className="text-sm text-text-muted hover:text-text-main mb-1 inline-block"
                >
                    ← Tilbake til oversikt
                </Link>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-2">
                    {config.title}
                </h1>
                <p className="text-text-muted max-w-2xl mx-auto">{config.intro}</p>
            </motion.div>

            {/* Velger + dimensjonsfaner i én sticky rad */}
            <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-bg-main/90 backdrop-blur border-b border-border-main mb-6 space-y-3">
                <EntityPicker
                    entities={availableEntities}
                    selected={selected}
                    onToggle={toggleEntity}
                    maxSelected={config.maxSelected}
                    minSelected={config.minSelected}
                />

                <div
                    role="tablist"
                    aria-label="Velg dimensjon"
                    onKeyDown={onTablistKeyDown}
                    className="flex flex-wrap gap-1.5 justify-center"
                >
                    {config.dimensions.map((dim, index) => {
                        const isActive = activeDimKey === dim.key;
                        const Icon = dim.icon;
                        const color = dim.color ?? '#6366f1';
                        return (
                            <button
                                key={dim.key}
                                ref={(el) => {
                                    tabRefs.current[index] = el;
                                }}
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActiveDimKey(dim.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold border transition-all ${
                                    isActive ? 'text-white shadow-md' : 'text-text-muted bg-bg-card'
                                }`}
                                style={{
                                    backgroundColor: isActive ? color : undefined,
                                    borderColor: isActive ? color : `${color}44`,
                                }}
                            >
                                {Icon && (
                                    <Icon
                                        size={15}
                                        style={{ color: isActive ? '#ffffff' : color }}
                                    />
                                )}
                                {dim.short ?? dim.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Spørsmålet dimensjonen stiller */}
            <div className="mb-5 text-center">
                {/* Fagbegrepet står over spørsmålet. Har dimensjonen ikke fått
                    et spørsmål (filosofi), er label alene nok. */}
                {activeDim.question && (
                    <p
                        className="text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: accent }}
                    >
                        {ActiveIcon && (
                            <ActiveIcon size={14} className="inline-block mr-1 -mt-0.5" />
                        )}
                        {activeDim.label}
                    </p>
                )}
                <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main">
                    {activeDim.question ?? activeDim.label}
                </h2>
            </div>

            {!entitiesLoading && matrixRows.length > 0 && (
                <ComparisonMatrix rows={matrixRows} entities={entities} />
            )}

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
                                    className="p-4 border-b border-border-main flex items-center gap-2"
                                    style={{
                                        borderTop: `4px solid ${entity.color || '#6366f1'}`,
                                    }}
                                >
                                    {/* Navnet er alltid veien inn til profilen, med linsen i behold */}
                                    <Link
                                        to={`${config.detailLink(entity.id)}?dim=${activeDim.key}`}
                                        className="font-display font-bold text-lg text-text-main hover:underline decoration-2 underline-offset-2"
                                        style={{ textDecorationColor: entity.color || '#6366f1' }}
                                    >
                                        {entity.name}
                                    </Link>
                                    {entities.length > config.minSelected && (
                                        <button
                                            type="button"
                                            onClick={() => toggleEntity(entity.id)}
                                            aria-label={`Fjern ${entity.name} fra sammenligningen`}
                                            title={`Fjern ${entity.name}`}
                                            className="ml-auto p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-black/5 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <ComparisonCell
                                    content={entity.dimensions[activeDim.key]}
                                    card={entity.cards?.[activeDim.key]}
                                    accent={entity.color || '#6366f1'}
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
                                    detailLink={`${config.detailLink(entity.id)}?dim=${activeDim.key}`}
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
                    matrixRows={matrixRows}
                />
            )}

            {footerExtra}
        </div>
    );
};
