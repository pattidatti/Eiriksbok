import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchManifest } from '../utils/contentLoader';
import { LessonCard } from '../components/LessonCard';
import type { ManifestLesson } from '../types';
import { motion } from 'framer-motion';
import { motionPresets } from '../styles/motion-presets';
import { textLibraryData } from '../data/textLibraryData';
import { learningPathsData } from '../data/learningPathsHelper';
import { db } from '../lib/firebase';

interface SearchResult {
    lesson: ManifestLesson;
    path: string;
    topicTitle: string;
    topicImage?: string;
    subjectId: string;
}

export const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const tag = searchParams.get('tag');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResults = async () => {
            setLoading(true);
            const manifest = await fetchManifest();
            if (!manifest) {
                setLoading(false);
                return;
            }

            const found: SearchResult[] = [];
            const searchTag = tag?.toLowerCase();

            if (searchTag) {
                manifest.subjects.forEach(subject => {
                    subject.topics.forEach(topic => {
                        // Check direct lessons
                        if (topic.lessons) {
                            topic.lessons.forEach(lesson => {
                                if (lesson.tags?.some(t => t.toLowerCase() === searchTag)) {
                                    found.push({
                                        lesson,
                                        path: `/${subject.id}/${topic.id}/${lesson.id}`,
                                        topicTitle: topic.title,
                                        topicImage: topic.image,
                                        subjectId: subject.id
                                    });
                                }
                            });
                        }

                        // Check subtopics
                        if (topic.subTopics) {
                            topic.subTopics.forEach(subTopic => {
                                subTopic.lessons.forEach(lesson => {
                                    if (lesson.tags?.some(t => t.toLowerCase() === searchTag)) {
                                        found.push({
                                            lesson,
                                            path: `/${subject.id}/${topic.id}/${subTopic.id}/${lesson.id}`,
                                            topicTitle: subTopic.title,
                                            topicImage: subTopic.image || topic.image,
                                            subjectId: subject.id
                                        });
                                    }
                                });
                            });
                        }
                    });
                });

                // Læringsstier har ingen tags i registeret (se
                // scripts/update-learning-paths.cjs), så de kan ikke treffe et
                // tag-søk. De listes derfor bare i "nylig"-visningen under.

                setResults(found);
            } else {
                // Show 15 most recent items (articles + texts) if no tag
                const allContent: SearchResult[] = [];

                // Add lessons from manifest
                manifest.subjects.forEach(subject => {
                    subject.topics.forEach(topic => {
                        const processLessons = (lessons: ManifestLesson[], subTopicId?: string) => {
                            lessons.forEach(lesson => {
                                if (lesson.id) {
                                    allContent.push({
                                        lesson,
                                        path: `/${subject.id}/${topic.id}${subTopicId ? `/${subTopicId}` : ''}/${lesson.id}`,
                                        topicTitle: topic.title,
                                        topicImage: topic.image,
                                        subjectId: subject.id
                                    });
                                }
                            });
                        };

                        if (topic.lessons) processLessons(topic.lessons);
                        if (topic.subTopics) {
                            topic.subTopics.forEach(st => {
                                if (st.lessons) processLessons(st.lessons, st.id);
                            });
                        }
                    });
                });

                // Add library texts
                textLibraryData.forEach(text => {
                    allContent.push({
                        lesson: {
                            id: text.id,
                            title: text.title,
                            description: `Av ${text.author}. ${text.genre}.`,
                            createdDate: text.createdDate,
                            tags: text.theme
                        },
                        path: `/norsk/bibliotek/${text.id}`,
                        topicTitle: 'Bibliotek',
                        subjectId: 'norsk'
                    });
                });

                // Add Learning Paths
                learningPathsData.paths.forEach(path => {
                    allContent.push({
                        lesson: {
                            id: path.id,
                            title: path.title,
                            description: path.description,
                        },
                        path: path.path,
                        topicTitle: path.subjectName,
                        subjectId: path.subjectId
                    });
                });

                allContent.sort((a, b) => {
                    const dateA = a.lesson.createdDate || a.lesson.date || '0000';
                    const dateB = b.lesson.createdDate || b.lesson.date || '0000';
                    return dateB.localeCompare(dateA);
                });

                setResults(allContent.slice(0, 15));
            }

            setLoading(false);
        };

        loadResults();
        loadResults();
    }, [tag]);

    // Log search to Firebase
    useEffect(() => {
        if (!tag) return;

        // Debounce logging slightly to avoid duplicates on quick nav
        const timer = setTimeout(() => {
            import('firebase/database').then(({ ref, push, serverTimestamp }) => {
                const searchRef = ref(db, 'analytics/searches');
                push(searchRef, {
                    query: tag,
                    type: 'tag',
                    timestamp: serverTimestamp(),
                    resultsCount: results.length
                });
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [tag, results.length]);


    if (loading) {
        return <div className="p-8 text-center">Laster innhold...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
                {...motionPresets.slideDown}
                className="mb-12"
            >
                {tag ? (
                    <>
                        <h1 className="text-4xl font-display font-bold text-text-main mb-4">
                            Emne: <span className="text-neon-accent capitalize">{tag}</span>
                        </h1>
                        <p className="text-text-muted text-lg">
                            Fant {results.length} {results.length === 1 ? 'treff' : 'treff'} merket med "{tag}"
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-display font-bold text-text-main mb-4">
                            Nytt innhold
                        </h1>
                        <p className="text-text-muted text-lg">
                            De siste publiserte artiklene, læringsstiene og tekstene
                        </p>
                    </>
                )}
            </motion.div>

            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {results.map((result, index) => (
                        <motion.div
                            key={`${result.subjectId}-${result.lesson.id}`}
                            {...motionPresets.slideUp}
                            transition={{ delay: index * 0.05 }}
                        >
                            <LessonCard
                                lesson={result.lesson}
                                path={result.path}
                                topicTitle={result.topicTitle}
                                topicImage={result.topicImage}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200">
                    <p className="text-xl text-slate-500">
                        Ingen innhold funnet.
                    </p>
                </div>
            )}
        </div>
    );
};
