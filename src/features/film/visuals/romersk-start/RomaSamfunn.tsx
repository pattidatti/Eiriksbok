import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvordan republikken var bygd, tegnet som enkle figurer i SVG. Fire moduser:
 * - konsuler: sju konger, kongen jages ut, to konsuler, vekta i folkeforsamlingen
 * - stender: patrisiere og plebeiere, og dørene bare patrisierne slapp inn gjennom
 * - veto: folketribunen som stopper et lovforslag, ti tribuner, stenderkampene
 * - jord: småbruk som gror igjen og blir slått sammen til latifundia
 */

type Modus = 'konsuler' | 'stender' | 'veto' | 'jord';

const B = 1600;
const H = 900;
const ROD = '#b91c1c';
const LILLA = '#6d28d9';
const BRUN = '#9a3412';
const GRONN = '#15803d';
const MORK = '#0f172a';
const GRA = '#94a3b8';

const OVERSKRIFT: Record<Modus, string[]> = {
    konsuler: [
        'Sju konger, ifølge tradisjonen',
        'De siste kongene: etruskere',
        '510 eller 509 fvt.',
        'Res publica: folkets sak',
        'To konsuler hvert år',
        'Folkeforsamlingen',
    ],
    stender: ['To grupper', 'Patrisiere', 'Plebeiere', 'Bare for patrisiere'],
    veto: [
        'Folketribunen',
        'Veto: Jeg forbyr!',
        'Stopper et lovforslag',
        'Kan ikke fjerne en lov som gjelder',
        'Fra 449 fvt.',
        'Stenderkampene',
    ],
    jord: [
        'Rikdom etter seieren',
        'Småbøndene kommer hjem',
        'Senatorer kjøper opp jorda',
        'Latifundia',
        'Bøndene flykter til Roma',
    ],
};

export function RomaSamfunn({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'konsuler';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f6efe1' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Bakgrunn />
                {modus === 'konsuler' && <Konsuler beat={beat} />}
                {modus === 'stender' && <Stender beat={beat} />}
                {modus === 'veto' && <Veto beat={beat} />}
                {modus === 'jord' && <Jord beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tekst}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-[3%] top-[5%] rounded-2xl bg-white/95 px-5 py-2.5 text-2xl md:text-4xl font-black text-slate-900 shadow-xl"
                    style={{ maxWidth: '70%' }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Bakgrunn() {
    return (
        <g opacity={0.5}>
            {[260, 520, 1080, 1340].map((x) => (
                <g key={x}>
                    <rect x={x - 22} y={190} width={44} height={560} fill="#e7dcc4" />
                    <rect x={x - 36} y={176} width={72} height={18} fill="#e7dcc4" />
                    <rect x={x - 36} y={746} width={72} height={18} fill="#e7dcc4" />
                </g>
            ))}
            <rect x={0} y={770} width={B} height={130} fill="#e9dfc8" />
        </g>
    );
}

function Tekst({
    x,
    y,
    children,
    farge = MORK,
    storrelse = 40,
    anker = 'middle',
    vekt = 900,
}: {
    x: number;
    y: number;
    children: ReactNode;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            stroke="#f6efe1"
            strokeWidth={6}
            paintOrder="stroke"
        >
            {children}
        </text>
    );
}

/** En enkel figur: hode og kropp. (x, y) er føttene. */
function Figur({
    x,
    y,
    farge,
    s = 1,
    toga = false,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
    toga?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-20} y={-78} width={40} height={78} rx={16} fill={farge} />
            {toga && <path d="M -20 -70 L 20 -20" stroke="#ffffff" strokeWidth={9} />}
            <circle cx={0} cy={-96} r={17} fill="#f1c9a5" stroke={farge} strokeWidth={3} />
        </g>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    k,
}: {
    children: ReactNode;
    forsinkelse?: number;
    k?: string;
}) {
    return (
        <motion.g
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

function Krone({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -50 30 L -50 -20 L -25 6 L 0 -34 L 25 6 L 50 -20 L 50 30 Z"
                fill={farge}
                stroke="#ffffff"
                strokeWidth={4}
            />
            <rect
                x={-50}
                y={30}
                width={100}
                height={16}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={3}
            />
        </g>
    );
}

function Kryss({ x, y, r = 30 }: { x: number; y: number; r?: number }) {
    return (
        <g stroke={ROD} strokeWidth={12} strokeLinecap="round">
            <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
            <line x1={x + r} y1={y - r} x2={x - r} y2={y + r} />
        </g>
    );
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 28} ${y} L ${x - 8} ${y + 22} L ${x + 30} ${y - 22}`}
            stroke={GRONN}
            strokeWidth={13}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

// ---------- Konger og konsuler ----------

function Konsuler({ beat }: { beat: number }) {
    const xs = Array.from({ length: 7 }, (_, i) => 290 + i * 170);
    return (
        <AnimatePresence mode="wait">
            {beat <= 2 && (
                <Inn k="konger">
                    {xs.map((x, i) => {
                        const siste = i === 6;
                        const farge = '#ca8a04';
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={
                                    siste && beat === 2
                                        ? { opacity: 0, x: 260, y: 0 }
                                        : { opacity: beat === 2 ? 0.45 : 1, x: 0, y: 0 }
                                }
                                transition={{
                                    duration: siste && beat === 2 ? 2.2 : 0.5,
                                    delay: beat === 0 ? i * 0.35 : siste ? 0.8 : 0,
                                }}
                            >
                                <Krone x={x} y={420} farge={farge} />
                                <Tekst x={x} y={540} storrelse={38}>
                                    {String(i + 1)}
                                </Tekst>
                            </motion.g>
                        );
                    })}
                    {beat === 1 && (
                        <Inn forsinkelse={0.4}>
                            <path
                                d="M 1000 300 L 1300 300"
                                stroke="#c2410c"
                                strokeWidth={8}
                                strokeLinecap="round"
                                markerEnd="url(#pil-oransje)"
                            />
                            <Tekst x={1110} y={270} farge="#c2410c" storrelse={36}>
                                de siste: etruskere
                            </Tekst>
                            <defs>
                                <marker
                                    id="pil-oransje"
                                    viewBox="0 0 10 10"
                                    refX={6}
                                    refY={5}
                                    markerWidth={4}
                                    markerHeight={4}
                                    orient="auto"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#c2410c" />
                                </marker>
                            </defs>
                            <Bue x={560} y={700} />
                            <Tekst x={560} y={780} storrelse={32}>
                                buer
                            </Tekst>
                            <Kloakk x={1040} y={690} />
                            <Tekst x={1040} y={780} storrelse={32}>
                                kloakker
                            </Tekst>
                        </Inn>
                    )}
                    {beat === 2 && (
                        <Inn forsinkelse={1.2}>
                            <Tekst x={800} y={690} farge={ROD} storrelse={46}>
                                Kongen skal ha blitt jaget ut
                            </Tekst>
                        </Inn>
                    )}
                </Inn>
            )}
            {beat === 3 && (
                <Inn k="res">
                    <Krone x={420} y={470} farge={GRA} />
                    <Kryss x={420} y={470} r={70} />
                    <Tekst x={420} y={620} farge={ROD} storrelse={38}>
                        aldri mer én mann
                    </Tekst>
                    <Tekst x={1050} y={460} storrelse={96}>
                        RES PUBLICA
                    </Tekst>
                    <Tekst x={1050} y={550} farge={LILLA} storrelse={52} vekt={800}>
                        = folkets sak
                    </Tekst>
                </Inn>
            )}
            {beat === 4 && (
                <Inn k="konsuler">
                    <Stol x={560} />
                    <Stol x={1040} />
                    <Figur x={560} y={600} farge={LILLA} s={1.6} toga />
                    <Figur x={1040} y={600} farge={LILLA} s={1.6} toga />
                    <Tekst x={560} y={700} storrelse={40}>
                        Konsul
                    </Tekst>
                    <Tekst x={1040} y={700} storrelse={40}>
                        Konsul
                    </Tekst>
                    <Inn forsinkelse={1.2}>
                        <Hake x={800} y={420} />
                        <Tekst x={800} y={510} farge={GRONN} storrelse={36}>
                            må være enige
                        </Tekst>
                    </Inn>
                    <Inn forsinkelse={5}>
                        <rect
                            x={1150}
                            y={300}
                            width={300}
                            height={90}
                            rx={18}
                            fill="#ffffff"
                            stroke={ROD}
                            strokeWidth={5}
                        />
                        <Tekst x={1300} y={360} farge={ROD} storrelse={40}>
                            Stopp!
                        </Tekst>
                    </Inn>
                </Inn>
            )}
            {beat >= 5 && (
                <Inn k="vekt">
                    <Vekt />
                </Inn>
            )}
        </AnimatePresence>
    );
}

function Bue({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 60} ${y + 40} L ${x - 60} ${y - 10} A 60 60 0 0 1 ${x + 60} ${y - 10} L ${x + 60} ${y + 40} L ${x + 36} ${y + 40} L ${x + 36} ${y - 6} A 36 36 0 0 0 ${x - 36} ${y - 6} L ${x - 36} ${y + 40} Z`}
            fill="#a8a29e"
            stroke="#ffffff"
            strokeWidth={3}
        />
    );
}

function Kloakk({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 80} y={y - 40} width={160} height={80} rx={10} fill="#a8a29e" />
            <path
                d={`M ${x - 46} ${y + 40} L ${x - 46} ${y} A 46 30 0 0 1 ${x + 46} ${y} L ${x + 46} ${y + 40} Z`}
                fill="#475569"
            />
            <rect x={x - 46} y={y + 22} width={92} height={18} fill="#38bdf8" />
        </g>
    );
}

function Stol({ x }: { x: number }) {
    return (
        <g>
            <rect x={x - 60} y={540} width={120} height={18} rx={6} fill="#a16207" />
            <path
                d={`M ${x - 54} 558 L ${x + 54} 620 M ${x + 54} 558 L ${x - 54} 620`}
                stroke="#a16207"
                strokeWidth={10}
            />
        </g>
    );
}

function Vekt() {
    // De rike er tyngst: vekta heller mot dem.
    const vinkel = 0.22;
    const midtX = 800;
    const midtY = 320;
    const arm = 380;
    const vx = midtX - Math.cos(vinkel) * arm;
    const vy = midtY + Math.sin(vinkel) * arm;
    const hx = midtX + Math.cos(vinkel) * arm;
    const hy = midtY - Math.sin(vinkel) * arm;
    return (
        <g>
            <rect x={midtX - 14} y={midtY} width={28} height={420} fill="#78716c" />
            <rect x={midtX - 120} y={midtY + 410} width={240} height={26} rx={8} fill="#78716c" />
            <motion.line
                x1={midtX - arm}
                y1={midtY}
                x2={midtX + arm}
                y2={midtY}
                stroke="#57534e"
                strokeWidth={16}
                strokeLinecap="round"
                initial={false}
                animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
            />
            <motion.g
                initial={{ y: 0 }}
                animate={{ y: vy - midtY }}
                transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
            >
                <Skål x={midtX - arm} y={midtY} />
                <Figur x={midtX - arm - 40} y={midtY + 110} farge={LILLA} toga />
                <Figur x={midtX - arm + 40} y={midtY + 110} farge={LILLA} toga />
                <circle
                    cx={midtX - arm}
                    cy={midtY + 88}
                    r={22}
                    fill="#eab308"
                    stroke="#a16207"
                    strokeWidth={4}
                />
                <Tekst x={midtX - arm} y={midtY + 190} farge={LILLA} storrelse={40}>
                    de rike
                </Tekst>
            </motion.g>
            <motion.g
                initial={{ y: 0 }}
                animate={{ y: hy - midtY }}
                transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
            >
                <Skål x={midtX + arm} y={midtY} />
                {[-60, -20, 20, 60].map((dx) => (
                    <Figur key={dx} x={midtX + arm + dx} y={midtY + 110} farge={BRUN} s={0.7} />
                ))}
                <Tekst x={midtX + arm} y={midtY + 190} farge={BRUN} storrelse={40}>
                    alle andre
                </Tekst>
            </motion.g>
        </g>
    );
}

function Skål({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <line x1={x - 80} y1={y + 110} x2={x} y2={y} stroke="#78716c" strokeWidth={4} />
            <line x1={x + 80} y1={y + 110} x2={x} y2={y} stroke="#78716c" strokeWidth={4} />
            <path
                d={`M ${x - 100} ${y + 110} Q ${x} ${y + 150} ${x + 100} ${y + 110} Z`}
                fill="#a8a29e"
            />
        </g>
    );
}

// ---------- Patrisiere og plebeiere ----------

/** En tett, utellbar mengde figurer. */
function Mengde({
    x0,
    x1,
    y,
    farge,
    rader,
    tetthet,
}: {
    x0: number;
    x1: number;
    y: number;
    farge: string;
    rader: number;
    tetthet: number;
}) {
    const figurer = useMemo(() => {
        const ut: { x: number; y: number }[] = [];
        for (let r = 0; r < rader; r++) {
            for (let x = x0 + (r % 2) * (tetthet / 2); x <= x1; x += tetthet) {
                ut.push({ x: x + Math.sin(x * 13 + r) * 6, y: y + r * 34 });
            }
        }
        return ut;
    }, [x0, x1, y, rader, tetthet]);
    return (
        <g>
            {figurer.map((f, i) => (
                <Figur key={i} x={f.x} y={f.y} farge={farge} s={0.62} />
            ))}
        </g>
    );
}

function Stender({ beat }: { beat: number }) {
    const patOpacity = beat === 2 ? 0.35 : 1;
    const plebOpacity = beat === 1 ? 0.35 : 1;
    return (
        <g>
            {/* Patrisierne står høyt oppe på en trapp. */}
            <motion.g animate={{ opacity: patOpacity }}>
                <rect x={620} y={330} width={360} height={30} fill="#d6c7a6" />
                <rect x={580} y={360} width={440} height={30} fill="#cdbd99" />
                <Mengde x0={700} x1={900} y={330} farge={LILLA} rader={1} tetthet={34} />
                <Tekst x={800} y={200} farge={LILLA} storrelse={44}>
                    patrisiere
                </Tekst>
            </motion.g>
            <motion.g animate={{ opacity: plebOpacity }}>
                <Mengde x0={200} x1={1400} y={680} farge={BRUN} rader={3} tetthet={30} />
                <Tekst x={800} y={540} farge={BRUN} storrelse={44}>
                    plebeiere
                </Tekst>
            </motion.g>
            <AnimatePresence>
                {beat === 1 && (
                    <Inn k="pat">
                        <rect
                            x={1060}
                            y={230}
                            width={440}
                            height={120}
                            rx={18}
                            fill="#ffffff"
                            stroke={LILLA}
                            strokeWidth={4}
                        />
                        <Tekst x={1280} y={282} farge={LILLA} storrelse={32}>
                            noen få gamle slekter
                        </Tekst>
                        <Tekst x={1280} y={326} storrelse={28} vekt={700}>
                            født inn i dem
                        </Tekst>
                    </Inn>
                )}
                {beat === 2 && (
                    <Inn k="pleb">
                        {[
                            { x: 480, t: 'bønder' },
                            { x: 800, t: 'håndverkere' },
                            { x: 1120, t: 'soldater' },
                        ].map((g, i) => (
                            <Inn key={g.t} forsinkelse={i * 0.5}>
                                <rect
                                    x={g.x - 140}
                                    y={790}
                                    width={280}
                                    height={78}
                                    rx={16}
                                    fill="#ffffff"
                                    stroke={BRUN}
                                    strokeWidth={4}
                                />
                                <Tekst x={g.x} y={843} farge={BRUN} storrelse={38}>
                                    {g.t}
                                </Tekst>
                            </Inn>
                        ))}
                    </Inn>
                )}
                {beat >= 3 && (
                    <Inn k="dorer">
                        {[
                            { x: 1150, t: 'prest' },
                            { x: 1400, t: 'politikk' },
                        ].map((d) => (
                            <g key={d.t}>
                                <rect
                                    x={d.x - 70}
                                    y={160}
                                    width={140}
                                    height={210}
                                    rx={8}
                                    fill="#7c2d12"
                                />
                                <circle cx={d.x + 44} cy={270} r={8} fill="#fde68a" />
                                <Tekst x={d.x} y={140} storrelse={34}>
                                    {d.t}
                                </Tekst>
                            </g>
                        ))}
                        <Inn forsinkelse={0.8}>
                            <path
                                d="M 990 300 L 1070 300"
                                stroke={LILLA}
                                strokeWidth={8}
                                markerEnd="url(#pil-lilla)"
                            />
                            <Kryss x={1275} y={500} r={34} />
                            <Tekst x={1275} y={590} farge={ROD} storrelse={32}>
                                ikke for plebeiere
                            </Tekst>
                        </Inn>
                    </Inn>
                )}
            </AnimatePresence>
            <defs>
                <marker
                    id="pil-lilla"
                    viewBox="0 0 10 10"
                    refX={6}
                    refY={5}
                    markerWidth={4}
                    markerHeight={4}
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill={LILLA} />
                </marker>
            </defs>
        </g>
    );
}

// ---------- Folketribunen ----------

function Senatet({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -130 -80 L 0 -150 L 130 -80 Z"
                fill="#d6d3d1"
                stroke="#a8a29e"
                strokeWidth={4}
            />
            {[-100, -50, 0, 50, 100].map((c) => (
                <rect
                    key={c}
                    x={c - 12}
                    y={-78}
                    width={24}
                    height={150}
                    fill="#e7e5e4"
                    stroke="#a8a29e"
                    strokeWidth={3}
                />
            ))}
            <rect x={-140} y={72} width={280} height={24} fill="#d6d3d1" />
        </g>
    );
}

function Rull({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <g>
            <rect
                x={-110}
                y={-60}
                width={220}
                height={120}
                rx={12}
                fill="#fffbeb"
                stroke="#a16207"
                strokeWidth={4}
            />
            <Tekst x={0} y={-12} storrelse={30} vekt={800}>
                Lov
            </Tekst>
            <Tekst x={0} y={34} farge={farge} storrelse={28}>
                {tekst}
            </Tekst>
        </g>
    );
}

function Veto({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat <= 1 && (
                <Inn k="tribun">
                    <Mengde x0={300} x1={1300} y={760} farge={BRUN} rader={2} tetthet={34} />
                    <rect x={680} y={560} width={240} height={36} rx={8} fill="#cdbd99" />
                    <Figur x={800} y={560} farge={BRUN} s={2} />
                    <Tekst x={800} y={300} farge={BRUN} storrelse={36}>
                        selv plebeier
                    </Tekst>
                    {beat === 1 && (
                        <motion.g
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        >
                            <rect
                                x={960}
                                y={240}
                                width={460}
                                height={190}
                                rx={30}
                                fill="#ffffff"
                                stroke={ROD}
                                strokeWidth={7}
                            />
                            <path
                                d="M 980 400 L 900 470 L 1020 420 Z"
                                fill="#ffffff"
                                stroke={ROD}
                                strokeWidth={7}
                            />
                            <Tekst x={1190} y={340} farge={ROD} storrelse={84}>
                                VETO!
                            </Tekst>
                            <Tekst x={1190} y={400} storrelse={34} vekt={700}>
                                = Jeg forbyr!
                            </Tekst>
                        </motion.g>
                    )}
                </Inn>
            )}
            {(beat === 2 || beat === 3) && (
                <Inn k={`lov-${beat}`}>
                    <Senatet x={300} y={500} />
                    <Tekst x={300} y={660} storrelse={36}>
                        senatet
                    </Tekst>
                    <Figur x={1000} y={720} farge={BRUN} s={1.4} />
                    <Tekst x={1000} y={790} farge={BRUN} storrelse={34}>
                        tribunen
                    </Tekst>
                    {beat === 2 ? (
                        <>
                            <motion.g
                                initial={{ x: 300, y: 300 }}
                                animate={{ x: 760, y: 300 }}
                                transition={{ duration: 2.4, ease: 'easeOut' }}
                            >
                                <Rull tekst="forslag" farge={MORK} />
                            </motion.g>
                            <Inn forsinkelse={2.4}>
                                <Kryss x={940} y={300} r={36} />
                                <Tekst x={1250} y={290} farge={ROD} storrelse={44}>
                                    Veto!
                                </Tekst>
                                <Tekst x={1250} y={340} storrelse={30} vekt={700}>
                                    før den er vedtatt
                                </Tekst>
                            </Inn>
                        </>
                    ) : (
                        <>
                            <g transform="translate(700 300)">
                                <Rull tekst="gjelder" farge={GRONN} />
                            </g>
                            <Inn forsinkelse={0.8}>
                                <Tekst x={1250} y={290} farge={ROD} storrelse={44}>
                                    Veto?
                                </Tekst>
                                <Tekst x={1250} y={345} storrelse={36}>
                                    for sent
                                </Tekst>
                            </Inn>
                        </>
                    )}
                </Inn>
            )}
            {beat === 4 && (
                <Inn k="ti">
                    {Array.from({ length: 10 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.3 }}
                        >
                            <Figur x={260 + i * 120} y={580} farge={BRUN} s={1.1} />
                            <Tekst x={260 + i * 120} y={650} storrelse={34}>
                                {String(i + 1)}
                            </Tekst>
                        </motion.g>
                    ))}
                    <Tekst x={800} y={330} farge={BRUN} storrelse={52}>
                        ti folketribuner hvert år
                    </Tekst>
                </Inn>
            )}
            {beat >= 5 && (
                <Inn k="kamp">
                    <line
                        x1={300}
                        y1={480}
                        x2={1300}
                        y2={480}
                        stroke="#d6c7a6"
                        strokeWidth={22}
                        strokeLinecap="round"
                    />
                    <motion.line
                        x1={300}
                        y1={480}
                        x2={1300}
                        y2={480}
                        stroke={BRUN}
                        strokeWidth={22}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 4, ease: 'easeInOut' }}
                    />
                    <Tekst x={300} y={430} storrelse={40}>
                        494 fvt.
                    </Tekst>
                    <Tekst x={1300} y={430} storrelse={40}>
                        ca. 300 fvt.
                    </Tekst>
                    <Tekst x={800} y={570} farge={BRUN} storrelse={40}>
                        flere hundre år med kamp
                    </Tekst>
                    <Inn forsinkelse={3.8}>
                        <rect
                            x={1120}
                            y={610}
                            width={360}
                            height={170}
                            rx={18}
                            fill="#ffffff"
                            stroke={GRONN}
                            strokeWidth={5}
                        />
                        <Hake x={1300} y={665} />
                        <Tekst x={1300} y={750} farge={GRONN} storrelse={34}>
                            vervene åpnes
                        </Tekst>
                    </Inn>
                </Inn>
            )}
        </AnimatePresence>
    );
}

// ---------- Jorda ----------

const GARD_KOL = 6;
const GARD_RAD = 3;
const GARD_B = 150;
const GARD_H = 120;
const GARD_X0 = 300;
const GARD_Y0 = 250;

function Gard({ i, beat }: { i: number; beat: number }) {
    const kol = i % GARD_KOL;
    const rad = Math.floor(i / GARD_KOL);
    const x = GARD_X0 + kol * (GARD_B + 12);
    const y = GARD_Y0 + rad * (GARD_H + 12);
    const grodd = beat >= 1;
    const kjopt = beat >= 2;
    return (
        <g>
            <motion.rect
                x={x}
                y={y}
                width={GARD_B}
                height={GARD_H}
                rx={8}
                initial={false}
                animate={{ fill: kjopt ? '#e9d5ff' : grodd ? '#4d7c0f' : '#d9c27a' }}
                transition={{ duration: 0.8, delay: kjopt ? 0.15 * i : 0 }}
            />
            {!grodd &&
                [0, 1, 2, 3].map((s) => (
                    <line
                        key={s}
                        x1={x + 14}
                        y1={y + 24 + s * 24}
                        x2={x + GARD_B - 50}
                        y2={y + 24 + s * 24}
                        stroke="#a16207"
                        strokeWidth={4}
                    />
                ))}
            {grodd &&
                !kjopt &&
                [0, 1, 2].map((s) => (
                    <circle
                        key={s}
                        cx={x + 30 + s * 40}
                        cy={y + 50 + (s % 2) * 30}
                        r={18}
                        fill="#365314"
                    />
                ))}
            {!kjopt && (
                <g>
                    <rect
                        x={x + GARD_B - 44}
                        y={y + 20}
                        width={30}
                        height={26}
                        fill="#f5ecd8"
                        stroke="#7c2d12"
                        strokeWidth={2}
                    />
                    <path
                        d={`M ${x + GARD_B - 48} ${y + 22} L ${x + GARD_B - 29} ${y + 6} L ${x + GARD_B - 10} ${y + 22} Z`}
                        fill="#9a3412"
                    />
                </g>
            )}
        </g>
    );
}

function Jord({ beat }: { beat: number }) {
    const totalB = GARD_KOL * (GARD_B + 12) - 12;
    const totalH = GARD_RAD * (GARD_H + 12) - 12;
    return (
        <g>
            {Array.from({ length: GARD_KOL * GARD_RAD }, (_, i) => (
                <Gard key={i} i={i} beat={beat} />
            ))}
            {beat >= 2 && (
                <motion.rect
                    x={GARD_X0 - 10}
                    y={GARD_Y0 - 10}
                    width={totalB + 20}
                    height={totalH + 20}
                    rx={14}
                    fill="none"
                    stroke={LILLA}
                    strokeWidth={10}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.8, duration: 0.8 }}
                />
            )}
            {beat === 0 && (
                <Inn>
                    <Tekst x={800} y={760} storrelse={38}>
                        små gårder, drevet av bønder
                    </Tekst>
                </Inn>
            )}
            {beat === 1 && (
                <Inn>
                    <Tekst x={800} y={760} farge={GRONN} storrelse={38}>
                        gårdene har grodd igjen
                    </Tekst>
                </Inn>
            )}
            {beat === 2 && (
                <Inn k="senator">
                    <Figur x={1390} y={560} farge={LILLA} s={1.5} toga />
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={1300 - i * 50}
                            cy={600}
                            r={22}
                            fill="#facc15"
                            stroke="#854d0e"
                            strokeWidth={5}
                            initial={{ opacity: 0, x: 0 }}
                            animate={{ opacity: 1, x: -120 }}
                            transition={{ duration: 1.4, delay: 0.4 + i * 0.5 }}
                        />
                    ))}
                </Inn>
            )}
            {beat === 2 && (
                <Inn forsinkelse={1}>
                    <Tekst x={800} y={760} farge={LILLA} storrelse={38}>
                        rike senatorer kjøper opp jorda
                    </Tekst>
                </Inn>
            )}
            {beat >= 3 && (
                <Inn k="slaver">
                    {Array.from({ length: 4 }, (_, r) =>
                        Array.from({ length: 12 }, (_, k) => (
                            <Figur
                                key={`${r}-${k}`}
                                x={GARD_X0 + 60 + k * 76}
                                y={GARD_Y0 + 90 + r * 100}
                                farge="#57534e"
                                s={0.55}
                            />
                        ))
                    )}
                    {beat === 3 && (
                        <Tekst x={800} y={760} farge={LILLA} storrelse={38}>
                            store gods der krigsfanger er slaver
                        </Tekst>
                    )}
                </Inn>
            )}
            {beat >= 4 && (
                <Inn k="flukt">
                    <rect x={0} y={0} width={B} height={H} fill="#f6efe1" opacity={0.6} />
                    {Array.from({ length: 6 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ x: 0, opacity: 0 }}
                            animate={{ x: 260, opacity: 1 }}
                            transition={{ duration: 3, delay: i * 0.4, ease: 'easeOut' }}
                        >
                            <Figur
                                x={1000 + (i % 3) * 50}
                                y={620 + Math.floor(i / 3) * 70}
                                farge={BRUN}
                                s={0.8}
                            />
                        </motion.g>
                    ))}
                    <g transform="translate(1440 560)">
                        <rect
                            x={-90}
                            y={-40}
                            width={180}
                            height={140}
                            fill="#d6d3d1"
                            stroke="#a8a29e"
                            strokeWidth={4}
                        />
                        <path d="M -110 -40 L 0 -110 L 110 -40 Z" fill="#a8a29e" />
                    </g>
                    <Tekst x={1440} y={460} storrelse={40}>
                        Roma
                    </Tekst>
                    <Tekst x={1200} y={820} farge={BRUN} storrelse={36}>
                        arbeidsløse tiggere
                    </Tekst>
                </Inn>
            )}
        </g>
    );
}
