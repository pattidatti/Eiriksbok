import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Naturlig monopol som snitt gjennom gata: husene over bakken, vannrørene i jorda under.
 * Først ett rør, så hva det koster å grave, så tre selskaper med hvert sitt rør til hvert
 * hus, og til slutt ett rør igjen med noen som passer på prisen.
 */

const OVERSKRIFT = [
    'Naturlig monopol',
    'Dyrt å bygge',
    'Tre selskaper, tre rør til hvert hus?',
    'Sløsing. Bedre med én eier.',
    'Noen må passe på prisen',
];

const HUS = [260, 540, 820, 1100, 1380];
const BAKKE = 470;
const RØR = [
    { y: 640, farge: '#2563eb' },
    { y: 700, farge: '#16a34a' },
    { y: 760, farge: '#ea580c' },
];

function Hus({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} ${BAKKE})`}>
            <rect x={-80} y={-130} width={160} height={130} fill="#fef3c7" stroke="#334155" strokeWidth={5} />
            <path d="M -100 -130 L 0 -210 L 100 -130 Z" fill="#b91c1c" stroke="#334155" strokeWidth={5} />
            <rect x={-22} y={-70} width={44} height={70} fill="#78350f" />
            <rect x={30} y={-110} width={36} height={32} fill="#bae6fd" stroke="#334155" strokeWidth={3} />
        </g>
    );
}

function Ror({ y, farge, synlig, forsinkelse = 0 }: { y: number; farge: string; synlig: boolean; forsinkelse?: number }) {
    return (
        <motion.g initial={false} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.8 }}>
            <motion.line
                x1={60}
                y1={y}
                x2={1540}
                y2={y}
                stroke={farge}
                strokeWidth={18}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse }}
            />
            {HUS.map((x) => (
                <motion.line
                    key={x}
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={BAKKE}
                    stroke={farge}
                    strokeWidth={10}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: forsinkelse + 1 }}
                />
            ))}
        </motion.g>
    );
}

export function MonopolVann({ beat, playing }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const tre = beat >= 2;
    const bare1 = beat >= 3;
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-100 to-sky-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Jorda i snitt */}
                <rect x={0} y={BAKKE} width={1600} height={900 - BAKKE} fill="#a16207" opacity={0.35} />
                <rect x={0} y={BAKKE} width={1600} height={16} fill="#65a30d" />
                {HUS.map((x) => (
                    <Hus key={x} x={x} />
                ))}
                {/* Det første røret er alltid der. De to andre kommer på beat 2. */}
                <Ror y={RØR[0].y} farge={RØR[0].farge} synlig />
                {tre && <Ror y={RØR[1].y} farge={RØR[1].farge} synlig={!bare1} forsinkelse={0.2} />}
                {tre && <Ror y={RØR[2].y} farge={RØR[2].farge} synlig={!bare1} forsinkelse={0.7} />}
                {/* Graving: en grøft som åpner seg og penger som renner ut */}
                {beat === 1 && (
                    <g>
                        <motion.rect
                            x={640}
                            y={BAKKE}
                            height={220}
                            fill="#78350f"
                            initial={{ width: 0 }}
                            animate={{ width: 340 }}
                            transition={{ duration: 1.6 }}
                        />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.g
                                key={i}
                                initial={{ y: 0, opacity: 0 }}
                                animate={playing ? { y: [0, 110], opacity: [0, 1, 0] } : { opacity: 1 }}
                                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
                            >
                                <circle cx={690 + i * 60} cy={520} r={26} fill="#facc15" stroke="#a16207" strokeWidth={5} />
                                <text x={690 + i * 60} y={531} textAnchor="middle" fontSize={30} fontWeight={900} fill="#a16207">
                                    kr
                                </text>
                            </motion.g>
                        ))}
                    </g>
                )}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <rect x={1100} y={560} width={220} height={60} rx={14} fill="#fff" stroke="#0f172a" strokeWidth={5} />
                        <text x={1210} y={602} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                            pris: passe?
                        </text>
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} style={{ originX: '1400px', originY: '640px' }}>
                        <circle cx={1440} cy={640} r={60} fill="#fff" stroke="#0f172a" strokeWidth={8} />
                        <path d="M 1410 640 L 1432 664 L 1475 612" fill="none" stroke="#0d9488" strokeWidth={12} strokeLinecap="round" />
                    </motion.g>
                )}
            </svg>
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute left-[4%] bottom-[6%] px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-blue-700 whitespace-nowrap"
                >
                    Én eier, ett rør
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute right-[4%] bottom-[6%] px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-800 whitespace-nowrap"
                >
                    Du kan ikke velge et annet rør
                </motion.div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
