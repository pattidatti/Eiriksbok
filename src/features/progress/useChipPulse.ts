// Flyktig puls-signal til ProgressChip i toppmenyen. XpFlight kaller burst()
// i det XP-orben lander, slik at chipen popper i takt med animasjonen -
// ikke i det øyeblikket XP-en bokføres i storen.

import { create } from 'zustand';

export interface ChipPulse {
    id: number;
    xp: number;
}

interface ChipPulseState {
    pulse: ChipPulse | null;
    burst: (xp: number) => void;
    clear: (id: number) => void;
}

let nextId = 1;

export const useChipPulse = create<ChipPulseState>()((set) => ({
    pulse: null,
    burst: (xp) => set({ pulse: { id: nextId++, xp } }),
    clear: (id) => set((state) => (state.pulse?.id === id ? { pulse: null } : state)),
}));
