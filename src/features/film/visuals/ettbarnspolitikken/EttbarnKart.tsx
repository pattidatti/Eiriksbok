import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kina rundt 1980: omtrent én milliard innbyggere, det lederne var redde for, og målet til
 * Song Jian (650 til 700 millioner, omtrent to tredjedeler) som to stolper ved siden av kartet.
 */

type LngLat = [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const BEIJING: LngLat = [116.4, 39.9];

/** Kartet til venstre, stolpene til høyre. */
const KART_BOKS: [[number, number], [number, number]] = [
    [30, 150],
    [930, 860],
];

const FRYKT = [
    { tekst: 'mer fattigdom', x: 120, y: 260 },
    { tekst: 'for få skoleplasser', x: 560, y: 210 },
    { tekst: 'mer forurensning', x: 110, y: 800 },
    { tekst: 'flere uten jobb', x: 600, y: 820 },
];

const OVERSKRIFT = [
    'Kina rundt 1980: omtrent én milliard',
    'Lederne var redde',
    'Song Jian regner ut den beste størrelsen',
    'Bare omtrent to tredjedeler',
];

export function EttbarnKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(KART_BOKS, {
                type: 'MultiPoint',
                coordinates: [
                    [74, 18],
                    [134, 53],
                ],
            } as never),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const [bx, by] = projeksjon(BEIJING) as [number, number];
    const kinaMidt = projeksjon([103, 34]) as [number, number];
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];

    // Stolpene: 1 milliard er full lengde, målet er 650-700 millioner.
    const S0 = 1000;
    const SL = 520;
    const lav = SL * 0.65;
    const hoy = SL * 0.7;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#d6e7f2' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={0} width={B} height={H} fill="#d6e7f2" />
                {geographies.map((g, i) => {
                    const kina = String(g.id) === KINA;
                    return (
                        <path
                            key={i}
                            d={sti(g as never) ?? ''}
                            fill={kina ? '#dc2626' : '#eef0ea'}
                            stroke={kina ? '#7f1d1d' : '#b8bfb4'}
                            strokeWidth={kina ? 2.5 : 1}
                            opacity={kina && beat >= 2 ? 0.75 : 1}
                        />
                    );
                })}
                <circle cx={bx} cy={by} r={12} fill="#fde047" stroke="#7f1d1d" strokeWidth={4} />
                <text x={bx + 20} y={by - 16} fontSize={34} fontWeight={800} fill="#0f172a">
                    Beijing
                </text>
                <text
                    x={kinaMidt[0]}
                    y={kinaMidt[1]}
                    fontSize={72}
                    fontWeight={900}
                    fill="#fff"
                    textAnchor="middle"
                    opacity={0.95}
                >
                    KINA
                </text>
                {beat === 0 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <rect
                            x={kinaMidt[0] - 220}
                            y={kinaMidt[1] + 30}
                            width={440}
                            height={80}
                            rx={18}
                            fill="#fff"
                        />
                        <text
                            x={kinaMidt[0]}
                            y={kinaMidt[1] + 84}
                            fontSize={40}
                            fontWeight={900}
                            fill="#7f1d1d"
                            textAnchor="middle"
                        >
                            ca. 1 milliard
                        </text>
                    </motion.g>
                )}
                {beat === 1 &&
                    FRYKT.map((f, i) => {
                        const bredde = f.tekst.length * 21 + 50;
                        return (
                            <motion.g
                                key={f.tekst}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.5 }}
                            >
                                <rect
                                    x={f.x}
                                    y={f.y - 50}
                                    width={bredde}
                                    height={70}
                                    rx={18}
                                    fill="#1e293b"
                                />
                                <text
                                    x={f.x + bredde / 2}
                                    y={f.y - 3}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill="#fff"
                                    textAnchor="middle"
                                >
                                    {f.tekst}
                                </text>
                            </motion.g>
                        );
                    })}
                {beat >= 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <rect
                            x={S0 - 40}
                            y={230}
                            width={620}
                            height={560}
                            rx={30}
                            fill="#fff"
                            opacity={0.96}
                        />
                        <text x={S0} y={310} fontSize={36} fontWeight={800} fill="#0f172a">
                            Folk i Kina rundt 1980
                        </text>
                        <rect x={S0} y={340} width={SL} height={80} rx={14} fill="#dc2626" />
                        <text x={S0 + 20} y={394} fontSize={38} fontWeight={900} fill="#fff">
                            ca. 1 milliard
                        </text>
                        <text x={S0} y={520} fontSize={36} fontWeight={800} fill="#0f172a">
                            Song Jians utregning
                        </text>
                        <motion.rect
                            x={S0}
                            y={550}
                            height={80}
                            rx={14}
                            fill="#0f766e"
                            initial={{ width: 0 }}
                            animate={{ width: lav }}
                            transition={{ duration: 1.2, delay: 0.6 }}
                        />
                        {/* Spennet 650-700 millioner som en lysere bit på enden. */}
                        <motion.rect
                            x={S0 + lav}
                            y={550}
                            height={80}
                            fill="#5eead4"
                            initial={{ width: 0 }}
                            animate={{ width: hoy - lav }}
                            transition={{ duration: 0.4, delay: 1.8 }}
                        />
                        <text x={S0} y={680} fontSize={34} fontWeight={800} fill="#0f766e">
                            650 til 700 millioner
                        </text>
                        {beat >= 3 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <rect
                                    x={S0 + hoy}
                                    y={550}
                                    width={SL - hoy}
                                    height={80}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={5}
                                    strokeDasharray="12 8"
                                />
                                <text x={S0} y={750} fontSize={40} fontWeight={900} fill="#7f1d1d">
                                    omtrent to tredjedeler
                                </text>
                            </motion.g>
                        )}
                    </motion.g>
                )}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl text-center"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="absolute right-[3%] bottom-[3%] text-2xl font-semibold text-slate-700">
                Dagens grenser, omtrentlig
            </div>
        </div>
    );
}
