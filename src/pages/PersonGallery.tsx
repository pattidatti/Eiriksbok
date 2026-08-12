import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Users } from 'lucide-react';
import { usePeople } from '../hooks/usePeople';
import type { EraKey, PersonEntry } from '../types/people';
import { PersonCard } from '../components/people/PersonCard';
import { PersonFilters, type SortMode } from '../components/people/PersonFilters';
import { ERA_ORDER, eraMeta } from '../components/people/peopleMeta';
import { PageSkeleton } from '../components/Skeleton';

/**
 * Persongalleriet - et oppslagsverk over menneskene i Eiriksbok.
 *
 * URL-en er kilden til sannhet for søk, filtre og sortering (?q=, ?fag=, ?epoke=,
 * ?tag=, ?sort=), slik at en filtrert visning kan deles og tilbakeknappen virker.
 * Mønsteret er hentet fra sammenligningsmotoren.
 */
export const PersonGallery: React.FC = () => {
    const { data, isLoading, isError, refetch } = usePeople();
    const [searchParams, setSearchParams] = useSearchParams();
    const reduceMotion = useReducedMotion();

    const people = useMemo(() => data?.people ?? [], [data]);

    const urlQuery = searchParams.get('q') ?? '';
    const subject = searchParams.get('fag') ?? 'alle';
    const era = searchParams.get('epoke') ?? 'alle';
    const tag = searchParams.get('tag');
    const sort: SortMode = searchParams.get('sort') === 'kronologisk' ? 'kronologisk' : 'alfabetisk';

    // Søkefeltet skriver til lokal state med én gang og til URL-en etter en liten
    // pause, så vi verken laggar på hvert tastetrykk eller fyller historikken.
    const [queryInput, setQueryInput] = useState(urlQuery);
    useEffect(() => {
        setQueryInput(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        if (queryInput === urlQuery) return;
        const timer = setTimeout(() => {
            setSearchParams(
                (params) => {
                    if (queryInput) params.set('q', queryInput);
                    else params.delete('q');
                    return params;
                },
                { replace: true }
            );
        }, 250);
        return () => clearTimeout(timer);
    }, [queryInput, urlQuery, setSearchParams]);

    const setParam = useCallback(
        (key: string, value: string | null) => {
            setSearchParams(
                (params) => {
                    if (value && value !== 'alle') params.set(key, value);
                    else params.delete(key);
                    return params;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    // Fuse gir treff på aliaser og tåler skrivefeil. Det gamle søket var rent
    // substring-match på navn og beskrivelse.
    const fuse = useMemo(
        () =>
            new Fuse(people, {
                keys: [
                    { name: 'name', weight: 3 },
                    { name: 'aliases', weight: 2 },
                    { name: 'tags', weight: 1 },
                    { name: 'definition', weight: 1 },
                ],
                threshold: 0.35,
                ignoreLocation: true,
            }),
        [people]
    );

    const filtered = useMemo(() => {
        let list: PersonEntry[] = urlQuery.trim()
            ? fuse.search(urlQuery.trim()).map((r) => r.item)
            : people;

        if (subject !== 'alle') {
            list = list.filter((p) =>
                subject === 'uten' ? !p.subject : p.subject === subject
            );
        }
        if (era !== 'alle') list = list.filter((p) => p.era === era);
        if (tag) list = list.filter((p) => p.tags.includes(tag));

        if (sort === 'kronologisk') {
            // Personer uten årstall skal aldri forsvinne - de samles til slutt.
            return [...list].sort((a, b) => {
                const ay = a.birthYear ?? a.deathYear;
                const by = b.birthYear ?? b.deathYear;
                if (ay === null && by === null) return a.name.localeCompare(b.name, 'nb');
                if (ay === null) return 1;
                if (by === null) return -1;
                return ay - by || a.name.localeCompare(b.name, 'nb');
            });
        }
        // Fuse returnerer etter relevans; ved fritekstsøk beholder vi den rekkefølgen.
        if (urlQuery.trim()) return list;
        return [...list].sort((a, b) => a.name.localeCompare(b.name, 'nb'));
    }, [people, fuse, urlQuery, subject, era, tag, sort]);

    const subjectCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const p of people) {
            const key = p.subject ?? 'uten';
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }, [people]);

    const eraCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const p of people) counts[p.era] = (counts[p.era] ?? 0) + 1;
        return counts;
    }, [people]);

    // Ved kronologisk sortering deler vi listen i epoker med egen overskrift.
    // 224 navn i én strøm er en sekk; 224 navn i seks epoker er en fortelling.
    const groups = useMemo<{ key: EraKey | null; items: PersonEntry[] }[]>(() => {
        if (sort !== 'kronologisk') return [{ key: null, items: filtered }];
        return ERA_ORDER.map((key) => ({
            key,
            items: filtered.filter((p) => p.era === key),
        })).filter((g) => g.items.length > 0);
    }, [filtered, sort]);

    if (isLoading) return <PageSkeleton />;

    if (isError || people.length === 0) {
        return (
            <div className="mx-auto max-w-2xl px-6 py-24 text-center">
                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    Kunne ikke laste persongalleriet
                </h1>
                <p className="mb-6 text-slate-500">
                    Noe gikk galt da vi hentet personene. Sjekk nettforbindelsen og prøv igjen.
                </p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="pressable rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700"
                >
                    Prøv igjen
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
            {/* Toppen holdes lav med vilje: på Chromebook-baselinen 1366x768 skal
                eleven se den første kortraden uten å scrolle. */}
            <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 md:text-3xl">
                    <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-700">
                        <Users size={22} />
                    </span>
                    Persongalleri
                </h1>
                <p className="text-sm text-slate-500">
                    Menneskene bak historien, litteraturen og religionene i Eiriksbok.
                </p>
            </header>

            <PersonFilters
                query={queryInput}
                onQueryChange={setQueryInput}
                subject={subject}
                onSubjectChange={(v) => setParam('fag', v)}
                era={era}
                onEraChange={(v) => setParam('epoke', v)}
                tag={tag}
                onClearTag={() => setParam('tag', null)}
                sort={sort}
                onSortChange={(v) => setParam('sort', v === 'alfabetisk' ? null : v)}
                subjectCounts={subjectCounts}
                eraCounts={eraCounts}
                total={people.length}
                shown={filtered.length}
            />

            {filtered.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
                    <Users className="mx-auto mb-4 text-slate-300" size={44} />
                    <p className="text-lg text-slate-500">Ingen personer matchet søket ditt.</p>
                    <button
                        type="button"
                        onClick={() => setSearchParams({}, { replace: true })}
                        className="pressable mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                    >
                        Nullstill filtrene
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {groups.map((group) => (
                        <section key={group.key ?? 'alle'}>
                            {group.key && (
                                <h2 className="sticky top-16 z-10 mb-3 -mx-1 flex items-center gap-2 bg-slate-50/90 px-1 py-2 text-sm font-bold uppercase tracking-wide text-slate-500 backdrop-blur">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${eraMeta(group.key).dot}`}
                                    />
                                    {eraMeta(group.key).label}
                                    <span className="font-semibold text-slate-400">
                                        {group.items.length}
                                    </span>
                                </h2>
                            )}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <AnimatePresence mode="popLayout">
                                    {group.items.map((person) => (
                                        <motion.div
                                            key={person.slug}
                                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex"
                                        >
                                            <PersonCard
                                                person={person}
                                                onTagClick={(t) => setParam('tag', t)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <footer className="mt-16 border-t border-slate-200 py-10 text-center">
                <Link
                    to="/tidslinje"
                    className="pressable inline-flex items-center gap-2 rounded-full bg-indigo-50 px-6 py-3 font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                    Se hendelsene på den store tidslinjen
                </Link>
            </footer>
        </div>
    );
};
