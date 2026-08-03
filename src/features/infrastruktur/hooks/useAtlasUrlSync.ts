import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtlasStore } from '../store/atlasStore';
import type { LayerType } from '../types';

const ALL_LAYERS: LayerType[] = ['shipping', 'cables', 'pipelines', 'production', 'chokepoints', 'riskzones'];

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    }) as T;
}

export function useAtlasUrlSync(
    transform: { scale: number; x: number; y: number }
) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { activeLayers, toggleLayer } = useAtlasStore();
    const initializedRef = useRef(false);

    // Read initial state from URL on mount
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const layersParam = searchParams.get('layers');
        if (layersParam) {
            const urlLayers = new Set(layersParam.split(',').filter((l) => ALL_LAYERS.includes(l as LayerType)) as LayerType[]);
            // Toggle layers to match URL
            ALL_LAYERS.forEach((l) => {
                const inUrl = urlLayers.has(l);
                const inStore = activeLayers.has(l);
                if (inUrl !== inStore) toggleLayer(l);
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced URL write. useMemo, ikke useCallback: debounce() lager funksjonen,
    // den *er* ikke funksjonen — med useCallback ble en ny debounce-instans bygd
    // hver render bare for å bli kastet.
    const debouncedUpdate = useMemo(
        () =>
            debounce((t: typeof transform, layers: Set<LayerType>) => {
                setSearchParams(
                    {
                        zoom: String(Math.round(t.scale * 100) / 100),
                        x: String(Math.round(t.x)),
                        y: String(Math.round(t.y)),
                        layers: [...layers].join(','),
                    },
                    { replace: true }
                );
            }, 500),
        [setSearchParams]
    );

    useEffect(() => {
        debouncedUpdate(transform, activeLayers);
    }, [transform, activeLayers, debouncedUpdate]);
}
