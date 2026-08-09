import { useState, useEffect, useTransition } from 'react';
import { useManifest } from './useManifest';
import { useUserHistory } from './useUserHistory';
import { textLibraryData } from '../data/textLibraryData';
import type { ManifestLesson } from '../types';

export interface ProcessedLesson extends ManifestLesson {
    subjectId: string;
    topicId: string;
    subTopicId?: string;
    topicTitle: string;
}

export const useManifestData = () => {
    const { data: manifest, isLoading: isManifestLoading } = useManifest();
    const { history } = useUserHistory();

    const [recentLessons, setRecentLessons] = useState<ProcessedLesson[]>([]);
    const [historyLessons, setHistoryLessons] = useState<ProcessedLesson[]>([]);
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (!manifest) return;

        // Defer calculation to avoid blocking main thread on initial render
        const timer = setTimeout(() => {
            const lessons: ProcessedLesson[] = [];

            // Flatten manifest structure
            manifest.subjects?.forEach((subject: any) => {
                subject.topics?.forEach((topic: any) => {
                    const processLessons = (lessonList: ManifestLesson[], subTopicId?: string) => {
                        lessonList.forEach(l => {
                            if (l.id) {
                                lessons.push({
                                    ...l,
                                    subjectId: subject.id,
                                    topicId: topic.id,
                                    subTopicId,
                                    topicTitle: topic.title
                                });
                            }
                        });
                    };

                    const processTools = (toolList: any[], subTopicId?: string) => {
                        toolList.forEach(t => {
                            // Filter for learning paths
                            // We treat tools that are learning paths as "lessons" for history/listing purposes
                            if (t.id.includes('sti') || t.title.toLowerCase().includes('læringssti')) {
                                lessons.push({
                                    id: t.id,
                                    title: t.title,
                                    description: t.description || 'Læringssti',
                                    subjectId: subject.id,
                                    topicId: topic.id,
                                    subTopicId,
                                    topicTitle: topic.title,
                                    layout: 'learning-path',
                                    tags: ['Læringssti'],
                                    // Use topic image as fallback if tool doesn't have specific image
                                    image: t.image || t.icon || topic.image,
                                    createdDate: t.createdDate,
                                    lastUpdated: t.lastUpdated
                                });
                            }
                        });
                    };

                    if (topic.lessons) processLessons(topic.lessons);
                    if (topic.tools) processTools(topic.tools);

                    if (topic.subTopics) {
                        topic.subTopics.forEach((st: any) => {
                            if (st.lessons) processLessons(st.lessons, st.id);
                            if (st.tools) processTools(st.tools, st.id);
                        });
                    }
                });
            });

            // Add library texts
            textLibraryData.forEach(text => {
                lessons.push({
                    id: text.id,
                    title: text.title,
                    description: `Av ${text.author}. ${text.genre}.`,
                    subjectId: 'norsk',
                    topicId: 'bibliotek',
                    topicTitle: 'Bibliotek',
                    createdDate: text.createdDate,
                    lastUpdated: text.lastUpdated,
                    image: undefined, // Will use fallback
                    tags: [text.genre, text.language].filter((t): t is string => !!t)
                });
            });

            // Calculate Recent Lessons — sort by createdDate only so trivial
            // changes (image format, config edits) don't resurface old articles.
            //
            // Noen createdDate-er er ren dato uten klokkeslett, og da er to
            // artikler laget samme dag helt like. Array.sort er stabil, så uten
            // en tiebreaker arver de rekkefølgen i manifest.json (fag → tema),
            // som ikke har noe med tid å gjøre. Vi bryter uavgjort på
            // lastUpdated, og til slutt på id, så rekkefølgen i det minste er
            // forutsigbar i stedet for tilfeldig.
            const time = (value?: string) => {
                if (!value) return null;
                const t = new Date(value).getTime();
                return Number.isNaN(t) ? null : t;
            };

            const recent = [...lessons].sort((a, b) => {
                const dateA = time(a.createdDate || a.date);
                const dateB = time(b.createdDate || b.date);
                if (dateA === null && dateB === null) return 0;
                if (dateA === null) return 1;
                if (dateB === null) return -1;
                if (dateA !== dateB) return dateB - dateA;

                const updatedA = time(a.lastUpdated);
                const updatedB = time(b.lastUpdated);
                if (updatedA !== null && updatedB !== null && updatedA !== updatedB) {
                    return updatedB - updatedA;
                }
                return a.id.localeCompare(b.id);
            }).slice(0, 4);

            startTransition(() => {
                setRecentLessons(recent);
            });

            // Calculate History Lessons (slightly delayed to prioritize recent)
            setTimeout(() => {
                const hist = history
                    .map(h => lessons.find(l => l.id === h.id))
                    .filter((l): l is ProcessedLesson => !!l)
                    .slice(0, 4);

                startTransition(() => {
                    setHistoryLessons(hist);
                });
            }, 50);

        }, 50);

        return () => clearTimeout(timer);
    }, [manifest, history]);

    return {
        manifest,
        recentLessons,
        historyLessons,
        isLoading: isManifestLoading
    };
};
