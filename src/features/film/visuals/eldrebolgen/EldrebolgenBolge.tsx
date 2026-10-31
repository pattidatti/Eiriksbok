import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * «Ordet bølge kan lure deg.» En bølge som stiger og synker, mot en linje som stiger og
 * blir liggende. Skisse, ikke tall: den viser formen på påstanden i artikkelen.
 */

const B = 1600;
const H = 900;
const X0 = 220;
const X1 = 1420;
const BUNN = 720;
const TOPP = 330;

const BOLGE = `M${X0},${BUNN} C520,${BUNN} 600,${TOPP} 800,${TOPP} C1000,${TOPP} 1080,${BUNN} ${X1},${BUNN}`;
const NIVA = `M${X0},${BUNN} C520,${BUNN} 640,${TOPP + 10} 900,${TOPP} L${X1},${TOPP}`;

const TITLER = [
    'Er det en bølge?',
    'En bølge: opp, og ned igjen',
    'Andelen eldre: forskerne venter at den blir der',
    'Et nytt nivå',
];

export function EldrebolgenBolge({ beat }: VisualProps) {
    const tittel = TITLER[Math.min(beat, TITLER.length - 1)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tittel}
                        x={800}
                        y={130}
                        textAnchor="middle"
                        fontSize={58}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tittel}
                    </motion.text>
                </AnimatePresence>

                {/* Akser */}
                <line x1={X0} y1={BUNN} x2={X1 + 40} y2={BUNN} stroke="#64748b" strokeWidth={5} />
                <line x1={X0} y1={BUNN} x2={X0} y2={230} stroke="#64748b" strokeWidth={5} />
                <text x={X1 + 40} y={BUNN + 56} textAnchor="end" fontSize={34} fontWeight={800} fill="#475569">
                    tid
                </text>
                <text x={X0 + 20} y={250} fontSize={34} fontWeight={800} fill="#475569">
                    andel eldre
                </text>
                <text x={X0} y={BUNN + 110} fontSize={28} fontWeight={700} fill="#64748b">
                    Skisse, ikke tall
                </text>

                {/* Beat 0: en liten bølge som ikon */}
                <motion.g initial={false} animate={{ opacity: beat === 0 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                    <path
                        d="M560,520 q60,-90 120,0 t120,0 t120,0 t120,0"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={16}
                        strokeLinecap="round"
                    />
                    <text x={800} y={630} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                        Eldre-bølgen?
                    </text>
                </motion.g>

                {/* Beat 1+: bølgen som stiger og synker */}
                {beat >= 1 && (
                    <motion.path
                        d={BOLGE}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={14}
                        strokeLinecap="round"
                        initial={{ pathLength: beat === 1 ? 0 : 1, opacity: 1 }}
                        animate={{ pathLength: 1, opacity: beat >= 2 ? 0.28 : 1 }}
                        transition={{ duration: beat === 1 ? 2.2 : 0.8, ease: 'easeInOut' }}
                    />
                )}
                {beat === 1 && (
                    <motion.text
                        x={1260}
                        y={430}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#1d4ed8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                    >
                        synker igjen
                    </motion.text>
                )}

                {/* Beat 2+: linja som stiger og blir liggende */}
                {beat >= 2 && (
                    <motion.path
                        d={NIVA}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth={16}
                        strokeLinecap="round"
                        initial={{ pathLength: beat === 2 ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.4, ease: 'easeInOut' }}
                    />
                )}
                {beat >= 2 && (
                    <motion.text
                        x={1220}
                        y={TOPP + 80}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#c2410c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: beat === 2 ? 2 : 0 }}
                    >
                        blir liggende
                    </motion.text>
                )}

                {/* Beat 3: båndet for det nye nivået */}
                {beat >= 3 && (
                    <motion.rect
                        x={900}
                        y={TOPP - 22}
                        width={X1 - 900 + 20}
                        height={44}
                        rx={22}
                        fill="#fb923c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.35 }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                {beat >= 3 && (
                    <motion.text
                        x={1200}
                        y={TOPP - 110}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        en varig endring
                    </motion.text>
                )}
            </svg>
        </div>
    );
}
