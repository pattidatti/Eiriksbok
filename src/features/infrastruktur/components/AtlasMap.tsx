import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import { useQuery } from '@tanstack/react-query';
import { useAtlasStore } from '../store/atlasStore';
import { ShippingLanesLayer } from './layers/ShippingLanesLayer';
import { SubmarineLayer } from './layers/SubmarineLayer';
import { PipelineLayer } from './layers/PipelineLayer';
import { ProductionLayer } from './layers/ProductionLayer';
import { ChokepointLayer } from './layers/ChokepointLayer';
import { RiskZoneLayer } from './layers/RiskZoneLayer';
import { COUNTRY_NAMES } from '../data/countryNames';

// Verdensgeometrien lastes LOKALT (public/data/world/) - aldri fra CDN. På Chromebook
// i klasserom med ustabilt nett ville en CDN-henting gitt blank skjerm.
const GEO_URL = '/data/world/countries-110m.json';

const WIDTH = 900;
const HEIGHT = 500;
const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

async function fetchWorld() {
    const res = await fetch(GEO_URL);
    if (!res.ok) throw new Error('Failed to load world data');
    return res.json();
}

interface Transform {
    scale: number;
    x: number;
    y: number;
}

interface HoverTooltip {
    label: string;
    stat: string;
    x: number;
    y: number;
}

interface AtlasMapProps {
    onTransformChange?: (t: Transform) => void;
}

export function AtlasMap({ onTransformChange }: AtlasMapProps) {
    const activeLayers = useAtlasStore((s) => s.activeLayers);
    const layerOpacities = useAtlasStore((s) => s.layerOpacities);
    const viewTarget = useAtlasStore((s) => s.viewTarget);
    const setViewTarget = useAtlasStore((s) => s.setViewTarget);
    const selectedCountry = useAtlasStore((s) => s.selectedCountry);
    const setSelectedCountry = useAtlasStore((s) => s.setSelectedCountry);

    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
    const panRef = useRef({ active: false, startX: 0, startY: 0, startTX: 0, startTY: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const touchRef = useRef<{ dist: number; midX: number; midY: number } | null>(null);
    const [tooltip, setTooltip] = useState<HoverTooltip | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { data: worldData } = useQuery({
        queryKey: ['world-atlas'],
        queryFn: fetchWorld,
        staleTime: 24 * 60 * 60 * 1000,
    });

    const geographies = useMemo(() => {
        if (!worldData) return [];
        const countries = topojson.feature(worldData, worldData.objects.countries);
        return (countries as any).features;
    }, [worldData]);

    const projection = useMemo(
        () => geoNaturalEarth1().scale(153).translate([WIDTH / 2, HEIGHT / 2]),
        []
    );
    const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

    const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

    // Notify parent of transform changes
    useEffect(() => {
        onTransformChange?.(transform);
    }, [transform, onTransformChange]);

    // Consume viewTarget from store (programmatic zoom)
    useEffect(() => {
        if (!viewTarget) return;
        setTransform(viewTarget);
        setViewTarget(null);
    }, [viewTarget, setViewTarget]);

    // Fullscreen change listener
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Wheel zoom (non-passive to allow preventDefault)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            setTransform((prev) => {
                const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
                const newScale = clampScale(prev.scale * factor);
                const ratio = newScale / prev.scale;
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                return {
                    scale: newScale,
                    x: mouseX - (mouseX - prev.x) * ratio,
                    y: mouseY - (mouseY - prev.y) * ratio,
                };
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.button !== 0) return;
            panRef.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                startTX: transform.x,
                startTY: transform.y,
            };
            setIsPanning(true);
        },
        [transform.x, transform.y]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!panRef.current.active) return;
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setTransform((prev) => ({
            ...prev,
            x: panRef.current.startTX + dx,
            y: panRef.current.startTY + dy,
        }));
    }, []);

    const stopPan = useCallback(() => {
        panRef.current.active = false;
        setIsPanning(false);
    }, []);

    // Pinch-to-zoom touch handlers
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length !== 2) return;
        const [t1, t2] = [e.touches[0], e.touches[1]];
        touchRef.current = {
            dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
            midX: (t1.clientX + t2.clientX) / 2,
            midY: (t1.clientY + t2.clientY) / 2,
        };
    }, []);

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (e.touches.length !== 2 || !touchRef.current) return;
            e.preventDefault();
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const factor = newDist / touchRef.current.dist;
            const rect = containerRef.current!.getBoundingClientRect();
            const mx = touchRef.current.midX - rect.left;
            const my = touchRef.current.midY - rect.top;
            setTransform((prev) => {
                const newScale = clampScale(prev.scale * factor);
                const ratio = newScale / prev.scale;
                return { scale: newScale, x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio };
            });
            touchRef.current.dist = newDist;
        },
        []
    );

    const zoomBy = (factor: number) => {
        setTransform((prev) => {
            const newScale = clampScale(prev.scale * factor);
            const ratio = newScale / prev.scale;
            const rect = containerRef.current?.getBoundingClientRect();
            const cx = rect ? rect.width / 2 : 0;
            const cy = rect ? rect.height / 2 : 0;
            return {
                scale: newScale,
                x: cx - (cx - prev.x) * ratio,
                y: cy - (cy - prev.y) * ratio,
            };
        });
    };

    const resetTransform = () => setTransform({ scale: 1, x: 0, y: 0 });

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    const handleHover = useCallback(
        (info: { label: string; stat: string } | null, x: number, y: number) => {
            if (!info) {
                setTooltip(null);
                return;
            }
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setTooltip({ label: info.label, stat: info.stat, x: x - rect.left, y: y - rect.top });
        },
        []
    );

    return (
        <div
            ref={containerRef}
            className={`w-full h-full overflow-hidden rounded-xl bg-[#0f172a] relative touch-none select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopPan}
            onMouseLeave={stopPan}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
        >
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* Ocean background */}
                <rect width={WIDTH} height={HEIGHT} fill="#0f172a" />

                {/* Risk zones (below countries so they show through) */}
                {activeLayers.has('riskzones') && (
                    <g opacity={layerOpacities.riskzones}>
                        <RiskZoneLayer pathGenerator={pathGenerator} />
                    </g>
                )}

                {/* Countries */}
                <g>
                    {geographies.map((geo: any, i: number) => {
                        const d = pathGenerator(geo);
                        const countryName = COUNTRY_NAMES[Number(geo.id)];
                        const isSelected = countryName && selectedCountry === countryName;
                        return (
                            <path
                                key={i}
                                d={d || ''}
                                fill={isSelected ? '#334155' : '#1e293b'}
                                stroke="#334155"
                                strokeWidth={0.3}
                                className={countryName ? 'cursor-pointer hover:fill-slate-600 transition-colors' : undefined}
                                onClick={
                                    countryName
                                        ? () =>
                                              setSelectedCountry(
                                                  selectedCountry === countryName ? null : countryName
                                              )
                                        : undefined
                                }
                            />
                        );
                    })}
                </g>

                {/* Data layers */}
                {activeLayers.has('shipping') && (
                    <g opacity={layerOpacities.shipping}>
                        <ShippingLanesLayer
                            pathGenerator={pathGenerator}
                            zoomScale={transform.scale}
                            onHover={handleHover}
                        />
                    </g>
                )}
                {activeLayers.has('cables') && (
                    <g opacity={layerOpacities.cables}>
                        <SubmarineLayer
                            pathGenerator={pathGenerator}
                            zoomScale={transform.scale}
                            onHover={handleHover}
                        />
                    </g>
                )}
                {activeLayers.has('pipelines') && (
                    <g opacity={layerOpacities.pipelines}>
                        <PipelineLayer
                            pathGenerator={pathGenerator}
                            zoomScale={transform.scale}
                            onHover={handleHover}
                        />
                    </g>
                )}
                {activeLayers.has('production') && (
                    <g opacity={layerOpacities.production}>
                        <ProductionLayer
                            projection={projection}
                            zoomScale={transform.scale}
                            onHover={handleHover}
                        />
                    </g>
                )}
                {activeLayers.has('chokepoints') && (
                    <g opacity={layerOpacities.chokepoints}>
                        <ChokepointLayer
                            projection={projection}
                            zoomScale={transform.scale}
                            onHover={handleHover}
                        />
                    </g>
                )}
            </svg>

            {/* Hover tooltip */}
            {tooltip && (
                <div
                    className="absolute pointer-events-none z-20 bg-slate-900/95 border border-slate-600 rounded px-2 py-1 text-xs text-white shadow-lg"
                    style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
                >
                    <p className="font-medium">{tooltip.label}</p>
                    <p className="text-slate-400">{tooltip.stat}</p>
                </div>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
                <button
                    onClick={() => zoomBy(1.5)}
                    className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600 text-white rounded-md text-lg leading-none flex items-center justify-center transition-colors"
                    title="Zoom inn"
                >
                    +
                </button>
                <button
                    onClick={() => zoomBy(1 / 1.5)}
                    className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600 text-white rounded-md text-lg leading-none flex items-center justify-center transition-colors"
                    title="Zoom ut"
                >
                    −
                </button>
                <button
                    onClick={resetTransform}
                    className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600 text-white rounded-md text-sm leading-none flex items-center justify-center transition-colors"
                    title="Tilbakestill"
                >
                    ↺
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600 text-white rounded-md text-sm leading-none flex items-center justify-center transition-colors"
                    title={isFullscreen ? 'Avslutt fullskjerm' : 'Fullskjerm'}
                >
                    {isFullscreen ? '✕' : '⛶'}
                </button>
            </div>

            {/* Selected country indicator */}
            {selectedCountry && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-slate-800/90 border border-slate-600 rounded-full px-3 py-1 text-xs text-white flex items-center gap-2">
                    <span>Filtrert: {selectedCountry}</span>
                    <button
                        onClick={() => setSelectedCountry(null)}
                        className="text-slate-400 hover:text-white"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
