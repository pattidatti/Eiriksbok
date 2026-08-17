import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useComparisonManifest } from '../../features/comparison/manifest';
import { profileHref, topicHref, useLens } from '../../features/religion-nav/links';

/**
 * Hele religionsstoffet på én skjerm: religionene nedover, temaene bortover,
 * og hver artikkel som en celle du kan klikke rett inn i. Radoverskriften går
 * til religionsprofilen, kolonneoverskriften til tema-sammenligningen.
 *
 * Dette er kartet resten av krysslenkingen henger på, og det er samtidig et
 * greit projektorbilde når læreren skal vise hva klassen har foran seg.
 */
export const ReligionTopicMap: React.FC = () => {
    const { data } = useComparisonManifest();
    const { dim } = useLens();

    const grid = useMemo(() => {
        if (!data) return null;
        // religionId -> topicSlug -> artikkel
        const byReligion = new Map<string, Map<string, { title: string; link: string }>>();
        for (const topic of data.topics) {
            for (const entry of topic.entries) {
                if (!byReligion.has(entry.religion)) byReligion.set(entry.religion, new Map());
                byReligion
                    .get(entry.religion)!
                    .set(topic.slug, { title: entry.title, link: entry.link });
            }
        }
        return byReligion;
    }, [data]);

    if (!data || !grid || data.topics.length === 0) return null;

    const religions = data.religions.filter((r) => grid.has(r.id));
    if (religions.length === 0) return null;

    return (
        <section className="mt-8 pt-6 border-t border-border-main">
            <h2 className="font-display font-bold text-lg text-text-main mb-1 text-center">
                Innholdskartet
            </h2>
            <p className="text-sm text-text-muted text-center mb-4">
                Religionene nedover, temaene bortover. Klikk på et navn for profilen, på et tema
                for å se alle religionene side ved side, eller rett på en artikkel.
            </p>

            <div className="overflow-x-auto pb-2">
                <table className="border-separate border-spacing-1 text-left">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-bg-main w-[130px]">
                                <span className="sr-only">Religion</span>
                            </th>
                            {data.topics.map((topic) => (
                                <th key={topic.slug} className="w-[118px] align-bottom p-0">
                                    <Link
                                        to={topicHref(topic.slug, { dim })}
                                        className="block px-2 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                                    >
                                        #{topic.short ?? topic.label}
                                        <span className="block font-medium opacity-70">
                                            {topic.count}/{topic.total}
                                        </span>
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {religions.map((religion) => {
                            const row = grid.get(religion.id)!;
                            const color = religion.color || '#64748b';
                            return (
                                <tr key={religion.id}>
                                    <th
                                        scope="row"
                                        className="sticky left-0 z-10 bg-bg-main p-0 align-middle"
                                    >
                                        <Link
                                            to={profileHref(religion.id, {
                                                dim,
                                                visning: 'profil',
                                            })}
                                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-bold text-text-main hover:bg-black/5 transition-colors"
                                        >
                                            <span
                                                aria-hidden
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            {religion.name}
                                        </Link>
                                    </th>
                                    {data.topics.map((topic) => {
                                        const cell = row.get(topic.slug);
                                        if (!cell) {
                                            return (
                                                <td
                                                    key={topic.slug}
                                                    className="rounded-lg bg-bg-subtle/60 border border-dashed border-border-main"
                                                >
                                                    <span className="sr-only">
                                                        Ingen artikkel om {topic.label} i{' '}
                                                        {religion.name}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={topic.slug} className="p-0 align-top">
                                                <Link
                                                    to={cell.link}
                                                    title={`${religion.name}: ${cell.title}`}
                                                    className="block h-full min-h-[3.25rem] px-2 py-1.5 rounded-lg text-[11px] leading-tight font-medium text-text-main bg-bg-card border border-border-main hover:shadow-sm transition-all"
                                                    style={{ borderLeft: `3px solid ${color}` }}
                                                >
                                                    <span className="line-clamp-3">{cell.title}</span>
                                                </Link>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
