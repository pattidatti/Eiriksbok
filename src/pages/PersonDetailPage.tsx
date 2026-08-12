import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CalendarClock, Users } from 'lucide-react';
import { usePeople, usePerson } from '../hooks/usePeople';
import type { PersonEntry } from '../types/people';
import { eraMeta, formatYear, monogramFor } from '../components/people/peopleMeta';
import { LifespanBar } from '../components/people/LifespanBar';
import { getSubjectColor, getSubjectLabel } from '../utils/subjectColors';
import { PageSkeleton } from '../components/Skeleton';

/** Overlapper to liv i tid? Brukes til «Levde samtidig med». */
function overlaps(a: PersonEntry, b: PersonEntry): boolean {
    if (a.birthYear === null || b.birthYear === null) return false;
    const aEnd = a.deathYear ?? a.birthYear + 70;
    const bEnd = b.deathYear ?? b.birthYear + 70;
    return a.birthYear <= bEnd && b.birthYear <= aEnd;
}

export const PersonDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { data, isLoading, person } = usePerson(slug);
    const { data: allData } = usePeople();
    const reduceMotion = useReducedMotion();

    // Samtidige: nærmest i fødselsår først, så eleven møter de mest relevante.
    const contemporaries = useMemo(() => {
        if (!person || !allData) return [];
        return allData.people
            .filter((p) => p.slug !== person.slug && overlaps(person, p))
            .sort(
                (a, b) =>
                    Math.abs((a.birthYear ?? 0) - (person.birthYear ?? 0)) -
                    Math.abs((b.birthYear ?? 0) - (person.birthYear ?? 0))
            )
            .slice(0, 6);
    }, [person, allData]);

    // Artikler gruppert per fag, så lange lister blir mulige å orientere seg i.
    const mentionsBySubject = useMemo(() => {
        if (!person) return [];
        const groups = new Map<string, typeof person.mentionedIn>();
        for (const mention of person.mentionedIn) {
            if (!groups.has(mention.subject)) groups.set(mention.subject, []);
            groups.get(mention.subject)!.push(mention);
        }
        return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [person]);

    if (isLoading) return <PageSkeleton />;

    if (!person) {
        return (
            <div className="mx-auto max-w-2xl px-6 py-24 text-center">
                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    Vi fant ingen person med denne adressen
                </h1>
                <p className="mb-6 text-slate-500">
                    Lenken kan være skrevet feil, eller personen kan hete noe annet i galleriet.
                </p>
                <Link
                    to={`/persongalleri${slug ? `?q=${encodeURIComponent(slug.replace(/-/g, ' '))}` : ''}`}
                    className="pressable inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700"
                >
                    Søk i persongalleriet <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    const era = eraMeta(person.era);
    const subject = getSubjectColor(person.subject);
    const hasYears = person.birthYear !== null || person.deathYear !== null;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
            <Link
                to="/persongalleri"
                className="focus-ring mb-6 inline-flex items-center gap-2 rounded font-semibold text-slate-500 transition-colors hover:text-indigo-700"
            >
                <ArrowLeft size={18} /> Tilbake til persongalleriet
            </Link>

            <motion.article
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`rounded-3xl border border-slate-200 border-t-4 bg-white p-6 shadow-sm md:p-10 ${era.border}`}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold ${era.bgSoft} ${era.text}`}
                        aria-hidden="true"
                    >
                        {monogramFor(person.name)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${era.bgSoft} ${era.text}`}
                        >
                            {era.label}
                        </span>
                        {person.subject && (
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${subject.bgSoft} ${subject.text}`}
                            >
                                {subject.label}
                            </span>
                        )}
                    </div>
                </div>

                <h1 className="mt-5 text-3xl font-bold text-slate-900 md:text-4xl">
                    {person.name}
                </h1>
                {person.lifespan && (
                    <p className="mt-1 text-lg font-semibold text-slate-400">{person.lifespan}</p>
                )}

                <p className="mt-5 text-lg leading-relaxed text-slate-700">{person.definition}</p>

                {hasYears && (
                    <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <CalendarClock size={14} /> Plassering i tid
                        </p>
                        <LifespanBar
                            birthYear={person.birthYear}
                            deathYear={person.deathYear}
                            era={person.era}
                            showScale
                        />
                    </div>
                )}

                {person.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        {person.tags.map((tag) => (
                            <Link
                                key={tag}
                                to={`/persongalleri?tag=${encodeURIComponent(tag)}`}
                                className="pressable focus-ring rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                )}
            </motion.article>

            {person.links.length > 0 && (
                <section className="mt-8">
                    <h2 className="mb-3 text-lg font-bold text-slate-900">Les mer</h2>
                    <div className="flex flex-col gap-2">
                        {person.links.map((link) => (
                            <Link
                                key={link.url}
                                to={link.url}
                                className="pressable focus-ring flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700"
                            >
                                {link.title}
                                <ArrowRight size={16} className="shrink-0 text-slate-400" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {mentionsBySubject.length > 0 && (
                <section className="mt-8">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <BookOpen size={18} className="text-slate-400" />
                        Nevnt i {person.mentionedIn.length} artikler
                    </h2>
                    <p className="mb-4 text-sm text-slate-500">
                        Her dukker {person.name} opp i boka.
                    </p>
                    <div className="space-y-5">
                        {mentionsBySubject.map(([subjectId, mentions]) => (
                            <div key={subjectId}>
                                <h3
                                    className={`mb-2 text-xs font-bold uppercase tracking-wide ${getSubjectColor(subjectId).text}`}
                                >
                                    {getSubjectLabel(subjectId)}
                                </h3>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {mentions.map((mention) => (
                                        <li key={mention.url}>
                                            <Link
                                                to={mention.url}
                                                className="pressable focus-ring block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700"
                                            >
                                                {mention.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {contemporaries.length > 0 && (
                <section className="mt-10">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Users size={18} className="text-slate-400" />
                        Levde samtidig
                    </h2>
                    <p className="mb-4 text-sm text-slate-500">
                        Disse gikk på jorda på samme tid som {person.name}.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {contemporaries.map((other) => {
                            const otherEra = eraMeta(other.era);
                            return (
                                <Link
                                    key={other.slug}
                                    to={`/persongalleri/${other.slug}`}
                                    className={`pressable focus-ring flex items-center gap-3 rounded-2xl border border-slate-200 border-l-4 bg-white px-3 py-3 shadow-sm transition-shadow hover:shadow-md ${otherEra.border}`}
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${otherEra.bgSoft} ${otherEra.text}`}
                                        aria-hidden="true"
                                    >
                                        {monogramFor(other.name)}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-slate-900">
                                            {other.name}
                                        </span>
                                        <span className="block text-xs font-semibold text-slate-400">
                                            {formatYear(other.birthYear)}
                                            {other.deathYear !== null
                                                ? ` - ${formatYear(other.deathYear)}`
                                                : ''}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {data && (
                <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
                    <Link
                        to={`/persongalleri?epoke=${person.era}&sort=kronologisk`}
                        className="pressable inline-flex items-center gap-2 rounded-full bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                        Se alle fra {era.label.toLowerCase()} <ArrowRight size={16} />
                    </Link>
                </footer>
            )}
        </div>
    );
};
