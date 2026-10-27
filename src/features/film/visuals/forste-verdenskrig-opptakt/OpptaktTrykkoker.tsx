import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Europa som trykkoker, i snitt. To moduser:
 * - bygger: fire rør fører press inn i gryta (kolonier, allianser, våpen, nasjonalisme), og
 *   nåla på trykkmåleren går mot rødt. Til slutt står en gnist klar ved ventilen.
 * - smell: lokket har gått. Jubel og blomster, så kalenderen: hjemme før jul? Nei, fire år.
 */

type Modus = 'bygger' | 'smell';

const PRESS = [
    { navn: 'Kolonier', farge: '#b45309', y: 380 },
    { navn: 'Allianser', farge: '#2563eb', y: 480 },
    { navn: 'Våpen', farge: '#475569', y: 580 },
    { navn: 'Nasjonalisme', farge: '#7c3aed', y: 680 },
];

/** Hvor høyt trykket står per beat (0 = tomt, 1 = rødt). */
const TRYKK = [0.12, 0.32, 0.52, 0.7, 0.86, 0.96];

const MALER = { x: 1240, y: 430, r: 190 };

function nalEnde(andel: number) {
    // Fra -130 til +130 grader, null rett opp.
    const v = ((-130 + 260 * andel) * Math.PI) / 180;
    return { x: MALER.x + Math.sin(v) * MALER.r * 0.8, y: MALER.y - Math.cos(v) * MALER.r * 0.8 };
}

function Bue({ fra, til, farge }: { fra: number; til: number; farge: string }) {
    const p = (a: number) => {
        const v = ((-130 + 260 * a) * Math.PI) / 180;
        return [MALER.x + Math.sin(v) * MALER.r * 0.9, MALER.y - Math.cos(v) * MALER.r * 0.9];
    };
    const [x1, y1] = p(fra);
    const [x2, y2] = p(til);
    const stor = (til - fra) * 260 > 180 ? 1 : 0;
    return (
        <path
            d={`M ${x1} ${y1} A ${MALER.r * 0.9} ${MALER.r * 0.9} 0 ${stor} 1 ${x2} ${y2}`}
            fill="none"
            stroke={farge}
            strokeWidth={22}
        />
    );
}

function Gryte({ lokkAv, risting }: { lokkAv: boolean; risting: boolean }) {
    return (
        <motion.g
            animate={risting ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
            transition={risting ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.4 } : { duration: 0.3 }}
        >
            {/* Gryta i snitt */}
            <path d="M 470 330 L 470 760 Q 470 800 510 800 L 830 800 Q 870 800 870 760 L 870 330 Z" fill="#cbd5e1" stroke="#334155" strokeWidth={8} />
            <rect x={480} y={340} width={380} height={450} rx={20} fill="#fee2e2" />
            <rect x={440} y={790} width={460} height={24} rx={10} fill="#334155" />
            {/* Håndtak */}
            <rect x={870} y={380} width={70} height={22} rx={10} fill="#334155" />
            {/* Lokket */}
            <motion.g
                initial={false}
                animate={lokkAv ? { y: -240, rotate: -18, opacity: 0.85 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: lokkAv ? 0.7 : 0.4, ease: 'easeOut' }}
                style={{ transformOrigin: '670px 320px', transformBox: 'view-box' }}
            >
                <rect x={450} y={300} width={440} height={34} rx={12} fill="#64748b" stroke="#334155" strokeWidth={6} />
                <rect x={640} y={270} width={60} height={34} rx={8} fill="#334155" />
            </motion.g>
        </motion.g>
    );
}

function Damp({ mengde, x = 670, y = 250 }: { mengde: number; x?: number; y?: number }) {
    const antall = Math.round(2 + mengde * 6);
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <motion.circle
                    key={i}
                    cx={x + ((i % 3) - 1) * 40 * (1 + mengde)}
                    r={26 + mengde * 30}
                    fill="#e2e8f0"
                    initial={{ cy: y, opacity: 0 }}
                    animate={{ cy: [y, y - 120 - mengde * 140], opacity: [0, 0.8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }}
                />
            ))}
        </g>
    );
}

function Bygger({ beat }: { beat: number }) {
    const andel = TRYKK[Math.min(beat, TRYKK.length - 1)];
    const ende = nalEnde(andel);
    return (
        <>
            <Damp mengde={andel} />
            <Gryte lokkAv={false} risting={beat >= 4} />
            {/* Innholdet stiger med trykket */}
            <motion.rect
                x={480}
                width={380}
                fill="#f87171"
                initial={false}
                animate={{ y: 790 - 430 * andel, height: 430 * andel }}
                transition={{ duration: 1.2 }}
                opacity={0.55}
            />
            {PRESS.map((p, i) => {
                const vis = beat >= i + 1;
                return (
                    <motion.g key={p.navn} initial={false} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
                        <motion.line
                            x1={130}
                            y1={p.y}
                            x2={470}
                            y2={p.y}
                            stroke={p.farge}
                            strokeWidth={26}
                            strokeLinecap="round"
                            initial={false}
                            animate={{ pathLength: vis ? 1 : 0 }}
                            transition={{ duration: 0.9 }}
                        />
                        <rect x={60} y={p.y - 34} width={300} height={68} rx={16} fill={p.farge} />
                        <text x={210} y={p.y + 13} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                            {p.navn}
                        </text>
                    </motion.g>
                );
            })}
            {/* Trykkmåleren */}
            <circle cx={MALER.x} cy={MALER.y} r={MALER.r + 18} fill="#ffffff" stroke="#334155" strokeWidth={10} />
            <Bue fra={0} til={0.55} farge="#86efac" />
            <Bue fra={0.55} til={0.8} farge="#fcd34d" />
            <Bue fra={0.8} til={1} farge="#f87171" />
            <motion.line
                x1={MALER.x}
                y1={MALER.y}
                stroke="#0f172a"
                strokeWidth={12}
                strokeLinecap="round"
                initial={false}
                animate={{ x2: ende.x, y2: ende.y }}
                transition={{ type: 'spring', stiffness: 60, damping: 9 }}
            />
            <circle cx={MALER.x} cy={MALER.y} r={20} fill="#0f172a" />
            <text x={MALER.x} y={MALER.y + 110} textAnchor="middle" fontSize={40} fontWeight={900} fill="#334155">
                TRYKK
            </text>
            <text x={MALER.x} y={MALER.y + MALER.r + 90} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                Europa 1914
            </text>
            {/* Gnisten ved ventilen */}
            <AnimatePresence>
                {beat >= 5 && (
                    <motion.g
                        key="gnist"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: [1, 0.6, 1], scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ opacity: { duration: 0.6, repeat: Infinity }, scale: { duration: 0.4 } }}
                        style={{ transformOrigin: '800px 200px', transformBox: 'view-box' }}
                    >
                        <path
                            d="M 800 140 L 815 185 L 860 170 L 825 205 L 860 240 L 812 225 L 800 270 L 788 225 L 740 240 L 775 205 L 740 170 L 785 185 Z"
                            fill="#facc15"
                            stroke="#b45309"
                            strokeWidth={5}
                        />
                        <text x={900} y={218} fontSize={42} fontWeight={900} fill="#b45309">
                            En gnist?
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

function Blomst({ x, forsinkelse }: { x: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: [-80, 960], opacity: [0, 1, 1] }}
            transition={{ duration: 6, repeat: Infinity, delay: forsinkelse, ease: 'linear' }}
        >
            {[0, 72, 144, 216, 288].map((v) => (
                <circle
                    key={v}
                    cx={x + Math.cos((v * Math.PI) / 180) * 14}
                    cy={Math.sin((v * Math.PI) / 180) * 14}
                    r={11}
                    fill="#f472b6"
                />
            ))}
            <circle cx={x} cy={0} r={8} fill="#facc15" />
        </motion.g>
    );
}

function Smell({ beat }: { beat: number }) {
    return (
        <>
            <g transform="translate(-260 0)">
                <Damp mengde={beat === 0 ? 1.4 : 0.6} y={290} />
                <Gryte lokkAv risting={false} />
            </g>
            {beat === 0 && (
                <>
                    {[180, 420, 900, 1100, 1300, 1480, 640].map((x, i) => (
                        <Blomst key={x} x={x} forsinkelse={i * 0.7} />
                    ))}
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <rect x={900} y={330} width={560} height={200} rx={28} fill="#ffffff" stroke="#16a34a" strokeWidth={8} />
                        <text x={1180} y={420} textAnchor="middle" fontSize={64} fontWeight={900} fill="#166534">
                            Jubel
                        </text>
                        <text x={1180} y={490} textAnchor="middle" fontSize={38} fontWeight={700} fill="#334155">
                            i mange hovedsteder
                        </text>
                    </motion.g>
                </>
            )}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <rect x={860} y={150} width={640} height={300} rx={24} fill="#ffffff" stroke="#334155" strokeWidth={8} />
                    <rect x={860} y={150} width={640} height={80} rx={24} fill="#dc2626" />
                    <rect x={860} y={200} width={640} height={30} fill="#dc2626" />
                    <text x={1180} y={208} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                        JUL
                    </text>
                    <text x={1180} y={330} textAnchor="middle" fontSize={54} fontWeight={900} fill="#0f172a">
                        Hjemme før jul?
                    </text>
                    {beat >= 2 && (
                        <motion.line
                            x1={920}
                            y1={312}
                            x2={1440}
                            y2={312}
                            stroke="#dc2626"
                            strokeWidth={10}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6 }}
                        />
                    )}
                    <text x={1180} y={410} textAnchor="middle" fontSize={34} fontWeight={700} fill="#64748b">
                        Det trodde soldatene
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <g>
                    {[1, 2, 3, 4].map((ar, i) => (
                        <motion.g
                            key={ar}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.5, duration: 0.4 }}
                            style={{ transformOrigin: `${930 + i * 150}px 600px`, transformBox: 'view-box' }}
                        >
                            <rect x={870 + i * 150} y={530} width={120} height={140} rx={16} fill="#7f1d1d" />
                            <text x={930 + i * 150} y={615} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                                {ar} år
                            </text>
                        </motion.g>
                    ))}
                    <motion.text
                        x={1180}
                        y={760}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#7f1d1d"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.8, duration: 0.6 }}
                    >
                        Krigen varte i fire år
                    </motion.text>
                </g>
            )}
        </>
    );
}

export function OpptaktTrykkoker({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'bygger';
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'bygger' ? <Bygger beat={beat} /> : <Smell beat={beat} />}
            </svg>
        </div>
    );
}
