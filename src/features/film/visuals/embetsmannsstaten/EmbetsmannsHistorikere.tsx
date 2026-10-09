import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, EMBETSMANN, KONGE, ROD } from './farger';
import { Figur } from './figurer';

/**
 * To historikere, to svar. Seip til venstre, Sejersted til høyre, og en måler under som
 * flytter seg etter det stemmen sier, til den ender midt imellom.
 */

const MALER: Record<number, number> = { 0: 800, 1: 420, 2: 1180, 3: 640, 4: 800 };

function Historiker({
    x,
    navn,
    ord,
    forklaring,
    farge,
    aktiv,
    vist,
}: {
    x: number;
    navn: string;
    ord: string;
    forklaring: string;
    farge: string;
    aktiv: boolean;
    vist: boolean;
}) {
    return (
        <motion.g initial={false} animate={{ opacity: aktiv ? 1 : 0.55 }} transition={{ duration: 0.5 }}>
            <rect x={x - 330} y={130} width={660} height={440} rx={30} fill="#fff" stroke={aktiv ? farge : '#e2e8f0'} strokeWidth={aktiv ? 8 : 4} />
            <g transform={`translate(${x - 200} 480) scale(0.8)`}>
                <Figur type="borger" farge="#334155" />
            </g>
            <text x={x - 200} y={540} textAnchor="middle" fontSize={28} fontWeight={900} fill={BLEKK}>
                {navn}
            </text>
            <AnimatePresence>
                {vist && (
                    <motion.g initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
                        <text x={x + 120} y={250} textAnchor="middle" fontSize={38} fontWeight={900} fill={farge}>
                            {ord}
                        </text>
                        {forklaring.split('\n').map((l, i) => (
                            <text key={i} x={x + 110} y={330 + i * 46} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">
                                {l}
                            </text>
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
        </motion.g>
    );
}

export function EmbetsmannsHistorikere({ beat }: VisualProps) {
    const mx = MALER[Math.min(beat, 4)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={800} y={90} textAnchor="middle" fontSize={54} fontWeight={900} fill={BLEKK}>
                    Var embetsmennene skurker?
                </text>
                <Historiker
                    x={420}
                    navn="Jens Arup Seip"
                    ord="Embetsmannsstaten"
                    forklaring={'Holdt motstanderne\nnede for å beholde\nmakta'}
                    farge={ROD}
                    aktiv={beat === 1 || beat === 0}
                    vist={beat >= 1}
                />
                <Historiker
                    x={1180}
                    navn="Francis Sejersted"
                    ord="Rettsstat"
                    forklaring={'Fulgte lover og regler.\nPrøvde å være\nrettferdige'}
                    farge={BONDE}
                    aktiv={beat === 2 || beat === 0}
                    vist={beat >= 2}
                />

                {/* Måleren */}
                <line x1={260} y1={760} x2={1340} y2={760} stroke="#cbd5e1" strokeWidth={14} strokeLinecap="round" />
                <line x1={260} y1={760} x2={800} y2={760} stroke={ROD} strokeOpacity={0.3} strokeWidth={14} strokeLinecap="round" />
                <line x1={800} y1={760} x2={1340} y2={760} stroke={BONDE} strokeOpacity={0.3} strokeWidth={14} strokeLinecap="round" />
                <text x={260} y={830} textAnchor="middle" fontSize={30} fontWeight={800} fill={ROD}>
                    for seg selv
                </text>
                <text x={1340} y={830} textAnchor="middle" fontSize={30} fontWeight={800} fill={BONDE}>
                    for alle
                </text>
                <motion.g initial={false} animate={{ x: mx }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
                    <circle cx={0} cy={760} r={34} fill={EMBETSMANN} stroke="#fff" strokeWidth={6} />
                    <text x={0} y={771} textAnchor="middle" fontSize={32} fontWeight={900} fill="#fff">
                        {beat === 0 ? '?' : ''}
                    </text>
                </motion.g>

                <AnimatePresence>
                    {beat === 3 && (
                        <motion.g key="juks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <rect x={340} y={600} width={920} height={96} rx={48} fill={KONGE} />
                            <circle cx={395} cy={648} r={30} fill="#fde68a" stroke="#a16207" strokeWidth={6} />
                            <text x={850} y={660} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                Mange jukset med penger fram til 1850-årene
                            </text>
                        </motion.g>
                    )}
                    {beat >= 4 && (
                        <motion.g key="midt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.8 }}>
                            <rect x={520} y={600} width={560} height={96} rx={48} fill={EMBETSMANN} />
                            <text x={800} y={662} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                                Midt imellom?
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
