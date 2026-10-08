import { motion } from 'framer-motion';
import type { VisualProps } from '../types';
import { TelleTall } from './shared';
import { formatTall } from './format';

interface Props {
    dybde: number;
    fjell?: { navn: string; hoyde: number; fraBeat: number };
    vrakFraBeat?: number;
}

const OVERFLATE = 120;
const BUNN = 860;

/** Havet i snitt, i riktig målestokk: hvor dypt vraket ligger, og et fjell til sammenligning. */
export function Dypet({ beat, props }: VisualProps<Props>) {
    const skala = (BUNN - OVERFLATE) / props.dybde;
    const y = (m: number) => OVERFLATE + m * skala;
    const fjell = props.fjell && beat >= props.fjell.fraBeat ? props.fjell : null;
    const topp = fjell ? BUNN - fjell.hoyde * skala : BUNN;
    const visVrak = beat >= (props.vrakFraBeat ?? 0);
    const skipLengde = 269 * skala;

    return (
        <div className="absolute inset-0 bg-sky-100">
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="dyp-hav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#3b82c4" />
                        <stop offset="0.35" stopColor="#1e4f86" />
                        <stop offset="1" stopColor="#0a1a33" />
                    </linearGradient>
                    <radialGradient id="dyp-lys">
                        <stop offset="0" stopColor="#fef3c7" stopOpacity="0.85" />
                        <stop offset="1" stopColor="#fef3c7" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect x={0} y={0} width={1600} height={OVERFLATE} fill="#dbeafe" />
                <rect
                    x={0}
                    y={OVERFLATE}
                    width={1600}
                    height={BUNN - OVERFLATE}
                    fill="url(#dyp-hav)"
                />
                <path
                    d={`M 0 ${BUNN} Q 400 ${BUNN - 12} 800 ${BUNN} T 1600 ${BUNN} L 1600 900 L 0 900 Z`}
                    fill="#3b3326"
                />

                {/* Dybdeskala */}
                {Array.from({ length: Math.floor(props.dybde / 500) + 1 }, (_, i) => i * 500).map(
                    (m) => (
                        <g key={m}>
                            <line
                                x1={150}
                                x2={175}
                                y1={y(m)}
                                y2={y(m)}
                                stroke="#e2e8f0"
                                strokeWidth={3}
                            />
                            <text
                                x={140}
                                y={y(m) + 8}
                                textAnchor="end"
                                fontSize={24}
                                fontWeight={700}
                                fill={m === 0 ? '#1e3a5f' : '#e2e8f0'}
                            >
                                {formatTall(m)} m
                            </text>
                        </g>
                    )
                )}
                <line x1={175} x2={175} y1={OVERFLATE} y2={BUNN} stroke="#e2e8f0" strokeWidth={3} />

                {/* Et skip på overflaten i samme målestokk */}
                <rect x={1150} y={OVERFLATE - 10} width={skipLengde} height={10} fill="#111827" />
                <text
                    x={1150 + skipLengde / 2}
                    y={OVERFLATE - 22}
                    textAnchor="middle"
                    fontSize={20}
                    fontWeight={700}
                    fill="#1e3a5f"
                >
                    Titanic, i samme målestokk
                </text>

                {/* Fjellet */}
                <motion.path
                    initial={false}
                    animate={{
                        d: `M 360 ${BUNN} L 560 ${topp + 40} L 610 ${topp} L 660 ${topp + 30} L 860 ${BUNN} Z`,
                        opacity: fjell ? 1 : 0,
                    }}
                    transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                    fill="#64748b"
                    stroke="#cbd5e1"
                    strokeWidth={3}
                />
                {fjell && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    >
                        <text
                            x={610}
                            y={topp + 70}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {fjell.navn}
                        </text>
                        <text
                            x={610}
                            y={topp + 104}
                            textAnchor="middle"
                            fontSize={24}
                            fontWeight={700}
                            fill="#e2e8f0"
                        >
                            {formatTall(fjell.hoyde)} m
                        </text>
                        <line
                            x1={700}
                            x2={700}
                            y1={OVERFLATE + 4}
                            y2={topp - 4}
                            stroke="#fde68a"
                            strokeWidth={4}
                            strokeDasharray="10 8"
                        />
                        <text
                            x={720}
                            y={(OVERFLATE + topp) / 2 + 10}
                            fontSize={32}
                            fontWeight={900}
                            fill="#fde68a"
                        >
                            {formatTall(props.dybde - fjell.hoyde)} m vann over toppen
                        </text>
                    </motion.g>
                )}

                {/* Vraket */}
                {visVrak && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1.5 }}
                    >
                        <motion.ellipse
                            cx={1210}
                            cy={BUNN - 30}
                            rx={240}
                            ry={130}
                            fill="url(#dyp-lys)"
                            animate={{ opacity: beat >= 2 ? 1 : 0.35 }}
                            transition={{ duration: 1.5 }}
                        />
                        <g transform={`translate(1100 ${BUNN - 34}) rotate(-4)`}>
                            <path d="M 0 30 L 150 24 L 170 0 L 10 6 Z" fill="#3f2a1e" />
                            <rect x={40} y={-14} width={16} height={20} fill="#5b3a26" />
                        </g>
                        <g transform={`translate(1290 ${BUNN - 26}) rotate(6)`}>
                            <path d="M 0 22 L 110 26 L 118 4 L 6 0 Z" fill="#3f2a1e" />
                        </g>
                    </motion.g>
                )}
            </svg>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-[6%] top-[38%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-5xl md:text-6xl font-black text-slate-900 tabular-nums">
                        <TelleTall verdi={props.dybde} varighet={3.5} /> m
                    </div>
                    <div className="text-lg md:text-xl font-semibold text-slate-500">
                        funnet i 1985
                    </div>
                </motion.div>
            )}
            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-[6%] top-[42%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl md:text-3xl font-black text-slate-900"
                >
                    Skipet som ikke kunne synke
                </motion.div>
            )}
        </div>
    );
}
