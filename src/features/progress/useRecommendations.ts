// Delt hook for anbefalingsmotoren: samler manifest, mestring, påbegynte
// stier, repetisjonskø og detektivkatalog, og bygger den rangerte lista.
// Brukes av «Min læring» og av Min læring-modulen på forsiden.

import { useEffect, useMemo, useState } from 'react';
import { useManifest } from '../../hooks/useManifest';
import { useProgressStore } from './useProgressStore';
import { useReviewStore } from '../../stores/useReviewStore';
import { useLearningPathProfile } from '../../stores/useLearningPathProfile';
import { useUserHistory } from '../../hooks/useUserHistory';
import { computeMastery } from './mastery';
import { buildRecommendations } from './recommendations/engine';
import { buildLessonTagIndex, buildInterestProfile } from './recommendations/interest';
import { makeVisitSeed } from './recommendations/rng';
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
    const { history } = useUserHistory();

    // Frø for dynamisk rotasjon: settes én gang per mount (useState-initialiser
    // kjøres nøyaktig én gang), så feeden er stabil innenfor sidevisningen, men
    // roterer ved neste besøk. localStorage-lesningen skjer kun her, ikke i motoren.
    const [rotationSeed] = useState(() => makeVisitSeed());
    // Fest «nå» ved mount - holder interesse-profilens ferskhets-vekting stabil
    // gjennom sidevisningen (og unngår urene Date.now()-kall under render).
    const [now] = useState(() => Date.now());

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

    // Tagg-indeksen avhenger kun av manifestet - bygg den én gang.
    const lessonIndex = useMemo(
        () => (manifest ? buildLessonTagIndex(manifest) : undefined),
        [manifest]
    );

    // Interesse-profilen bygges av engasjementet ditt (fullført + åpnet).
    const interestProfile = useMemo(
        () =>
            lessonIndex
                ? buildInterestProfile({
                      index: lessonIndex,
                      firstCompletions,
                      events,
                      history,
                      now,
                  })
                : undefined,
        [lessonIndex, firstCompletions, events, history, now]
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
            lessonIndex,
            interestProfile,
            history,
            rotationSeed,
        });
    }, [
        manifest,
        mastery,
        firstCompletions,
        events,
        paths,
        dueCount,
        detectiveCases,
        lessonIndex,
        interestProfile,
        history,
        rotationSeed,
    ]);

    return { manifest, mastery, recommendations, detectiveCases, dueCount };
};
