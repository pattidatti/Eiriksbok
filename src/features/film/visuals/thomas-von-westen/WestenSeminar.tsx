import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Seminaret i Trondheim. Huset står i midten, og folk kommer til det beat for beat:
 * læreren Isaac Olsen med en bok som går fra dansk til samisk, Iver og Sivert fra
 * Finnmark, og så ni gutter til. Til slutt lyser huset: en egen skole før de fleste
 * andre i Norge.
 */

const GULL = '#b45309';
const BLA = '#1d4ed8';

function Person({ x, y, farge, skala = 1 }: { x: number; y: number; farge: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-62} r={22} fill="#f5d0a9" stroke="#57534e" strokeWidth={3} />
            <path d="M -34 0 Q -34 -38 0 -38 Q 34 -38 34 0 Z" fill={farge} />
        </g>
    );
}

/** Samisk kofte: blå med rød og gul kant. */
function Same({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-62} r={22} fill="#f5d0a9" stroke="#57534e" strokeWidth={3} />
            <path d="M -34 0 Q -34 -38 0 -38 Q 34 -38 34 0 Z" fill={BLA} />
            <rect x={-34} y={-8} width={68} height={8} fill="#dc2626" />
            <rect x={-34} y={-14} width={68} height={6} fill="#facc15" />
        </g>
    );
}

function Inn({ k, nar, fra = 0, children }: { k: string; nar: boolean; fra?: number; children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {nar && (
                <motion.g
                    key={k}
                    initial={{ opacity: 0, x: fra }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

const BAKKE = 780;

export function WestenSeminar({ beat }: VisualProps) {
    const lys = beat >= 4;
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-stone-100 overflow-hidden">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={800} y={90} textAnchor="middle" fontSize={50} fontWeight={900} fill="#1c1917">
                    Skole på samisk
                </text>
                <rect x={0} y={BAKKE} width={1600} height={120} fill="#d6d3d1" />

                {/* Seminaret */}
                <g>
                    <rect x={620} y={380} width={360} height={400} fill="#fde68a" stroke="#78350f" strokeWidth={5} />
                    <path d="M 590 384 L 800 250 L 1010 384 Z" fill="#9a3412" stroke="#78350f" strokeWidth={5} />
                    {[0, 1, 2].map((i) => (
                        <motion.rect
                            key={i}
                            x={655 + i * 110}
                            y={430}
                            width={70}
                            height={90}
                            stroke="#78350f"
                            strokeWidth={4}
                            animate={{ fill: lys ? '#fbbf24' : '#e0f2fe' }}
                            transition={{ duration: 0.8 }}
                        />
                    ))}
                    <rect x={760} y={640} width={80} height={140} fill="#78350f" />
                    <rect x={640} y={555} width={320} height={56} rx={8} fill="white" opacity={0.92} />
                    <text x={800} y={593} textAnchor="middle" fontSize={30} fontWeight={900} fill="#78350f">
                        Seminaret, 1717
                    </text>
                </g>
                <text x={800} y={850} textAnchor="middle" fontSize={30} fontWeight={800} fill="#44403c">
                    Trondheim
                </text>

                {/* Beat 0: for prester og lærere */}
                <Inn k="prester" nar={beat === 0} fra={-60}>
                    <Person x={430} y={BAKKE} farge="#1c1917" />
                    <Person x={1170} y={BAKKE} farge="#44403c" />
                    <text x={430} y={BAKKE - 110} textAnchor="middle" fontSize={30} fontWeight={800} fill="#292524">
                        Prester
                    </text>
                    <text x={1170} y={BAKKE - 110} textAnchor="middle" fontSize={30} fontWeight={800} fill="#292524">
                        Lærere
                    </text>
                </Inn>

                {/* Beat 1: Isaac Olsen og boka */}
                <Inn k="olsen" nar={beat >= 1} fra={-120}>
                    <Person x={430} y={BAKKE} farge="#3f6212" />
                    <text x={430} y={BAKKE - 110} textAnchor="middle" fontSize={30} fontWeight={800} fill="#292524">
                        Isaac Olsen
                    </text>
                </Inn>
                <Inn k="bok" nar={beat === 1} fra={0}>
                    <rect x={200} y={230} width={360} height={190} rx={10} fill="white" stroke="#78716c" strokeWidth={4} />
                    <line x1={380} y1={236} x2={380} y2={414} stroke="#78716c" strokeWidth={3} />
                    <text x={290} y={290} textAnchor="middle" fontSize={28} fontWeight={800} fill="#78716c">
                        Dansk
                    </text>
                    <motion.text
                        x={470}
                        y={290}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={900}
                        fill={BLA}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        Samisk
                    </motion.text>
                    {[0, 1, 2, 3].map((i) => (
                        <g key={i}>
                            <rect x={225} y={315 + i * 22} width={130} height={8} rx={4} fill="#d6d3d1" />
                            <motion.rect
                                x={405}
                                y={315 + i * 22}
                                height={8}
                                rx={4}
                                fill="#93c5fd"
                                initial={{ width: 0 }}
                                animate={{ width: 130 }}
                                transition={{ delay: 1.2 + i * 0.4, duration: 0.5 }}
                            />
                        </g>
                    ))}
                </Inn>

                {/* Beat 2: Iver og Sivert, 1716 */}
                <Inn k="unge" nar={beat >= 2} fra={200}>
                    <Same x={1110} y={BAKKE} />
                    <Same x={1250} y={BAKKE} />
                </Inn>
                <Inn k="unge-navn" nar={beat === 2 || beat === 4} fra={0}>
                    <text x={1110} y={BAKKE - 110} textAnchor="middle" fontSize={28} fontWeight={800} fill="#292524">
                        Iver, 17
                    </text>
                    <text x={1250} y={BAKKE - 150} textAnchor="middle" fontSize={28} fontWeight={800} fill="#292524">
                        Sivert, 23
                    </text>
                </Inn>
                <Inn k="unge-ar" nar={beat === 2} fra={0}>
                    <text x={1500} y={240} textAnchor="end" fontSize={34} fontWeight={900} fill={GULL}>
                        Fra Finnmark, 1716
                    </text>
                    <motion.path
                        d="M 1500 270 Q 1460 450 1340 560"
                        fill="none"
                        stroke={GULL}
                        strokeWidth={6}
                        strokeDasharray="14 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />
                </Inn>

                {/* Beat 3: lærere i Finnmark, og ni gutter til i 1719 */}
                <Inn k="nord" nar={beat === 3} fra={0}>
                    <text x={1010} y={BAKKE - 125} textAnchor="start" fontSize={28} fontWeight={900} fill="#292524">
                        Iver og Sivert: senere lærere i Finnmark
                    </text>
                </Inn>
                <Inn k="ni" nar={beat >= 3} fra={0}>
                    {Array.from({ length: 9 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.18 }}
                        >
                            <Same x={i < 5 ? 1120 + i * 90 : 1165 + (i - 5) * 90} y={i < 5 ? 400 : 520} skala={0.6} />
                        </motion.g>
                    ))}
                    <rect x={1040} y={150} width={480} height={72} rx={16} fill={BLA} />
                    <text x={1280} y={198} textAnchor="middle" fontSize={32} fontWeight={900} fill="white">
                        1719: ni gutter til
                    </text>
                </Inn>

                {/* Beat 4: før de fleste andre */}
                <Inn k="egen" nar={lys} fra={0}>
                    <rect x={120} y={150} width={560} height={110} rx={18} fill={GULL} />
                    <text x={400} y={198} textAnchor="middle" fontSize={34} fontWeight={900} fill="white">
                        Egen skole for samene
                    </text>
                    <text x={400} y={240} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fef3c7">
                        før vanlige folk ellers i Norge
                    </text>
                </Inn>
            </svg>
        </div>
    );
}
