import { useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import { useQuery } from '@tanstack/react-query';

interface Props {
    title?: string;
    description?: string;
}

const TRADE_FLOWS = [
    { from: 'Kina', fromCoord: [116.4, 39.9], to: 'USA', toCoord: [-100.0, 40.0], label: 'Elektronikk, klær, møbler', volume: 'ca. 560 mrd. USD/år' },
    { from: 'EU', fromCoord: [10.0, 51.0], to: 'Kina', toCoord: [116.4, 39.9], label: 'Maskiner, kjøretøy, kjemikalier', volume: 'ca. 220 mrd. EUR/år' },
    { from: 'Saudi-Arabia', fromCoord: [45.0, 24.0], to: 'Asia', toCoord: [110.0, 25.0], label: 'Olje', volume: 'ca. 7 mill. fat/dag' },
    { from: 'Ukraina', fromCoord: [31.0, 49.0], to: 'Afrika/Midtøsten', toCoord: [30.0, 20.0], label: 'Hvete, mais', volume: 'ca. 45 mill. tonn/år' },
    { from: 'Norge', fromCoord: [8.0, 60.0], to: 'Europa', toCoord: [12.0, 48.0], label: 'Gass, fisk, olje', volume: 'ca. 2 500 mrd. kr/år' },
    { from: 'Brasil', fromCoord: [-51.9, -14.2], to: 'Kina', toCoord: [116.4, 39.9], label: 'Soyabønner, jernmalm, olje', volume: 'ca. 100 mrd. USD/år' },
];

// Verdensgeometrien lastes LOKALT (public/data/world/) - aldri fra CDN. På Chromebook
// i klasserom med ustabilt nett ville en CDN-henting gitt blank skjerm.
const GEO_URL = '/data/world/countries-110m.json';

export function GlobalProductionDots({ title, description }: Props) {
    const [selected, setSelected] = useState<(typeof TRADE_FLOWS)[0] | null>(null);
    const W = 700;
    const H = 380;

    const { data: worldData } = useQuery({
        queryKey: ['world-atlas'],
        queryFn: async () => {
            const res = await fetch(GEO_URL);
            return res.json();
        },
        staleTime: 24 * 60 * 60 * 1000,
    });

    const geographies = useMemo(() => {
        if (!worldData) return [];
        const countries = topojson.feature(worldData, worldData.objects.countries);
        return (countries as any).features;
    }, [worldData]);

    const projection = useMemo(
        () => geoNaturalEarth1().scale(120).translate([W / 2, H / 2]),
        []
    );
    const pathGen = useMemo(() => geoPath().projection(projection), [projection]);

    return (
        <div className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
            {title && (
                <div className="px-4 py-3 border-b border-slate-700">
                    <h4 className="font-semibold text-white text-sm">{title}</h4>
                    {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
                </div>
            )}
            <div className="relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                    <rect width={W} height={H} fill="#0f172a" />
                    <g>
                        {geographies.map((geo: any, i: number) => (
                            <path key={i} d={pathGen(geo) || ''} fill="#1e293b" stroke="#334155" strokeWidth={0.3} />
                        ))}
                    </g>
                    {TRADE_FLOWS.map((flow, i) => {
                        const from = projection(flow.fromCoord as [number, number]);
                        const to = projection(flow.toCoord as [number, number]);
                        if (!from || !to) return null;
                        const isSelected = selected === flow;
                        return (
                            <g key={i} className="cursor-pointer" onClick={() => setSelected(flow === selected ? null : flow)}>
                                <line
                                    x1={from[0]} y1={from[1]}
                                    x2={to[0]} y2={to[1]}
                                    stroke={isSelected ? '#38bdf8' : '#475569'}
                                    strokeWidth={isSelected ? 1.5 : 0.8}
                                    strokeOpacity={isSelected ? 0.9 : 0.5}
                                    strokeDasharray="4,3"
                                />
                                <circle cx={from[0]} cy={from[1]} r={5} fill="#f59e0b" fillOpacity={0.9} />
                                <circle cx={to[0]} cy={to[1]} r={5} fill="#38bdf8" fillOpacity={0.9} />
                            </g>
                        );
                    })}
                </svg>

                {selected && (
                    <div className="absolute bottom-3 left-3 bg-slate-800/95 border border-slate-600 rounded-lg p-3 text-xs text-white max-w-xs">
                        <div className="font-semibold mb-1">
                            {selected.from} → {selected.to}
                        </div>
                        <div className="text-slate-300 mb-0.5">{selected.label}</div>
                        <div className="text-slate-400">{selected.volume}</div>
                    </div>
                )}
            </div>
            <p className="text-[10px] text-slate-500 px-3 pb-2">Klikk på en handelsrute for detaljer. Gule prikker = eksportland, blå = importland.</p>
        </div>
    );
}
