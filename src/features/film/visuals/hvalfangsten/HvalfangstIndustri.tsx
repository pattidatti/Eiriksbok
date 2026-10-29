import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Industriell hvalfangst som noe som skjer: dampmaskin, kanon og granat samles på én båt,
 * båten blir en hel flåte, de største hvalene dukker opp under vannet, og til slutt
 * fabrikken på land som viser at det er samme utvikling som i industrien ellers.
 */

const B = 1600;
const H = 900;
const HAV = 520;

function Bat({ farge = '#1f2937' }: { farge?: string }) {
    return (
        <g>
            <path d="M -110 -26 L 110 -26 L 136 -46 L 122 0 L -96 0 Z" fill={farge} />
            <rect x={-40} y={-72} width={70} height={46} rx={4} fill="#f1f5f9" />
            <rect x={-26} y={-118} width={22} height={46} fill="#d9a43a" />
            <rect x={-26} y={-124} width={22} height={8} fill="#111827" />
            <rect x={96} y={-58} width={38} height={14} rx={5} fill="#111827" />
        </g>
    );
}

function Hval({ farge }: { farge: string }) {
    return (
        <path
            d="M 0 60 C 30 20 160 0 380 8 C 600 18 760 44 860 58 L 930 22 C 950 12 975 10 990 14 C 975 40 955 58 935 66 C 955 76 978 96 990 118 C 974 120 950 112 930 100 L 860 76 C 700 100 460 116 300 108 C 140 100 30 92 0 60 Z"
            fill={farge}
        />
    );
}

/** Ett av de tre nye påfunnene, som flyr inn og legger seg på båten. */
function Del({
    i,
    tittel,
    beat,
    children,
}: {
    i: number;
    tittel: string;
    beat: number;
    children: React.ReactNode;
}) {
    const startX = 330 + i * 470;
    const samlet = beat >= 1;
    return (
        <motion.g
            initial={{ opacity: 0, x: startX, y: 150 }}
            animate={{
                opacity: samlet ? 0 : 1,
                x: samlet ? 800 : startX,
                y: samlet ? 380 : 230,
                scale: samlet ? 0.3 : 1,
            }}
            transition={{ duration: samlet ? 0.8 : 0.7, delay: samlet ? 0 : 0.3 + i * 1.1 }}
        >
            <circle r={92} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
            {children}
            <text y={140} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                {tittel}
            </text>
        </motion.g>
    );
}

const FLATE = [-620, -310, 310, 620];

export function HvalfangstIndustri({ beat }: VisualProps) {
    const tekst = [
        'Tre nye ting på én båt',
        'Maskiner, i stor skala',
        'De største hvalene som finnes',
        'Samme utvikling som i industrien',
    ][beat];

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-200 to-sky-200 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={HAV} width={B} height={H - HAV} fill="#3e5b73" />
                <line x1={0} y1={HAV} x2={B} y2={HAV} stroke="#5d7d96" strokeWidth={6} />

                {/* Beat 0: tre deler som samles */}
                <Del i={0} tittel="damp" beat={beat}>
                    <rect x={-34} y={-30} width={68} height={60} rx={10} fill="#475569" />
                    <rect x={-10} y={-62} width={20} height={34} fill="#334155" />
                    <circle cx={14} cy={-70} r={14} fill="#cbd5e1" />
                    <circle cx={30} cy={-80} r={10} fill="#e2e8f0" />
                </Del>
                <Del i={1} tittel="kanon" beat={beat}>
                    <g transform="rotate(-12)">
                        <rect x={-50} y={-14} width={100} height={28} rx={10} fill="#111827" />
                        <rect x={-30} y={10} width={18} height={30} fill="#374151" />
                    </g>
                </Del>
                <Del i={2} tittel="granat" beat={beat}>
                    <rect x={-60} y={-5} width={60} height={10} fill="#475569" />
                    <path d="M 0 -26 L 34 -26 L 60 0 L 34 26 L 0 26 Z" fill="#cbd5e1" />
                    <ellipse cx={26} cy={0} rx={16} ry={10} fill="#dc2626" />
                </Del>

                {/* Båten, og fra beat 1 en hel flåte */}
                <motion.g
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: beat === 3 ? 0 : beat >= 1 ? 1 : 0.35, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <g transform={`translate(800 ${HAV + 4})`}>
                        <Bat />
                    </g>
                </motion.g>
                {FLATE.map((dx, i) => (
                    <motion.g
                        key={dx}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: beat === 1 || beat === 2 ? 1 : 0,
                            x: beat >= 1 ? dx : 0,
                        }}
                        transition={{ duration: 1.2, delay: beat === 1 ? 0.4 + i * 0.35 : 0 }}
                    >
                        <g transform={`translate(800 ${HAV + 4}) scale(0.8)`}>
                            <Bat farge="#334155" />
                        </g>
                    </motion.g>
                ))}

                {/* Beat 2: blåhval og finnhval under vannet */}
                <AnimatePresence>
                    {beat === 2 && (
                        <motion.g
                            key="hvaler"
                            initial={{ opacity: 0, x: 400 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2.2, ease: 'easeOut' }}
                        >
                            <g transform={`translate(240 ${HAV + 70}) scale(1.0 0.9)`}>
                                <Hval farge="#1e3a8a" />
                            </g>
                            <text
                                x={1270}
                                y={HAV + 140}
                                fontSize={40}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                blåhvalen
                            </text>
                            <g transform={`translate(420 ${HAV + 220}) scale(0.78 0.7)`}>
                                <Hval farge="#475569" />
                            </g>
                            <text
                                x={1230}
                                y={HAV + 285}
                                fontSize={40}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                finnhvalen
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Beat 3: fabrikken og arbeidet som blir mange ganger større */}
                <AnimatePresence>
                    {beat === 3 && (
                        <motion.g
                            key="fabrikk"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <rect x={0} y={130} width={B} height={HAV - 130} fill="#e2e8f0" />
                            {/* Fabrikk */}
                            <g transform="translate(180 470)">
                                <path
                                    d="M 0 0 L 0 -120 L 80 -170 L 80 -120 L 160 -170 L 160 -120 L 240 -170 L 240 0 Z"
                                    fill="#7c2d12"
                                />
                                <rect x={200} y={-260} width={30} height={110} fill="#57534e" />
                                <circle cx={230} cy={-290} r={22} fill="#94a3b8" opacity={0.7} />
                                <circle cx={260} cy={-320} r={16} fill="#cbd5e1" opacity={0.6} />
                                {[30, 100, 170].map((x) => (
                                    <rect
                                        key={x}
                                        x={x}
                                        y={-80}
                                        width={40}
                                        height={40}
                                        fill="#fde68a"
                                    />
                                ))}
                                <text
                                    x={120}
                                    y={44}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#334155"
                                >
                                    fabrikken
                                </text>
                            </g>
                            {/* Arbeidet: for hånd mot med maskiner */}
                            <text x={720} y={220} fontSize={32} fontWeight={800} fill="#475569">
                                for hånd
                            </text>
                            <rect x={720} y={240} width={70} height={46} rx={8} fill="#94a3b8" />
                            <text x={720} y={350} fontSize={32} fontWeight={800} fill="#0f172a">
                                med maskiner
                            </text>
                            <motion.rect
                                x={720}
                                y={370}
                                height={46}
                                rx={8}
                                fill="#d97706"
                                initial={{ width: 70 }}
                                animate={{ width: 760 }}
                                transition={{ duration: 2.4, delay: 0.8, ease: 'easeOut' }}
                            />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>

            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
