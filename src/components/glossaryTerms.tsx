import React from 'react';
import { Tooltip } from './Tooltip';
import { personSlug } from '../utils/personSlug';

/**
 * Minste felles form for et ordlisteoppslag. Både `Concept`, `GlossaryEntry` og
 * de eldre `GlossaryTerm`-oppføringene i `src/data/glossary.ts` passer inn her,
 * så alle begrepsmarkeringer i appen kan dele samme matching.
 */
export interface HighlightableTerm {
    term?: string;
    title?: string;
    definition?: string;
    description?: string;
    aliases?: string[];
    type?: 'concept' | 'person';
    link?: string;
}

type AnyEntry = HighlightableTerm;

/**
 * Felles begrepsmarkering: finner ordlistebegreper i en tekststreng og pakker dem
 * i en <Tooltip>, slik at eleven får forklaringen ved å holde musa over ordet.
 *
 * Brukes både av artikkel-markdownen (`renderInlineMarkdown`) og av `RichText`,
 * som rendrer religionssidene og sammenligningstabellen i KRLE.
 */

// `\b` i JavaScript er ASCII-basert. Det betyr at å, ø og æ regnes som ordskille,
// og at et begrep som «dåp» eller «Ærlighet» aldri ville matche. Vi bruker derfor
// egne lookarounds med en ordklasse som også dekker aksenttegn (Bahá'u'lláh).
const WORD = '0-9A-Za-zÀ-ÖØ-öø-ÿ_';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface TermMatcher {
    pattern: RegExp;
    byTerm: Map<string, AnyEntry>;
}

// Regexen bygges én gang per begrepsliste. Uten cachen ville alle ~900 begreper
// kompileres på nytt for hver eneste tekstbit på siden.
const matcherCache = new WeakMap<object, TermMatcher | null>();

const buildMatcher = (entries: AnyEntry[]): TermMatcher | null => {
    const byTerm = new Map<string, AnyEntry>();

    for (const entry of entries) {
        const base = entry.term || entry.title || '';
        for (const term of [base, ...(entry.aliases ?? [])]) {
            if (!term) continue;
            const key = term.toLowerCase();
            // Første treff vinner, så et begrep ikke kan kapres av andres alias.
            if (!byTerm.has(key)) byTerm.set(key, entry);
        }
    }

    if (byTerm.size === 0) return null;

    // Lengste begrep først, slik at «Guru Granth Sahib» vinner over «guru».
    const alternatives = [...byTerm.keys()]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp);

    return {
        pattern: new RegExp(`(?<![${WORD}])(${alternatives.join('|')})(?![${WORD}])`, 'gi'),
        byTerm,
    };
};

export const getTermMatcher = (entries?: AnyEntry[]): TermMatcher | null => {
    if (!entries || entries.length === 0) return null;
    if (matcherCache.has(entries)) return matcherCache.get(entries) ?? null;

    const matcher = buildMatcher(entries);
    matcherCache.set(entries, matcher);
    return matcher;
};

const definitionOf = (entry: AnyEntry) => entry.definition || entry.description || '';

/**
 * Deler teksten i biter og pakker begrepstreff i tooltips. Returnerer teksten
 * uendret hvis ingenting matcher.
 */
export const highlightTerms = (
    text: string,
    matcher: TermMatcher | null,
    keyPrefix: string
): React.ReactNode[] => {
    if (!text || !matcher) return [text];

    return text.split(matcher.pattern).map((part, index) => {
        if (!part) return part;
        const entry = matcher.byTerm.get(part.toLowerCase());
        if (!entry) return part;

        const definition = definitionOf(entry);
        if (!definition) return part;

        // Personer hører hjemme i persongalleriet. Før pekte tooltipen til
        // entry.link, som mangler for de aller fleste - da ble det ingen lenke i
        // det hele tatt. Sluggen utledes av navnet og resolves mot alias-listen.
        const link =
            entry.type === 'person' && entry.term
                ? `/persongalleri/${personSlug(entry.term)}`
                : entry.link;

        return (
            <Tooltip key={`${keyPrefix}-${index}`} text={definition} type={entry.type} link={link}>
                {part}
            </Tooltip>
        );
    });
};
