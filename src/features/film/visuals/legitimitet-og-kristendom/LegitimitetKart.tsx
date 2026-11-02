import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Kart over Romerriket rundt Middelhavet.
 * - riket: riket fra Skottland til Egypt, millioner av mennesker, få soldater
 * - emesa: solguden fra Emesa i Syria til Roma (Elagabalus)
 * - nikea: biskoper fra hele riket reiser til Nikea (325)
 * - theodosius: kristendommen blir statens religion, templene stenges, Thessaloniki og Milano
 * Riket er forenklet: landene som i dag ligger der riket lå, ikke de eksakte grensene.
 */

type Modus = 'riket' | 'emesa' | 'nikea' | 'theodosius';
type LngLat = [number, number];
type Pkt = [number, number];

const B = 1600;
const H = 900;
const ROD = '#9f1239';
const GULL = '#b45309';
const LILLA = '#6d28d9';

const ROMA: LngLat = [12.5, 41.9];
const EMESA: LngLat = [36.7, 34.7];
const NIKEA: LngLat = [29.7, 40.4];
const ALEXANDRIA: LngLat = [29.9, 31.2];
const THESSALONIKI: LngLat = [22.9, 40.6];
const MILANO: LngLat = [9.2, 45.5];
const SKOTTLAND: LngLat = [-3.8, 56.3];
const EGYPT: LngLat = [31.5, 26.5];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    riket: [
        [-10, 24],
        [42, 57],
    ],
    emesa: [
        [4, 29],
        [42, 47],
    ],
    nikea: [
        [-8, 29],
        [42, 50],
    ],
    theodosius: [
        [-6, 31],
        [40, 50],
    ],
};

/** Land (ISO-numre) som i dag ligger omtrent der Romerriket lå. */
const RIKET = new Set([
    '826', '250', '724', '620', '380', '756', '056', '442', '040', '705', '191', '070', '688',
    '499', '008', '807', '300', '100', '642', '792', '196', '760', '422', '376', '400', '818',
    '434', '788', '012', '504', '348', '470', '275',
]);

/** Byer biskopene kommer fra, uten navn: spredt rundt i riket. */
const BISKOPBYER: LngLat[] = [
    ROMA, ALEXANDRIA, [36.2, 36.2], [10.2, 36.8], [4.8, 45.7], [-3.7, 40.4], [35.5, 33.9],
    [22.9, 40.6], [27.1, 38.4], [33, 39.9], [16.4, 48.2], [23.7, 37.9], [35.2, 31.8], [-0.1, 51.5],
];

/** Templer for de gamle gudene, spredt rundt i riket. */
const TEMPLER: LngLat[] = [
    ROMA, [23.7, 37.9], [2.3, 43.6], [-5.9, 37.4], [35.5, 34.5], [10.2, 36.8], [27.1, 38.4],
    [15.1, 37.5], [33, 39.9], [29.9, 31.2], [4.8, 45.7], [36.2, 36.2],
];

/** Mennesker i riket: punkter med frø, så bildet blir likt hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export function LegitimitetKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'riket';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 150],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as Pkt;

    const rikeFarge =
        modus === 'theodosius' && beat >= 1 ? '#fde68a' : modus === 'riket' ? '#fecdd3' : '#f1e3c8';

    const folk = useMemo(() => {
        if (modus !== 'riket') return [];
        const byer = BISKOPBYER.concat(TEMPLER);
        return Array.from({ length: 140 }, (_, i) => {
            const by = byer[i % byer.length];
            return [by[0] + (frø(i) - 0.5) * 7, by[1] + (frø(i + 99) - 0.5) * 4] as LngLat;
        });
    }, [modus]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3ef' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} riket={rikeFarge} />

                {modus === 'riket' && (
                    <>
                        <Pin pos={p(SKOTTLAND)} tekst="Skottland" farge={ROD} />
                        <Pin pos={p(EGYPT)} tekst="Egypt" farge={GULL} over />
                        {beat >= 1 &&
                            folk.map((ll, i) => {
                                const q = p(ll);
                                return (
                                    <motion.circle
                                        key={i}
                                        cx={q[0]}
                                        cy={q[1]}
                                        r={6}
                                        fill="#334155"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: beat >= 2 ? 0.45 : 0.85 }}
                                        transition={{ delay: beat === 1 ? (i % 40) * 0.04 : 0, duration: 0.4 }}
                                    />
                                );
                            })}
                        {beat >= 2 &&
                            [ROMA, [2.3, 46], [23.7, 39], [33, 37], [-4, 39]].map((ll, i) => (
                                <Skjold key={i} pos={p(ll as LngLat)} forsinkelse={i * 0.25} />
                            ))}
                        {beat >= 3 && <Krone pos={p(ROMA)} />}
                        <text
                            x={30}
                            y={H - 24}
                            textAnchor="start"
                            fontSize={28}
                            fontWeight={700}
                            fill="#334155"
                            stroke="#ffffff"
                            strokeWidth={6}
                            paintOrder="stroke"
                        >
                            Forenklet: landene som i dag ligger der riket lå
                        </text>
                    </>
                )}

                {modus === 'emesa' && (
                    <>
                        {beat >= 1 && <Sol pos={p(EMESA)} r={beat >= 3 ? 30 : 40} />}
                        {beat >= 2 && <Bue fra={p(EMESA)} til={p(ROMA)} farge={GULL} />}
                        {beat === 2 && <Sol pos={p(ROMA)} r={44} forsinkelse={1.2} />}
                        {beat >= 3 && <Sol pos={p(ROMA)} r={24} dempet />}
                        <Pin pos={p(ROMA)} tekst="Roma" farge={ROD} />
                        {beat >= 1 && <Pin pos={p(EMESA)} tekst="Emesa" farge={GULL} />}
                    </>
                )}

                {modus === 'nikea' && (
                    <>
                        {BISKOPBYER.map((ll, i) => {
                            const q = p(ll);
                            return (
                                <g key={i}>
                                    <circle cx={q[0]} cy={q[1]} r={9} fill={LILLA} opacity={0.8} />
                                    {beat >= 0 && (
                                        <Bue fra={q} til={p(NIKEA)} farge={LILLA} forsinkelse={i * 0.12} tynn />
                                    )}
                                </g>
                            );
                        })}
                        <Pin pos={p(ALEXANDRIA)} tekst="Alexandria" farge={LILLA} />
                        <Pin pos={p(NIKEA)} tekst="Nikea" farge={ROD} over hoved />
                        {beat >= 1 && <Puls pos={p(NIKEA)} />}
                    </>
                )}

                {modus === 'theodosius' && (
                    <>
                        {beat >= 2 &&
                            TEMPLER.map((ll, i) => (
                                <Tempel key={i} pos={p(ll)} stengt forsinkelse={i * 0.12} />
                            ))}
                        {beat <= 1 &&
                            TEMPLER.map((ll, i) => <Tempel key={i} pos={p(ll)} stengt={false} />)}
                        {beat >= 1 && beat <= 2 && <Kors pos={p([24, 44])} />}
                        {beat >= 3 && <Pin pos={p(THESSALONIKI)} tekst="Thessaloniki" farge={ROD} />}
                        {beat >= 4 && <Pin pos={p(MILANO)} tekst="Milano" farge={LILLA} over />}
                        {beat >= 4 && <Bue fra={p(MILANO)} til={p(THESSALONIKI)} farge={LILLA} />}
                    </>
                )}
            </svg>

            <Overskrift tekst={overskrift(modus, beat)} />

            {modus === 'emesa' && (
                <Merke
                    tekst={beat >= 3 ? 'År 222: livvakten gjør opprør' : 'Elagabalus, keiser som omtrent 15-åring'}
                    side="venstre"
                />
            )}
            {modus === 'nikea' && beat >= 2 && (
                <Merke tekst="Konstantin leder møtet, men er ikke døpt" side="venstre" />
            )}
            {modus === 'theodosius' && beat >= 1 && beat <= 2 && (
                <Merke tekst={beat === 1 ? 'Påbud fra 380 til 394' : 'År 391: templene stenges'} side="venstre" />
            )}
            {modus === 'theodosius' && beat >= 3 && (
                <Merke
                    tekst={beat === 3 ? 'Flere tusen innbyggere drept som hevn' : 'Biskop Ambrosius av Milano'}
                    side="venstre"
                />
            )}
        </div>
    );
}

function overskrift(modus: Modus, beat: number) {
    if (modus === 'riket') {
        return ['Fra Skottland til Egypt', 'Millioner av mennesker', 'Soldater er ikke nok', 'Hvem skal styre?'][
            Math.min(beat, 3)
        ];
    }
    if (modus === 'emesa') {
        return ['En ung keiser', 'Solguden fra Emesa', 'Én gud for hele riket?', 'Ideen lever videre'][
            Math.min(beat, 3)
        ];
    }
    if (modus === 'nikea') {
        return ['Biskoper fra hele riket', 'Møtet i Nikea, år 325', 'Keiseren leder møtet'][Math.min(beat, 2)];
    }
    return [
        'Theodosius den første',
        'Statens religion',
        'Templene stenges',
        'Hevnen i Thessaloniki',
        'Biskopen griper inn',
    ][Math.min(beat, 4)];
}

const Land = memo(function Land({
    geographies,
    sti,
    riket,
}: {
    geographies: unknown[];
    sti: GeoPath;
    riket: string;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: unknown }).id);
                const inne = RIKET.has(id);
                return (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: inne ? riket : '#f5f1e8' }}
                        transition={{ duration: 1 }}
                        stroke={inne ? '#c2a77a' : '#cbd5e1'}
                        strokeWidth={1.5}
                    />
                );
            })}
        </>
    );
});

function Pin({
    pos,
    tekst,
    farge,
    over,
    hoved,
}: {
    pos: Pkt;
    tekst: string;
    farge: string;
    over?: boolean;
    hoved?: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <circle cx={pos[0]} cy={pos[1]} r={hoved ? 17 : 13} fill={farge} stroke="#fff" strokeWidth={4} />
            <text
                x={pos[0]}
                y={pos[1] + (over ? -30 : 80)}
                textAnchor="middle"
                fontSize={hoved ? 44 : 38}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Sol({ pos, r, forsinkelse = 0, dempet }: { pos: Pkt; r: number; forsinkelse?: number; dempet?: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: dempet ? 0.75 : 1, scale: 1 }}
            transition={{ delay: forsinkelse, duration: 0.8 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <line
                        key={i}
                        x1={pos[0] + Math.cos(a) * r * 1.15}
                        y1={pos[1] + Math.sin(a) * r * 1.15}
                        x2={pos[0] + Math.cos(a) * r * 1.6}
                        y2={pos[1] + Math.sin(a) * r * 1.6}
                        stroke="#f59e0b"
                        strokeWidth={r / 6}
                        strokeLinecap="round"
                    />
                );
            })}
            <circle cx={pos[0]} cy={pos[1]} r={r} fill="#fbbf24" stroke="#f59e0b" strokeWidth={4} />
        </motion.g>
    );
}

function Bue({
    fra,
    til,
    farge,
    forsinkelse = 0,
    tynn,
}: {
    fra: Pkt;
    til: Pkt;
    farge: string;
    forsinkelse?: number;
    tynn?: boolean;
}) {
    const midt: Pkt = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 - 80];
    return (
        <motion.path
            d={`M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`}
            fill="none"
            stroke={farge}
            strokeWidth={tynn ? 4 : 8}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ delay: forsinkelse, duration: 1.3 }}
        />
    );
}

function Skjold({ pos, forsinkelse }: { pos: Pkt; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.5 }}>
            <rect x={x - 18} y={y - 26} width={36} height={52} rx={8} fill={ROD} stroke="#fff" strokeWidth={4} />
            <circle cx={x} cy={y} r={7} fill="#fde68a" />
        </motion.g>
    );
}

function Krone({ pos }: { pos: Pkt }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <path
                d={`M ${x - 50} ${y - 40} L ${x - 50} ${y - 100} L ${x - 25} ${y - 70} L ${x} ${y - 110} L ${x + 25} ${y - 70} L ${x + 50} ${y - 100} L ${x + 50} ${y - 40} Z`}
                fill="#facc15"
                stroke={GULL}
                strokeWidth={5}
            />
            <text x={x} y={y - 128} textAnchor="middle" fontSize={64} fontWeight={900} fill={ROD} stroke="#fff" strokeWidth={8} paintOrder="stroke">
                ?
            </text>
        </motion.g>
    );
}

function Puls({ pos }: { pos: Pkt }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={ROD}
            strokeWidth={5}
            initial={{ r: 20, opacity: 0.9 }}
            animate={{ r: 90, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    );
}

function Tempel({ pos, stengt, forsinkelse = 0 }: { pos: Pkt; stengt: boolean; forsinkelse?: number }) {
    const [x, y] = pos;
    return (
        <g>
            <path d={`M ${x - 22} ${y - 14} L ${x} ${y - 30} L ${x + 22} ${y - 14} Z`} fill="#e7e5e4" stroke="#78716c" strokeWidth={3} />
            {[-14, -5, 4, 13].map((dx) => (
                <rect key={dx} x={x + dx - 2} y={y - 14} width={5} height={22} fill="#e7e5e4" stroke="#78716c" strokeWidth={1.5} />
            ))}
            <rect x={x - 24} y={y + 8} width={48} height={6} fill="#a8a29e" />
            {stengt && (
                <motion.path
                    d={`M ${x - 26} ${y - 30} L ${x + 26} ${y + 16} M ${x + 26} ${y - 30} L ${x - 26} ${y + 16}`}
                    stroke={ROD}
                    strokeWidth={7}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: forsinkelse, duration: 0.4 }}
                />
            )}
        </g>
    );
}

function Kors({ pos }: { pos: Pkt }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <circle cx={x} cy={y} r={70} fill="#ffffff" stroke={GULL} strokeWidth={5} />
            <rect x={x - 9} y={y - 50} width={18} height={100} rx={4} fill={GULL} />
            <rect x={x - 34} y={y - 24} width={68} height={18} rx={4} fill={GULL} />
        </motion.g>
    );
}

function Merke({ tekst, side }: { tekst: string; side: 'venstre' | 'hoyre' }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute px-5 py-3 rounded-2xl bg-slate-900 text-white text-2xl font-bold shadow-xl"
            style={side === 'venstre' ? { left: '3%', bottom: '7%' } : { right: '3%', bottom: '7%' }}
        >
            {tekst}
        </motion.div>
    );
}
