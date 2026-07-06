// Fag-mestring: dekning (hvor mye av fagets innhold er fullført) per fag,
// og kvalitet (hvor godt gikk det) per emne. Rene funksjoner over manifestet
// og progresjonsdataene - ingen React.
//
// Nøkkelformater i firstCompletions/bestScores:
//   article-read:<subject>/<topic>[/<subtopic>]/<lesson>
//   quiz-completed:<url-sti uten ledende skråstrek>
//   path-completed:<pathId>            (pathId = tool.id i manifestet)
//   path-step-completed:<pathId>/<stegId>

import type { Manifest, ManifestSubject, ManifestTopic, TopicTool } from '../../types';
import type { ActivityEvent } from './types';

export type QualityLevel = 'green' | 'yellow' | 'red';

// Retning på resultatene i et emne over tid. null = for lite data til å si noe.
export type MasteryTrend = 'up' | 'down' | 'flat' | null;

export interface TopicMastery {
    topicId: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    // null = ingen kvalitetsdata (ingen quiz/sti tatt i emnet ennå)
    quality: number | null;
    qualityLevel: QualityLevel | null;
    // Blir eleven bedre eller dårligere i emnet? Regnet fra hendelsesloggen.
    trend: MasteryTrend;
}

export interface SubjectMastery {
    subjectId: string;
    title: string;
    totalUnits: number;
    completedUnits: number;
    coverage: number; // 0-1
    topics: TopicMastery[];
}

export const qualityLevelFor = (quality: number): QualityLevel =>
    quality >= 0.8 ? 'green' : quality >= 0.5 ? 'yellow' : 'red';

// Læringssti-verktøy og tidsreiser regnes ikke som «artikler»
const isArticleLayout = (layout?: string): boolean =>
    layout !== 'learning-path' && layout !== 'learning-path-v2' && layout !== 'tool';

const lessonPathsForTopic = (subjectId: string, topic: ManifestTopic): string[] => {
    const paths: string[] = [];
    for (const lesson of topic.lessons ?? []) {
        if (!isArticleLayout(lesson.layout)) continue;
        paths.push(`${subjectId}/${topic.id}/${lesson.id}`);
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            if (!isArticleLayout(lesson.layout)) continue;
            paths.push(`${subjectId}/${topic.id}/${sub.id}/${lesson.id}`);
        }
    }
    return paths;
};

const isPathTool = (tool: TopicTool): boolean => tool.id.includes('sti');

const pathToolsForTopic = (topic: ManifestTopic): TopicTool[] => {
    const tools = [...(topic.tools ?? [])];
    for (const sub of topic.subTopics ?? []) tools.push(...(sub.tools ?? []));
    return tools.filter(isPathTool);
};

const allPathTools = (subject: ManifestSubject): TopicTool[] => {
    const tools = (subject.tools ?? []).filter(isPathTool);
    for (const topic of subject.topics) tools.push(...pathToolsForTopic(topic));
    return tools;
};

// Gjennomsnittlig kvalitet i et emne fra beste quiz-/sti-resultater
const topicQuality = (
    subjectId: string,
    topic: ManifestTopic,
    bestScores: Record<string, number>
): number | null => {
    const quizPrefix = `quiz-completed:${subjectId}/${topic.id}/`;
    const pathIds = pathToolsForTopic(topic).map((t) => t.id);
    const scores: number[] = [];
    for (const [key, score] of Object.entries(bestScores)) {
        if (key.startsWith(quizPrefix)) {
            scores.push(score);
            continue;
        }
        for (const pathId of pathIds) {
            if (
                key === `path-completed:${pathId}` ||
                key.startsWith(`path-step-completed:${pathId}/`)
            ) {
                scores.push(score);
                break;
            }
        }
    }
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
};

// Terskel for hva som teller som en reell endring i resultat (7 prosentpoeng).
const TREND_THRESHOLD = 0.07;

// Blir eleven bedre eller dårligere i et emne? Ser på scorede hendelser
// (quiz/sti) i emnet, i tidsrekkefølge, og sammenligner siste resultat med
// snittet av de foregående. Krever minst to datapunkter.
const topicTrend = (
    subjectId: string,
    topicId: string,
    events: ActivityEvent[]
): MasteryTrend => {
    const scored = events
        .filter((e) => {
            if (e.score === undefined) return false;
            const parts = e.activityId.split('/');
            return parts[0] === subjectId && parts[1] === topicId;
        })
        .sort((a, b) => a.at - b.at)
        .map((e) => e.score as number);

    if (scored.length < 2) return null;
    const recent = scored[scored.length - 1];
    const prior = scored.slice(0, -1);
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    const diff = recent - priorAvg;
    if (diff > TREND_THRESHOLD) return 'up';
    if (diff < -TREND_THRESHOLD) return 'down';
    return 'flat';
};

export const computeMastery = (
    manifest: Manifest,
    firstCompletions: Record<string, number>,
    bestScores: Record<string, number>,
    events: ActivityEvent[] = []
): SubjectMastery[] => {
    const isRead = (path: string): boolean => Boolean(firstCompletions[`article-read:${path}`]);
    const isPathDone = (pathId: string): boolean =>
        Boolean(firstCompletions[`path-completed:${pathId}`]);

    return manifest.subjects.map((subject) => {
        const topics: TopicMastery[] = subject.topics.map((topic) => {
            const lessonPaths = lessonPathsForTopic(subject.id, topic);
            const completed = lessonPaths.filter(isRead).length;
            const quality = topicQuality(subject.id, topic, bestScores);
            return {
                topicId: topic.id,
                title: topic.title,
                totalLessons: lessonPaths.length,
                completedLessons: completed,
                quality,
                qualityLevel: quality === null ? null : qualityLevelFor(quality),
                trend: topicTrend(subject.id, topic.id, events),
            };
        });

        const pathTools = allPathTools(subject);
        const lessonTotal = topics.reduce((sum, t) => sum + t.totalLessons, 0);
        const lessonDone = topics.reduce((sum, t) => sum + t.completedLessons, 0);
        const pathsDone = pathTools.filter((tool) => isPathDone(tool.id)).length;

        const totalUnits = lessonTotal + pathTools.length;
        const completedUnits = lessonDone + pathsDone;

        return {
            subjectId: subject.id,
            title: subject.title,
            totalUnits,
            completedUnits,
            coverage: totalUnits > 0 ? completedUnits / totalUnits : 0,
            topics: topics.filter((t) => t.totalLessons > 0),
        };
    });
};
