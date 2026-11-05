import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Verden blir laget av urjotnen Yme, sett ovenfra. Til venstre står hva som ble hva, til
 * høyre bygges verden lag for lag: jord og fjell, hav og skog, og til slutt muren rundt
 * Midgard med jotnene utenfor havet. Ingen kropp vises, bare det verden ble laget av.
 */

const B = 1600;
const H = 900;
const SENTER = { x: 1130, y: 480 };

const RADER = [
    { fra: 'kjøttet', til: 'jord', farge: '#a3734a', beat: 1 },
    { fra: 'beina og tennene', til: 'fjell og stein', farge: '#78716c', beat: 1 },
    { fra: 'blodet og svetten', til: 'hav og vann', farge: '#2563eb', beat: 2 },
    { fra: 'håret', til: 'skog', farge: '#15803d', beat: 2 },
    { fra: 'øyenbrynene', til: 'muren', farge: '#92400e', beat: 3 },
];

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const FJELL = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    const r = 70 + frø(i) * 70;
    return { x: SENTER.x + Math.cos(a) * r, y: SENTER.y + Math.sin(a) * r, s: 26 + frø(i + 3) * 14 };
});
const TRAR = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + 0.1;
    const r = 120 + frø(i + 11) * 70;
    return { x: SENTER.x + Math.cos(a) * r, y: SENTER.y + Math.sin(a) * r };
});
const JOTNER = [
    { x: SENTER.x - 330, y: SENTER.y - 250 },
    { x: SENTER.x + 330, y: SENTER.y - 220 },
    { x: SENTER.x + 300, y: SENTER.y + 290 },
];

export function AsatroYme({ beat, playing }: VisualProps) {
    const d = (s: number) => (playing ? s : 0);
    const inn = (fra: number, delay = 0.4) => ({
        initial: { opacity: 0 },
        animate: { opacity: beat >= fra ? 1 : 0 },
        transition: { duration: d(0.8), delay: beat === fra ? d(delay) : 0 },
    });
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#1e293b' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <text x={360} y={110} textAnchor="middle" fontSize={56} fontWeight={900} fill="#f8fafc">
                    Av Yme ble verden
                </text>
                {/* Urjotnen som et grått, tomt felt før verden får form */}
                <motion.circle
                    cx={SENTER.x}
                    cy={SENTER.y}
                    r={300}
                    fill="#475569"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: beat === 0 ? 1 : 0 }}
                    transition={{ duration: d(1) }}
                />
                {beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.6) }}>
                        <text x={SENTER.x} y={SENTER.y - 10} textAnchor="middle" fontSize={84} fontWeight={900} fill="#f8fafc">
                            Yme
                        </text>
                        <text x={SENTER.x} y={SENTER.y + 60} textAnchor="middle" fontSize={40} fontWeight={700} fill="#cbd5e1">
                            den aller første jotnen
                        </text>
                    </motion.g>
                )}

                {/* Havet */}
                <motion.circle cx={SENTER.x} cy={SENTER.y} r={360} fill="#1d4ed8" {...inn(2)} />
                {/* Jorda */}
                <motion.circle cx={SENTER.x} cy={SENTER.y} r={220} fill="#a3734a" {...inn(1)} />
                <motion.g {...inn(1, 1.2)}>
                    {FJELL.map((f, i) => (
                        <path
                            key={i}
                            d={`M ${f.x - f.s} ${f.y + f.s * 0.6} L ${f.x} ${f.y - f.s} L ${f.x + f.s} ${f.y + f.s * 0.6} Z`}
                            fill="#78716c"
                            stroke="#44403c"
                            strokeWidth={3}
                        />
                    ))}
                </motion.g>
                <motion.g {...inn(2, 1.2)}>
                    {TRAR.map((t, i) => (
                        <path
                            key={i}
                            d={`M ${t.x - 14} ${t.y + 12} L ${t.x} ${t.y - 18} L ${t.x + 14} ${t.y + 12} Z`}
                            fill="#15803d"
                        />
                    ))}
                </motion.g>
                {/* Muren rundt Midgard */}
                <motion.circle
                    cx={SENTER.x}
                    cy={SENTER.y}
                    r={232}
                    fill="none"
                    stroke="#92400e"
                    strokeWidth={18}
                    {...inn(3)}
                />
                <motion.g {...inn(3, 1)}>
                    <rect x={SENTER.x - 120} y={SENTER.y - 30} width={240} height={64} rx={16} fill="#fff" />
                    <text x={SENTER.x} y={SENTER.y + 15} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                        Midgard
                    </text>
                </motion.g>
                <motion.g {...inn(3, 1.8)}>
                    {JOTNER.map((j, i) => (
                        <g key={i}>
                            <rect x={j.x - 20} y={j.y - 10} width={40} height={70} rx={12} fill="#94a3b8" />
                            <circle cx={j.x} cy={j.y - 32} r={22} fill="#94a3b8" />
                        </g>
                    ))}
                    <text x={SENTER.x - 330} y={SENTER.y - 320} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fca5a5">
                        jotnene
                    </text>
                </motion.g>

                {/* Hva som ble hva */}
                {RADER.map((r, i) => (
                    <motion.g key={r.fra} {...inn(r.beat, 0.3 + (i % 2) * 1.4)}>
                        <circle cx={70} cy={235 + i * 130} r={22} fill={r.farge} stroke="#f8fafc" strokeWidth={3} />
                        <text x={110} y={225 + i * 130} fontSize={38} fontWeight={700} fill="#cbd5e1">
                            {r.fra}
                        </text>
                        <text x={110} y={275 + i * 130} fontSize={46} fontWeight={900} fill="#f8fafc">
                            {`→ ${r.til}`}
                        </text>
                    </motion.g>
                ))}
            </svg>
        </div>
    );
}
