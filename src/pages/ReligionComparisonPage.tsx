import React from 'react';
import { Link } from 'react-router-dom';
import { ComparisonPage } from '../features/comparison/ComparisonPage';
import { religionConfig } from '../features/comparison/configs';
import { useComparisonManifest } from '../features/comparison/manifest';

// Tema-chips generert fra faktisk tilgjengelige artikler (comparison-manifest),
// med dekningsgrad slik at eleven ser hvor mange religioner et tema dekker.
// De ligger nederst: sammenligningen er hovedsaken, temaene er veien videre.
const TopicChips: React.FC = () => {
    const { data } = useComparisonManifest();
    if (!data || data.topics.length === 0) return null;

    return (
        <section className="mt-8 pt-6 border-t border-border-main">
            <h2 className="font-display font-bold text-lg text-text-main mb-1 text-center">
                Gå dypere på ett tema
            </h2>
            <p className="text-sm text-text-muted text-center mb-4">
                Her ser du hvordan religionene behandler det samme temaet, artikkel for artikkel.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
                {data.topics.map((topic) => (
                    <Link
                        key={topic.slug}
                        to={`/krle/sammenlign/tema/${topic.slug}`}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                    >
                        #{topic.label}
                        <span className="ml-1.5 text-xs opacity-70">
                            {topic.count} av {topic.total}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export const ReligionComparisonPage: React.FC = () => {
    return <ComparisonPage config={religionConfig} footerExtra={<TopicChips />} />;
};
