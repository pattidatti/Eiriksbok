// Fremdriften eleven har gjennom religionsrommet.
//
// Tre kilder, som til sammen svarer på «hvor langt er jeg kommet?»:
//  - dimensjoner åpnet per religionsprofil (localStorage, skrives av profilen)
//  - temaer besøkt på tvers (localStorage, skrives av tema-sidene)
//  - artikler lest (useProgressStore, som eier XP og fullføringer)
//
// De to første ligger her fordi de er navigasjonsspor, ikke prestasjoner:
// de skal fylle en ring med en gang eleven har vært innom, uten å gi XP.

import { getDimension, DIMENSIONS, type DimensionKey } from '../../components/religion/dimensionMeta';
import { useProgressStore } from '../progress/useProgressStore';

export const profileStorageKey = (religionId: string) =>
    `eiriksbok:religion-profil:${religionId}`;

const TOPIC_STORAGE_KEY = 'eiriksbok:krle-temaer';

export function loadVisitedDimensions(religionId: string): Set<DimensionKey> {
    try {
        const raw = localStorage.getItem(profileStorageKey(religionId));
        if (!raw) return new Set();
        const parsed = JSON.parse(raw) as string[];
        return new Set(parsed.filter((key): key is DimensionKey => Boolean(getDimension(key))));
    } catch {
        return new Set();
    }
}

export function saveVisitedDimensions(religionId: string, visited: Iterable<string>): void {
    try {
        localStorage.setItem(profileStorageKey(religionId), JSON.stringify([...visited]));
    } catch {
        // Full eller avslått lagring skal ikke velte siden
    }
}

/** Temaene eleven har åpnet på /krle/sammenlign/tema/:tag. */
export function loadVisitedTopics(): Set<string> {
    try {
        const raw = localStorage.getItem(TOPIC_STORAGE_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch {
        return new Set();
    }
}

export function markTopicVisited(slug: string): void {
    try {
        const visited = loadVisitedTopics();
        if (visited.has(slug)) return;
        visited.add(slug);
        localStorage.setItem(TOPIC_STORAGE_KEY, JSON.stringify([...visited]));
    } catch {
        // Se over
    }
}

export interface ReligionProgress {
    /** Av de sju dimensjonene i profilen */
    dimensionsRead: number;
    dimensionsTotal: number;
    /** Av leksjonene religionen har i manifestet */
    lessonsRead: number;
    lessonsTotal: number;
    /** Profilen er gjennomgått i sin helhet */
    profileComplete: boolean;
}

/**
 * Slår sammen de tre kildene for én religion. `lessonsTotal` kommer fra
 * manifestet og må sendes inn - fremdriftsmodulen kjenner ikke innholdet.
 */
export function religionProgress(religionId: string, lessonsTotal: number): ReligionProgress {
    const dimensionsRead = loadVisitedDimensions(religionId).size;

    // Artikkelfullføringer ligger som 'article-read:krle/religion/<id>/<slug>'
    const prefix = `article-read:krle/religion/${religionId}/`;
    const completions = useProgressStore.getState().firstCompletions;
    const lessonsRead = Object.keys(completions).filter(
        // Profilen registreres med samme prefiks, men slutter på /profil og er
        // ikke en leksjon
        (key) => key.startsWith(prefix) && !key.endsWith('/profil')
    ).length;

    return {
        dimensionsRead,
        dimensionsTotal: DIMENSIONS.length,
        lessonsRead: Math.min(lessonsRead, lessonsTotal),
        lessonsTotal,
        profileComplete: dimensionsRead >= DIMENSIONS.length,
    };
}
