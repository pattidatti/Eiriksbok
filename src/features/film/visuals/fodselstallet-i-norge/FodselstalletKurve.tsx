import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fruktbarhetstallet som en kurve, med erstatningsnivået 2,1 som stiplet linje.
 * «lang»: fra før 1900 til 2009, del for del. Mellom punktene er kurven en forenklet
 * tegning; bare merkene er tall fra artikkelen. «naer»: de målte årene fra 2009 til 2025.
 */

type Modus = 'lang' | 'naer';

const B = 1600;
const H = 900;
const X0 = 170;
const X1 = 1500;
const Y0 = 760;
const Y1 = 170;

interface Akse {
    fra: number;
    til: number;
    min: number;
    max: number;
    merker: number[];
    aar: number[];
}

const AKSER: Record<Modus, Akse> = {
    lang: { fra: 1880, til: 2012, min: 0, max: 4.6, merker: [1, 2, 3, 4], aar: [1880, 1900, 1920, 1940, 1960, 1980, 2000] },
    naer: { fra: 2007, til: 2026, min: 1.2, max: 2.2, merker: [1.4, 1.6, 1.8, 2, 2.2], aar: [2009, 2013, 2017, 2021, 2025] },
};

function skala(a: Akse) {
    return {
        x: (aar: number) => X0 + ((aar - a.fra) / (a.til - a.fra)) * (X1 - X0),
        y: (v: number) => Y0 - ((v - a.min) / (a.max - a.min)) * (Y0 - Y1),
    };
}

/** Delene av den lange kurven, én per beat. */
const LANG: [number, number][][] = [
    [
        [1880, 4.4],
        [1900, 4.2],
    ],
    [
        [1900, 4.2],
        [1915, 3.2],
        [1930, 2.0],
        [1935, 1.8],
    ],
    [
        [1935, 1.8],
        [1945, 2.4],
        [1955, 2.8],
        [1965, 2.9],
    ],
    [
        [1965, 2.9],
        [1975, 2.0],
        [1985, 1.66],
    ],
    [
        [1985, 1.66],
        [1990, 1.9],
        [2000, 1.85],
        [2009, 1.98],
    ],
];

interface Merke {
    aar: number;
    v: number;
    tekst: string;
    fraBeat: number;
    over?: boolean;
}

const LANG_MERKER: Merke[] = [
    { aar: 1890, v: 4.3, tekst: 'over 4', fraBeat: 0, over: true },
    { aar: 1935, v: 1.8, tekst: 'under 2', fraBeat: 1 },
    { aar: 1965, v: 2.9, tekst: 'nesten 3', fraBeat: 2, over: true },
    { aar: 1985, v: 1.66, tekst: 'under 1,7', fraBeat: 3 },
];

const NAER: { aar: number; v: number; tekst: string; fraBeat: number; over?: boolean }[] = [
    { aar: 2009, v: 1.98, tekst: '1,98', fraBeat: 0, over: true },
    { aar: 2018, v: 1.56, tekst: '1,56', fraBeat: 1, over: true },
    { aar: 2023, v: 1.4, tekst: '1,40', fraBeat: 1 },
    { aar: 2024, v: 1.44, tekst: '1,44', fraBeat: 2, over: true },
    { aar: 2025, v: 1.48, tekst: '1,48', fraBeat: 2, over: true },
];

const TITLER: Record<Modus, string[]> = {
    lang: ['Før 1900: over fire barn', 'Mellom verdenskrigene: under to', '1960-tallet: nesten tre', 'Kraftig fall på 1970-tallet', 'Siden: mellom 1,5 og 2'],
    naer: ['2009: nesten to barn per kvinne', 'Ned nesten hvert år', 'Litt opp igjen', 'Mest av økningen: kvinner fra 30 til 34 år'],
};

function Rutenett({ a, s }: { a: Akse; s: ReturnType<typeof skala> }) {
    return (
        <>
            {a.merker.map((m) => (
                <g key={m}>
                    <line x1={X0} x2={X1} y1={s.y(m)} y2={s.y(m)} stroke="#cbd5e1" strokeWidth={2} />
                    <text x={X0 - 20} y={s.y(m) + 11} textAnchor="end" fontSize={30} fontWeight={700} fill="#64748b">
                        {String(m).replace('.', ',')}
                    </text>
                </g>
            ))}
            {a.aar.map((aar) => (
                <text key={aar} x={s.x(aar)} y={Y0 + 50} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                    {aar}
                </text>
            ))}
            <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="#334155" strokeWidth={4} />
            {/* Erstatningsnivået */}
            <line x1={X0} x2={X1} y1={s.y(2.1)} y2={s.y(2.1)} stroke="#dc2626" strokeWidth={4} strokeDasharray="16 12" />
            <text x={X1} y={s.y(2.1) - 14} textAnchor="end" fontSize={34} fontWeight={900} fill="#b91c1c">
                erstatningsnivået 2,1
            </text>
        </>
    );
}

function Lang({ beat }: { beat: number }) {
    const a = AKSER.lang;
    const s = skala(a);
    const sti = (del: [number, number][]) => del.map(([aar, v], i) => `${i ? 'L' : 'M'}${s.x(aar)},${s.y(v)}`).join(' ');
    return (
        <>
            <Rutenett a={a} s={s} />
            {beat >= 4 && (
                <motion.rect
                    x={s.x(1985)}
                    width={s.x(2009) - s.x(1985)}
                    y={s.y(2)}
                    height={s.y(1.5) - s.y(2)}
                    fill="#0d9488"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.16 }}
                    transition={{ duration: 0.8 }}
                />
            )}
            {LANG.map((del, i) =>
                i <= beat ? (
                    <motion.path
                        key={i}
                        d={sti(del)}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: i === beat ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                    />
                ) : null
            )}
            {LANG_MERKER.filter((m) => m.fraBeat <= beat).map((m) => (
                <motion.g key={m.aar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: m.fraBeat === beat ? 1.2 : 0 }}>
                    <circle cx={s.x(m.aar)} cy={s.y(m.v)} r={13} fill="#fff" stroke="#0f766e" strokeWidth={6} />
                    <text
                        x={s.x(m.aar)}
                        y={s.y(m.v) + (m.over ? -32 : 58)}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#f8fafc"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        {m.tekst}
                    </text>
                </motion.g>
            ))}
            {beat >= 4 && (
                <motion.text
                    x={s.x(2005)}
                    y={s.y(1.5) + 115}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#0f766e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    stort sett 1,5 til 2
                </motion.text>
            )}
            <text x={X0} y={Y0 + 100} fontSize={30} fontWeight={700} fill="#475569">
                Kurven mellom merkene er forenklet
            </text>
        </>
    );
}

function Naer({ beat }: { beat: number }) {
    const a = AKSER.naer;
    const s = skala(a);
    const synlige = NAER.filter((p) => p.fraBeat <= beat);
    const d = synlige.map((p, i) => `${i ? 'L' : 'M'}${s.x(p.aar)},${s.y(p.v)}`).join(' ');
    return (
        <>
            <Rutenett a={a} s={s} />
            {synlige.length > 1 && (
                <motion.path
                    key={synlige.length}
                    d={d}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={8}
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                />
            )}
            {synlige.map((p) => {
                const ny = p.fraBeat === beat;
                const lys = beat >= 3 && p.aar === 2025;
                return (
                    <motion.g key={p.aar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ny ? 0.5 : 0 }}>
                        <circle cx={s.x(p.aar)} cy={s.y(p.v)} r={lys ? 22 : 14} fill={lys ? '#f59e0b' : '#fff'} stroke="#0f766e" strokeWidth={6} />
                        <text
                            x={s.x(p.aar) + (p.aar === 2024 ? -12 : 0)}
                            y={s.y(p.v) + (p.over ? -34 : 62)}
                            textAnchor={p.aar === 2024 ? 'end' : 'middle'}
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#f8fafc"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            {p.tekst}
                        </text>
                        <text x={s.x(p.aar)} y={Y0 - 16} textAnchor="middle" fontSize={28} fontWeight={800} fill="#475569">
                            {p.aar === 2018 || p.aar === 2023 ? p.aar : ''}
                        </text>
                    </motion.g>
                );
            })}
        </>
    );
}

export function FodselstalletKurve({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'lang';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={X0} y={70} fontSize={28} fontWeight={700} fill="#64748b">
                    Barn per kvinne (SFT)
                </text>
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tittel}
                        x={800}
                        y={125}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tittel}
                    </motion.text>
                </AnimatePresence>
                {modus === 'lang' ? <Lang beat={beat} /> : <Naer beat={beat} />}
            </svg>
        </div>
    );
}
