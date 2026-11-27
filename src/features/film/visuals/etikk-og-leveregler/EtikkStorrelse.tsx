import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De tre nyere bevegelsene, hvor de kom fra og hvor store de er. Flaten til hver sirkel
 * følger antallet: over en milliard mot seks til femten millioner (omtrentlig, en skisse).
 */

const B = 1600;
const H = 900;

/** Radius for en milliard. Femten millioner blir da 170 * sqrt(0,015), ca. 21. */
const STOR = 170;
const LITEN_MAKS = STOR * Math.sqrt(0.015);
const LITEN_MIN = STOR * Math.sqrt(0.006);

const FORELDRE = [
    { id: 'kristendom', navn: 'kristendom', x: 300, y: 300, farge: '#6366f1' },
    { id: 'islam', navn: 'islam', x: 300, y: 670, farge: '#10b981' },
];

const NYE = [
    { id: 'mormonisme', navn: 'mormonismen', x: 1020, y: 220, farge: '#8b5cf6', fra: 0 },
    { id: 'jv', navn: 'Jehovas vitner', x: 1020, y: 380, farge: '#0ea5e9', fra: 0 },
    { id: 'bahai', navn: "bahá'í", x: 1020, y: 670, farge: '#14b8a6', fra: 1 },
];

const OVERSKRIFT = ['Tre nyere bevegelser', 'Hvor kom de fra?', 'Over en milliard hver', 'Mye mindre'];

export function EtikkStorrelse({ beat }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const foreldreR = beat >= 2 ? STOR : 46;
    return (
        <div className="absolute inset-0" style={{ background: '#eef2f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {beat >= 1 &&
                    NYE.map((n) => {
                        const f = FORELDRE[n.fra];
                        return (
                            <motion.path
                                key={`l-${n.id}`}
                                d={`M ${f.x + foreldreR + 10} ${f.y} C ${f.x + 420} ${f.y}, ${n.x - 260} ${n.y}, ${n.x - 40} ${n.y}`}
                                fill="none"
                                stroke={n.farge}
                                strokeWidth={8}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0.9 }}
                                animate={{ pathLength: 1, opacity: beat >= 3 ? 0.35 : 0.9 }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                            />
                        );
                    })}

                {beat >= 1 &&
                    FORELDRE.map((f) => (
                        <motion.g key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                            <motion.circle
                                cx={f.x}
                                cy={f.y}
                                r={STOR}
                                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                initial={{ scale: 46 / STOR }}
                                animate={{ scale: foreldreR / STOR }}
                                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                fill={f.farge}
                            />
                            <text
                                x={f.x}
                                y={beat >= 2 ? f.y - 8 : f.y + 100}
                                textAnchor="middle"
                                fontSize={48}
                                fontWeight={900}
                                fill={beat >= 2 ? '#fff' : '#1e293b'}
                            >
                                {f.navn}
                            </text>
                            {beat >= 2 && (
                                <motion.text
                                    x={f.x}
                                    y={f.y + 48}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={800}
                                    fill="#fff"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    over 1 milliard
                                </motion.text>
                            )}
                        </motion.g>
                    ))}

                {NYE.map((n, i) => (
                    <motion.g
                        key={n.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: beat === 0 ? 0.3 + i * 0.4 : 0, duration: 0.5 }}
                    >
                        <circle cx={n.x} cy={n.y} r={LITEN_MAKS} fill={n.farge} />
                        {beat >= 3 && <circle cx={n.x} cy={n.y} r={LITEN_MIN} fill="#fff" opacity={0.45} />}
                        <text x={n.x + 48} y={n.y + 16} fontSize={46} fontWeight={900} fill="#0f172a">
                            {n.navn}
                        </text>
                        {beat === 1 && (
                            <motion.text
                                x={n.x + 48}
                                y={n.y + 58}
                                fontSize={32}
                                fontWeight={700}
                                fill="#475569"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                {n.fra === 1 ? 'fra sjia-islam' : 'fra kristendommen'}
                            </motion.text>
                        )}
                    </motion.g>
                ))}

                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <rect x={1000} y={760} width={560} height={84} rx={20} fill="#0f172a" />
                        <text x={1280} y={815} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                            6 til 15 millioner hver
                        </text>
                    </motion.g>
                )}
                {beat >= 2 && (
                    <text x={40} y={870} fontSize={36} fontWeight={800} fill="#334155">
                        Skisse: flaten viser omtrentlig antall
                    </text>
                )}

                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={B / 2}
                        y={92}
                        textAnchor="middle"
                        fontSize={58}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={10}
                        paintOrder="stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>
            </svg>
        </div>
    );
}
