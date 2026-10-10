import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Buddhistisk bryllup og begravelse som scene: huset til familien til venstre, klosteret
 * på høyden til høyre. I bryllupet kommer munkene om morgenen og går igjen før selve
 * vielsen. I begravelsen blir de, og den gode handlingen (punya) går fra familien til den døde.
 */

type Modus = 'bryllup' | 'begravelse';

const B = 1600;
const H = 900;
const BAKKE = 720;

function Munk({ x, y = BAKKE, synger = false }: { x: number; y?: number; synger?: boolean }) {
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
        >
            <path d="M -34 0 L -24 -110 Q 0 -126 24 -110 L 34 0 Z" fill="#ea8a1a" />
            <path d="M -24 -110 Q 0 -126 24 -110 L 10 -40 Z" fill="#c2410c" opacity={0.6} />
            <circle cx={0} cy={-140} r={24} fill="#e0ac7a" />
            {synger && (
                <motion.text
                    x={30}
                    y={-170}
                    fontSize={40}
                    fill="#7c2d12"
                    animate={{ y: [-160, -200], opacity: [1, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                >
                    ♪
                </motion.text>
            )}
        </motion.g>
    );
}

function Person({
    x,
    farge,
    hodeFarge = '#c68642',
    hoyde = 1,
}: {
    x: number;
    farge: string;
    hodeFarge?: string;
    hoyde?: number;
}) {
    return (
        <motion.g initial={false} animate={{ x }} transition={{ duration: 1.2 }}>
            <g transform={`translate(0 ${BAKKE}) scale(${hoyde})`}>
                <rect x={-26} y={-112} width={52} height={112} rx={22} fill={farge} />
                <circle cx={0} cy={-138} r={24} fill={hodeFarge} />
            </g>
        </motion.g>
    );
}

function Hus() {
    return (
        <g>
            <rect
                x={240}
                y={500}
                width={380}
                height={220}
                fill="#f5e6c8"
                stroke="#8b6b45"
                strokeWidth={6}
            />
            <path d="M 210 510 L 430 370 L 650 510 Z" fill="#a0522d" />
            <rect x={400} y={600} width={70} height={120} fill="#8b6b45" />
            <rect
                x={290}
                y={560}
                width={70}
                height={60}
                fill="#bfdbfe"
                stroke="#8b6b45"
                strokeWidth={5}
            />
            <rect
                x={510}
                y={560}
                width={70}
                height={60}
                fill="#bfdbfe"
                stroke="#8b6b45"
                strokeWidth={5}
            />
            <text x={430} y={790} textAnchor="middle" fontSize={34} fontWeight={800} fill="#57534e">
                Familiens hus
            </text>
        </g>
    );
}

function Kloster() {
    return (
        <g>
            <path d="M 1100 720 Q 1330 560 1560 720 Z" fill="#a3b18a" />
            <rect
                x={1240}
                y={500}
                width={190}
                height={120}
                fill="#fff7ed"
                stroke="#9a3412"
                strokeWidth={5}
            />
            <path d="M 1215 505 L 1335 430 L 1455 505 Z" fill="#c2410c" />
            <path d="M 1255 440 L 1335 385 L 1415 440 Z" fill="#ea580c" />
            <rect x={1325} y={350} width={20} height={40} fill="#facc15" />
            <text
                x={1335}
                y={790}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#57534e"
            >
                Klosteret
            </text>
        </g>
    );
}

function Lapp({ tekst, farge = '#0f172a' }: { tekst: string; farge?: string }) {
    return (
        <motion.g
            key={tekst}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <rect
                x={B / 2 - 500}
                y={70}
                width={1000}
                height={96}
                rx={26}
                fill="white"
                opacity={0.95}
            />
            <text x={B / 2} y={134} textAnchor="middle" fontSize={50} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Brudepar({ vis, x = 760 }: { vis: boolean; x?: number }) {
    return (
        <motion.g initial={false} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <Person x={x} farge="#be123c" hodeFarge="#c68642" />
            <Person x={x + 70} farge="#1e3a8a" hodeFarge="#a16a3c" />
            <motion.text
                x={x + 35}
                y={BAKKE - 200}
                textAnchor="middle"
                fontSize={54}
                fill="#e11d48"
                animate={vis ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ originX: `${x + 35}px`, originY: `${BAKKE - 215}px` }}
            >
                ♥
            </motion.text>
        </motion.g>
    );
}

/** Båre med den døde, og et bål under i begravelsen. */
function Baare({ vis, x = 820 }: { vis: boolean; x?: number }) {
    return (
        <motion.g initial={false} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.8 }}>
            <rect x={x - 130} y={BAKKE - 70} width={260} height={70} fill="#78350f" />
            {[0, 1, 2, 3].map((i) => (
                <rect
                    key={i}
                    x={x - 120 + i * 62}
                    y={BAKKE - 105}
                    width={48}
                    height={35}
                    fill="#92400e"
                />
            ))}
            <rect
                x={x - 110}
                y={BAKKE - 140}
                width={220}
                height={36}
                rx={14}
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth={4}
            />
            {[0, 1, 2].map((i) => (
                <motion.path
                    key={i}
                    d={`M ${x - 80 + i * 80} ${BAKKE - 70} q -20 -40 0 -70 q 20 30 0 70 Z`}
                    fill={i === 1 ? '#f97316' : '#fbbf24'}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.9 + i * 0.2, repeat: Infinity }}
                />
            ))}
        </motion.g>
    );
}

function Bryllup({ beat }: { beat: number }) {
    // Munkene: på vei til huset (0), i huset (1), tilbake (2, 3), ved båra (4).
    const munkX = (i: number) => {
        if (beat === 0) return 1240 + i * 70;
        if (beat === 1) return 700 + i * 90;
        if (beat === 4) return 1050 + i * 80;
        return 1260 + i * 70;
    };
    const munkY = beat === 0 || beat === 2 || beat === 3 ? 620 : BAKKE;
    const lapper = [
        'Bryllupsdagen begynner hjemme',
        'Munkene får mat og leser høyt',
        'Munkene går tilbake til klosteret',
        'Vielsen: ingen munk til stede',
        'Når noen dør, styrer munkene',
    ];
    return (
        <>
            <AnimatePresence mode="wait">
                <Lapp key={beat} tekst={lapper[Math.min(beat, 4)]} />
            </AnimatePresence>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ellipse cx={790} cy={BAKKE - 6} rx={60} ry={14} fill="#a16207" />
                    <circle cx={790} cy={BAKKE - 22} r={24} fill="#fef3c7" />
                    <rect
                        x={860}
                        y={BAKKE - 210}
                        width={120}
                        height={70}
                        rx={8}
                        fill="#fefce8"
                        stroke="#a16207"
                        strokeWidth={4}
                    />
                    {[0, 1, 2].map((i) => (
                        <line
                            key={i}
                            x1={875}
                            x2={965}
                            y1={BAKKE - 190 + i * 18}
                            y2={BAKKE - 190 + i * 18}
                            stroke="#a16207"
                            strokeWidth={4}
                        />
                    ))}
                </motion.g>
            )}
            <Brudepar vis={beat === 3} />
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {[0, 1, 2].map((i) => (
                        <rect
                            key={i}
                            x={950 + i * 80}
                            y={BAKKE - 165}
                            width={60}
                            height={165}
                            rx={24}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={5}
                            strokeDasharray="14 10"
                        />
                    ))}
                    <text
                        x={1030}
                        y={BAKKE - 190}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#dc2626"
                    >
                        ingen munker
                    </text>
                </motion.g>
            )}
            <Baare vis={beat === 4} x={830} />
            {[0, 1, 2].map((i) => (
                <Munk key={i} x={munkX(i)} y={munkY} synger={beat === 1 || beat === 4} />
            ))}
        </>
    );
}

function Begravelse({ beat }: { beat: number }) {
    const lapper = [
        'Bryllupet: ingen religiøs handling',
        'Begravelsen: munkene synger',
        'Gaver til klosteret gir punya',
        'Den døde trenger at andre gjør godt',
        'Hvor lang tid har den døde?',
    ];
    const munkerVed = beat >= 1;
    return (
        <>
            <AnimatePresence mode="wait">
                <Lapp key={beat} tekst={lapper[Math.min(beat, 4)]} />
            </AnimatePresence>
            <Brudepar vis={beat === 0} />
            {beat === 0 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    x={795}
                    y={BAKKE - 250}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#475569"
                >
                    følger skikkene på stedet
                </motion.text>
            )}
            <Baare vis={beat >= 1 && beat <= 3} x={820} />
            {[0, 1, 2].map((i) => (
                <Munk
                    key={i}
                    x={munkerVed && beat <= 3 ? 1000 + i * 80 : 1260 + i * 70}
                    y={munkerVed && beat <= 3 ? BAKKE : 620}
                    synger={beat === 1}
                />
            ))}
            {/* Familien med gaver */}
            {(beat === 2 || beat === 3) && (
                <>
                    <Person x={beat === 2 ? 1290 : 640} farge="#334155" />
                    <Person x={beat === 2 ? 1360 : 580} farge="#64748b" hoyde={0.8} />
                    {beat === 2 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <rect
                                x={1303}
                                y={BAKKE - 80}
                                width={44}
                                height={36}
                                fill="#fde68a"
                                stroke="#a16207"
                                strokeWidth={3}
                            />
                            <text
                                x={1325}
                                y={BAKKE - 190}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={800}
                                fill="#92400e"
                            >
                                mat og klær
                            </text>
                        </motion.g>
                    )}
                </>
            )}
            {/* Punya: lys som går fra den gode handlingen til den døde */}
            {(beat === 2 || beat === 3) && (
                <motion.g>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            r={16}
                            fill="#facc15"
                            stroke="#fde68a"
                            strokeWidth={6}
                            initial={{ cx: beat === 2 ? 1325 : 610, cy: BAKKE - 120, opacity: 0 }}
                            animate={{
                                cx: [beat === 2 ? 1325 : 610, 820],
                                cy: [BAKKE - 120, BAKKE - 260, BAKKE - 150],
                                opacity: [0, 1, 0],
                            }}
                            transition={{ duration: 2.2, delay: i * 0.7, repeat: Infinity }}
                        />
                    ))}
                    <text
                        x={820}
                        y={BAKKE - 290}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#a16207"
                    >
                        punya
                    </text>
                </motion.g>
            )}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={170}
                        y={260}
                        width={600}
                        height={320}
                        rx={30}
                        fill="white"
                        stroke="#7c3aed"
                        strokeWidth={6}
                    />
                    <text
                        x={470}
                        y={330}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#5b21b6"
                    >
                        Tibet
                    </text>
                    <text
                        x={470}
                        y={455}
                        textAnchor="middle"
                        fontSize={120}
                        fontWeight={900}
                        fill="#5b21b6"
                    >
                        49
                    </text>
                    <text
                        x={470}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        dager i en mellomtilstand
                    </text>
                    <rect
                        x={830}
                        y={260}
                        width={600}
                        height={320}
                        rx={30}
                        fill="white"
                        stroke="#ea580c"
                        strokeWidth={6}
                    />
                    <text
                        x={1130}
                        y={330}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#c2410c"
                    >
                        Theravada
                    </text>
                    <motion.path
                        d="M 980 450 L 1250 450"
                        stroke="#c2410c"
                        strokeWidth={14}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    />
                    <path d="M 1250 420 L 1300 450 L 1250 480 Z" fill="#c2410c" />
                    <text
                        x={1130}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        nytt liv med én gang
                    </text>
                </motion.g>
            )}
        </>
    );
}

export function OvergangsriterMunkene({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bryllup';
    const sol = modus === 'bryllup' && beat <= 3;
    return (
        <div
            className="absolute inset-0"
            style={{
                background: sol
                    ? 'linear-gradient(180deg, #fde7c4 0%, #fdf4e3 60%, #e7dcc4 100%)'
                    : 'linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 60%, #e2dccf 100%)',
            }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {sol && <circle cx={150} cy={230} r={70} fill="#fbbf24" opacity={0.85} />}
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#d6c7a8" />
                <Kloster />
                <Hus />
                {modus === 'bryllup' ? <Bryllup beat={beat} /> : <Begravelse beat={beat} />}
            </svg>
        </div>
    );
}
