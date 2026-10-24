import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Synsvinkel som forfatterens kamera, tegnet i 2D.
 * «kamera»: en søker over et landskap med en helt. Kameraet går nært på ansiktet, så høyt
 * opp som en fugl, og til slutt kommer de tre tingene kameraet bestemmer.
 * «farger»: samme hendelse gjennom to linser. Helten i midten i den ene, skurken i den
 * andre. Til slutt de tre linsene filmen skal prøve.
 */

type Modus = 'kamera' | 'farger';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const ANSIKT = { x: 800, y: 470 };

/** Zoom per beat: skala og punktet som skal ligge midt i bildet. */
const ZOOM = [
    { s: 1, x: 800, y: 450 },
    { s: 3.4, x: ANSIKT.x, y: ANSIKT.y + 20 },
    { s: 0.5, x: 800, y: 560 },
    { s: 1, x: 800, y: 450 },
    { s: 1, x: 800, y: 450 },
];

function Helten({ x, y, farge = '#2563eb' }: { x: number; y: number; farge?: string }) {
    return (
        <g>
            <rect x={x - 34} y={y + 40} width={68} height={120} rx={22} fill={farge} />
            <rect x={x - 26} y={y + 150} width={20} height={90} rx={8} fill="#1f2937" />
            <rect x={x + 6} y={y + 150} width={20} height={90} rx={8} fill="#1f2937" />
            <circle cx={x} cy={y} r={42} fill="#e8b996" />
            <path d={`M ${x - 44} ${y - 8} Q ${x} ${y - 70} ${x + 44} ${y - 8} Q ${x} ${y - 36} ${x - 44} ${y - 8}`} fill="#5b3416" />
            <circle cx={x - 15} cy={y + 2} r={5} fill="#1e293b" />
            <circle cx={x + 15} cy={y + 2} r={5} fill="#1e293b" />
            <path d={`M ${x - 14} ${y + 20} Q ${x} ${y + 30} ${x + 14} ${y + 20}`} stroke="#7c2d12" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
    );
}

function Landskap() {
    return (
        <g>
            <rect x={-2000} y={-2000} width={5600} height={4900} fill="#bae6fd" />
            <circle cx={1300} cy={180} r={70} fill="#fde68a" />
            <path d="M -2000 720 Q 400 560 800 700 Q 1200 820 3600 640 L 3600 2900 L -2000 2900 Z" fill="#65a30d" />
            <path d="M -2000 820 Q 600 760 1200 860 Q 2000 940 3600 820 L 3600 2900 L -2000 2900 Z" fill="#4d7c0f" />
            <rect x={300} y={470} width={26} height={220} fill="#6b4a2f" />
            <circle cx={313} cy={440} r={90} fill="#3f7a35" />
            <rect x={1200} y={500} width={22} height={200} fill="#6b4a2f" />
            <circle cx={1211} cy={470} r={76} fill="#3f7a35" />
            <Helten x={ANSIKT.x} y={ANSIKT.y} />
        </g>
    );
}

function Fugl({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 46} ${y} Q ${x - 22} ${y - 26} ${x} ${y} Q ${x + 22} ${y - 26} ${x + 46} ${y}`}
            stroke="#0f172a"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
        />
    );
}

/** Hjørnene i kamerasøkeren, med opptakslampe. */
function Soker() {
    const h = 70;
    const k = [
        [70, 60, 1, 1],
        [1530, 60, -1, 1],
        [70, 840, 1, -1],
        [1530, 840, -1, -1],
    ];
    return (
        <g stroke="#ffffff" strokeWidth={8} fill="none" strokeLinecap="round">
            {k.map(([x, y, sx, sy], i) => (
                <path key={i} d={`M ${x} ${y + sy * h} L ${x} ${y} L ${x + sx * h} ${y}`} />
            ))}
            <circle cx={1440} cy={110} r={14} fill="#dc2626" stroke="none" />
        </g>
    );
}

const KAMERA_MERKER: { fraBeat: number; tilBeat?: number; tekst: string; x: number; y: number; gull?: boolean }[] = [
    { fraBeat: 0, tilBeat: 0, tekst: 'Kameraet velger hva du ser', x: 800, y: 160 },
    { fraBeat: 1, tilBeat: 1, tekst: 'Nært på ansiktet', x: 800, y: 160 },
    { fraBeat: 2, tilBeat: 2, tekst: 'Høyt oppe, som en fugl', x: 800, y: 160 },
    { fraBeat: 3, tekst: 'Synsvinkel = forfatterens kamera', x: 800, y: 160, gull: true },
];

const TRE_TING = ['Hva vi får vite', 'Hva vi får føle', 'Hvem vi heier på'];

function Kamera({ beat }: { beat: number }) {
    const z = ZOOM[Math.min(beat, ZOOM.length - 1)];
    const tx = 800 - z.x * z.s;
    const ty = 450 - z.y * z.s;
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <g
                style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${z.s})`,
                    transition: 'transform 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <Landskap />
            </g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <Fugl x={560} y={300} />
                <Fugl x={680} y={250} />
            </motion.g>
            <Soker />
            <AnimatePresence>
                {KAMERA_MERKER.filter((m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)).map((m) => (
                    <motion.g key={m.tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <rect x={m.x - 470} y={m.y - 52} width={940} height={88} rx={26} fill={m.gull ? '#fcd34d' : '#0f172a'} opacity={0.92} />
                        <text x={m.x} y={m.y + 8} textAnchor="middle" fontSize={50} fontWeight={900} fill={m.gull ? '#0f172a' : '#ffffff'} style={FONT}>
                            {m.tekst}
                        </text>
                    </motion.g>
                ))}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 4 &&
                    TRE_TING.map((t, i) => (
                        <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.6 }}>
                            <rect x={130 + i * 460} y={700} width={420} height={96} rx={24} fill="#ffffff" opacity={0.95} />
                            <text x={340 + i * 460} y={762} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a" style={FONT}>
                                {t}
                            </text>
                        </motion.g>
                    ))}
            </AnimatePresence>
        </svg>
    );
}

/** Skurken: mørk kappe og hette. */
function Skurken({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -60 40 L -80 240 L 80 240 L 60 40 Z" fill="#1e1b4b" />
            <circle cx={0} cy={0} r={42} fill="#d6d3d1" />
            <path d="M -52 10 Q 0 -90 52 10 L 46 -10 Q 0 -60 -46 -10 Z" fill="#1e1b4b" />
            <circle cx={-14} cy={2} r={5} fill="#7f1d1d" />
            <circle cx={14} cy={2} r={5} fill="#7f1d1d" />
        </g>
    );
}

function HeltSkalert({ x, y, s }: { x: number; y: number; s: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
            <Helten x={x} y={y} />
        </g>
    );
}

/** En rund linse med samme hendelse. Den som forteller, står stor og i lyset. */
function Linse({
    cx,
    farge,
    forteller,
    tittel,
}: {
    cx: number;
    farge: string;
    forteller: 'helten' | 'skurken';
    tittel: string;
}) {
    const id = `linse-${forteller}`;
    return (
        <g>
            <defs>
                <clipPath id={id}>
                    <circle cx={cx} cy={430} r={260} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${id})`}>
                <rect x={cx - 270} y={160} width={540} height={540} fill={forteller === 'helten' ? '#dbeafe' : '#ede9fe'} />
                <rect x={cx - 270} y={560} width={540} height={140} fill={forteller === 'helten' ? '#86efac' : '#a78bfa'} />
                {forteller === 'helten' ? (
                    <>
                        <Skurken x={cx + 150} y={430} s={0.6} />
                        <HeltSkalert x={cx - 50} y={330} s={1} />
                    </>
                ) : (
                    <>
                        <HeltSkalert x={cx - 150} y={450} s={0.6} />
                        <Skurken x={cx + 40} y={320} s={1.05} />
                    </>
                )}
                <rect x={cx - 270} y={160} width={540} height={540} fill={farge} opacity={0.18} />
            </g>
            <circle cx={cx} cy={430} r={260} fill="none" stroke={farge} strokeWidth={22} />
            <text x={cx} y={770} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a" style={FONT}>
                {tittel}
            </text>
        </g>
    );
}

const LINSENE = [
    { navn: 'Jeg', farge: '#6366f1' },
    { navn: 'Flue', farge: '#10b981' },
    { navn: 'Gud', farge: '#f59e0b' },
];

function Farger({ beat }: { beat: number }) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <rect width={1600} height={900} fill="#f8fafc" />
            <AnimatePresence mode="wait">
                {beat <= 2 ? (
                    <motion.g key="to" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0.25 }} transition={{ duration: 0.8 }}>
                            <Linse cx={440} farge="#2563eb" forteller="helten" tittel="Fortalt av helten" />
                        </motion.g>
                        <Linse cx={1160} farge="#7c3aed" forteller="skurken" tittel="Fortalt av skurken" />
                        <AnimatePresence>
                            {beat === 1 && (
                                <motion.g key="leder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                                    <rect x={790} y={60} width={740} height={90} rx={26} fill="#4c1d95" />
                                    <text x={1160} y={120} textAnchor="middle" fontSize={46} fontWeight={900} fill="#ffffff" style={FONT}>
                                        En leder ingen forsto?
                                    </text>
                                </motion.g>
                            )}
                            {beat === 2 && (
                                <motion.g key="samme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                                    <rect x={400} y={50} width={800} height={100} rx={28} fill="#fcd34d" />
                                    <text x={800} y={117} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a" style={FONT}>
                                        Samme hendelser, ulik sannhet
                                    </text>
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </motion.g>
                ) : (
                    <motion.g key="tre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <text x={800} y={170} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a" style={FONT}>
                            Tre linser
                        </text>
                        {LINSENE.map((l, i) => (
                            <motion.g key={l.navn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.5 }}>
                                <circle cx={360 + i * 440} cy={470} r={170} fill="#ffffff" stroke={l.farge} strokeWidth={26} />
                                <text x={360 + i * 440} y={492} textAnchor="middle" fontSize={64} fontWeight={900} fill={l.farge} style={FONT}>
                                    {l.navn}
                                </text>
                            </motion.g>
                        ))}
                        <text x={800} y={780} textAnchor="middle" fontSize={44} fontWeight={800} fill="#475569" style={FONT}>
                            Anna og Jonas, tre ganger
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g key="bok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <rect x={430} y={40} width={740} height={110} rx={26} fill="#0f172a" />
                        <text x={800} y={113} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fcd34d" style={FONT}>
                            Harry Potter, fortalt av Voldemort
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

export function SynsvinkelKamera({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kamera';
    return (
        <div className="absolute inset-0 bg-slate-50">
            {modus === 'kamera' ? <Kamera beat={beat} /> : <Farger beat={beat} />}
        </div>
    );
}
