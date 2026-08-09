import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { topologyToFeatures, type GeoFeature } from '../../../types/geo';

interface RomanExpansionMapProps {
    currentEra?: EraId;
    title?: string;
}

type EraId = 'republic' | 'augustus' | 'trajan' | 'fall';

interface Era {
    id: EraId;
    label: string;
    sublabel: string;
    color: string;
    countries: string[];
}

// Modern country names (as they appear in world-atlas@2/countries-110m) that
// lay within Rome's borders at each historical moment. This is a teaching
// approximation: Rome's borders followed natural features and provinces, not
// modern national lines, but the overlap is recognisable enough for students.
const ERAS: Era[] = [
    {
        id: 'republic',
        label: 'Republikken',
        sublabel: '~200 f.Kr',
        color: '#fbbf24',
        countries: ['Italy', 'San Marino', 'Vatican'],
    },
    {
        id: 'augustus',
        label: 'Augustus',
        sublabel: '27 f.Kr',
        color: '#f97316',
        countries: [
            'Italy', 'San Marino', 'Vatican',
            'Spain', 'Portugal',
            'France', 'Belgium', 'Luxembourg', 'Netherlands',
            'Switzerland',
            'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro',
            'Albania', 'Macedonia', 'Kosovo',
            'Greece', 'Bulgaria',
            'Turkey', 'Cyprus',
            'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan',
            'Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco',
        ],
    },
    {
        id: 'trajan',
        label: 'Trajan',
        sublabel: '117 e.Kr (største utstrekning)',
        color: '#dc2626',
        countries: [
            'Italy', 'San Marino', 'Vatican',
            'Spain', 'Portugal',
            'France', 'Belgium', 'Luxembourg', 'Netherlands',
            'Switzerland', 'Austria',
            'United Kingdom', 'England', 'Wales',
            'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro',
            'Albania', 'Macedonia', 'Kosovo',
            'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Hungary',
            'Turkey', 'Cyprus', 'Armenia', 'Azerbaijan', 'Georgia',
            'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Iraq',
            'Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco',
        ],
    },
    {
        id: 'fall',
        label: 'Vestens fall',
        sublabel: '476 e.Kr (kun Østromerriket igjen)',
        color: '#7c3aed',
        countries: [
            'Greece', 'Bulgaria',
            'Turkey', 'Cyprus',
            'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan',
            'Egypt',
            'Albania', 'Macedonia',
        ],
    },
];

interface CityMarker {
    id: string;
    name: string;
    coords: [number, number]; // [lng, lat]
    appearsIn: EraId[];
}

const CITIES: CityMarker[] = [
    { id: 'roma', name: 'Roma', coords: [12.4964, 41.9028], appearsIn: ['republic', 'augustus', 'trajan'] },
    { id: 'konstantinopel', name: 'Konstantinopel', coords: [28.9784, 41.0082], appearsIn: ['fall'] },
    { id: 'alexandria', name: 'Alexandria', coords: [29.9187, 31.2001], appearsIn: ['augustus', 'trajan', 'fall'] },
    { id: 'kartago', name: 'Kartago', coords: [10.3239, 36.8528], appearsIn: ['republic', 'augustus', 'trajan'] },
    { id: 'lugdunum', name: 'Lugdunum', coords: [4.8357, 45.7640], appearsIn: ['augustus', 'trajan'] },
    { id: 'jerusalem', name: 'Jerusalem', coords: [35.2137, 31.7683], appearsIn: ['augustus', 'trajan', 'fall'] },
    { id: 'londinium', name: 'Londinium', coords: [-0.1276, 51.5072], appearsIn: ['trajan'] },
];

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const WIDTH = 1000;
const HEIGHT = 600;

export const RomanExpansionMap: React.FC<RomanExpansionMapProps> = ({
    currentEra,
    title = 'Romerrikets utvidelse',
}) => {
    const [activeEra, setActiveEra] = useState<EraId>(currentEra || 'republic');
    const [geographies, setGeographies] = useState<GeoFeature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(GEO_URL)
            .then((r) => r.json())
            .then((worldData) => {
                setGeographies(topologyToFeatures(worldData));
                setLoading(false);
            })
            .catch((err) => {
                console.error('[RomanExpansionMap] Failed to load world data:', err);
                setLoading(false);
            });
    }, []);

    // Mercator centered on the Mediterranean. Scale tuned for ViewBox 1000x600.
    const projection = useMemo(
        () => geoMercator().center([18, 40]).scale(750).translate([WIDTH / 2, HEIGHT / 2]),
        []
    );
    const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

    const era = ERAS.find((e) => e.id === activeEra) || ERAS[0];
    const countrySet = useMemo(() => new Set(era.countries), [era]);

    return (
        <div className="w-full h-full flex flex-col bg-slate-900/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-amber-300 text-sm font-bold tracking-wide">
                        {era.label} <span className="text-white/50 font-normal">- {era.sublabel}</span>
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {ERAS.map((e) => (
                        <button
                            key={e.id}
                            onClick={() => setActiveEra(e.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                e.id === activeEra
                                    ? 'bg-white text-slate-900 shadow-lg'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                            style={e.id === activeEra ? { borderColor: e.color, borderWidth: 2 } : {}}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: '#0c1424' }}>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                        Laster kart...
                    </div>
                )}
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
                    {/* Sea tint */}
                    <rect width={WIDTH} height={HEIGHT} fill="#0c1424" />

                    {/* Base countries (modern) */}
                    {geographies.map((geo, i: number) => {
                        const d = pathGenerator(geo);
                        if (!d) return null;
                        const name = geo.properties?.name || '';
                        const inRome = countrySet.has(name);
                        return (
                            <motion.path
                                key={`${name}-${i}`}
                                d={d}
                                fill={inRome ? era.color : '#1e293b'}
                                stroke="#0f172a"
                                strokeWidth={0.5}
                                initial={false}
                                animate={{ fillOpacity: inRome ? 0.88 : 1 }}
                                transition={{ duration: 0.6 }}
                            />
                        );
                    })}

                    {/* City markers */}
                    {CITIES.filter((c) => c.appearsIn.includes(era.id)).map((c) => {
                        const pos = projection(c.coords);
                        if (!pos) return null;
                        const [x, y] = pos;
                        return (
                            <g key={c.id}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={6}
                                    fill="#fef3c7"
                                    stroke="#1e293b"
                                    strokeWidth={2}
                                />
                                <text
                                    x={x + 10}
                                    y={y + 4}
                                    fill="#fef3c7"
                                    fontSize={14}
                                    fontWeight="bold"
                                    style={{ paintOrder: 'stroke' }}
                                    stroke="#0f172a"
                                    strokeWidth={3}
                                    strokeLinejoin="round"
                                >
                                    {c.name}
                                </text>
                                <text
                                    x={x + 10}
                                    y={y + 4}
                                    fill="#fef3c7"
                                    fontSize={14}
                                    fontWeight="bold"
                                >
                                    {c.name}
                                </text>
                            </g>
                        );
                    })}

                    <text x={WIDTH - 14} y={HEIGHT - 12} fill="#64748b" fontSize={11} textAnchor="end">
                        Moderne landegrenser viser den omtrentlige utstrekningen
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default RomanExpansionMap;
