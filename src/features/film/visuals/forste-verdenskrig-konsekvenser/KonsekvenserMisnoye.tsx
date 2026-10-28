import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Bitterheten i Tyskland: en folkemengde sett forfra. For hver beat blir den mørkere og mer
 * rød, og en snakkeboble viser hva mange trodde. Til slutt faller en lang skygge over
 * mengden: nazistene som brukte sinnet. Ingen vold, bare mennesker og ord.
 */

const RADER = 4;
const PER_RAD = 18;
const FOLK = Array.from({ length: RADER * PER_RAD }, (_, i) => {
    const rad = Math.floor(i / PER_RAD);
    const k = i % PER_RAD;
    const forskyv = rad % 2 === 0 ? 0 : 42;
    return {
        x: 70 + k * 84 + forskyv,
        y: 520 + rad * 95,
        s: 0.85 + rad * 0.12,
        d: (k * 7 + rad * 3) % 11,
    };
});

const FARGER = ['#94a3b8', '#9a7b6c', '#a35a4a', '#b91c1c'];

const BOBLER = [
    { tekst: 'Vi ble ydmyket.', x: 800, y: 200 },
    { tekst: 'Hæren ble aldri slått på slagmarken!', x: 640, y: 110 },
    { tekst: 'Politikerne hjemme sviktet oss.', x: 1130, y: 240 },
];

export function KonsekvenserMisnoye({ beat }: VisualProps) {
    const farge = FARGER[Math.min(beat, FARGER.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: beat >= 3 ? '#44302a' : '#e7e5e4', transition: 'background 1.5s' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {FOLK.map((f, i) => (
                    <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
                        <circle cx={0} cy={-62} r={22} fill={farge} style={{ transition: `fill 1.2s ${f.d * 0.08}s` }} />
                        <path d="M -34 40 Q -34 -34 0 -34 Q 34 -34 34 40 Z" fill={farge} style={{ transition: `fill 1.2s ${f.d * 0.08}s` }} />
                    </g>
                ))}

                {BOBLER.map((b, i) => {
                    const vis = (i === 0 && beat === 0) || (i === 1 && beat >= 1 && beat <= 2) || (i === 2 && beat === 2);
                    const bredde = b.tekst.length * 19 + 60;
                    return (
                        <motion.g
                            key={b.tekst}
                            initial={false}
                            animate={{ opacity: vis ? 1 : 0 }}
                            transition={{ duration: 0.6, delay: vis ? 0.4 + (i === 2 ? 0.8 : 0) : 0 }}
                        >
                            <rect x={b.x - bredde / 2} y={b.y - 50} width={bredde} height={92} rx={26} fill="#ffffff" stroke="#44403c" strokeWidth={4} />
                            <path d={`M ${b.x - 20} ${b.y + 40} L ${b.x - 40} ${b.y + 110} L ${b.x + 18} ${b.y + 40} Z`} fill="#ffffff" stroke="#44403c" strokeWidth={4} strokeLinejoin="round" />
                            <rect x={b.x - 24} y={b.y + 36} width={40} height={8} fill="#ffffff" />
                            <text x={b.x} y={b.y + 12} textAnchor="middle" fontSize={36} fontWeight={800} fill="#1c1917">
                                {b.tekst}
                            </text>
                        </motion.g>
                    );
                })}

                {beat === 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.8 }}>
                        <rect x={430} y={330} width={740} height={86} rx={20} fill="#7f1d1d" />
                        <text x={800} y={387} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                            Dolkestøtlegenden
                        </text>
                    </motion.g>
                )}

                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }}>
                        <rect x={0} y={0} width={1600} height={900} fill="url(#km-skygge)" />
                        <text x={800} y={230} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fca5a5">
                            Hitler og nazistene
                        </text>
                        <text x={800} y={300} textAnchor="middle" fontSize={38} fontWeight={700} fill="#e7e5e4">
                            brukte sinnet for å komme til makten
                        </text>
                    </motion.g>
                )}
                <defs>
                    <linearGradient id="km-skygge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#000000" stopOpacity={0.7} />
                        <stop offset="0.6" stopColor="#000000" stopOpacity={0.15} />
                        <stop offset="1" stopColor="#000000" stopOpacity={0} />
                    </linearGradient>
                </defs>
            </svg>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl"
                    style={{ top: '5%', left: '3%' }}
                >
                    Tyskland etter freden
                </motion.div>
            )}
        </div>
    );
}
