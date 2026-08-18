import React from 'react';
import { Link } from 'react-router-dom';
import { ComparisonPage } from '../features/comparison/ComparisonPage';
import { philosophyConfig } from '../features/comparison/configs';

export const PhilosophyComparisonPage: React.FC = () => {
    return (
        <ComparisonPage
            config={philosophyConfig}
            footerExtra={() => (
                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                    <Link
                        to="/krle/filosofi/odyssey"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                    >
                        Møt filosofene i Odysseen →
                    </Link>
                </div>
            )}
        />
    );
};
