import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hverdagen i Chile som en butikkhylle, og økonomien som en trykkmåler med fire spaker.
 * «hap»: hylla fylles med melk, nye boliger reiser seg, lønna stiger og sola går opp.
 * «trykk»: USA slår på spak etter spak (lån, streik, kobberpris, aviser). Hylla tømmes,
 * nåla klatrer, og til slutt står måleren i rødt: økonomien skriker.
 */

type Modus = 'hap' | 'trykk';

const B = 1600;
const H = 900;

const SPAKER = [
    { tekst: 'Lån', x: 150 },
    { tekst: 'Streik', x: 320 },
    { tekst: 'Kobberpris', x: 490 },
    { tekst: 'Aviser', x: 660 },
];
const NIVÅ = [0.06, 0.3, 0.52, 0.7, 0.86, 1];
const MÅLER = { x: 405, y: 400, r: 230 };

const HYLLER = [
    { y: 345, slag: 'melk' as const },
    { y: 515, slag: 'brod' as const },
    { y: 685, slag: 'varer' as const },
];

/** Hvilke varer som står i hylla. */
function iHylla(modus: Modus, beat: number, slag: 'melk' | 'brod' | 'varer') {
    if (modus === 'hap') {
        if (slag === 'melk') return beat >= 1;
        return true;
    }
    if (slag === 'varer') return beat < 1;
    return beat < 2;
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    hap: [
        { tekst: 'Mer enn ord' },
        { tekst: 'Gratis melk til alle barn' },
        { tekst: 'Nye boliger, høyere lønn' },
        { tekst: 'En tid full av håp' },
    ],
    trykk: [
        { tekst: 'En lydløs krig' },
        { tekst: 'Spak 1: ingen lån', rod: true },
        { tekst: 'Spak 2: betalt streik', rod: true },
        { tekst: 'Spak 3: kobberprisen faller', rod: true },
        { tekst: 'Spak 4: frykt i avisene', rod: true },
        { tekst: 'Økonomien skriker', rod: true },
    ],
};

export function ChileTrykk({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'trykk';
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    const varm = modus === 'hap' && beat >= 3;
    const skrik = modus === 'trykk' && beat >= 5;
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                background: varm ? '#fef3c7' : skrik ? '#fee2e2' : '#f1f5f9',
                transition: 'background 1.2s ease',
            }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'hap' ? <Hapet beat={beat} /> : <Panel beat={beat} />}
                <Hylle modus={modus} beat={beat} />
                {modus === 'trykk' && <Sidekolonne beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            {skrik && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 120px 30px rgba(220,38,38,0.55)' }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                />
            )}
        </div>
    );
}

/** Venstre side i «hap»: sola, boliger som reiser seg og en lønnsstolpe som stiger. */
function Hapet({ beat }: { beat: number }) {
    const bakke = 760;
    return (
        <g>
            <motion.circle
                cx={400}
                r={110}
                fill="#fbbf24"
                initial={{ cy: 1100 }}
                animate={{ cy: beat >= 3 ? 290 : 1100 }}
                transition={{ duration: 2, ease: 'easeOut' }}
            />
            <rect x={40} y={bakke} width={740} height={14} rx={7} fill="#a8a29e" />
            {[0, 1, 2, 3].map((i) => (
                <motion.g
                    key={i}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: beat >= 2 ? 1 : 0, opacity: beat >= 2 ? 1 : 0 }}
                    transition={{
                        delay: 0.3 + i * 0.25,
                        type: 'spring',
                        stiffness: 140,
                        damping: 16,
                    }}
                    style={{
                        transformOrigin: `${90 + i * 120}px ${bakke}px`,
                        transformBox: 'view-box',
                    }}
                >
                    <rect
                        x={40 + i * 120}
                        y={bakke - 170}
                        width={100}
                        height={170}
                        fill={['#fecaca', '#bfdbfe', '#bbf7d0', '#fed7aa'][i]}
                        stroke="#475569"
                        strokeWidth={4}
                    />
                    <path
                        d={`M ${30 + i * 120} ${bakke - 168} L ${90 + i * 120} ${bakke - 240} L ${150 + i * 120} ${bakke - 168} Z`}
                        fill="#9a3412"
                    />
                    <rect
                        x={70 + i * 120}
                        y={bakke - 130}
                        width={40}
                        height={40}
                        fill="#e0f2fe"
                        stroke="#475569"
                        strokeWidth={3}
                    />
                    <rect x={75 + i * 120} y={bakke - 70} width={30} height={70} fill="#78350f" />
                </motion.g>
            ))}
            {beat >= 2 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    x={270}
                    y={bakke + 70}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#334155"
                >
                    Nye boliger
                </motion.text>
            )}
            {/* Lønnsstolpen */}
            <rect x={600} y={bakke - 400} width={110} height={400} rx={10} fill="#e2e8f0" />
            <motion.rect
                x={600}
                width={110}
                rx={10}
                fill="#16a34a"
                initial={{ y: bakke - 120, height: 120 }}
                animate={{
                    y: beat >= 2 ? bakke - 330 : bakke - 120,
                    height: beat >= 2 ? 330 : 120,
                }}
                transition={{ delay: 0.8, duration: 1.6, ease: 'easeOut' }}
            />
            <text
                x={655}
                y={bakke + 70}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#334155"
            >
                Lønn
            </text>
            {beat >= 2 && (
                <motion.path
                    d={`M 740 ${bakke - 150} L 740 ${bakke - 360} M 715 ${bakke - 330} L 740 ${bakke - 360} L 765 ${bakke - 330}`}
                    stroke="#16a34a"
                    strokeWidth={12}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                />
            )}
        </g>
    );
}

/** Venstre side i «trykk»: trykkmåleren og de fire spakene. */
function Panel({ beat }: { beat: number }) {
    const nivå = NIVÅ[Math.min(beat, NIVÅ.length - 1)];
    const { x, y, r } = MÅLER;
    const bue = (fra: number, til: number) => {
        const a0 = Math.PI + fra * Math.PI;
        const a1 = Math.PI + til * Math.PI;
        return `M ${x + Math.cos(a0) * r} ${y + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${x + Math.cos(a1) * r} ${y + Math.sin(a1) * r}`;
    };
    /** Spissen av nåla: 0 peker mot venstre, 1 mot høyre, langs buen over midten. */
    const spiss = (n: number): [number, number] => [
        x + Math.cos(Math.PI + n * Math.PI) * (r - 30),
        y + Math.sin(Math.PI + n * Math.PI) * (r - 30),
    ];
    return (
        <g>
            <rect x={40} y={110} width={740} height={740} rx={36} fill="#1e293b" />
            <path d={bue(0, 0.5)} stroke="#22c55e" strokeWidth={40} fill="none" />
            <path d={bue(0.5, 0.8)} stroke="#f59e0b" strokeWidth={40} fill="none" />
            <path d={bue(0.8, 1)} stroke="#dc2626" strokeWidth={40} fill="none" />
            <text
                x={x}
                y={y + 70}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#e2e8f0"
            >
                Trykk på økonomien
            </text>
            <motion.line
                x1={x}
                y1={y}
                initial={{ x2: spiss(0.02)[0], y2: spiss(0.02)[1] }}
                animate={
                    beat >= 5
                        ? {
                              x2: [spiss(0.97)[0], spiss(1.01)[0], spiss(0.97)[0]],
                              y2: [spiss(0.97)[1], spiss(1.01)[1], spiss(0.97)[1]],
                          }
                        : { x2: spiss(nivå)[0], y2: spiss(nivå)[1] }
                }
                transition={
                    beat >= 5
                        ? { duration: 0.25, repeat: Infinity }
                        : { duration: 1.2, ease: 'easeOut' }
                }
                stroke="#f8fafc"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <circle cx={x} cy={y} r={22} fill="#f8fafc" />
            {SPAKER.map((s, i) => {
                const på = beat >= i + 1;
                return (
                    <g key={s.tekst}>
                        <rect
                            x={s.x - 18}
                            y={580}
                            width={36}
                            height={150}
                            rx={18}
                            fill="#0f172a"
                            stroke="#475569"
                            strokeWidth={4}
                        />
                        <motion.g
                            initial={{ y: 0 }}
                            animate={{ y: på ? 110 : 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 14 }}
                        >
                            <line
                                x1={s.x}
                                y1={600}
                                x2={s.x}
                                y2={545}
                                stroke="#94a3b8"
                                strokeWidth={12}
                                strokeLinecap="round"
                            />
                            <circle
                                cx={s.x}
                                cy={540}
                                r={28}
                                fill={på ? '#dc2626' : '#64748b'}
                                style={{ transition: 'fill 0.6s' }}
                            />
                        </motion.g>
                        <text
                            x={s.x}
                            y={790}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={på ? '#fca5a5' : '#cbd5e1'}
                        >
                            {s.tekst}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function Vare({ slag, x, y }: { slag: 'melk' | 'brod' | 'varer'; x: number; y: number }) {
    if (slag === 'melk')
        return (
            <g>
                <rect
                    x={x - 26}
                    y={y - 100}
                    width={52}
                    height={100}
                    fill="#ffffff"
                    stroke="#1d4ed8"
                    strokeWidth={4}
                />
                <path
                    d={`M ${x - 26} ${y - 100} L ${x} ${y - 125} L ${x + 26} ${y - 100} Z`}
                    fill="#ffffff"
                    stroke="#1d4ed8"
                    strokeWidth={4}
                />
                <rect x={x - 26} y={y - 60} width={52} height={22} fill="#3b82f6" />
            </g>
        );
    if (slag === 'brod')
        return (
            <ellipse
                cx={x}
                cy={y - 34}
                rx={42}
                ry={34}
                fill="#d97706"
                stroke="#92400e"
                strokeWidth={4}
            />
        );
    return (
        <rect
            x={x - 32}
            y={y - 76}
            width={64}
            height={76}
            rx={6}
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth={4}
        />
    );
}

/** Butikkhylla. Varene forsvinner når spakene slås på, og melka kommer når Allende deler ut. */
function Hylle({ modus, beat }: { modus: Modus; beat: number }) {
    const x0 = modus === 'hap' ? 900 : 840;
    const bredde = modus === 'hap' ? 640 : 420;
    const antall = modus === 'hap' ? 6 : 4;
    return (
        <g>
            <text
                x={x0 + bredde / 2}
                y={170}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#334155"
            >
                Butikken
            </text>
            <rect
                x={x0 - 20}
                y={195}
                width={bredde + 40}
                height={510}
                rx={14}
                fill="#e7e5e4"
                stroke="#a8a29e"
                strokeWidth={5}
            />
            {HYLLER.map((h) => {
                const vis = iHylla(modus, beat, h.slag);
                return (
                    <g key={h.slag}>
                        <rect x={x0 - 20} y={h.y} width={bredde + 40} height={14} fill="#78716c" />
                        <AnimatePresence>
                            {vis &&
                                Array.from({ length: antall }, (_, i) => (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, y: -30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: 0.3 + i * 0.12 }}
                                    >
                                        <Vare
                                            slag={h.slag}
                                            x={x0 + bredde / antall / 2 + (i * bredde) / antall}
                                            y={h.y}
                                        />
                                    </motion.g>
                                ))}
                        </AnimatePresence>
                        {!vis && modus === 'trykk' && (
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                x={x0 + bredde / 2}
                                y={h.y - 40}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={900}
                                fill="#b91c1c"
                            >
                                TOMT
                            </motion.text>
                        )}
                    </g>
                );
            })}
            {modus === 'hap' && beat >= 1 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    x={x0 + bredde / 2}
                    y={780}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#1d4ed8"
                >
                    Gratis melk til barna
                </motion.text>
            )}
        </g>
    );
}

/** Høyre kolonne i «trykk»: lastebilen som står, kobberprisen som faller og avisa. */
function Sidekolonne({ beat }: { beat: number }) {
    const x = 1310;
    return (
        <g>
            <AnimatePresence>
                {beat >= 2 && (
                    <motion.g
                        key="bil"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x={x} y={200} width={150} height={80} rx={8} fill="#78716c" />
                        <rect x={x + 150} y={225} width={70} height={55} rx={8} fill="#57534e" />
                        <circle cx={x + 40} cy={290} r={20} fill="#1c1917" />
                        <circle cx={x + 180} cy={290} r={20} fill="#1c1917" />
                        <rect x={x + 20} y={140} width={180} height={50} rx={8} fill="#dc2626" />
                        <text
                            x={x + 110}
                            y={168}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={32}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            STREIK
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="pris"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect
                            x={x - 10}
                            y={360}
                            width={250}
                            height={170}
                            rx={12}
                            fill="#ffffff"
                            stroke="#cbd5e1"
                            strokeWidth={4}
                        />
                        <text
                            x={x + 115}
                            y={395}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={800}
                            fill="#9a3412"
                        >
                            Kobberpris
                        </text>
                        <motion.path
                            d={`M ${x + 15} 430 L ${x + 75} 440 L ${x + 120} 470 L ${x + 165} 480 L ${x + 215} 515`}
                            stroke="#dc2626"
                            strokeWidth={8}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.6, duration: 1.4 }}
                        />
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g
                        key="avis"
                        initial={{ opacity: 0, rotate: -20, scale: 0.6 }}
                        animate={{ opacity: 1, rotate: -4, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 140, damping: 12 }}
                        style={{ transformOrigin: `${x + 115}px 690px`, transformBox: 'view-box' }}
                    >
                        <rect
                            x={x - 10}
                            y={580}
                            width={250}
                            height={220}
                            fill="#fafaf9"
                            stroke="#44403c"
                            strokeWidth={4}
                        />
                        <text
                            x={x + 115}
                            y={640}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            KAOS!
                        </text>
                        {[680, 710, 740, 770].map((yy) => (
                            <rect
                                key={yy}
                                x={x + 10}
                                y={yy}
                                width={210}
                                height={12}
                                fill="#a8a29e"
                            />
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}
