import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Minnelys i SVG for de overlevende og familiene. Ingen mennesker og ingen vold vises.
 * Beat 0: tre lys brenner i mørket. Beat 1: lysene blir små, og flere hus får et rødt stempel.
 * Beat 2: en skodde går ned foran lysene, sorgen må skjules. Beat 3: skodda går opp, og en
 * lang rad med lys tennes, ett etter ett.
 */

const B = 1600;
const H = 900;

const TEKST: { tekst: string; rod?: boolean }[] = [
    { tekst: 'Ikke fjern historie' },
    { tekst: 'Stemplet som forrædere i flere tiår', rod: true },
    { tekst: 'Ingen kunne sørge åpent' },
    { tekst: 'Å fortelle er å vise respekt' },
];

// Raden med lys som tennes i beat 3. De tre første brenner fra start.
const LYS = Array.from({ length: 27 }, (_, i) => {
    const rad = Math.floor(i / 9);
    const kol = i % 9;
    return { i, x: 360 + kol * 110 + (rad % 2) * 55, y: 470 + rad * 120, forste: i >= 12 && i <= 14 };
});

function Lys({ x, y, tent, liten, forsinkelse }: { x: number; y: number; tent: boolean; liten: boolean; forsinkelse: number }) {
    const s = liten ? 0.55 : 1;
    return (
        <g>
            <rect x={x - 14} y={y} width={28} height={60} rx={4} fill="#f5f0e1" />
            <rect x={x - 14} y={y + 52} width={28} height={8} rx={2} fill="#d6cfb8" />
            <line x1={x} y1={y} x2={x} y2={y - 10} stroke="#292524" strokeWidth={3} />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: tent ? 1 : 0 }}
                transition={{ duration: 0.6, delay: tent ? forsinkelse : 0 }}
            >
                <circle cx={x} cy={y - 30} r={46 * s} fill="#fbbf24" opacity={0.18} />
                <ellipse cx={x} cy={y - 26} rx={9 * s} ry={20 * s} fill="#fcd34d" />
                <ellipse cx={x} cy={y - 22} rx={4 * s} ry={10 * s} fill="#fff7ed" />
            </motion.g>
        </g>
    );
}

export function IndonesiaLys({ beat }: VisualProps) {
    const t = TEKST[Math.min(beat, TEKST.length - 1)];
    const skodde = beat === 2;
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#0b1020, #1c1530)' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Hus i bakgrunnen. Fra beat 1 får dørene et rødt stempel. */}
                {[0, 1, 2, 3, 4, 5].map((h) => {
                    const x = 120 + h * 240;
                    return (
                        <g key={h} opacity={0.75}>
                            <polygon points={`${x},300 ${x + 90},230 ${x + 180},300`} fill="#272040" />
                            <rect x={x + 10} y={300} width={160} height={120} fill="#1f1a35" />
                            <rect x={x + 70} y={340} width={40} height={80} fill="#151127" />
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                                transition={{ duration: 0.4, delay: beat >= 1 ? 0.2 + h * 0.25 : 0 }}
                            >
                                <rect
                                    x={x + 62}
                                    y={355}
                                    width={56}
                                    height={30}
                                    rx={4}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={5}
                                    transform={`rotate(-12 ${x + 90} 370)`}
                                />
                                <line
                                    x1={x + 70}
                                    y1={372}
                                    x2={x + 110}
                                    y2={364}
                                    stroke="#dc2626"
                                    strokeWidth={5}
                                />
                            </motion.g>
                        </g>
                    );
                })}
                {/* Bakken */}
                <rect x={0} y={420} width={B} height={H - 420} fill="#120e22" />
                {LYS.map((l) => (
                    <Lys
                        key={l.i}
                        x={l.x}
                        y={l.y}
                        tent={l.forste || beat >= 3}
                        liten={beat === 1 || beat === 2}
                        forsinkelse={l.forste ? 0 : 0.4 + l.i * 0.12}
                    />
                ))}
                {/* Skodda foran lysene */}
                <motion.g
                    initial={false}
                    animate={{ y: skodde ? 0 : -900 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                >
                    <rect x={260} y={420} width={1080} height={460} fill="#3f3a52" />
                    {Array.from({ length: 11 }, (_, i) => (
                        <rect key={i} x={260} y={430 + i * 42} width={1080} height={6} fill="#2b2740" />
                    ))}
                </motion.g>
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-800 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
