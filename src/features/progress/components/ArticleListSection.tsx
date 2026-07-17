// Generisk «tittel + 2-kolonners rutenett av SmallCard»-seksjon, brukt for
// både «Påbegynte artikler» og «Nylig lest» på «Min læring». I motsetning til
// RecommendationsSection har denne ikke noe featured-kort og intet fyll-steg
// for partall - et halvfullt siste rad er helt greit i en historikk-liste.

import { SmallCard } from './RecommendationsSection';
import type { Recommendation } from '../recommendations/engine';

export const ArticleListSection = ({
    title,
    subtitle,
    items,
}: {
    title: string;
    subtitle?: string;
    items: Recommendation[];
}) => {
    if (items.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-1">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
            <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${subtitle ? '' : 'mt-3'}`}>
                {items.map((item, i) => (
                    <SmallCard key={item.id} item={item} delay={i * 0.04} />
                ))}
            </div>
        </div>
    );
};
