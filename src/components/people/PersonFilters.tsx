import React, { useRef } from 'react';
import { Search, X, ArrowDownAZ, Clock } from 'lucide-react';
import { ERA_ORDER, eraMeta } from './peopleMeta';
import type { EraKey } from '../../types/people';
import { getSubjectLabel } from '../../utils/subjectColors';

export type SortMode = 'alfabetisk' | 'kronologisk';

interface ChipOption {
    value: string;
    label: string;
    count: number;
}

/**
 * Chip-gruppe med rullerende tabindex og piltastnavigasjon, samme mønster som
 * dimensjonsfanene i sammenligningsmotoren. Eleven tabber inn i gruppen én gang
 * og bytter valg med piltastene, i stedet for å tabbe gjennom sju knapper.
 */
const ChipGroup: React.FC<{
    label: string;
    options: ChipOption[];
    value: string;
    onChange: (value: string) => void;
    accentFor?: (value: string) => string;
}> = ({ label, options, value, onChange, accentFor }) => {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const activeIndex = Math.max(
        0,
        options.findIndex((o) => o.value === value)
    );

    const onKeyDown = (event: React.KeyboardEvent) => {
        let next = -1;
        if (event.key === 'ArrowRight') next = (activeIndex + 1) % options.length;
        if (event.key === 'ArrowLeft') next = (activeIndex - 1 + options.length) % options.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = options.length - 1;
        if (next < 0) return;
        event.preventDefault();
        onChange(options[next].value);
        refs.current[next]?.focus();
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <div
                role="radiogroup"
                aria-label={label}
                onKeyDown={onKeyDown}
                className="flex flex-wrap gap-1.5"
            >
                {options.map((option, index) => {
                    const selected = option.value === value;
                    return (
                        <button
                            key={option.value}
                            ref={(el) => {
                                refs.current[index] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={index === activeIndex ? 0 : -1}
                            onClick={() => onChange(option.value)}
                            className={`pressable focus-ring rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                selected
                                    ? 'bg-slate-900 text-white'
                                    : `bg-slate-100 text-slate-600 hover:bg-slate-200 ${accentFor?.(option.value) ?? ''}`
                            }`}
                        >
                            {option.label}
                            <span className={selected ? 'ml-1 text-white/60' : 'ml-1 text-slate-400'}>
                                {option.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface PersonFiltersProps {
    query: string;
    onQueryChange: (value: string) => void;
    subject: string;
    onSubjectChange: (value: string) => void;
    era: string;
    onEraChange: (value: string) => void;
    tag: string | null;
    onClearTag: () => void;
    sort: SortMode;
    onSortChange: (value: SortMode) => void;
    subjectCounts: Record<string, number>;
    eraCounts: Record<string, number>;
    total: number;
    shown: number;
}

export const PersonFilters: React.FC<PersonFiltersProps> = ({
    query,
    onQueryChange,
    subject,
    onSubjectChange,
    era,
    onEraChange,
    tag,
    onClearTag,
    sort,
    onSortChange,
    subjectCounts,
    eraCounts,
    total,
    shown,
}) => {
    const subjectOptions: ChipOption[] = [
        { value: 'alle', label: 'Alle fag', count: total },
        ...Object.entries(subjectCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => ({
                value: key,
                // «uten» er en egen verdi, ikke det samme som «alle». I den gamle
                // versjonen kollapset personer uten fag til «Alle fag».
                label: key === 'uten' ? 'Uten fag' : getSubjectLabel(key),
                count,
            })),
    ];

    const eraOptions: ChipOption[] = [
        { value: 'alle', label: 'Alle epoker', count: total },
        ...ERA_ORDER.filter((key) => (eraCounts[key] ?? 0) > 0).map((key) => ({
            value: key,
            label: eraMeta(key as EraKey).short,
            count: eraCounts[key] ?? 0,
        })),
    ];

    return (
        <div className="mb-4 space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Søk etter navn, kallenavn eller beskrivelse..."
                        aria-label="Søk i persongalleriet"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex shrink-0 gap-1.5" role="group" aria-label="Sortering">
                    {(
                        [
                            { value: 'alfabetisk', label: 'A-Å', icon: ArrowDownAZ },
                            { value: 'kronologisk', label: 'Tidslinje', icon: Clock },
                        ] as const
                    ).map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={sort === value}
                            onClick={() => onSortChange(value)}
                            className={`pressable focus-ring flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                sort === value
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <ChipGroup
                label="Fag"
                options={subjectOptions}
                value={subject}
                onChange={onSubjectChange}
            />
            <ChipGroup label="Epoke" options={eraOptions} value={era} onChange={onEraChange} />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                <p className="text-sm text-slate-500" aria-live="polite">
                    Viser <span className="font-bold text-slate-900">{shown}</span> av {total}{' '}
                    personer
                </p>
                {tag && (
                    <button
                        type="button"
                        onClick={onClearTag}
                        className="pressable focus-ring flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-200"
                    >
                        {tag}
                        <X size={13} />
                    </button>
                )}
            </div>
        </div>
    );
};
