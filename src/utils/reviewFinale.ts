// Velger «dagens spill» - mikrospill-finalen i Dagens økt. Ren logikk uten
// React: deterministisk per dag (seeded PRNG), og matcher spillet mot temaene
// eleven faktisk repeterte (topic-match > fag-match > hvilket som helst).

import type { DailyGamePick, SessionExercise } from '../types/review';
import type { MicroGameMap } from '../hooks/useMicroGameMap';
import { djb2Hash, mulberry32 } from './reviewScheduler';

export interface FinaleRegistryEntry {
    id: string;
    title: string;
    estimatedSeconds?: number;
}

// Kurateringsluke: spill som ikke egner seg som finale (for lange, krever
// artikkelkontekst e.l.) legges inn her med id.
export const REVIEW_GAME_EXCLUDE: ReadonlySet<string> = new Set([]);

// Finalen skal være en rask godbit, ikke en ny arbeidsøkt
export const MAX_FINALE_SECONDS = 150;

export function pickDailyGame(
    registry: Record<string, FinaleRegistryEntry>,
    gameMap: MicroGameMap | null,
    exercises: SessionExercise[],
    today: string
): DailyGamePick | null {
    const eligible = Object.values(registry).filter(
        (entry) =>
            !REVIEW_GAME_EXCLUDE.has(entry.id) &&
            typeof entry.estimatedSeconds === 'number' &&
            entry.estimatedSeconds <= MAX_FINALE_SECONDS
    );
    if (eligible.length === 0) return null;

    let candidates = eligible;
    if (gameMap) {
        const topicIds = new Set(exercises.map((e) => e.topicId).filter(Boolean));
        const subjectIds = new Set(exercises.map((e) => e.subjectId).filter(Boolean));
        const topicMatch = eligible.filter((e) => topicIds.has(gameMap[e.id]?.topicId));
        const subjectMatch = eligible.filter((e) => subjectIds.has(gameMap[e.id]?.subjectId));
        candidates = topicMatch.length > 0 ? topicMatch : subjectMatch.length > 0 ? subjectMatch : eligible;
    }

    const sorted = [...candidates].sort((a, b) => (a.id < b.id ? -1 : 1));
    const rng = mulberry32(djb2Hash(today + ':game'));
    const pick = sorted[Math.floor(rng() * sorted.length)];
    return {
        gameId: pick.id,
        title: pick.title,
        estimatedSeconds: pick.estimatedSeconds,
    };
}
