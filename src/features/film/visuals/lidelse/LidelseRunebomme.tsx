import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Samisk religion, gjestestemmen:
 * 0 et landskap der fjell, stein og tre har sin egen kraft
 * 1 noaiden med runebommen ved den syke: å gjøre noe
 * 2 runebommene samles inn og brennes
 * 3 fra rundt 1850: en tidslinje der samene skal bli nordmenn
 * 4 tre unnskyldninger på tidslinja
 * 5 språk, joik og stedsnavn stiger opp over landskapet igjen
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const ROD = '#b91c1c';

function T({
    x,
    y,
    str = 36,
    farge = '#0f172a',
    vekt = 800,
    children,
}: {
    x: number;
    y: number;
    str?: number;
    farge?: string;
    vekt?: number;
    children: ReactNode;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            style={FONT}
        >
            {children}
        </text>
    );
}

function Inn({
    vis,
    children,
    forsinkelse = 0,
}: {
    vis: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

/** Runebommen: oval tromme med enkle figurer malt på skinnet. */
function Bomme({ farge = ROD, skinn = '#f3e2c3' }: { farge?: string; skinn?: string }) {
    return (
        <g>
            <ellipse rx={92} ry={120} fill={skinn} stroke="#7c4a1e" strokeWidth={10} />
            <g stroke={farge} strokeWidth={5} fill="none" strokeLinecap="round">
                <line x1={-80} y1={-30} x2={80} y2={-30} />
                <line x1={-86} y1={30} x2={86} y2={30} />
                <circle cx={0} cy={0} r={18} fill={farge} />
                <path d="M -40 -80 L -40 -46 M -52 -66 L -28 -66 M -40 -46 L -50 -34 M -40 -46 L -30 -34" />
                <path d="M 30 -84 L 30 -48 M 18 -70 L 42 -70 M 30 -48 L 20 -36 M 30 -48 L 40 -36" />
                <path d="M -50 60 Q -30 40 -10 60 Q 10 80 30 60 Q 50 40 60 64" />
                <path d="M -20 84 L 0 100 L 20 84" />
            </g>
        </g>
    );
}

function Landskap({ farge }: { farge: string }) {
    return (
        <g>
            <path
                d="M 0 640 L 260 360 L 420 520 L 640 300 L 900 600 L 1100 420 L 1360 560 L 1600 380 L 1600 900 L 0 900 Z"
                fill={farge}
            />
            <path d="M 640 300 L 590 356 L 640 340 L 690 356 Z" fill="#ffffff" />
            <path d="M 260 360 L 220 404 L 262 392 L 300 404 Z" fill="#ffffff" />
            <path
                d="M 0 720 Q 400 660 800 700 Q 1200 740 1600 690 L 1600 900 L 0 900 Z"
                fill="#cbd5c0"
            />
        </g>
    );
}

function Kraft({ x, y, beat }: { x: number; y: number; beat: number }) {
    return (
        <motion.circle
            cx={x}
            cy={y}
            r={60}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={6}
            initial={false}
            animate={{
                r: beat === 0 ? [40, 90, 40] : 40,
                opacity: beat === 0 ? [0.9, 0.2, 0.9] : 0,
            }}
            transition={{ duration: 2.6, repeat: beat === 0 ? Infinity : 0 }}
        />
    );
}

function Flammer({ vis }: { vis: boolean }) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: vis ? 1 : 0, scaleY: vis ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 1.2, repeat: vis ? Infinity : 0 }}
            style={{ transformOrigin: '800px 700px' }}
        >
            <path
                d="M 640 700 Q 660 560 720 600 Q 730 470 800 520 Q 860 420 880 590 Q 940 540 960 700 Z"
                fill="#f97316"
                opacity={0.85}
            />
            <path
                d="M 700 700 Q 720 610 760 630 Q 790 560 820 620 Q 870 590 900 700 Z"
                fill="#fde047"
                opacity={0.9}
            />
        </motion.g>
    );
}

const AAR = [
    { ar: '1989', hvem: 'kong Olav V', x: 860 },
    { ar: '1997', hvem: 'kong Harald V', x: 1110 },
    { ar: '1999', hvem: 'statsminister Bondevik', x: 1360 },
];

function Tidslinje({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={80} y={560} width={1440} height={300} rx={30} fill="#ffffff" />
            <line
                x1={160}
                y1={680}
                x2={1440}
                y2={680}
                stroke="#cbd5e1"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <motion.line
                x1={160}
                y1={680}
                x2={1440}
                y2={680}
                stroke={ROD}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 3 ? (beat >= 4 ? 1 : 0.5) : 0 }}
                transition={{ duration: 1.8, delay: 0.4 }}
            />
            <circle cx={180} cy={680} r={22} fill={ROD} />
            <T x={180} y={636} str={40} vekt={900}>
                ca. 1850
            </T>
            <T x={420} y={756} str={32} farge="#7f1d1d" vekt={800}>
                politikken starter
            </T>
            {AAR.map((a, i) => (
                <Inn key={a.ar} vis={beat >= 4} forsinkelse={0.6 + i * 0.7}>
                    <circle cx={a.x} cy={680} r={22} fill="#0f766e" />
                    <T x={a.x} y={636} str={40} farge="#0f766e" vekt={900}>
                        {a.ar}
                    </T>
                    <T x={a.x} y={730} str={26} farge="#334155" vekt={700}>
                        {a.hvem}
                    </T>
                </Inn>
            ))}
            <Inn vis={beat >= 4} forsinkelse={2.8}>
                <T x={1110} y={810} str={36} farge="#0f766e" vekt={900}>
                    Unnskyldning
                </T>
            </Inn>
        </g>
    );
}

export function LidelseRunebomme({ beat }: VisualProps<Record<string, never>>) {
    const morkt = beat === 2 || beat === 3;
    const himmel = morkt ? '#3f3a4a' : beat === 5 ? '#fde7c8' : '#dbe7ef';
    return (
        <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ background: himmel }}
            transition={{ duration: 0.8 }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Landskap farge={morkt ? '#57534e' : '#6b8f71'} />

                {/* 0: naturen lever */}
                <Kraft x={640} y={330} beat={beat} />
                <Kraft x={1100} y={450} beat={beat} />
                <g transform="translate(300 700)">
                    <rect x={-10} y={-20} width={20} height={60} fill="#78350f" />
                    <path d="M 0 -150 L -60 -10 L 60 -10 Z" fill="#166534" />
                    <path d="M 0 -200 L -46 -90 L 46 -90 Z" fill="#15803d" />
                </g>
                <Kraft x={300} y={600} beat={beat} />
                <ellipse cx={1240} cy={760} rx={90} ry={50} fill="#a8a29e" />
                <Kraft x={1240} y={750} beat={beat} />
                <Inn vis={beat === 0}>
                    <rect x={420} y={60} width={760} height={110} rx={28} fill="#ffffff" />
                    <T x={800} y={130} str={44} vekt={900}>
                        Fjell, stein og tre har kraft
                    </T>
                </Inn>

                {/* 1: noaiden handler */}
                <Inn vis={beat === 1}>
                    <rect x={260} y={50} width={1080} height={110} rx={28} fill="#ffffff" />
                    <T x={800} y={122} str={44} vekt={900}>
                        Blir noen syk: gjør noe
                    </T>
                    <g transform="translate(560 720)">
                        <circle cx={0} cy={-170} r={36} fill="#e0b98a" />
                        <path d="M -56 -130 Q 0 -146 56 -130 L 66 0 L -66 0 Z" fill="#1d4ed8" />
                        <rect x={-66} y={-60} width={132} height={14} fill={ROD} />
                        <rect x={-66} y={-30} width={132} height={10} fill="#facc15" />
                    </g>
                    <motion.g
                        initial={false}
                        animate={{ rotate: beat === 1 ? [-6, 6, -6] : 0 }}
                        transition={{ duration: 0.8, repeat: beat === 1 ? Infinity : 0 }}
                        style={{ transformOrigin: '720px 560px' }}
                    >
                        <g transform="translate(720 560) scale(0.8)">
                            <Bomme />
                        </g>
                    </motion.g>
                    <g transform="translate(1060 760)">
                        <rect x={-150} y={-30} width={300} height={40} rx={14} fill="#a16207" />
                        <circle cx={-110} cy={-58} r={30} fill="#e0b98a" />
                        <path d="M -80 -76 Q 40 -86 140 -58 L 140 -30 L -80 -30 Z" fill="#94a3b8" />
                    </g>
                    <T x={560} y={790} str={34} farge="#1e293b" vekt={900}>
                        noaiden, sjamanen
                    </T>
                    <T x={1060} y={830} str={30} farge="#1e293b" vekt={800}>
                        den syke
                    </T>
                    <Inn vis={beat === 1} forsinkelse={1.6}>
                        <path
                            d="M 800 470 Q 900 380 980 640"
                            fill="none"
                            stroke="#facc15"
                            strokeWidth={8}
                            strokeDasharray="6 18"
                            strokeLinecap="round"
                        />
                        <rect x={900} y={300} width={420} height={96} rx={24} fill="#ffffff" />
                        <T x={1110} y={362} str={34} farge="#0f766e" vekt={900}>
                            spør og gjør frisk
                        </T>
                    </Inn>
                </Inn>

                {/* 2: runebommene brennes */}
                <Inn vis={beat === 2}>
                    <rect x={340} y={50} width={920} height={110} rx={28} fill="#ffffff" />
                    <T x={800} y={122} str={44} farge={ROD} vekt={900}>
                        Runebommene brennes
                    </T>
                    <Flammer vis={beat === 2} />
                    {[-1, 0, 1].map((i) => (
                        <motion.g
                            key={i}
                            initial={false}
                            animate={{
                                y: beat === 2 ? 0 : -160,
                                opacity: beat === 2 ? [1, 1, 0.35] : 1,
                            }}
                            transition={{ duration: 3.2, delay: 0.3 + (i + 1) * 0.5 }}
                        >
                            <g
                                transform={`translate(${800 + i * 150} 560) rotate(${i * 20}) scale(0.62)`}
                            >
                                <Bomme farge="#57534e" skinn="#d6c3a5" />
                            </g>
                        </motion.g>
                    ))}
                    <T x={800} y={820} str={36} farge="#3f3a4a" vekt={800}>
                        de hellige trommene
                    </T>
                </Inn>

                {/* 3-4: tidslinja */}
                <Inn vis={beat === 3 || beat === 4}>
                    <rect x={300} y={60} width={1000} height={110} rx={28} fill="#ffffff" />
                    <T x={800} y={132} str={44} vekt={900}>
                        {beat >= 4 ? 'Tre unnskyldninger' : 'Samer skal bli norske'}
                    </T>
                    <Tidslinje beat={beat} />
                </Inn>

                {/* 5: lever videre */}
                <Inn vis={beat === 5}>
                    <g transform="translate(800 380) scale(0.9)">
                        <Bomme />
                    </g>
                    {[
                        { ord: 'språk', x: 360, y: 300 },
                        { ord: 'joik', x: 1240, y: 260 },
                        { ord: 'stedsnavn', x: 1260, y: 560 },
                    ].map((o, i) => (
                        <motion.g
                            key={o.ord}
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: beat === 5 ? 1 : 0, y: beat === 5 ? 0 : 60 }}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.7 }}
                        >
                            <rect
                                x={o.x - 150}
                                y={o.y - 60}
                                width={300}
                                height={96}
                                rx={48}
                                fill="#ffffff"
                                stroke={ROD}
                                strokeWidth={5}
                            />
                            <T x={o.x} y={o.y + 4} str={44} farge={ROD} vekt={900}>
                                {o.ord}
                            </T>
                        </motion.g>
                    ))}
                    <rect x={440} y={60} width={720} height={110} rx={28} fill="#ffffff" />
                    <T x={800} y={132} str={44} vekt={900}>
                        Tradisjonen lever videre
                    </T>
                </Inn>
            </svg>
        </motion.div>
    );
}
