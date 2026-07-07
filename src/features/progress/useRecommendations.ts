// Delt hook for anbefalingsmotoren: samler manifest, mestring, påbegynte
// stier, repetisjonskø og detektivkatalog, og bygger den rangerte lista.
// Brukes av «Min læring» og av Min læring-modulen på forsiden.

import { useEffect, useMemo, useState } from 'react';
import { useManifest } from '../../hooks/useManifest';
import { useProgressStore } from './useProgressStore';
import { useReviewStore } from '../../stores/useReviewStore';
import { useLearningPathProfile } from '../../stores/useLearningPathProfile';
import { computeMastery } from './mastery';
import { buildRecommendations } from './recommendations/engine';
import { loadDetectiveCatalog } from './recommendations/catalog';
import { todayLocal } from '../../utils/reviewScheduler';
import type { Manifest } from '../../types';
import type { SubjectMastery } from './mastery';
import type { Recommendation } from './recommendations/engine';
import type { DetectiveCatalogEntry } from './recommendations/catalog';

export interface RecommendationData {
    manifest: Manifest | undefined;
    mastery: SubjectMastery[];
    recommendations: Recommendation[];
    detectiveCases: DetectiveCatalogEntry[];
    dueCount: number;
}

export const useRecommendations = (): RecommendationData => {
    const today = todayLocal();
    const { data: manifest } = useManifest();
    const firstCompletions = useProgressStore((s) => s.firstCompletions);
    const bestScores = useProgressStore((s) => s.bestScores);
    const events = useProgressStore((s) => s.events);
    const paths = useLearningPathProfile((s) => s.paths);
    const dueCount = useReviewStore((s) => s.dueCount(today));

    // Detektivsaker enumereres fra sitt eget manifest (async, lettvekts).
    const [detectiveCases, setDetectiveCases] = useState<DetectiveCatalogEntry[]>([]);
    useEffect(() => {
        let alive = true;
        loadDetectiveCatalog().then((cases) => {
            if (alive) setDetectiveCases(cases);
        });
        return () => {
            alive = false;
        };
    }, []);

    const mastery = useMemo(
        () => (manifest ? computeMastery(manifest, firstCompletions, bestScores, events) : []),
        [manifest, firstCompletions, bestScores, events]
    );

    const recommendations = useMemo(() => {
        if (!manifest) return [];
        return buildRecommendations({
            manifest,
            mastery,
            firstCompletions,
            events,
            paths,
            dueCount,
            detectiveCases,
        });
    }, [manifest, mastery, firstCompletions, events, paths, dueCount, detectiveCases]);

    return { manifest, mastery, recommendations, detectiveCases, dueCount };
};
