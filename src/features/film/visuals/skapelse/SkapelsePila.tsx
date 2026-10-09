import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Buddha og pila: et spørsmål som ikke hjelper, mot det som hjelper.
 * Først den tomme plassen der skapelsesfortellingen skulle stått, så lignelsen.
 */

const B = 1600;
const H = 900;

function Person({ x, farge, pil }: { x: number; farge: string; pil?: boolean }) {
    return (
        <g transform={`translate(${x} 560)`}>
            <circle cx={0} cy={-210} r={55} fill={farge} />
            <path d="M -70 -140 L 70 -140 L 55 80 L -55 80 Z" fill={farge} />
            <rect x={-50} y={80} width={40} height={130} rx={14} fill={farge} />
            <rect x={10} y={80} width={40} height={130} rx={14} fill={farge} />
            {pil && (
                <g transform="rotate(-25 50 -80)">
                    <line x1={50} y1={-80} x2={200} y2={-80} stroke="#78350f" strokeWidth={9} />
                    <path
                        d="M 186 -80 L 214 -104 M 186 -80 L 214 -56 M 170 -80 L 198 -104 M 170 -80 L 198 -56"
                        stroke="#a16207"
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                </g>
            )}
        </g>
    );
}

export function SkapelsePila({ beat }: VisualProps) {
    const tekst = [
        'Buddhismen: ingen skaper, ingen fortelling',
        '«Har verden vart evig?»',
        'Lignelsen om pila',
        'Mannen vil vite hvem som skjøt',
        'Det som hjelper: få ut pila',
    ][Math.min(beat, 4)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #fffbeb, #fef9c3)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {beat <= 1 && (
                    <g>
                        {/* Den tomme plassen */}
                        <motion.rect
                            x={550}
                            y={230}
                            width={500}
                            height={460}
                            rx={30}
                            fill="#ffffff"
                            stroke="#a16207"
                            strokeWidth={8}
                            strokeDasharray="22 14"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                        <text
                            x={800}
                            y={420}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#a16207"
                        >
                            Ingen skaper
                        </text>
                        <text
                            x={800}
                            y={490}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#a16207"
                        >
                            Ingen fortelling
                        </text>
                        {beat === 1 && (
                            <motion.g
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <circle cx={800} cy={610} r={50} fill="#eab308" />
                                <rect
                                    x={770}
                                    y={606}
                                    width={60}
                                    height={10}
                                    rx={5}
                                    fill="#ffffff"
                                />
                                <text
                                    x={1180}
                                    y={470}
                                    fontSize={140}
                                    fontWeight={900}
                                    fill="#cbd5e1"
                                >
                                    ?
                                </text>
                                <text
                                    x={360}
                                    y={470}
                                    fontSize={140}
                                    fontWeight={900}
                                    fill="#cbd5e1"
                                >
                                    ?
                                </text>
                            </motion.g>
                        )}
                    </g>
                )}
                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Person x={beat >= 4 ? 640 : 520} farge="#64748b" pil={beat < 4} />
                        <Person x={beat >= 4 ? 900 : 1100} farge="#0d9488" />
                        {beat >= 4 && (
                            <motion.g
                                initial={{ opacity: 0, x: -60 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <line
                                    x1={1000}
                                    y1={420}
                                    x2={1180}
                                    y2={360}
                                    stroke="#78350f"
                                    strokeWidth={9}
                                />
                                <text
                                    x={1100}
                                    y={330}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#0d9488"
                                >
                                    pila er ute
                                </text>
                            </motion.g>
                        )}
                        <text
                            x={1100}
                            y={870}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#0d9488"
                            opacity={beat >= 4 ? 0 : 1}
                        >
                            legen
                        </text>
                    </motion.g>
                )}
            </svg>
            <AnimatePresence>
                {beat === 3 && (
                    <motion.div
                        key="hvem"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[22%] top-[30%] px-6 py-4 rounded-3xl bg-white shadow-2xl font-display font-black text-3xl md:text-5xl text-slate-800"
                    >
                        Hvem skjøt?
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="vent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute right-[3%] top-[50%] px-5 py-3 rounded-2xl bg-teal-600 text-white font-bold text-2xl md:text-4xl shadow-xl"
                    >
                        venter ...
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="maal"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-1/2 bottom-[6%] -translate-x-1/2 px-6 py-3 rounded-2xl bg-teal-700 text-white font-display font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        Målet: slutt på lidelsen
                    </motion.div>
                )}
            </AnimatePresence>
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
