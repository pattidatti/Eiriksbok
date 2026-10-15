import { AnimatePresence, motion } from 'framer-motion';
import {
    Ban,
    BrainCircuit,
    Coins,
    Eye,
    Factory,
    Gamepad2,
    Laptop,
    Server,
    Shield,
    Smartphone,
    Swords,
} from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Teknologikrigen mellom USA og Kina, i SVG (1600x900).
 * - «nett»: Huawei og 5G-masta, landene som fikk utstyret, og mistanken fra USA.
 * - «brikke»: halvlederen, hva den trengs til, forbudet og Kinas egne brikker.
 */

type Modus = 'nett' | 'brikke';

const B = 1600;
const H = 900;
const RØD = '#b91c1c';
const BLÅ = '#1d4ed8';

export function SupermaktBrikke({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'nett';
    const titler =
        modus === 'nett'
            ? [
                  'Ikke våpen, men teknologi',
                  'Huawei: 5G, superraskt mobilnett',
                  'Huawei-utstyr i mobilnettet',
                  'USA: kan Huawei spionere?',
              ]
            : [
                  'Halvledere: bittesmå brikker',
                  'Brikkene bak de kraftigste maskinene',
                  'USA: ingen avanserte brikker til Kina',
                  'Kina lager sine egne',
              ];
    const tittel = titler[Math.min(beat, 3)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#0f172a]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <pattern id="sb-rutenett" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth={2} />
                    </pattern>
                </defs>
                <rect width={B} height={H} fill="url(#sb-rutenett)" />
                {modus === 'nett' ? <Nett beat={beat} /> : <Brikker beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Side({ x, navn, farge, synlig = true }: { x: number; navn: string; farge: string; synlig?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <rect x={x - 170} y={300} width={340} height={340} rx={36} fill={farge} opacity={0.18} />
            <rect x={x - 170} y={300} width={340} height={340} rx={36} fill="none" stroke={farge} strokeWidth={6} />
            <text x={x} y={490} textAnchor="middle" fontSize={84} fontWeight={900} fill="#fff">
                {navn}
            </text>
        </motion.g>
    );
}

/* ---------------- Nett ---------------- */

const MAST_X = 560;
const MAST_Y = 720;

function Nett({ beat }: { beat: number }) {
    return (
        <>
            {/* Beat 0: USA mot Kina */}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g key="duell" exit={{ opacity: 0 }}>
                        <Side x={380} navn="USA" farge={BLÅ} />
                        <Side x={1220} navn="KINA" farge={RØD} />
                        <motion.g
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0.25 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                        >
                            <Swords x={740} y={300} width={120} height={120} color="#94a3b8" />
                        </motion.g>
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <line x1={730} y1={290} x2={870} y2={430} stroke={RØD} strokeWidth={10} />
                        </motion.g>
                        <motion.g
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2, type: 'spring' }}
                            style={{ transformOrigin: '800px 560px' }}
                        >
                            <Chip x={800} y={560} r={70} />
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Masta */}
            <motion.g
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: beat >= 1 ? 1 : 0, y: beat >= 1 ? 0 : 40 }}
                transition={{ duration: 0.8 }}
            >
                <path
                    d={`M ${MAST_X - 70} ${MAST_Y} L ${MAST_X} ${MAST_Y - 420} L ${MAST_X + 70} ${MAST_Y} Z`}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={10}
                />
                {[0, 1, 2, 3].map((i) => (
                    <line
                        key={i}
                        x1={MAST_X - 60 + i * 15}
                        x2={MAST_X + 60 - i * 15}
                        y1={MAST_Y - 90 - i * 90}
                        y2={MAST_Y - 90 - i * 90}
                        stroke="#e2e8f0"
                        strokeWidth={6}
                    />
                ))}
                <circle cx={MAST_X} cy={MAST_Y - 430} r={22} fill={RØD} />
                <text x={MAST_X} y={MAST_Y + 70} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fca5a5">
                    Huawei
                </text>
                {/* Bølgene */}
                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        cx={MAST_X}
                        cy={MAST_Y - 430}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={6}
                        initial={{ r: 30, opacity: 0.9 }}
                        animate={{ r: beat >= 1 ? 340 : 30, opacity: 0 }}
                        transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                ))}
                <motion.text
                    x={MAST_X - 140}
                    y={MAST_Y - 400}
                    textAnchor="end"
                    fontSize={110}
                    fontWeight={900}
                    fill="#38bdf8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat === 1 ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    5G
                </motion.text>
            </motion.g>

            {/* Landene som fikk utstyret */}
            {['Norge', 'Sverige', 'Nederland'].map((n, i) => {
                const y = 300 + i * 150;
                const synlig = beat >= 2;
                return (
                    <motion.g
                        key={n}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: synlig ? 1 : 0, x: synlig ? 0 : 40 }}
                        transition={{ delay: synlig ? 0.4 + i * 0.6 : 0, duration: 0.6 }}
                    >
                        <motion.line
                            x1={MAST_X + 40}
                            y1={MAST_Y - 420}
                            x2={1060}
                            y2={y}
                            stroke="#38bdf8"
                            strokeWidth={5}
                            strokeDasharray="14 10"
                            animate={{ opacity: beat >= 3 ? 0.2 : 0.9 }}
                        />
                        <rect x={1060} y={y - 55} width={380} height={110} rx={20} fill="#fff" />
                        <text x={1250} y={y + 18} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
                            {n}
                        </text>
                    </motion.g>
                );
            })}

            {/* USA: mistanke og skjold */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <circle cx={MAST_X + 150} cy={MAST_Y - 330} r={60} fill="#fde68a" />
                <Eye x={MAST_X + 115} y={MAST_Y - 365} width={70} height={70} color="#0f172a" />
                <text x={MAST_X + 230} y={MAST_Y - 310} fontSize={64} fontWeight={900} fill="#fde68a">
                    ?
                </text>
                <text x={900} y={210} textAnchor="middle" fontSize={44} fontWeight={900} fill="#93c5fd">
                    USA
                </text>
                <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: beat >= 3 ? 1 : 0 }}
                    transition={{ delay: 1.4, type: 'spring' }}
                    style={{ transformOrigin: '900px 450px' }}
                >
                    <rect x={870} y={240} width={60} height={420} rx={14} fill={BLÅ} />
                    <Shield x={850} y={400} width={100} height={100} color="#fff" />
                </motion.g>
                <text x={900} y={720} textAnchor="middle" fontSize={36} fontWeight={800} fill="#93c5fd">
                    hold utstyret ute
                </text>
            </motion.g>
        </>
    );
}

/** En brikke med bein på alle sider. */
function Chip({ x, y, r, farge = '#334155' }: { x: number; y: number; r: number; farge?: string }) {
    const bein = [-0.6, -0.2, 0.2, 0.6];
    return (
        <g>
            {bein.map((b) => (
                <g key={b}>
                    <rect x={x + b * r - r * 0.07} y={y - r * 1.3} width={r * 0.14} height={r * 0.3} fill="#cbd5e1" />
                    <rect x={x + b * r - r * 0.07} y={y + r} width={r * 0.14} height={r * 0.3} fill="#cbd5e1" />
                    <rect x={x - r * 1.3} y={y + b * r - r * 0.07} width={r * 0.3} height={r * 0.14} fill="#cbd5e1" />
                    <rect x={x + r} y={y + b * r - r * 0.07} width={r * 0.3} height={r * 0.14} fill="#cbd5e1" />
                </g>
            ))}
            <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.12} fill={farge} stroke="#94a3b8" strokeWidth={r * 0.04} />
            <rect x={x - r * 0.55} y={y - r * 0.55} width={r * 1.1} height={r * 1.1} rx={r * 0.06} fill="#64748b" />
            <path
                d={`M ${x - r * 0.4} ${y} h ${r * 0.8} M ${x} ${y - r * 0.4} v ${r * 0.8}`}
                stroke="#facc15"
                strokeWidth={r * 0.06}
            />
        </g>
    );
}

/* ---------------- Brikker ---------------- */

function Brikker({ beat }: { beat: number }) {
    // Hvor brikken står: stor i midten først, så liten til venstre.
    const plass = [
        { x: 800, y: 470, r: 170 },
        { x: 520, y: 470, r: 110 },
        { x: 360, y: 470, r: 70 },
        { x: 360, y: 470, r: 70 },
    ][Math.min(beat, 3)];
    return (
        <>
            <motion.g
                initial={false}
                animate={{ x: plass.x - 800, y: plass.y - 470, scale: plass.r / 170 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                style={{ transformOrigin: '800px 470px' }}
            >
                <Chip x={800} y={470} r={170} />
            </motion.g>

            {/* Beat 0: ting med brikker inni */}
            <AnimatePresence>
                {beat === 0 &&
                    [
                        { I: Smartphone, x: 260, y: 300 },
                        { I: Laptop, x: 1340, y: 300 },
                        { I: Gamepad2, x: 1340, y: 650 },
                        { I: Server, x: 260, y: 650 },
                    ].map(({ I, x, y }, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8 + i * 0.4 }}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                            <circle cx={x} cy={y} r={80} fill="#1e293b" stroke="#475569" strokeWidth={4} />
                            <I x={x - 45} y={y - 45} width={90} height={90} color="#e2e8f0" />
                            <line x1={x + (x < 800 ? 80 : -80)} y1={y} x2={x < 800 ? 600 : 1000} y2={470} stroke="#facc15" strokeWidth={4} strokeDasharray="10 8" />
                        </motion.g>
                    ))}
            </AnimatePresence>

            {/* Beat 1: hva brikkene trengs til */}
            <AnimatePresence>
                {beat === 1 &&
                    [
                        { I: BrainCircuit, t: 'kunstig intelligens', y: 300 },
                        { I: Shield, t: 'militæret', y: 620 },
                    ].map(({ I, t, y }, i) => (
                        <motion.g
                            key={t}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8 + i * 0.9 }}
                        >
                            <path d={`M 680 470 C 820 470 820 ${y} 940 ${y}`} fill="none" stroke="#facc15" strokeWidth={8} />
                            <rect x={940} y={y - 80} width={520} height={160} rx={28} fill="#1e293b" stroke="#facc15" strokeWidth={4} />
                            <I x={970} y={y - 50} width={100} height={100} color="#facc15" />
                            <text x={1090} y={y + 16} fontSize={44} fontWeight={900} fill="#fff">
                                {t}
                            </text>
                        </motion.g>
                    ))}
            </AnimatePresence>

            {/* Beat 2-3: USA, forbud, Kina */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <text x={360} y={300} textAnchor="middle" fontSize={64} fontWeight={900} fill="#93c5fd">
                    USA
                </text>
                <text x={1240} y={300} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fca5a5">
                    KINA
                </text>
                {/* Muren */}
                <rect x={770} y={220} width={60} height={520} rx={10} fill="#475569" />
                <Ban x={740} y={130} width={120} height={120} color="#ef4444" />
                {/* Brikker som spretter tilbake fra muren */}
                {beat === 2 &&
                    [0, 1, 2].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: 0, opacity: 0 }}
                            animate={{ x: [0, 300, 240], opacity: [0, 1, 0.3] }}
                            transition={{ duration: 1.6, delay: 0.8 + i * 0.7, times: [0, 0.7, 1] }}
                        >
                            <Chip x={450} y={380 + i * 100} r={30} farge="#475569" />
                        </motion.g>
                    ))}
            </motion.g>

            {/* Kina bygger egne brikker */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <Factory x={1080} y={360} width={170} height={170} color="#fca5a5" />
                <Coins x={1300} y={390} width={110} height={110} color="#facc15" />
                <rect x={1000} y={600} width={480} height={44} rx={22} fill="#1e293b" stroke="#475569" strokeWidth={3} />
                <motion.rect
                    x={1004}
                    y={604}
                    height={36}
                    rx={18}
                    fill={RØD}
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 3 ? 300 : 0 }}
                    transition={{ duration: 3, delay: 0.6, ease: 'easeOut' }}
                />
                <text x={1240} y={710} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff">
                    enorme summer
                </text>
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 1 : 0 }}
                    transition={{ delay: 2.6 }}
                >
                    <text x={800} y={830} textAnchor="middle" fontSize={50} fontWeight={900} fill="#facc15">
                        Hvem vinner kappløpet?
                    </text>
                </motion.g>
            </motion.g>
        </>
    );
}
