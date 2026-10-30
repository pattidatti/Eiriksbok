import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Silkeveien som stafett, i SVG. Roma til venstre, Kina til høyre, og et nett av stier
 * mellom dem.
 *
 * Beat 0: bare de to endene og den lange avstanden. Beat 1: nettet av stier og etappene.
 * Beat 2: silkepakken går fra mellommann til mellommann. Beat 3: romeren og kineseren
 * står i hver sin ende og møtes ikke. Beat 4: silke går vestover, mynter og håndverksvarer
 * østover.
 */

const B = 1600;
const H = 900;
const LILLA = '#7e22ce';
const ROD = '#b91c1c';
const GULL = '#ca8a04';
const SAND = '#e7d3a8';

const ROMA = { x: 150, y: 470 };
const KINA = { x: 1450, y: 470 };

/** Etappene: mellommennene langs veien (ledd for ledd). */
const LEDD = [
    { x: 400, y: 420 },
    { x: 640, y: 520 },
    { x: 880, y: 430 },
    { x: 1120, y: 510 },
];

/** Stiene i nettet, som par av punkter. Flere stier mellom samme etapper. */
const PUNKT = [ROMA, ...LEDD, KINA];
const STIER: [number, number, number][] = [
    [0, 1, -40],
    [0, 1, 60],
    [1, 2, -50],
    [1, 2, 40],
    [2, 3, -60],
    [2, 3, 50],
    [3, 4, -40],
    [3, 4, 60],
    [4, 5, -50],
    [4, 5, 40],
    [0, 2, 150],
    [3, 5, -150],
];

function bue(a: { x: number; y: number }, b: { x: number; y: number }, h: number) {
    return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + h} ${b.x} ${b.y}`;
}

const TEKSTER = [
    'Roma og Kina: langt fra hverandre',
    'Ikke én vei, men et nett av stier',
    'Ledd for ledd, fra mellommann til mellommann',
    'Romere og kinesere møttes nesten aldri',
    'Silke vestover, mynter østover',
];

export function HandelStafett({ beat }: VisualProps) {
    const tekst = TEKSTER[Math.min(beat, TEKSTER.length - 1)];
    const nett = beat >= 1;
    const ender = beat === 3;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f4e7c9' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Landskapet: fjell og ørken */}
                <path
                    d="M 0 900 L 0 700 L 220 640 L 420 690 L 640 610 L 860 680 L 1080 600 L 1300 670 L 1600 620 L 1600 900 Z"
                    fill={SAND}
                />
                <path
                    d="M 300 300 L 420 200 L 520 300 Z M 760 290 L 900 160 L 1020 290 Z M 1160 300 L 1260 210 L 1360 300 Z"
                    fill="#d6c3a0"
                    opacity={0.8}
                />
                <text
                    x={800}
                    y={800}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#78350f"
                >
                    Sentral-Asia
                </text>

                {/* Avstanden i beat 0 */}
                {beat === 0 && (
                    <motion.path
                        d={`M ${ROMA.x + 70} ${ROMA.y} L ${KINA.x - 70} ${KINA.y}`}
                        stroke="#78716c"
                        strokeWidth={6}
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                )}

                {/* Nettet av stier */}
                {nett &&
                    STIER.map(([a, b, h], i) => (
                        <motion.path
                            key={i}
                            d={bue(PUNKT[a], PUNKT[b], h)}
                            fill="none"
                            stroke="#a16207"
                            strokeWidth={4}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: ender ? 0.25 : 0.6 }}
                            transition={{ delay: beat === 1 ? i * 0.15 : 0, duration: 1 }}
                        />
                    ))}

                {/* Mellommennene */}
                {nett &&
                    LEDD.map((l, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: ender ? 0.35 : 1 }}
                            transition={{ delay: beat === 1 ? 0.6 + i * 0.25 : 0 }}
                        >
                            <Person x={l.x} y={l.y} farge="#57534e" />
                        </motion.g>
                    ))}

                {/* Silkepakken går ledd for ledd */}
                {beat === 2 && <Stafett />}

                {/* Flyten begge veier */}
                {beat >= 4 && (
                    <>
                        <Flyt fra={KINA.x - 80} til={ROMA.x + 80} y={330} type="silke" />
                        <Flyt fra={ROMA.x + 80} til={KINA.x - 80} y={640} type="mynt" />
                        <text
                            x={800}
                            y={290}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill={LILLA}
                            stroke="#f4e7c9"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Silke går vestover
                        </text>
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill={GULL}
                            stroke="#f4e7c9"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Håndverksvarer og mynter av sølv og gull går østover
                        </text>
                    </>
                )}

                {/* Endene */}
                <Ende x={ROMA.x} y={ROMA.y} navn="Roma" farge={LILLA} fremhevet={ender} />
                <Ende x={KINA.x} y={KINA.y} navn="Kina" farge={ROD} fremhevet={ender} />
                {ender && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <circle
                            cx={800}
                            cy={470}
                            r={60}
                            fill="#ffffff"
                            stroke={ROD}
                            strokeWidth={8}
                        />
                        <path
                            d="M 760 430 L 840 510 M 840 430 L 760 510"
                            stroke={ROD}
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <text
                            x={800}
                            y={590}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#1c1917"
                        >
                            Få reiste hele veien
                        </text>
                    </motion.g>
                )}
            </svg>
            <motion.div
                key={beat}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap bg-white/90 text-slate-900"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

function Person({
    x,
    y,
    farge,
    stor = false,
}: {
    x: number;
    y: number;
    farge: string;
    stor?: boolean;
}) {
    const s = stor ? 1.5 : 1;
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cy={-34} r={15} fill={farge} />
            <path d="M -20 30 L -16 -12 Q 0 -22 16 -12 L 20 30 Z" fill={farge} />
        </g>
    );
}

function Ende({
    x,
    y,
    navn,
    farge,
    fremhevet,
}: {
    x: number;
    y: number;
    navn: string;
    farge: string;
    fremhevet: boolean;
}) {
    return (
        <motion.g initial={false} animate={{ opacity: 1 }}>
            <circle
                cx={x}
                cy={y}
                r={78}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={fremhevet ? 10 : 6}
            />
            <Person x={x} y={y + 20} farge={farge} stor />
            <text
                x={x}
                y={y + 130}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={farge}
                stroke="#f4e7c9"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
}

/** Silkepakken hopper fra Kina, gjennom hver mellommann, til Roma. Gjentas. */
function Stafett() {
    const vei = [KINA, ...[...LEDD].reverse(), ROMA];
    const xs = vei.map((p) => p.x);
    const ys = vei.map((p) => p.y - 70);
    const tider = vei.map((_, i) => i / (vei.length - 1));
    return (
        <motion.g
            initial={{ x: xs[0], y: ys[0] }}
            animate={{ x: xs, y: ys }}
            transition={{ duration: 6, times: tider, repeat: Infinity, ease: 'easeInOut' }}
        >
            <Silke />
        </motion.g>
    );
}

function Silke() {
    return (
        <g>
            <rect
                x={-30}
                y={-18}
                width={60}
                height={36}
                rx={10}
                fill={LILLA}
                stroke="#ffffff"
                strokeWidth={4}
            />
            <path d="M -30 -4 L 30 -4" stroke="#f0abfc" strokeWidth={4} />
            <path d="M -10 -18 L -10 18" stroke="#fde68a" strokeWidth={4} />
        </g>
    );
}

function Mynt() {
    return (
        <g>
            <circle r={18} fill="#facc15" stroke="#a16207" strokeWidth={4} />
            <circle cx={30} r={14} fill="#e5e7eb" stroke="#6b7280" strokeWidth={4} />
        </g>
    );
}

function Flyt({
    fra,
    til,
    y,
    type,
}: {
    fra: number;
    til: number;
    y: number;
    type: 'silke' | 'mynt';
}) {
    return (
        <g>
            {Array.from({ length: 5 }, (_, i) => (
                <motion.g
                    key={i}
                    initial={{ x: fra, y, opacity: 0 }}
                    animate={{ x: [fra, til], y, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 5, delay: i, repeat: Infinity, ease: 'linear' }}
                >
                    {type === 'silke' ? <Silke /> : <Mynt />}
                </motion.g>
            ))}
        </g>
    );
}
