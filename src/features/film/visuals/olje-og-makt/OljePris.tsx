import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Oljeprisen under krisen. Beat 0-2: prisen vist som stabler med oljefat (1, så 2, så 4).
 * Beat 3: kurven over råoljeprisen 1960-2000 fra artikkelen, regnet i 2020-dollar.
 */

const B = 1600;
const H = 900;

/** Fra artikkelens LineChart («Råoljeprisen 1960-2000», 2020-dollar). */
const KURVE: [number, number][] = [
    [1960, 12],
    [1965, 12],
    [1970, 13],
    [1973, 16],
    [1974, 48],
    [1978, 50],
    [1980, 100],
    [1985, 58],
    [1990, 40],
    [1995, 35],
    [2000, 42],
];

function Fat({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: -160 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 160, damping: 16 }}
        >
            <rect x={x - 70} y={y - 110} width={140} height={110} rx={14} fill="#1f2937" />
            <rect x={x - 70} y={y - 82} width={140} height={10} fill="#f59e0b" />
            <rect x={x - 70} y={y - 38} width={140} height={10} fill="#f59e0b" />
            <ellipse cx={x} cy={y - 110} rx={70} ry={12} fill="#374151" />
        </motion.g>
    );
}

function Stabel({
    x,
    antall,
    etikett,
    forsinkelse,
    farge = '#0f172a',
}: {
    x: number;
    antall: number;
    etikett: string;
    forsinkelse: number;
    farge?: string;
}) {
    const bunn = 760;
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <Fat key={i} x={x} y={bunn - i * 118} forsinkelse={forsinkelse + i * 0.3} />
            ))}
            <motion.text
                x={x}
                y={bunn + 60}
                textAnchor="middle"
                fontSize={42}
                fontWeight={800}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse }}
            >
                {etikett}
            </motion.text>
        </g>
    );
}

function Fatene({ beat }: { beat: number }) {
    return (
        <motion.svg
            key="fat"
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <text x={B / 2} y={80} textAnchor="middle" fontSize={50} fontWeight={800} fill="#0f172a">
                Prisen på et fat olje
            </text>
            <line x1={200} y1={762} x2={1400} y2={762} stroke="#94a3b8" strokeWidth={4} />
            <Stabel x={400} antall={1} etikett="Før krisen" forsinkelse={0.2} />
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, -30, 0] }}
                    transition={{ y: { duration: 1.6, repeat: Infinity }, opacity: { delay: 0.8 } }}
                >
                    <path d="M 800 640 L 800 320" stroke="#dc2626" strokeWidth={22} strokeLinecap="round" />
                    <path d="M 740 360 L 800 270 L 860 360 Z" fill="#dc2626" />
                    <text x={800} y={720} textAnchor="middle" fontSize={40} fontWeight={800} fill="#dc2626">
                        Mindre olje = høyere pris
                    </text>
                </motion.g>
            )}
            {beat >= 1 && <Stabel x={800} antall={2} etikett="Doblet" forsinkelse={0.2} />}
            {beat >= 1 && (
                <Stabel
                    x={1200}
                    antall={4}
                    etikett="Omtrent firedoblet"
                    farge="#dc2626"
                    forsinkelse={beat === 1 ? 2.6 : 0.4}
                />
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
                    <rect x={520} y={150} width={560} height={130} rx={24} fill="#dc2626" />
                    <text x={800} y={205} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fee2e2">
                        Januar 1974
                    </text>
                    <text x={800} y={258} textAnchor="middle" fontSize={50} fontWeight={900} fill="#ffffff">
                        11,65 dollar per fat
                    </text>
                </motion.g>
            )}
        </motion.svg>
    );
}

function Kurve() {
    const v = 180;
    const h = 1480;
    const topp = 170;
    const bunn = 760;
    const x = (ar: number) => v + ((ar - 1960) / 40) * (h - v);
    const y = (pris: number) => bunn - (pris / 100) * (bunn - topp);
    const d = KURVE.map(([a, p], i) => `${i ? 'L' : 'M'} ${x(a)} ${y(p)}`).join(' ');
    return (
        <motion.svg
            key="kurve"
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <text x={B / 2} y={80} textAnchor="middle" fontSize={46} fontWeight={800} fill="#0f172a">
                Råoljeprisen 1960-2000
            </text>
            <text x={B / 2} y={124} textAnchor="middle" fontSize={28} fontWeight={600} fill="#64748b">
                dollar per fat, regnet om til pengeverdien i 2020
            </text>
            <rect x={x(1973)} y={topp} width={x(1974) - x(1973)} height={bunn - topp} fill="#fecaca" />
            {[0, 50, 100].map((p) => (
                <g key={p}>
                    <line x1={v} y1={y(p)} x2={h} y2={y(p)} stroke="#e2e8f0" strokeWidth={2} />
                    <text x={v - 20} y={y(p) + 10} textAnchor="end" fontSize={28} fill="#64748b">
                        {p}
                    </text>
                </g>
            ))}
            {[1960, 1970, 1980, 1990, 2000].map((a) => (
                <text key={a} x={x(a)} y={bunn + 46} textAnchor="middle" fontSize={30} fontWeight={600} fill="#475569">
                    {a}
                </text>
            ))}
            <motion.path
                d={d}
                fill="none"
                stroke="#c2410c"
                strokeWidth={10}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                <text x={x(1973.5)} y={y(48) - 40} textAnchor="middle" fontSize={34} fontWeight={800} fill="#b91c1c">
                    Oljekrisen
                </text>
                <text x={x(1974) + 30} y={y(48) + 50} fontSize={26} fontWeight={700} fill="#b91c1c">
                    (11,65 dollar den gangen)
                </text>
            </motion.g>
        </motion.svg>
    );
}

export function OljePris({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-amber-50">
            <AnimatePresence mode="wait">
                {beat < 3 ? <Fatene key="fat" beat={beat} /> : <Kurve key="kurve" />}
            </AnimatePresence>
        </div>
    );
}
