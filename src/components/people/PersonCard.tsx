import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { PersonEntry } from '../../types/people';
import { eraMeta, monogramFor } from './peopleMeta';
import { LifespanBar } from './LifespanBar';
import { getSubjectColor } from '../../utils/subjectColors';

interface PersonCardProps {
    person: PersonEntry;
    onTagClick?: (tag: string) => void;
}

/**
 * Kort uten portrett.
 *
 * Hele kortet er klikkbart, men vi pakker det ikke inn i én <a>: taggene skal
 * også kunne klikkes, og en knapp inni en lenke er ugyldig HTML. I stedet får
 * navnelenken et usynlig overlegg (`after:absolute after:inset-0`) som dekker
 * kortet, mens taggene løftes over med `relative z-10`. Skjermlesere ser da én
 * lenke per kort, slik de skal.
 */
export const PersonCard: React.FC<PersonCardProps> = ({ person, onTagClick }) => {
    const era = eraMeta(person.era);
    const subject = getSubjectColor(person.subject);
    const mentions = person.mentionedIn.length;

    return (
        <article
            className={`content-auto group relative flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-400 border-t-4 ${era.border}`}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${era.bgSoft} ${era.text}`}
                    aria-hidden="true"
                >
                    {monogramFor(person.name)}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${era.bgSoft} ${era.text}`}
                    >
                        {era.short}
                    </span>
                    {person.subject && (
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${subject.text}`}>
                            {subject.label}
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold leading-tight text-slate-900">
                <Link
                    to={`/persongalleri/${person.slug}`}
                    className="focus-ring rounded outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-indigo-700"
                >
                    {person.name}
                </Link>
            </h3>

            {person.lifespan && (
                <p className="mt-0.5 text-sm font-semibold text-slate-400">{person.lifespan}</p>
            )}

            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                {person.definition}
            </p>

            <LifespanBar
                birthYear={person.birthYear}
                deathYear={person.deathYear}
                era={person.era}
                className="mt-4"
            />

            <div className="mt-3 flex items-end justify-between gap-3">
                <div className="relative z-10 flex flex-wrap gap-1">
                    {person.tags.slice(0, 3).map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => onTagClick?.(tag)}
                            className="pressable focus-ring rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                {mentions > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400">
                        <BookOpen size={13} />
                        {mentions}
                    </span>
                )}
            </div>
        </article>
    );
};
