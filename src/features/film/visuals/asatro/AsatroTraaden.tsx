import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Livstråden. Den går fra fødselen til en dødsdag som alt er bestemt. To veier, under senga
 * eller fremst i krigen, ender på samme dag. Til slutt fortsetter ettermælet etter tråden.
 */

const B = 1600;
const H = 900;
const START = { x: 200, y: 470 };
const SLUTT = { x: 1080, y: 470 };

function Saks({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <line x1={0} y1={-90} x2={0} y2={90} stroke="#dc2626" strokeWidth={10} strokeLinecap="round" />
            <circle cx={0} cy={-110} r={16} fill="none" stroke="#dc2626" strokeWidth={6} />
            <circle cx={0} cy={110} r={16} fill="none" stroke="#dc2626" strokeWidth={6} />
        </g>
    );
}

export function AsatroTraaden({ beat, playing }: VisualProps) {
    const d = (s: number) => (playing ? s : 0);
    const to = beat >= 2;
    const over = `M ${START.x + 260} ${START.y} C ${START.x + 420} ${START.y - 230}, ${SLUTT.x - 260} ${START.y - 230}, ${SLUTT.x} ${SLUTT.y}`;
    const under = `M ${START.x + 260} ${START.y} C ${START.x + 420} ${START.y + 230}, ${SLUTT.x - 260} ${START.y + 230}, ${SLUTT.x} ${SLUTT.y}`;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f6f1e7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <text x={B / 2} y={100} textAnchor="middle" fontSize={62} fontWeight={900} fill="#0f172a">
                    {beat === 0 ? 'Dødsforakt: ikke redd for å dø' : beat >= 4 ? 'Det som lever evig' : 'Dødsdagen er bestemt'}
                </text>

                {/* Tråden fra fødselen */}
                {!to && (
                    <motion.path
                        d={`M ${START.x} ${START.y} L ${SLUTT.x} ${SLUTT.y}`}
                        stroke="#a16207"
                        strokeWidth={12}
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: d(2), delay: d(0.4) }}
                    />
                )}
                {to && (
                    <g>
                        <path d={`M ${START.x} ${START.y} L ${START.x + 260} ${START.y}`} stroke="#a16207" strokeWidth={12} strokeLinecap="round" />
                        <motion.path
                            d={over}
                            stroke="#64748b"
                            strokeWidth={beat === 3 ? 8 : 12}
                            fill="none"
                            initial={{ pathLength: beat === 2 ? 0 : 1 }}
                            animate={{ pathLength: 1, opacity: beat === 3 ? 0.4 : 1 }}
                            transition={{ duration: d(1.6), delay: d(0.4) }}
                        />
                        <motion.path
                            d={under}
                            stroke={beat >= 3 ? '#ca8a04' : '#64748b'}
                            strokeWidth={beat === 3 ? 16 : 12}
                            fill="none"
                            initial={{ pathLength: beat === 2 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: d(1.6), delay: d(beat === 2 ? 2.4 : 0) }}
                        />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(beat === 2 ? 1 : 0) }}>
                            <rect x={445} y={232} width={490} height={70} rx={18} fill="#e2e8f0" />
                            <text x={690} y={280} textAnchor="middle" fontSize={38} fontWeight={800} fill="#334155">
                                gjemmer seg under senga
                            </text>
                        </motion.g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(beat === 2 ? 3 : 0) }}>
                            <rect x={455} y={640} width={470} height={70} rx={18} fill={beat >= 3 ? '#fde68a' : '#e2e8f0'} />
                            <text x={690} y={688} textAnchor="middle" fontSize={38} fontWeight={800} fill="#334155">
                                stormer fremst i krigen
                            </text>
                        </motion.g>
                    </g>
                )}

                {/* Fødselen */}
                <circle cx={START.x} cy={START.y} r={30} fill="#0d9488" />
                <text x={START.x} y={START.y + 90} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                    fødsel
                </text>

                {/* Dødsdagen */}
                {beat >= 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(beat === 1 ? 0.6 : 0) }}>
                        <Saks x={SLUTT.x} y={SLUTT.y} />
                        <text x={SLUTT.x} y={SLUTT.y + 175} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                            dødsdagen
                        </text>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(1.8) }}>
                        <rect x={START.x + 170} y={START.y - 200} width={560} height={90} rx={22} fill="#1e293b" />
                        <text x={START.x + 450} y={START.y - 142} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                            bestemt fra første dag
                        </text>
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.8) }}>
                        <rect x={SLUTT.x + 90} y={SLUTT.y - 45} width={400} height={90} rx={22} fill="#ca8a04" />
                        <text x={SLUTT.x + 290} y={SLUTT.y + 14} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                            død med ære
                        </text>
                    </motion.g>
                )}

                {/* Ettermælet fortsetter etter tråden */}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: d(1.2), delay: d(0.6) }}>
                        {Array.from({ length: 9 }, (_, i) => (
                            <circle key={i} cx={SLUTT.x + 50 + i * 50} cy={SLUTT.y} r={12} fill="#facc15" stroke="#a16207" strokeWidth={3} />
                        ))}
                        <rect x={SLUTT.x + 40} y={SLUTT.y - 170} width={440} height={100} rx={24} fill="#facc15" />
                        <text x={SLUTT.x + 260} y={SLUTT.y - 106} textAnchor="middle" fontSize={48} fontWeight={900} fill="#0f172a">
                            ettermælet
                        </text>
                        <text x={SLUTT.x + 260} y={SLUTT.y + 90} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                            det folk sier om deg
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
