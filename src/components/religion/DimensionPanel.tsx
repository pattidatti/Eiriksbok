import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { Image } from '../Image';
import { RichText } from '../ui/RichText';
import { CompareInvite } from './CompareInvite';
import { KeyTermChips } from './KeyTermChips';
import { topicHref } from '../../features/religion-nav/links';
import type { DimensionMeta } from './dimensionMeta';
import type { ReligionDimensionEntry } from '../../types';
import { GLASS_CARD } from './surfaces';

export interface DimensionArticleLink {
    title: string;
    link: string;
    // Temaet artikkelen hører til, når det finnes: gir eleven veien til de
    // andre religionenes artikkel om det samme
    topicSlug?: string;
    topicLabel?: string;
}

interface DimensionPanelProps {
    dimension: DimensionMeta;
    entry: ReligionDimensionEntry | null;
    religionId: string;
    religionName: string;
    articles: DimensionArticleLink[];
}

export const DimensionPanel: React.FC<DimensionPanelProps> = ({
    dimension,
    entry,
    religionId,
    religionName,
    articles,
}) => {
    const Icon = dimension.icon;
    const accent = dimension.color;

    return (
        <motion.article
            key={dimension.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`${GLASS_CARD} overflow-hidden`}
        >
            <header
                className="px-6 py-5 border-b border-slate-100"
                style={{ background: `linear-gradient(90deg, ${accent}14, transparent)` }}
            >
                <div className="flex items-start gap-4">
                    <span
                        className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: accent }}
                    >
                        <Icon size={22} className="text-white" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                            {dimension.question}
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: accent }}>
                            {dimension.label}
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {entry?.image && (
                    <Image
                        src={entry.image}
                        alt={entry.imageAlt || `${dimension.label} i ${religionName.toLowerCase()}`}
                        aspectRatio="16 / 9"
                        className="w-full rounded-2xl"
                    />
                )}

                {entry?.summary && (
                    <p className="text-lg md:text-xl text-slate-900 leading-snug">
                        {entry.summary}
                    </p>
                )}

                {entry?.body ? (
                    // Prosjektet har ikke typography-pluginen, så avstanden mellom
                    // avsnittene settes her i stedet for med `prose`.
                    <div className="space-y-4 text-slate-600 leading-relaxed">
                        <RichText content={entry.body} />
                    </div>
                ) : (
                    !entry?.summary && (
                        <p className="text-slate-500 italic">Ingen beskrivelse lagt til ennå.</p>
                    )
                )}

                {entry?.keyTerms && entry.keyTerms.length > 0 && (
                    <KeyTermChips terms={entry.keyTerms} accent={accent} />
                )}

                {entry?.example && (
                    <section
                        className="rounded-2xl p-5 border-l-4"
                        style={{ borderColor: accent, backgroundColor: `${accent}0d` }}
                    >
                        <h3 className="font-bold text-slate-900 mb-1.5">
                            {entry.example.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">{entry.example.text}</p>
                    </section>
                )}

                {entry?.question && (
                    <section className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex gap-3">
                        <HelpCircle size={20} className="flex-shrink-0 mt-0.5 text-slate-400" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Tenk over
                            </h3>
                            <p className="text-slate-700 leading-relaxed">{entry.question}</p>
                        </div>
                    </section>
                )}
            </div>

            <footer className="px-6 py-5 border-t border-slate-100 bg-slate-50/60 space-y-3">
                {/* Artikkeldekningen er skjev: fire av de sju dimensjonene har
                    ennå ingen egne artikler. Da forsvant hele blokken uten et
                    ord, og eleven satt igjen med et hull. Nå står det hva som
                    finnes i stedet. */}
                {articles.length === 0 && (
                    <p className="text-sm text-slate-500">
                        Ingen egen artikkel om dette ennå. Sammenligningen nedenfor viser hvordan
                        de andre religionene svarer på det samme spørsmålet.
                    </p>
                )}
                {articles.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Les hele historien
                        </h3>
                        <ul className="space-y-1.5">
                            {articles.map((article) => (
                                <li key={article.link} className="flex flex-wrap items-center gap-2">
                                    <Link
                                        to={article.link}
                                        className="group inline-flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900"
                                    >
                                        <ArrowRight
                                            size={16}
                                            className="transition-transform group-hover:translate-x-1"
                                            style={{ color: accent }}
                                        />
                                        {article.title}
                                    </Link>
                                    {article.topicSlug && (
                                        <Link
                                            to={topicHref(article.topicSlug, {
                                                fra: religionId,
                                                dim: dimension.key,
                                            })}
                                            title={`Se ${article.topicLabel?.toLowerCase()} i alle religionene`}
                                            className="px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors hover:bg-white"
                                            style={{
                                                color: accent,
                                                borderColor: `${accent}40`,
                                                backgroundColor: `${accent}0d`,
                                            }}
                                        >
                                            #{article.topicLabel} hos alle
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <CompareInvite
                    religionId={religionId}
                    religionName={religionName}
                    dimension={dimension}
                />
            </footer>
        </motion.article>
    );
};
