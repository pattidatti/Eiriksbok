import React from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from './Tooltip';
import type { Concept } from '../types';
import type { GlossaryEntry } from '../context/GlossaryContext';

export const renderInlineMarkdown = (text: string, concepts?: (Concept | GlossaryEntry)[]) => {
    if (!text) return null;

    let elements: React.ReactNode[] = [text];

    // 1. Bold
    elements = elements.flatMap((el): React.ReactNode[] => {
        if (typeof el !== 'string') return [el];
        return el.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={`b-${i}-${part.substring(0, 10)}`}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    });

    // 2. Links
    elements = elements.flatMap((el): React.ReactNode[] => {
        if (typeof el !== 'string') return [el];
        return el.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                const [, linkText, linkUrl] = linkMatch;
                const isExternal = linkUrl.startsWith('http');
                if (isExternal) {
                    return (
                        <a
                            key={`l-${i}-${linkUrl.substring(0, 10)}`}
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {linkText}
                        </a>
                    );
                }
                return (
                    <Link
                        key={`l-${i}-${linkUrl.substring(0, 10)}`}
                        to={linkUrl}
                        className="text-blue-600 hover:underline"
                    >
                        {renderInlineMarkdown(linkText, concepts)} {/* Recursive helper? No, keep simple */}
                    </Link>
                );
            }
            return part;
        });
    });

    // 3. Italics
    elements = elements.flatMap((el): React.ReactNode[] => {
        if (typeof el !== 'string') return [el];
        return el.split(/(\*.*?\*)/g).map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <em key={`i-${i}-${part.substring(0, 10)}`}>{part.slice(1, -1)}</em>;
            }
            return part;
        });
    });

    // 4. Concepts/Glossary (Tooltips)
    if (concepts && concepts.length > 0) {
        // Flatten all terms and aliases for matching
        const allTerms = concepts.flatMap(c => {
            const baseTerm = (c.term || ('title' in c ? (c as Concept).title : '') || '');
            const aliases = c.aliases ?? [];
            return [
                { term: baseTerm, concept: c },
                ...aliases.map((a) => ({ term: a, concept: c }))
            ];
        }).filter(t => t.term.length > 0)
            .sort((a, b) => b.term.length - a.term.length); // Prioritize longest matches

        // Create a unified regex for all terms and aliases
        const pattern = new RegExp(`\\b(${allTerms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

        elements = elements.flatMap((el, elIdx): React.ReactNode[] => {
            if (typeof el !== 'string') return [el];

            return el.split(pattern).map((part, i) => {
                const match = allTerms.find(t => t.term.toLowerCase() === part.toLowerCase());

                if (match) {
                    return (
                        <Tooltip
                            key={`c-${elIdx}-${i}-${part.substring(0, 10)}`}
                            text={
                                match.concept.definition ||
                                ('description' in match.concept ? match.concept.description : '') ||
                                ''
                            }
                            type={match.concept.type}
                            link={match.concept.link}
                        >
                            {part}
                        </Tooltip>
                    );
                }
                return part;
            });
        });
    }

    return <>{elements}</>;
};
