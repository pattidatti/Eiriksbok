// Bygger «Nylig lest» og «Påbegynte artikler»-listene til «Min læring». Ren
// logikk - ingen React. Begge gjenbruker Recommendation-formen fra engine.ts
// slik at UI-et kan gjenbruke samme SmallCard-komponent som anbefalingene.

import type { Manifest } from '../../../types';
import type { HistoryItem } from '../../../hooks/useUserHistory';
import type { ActivityEvent } from '../types';
import { formatRelativeTimeNo } from '../../../utils/dateUtils';
import { findManifestLesson, type Recommendation } from './engine';
import { findTopicImage } from './images';

// Layout-typer som aldri fullfører via 'article-read' - uten dette filteret
// ville sti-/verktøysider bli værende i "påbegynte artikler" for alltid.
const NON_ARTICLE_LAYOUTS = new Set(['tool', 'learning-path', 'learning-path-v2']);

// ActivityEvent har ikke egne felt for lessonId/subTopicId - kun den fulle
// stien i activityId. Trekker ut halen etter at subjectId/topicId-prefikset
// er fjernet.
const parseLessonSuffix = (
    activityId: string,
    subjectId: string,
    topicId: string
): { lessonId: string; subTopicId?: string } | null => {
    const prefix = `${subjectId}/${topicId}/`;
    if (!activityId.startsWith(prefix)) return null;
    const rest = activityId.slice(prefix.length).split('/');
    if (rest.length === 1) return { lessonId: rest[0] };
    if (rest.length === 2) return { subTopicId: rest[0], lessonId: rest[1] };
    return null;
};

// Artikler eleven har fullført nylig, nyeste først.
export const buildRecentlyRead = (
    manifest: Manifest,
    events: ActivityEvent[],
    limit = 6,
    now: number = Date.now()
): Recommendation[] => {
    // Dedupliser på activityId - behold nyeste hendelse ved gjenlesning.
    const newest = new Map<string, ActivityEvent>();
    for (const e of events) {
        if (e.kind !== 'article-read' || !e.subjectId || !e.topicId) continue;
        const existing = newest.get(e.activityId);
        if (!existing || e.at > existing.at) newest.set(e.activityId, e);
    }

    return Array.from(newest.values())
        .sort((a, b) => b.at - a.at)
        .slice(0, limit)
        .map((e): Recommendation => {
            const subjectId = e.subjectId as string;
            const topicId = e.topicId as string;
            const suffix = parseLessonSuffix(e.activityId, subjectId, topicId);
            const lesson = suffix
                ? findManifestLesson(manifest, subjectId, topicId, suffix.lessonId, suffix.subTopicId)
                : null;
            return {
                id: `recent-${e.activityId}`,
                type: 'recent',
                title: e.title ?? lesson?.title ?? e.activityId,
                reason: `Lest ${formatRelativeTimeNo(e.at, now)}`,
                link: `/${e.activityId}`,
                subjectId,
                image: lesson?.image ?? findTopicImage(manifest, subjectId, topicId),
                score: 0,
            };
        });
};

// Artikler eleven har åpnet, men ikke fullført ennå - nyeste først.
export const buildStartedArticles = (
    manifest: Manifest,
    history: HistoryItem[],
    firstCompletions: Record<string, number>,
    limit = 6,
    now: number = Date.now()
): Recommendation[] => {
    const out: Recommendation[] = [];
    const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

    for (const item of sorted) {
        if (item.type !== 'lesson' || !item.topicId) continue;

        const lesson = findManifestLesson(manifest, item.subjectId, item.topicId, item.id, item.subTopicId);
        if (!lesson) continue;
        if (lesson.layout && NON_ARTICLE_LAYOUTS.has(lesson.layout)) continue;

        const path = `${item.subjectId}/${item.topicId}${item.subTopicId ? `/${item.subTopicId}` : ''}/${item.id}`;
        if (firstCompletions[`article-read:${path}`]) continue;

        out.push({
            id: `started-${path}`,
            type: 'started',
            title: item.title,
            reason: `Åpnet ${formatRelativeTimeNo(item.timestamp, now)}`,
            link: `/${path}`,
            subjectId: item.subjectId,
            image: lesson.image ?? findTopicImage(manifest, item.subjectId, item.topicId),
            score: 0,
        });
        if (out.length >= limit) break;
    }

    return out;
};
