import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Irak etter 2003 som en mekanisme. Landet er tre biter som et jernbånd (Saddams vold og frykt)
 * holder sammen. Beat 0: båndet ryker. Beat 1: bitene glir fra hverandre, med sprekker mellom.
 * Beat 2: røde gnister i sprekkene (borgerkrig) og et tomt kort for planen som manglet.
 * Beat 3: en mørk skygge (IS) vokser ut av sprekkene. Ingen mennesker vises.
 */

const B = 1600;
const H = 900;
const MIDT: [number, number] = [800, 500];

/** Tre biter som til sammen er en avrundet blokk. Hver bit har en retning den glir mot. */
const BITER = [
    {
        d: 'M800 500 L800 270 Q980 260 1050 360 L1060 470 Z',
        farge: '#d97706',
        ut: [70, -40],
    },
    {
        d: 'M800 500 L1060 470 Q1080 640 940 720 L800 730 Z',
        farge: '#b45309',
        ut: [60, 60],
    },
    {
        d: 'M800 500 L800 730 Q620 740 560 620 Q530 420 620 300 Q700 262 800 270 Z',
        farge: '#ea580c',
        ut: [-80, 10],
    },
];

const SPREDNING = [0, 1, 1.6, 1.9];

const OVERSKRIFT = [
    { tekst: 'Saddam Hussein styrtes', rod: false },
    { tekst: 'Gammelt hat bryter ut', rod: false },
    { tekst: 'Ingen plan for etterpå: borgerkrig', rod: true },
    { tekst: 'IS vokser fram', rod: true },
];

const GNISTER: [number, number][] = [
    [880, 390],
    [930, 600],
    [760, 640],
    [700, 420],
    [960, 480],
];

export function TerrorKaos({ beat }: VisualProps) {
    const s = SPREDNING[Math.min(beat, SPREDNING.length - 1)];
    const overskrift = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-200 to-orange-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <g transform="translate(-150 0)">
                    {/* IS-skyggen ligger under bitene og vokser ut i sprekkene. */}
                    <motion.circle
                        cx={MIDT[0] + 10}
                        cy={MIDT[1]}
                        fill="#1c1917"
                        initial={{ r: 0, opacity: 0 }}
                        animate={{ r: beat >= 3 ? 230 : 0, opacity: beat >= 3 ? 0.9 : 0 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                    />

                    {BITER.map((b, i) => (
                        <motion.path
                            key={i}
                            d={b.d}
                            fill={b.farge}
                            stroke="#fff7ed"
                            strokeWidth={6}
                            initial={false}
                            animate={{
                                x: b.ut[0] * s,
                                y: b.ut[1] * s,
                                opacity: beat >= 3 ? 0.75 : 1,
                            }}
                            transition={{ duration: 1.2, ease: 'easeInOut' }}
                        />
                    ))}

                    {/* Jernbåndet rundt landet. På beat 0 ryker det. */}
                    <motion.ellipse
                        cx={MIDT[0]}
                        cy={MIDT[1]}
                        rx={300}
                        ry={265}
                        fill="none"
                        stroke="#334155"
                        strokeWidth={22}
                        initial={{ pathLength: 1, opacity: 1 }}
                        animate={{
                            pathLength: beat === 0 ? 0.82 : 0,
                            opacity: beat === 0 ? 1 : 0,
                        }}
                        transition={{ delay: beat === 0 ? 1.0 : 0, duration: 1.0 }}
                    />

                    {beat <= 1 && (
                        <motion.text
                            x={MIDT[0]}
                            y={MIDT[1] + 330}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#334155"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Saddams vold og frykt holdt landet sammen
                        </motion.text>
                    )}

                    {beat >= 2 &&
                        GNISTER.map(([x, y], i) => (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                fill="#dc2626"
                                initial={{ r: 0, opacity: 0 }}
                                animate={{ r: [10, 26, 10], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.4, delay: i * 0.25, repeat: Infinity }}
                            />
                        ))}

                    {beat >= 3 && (
                        <motion.text
                            x={MIDT[0] + 10}
                            y={MIDT[1] + 22}
                            textAnchor="middle"
                            fontSize={72}
                            fontWeight={900}
                            fill="#ffffff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                        >
                            IS
                        </motion.text>
                    )}
                </g>
            </svg>

            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute right-[6%] top-[40%] rounded-2xl bg-white/95 shadow-lg px-5 py-3 text-2xl font-bold text-slate-800"
                >
                    Ulike grupper i landet
                </motion.div>
            )}

            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: beat === 2 ? 1 : 0.6, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="absolute right-[4%] top-[30%] rounded-2xl bg-white shadow-lg px-6 py-4"
                    style={{ width: '24%' }}
                >
                    <div className="text-2xl font-black text-slate-900">Plan for etterpå</div>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 mt-3">
                            <span className="w-7 h-7 rounded-md border-4 border-slate-400" />
                            <span className="flex-1 h-3 rounded-full bg-slate-200" />
                        </div>
                    ))}
                    <div className="mt-3 text-xl font-bold text-red-700">Tom</div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift.tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        overskrift.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {overskrift.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
