import React from 'react';
import { eraMeta, formatYear } from './peopleMeta';
import type { EraKey } from '../../types/people';

/**
 * Levetid som strek på en felles akse.
 *
 * Aksen er bevisst ikke lineær. Med en ren lineær tidsakse ville halve galleriet
 * (117 personer fra 1800- og 1900-tallet) klumpet seg sammen i ytterste
 * høyrekant og blitt umulig å skille. I stedet får hver epoke like stor bredde,
 * og plasseringen inni epoken er lineær. Rekkefølgen stemmer alltid - avstandene
 * gjør det ikke, og derfor står epokenavnene under aksen på detaljsiden.
 */

const SEGMENTS: { era: EraKey; from: number; to: number }[] = [
    { era: 'oldtid', from: -1400, to: 500 },
    { era: 'middelalder', from: 500, to: 1500 },
    { era: 'tidlig-moderne', from: 1500, to: 1800 },
    { era: '1800-tallet', from: 1800, to: 1900 },
    { era: '1900-tallet', from: 1900, to: 1970 },
    { era: 'samtid', from: 1970, to: 2030 },
];

/** Gjør et årstall om til en posisjon 0-1 langs aksen. */
function yearToFraction(year: number): number {
    const width = 1 / SEGMENTS.length;
    if (year <= SEGMENTS[0].from) return 0;
    if (year >= SEGMENTS[SEGMENTS.length - 1].to) return 1;

    for (let i = 0; i < SEGMENTS.length; i++) {
        const seg = SEGMENTS[i];
        if (year >= seg.from && year <= seg.to) {
            const within = (year - seg.from) / (seg.to - seg.from);
            return (i + within) * width;
        }
    }
    return 1;
}

interface LifespanBarProps {
    birthYear: number | null;
    deathYear: number | null;
    era: EraKey;
    /** Viser epokenavn under aksen. Brukes på detaljsiden, ikke på kortene. */
    showScale?: boolean;
    className?: string;
}

export const LifespanBar: React.FC<LifespanBarProps> = ({
    birthYear,
    deathYear,
    era,
    showScale = false,
    className = '',
}) => {
    const meta = eraMeta(era);

    if (birthYear === null && deathYear === null) {
        return (
            <div className={`h-1.5 rounded-full bg-slate-100 ${className}`} aria-hidden="true" />
        );
    }

    const start = yearToFraction(birthYear ?? deathYear!);
    const end = yearToFraction(deathYear ?? birthYear!);
    const left = Math.min(start, end);
    // Et smalt liv skal fortsatt være synlig som en strek.
    const width = Math.max(Math.abs(end - start), 0.02);

    const label =
        birthYear !== null && deathYear !== null
            ? `Levde fra ${formatYear(birthYear)} til ${formatYear(deathYear)}`
            : `Knyttet til ${formatYear(birthYear ?? deathYear)}`;

    return (
        <div className={className}>
            <div
                className="relative h-1.5 w-full rounded-full bg-slate-100"
                role="img"
                aria-label={label}
            >
                <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                        left: `${left * 100}%`,
                        width: `${width * 100}%`,
                        backgroundColor: meta.hex,
                    }}
                />
            </div>
            {showScale && (
                <div className="mt-1.5 flex text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {SEGMENTS.map((seg) => (
                        <span key={seg.era} className="flex-1 text-center">
                            {eraMeta(seg.era).short}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
