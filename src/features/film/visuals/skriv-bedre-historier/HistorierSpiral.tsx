import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Følelsen som vokser: en kurve fra uro til panikk, ett steg per setning i eksempelet.
 * Beat 0 viser det vi ikke vil ha, et brått hopp «ut av det blå».
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const VENSTRE = 230;
const BUNN = 760;
const TOPP = 150;
const HOYRE = 1500;

const PUNKTER = [
    { x: 300, y: 720, tekst: '', fraBeat: 1 },
    { x: 470, y: 640, tekst: 'Klump i magen', fraBeat: 1, farge: '#eab308' },
    { x: 700, y: 560, tekst: 'Var han sint?', fraBeat: 1, farge: '#f59e0b' },
    { x: 960, y: 420, tekst: 'Tyngre luft', fraBeat: 2, farge: '#f97316' },
    { x: 1200, y: 290, tekst: 'Veggene presser', fraBeat: 3, farge: '#ef4444' },
    { x: 1400, y: 190, tekst: 'Må ut!', fraBeat: 3, farge: '#b91c1c' },
];

function linje(a: { x: number; y: number }, b: { x: number; y: number }) {
    const mx = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

export function HistorierSpiral({ beat }: VisualProps) {
    const hopp = beat === 0 ? 1 : 0.18;
    return (
        <div className="absolute inset-0" style={{ background: '#1e1b2e' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <linearGradient id="historier-varme" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#fde68a" stopOpacity={0.05} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.28} />
                    </linearGradient>
                </defs>
                <text
                    x={800}
                    y={82}
                    textAnchor="middle"
                    fontSize={52}
                    fontWeight={900}
                    fill="#ffffff"
                    style={FONT}
                >
                    {beat === 0 ? 'Ikke slik ...' : 'Bygg følelsen steg for steg'}
                </text>
                {/* Bakgrunnen blir varmere oppover */}
                <rect
                    x={VENSTRE}
                    y={TOPP}
                    width={HOYRE - VENSTRE}
                    height={BUNN - TOPP}
                    fill="url(#historier-varme)"
                    rx={12}
                />
                <line
                    x1={VENSTRE}
                    y1={BUNN}
                    x2={HOYRE}
                    y2={BUNN}
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
                <line
                    x1={VENSTRE}
                    y1={BUNN}
                    x2={VENSTRE}
                    y2={TOPP}
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
                <text
                    x={VENSTRE - 24}
                    y={BUNN - 10}
                    textAnchor="end"
                    fontSize={beat >= 4 ? 44 : 36}
                    fontWeight={900}
                    fill="#fde68a"
                    style={FONT}
                >
                    uro
                </text>
                <text
                    x={VENSTRE - 24}
                    y={TOPP + 30}
                    textAnchor="end"
                    fontSize={beat >= 4 ? 44 : 36}
                    fontWeight={900}
                    fill="#f87171"
                    style={FONT}
                >
                    panikk
                </text>
                <text
                    x={(VENSTRE + HOYRE) / 2}
                    y={BUNN + 60}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#cbd5e1"
                    style={FONT}
                >
                    setning for setning →
                </text>

                {/* Det brå hoppet ut av det blå */}
                <motion.g
                    initial={false}
                    animate={{ opacity: hopp }}
                    transition={{ duration: 0.8 }}
                >
                    <path
                        d={`M 300 720 L 760 720 L 780 190 L 1400 190`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={8}
                        strokeDasharray="22 16"
                    />
                    {beat === 0 && (
                        <g>
                            <rect x={830} y={430} width={420} height={80} rx={14} fill="#334155" />
                            <text
                                x={1040}
                                y={485}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#ffffff"
                                style={FONT}
                            >
                                Ut av det blå
                            </text>
                            <g stroke="#ef4444" strokeWidth={16} strokeLinecap="round">
                                <line x1={720} y1={400} x2={840} y2={520} />
                                <line x1={840} y1={400} x2={720} y2={520} />
                            </g>
                        </g>
                    )}
                </motion.g>

                {/* Spiralen oppover */}
                {PUNKTER.slice(1).map((p, i) => {
                    const fra = PUNKTER[i];
                    if (beat < p.fraBeat) return null;
                    return (
                        <motion.path
                            key={`l${i}`}
                            d={linje(fra, p)}
                            fill="none"
                            stroke={p.farge}
                            strokeWidth={beat >= 4 ? 16 : 12}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.9, delay: i === 1 || i === 4 ? 1.2 : 0.2 }}
                        />
                    );
                })}
                {PUNKTER.slice(1).map((p, i) => {
                    if (beat < p.fraBeat) return null;
                    const sen = i === 1 || i === 4;
                    const ny = beat === p.fraBeat;
                    return (
                        <motion.g
                            key={`p${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: sen ? 1.9 : 0.9 }}
                        >
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={ny ? 22 : 16}
                                fill={p.farge}
                                stroke="#ffffff"
                                strokeWidth={5}
                            />
                            <rect
                                x={p.x - 150}
                                y={p.y - 92}
                                width={300}
                                height={58}
                                rx={12}
                                fill={ny ? '#ffffff' : '#334155'}
                            />
                            <text
                                x={p.x}
                                y={p.y - 51}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill={ny ? '#0f172a' : '#e2e8f0'}
                                style={FONT}
                            >
                                {p.tekst}
                            </text>
                        </motion.g>
                    );
                })}
                {beat >= 4 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <rect x={980} y={600} width={460} height={84} rx={16} fill="#fcd34d" />
                        <text
                            x={1210}
                            y={657}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={900}
                            fill="#1e293b"
                            style={FONT}
                        >
                            Fra uro til panikk
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
