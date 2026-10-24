import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Vinmonopolet: et monopol staten har valgt. Butikken med statens merke, enerett (andre
 * butikker får ikke selge), de 351 butikkene som små ruter, og de private pengene som
 * holdes utenfor alkoholsalget.
 */

const OVERSKRIFT = [
    'Et monopol med vilje?',
    'Vinmonopolet: startet i 1922, eid av staten',
    'Enerett: 351 butikker, ingen andre',
    'Ingen private penger i alkoholsalget',
];

const GRONN = '#166534';

function Butikken({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-200} y={-300} width={400} height={300} rx={10} fill="#f8fafc" stroke="#334155" strokeWidth={6} />
            <rect x={-200} y={-300} width={400} height={80} rx={10} fill={GRONN} />
            <text x={0} y={-246} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                Vinmonopolet
            </text>
            {/* Hyller med flasker */}
            {[0, 1].map((r) => (
                <g key={r}>
                    <line x1={-170} y1={-120 + r * 90} x2={-10} y2={-120 + r * 90} stroke="#94a3b8" strokeWidth={6} />
                    {[0, 1, 2, 3, 4].map((c) => (
                        <g key={c} transform={`translate(${-155 + c * 32} ${-120 + r * 90})`}>
                            <rect x={-8} y={-50} width={16} height={50} rx={5} fill={c % 2 ? '#7f1d1d' : '#14532d'} />
                            <rect x={-4} y={-64} width={8} height={16} fill={c % 2 ? '#7f1d1d' : '#14532d'} />
                        </g>
                    ))}
                </g>
            ))}
            <rect x={40} y={-170} width={110} height={170} fill="#cbd5e1" stroke="#334155" strokeWidth={4} />
        </g>
    );
}

export function MonopolVin({ beat, playing }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-emerald-50 to-slate-100">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <motion.g initial={false} animate={{ x: beat >= 2 ? -260 : 0 }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
                    <Butikken x={620} y={780} />
                    {beat === 0 && (
                        <motion.text
                            x={980}
                            y={520}
                            fontSize={260}
                            fontWeight={900}
                            fill="#dc2626"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={playing ? { opacity: 1, scale: [1, 1.08, 1] } : { opacity: 1, scale: 1 }}
                            transition={{ scale: { duration: 1.4, repeat: Infinity } }}
                            style={{ originX: '1050px', originY: '440px' }}
                        >
                            ?
                        </motion.text>
                    )}
                    {beat >= 1 && (
                        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} style={{ originX: '900px', originY: '330px' }}>
                            <circle cx={900} cy={330} r={110} fill="#fff" stroke={GRONN} strokeWidth={10} />
                            <text x={900} y={315} textAnchor="middle" fontSize={44} fontWeight={900} fill={GRONN}>
                                STATEN
                            </text>
                            <text x={900} y={365} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                                eier
                            </text>
                        </motion.g>
                    )}
                    {beat >= 1 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                            <rect x={330} y={330} width={180} height={80} rx={12} fill="#fef3c7" stroke="#92400e" strokeWidth={5} />
                            <text x={420} y={385} textAnchor="middle" fontSize={44} fontWeight={900} fill="#92400e">
                                1922
                            </text>
                        </motion.g>
                    )}
                </motion.g>
                {/* 351 butikker som små ruter */}
                {beat >= 2 && (
                    <g>
                        <text x={1180} y={210} textAnchor="middle" fontSize={50} fontWeight={900} fill={GRONN}>
                            351 butikker
                        </text>
                        {Array.from({ length: 351 }, (_, i) => (
                            <motion.rect
                                key={i}
                                x={880 + (i % 27) * 22}
                                y={250 + Math.floor(i / 27) * 22}
                                width={16}
                                height={16}
                                rx={3}
                                fill={GRONN}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.006 }}
                            />
                        ))}
                        <text x={1180} y={590} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                            Enerett: ingen andre har lov
                        </text>
                    </g>
                )}
                {beat >= 3 &&
                    [0, 1, 2].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: 0, opacity: 0 }}
                            animate={playing ? { x: [0, 120], opacity: [0, 1, 0] } : { opacity: 1 }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                        >
                            <circle cx={1000 + i * 120} cy={720} r={40} fill="#facc15" stroke="#a16207" strokeWidth={6} />
                            <text x={1000 + i * 120} y={735} textAnchor="middle" fontSize={40} fontWeight={900} fill="#a16207">
                                kr
                            </text>
                        </motion.g>
                    ))}
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <line x1={940} y1={660} x2={1340} y2={790} stroke="#dc2626" strokeWidth={14} strokeLinecap="round" />
                        <text x={1180} y={850} textAnchor="middle" fontSize={34} fontWeight={800} fill="#dc2626">
                            private pengeinteresser
                        </text>
                    </motion.g>
                )}
            </svg>
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
