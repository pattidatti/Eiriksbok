import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * 1. verdenskrig som to lag. Beat 0: 1914, krigen bryter ut. Beat 1: osmanerne går over til
 * Tysklands side. Beat 2: Storbritannia og Frankrike på den andre siden. Beat 3: britene ser
 * araberne inne i Det osmanske riket, og en pil spør om de kan gjøre opprør.
 */

const B = 1600;
const H = 900;

const OVERSKRIFT = [
    '1914: 1. verdenskrig',
    'Osmanerne velger side',
    'Mot Storbritannia og Frankrike',
    'Britene ser en sjanse',
];

const VENSTRE = 400;
const HOYRE = 1200;
const KORT_B = 540;

function Kort({
    x,
    y,
    hoyde = 110,
    tekst,
    farge,
    lys,
    forsinkelse = 0,
    fraX = 0,
}: {
    x: number;
    y: number;
    hoyde?: number;
    tekst: string;
    farge: string;
    lys: string;
    forsinkelse?: number;
    fraX?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, x: fraX, y: fraX ? 0 : 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 120, damping: 18 }}
        >
            <rect
                x={x - KORT_B / 2 + 6}
                y={y + 8}
                width={KORT_B}
                height={hoyde}
                rx={20}
                fill="#00000033"
            />
            <rect
                x={x - KORT_B / 2}
                y={y}
                width={KORT_B}
                height={hoyde}
                rx={20}
                fill={lys}
                stroke={farge}
                strokeWidth={6}
            />
            <text x={x} y={y + 72} textAnchor="middle" fontSize={50} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

export function SykesPicotLag({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#1e293b' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Krigsåret, stort i bakgrunnen */}
                <motion.text
                    x={B / 2}
                    y={beat === 0 ? 600 : 860}
                    textAnchor="middle"
                    fontWeight={900}
                    fill="#ffffff"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: beat === 0 ? 0.95 : 0.08,
                        fontSize: beat === 0 ? 300 : 160,
                    }}
                    transition={{ duration: 0.9 }}
                >
                    1914
                </motion.text>

                {/* Fronten midt i bildet */}
                <motion.line
                    x1={B / 2}
                    x2={B / 2}
                    y1={170}
                    y2={760}
                    stroke="#f8fafc"
                    strokeWidth={6}
                    strokeDasharray="22 16"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0, opacity: beat >= 1 ? 0.6 : 0 }}
                    transition={{ duration: 1 }}
                />

                {beat >= 1 && (
                    <>
                        <Kort x={VENSTRE} y={190} tekst="Tyskland" farge="#44403c" lys="#e7e5e4" />
                        <Kort
                            x={VENSTRE}
                            y={330}
                            tekst="Østerrike-Ungarn"
                            farge="#44403c"
                            lys="#e7e5e4"
                            forsinkelse={0.3}
                        />
                        <Kort
                            x={VENSTRE}
                            y={470}
                            hoyde={beat >= 3 ? 250 : 110}
                            tekst="Osmanerne"
                            farge="#9a3412"
                            lys="#ffedd5"
                            forsinkelse={0.9}
                            fraX={500}
                        />
                    </>
                )}

                {beat >= 2 && (
                    <>
                        <Kort
                            x={HOYRE}
                            y={260}
                            tekst="Storbritannia"
                            farge="#b91c1c"
                            lys="#fee2e2"
                        />
                        <Kort
                            x={HOYRE}
                            y={400}
                            tekst="Frankrike"
                            farge="#1d4ed8"
                            lys="#dbeafe"
                            forsinkelse={0.4}
                        />
                    </>
                )}

                {beat >= 3 && (
                    <>
                        <motion.g
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 16 }}
                            style={{ transformOrigin: `${VENSTRE}px 640px` }}
                        >
                            <rect
                                x={VENSTRE - 170}
                                y={590}
                                width={340}
                                height={100}
                                rx={50}
                                fill="#15803d"
                            />
                            <text
                                x={VENSTRE}
                                y={656}
                                textAnchor="middle"
                                fontSize={46}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                Araberne
                            </text>
                        </motion.g>
                        <motion.path
                            d={`M ${HOYRE - 120} 375 Q ${B / 2 + 40} 700 ${VENSTRE + 185} 640`}
                            fill="none"
                            stroke="#fca5a5"
                            strokeWidth={10}
                            strokeLinecap="round"
                            strokeDasharray="4 22"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.1, duration: 1.3 }}
                        />
                        <motion.text
                            x={1090}
                            y={680}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#fca5a5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.2 }}
                        >
                            Opprør?
                        </motion.text>
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        beat === 3 ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
