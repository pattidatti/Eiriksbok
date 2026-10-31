import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Legionærens utstyr og våpen som tegning i 2D:
 * - utstyr: én legionær med merkelapper på hver del
 * - pilum: spydet treffer et skjold, og jernet bøyer seg
 * - gladius: langt sverd trenger plass, romerne står tett og stikker
 * - motstander: legionæren mot en germansk kriger
 */

type Modus = 'utstyr' | 'pilum' | 'gladius' | 'motstander';

const ROD = '#b91c1c';
const GULL = '#ca8a04';
const JERN = '#6b7280';
const TRE = '#8b5a2b';
const MORK = '#0f172a';

const fram = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } };

/** Legionæren sett fra siden. (x, y) er føttene. */
function Legionaer({
    x,
    y,
    s = 1,
    opacity = 1,
}: {
    x: number;
    y: number;
    s?: number;
    opacity?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
            {/* Bein og benskinner */}
            <rect x={-38} y={-170} width={28} height={170} fill="#e2b48c" />
            <rect x={10} y={-170} width={28} height={170} fill="#e2b48c" />
            <rect x={-40} y={-120} width={32} height={95} rx={8} fill={JERN} />
            <rect x={8} y={-120} width={32} height={95} rx={8} fill={JERN} />
            <rect x={-46} y={-8} width={40} height={14} rx={4} fill="#5b3a1e" />
            <rect x={6} y={-8} width={40} height={14} rx={4} fill="#5b3a1e" />
            {/* Tunika */}
            <path d="M -60 -175 L 60 -175 L 70 -250 L -70 -250 Z" fill={ROD} />
            {/* Panser av metallplater */}
            <rect x={-66} y={-390} width={132} height={150} rx={20} fill="#9ca3af" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={-66} y={-370 + i * 28} width={132} height={8} fill="#6b7280" />
            ))}
            {/* Hode og hjelm */}
            <circle cx={0} cy={-440} r={46} fill="#e2b48c" />
            <path d="M -54 -440 A 54 54 0 0 1 54 -440 L 62 -425 L -62 -425 Z" fill="#a8a29e" />
            <rect x={-60} y={-430} width={24} height={50} rx={6} fill="#a8a29e" />
            <rect x={-6} y={-506} width={12} height={20} fill="#78716c" />
        </g>
    );
}

/** Det avlange, buede skjoldet sett forfra. */
function Skjold({ x, y, h = 330 }: { x: number; y: number; h?: number }) {
    const b = h * 0.62;
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-b / 2}
                y={-h / 2}
                width={b}
                height={h}
                rx={18}
                fill={ROD}
                stroke={JERN}
                strokeWidth={10}
            />
            <rect
                x={-b / 2 + 22}
                y={-h / 2 + 22}
                width={b - 44}
                height={h - 44}
                rx={10}
                fill="none"
                stroke={GULL}
                strokeWidth={4}
            />
            <rect x={-8} y={-h / 2 + 22} width={16} height={h - 44} fill={GULL} opacity={0.7} />
            <circle r={b * 0.17} fill={GULL} stroke="#a16207" strokeWidth={4} />
        </g>
    );
}

function Lapp({
    x,
    y,
    tekst,
    under,
    fraX,
    fraY,
    farge = MORK,
}: {
    x: number;
    y: number;
    tekst: string;
    under?: string;
    fraX?: number;
    fraY?: number;
    farge?: string;
}) {
    return (
        <motion.g {...fram}>
            {fraX !== undefined && fraY !== undefined && (
                <>
                    <line
                        x1={fraX}
                        y1={fraY}
                        x2={x - 16}
                        y2={y - 14}
                        stroke={farge}
                        strokeWidth={4}
                    />
                    <circle cx={fraX} cy={fraY} r={9} fill={farge} />
                </>
            )}
            <text x={x} y={y} fontSize={46} fontWeight={800} fill={farge}>
                {tekst}
            </text>
            {under && (
                <text x={x} y={y + 46} fontSize={34} fontWeight={600} fill="#475569">
                    {under}
                </text>
            )}
        </motion.g>
    );
}

function Utstyr({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 &&
                [-320, -160, 160, 320].map((dx) => (
                    <motion.g key={dx} {...fram}>
                        <Legionaer x={520 + dx} y={820} s={0.85} opacity={0.55} />
                    </motion.g>
                ))}
            <Legionaer x={520} y={820} s={beat === 0 ? 0.85 : 1.15} />
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <Skjold x={300} y={560} h={360} />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g {...fram}>
                    {/* Pilum og gladius ved siden av */}
                    <line x1={760} y1={830} x2={760} y2={180} stroke={TRE} strokeWidth={14} />
                    <line x1={760} y1={420} x2={760} y2={150} stroke={JERN} strokeWidth={7} />
                    <path d="M 748 160 L 760 115 L 772 160 Z" fill={JERN} />
                    <path
                        d="M 690 700 L 700 560 L 710 700 Z"
                        fill="#d1d5db"
                        stroke={JERN}
                        strokeWidth={3}
                    />
                    <rect x={680} y={700} width={40} height={10} fill={GULL} />
                    <rect x={694} y={710} width={12} height={40} fill={TRE} />
                </motion.g>
            )}
            {beat === 0 && (
                <Lapp x={980} y={300} tekst="Helt likt utstyr" under="til alle legionærene" />
            )}
            {beat === 1 && (
                <>
                    <Lapp x={980} y={260} tekst="Hjelm av metall" fraX={560} fraY={315} />
                    <Lapp
                        x={980}
                        y={430}
                        tekst="Panser"
                        under="på kroppen"
                        fraX={580}
                        fraY={470}
                    />
                    <Lapp
                        x={980}
                        y={650}
                        tekst="Benskinner"
                        under="på leggene"
                        fraX={570}
                        fraY={720}
                    />
                </>
            )}
            {beat === 2 && (
                <Lapp
                    x={980}
                    y={420}
                    tekst="Stort, avlangt skjold"
                    under="tre, lær utenpå, kant av jern"
                    fraX={400}
                    fraY={470}
                />
            )}
            {beat >= 3 && (
                <>
                    <Lapp x={980} y={300} tekst="Pilum" under="kastespyd" fraX={772} fraY={300} />
                    <Lapp
                        x={980}
                        y={620}
                        tekst="Gladius"
                        under="kort sverd"
                        fraX={720}
                        fraY={640}
                    />
                </>
            )}
        </>
    );
}

// ---------- Pilum ----------

/** Spydet som tre streker: spiss, jernhals og treskaft. */
const SPYD = {
    // Rett, midt i bildet.
    rett: { tupp: [1000, 450], bøy: [875, 450], ledd: [750, 450], ende: [250, 450] },
    // Rett i det øyeblikket det treffer skjoldet.
    treff: { tupp: [1150, 470], bøy: [1025, 470], ledd: [900, 470], ende: [400, 470] },
    // Jernet har bøyd seg, skaftet henger ned mot bakken.
    bøyd: { tupp: [1150, 470], bøy: [1040, 476], ledd: [945, 545], ende: [505, 760] },
};
type Spyd = (typeof SPYD)['rett'];
const jern = (s: Spyd) =>
    `M ${s.tupp[0]} ${s.tupp[1]} L ${s.bøy[0]} ${s.bøy[1]} L ${s.ledd[0]} ${s.ledd[1]}`;
const skaft = (s: Spyd) => `M ${s.ledd[0]} ${s.ledd[1]} L ${s.ende[0]} ${s.ende[1]}`;
const tupp = (s: Spyd) => {
    const [x, y] = s.tupp;
    const [bx, by] = s.bøy;
    const l = Math.hypot(x - bx, y - by);
    const ux = (x - bx) / l;
    const uy = (y - by) / l;
    return `M ${x + ux * 40} ${y + uy * 40} L ${x - uy * 16} ${y + ux * 16} L ${x + uy * 16} ${y - ux * 16} Z`;
};

function Pilum({ beat }: { beat: number }) {
    const flyr = beat === 1;
    const mal = beat === 0 ? SPYD.rett : SPYD.bøyd;
    const nokler = flyr ? [SPYD.rett, SPYD.treff, SPYD.bøyd] : [mal];
    const tider = {
        duration: flyr ? 2.6 : 0.6,
        times: flyr ? [0, 0.35, 1] : undefined,
        ease: 'easeInOut' as const,
    };
    return (
        <>
            {/* Bakken */}
            <rect x={0} y={770} width={1600} height={130} fill="#a3b06a" />
            {/* Fiendens skjold, sett fra siden */}
            {beat >= 1 && (
                <motion.g {...fram}>
                    <path
                        d="M 1150 250 Q 1185 470 1150 770 L 1180 770 Q 1215 470 1180 250 Z"
                        fill={beat >= 3 ? '#9a3412' : '#a16207'}
                    />
                    <text x={1210} y={230} fontSize={38} fontWeight={700} fill="#475569">
                        fiendens skjold
                    </text>
                </motion.g>
            )}
            <motion.path
                initial={false}
                animate={{ d: nokler.map(skaft) }}
                transition={tider}
                stroke={TRE}
                strokeWidth={20}
                strokeLinecap="round"
                fill="none"
            />
            <motion.path
                initial={false}
                animate={{ d: nokler.map(jern) }}
                transition={tider}
                stroke={beat === 0 ? '#2563eb' : JERN}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <motion.path
                initial={false}
                animate={{ d: nokler.map(tupp) }}
                transition={tider}
                fill="#374151"
            />
            {beat === 0 && (
                <>
                    <Lapp x={330} y={560} tekst="Tungt kastespyd" />
                    <Lapp x={760} y={330} tekst="Spiss av bløtt jern" farge="#2563eb" />
                </>
            )}
            {beat === 1 && <Lapp x={600} y={330} tekst="Jernet bøyer seg" farge="#2563eb" />}
            {beat === 2 && (
                <motion.g {...fram}>
                    <path
                        d="M 1100 410 Q 800 230 480 380"
                        fill="none"
                        stroke="#475569"
                        strokeWidth={8}
                        strokeDasharray="22 16"
                    />
                    <path d="M 480 380 L 520 342 L 530 398 Z" fill="#475569" />
                    <g transform="translate(790 295)">
                        <line
                            x1={-50}
                            y1={-50}
                            x2={50}
                            y2={50}
                            stroke="#dc2626"
                            strokeWidth={16}
                            strokeLinecap="round"
                        />
                        <line
                            x1={50}
                            y1={-50}
                            x2={-50}
                            y2={50}
                            stroke="#dc2626"
                            strokeWidth={16}
                            strokeLinecap="round"
                        />
                    </g>
                    <text x={560} y={495} fontSize={46} fontWeight={800} fill="#dc2626">
                        Kan ikke kastes tilbake
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g {...fram}>
                    <rect x={1010} y={790} width={480} height={80} rx={16} fill="#dc2626" />
                    <text
                        x={1250}
                        y={845}
                        fontSize={44}
                        fontWeight={800}
                        fill="#fff"
                        textAnchor="middle"
                    >
                        Skjoldet er ubrukelig
                    </text>
                </motion.g>
            )}
        </>
    );
}

// ---------- Gladius ----------

function Gladius({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <motion.g {...fram}>
                    {/* Gladius, stort */}
                    <path
                        d="M 420 470 L 1060 445 L 1160 470 L 1060 495 Z"
                        fill="#e5e7eb"
                        stroke={JERN}
                        strokeWidth={4}
                    />
                    <line x1={440} y1={470} x2={1080} y2={470} stroke="#9ca3af" strokeWidth={3} />
                    <rect x={395} y={400} width={25} height={140} rx={6} fill={GULL} />
                    <rect x={260} y={448} width={135} height={44} rx={14} fill={TRE} />
                    <circle cx={248} cy={470} r={30} fill={GULL} />
                    <text
                        x={800}
                        y={600}
                        fontSize={42}
                        fontWeight={700}
                        fill="#475569"
                        textAnchor="middle"
                    >
                        egg på begge sider
                    </text>
                    <path d="M 1190 470 L 1290 470" stroke="#2563eb" strokeWidth={10} />
                    <path d="M 1290 445 L 1330 470 L 1290 495 Z" fill="#2563eb" />
                    <text x={1200} y={560} fontSize={44} fontWeight={800} fill="#2563eb">
                        stikke
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g {...fram}>
                    {/* Venstre: tre fiender med lange sverd, sett ovenfra, med plassen de trenger */}
                    <text
                        x={400}
                        y={240}
                        fontSize={42}
                        fontWeight={800}
                        fill="#7c2d12"
                        textAnchor="middle"
                    >
                        Fiender med lange sverd
                    </text>
                    {[200, 400, 600].map((x, i) => (
                        <g key={x}>
                            <circle
                                cx={x}
                                cy={520}
                                r={95}
                                fill="#fed7aa"
                                opacity={0.5}
                                stroke="#c2410c"
                                strokeWidth={4}
                                strokeDasharray="14 10"
                            />
                            <circle cx={x} cy={520} r={26} fill="#7c2d12" />
                            <motion.line
                                x1={x}
                                y1={520}
                                x2={x + 90}
                                y2={520}
                                stroke={JERN}
                                strokeWidth={8}
                                strokeLinecap="round"
                                animate={{
                                    x2: [x + 90, x + 20, x - 70, x + 20, x + 90],
                                    y2: [520, 430, 520, 610, 520],
                                }}
                                transition={{
                                    duration: 2.4,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: 'linear',
                                }}
                            />
                        </g>
                    ))}
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g {...fram}>
                    <line x1={800} y1={210} x2={800} y2={800} stroke="#cbd5e1" strokeWidth={4} />
                    <text
                        x={1200}
                        y={240}
                        fontSize={42}
                        fontWeight={800}
                        fill={ROD}
                        textAnchor="middle"
                    >
                        Romerne: tett i tett
                    </text>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const x = 942 + i * 60;
                        return (
                            <g key={i}>
                                {/* Soldat bak, skjold foran (fronten peker oppover) */}
                                <circle cx={x} cy={560} r={24} fill="#7f1d1d" />
                                <rect
                                    x={x - 30}
                                    y={486}
                                    width={60}
                                    height={22}
                                    rx={6}
                                    fill={ROD}
                                    stroke={GULL}
                                    strokeWidth={3}
                                />
                            </g>
                        );
                    })}
                    <circle
                        cx={1122}
                        cy={560}
                        r={95}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={5}
                        strokeDasharray="14 10"
                    />
                    <text
                        x={1200}
                        y={720}
                        fontSize={36}
                        fontWeight={700}
                        fill="#dc2626"
                        textAnchor="middle"
                    >
                        ingen plass til å svinge
                    </text>
                </motion.g>
            )}
            {beat >= 3 &&
                [0, 1, 2, 3, 4, 5, 6].map((i) => {
                    const x = 942 + i * 60;
                    return (
                        <motion.line
                            key={i}
                            x1={x}
                            x2={x}
                            stroke={JERN}
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ y1: 540, y2: 540 }}
                            animate={{ y1: [540, 540, 540], y2: [540, 440, 540] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: (i % 3) * 0.3 }}
                        />
                    );
                })}
            {beat >= 3 && (
                <text
                    x={1200}
                    y={330}
                    fontSize={38}
                    fontWeight={800}
                    fill="#2563eb"
                    textAnchor="middle"
                >
                    stikker fram mellom skjoldene
                </text>
            )}
        </>
    );
}

// ---------- Motstander ----------

function Kriger({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-38} y={-200} width={30} height={200} fill="#6b7280" />
            <rect x={8} y={-200} width={30} height={200} fill="#57534e" />
            <path d="M -66 -190 L 66 -190 L 60 -390 L -60 -390 Z" fill="#3f6212" />
            <circle cx={0} cy={-440} r={46} fill="#e2b48c" />
            <path d="M -46 -455 Q 0 -520 46 -455 L 46 -470 Q 0 -540 -46 -470 Z" fill="#a16207" />
            <path d="M -36 -420 Q 0 -360 36 -420 Z" fill="#a16207" />
            {/* Rundt skjold og langt sverd */}
            <circle cx={-110} cy={-290} r={90} fill="#92400e" stroke="#451a03" strokeWidth={8} />
            <circle cx={-110} cy={-290} r={18} fill={JERN} />
            <line
                x1={80}
                y1={-260}
                x2={150}
                y2={-560}
                stroke="#d1d5db"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <line x1={62} y1={-262} x2={102} y2={-252} stroke={TRE} strokeWidth={10} />
        </g>
    );
}

const RADER = [
    { venstre: 'Soldat på heltid', hoyre: 'Bonde, kjempet ved behov', fraBeat: 1 },
    { venstre: 'Likt utstyr fra staten', hoyre: 'Skaffet sitt eget utstyr', fraBeat: 2 },
    { venstre: 'Streng formasjon', hoyre: 'Mann mot mann', fraBeat: 3 },
];

function Motstander({ beat }: { beat: number }) {
    return (
        <>
            <Legionaer x={230} y={830} s={0.95} />
            <Kriger x={1400} y={830} s={0.95} />
            <text x={230} y={240} fontSize={44} fontWeight={800} fill={ROD} textAnchor="middle">
                Legionær
            </text>
            <text
                x={1400}
                y={240}
                fontSize={44}
                fontWeight={800}
                fill="#3f6212"
                textAnchor="middle"
            >
                Germansk kriger
            </text>
            {RADER.filter((r) => beat >= r.fraBeat).map((r, i) => {
                const y = 360 + i * 150;
                return (
                    <motion.g
                        key={r.venstre}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect x={430} y={y - 50} width={360} height={84} rx={16} fill="#fee2e2" />
                        <text
                            x={610}
                            y={y + 6}
                            fontSize={34}
                            fontWeight={800}
                            fill={ROD}
                            textAnchor="middle"
                        >
                            {r.venstre}
                        </text>
                        <rect x={810} y={y - 50} width={360} height={84} rx={16} fill="#ecfccb" />
                        <text
                            x={990}
                            y={y + 6}
                            fontSize={30}
                            fontWeight={800}
                            fill="#3f6212"
                            textAnchor="middle"
                        >
                            {r.hoyre}
                        </text>
                    </motion.g>
                );
            })}
        </>
    );
}

const ETIKETTER: Record<Modus, string[]> = {
    utstyr: [
        'Likt utstyr fra staten',
        'Hjelm, panser og benskinner',
        'Skjoldet',
        'To viktige våpen',
    ],
    pilum: ['Pilum', 'Treff!', 'Ikke noe å kaste tilbake', 'Fiendens skjold er ubrukelig'],
    gladius: [
        'Gladius: et kort sverd',
        'Lange sverd trenger plass',
        'Romerne står tett',
        'Stikk fra muren av skjold',
    ],
    motstander: [
        'To måter å kjempe på',
        'Heltid eller ved behov?',
        'Hvem betaler utstyret?',
        'Formasjon eller mann mot mann?',
    ],
};

export function LegionenVapen({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'utstyr';
    const liste = ETIKETTER[modus];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-stone-50 to-stone-100">
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'utstyr' && <Utstyr beat={beat} />}
                {modus === 'pilum' && <Pilum beat={beat} />}
                {modus === 'gladius' && <Gladius beat={beat} />}
                {modus === 'motstander' && <Motstander beat={beat} />}
            </svg>
        </div>
    );
}
