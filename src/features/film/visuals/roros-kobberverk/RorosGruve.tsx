import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Snitt gjennom gruvefjellet: stollen (gangen inn i fjellet), malmåra og bergmannen ved
 * fjellveggen. Beatene viser fyrsetting (bål mot veggen), sprekkene, borehull og krutt,
 * Nye Storwartz og til slutt Olavsgruva med lamper, slik den er for besøkende i dag.
 */

const FJELL = 'M 0 900 L 0 600 L 140 600 L 230 380 Q 600 130 900 120 Q 1300 140 1600 380 L 1600 900 Z';
const AARE = 'M 1120 900 L 1300 250 L 1420 270 L 1250 900 Z';
const VEGG = 1180;

const OVERSKRIFT = [
    'Bergmennene bryter malm',
    'Fyrsetting: bål mot fjellveggen',
    'Varmen får fjellet til å sprekke',
    'Bor, krutt og senere dynamitt',
    null,
    'Olavsgruva: i drift til 1972',
];

export function RorosGruve({ beat, playing }: VisualProps) {
    const bål = beat === 1 || beat === 2;
    const sprekker = beat >= 2 && beat <= 3;
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#c8d6e2]">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <defs>
                    <radialGradient id="roros-glod">
                        <stop offset="0%" stopColor="#ffcf6b" stopOpacity={0.95} />
                        <stop offset="45%" stopColor="#ff7a1a" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
                    </radialGradient>
                    <pattern id="roros-stein" width="60" height="60" patternUnits="userSpaceOnUse">
                        <rect width="60" height="60" fill="#6f6862" />
                        <circle cx="12" cy="18" r="4" fill="#625b55" />
                        <circle cx="44" cy="40" r="6" fill="#7b746d" />
                    </pattern>
                </defs>
                {/* Snø/lyng på toppen og fjellet i snitt */}
                <path d={FJELL} fill="url(#roros-stein)" stroke="#4b4540" strokeWidth={6} />
                <path d={AARE} fill="#8a4b2a" />
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <circle key={i} cx={1160 + i * 30 - i * i * 2} cy={820 - i * 85} r={9} fill="#3f7f6a" opacity={0.8} />
                ))}
                <text x={1330} y={210} fontSize={32} fontWeight={800} fill="#7c2d12" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                    malm
                </text>

                {/* Stollen */}
                <rect x={225} y={430} width={VEGG - 225} height={170} fill="#231e1a" />
                <rect x={215} y={418} width={24} height={190} fill="#7a4a2a" />
                <rect x={215} y={412} width={70} height={18} fill="#7a4a2a" />

                {/* Lamper i stollen i dag */}
                {beat >= 5 &&
                    [380, 560, 740, 920, 1100].map((x, i) => (
                        <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
                            <circle cx={x} cy={500} r={60} fill="url(#roros-glod)" opacity={0.5} />
                            <circle cx={x} cy={492} r={9} fill="#ffe08a" />
                        </motion.g>
                    ))}

                {/* Bålet mot veggen */}
                <AnimatePresence>
                    {bål && (
                        <motion.g key="bal" initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 0.55 : 1 }} exit={{ opacity: 0 }}>
                            <circle cx={VEGG - 40} cy={560} r={beat === 1 ? 220 : 150} fill="url(#roros-glod)" />
                            {[0, 1, 2].map((i) => (
                                <motion.path
                                    key={i}
                                    d={`M ${VEGG - 90 + i * 30} 600 Q ${VEGG - 110 + i * 30} 540 ${VEGG - 75 + i * 30} 495 Q ${VEGG - 55 + i * 30} 545 ${VEGG - 60 + i * 30} 600 Z`}
                                    fill={i === 1 ? '#ffd166' : '#f97316'}
                                    animate={playing ? { scaleY: [1, 1.25, 0.9, 1.15, 1] } : { scaleY: 1 }}
                                    transition={{ duration: 0.9 + i * 0.2, repeat: Infinity }}
                                    style={{ originY: '600px', originX: `${VEGG - 75 + i * 30}px` }}
                                />
                            ))}
                            <rect x={VEGG - 110} y={590} width={100} height={12} fill="#5a3a24" />
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Sprekker i fjellveggen */}
                {sprekker &&
                    [
                        `M ${VEGG} 470 L ${VEGG + 40} 430 L ${VEGG + 30} 380 L ${VEGG + 80} 330`,
                        `M ${VEGG} 540 L ${VEGG + 60} 520 L ${VEGG + 90} 560 L ${VEGG + 150} 540`,
                        `M ${VEGG} 600 L ${VEGG + 30} 650 L ${VEGG + 80} 670 L ${VEGG + 100} 730`,
                    ].map((d, i) => (
                        <motion.path
                            key={i}
                            d={d}
                            fill="none"
                            stroke="#f8fafc"
                            strokeWidth={6}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.4 + i * 0.5 }}
                        />
                    ))}

                {/* Malmbiter som faller løs */}
                {(beat === 0 || beat === 2) &&
                    [0, 1, 2, 3].map((i) => (
                        <motion.polygon
                            key={`${beat}-${i}`}
                            points="0,-14 14,-4 10,12 -10,12 -14,-2"
                            fill="#8a4b2a"
                            stroke="#3b1d0e"
                            strokeWidth={2}
                            initial={{ x: VEGG - 8, y: 500 + i * 18, opacity: 0 }}
                            animate={{ x: VEGG - 40 - i * 26, y: 586, opacity: 1 }}
                            transition={{ duration: 0.8, delay: (beat === 2 ? 2 : 0.6) + i * 0.6 }}
                        />
                    ))}

                {/* Borehull og kruttladninger */}
                {beat === 3 &&
                    [505, 545, 585].map((y, i) => (
                        <motion.g key={y} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}>
                            <line x1={VEGG} y1={y} x2={VEGG + 110} y2={y - 10} stroke="#111" strokeWidth={10} strokeLinecap="round" />
                            <circle cx={VEGG + 4} cy={y} r={7} fill="#facc15" />
                        </motion.g>
                    ))}

                {/* Bergmannen */}
                {beat <= 3 && <Bergmann x={beat === 1 || beat === 2 ? 860 : 1070} slår={playing && (beat === 0 || beat === 3)} />}
                {beat >= 5 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Bergmann x={420} slår={false} besøkende />
                        <Bergmann x={500} slår={false} besøkende />
                    </motion.g>
                )}
            </svg>

            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.4 }}
                    className="absolute right-[5%] bottom-[8%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-900"
                >
                    Først for hånd og krutt. Senere: dynamitt
                </motion.div>
            )}
            {beat === 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute left-1/2 top-[18%] -translate-x-1/2 px-8 py-5 rounded-3xl bg-white/95 shadow-2xl text-center"
                >
                    <div className="text-2xl font-bold text-slate-500">Nye Storwartz, funnet 1708</div>
                    <div className="text-6xl font-black text-[#9a3412] tabular-nums mt-1">
                        <TelleTall verdi={40000} varighet={2.2} /> tonn
                    </div>
                    <div className="text-2xl font-bold text-slate-700 mt-1">kobber fra én gruve</div>
                </motion.div>
            )}
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Enkel figur med lue og hakke. Besøkende har ingen hakke, men hjelm med lykt. */
function Bergmann({ x, slår, besøkende = false }: { x: number; slår: boolean; besøkende?: boolean }) {
    return (
        <motion.g animate={{ x }} initial={false} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <g transform="translate(0 600) scale(1.6) translate(0 -600)">
            <circle cx={0} cy={518} r={14} fill="#e7c9a9" />
            <path d="M -15 512 Q 0 494 15 512 Z" fill={besøkende ? '#facc15' : '#7f1d1d'} />
            <rect x={-13} y={532} width={26} height={40} rx={6} fill={besøkende ? '#2563eb' : '#57534e'} />
            <rect x={-12} y={570} width={10} height={30} fill="#292524" />
            <rect x={2} y={570} width={10} height={30} fill="#292524" />
            {!besøkende && (
                <g transform={slår ? 'rotate(-12 0 540)' : undefined}>
                    <line x1={0} y1={545} x2={40} y2={505} stroke="#a16207" strokeWidth={6} strokeLinecap="round" />
                    <path d="M 28 492 L 54 520" stroke="#d6d3d1" strokeWidth={7} strokeLinecap="round" />
                </g>
            )}
            </g>
        </motion.g>
    );
}
