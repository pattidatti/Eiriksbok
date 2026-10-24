import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvordan et monopol tenker. «ordet»: monopol = mono (én) + polein (å selge), og én selger
 * som setter prisen selv. «overskudd»: prisen glir langs en bakke. For høy pris gir nesten
 * ingen kunder, toppen av bakken gir mest overskudd, og til slutt monopol mot konkurranse.
 */

type Modus = 'ordet' | 'overskudd';

const OVERSKRIFT: Record<Modus, string[]> = {
    ordet: ['Et gammelt gresk ord', 'Mono + polein', 'Bare én selger', 'Selgeren setter prisen'],
    overskudd: [
        'Så høy pris som mulig?',
        'Altfor høy pris: nesten ingen kjøper',
        'Prisen som gir mest overskudd',
        'Monopol mot konkurranse',
        'Ingen grunn til å bli bedre',
    ],
};

const BLEK = '#cbd5e1';
const ROD = '#dc2626';
const TEAL = '#0d9488';

function Figur({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-62} r={18} fill={farge} />
            <rect x={-22} y={-40} width={44} height={56} rx={16} fill={farge} />
        </g>
    );
}

function Kiosk({ x, y, farge = ROD, s = 1 }: { x: number; y: number; farge?: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-90} y={-120} width={180} height={120} rx={8} fill="#fffaf0" stroke="#334155" strokeWidth={6} />
            <rect x={-60} y={-95} width={120} height={50} fill="#3b2f2a" />
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={-100 + i * 50} y={-150} width={50} height={34} fill={i % 2 ? '#fff' : farge} stroke="#334155" strokeWidth={4} />
            ))}
            <path d="M -16 -160 L 16 -160 L 0 -205 Z" fill="#d39a52" transform="rotate(180 0 -182)" />
            <circle cx={0} cy={-212} r={22} fill="#ffd1dc" stroke="#334155" strokeWidth={4} />
        </g>
    );
}

function Ordet({ beat }: { beat: number }) {
    const delt = beat >= 1;
    const vis = beat >= 2;
    return (
        <>
            <AnimatePresence>
                {!delt && (
                    <motion.text
                        key="hele"
                        x={800}
                        y={500}
                        textAnchor="middle"
                        fontSize={210}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        MONOPOL
                    </motion.text>
                )}
            </AnimatePresence>
            {delt && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <text x={vis ? 430 : 430} y={vis ? 300 : 470} textAnchor="middle" fontSize={vis ? 110 : 130} fontWeight={900} fill="#2563eb">
                            MONO
                        </text>
                        <text x={430} y={vis ? 370 : 580} textAnchor="middle" fontSize={vis ? 44 : 60} fontWeight={700} fill="#334155">
                            = én
                        </text>
                    </motion.g>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
                        <text x={vis ? 1170 : 1130} y={vis ? 300 : 470} textAnchor="middle" fontSize={vis ? 110 : 130} fontWeight={900} fill="#dc2626">
                            POLEIN
                        </text>
                        <text x={vis ? 1170 : 1130} y={vis ? 370 : 580} textAnchor="middle" fontSize={vis ? 44 : 60} fontWeight={700} fill="#334155">
                            = å selge
                        </text>
                    </motion.g>
                    {!vis && (
                        <motion.text
                            x={735}
                            y={460}
                            textAnchor="middle"
                            fontSize={100}
                            fontWeight={900}
                            fill="#64748b"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            +
                        </motion.text>
                    )}
                </>
            )}
            {vis && (
                <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <Kiosk x={800} y={780} />
                    {[-1, 1].flatMap((side) =>
                        [0, 1, 2].map((i) => (
                            <Figur
                                key={`${side}-${i}`}
                                x={800 + side * (200 + i * 90)}
                                y={790}
                                farge={['#0ea5e9', '#22c55e', '#a855f7'][i]}
                                s={0.9}
                            />
                        ))
                    )}
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} style={{ originX: '800px', originY: '470px' }}>
                    <rect x={570} y={420} width={460} height={100} rx={20} fill="#fff" stroke={ROD} strokeWidth={8} />
                    <text x={800} y={488} textAnchor="middle" fontSize={44} fontWeight={900} fill={ROD}>
                        Kiosken setter prisen
                    </text>
                    {/* Den andre butikken som ikke finnes */}
                    <g opacity={0.7}>
                        <rect x={1290} y={560} width={180} height={140} rx={10} fill="none" stroke="#94a3b8" strokeWidth={6} strokeDasharray="18 12" />
                        <line x1={1270} y1={540} x2={1490} y2={720} stroke={ROD} strokeWidth={10} />
                        <line x1={1490} y1={540} x2={1270} y2={720} stroke={ROD} strokeWidth={10} />
                        <text x={1380} y={770} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                            ingen annen butikk
                        </text>
                    </g>
                </motion.g>
            )}
        </>
    );
}

/* Bakken: overskudd som funksjon av pris (0 = gratis, 1 = altfor dyrt). */
const BX0 = 160;
const BX1 = 860;
const BY0 = 760;
const BH = 420;
const bakkeX = (p: number) => BX0 + p * (BX1 - BX0);
const bakkeY = (p: number) => BY0 - 4 * p * (1 - p) * BH;
const BAKKE = Array.from({ length: 41 }, (_, i) => {
    const p = i / 40;
    return `${i ? 'L' : 'M'} ${bakkeX(p).toFixed(1)} ${bakkeY(p).toFixed(1)}`;
}).join(' ');

function Overskudd({ beat, playing }: { beat: number; playing: boolean }) {
    if (beat >= 3) return <Sammenlign beat={beat} playing={playing} />;
    const p = beat >= 2 ? 0.5 : 0.94;
    const kjoper = beat >= 2 ? 5 : beat === 1 ? 1 : 0;
    return (
        <>
            {/* Aksen */}
            <line x1={BX0} y1={BY0} x2={BX1 + 30} y2={BY0} stroke="#334155" strokeWidth={6} />
            <text x={BX1 + 20} y={BY0 + 60} textAnchor="end" fontSize={40} fontWeight={800} fill="#334155">
                høyere pris →
            </text>
            {beat >= 2 && (
                <>
                    <motion.path
                        d={BAKKE}
                        fill="none"
                        stroke={TEAL}
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6 }}
                    />
                    <motion.text x={BX0} y={BY0 - BH - 40} fontSize={40} fontWeight={800} fill={TEAL} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        overskudd
                    </motion.text>
                </>
            )}
            {/* Prislappen som glir langs aksen */}
            <motion.g initial={false} animate={{ x: bakkeX(p), y: beat >= 2 ? bakkeY(p) : BY0 }} transition={{ duration: 1.8, ease: 'easeInOut' }}>
                <circle r={22} fill={beat >= 2 ? TEAL : ROD} stroke="#fff" strokeWidth={6} />
                <rect x={-80} y={-118} width={160} height={68} rx={14} fill="#fff" stroke={beat >= 2 ? TEAL : ROD} strokeWidth={6} />
                <text y={-72} textAnchor="middle" fontSize={38} fontWeight={900} fill="#0f172a">
                    pris
                </text>
            </motion.g>
            {/* Kundene til høyre: farget = kjøper */}
            <text x={1250} y={250} textAnchor="middle" fontSize={40} fontWeight={800} fill="#334155">
                Hvem kjøper?
            </text>
            {Array.from({ length: 10 }, (_, i) => (
                <motion.g key={i} initial={false} animate={{ opacity: i < kjoper ? 1 : 0.9 }}>
                    <Figur x={1040 + (i % 5) * 105} y={430 + Math.floor(i / 5) * 190} farge={i < kjoper ? TEAL : BLEK} />
                </motion.g>
            ))}
            {beat === 1 && (
                <motion.text x={1250} y={720} textAnchor="middle" fontSize={40} fontWeight={800} fill={ROD} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    Da tjener kiosken lite
                </motion.text>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <rect x={980} y={690} width={540} height={130} rx={18} fill="#f0fdfa" stroke={TEAL} strokeWidth={4} />
                    <text x={1250} y={742} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                        Overskudd: det som er igjen
                    </text>
                    <text x={1250} y={790} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                        når utgiftene er betalt
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Sammenlign({ beat, playing }: { beat: number; playing: boolean }) {
    const lat = beat >= 4;
    return (
        <>
            {/* Monopol til venstre, konkurranse til høyre */}
            {[
                { x: 470, navn: 'Monopol', pris: 300, is: 3, farge: ROD },
                { x: 1130, navn: 'Konkurranse', pris: 170, is: 8, farge: TEAL },
            ].map((s, k) => (
                <motion.g key={s.navn} initial={{ opacity: 0, y: 30 }} animate={{ opacity: lat && k === 1 ? 0.35 : 1, y: 0 }} transition={{ delay: k * 0.6 }}>
                    <text x={s.x} y={250} textAnchor="middle" fontSize={56} fontWeight={900} fill={s.farge}>
                        {s.navn}
                    </text>
                    {/* Prisstolpe */}
                    <motion.rect
                        x={s.x - 190}
                        width={110}
                        fill={s.farge}
                        rx={10}
                        initial={{ height: 0, y: 760 }}
                        animate={{ height: s.pris, y: 760 - s.pris }}
                        transition={{ duration: 1.2, delay: 0.4 + k * 0.6 }}
                    />
                    <text x={s.x - 135} y={810} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        pris
                    </text>
                    {/* Is som blir solgt */}
                    {Array.from({ length: s.is }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 + k * 0.6 + i * 0.12 }}
                            style={{ originX: `${s.x - 20 + (i % 4) * 60}px`, originY: `${720 - Math.floor(i / 4) * 120}px` }}
                        >
                            <path
                                d={`M ${s.x - 40 + (i % 4) * 60} ${700 - Math.floor(i / 4) * 120} l 40 0 l -20 60 z`}
                                fill="#d39a52"
                            />
                            <circle cx={s.x - 20 + (i % 4) * 60} cy={690 - Math.floor(i / 4) * 120} r={22} fill="#ffd1dc" stroke="#be185d" strokeWidth={3} />
                        </motion.g>
                    ))}
                    <text x={s.x + 70} y={810} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        is som blir solgt
                    </text>
                </motion.g>
            ))}
            {lat && (
                <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '470px', originY: '450px' }}>
                    <rect x={170} y={330} width={600} height={140} rx={22} fill="#fff" stroke={ROD} strokeWidth={6} />
                    <text x={470} y={390} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                        Ingen tar kundene mine.
                    </text>
                    <text x={470} y={440} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                        Hvorfor bli bedre eller billigere?
                    </text>
                    {[0, 1, 2].map((i) => (
                        <motion.text
                            key={i}
                            x={90 + i * 40}
                            y={300 - i * 40}
                            fontSize={44 + i * 10}
                            fontWeight={900}
                            fill="#64748b"
                            animate={playing ? { opacity: [0, 1, 0] } : { opacity: 0.8 }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                        >
                            z
                        </motion.text>
                    ))}
                </motion.g>
            )}
        </>
    );
}

export function MonopolPris({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ordet';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-amber-50 to-sky-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'ordet' ? <Ordet beat={beat} /> : <Overskudd beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
