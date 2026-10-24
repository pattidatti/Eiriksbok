import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Konkurransetilsynet som dommer på en fotballbane sett ovenfra. Lagene er bedriftene. To
 * store som vil slå seg sammen, får fløyta. Til slutt håndhilser lagene for å la være å
 * kjempe, og dommeren viser rødt kort.
 */

const OVERSKRIFT = [
    'Staten har et eget kontor',
    'Konkurransetilsynet',
    'To store vil slå seg sammen',
    'Dommeren passer på at ingen jukser',
    'Lov å kjempe. Ikke lov å avtale å la være.',
];

const ROD = ['#dc2626', '#dc2626', '#dc2626'];
const BLA = ['#2563eb', '#2563eb', '#2563eb'];

/** Hvor spillerne står per beat: [x, y] i SVG-koordinater. */
function spillere(beat: number) {
    if (beat === 2)
        return {
            rod: [
                [700, 450],
                [520, 300],
                [520, 600],
            ],
            bla: [
                [900, 450],
                [1080, 300],
                [1080, 600],
            ],
        };
    if (beat >= 4)
        return {
            rod: [
                [760, 450],
                [740, 330],
                [740, 570],
            ],
            bla: [
                [840, 450],
                [860, 330],
                [860, 570],
            ],
        };
    return {
        rod: [
            [520, 450],
            [420, 300],
            [430, 620],
        ],
        bla: [
            [1080, 450],
            [1180, 300],
            [1170, 620],
        ],
    };
}

function Spiller({ x, y, farge, stor }: { x: number; y: number; farge: string; stor?: boolean }) {
    return (
        <motion.g initial={false} animate={{ x, y }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <circle r={stor ? 52 : 36} fill={farge} stroke="#fff" strokeWidth={6} />
        </motion.g>
    );
}

export function MonopolDommer({ beat, playing }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const p = spillere(beat);
    const dommerX = 800;
    const dommerY = beat === 2 ? 280 : beat >= 4 ? 240 : 450;
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#14532d]">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Banen */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <rect key={i} x={i * 200} y={0} width={200} height={900} fill={i % 2 ? '#15803d' : '#16a34a'} />
                ))}
                <rect x={180} y={170} width={1240} height={600} fill="none" stroke="#f0fdf4" strokeWidth={6} />
                <line x1={800} y1={170} x2={800} y2={770} stroke="#f0fdf4" strokeWidth={6} />
                <circle cx={800} cy={470} r={90} fill="none" stroke="#f0fdf4" strokeWidth={6} />
                <rect x={180} y={370} width={90} height={200} fill="none" stroke="#f0fdf4" strokeWidth={6} />
                <rect x={1330} y={370} width={90} height={200} fill="none" stroke="#f0fdf4" strokeWidth={6} />
                {/* Lagene: bedriftene */}
                {p.rod.map(([x, y], i) => (
                    <Spiller key={`r${i}`} x={x} y={y + 20} farge={ROD[i]} stor={beat === 2 && i === 0} />
                ))}
                {p.bla.map(([x, y], i) => (
                    <Spiller key={`b${i}`} x={x} y={y + 20} farge={BLA[i]} stor={beat === 2 && i === 0} />
                ))}
                {/* Dommeren */}
                <motion.g initial={false} animate={{ x: dommerX, y: dommerY + 20 }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
                    <circle r={34} fill="#facc15" stroke="#0f172a" strokeWidth={8} />
                    <rect x={-8} y={-8} width={16} height={16} fill="#0f172a" />
                </motion.g>
                {beat === 2 && (
                    <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 }} style={{ originX: '800px', originY: '470px' }}>
                        <line x1={740} y1={410} x2={860} y2={530} stroke="#fff" strokeWidth={18} strokeLinecap="round" />
                        <line x1={860} y1={410} x2={740} y2={530} stroke="#fff" strokeWidth={18} strokeLinecap="round" />
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g
                        initial={{ opacity: 0, y: 20 }}
                        animate={playing ? { opacity: 1, y: 0, rotate: [-4, 4, -4] } : { opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, rotate: { duration: 0.8, repeat: Infinity } }}
                        style={{ originX: '1000px', originY: '355px' }}
                    >
                        <rect x={960} y={300} width={80} height={110} rx={8} fill="#ef4444" stroke="#fff" strokeWidth={5} />
                    </motion.g>
                )}
            </svg>
            {/* Merkelapper som DOM over banen */}
            {beat === 0 && (
                <div className="absolute left-1/2 top-[38%] translate-x-[18%] px-3 py-1 rounded-xl bg-yellow-400 text-slate-900 text-xl font-bold shadow whitespace-nowrap">
                    Dommeren: Konkurransetilsynet
                </div>
            )}
            {beat <= 1 && (
                <>
                    <div className="absolute left-[18%] bottom-[9%] px-3 py-1 rounded-xl bg-red-600 text-white text-xl font-bold shadow whitespace-nowrap">
                        Bedrift 1
                    </div>
                    <div className="absolute right-[18%] bottom-[9%] px-3 py-1 rounded-xl bg-blue-600 text-white text-xl font-bold shadow whitespace-nowrap">
                        Bedrift 2
                    </div>
                </>
            )}
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute left-1/2 top-[22%] -translate-x-1/2 px-6 py-4 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-2xl font-semibold text-slate-600">Opprettet i</div>
                    <div className="text-5xl font-black text-slate-900">1994</div>
                    <div className="text-2xl font-semibold text-slate-600 mt-2">i Bergen siden 2006</div>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="absolute left-1/2 bottom-[7%] -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-red-700 whitespace-nowrap"
                >
                    Stopp: det gir for lite konkurranse
                </motion.div>
            )}
            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute left-1/2 bottom-[7%] -translate-x-1/2 flex gap-4"
                >
                    <div className="px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-500 whitespace-nowrap line-through">
                        bestemmer hvem som vinner
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-teal-700 whitespace-nowrap">
                        passer på at ingen jukser
                    </div>
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute left-1/2 bottom-[7%] -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-red-700 whitespace-nowrap"
                >
                    Avtale om å la være å kjempe: rødt kort
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
