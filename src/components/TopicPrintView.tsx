import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchLesson } from '../utils/contentLoader';
import { ArticleContent } from './ArticleContent';
import type { ManifestLesson, Lesson } from '../types';

interface Props {
    subjectId: string;
    topicId: string;
    lessons: ManifestLesson[];
    onClose: () => void;
}

export function TopicPrintView({ subjectId, topicId, lessons, onClose }: Props) {
    const [articles, setArticles] = useState<(Lesson | null)[]>([]);
    const [loaded, setLoaded] = useState(0);

    useEffect(() => {
        let count = 0;
        Promise.all(
            lessons.map((lesson) =>
                fetchLesson(subjectId, topicId, lesson.id)
                    .catch(() => null)
                    .then((data) => {
                        count++;
                        setLoaded(count);
                        return data;
                    })
            )
        ).then(setArticles);
    }, []);

    useEffect(() => {
        const ready = articles.filter(Boolean);
        if (ready.length > 0 && ready.length === lessons.length) {
            window.onafterprint = onClose;
            window.print();
        }
    }, [articles]);

    const isLoading = articles.filter(Boolean).length < lessons.length;

    return (
        <>
            {/* Laste-overlay (synlig på skjermen, ikke i print) */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                    {isLoading ? (
                        <>
                            <div className="text-2xl font-bold text-slate-800 mb-2">Forbereder PDF…</div>
                            <div className="text-slate-500 mb-4">
                                {loaded} av {lessons.length} artikler lastet
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(loaded / lessons.length) * 100}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-600">Åpner utskriftsdialog…</div>
                    )}
                    <button
                        onClick={onClose}
                        className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline"
                    >
                        Avbryt
                    </button>
                </div>
            </div>

            {/* Print-container (skjult på skjerm, synlig i print) — portal til document.body utenfor #root */}
            {createPortal(
                <div id="print-container">
                    {articles.map(
                        (article) =>
                            article && (
                                <div key={article.id} className="print-article">
                                    <h1>{article.title}</h1>
                                    <ArticleContent content={article.content ?? []} />
                                </div>
                            )
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
