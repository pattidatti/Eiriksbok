import { useCallback, useState } from 'react';

// Varig lagring per arkadespill: rekord, antall runder, samlinger. Det er dette
// som gjør at eleven kommer tilbake - «312 poeng til neste rang» virker bare hvis
// spillet husker forrige runde.
//
// Alt pakkes i try/catch: privat modus og blokkerte data skal gi et spill som
// virker, bare uten hukommelse.

const PREFIX = 'arcade_';

export function loadArcadeSave<T extends object>(gameId: string, defaults: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + gameId);
        if (!raw) return { ...defaults };
        const parsed = JSON.parse(raw) as Partial<T>;
        return { ...defaults, ...parsed };
    } catch {
        return { ...defaults };
    }
}

export function writeArcadeSave<T extends object>(gameId: string, save: T) {
    try {
        localStorage.setItem(PREFIX + gameId, JSON.stringify(save));
    } catch {
        // ignorer - spillet virker uten lagring
    }
}

/** React-speil av lagringen. `update` skriver til disk med én gang. */
export function useArcadeSave<T extends object>(gameId: string, defaults: T) {
    const [save, setSave] = useState<T>(() => loadArcadeSave(gameId, defaults));
    const update = useCallback(
        (fn: (prev: T) => T) => {
            setSave((prev) => {
                const next = fn(prev);
                writeArcadeSave(gameId, next);
                return next;
            });
        },
        [gameId]
    );
    return [save, update] as const;
}

/** Rangtittel for en poengsum. `ranks` er sortert stigende på terskel. */
export function rankFor(ranks: [number, string][], score: number): string {
    let r = ranks[0][1];
    for (const [min, name] of ranks) if (score >= min) r = name;
    return r;
}

/** Neste rang over `score`, eller null når toppen er nådd. */
export function nextRank(ranks: [number, string][], score: number): [number, string] | null {
    return ranks.find(([min]) => min > score) ?? null;
}
