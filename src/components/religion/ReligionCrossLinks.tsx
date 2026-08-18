import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Columns3, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useComparisonManifest } from '../../features/comparison/manifest';
import { compareHref, profileHref, topicHref } from '../../features/religion-nav/links';
import { bestTopicForLink } from '../../features/religion-nav/topics';
import { getDimension } from './dimensionMeta';
import { BAND } from './surfaces';

interface ReligionCrossLinksProps {
    /** Artikkelens egen sti, f.eks. /krle/religion/islam/bonn */
    path: string;
}

/**
 * Båndet nederst i en religionsartikkel. Uten det er artikkelen en blindvei:
 * her får eleven tilbake veien til profilen, de andre religionenes artikkel om
 * samme tema, og de to sammenligningene som hører til.
 *
 * Alt hentes fra comparison-manifest.json, så båndet dukker bare opp der det
 * finnes noe å lenke til, og faller pent bort rad for rad når data mangler.
 */
export const ReligionCrossLinks: React.FC<ReligionCrossLinksProps> = ({ path }) => {
    const { data } = useComparisonManifest();

    const resolved = useMemo(() => {
        if (!data) return null;
        const article = data.religionArticles.find((a) => a.link === path) ?? null;
        const topic = bestTopicForLink(data.topics, path);
        // Religionen står i stien selv om artikkelen ikke er tagget
        const religionId = article?.religion ?? path.split('/')[3] ?? '';
        const religion = data.religions.find((r) => r.id === religionId) ?? null;
        // Er artikkelen et steg i en læringssti, skal eleven få vite det -
        // stien tar den samme turen, men i rekkefølge og med oppgaver.
        const inPaths = data.learningPaths
            .map((learningPath) => {
                const step = learningPath.articleLinks.find((a) => a.link === path);
                return step ? { path: learningPath, step } : null;
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);
        return { article, topic, religion, inPaths };
    }, [data, path]);

    if (!resolved?.religion) return null;

    const { article, topic, religion, inPaths } = resolved;
    const dimension = getDimension(article?.dimension);
    const accent = religion.color || '#6366f1';
    const others = topic?.entries.filter((e) => e.link !== path) ?? [];
    const nameOf = (id: string) => data?.religions.find((r) => r.id === id)?.name ?? id;
    const colorOf = (id: string) => data?.religions.find((r) => r.id === id)?.color ?? '#94a3b8';

    return (
        <section
            aria-label="Videre herfra"
            className={`${BAND} p-5 md:p-6 space-y-5`}
        >
            <h2 className="font-bold text-xl text-slate-900">Videre herfra</h2>

            {/* 1. Tilbake til profilen, i samme dimensjon som artikkelen hører til */}
            <Link
                to={profileHref(religion.id, { dim: dimension?.key, visning: 'profil' })}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
            >
                <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}1a` }}
                >
                    <ArrowLeft
                        size={18}
                        style={{ color: accent }}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                </span>
                <span className="min-w-0">
                    <span className="block font-bold text-slate-800">
                        Tilbake til {religion.name}-profilen
                    </span>
                    {dimension && (
                        <span className="block text-sm text-slate-500">
                            Åpner på {dimension.label.toLowerCase()}: {dimension.question}
                        </span>
                    )}
                </span>
            </Link>

            {/* 2. Samme tema hos de andre religionene */}
            {topic && others.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        {topic.label} hos de andre
                        <span className="ml-1.5 normal-case font-medium tracking-normal text-slate-400">
                            ({topic.count} av {topic.total} religioner har en artikkel)
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {others.map((entry) => (
                            <Link
                                key={entry.link}
                                to={entry.link}
                                className="group p-3 rounded-2xl bg-white border border-slate-200 hover:shadow-sm transition-all"
                                style={{ borderLeft: `4px solid ${colorOf(entry.religion)}` }}
                            >
                                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500">
                                    {nameOf(entry.religion)}
                                </span>
                                <span className="block font-bold text-slate-800 leading-snug">
                                    {entry.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Stien artikkelen er et steg i */}
            {inPaths.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Denne artikkelen er et steg i en sti
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {inPaths.map(({ path: learningPath, step }) => (
                            <Link
                                key={learningPath.id}
                                to={learningPath.link}
                                className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <MapIcon size={16} className="text-emerald-600" />
                                {learningPath.title}
                                <span className="text-[11px] font-medium text-slate-400">
                                    steg {step.step} av {learningPath.steps}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. De to sammenligningene */}
            <div className="flex flex-wrap gap-2 pt-1">
                {topic && (
                    <Link
                        to={topicHref(topic.slug, {
                            fra: religion.id,
                            dim: dimension?.key,
                        })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                        <LayoutGrid size={16} style={{ color: accent }} />
                        Se {topic.label.toLowerCase()} side ved side
                    </Link>
                )}
                <Link
                    to={compareHref([religion.id], dimension?.key)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                    <Columns3 size={16} style={{ color: dimension?.color ?? accent }} />
                    {dimension
                        ? `Sammenlign «${dimension.question}»`
                        : 'Sammenlign religionene'}
                </Link>
            </div>
        </section>
    );
};
