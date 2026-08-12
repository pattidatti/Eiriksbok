import React from 'react';
import { glossaryTerms } from '../data/glossary';
import { getTermMatcher, highlightTerms } from './glossaryTerms';

interface GlossaryTextProps {
    content: string;
}

/**
 * Markerer begreper fra den eldre, håndskrevne ordlista i `src/data/glossary.ts`.
 * Brukes av emnesidene (`TopicContentRenderer`) og av `AuthorLinker`.
 *
 * Matchingen er delt med resten av appen. Den gamle varianten her brukte `\b`,
 * som er ASCII-basert: æ, ø og å regnes da som ordskille, og korte begreper traff
 * midt inne i ord - «te» ble markert i «møte», «måte» og «bøte».
 */
export const GlossaryText: React.FC<GlossaryTextProps> = ({ content }) => {
    const matcher = getTermMatcher(glossaryTerms);

    if (!content || !matcher) return <>{content}</>;

    return <>{highlightTerms(content, matcher, 'g')}</>;
};
