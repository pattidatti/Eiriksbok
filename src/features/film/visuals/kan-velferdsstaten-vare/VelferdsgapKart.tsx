import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart. To moduser:
 * - olje: Norge og havet utenfor. Plattformer som glør og sender penger i land, så dempes de,
 *   og til slutt oljefondet.
 * - penger: Nord-Europa. Penger som går ut av landet, et overskudd som flyttes til «land med
 *   lavere skatt» (ikke noe bestemt land), forventninger som vokser, og pensjonsreformen.
 * Plattformene er symboler for olje og gass på sokkelen, ikke bestemte felt.
 */

type Modus = 'olje' | 'penger';

const B = 1600;
const H = 900;
const NORGE = 578;

const UTSNITT: Record<Modus, Utsnitt> = {
    olje: [
        [-2, 56.5],
        [16, 66.5],
    ],
    penger: [
        [-11, 42],
        [33, 69],
    ],
};

const PLATTFORMER: [number, number][] = [
    [2.4, 61.3],
    [2.6, 56.9],
    [3.3, 58.6],
    [7.4, 64.6],
];
const KYST: [number, number] = [5.8, 59.4];
const NORGE_MIDT: [number, number] = [9.5, 61.2];

const TITLER: Record<Modus, string[]> = {
    olje: ['Olje og gass', 'Inntektene blir mindre', 'Oljefondet'],
    penger: [
        'Penger flytter fritt',
        'Overskudd ut av landet',
        'Forventningene vokser',
        'Gapet blir større',
        'Pensjonsreformen',
    ],
};

interface KortData {
    stor: string;
    liten?: string;
    farge: string;
}

const KORT: Record<Modus, KortData[]> = {
    olje: [
        { stor: 'Olje og gass har gjort Norge rikt', farge: '#0f766e' },
        {
            stor: 'Den tiden går sakte mot slutten',
            liten: 'Inntektene fra olje og gass blir mindre',
            farge: '#b91c1c',
        },
        { stor: 'Over 20 000 milliarder kroner', liten: 'i oljefondet', farge: '#b45309' },
    ],
    penger: [
        { stor: 'Noe ingen partier bestemmer over alene', farge: '#334155' },
        {
            stor: 'Store selskaper kan flytte overskuddet',
            liten: 'til land med lavere skatt',
            farge: '#b91c1c',
        },
        {
            stor: 'Folk vil ha stadig bedre tjenester',
            liten: 'når landet blir rikere',
            farge: '#1d4ed8',
        },
        {
            stor: 'Alle vil ha mer, færre betaler',
            liten: 'da blir gapet enda større',
            farge: '#b91c1c',
        },
        {
            stor: 'Pensjonsreformen',
            liten: 'Pensjonen henger sammen med hvor lenge folk lever, og det lønner seg å jobbe lenger',
            farge: '#0f766e',
        },
    ],
};

function Plattform({ x, y, aktiv }: { x: number; y: number; aktiv: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`} opacity={aktiv ? 1 : 0.45}>
            {aktiv && <circle r={46} fill="#fbbf24" opacity={0.35} />}
            <rect x={-22} y={-8} width={44} height={14} fill="#334155" />
            <line x1={-16} y1={6} x2={-16} y2={28} stroke="#334155" strokeWidth={5} />
            <line x1={16} y1={6} x2={16} y2={28} stroke="#334155" strokeWidth={5} />
            <line x1={10} y1={-8} x2={10} y2={-38} stroke="#334155" strokeWidth={5} />
            {aktiv && <path d="M10,-38 q-10,-16 0,-30 q10,14 0,30" fill="#f97316" />}
        </g>
    );
}

export function VelferdsgapKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'olje';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(utsnitt);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 140],
                    [1010, H - 30],
                ],
                { type: 'MultiPoint', coordinates: utsnitt } as never
            ),
        [utsnitt]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const titler = TITLER[modus];
    const b = Math.min(beat, titler.length - 1);
    const kort = KORT[modus][b];

    const [nx, ny] = p(NORGE_MIDT);

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={Number(g.id) === NORGE ? '#fdf4e3' : '#e7e5e4'}
                        stroke={Number(g.id) === NORGE ? '#b45309' : '#a8a29e'}
                        strokeWidth={Number(g.id) === NORGE ? 2.5 : 1}
                    />
                ))}

                {modus === 'olje' && (
                    <g>
                        {PLATTFORMER.map((ll, i) => {
                            const [x, y] = p(ll);
                            const [kx, ky] = p(KYST);
                            const mx = (x + kx) / 2;
                            const my = Math.min(y, ky) - 60;
                            return (
                                <g key={i}>
                                    {b === 0 && (
                                        <motion.path
                                            d={`M${x},${y} Q${mx},${my} ${kx},${ky}`}
                                            fill="none"
                                            stroke="#d97706"
                                            strokeWidth={7}
                                            strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1.2, delay: 0.3 + i * 0.2 }}
                                        />
                                    )}
                                    <Plattform x={x} y={y} aktiv={b === 0} />
                                </g>
                            );
                        })}
                        {(() => {
                            const [x, y] = p([1.2, 60.2]);
                            return (
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={900}
                                    fill="#0f172a"
                                    stroke="#fff"
                                    strokeWidth={8}
                                    paintOrder="stroke"
                                >
                                    olje og gass
                                </text>
                            );
                        })()}
                    </g>
                )}

                {modus === 'penger' && (
                    <g>
                        {/* Penger ut og inn over grensene */}
                        {b === 0 &&
                            [
                                [-280, 250],
                                [230, 290],
                                [-360, 30],
                            ].map(([dx, dy], i) => (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.3 }}
                                >
                                    <path
                                        d={`M${nx},${ny} Q${nx + dx / 2 + dy * 0.2},${ny + dy / 2 - dx * 0.2} ${nx + dx},${ny + dy}`}
                                        fill="none"
                                        stroke="#d97706"
                                        strokeWidth={7}
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx={nx + dx}
                                        cy={ny + dy}
                                        r={18}
                                        fill="#fbbf24"
                                        stroke="#b45309"
                                        strokeWidth={4}
                                    />
                                </motion.g>
                            ))}
                        {b === 1 && (
                            <g>
                                {/* Pila går ut av bildet: artikkelen nevner ikke noe bestemt land. */}
                                <motion.path
                                    d={`M${nx},${ny} Q${nx - 250},${ny - 60} 0,${ny + 40}`}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={12}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.4, delay: 0.3 }}
                                />
                                <circle cx={nx} cy={ny} r={16} fill="#dc2626" />
                            </g>
                        )}
                        {b >= 2 && b <= 3 && (
                            <g>
                                {[
                                    { dx: -170, dy: -40, t: 'Bedre!' },
                                    { dx: 120, dy: -70, t: 'Mer!' },
                                ].map((bo, i) => (
                                    <motion.g
                                        key={bo.t}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: b === 2 ? 0.3 + i * 0.35 : 0 }}
                                    >
                                        <rect
                                            x={nx + bo.dx - 95}
                                            y={ny + bo.dy - 36}
                                            width={190}
                                            height={66}
                                            rx={33}
                                            fill="#1d4ed8"
                                        />
                                        <text
                                            x={nx + bo.dx}
                                            y={ny + bo.dy + 10}
                                            textAnchor="middle"
                                            fontSize={34}
                                            fontWeight={900}
                                            fill="#fff"
                                        >
                                            {bo.t}
                                        </text>
                                    </motion.g>
                                ))}
                            </g>
                        )}
                    </g>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={titler[b]}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {titler[b]}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${b}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
                    style={{
                        right: '4%',
                        top: '30%',
                        width: '32%',
                        borderLeft: `12px solid ${kort.farge}`,
                    }}
                >
                    <div
                        className="text-3xl font-black leading-tight"
                        style={{ color: kort.farge }}
                    >
                        {kort.stor}
                    </div>
                    {kort.liten && (
                        <div className="text-2xl font-bold text-slate-600 mt-2 leading-snug">
                            {kort.liten}
                        </div>
                    )}
                    {modus === 'penger' && b === 3 && (
                        <div className="mt-3 flex items-end" style={{ gap: 18, height: 120 }}>
                            <div className="text-2xl font-black text-rose-700">gapet</div>
                            <motion.div
                                className="rounded-lg bg-rose-500"
                                style={{ width: 80 }}
                                initial={{ height: 40 }}
                                animate={{ height: 116 }}
                                transition={{ duration: 1.4, delay: 0.5 }}
                            />
                        </div>
                    )}
                    {modus === 'olje' && b === 1 && (
                        <div className="text-7xl font-black text-red-600 mt-2">↓</div>
                    )}
                    {modus === 'olje' && b === 2 && (
                        <svg
                            viewBox="0 0 300 150"
                            className="mt-3"
                            style={{ width: 300, height: 150 }}
                        >
                            {[0, 1, 2].map((k) =>
                                Array.from({ length: 5 + k }, (_, i) => (
                                    <ellipse
                                        key={`${k}-${i}`}
                                        cx={70 + k * 80}
                                        cy={130 - i * 18}
                                        rx={36}
                                        ry={11}
                                        fill="#fbbf24"
                                        stroke="#b45309"
                                        strokeWidth={3}
                                    />
                                ))
                            )}
                        </svg>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
