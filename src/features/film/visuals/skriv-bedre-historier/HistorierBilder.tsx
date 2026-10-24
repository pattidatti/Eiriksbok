import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Stil. «rolig»: store, ropende ord og slitte bilder mot én rolig scene med små detaljer
 * (glidelåsen, klokka). «klisje»: tre slitte sammenligninger stemples som klisjé, og én ny
 * og presis tar over.
 */

type Modus = 'rolig' | 'klisje';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const SKRIFT = { fontFamily: 'Georgia, "Times New Roman", serif' };

/* ---------------------------------------------------------------- rolig */

const ROPEORD = [
    { tekst: 'EKSTREMT', x: '8%', y: '18%', rot: -8, farge: '#ef4444' },
    { tekst: 'FRYKTELIG', x: '34%', y: '42%', rot: 6, farge: '#f97316' },
    { tekst: 'KAOTISK', x: '14%', y: '64%', rot: -4, farge: '#eab308' },
];

function Glidelas({ beat }: { beat: number }) {
    return (
        <svg viewBox="0 0 600 600" style={{ width: 380, height: 380 }}>
            {/* Jakken */}
            <path d="M 60 600 L 90 60 Q 300 10 510 60 L 540 600 Z" fill="#4338ca" />
            <path d="M 90 60 Q 300 10 510 60 L 470 120 Q 300 80 130 120 Z" fill="#3730a3" />
            {/* Tennene i glidelåsen */}
            <line
                x1={300}
                y1={80}
                x2={300}
                y2={600}
                stroke="#cbd5e1"
                strokeWidth={14}
                strokeDasharray="8 8"
            />
            {/* Glidelåsen glir opp og ned, mens fingrene leker med den */}
            <motion.g
                animate={{ y: beat >= 2 ? [0, -40, 0, -24, 0] : 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                <rect x={284} y={300} width={32} height={46} rx={6} fill="#e2e8f0" />
                <rect x={290} y={344} width={20} height={44} rx={8} fill="#94a3b8" />
                {[0, 1, 2].map((i) => (
                    <rect
                        key={i}
                        x={322 + i * 6}
                        y={318 + i * 26}
                        width={110}
                        height={30}
                        rx={15}
                        fill="#e8b996"
                    />
                ))}
                <rect x={240} y={330} width={70} height={30} rx={15} fill="#e8b996" />
            </motion.g>
        </svg>
    );
}

function Klokke() {
    return (
        <svg viewBox="0 0 200 200" style={{ width: 170, height: 170 }}>
            <circle cx={100} cy={100} r={90} fill="#f8fafc" stroke="#1e293b" strokeWidth={10} />
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <line
                        key={i}
                        x1={100 + Math.sin(a) * 70}
                        y1={100 - Math.cos(a) * 70}
                        x2={100 + Math.sin(a) * 80}
                        y2={100 - Math.cos(a) * 80}
                        stroke="#1e293b"
                        strokeWidth={6}
                    />
                );
            })}
            <line
                x1={100}
                y1={100}
                x2={100}
                y2={48}
                stroke="#1e293b"
                strokeWidth={8}
                strokeLinecap="round"
            />
            {/* Minuttviseren står fem minutter før hel time */}
            <line
                x1={100}
                y1={100}
                x2={100 - Math.sin(Math.PI / 6) * 70}
                y2={100 - Math.cos(Math.PI / 6) * 70}
                stroke="#dc2626"
                strokeWidth={6}
                strokeLinecap="round"
            />
            <circle cx={100} cy={100} r={8} fill="#1e293b" />
        </svg>
    );
}

const DETALJER = ['Rett i ryggen', 'Fingrene på glidelåsen', 'Fem minutter igjen'];

function Rolig({ beat }: { beat: number }) {
    const stoy = beat <= 1;
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: stoy ? '#1c1917' : '#e2e8f0', transition: 'background 1s' }}
        >
            <AnimatePresence>
                {stoy &&
                    ROPEORD.map((o, i) => (
                        <motion.div
                            key={o.tekst}
                            className="absolute font-black"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: beat === 0 ? 1 : 0.18,
                                scale: 1,
                                rotate: [o.rot, o.rot + 3, o.rot - 3, o.rot],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                opacity: { duration: 0.6, delay: beat === 0 ? i * 0.4 : 0 },
                                scale: { duration: 0.5, delay: i * 0.4 },
                                rotate: { duration: 0.5, repeat: Infinity },
                            }}
                            style={{
                                ...FONT,
                                left: o.x,
                                top: o.y,
                                fontSize: '6rem',
                                color: o.farge,
                            }}
                        >
                            {`${o.tekst}!`}
                        </motion.div>
                    ))}
            </AnimatePresence>
            {beat === 1 && (
                <div
                    className="absolute flex flex-col items-center justify-center"
                    style={{ inset: 0, gap: '1rem' }}
                >
                    {['Hjertet dunket som en tromme.', 'Kroppen var spent som en buestreng.'].map(
                        (s, i) => (
                            <motion.div
                                key={s}
                                initial={{ opacity: 0, x: i ? 60 : -60 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + i * 0.6 }}
                                className="rounded-2xl shadow-2xl"
                                style={{
                                    ...SKRIFT,
                                    background: '#fffdf5',
                                    padding: '0.7rem 1.6rem',
                                    fontSize: '2.1rem',
                                    color: '#1e293b',
                                }}
                            >
                                {s}
                            </motion.div>
                        )
                    )}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        className="rounded-full font-black"
                        style={{
                            ...FONT,
                            background: '#dc2626',
                            color: '#fff',
                            padding: '0.4rem 1.4rem',
                            fontSize: '1.7rem',
                        }}
                    >
                        Mye lyd, lite bilde
                    </motion.div>
                </div>
            )}
            {!stoy && (
                <motion.div
                    className="absolute flex items-center"
                    style={{ inset: 0, padding: '0 5%', gap: '2rem' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Glidelas beat={beat} />
                    <div className="flex flex-col" style={{ gap: '1rem' }}>
                        <Klokke />
                        {DETALJER.map((d, i) => (
                            <motion.div
                                key={d}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 + i * 0.9 }}
                                className="rounded-xl font-bold"
                                style={{
                                    ...FONT,
                                    background: '#ffffff',
                                    color: '#1e293b',
                                    padding: '0.4rem 1.1rem',
                                    fontSize: '1.6rem',
                                    borderLeft: '8px solid #0d9488',
                                    width: 'max-content',
                                }}
                            >
                                {d}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="slutt"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="absolute flex flex-col items-start"
                        style={{ left: '4%', bottom: '6%', gap: '0.6rem' }}
                    >
                        <div
                            className="rounded-2xl font-black"
                            style={{
                                ...FONT,
                                background: '#0f172a',
                                color: '#fff',
                                padding: '0.5rem 1.3rem',
                                fontSize: '1.6rem',
                            }}
                        >
                            Vi skjønner: Hun er nervøs
                        </div>
                        <div
                            className="rounded-2xl font-black"
                            style={{
                                ...FONT,
                                background: '#fcd34d',
                                color: '#1e293b',
                                padding: '0.6rem 1.4rem',
                                fontSize: '2rem',
                            }}
                        >
                            Små detaljer slår store ord
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------------------------------------------------------- klisjé */

function Tyr() {
    return (
        <svg viewBox="0 0 120 100" style={{ width: 120, height: 100 }}>
            <path d="M 20 30 Q 5 10 25 5 Q 22 20 35 28 Z" fill="#f5f5f4" />
            <path d="M 100 30 Q 115 10 95 5 Q 98 20 85 28 Z" fill="#f5f5f4" />
            <ellipse cx={60} cy={50} rx={36} ry={34} fill="#7c2d12" />
            <ellipse cx={60} cy={72} rx={22} ry={14} fill="#a16207" />
            <circle cx={52} cy={72} r={3} fill="#1c1917" />
            <circle cx={68} cy={72} r={3} fill="#1c1917" />
            <circle cx={46} cy={44} r={5} fill="#fef2f2" />
            <circle cx={74} cy={44} r={5} fill="#fef2f2" />
        </svg>
    );
}

function Tomat() {
    return (
        <svg viewBox="0 0 120 100" style={{ width: 120, height: 100 }}>
            <ellipse cx={60} cy={58} rx={42} ry={36} fill="#dc2626" />
            <path d="M 60 24 L 48 14 L 58 22 L 60 10 L 62 22 L 72 14 Z" fill="#16a34a" />
            <ellipse cx={44} cy={46} rx={8} ry={5} fill="#fca5a5" />
        </svg>
    );
}

function Love() {
    return (
        <svg viewBox="0 0 120 100" style={{ width: 120, height: 100 }}>
            <circle cx={60} cy={50} r={44} fill="#b45309" />
            <circle cx={60} cy={52} r={28} fill="#f59e0b" />
            <circle cx={50} cy={46} r={4} fill="#1c1917" />
            <circle cx={70} cy={46} r={4} fill="#1c1917" />
            <ellipse cx={60} cy={66} rx={10} ry={7} fill="#7c2d12" />
        </svg>
    );
}

const KLISJEER = [
    { tekst: 'sint som en tyr', Ikon: Tyr },
    { tekst: 'rød som en tomat', Ikon: Tomat },
    { tekst: 'brølte som en løve', Ikon: Love },
];

function Klisje({ beat }: { beat: number }) {
    const ny = beat >= 3;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            {beat === 0 && (
                <motion.div
                    className="absolute flex items-center justify-center font-black"
                    style={{
                        ...FONT,
                        inset: 0,
                        gap: '1.4rem',
                        fontSize: '3.6rem',
                        color: '#1e293b',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <span
                        className="rounded-2xl bg-white shadow-xl"
                        style={{ padding: '0.6rem 1.4rem' }}
                    >
                        noe
                    </span>
                    <motion.span
                        className="rounded-2xl shadow-xl"
                        style={{ padding: '0.6rem 1.4rem', background: '#fde047' }}
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 14 }}
                    >
                        som
                    </motion.span>
                    <span
                        className="rounded-2xl bg-white shadow-xl"
                        style={{ padding: '0.6rem 1.4rem' }}
                    >
                        noe annet
                    </span>
                </motion.div>
            )}
            {beat >= 1 && (
                <motion.div
                    className="absolute flex justify-center"
                    style={{ left: 0, right: 0, gap: '1.6rem' }}
                    initial={false}
                    animate={{
                        top: ny ? '6%' : '26%',
                        scale: ny ? 0.62 : 1,
                        opacity: ny ? 0.55 : 1,
                    }}
                    transition={{ duration: 0.9 }}
                >
                    {KLISJEER.map(({ tekst, Ikon }, i) => (
                        <motion.div
                            key={tekst}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: beat === 1 ? 0.3 + i * 0.7 : 0 }}
                            className="relative flex flex-col items-center rounded-3xl shadow-xl"
                            style={{
                                background: '#ffffff',
                                padding: '1.2rem 1.4rem',
                                width: 260,
                                filter: beat >= 2 ? 'grayscale(1)' : 'none',
                                transition: 'filter 0.8s',
                            }}
                        >
                            <Ikon />
                            <div
                                className="font-black text-center"
                                style={{
                                    ...FONT,
                                    fontSize: '1.7rem',
                                    color: '#1e293b',
                                    marginTop: '0.4rem',
                                }}
                            >
                                {tekst}
                            </div>
                            {beat >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: 0.3 + i * 0.3,
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 16,
                                    }}
                                    className="absolute font-black uppercase"
                                    style={{
                                        ...FONT,
                                        top: '6%',
                                        color: '#dc2626',
                                        border: '5px solid #dc2626',
                                        borderRadius: 10,
                                        padding: '0.1rem 0.8rem',
                                        fontSize: '1.8rem',
                                        transform: 'rotate(-14deg)',
                                        background: 'rgba(255,255,255,0.85)',
                                    }}
                                >
                                    Klisjé
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute flex justify-center"
                    style={{ left: 0, right: 0, bottom: '12%' }}
                >
                    <div
                        className="rounded-2xl font-black"
                        style={{
                            ...FONT,
                            background: '#0f172a',
                            color: '#fff',
                            padding: '0.6rem 1.5rem',
                            fontSize: '2rem',
                        }}
                    >
                        Brukt så mye at de har mistet kraften
                    </div>
                </motion.div>
            )}
            {ny && (
                <motion.div
                    className="absolute flex flex-col items-center"
                    style={{ left: 0, right: 0, top: '40%', gap: '1rem' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <div
                        className="relative overflow-hidden rounded-3xl shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #0f172a, #334155)',
                            padding: '1.3rem 2.2rem',
                            maxWidth: '82%',
                        }}
                    >
                        {/* Et blankt stålskinn som glir over kortet */}
                        <motion.div
                            className="absolute"
                            style={{
                                top: 0,
                                bottom: 0,
                                width: 120,
                                background:
                                    'linear-gradient(90deg, transparent, rgba(186,230,253,0.45), transparent)',
                            }}
                            initial={{ left: '-20%' }}
                            animate={{ left: '120%' }}
                            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <div
                            style={{
                                ...SKRIFT,
                                color: '#e0f2fe',
                                fontSize: '2.3rem',
                                position: 'relative',
                            }}
                        >
                            Raseriet brant som kaldt stål i brystet hans.
                        </div>
                    </div>
                    {beat >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl font-black"
                            style={{
                                ...FONT,
                                background: '#fcd34d',
                                color: '#1e293b',
                                padding: '0.6rem 1.5rem',
                                fontSize: '2rem',
                            }}
                        >
                            Krydder, ikke hovedrett
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export function HistorierBilder({ beat, props }: VisualProps<{ modus?: Modus }>) {
    return props.modus === 'klisje' ? <Klisje beat={beat} /> : <Rolig beat={beat} />;
}
