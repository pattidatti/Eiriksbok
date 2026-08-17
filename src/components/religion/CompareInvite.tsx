import React from 'react';
import { Link } from 'react-router-dom';
import { Columns3 } from 'lucide-react';
import { useComparisonManifest } from '../../features/comparison/manifest';
import { compareHref } from '../../features/religion-nav/links';
import { suggestedPartners } from '../../features/religion-nav/religionPairs';
import type { DimensionMeta } from './dimensionMeta';

interface CompareInviteProps {
    religionId: string;
    religionName: string;
    dimension: DimensionMeta;
}

/**
 * Invitasjonen til å sammenligne, med navngitte motparter i stedet for en
 * generisk knapp. Eleven ser hvem det er verdt å holde denne religionen opp
 * mot, og havner rett i sammenligningen med samme dimensjon åpen.
 */
export const CompareInvite: React.FC<CompareInviteProps> = ({
    religionId,
    religionName,
    dimension,
}) => {
    const { data } = useComparisonManifest();
    const religions = data?.religions ?? [];
    const partners = suggestedPartners(
        religionId,
        dimension.key,
        religions.map((r) => r.id)
    );
    const nameOf = (id: string) => religions.find((r) => r.id === id)?.name ?? id;
    const colorOf = (id: string) => religions.find((r) => r.id === id)?.color ?? '#64748b';
    const accent = dimension.color;

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Columns3 size={14} style={{ color: accent }} />
                Sammenlign «{dimension.question}»
            </h3>
            <div className="flex flex-wrap gap-2">
                {partners.map((partnerId) => (
                    <Link
                        key={partnerId}
                        to={compareHref([religionId, partnerId], dimension.key)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                        <span className="text-slate-400 font-medium">
                            {religionName} mot
                        </span>
                        <span
                            aria-hidden
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: colorOf(partnerId) }}
                        />
                        {nameOf(partnerId)}
                    </Link>
                ))}
                <Link
                    to={compareHref([religionId], dimension.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all border border-dashed hover:shadow-sm"
                    style={{ color: accent, borderColor: `${accent}66` }}
                >
                    Velg selv →
                </Link>
            </div>
        </div>
    );
};
