import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Det levende landskapet i samisk tradisjon: fjell, stein, kilde og sjø med egen kraft,
 * verdener under vår, og reinen som kommer ned langs solstrålene fra Beaivi.
 */

const B = 1600;
const H = 900;
const SOL = { x: 300, y: 150 };
const BAKKE = 600;

function Rein({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={0} cy={0} rx={46} ry={22} fill="#78350f" />
            <rect x={-36} y={10} width={9} height={40} fill="#78350f" />
            <rect x={-18} y={10} width={9} height={40} fill="#78350f" />
            <rect x={14} y={10} width={9} height={40} fill="#78350f" />
            <rect x={30} y={10} width={9} height={40} fill="#78350f" />
            <path d="M 38 -8 L 62 -30 L 74 -22 L 52 2 Z" fill="#78350f" />
            <path
                d="M 64 -28 L 56 -62 M 60 -46 L 44 -56 M 68 -30 L 84 -60 M 76 -44 L 92 -48"
                stroke="#57290a"
                strokeWidth={5}
                strokeLinecap="round"
            />
        </g>
    );
}

const KRAFT = [
    { x: 1080, y: 330, navn: 'fjell' },
    { x: 720, y: 560, navn: 'stein' },
    { x: 1380, y: 575, navn: 'kilde' },
    { x: 860, y: 640, navn: 'sjø' },
];

export function SkapelseSolstraler({ beat, playing }: VisualProps) {
    const sterkSol = beat >= 3;
    const tekst = [
        'Samisk religion',
        'Naturen lever',
        'Flere verdener ved siden av vår',
        'Beaivi, solguden',
        'Laget og gitt til oss, eller levende?',
    ][Math.min(beat, 4)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #bae6fd, #ffedd5)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Solstrålene */}
                {[-0.15, 0.1, 0.35, 0.6, 0.85, 1.1].map((a, i) => (
                    <motion.line
                        key={i}
                        x1={SOL.x}
                        y1={SOL.y}
                        x2={SOL.x + Math.cos(a) * 1500}
                        y2={SOL.y + Math.sin(a) * 1500}
                        stroke="#fbbf24"
                        strokeWidth={sterkSol ? 34 : 14}
                        initial={false}
                        animate={{ opacity: sterkSol ? 0.45 : 0.18 }}
                    />
                ))}
                <motion.circle
                    cx={SOL.x}
                    cy={SOL.y}
                    fill="#f59e0b"
                    initial={false}
                    animate={{ r: sterkSol ? 95 : 70 }}
                />
                {/* Fjellene */}
                <path
                    d="M 700 600 L 1080 230 L 1300 450 L 1420 340 L 1600 520 L 1600 600 Z"
                    fill="#475569"
                />
                <path
                    d="M 1080 230 L 1000 310 L 1050 300 L 1080 330 L 1120 290 L 1150 300 Z"
                    fill="#f8fafc"
                />
                <path d="M 0 600 L 0 470 L 240 360 L 520 600 Z" fill="#64748b" />
                {/* Bakken, eller snittet ned i verdenene under */}
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#4d7c0f" />
                <ellipse cx={860} cy={650} rx={170} ry={36} fill="#38bdf8" />
                <ellipse cx={720} cy={575} rx={56} ry={34} fill="#78716c" />
                <circle cx={1380} cy={590} r={22} fill="#7dd3fc" />
                <AnimatePresence>
                    {beat === 2 && (
                        <motion.g
                            key="under"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <rect x={0} y={BAKKE + 20} width={B} height={130} fill="#1e3a5f" />
                            <rect
                                x={0}
                                y={BAKKE + 150}
                                width={B}
                                height={H - BAKKE - 150}
                                fill="#172033"
                            />
                            <text
                                x={800}
                                y={BAKKE + 100}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={800}
                                fill="#e0e7ff"
                            >
                                de dødes rike
                            </text>
                            <text
                                x={800}
                                y={BAKKE + 230}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={800}
                                fill="#c7d2fe"
                            >
                                underverdenen
                            </text>
                            <text
                                x={1150}
                                y={BAKKE - 20}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                vår verden
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
                {/* Åndelig kraft i naturen */}
                {beat === 1 &&
                    KRAFT.map((k, i) => (
                        <g key={k.navn}>
                            <motion.circle
                                cx={k.x}
                                cy={k.y}
                                fill="none"
                                stroke="#fde047"
                                strokeWidth={8}
                                initial={{ r: 20, opacity: 0.9 }}
                                animate={
                                    playing
                                        ? { r: [20, 90], opacity: [0.9, 0] }
                                        : { r: 50, opacity: 0.6 }
                                }
                                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
                            />
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.3 }}
                            >
                                <rect
                                    x={k.x - 70}
                                    y={k.y - 100}
                                    width={140}
                                    height={50}
                                    rx={14}
                                    fill="white"
                                />
                                <text
                                    x={k.x}
                                    y={k.y - 64}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#7c2d12"
                                >
                                    {k.navn}
                                </text>
                            </motion.g>
                        </g>
                    ))}
                {/* Reinen kommer ned langs en solstråle */}
                {beat >= 3 && (
                    <motion.g
                        initial={{ x: 340, y: 230, opacity: 0 }}
                        animate={{ x: 495, y: 535, opacity: 1 }}
                        transition={{ duration: playing ? 4 : 0.01, ease: 'easeOut' }}
                    >
                        <Rein x={0} y={0} s={1.3} />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <text
                        x={SOL.x}
                        y={SOL.y + 160}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#b45309"
                    >
                        Beaivi
                    </text>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
