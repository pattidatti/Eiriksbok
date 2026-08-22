import { useEffect, useState } from 'react';
import { ERAS, getEraForYear } from '../data/timelineEras';
import type { GlobalTimelineEvent } from '../types';
import { isPendingImage } from '../utils/imageAvailability';

const FALLBACK_ERA = ERAS[ERAS.length - 1];

// Manifestet over event→bilde-koblinger genereres av scripts/generate-timeline-images.mjs.
// Vi laster det én gang på modulnivå (samme livssyklus som useGlobalTimeline) og deler
// promise mellom alle kall slik at vi unngår duplikate requests.
let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

function loadImageMap(): Promise<Record<string, string>> {
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;
    inflight = fetch('/content/global-timeline-images.json')
        .then((r) => (r.ok ? r.json() : {}))
        .then((data) => {
            const raw = data && typeof data === 'object' ? (data as Record<string, string>) : {};
            // Vask bort bilder som ikke er generert ennå én gang, her ved lastingen.
            // Da slipper hver forbruker å huske på det, og eventet får epoke-
            // fargestripen sin i stedet for en brutt bilderamme.
            cache = Object.fromEntries(
                Object.entries(raw).filter(([, src]) => !isPendingImage(src))
            );
            return cache;
        })
        .catch(() => {
            cache = {};
            return cache;
        });
    return inflight;
}

export interface TimelineImageResult {
    src: string | null;
    eraId: string;
    eraColor: string;
}

// Returnerer bilde-src for et event, eller null hvis ingen finnes. Anroperen
// bruker eraColor til å vise en epoke-fargestripe i stedet, slik at kort uten
// bilde fortsatt ser intensjonelle ut (ikke tomme bokser).
// Last hele bilde-mapsen én gang og returner den. Brukt av parent-komponenter
// som klassifiserer mange events samtidig (f.eks. magisk-modus tidslinje).
export function useTimelineImageMap(): Record<string, string> | null {
    const [map, setMap] = useState<Record<string, string> | null>(cache);
    useEffect(() => {
        if (map !== null) return;
        let cancelled = false;
        loadImageMap().then((data) => {
            if (!cancelled) setMap(data);
        });
        return () => {
            cancelled = true;
        };
    }, [map]);
    return map;
}

export function useTimelineImage(event: GlobalTimelineEvent | null): TimelineImageResult {
    const [map, setMap] = useState<Record<string, string> | null>(cache);

    useEffect(() => {
        if (map !== null) return;
        let cancelled = false;
        loadImageMap().then((data) => {
            if (!cancelled) setMap(data);
        });
        return () => {
            cancelled = true;
        };
    }, [map]);

    if (!event) {
        return { src: null, eraId: FALLBACK_ERA.id, eraColor: FALLBACK_ERA.color };
    }

    const era = getEraForYear(event.startDate);
    const src = map ? (map[event.id] ?? null) : null;
    return { src, eraId: era.id, eraColor: era.color };
}
