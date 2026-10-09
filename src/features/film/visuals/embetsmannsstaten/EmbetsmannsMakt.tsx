import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, EMBETSMANN, KONGE, PAPIR } from './farger';
import { Figur } from './figurer';

/**
 * Slik delte Grunnloven makta: Stortinget på den ene siden (lovene og pengene),
 * kongen på den andre. Kongen valgte regjeringen, og han valgte embetsmenn.
 */

function Pil({ x1, y1, x2, y2, farge, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; farge: string; delay?: number }) {
    const vinkel = Math.atan2(y2 - y1, x2 - x1);
    const a = 22;
    const p1 = `${x2 - a * Math.cos(vinkel - 0.45)},${y2 - a * Math.sin(vinkel - 0.45)}`;
    const p2 = `${x2 - a * Math.cos(vinkel + 0.45)},${y2 - a * Math.sin(vinkel + 0.45)}`;
    return (
        <g>
            <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay, duration: 0.7 }}
            />
            <motion.polygon
                points={`${x2},${y2} ${p1} ${p2}`}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.6 }}
            />
        </g>
    );
}

function Salikon({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {[0, 1, 2].map((r) =>
                Array.from({ length: 7 + r * 2 }, (_, i) => {
                    const v = Math.PI + (Math.PI * (i + 0.5)) / (7 + r * 2);
                    const rad = 70 + r * 42;
                    return (
                        <circle
                            key={`${r}-${i}`}
                            cx={Math.cos(v) * rad}
                            cy={Math.sin(v) * rad}
                            r={14}
                            fill={(i + r) % 3 === 0 ? EMBETSMANN : BONDE}
                        />
                    );
                })
            )}
        </g>
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -80 40 L -80 -30 L -40 5 L 0 -55 L 40 5 L 80 -30 L 80 40 Z" fill={KONGE} />
            <rect x={-86} y={38} width={172} height={24} rx={8} fill="#a16207" />
            <circle cy={-60} r={10} fill="#fde68a" />
        </g>
    );
}

function Merke({ x, y, tekst, farge, delay }: { x: number; y: number; tekst: string; farge: string; delay: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 160, damping: 18 }}>
            <rect x={x - 130} y={y - 45} width={260} height={90} rx={45} fill={farge} />
            <text x={x} y={y + 14} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

export function EmbetsmannsMakt({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-amber-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Grunnloven øverst i midten */}
                <g>
                    <rect x={620} y={40} width={360} height={120} rx={14} fill={PAPIR} stroke="#d6cfbd" strokeWidth={4} />
                    <text x={800} y={98} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK}>
                        Grunnloven
                    </text>
                    <text x={800} y={140} textAnchor="middle" fontSize={30} fontWeight={700} fill="#64748b">
                        1814
                    </text>
                    <line x1={620} y1={100} x2={420} y2={240} stroke="#cbd5e1" strokeWidth={6} />
                    <line x1={980} y1={100} x2={1180} y2={240} stroke="#cbd5e1" strokeWidth={6} />
                </g>

                {/* Stortinget */}
                <motion.g animate={{ opacity: beat === 2 ? 0.45 : 1 }}>
                    <rect x={120} y={240} width={600} height={330} rx={30} fill="#fff" stroke={beat === 1 ? BONDE : '#e2e8f0'} strokeWidth={beat === 1 ? 8 : 4} />
                    <Salikon x={420} y={480} />
                    <text x={420} y={540} textAnchor="middle" fontSize={50} fontWeight={900} fill={BLEKK}>
                        Stortinget
                    </text>
                </motion.g>

                {/* Kongen */}
                <motion.g animate={{ opacity: beat === 1 ? 0.45 : 1 }}>
                    <rect x={880} y={240} width={600} height={330} rx={30} fill="#fff" stroke={beat >= 2 ? KONGE : '#e2e8f0'} strokeWidth={beat >= 2 ? 8 : 4} />
                    <Krone x={1180} y={380} />
                    <text x={1180} y={530} textAnchor="middle" fontSize={50} fontWeight={900} fill={BLEKK}>
                        Kongen
                    </text>
                </motion.g>

                <AnimatePresence>
                    {beat >= 1 && (
                        <motion.g key="lover" initial={{ opacity: 0 }} animate={{ opacity: beat === 1 ? 1 : 0.55 }}>
                            <Pil x1={330} y1={575} x2={270} y2={645} farge={BONDE} />
                            <Pil x1={510} y1={575} x2={570} y2={645} farge={BONDE} delay={0.3} />
                            <Merke x={250} y={700} tekst="Lovene" farge={BONDE} delay={0.6} />
                            <Merke x={590} y={700} tekst="Pengene" farge={BONDE} delay={0.9} />
                        </motion.g>
                    )}
                    {beat >= 2 && (
                        <motion.g key="regjering" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Pil x1={1180} y1={575} x2={1180} y2={640} farge={KONGE} />
                            <motion.rect
                                x={860}
                                y={650}
                                width={640}
                                height={230}
                                rx={26}
                                fill="#fff"
                                stroke={EMBETSMANN}
                                strokeWidth={6}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            />
                            <motion.text
                                x={1180}
                                y={712}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill={EMBETSMANN}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                Regjeringen
                            </motion.text>
                            {beat === 2 && (
                                <motion.text
                                    x={1180}
                                    y={790}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={700}
                                    fill="#475569"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    styrer landet fra dag til dag
                                </motion.text>
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>
                {beat >= 3 && (
                    <>
                        {Array.from({ length: 7 }, (_, i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.15 }}
                            >
                                <g transform={`translate(${940 + i * 80} 865) scale(0.42)`}>
                                    <Figur type={i % 3 === 0 ? 'prest' : i % 3 === 1 ? 'amtmann' : 'offiser'} />
                                </g>
                            </motion.g>
                        ))}
                        <motion.g initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>
                            <rect x={120} y={790} width={600} height={80} rx={40} fill={EMBETSMANN} />
                            <text x={420} y={843} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                Bare embetsmenn, til 1884
                            </text>
                        </motion.g>
                    </>
                )}
            </svg>
        </div>
    );
}
