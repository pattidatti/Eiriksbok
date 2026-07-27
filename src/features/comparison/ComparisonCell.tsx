import React from 'react';
import { RichText } from '../../components/ui/RichText';
import { Link } from 'react-router-dom';
import type { ArticleLinkRef, ComparisonContent } from './types';

interface ComparisonCellProps {
    content: ComparisonContent | undefined;
    compact?: boolean;
    articleLinks?: ArticleLinkRef[];
    detailLink?: string;
    detailLabel?: string;
}

export const ComparisonCell: React.FC<ComparisonCellProps> = ({
    content,
    compact = false,
    articleLinks,
    detailLink,
    detailLabel,
}) => {
    return (
        <div className={`flex-1 flex flex-col ${compact ? 'p-4' : 'p-6'}`}>
            <div
                className={`prose max-w-none text-text-main prose-headings:text-text-main prose-p:text-text-muted prose-strong:text-text-main mb-4 ${
                    compact ? 'prose-sm text-sm' : 'prose-sm'
                }`}
            >
                {content ? (
                    content.format === 'rich' ? (
                        <RichText content={content.value} />
                    ) : (
                        <p className="text-text-muted leading-relaxed">{content.value}</p>
                    )
                ) : (
                    <p className="text-text-muted italic">Ingen informasjon tilgjengelig.</p>
                )}
            </div>

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
