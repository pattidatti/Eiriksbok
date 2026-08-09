
import React, { useEffect, useState } from 'react';
import { runClientSideScan } from '../../utils/clientScanner';
import type { ScanResult } from '../../utils/clientScanner';

export const ScannerPage: React.FC = () => {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scan = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Manifest
            const manifestRes = await fetch(`${import.meta.env.BASE_URL}content/manifest.json`);
            if (!manifestRes.ok) throw new Error("Failed to load manifest");
            const manifest = await manifestRes.json();

            // 2. Fetch Concepts
            const conceptsRes = await fetch(`${import.meta.env.BASE_URL}data/concepts.json`);
            const concepts = conceptsRes.ok ? await conceptsRes.json() : [];

            // 3. Fetch Scanner Config (Ignore List)
            const configRes = await fetch(`${import.meta.env.BASE_URL}content/config/scanner-config.json`);
            const config = configRes.ok ? await configRes.json() : { ignoredTerms: [] };

            // 4. Collect Article URLs
            const articleUrls: string[] = [];
            manifest.subjects.forEach((subj: any) => {
                subj.topics.forEach((topic: any) => {
                    topic.lessons?.forEach((lesson: any) => {
                        articleUrls.push(`content/${subj.id}/${topic.id}/${lesson.id}.json`);
                    });
                    topic.subTopics?.forEach((sub: any) => {
                        sub.lessons?.forEach((lesson: any) => {
                            // Verify path construction for subtopics if standard is consistent
                            articleUrls.push(`content/${subj.id}/${topic.id}/${lesson.id}.json`);
                        });
                    });
                });
            });

            // 5. Fetch Articles
            const articles = await Promise.all(
                articleUrls.map(async (url) => {
                    try {
                        const res = await fetch(`${import.meta.env.BASE_URL}${url}`);
                        if (res.ok) return await res.json();
                    } catch {
                        return null;
                    }
                })
            );

            const validArticles = articles.filter(Boolean);

            // 6. Run Scan
            const scanResult = await runClientSideScan(validArticles, concepts, config.ignoredTerms || []);
            setResult(scanResult);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        scan();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Copied "${text}" to clipboard. Go to Tina > Scanner Innstillinger to verify.`);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Begreps-Scanner</h1>

            <p className="mb-4 text-gray-600">
                Verktøyet scanner alle artikler for potensielle nye fagbegreper.
                Bruk "Ignorer" for å kopiere ordet til utklippstavlen – lim det så inn i "Scanner Innstillinger" i Tina.
            </p>

            {loading && <div>Scanner innhold...</div>}
            {error && <div className="text-red-500">Feil: {error}</div>}

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Fet Tekst Kandidater */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-bold mb-4 text-purple-600">Nye Begreper (Fet tekst)</h2>
                        <ul className="space-y-2">
                            {result.candidates.map((item, i) => (
                                <li key={i} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <span className="font-bold">{item.term}</span>
                                        <span className="text-xs text-gray-500 ml-2">({item.count})</span>
                                        <div className="text-xs text-gray-400 truncate w-48">{item.sources[0]}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href="/admin/index.html#/collections/concepts/new"
                                            target="_blank"
                                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                                        >
                                            Opprett
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(item.term)}
                                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                                        >
                                            Ignorer
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Intelligent Suggestions */}
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-bold mb-4 text-blue-600">Forslag (Frekvens)</h2>
                        <ul className="space-y-2">
                            {result.frequent.map((item, i) => (
                                <li key={i} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <span className="font-medium">{item.term}</span>
                                        <span className="text-xs text-gray-500 ml-2">({item.count})</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href="/admin/index.html#/collections/concepts/new"
                                            target="_blank"
                                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                                        >
                                            Opprett
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(item.term)}
                                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                                        >
                                            Ignorer
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
