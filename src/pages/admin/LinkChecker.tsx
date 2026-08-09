import React, { useState } from 'react';
import { useManifest } from '../../hooks/useManifest';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import type { ContentBlock, Lesson } from '../../types';

interface BrokenLink {
    sourceTitle: string;
    sourcePath: string;
    linkText: string;
    targetUrl: string;
    error: string;
}

export const LinkChecker: React.FC = () => {
    const { data: manifest } = useManifest();
    const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
    const [scannedCount, setScannedCount] = useState(0);
    const [isScanning, setIsScanning] = useState(false);

    // Collect all valid IDs to check against
    const [validPaths, setValidPaths] = useState<Set<string>>(new Set());

    const scanLinks = async () => {
        if (!manifest) return;
        setIsScanning(true);
        setBrokenLinks([]);
        setScannedCount(0);

        // 1. Build Index of Valid Paths
        const paths = new Set<string>();
        const lessons: { path: string, contentUrl: string, title: string }[] = [];

        manifest.subjects.forEach(subject => {
            paths.add(`/${subject.id}`);
            subject.topics.forEach(topic => {
                paths.add(`/${subject.id}/${topic.id}`);

                if (topic.lessons) {
                    topic.lessons.forEach(l => {
                        const p = `/${subject.id}/${topic.id}/${l.id}`;
                        paths.add(p);
                        lessons.push({
                            path: p,
                            title: l.title,
                            contentUrl: `/content/${subject.id}/${topic.id}/${l.id}/artikkel.json`
                        });
                    });
                }

                if (topic.subTopics) {
                    topic.subTopics.forEach(st => {
                        paths.add(`/${subject.id}/${topic.id}/${st.id}`);
                        if (st.lessons) {
                            st.lessons.forEach(l => {
                                const p = `/${subject.id}/${topic.id}/${st.id}/${l.id}`;
                                paths.add(p);
                                lessons.push({
                                    path: p,
                                    title: l.title,
                                    contentUrl: `/content/${subject.id}/${topic.id}/${st.id}/${l.id}/artikkel.json`
                                });
                            });
                        }
                    });
                }
            });
        });
        setValidPaths(paths);

        // 2. Fetch and Scan Content
        const issues: BrokenLink[] = [];
        let count = 0;

        for (const lesson of lessons) {
            try {
                const res = await fetch(lesson.contentUrl);
                if (res.ok) {
                    const data = (await res.json()) as Lesson;

                    // Recursive function to find links in content
                    const findLinks = (blocks: ContentBlock[]) => {
                        blocks.forEach(block => {
                            if (block.type === 'text' && block.content) {
                                // Regex for markdown links [text](url)
                                const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
                                let match;
                                while ((match = regex.exec(block.content)) !== null) {
                                    const [, text, url] = match;

                                    // Only check internal links starting with /
                                    if (url.startsWith('/')) {
                                        // Ignore /content/ links (images/assets) for now as they are harder to verify
                                        if (url.startsWith('/content')) continue;

                                        // Check if path exists in our set
                                        // We strip query params ?tag=...
                                        const cleanUrl = url.split('?')[0];

                                        // Special case: /norsk/bibliotek is valid but might not be in manifest structure depending on setup
                                        // So we explicitly check against known special routes or the set
                                        const isKnownSpecial = cleanUrl.startsWith('/norsk/bibliotek') || cleanUrl.startsWith('/bibliotek');

                                        if (!paths.has(cleanUrl) && !isKnownSpecial) {
                                            issues.push({
                                                sourceTitle: lesson.title,
                                                sourcePath: lesson.path,
                                                linkText: text,
                                                targetUrl: url,
                                                error: 'Target path not found in manifest'
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    };

                    if (data.content) findLinks(data.content);
                }
            } catch (e) {
                console.error(`Error scanning ${lesson.path}`, e);
            }
            count++;
            setScannedCount(count);
        }

        setBrokenLinks(issues);
        setIsScanning(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Link Checker</h1>
                        <p className="text-slate-500">
                            Sjekker interne lenker i alle artikler.
                        </p>
                    </div>
                    <button
                        onClick={scanLinks}
                        disabled={isScanning}
                        className={`flex items-center px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isScanning ? 'bg-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                    >
                        {isScanning ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Skanner ({scannedCount}...)
                            </>
                        ) : (
                            <>Start Skanning</>
                        )}
                    </button>
                </div>

                {isScanning && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-8 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-2 transition-all duration-300"
                            style={{ width: `${Math.min((scannedCount / (validPaths.size || 100)) * 100, 100)}%` }} // Rough progress
                        />
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {brokenLinks.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            {isScanning ? 'Jobber...' : (
                                <div className="flex flex-col items-center">
                                    <Check className="w-12 h-12 text-emerald-500 mb-4" />
                                    <p className="text-lg font-medium text-slate-900">Ingen døde lenker funnet!</p>
                                    <p className="text-sm mt-2">Trykk start for å kjøre en ny skjekk.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Kildeartikkel</th>
                                    <th className="px-6 py-4">Linktekst</th>
                                    <th className="px-6 py-4">Mål (Ugyldig)</th>
                                    <th className="px-6 py-4">Årsak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {brokenLinks.map((link, i) => (
                                    <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{link.sourceTitle}</div>
                                            <Link to={link.sourcePath} className="text-xs text-indigo-600 hover:underline flex items-center mt-1">
                                                Gå til artikkel <ExternalLink className="w-3 h-3 ml-1" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                            [{link.linkText}]
                                        </td>
                                        <td className="px-6 py-4 font-mono text-red-600 bg-red-50 rounded-md">
                                            {link.targetUrl}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {link.error}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
