// «Lest»-sporing for artikler: åpnet + minimumstid. Minimumstiden skalerer
// med artikkelens estimerte lesetid (readTime-feltet), avgrenset til 45-120
// sekunder. recordActivity håndterer selv første gang vs. daglig bonus.

import { useEffect } from 'react';
import { useProgressStore } from './useProgressStore';

interface ArticleReadTrackerOptions {
    enabled: boolean;
    // URL-sti uten ledende skråstrek, f.eks. 'historie/vikingtiden/rikssamlingen'
    path: string;
    subjectId?: string;
    topicId?: string;
    title?: string;
    // F.eks. '8 min lesning'
    readTime?: string;
}

const minSecondsFor = (readTime?: string): number => {
    const minutes = parseInt(readTime ?? '', 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return 120;
    return Math.min(120, Math.max(45, (minutes * 60) / 3));
};

export const useArticleReadTracker = ({
    enabled,
    path,
    subjectId,
    topicId,
    title,
    readTime,
}: ArticleReadTrackerOptions): void => {
    useEffect(() => {
        if (!enabled || !path) return;
        const timer = setTimeout(() => {
            useProgressStore.getState().recordActivity({
                kind: 'article-read',
                activityId: path,
                subjectId,
                topicId,
                title,
            });
        }, minSecondsFor(readTime) * 1000);
        return () => clearTimeout(timer);
    }, [enabled, path, subjectId, topicId, title, readTime]);
};
