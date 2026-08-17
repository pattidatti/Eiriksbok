// Hvilke av de sju dimensjonene eleven har åpnet i hver religionsprofil.
// Lagres per religion i localStorage av religionsprofilen, og leses av
// religionsbytteren så eleven ser hvor langt hen er kommet i hver profil.

import { getDimension, type DimensionKey } from '../../components/religion/dimensionMeta';

export const profileStorageKey = (religionId: string) =>
    `eiriksbok:religion-profil:${religionId}`;

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
