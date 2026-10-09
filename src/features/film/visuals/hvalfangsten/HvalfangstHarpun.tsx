import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Svend Foyn og granatharpunen, tegnet som et snitt i SVG: dampbåten «Spes & Fides»
 * kommer inn, et forstørret snitt viser granaten i spissen, og kanonen skyter harpunen
 * ut av bildet. Hvalen og harpunen møtes aldri i bildet.
 */

const B = 1600;
const H = 900;
const HAV = 640;

/** Liten dampbåt sett fra siden, med baugen mot høyre. */
function Dampbat({ rok }: { rok: number }) {
    return (
        <g>
            {/* Røyk fra skorsteinen */}
            {[0, 1, 2, 3].map((i) => {
                const f = (rok + i / 4) % 1;
                return (
                    <circle
                        key={i}
                        cx={-40 - f * 160}
                        cy={-170 - f * 90}
                        r={14 + f * 30}
                        fill="#64748b"
                        opacity={0.5 * (1 - f)}
                    />
                );
            })}
            <path d="M -170 -40 L 170 -40 L 210 -70 L 190 0 L -150 0 Z" fill="#1f2937" />
            <rect x={-170} y={-44} width={380} height={8} fill="#7c2d12" />
            <rect x={-60} y={-110} width={110} height={70} rx={6} fill="#f1f5f9" />
            <rect x={-48} y={-98} width={24} height={20} fill="#334155" />
            <rect x={-12} y={-98} width={24} height={20} fill="#334155" />
            <rect x={-40} y={-175} width={34} height={70} fill="#d9a43a" />
            <rect x={-40} y={-182} width={34} height={12} fill="#111827" />
            <line x1={110} y1={-40} x2={110} y2={-210} stroke="#111827" strokeWidth={6} />
            {/* Kanonen på baugen */}
            <g transform="translate(185 -78) rotate(-8)">
                <rect x={-26} y={-12} width={60} height={24} rx={8} fill="#111827" />
                <rect x={-34} y={-6} width={14} height={30} fill="#374151" />
            </g>
        </g>
    );
}

function Hval() {
    return (
        <path
            d="M 0 60 C 30 20 160 0 380 8 C 600 18 760 44 860 58 L 930 22 C 950 12 975 10 990 14 C 975 40 955 58 935 66 C 955 76 978 96 990 118 C 974 120 950 112 930 100 L 860 76 C 700 100 460 116 300 108 C 140 100 30 92 0 60 Z"
            fill="#334155"
        />
    );
}

export function HvalfangstHarpun({ beat, playing }: VisualProps) {
    // Røyken og bølgene går bare når filmen spilles.
    const [rok, setRok] = useState(0);
    useEffect(() => {
        if (!playing) return;
        const c = animate(0, 1, {
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            onUpdate: setRok,
        });
        return () => c.stop();
    }, [playing]);

    const batX = beat === 0 ? -400 : beat >= 3 ? 420 : 560;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-sky-100 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={HAV} width={B} height={H - HAV} fill="#3e5b73" />
                {[0, 1, 2].map((i) => (
                    <path
                        key={i}
                        d={`M ${-200 + ((rok * 200 + i * 70) % 200)} ${HAV + 30 + i * 60} q 50 -14 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0`}
                        fill="none"
                        stroke="#5d7d96"
                        strokeWidth={4}
                    />
                ))}

                {/* Hvalen under vannet, langt borte fra båten */}
                <AnimatePresence>
                    {beat === 2 && (
                        <motion.g
                            key="hval"
                            initial={{ opacity: 0, x: 1700 }}
                            animate={{ opacity: 0.9, x: 900 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 3, ease: 'easeOut' }}
                        >
                            <g transform={`translate(0 ${HAV + 70}) scale(0.62)`}>
                                <Hval />
                            </g>
                        </motion.g>
                    )}
                </AnimatePresence>

                <motion.g
                    initial={{ x: -400 }}
                    animate={{ x: batX }}
                    transition={{ duration: beat === 1 ? 3 : 1.5, ease: 'easeOut' }}
                >
                    <g transform={`translate(0 ${HAV + 6})`}>
                        <Dampbat rok={rok} />
                    </g>
                </motion.g>

                {/* Harpunen flyr ut av bildet fra kanonen */}
                {beat >= 4 && (
                    <motion.g
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: 1300, opacity: [1, 1, 0] }}
                        transition={{ duration: 1.2, delay: 0.8, ease: 'easeIn' }}
                    >
                        <g transform={`translate(${420 + 215} ${HAV - 76}) rotate(-8)`}>
                            <rect x={0} y={-4} width={110} height={8} fill="#111827" />
                            <path d="M 110 -14 L 150 0 L 110 14 Z" fill="#dc2626" />
                        </g>
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.circle
                        cx={420 + 225}
                        cy={HAV - 80}
                        initial={{ r: 0, opacity: 0 }}
                        animate={{ r: [0, 60, 90], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1, delay: 0.8 }}
                        fill="#e2e8f0"
                    />
                )}
            </svg>

            {/* Kort om Foyn */}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="foyn"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[14%] left-1/2 -translate-x-1/2 px-10 py-6 rounded-3xl bg-white/95 shadow-2xl text-center"
                    >
                        <div className="text-5xl md:text-7xl font-black text-slate-900">
                            Svend Foyn
                        </div>
                        <div className="mt-2 text-2xl md:text-3xl font-semibold text-slate-500">
                            født i Tønsberg, 1809
                        </div>
                    </motion.div>
                )}
                {(beat === 1 || beat === 2) && (
                    <motion.div
                        key={`b${beat}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[9%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {beat === 1 ? '«Spes & Fides», 1863: dampmaskin' : 'Trengte et bedre våpen'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Forstørret snitt av harpunspissen */}
            <AnimatePresence>
                {beat === 3 && (
                    <motion.div
                        key="snitt"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute top-[6%] right-[4%] w-[52%] rounded-3xl bg-white/95 shadow-2xl p-4"
                    >
                        <div className="text-2xl md:text-3xl font-black text-slate-900 text-center">
                            Granatharpunen
                        </div>
                        <svg viewBox="0 0 800 220" className="w-full">
                            <rect x={20} y={100} width={420} height={20} fill="#475569" />
                            <path
                                d="M 440 70 L 640 70 L 760 110 L 640 150 L 440 150 Z"
                                fill="#cbd5e1"
                                stroke="#334155"
                                strokeWidth={4}
                            />
                            <motion.ellipse
                                cx={580}
                                cy={110}
                                rx={60}
                                ry={28}
                                fill="#dc2626"
                                initial={{ opacity: 0.4 }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.4, repeat: playing ? Infinity : 0 }}
                            />
                            <text
                                x={580}
                                y={190}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#b91c1c"
                            >
                                granat = en liten bombe
                            </text>
                            <text
                                x={220}
                                y={80}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={700}
                                fill="#475569"
                            >
                                Foyn og presten Hans Esmark
                            </text>
                        </svg>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="absolute top-[10%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    >
                        <div className="text-5xl md:text-6xl font-black text-slate-900 tabular-nums">
                            <TelleTall verdi={30} forsinkelse={1.8} /> hval
                        </div>
                        <div className="text-lg md:text-2xl font-semibold text-slate-500">
                            på én sesong, 1868
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
