import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Norge, vinteren 1973. En vei og en bensinstasjon i snøen.
 * Beat 0: bilene kjører. Beat 1: kø ved pumpa. Beat 2: helgeforbudet fra 5. desember,
 * bilene forsvinner. Beat 3: en tom søndag, og snøen faller.
 */

const B = 1600;
const H = 900;
const VEI = 700;
const FARGER = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0f766e'];

function Bil({ farge }: { farge: string }) {
    return (
        <g>
            <rect x={-80} y={-60} width={160} height={46} rx={14} fill={farge} />
            <path d="M -48 -60 L -30 -98 L 34 -98 L 54 -60 Z" fill={farge} />
            <path d="M -36 -64 L -24 -90 L 0 -90 L 0 -64 Z M 8 -64 L 8 -90 L 30 -90 L 44 -64 Z" fill="#dbeafe" />
            <circle cx={-46} cy={-14} r={18} fill="#111827" />
            <circle cx={46} cy={-14} r={18} fill="#111827" />
        </g>
    );
}

function Stasjon() {
    return (
        <g>
            <rect x={1150} y={430} width={360} height={30} fill="#b91c1c" />
            <rect x={1170} y={460} width={14} height={240} fill="#64748b" />
            <rect x={1476} y={460} width={14} height={240} fill="#64748b" />
            <rect x={1290} y={560} width={70} height={140} rx={10} fill="#e2e8f0" stroke="#334155" strokeWidth={4} />
            <rect x={1302} y={576} width={46} height={30} fill="#0f172a" />
            <text x={1330} y={415} textAnchor="middle" fontSize={44} fontWeight={900} fill="#b91c1c">
                BENSIN
            </text>
        </g>
    );
}

function Sno() {
    const flak = useMemo(
        () =>
            Array.from({ length: 60 }, (_, i) => ({
                x: (i * 97) % B,
                d: 4 + (i % 5),
                r: 3 + (i % 3) * 2,
                f: (i % 7) * 0.5,
            })),
        []
    );
    return (
        <g>
            {flak.map((s, i) => (
                <motion.circle
                    key={i}
                    cx={s.x}
                    r={s.r}
                    fill="#ffffff"
                    initial={{ cy: -20 }}
                    animate={{ cy: H + 20 }}
                    transition={{ duration: s.d, repeat: Infinity, delay: s.f, ease: 'linear' }}
                />
            ))}
        </g>
    );
}

export function OljeHelg({ beat }: VisualProps) {
    const tom = beat >= 2;
    return (
        <div className="absolute inset-0 overflow-hidden">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="olje-helg-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#93c5fd" />
                        <stop offset="1" stopColor="#e0f2fe" />
                    </linearGradient>
                </defs>
                <rect width={B} height={H} fill="url(#olje-helg-himmel)" />
                <path d="M 0 520 Q 300 330 620 470 T 1200 420 T 1600 460 L 1600 900 L 0 900 Z" fill="#f8fafc" />
                <path d="M 0 560 Q 400 470 800 540 T 1600 520 L 1600 900 L 0 900 Z" fill="#e2e8f0" />
                {[180, 260, 900, 980].map((x) => (
                    <g key={x}>
                        <path d={`M ${x} 430 L ${x - 40} 560 L ${x + 40} 560 Z`} fill="#166534" />
                        <path d={`M ${x} 430 L ${x - 24} 480 L ${x + 24} 480 Z`} fill="#f8fafc" opacity={0.8} />
                    </g>
                ))}
                <rect x={0} y={VEI - 40} width={B} height={120} fill="#475569" />
                {Array.from({ length: 12 }, (_, i) => (
                    <rect key={i} x={i * 140 + 20} y={VEI + 16} width={80} height={10} fill="#f8fafc" />
                ))}
                <Stasjon />

                <AnimatePresence>
                    {beat === 0 &&
                        [0, 1, 2].map((i) => (
                            <motion.g
                                key={`kjor-${i}`}
                                initial={{ x: -200 - i * 500, y: VEI + 20 }}
                                animate={{ x: B + 200 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: i * 1.6 }}
                            >
                                <Bil farge={FARGER[i]} />
                            </motion.g>
                        ))}
                    {beat === 1 &&
                        FARGER.map((f, i) => (
                            <motion.g
                                key={`ko-${i}`}
                                initial={{ x: -200, y: VEI + 20 }}
                                animate={{ x: 1210 - i * 185 }}
                                exit={{ opacity: 0, y: VEI + 60 }}
                                transition={{ duration: 1.6, delay: i * 0.35, ease: 'easeOut' }}
                            >
                                <Bil farge={f} />
                            </motion.g>
                        ))}
                </AnimatePresence>

                {tom && (
                    <motion.g initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <rect x={548} y={420} width={16} height={240} fill="#64748b" />
                        <circle cx={556} cy={380} r={90} fill="#ffffff" stroke="#dc2626" strokeWidth={22} />
                        <g transform="translate(556 400) scale(0.55)">
                            <Bil farge="#0f172a" />
                        </g>
                        <line x1={490} y1={318} x2={622} y2={442} stroke="#dc2626" strokeWidth={18} />
                    </motion.g>
                )}
                {beat >= 3 && <Sno />}
            </svg>

            <AnimatePresence mode="wait">
                {beat <= 1 && (
                    <motion.div
                        key="norge"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {beat === 0 ? 'Norge, 1973' : 'Kø ved bensinstasjonen'}
                    </motion.div>
                )}
                {tom && (
                    <motion.div
                        key="forbud"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] right-[5%] w-72 rounded-2xl bg-white shadow-2xl overflow-hidden text-center"
                    >
                        <div className="bg-red-600 text-white font-display font-bold text-2xl py-2">
                            {beat === 2 ? '5. desember 1973' : 'Søndag'}
                        </div>
                        <div className="py-3 px-3 font-display font-bold text-2xl text-slate-900 leading-tight">
                            Forbudt å kjøre bil i helgene
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
