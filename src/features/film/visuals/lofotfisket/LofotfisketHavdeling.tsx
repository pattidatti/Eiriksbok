import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Lofothavet sett ovenfra og fra siden.
 * «redskap»: et snitt av sjøen med juksa, garn og line.
 * «vaereier»: trengsel, redskaper i floke, forbudet i 1753 og havet delt mellom væreierne.
 * «loven»: Lofotloven i 1857 - fritt hav, havdeling, nattforbud og oppsyn.
 */

const B = 1600;
const H = 900;
type Modus = 'redskap' | 'vaereier' | 'loven';

const VAER = [220, 520, 800, 1080, 1380];
const ANTALL = 54;
const TYPE_FARGE = ['#0d9488', '#ea580c', '#2563eb'];
const TYPE_NAVN = ['Garn', 'Line', 'Juksa'];
/** Feltene i havdelingen, ovenfra og ned. */
const FELT = [
    { type: 0, y0: 230, y1: 450 },
    { type: 1, y0: 450, y1: 670 },
    { type: 2, y0: 670, y1: 885 },
];

const hash = (i: number, s: number) => {
    const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
    return x - Math.floor(x);
};

function batPos(modus: Modus, beat: number, i: number): { x: number; y: number; r: number } {
    const type = i % 3;
    const fritt = { x: 140 + hash(i, 1) * 1320, y: 270 + hash(i, 2) * 580, r: hash(i, 3) * 360 };
    if (modus === 'vaereier') {
        if (beat <= 2) {
            // Trengsel: alle på samme flekk.
            return { x: 560 + hash(i, 1) * 480, y: 380 + hash(i, 2) * 330, r: hash(i, 3) * 360 };
        }
        const stripe = i % VAER.length;
        return {
            x: VAER[stripe] - 90 + hash(i, 4) * 180,
            y: 280 + hash(i, 5) * 560,
            r: 90,
        };
    }
    if (modus === 'loven') {
        if (beat <= 1) return fritt;
        if (beat === 3) return { x: 120 + (i / ANTALL) * 1360, y: 222 + hash(i, 6) * 30, r: 0 };
        const felt = FELT[type];
        return {
            x: 280 + hash(i, 7) * 1200,
            y: felt.y0 + 40 + hash(i, 8) * (felt.y1 - felt.y0 - 80),
            r: 0,
        };
    }
    return fritt;
}

const OVERSKRIFT: Record<Modus, string[]> = {
    redskap: ['Tre redskaper', 'Juksa', 'Garn', 'Line'],
    vaereier: [
        'Trangt på havet',
        'Redskapene i floke',
        '1753: bare juksa',
        'Væreierne eier havet',
        'Fiskerne: nesten livegne',
    ],
    loven: [
        'Lofotloven, 1857',
        'Fritt hav, fritt fiske',
        'Havdeling',
        'Om natten: alle i land',
        'Oppsynet passer på',
        'Ingen ville tilbake',
    ],
};

export function LofotfisketHavdeling({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'redskap';
    const fart = playing ? 1 : 0;
    const overskrift = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#2f5f80]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'redskap' ? (
                    <Snitt beat={beat} fart={fart} />
                ) : (
                    <Ovenfra modus={modus} beat={beat} fart={fart} />
                )}
            </svg>
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- Ovenfra ---------------- */

function Ovenfra({ modus, beat, fart }: { modus: Modus; beat: number; fart: number }) {
    const skiver = modus === 'vaereier' ? beat >= 3 : beat === 0;
    const felt = modus === 'loven' && beat >= 2 && beat !== 3;
    const natt = modus === 'loven' && beat === 3;
    const floke = modus === 'vaereier' && (beat === 1 || beat === 2);
    return (
        <>
            <rect x={0} y={0} width={B} height={H} fill="#3b6f93" />
            {/* Havdelingen: tre felt, ett for hvert redskap */}
            {FELT.map((f, i) => (
                <motion.g key={i} initial={false} animate={{ opacity: felt ? 1 : 0 }}>
                    <rect
                        x={0}
                        y={f.y0}
                        width={B}
                        height={f.y1 - f.y0}
                        fill={TYPE_FARGE[f.type]}
                        opacity={0.22}
                    />
                    <line
                        x1={0}
                        x2={B}
                        y1={f.y1}
                        y2={f.y1}
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeDasharray="20 14"
                    />
                    <Merkelapp
                        x={40}
                        y={f.y0 + 60}
                        tekst={`${TYPE_NAVN[f.type]}-feltet`}
                        anker="start"
                    />
                </motion.g>
            ))}
            {/* Væreiernes skiver av havet */}
            {VAER.map((x, i) => (
                <motion.g key={x} initial={false} animate={{ opacity: skiver ? 1 : 0 }}>
                    <rect
                        x={x - 140}
                        y={200}
                        width={280}
                        height={H - 200}
                        fill={i % 2 ? '#7c2d12' : '#a16207'}
                        opacity={0.22}
                    />
                    <rect
                        x={x - 140}
                        y={200}
                        width={280}
                        height={H - 200}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={modus === 'vaereier' && beat >= 4 ? 10 : 3}
                    />
                </motion.g>
            ))}

            {/* Redskapene i floke: garn og liner på kryss og tvers */}
            <motion.g
                initial={false}
                animate={{ opacity: floke ? (beat === 2 ? [1, 0.15, 0.15, 1] : 1) : 0 }}
                transition={{ duration: beat === 2 ? 6 * fart : 0.6, times: [0, 0.2, 0.55, 0.8] }}
            >
                {[
                    [600, 420, 1000, 640, 0],
                    [640, 660, 1060, 400, 1],
                    [560, 540, 1080, 520, 0],
                    [720, 380, 860, 720, 1],
                    [900, 380, 960, 720, 0],
                ].map(([x1, y1, x2, y2, t], i) => (
                    <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={TYPE_FARGE[t]}
                        strokeWidth={t === 0 ? 10 : 6}
                        strokeDasharray={t === 1 ? '4 12' : undefined}
                        strokeLinecap="round"
                    />
                ))}
                {[
                    [800, 530],
                    [700, 470],
                    [930, 560],
                ].map(([x, y], i) => (
                    <g key={i} stroke="#dc2626" strokeWidth={12} strokeLinecap="round">
                        <line x1={x - 24} y1={y - 24} x2={x + 24} y2={y + 24} />
                        <line x1={x - 24} y1={y + 24} x2={x + 24} y2={y - 24} />
                    </g>
                ))}
            </motion.g>

            {/* Båtene */}
            {Array.from({ length: ANTALL }, (_, i) => {
                const pos = batPos(modus, beat, i);
                const type = i % 3;
                const farge =
                    modus === 'loven' && beat >= 2
                        ? TYPE_FARGE[type]
                        : modus === 'vaereier' && beat >= 4
                          ? '#94a3b8'
                          : '#f5efe0';
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ x: pos.x, y: pos.y, rotate: pos.r }}
                        transition={{
                            duration: 2.2 * fart,
                            delay: (i % 12) * 0.05 * fart,
                            ease: 'easeInOut',
                        }}
                    >
                        <path
                            d="M -16 0 Q -8 -8 16 0 Q -8 8 -16 0 Z"
                            fill={farge}
                            stroke="#0f172a"
                            strokeWidth={2}
                        />
                    </motion.g>
                );
            })}

            {/* Land øverst med fiskevær */}
            <path
                d={`M 0 0 L ${B} 0 L ${B} 190 Q 1450 225 1300 196 Q 1150 170 1000 205 Q 820 232 650 198 Q 480 168 330 206 Q 170 232 0 196 Z`}
                fill="#f4f7fa"
                stroke="#cbd5e1"
                strokeWidth={3}
            />
            {VAER.map((x, i) => (
                <g key={x} transform={`translate(${x} 150)`}>
                    {[-36, 0, 36].map((dx) => (
                        <g key={dx} transform={`translate(${dx} ${Math.abs(dx) / 3})`}>
                            <rect x={-14} y={-12} width={28} height={22} fill="#a3302a" />
                            <path d="M -18 -12 L 0 -28 L 18 -12 Z" fill="#334155" />
                        </g>
                    ))}
                    {modus === 'vaereier' && beat >= 3 && (
                        <Merkelapp x={0} y={110} tekst={`Væreier ${i + 1}`} liten />
                    )}
                </g>
            ))}

            {/* Natt */}
            <motion.g
                initial={false}
                animate={{ opacity: natt ? 1 : 0 }}
                transition={{ duration: 1.2 * fart }}
            >
                <rect x={0} y={0} width={B} height={H} fill="#0b1426" opacity={0.6} />
                <circle cx={1440} cy={330} r={46} fill="#fef9c3" />
                <circle cx={1462} cy={316} r={42} fill="#1c2a44" opacity={0.9} />
            </motion.g>

            {/* Oppsynsbåten */}
            {modus === 'loven' && beat === 4 && (
                <motion.g
                    initial={{ x: 140, y: 560 }}
                    animate={{ x: 1460, y: 560 }}
                    transition={{ duration: 14 * fart, ease: 'linear' }}
                >
                    <g transform="scale(1.5)">
                        <path
                            d="M -40 0 Q -20 -20 44 0 Q -20 20 -40 0 Z"
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                        <rect x={-6} y={-60} width={4} height={56} fill="#0f172a" />
                        <rect x={-2} y={-60} width={36} height={22} fill="#dc2626" />
                    </g>
                    <Merkelapp x={0} y={80} tekst="Oppsynet" liten />
                </motion.g>
            )}

            {/* Stempler */}
            {modus === 'vaereier' && beat === 2 && (
                <Stempel tekst="1753: FORBUDT" undertekst="alt unntatt juksa" />
            )}
            {modus === 'vaereier' && beat === 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.5 * fart }}
                >
                    <Merkelapp x={800} y={860} tekst="...men redskapene kom tilbake" />
                </motion.g>
            )}
            {modus === 'loven' && beat === 0 && (
                <Stempel tekst="LOFOTLOVEN 1857" undertekst="Ketil Motzfeldt" farge="#0f766e" />
            )}
            {modus === 'loven' &&
                beat === 5 &&
                FELT.map((f, i) => (
                    <motion.g
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.4 * fart, type: 'spring' }}
                        style={{ originX: '1500px', originY: `${(f.y0 + f.y1) / 2}px` }}
                    >
                        <circle
                            cx={1500}
                            cy={(f.y0 + f.y1) / 2}
                            r={36}
                            fill="#16a34a"
                            stroke="#fff"
                            strokeWidth={5}
                        />
                        <path
                            d={`M ${1482} ${(f.y0 + f.y1) / 2} l 12 12 l 22 -24`}
                            stroke="#fff"
                            strokeWidth={8}
                            fill="none"
                            strokeLinecap="round"
                        />
                    </motion.g>
                ))}
        </>
    );
}

function Stempel({
    tekst,
    undertekst,
    farge = '#dc2626',
}: {
    tekst: string;
    undertekst: string;
    farge?: string;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            style={{ originX: '800px', originY: '520px' }}
        >
            <g transform="rotate(-6 800 520)">
                <rect
                    x={430}
                    y={430}
                    width={740}
                    height={180}
                    rx={18}
                    fill="#ffffff"
                    opacity={0.92}
                />
                <rect
                    x={430}
                    y={430}
                    width={740}
                    height={180}
                    rx={18}
                    fill="none"
                    stroke={farge}
                    strokeWidth={10}
                />
                <text
                    x={800}
                    y={525}
                    textAnchor="middle"
                    fontSize={72}
                    fontWeight={900}
                    fill={farge}
                >
                    {tekst}
                </text>
                <text
                    x={800}
                    y={583}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={700}
                    fill="#334155"
                >
                    {undertekst}
                </text>
            </g>
        </motion.g>
    );
}

function Merkelapp({
    x,
    y,
    tekst,
    anker = 'middle',
    liten = false,
}: {
    x: number;
    y: number;
    tekst: string;
    anker?: 'middle' | 'start' | 'end';
    liten?: boolean;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={liten ? 28 : 38}
            fontWeight={800}
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

/* ---------------- Snitt av sjøen ---------------- */

const OVERFLATE = 270;
const BUNN = 840;

function Snitt({ beat, fart }: { beat: number; fart: number }) {
    const fokus = (n: number) => (beat === 0 ? 1 : beat === n ? 1 : 0.22);
    return (
        <>
            <defs>
                <linearGradient id="lofot-sjo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3f7aa1" />
                    <stop offset="1" stopColor="#173a56" />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={B} height={OVERFLATE} fill="#dbe6ef" />
            <rect x={0} y={OVERFLATE} width={B} height={H - OVERFLATE} fill="url(#lofot-sjo)" />
            <path
                d={`M 0 ${BUNN} Q 400 ${BUNN - 20} 800 ${BUNN} T ${B} ${BUNN - 10} L ${B} ${H} L 0 ${H} Z`}
                fill="#9c8a66"
            />
            {[533, 1066].map((x) => (
                <line
                    key={x}
                    x1={x}
                    x2={x}
                    y1={OVERFLATE + 20}
                    y2={BUNN - 20}
                    stroke="#ffffff"
                    strokeOpacity={0.15}
                    strokeWidth={3}
                />
            ))}

            {/* Juksa */}
            <motion.g initial={false} animate={{ opacity: fokus(1) }}>
                <SideBat x={270} />
                <motion.g
                    initial={false}
                    animate={{ y: beat === 1 ? [0, -50, 0] : 0 }}
                    transition={{ duration: 1.6, repeat: beat === 1 && fart ? Infinity : 0 }}
                >
                    <line
                        x1={300}
                        y1={OVERFLATE - 18}
                        x2={300}
                        y2={600}
                        stroke="#f8fafc"
                        strokeWidth={3}
                    />
                    <path
                        d="M 300 600 q 0 22 -16 22 q -12 0 -12 -12"
                        stroke="#e2e8f0"
                        strokeWidth={5}
                        fill="none"
                    />
                    <g transform="translate(240 630)">
                        <SideFisk />
                    </g>
                </motion.g>
                <Merkelapp x={266} y={790} tekst="Juksa" />
                <Merkelapp x={266} y={830} tekst="snøre med krok" liten />
            </motion.g>

            {/* Garn */}
            <motion.g initial={false} animate={{ opacity: fokus(2) }}>
                <SideBat x={800} />
                <line
                    x1={760}
                    y1={OVERFLATE + 4}
                    x2={700}
                    y2={500}
                    stroke="#f8fafc"
                    strokeWidth={2}
                />
                <circle cx={760} cy={OVERFLATE + 4} r={10} fill="#e0a526" />
                <rect
                    x={660}
                    y={500}
                    width={300}
                    height={290}
                    fill="url(#lofot-maske)"
                    stroke="#e2e8f0"
                    strokeWidth={3}
                />
                <defs>
                    <pattern id="lofot-maske" width={24} height={24} patternUnits="userSpaceOnUse">
                        <path
                            d="M 0 0 L 24 24 M 24 0 L 0 24"
                            stroke="#e2e8f0"
                            strokeWidth={1.5}
                            opacity={0.75}
                        />
                    </pattern>
                </defs>
                {Array.from({ length: 7 }, (_, i) => (
                    <circle key={i} cx={672 + i * 46} cy={500} r={8} fill="#e0a526" />
                ))}
                {[
                    [720, 580],
                    [850, 640],
                    [780, 720],
                ].map(([x, y], i) => (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ x: beat === 2 ? [x - 120, x] : x, y }}
                        transition={{ duration: 2 * fart, delay: i * 0.6 * fart }}
                    >
                        <SideFisk />
                    </motion.g>
                ))}
                <Merkelapp x={810} y={BUNN + 40} tekst="Garn: nett som står i sjøen" liten />
            </motion.g>

            {/* Line */}
            <motion.g initial={false} animate={{ opacity: fokus(3) }}>
                <SideBat x={1180} />
                {[1110, 1540].map((x) => (
                    <g key={x}>
                        <line
                            x1={x}
                            y1={OVERFLATE + 4}
                            x2={x}
                            y2={760}
                            stroke="#f8fafc"
                            strokeWidth={2}
                        />
                        <circle cx={x} cy={OVERFLATE + 4} r={11} fill="#e0a526" />
                    </g>
                ))}
                <motion.line
                    x1={1110}
                    y1={760}
                    x2={1540}
                    y2={760}
                    stroke="#f8fafc"
                    strokeWidth={4}
                    initial={false}
                    animate={{ pathLength: beat === 3 ? [0, 1] : 1 }}
                    transition={{ duration: 2.5 * fart }}
                />
                {Array.from({ length: 9 }, (_, i) => {
                    const x = 1140 + i * 46;
                    return (
                        <motion.g
                            key={i}
                            initial={false}
                            animate={{ opacity: beat === 3 ? [0, 1] : 1 }}
                            transition={{ delay: beat === 3 ? 0.8 + i * 0.2 * fart : 0 }}
                        >
                            <line
                                x1={x}
                                y1={760}
                                x2={x}
                                y2={800}
                                stroke="#f8fafc"
                                strokeWidth={2}
                            />
                            <path
                                d={`M ${x} 800 q 0 12 -9 12 q -7 0 -7 -7`}
                                stroke="#e2e8f0"
                                strokeWidth={3}
                                fill="none"
                            />
                            <circle cx={x - 3} cy={806} r={5} fill="#dc2626" />
                        </motion.g>
                    );
                })}
                <Merkelapp x={1330} y={705} tekst="Line: mange kroker med agn" liten />
            </motion.g>
        </>
    );
}

function SideBat({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} ${OVERFLATE})`}>
            <path
                d="M -90 -46 L -70 -10 L 70 -10 L 90 -46 L 70 10 L -70 10 Z"
                fill="#7a5230"
                stroke="#3b2a1c"
                strokeWidth={3}
            />
            <rect x={-4} y={-130} width={6} height={120} fill="#3b2a1c" />
            <rect
                x={-50}
                y={-122}
                width={100}
                height={84}
                fill="#efe6d2"
                stroke="#3b2a1c"
                strokeWidth={2}
            />
        </g>
    );
}

function SideFisk() {
    return (
        <g>
            <ellipse
                cx={0}
                cy={0}
                rx={34}
                ry={12}
                fill="#9aa8b5"
                stroke="#f8fafc"
                strokeWidth={2}
            />
            <path d="M 30 0 L 52 -14 L 52 14 Z" fill="#9aa8b5" stroke="#f8fafc" strokeWidth={2} />
            <circle cx={-22} cy={-3} r={3} fill="#0f172a" />
        </g>
    );
}
