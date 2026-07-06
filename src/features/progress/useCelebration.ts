// Kø for feiringsseremonier - de store øyeblikkene som fortjener mer enn en
// liten toast: nivå-opp, gull-utmerkelse og «alle dagens mål fullført».
// Egen liten store (som toast-køen) slik at progresjonsstoren kan pushe uten
// React-kontekst, og CelebrationOverlay kan abonnere.

import { create } from 'zustand';

export type Celebration =
    | { id: number; type: 'levelup'; level: number }
    | { id: number; type: 'badge-gull'; title: string; emoji: string }
    | { id: number; type: 'goals'; xp: number };

type CelebrationInput =
    | { type: 'levelup'; level: number }
    | { type: 'badge-gull'; title: string; emoji: string }
    | { type: 'goals'; xp: number };

interface CelebrationState {
    queue: Celebration[];
    celebrate: (c: CelebrationInput) => void;
    dismissCurrent: () => void;
}

let nextId = 1;

export const useCelebration = create<CelebrationState>()((set) => ({
    queue: [],
    celebrate: (c) =>
        set((state) => ({
            // Maks 3 i kø - urealistisk å nå, men hindrer opphopning.
            queue: [...state.queue, { ...c, id: nextId++ } as Celebration].slice(-3),
        })),
    dismissCurrent: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
