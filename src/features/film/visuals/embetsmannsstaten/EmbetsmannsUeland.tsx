import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, EMBETSMANN, KONGE, ROD } from './farger';
import { Figur } from './figurer';

/**
 * Ole Gabriel Ueland: læreren fra Rogaland som ville at staten skulle bruke minst mulig
 * penger. Utgiftene han stemte mot blir krysset ut, men regjeringen blir stående.
 */

const UTGIFTER = ['Pensjoner', 'Veier', 'Jernbane', 'Kunst'];

function Kort({ x, tekst, i, kryss }: { x: number; tekst: string; i: number; kryss: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.3 }}
        >
            <rect x={x - 140} y={420} width={280} height={130} rx={22} fill="#fff" stroke="#e2e8f0" strokeWidth={4} />
            <text x={x} y={500} textAnchor="middle" fontSize={42} fontWeight={900} fill={BLEKK}>
                {tekst}
            </text>
            {kryss && (
                <motion.path
                    d={`M ${x - 115} 486 L ${x + 115} 486`}
                    stroke={ROD}
                    strokeOpacity={0.85}
                    strokeWidth={9}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.9 + i * 0.5, duration: 0.5 }}
                />
            )}
        </motion.g>
    );
}

export function EmbetsmannsUeland({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-green-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Ueland til venstre, hele tiden */}
                <g transform="translate(200 600)">
                    <Figur type="bonde" />
                </g>
                <text x={200} y={660} textAnchor="middle" fontSize={36} fontWeight={900} fill={BLEKK}>
                    Ole Gabriel Ueland
                </text>
                <text x={200} y={700} textAnchor="middle" fontSize={28} fontWeight={700} fill="#475569">
                    lærer fra Rogaland
                </text>

                <AnimatePresence mode="wait">
                    {beat === 0 && (
                        <motion.g key="gard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <text x={950} y={170} textAnchor="middle" fontSize={50} fontWeight={900} fill={BLEKK}>
                                Fra gård til gård
                            </text>
                            {[0, 1, 2, 3].map((i) => {
                                const x = 520 + i * 290;
                                return (
                                    <motion.g key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.4 }}>
                                        <rect x={x - 70} y={380} width={140} height={110} fill="#b91c1c" />
                                        <path d={`M ${x - 90} 384 L ${x} 300 L ${x + 90} 384 Z`} fill="#44403c" />
                                        <rect x={x - 18} y={430} width={36} height={60} fill="#fef3c7" />
                                        {i < 3 && (
                                            <motion.path
                                                d={`M ${x + 80} 540 Q ${x + 145} 580 ${x + 210} 540`}
                                                fill="none"
                                                stroke={BONDE}
                                                strokeWidth={8}
                                                strokeDasharray="14 12"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ delay: 0.6 + i * 0.4 }}
                                            />
                                        )}
                                    </motion.g>
                                );
                            })}
                            <text x={950} y={640} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                                omgangsskolelærer: underviste barna på gården
                            </text>
                        </motion.g>
                    )}
                    {beat >= 1 && beat <= 2 && (
                        <motion.g key="penger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <rect x={480} y={110} width={940} height={110} rx={55} fill={BONDE} />
                            <text x={950} y={182} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff">
                                Staten: minst mulig penger
                            </text>
                            <g>
                                <line x1={520} y1={300} x2={1380} y2={300} stroke="#cbd5e1" strokeWidth={12} strokeLinecap="round" />
                                <motion.line
                                    x1={520}
                                    y1={300}
                                    x2={1380}
                                    y2={300}
                                    stroke={BONDE}
                                    strokeWidth={12}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.6 }}
                                />
                                <text x={520} y={360} textAnchor="middle" fontSize={34} fontWeight={900} fill={BLEKK}>
                                    1833
                                </text>
                                <text x={1380} y={360} textAnchor="middle" fontSize={34} fontWeight={900} fill={BLEKK}>
                                    1869
                                </text>
                                <text x={950} y={280} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                                    på Stortinget
                                </text>
                            </g>
                            {beat === 1 && (
                                <motion.g key="mynt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                                    {[0, 1, 2].map((i) => (
                                        <motion.g
                                            key={i}
                                            initial={{ scaleY: 1 }}
                                            animate={{ scaleY: 1 - i * 0.3 }}
                                            transition={{ delay: 1.4 + i * 0.6, duration: 0.8 }}
                                            style={{ transformOrigin: `${700 + i * 250}px 640px` }}
                                        >
                                            {Array.from({ length: 6 }, (_, k) => (
                                                <ellipse
                                                    key={k}
                                                    cx={700 + i * 250}
                                                    cy={620 - k * 34}
                                                    rx={80}
                                                    ry={22}
                                                    fill={KONGE}
                                                    stroke="#a16207"
                                                    strokeWidth={5}
                                                />
                                            ))}
                                        </motion.g>
                                    ))}
                                    <text x={950} y={720} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                                        statens utgifter: ned, ned, ned
                                    </text>
                                </motion.g>
                            )}
                            {beat === 2 &&
                                UTGIFTER.map((u, i) => <Kort key={u} x={540 + i * 300} tekst={u} i={i} kryss />)}
                            {beat === 2 && (
                                <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.2 }}>
                                    <rect x={1440 - 140} y={580} width={280} height={70} rx={35} fill={KONGE} />
                                    <text x={1440} y={627} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff">
                                        Ibsen merket det
                                    </text>
                                </motion.g>
                            )}
                        </motion.g>
                    )}
                    {beat >= 3 && (
                        <motion.g key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <text x={950} y={170} textAnchor="middle" fontSize={50} fontWeight={900} fill={BLEKK}>
                                Men han veltet ikke systemet
                            </text>
                            <rect x={560} y={260} width={780} height={330} rx={30} fill="#fff" stroke={EMBETSMANN} strokeWidth={8} />
                            <text x={950} y={330} textAnchor="middle" fontSize={46} fontWeight={900} fill={EMBETSMANN}>
                                Regjeringen
                            </text>
                            {Array.from({ length: 5 }, (_, i) => (
                                <g key={i} transform={`translate(${750 + i * 100} 570) scale(0.55)`}>
                                    <Figur type={i % 2 ? 'amtmann' : 'prest'} />
                                </g>
                            ))}
                            <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }} style={{ transformOrigin: '950px 700px' }}>
                                <rect x={600} y={650} width={700} height={100} rx={50} fill={BONDE} />
                                <text x={950} y={714} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                                    fikk ofte det den ba om
                                </text>
                            </motion.g>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
