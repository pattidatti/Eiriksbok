import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Statuen av Hans Egede på høyden over Nuuk: rødmalt, tagget, halshugget, stemt over,
 * feiret i 1971 og ikke feiret i 2021. Statuen står til høyre, forklaringene til venstre.
 */

const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const GULL = '#b45309';
const STEIN = '#57606a';

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Kort[][] = [
    [{ tekst: 'Nuuk i dag' }, { tekst: 'Hans Egede på en høyde over byen', farge: STEIN }],
    [{ tekst: 'Rødmalt og tagget' }, { tekst: 'avkoloniser: gjøre seg fri fra kolonimakten', farge: ROD }],
    [{ tekst: 'Halshugget' }, { tekst: 'Skal statuen fjernes?', farge: GULL }, { tekst: 'Få stemte. Flertallet: la den stå', farge: BLA }],
    [{ tekst: '1971' }, { tekst: '250 år siden Egede kom', farge: ROD }, { tekst: 'Fest, og dronningen på besøk', farge: ROD }],
    [{ tekst: '2021' }, { tekst: '300 år siden Egede kom', farge: STEIN }, { tekst: 'Ingen feiring', farge: STEIN }],
    [{ tekst: 'Synet har endret seg' }, { tekst: 'Før: takknemlige for kristendommen', farge: BLA }, { tekst: 'I dag: hva kostet det?', farge: ROD }],
];

const HUS = ['#b91c1c', '#facc15', '#1d4ed8', '#15803d', '#f97316', '#b91c1c', '#0e7490', '#facc15', '#7c3aed', '#15803d'];

/** Statuens midtlinje og sokkeltopp. */
const SX = 1230;
const SY = 470;

export function EgedeStatuen({ beat }: VisualProps) {
    const b = Math.min(beat, KORT.length - 1);
    const malt = b >= 1 && b !== 3;
    const utenHode = b === 2;
    const fest = b === 3;
    const gratt = b === 4;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: fest ? '#bfdbf3' : gratt ? '#cfd6dd' : '#dbe5ee' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Fjell, hav og byen nedenfor */}
                <path d="M 0 560 L 160 430 L 330 520 L 520 380 L 700 500 L 880 400 L 1060 500 L 1240 360 L 1420 470 L 1600 400 L 1600 900 L 0 900 Z" fill="#94a3b8" />
                <path d="M 360 460 L 520 380 L 600 430 Z M 1160 420 L 1240 360 L 1300 405 Z" fill="#f1f5f9" />
                <path d="M 0 640 L 1600 640 L 1600 900 L 0 900 Z" fill="#3f6f99" />
                <path d="M 0 700 Q 400 670 900 700 L 900 900 L 0 900 Z" fill="#7c8a6a" />
                {HUS.map((farge, i) => {
                    const x = 70 + i * 78;
                    const y = 700 + (i % 3) * 26;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={52} height={38} fill={farge} />
                            <path d={`M ${x - 5} ${y} L ${x + 26} ${y - 24} L ${x + 57} ${y} Z`} fill="#334155" />
                            <rect x={x + 18} y={y + 12} width={14} height={14} fill="#fef3c7" />
                        </g>
                    );
                })}
                {/* Høyden */}
                <path d="M 880 900 Q 1000 640 1230 620 Q 1460 640 1600 760 L 1600 900 Z" fill="#6b7a5a" />

                {/* Sokkel */}
                <rect x={SX - 110} y={SY} width={220} height={160} fill="#a8a29e" stroke="#78716c" strokeWidth={5} />
                <AnimatePresence>
                    {malt && (
                        <motion.text
                            key="tag"
                            x={SX}
                            y={SY + 92}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill={ROD}
                            transform={`rotate(-6 ${SX} ${SY + 92})`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            avkoloniser
                        </motion.text>
                    )}
                </AnimatePresence>

                {/* Statuen: prest i lang kjole med en stav */}
                <path d={`M ${SX - 70} ${SY} L ${SX - 48} ${SY - 250} Q ${SX} ${SY - 280} ${SX + 48} ${SY - 250} L ${SX + 70} ${SY} Z`} fill={STEIN} />
                <path d={`M ${SX + 70} ${SY} L ${SX + 92} ${SY - 320}`} stroke={STEIN} strokeWidth={14} strokeLinecap="round" />
                <motion.path
                    d={`M ${SX - 70} ${SY} L ${SX - 48} ${SY - 250} Q ${SX} ${SY - 280} ${SX + 48} ${SY - 250} L ${SX + 70} ${SY} Z`}
                    fill={ROD}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: malt ? 0.8 : 0 }}
                    transition={{ duration: 1 }}
                />
                <motion.g
                    animate={utenHode ? { x: -150, y: 500, rotate: -80 } : { x: 0, y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, delay: utenHode ? 0.6 : 0 }}
                    style={{ transformOrigin: `${SX}px ${SY - 305}px` }}
                >
                    <circle cx={SX} cy={SY - 305} r={40} fill={STEIN} />
                    <motion.circle cx={SX} cy={SY - 305} r={40} fill={ROD} animate={{ opacity: malt ? 0.8 : 0 }} transition={{ duration: 1 }} />
                </motion.g>

                {/* 1971: flagg og fest */}
                <AnimatePresence>
                    {fest && (
                        <motion.g key="fest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {[0, 1].map((rad) => (
                                <g key={rad}>
                                    <path d={`M 940 ${110 + rad * 60} Q 1230 ${210 + rad * 60} 1540 ${110 + rad * 60}`} fill="none" stroke="#78716c" strokeWidth={3} />
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                                        const t = (i + 0.5) / 8;
                                        const x = 940 + t * 600;
                                        const y = 110 + rad * 60 + Math.sin(t * Math.PI) * 50;
                                        return (
                                            <g key={i} transform={`translate(${x} ${y})`}>
                                                <rect x={-22} y={0} width={44} height={30} fill="#c8102e" />
                                                <rect x={-10} y={0} width={7} height={30} fill="#ffffff" />
                                                <rect x={-22} y={12} width={44} height={7} fill="#ffffff" />
                                            </g>
                                        );
                                    })}
                                </g>
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Avstemningen: en stemmeurne */}
                <AnimatePresence>
                    {b === 2 && (
                        <motion.g key="urne" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 1.6 }}>
                            <rect x={1400} y={300} width={150} height={130} rx={10} fill="#ffffff" stroke={BLA} strokeWidth={6} />
                            <rect x={1440} y={292} width={70} height={14} rx={4} fill={BLA} />
                            <path d="M 1450 360 L 1470 385 L 1505 340" stroke={BLA} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>

            <div className="absolute left-[4%] top-[8%] w-[40%] flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                    {KORT[b].map((k, i) => (
                        <motion.div
                            key={`${b}-${k.tekst}`}
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: i * 0.5, type: 'spring', stiffness: 160, damping: 20 }}
                            className={
                                i === 0
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-2xl md:text-4xl shadow-xl self-start'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-xl md:text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : undefined}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
