import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';

/**
 * Bønn i de indiske tradisjonene, tegnet i 2D.
 * «puja»: et lite husalter. Gavene kommer fram én og én, guden tas imot som æresgjest,
 * familien gjør det selv hjemme, og de hellige ordene følger med handlingene.
 * «flagg»: buddhismen. En som mediterer under en tom himmel, det som virker innover,
 * noen å be til, en bønnekjede som teller, og bønneflagg i vinden.
 */

type Modus = 'puja' | 'flagg';

const B = 1600;
const H = 900;

const TEKST: Record<Modus, string[]> = {
    puja: [
        'Hinduismen: puja',
        'Mat, drikke, lys og røkelse',
        'Guden som æresgjest',
        'Hjemme, ved husalteret',
        'Ord og handling sammen',
    ],
    flagg: [
        'Buddhismen: ingen skapergud',
        'Det virker innover',
        'Noen å be til',
        'Bønnekjeden holder tellingen',
        'Bønneflagg i vinden',
    ],
};

function Vis({
    nar,
    children,
    delay = 0,
}: {
    nar: boolean;
    children: React.ReactNode;
    delay?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.5 }}
        >
            {children}
        </motion.g>
    );
}

function Merkelapp({
    x,
    y,
    tekst,
    farge = '#0f172a',
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={36}
            fontWeight={900}
            fill={farge}
            stroke="#fffbeb"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Flamme({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x} ${y - 46} Q ${x + 18} ${y - 14} ${x} ${y} Q ${x - 18} ${y - 14} ${x} ${y - 46} Z`}
            fill="#f97316"
        >
            <animate attributeName="opacity" values="1;0.7;1" dur="0.8s" repeatCount="indefinite" />
        </path>
    );
}

function Puja({ beat }: { beat: number }) {
    return (
        <>
            {/* Huset rundt alteret */}
            <Vis nar={beat >= 3}>
                <path
                    d="M 330 360 L 800 150 L 1270 360"
                    fill="none"
                    stroke="#92400e"
                    strokeWidth={14}
                    strokeLinejoin="round"
                />
                <rect
                    x={360}
                    y={360}
                    width={880}
                    height={430}
                    fill="none"
                    stroke="#92400e"
                    strokeWidth={10}
                />
            </Vis>
            <g transform="translate(800 720) scale(1.3) translate(-800 -720)">
                {/* Nisjen og gudebildet */}
                <motion.g animate={{ opacity: 1 }}>
                    <path
                        d="M 680 640 L 680 400 Q 800 300 920 400 L 920 640 Z"
                        fill="#fde68a"
                        stroke="#b45309"
                        strokeWidth={6}
                    />
                    {beat >= 2 && (
                        <circle cx={800} cy={480} r={120} fill="#fbbf24" opacity={0.35}>
                            <animate
                                attributeName="r"
                                values="100;130;100"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    )}
                    <circle cx={800} cy={470} r={34} fill="#d97706" />
                    <path d="M 750 620 Q 750 520 800 510 Q 850 520 850 620 Z" fill="#d97706" />
                    {beat >= 1 && (
                        <path
                            d="M 760 520 Q 800 570 840 520"
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={10}
                            strokeDasharray="2 14"
                            strokeLinecap="round"
                        />
                    )}
                </motion.g>
                {/* Alterbordet */}
                <rect x={560} y={640} width={480} height={34} rx={8} fill="#7c2d12" />
                <rect x={590} y={674} width={24} height={110} fill="#7c2d12" />
                <rect x={986} y={674} width={24} height={110} fill="#7c2d12" />
                {/* Gavene */}
                <Vis nar={beat >= 1}>
                    {/* Lampe */}
                    <path d="M 600 640 Q 630 610 660 640 Z" fill="#b45309" />
                    <Flamme x={630} y={612} />
                </Vis>
                <Vis nar={beat >= 1} delay={0.4}>
                    {/* Røkelse med røyk */}
                    <line x1={700} y1={640} x2={712} y2={560} stroke="#78350f" strokeWidth={5} />
                    <path
                        d="M 712 556 Q 690 520 714 490 Q 738 460 716 420"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={6}
                        strokeLinecap="round"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.9;0.3;0.9"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>
                </Vis>
                <Vis nar={beat >= 1} delay={0.8}>
                    {/* Blomster */}
                    {[880, 910, 940].map((x, i) => (
                        <circle
                            key={x}
                            cx={x}
                            cy={622 - (i % 2) * 14}
                            r={16}
                            fill={i === 1 ? '#facc15' : '#f97316'}
                        />
                    ))}
                </Vis>
                <Vis nar={beat >= 1} delay={1.2}>
                    {/* Mat og vann */}
                    <path d="M 970 640 Q 1000 690 1030 640 Z" fill="#a16207" />
                    <circle cx={985} cy={630} r={10} fill="#fef3c7" />
                    <circle cx={1005} cy={628} r={11} fill="#fde047" />
                    <path d="M 820 640 L 830 600 L 850 600 L 860 640 Z" fill="#0ea5e9" />
                </Vis>
            </g>
            {beat === 0 && (
                <>
                    {/* To hender som gir en blomst */}
                    <path
                        d="M 650 860 Q 690 760 760 740 L 790 760 Q 740 790 720 860 Z"
                        fill="#c68642"
                    />
                    <path
                        d="M 950 860 Q 910 760 840 740 L 810 760 Q 860 790 880 860 Z"
                        fill="#c68642"
                    />
                    <circle cx={800} cy={740} r={22} fill="#f97316" />
                    <Merkelapp x={1160} y={480} tekst="Puja:" anker="start" />
                    <Merkelapp
                        x={1160}
                        y={530}
                        tekst="å dyrke en gud"
                        anker="start"
                        farge="#92400e"
                    />
                </>
            )}
            {beat === 1 && (
                <Merkelapp
                    x={800}
                    y={860}
                    tekst="lys, røkelse, blomster, mat og vann"
                    farge="#92400e"
                />
            )}
            {beat === 2 && (
                <>
                    <Merkelapp
                        x={1150}
                        y={430}
                        tekst="Guden kommer"
                        anker="start"
                        farge="#92400e"
                    />
                    <Merkelapp x={1150} y={480} tekst="på besøk" anker="start" farge="#92400e" />
                </>
            )}
            <Vis nar={beat >= 3}>
                {/* Familien */}
                {[1330, 1420, 1500].map((x, i) => (
                    <g key={x}>
                        <circle
                            cx={x}
                            cy={630 + (i === 2 ? 30 : 0)}
                            r={i === 2 ? 22 : 28}
                            fill="#7c2d12"
                        />
                        <rect
                            x={x - (i === 2 ? 26 : 34)}
                            y={(i === 2 ? 660 : 660) + (i === 2 ? 20 : 0)}
                            width={i === 2 ? 52 : 68}
                            height={i === 2 ? 100 : 130}
                            rx={24}
                            fill={['#db2777', '#0d9488', '#f59e0b'][i]}
                        />
                    </g>
                ))}
                {beat === 3 && (
                    <>
                        <Merkelapp x={110} y={470} tekst="Ingen prest" anker="start" />
                        <Kryss x={80} y={458} />
                        <Merkelapp x={110} y={560} tekst="Ingen fast tid" anker="start" />
                        <Kryss x={80} y={548} />
                    </>
                )}
            </Vis>
            <Vis nar={beat >= 4}>
                {[0, 1, 2].map((i) => (
                    <path
                        key={i}
                        d={`M ${1290 - i * 10} ${600 - i * 26} Q ${1150} ${540 - i * 40} ${960} ${520 - i * 30}`}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={5}
                        strokeLinecap="round"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.2;1;0.2"
                            dur="2s"
                            begin={`${i * 0.4}s`}
                            repeatCount="indefinite"
                        />
                    </path>
                ))}
                <rect
                    x={20}
                    y={420}
                    width={300}
                    height={150}
                    rx={22}
                    fill="#ffffff"
                    stroke="#b45309"
                    strokeWidth={5}
                />
                <text
                    x={170}
                    y={480}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Mantraer
                </text>
                <text
                    x={170}
                    y={530}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#92400e"
                >
                    + handlingene
                </text>
            </Vis>
        </>
    );
}

function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 14} ${y - 14} L ${x + 14} ${y + 14} M ${x + 14} ${y - 14} L ${x - 14} ${y + 14}`}
            stroke="#dc2626"
            strokeWidth={8}
            strokeLinecap="round"
        />
    );
}

/** En som sitter i meditasjon, sett forfra. */
function Mediterer({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <ellipse cx={x} cy={y + 70} rx={150} ry={40} fill="#92400e" />
            <path
                d={`M ${x - 140} ${y + 60} Q ${x} ${y - 10} ${x + 140} ${y + 60} Z`}
                fill="#b45309"
            />
            <path
                d={`M ${x - 70} ${y + 30} L ${x - 60} ${y - 120} Q ${x} ${y - 150} ${x + 60} ${y - 120} L ${x + 70} ${y + 30} Z`}
                fill="#c2410c"
            />
            <circle cx={x} cy={y - 175} r={46} fill="#a16207" />
        </g>
    );
}

function Flagg({ beat }: { beat: number }) {
    const fx = 800;
    const fy = 700;
    const farger = ['#2563eb', '#f8fafc', '#dc2626', '#16a34a', '#facc15'];
    const flagg = Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        const x = 120 + t * 1360;
        const y = 300 + Math.sin(t * Math.PI) * 90;
        return { x, y, farge: farger[i % 5] };
    });
    return (
        <>
            {/* Fjellene */}
            <path
                d="M 0 640 L 260 360 L 470 560 L 720 300 L 980 580 L 1210 380 L 1600 640 L 1600 900 L 0 900 Z"
                fill="#94a3b8"
            />
            <path d="M 650 375 L 720 300 L 790 375 Z" fill="#f8fafc" />
            <path d="M 1150 440 L 1210 380 L 1270 440 Z" fill="#f8fafc" />
            <rect x={0} y={760} width={B} height={140} fill="#78716c" />
            <Mediterer x={fx} y={fy} />
            <Vis nar={beat === 0}>
                <circle
                    cx={800}
                    cy={300}
                    r={110}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={6}
                    strokeDasharray="14 14"
                />
                <Kryss x={800} y={300} />
                <Merkelapp x={800} y={470} tekst="Ingen gud som har skapt verden" />
            </Vis>
            <Vis nar={beat === 1}>
                {[0, 1, 2].map((i) => (
                    <circle
                        key={i}
                        cx={fx}
                        cy={fy - 120}
                        r={160}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={6}
                    >
                        <animate
                            attributeName="r"
                            values="260;40"
                            dur="2.4s"
                            begin={`${i * 0.8}s`}
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0;1;0"
                            dur="2.4s"
                            begin={`${i * 0.8}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                ))}
                <Merkelapp x={1180} y={470} tekst="Virker på deg selv" anker="start" />
                <Merkelapp x={420} y={470} tekst="Bønn eller meditasjon?" anker="end" />
            </Vis>
            <Vis nar={beat === 2}>
                {[
                    { x: 360, l1: 'Amitabha', l2: 'noen buddhister roper' },
                    { x: 1240, l1: 'Bodhisattvaer', l2: 'lovet å hjelpe andre' },
                ].map((k) => (
                    <g key={k.x}>
                        <circle cx={k.x} cy={300} r={80} fill="#fde68a" opacity={0.85} />
                        <circle cx={k.x} cy={300} r={40} fill="#f59e0b" />
                        <rect
                            x={k.x - 210}
                            y={400}
                            width={420}
                            height={110}
                            rx={20}
                            fill="#ffffff"
                        />
                        <text
                            x={k.x}
                            y={448}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            {k.l1}
                        </text>
                        <text
                            x={k.x}
                            y={492}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#64748b"
                        >
                            {k.l2}
                        </text>
                    </g>
                ))}
                <path
                    d="M 740 470 Q 560 400 470 330"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={6}
                    strokeDasharray="10 12"
                />
                <path
                    d="M 860 470 Q 1040 400 1130 330"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={6}
                    strokeDasharray="10 12"
                />
            </Vis>
            <Vis nar={beat === 3}>
                <Bonnekjede cx={1250} cy={420} />
                <rect x={160} y={360} width={480} height={130} rx={22} fill="#ffffff" />
                <text
                    x={400}
                    y={414}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Gjentatt opptil
                </text>
                <text
                    x={400}
                    y={462}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#b45309"
                >
                    flere hundre tusen ganger
                </text>
            </Vis>
            <Vis nar={beat >= 4}>
                <path
                    d={`M 120 300 Q 800 480 1480 300`}
                    fill="none"
                    stroke="#44403c"
                    strokeWidth={4}
                />
                {flagg.map((f, i) => (
                    <g key={i}>
                        <rect
                            x={f.x - 34}
                            y={f.y}
                            width={68}
                            height={86}
                            fill={f.farge}
                            stroke="#cbd5e1"
                            strokeWidth={2}
                        >
                            <animateTransform
                                attributeName="transform"
                                type="skewX"
                                values="0;-12;0;8;0"
                                dur={`${1.6 + (i % 3) * 0.3}s`}
                                repeatCount="indefinite"
                                additive="sum"
                            />
                        </rect>
                        <line
                            x1={f.x - 18}
                            y1={f.y + 30}
                            x2={f.x + 18}
                            y2={f.y + 30}
                            stroke="#64748b"
                            strokeWidth={3}
                        />
                        <line
                            x1={f.x - 18}
                            y1={f.y + 46}
                            x2={f.x + 14}
                            y2={f.y + 46}
                            stroke="#64748b"
                            strokeWidth={3}
                        />
                        <line
                            x1={f.x - 18}
                            y1={f.y + 62}
                            x2={f.x + 18}
                            y2={f.y + 62}
                            stroke="#64748b"
                            strokeWidth={3}
                        />
                    </g>
                ))}
                <Merkelapp x={800} y={850} tekst="Bønnene regnes som sagt fram" />
            </Vis>
        </>
    );
}

/** En bønnekjede med perler. En lys perle går rundt og teller. */
function Bonnekjede({ cx, cy }: { cx: number; cy: number }) {
    const n = 27;
    const r = 150;
    return (
        <g>
            {Array.from({ length: n }, (_, i) => {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                return (
                    <circle
                        key={i}
                        cx={cx + Math.cos(a) * r}
                        cy={cy + Math.sin(a) * r}
                        r={16}
                        fill="#7c2d12"
                    />
                );
            })}
            <circle cx={cx} cy={cy - r} r={22} fill="#facc15">
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${cx} ${cy}`}
                    to={`360 ${cx} ${cy}`}
                    dur="6s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx={cx} cy={cy + r + 40} r={20} fill="#b45309" />
        </g>
    );
}

export function BonnAlter({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'puja';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: modus === 'puja' ? '#fffbeb' : '#bae6fd' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'puja' ? <Puja beat={beat} /> : <Flagg beat={beat} />}
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
