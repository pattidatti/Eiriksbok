import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Vestfronten høsten 1914: det tyske angrepet som stanser, Kappløpet mot havet
 * nordover, og fronten som graves ned fra Sveits til Nordsjøen.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];

const UTSNITT: Utsnitt = [
    [-2.5, 46.2],
    [10.5, 53.6],
];

/** Fronten slik den lå fra 1914, omtrent, fra kysten i nord til Sveits i sør. */
const FRONT: LngLat[] = [
    [2.72, 51.15],
    [2.88, 50.85],
    [2.85, 50.55],
    [2.78, 50.29],
    [2.75, 50.02],
    [2.95, 49.62],
    [3.35, 49.4],
    [4.0, 49.27],
    [4.8, 49.2],
    [5.38, 49.18],
    [5.55, 48.92],
    [6.05, 48.9],
    [6.6, 48.6],
    [7.0, 48.25],
    [7.05, 47.85],
    [7.15, 47.5],
];

/** Det tyske angrepet: tre piler fra Tyskland gjennom Belgia mot Frankrike. */
const ANGREP: LngLat[][] = [
    [
        [6.2, 50.85],
        [4.4, 50.5],
        [3.0, 49.6],
    ],
    [
        [6.6, 50.1],
        [5.0, 49.6],
        [3.8, 49.05],
    ],
    [
        [7.2, 49.4],
        [5.8, 49.15],
        [4.9, 48.95],
    ],
];

/** Kappløpet mot havet: to linjer som strekker seg nordover side om side. */
const KAPPLOP: LngLat[][] = [
    [
        [2.7, 49.55],
        [2.5, 50.1],
        [2.55, 50.65],
        [2.55, 51.1],
    ],
    [
        [3.25, 49.6],
        [3.05, 50.15],
        [3.1, 50.7],
        [3.0, 51.2],
    ],
];

const LAND: { navn: string; ll: LngLat; stor?: boolean }[] = [
    { navn: 'FRANKRIKE', ll: [1.8, 47.6], stor: true },
    { navn: 'TYSKLAND', ll: [9.0, 51.3], stor: true },
    { navn: 'BELGIA', ll: [4.7, 50.75] },
    { navn: 'SVEITS', ll: [8.2, 46.85] },
    { navn: 'STORBRITANNIA', ll: [-1.0, 51.8] },
];

export function SkyttergravKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: [UTSNITT[0], UTSNITT[1]] } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((q) => p(q).join(' ')).join(' L ');

    const nord = p(FRONT[0]);
    const sor = p(FRONT[FRONT.length - 1]);
    const frontD = linje(FRONT);

    return (
        <div className="absolute inset-0 bg-[#cfe2ef] overflow-hidden">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <marker id="sg-pil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                    <marker id="sg-pil-bla" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d4ed8" />
                    </marker>
                </defs>
                <Land geographies={geographies} sti={sti} />
                {LAND.map((l) => {
                    const [x, y] = p(l.ll);
                    return (
                        <text
                            key={l.navn}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            fontSize={l.stor ? 40 : 28}
                            fontWeight={900}
                            letterSpacing={4}
                            fill="#64748b"
                            opacity={0.85}
                        >
                            {l.navn}
                        </text>
                    );
                })}
                <text
                    x={p([3.3, 51.95])[0]}
                    y={p([3.3, 51.95])[1]}
                    textAnchor="middle"
                    fontSize={32}
                    fontStyle="italic"
                    fontWeight={700}
                    fill="#1e3a5f"
                    opacity={beat >= 3 ? 0 : 1}
                >
                    Nordsjøen
                </text>

                {/* Beat 0: angrepet som stanser */}
                {ANGREP.map((a, i) => (
                    <motion.path
                        key={i}
                        d={linje(a)}
                        fill="none"
                        stroke="#475569"
                        strokeWidth={16}
                        strokeLinecap="round"
                        markerEnd="url(#sg-pil)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: beat === 0 ? 0.9 : beat <= 2 ? 0.25 : 0 }}
                        transition={{ pathLength: { duration: 2.2, delay: 0.6 + i * 0.4 }, opacity: { duration: 0.8 } }}
                    />
                ))}
                {beat === 0 &&
                    ANGREP.map((a, i) => {
                        const [x, y] = p(a[a.length - 1]);
                        return (
                            <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 + i * 0.3 }}>
                                <line x1={x - 26} y1={y + 18} x2={x + 26} y2={y - 18} stroke="#b91c1c" strokeWidth={9} strokeLinecap="round" />
                            </motion.g>
                        );
                    })}

                {/* Beat 1: Kappløpet mot havet */}
                {beat === 1 && (
                    <motion.g key="sider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                        <Merke x={p([2.35, 50.35])[0] - 20} y={p([2.35, 50.35])[1]} tekst="Frankrike og Storbritannia" anker="end" farge="#1d4ed8" />
                        <Merke x={p([3.25, 50.35])[0] + 20} y={p([3.25, 50.35])[1]} tekst="Tyskland" anker="start" farge="#334155" />
                    </motion.g>
                )}
                {KAPPLOP.map((k, i) => (
                    <motion.path
                        key={i}
                        d={linje(k)}
                        fill="none"
                        stroke={i === 0 ? '#1d4ed8' : '#475569'}
                        strokeWidth={10}
                        strokeLinecap="round"
                        markerEnd={i === 0 ? 'url(#sg-pil-bla)' : 'url(#sg-pil)'}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: beat >= 1 ? 1 : 0,
                            opacity: beat === 1 ? 0.95 : beat === 2 ? 0.3 : 0,
                        }}
                        transition={{ pathLength: { duration: 3.5, delay: 0.4 + i * 0.5 }, opacity: { duration: 0.6 } }}
                    />
                ))}

                {/* Beat 2 og utover: fronten graves ned */}
                <motion.path
                    d={frontD}
                    fill="none"
                    stroke="#7c2d12"
                    strokeWidth={beat >= 4 ? 16 : 11}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                />
                {beat >= 4 && (
                    <motion.path
                        d={frontD}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={44}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                    />
                )}
                <motion.path
                    d={frontD}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    strokeDasharray="6 10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 0.9 : 0 }}
                />
                <AnimatePresence>
                    {beat >= 3 && (
                        <motion.g key="ender" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <circle cx={nord[0]} cy={nord[1]} r={13} fill="#7c2d12" stroke="#fff" strokeWidth={4} />
                            <circle cx={sor[0]} cy={sor[1]} r={13} fill="#7c2d12" stroke="#fff" strokeWidth={4} />
                            <Merke x={nord[0] - 26} y={nord[1] + 12} tekst="Nordsjøen" anker="end" />
                            <Merke x={sor[0] + 26} y={sor[1] + 12} tekst="Grensa til Sveits" anker="start" />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat >= 4 ? 4 : beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-[4%] px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {['Høsten 1914: angrepet stanser', 'Kappløpet mot havet', 'Soldatene graver seg ned', 'Vestfronten', 'Fire år med stillstand'][Math.min(beat, 4)]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Merke({
    x,
    y,
    tekst,
    anker,
    farge = '#7c2d12',
}: {
    x: number;
    y: number;
    tekst: string;
    anker: 'start' | 'end';
    farge?: string;
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={34} fontWeight={900} fill={farge} stroke="#ffffff" strokeWidth={7} paintOrder="stroke">
            {tekst}
        </text>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill="#f3eddf" stroke="#b9ad92" strokeWidth={1.5} />
            ))}
        </>
    );
});
