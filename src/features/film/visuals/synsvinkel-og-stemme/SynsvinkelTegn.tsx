import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Det som står, og det som ligger under. Tre moduser om å lese tegn:
 * «sint»: en mann ved et bord. «Han var sint» strykes og blir til det vi faktisk ser.
 * «hemingway»: få ord over vannflaten, mye mer under.
 * «bunn»: den upålitelige fortelleren og historiens doble bunn.
 */

type Modus = 'sint' | 'hemingway' | 'bunn';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const inn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

function Kort({
    x,
    y,
    b,
    h,
    linjer,
    fyll = '#ffffff',
    tekst = '#0f172a',
    str = 46,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    linjer: string[];
    fyll?: string;
    tekst?: string;
    str?: number;
}) {
    const start = y + h / 2 - ((linjer.length - 1) * str * 1.2) / 2 + str * 0.35;
    return (
        <g>
            <rect x={x} y={y} width={b} height={h} rx={26} fill={fyll} stroke="#cbd5e1" strokeWidth={3} />
            {linjer.map((l, i) => (
                <text key={l} x={x + b / 2} y={start + i * str * 1.2} textAnchor="middle" fontSize={str} fontWeight={900} fill={tekst} style={FONT}>
                    {l}
                </text>
            ))}
        </g>
    );
}

function Sint({ beat }: { beat: number }) {
    const slag = beat >= 2;
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <rect width={1600} height={900} fill="#f1f5f9" />
            <rect x={0} y={760} width={1600} height={140} fill="#cbd5e1" />
            {/* Bordet */}
            <rect x={380} y={560} width={360} height={26} rx={6} fill="#7c4a26" />
            <rect x={400} y={586} width={20} height={174} fill="#5b3416" />
            <rect x={700} y={586} width={20} height={174} fill="#5b3416" />
            {/* Mannen */}
            <rect x={220} y={420} width={130} height={220} rx={40} fill="#0f766e" />
            <rect x={235} y={630} width={40} height={130} rx={12} fill="#1f2937" />
            <rect x={295} y={630} width={40} height={130} rx={12} fill="#1f2937" />
            <motion.circle cx={285} cy={350} r={68} initial={{ fill: '#e8b996' }} animate={{ fill: slag ? '#ef4444' : '#e8b996' }} transition={{ duration: 0.8, delay: 0.4 }} />
            <path d="M 225 320 Q 285 260 345 320 Q 285 300 225 320" fill="#3f2a1d" />
            <circle cx={310} cy={348} r={7} fill="#1e293b" />
            <motion.line
                x1={330}
                y1={460}
                initial={{ x2: 470, y2: 380 }}
                animate={slag ? { x2: 560, y2: 548 } : { x2: 470, y2: 380 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                stroke="#0f766e"
                strokeWidth={34}
                strokeLinecap="round"
            />
            <AnimatePresence>
                {slag && (
                    <motion.g key="smell" {...inn} transition={{ duration: 0.3, delay: 0.25 }} stroke="#f59e0b" strokeWidth={10} strokeLinecap="round">
                        <line x1={600} y1={520} x2={660} y2={470} />
                        <line x1={540} y1={500} x2={530} y2={440} />
                        <line x1={630} y1={560} x2={700} y2={545} />
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Tekstene til høyre */}
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g key="b0" {...inn} transition={{ duration: 0.5 }}>
                        <Kort x={820} y={300} b={720} h={200} linjer={['Følelser står', 'aldri rett ut']} />
                    </motion.g>
                )}
                {beat >= 1 && (
                    <motion.g key="b1" {...inn} transition={{ duration: 0.5 }}>
                        <Kort x={820} y={90} b={720} h={140} linjer={['Han var sint.']} />
                        <motion.line
                            x1={900}
                            y1={162}
                            x2={1460}
                            y2={162}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: slag ? 1 : 0, opacity: slag ? 1 : 0 }}
                            transition={{ duration: 0.6 }}
                            stroke="#dc2626"
                            strokeWidth={12}
                            strokeLinecap="round"
                        />
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {slag && (
                    <motion.g key="b2" {...inn} transition={{ duration: 0.6, delay: 0.5 }}>
                        <Kort x={820} y={270} b={720} h={230} linjer={['Han smalt hånden', 'i bordet og ble', 'rød i ansiktet.']} fyll="#0f766e" tekst="#ffffff" str={44} />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="b3" {...inn} transition={{ duration: 0.6, delay: 0.3 }}>
                        <circle cx={900} cy={650} r={60} fill="#fef3c7" stroke="#0f172a" strokeWidth={14} />
                        <line x1={944} y1={694} x2={1000} y2={750} stroke="#0f172a" strokeWidth={20} strokeLinecap="round" />
                        <Kort x={1040} y={590} b={500} h={120} linjer={['Du er detektiven']} fyll="#fcd34d" str={44} />
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

const VANN_Y = 430;

function Hemingway({ beat }: { beat: number }) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <rect width={1600} height={VANN_Y} fill="#e0f2fe" />
            <rect y={VANN_Y} width={1600} height={900 - VANN_Y} fill="#0c4a6e" />
            <path d={`M 0 ${VANN_Y} Q 200 ${VANN_Y - 14} 400 ${VANN_Y} T 800 ${VANN_Y} T 1200 ${VANN_Y} T 1600 ${VANN_Y}`} stroke="#38bdf8" strokeWidth={10} fill="none" />
            <text x={1560} y={VANN_Y - 20} textAnchor="end" fontSize={30} fontWeight={800} fill="#0369a1" style={FONT}>
                overflaten
            </text>
            <AnimatePresence mode="wait">
                {beat <= 2 ? (
                    <motion.g key="navn" {...inn} transition={{ duration: 0.5 }}>
                        <Kort x={80} y={70} b={620} h={200} linjer={['Ernest Hemingway', 'mester i stilen']} str={46} />
                    </motion.g>
                ) : (
                    <motion.g key="sitat" {...inn} transition={{ duration: 0.5 }}>
                        <Kort x={80} y={90} b={860} h={220} linjer={['Han reiste seg brått.', 'Stolen veltet bak ham.']} str={50} />
                        <rect x={80} y={30} width={240} height={56} rx={18} fill="#0f172a" />
                        <text x={200} y={70} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fcd34d" style={FONT}>
                            Eksempel
                        </text>
                        {/* Stolen som veltet */}
                        <g transform="translate(1180 230) rotate(-70)" stroke="#7c4a26" strokeWidth={18} strokeLinecap="round">
                            <line x1={0} y1={0} x2={0} y2={-120} />
                            <line x1={0} y1={0} x2={100} y2={0} />
                            <line x1={100} y1={0} x2={100} y2={90} />
                            <line x1={0} y1={0} x2={0} y2={90} />
                        </g>
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 1 && beat <= 2 && (
                    <motion.g key="ord" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        {[
                            [900, 140],
                            [1220, 230],
                        ].map(([x, y], i) => (
                            <g key={i}>
                                <rect x={x} y={y} width={240} height={110} rx={50} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
                                <text x={x + 120} y={y + 72} textAnchor="middle" fontSize={56} fontWeight={900} fill="#334155" style={FONT}>
                                    ...
                                </text>
                            </g>
                        ))}
                        <text x={1100} y={400} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a" style={FONT}>
                            få ord, få personer
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Det som ligger under: vokser fram fra beat 2 */}
            <motion.path
                d={`M 300 ${VANN_Y} L 1300 ${VANN_Y} L 1460 840 L 140 840 Z`}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 0.55 : 0 }}
                transition={{ duration: 1 }}
                fill="#38bdf8"
            />
            <AnimatePresence mode="wait">
                {beat >= 2 && beat <= 3 && (
                    <motion.g key="under" {...inn} transition={{ duration: 0.5, delay: 0.4 }}>
                        <text x={800} y={660} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff" style={FONT}>
                            Mye mer under overflaten
                        </text>
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g key="tolk" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <text x={800} y={600} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff" style={FONT}>
                            Hva føler han?
                        </text>
                        <text x={800} y={690} textAnchor="middle" fontSize={46} fontWeight={800} fill="#fde68a" style={FONT}>
                            Det må du tolke selv
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

const FORTELLERE = [
    { fraBeat: 0, navn: 'Lystløgneren', farge: '#dc2626' },
    { fraBeat: 1, navn: 'Barnet', farge: '#2563eb' },
    { fraBeat: 1, navn: 'Morderen', farge: '#1e293b' },
];

function Bunn({ beat }: { beat: number }) {
    const delt = beat >= 2;
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <rect width={1600} height={900} fill="#f8fafc" />
            <text x={800} y={90} textAnchor="middle" fontSize={44} fontWeight={900} fill="#475569" style={FONT}>
                Upålitelige fortellere
            </text>
            <AnimatePresence>
                {FORTELLERE.filter((f) => beat >= f.fraBeat).map((f, i) => (
                    <motion.g key={f.navn} {...inn} transition={{ duration: 0.5, delay: 0.2 + (f.fraBeat === 1 ? (i - 1) * 0.6 : 0) }}>
                        <rect x={140 + i * 460} y={130} width={400} height={110} rx={28} fill={f.farge} />
                        <text x={340 + i * 460} y={202} textAnchor="middle" fontSize={46} fontWeight={900} fill="#ffffff" style={FONT}>
                            {f.navn}
                        </text>
                    </motion.g>
                ))}
            </AnimatePresence>
            {/* Historien: én boks som får to lag */}
            <rect x={300} y={300} width={1000} height={540} rx={30} fill="#ffffff" stroke="#334155" strokeWidth={8} />
            <motion.rect
                x={304}
                width={992}
                initial={{ y: 836, height: 0 }}
                animate={delt ? { y: 574, height: 262 } : { y: 836, height: 0 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                rx={26}
                fill="#1e293b"
            />
            <AnimatePresence mode="wait">
                {!delt && (
                    <motion.g key="en" {...inn} transition={{ duration: 0.4 }}>
                        <text x={800} y={585} textAnchor="middle" fontSize={50} fontWeight={900} fill="#334155" style={FONT}>
                            Historien
                        </text>
                    </motion.g>
                )}
                {delt && beat === 2 && (
                    <motion.g key="dobbel" {...inn} transition={{ duration: 0.5, delay: 0.6 }}>
                        <text x={800} y={460} textAnchor="middle" fontSize={58} fontWeight={900} fill="#0f172a" style={FONT}>
                            Dobbel bunn
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="lag" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <text x={800} y={460} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a" style={FONT}>
                            Det fortelleren sier
                        </text>
                        <text x={800} y={725} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fde68a" style={FONT}>
                            Det du skjønner
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.g key="mellom" {...inn} transition={{ duration: 0.6, delay: 0.3 }}>
                        <rect x={1320} y={520} width={260} height={110} rx={24} fill="#fcd34d" />
                        <text x={1450} y={566} textAnchor="middle" fontSize={32} fontWeight={900} fill="#0f172a" style={FONT}>
                            Les mellom
                        </text>
                        <text x={1450} y={606} textAnchor="middle" fontSize={32} fontWeight={900} fill="#0f172a" style={FONT}>
                            linjene
                        </text>
                        <line x1={1320} y1={575} x2={1296} y2={575} stroke="#fcd34d" strokeWidth={10} />
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

export function SynsvinkelTegn({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sint';
    return (
        <div className="absolute inset-0 bg-slate-50">
            {modus === 'sint' && <Sint beat={beat} />}
            {modus === 'hemingway' && <Hemingway beat={beat} />}
            {modus === 'bunn' && <Bunn beat={beat} />}
        </div>
    );
}
