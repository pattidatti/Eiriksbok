import { useState, useEffect, useMemo } from 'react';
import { useManifest } from './useManifest';
import { textLibraryData } from '../data/textLibraryData';

export interface ConceptItem {
    id: string;
    term: string;
    definition: string;
    sourceType: 'lesson' | 'library' | 'global';
    subjectId?: string;
    topicId?: string;
    lessonId?: string;
    lessonTitle?: string;
    libraryId?: string;
    libraryTitle?: string;
    tags?: string[];
}

export const useConcepts = () => {
    const { data: manifest } = useManifest();
    const [globalConcepts, setGlobalConcepts] = useState<ConceptItem[]>([]);

    useEffect(() => {
        const fetchGlobalConcepts = async () => {
            try {
                const basePath = import.meta.env.BASE_URL.endsWith('/')
                    ? import.meta.env.BASE_URL
                    : `${import.meta.env.BASE_URL}/`;

                // Prod: ingen cache-busting - 'no-cache' revaliderer med ETag (304 hvis uendret)
                const url = import.meta.env.DEV
                    ? `${basePath}data/concepts.json?v=${Date.now()}`
                    : `${basePath}data/concepts.json`;

                const response = await fetch(url, { cache: 'no-cache' });
                if (response.ok) {
                    const data = await response.json();

                    interface RawConcept {
                        id?: string;
                        term?: string;
                        definition?: string;
                        subject?: string;
                        topic?: string;
                        tags?: string[];
                    }
                    // Enkelte auto-genererte innslag mangler term/definition
                    // (bruker title/explanation-skjema) - de kan ikke vises
                    const formatted = (data as RawConcept[])
                        .filter(
                            (item): item is RawConcept & { term: string; definition: string } =>
                                !!item.term && !!item.definition
                        )
                        .map((item) => ({
                            id: item.id || `global-${item.term}`,
                            term: item.term,
                            definition: item.definition,
                            sourceType: 'global' as const,
                            subjectId: item.subject,
                            topicId: item.topic,
                            tags: item.tags,
                        }));

                    setGlobalConcepts(formatted);
                }
            } catch (error) {
                console.error("Failed to load global concepts:", error);
            }
        };

        fetchGlobalConcepts();
    }, []);

    const concepts = useMemo(() => {
        const allConcepts: ConceptItem[] = [...globalConcepts];

        if (!manifest) return allConcepts;

        // 1. Extract from Manifest (Lessons)
        manifest.subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                // Check topic lessons
                topic.lessons?.forEach(lesson => {
                    if (lesson.definitions) {
                        lesson.definitions.forEach((def, index) => {
                            allConcepts.push({
                                id: `lesson-${lesson.id}-${index}`,
                                term: def.term,
                                definition: def.definition,
                                sourceType: 'lesson',
                                subjectId: subject.id,
                                topicId: topic.id,
                                lessonId: lesson.id,
                                lessonTitle: lesson.title
                            });
                        });
                    }
                });

                // Check subtopic lessons
                topic.subTopics?.forEach(subTopic => {
                    subTopic.lessons.forEach(lesson => {
                        if (lesson.definitions) {
                            lesson.definitions.forEach((def, index) => {
                                allConcepts.push({
                                    id: `lesson-${lesson.id}-${index}`,
                                    term: def.term,
                                    definition: def.definition,
                                    sourceType: 'lesson',
                                    subjectId: subject.id,
                                    topicId: topic.id,
                                    lessonId: lesson.id,
                                    lessonTitle: lesson.title
                                });
                            });
                        }
                    });
                });
            });
        });

        // 2. Ordforklaringene som hører til tekstene i biblioteket. Det er 395 av
        // dem, og de lå tidligere uten fag - da havnet de i en usorterbar sekk
        // sammen med alt annet utagget. De hører alle hjemme i norsk.
        textLibraryData.forEach(text => {
            if (text.definitions) {
                text.definitions.forEach((def, index) => {
                    allConcepts.push({
                        id: `library-${text.id}-${index}`,
                        term: def.term,
                        definition: def.definition,
                        sourceType: 'library',
                        subjectId: 'norsk',
                        topicId: 'bibliotek',
                        libraryId: text.id,
                        libraryTitle: text.title
                    });
                });
            }
        });

        return allConcepts;
    }, [manifest, globalConcepts]);

    return concepts;
};
