import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Konventikkelplakaten: loven fra 1741 som satte strenge regler for kristne møter.
 * Beat 0 viser året 1842 og de to tingene som skjer. Så henger plakaten på veggen, reglene
 * står på den, Hauge sitter bak sprinkler, og til slutt rives plakaten ned og folk samles.
 */

const B = 1600;
const H = 900;
const PAPIR = '#f3e7c9';
const BLEKK = '#3f2d1a';
const ROD = '#b91c1c';
const MISJON = '#0f766e';
const LILLA = '#7c3aed';

export function MisjonPlakat({ beat }: VisualProps) {
    const visPlakat = beat >= 1 && beat <= 3;
    const revet = beat >= 4;
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#e7dcc4] to-[#cbb995]">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Tømmervegg */}
                {Array.from({ length: 9 }, (_, i) => (
                    <rect key={i} x={0} y={i * 100} width={B} height={96} fill={i % 2 ? '#c9a878' : '#c19f6d'} />
                ))}

                <AnimatePresence>
                    {beat === 0 && (
                        <motion.g key="aar" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ transformOrigin: '800px 450px' }}>
                            <rect x={420} y={150} width={760} height={600} rx={30} fill="#ffffff" opacity={0.92} />
                            <text x={800} y={380} textAnchor="middle" fontSize={190} fontWeight={900} fill={BLEKK}>
                                1842
                            </text>
                            <motion.text x={800} y={510} textAnchor="middle" fontSize={50} fontWeight={800} fill={ROD} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                                1. En gammel lov forsvinner
                            </motion.text>
                            <motion.text x={800} y={600} textAnchor="middle" fontSize={50} fontWeight={800} fill={MISJON} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                                2. Et misjonsselskap blir til
                            </motion.text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Plakaten */}
                <AnimatePresence>
                    {(visPlakat || revet) && (
                        <motion.g
                            key="plakat"
                            initial={{ opacity: 0, y: -40 }}
                            animate={revet ? { opacity: 0, y: 500, rotate: 18 } : { opacity: 1, y: 0, rotate: -1.5 }}
                            exit={{ opacity: 0 }}
                            transition={revet ? { duration: 1.6, ease: 'easeIn', delay: 0.3 } : { type: 'spring', stiffness: 120, damping: 16 }}
                            style={{ transformOrigin: '560px 450px' }}
                        >
                            <rect x={250} y={90} width={620} height={720} fill={PAPIR} stroke="#8b6f47" strokeWidth={6} />
                            <circle cx={560} cy={112} r={12} fill="#57534e" />
                            <text x={560} y={210} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK} letterSpacing={3}>
                                KONVENTIKKEL-
                            </text>
                            <text x={560} y={262} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK} letterSpacing={3}>
                                PLAKATEN
                            </text>
                            <text x={560} y={340} textAnchor="middle" fontSize={64} fontWeight={900} fill={ROD}>
                                1741
                            </text>
                            <line x1={320} x2={800} y1={375} y2={375} stroke={BLEKK} strokeWidth={3} />
                            {beat >= 2 && (
                                <>
                                    <Regel y={450} tekst="Strenge regler for møter" tekst2="utenfor kirken" forsinkelse={0.3} />
                                    <Regel y={620} tekst="Forbudt å reise rundt" tekst2="og preke" forsinkelse={1.3} />
                                </>
                            )}
                            {beat < 2 &&
                                [0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <line key={i} x1={320} x2={i === 6 ? 620 : 800} y1={430 + i * 50} y2={430 + i * 50} stroke="#a8906a" strokeWidth={8} strokeLinecap="round" />
                                ))}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Hauge bak sprinkler */}
                <AnimatePresence>
                    {beat === 3 && (
                        <motion.g key="hauge" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.3 }}>
                            <rect x={980} y={180} width={440} height={440} rx={14} fill="#1f2937" />
                            {/* Mannen */}
                            <circle cx={1200} cy={360} r={60} fill="#e7c9a9" />
                            <path d="M 1090 620 Q 1100 450 1200 440 Q 1300 450 1310 620 Z" fill={LILLA} />
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <rect key={i} x={1010 + i * 78} y={180} width={14} height={440} fill="#9ca3af" />
                            ))}
                            <rect x={980} y={170} width={440} height={20} fill="#6b7280" />
                            <rect x={980} y={610} width={440} height={20} fill="#6b7280" />
                            <text x={1200} y={700} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff" stroke={BLEKK} strokeWidth={8} paintOrder="stroke">
                                Hans Nielsen Hauge
                            </text>
                            <text x={1200} y={760} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fecaca" stroke={BLEKK} strokeWidth={8} paintOrder="stroke">
                                Lang fengselsstraff
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* 1842: folk samles */}
                <AnimatePresence>
                    {revet && (
                        <motion.g key="fri" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                            <rect x={360} y={110} width={880} height={140} rx={24} fill="#ffffff" opacity={0.95} />
                            <text x={800} y={205} textAnchor="middle" fontSize={64} fontWeight={900} fill={MISJON}>
                                1842: Loven er borte
                            </text>
                            {FOLK.map((f, i) => (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0, x: f.fra }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.8 + i * 0.15, duration: 1.2, ease: 'easeOut' }}
                                >
                                    <circle cx={f.x} cy={f.y - 70} r={32} fill="#e7c9a9" />
                                    <path d={`M ${f.x - 48} ${f.y + 60} Q ${f.x - 44} ${f.y - 30} ${f.x} ${f.y - 34} Q ${f.x + 44} ${f.y - 30} ${f.x + 48} ${f.y + 60} Z`} fill={f.farge} />
                                </motion.g>
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}

const FOLK = [
    { x: 520, y: 600, farge: '#1e3a8a', fra: -400 },
    { x: 640, y: 640, farge: '#7c2d12', fra: -300 },
    { x: 760, y: 590, farge: '#14532d', fra: -200 },
    { x: 880, y: 640, farge: '#831843', fra: 200 },
    { x: 1000, y: 600, farge: '#334155', fra: 300 },
    { x: 1120, y: 640, farge: '#7c3aed', fra: 400 },
    { x: 700, y: 760, farge: '#92400e', fra: -350 },
    { x: 940, y: 760, farge: '#0f766e', fra: 350 },
];

function Regel({ y, tekst, tekst2, forsinkelse }: { y: number; tekst: string; tekst2: string; forsinkelse: number }) {
    return (
        <motion.g initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: forsinkelse }}>
            <circle cx={340} cy={y + 20} r={30} fill="#ffffff" stroke={ROD} strokeWidth={6} />
            <path d={`M ${322} ${y + 2} L ${358} ${y + 38} M ${358} ${y + 2} L ${322} ${y + 38}`} stroke={ROD} strokeWidth={8} strokeLinecap="round" />
            <text x={392} y={y + 12} fontSize={34} fontWeight={800} fill={BLEKK}>
                {tekst}
            </text>
            <text x={392} y={y + 62} fontSize={34} fontWeight={800} fill={BLEKK}>
                {tekst2}
            </text>
        </motion.g>
    );
}
