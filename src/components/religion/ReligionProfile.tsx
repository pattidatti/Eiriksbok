import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Columns3, PartyPopper } from 'lucide-react';
import { DimensionWheel } from './DimensionWheel';
import { DimensionPanel, type DimensionArticleLink } from './DimensionPanel';
import { DIMENSIONS, getDimension, type DimensionKey } from './dimensionMeta';
import { useComparisonManifest } from '../../features/comparison/manifest';
import { resolveLens, storeLens, compareHref } from '../../features/religion-nav/links';
import { loadVisitedDimensions, saveVisitedDimensions } from '../../features/religion-nav/progress';
import { bestTopicForLink } from '../../features/religion-nav/topics';
import { useProgressStore } from '../../features/progress/useProgressStore';
import { celebrateCompletion } from '../ui/answerFeedback';
import { normalizeDimension } from '../../utils/religionDimensions';
import type { Religion } from '../../types';
import { GLASS_PANEL } from './surfaces';

interface ReligionProfileProps {
    religion: Religion;
}

export const ReligionProfile: React.FC<ReligionProfileProps> = ({ religion }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const manifestQuery = useComparisonManifest();
    const color = religion.color || '#6366f1';

    // Linsen kommer fra URL-en, ellers fra forrige side i økta
    const selected = resolveLens(searchParams.get('dim'));
    const dimension = getDimension(selected)!;

    const entries = useMemo(() => {
        const map = new Map<DimensionKey, ReturnType<typeof normalizeDimension>>();
        for (const dim of DIMENSIONS) {
            map.set(dim.key, normalizeDimension(religion.dimensions[dim.key]));
        }
        return map;
    }, [religion]);

    const available = useMemo(() => {
        const keys = DIMENSIONS.filter((dim) => {
            const entry = entries.get(dim.key);
            return Boolean(entry && (entry.body || entry.summary));
        }).map((dim) => dim.key);
        return new Set(keys);
    }, [entries]);

    // «Lest»-tilstanden justeres under render i stedet for i en effect, slik at
    // hjulet aldri vises ett bilde med feil antall. Bytter eleven religion,
    // hentes settet for den nye religionen fra localStorage.
    const [store, setStore] = useState(() => ({
        id: religion.id,
        visited: loadVisitedDimensions(religion.id),
    }));
    let visited = store.id === religion.id ? store.visited : loadVisitedDimensions(religion.id);
    if (!visited.has(selected)) {
        visited = new Set(visited);
        visited.add(selected);
    }
    if (visited !== store.visited || store.id !== religion.id) {
        setStore({ id: religion.id, visited });
    }

    useEffect(() => {
        saveVisitedDimensions(religion.id, visited);
    }, [religion.id, visited]);

    // Alle sju lest = profilen er fullført. Registreres én gang per økt;
    // recordActivity holder selv styr på om XP alt er gitt.
    const rewarded = useRef<string | null>(null);
    const countBefore = useRef<number | null>(null);
    const complete = visited.size === DIMENSIONS.length;
    const allReligionIds = useMemo(
        () => (manifestQuery.data?.religions ?? []).map((r) => r.id),
        [manifestQuery.data]
    );
    useEffect(() => {
        const before = countBefore.current;
        countBefore.current = visited.size;
        if (!complete || rewarded.current === religion.id) return;
        rewarded.current = religion.id;
        useProgressStore.getState().recordActivity({
            kind: 'article-read',
            activityId: `krle/religion/${religion.id}/profil`,
            subjectId: 'krle',
            topicId: 'religion',
            title: `Religionsprofil: ${religion.name}`,
        });

        // Var dette den siste profilen som manglet, er hele religionsrommet
        // gjennomgått. Det er en større ting enn én profil, og fortjener sin
        // egen registrering.
        const allDone =
            allReligionIds.length > 0 &&
            allReligionIds.every((id) =>
                id === religion.id ? true : loadVisitedDimensions(id).size >= DIMENSIONS.length
            );
        if (allDone) {
            useProgressStore.getState().recordActivity({
                kind: 'article-read',
                activityId: 'krle/religion/alle-profiler',
                subjectId: 'krle',
                topicId: 'religion',
                title: 'Alle religionsprofilene gjennomgått',
            });
        }

        // Konfetti bare når den siste dimensjonen åpnes her og nå - ikke hver
        // gang eleven kommer tilbake til en profil som alt er fullført.
        if (before !== null && before < DIMENSIONS.length) celebrateCompletion();
    }, [complete, visited.size, religion.id, religion.name, allReligionIds]);

    const articles: DimensionArticleLink[] = useMemo(() => {
        const all = manifestQuery.data?.religionArticles ?? [];
        const topics = manifestQuery.data?.topics;
        return all
            .filter((a) => a.religion === religion.id && a.dimension === selected)
            .slice(0, 3)
            .map((a) => {
                // Temaet gir eleven veien til de andre religionenes artikkel
                // om det samme
                const topic = bestTopicForLink(topics, a.link);
                return {
                    title: a.title,
                    link: a.link,
                    topicSlug: topic?.slug,
                    topicLabel: topic?.label,
                };
            });
    }, [manifestQuery.data, religion.id, selected]);

    const handleSelect = (key: DimensionKey) => {
        storeLens(key);
        setSearchParams(
            (params) => {
                params.set('dim', key);
                return params;
            },
            { replace: true }
        );
    };

    return (
        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">
            <div className="lg:sticky lg:top-24 space-y-4">
                <DimensionWheel
                    religionName={religion.name}
                    color={color}
                    selected={selected}
                    visited={visited}
                    available={available}
                    onSelect={handleSelect}
                />

                <div className={`${GLASS_PANEL} p-4 text-center`}>
                    <p className="text-sm text-slate-600 leading-relaxed">{dimension.blurb}</p>
                </div>

                <AnimatePresence>
                    {complete && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl border p-4 space-y-3"
                            style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}
                        >
                            <div className="flex gap-3 items-start">
                                <PartyPopper size={20} style={{ color }} className="flex-shrink-0" />
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    Du har vært innom alle sju sidene av{' '}
                                    {religion.name.toLowerCase()}. Nå kan du sammenligne dem med en
                                    annen religion.
                                </p>
                            </div>
                            <Link
                                to={compareHref([religion.id], selected)}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all"
                                style={{ backgroundColor: color }}
                            >
                                <Columns3 size={16} />
                                Ta med {religion.name} inn i sammenligningen
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-xs text-slate-400 leading-relaxed px-1">
                    De sju dimensjonene er en måte religionsforskeren Ninian Smart fant på for å
                    beskrive alle religioner med de samme spørsmålene. Klikk deg gjennom hele
                    hjulet.
                </p>
            </div>

            <AnimatePresence mode="wait">
                <DimensionPanel
                    key={selected}
                    dimension={dimension}
                    entry={entries.get(selected) ?? null}
                    religionId={religion.id}
                    religionName={religion.name}
                    articles={articles}
                />
            </AnimatePresence>
        </div>
    );
};
