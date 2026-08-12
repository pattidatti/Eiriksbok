import React from 'react';
import { Link } from 'react-router-dom';
import { getTermMatcher, highlightTerms } from './glossaryTerms';
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
    const matcher = getTermMatcher(concepts);
    if (matcher) {
        elements = elements.flatMap((el, elIdx): React.ReactNode[] => {
            if (typeof el !== 'string') return [el];
            return highlightTerms(el, matcher, `c-${elIdx}`);
        });
    }

    return <>{elements}</>;
};
