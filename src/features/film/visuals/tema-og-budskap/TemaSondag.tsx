import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Motivet i Dagermans novelle: en solfylt søndag, en vei og en bil. Ulykken vises aldri,
 * og barnet vises ikke. Bilen kjører inn og stopper, og resten forteller stemmen.
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

const MERKER = [
    'Motivet: det konkrete',
    'Hva skjer?',
    'Hva skjer?',
    'En bilulykke en solfylt søndag',
    'Råmaterialet vi tolker',
];

function Bil() {
    return (
        <g>
            <rect x={-110} y={-56} width={220} height={56} rx={16} fill="#b91c1c" />
            <path d="M -60 -56 L -36 -100 L 52 -100 L 76 -56 Z" fill="#dc2626" />
            <path d="M -44 -60 L -28 -92 L 8 -92 L 8 -60 Z" fill="#dbeafe" />
            <path d="M 18 -60 L 18 -92 L 46 -92 L 62 -60 Z" fill="#dbeafe" />
            <circle cx={-62} cy={2} r={24} fill="#1e293b" />
            <circle cx={66} cy={2} r={24} fill="#1e293b" />
            <circle cx={-62} cy={2} r={9} fill="#94a3b8" />
            <circle cx={66} cy={2} r={9} fill="#94a3b8" />
        </g>
    );
}

export function TemaSondag({ beat, playing }: VisualProps) {
    const merke = MERKER[Math.min(beat, MERKER.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#bae6fd' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <linearGradient id="sondag-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#7dd3fc" />
                        <stop offset="1" stopColor="#e0f2fe" />
                    </linearGradient>
                </defs>
                <rect width={1600} height={900} fill="url(#sondag-himmel)" />
                {/* Sola */}
                <motion.g
                    style={{ originX: '1340px', originY: '170px' }}
                    animate={playing ? { rotate: 360 } : undefined}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                    {Array.from({ length: 12 }, (_, i) => {
                        const a = (i / 12) * Math.PI * 2;
                        return (
                            <line
                                key={i}
                                x1={1340 + Math.cos(a) * 100}
                                y1={170 + Math.sin(a) * 100}
                                x2={1340 + Math.cos(a) * 140}
                                y2={170 + Math.sin(a) * 140}
                                stroke="#facc15"
                                strokeWidth={10}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </motion.g>
                <circle cx={1340} cy={170} r={80} fill="#fde047" />
                {/* Åsene og veien */}
                <path d="M0 560 Q 300 470 640 540 T 1600 520 L 1600 900 L 0 900 Z" fill="#86efac" />
                <path
                    d="M0 640 Q 500 560 1000 640 T 1600 620 L 1600 900 L 0 900 Z"
                    fill="#4ade80"
                />
                <path d="M0 760 L 1600 740 L 1600 840 L 0 860 Z" fill="#64748b" />
                <path
                    d="M0 810 L 1600 790"
                    stroke="#f8fafc"
                    strokeWidth={6}
                    strokeDasharray="50 40"
                />
                {/* Trær */}
                {[180, 420, 1150, 1460].map((x, i) => (
                    <g key={x} transform={`translate(${x} ${600 + (i % 2) * 30})`}>
                        <rect x={-10} y={0} width={20} height={70} fill="#7c4a2d" />
                        <circle cx={0} cy={-20} r={58} fill="#16a34a" />
                    </g>
                ))}

                {/* Bilen kjører inn og stopper */}
                <motion.g
                    initial={false}
                    animate={{
                        x: beat >= 3 ? 800 : beat >= 1 ? 300 : -300,
                        opacity: beat >= 1 ? 1 : 0,
                    }}
                    transition={{ duration: beat >= 1 ? 2.2 : 0.3, ease: 'easeOut' }}
                >
                    <g transform="translate(0 790)">
                        <Bil />
                    </g>
                </motion.g>

                {/* Novellen */}
                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={90}
                        y={90}
                        width={560}
                        height={260}
                        rx={24}
                        fill="#ffffff"
                        stroke="#0f766e"
                        strokeWidth={5}
                    />
                    <text
                        x={370}
                        y={170}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#1e293b"
                        style={FONT}
                    >
                        Å drepe et barn
                    </text>
                    <text
                        x={370}
                        y={228}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={600}
                        fill="#475569"
                        style={FONT}
                    >
                        Stig Dagerman, 1948
                    </text>
                    <text
                        x={370}
                        y={300}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#0f766e"
                        style={FONT}
                    >
                        novelle: en kort fortelling
                    </text>
                </motion.g>

                {/* Fra motiv til tolkning */}
                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 4 ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={40}
                        y={500}
                        width={1520}
                        height={380}
                        rx={30}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth={8}
                        strokeDasharray="26 16"
                    />
                    <rect x={1180} y={420} width={340} height={70} rx={35} fill="#7c3aed" />
                    <text
                        x={1350}
                        y={467}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#ffffff"
                        style={FONT}
                    >
                        tema? budskap?
                    </text>
                </motion.g>
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={merke}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    style={{ top: '45%' }}
                >
                    {merke}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
