import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, PAPIR, ROD } from './farger';
import { Figur, Lapp } from './figurer';

/**
 * John Neergaard og Ola-boka: boka, budskapet, manntallet som vokser, og embetsmennene
 * som sørger for at han ikke blir kalt inn som reserve i 1830.
 */

function Bok() {
    return (
        <motion.g
            initial={{ opacity: 0, y: 30, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 0.8 }}
            style={{ transformOrigin: '360px 460px' }}
        >
            <rect x={190} y={190} width={340} height={470} rx={14} fill="#14532d" />
            <rect x={190} y={190} width={36} height={470} rx={8} fill="#0f3d21" />
            <rect x={250} y={250} width={240} height={4} fill="#facc15" />
            <text x={370} y={350} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fef9c3">
                Ola-
            </text>
            <text x={370} y={420} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fef9c3">
                boka
            </text>
            <rect x={250} y={460} width={240} height={4} fill="#facc15" />
            <text x={370} y={590} textAnchor="middle" fontSize={28} fontWeight={700} fill="#bbf7d0">
                John Neergaard
            </text>
        </motion.g>
    );
}

const RADER = 8;

function Manntall({ beat }: { beat: number }) {
    return (
        <motion.g key="manntall" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <rect x={900} y={150} width={560} height={640} rx={10} fill={PAPIR} stroke="#d6cfbd" strokeWidth={4} />
            <text x={1180} y={220} textAnchor="middle" fontSize={48} fontWeight={900} fill={BLEKK}>
                Manntallet
            </text>
            <text x={1180} y={262} textAnchor="middle" fontSize={26} fontWeight={700} fill="#64748b">
                listen over dem som får stemme
            </text>
            {Array.from({ length: RADER }, (_, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: beat === 2 ? 0.4 + i * 0.35 : 0 }}
                >
                    <rect x={980} y={300 + i * 58} width={i % 3 === 1 ? 240 : 320} height={14} rx={7} fill="#a8a29e" />
                    <circle cx={1390} cy={307 + i * 58} r={20} fill={BONDE} />
                    <path
                        d={`M 1381 ${307 + i * 58} L 1388 ${315 + i * 58} L 1400 ${299 + i * 58}`}
                        fill="none"
                        stroke="#fff"
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                </motion.g>
            ))}
            <text x={1180} y={770} textAnchor="middle" fontSize={34} fontWeight={900} fill={BONDE}>
                Flere bønder skriver seg inn
            </text>
        </motion.g>
    );
}

export function EmbetsmannsOlaboka({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-amber-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Bok />
                <g transform="translate(680 700)">
                    <Figur type="bonde" />
                </g>
                <g transform="translate(680 0)">
                    <Lapp tekst="John Neergaard" y={770} storrelse={34} />
                </g>
                <text x={680} y={810} textAnchor="middle" fontSize={28} fontWeight={700} fill="#475569">
                    bonde fra Nordmøre
                </text>
                <AnimatePresence mode="wait">
                    {beat <= 1 && (
                        <motion.g key="budskap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {beat === 0 ? (
                                <text x={1180} y={460} textAnchor="middle" fontSize={44} fontWeight={800} fill="#475569">
                                    En bok for bønder
                                </text>
                            ) : (
                                <motion.g initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: '1180px 450px' }}>
                                    <rect x={880} y={250} width={600} height={400} rx={36} fill={BONDE} />
                                    <text x={1180} y={340} textAnchor="middle" fontSize={34} fontWeight={700} fill="#bbf7d0">
                                        Budskapet:
                                    </text>
                                    {['Bønder', 'må stemme', 'på bønder!'].map((l, i) => (
                                        <text key={l} x={1180} y={430 + i * 72} textAnchor="middle" fontSize={66} fontWeight={900} fill="#fff">
                                            {l}
                                        </text>
                                    ))}
                                </motion.g>
                            )}
                        </motion.g>
                    )}
                    {beat === 2 && <Manntall beat={beat} />}
                    {beat >= 3 && (
                        <motion.g key="reserve" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <rect x={880} y={200} width={600} height={460} rx={14} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                            <text x={1180} y={280} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK}>
                                Stortinget 1830
                            </text>
                            <text x={1180} y={370} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                                Reserve:
                            </text>
                            <text x={1180} y={430} textAnchor="middle" fontSize={44} fontWeight={900} fill={BONDE}>
                                John Neergaard
                            </text>
                            <text x={1180} y={500} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                                En representant blir syk ...
                            </text>
                            <motion.g
                                initial={{ opacity: 0, scale: 2, rotate: -14 }}
                                animate={{ opacity: 1, scale: 1, rotate: -14 }}
                                transition={{ delay: 1.6, type: 'spring', stiffness: 220, damping: 14 }}
                                style={{ transformOrigin: '1180px 590px' }}
                            >
                                <rect x={940} y={540} width={480} height={100} rx={12} fill="none" stroke={ROD} strokeWidth={9} />
                                <text x={1180} y={610} textAnchor="middle" fontSize={54} fontWeight={900} fill={ROD} letterSpacing={4}>
                                    IKKE KALT INN
                                </text>
                            </motion.g>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
