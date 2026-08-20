import { create } from 'zustand';

interface AudioBarState {
    /** Sant når den flytende opplesnings-linja er synlig nederst på skjermen. */
    isVisible: boolean;
    setVisible: (value: boolean) => void;
}

/**
 * Liten delt flagg-store slik at annen flytende UI (f.eks. «til toppen»-knappen)
 * kan flytte seg opp når opplesnings-linja dukker opp nederst.
 */
export const useAudioBarStore = create<AudioBarState>((set) => ({
    isVisible: false,
    setVisible: (value) => set({ isVisible: value }),
}));
