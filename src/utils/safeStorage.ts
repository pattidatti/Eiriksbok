import type { StateStorage } from 'zustand/middleware';

// localStorage kan kaste: full kvote (QuotaExceededError), privat modus eller blokkert
// nettstedsdata. Da skal appen virke videre med tilstanden i minnet - ikke stoppe midt
// i et klikk. Zustand-persist kaller setItem synkront inne i set(), så en ubeskyttet
// lagring knekker hele handlingen som endret tilstanden.
const warned = new Set<string>();

export const safeLocalStorage: StateStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            if (!warned.has(key)) {
                warned.add(key);
                console.warn(
                    `[lagring] Klarte ikke å lagre «${key}» (${(err as Error)?.name ?? 'ukjent feil'}). ` +
                        'Tilstanden gjelder til fanen lukkes.'
                );
            }
        }
    },
    removeItem: (key) => {
        try {
            localStorage.removeItem(key);
        } catch {
            // ignorer
        }
    },
};

