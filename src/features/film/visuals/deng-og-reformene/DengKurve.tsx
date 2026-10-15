import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Dengs vei til makta som en kurve: høyt oppe i 1966, kastet ut i 1967, tilbake i 1973,
 * ut igjen i 1976, tilbake i 1977 og helt på topp i desember 1978.
 * Hver beat tegner neste del av kurven.
 */

const B = 1600;
const H = 900;
const X0 = 180;
const X1 = 1460;
const ÅR0 = 1965;
const ÅR1 = 1979.5;
const TOPP = 210;
const BUNN = 720;

const x = (år: number) => X0 + ((år - ÅR0) / (ÅR1 - ÅR0)) * (X1 - X0);
/** 0 = ute av makta, 1 = Kinas mektigste. */
const y = (makt: number) => BUNN - makt * (BUNN - TOPP);

interface Punkt {
    år: number;
    makt: number;
    etikett: string;
    rod?: boolean;
    beat: number;
}

const PUNKTER: Punkt[] = [
    { år: 1966, makt: 0.78, etikett: '1966: en av de mektigste', beat: 0 },
    { år: 1967, makt: 0.04, etikett: '1967: mister alt', rod: true, beat: 1 },
    { år: 1973, makt: 0.62, etikett: '1973: tilbake', beat: 2 },
    { år: 1976, makt: 0.04, etikett: '1976: ute igjen', rod: true, beat: 2 },
    { år: 1977, makt: 0.66, etikett: '1977: tilbake igjen', beat: 3 },
    { år: 1978.9, makt: 1, etikett: 'Desember 1978: Kinas mektigste', beat: 4 },
];

const OVERSKRIFT = [
    'Kjempet sammen med Mao',
    'Kulturrevolusjonen: kastet ut',
    'Opp, og ned igjen',
    'Opp igjen',
    'Helt på topp',
];

export function DengKurve({ beat }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const synlige = PUNKTER.filter((p) => p.beat <= beat);
    const siste = synlige[synlige.length - 1];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-orange-100 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Aksene */}
                <line x1={X0} y1={BUNN} x2={X1} y2={BUNN} stroke="#78716c" strokeWidth={4} />
                <line x1={X0} y1={BUNN} x2={X0} y2={TOPP - 40} stroke="#78716c" strokeWidth={4} />
                <text
                    x={X0 - 24}
                    y={TOPP - 10}
                    textAnchor="end"
                    fontSize={34}
                    fontWeight={800}
                    fill="#57534e"
                >
                    Makt
                </text>
                <text
                    x={X0 - 24}
                    y={BUNN + 10}
                    textAnchor="end"
                    fontSize={28}
                    fontWeight={700}
                    fill="#a8a29e"
                >
                    ute
                </text>
                {/* Kulturrevolusjonen som et bånd i bakgrunnen */}
                <motion.rect
                    x={x(1966.3)}
                    y={TOPP - 40}
                    width={x(1976.8) - x(1966.3)}
                    height={BUNN - TOPP + 40}
                    fill="#dc2626"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 0.08 : 0 }}
                    transition={{ duration: 1 }}
                />
                <motion.text
                    x={(x(1966.3) + x(1976.8)) / 2}
                    y={BUNN + 110}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#b91c1c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 1 }}
                >
                    Kulturrevolusjonen 1966 til 1976
                </motion.text>
                {/* Kurven, del for del */}
                {PUNKTER.slice(1).map((p, i) => {
                    const a = PUNKTER[i];
                    const d = `M ${x(a.år)} ${y(a.makt)} L ${x(p.år)} ${y(p.makt)}`;
                    const vis = p.beat <= beat;
                    return (
                        <motion.path
                            key={p.år}
                            d={d}
                            fill="none"
                            stroke={p.makt < a.makt ? '#dc2626' : '#0f766e'}
                            strokeWidth={12}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: vis ? 1 : 0, opacity: vis ? 1 : 0 }}
                            transition={{
                                duration: 1.2,
                                // To deler i samme beat: den andre tegnes etter den første.
                                delay: vis && p.beat === PUNKTER[i].beat && i > 0 ? 1.6 : 0.3,
                                ease: 'easeInOut',
                            }}
                        />
                    );
                })}

                {PUNKTER.map((p, i) => {
                    const vis = p.beat <= beat;
                    const fokus = p === siste;
                    const forsinket = i > 0 && PUNKTER[i - 1].beat === p.beat;
                    const over = p.makt > 0.5;
                    return (
                        <motion.g
                            key={p.år}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vis ? (fokus || beat >= 4 ? 1 : 0.5) : 0 }}
                            transition={{ duration: 0.6, delay: vis ? (forsinket ? 2.8 : 1.4) : 0 }}
                        >
                            {i === PUNKTER.length - 1 ? (
                                <path
                                    transform={`translate(${x(p.år)} ${y(p.makt)}) scale(3.2)`}
                                    d="M0,-10 L2.9,-3.1 L9.5,-3.1 L4.2,1.2 L5.9,8.1 L0,4 L-5.9,8.1 L-4.2,1.2 L-9.5,-3.1 L-2.9,-3.1 Z"
                                    fill="#facc15"
                                    stroke="#b91c1c"
                                    strokeWidth={1.2}
                                />
                            ) : (
                                <circle
                                    cx={x(p.år)}
                                    cy={y(p.makt)}
                                    r={16}
                                    fill={p.rod ? '#dc2626' : '#0f766e'}
                                    stroke="#fff"
                                    strokeWidth={5}
                                />
                            )}
                            <text
                                x={x(p.år) + (i === PUNKTER.length - 1 ? -50 : i === 0 ? 30 : 0)}
                                y={y(p.makt) + (over ? -40 : 60)}
                                textAnchor={
                                    i === PUNKTER.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'
                                }
                                fontSize={fokus ? 38 : 30}
                                fontWeight={900}
                                fill={p.rod ? '#b91c1c' : '#0f172a'}
                                stroke="#fff7ed"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {p.etikett}
                            </text>
                        </motion.g>
                    );
                })}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
