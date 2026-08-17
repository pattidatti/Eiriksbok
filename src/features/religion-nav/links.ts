// Lenkebyggerne for religionsdelen av KRLE.
//
// Prinsippet er at eleven alltid ser religionene gjennom én av Ninian Smarts
// sju dimensjoner, og at den «linsen» skal overleve hvert hopp mellom
// profilen, sammenligningen, tema-siden og artiklene. Derfor bygges alle
// krysslenker her, aldri som håndskrevne strenger ute i komponentene.

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDimension, type DimensionKey } from '../../components/religion/dimensionMeta';

/** Fortellingen er inngangen: den er lettest å henge de andre dimensjonene på. */
export const DEFAULT_LENS: DimensionKey = 'narrative';

const LENS_STORAGE_KEY = 'eiriksbok:krle-linse';

export type ProfileView = 'leksjoner' | 'profil';

export function readStoredLens(): DimensionKey | null {
    try {
        return getDimension(sessionStorage.getItem(LENS_STORAGE_KEY))?.key ?? null;
    } catch {
        return null;
    }
}

export function storeLens(key: string): void {
    if (!getDimension(key)) return;
    try {
        sessionStorage.setItem(LENS_STORAGE_KEY, key);
    } catch {
        // Full eller avslått lagring skal ikke velte navigasjonen
    }
}

/** Løser linsen i prioritert rekkefølge: URL -> forrige valg i økta -> standard. */
export function resolveLens(fromUrl: string | null | undefined): DimensionKey {
    return getDimension(fromUrl)?.key ?? readStoredLens() ?? DEFAULT_LENS;
}

function withParams(path: string, params: Record<string, string | undefined>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
    }
    const suffix = query.toString();
    return suffix ? `${path}?${suffix}` : path;
}

export function profileHref(
    religionId: string,
    options: { dim?: string; visning?: ProfileView } = {}
): string {
    return withParams(`/krle/religion/${religionId}`, {
        dim: getDimension(options.dim)?.key,
        visning: options.visning,
    });
}

export function compareHref(religionIds: string[], dim?: string): string {
    const velg = religionIds.filter(Boolean).join(',');
    return withParams('/krle/sammenlign', {
        velg: velg || undefined,
        dim: getDimension(dim)?.key,
    });
}

export function topicHref(slug: string, options: { fra?: string; dim?: string } = {}): string {
    return withParams(`/krle/sammenlign/tema/${slug}`, {
        fra: options.fra,
        dim: getDimension(options.dim)?.key,
    });
}

/**
 * Linsen slik den står akkurat nå, med en setter som skriver den både til
 * URL-en (delbar) og til økta (så neste side arver den selv om lenken mangler
 * `dim`). URL-en er alltid fasit mens siden står åpen.
 */
export function useLens(): { dim: DimensionKey; setDim: (key: string) => void } {
    const [searchParams, setSearchParams] = useSearchParams();
    const dim = resolveLens(searchParams.get('dim'));

    const setDim = useCallback(
        (key: string) => {
            const resolved = getDimension(key)?.key;
            if (!resolved) return;
            storeLens(resolved);
            setSearchParams(
                (params) => {
                    params.set('dim', resolved);
                    return params;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    return { dim, setDim };
}
