import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Snitt gjennom smeltehytta: huset med skorsteinen, ovnen i midten, malm og trekull som
 * fylles på, og varmen som skiller kobberet fra steinen. Til slutt renner slagg ut på den
 * ene siden og kobber på den andre.
 */

const OVERSKRIFT = ['1646: den første smeltehytta', 'Hjertet i verket', 'Malm og trekull i ovnen', 'Slagg og kobber'];

export function RorosHytta({ beat, playing }: VisualProps) {
    const varme = beat >= 2;
    const zoom = beat >= 1 ? 1.35 : 1;
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#cfd9e3]">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <defs>
                    <radialGradient id="roros-hytta-glod">
                        <stop offset="0%" stopColor="#fff1b8" />
                        <stop offset="40%" stopColor="#ff9a2e" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#ff6a00" stopOpacity={0} />
                    </radialGradient>
                </defs>
                <rect x={0} y={760} width={1600} height={140} fill="#d9dde0" />
                <motion.g
                    animate={{ scale: zoom, y: beat >= 1 ? -60 : 0 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{ originX: '800px', originY: '560px' }}
                >
                    {/* Huset i snitt: vegger, tak og skorstein */}
                    <path d="M 330 760 L 330 420 L 800 250 L 1270 420 L 1270 760" fill="#efe6d8" stroke="#3b2a20" strokeWidth={14} />
                    <rect x={700} y={140} width={130} height={260} fill="#78716c" stroke="#3b2a20" strokeWidth={8} />
                    {/* Røyk */}
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={765}
                            cy={120}
                            r={34}
                            fill="#8b9097"
                            opacity={0.55}
                            animate={playing ? { cy: [120, -40], cx: [765, 640], r: [30, 80], opacity: [0.6, 0] } : {}}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 1.3 }}
                        />
                    ))}
                    {/* Ovnen */}
                    <path d="M 680 760 L 680 470 L 720 400 L 840 400 L 880 470 L 880 760 Z" fill="#57534e" stroke="#292524" strokeWidth={10} />
                    <rect x={720} y={470} width={120} height={230} fill="#1c1917" />
                    <motion.circle
                        cx={780}
                        cy={600}
                        fill="url(#roros-hytta-glod)"
                        animate={
                            beat === 1 && playing
                                ? { r: [90, 120, 90, 90] }
                                : { r: varme ? 160 : 70 }
                        }
                        transition={beat === 1 ? { duration: 1.1, repeat: Infinity } : { duration: 1.5 }}
                    />
                    {/* Lag av malm og trekull som fylles på ovenfra */}
                    {beat >= 2 &&
                        [0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.polygon
                                key={i}
                                points="0,-14 14,-4 10,12 -10,12 -14,-2"
                                fill={i % 2 ? '#1c1917' : '#8a4b2a'}
                                stroke="#fbbf24"
                                strokeWidth={1.5}
                                initial={{ x: 760 + (i % 3) * 20, y: 380, opacity: 0 }}
                                animate={{ x: 745 + (i % 3) * 30, y: 520 + Math.floor(i / 3) * 30, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.3 + i * 0.35 }}
                            />
                        ))}
                    {/* Det som renner ut */}
                    {beat >= 3 && (
                        <>
                            <motion.path
                                d="M 680 720 Q 600 730 540 760"
                                stroke="#1c1917"
                                strokeWidth={22}
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2 }}
                            />
                            <motion.path
                                d="M 470 762 Q 520 700 580 762 Z"
                                fill="#1c1917"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1 }}
                                style={{ originX: '525px', originY: '762px' }}
                            />
                            <motion.path
                                d="M 880 720 Q 960 730 1020 760"
                                stroke="#f59e0b"
                                strokeWidth={22}
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, delay: 1.6 }}
                            />
                            <motion.rect
                                x={990}
                                y={738}
                                width={110}
                                height={24}
                                rx={6}
                                fill="#c2410c"
                                stroke="#fdba74"
                                strokeWidth={4}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.6 }}
                            />
                        </>
                    )}
                </motion.g>
            </svg>
            {beat >= 3 && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="absolute left-[8%] bottom-[16%] px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-900"
                    >
                        Slagg: restene av steinen
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.6 }}
                        className="absolute right-[8%] bottom-[16%] px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-[#9a3412]"
                    >
                        Kobber
                    </motion.div>
                </>
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
