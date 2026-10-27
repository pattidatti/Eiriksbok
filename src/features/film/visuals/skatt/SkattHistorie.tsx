import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skatt i Norge gjennom tidene: leidang på 1100-tallet, fast skatt på 1270-tallet, skatt på
 * inntekt og formue i 1892, progressiv fra 1895 og momsen i 1970. En tidslinje som fylles ut.
 */

const PUNKTER = [
    { x: 180, aar: '1100-tallet', tekst: ['Leidang:', 'den eldste skatten'], fraBeat: 0, farge: '#78350f', over: false },
    { x: 540, aar: '1270-tallet', tekst: ['Magnus Lagabøte:', 'fast skatt'], fraBeat: 1, farge: '#92400e', over: false },
    { x: 1000, aar: '1892', tekst: ['Staten innfører skatt', 'på inntekt og formue'], fraBeat: 2, farge: '#0d9488', over: true },
    { x: 1180, aar: '1895', tekst: ['Inntektsskatten', 'blir progressiv'], fraBeat: 2, farge: '#2563eb', over: false },
    { x: 1420, aar: '1970', tekst: ['Momsen kommer'], fraBeat: 3, farge: '#ca8a04', over: true },
];

const Y = 470;

function Skip({ x }: { x: number }) {
    // Et lite vikingskip: leidangen var plikt til å stille skip og menn.
    return (
        <g transform={`translate(${x} ${Y - 120})`}>
            <path d="M -70 0 Q 0 40 70 0 L 60 -6 Q 0 26 -60 -6 Z" fill="#78350f" />
            <line x1={0} y1={-6} x2={0} y2={-70} stroke="#57534e" strokeWidth={5} />
            <rect x={-28} y={-66} width={56} height={44} fill="#fca5a5" stroke="#b91c1c" strokeWidth={3} />
        </g>
    );
}

export function SkattHistorie({ beat }: VisualProps) {
    const fremme = Math.max(...PUNKTER.filter((p) => beat >= p.fraBeat).map((p) => p.x));
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-amber-50">
            <text x={800} y={92} textAnchor="middle" fontSize={56} fontWeight={800} fill="#0f172a">
                Skatt i Norge gjennom tidene
            </text>
            <line x1={120} x2={1500} y1={Y} y2={Y} stroke="#d6d3d1" strokeWidth={10} strokeLinecap="round" />
            <motion.line
                x1={120}
                y1={Y}
                y2={Y}
                initial={{ x2: 120 }}
                animate={{ x2: fremme }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                stroke="#0f172a"
                strokeWidth={10}
                strokeLinecap="round"
            />
            {/* Lang pause mellom middelalderen og 1800-tallet */}
            <text x={740} y={Y + 12} textAnchor="middle" fontSize={40} fontWeight={800} fill="#a8a29e">
                · · ·
            </text>
            {PUNKTER.map((p) => {
                const vis = beat >= p.fraBeat;
                const ny = beat === p.fraBeat;
                const tekstY = p.over ? Y - 190 : Y + 110;
                return (
                    <motion.g
                        key={p.aar}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? 1 : 0 }}
                        transition={{ duration: 0.6, delay: vis && ny ? 0.6 : 0 }}
                    >
                        <circle cx={p.x} cy={Y} r={ny ? 26 : 20} fill={p.farge} stroke="#fff" strokeWidth={6} />
                        <text
                            x={p.x}
                            y={p.over ? Y - 50 : Y + 68}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={p.farge}
                        >
                            {p.aar}
                        </text>
                        {p.x === 180 && <Skip x={p.x} />}
                        {p.tekst.map((t, j) => (
                            <text
                                key={t}
                                x={p.x}
                                y={tekstY + j * 40 + (p.over ? 40 : 30)}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={700}
                                fill="#1e293b"
                            >
                                {t}
                            </text>
                        ))}
                    </motion.g>
                );
            })}
        </svg>
    );
}
