import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Van Genneps tre trinn som tre rom på rad: slippe taket, midt imellom (liminalfasen) og
 * bli tatt imot. En figur går gjennom rommene, og til slutt snur de andre seg mot den.
 */

const B = 1600;
const H = 900;
const GULV = 700;

const ROM = [
    { x: 70, tittel: '1. Slipp taket', farge: '#2563eb', bak: '#dbeafe' },
    { x: 560, tittel: '2. Midt imellom', farge: '#64748b', bak: '#f1f5f9' },
    { x: 1050, tittel: '3. Tatt imot', farge: '#16a34a', bak: '#dcfce7' },
];
const BREDDE = 480;

function Figur({
    x,
    farge,
    opacity = 1,
    skala = 1,
}: {
    x: number;
    farge: string;
    opacity?: number;
    skala?: number;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ x, opacity }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
            <g transform={`translate(0 ${GULV}) scale(${skala})`}>
                <rect x={-30} y={-130} width={60} height={130} rx={26} fill={farge} />
                <circle cx={0} cy={-160} r={28} fill="#e0ac7a" />
            </g>
        </motion.g>
    );
}

export function OvergangsriterTerskel({ beat }: VisualProps) {
    // Hvor hovedpersonen står per beat.
    const px = [310, 470, 800, 1170, 1170][Math.min(beat, 4)];
    const grå = beat === 2;
    const farge = beat >= 3 ? '#16a34a' : grå ? '#94a3b8' : '#2563eb';
    const merke = beat === 0 ? 'barn' : beat === 1 ? null : beat === 2 ? '?' : 'voksen';
    const merkeFarge = beat <= 1 ? '#2563eb' : beat === 2 ? '#64748b' : '#16a34a';
    const mengde = [1300, 1380, 1460];

    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={800}
                    y={74}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Arnold van Gennep, rundt 1909: tre trinn
                </text>
                {ROM.map((r, i) => {
                    const aktiv =
                        (i === 0 && beat <= 1) || (i === 1 && beat === 2) || (i === 2 && beat >= 3);
                    const viktigst = i === 2 && beat === 4;
                    return (
                        <motion.g
                            key={r.tittel}
                            initial={false}
                            animate={{ opacity: aktiv || beat === 0 ? 1 : 0.45 }}
                            transition={{ duration: 0.6 }}
                        >
                            <rect
                                x={r.x}
                                y={170}
                                width={BREDDE}
                                height={GULV - 170 + 20}
                                rx={28}
                                fill={r.bak}
                                stroke={r.farge}
                                strokeWidth={viktigst ? 14 : 6}
                                strokeDasharray={i === 1 ? '22 14' : undefined}
                            />
                            <text
                                x={r.x + BREDDE / 2}
                                y={240}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={900}
                                fill={r.farge}
                            >
                                {r.tittel}
                            </text>
                            {i === 1 && beat === 2 && (
                                <motion.text
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    x={r.x + BREDDE / 2}
                                    y={300}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#475569"
                                >
                                    liminalfasen
                                </motion.text>
                            )}
                            {viktigst && (
                                <motion.text
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    x={r.x + BREDDE / 2}
                                    y={300}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={900}
                                    fill="#15803d"
                                >
                                    viktigst
                                </motion.text>
                            )}
                        </motion.g>
                    );
                })}
                {/* Dørene mellom rommene */}
                {[540, 1030].map((x) => (
                    <rect
                        key={x}
                        x={x}
                        y={GULV - 200}
                        width={40}
                        height={220}
                        rx={8}
                        fill="#a8a29e"
                    />
                ))}
                <rect x={40} y={GULV + 20} width={1520} height={14} rx={7} fill="#cbd5e1" />

                {/* De andre, som tar imot */}
                {mengde.map((x) => (
                    <Figur key={x} x={x} farge="#475569" skala={0.85} />
                ))}
                {beat === 4 && (
                    <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect
                            x={1075}
                            y={330}
                            width={430}
                            height={110}
                            rx={26}
                            fill="white"
                            stroke="#16a34a"
                            strokeWidth={5}
                        />
                        <path d="M 1360 440 L 1380 480 L 1400 440 Z" fill="#16a34a" />
                        <text
                            x={1290}
                            y={378}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={900}
                            fill="#15803d"
                        >
                            Nå er du en av oss.
                        </text>
                        <text
                            x={1290}
                            y={420}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={900}
                            fill="#15803d"
                        >
                            Vi venter noe nytt av deg.
                        </text>
                    </motion.g>
                )}

                {/* Hovedpersonen */}
                <Figur x={px} farge={farge} opacity={grå ? 0.6 : 1} />
                <motion.g
                    initial={false}
                    animate={{ x: px }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                >
                    <AnimatePresence mode="wait">
                        {merke && (
                            <motion.g
                                key={merke}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 60, rotate: 20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <rect
                                    x={-80}
                                    y={GULV - 270}
                                    width={160}
                                    height={58}
                                    rx={16}
                                    fill={merkeFarge}
                                />
                                <text
                                    x={0}
                                    y={GULV - 229}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="white"
                                >
                                    {merke}
                                </text>
                            </motion.g>
                        )}
                    </AnimatePresence>
                </motion.g>
            </svg>
        </div>
    );
}
