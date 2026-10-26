import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvem er arbeidsledig? Fire personer uten jobb. Kravene kommer opp, og én etter én faller de
 * bort som ikke teller: pensjonisten, den som ikke vil ha jobb og den som er for syk. Igjen
 * står den som leter.
 */

type Hvem = 'pensjonist' | 'syk' | 'vilIkke' | 'leter';

const FOLK: { id: Hvem; x: number; navn: string; ut: number }[] = [
    { id: 'pensjonist', x: 260, navn: 'Pensjonist', ut: 2 },
    { id: 'vilIkke', x: 620, navn: 'Vil ikke ha jobb', ut: 2 },
    { id: 'syk', x: 980, navn: 'For syk til å jobbe', ut: 3 },
    { id: 'leter', x: 1340, navn: 'Leter etter jobb', ut: 99 },
];

const OVERSKRIFT = ['Fire personer uten jobb', 'Tre krav', 'Ikke arbeidsledige', 'Bare den som leter, teller'];
const KRAV = ['Gammel nok til å jobbe', 'Uten jobb', 'Leter aktivt etter jobb'];

const Y = 470;

function Figur({ id, farge }: { id: Hvem; farge: string }) {
    return (
        <g>
            {/* Ting som forteller hvem det er */}
            {id === 'pensjonist' && (
                <g stroke="#78350f" strokeWidth={10} strokeLinecap="round" fill="none">
                    <path d={`M 70 ${Y - 40} L 70 ${Y + 150} M 70 ${Y - 40} Q 70 ${Y - 70} 45 ${Y - 62}`} />
                </g>
            )}
            {id === 'syk' && (
                <g>
                    <rect x={-120} y={Y + 110} width={240} height={50} rx={16} fill="#bfdbfe" />
                    <rect x={48} y={Y - 175} width={14} height={60} rx={7} fill="#fff" stroke="#475569" strokeWidth={3} />
                    <circle cx={55} cy={Y - 112} r={11} fill="#dc2626" />
                </g>
            )}
            {id === 'vilIkke' && (
                <g>
                    <rect x={-130} y={Y + 40} width={260} height={110} rx={24} fill="#a78bfa" />
                    <rect x={-150} y={Y + 20} width={40} height={130} rx={16} fill="#8b5cf6" />
                    <rect x={110} y={Y + 20} width={40} height={130} rx={16} fill="#8b5cf6" />
                </g>
            )}
            {id === 'leter' && (
                <g>
                    <rect x={-150} y={Y - 10} width={80} height={100} rx={6} fill="#fff" stroke="#94a3b8" strokeWidth={3} />
                    {[0, 1, 2, 3].map((i) => (
                        <rect key={i} x={-140} y={Y + 6 + i * 20} width={i % 2 ? 40 : 60} height={8} rx={4} fill="#cbd5e1" />
                    ))}
                    <circle cx={80} cy={Y - 10} r={32} fill="#e0f2fe" stroke="#0f172a" strokeWidth={9} />
                    <path d={`M 102 ${Y + 12} L 140 ${Y + 52}`} stroke="#0f172a" strokeWidth={12} strokeLinecap="round" />
                </g>
            )}
            {/* Kropp og hode */}
            <rect x={-55} y={Y - 60} width={110} height={190} rx={50} fill={farge} />
            <circle cx={0} cy={Y - 115} r={46} fill="#e8b48c" />
            {id === 'pensjonist' && <path d={`M -44 ${Y - 128} Q 0 ${Y - 182} 44 ${Y - 128}`} fill="#e5e7eb" />}
        </g>
    );
}

export function ArbeidsledighetHvem({ beat }: VisualProps) {
    const tittel = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={92}
                    textAnchor="middle"
                    fontSize={62}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>

            {/* Kravene */}
            {beat >= 1 &&
                KRAV.map((k, i) => {
                    const b = 460;
                    const x = 800 + (i - 1) * (b + 30);
                    return (
                        <motion.g
                            key={k}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 1 ? 0.3 + i * 0.8 : 0 }}
                        >
                            <rect x={x - b / 2} y={140} width={b} height={74} rx={20} fill="#ffffff" stroke="#0d9488" strokeWidth={4} />
                            <text x={x} y={188} textAnchor="middle" fontSize={30} fontWeight={700} fill="#0f766e">
                                {`${i + 1}. ${k}`}
                            </text>
                        </motion.g>
                    );
                })}

            {FOLK.map((f, i) => {
                const ute = beat >= f.ut;
                const vinner = f.id === 'leter' && beat >= 1;
                return (
                    <motion.g
                        key={f.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: ute ? 0.28 : 1 }}
                        transition={{ duration: 0.7, delay: beat === 0 ? i * 0.35 : 0 }}
                    >
                        <g transform={`translate(${f.x} 0)`}>
                            {vinner && (
                                <motion.circle
                                    cx={0}
                                    cy={Y - 10}
                                    r={185}
                                    fill="none"
                                    stroke="#0d9488"
                                    strokeWidth={8}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1 }}
                                />
                            )}
                            <Figur id={f.id} farge={f.id === 'leter' ? '#0d9488' : '#64748b'} />
                            <text x={0} y={Y + 225} textAnchor="middle" fontSize={36} fontWeight={700} fill="#1e293b">
                                {f.navn}
                            </text>
                        </g>
                    </motion.g>
                );
            })}

            {/* Stempler */}
            {FOLK.filter((f) => beat >= f.ut).map((f) => (
                <motion.g
                    key={`stempel-${f.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    transform={`translate(${f.x} ${Y - 20}) rotate(-12)`}
                >
                    <rect x={-150} y={-40} width={300} height={80} rx={14} fill="#ffffff" stroke="#dc2626" strokeWidth={6} />
                    <text x={0} y={16} textAnchor="middle" fontSize={40} fontWeight={900} fill="#dc2626">
                        IKKE LEDIG
                    </text>
                </motion.g>
            ))}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    transform={`translate(1340 ${Y + 300})`}
                >
                    <rect x={-190} y={-42} width={380} height={76} rx={18} fill="#0d9488" />
                    <text x={0} y={12} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                        ARBEIDSLEDIG
                    </text>
                </motion.g>
            )}
        </svg>
    );
}
