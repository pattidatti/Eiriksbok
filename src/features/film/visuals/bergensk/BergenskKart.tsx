import { memo, useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Nord-Europa med Bergen.
 * «oy»: Bergen med fjell og fjorder rundt, dialektene rundt, skipene som kommer fra hele
 * Europa, og byen som en språklig øy.
 * «skarre»: skarre-r-en hopper fra Paris til Köln, Berlin og København, så til Bergen, og
 * først etterpå ut til bygdene rundt (sprangmodellen).
 */

type Modus = 'oy' | 'skarre';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [-8, 45],
    [26, 65],
];

const BERGEN: LngLat = [5.32, 60.39];
const BYER: {
    navn: string;
    ll: LngLat;
    tid?: string;
    dx: number;
    dy: number;
    anker: 'start' | 'end' | 'middle';
}[] = [
    { navn: 'Paris', ll: [2.35, 48.86], tid: '1600-tallet', dx: -22, dy: -6, anker: 'end' },
    { navn: 'Köln', ll: [6.96, 50.94], dx: 20, dy: 10, anker: 'start' },
    { navn: 'Berlin', ll: [13.4, 52.52], dx: 20, dy: 10, anker: 'start' },
    { navn: 'København', ll: [12.57, 55.68], tid: 'ca. 1780', dx: 22, dy: 10, anker: 'start' },
];

/** Fjell rundt Bergen, som små trekanter (lengde, bredde). */
const FJELL: LngLat[] = [
    [5.75, 60.55],
    [6.1, 60.3],
    [5.9, 60.05],
    [6.45, 60.6],
    [6.7, 60.15],
    [5.65, 60.8],
    [6.3, 60.9],
    [7.0, 60.45],
    [6.9, 60.85],
    [6.2, 59.85],
    [7.2, 60.1],
    [5.95, 61.05],
];
/** Dialektene rundt byen. */
const BYGDER: LngLat[] = [
    [5.05, 60.75],
    [5.6, 60.95],
    [6.35, 60.42],
    [5.95, 60.22],
    [5.5, 59.95],
    [6.6, 60.75],
    [5.2, 60.05],
    [6.9, 60.3],
    [6.15, 61.0],
    [6.55, 59.95],
];
/** Sjøruter inn til Bergen, med mellompunkter ute i havet. */
const RUTER: LngLat[][] = [
    [[1.5, 51.3], [3.0, 54.5], [3.8, 58.5], [4.6, 60.1], BERGEN],
    [[7.6, 54.3], [6.6, 56.8], [4.9, 58.8], [4.6, 60.1], BERGEN],
    [[10.6, 57.75], [8.0, 57.7], [5.4, 58.4], [4.6, 60.1], BERGEN],
    [[-3.0, 58.9], [0.5, 59.6], [3.5, 60.2], [4.6, 60.25], BERGEN],
];

const HAV = '#cfe3ef';

export function BergenskKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'oy';
    const { geographies } = useFilmVerden(UTSNITT);

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-4, 46.6],
                        [21, 63],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const bergen = p(BERGEN);

    // Zoom: 1 = hele Nord-Europa, over 1 = tett på Bergen.
    const zoomMal =
        modus === 'oy' ? (beat <= 1 ? 6 : beat === 2 ? 1.25 : 2.2) : beat >= 4 ? 4.5 : 1;
    const z = useMotionValue(zoomMal);
    const tegn = useMotionValue(0);
    useEffect(() => {
        const a = animate(z, zoomMal, { duration: playing ? 2.6 : 0, ease: 'easeInOut' });
        tegn.set(0);
        const b = animate(tegn, 1, { duration: playing ? 3.2 : 0, delay: playing ? 0.6 : 0 });
        return () => {
            a.stop();
            b.stop();
        };
    }, [zoomMal, beat, playing, z, tegn]);
    const [kk, setKk] = useState(zoomMal);
    const [tv, setTv] = useState(0);
    useMotionValueEvent(z, 'change', setKk);
    useMotionValueEvent(tegn, 'change', setTv);

    // Fokuspunktet glir mot Bergen når kartet zoomer inn.
    const midt: [number, number] = [B / 2 + 40, H / 2];
    const andel = Math.min(1, Math.max(0, (kk - 1) / 2));
    const fokus: [number, number] = [
        midt[0] + (bergen[0] - midt[0]) * andel,
        midt[1] + (bergen[1] - midt[1]) * andel,
    ];
    const kartTransform = `translate(${B / 2 - fokus[0] * kk} ${H / 2 - fokus[1] * kk}) scale(${kk})`;
    const skjerm = (pt: [number, number]): [number, number] => [
        B / 2 + (pt[0] - fokus[0]) * kk,
        H / 2 + (pt[1] - fokus[1]) * kk,
    ];
    const flytt = (pt: [number, number]) => {
        const s = skjerm(pt);
        return `translate(${s[0]} ${s[1]})`;
    };

    const ruteD = (rute: LngLat[]) =>
        rute.map((ll, i) => `${i ? 'L' : 'M'} ${p(ll).join(' ')}`).join(' ');

    // Sprangene i «skarre»: buer som hopper fra by til by.
    const hopp = useMemo(() => {
        const punkter = [...BYER.map((b) => b.ll), BERGEN].map(
            (ll) => projeksjon(ll) as [number, number]
        );
        return punkter.slice(1).map((til, i) => {
            const fra = punkter[i];
            const mx = (fra[0] + til[0]) / 2;
            const my = (fra[1] + til[1]) / 2 - Math.hypot(til[0] - fra[0], til[1] - fra[1]) * 0.35;
            return `M ${fra.join(' ')} Q ${mx} ${my} ${til.join(' ')}`;
        });
    }, [projeksjon]);
    // Hvilke hopp som er tegnet, per beat: 1 Paris, 2 Köln-Berlin-København, 3 Bergen.
    const synligeHopp = beat <= 1 || beat >= 4 ? 0 : 3;
    const synligeByer = beat === 0 ? 0 : beat === 1 ? 1 : 4;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={0} width={B} height={H} fill={HAV} />
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} />
                    {modus === 'oy' &&
                        beat === 2 &&
                        RUTER.map((r, i) => (
                            <motion.path
                                key={i}
                                d={ruteD(r)}
                                fill="none"
                                stroke="#0f766e"
                                strokeWidth={5 / kk}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: tv }}
                                transition={{ duration: 0 }}
                            />
                        ))}
                    {modus === 'skarre' &&
                        hopp.map((d, i) =>
                            i < synligeHopp ? (
                                <motion.path
                                    key={i}
                                    d={d}
                                    fill="none"
                                    stroke="#7c3aed"
                                    strokeWidth={6 / kk}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.4, delay: (i % 3) * 0.9 }}
                                />
                            ) : null
                        )}
                </g>

                {/* Fjell og bygder, tegnet i skjermkoordinater så de holder størrelsen. */}
                {modus === 'oy' &&
                    beat <= 1 &&
                    BYGDER.map((ll, i) => (
                        <g key={`b${i}`} transform={flytt(p(ll))}>
                            <circle r={11} fill="#94a3b8" stroke="#ffffff" strokeWidth={3} />
                        </g>
                    ))}
                {modus === 'oy' &&
                    beat === 1 &&
                    FJELL.map((ll, i) => (
                        <motion.g
                            key={`f${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.12 }}
                        >
                            <g transform={flytt(p(ll))}>
                                <path
                                    d="M -24 14 L 0 -22 L 24 14 Z"
                                    fill="#6b7f5e"
                                    stroke="#3f4d37"
                                    strokeWidth={2.5}
                                />
                                <path d="M -8 -10 L 0 -22 L 8 -10 Z" fill="#f8fafc" />
                            </g>
                        </motion.g>
                    ))}
                {modus === 'oy' &&
                    beat === 2 &&
                    RUTER.map((r, i) => {
                        // Et skip på vei inn langs hver rute.
                        const t = Math.min(0.999, tv * 0.72);
                        const n = r.length - 1;
                        const seg = Math.min(n - 1, Math.floor(t * n));
                        const f = t * n - seg;
                        const a = p(r[seg]);
                        const b = p(r[seg + 1]);
                        const pos: [number, number] = [
                            a[0] + (b[0] - a[0]) * f,
                            a[1] + (b[1] - a[1]) * f,
                        ];
                        return (
                            <g key={`s${i}`} transform={flytt(pos)}>
                                <path d="M -16 0 L 16 0 L 10 9 L -10 9 Z" fill="#7c4a1e" />
                                <path
                                    d="M -1 0 L -1 -24 L 13 -12 Z"
                                    fill="#fef3c7"
                                    stroke="#7c4a1e"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    })}
                {modus === 'oy' && beat === 3 && (
                    <motion.circle
                        cx={skjerm(bergen)[0]}
                        cy={skjerm(bergen)[1]}
                        initial={{ r: 20, opacity: 0 }}
                        animate={{ r: 120, opacity: 1 }}
                        transition={{ duration: 1.6 }}
                        fill="#fde68a"
                        fillOpacity={0.35}
                        stroke="#d97706"
                        strokeWidth={6}
                    />
                )}
                {modus === 'skarre' &&
                    beat >= 4 &&
                    BYGDER.map((ll, i) => (
                        <motion.g
                            key={`sb${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 + i * 0.25 }}
                        >
                            <line
                                x1={skjerm(bergen)[0]}
                                y1={skjerm(bergen)[1]}
                                x2={skjerm(p(ll))[0]}
                                y2={skjerm(p(ll))[1]}
                                stroke="#a78bfa"
                                strokeWidth={4}
                            />
                            <g transform={flytt(p(ll))}>
                                <circle r={12} fill="#7c3aed" stroke="#ffffff" strokeWidth={3} />
                            </g>
                        </motion.g>
                    ))}

                {/* Byene i «skarre» */}
                {modus === 'skarre' &&
                    BYER.map((by, i) =>
                        i < synligeByer && beat < 4 ? (
                            <motion.g
                                key={by.navn}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i === 0 ? 0.3 : (i - 1) * 0.9 + 1.2 }}
                            >
                                <g transform={flytt(p(by.ll))}>
                                    <circle
                                        r={13}
                                        fill="#7c3aed"
                                        stroke="#ffffff"
                                        strokeWidth={4}
                                    />
                                    <Merke tekst={by.navn} x={by.dx} y={by.dy} anker={by.anker} />
                                    {by.tid && (
                                        <Merke
                                            tekst={by.tid}
                                            x={by.dx}
                                            y={by.dy + 38}
                                            anker={by.anker}
                                            farge="#6d28d9"
                                            storrelse={38}
                                        />
                                    )}
                                </g>
                            </motion.g>
                        ) : null
                    )}

                {modus === 'skarre' && beat === 3 && (
                    <motion.circle
                        cx={skjerm(bergen)[0]}
                        cy={skjerm(bergen)[1]}
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth={6}
                        initial={{ r: 16, opacity: 1 }}
                        animate={{ r: 70, opacity: 0 }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                    />
                )}
                {/* Bergen */}
                <g transform={flytt(bergen)}>
                    <circle
                        r={16}
                        fill={modus === 'skarre' && beat >= 3 ? '#7c3aed' : '#dc2626'}
                        stroke="#ffffff"
                        strokeWidth={5}
                    />
                    <Merke tekst="Bergen" x={-26} y={12} anker="end" storrelse={42} />
                </g>
            </svg>

            <Overskrift modus={modus} beat={beat} />
        </div>
    );
}

function Overskrift({ modus, beat }: { modus: Modus; beat: number }) {
    const tekster: Record<Modus, string[]> = {
        oy: [
            'Bergensk er ulik dialektene rundt',
            'Fjell og fjorder rundt byen',
            'Skip fra hele Europa',
            'En språklig øy',
        ],
        skarre: [
            'Skarre-r: ikke gammel i Bergen',
            'Trolig født i Paris',
            'Fra by til by',
            'Bergen: blant de første i Norge',
            'Sprangmodellen: først byene, så bygdene',
        ],
    };
    const tekst = tekster[modus][Math.min(beat, tekster[modus].length - 1)];
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: '5%' }}>
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

function Merke({
    tekst,
    x,
    y,
    anker,
    farge = '#0f172a',
    storrelse = 36,
}: {
    tekst: string;
    x: number;
    y: number;
    anker: 'start' | 'end' | 'middle';
    farge?: string;
    storrelse?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f5efe0"
                    stroke="#b9ad92"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});
