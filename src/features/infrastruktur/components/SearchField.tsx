import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { GeoProjection } from 'd3-geo';
import { geoNaturalEarth1 } from 'd3-geo';
import { pipelines } from '../data/pipelines';
import { productionSites } from '../data/productionSites';
import { chokepoints } from '../data/chokepoints';
import { useAtlasStore } from '../store/atlasStore';
import type { LayerType, SelectedFeature } from '../types';

interface SearchItem {
    label: string;
    type: LayerType;
    coords: [number, number];
    // Samme sett som info-panelet viser - søketreffet sendes rett dit.
    data: SelectedFeature['data'];
}

const WIDTH = 900;
const HEIGHT = 500;

function coordsToViewTarget(coords: [number, number], projection: GeoProjection, scale = 5) {
    const projected = projection(coords);
    if (!projected) return { scale, x: 0, y: 0 };
    const [svgX, svgY] = projected;
    return {
        scale,
        x: WIDTH / 2 - svgX * scale,
        y: HEIGHT / 2 - svgY * scale,
    };
}

export function SearchField() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { setViewTarget, setSelectedFeature, toggleLayer, activeLayers } = useAtlasStore();

    const projection = useMemo(
        () => geoNaturalEarth1().scale(153).translate([WIDTH / 2, HEIGHT / 2]),
        []
    );

    const allItems: SearchItem[] = useMemo(
        () => [
            ...pipelines.map((p) => ({
                label: p.name,
                type: 'pipelines' as LayerType,
                coords: p.coordinates[0],
                data: p,
            })),
            ...productionSites.map((s) => ({
                label: s.name,
                type: 'production' as LayerType,
                coords: s.coordinates,
                data: s,
            })),
            ...chokepoints.map((c) => ({
                label: c.name,
                type: 'chokepoints' as LayerType,
                coords: c.coordinates,
                data: c,
            })),
        ],
        []
    );

    const fuse = useMemo(
        () => new Fuse(allItems, { keys: ['label'], threshold: 0.35 }),
        [allItems]
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];
        return fuse.search(query).slice(0, 6);
    }, [query, fuse]);

    const handleSelect = (item: SearchItem) => {
        // Ensure the layer is active
        if (!activeLayers.has(item.type)) toggleLayer(item.type);
        // Zoom to feature
        const target = coordsToViewTarget(item.coords, projection);
        setViewTarget(target);
        // Open info panel
        setSelectedFeature({ type: item.type, data: item.data });
        setQuery('');
        setOpen(false);
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Søk etter felt, rørledning, flaskehals…"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {open && results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {results.map(({ item }) => (
                        <button
                            key={`${item.type}-${item.label}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors text-left"
                        >
                            <span className="text-slate-500 capitalize">{item.type}</span>
                            <span className="font-medium text-slate-200">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
