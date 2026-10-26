import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Gammelt mot nytt. Til venstre offiseren til hest med sverd (1914), til høyre de nye
 * våpnene som kommer til, to og tre om gangen. Til slutt møtes de to sidene.
 */

const B = 1600;
const H = 900;

function Rytter() {
    return (
        <g>
            {/* Hesten */}
            <ellipse cx={0} cy={40} rx={120} ry={52} fill="#7c2d12" />
            <path d="M 90 20 L 150 -60 L 185 -50 L 190 -30 L 150 -20 L 120 40 Z" fill="#7c2d12" />
            <path d="M 150 -62 L 160 -84 L 170 -60 Z" fill="#7c2d12" />
            <path d="M -118 20 Q -165 40 -150 110" fill="none" stroke="#451a03" strokeWidth={14} strokeLinecap="round" />
            {[-85, -55, 55, 85].map((x, i) => (
                <rect key={x} x={x - 9} y={70} width={18} height={95} rx={6} fill="#7c2d12" transform={`rotate(${i % 2 ? 8 : -8} ${x} 70)`} />
            ))}
            {/* Offiseren i fargesterk uniform */}
            <rect x={-30} y={-90} width={60} height={95} rx={14} fill="#1d4ed8" />
            <rect x={-30} y={-30} width={60} height={14} fill="#dc2626" />
            <circle cx={0} cy={-118} r={26} fill="#fcd9b6" />
            <rect x={-22} y={-160} width={44} height={28} rx={4} fill="#dc2626" />
            <path d="M -28 30 L -40 80" stroke="#dc2626" strokeWidth={16} strokeLinecap="round" />
            {/* Sverdet */}
            <path d="M 22 -70 L 70 -120" stroke="#475569" strokeWidth={12} strokeLinecap="round" />
            <path d="M 66 -116 L 150 -215" stroke="#e2e8f0" strokeWidth={9} strokeLinecap="round" />
            <path d="M 52 -122 L 82 -98" stroke="#ca8a04" strokeWidth={9} strokeLinecap="round" />
        </g>
    );
}

const VÅPEN: { navn: string; fra: number; figur: ReactNode }[] = [
    {
        navn: 'Stridsvogner',
        fra: 2,
        figur: (
            <g>
                <path d="M -95 30 L -70 -30 L 70 -30 L 95 30 L 70 50 L -70 50 Z" fill="#57534e" stroke="#1c1917" strokeWidth={4} />
                <rect x={-30} y={-52} width={60} height={24} rx={4} fill="#44403c" />
                <path d="M 30 -42 L 85 -48" stroke="#1c1917" strokeWidth={8} strokeLinecap="round" />
                {[-60, -30, 0, 30, 60].map((x) => (
                    <circle key={x} cx={x} cy={30} r={11} fill="#1c1917" />
                ))}
            </g>
        ),
    },
    {
        navn: 'Fly',
        fra: 2,
        figur: (
            <g>
                {/* Dobbeltdekker sett fra siden */}
                <path d="M -90 0 L 60 -8 L 80 0 L 60 10 L -90 6 Z" fill="#78350f" />
                <path d="M -90 2 L -110 -28 L -96 -28 L -78 0 Z" fill="#78350f" />
                <rect x={-40} y={-42} width={90} height={9} rx={4} fill="#a16207" />
                <rect x={-40} y={18} width={90} height={9} rx={4} fill="#a16207" />
                <path d="M -25 -34 L -25 18 M 35 -34 L 35 18" stroke="#451a03" strokeWidth={4} />
                <rect x={80} y={-26} width={6} height={52} rx={3} fill="#1c1917" />
                <circle cx={-20} cy={40} r={9} fill="#1c1917" />
                <circle cx={25} cy={40} r={9} fill="#1c1917" />
            </g>
        ),
    },
    {
        navn: 'Ubåter',
        fra: 3,
        figur: (
            <g>
                <rect x={-120} y={18} width={240} height={50} fill="#bfdbfe" opacity={0.6} />
                <ellipse cx={0} cy={20} rx={105} ry={22} fill="#334155" />
                <rect x={-18} y={-18} width={36} height={26} rx={4} fill="#334155" />
                <path d="M 0 -18 L 0 -40" stroke="#334155" strokeWidth={5} />
            </g>
        ),
    },
    {
        navn: 'Flammekastere',
        fra: 3,
        figur: (
            <g>
                <rect x={-90} y={-30} width={36} height={80} rx={14} fill="#57534e" />
                <path d="M -54 0 L 10 0" stroke="#1c1917" strokeWidth={10} strokeLinecap="round" />
                <path d="M 10 0 Q 50 -40 100 -10 Q 70 -5 110 10 Q 60 15 90 35 Q 40 30 10 0 Z" fill="#f97316" />
                <path d="M 18 0 Q 45 -20 75 -6 Q 55 2 75 18 Q 40 14 18 0 Z" fill="#fde047" />
            </g>
        ),
    },
    {
        navn: 'Giftgass',
        fra: 3,
        figur: (
            <g fill="#bef264" opacity={0.9}>
                <circle cx={-50} cy={10} r={40} />
                <circle cx={0} cy={-15} r={48} />
                <circle cx={50} cy={10} r={42} />
                <circle cx={10} cy={30} r={38} />
                <circle cx={-80} cy={35} r={26} />
                <circle cx={85} cy={38} r={24} />
            </g>
        ),
    },
];

/** Rutenett for de nye våpnene: to øverst, tre nederst. */
const PLASS: [number, number][] = [
    [1040, 350],
    [1300, 350],
    [910, 650],
    [1160, 650],
    [1410, 650],
];

export function OversiktVaapen({ beat }: VisualProps) {
    const motes = beat >= 4;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f5f0e6' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* To halvdeler */}
                <rect x={0} y={0} width={720} height={H} fill="#fef3c7" />
                <rect x={720} y={0} width={880} height={H} fill="#e2e8f0" />
                <text x={360} y={110} textAnchor="middle" fontSize={64} fontWeight={900} fill="#78350f">
                    GAMMELT
                </text>
                <text x={360} y={165} textAnchor="middle" fontSize={34} fontWeight={700} fill="#92400e">
                    krigens begynnelse
                </text>
                <text x={1160} y={110} textAnchor="middle" fontSize={64} fontWeight={900} fill="#1e293b">
                    NYTT
                </text>
                <text x={1160} y={165} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">
                    i stor skala ved slutten
                </text>

                {/* Rytteren */}
                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 1 ? 1 : 0.25, x: motes ? 70 : 0 }}
                    transition={{ duration: 1.2 }}
                >
                    <g transform="translate(330 520)">
                        <Rytter />
                    </g>
                </motion.g>
                {beat >= 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <text x={360} y={780} textAnchor="middle" fontSize={40} fontWeight={900} fill="#78350f">
                            Hest, fargesterk uniform, sverd
                        </text>
                    </motion.g>
                )}

                {/* De nye våpnene */}
                {VÅPEN.map((v, i) => {
                    const [x, y] = PLASS[i];
                    const synlig = beat >= v.fra;
                    return (
                        <motion.g
                            key={v.navn}
                            initial={false}
                            animate={{ opacity: synlig ? 1 : 0, scale: synlig ? 1 : 0.7 }}
                            transition={{ duration: 0.7, delay: synlig ? (i % 3) * 0.6 : 0 }}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                            <rect x={x - 118} y={y - 135} width={236} height={265} rx={24} fill="#ffffff" stroke="#94a3b8" strokeWidth={3} />
                            <g transform={`translate(${x} ${y - 20})`}>{v.figur}</g>
                            <text x={x} y={y + 100} textAnchor="middle" fontSize={28} fontWeight={900} fill="#0f172a">
                                {v.navn}
                            </text>
                        </motion.g>
                    );
                })}
                {beat === 0 && (
                    <motion.text
                        x={1160}
                        y={480}
                        textAnchor="middle"
                        fontSize={150}
                        fontWeight={900}
                        fill="#94a3b8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        ?
                    </motion.text>
                )}

                {/* Møtet */}
                {motes && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}>
                        <rect x={580} y={195} width={280} height={100} rx={22} fill="#dc2626" />
                        <text x={720} y={265} textAnchor="middle" fontSize={52} fontWeight={900} fill="#ffffff">
                            Dødelig
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
