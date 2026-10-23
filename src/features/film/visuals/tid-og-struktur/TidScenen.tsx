import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Teaterscenen. «ibsen»: teppet går opp, men det meste har skjedd før, og ei kiste med gamle
 * hemmeligheter åpnes. «gevaer»: et gevær på veggen er et løfte til leseren. «fjell»: et
 * frampek i været, der svarte skyer samler seg over fjellet.
 */

type Modus = 'ibsen' | 'gevaer' | 'fjell';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const SCENE = { x: 170, y: 170, b: 1260, h: 560 };
const GULV = SCENE.y + SCENE.h - 110;

function Person({ x, farge }: { x: number; farge: string }) {
    return (
        <g>
            <circle cx={x} cy={GULV - 250} r={38} fill={farge} />
            <rect x={x - 48} y={GULV - 205} width={96} height={205} rx={40} fill={farge} />
        </g>
    );
}

function Teppe({ apent }: { apent: boolean }) {
    const halv = SCENE.b / 2;
    return (
        <g>
            {[0, 1].map((side) => (
                <motion.rect
                    key={side}
                    y={SCENE.y}
                    height={SCENE.h}
                    fill="#9f1239"
                    initial={false}
                    animate={{
                        width: apent ? 110 : halv,
                        x: side === 0 ? SCENE.x : apent ? SCENE.x + SCENE.b - 110 : SCENE.x + halv,
                    }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
            ))}
            <rect
                x={SCENE.x - 20}
                y={SCENE.y - 40}
                width={SCENE.b + 40}
                height={60}
                rx={10}
                fill="#881337"
            />
        </g>
    );
}

function Rom({ farge = '#e7dcc8' }: { farge?: string }) {
    return (
        <g>
            <rect x={SCENE.x} y={SCENE.y} width={SCENE.b} height={SCENE.h} fill={farge} />
            <rect
                x={SCENE.x}
                y={GULV}
                width={SCENE.b}
                height={SCENE.y + SCENE.h - GULV}
                fill="#8b5e34"
            />
            {/* Vindu og bilde på veggen, som i en stue på 1800-tallet */}
            <rect
                x={SCENE.x + 160}
                y={SCENE.y + 90}
                width={170}
                height={220}
                rx={6}
                fill="#bfdbfe"
                stroke="#78350f"
                strokeWidth={10}
            />
            <line
                x1={SCENE.x + 245}
                y1={SCENE.y + 90}
                x2={SCENE.x + 245}
                y2={SCENE.y + 310}
                stroke="#78350f"
                strokeWidth={8}
            />
        </g>
    );
}

function Kiste({ apen }: { apen: boolean }) {
    const x = 800;
    return (
        <g>
            <rect x={x - 110} y={GULV - 110} width={220} height={110} rx={10} fill="#78350f" />
            <rect x={x - 110} y={GULV - 70} width={220} height={12} fill="#a16207" />
            <motion.rect
                x={x - 116}
                width={232}
                height={34}
                rx={10}
                fill="#92400e"
                initial={false}
                animate={{ y: apen ? GULV - 200 : GULV - 140 }}
                transition={{ duration: 0.8 }}
            />
        </g>
    );
}

/** Brev og papirer som stiger opp av kista. */
function Papirer({ lyser }: { lyser: boolean }) {
    const mal = [
        { x: 640, y: 270 },
        { x: 780, y: 230 },
        { x: 920, y: 280 },
    ];
    return (
        <g>
            {mal.map((m, i) => (
                <motion.g
                    key={i}
                    initial={{ x: 800 - 60, y: GULV - 120, opacity: 0 }}
                    animate={{ x: m.x - 60, y: m.y, opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.4 }}
                >
                    <rect
                        width={120}
                        height={150}
                        rx={6}
                        fill={lyser ? '#fde68a' : '#ffffff'}
                        stroke={lyser ? '#d97706' : '#94a3b8'}
                        strokeWidth={lyser ? 8 : 4}
                    />
                    {[30, 60, 90, 120].map((ly) => (
                        <line
                            key={ly}
                            x1={18}
                            y1={ly}
                            x2={102}
                            y2={ly}
                            stroke="#cbd5e1"
                            strokeWidth={5}
                        />
                    ))}
                </motion.g>
            ))}
        </g>
    );
}

function Gevar({ lyser }: { lyser: boolean }) {
    const x = 800;
    const y = SCENE.y + 200;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            {lyser && (
                <motion.ellipse
                    cx={x}
                    cy={y}
                    rx={300}
                    ry={90}
                    fill="#facc15"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.45, 0.15] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                />
            )}
            {/* Krokene på veggen */}
            <rect x={x - 150} y={y - 30} width={14} height={40} fill="#44403c" />
            <rect x={x + 120} y={y - 30} width={14} height={40} fill="#44403c" />
            {/* Løpet og kolben */}
            <rect x={x - 250} y={y - 6} width={330} height={16} rx={6} fill="#334155" />
            <polygon
                points={`${x + 60},${y - 14} ${x + 250},${y - 4} ${x + 260},${y + 52} ${x + 150},${y + 34} ${x + 60},${y + 22}`}
                fill="#92400e"
            />
        </motion.g>
    );
}

function Fjell({ beat }: { beat: number }) {
    const mork = Math.min(beat, 3) / 3;
    const himmel = mork > 0.6 ? '#475569' : mork > 0.2 ? '#7c8ea6' : '#93c5fd';
    const skyer = beat >= 1;
    return (
        <g>
            <motion.rect
                x={0}
                y={0}
                width={1600}
                height={900}
                initial={false}
                animate={{ fill: himmel }}
                transition={{ duration: 2 }}
            />
            <polygon
                points="0,760 300,430 520,620 820,250 1120,600 1330,420 1600,700 1600,900 0,900"
                fill="#64748b"
            />
            <polygon points="760,320 820,250 885,330 845,310 810,345" fill="#f8fafc" />
            <polygon points="0,900 0,790 400,740 900,770 1600,720 1600,900" fill="#4d7c0f" />
            {/* Stien opp mot passet, og to vandrere på vei */}
            <path
                d="M 260 900 C 420 800, 560 760, 700 620 S 790 420, 815 300"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth={10}
                strokeDasharray="20 16"
            />
            {[0, 1].map((i) => (
                <g key={i} transform={`translate(${400 + i * 70} ${790 - i * 22})`}>
                    <circle cx={0} cy={-58} r={11} fill="#1e293b" />
                    <rect
                        x={-11}
                        y={-46}
                        width={22}
                        height={46}
                        rx={8}
                        fill={i ? '#b91c1c' : '#1d4ed8'}
                    />
                </g>
            ))}
            {[
                { x: 650, y: 210, s: 1.4 },
                { x: 900, y: 180, s: 1.7 },
                { x: 1120, y: 230, s: 1.2 },
                { x: 780, y: 120, s: 1.5 },
            ].map((c, i) => (
                <motion.g
                    key={i}
                    initial={false}
                    animate={{
                        x: skyer ? c.x : c.x + 900,
                        y: c.y,
                        opacity: skyer ? 1 : 0,
                    }}
                    transition={{ duration: 3 + i * 0.4, ease: 'easeOut' }}
                >
                    <g transform={`scale(${c.s})`}>
                        <ellipse
                            cx={0}
                            cy={0}
                            rx={130}
                            ry={55}
                            fill={mork > 0.6 ? '#0f172a' : '#1e293b'}
                        />
                        <ellipse cx={-80} cy={18} rx={90} ry={44} fill="#1e293b" />
                        <ellipse cx={90} cy={16} rx={100} ry={46} fill="#111827" />
                    </g>
                </motion.g>
            ))}
            {!skyer && (
                <g>
                    <ellipse cx={1250} cy={150} rx={110} ry={40} fill="#ffffff" opacity={0.9} />
                    <ellipse cx={300} cy={190} rx={90} ry={34} fill="#ffffff" opacity={0.8} />
                </g>
            )}
        </g>
    );
}

interface Merke {
    tekst: string;
    sted: 'topp' | 'bunn' | 'teppe' | 'hoyre';
    tone: 'mork' | 'lys' | 'gull';
}

function merkerFor(modus: Modus, beat: number): Merke[] {
    if (modus === 'ibsen') {
        if (beat === 0)
            return [
                { tekst: 'Henrik Ibsen', sted: 'teppe', tone: 'lys' },
                { tekst: 'Retrospektiv teknikk = tilbakeblikk', sted: 'bunn', tone: 'mork' },
            ];
        if (beat === 1)
            return [
                { tekst: 'Det meste har skjedd før teppet går opp', sted: 'bunn', tone: 'mork' },
            ];
        if (beat === 2)
            return [{ tekst: 'Gamle hemmeligheter rulles opp', sted: 'bunn', tone: 'mork' }];
        return [{ tekst: 'Avsløring!', sted: 'bunn', tone: 'gull' }];
    }
    if (modus === 'gevaer') {
        if (beat === 0) return [{ tekst: 'Tsjekhovs regel', sted: 'topp', tone: 'mork' }];
        if (beat === 1)
            return [{ tekst: 'Et ladd gevær på scenen må avfyres', sted: 'bunn', tone: 'mork' }];
        if (beat === 2)
            return [{ tekst: 'Det er et løfte til leseren', sted: 'bunn', tone: 'gull' }];
        return [
            { tekst: 'Tsjekhovs gevær', sted: 'topp', tone: 'mork' },
            { tekst: 'Ingenting er tilfeldig', sted: 'bunn', tone: 'gull' },
        ];
    }
    if (beat === 0) return [{ tekst: 'Frampek i været', sted: 'topp', tone: 'mork' }];
    if (beat === 1)
        return [
            {
                tekst: '«Været slo om. Tunge, svarte skyer samlet seg over fjellet de skulle krysse.»',
                sted: 'hoyre',
                tone: 'lys',
            },
        ];
    if (beat === 2) return [{ tekst: 'Uhyggelig stemning', sted: 'bunn', tone: 'mork' }];
    return [{ tekst: 'Vi ble advart underveis', sted: 'bunn', tone: 'gull' }];
}

const TONE: Record<Merke['tone'], string> = {
    mork: 'bg-slate-900/95 text-white',
    lys: 'bg-white/95 text-slate-900 italic',
    gull: 'bg-amber-300 text-slate-900',
};

export function TidScenen({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ibsen';
    const merker = merkerFor(modus, beat);
    const apent = modus !== 'ibsen' || beat >= 1;
    return (
        <div className="absolute inset-0" style={{ background: '#1c1917' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'fjell' ? (
                    <Fjell beat={beat} />
                ) : (
                    <g>
                        {/* Lyskjegle fra taket ned på scenen */}
                        <polygon
                            points={`700,0 900,0 1250,${GULV + 110} 350,${GULV + 110}`}
                            fill="#fef3c7"
                            opacity={0.06}
                        />
                        <Rom farge={modus === 'gevaer' ? '#d6cfc2' : '#e7dcc8'} />
                        {modus === 'ibsen' && (
                            <g>
                                <Person x={480} farge="#334155" />
                                <Person x={1120} farge="#7c2d12" />
                                <Kiste apen={beat >= 2} />
                                {beat >= 2 && <Papirer lyser={beat >= 3} />}
                            </g>
                        )}
                        {modus === 'gevaer' && (
                            <g>
                                {beat >= 1 && <Gevar lyser={beat >= 1} />}
                                <rect
                                    x={560}
                                    y={GULV - 120}
                                    width={480}
                                    height={26}
                                    rx={6}
                                    fill="#78350f"
                                />
                                <rect x={590} y={GULV - 94} width={20} height={94} fill="#78350f" />
                                <rect x={990} y={GULV - 94} width={20} height={94} fill="#78350f" />
                                <Person x={1180} farge="#334155" />
                            </g>
                        )}
                        <Teppe apent={apent} />
                        {/* Scenekanten */}
                        <rect
                            x={SCENE.x - 20}
                            y={SCENE.y + SCENE.h}
                            width={SCENE.b + 40}
                            height={30}
                            rx={6}
                            fill="#44403c"
                        />
                    </g>
                )}
                {modus === 'ibsen' && beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <rect x={170} y={50} width={1000} height={72} rx={12} fill="#7c3aed" />
                        <rect x={1180} y={50} width={250} height={72} rx={12} fill="#facc15" />
                        <text
                            x={670}
                            y={100}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={800}
                            fill="#ffffff"
                            style={FONT}
                        >
                            før teppet går opp
                        </text>
                        <text
                            x={1305}
                            y={100}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#1e293b"
                            style={FONT}
                        >
                            på scenen
                        </text>
                    </motion.g>
                )}
            </svg>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tekst}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: m.sted === 'teppe' ? 0 : 0.5 }}
                        className={`absolute rounded-2xl shadow-xl text-center font-black ${TONE[m.tone]} ${m.sted === 'hoyre' ? '' : 'left-1/2 -translate-x-1/2'}`}
                        style={{
                            ...FONT,
                            top: m.sted === 'topp' ? '4%' : m.sted === 'teppe' ? '42%' : undefined,
                            bottom:
                                m.sted === 'bunn' ? '4%' : m.sted === 'hoyre' ? '30%' : undefined,
                            right: m.sted === 'hoyre' ? '4%' : undefined,
                            width: m.sted === 'hoyre' ? '44%' : 'max-content',
                            maxWidth: '86%',
                            padding: '0.6rem 1.4rem',
                            fontSize:
                                m.sted === 'teppe'
                                    ? '3.4rem'
                                    : m.sted === 'hoyre'
                                      ? '1.7rem'
                                      : '2rem',
                        }}
                    >
                        {m.tekst}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
