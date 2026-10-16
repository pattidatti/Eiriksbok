import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Vestens dilemma som en skålvekt. Til høyre: demokrati og menneskerettigheter.
 * Til venstre fylles skåla med oljefat og penger, og vekta tipper over.
 * Beat 0: vekta i balanse. Beat 1: kongen styrer, ingen frie valg. Beat 2: en viktig venn.
 * Beat 3: olje og penger tynger. Beat 4: spørsmålet.
 */

const B = 1600;
const H = 900;
const MIDT = 800;
const AKSE = 300;
const ARM = 470;

function vinkelFor(beat: number) {
    return beat >= 3 ? -14 : 0;
}

function Skal({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <line x1={0} y1={0} x2={-150} y2={200} stroke="#475569" strokeWidth={5} />
            <line x1={0} y1={0} x2={150} y2={200} stroke="#475569" strokeWidth={5} />
            <path d="M -190 200 L 190 200 Q 150 270 0 270 Q -150 270 -190 200 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={5} />
            {children}
        </g>
    );
}

function Fat({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: y - 200 }}
            animate={{ opacity: 1, y }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 140, damping: 14 }}
        >
            <rect x={x - 38} y={-70} width={76} height={70} rx={8} fill="#1f2937" />
            <rect x={x - 38} y={-52} width={76} height={7} fill="#f59e0b" />
            <rect x={x - 38} y={-24} width={76} height={7} fill="#f59e0b" />
        </motion.g>
    );
}

export function OljeVekt({ beat }: VisualProps) {
    const [vinkel, setVinkel] = useState(vinkelFor(beat));
    const naa = useRef(vinkel);
    useEffect(() => {
        const c = animate(naa.current, vinkelFor(beat), {
            duration: 2.2,
            ease: 'easeInOut',
            onUpdate: (x) => {
                naa.current = x;
                setVinkel(x);
            },
        });
        return () => c.stop();
    }, [beat]);

    const rad = (vinkel * Math.PI) / 180;
    const venstre: [number, number] = [MIDT - Math.cos(rad) * ARM, AKSE - Math.sin(rad) * ARM];
    const hoyre: [number, number] = [MIDT + Math.cos(rad) * ARM, AKSE + Math.sin(rad) * ARM];

    return (
        <div className="absolute inset-0 bg-slate-100">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <path d={`M ${MIDT - 140} 860 L ${MIDT + 140} 860 L ${MIDT + 30} 820 L ${MIDT - 30} 820 Z`} fill="#334155" />
                <rect x={MIDT - 14} y={AKSE} width={28} height={520} fill="#334155" />
                <line
                    x1={venstre[0]}
                    y1={venstre[1]}
                    x2={hoyre[0]}
                    y2={hoyre[1]}
                    stroke="#334155"
                    strokeWidth={22}
                    strokeLinecap="round"
                />
                <circle cx={MIDT} cy={AKSE} r={26} fill="#f59e0b" stroke="#334155" strokeWidth={6} />

                <Skal x={venstre[0]} y={venstre[1]}>
                    {beat >= 3 && (
                        <>
                            <Fat x={-90} y={200} forsinkelse={0} />
                            <Fat x={0} y={200} forsinkelse={0.25} />
                            <Fat x={90} y={200} forsinkelse={0.5} />
                            <Fat x={-45} y={130} forsinkelse={0.75} />
                            <Fat x={45} y={130} forsinkelse={1} />
                        </>
                    )}
                    <text y={330} textAnchor="middle" fontSize={48} fontWeight={800} fill="#92400e">
                        Olje og penger
                    </text>
                </Skal>
                <Skal x={hoyre[0]} y={hoyre[1]}>
                    <g transform="translate(0 150)">
                        <rect x={-62} y={-10} width={124} height={50} rx={6} fill="#ffffff" stroke="#1d4ed8" strokeWidth={5} />
                        <rect x={-14} y={-30} width={28} height={24} fill="#1d4ed8" />
                        <text y={28} textAnchor="middle" fontSize={26} fontWeight={800} fill="#1d4ed8">
                            VALG
                        </text>
                        {beat >= 1 && (
                            <motion.path
                                d="M -70 -40 L 70 50 M 70 -40 L -70 50"
                                stroke="#dc2626"
                                strokeWidth={6}
                                opacity={0.85}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            />
                        )}
                    </g>
                    <text y={330} textAnchor="middle" fontSize={42} fontWeight={800} fill="#1d4ed8">
                        Demokrati og
                    </text>
                    <text y={380} textAnchor="middle" fontSize={42} fontWeight={800} fill="#1d4ed8">
                        menneskerettigheter
                    </text>
                </Skal>
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-display font-bold text-3xl shadow-xl whitespace-nowrap ${
                        beat === 4 ? 'bg-slate-900 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {
                        [
                            'Et vanskelig valg',
                            'Saudi-Arabia: kongen styrer, ingen frie valg',
                            'Likevel: en av Vestens viktigste venner',
                            'Ingen vil miste oljen og pengene',
                            'Hva veier tyngst?',
                        ][Math.min(beat, 4)]
                    }
                </motion.div>
            </AnimatePresence>
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute left-1/2 -translate-x-1/2 top-[15%]"
                    aria-hidden
                >
                    <svg viewBox="0 0 120 90" className="w-32">
                        <path d="M 10 80 L 10 25 L 35 50 L 60 10 L 85 50 L 110 25 L 110 80 Z" fill="#eab308" stroke="#713f12" strokeWidth={5} />
                    </svg>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 top-[20%] flex gap-4"
                >
                    <div className="px-4 py-2 rounded-xl bg-blue-700 text-white font-display font-bold text-2xl shadow">
                        Vesten
                    </div>
                    <div className="px-2 py-2 font-display font-bold text-3xl text-slate-700">+</div>
                    <div className="px-4 py-2 rounded-xl bg-green-700 text-white font-display font-bold text-2xl shadow">
                        Saudi-Arabia
                    </div>
                </motion.div>
            )}
        </div>
    );
}
