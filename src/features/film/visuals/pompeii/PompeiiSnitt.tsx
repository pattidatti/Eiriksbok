import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Snitt gjennom bakken i SVG. «lag»: pimpsteinen som legger seg mot et hus i Pompeii, til
 * 2,8 meter, og taket som raser. «gips»: teppet på 6-7 meter, hulrommet etter en kropp og
 * gipsen Fiorelli helte i. «herculaneum»: byen ved sjøen som ble fylt fra kjeller til tak
 * og ble til tuff. «batehus»: hvelvene ved havna der folk ventet på redning.
 */

const B = 1600;
const H = 900;
type Modus = 'lag' | 'gips' | 'herculaneum' | 'batehus';

const BAKKE = 780;
const M = 90; // piksler per meter i «lag»

const tekstStil = {
    fontWeight: 800,
    fill: '#0f172a',
    stroke: '#f8f5ec',
    strokeWidth: 8,
    paintOrder: 'stroke',
} as const;

/** Prikker som ser ut som pimpstein, fylt inn i et rektangel. */
function Stein({ x, y, w, h, farge = '#a8a296' }: { x: number; y: number; w: number; h: number; farge?: string }) {
    const prikker = [];
    for (let i = 0; i < Math.min(220, Math.floor((w * h) / 2600)); i++) {
        const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const fy = (Math.sin(i * 78.233) * 12543.123) % 1;
        prikker.push(<circle key={i} cx={x + Math.abs(fx) * w} cy={y + Math.abs(fy) * h} r={5} fill="#7d776c" opacity={0.6} />);
    }
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} fill={farge} />
            {prikker}
        </g>
    );
}

function Hus({ x, ras = 0 }: { x: number; ras?: number }) {
    const topp = BAKKE - 4 * M;
    return (
        <g>
            <rect x={x} y={topp} width={420} height={4 * M} fill="#efe3cc" stroke="#8b7355" strokeWidth={4} />
            <rect x={x + 60} y={BAKKE - 2.1 * M} width={90} height={2.1 * M} fill="#6b4a2f" />
            <rect x={x + 250} y={topp + 70} width={90} height={80} fill="#4a3a2a" />
            <motion.path
                d={`M${x - 30},${topp} L${x + 210},${topp - 110} L${x + 450},${topp} Z`}
                fill="#b4532a"
                stroke="#7a3518"
                strokeWidth={4}
                initial={false}
                animate={{ opacity: ras > 0 ? 0 : 1 }}
                transition={{ duration: 0.6 }}
            />
        </g>
    );
}

function Malestokk({ x, fra, til, tekst }: { x: number; fra: number; til: number; tekst: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <line x1={x} y1={fra} x2={x} y2={til} stroke="#b91c1c" strokeWidth={6} />
            <line x1={x - 22} y1={fra} x2={x + 22} y2={fra} stroke="#b91c1c" strokeWidth={6} />
            <line x1={x - 22} y1={til} x2={x + 22} y2={til} stroke="#b91c1c" strokeWidth={6} />
            <text x={x + 36} y={(fra + til) / 2 + 18} fontSize={54} {...tekstStil} fill="#b91c1c">
                {tekst}
            </text>
        </motion.g>
    );
}

function Lag({ beat }: { beat: number }) {
    const hoyde = beat === 0 ? 0.9 * M : 2.8 * M;
    return (
        <g>
            <rect width={B} height={H} fill="#d9cdb8" />
            <rect y={BAKKE} width={B} height={H - BAKKE} fill="#6b5b45" />
            <Hus x={560} ras={beat >= 2 ? 1 : 0} />
            <motion.rect x={0} width={B} fill="#a8a296" initial={{ y: BAKKE, height: 0 }} animate={{ y: BAKKE - hoyde, height: hoyde }} transition={{ duration: 1.8, ease: 'easeOut' }} />
            {beat >= 2 && (
                <motion.path
                    d={`M600,${BAKKE - 2.8 * M} L700,${BAKKE - 2.8 * M - 50} L760,${BAKKE - 2.8 * M - 20} L850,${BAKKE - 2.8 * M - 70} L940,${BAKKE - 2.8 * M} Z`}
                    fill="#b4532a"
                    stroke="#7a3518"
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                />
            )}
            {beat >= 1 && <Malestokk x={1180} fra={BAKKE - 2.8 * M} til={BAKKE} tekst="2,8 m" />}
            <rect x={500} y={50} width={600} height={90} rx={30} fill="#ffffff" opacity={0.92} />
            <text x={800} y={112} textAnchor="middle" fontSize={50} fontWeight={800} fill="#0f172a">
                {['Stein mot et hus', '2,8 meter stein', 'Taket raser sammen'][Math.min(beat, 2)]}
            </text>
            {Array.from({ length: 40 }, (_, i) => (
                <motion.circle
                    key={i}
                    cx={(i * 397) % B}
                    r={6}
                    fill="#e2dccd"
                    initial={{ cy: -20 - ((i * 53) % 300) }}
                    animate={{ cy: BAKKE - hoyde }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: (i % 10) * 0.24, ease: 'linear' }}
                />
            ))}
        </g>
    );
}

/** En sammenkrøket menneskeform, tegnet enkelt og uten detaljer: hode, kropp, armer og bein. */
function Figur({ x, y, skala = 1, farge, kant }: { x: number; y: number; skala?: number; farge: string; kant: string }) {
    const lem = { stroke: farge, strokeWidth: 40, strokeLinecap: 'round' as const, fill: 'none' };
    const ytre = { ...lem, stroke: kant, strokeWidth: 48 };
    const deler = (s: typeof lem) => (
        <>
            <path d="M-90,10 L60,30" {...s} />
            <path d="M60,30 L130,-40 L200,20" {...s} />
            <path d="M-60,10 L-110,-80" {...s} />
            <path d="M-20,20 L20,-50" {...s} />
        </>
    );
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            {deler(ytre)}
            <circle cx={-150} cy={-10} r={46} fill={kant} />
            {deler(lem)}
            <ellipse cx={-15} cy={20} rx={95} ry={34} fill={farge} />
            <circle cx={-150} cy={-10} r={42} fill={farge} />
        </g>
    );
}

function Gips({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <g>
                <rect width={B} height={H} fill="#d9cdb8" />
                <rect y={BAKKE} width={B} height={H - BAKKE} fill="#6b5b45" />
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Stein x={0} y={BAKKE - 6.5 * M} w={B} h={6.5 * M} farge="#9f998d" />
                </motion.g>
                <rect x={560} y={BAKKE - 4 * M} width={420} height={4 * M} fill="none" stroke="#efe3cc" strokeWidth={5} strokeDasharray="18 12" />
                <path d={`M530,${BAKKE - 4 * M} L770,${BAKKE - 4 * M - 110} L1010,${BAKKE - 4 * M}`} fill="none" stroke="#efe3cc" strokeWidth={5} strokeDasharray="18 12" />
                <text x={770} y={BAKKE - 4 * M + 200} textAnchor="middle" fontSize={44} {...tekstStil}>
                    Huset under
                </text>
                <Malestokk x={1180} fra={BAKKE - 6.5 * M} til={BAKKE} tekst="6-7 m" />
            </g>
        );
    }
    const hull = beat >= 2;
    const fylt = beat >= 4;
    const farge = fylt ? '#f8fafc' : hull ? '#2b2622' : '#6b5d52';
    const kant = fylt ? '#cbd5e1' : hull ? '#16120f' : '#7c2d12';
    const tekst =
        beat >= 5
            ? 'Mange prøvde å komme seg unna'
            : beat === 4
              ? 'Gipsavstøpning'
              : beat === 3
                ? '1858: Fiorelli heller gips i hullet'
                : hull
                  ? 'Et tomt hull, formet som et menneske'
                  : 'Asken herder rundt kroppen';
    return (
        <g>
            <Stein x={0} y={0} w={B} h={H} farge="#9f998d" />
            <motion.g key={farge} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                <Figur x={820} y={500} skala={1.3} farge={beat === 3 ? '#2b2622' : farge} kant={beat === 3 ? '#16120f' : kant} />
            </motion.g>
            {beat === 3 && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.4, delay: 0.8 }}>
                        <Figur x={820} y={500} skala={1.3} farge="#f1f5f9" kant="#cbd5e1" />
                    </motion.g>
                    <rect x={860} y={0} width={26} height={430} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={3} />
                    <path d="M810,0 L936,0 L906,60 L840,60 Z" fill="#78716c" />
                </>
            )}
            {beat >= 5 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
                    <g transform="rotate(-8 330 300)">
                        <Figur x={330} y={300} skala={0.8} farge="#f8fafc" kant="#cbd5e1" />
                    </g>
                    <g transform="rotate(10 1300 300)">
                        <Figur x={1300} y={300} skala={0.8} farge="#f8fafc" kant="#cbd5e1" />
                    </g>
                </motion.g>
            )}
            <AnimatePresence mode="wait">
                <motion.text
                    key={tekst}
                    x={B / 2}
                    y={790}
                    textAnchor="middle"
                    fontSize={50}
                    {...tekstStil}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tekst}
                </motion.text>
            </AnimatePresence>
        </g>
    );
}

function Herculaneum({ beat }: { beat: number }) {
    const fyll = beat >= 2 ? 1 : beat === 1 ? 0.3 : 0;
    const husX = 860;
    const topp = BAKKE - 4 * M;
    return (
        <g>
            <rect width={B} height={H} fill="#d6dde0" />
            {/* Vesuv bak, havet til høyre */}
            <path d="M20,780 L330,260 L450,260 L740,780 Z" fill="#7c6a55" opacity={0.75} />
            <text x={390} y={560} textAnchor="middle" fontSize={48} fontWeight={800} fill="#f8f5ec">
                Vesuv
            </text>
            <rect x={1340} y={BAKKE - 40} width={260} height={H - BAKKE + 40} fill="#3d7fa8" />
            <text x={1470} y={BAKKE + 50} textAnchor="middle" fontSize={38} {...tekstStil} fill="#0c4a6e">
                Havet
            </text>
            <rect y={BAKKE} width={1340} height={H - BAKKE} fill="#6b5b45" />
            {/* Kjeller */}
            <rect x={husX + 40} y={BAKKE} width={340} height={90} fill="#4a3a2a" />
            <rect x={husX} y={topp} width={420} height={4 * M} fill="#efe3cc" stroke="#8b7355" strokeWidth={4} />
            <path d={`M${husX - 30},${topp} L${husX + 210},${topp - 110} L${husX + 450},${topp} Z`} fill="#b4532a" stroke="#7a3518" strokeWidth={4} />
            <text x={husX + 210} y={topp - 125} textAnchor="middle" fontSize={44} {...tekstStil}>
                Herculaneum
            </text>
            {beat === 1 && (
                <motion.rect x={740} y={BAKKE - 40} width={600} height={40} fill="#ea580c" initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.9, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            <motion.rect
                x={740}
                width={600}
                fill="#8a6a4a"
                initial={false}
                animate={{ y: BAKKE + 90 - fyll * (4 * M + 200), height: fyll * (4 * M + 200) }}
                transition={{ duration: 2.4, ease: 'easeInOut' }}
                opacity={0.92}
            />
            {beat >= 2 && (
                <motion.text x={60} y={100} fontSize={60} {...tekstStil} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    Tuff: fra kjeller til tak
                </motion.text>
            )}
            {beat >= 3 && (
                <motion.text x={60} y={160} fontSize={40} {...tekstStil} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Hard stein: vanskelig å grave
                </motion.text>
            )}
            {beat >= 4 &&
                ['Treverk', 'Papyrusruller', 'Tøy'].map((t, i) => (
                    <motion.g key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.5 }}>
                        <rect x={husX + 30} y={topp + 40 + i * 92} width={360} height={72} rx={14} fill="#fff" stroke="#047857" strokeWidth={4} />
                        <text x={husX + 210} y={topp + 90 + i * 92} textAnchor="middle" fontSize={40} fontWeight={800} fill="#065f46">
                            {t}
                        </text>
                    </motion.g>
                ))}
            {beat <= 1 && (
                <motion.g key={beat} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={430} y={60} width={740} height={90} rx={30} fill="#ffffff" opacity={0.92} />
                    <text x={800} y={122} textAnchor="middle" fontSize={48} fontWeight={800} fill="#0f172a">
                        {beat === 0 ? 'Nær vulkanen og sjøen' : 'Glødende strøm, så gjørme'}
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Batehus({ beat }: { beat: number }) {
    const buer = [0, 1, 2, 3, 4, 5];
    return (
        <g>
            <rect width={B} height={H} fill="#cfd8dc" />
            <rect y={140} width={B} height={460} fill="#8a7a62" />
            {buer.map((i) => {
                const x = 120 + i * 230;
                return (
                    <g key={i}>
                        <path d={`M${x},600 L${x},360 A90,90 0 0 1 ${x + 180},360 L${x + 180},600 Z`} fill="#2b2420" />
                        {beat === 2 &&
                            [0, 1].map((j) => (
                                <g key={j} fill="#e7dcc4">
                                    <circle cx={x + 60 + j * 60} cy={500} r={16} />
                                    <rect x={x + 46 + j * 60} y={518} width={28} height={82} rx={10} />
                                </g>
                            ))}
                        {beat >= 1 && beat <= 2 && (
                            <motion.path d={`M${x},600 L${x},360 A90,90 0 0 1 ${x + 180},360 L${x + 180},600 Z`} fill="#f59e0b" initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: i * 0.15 }} />
                        )}
                    </g>
                );
            })}
            {beat === 1 &&
                buer.map((i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
                        <rect x={150 + i * 230} y={570} width={120} height={14} rx={7} fill="#f5f0e6" />
                        <circle cx={150 + i * 230} cy={577} r={11} fill="#f5f0e6" />
                    </motion.g>
                ))}
            <rect y={600} width={B} height={60} fill="#b8a88c" />
            <rect y={660} width={B} height={H - 660} fill="#3d7fa8" />
            {beat >= 3 && (
                <motion.rect width={B} height={H} fill="#0b1220" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 2 }} />
            )}
            {beat >= 3 && <line x1={0} y1={760} x2={B} y2={760} stroke="#cbd5e1" strokeWidth={3} opacity={0.6} />}
            {beat >= 2 && (
                <motion.path d="M800,830 L800,690" stroke="#fff" strokeWidth={8} markerEnd="url(#pil)" initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 1 : 0 }} />
            )}
            <defs>
                <marker id="pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                    <path d="M0,0 L10,5 L0,10 Z" fill="#fff" />
                </marker>
            </defs>
            <AnimatePresence mode="wait">
                <motion.text
                    key={beat}
                    x={B / 2}
                    y={100}
                    textAnchor="middle"
                    fontSize={50}
                    {...tekstStil}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {['Båthusene ved havna i Herculaneum', '1980-tallet: mange skjeletter funnet', 'De ventet på redning fra sjøen', 'Ingen båt kom'][Math.min(beat, 3)]}
                </motion.text>
            </AnimatePresence>
        </g>
    );
}

export function PompeiiSnitt({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lag';
    return (
        <div className="absolute inset-0 bg-[#d9cdb8]">
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'lag' && <Lag beat={beat} />}
                {modus === 'gips' && <Gips beat={beat} />}
                {modus === 'herculaneum' && <Herculaneum beat={beat} />}
                {modus === 'batehus' && <Batehus beat={beat} />}
            </svg>
        </div>
    );
}
