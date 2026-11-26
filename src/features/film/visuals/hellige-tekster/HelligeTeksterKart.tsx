import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { HtBrikke } from './HtBrikke';

/**
 * Buddhismens tekster: Tripitaka (de tre kurvene), skrevet ned på Sri Lanka, nye tekster
 * i India i tusen år til, og i dag mye bare på kinesisk og tibetansk. Ingen piler: artikkelen
 * sier ikke hvilken vei tekstene gikk, bare hvor de ble skrevet og hvilke språk de finnes på.
 */

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [58, 2],
    [124, 46],
];

const LAND = { india: '356', srilanka: '144', kina: '156' } as const;

const TEKST = [
    'Tripitaka: de tre kurvene',
    'Hva ligger i kurvene?',
    'Sri Lanka: trolig skrevet ned',
    'India: nye tekster i tusen år til',
    'I dag: mye bare på kinesisk og tibetansk',
];

const KURVER = [
    { linje1: 'reglene for', linje2: 'klosterlivet', farge: '#b45309' },
    { linje1: 'talene man mener', linje2: 'Buddha holdt', farge: '#ca8a04' },
    { linje1: 'forklaringer', linje2: 'på læren', farge: '#a16207' },
];

/** En flettet kurv sett fra siden. */
function Kurv({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g>
            <path
                d={`M ${x - 130} ${y} L ${x + 130} ${y} L ${x + 100} ${y + 170} L ${x - 100} ${y + 170} Z`}
                fill={farge}
            />
            {[0, 1, 2, 3].map((i) => (
                <line
                    key={i}
                    x1={x - 125 + i * 8}
                    y1={y + 36 + i * 36}
                    x2={x + 125 - i * 8}
                    y2={y + 36 + i * 36}
                    stroke="#fef3c7"
                    strokeWidth={5}
                    opacity={0.7}
                />
            ))}
            <rect x={x - 145} y={y - 18} width={290} height={26} rx={12} fill="#78350f" />
        </g>
    );
}

function Merke({
    x,
    y,
    navn,
    under,
    farge,
    side = 'h',
}: {
    x: number;
    y: number;
    navn: string;
    under: string;
    farge: string;
    side?: 'h' | 'v';
}) {
    const ax = side === 'h' ? x + 26 : x - 26;
    const anker = side === 'h' ? 'start' : 'end';
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <circle cx={x} cy={y} r={13} fill={farge} stroke="#fff" strokeWidth={4} />
            <text
                x={ax}
                y={y + 4}
                textAnchor={anker}
                fontSize={40}
                fontWeight={900}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
            <text
                x={ax}
                y={y + 46}
                textAnchor={anker}
                fontSize={32}
                fontWeight={800}
                fill="#1f2937"
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {under}
            </text>
        </motion.g>
    );
}

export function HelligeTeksterKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 20],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];

    const farge = (id: string) => {
        if (beat >= 2 && id === LAND.srilanka) return beat === 2 ? '#f97316' : '#fdba74';
        if (beat >= 3 && id === LAND.india) return beat === 3 ? '#f59e0b' : '#fde68a';
        if (beat >= 4 && id === LAND.kina) return '#fca5a5';
        return '#f5f0e6';
    };
    const kurver = beat <= 1;
    const srilanka = p([80.7, 7.6]);
    const india = p([72.8, 21.2]);
    const kina = p([108, 33]);
    const tibet = p([91.1, 29.65]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bfdbfe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={farge(String(g.id))}
                        stroke="#a8a29e"
                        strokeWidth={1.2}
                    />
                ))}
                {beat >= 2 && (
                    <Merke
                        x={srilanka[0]}
                        y={srilanka[1]}
                        navn="Sri Lanka"
                        under={beat === 2 ? 'Tripitaka skrives trolig ned' : 'Tripitaka'}
                        farge="#c2410c"
                    />
                )}
                {beat >= 3 && (
                    <Merke
                        x={india[0]}
                        y={india[1]}
                        navn="India"
                        under={beat === 3 ? 'nye tekster i tusen år' : 'de indiske tekstene'}
                        farge="#b45309"
                        side="v"
                    />
                )}
                {beat >= 4 && (
                    <g>
                        <Merke
                            x={tibet[0]}
                            y={tibet[1]}
                            navn="Tibet"
                            under="tibetansk"
                            farge="#be123c"
                        />
                        <Merke
                            x={kina[0]}
                            y={kina[1]}
                            navn="Kina"
                            under="kinesisk"
                            farge="#be123c"
                        />
                    </g>
                )}
                {kurver && (
                    <g>
                        <rect x={0} y={0} width={B} height={H} fill="#f8f5ee" opacity={0.82} />
                        {KURVER.map((k, i) => {
                            const x = 350 + i * 450;
                            return (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.35, duration: 0.5 }}
                                >
                                    <Kurv x={x} y={330} farge={k.farge} />
                                    <text
                                        x={x}
                                        y={450}
                                        textAnchor="middle"
                                        fontSize={64}
                                        fontWeight={900}
                                        fill="#fffbeb"
                                    >
                                        {i + 1}
                                    </text>
                                    {beat >= 1 && (
                                        <g>
                                            <text
                                                x={x}
                                                y={600}
                                                textAnchor="middle"
                                                fontSize={36}
                                                fontWeight={800}
                                                fill="#0f172a"
                                            >
                                                {k.linje1}
                                            </text>
                                            <text
                                                x={x}
                                                y={646}
                                                textAnchor="middle"
                                                fontSize={36}
                                                fontWeight={800}
                                                fill="#0f172a"
                                            >
                                                {k.linje2}
                                            </text>
                                        </g>
                                    )}
                                </motion.g>
                            );
                        })}
                    </g>
                )}
            </svg>
            <HtBrikke tekst={TEKST[Math.min(beat, TEKST.length - 1)]} nokkel={`kart-${beat}`} />
        </div>
    );
}
