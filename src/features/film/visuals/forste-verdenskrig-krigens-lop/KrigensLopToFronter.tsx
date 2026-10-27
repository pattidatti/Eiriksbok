import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * 1917: Tyskland mellom to fronter, tegnet som et enkelt skjema. Hver kloss er en del av en
 * hær, ikke et antall. Russland bryter sammen (klossene blir grå), freden lukker Østfronten,
 * og de tyske klossene i øst glir over til Vestfronten.
 */

const VEST_X = 430;
const OST_X = 1170;
const RADER = [250, 340, 430, 520, 610, 700];

const BLA = '#2563eb';
const ROD = '#dc2626';

const TITLER = ['1917: to fronter', 'Revolusjon i Russland', 'Fred i øst'];

export function KrigensLopToFronter({ beat }: VisualProps) {
    const sammenbrudd = beat >= 1;
    const fred = beat >= 2;
    const tittel = TITLER[Math.min(beat, TITLER.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="ktf-pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={ROD} />
                    </marker>
                </defs>
                {/* Tyskland i midten */}
                <rect x={VEST_X + 20} y={180} width={OST_X - VEST_X - 40} height={600} rx={30} fill="#fee2e2" />
                <text x={800} y={830} textAnchor="middle" fontSize={44} fontWeight={900} fill="#7f1d1d">
                    TYSKLAND
                </text>
                <text x={190} y={830} textAnchor="middle" fontSize={40} fontWeight={900} fill="#1e3a8a">
                    VEST: de allierte
                </text>
                <motion.text
                    x={1400}
                    y={830}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    initial={false}
                    animate={{ fill: sammenbrudd ? '#64748b' : '#1e3a8a' }}
                >
                    ØST: Russland
                </motion.text>

                {/* Frontlinjene */}
                <line x1={VEST_X} y1={180} x2={VEST_X} y2={780} stroke="#7c2d12" strokeWidth={14} strokeLinecap="round" />
                <motion.line
                    x1={OST_X}
                    y1={180}
                    x2={OST_X}
                    y2={780}
                    stroke="#7c2d12"
                    strokeWidth={14}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ opacity: fred ? 0.12 : 1 }}
                    transition={{ duration: 1.2 }}
                />

                {/* De allierte i vest */}
                {RADER.map((y) => (
                    <rect key={`a${y}`} x={VEST_X - 150} y={y - 28} width={110} height={56} rx={10} fill={BLA} />
                ))}
                {/* Russland i øst */}
                {RADER.map((y, i) => (
                    <motion.rect
                        key={`r${y}`}
                        y={y - 28}
                        width={110}
                        height={56}
                        rx={10}
                        initial={false}
                        animate={{
                            fill: sammenbrudd ? '#cbd5e1' : BLA,
                            x: fred ? OST_X + 120 + (i % 2) * 40 : OST_X + 40,
                            opacity: fred ? 0.5 : 1,
                        }}
                        transition={{ duration: 1.2, delay: i * 0.12 }}
                    />
                ))}
                {/* Tyske soldater: halvparten i vest, halvparten i øst */}
                {RADER.map((y) => (
                    <rect key={`tv${y}`} x={VEST_X + 40} y={y - 28} width={110} height={56} rx={10} fill={ROD} />
                ))}
                {RADER.map((y, i) => (
                    <motion.rect
                        key={`to${y}`}
                        y={y - 28}
                        width={110}
                        height={56}
                        rx={10}
                        fill={ROD}
                        initial={false}
                        animate={{ x: fred ? VEST_X + 170 : OST_X - 150 }}
                        transition={{ duration: 2.4, delay: 0.6 + i * 0.15, ease: 'easeInOut' }}
                    />
                ))}
                <AnimatePresence>
                    {fred && (
                        <motion.path
                            key="pil"
                            d={`M ${OST_X - 60} 125 L ${VEST_X + 330} 125`}
                            stroke={ROD}
                            strokeWidth={22}
                            strokeLinecap="round"
                            markerEnd="url(#ktf-pil)"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.6, delay: 0.4 }}
                        />
                    )}
                </AnimatePresence>
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '3%', left: '3%' }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.div
                        key="rev"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute rounded-2xl bg-white/95 px-5 py-3 shadow-xl text-2xl font-black text-slate-800"
                        style={{ top: '14%', right: '3%' }}
                    >
                        mangel på mat · store tap · lei tsaren
                    </motion.div>
                )}
                {fred && (
                    <motion.div
                        key="flytt"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.6 }}
                        className="absolute rounded-2xl bg-white/95 px-5 py-3 shadow-xl text-2xl font-black text-red-700"
                        style={{ top: '17%', right: '3%' }}
                    >
                        tyske soldater flyttes fra øst til vest
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
