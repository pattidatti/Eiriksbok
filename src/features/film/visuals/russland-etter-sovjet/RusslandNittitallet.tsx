import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { Brikke } from './felles';

/**
 * 90-tallet i Russland som bilder i SVG, i tre modus:
 * «sjokk»: fra plan til marked, sjokkterapien, prisene slippes fri, 2500 prosent, sparepengene forsvinner.
 * «levealder»: to livslinjer, 1988 og 1994. Den siste er sju år kortere.
 * «oligarker»: oljefelt, gruver og fabrikker havner hos noen få, mens naboene selger på gata.
 */

type Modus = 'sjokk' | 'levealder' | 'oligarker';
const BAK = '#f5efe3';
const MORK = '#1e293b';
const ROD = '#b91c1c';
const GULL = '#ca8a04';

export function RusslandNittitallet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sjokk';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAK }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'sjokk' && <Sjokk beat={beat} />}
                {modus === 'levealder' && <Levealder beat={beat} />}
                {modus === 'oligarker' && <Oligarker beat={beat} />}
            </svg>
            {modus === 'sjokk' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute left-[8%] top-[30%] text-center"
                >
                    <div className="text-[9rem] leading-none font-black tabular-nums text-red-700">
                        <TelleTall verdi={2500} varighet={3} forsinkelse={0.4} /> %
                    </div>
                    <div className="mt-3 text-4xl font-bold text-slate-700">prisøkning i 1992</div>
                </motion.div>
            )}
            <AnimatePresence>
                {modus === 'sjokk' && beat === 0 && <Brikke key="s0" tekst="Nytt system i full fart" />}
                {modus === 'sjokk' && beat === 1 && <Brikke key="s1" tekst="Sjokkterapi" farge="rod" />}
                {modus === 'sjokk' && beat === 2 && <Brikke key="s2" tekst="2. januar 1992: prisene slippes fri" />}
                {modus === 'sjokk' && beat === 3 && <Brikke key="s3" tekst="Inflasjon: pengene blir verdt mindre" />}
                {modus === 'sjokk' && beat === 4 && <Brikke key="s4" tekst="Sparepengene forsvinner" farge="rod" />}
                {modus === 'levealder' && beat === 0 && <Brikke key="l0" tekst="Hvor lenge lever en russisk mann?" />}
                {modus === 'levealder' && beat >= 1 && <Brikke key="l1" tekst="Sju år kortere liv" farge="rod" />}
                {modus === 'oligarker' && beat === 0 && <Brikke key="o0" tekst="Statens skatter, solgt for småpenger" />}
                {modus === 'oligarker' && beat === 1 && <Brikke key="o1" tekst="Oligarker: rike som kjøper makt" farge="mork" />}
                {modus === 'oligarker' && beat === 2 && <Brikke key="o2" tekst="Noen få på toppen" />}
                {modus === 'oligarker' && beat === 3 && <Brikke key="o3" tekst="Mange følte at demokratiet sviktet" farge="rod" />}
            </AnimatePresence>
        </div>
    );
}

function Tekst({
    x,
    y,
    children,
    str = 40,
    farge = MORK,
    forsinkelse = 0.3,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    str?: number;
    farge?: string;
    forsinkelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            {children}
        </motion.text>
    );
}

/* ---------- Sjokk ---------- */

function Sjokk({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <g>
                <Staten x={430} y={560} />
                <Tekst x={430} y={720} str={48}>
                    Staten bestemmer
                </Tekst>
                <motion.path
                    d="M 640 470 L 960 470"
                    stroke={MORK}
                    strokeWidth={14}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                />
                <motion.path d="M 950 440 L 1000 470 L 950 500 Z" fill={MORK} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} />
                <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.1 }}>
                    <Marked x={1200} y={560} />
                </motion.g>
                <Tekst x={1200} y={720} str={48} forsinkelse={2.3}>
                    Markedet bestemmer
                </Tekst>
            </g>
        );
    }
    if (beat === 1) {
        const kort = ['Slipp prisene fri', 'Selg det staten eier', 'Gjør det raskt'];
        return (
            <g>
                {kort.map((t, i) => (
                    <motion.g
                        key={t}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.7, type: 'spring', damping: 16 }}
                    >
                        <rect x={140 + i * 460} y={330} width={400} height={300} rx={28} fill="#ffffff" stroke={ROD} strokeWidth={6} />
                        <text x={340 + i * 460} y={430} textAnchor="middle" fontSize={90} fontWeight={900} fill={ROD}>
                            {i + 1}
                        </text>
                        <text x={340 + i * 460} y={540} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                            {t}
                        </text>
                    </motion.g>
                ))}
            </g>
        );
    }
    if (beat === 2) {
        return (
            <g>
                <Brod x={600} y={540} />
                <motion.g
                    initial={{ scale: 0.6 }}
                    animate={{ scale: [0.6, 1, 1.5, 2.1] }}
                    transition={{ delay: 0.8, duration: 4, times: [0, 0.3, 0.65, 1] }}
                    style={{ transformOrigin: '960px 420px' }}
                >
                    <path d="M 900 360 L 1080 360 L 1080 480 L 900 480 L 860 420 Z" fill="#fde68a" stroke={MORK} strokeWidth={6} />
                    <circle cx={885} cy={420} r={9} fill={MORK} />
                    <text x={990} y={438} textAnchor="middle" fontSize={50} fontWeight={900} fill={ROD}>
                        PRIS
                    </text>
                </motion.g>
                <motion.path
                    d="M 1300 650 L 1300 260"
                    stroke={ROD}
                    strokeWidth={16}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.2, duration: 3 }}
                />
                <motion.path d="M 1260 290 L 1300 230 L 1340 290 Z" fill={ROD} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.8 }} />
            </g>
        );
    }
    if (beat === 3) {
        return (
            <g>
                {/* Stolpen skyter ut av bildet */}
                <rect x={1000} y={770} width={160} height={20} fill="#94a3b8" />
                <text x={1080} y={830} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                    før
                </text>
                <motion.rect
                    x={1240}
                    width={160}
                    fill={ROD}
                    initial={{ y: 770, height: 20 }}
                    animate={{ y: -20, height: 810 }}
                    transition={{ delay: 0.4, duration: 3, ease: [0.5, 0, 0.9, 0.6] }}
                />
                <text x={1320} y={830} textAnchor="middle" fontSize={34} fontWeight={800} fill={ROD}>
                    1992
                </text>
            </g>
        );
    }
    // beat 4: sparepengene og lønna
    return (
        <g>
            <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0.18 }} transition={{ delay: 1.2, duration: 2.5 }}>
                {Array.from({ length: 6 }, (_, i) => (
                    <rect key={i} x={260} y={560 - i * 46} width={260} height={40} rx={6} fill="#4ade80" stroke="#166534" strokeWidth={4} />
                ))}
            </motion.g>
            <Tekst x={390} y={680} str={42}>
                Sparepenger
            </Tekst>
            <Tekst x={390} y={740} str={40} farge={ROD} forsinkelse={2.6}>
                verdiløse
            </Tekst>
            {[0, 1].map((i) => (
                <g key={i}>
                    <Person x={980 + i * 300} y={560} farge={i ? '#0ea5e9' : '#7c3aed'} />
                    <Tekst x={980 + i * 300} y={720} str={40} forsinkelse={1}>
                        {i ? 'Lege' : 'Lærer'}
                    </Tekst>
                </g>
            ))}
            <motion.g
                initial={{ opacity: 0, scale: 2, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: -10 }}
                transition={{ delay: 2.4, type: 'spring', stiffness: 260, damping: 16 }}
                style={{ transformOrigin: '1130px 240px' }}
            >
                <rect x={930} y={190} width={400} height={100} rx={12} fill="none" stroke={ROD} strokeWidth={10} />
                <text x={1130} y={262} textAnchor="middle" fontSize={64} fontWeight={900} fill={ROD}>
                    INGEN LØNN
                </text>
            </motion.g>
        </g>
    );
}

function Staten({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 160} y={y - 160} width={320} height={160} fill="#e7e5e4" stroke={MORK} strokeWidth={6} />
            <path d={`M ${x - 190} ${y - 160} L ${x} ${y - 260} L ${x + 190} ${y - 160} Z`} fill="#d6d3d1" stroke={MORK} strokeWidth={6} />
            {[-110, -40, 40, 110].map((dx) => (
                <rect key={dx} x={x + dx - 14} y={y - 140} width={28} height={140} fill="#f5f5f4" stroke={MORK} strokeWidth={4} />
            ))}
            <path
                d={`M ${x} ${y - 238} l 9 19 21 2 -16 14 5 21 -19 -11 -19 11 5 -21 -16 -14 21 -2 Z`}
                fill={ROD}
            />
        </g>
    );
}

function Marked({ x, y }: { x: number; y: number }) {
    const farger = ['#f97316', '#0ea5e9', '#22c55e'];
    return (
        <g>
            {farger.map((f, i) => {
                const bx = x - 190 + i * 130;
                return (
                    <g key={f}>
                        <rect x={bx} y={y - 90} width={110} height={90} fill="#fafaf9" stroke={MORK} strokeWidth={5} />
                        <path d={`M ${bx - 10} ${y - 90} L ${bx + 10} ${y - 150} L ${bx + 100} ${y - 150} L ${bx + 120} ${y - 90} Z`} fill={f} stroke={MORK} strokeWidth={5} />
                    </g>
                );
            })}
        </g>
    );
}

function Brod({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <path d={`M ${x - 200} ${y} Q ${x - 210} ${y - 170} ${x} ${y - 170} Q ${x + 210} ${y - 170} ${x + 200} ${y} Z`} fill="#d97706" stroke={MORK} strokeWidth={6} />
            {[-90, 0, 90].map((dx) => (
                <path key={dx} d={`M ${x + dx - 30} ${y - 130} Q ${x + dx} ${y - 100} ${x + dx + 30} ${y - 130}`} fill="none" stroke="#92400e" strokeWidth={8} strokeLinecap="round" />
            ))}
            <text x={x} y={y + 70} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                Brød
            </text>
        </g>
    );
}

function Person({ x, y, farge, skala = 1 }: { x: number; y: number; farge: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-150} r={34} fill="#fcd9b6" stroke={MORK} strokeWidth={5} />
            <path d="M -60 0 L -60 -70 Q -60 -110 -20 -110 L 20 -110 Q 60 -110 60 -70 L 60 0 Z" fill={farge} stroke={MORK} strokeWidth={5} />
        </g>
    );
}

/* ---------- Levealder ---------- */

function Levealder({ beat }: { beat: number }) {
    // Lengdene er bare til å se forskjellen. Bare forskjellen (sju år) står i artikkelen.
    const full = 980;
    const kort = full - 150;
    return (
        <g>
            <Tekst x={230} y={385} str={56} anker="end">
                1988
            </Tekst>
            <Person x={340} y={430} farge="#64748b" skala={0.55} />
            <motion.rect
                x={420}
                y={340}
                height={70}
                rx={14}
                fill="#0d9488"
                initial={{ width: 0 }}
                animate={{ width: full }}
                transition={{ delay: 0.4, duration: 1.8 }}
            />
            {beat >= 1 && (
                <>
                    <Tekst x={230} y={605} str={56} anker="end" farge={ROD}>
                        1994
                    </Tekst>
                    <Person x={340} y={650} farge="#64748b" skala={0.55} />
                    <motion.rect
                        x={420}
                        y={560}
                        height={70}
                        rx={14}
                        fill={ROD}
                        initial={{ width: full }}
                        animate={{ width: kort }}
                        transition={{ delay: 0.8, duration: 2 }}
                    />
                    <motion.rect
                        x={420 + kort}
                        y={560}
                        width={150}
                        height={70}
                        rx={14}
                        fill="none"
                        stroke={ROD}
                        strokeWidth={5}
                        strokeDasharray="14 10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.6 }}
                    />
                    <Tekst x={420 + kort + 75} y={700} str={48} farge={ROD} forsinkelse={2.8}>
                        sju år
                    </Tekst>
                </>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <rect x={420} y={760} width={980} height={90} rx={20} fill="#ffffff" stroke={MORK} strokeWidth={4} />
                    <text x={910} y={820} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        Født bare noen år senere, men et kortere liv
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/* ---------- Oligarker ---------- */

const SKATTER = [
    { navn: 'Oljefelt', farge: '#1e293b' },
    { navn: 'Gruver', farge: '#78716c' },
    { navn: 'Fabrikker', farge: '#b45309' },
];

function Oligarker({ beat }: { beat: number }) {
    return (
        <g>
            {SKATTER.map((s, i) => {
                const fra = { x: 340 + i * 460, y: 470 };
                const til = { x: 640 + i * 160, y: 250 };
                const flyttet = beat >= 1;
                return (
                    <motion.g
                        key={s.navn}
                        initial={false}
                        animate={{
                            x: flyttet ? til.x - fra.x : 0,
                            y: flyttet ? til.y - fra.y : 0,
                            scale: flyttet ? 0.55 : 1,
                            opacity: beat >= 2 ? 0 : 1,
                        }}
                        transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.4 + i * 0.15 }}
                        style={{ transformOrigin: `${fra.x}px ${fra.y}px` }}
                    >
                        <Skatt type={i} x={fra.x} y={fra.y} />
                        <text x={fra.x} y={fra.y + 130} textAnchor="middle" fontSize={44} fontWeight={800} fill={MORK}>
                            {s.navn}
                        </text>
                        {beat === 0 && (
                            <motion.g initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: -8 }} transition={{ delay: 1 + i * 0.4 }} style={{ transformOrigin: `${fra.x + 110}px ${fra.y - 120}px` }}>
                                <rect x={fra.x + 40} y={fra.y - 150} width={150} height={60} rx={10} fill="#fde68a" stroke={MORK} strokeWidth={4} />
                                <text x={fra.x + 115} y={fra.y - 108} textAnchor="middle" fontSize={30} fontWeight={900} fill={ROD}>
                                    billig!
                                </text>
                            </motion.g>
                        )}
                    </motion.g>
                );
            })}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                    {/* Pallen med de få */}
                    <motion.rect
                        x={560}
                        width={480}
                        fill={GULL}
                        stroke={MORK}
                        strokeWidth={5}
                        initial={false}
                        animate={{ y: beat >= 2 ? 360 : 520, height: beat >= 2 ? 200 : 40 }}
                        transition={{ duration: 1.2 }}
                    />
                    {[0, 1, 2, 3].map((i) => (
                        <motion.g key={i} initial={false} animate={{ y: beat >= 2 ? -160 : 0 }} transition={{ duration: 1.2 }}>
                            <Person x={630 + i * 113} y={520} farge="#0f172a" skala={0.75} />
                        </motion.g>
                    ))}
                </motion.g>
            )}
            {beat >= 2 &&
                Array.from({ length: 14 }, (_, i) => {
                    const x = 70 + i * 112 + (i >= 7 ? 0 : 0);
                    if (x > 540 && x < 1060) return null;
                    return (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.08 }}>
                            <Person x={x} y={770} farge="#94a3b8" skala={0.6} />
                            <rect x={x - 40} y={780} width={80} height={14} fill="#a16207" />
                        </motion.g>
                    );
                })}
            {beat >= 2 && (
                <Tekst x={800} y={845} str={38} farge="#475569" forsinkelse={1.6}>
                    Naboene selger eiendelene sine på gata
                </Tekst>
            )}
            {beat === 3 &&
                (
                    [
                        ['Kaos', 290, 300],
                        ['Fattigdom', 290, 450],
                        ['Skam', 1310, 375],
                    ] as const
                ).map(([t, x, y], i) => (
                    <motion.g
                        key={t}
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.6, type: 'spring' }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                        <rect x={x - 170} y={y - 50} width={340} height={100} rx={18} fill={ROD} />
                        <text x={x} y={y + 20} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff">
                            {t}
                        </text>
                    </motion.g>
                ))}
        </g>
    );
}

function Skatt({ type, x, y }: { type: number; x: number; y: number }) {
    if (type === 0) {
        return (
            <g>
                <path d={`M ${x - 60} ${y + 80} L ${x} ${y - 90} L ${x + 60} ${y + 80}`} fill="none" stroke={MORK} strokeWidth={10} />
                <path d={`M ${x - 36} ${y + 10} L ${x + 36} ${y + 10} M ${x - 48} ${y + 45} L ${x + 48} ${y + 45}`} stroke={MORK} strokeWidth={8} />
                <ellipse cx={x} cy={y + 85} rx={90} ry={16} fill="#0f172a" />
            </g>
        );
    }
    if (type === 1) {
        return (
            <g>
                <path d={`M ${x - 110} ${y + 80} L ${x - 30} ${y - 70} L ${x + 30} ${y - 10} L ${x + 60} ${y - 50} L ${x + 120} ${y + 80} Z`} fill="#a8a29e" stroke={MORK} strokeWidth={6} />
                <path d={`M ${x - 30} ${y + 80} L ${x - 30} ${y + 20} Q ${x} ${y - 10} ${x + 30} ${y + 20} L ${x + 30} ${y + 80} Z`} fill="#1c1917" />
            </g>
        );
    }
    return (
        <g>
            <path
                d={`M ${x - 110} ${y + 80} L ${x - 110} ${y - 10} L ${x - 55} ${y - 45} L ${x - 55} ${y - 10} L ${x} ${y - 45} L ${x} ${y - 10} L ${x + 110} ${y - 10} L ${x + 110} ${y + 80} Z`}
                fill="#d6d3d1"
                stroke={MORK}
                strokeWidth={6}
            />
            <rect x={x + 60} y={y - 110} width={26} height={100} fill="#d6d3d1" stroke={MORK} strokeWidth={6} />
        </g>
    );
}
