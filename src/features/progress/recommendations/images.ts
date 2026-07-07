// Bildeoppslag for anbefalingsmotoren. Ren logikk uten React - slår opp
// emnebilder fra manifestet slik at anbefalingskortene på «Min læring» kan
// friste med de samme bildene som resten av appen.

import type { Manifest, ManifestTopic } from '../../../types';

const topicById = (
    manifest: Manifest,
    subjectId: string,
    topicId: string
): ManifestTopic | null => {
    const subject = manifest.subjects.find((s) => s.id === subjectId);
    return subject?.topics.find((t) => t.id === topicId) ?? null;
};

// Emnets hero-bilde, med første lesson-bilde som fallback.
export const findTopicImage = (
    manifest: Manifest,
    subjectId: string,
    topicId: string
): string | undefined => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return undefined;
    if (topic.image) return topic.image;
    for (const lesson of topic.lessons ?? []) {
        if (lesson.image) return lesson.image;
    }
    for (const sub of topic.subTopics ?? []) {
        if (sub.image) return sub.image;
        for (const lesson of sub.lessons) {
            if (lesson.image) return lesson.image;
        }
    }
    return undefined;
};
