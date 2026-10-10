import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Rent land-buddhismen på kartet: Kina og Japan lyser opp, og ved siden av står en liten
 * stige som viser at denne retningen ligger nærmere nåden enn resten av buddhismen.
 */

const B = 1600;
const H = 900;
const KINA = 156;
const JAPAN = 392;
const GULL = '#f59e0b';

export function FrelseKart({ beat }: VisualProps) {
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 60],
                    [1040, H - 60],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [68, 8],
                        [146, 52],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const lyser = beat >= 1;
    const kina = p([104, 34]);
    const japan = p([138.5, 37]);

    return (
        <div className="absolute inset-0" style={{ background: '#dbeafe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    const merket = id === KINA || id === JAPAN;
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: merket && lyser ? GULL : '#e7e5e4' }}
                            transition={{ duration: 1 }}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}
                {lyser && (
                    <>
                        <motion.text
                            x={kina[0]}
                            y={kina[1]}
                            textAnchor="middle"
                            fontSize={52}
                            fontWeight={900}
                            fill="#78350f"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            Kina
                        </motion.text>
                        <motion.text
                            x={japan[0] - 30}
                            y={japan[1] - 60}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#78350f"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            Japan
                        </motion.text>
                    </>
                )}

                {/* Kortet til høyre */}
                <rect x={1080} y={60} width={480} height={780} rx={30} fill="#fff" opacity={0.95} />
                <text
                    x={1320}
                    y={135}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Rent land-buddhismen
                </text>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 0 ? 1 : 0 }}>
                    <text
                        x={1320}
                        y={400}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Ikke alle buddhister
                    </text>
                    <text
                        x={1320}
                        y={450}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        svarer likt
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 1 ? 1 : 0 }}>
                    {/* Amitabha med glorie, og en troende som stoler på ham */}
                    <circle cx={1320} cy={380} r={110} fill="#fde68a" />
                    <circle cx={1320} cy={340} r={30} fill="#e0b98a" />
                    <path
                        d="M 1280 375 Q 1320 360 1360 375 L 1372 450 L 1268 450 Z"
                        fill="#b45309"
                    />
                    <ellipse cx={1320} cy={455} rx={90} ry={18} fill="#b45309" />
                    <text
                        x={1320}
                        y={545}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill="#92400e"
                    >
                        Amitabha
                    </text>
                    <text
                        x={1320}
                        y={620}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Den troende stoler
                    </text>
                    <text
                        x={1320}
                        y={665}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#475569"
                    >
                        på ham, ikke på seg selv
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }}>
                    {/* En liten stige: buddhismen nederst, rent land et stykke opp */}
                    <text
                        x={1320}
                        y={200}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#b45309"
                    >
                        gjort for deg
                    </text>
                    {[0, 1, 2, 3, 4].map((k) => (
                        <rect
                            key={k}
                            x={1170}
                            y={240 + k * 110}
                            width={300}
                            height={22}
                            rx={8}
                            fill="#c8a77a"
                        />
                    ))}
                    <text
                        x={1320}
                        y={830}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#334155"
                    >
                        gjort av deg
                    </text>
                    <circle cx={1250} cy={665} r={30} fill={GULL} />
                    <text
                        x={1250}
                        y={740}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#334155"
                    >
                        buddhismen
                    </text>
                    <motion.path
                        d="M 1290 650 C 1360 620 1385 570 1392 530"
                        fill="none"
                        stroke={GULL}
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeDasharray="18 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 2 ? 1 : 0 }}
                        transition={{ duration: 1.4, delay: 0.3 }}
                    />
                    <path d="M 1374 534 L 1393 500 L 1411 536 Z" fill={GULL} />
                    <text
                        x={1250}
                        y={518}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={900}
                        fill="#92400e"
                    >
                        rent land:
                    </text>
                    <text
                        x={1250}
                        y={552}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={900}
                        fill="#92400e"
                    >
                        nærmere nåden
                    </text>
                </motion.g>
            </svg>
            {beat >= 2 && (
                <div className="absolute left-[4%] bottom-[6%] px-5 py-3 rounded-2xl bg-slate-900 text-amber-200 text-xl md:text-3xl font-display font-black shadow-xl">
                    Så nær nåde kommer en buddhist
                </div>
            )}
        </div>
    );
}
