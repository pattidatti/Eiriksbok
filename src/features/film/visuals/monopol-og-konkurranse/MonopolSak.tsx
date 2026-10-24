import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Prisjegersaken som tidslinje: tilsynet mistenker samarbeidet, besøket i 2018, boten i
 * august 2024, medholdet i august 2025, og hvem det til slutt handler om.
 */

const OVERSKRIFT = [
    'Samarbeidet svekket konkurransen',
    '2018: uanmeldt besøk',
    'August 2024: boten',
    'August 2025: fullt medhold',
    'Det skader forbrukerne',
];

const STASJONER = [
    { år: '2010 til 2012', x: 260, fraBeat: 0 },
    { år: '2018', x: 640, fraBeat: 1 },
    { år: 'Aug. 2024', x: 1000, fraBeat: 2 },
    { år: 'Aug. 2025', x: 1340, fraBeat: 3 },
];
const FARGER = ['#ea580c', '#2563eb', '#7c3aed'];
const LINJE_Y = 790;

function Tidslinje({ beat }: { beat: number }) {
    return (
        <g>
            <line x1={120} y1={LINJE_Y} x2={1480} y2={LINJE_Y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
            {STASJONER.map((s, i) => {
                const aktiv = beat >= s.fraBeat;
                const nå = Math.min(beat, 3) === i;
                return (
                    <g key={s.år}>
                        <motion.circle
                            cx={s.x}
                            cy={LINJE_Y}
                            initial={false}
                            animate={{ r: nå ? 24 : 16 }}
                            fill={aktiv ? '#0f172a' : '#cbd5e1'}
                            stroke="#fff"
                            strokeWidth={6}
                        />
                        <text x={s.x} y={LINJE_Y + 66} textAnchor="middle" fontSize={34} fontWeight={nå ? 900 : 700} fill={aktiv ? '#0f172a' : '#94a3b8'}>
                            {s.år}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function Panel({ beat, playing }: { beat: number; playing: boolean }) {
    if (beat === 0)
        return (
            <g>
                {[0, 1, 2].map((i) => (
                    <rect key={i} x={560 + i * 170} y={330} width={140} height={150} rx={12} fill={FARGER[i]} />
                ))}
                {[0, 1].map((i) => (
                    <line key={i} x1={700 + i * 170} y1={405} x2={730 + i * 170} y2={405} stroke="#0f172a" strokeWidth={10} />
                ))}
                {/* Forstørrelsesglasset */}
                <motion.g
                    initial={{ x: -200, opacity: 0 }}
                    animate={playing ? { x: [-120, 120, -120], opacity: 1 } : { x: 0, opacity: 1 }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <circle cx={800} cy={400} r={140} fill="#e0f2fe" fillOpacity={0.35} stroke="#0f172a" strokeWidth={16} />
                    <line x1={900} y1={500} x2={1010} y2={610} stroke="#0f172a" strokeWidth={30} strokeLinecap="round" />
                </motion.g>
                <text x={800} y={660} textAnchor="middle" fontSize={40} fontWeight={800} fill="#334155">
                    Konkurransetilsynet ser nærmere på samarbeidet
                </text>
            </g>
        );
    if (beat === 1)
        return (
            <g>
                <rect x={480} y={240} width={300} height={400} rx={14} fill="#fff" stroke="#334155" strokeWidth={6} />
                <text x={630} y={300} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                    kjedens kontor
                </text>
                <rect x={1040} y={300} width={240} height={360} rx={14} fill="#0f172a" />
                <text x={1160} y={350} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fff">
                    tilsynet
                </text>
                {[0, 1, 2, 3].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: 520, y: 40, opacity: 1 }}
                        transition={{ duration: 1.4, delay: 0.5 + i * 0.45, ease: 'easeInOut' }}
                    >
                        <rect x={550} y={340 + i * 64} width={160} height={50} rx={6} fill="#fde68a" stroke="#92400e" strokeWidth={4} />
                    </motion.g>
                ))}
                <text x={800} y={710} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                    Uanmeldt: uten å si fra først
                </text>
            </g>
        );
    if (beat === 2)
        return (
            <g>
                <motion.g initial={{ scale: 2.2, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -6 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }} style={{ originX: '800px', originY: '400px' }}>
                    <rect x={330} y={220} width={940} height={300} rx={24} fill="#fff" stroke="#dc2626" strokeWidth={14} />
                    <text x={800} y={340} textAnchor="middle" fontSize={100} fontWeight={900} fill="#dc2626">
                        4,9 milliarder
                    </text>
                    <text x={800} y={440} textAnchor="middle" fontSize={56} fontWeight={800} fill="#dc2626">
                        kroner i bot
                    </text>
                </motion.g>
                {['Coop', 'NorgesGruppen', 'Rema 1000'].map((n, i) => (
                    <motion.g key={n} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.25 }}>
                        <rect x={310 + i * 340} y={610} width={320} height={70} rx={35} fill={FARGER[[1, 0, 2][i]]} />
                        <text x={470 + i * 340} y={658} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                            {n}
                        </text>
                    </motion.g>
                ))}
            </g>
        );
    if (beat === 3)
        return (
            <g>
                <text x={450} y={335} textAnchor="middle" fontSize={44} fontWeight={800} fill="#475569">
                    Kjedene klaget
                </text>
                <motion.path d="M 700 320 L 920 320" stroke="#475569" strokeWidth={10} markerEnd="url(#sak-pil)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.4 }} />
                {/* Klubba */}
                <motion.g
                    initial={{ rotate: -35 }}
                    animate={{ rotate: [-35, 8, 0] }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    style={{ originX: '1180px', originY: '480px' }}
                >
                    <rect x={1060} y={250} width={180} height={80} rx={14} fill="#78350f" />
                    <rect x={1135} y={320} width={30} height={170} rx={10} fill="#a16207" />
                </motion.g>
                <rect x={1040} y={500} width={260} height={40} rx={8} fill="#78350f" />
                <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8 }} style={{ originX: '600px', originY: '520px' }}>
                    <rect x={260} y={440} width={680} height={150} rx={22} fill="#0d9488" />
                    <text x={600} y={515} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fff">
                        Tilsynet fikk helt rett
                    </text>
                    <text x={600} y={565} textAnchor="middle" fontSize={30} fontWeight={700} fill="#ccfbf1">
                        fullt medhold i Konkurranseklagenemnda
                    </text>
                </motion.g>
            </g>
        );
    return (
        <g>
            <text x={800} y={290} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                Ulovlig samarbeid skader forbrukerne
            </text>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.g key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.15 }}>
                    <circle cx={440 + i * 120} cy={420} r={30} fill={i === 3 ? '#ef4444' : '#64748b'} />
                    <rect x={410 + i * 120} y={460} width={60} height={110} rx={22} fill={i === 3 ? '#ef4444' : '#64748b'} />
                </motion.g>
            ))}
            <motion.text x={800} y={650} textAnchor="middle" fontSize={48} fontWeight={900} fill="#ef4444" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                Det er deg og meg
            </motion.text>
        </g>
    );
}

export function MonopolSak({ beat, playing }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-white to-slate-100">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <defs>
                    <marker id="sak-pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                </defs>
                <AnimatePresence mode="wait">
                    <motion.g key={Math.min(beat, 4)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                        <Panel beat={Math.min(beat, 4)} playing={playing} />
                    </motion.g>
                </AnimatePresence>
                <Tidslinje beat={beat} />
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
