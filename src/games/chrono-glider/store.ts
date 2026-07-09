import { create } from 'zustand';
import { AudioManager } from './systems/AudioManager';

export type GameState = 'menu' | 'playing' | 'gameover' | 'won' | 'level_complete';

export interface TimelineEvent {
    id: string;
    title: string;
    year: number;
    description: string;
    displayDate?: string;
}

// Palettes: [FogColor, GridColor, BackgroundColor (not used directly if Stars used but helpful for fog)]
export const LEVEL_PALETTES = [
    { fog: '#1e1b4b', grid: '#818cf8', accent: '#22d3ee' }, // Level 1: Indigo/Cyan (Arcade)
    { fog: '#450a0a', grid: '#ef4444', accent: '#fca5a5' }, // Level 2: Intense Red
    { fog: '#064e3b', grid: '#34d399', accent: '#a7f3d0' }, // Level 3: Toxic Green
    { fog: '#4a044e', grid: '#e879f9', accent: '#f0abfc' }, // Level 4: Neon Purple
    { fog: '#422006', grid: '#fbbf24', accent: '#fde047' }, // Level 5: Golden Hour
];

export interface GameStore {
    score: number;
    lives: number;
    level: number;
    gameState: GameState;
    speed: number;
    currentEventIndex: number;

    // Content Management
    events: TimelineEvent[]; // Active events for current level
    allEvents: TimelineEvent[]; // Pool of all events loaded
    failedEvents: TimelineEvent[]; // Events failed/missed to be retried

    // Actions
    startGame: () => void;
    endGame: (won: boolean) => void;
    resetGame: () => void;

    startNextLevel: () => void; // New action to proceed from pause

    addScore: (points: number) => void;
    loseLife: () => void;
    gainLife: () => void;
    nextEvent: () => void;
    setAllEvents: (events: TimelineEvent[]) => void; // Initial load
    increaseSpeed: () => void;

    // Feedback
    feedbackTrigger: { type: 'correct' | 'wrong', position: [number, number, number], id: number } | null;
    triggerFeedback: (type: 'correct' | 'wrong', position: [number, number, number]) => void;

    // Player State
    isBoosting: boolean;
    setBoosting: (boosting: boolean) => void;

    // Projectiles triggers (handled via events/store for simplicity or refs in components)
    lastFired: number;
    fireProjectile: () => void;

    // Advanced Stats
    streak: number;
    multiplier: number;
    resetStreak: () => void;
    incrementStreak: () => void;
}

// «Min læring»: registrer runden ved nivåfullføring (score 1) eller tap
// (score 0.3). Id per nivå gjør at nye nivåer gir full XP, repetisjon gir
// daglig bonus. Dynamisk import holder progresjonsstoren ute av spill-bundelen.
const recordGliderRound = (level: number, score: number) => {
    import('../../features/progress/useProgressStore').then(({ useProgressStore }) => {
        useProgressStore.getState().recordActivity({
            kind: 'practice-game',
            activityId: `chrono-glider/level-${level}`,
            subjectId: 'historie',
            title: 'Chrono-Glider',
            score,
        });
    });
};

export const useGameStore = create<GameStore>((set, get) => ({
    score: 0,
    lives: 5,
    level: 1,
    gameState: 'menu',
    speed: 10,
    currentEventIndex: 0,
    events: [],
    allEvents: [],
    failedEvents: [],
    feedbackTrigger: null,
    isBoosting: false,
    lastFired: 0,
    streak: 0,
    multiplier: 1,

    startGame: () => {
        const { allEvents } = get();
        // Initial Batch: Take 10 random
        const initialBatch = [...allEvents].sort(() => Math.random() - 0.5).slice(0, 10);

        set({
            gameState: 'playing',
            score: 0,
            lives: 5,
            level: 1,
            speed: 10,
            currentEventIndex: 0,
            events: initialBatch,
            failedEvents: [],
            feedbackTrigger: null,
            isBoosting: false,
            streak: 0,
            multiplier: 1
        });
    },

    endGame: (won) => {
        recordGliderRound(get().level, won ? 1 : 0.3);
        set({ gameState: won ? 'won' : 'gameover', isBoosting: false });
    },

    resetGame: () => set({ gameState: 'menu', score: 0, lives: 5, level: 1, currentEventIndex: 0, feedbackTrigger: null, isBoosting: false, streak: 0, multiplier: 1 }),

    setAllEvents: (allEvents: TimelineEvent[]) => set({ allEvents }),

    startNextLevel: () => set((state) => {
        // Logic to build next batch
        // 1. Take all failed events from previous level (Retry)
        // 2. Fill the rest up to 10 with random events from allEvents

        const retries = [...state.failedEvents];
        const needed = 10 - retries.length;

        let newEvents = [...retries];
        if (needed > 0) {
            const pool = [...state.allEvents].sort(() => Math.random() - 0.5);
            // Avoid duplicates if possible, but simplest is just pick random
            // Ideally filter out ones just played if pool is large enough
            newEvents = [...newEvents, ...pool.slice(0, needed)];
        }

        return {
            gameState: 'playing',
            level: state.level + 1,
            events: newEvents,
            currentEventIndex: 0,
            failedEvents: [], // Clear failed, they are now active
            speed: state.speed + 2,
            isBoosting: false
        };
    }),

    addScore: (points: number) => set((state) => {
        if (points === 500) AudioManager.getInstance().playCorrect();
        return { score: state.score + (points * state.multiplier) };
    }),

    loseLife: () => set((state) => {
        AudioManager.getInstance().playExplosion();

        // Track failed event if it was a wrong gate choice (logic usually handled in GateManager calling loseLife)
        // If loseLife is called by Obstacle, it's not a 'failed event' per se.
        // But for GateManager, if we pick wrong gate, we lose life AND move to next event? 
        // Or do we retry same gate? Current logic in GateManager:
        // if wrong -> loseLife(), triggerFeedback('wrong'). 
        // It doesn't enable 'nextEvent'. The ship flies through. 
        // So we technically "passed" the event but failed it.
        // We should add current event to failedEvents here or in GateManager.
        // Adding here is safer if we know context, but loseLife is generic.
        // Let's rely on GateManager to call a specific 'failEvent' action?
        // For now, let's assume loseLife during "gate passage" implies failure.
        // But loseLife accounts for obstacles too.
        // Let's add `markCurrentEventFailed` action or just do it in `nextEvent` if we track success?
        // Simplest: GateManager calls `registerFailedEvent` before `nextEvent`.

        const newLives = state.lives - 1;
        if (newLives <= 0) {
            AudioManager.getInstance().playWrong();
            recordGliderRound(state.level, 0.3);
            return { lives: 0, gameState: 'gameover', streak: 0, multiplier: 1 };
        }
        return { lives: newLives, streak: 0, multiplier: 1 };
    }),

    gainLife: () => set((state) => {
        if (state.lives < 5) {
            AudioManager.getInstance().playCorrect();
            return { lives: state.lives + 1 };
        }
        return {};
    }),

    nextEvent: () => set((state) => {
        const nextIndex = state.currentEventIndex + 1;
        if (nextIndex >= state.events.length) {
            // Level Complete!
            AudioManager.getInstance().playCorrect();
            recordGliderRound(state.level, 1);
            return { gameState: 'level_complete' };
        }
        return { currentEventIndex: nextIndex };
    }),

    setEvents: (events: TimelineEvent[]) => set({ events }),

    increaseSpeed: () => set((state) => ({ speed: state.speed + 0.5 })),

    triggerFeedback: (type, position) => {
        if (type === 'correct') AudioManager.getInstance().playCorrect();
        if (type === 'wrong') {
            AudioManager.getInstance().playWrong();
            // Add to failed events!
            const state = get();
            const current = state.events[state.currentEventIndex];
            if (current) {
                // Check if already there to avoid dupes (though unlikely to fail twice in one go without reset)
                if (!state.failedEvents.find(e => e.id === current.id)) {
                    set({ failedEvents: [...state.failedEvents, current] });
                }
            }
        }
        set({ feedbackTrigger: { type, position, id: Date.now() } });
    },

    setBoosting: (boosting) => set((state) => {
        if (boosting && !state.isBoosting) AudioManager.getInstance().playBoost();
        return {
            isBoosting: boosting,
            speed: boosting ? 20 : 10
        };
    }),

    fireProjectile: () => {
        AudioManager.getInstance().playShoot();
        set({ lastFired: Date.now() });
    },

    resetStreak: () => set({ streak: 0, multiplier: 1 }),

    incrementStreak: () => set((state) => {
        const newStreak = state.streak + 1;
        // Multiplier categories
        let newMult = 1;
        if (newStreak >= 3) newMult = 2;
        if (newStreak >= 6) newMult = 3;
        if (newStreak >= 10) newMult = 5;

        return { streak: newStreak, multiplier: newMult };
    }),
}));
