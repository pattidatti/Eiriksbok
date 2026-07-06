const STATS_KEY = 'chrono_stats_v1';
const TUTORIAL_KEY = 'chrono_tutorial_seen_v1';

export interface ChronoStats {
    failedEventIds: Record<string, number>;
    placedEventIds: Record<string, number>;
    totalGames: number;
    bestStreak: number;
    totalCorrect: number;
    totalAttempts: number;
    lastPlayed: number;
}

const EMPTY: ChronoStats = {
    failedEventIds: {},
    placedEventIds: {},
    totalGames: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    lastPlayed: 0,
};

function read(): ChronoStats {
    if (typeof window === 'undefined') return { ...EMPTY };
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return { ...EMPTY };
        const parsed = JSON.parse(raw) as Partial<ChronoStats>;
        return { ...EMPTY, ...parsed };
    } catch {
        return { ...EMPTY };
    }
}

function write(stats: ChronoStats) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        /* quota or disabled - silently ignore */
    }
}

export function getStats(): ChronoStats {
    return read();
}

export function recordMissed(eventId: string) {
    const s = read();
    s.failedEventIds[eventId] = (s.failedEventIds[eventId] || 0) + 1;
    s.totalAttempts += 1;
    write(s);
}

export function recordPlaced(eventId: string) {
    const s = read();
    s.placedEventIds[eventId] = (s.placedEventIds[eventId] || 0) + 1;
    s.totalAttempts += 1;
    s.totalCorrect += 1;
    write(s);
}

export function recordGameEnd(bestStreakThisGame: number) {
    const s = read();
    s.totalGames += 1;
    s.bestStreak = Math.max(s.bestStreak, bestStreakThisGame);
    s.lastPlayed = Date.now();
    write(s);
    // «Min læring»: hver fullførte chrono-runde teller (id per runde-nummer
    // så de første rundene gir full XP, senere runder daglig bonus)
    import('../features/progress/useProgressStore').then(({ useProgressStore }) => {
        useProgressStore.getState().recordActivity({
            kind: 'practice-game',
            activityId: `chrono/runde-${Math.min(s.totalGames, 10)}`,
            title: 'Chrono',
        });
    });
}

export function resetStats() {
    write({ ...EMPTY });
}

export function countWeakEventsInPool<T extends { id: string }>(pool: T[]): number {
    const s = read();
    return pool.filter((e) => (s.failedEventIds[e.id] || 0) > 0).length;
}

/**
 * Fisher-Yates shuffle with a weighting bias: events that have been failed
 * before get duplicate entries (up to 3 copies), which makes them more likely
 * to appear early in the deck. Successfully-placed events without failures
 * get a slight de-emphasis (still always included, just less likely to be early).
 *
 * Always returns a deck with exactly `events.length` unique events. Duplicates
 * are de-duplicated after the weighted draw.
 */
export function weightedShuffle<T extends { id: string }>(events: T[]): T[] {
    if (events.length <= 1) return [...events];
    const s = read();

    // Build a weighted pool: each event added 1-3 times based on miss history.
    const pool: T[] = [];
    for (const event of events) {
        const misses = s.failedEventIds[event.id] || 0;
        const successes = s.placedEventIds[event.id] || 0;
        let weight = 1;
        if (misses > 0) weight = Math.min(3, 1 + misses);
        // Heavily mastered events (placed >=3 times, never missed) get half weight via probability.
        if (misses === 0 && successes >= 3) weight = Math.random() < 0.5 ? 1 : 0;
        for (let i = 0; i < weight; i++) pool.push(event);
    }
    // Fisher-Yates on weighted pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // De-duplicate while preserving first-seen order
    const seen = new Set<string>();
    const deck: T[] = [];
    for (const e of pool) {
        if (!seen.has(e.id)) {
            seen.add(e.id);
            deck.push(e);
        }
    }
    // Backfill any events that weren't in pool (e.g. mastered events that rolled 0)
    for (const e of events) {
        if (!seen.has(e.id)) deck.push(e);
    }
    return deck;
}

export function hasSeenTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
}

export function markTutorialSeen() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {
        /* ignore */
    }
}

export function resetTutorial() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(TUTORIAL_KEY);
    } catch {
        /* ignore */
    }
}
