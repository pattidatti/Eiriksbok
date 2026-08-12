import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { RichText } from '../../components/ui/RichText';
import { Image } from '../../components/Image';
import type { ArticleLinkRef, ComparisonContent } from './types';
import type { ReligionDimensionEntry } from '../../types';

interface ComparisonCellProps {
    content: ComparisonContent | undefined;
    // Dimensjonskortet, når det finnes: ingress, bilde og nøkkelbegrep.
    // Uten kort vises brødteksten direkte, som før (filosofi).
    card?: ReligionDimensionEntry;
    accent?: string;
    compact?: boolean;
    articleLinks?: ArticleLinkRef[];
    detailLink?: string;
    detailLabel?: string;
}

export const ComparisonCell: React.FC<ComparisonCellProps> = ({
    content,
    card,
    accent = '#6366f1',
    compact = false,
    articleLinks,
    detailLink,
    detailLabel,
}) => {
    const [expanded, setExpanded] = useState(false);
    const hasSummary = Boolean(card?.summary);

    const body = content ? (
        content.format === 'rich' ? (
            <RichText content={content.value} />
        ) : (
            <p className="text-text-muted leading-relaxed">{content.value}</p>
        )
    ) : (
        <p className="text-text-muted italic">Ingen informasjon tilgjengelig.</p>
    );

    return (
        <div className={`flex-1 flex flex-col ${compact ? 'p-4' : 'p-5'}`}>
            {card?.image && !compact && (
                <Image
                    src={card.image}
                    alt={card.imageAlt || ''}
                    aspectRatio="16 / 9"
                    className="w-full rounded-xl mb-4"
                />
            )}

            {hasSummary && (
                <p
                    className={`text-text-main font-medium leading-snug mb-3 ${
                        compact ? 'text-sm' : 'text-base'
                    }`}
                >
                    {card?.summary}
                </p>
            )}

            {card?.keyTerms && card.keyTerms.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 mb-4">
                    {card.keyTerms.map((term) => (
                        <li
                            key={term.term}
                            title={term.explanation}
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{
                                backgroundColor: `${accent}12`,
                                borderColor: `${accent}33`,
                                color: '#334155',
                            }}
                        >
                            {term.term}
                        </li>
                    ))}
                </ul>
            )}

            {hasSummary ? (
                <>
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        aria-expanded={expanded}
                        className="self-start inline-flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-main transition-colors mb-2"
                    >
                        <ChevronDown
                            size={14}
                            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                        {expanded ? 'Skjul teksten' : 'Vis hele teksten'}
                    </button>
                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3 text-sm text-text-muted leading-relaxed pb-2">
                                    {body}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <div
                    className={`space-y-3 text-text-muted leading-relaxed mb-4 ${
                        compact ? 'text-sm' : ''
                    }`}
                >
                    {body}
                </div>
            )}

            {((articleLinks && articleLinks.length > 0) || detailLink) && (
                <div className="mt-auto pt-3 border-t border-border-main space-y-1.5">
                    {articleLinks && articleLinks.length > 0 && (
                        <>
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                Fordypning
                            </h4>
                            <ul className="space-y-1">
                                {articleLinks.map((article) => (
                                    <li key={article.link}>
                                        <Link
                                            to={article.link}
                                            className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline"
                                        >
                                            {article.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {detailLink && (
                        <Link
                            to={detailLink}
                            className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1 group"
                        >
                            <span className="group-hover:underline">{detailLabel ?? 'Les mer'}</span>
                            <span>→</span>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};
