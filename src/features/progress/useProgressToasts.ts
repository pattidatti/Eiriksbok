// Flyktig toast-kø for XP, nivå og badges. Ikke persistert - toasts hører
// til øyeblikket. Egen liten store slik at progresjonsstoren kan pushe
// uten React-kontekst, og ProgressToaster kan abonnere.

import { create } from 'zustand';
import type { BadgeDef, BadgeTier } from './types';

export type ProgressToast =
    | { id: number; type: 'xp'; xp: number; title?: string }
    | { id: number; type: 'levelup'; level: number }
    | { id: number; type: 'badge'; badge: BadgeDef; tier: BadgeTier }
    | { id: number; type: 'retro'; xp: number; badgeCount: number };

// Omit må distribueres over union-typen, ellers kollapser feltene
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

interface ProgressToastState {
    toasts: ProgressToast[];
    push: (toast: DistributiveOmit<ProgressToast, 'id'>) => void;
    dismiss: (id: number) => void;
}

let nextId = 1;

export const useProgressToasts = create<ProgressToastState>()((set) => ({
    toasts: [],
    push: (toast) =>
        set((state) => ({
            // Maks 4 samtidige - eldste ryker først
            toasts: [...state.toasts, { ...toast, id: nextId++ } as ProgressToast].slice(-4),
        })),
    dismiss: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
