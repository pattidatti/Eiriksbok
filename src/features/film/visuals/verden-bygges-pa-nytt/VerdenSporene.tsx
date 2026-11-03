import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Granskerens tavle. Tre lapper med et spørsmål hver, festet med en nål. Én etter én får de
 * svaret sitt som en liten tegning (fem stoler, en dollar, en høy stolpe). Til slutt går en
 * rød tråd fra alle tre lappene til den samme lappen i midten: vinnerne.
 */

const LAPPER = [
    { x: 300, sporsmal: 'Hvem fikk vetorett?', svar: 'De fem som vant krigen', fraBeat: 1 },
    { x: 800, sporsmal: 'Hvilke penger?', svar: 'Dollaren', fraBeat: 2 },
    { x: 1300, sporsmal: 'Hvem styrer IMF?', svar: 'Den som betaler mest', fraBeat: 3 },
];
const LAPP_Y = 130;
const LAPP_B = 400;
const LAPP_H = 430;
const MIDT = { x: 800, y: 760 };

const FEM = ['#2563eb', '#dc2626', '#7c3aed', '#0891b2', '#ca8a04'];

function Tekst({
    x,
    y,
    children,
    size = 36,
    farge = '#1c1917',
    vekt = 900,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    size?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

function Tegning({ nr, x }: { nr: number; x: number }) {
    const y = LAPP_Y + 250;
    if (nr === 0)
        return (
            <g>
                {FEM.map((f, i) => (
                    <g key={f}>
                        <rect
                            x={x - 150 + i * 62}
                            y={y - 60}
                            width={42}
                            height={70}
                            rx={6}
                            fill={f}
                        />
                        <rect
                            x={x - 156 + i * 62}
                            y={y + 8}
                            width={54}
                            height={16}
                            rx={4}
                            fill="#1e293b"
                        />
                    </g>
                ))}
            </g>
        );
    if (nr === 1)
        return (
            <g>
                <circle cx={x} cy={y - 10} r={72} fill="#16a34a" stroke="#14532d" strokeWidth={6} />
                <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={92}
                    fontWeight={900}
                    fill="#fff"
                >
                    $
                </text>
            </g>
        );
    const hoyder = [130, 40, 60, 30, 50];
    return (
        <g>
            {hoyder.map((h, i) => (
                <motion.rect
                    key={i}
                    x={x - 140 + i * 58}
                    width={40}
                    rx={5}
                    fill={i === 0 ? '#2563eb' : '#94a3b8'}
                    initial={{ y: y + 40, height: 0 }}
                    animate={{ y: y + 40 - h, height: h }}
                    transition={{
                        delay: 0.3 + i * 0.1,
                        type: 'spring',
                        stiffness: 90,
                        damping: 16,
                    }}
                />
            ))}
            <line
                x1={x - 150}
                y1={y + 40}
                x2={x + 150}
                y2={y + 40}
                stroke="#334155"
                strokeWidth={4}
            />
            <Tekst x={x - 120} y={y - 100} size={28} farge="#1d4ed8">
                USA
            </Tekst>
        </g>
    );
}

export function VerdenSporene({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#a8865d' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Korktavla */}
                <rect
                    x={40}
                    y={40}
                    width={1520}
                    height={820}
                    rx={24}
                    fill="#c69c6d"
                    stroke="#7c5a35"
                    strokeWidth={14}
                />

                {/* Den røde tråden kommer først til slutt */}
                {beat >= 3 &&
                    LAPPER.map((l, i) => (
                        <motion.path
                            key={l.x}
                            d={`M ${l.x} ${LAPP_Y + 14} Q ${(l.x + MIDT.x) / 2} ${MIDT.y - 60} ${MIDT.x} ${MIDT.y - 50}`}
                            fill="none"
                            stroke="#b91c1c"
                            strokeWidth={6}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.2 + i * 0.3, duration: 1 }}
                        />
                    ))}

                {LAPPER.map((l, i) => {
                    const svart = beat >= l.fraBeat;
                    return (
                        <motion.g
                            key={l.x}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.3 }}
                        >
                            <rect
                                x={l.x - LAPP_B / 2}
                                y={LAPP_Y}
                                width={LAPP_B}
                                height={LAPP_H}
                                rx={8}
                                fill="#fefce8"
                                stroke={beat === l.fraBeat ? '#b91c1c' : '#d6d3d1'}
                                strokeWidth={beat === l.fraBeat ? 8 : 3}
                            />
                            <circle cx={l.x} cy={LAPP_Y + 14} r={14} fill="#b91c1c" />
                            <Tekst x={l.x} y={LAPP_Y + 80} size={36}>
                                {l.sporsmal}
                            </Tekst>
                            {!svart && (
                                <Tekst x={l.x} y={LAPP_Y + 290} size={150} farge="#d6d3d1">
                                    ?
                                </Tekst>
                            )}
                            {svart && (
                                <motion.g
                                    key="svar"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Tegning nr={i} x={l.x} />
                                    <Tekst x={l.x} y={LAPP_Y + 380} size={30} farge="#b91c1c">
                                        {l.svar}
                                    </Tekst>
                                </motion.g>
                            )}
                        </motion.g>
                    );
                })}

                {beat >= 3 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2, duration: 0.6 }}
                    >
                        <rect
                            x={MIDT.x - 260}
                            y={MIDT.y - 50}
                            width={520}
                            height={100}
                            rx={10}
                            fill="#fee2e2"
                            stroke="#b91c1c"
                            strokeWidth={6}
                        />
                        <circle cx={MIDT.x} cy={MIDT.y - 50} r={14} fill="#b91c1c" />
                        <Tekst x={MIDT.x} y={MIDT.y + 16} size={44} farge="#b91c1c">
                            Vinnerne av krigen
                        </Tekst>
                    </motion.g>
                )}
                {beat === 0 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Tekst x={800} y={MIDT.y + 10} size={52} farge="#1c1917">
                            La oss samle sporene
                        </Tekst>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
