import { useQuery } from '@tanstack/react-query';

export interface MicroGameMapEntry {
    subjectId: string;
    topicId: string;
}

export type MicroGameMap = Record<string, MicroGameMapEntry>;

// Genereres av scripts/generate-microgame-map.mjs (del av scan:content).
// Kobler mikrospill-id til fag/tema slik at «Dagens økt» kan velge et
// dagens-spill som matcher det eleven repeterer.
const fetchMicroGameMap = async (): Promise<MicroGameMap> => {
    const response = await fetch('/content/microgame-map.json');
    if (!response.ok) throw new Error('Failed to load microgame map');
    const data = await response.json();
    return data && typeof data === 'object' ? (data as MicroGameMap) : {};
};

export const useMicroGameMap = (): MicroGameMap | null => {
    const { data } = useQuery<MicroGameMap>({
        queryKey: ['microgame-map'],
        queryFn: fetchMicroGameMap,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
    });
    return data ?? null;
};
