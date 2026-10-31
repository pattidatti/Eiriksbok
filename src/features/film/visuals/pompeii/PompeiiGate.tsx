import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Hverdagen i Pompeii, tegnet i SVG. «grafitti»: en gatevegg der innskriftene dukker opp.
 * «thermopolium»: gatekjøkkenet med krukkene i disken og maleriene på forsiden.
 * «freske»: Mysterievillaen utenfor bymuren, med de røde veggmaleriene.
 */

const B = 1600;
const H = 900;
type Modus = 'grafitti' | 'thermopolium' | 'freske';

const tekstStil = {
    fontWeight: 800,
    fill: '#0f172a',
    stroke: '#f8f5ec',
    strokeWidth: 8,
    paintOrder: 'stroke',
} as const;

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

const INNSKRIFTER = [
    { t: 'Kjærlighet', x: 300, y: 430, r: -6, farge: '#b91c1c' },
    { t: 'Vitser', x: 760, y: 380, r: 4, farge: '#334155' },
    { t: 'Dikt', x: 1180, y: 450, r: -3, farge: '#7c2d12' },
    { t: 'Fornærmelser', x: 620, y: 560, r: 3, farge: '#1e293b' },
];

function Grafitti({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#e7dcc4" />
            {/* Gatevegg med puss og sprekker */}
            <rect x={80} y={180} width={1440} height={540} fill="#efe6d2" stroke="#b8a888" strokeWidth={4} />
            <path d="M300,180 L330,300 L310,420 M1300,720 L1260,600 L1290,500" stroke="#c9b997" strokeWidth={4} fill="none" />
            <rect y={720} width={B} height={H - 720} fill="#8f8577" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <rect key={i} x={i * 200 + 10} y={740} width={180} height={60} rx={10} fill="#a69b8b" />
            ))}
            {beat <= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <rect x={680} y={360} width={240} height={360} fill="#5b4632" />
                    <text x={800} y={330} textAnchor="middle" fontSize={44} {...tekstStil}>
                        {beat === 0 ? 'En gate i Pompeii' : 'En vanlig dør, en vanlig vegg'}
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {Array.from({ length: 46 }, (_, i) => (
                        <rect
                            key={i}
                            x={120 + ((i * 263) % 1340)}
                            y={220 + ((i * 131) % 460)}
                            width={50 + ((i * 37) % 70)}
                            height={6}
                            rx={3}
                            fill="#6b5b45"
                            opacity={0.35}
                            transform={`rotate(${((i * 7) % 11) - 5} ${120 + ((i * 263) % 1340)} ${220 + ((i * 131) % 460)})`}
                        />
                    ))}
                </motion.g>
            )}
            {beat >= 3 &&
                INNSKRIFTER.map((s, i) => (
                    <motion.text
                        key={s.t}
                        x={s.x}
                        y={s.y}
                        fontSize={62}
                        fontStyle="italic"
                        fontWeight={700}
                        fill={s.farge}
                        transform={`rotate(${s.r} ${s.x} ${s.y})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 3 ? 1 : 0 }}
                        transition={{ delay: beat === 3 ? i * 0.45 : 0 }}
                    >
                        {s.t}
                    </motion.text>
                ))}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: '800px 300px' }}>
                    <rect x={420} y={230} width={760} height={130} fill="#b91c1c" opacity={0.9} />
                    <text x={800} y={318} textAnchor="middle" fontSize={68} fontWeight={900} fill="#fff7ed" letterSpacing={6}>
                        STEM PÅ ...
                    </text>
                    <text x={800} y={420} textAnchor="middle" fontSize={40} {...tekstStil}>
                        Valgkampslagord
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Teller({ synlig }: { synlig: boolean }) {
    return (
        <AnimatePresence>
            {synlig && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-[4%] bottom-[22%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-5xl font-black text-slate-900 tabular-nums">
                        over <TelleTall verdi={11000} />
                    </div>
                    <div className="text-base font-semibold text-slate-500 mt-1">innskrifter på veggene</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const KRUKKER = ['And', 'Gris', 'Geit', 'Fisk', 'Snegler'];

function And({ x, y }: { x: number; y: number }) {
    // Hengende opp ned: hodet nederst.
    return (
        <g transform={`translate(${x} ${y})`}>
            <line x1={0} y1={-40} x2={0} y2={-10} stroke="#3f3f46" strokeWidth={4} />
            <ellipse cx={0} cy={30} rx={26} ry={44} fill="#e7e5e4" stroke="#57534e" strokeWidth={3} />
            <circle cx={0} cy={86} r={14} fill="#166534" />
            <path d="M-6,98 L6,98 L0,114 Z" fill="#ea580c" />
        </g>
    );
}

function Hane({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={0} rx={50} ry={34} fill="#b45309" />
            <circle cx={42} cy={-38} r={18} fill="#b45309" />
            <path d="M34,-58 l6,-14 l6,10 l6,-12 l4,16 Z" fill="#dc2626" />
            <path d="M60,-38 l14,4 l-14,6 Z" fill="#facc15" />
            <path d="M-46,-6 C-90,-60 -70,-80 -40,-40 Z" fill="#14532d" />
            <line x1={-10} y1={32} x2={-14} y2={64} stroke="#78350f" strokeWidth={5} />
            <line x1={14} y1={32} x2={18} y2={64} stroke="#78350f" strokeWidth={5} />
        </g>
    );
}

function Thermopolium({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#e7dcc4" />
            <rect x={120} y={160} width={1360} height={300} fill="#c9b48e" />
            <rect y={780} width={B} height={H - 780} fill="#8f8577" />
            {/* Disken sett forfra: toppen med krukkehull, forsiden med malerier */}
            <rect x={220} y={470} width={1160} height={44} fill="#d6cbb3" stroke="#8b7355" strokeWidth={4} />
            <rect x={240} y={514} width={1120} height={266} fill="#f3e9d2" stroke="#8b7355" strokeWidth={4} />
            {KRUKKER.map((k, i) => {
                const x = 330 + i * 235;
                return (
                    <g key={k}>
                        <ellipse cx={x} cy={474} rx={78} ry={18} fill="#5b3a22" />
                        <path d={`M${x - 70},474 C${x - 90},380 ${x + 90},380 ${x + 70},474 Z`} fill="#a0522d" stroke="#6b3418" strokeWidth={3} />
                        {beat >= 2 && (
                            <motion.text
                                x={x}
                                y={360}
                                textAnchor="middle"
                                fontSize={44}
                                {...tekstStil}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.4 }}
                            >
                                {k}
                            </motion.text>
                        )}
                    </g>
                );
            })}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <And x={420} y={580} />
                    <And x={520} y={580} />
                    <g transform="translate(1080 650) scale(1.5) translate(-1080 -650)">
                        <Hane x={1080} y={650} />
                    </g>
                    <text x={470} y={760} textAnchor="middle" fontSize={34} {...tekstStil}>
                        Ender, opp ned
                    </text>
                    <text x={1080} y={760} textAnchor="middle" fontSize={34} {...tekstStil}>
                        En hane
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={540} y={590} width={520} height={110} rx={18} fill="#fff" stroke="#0f766e" strokeWidth={5} />
                    <text x={800} y={665} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f766e">
                        Utgravd 2020
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Freske({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <g>
                <rect width={B} height={H} fill="#cfe0ea" />
                <rect y={620} width={B} height={H - 620} fill="#b7ad7a" />
                {/* Bymuren til venstre, villaen til høyre */}
                <rect x={40} y={380} width={560} height={240} fill="#a89b84" />
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <rect key={i} x={40 + i * 82} y={350} width={50} height={36} fill="#a89b84" />
                ))}
                <text x={320} y={330} textAnchor="middle" fontSize={44} {...tekstStil}>
                    Bymuren
                </text>
                <rect x={960} y={430} width={500} height={190} fill="#efe3cc" stroke="#8b7355" strokeWidth={4} />
                <path d="M930,430 L1210,350 L1490,430 Z" fill="#b4532a" />
                <text x={1210} y={320} textAnchor="middle" fontSize={44} {...tekstStil}>
                    Mysterievillaen
                </text>
            </g>
        );
    }
    const figurer = [260, 520, 800, 1080, 1340];
    return (
        <g>
            <rect width={B} height={H} fill="#9b1c1c" />
            <rect y={0} width={B} height={120} fill="#1f1a17" />
            <rect y={760} width={B} height={140} fill="#1f1a17" />
            {figurer.map((x, i) => (
                <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
                    <circle cx={x} cy={250} r={44} fill="#e7c9a9" />
                    <path d={`M${x - 70},740 L${x - 50},310 L${x + 50},310 L${x + 70},740 Z`} fill={i % 2 ? '#f5f0e6' : '#d6a85c'} />
                </motion.g>
            ))}
            <AnimatePresence mode="wait">
                {beat === 2 && (
                    <motion.g key="bacchus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <circle cx={800} cy={250} r={70} fill="none" stroke="#fde68a" strokeWidth={8} />
                        <text x={800} y={860} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fef3c7">
                            Trolig et hemmelig opptaksrituale til Bacchus
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="rod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <rect x={500} y={360} width={600} height={190} rx={22} fill="#fff" />
                        <rect x={530} y={390} width={130} height={130} rx={12} fill="#9b1c1c" />
                        <text x={690} y={450} fontSize={40} fontWeight={900} fill="#0f172a">
                            Pompeiansk rød
                        </text>
                        <text x={690} y={505} fontSize={34} fontWeight={700} fill="#475569">
                            klar etter 2000 år
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    grafitti: ['Utbruddet tok vare på byen', 'De små tingene fra hverdagen', 'Grafitti', 'Hva skrev de?', 'Valgkamp på veggen'],
    thermopolium: ['Thermopolium: et gatekjøkken', 'Et helt gatekjøkken', 'Restene i krukkene', 'Malt reklame på disken'],
    freske: ['Rett utenfor bymuren', 'Fresker i naturlig størrelse', 'Vinguden Bacchus', 'Fargene er fortsatt klare'],
};

export function PompeiiGate({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'grafitti';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 bg-[#e7dcc4]">
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'grafitti' && <Grafitti beat={beat} />}
                {modus === 'thermopolium' && <Thermopolium beat={beat} />}
                {modus === 'freske' && <Freske beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
            {modus === 'grafitti' && <Teller synlig={beat === 2} />}
        </div>
    );
}
