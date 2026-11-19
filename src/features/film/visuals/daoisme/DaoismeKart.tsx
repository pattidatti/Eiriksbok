import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Swords, Landmark } from 'lucide-react';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Kart til daoisme-filmen.
 * - «riker»: Kina var mange små riker i krig. Plassene er en skisse, ikke ekte grenser.
 * - «idag»: slått ned på 1900-tallet, mykere fra 1980-tallet, sterk på Taiwan, og folk
 *   som blander flere tradisjoner.
 */
type Modus = 'riker' | 'idag';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const TAIWAN = '158';

const UTSNITT: [LngLat, LngLat] = [
    [88, 17],
    [134, 46],
];

const OVERSKRIFT: Record<Modus, string[]> = {
    riker: [
        'Kina: ikke ett land, men mange små riker',
        'Krig i flere hundre år',
        'Hvordan får vi orden?',
    ],
    idag: [
        'Deler av 1900-tallet: slått hardt ned på',
        '1980-tallet: mykere regler',
        'Mange blander, uten å velge én',
        'Spor av daoismen',
    ],
};

/** Omtrentlige plasser for rikene, bare for å vise «mange». Ikke historiske grenser. */
const RIKER: LngLat[] = [
    [110, 37],
    [115, 38.5],
    [119, 36],
    [113, 34],
    [117.5, 33],
    [108.5, 33.5],
    [112, 30.5],
    [118.5, 30],
    [105, 30],
];
const KRIGER: [number, number][] = [
    [0, 1],
    [3, 4],
    [5, 6],
    [2, 7],
    [6, 8],
];

const Land = memo(function Land({
    geographies,
    sti,
    kinaFarge,
    taiwanFarge,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    kinaFarge: string;
    taiwanFarge: string;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String(g.id);
                const fill = id === KINA ? kinaFarge : id === TAIWAN ? taiwanFarge : '#ece6d8';
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={fill}
                        stroke="#a8a08a"
                        strokeWidth={1.5}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </>
    );
});

export function DaoismeKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'riker';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [80, 90],
                    [B - 80, H - 40],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const liste = OVERSKRIFT[modus];

    const kinaFarge = modus === 'riker' ? '#f3e2bf' : beat === 0 ? '#9ca3af' : '#f3e2bf';
    const taiwanFarge = modus === 'idag' && beat >= 1 ? '#f59e0b' : '#ece6d8';
    const taiwan = p([121, 23.7]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3ef' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    kinaFarge={kinaFarge}
                    taiwanFarge={taiwanFarge}
                />

                {modus === 'riker' &&
                    RIKER.map((ll, i) => {
                        const [x, y] = p(ll);
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.18 }}
                            >
                                <line
                                    x1={x}
                                    y1={y}
                                    x2={x}
                                    y2={y - 46}
                                    stroke="#44403c"
                                    strokeWidth={4}
                                />
                                <path
                                    d={`M ${x} ${y - 46} L ${x + 34} ${y - 38} L ${x} ${y - 28} Z`}
                                    fill={
                                        ['#b91c1c', '#1d4ed8', '#15803d', '#7c3aed', '#b45309'][
                                            i % 5
                                        ]
                                    }
                                />
                                <circle cx={x} cy={y} r={7} fill="#44403c" />
                            </motion.g>
                        );
                    })}
                {modus === 'riker' &&
                    beat >= 1 &&
                    KRIGER.map(([a, b], i) => {
                        const [x1, y1] = p(RIKER[a]);
                        const [x2, y2] = p(RIKER[b]);
                        return (
                            <motion.line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#dc2626"
                                strokeWidth={6}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.85 }}
                                transition={{ delay: 0.3 + i * 0.35, duration: 0.6 }}
                            />
                        );
                    })}

                {modus === 'idag' && beat === 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <line
                            x1={taiwan[0] + 18}
                            y1={taiwan[1]}
                            x2={taiwan[0] + 70}
                            y2={taiwan[1]}
                            stroke="#b45309"
                            strokeWidth={4}
                        />
                        <rect
                            x={taiwan[0] + 70}
                            y={taiwan[1] - 50}
                            width={300}
                            height={100}
                            rx={18}
                            fill="#ffffff"
                            opacity={0.95}
                        />
                        <text
                            x={taiwan[0] + 92}
                            y={taiwan[1] - 8}
                            fontSize={40}
                            fontWeight={900}
                            fill="#b45309"
                        >
                            Taiwan
                        </text>
                        <text
                            x={taiwan[0] + 92}
                            y={taiwan[1] + 32}
                            fontSize={28}
                            fontWeight={700}
                            fill="#334155"
                        >
                            særlig sterk her
                        </text>
                    </motion.g>
                )}
            </svg>

            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />

            <AnimatePresence>
                {modus === 'riker' && beat === 0 && (
                    <motion.div
                        key="skisse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[3%] bottom-[5%] px-4 py-2 rounded-xl bg-white/90 text-xl font-semibold text-slate-600"
                    >
                        Skisse: flaggene viser «mange riker», ikke hvor de lå. Kartet har dagens
                        grenser.
                    </motion.div>
                )}
                {modus === 'riker' && beat === 1 && (
                    <motion.div
                        key="krig"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute left-[4%] bottom-[8%] px-6 py-4 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="flex items-center gap-3 text-3xl font-black text-red-700">
                            <Swords className="w-9 h-9" /> Makt og jord
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-slate-600">
                            Krigene varte i flere hundre år
                        </div>
                    </motion.div>
                )}
                {modus === 'riker' && beat >= 2 && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute inset-x-0 bottom-[8%] flex justify-center"
                    >
                        <div className="px-8 py-5 rounded-3xl bg-slate-900/90 text-white text-3xl font-black text-center max-w-[70%]">
                            Hvordan får vi orden på et samfunn som faller fra hverandre?
                        </div>
                    </motion.div>
                )}

                {modus === 'idag' && beat === 2 && (
                    <motion.div
                        key="blande"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[3%] bottom-[6%] flex items-end gap-4"
                    >
                        <Blanding />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.6 }}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-700 max-w-[20rem]"
                        >
                            <div className="flex items-center gap-2 text-red-700 font-black">
                                <Landmark className="w-7 h-7" /> Staten
                            </div>
                            passer på hva som regnes som vanlig religion
                        </motion.div>
                    </motion.div>
                )}
                {modus === 'idag' && beat >= 3 && (
                    <motion.div
                        key="spor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-[7%] flex justify-center gap-5"
                    >
                        {[
                            ['tai chi', 'rolige bevegelser'],
                            ['feng shui', 'hvordan et rom settes opp'],
                            ['«gå med strømmen»', 'wu wei i lommeformat'],
                        ].map(([a, b], i) => (
                            <motion.div
                                key={a}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.9 }}
                                className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl text-center"
                            >
                                <div className="text-3xl font-black text-teal-700">{a}</div>
                                <div className="text-xl font-semibold text-slate-600">{b}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Fire tradisjoner som overlapper: ingen av dem står alene. */
function Blanding() {
    const ringer = [
        { navn: 'folketro', x: 120, y: 95, farge: '#16a34a' },
        { navn: 'daoisme', x: 210, y: 95, farge: '#0d9488' },
        { navn: 'buddhisme', x: 120, y: 175, farge: '#d97706' },
        { navn: 'konfusianisme', x: 210, y: 175, farge: '#7c3aed' },
    ];
    return (
        <div className="rounded-3xl bg-white/95 shadow-xl p-2">
            <svg width={330} height={270} viewBox="0 0 330 270">
                {ringer.map((r, i) => (
                    <motion.circle
                        key={r.navn}
                        cx={r.x}
                        cy={r.y}
                        r={78}
                        fill={r.farge}
                        fillOpacity={0.28}
                        stroke={r.farge}
                        strokeWidth={3}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                    />
                ))}
                {ringer.map((r, i) => (
                    <motion.text
                        key={`t${r.navn}`}
                        x={r.x + (r.x < 165 ? -38 : 38)}
                        y={r.y + (r.y < 135 ? -40 : 52)}
                        textAnchor="middle"
                        fontSize={22}
                        fontWeight={800}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                    >
                        {r.navn}
                    </motion.text>
                ))}
            </svg>
        </div>
    );
}
