import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Prisjegersaken som tidslinje: tilsynet mener samarbeidet svekket konkurransen, boten i
 * august 2024, medholdet i august 2025, søksmålet i november 2025 og rettssaken høsten 2026.
 */

const OVERSKRIFT = [
    'Tilsynet: samarbeidet svekket konkurransen',
    'August 2024: boten',
    'August 2025: medhold i klagenemnda',
    'November 2025: kjedene saksøker staten',
    'Høsten 2026: saken går i retten',
];

const STASJONER = [
    { år: '2010 til 2012', x: 220, fraBeat: 0 },
    { år: 'Aug. 2024', x: 530, fraBeat: 1 },
    { år: 'Aug. 2025', x: 840, fraBeat: 2 },
    { år: 'Nov. 2025', x: 1150, fraBeat: 3 },
    { år: 'Høsten 2026', x: 1410, fraBeat: 4 },
];
const FARGER = ['#ea580c', '#2563eb', '#7c3aed'];
const LINJE_Y = 790;

function Tidslinje({ beat }: { beat: number }) {
    return (
        <g>
            <line x1={120} y1={LINJE_Y} x2={1480} y2={LINJE_Y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
            {STASJONER.map((s, i) => {
                const aktiv = beat >= s.fraBeat;
                const nå = Math.min(beat, 4) === i;
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
    if (beat === 2)
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
                        Tilsynet fikk medhold
                    </text>
                    <text x={600} y={565} textAnchor="middle" fontSize={30} fontWeight={700} fill="#ccfbf1">
                        i Konkurranseklagenemnda
                    </text>
                </motion.g>
            </g>
        );
    if (beat === 3)
        return (
            <g>
                {['Coop', 'NorgesGruppen', 'Rema 1000'].map((n, i) => (
                    <motion.g key={n} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>
                        <rect x={200} y={250 + i * 110} width={360} height={80} rx={40} fill={FARGER[[1, 0, 2][i]]} />
                        <text x={380} y={303 + i * 110} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">
                            {n}
                        </text>
                    </motion.g>
                ))}
                <motion.path d="M 610 400 L 960 400" stroke="#475569" strokeWidth={12} markerEnd="url(#sak-pil)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.9 }} />
                <text x={785} y={370} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                    saksøker
                </text>
                <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6 }} style={{ originX: '1200px', originY: '400px' }}>
                    <path d="M 1040 300 L 1200 220 L 1360 300 Z" fill="#334155" />
                    <rect x={1050} y={300} width={300} height={220} fill="#e2e8f0" stroke="#334155" strokeWidth={6} />
                    {[0, 1, 2, 3].map((i) => (
                        <rect key={i} x={1075 + i * 70} y={320} width={34} height={180} fill="#94a3b8" />
                    ))}
                    <text x={1200} y={580} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                        Staten
                    </text>
                </motion.g>
            </g>
        );
    return (
        <g>
            <rect x={400} y={210} width={800} height={110} rx={18} fill="#78350f" />
            <text x={800} y={282} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff">
                Gulating lagmannsrett, Bergen
            </text>
            <motion.text x={800} y={420} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                12. oktober til 14. desember 2026
            </motion.text>
            <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 }} style={{ originX: '800px', originY: '560px' }}>
                <rect x={520} y={500} width={560} height={120} rx={22} fill="#fff" stroke="#0f172a" strokeWidth={6} />
                <text x={800} y={578} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
                    Ingen dom ennå
                </text>
            </motion.g>
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
