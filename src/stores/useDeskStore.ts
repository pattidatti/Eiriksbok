import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '../utils/safeStorage';

interface DeskState {
    tools: {
        typewriter: boolean;
        prism: boolean;
        xray: boolean;
    };
    inventory: string[]; // IDs of found concepts/devices
    unlockTool: (tool: keyof DeskState['tools']) => void;
    collectItem: (itemId: string) => void;
    hasItem: (itemId: string) => boolean;
    resetDesk: () => void;
}

export const useDeskStore = create<DeskState>()(
    persist(
        (set, get) => ({
            tools: {
                typewriter: true, // Typewriter is always available as the "creation" tool
                prism: false,
                xray: false,
            },
            inventory: [],

            unlockTool: (tool) => set((state) => ({
                tools: { ...state.tools, [tool]: true }
            })),

            collectItem: (itemId) => set((state) => {
                if (state.inventory.includes(itemId)) return state;
                return { inventory: [...state.inventory, itemId] };
            }),

            hasItem: (itemId) => get().inventory.includes(itemId),

            resetDesk: () => set({
                tools: { typewriter: true, prism: false, xray: false },
                inventory: []
            })
        }),
        {
            name: 'virkemidler-desk-storage',
            storage: createJSONStorage(() => safeLocalStorage),
        }
    )
);
