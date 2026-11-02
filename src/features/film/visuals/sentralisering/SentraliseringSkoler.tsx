import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate, TelleTall } from '../shared';

/**
 * Skolene i tall, på en flate på 1000x562.
 * tall: 2 663 skoler, 365 færre enn for 15 år siden, 46 lagt ned og 17 nye i 2025, 6 000 flere elever.
 * hvilke: hvilke skoler som legges ned (små, i de minst sentrale kommunene).
 * vei: hvorfor kommunene legger ned, kostnaden per elev og skoleveien som blir lengre.
 */

type Modus = 'tall' | 'hvilke' | 'vei';

const ROD = '#dc2626';
const BLA = '#2563eb';
const GRONN = '#0d9488';
const ORANSJE = '#ea580c';

/** En liten skole: rødt hus med flagg. */
function Skoleikon({
    farge = '#a32626',
    s = 1,
    kryss = false,
}: {
    farge?: string;
    s?: number;
    kryss?: boolean;
}) {
    return (
        <g transform={`scale(${s})`}>
            <rect x={-14} y={-8} width={28} height={16} fill={farge} rx={1.5} />
            <path d="M-16,-7 L0,-17 L16,-7 Z" fill="#334155" />
            <rect x={-10} y={-4} width={5} height={5} fill="#fde68a" />
            <rect x={5} y={-4} width={5} height={5} fill="#fde68a" />
            <line x1={-20} y1={8} x2={-20} y2={-20} stroke="#64748b" strokeWidth={1.5} />
            <rect x={-20} y={-20} width={8} height={5} fill="#ba0c2f" />
            {kryss && (
                <g stroke="#111827" strokeWidth={3} strokeLinecap="round">
                    <line x1={-12} y1={-12} x2={12} y2={10} />
                    <line x1={12} y1={-12} x2={-12} y2={10} />
                </g>
            )}
        </g>
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 22 }}
            >
                <div className="rounded-2xl bg-white px-5 py-2 text-3xl font-display font-black text-slate-900 shadow-lg whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ---------- tall ---------- */

function Tall({ beat }: { beat: number }) {
    const titler = [
        'Grunnskolene i Norge',
        'Færre skoler enn for 15 år siden',
        'Bare i 2025',
        'Færre skoler, men større',
    ];
    // Søylen: hele høyden er skolene for 15 år siden, den blå delen er skolene i dag.
    const H = 360;
    const ida = 2663;
    const for15 = ida + 365;
    const blaH = (ida / for15) * H;
    return (
        <>
            {beat <= 1 && (
                <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                    <g transform="translate(260,0)">
                        <motion.rect
                            x={0}
                            width={150}
                            fill={BLA}
                            rx={8}
                            initial={{ y: 130 + H, height: 0 }}
                            animate={{ y: 130 + H - blaH, height: blaH }}
                            transition={{ duration: 1.4, delay: 0.3 }}
                        />
                        {beat >= 1 && (
                            <motion.rect
                                x={0}
                                y={130}
                                width={150}
                                height={H - blaH - 4}
                                rx={8}
                                fill="none"
                                stroke={ROD}
                                strokeWidth={4}
                                strokeDasharray="10 8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                            />
                        )}
                    </g>
                </svg>
            )}
            {beat <= 1 && (
                <>
                    <div className="absolute" style={{ left: 450, top: 300 }}>
                        <div className="text-7xl font-black tabular-nums" style={{ color: BLA }}>
                            <TelleTall verdi={ida} />
                        </div>
                        <div className="text-2xl font-bold text-slate-600">
                            grunnskoler, skoleåret 2025-26
                        </div>
                    </div>
                    {beat >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            className="absolute"
                            style={{ left: 450, top: 120 }}
                        >
                            <div className="text-6xl font-black" style={{ color: ROD }}>
                                365 færre
                            </div>
                            <div className="text-2xl font-bold text-slate-600">
                                enn for 15 år siden
                            </div>
                        </motion.div>
                    )}
                </>
            )}
            {beat === 2 && (
                <div className="absolute inset-x-0 flex justify-center gap-10" style={{ top: 110 }}>
                    {[
                        { n: 46, tekst: 'lagt ned', farge: ROD, kryss: true },
                        { n: 17, tekst: 'nye', farge: GRONN, kryss: false },
                    ].map((g, gi) => (
                        <motion.div
                            key={g.tekst}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gi * 1.4 }}
                            className="rounded-3xl bg-white px-6 py-4 shadow-xl"
                            style={{ width: 430 }}
                        >
                            <div className="text-5xl font-black" style={{ color: g.farge }}>
                                {g.n} {g.tekst}
                            </div>
                            <svg viewBox="0 0 400 260" style={{ width: 380, height: 247 }}>
                                {Array.from({ length: g.n }, (_, i) => (
                                    <g
                                        key={i}
                                        transform={`translate(${24 + (i % 8) * 50},${30 + Math.floor(i / 8) * 42})`}
                                    >
                                        <Skoleikon farge={g.farge} s={1.05} kryss={g.kryss} />
                                    </g>
                                ))}
                            </svg>
                        </motion.div>
                    ))}
                </div>
            )}
            {beat >= 3 && (
                <>
                    <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.g
                                key={i}
                                initial={{
                                    x: 150 + (i % 2) * 110,
                                    y: 230 + Math.floor(i / 2) * 110,
                                    opacity: 1,
                                }}
                                animate={{ x: 500, y: 300, opacity: 0 }}
                                transition={{ duration: 1.6, delay: 1 + i * 0.2 }}
                            >
                                <Skoleikon s={2} />
                            </motion.g>
                        ))}
                        <motion.g
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.4, duration: 0.8 }}
                            style={{ transformOrigin: '520px 300px' }}
                        >
                            <g transform="translate(520,300)">
                                <Skoleikon s={5.5} />
                            </g>
                        </motion.g>
                    </svg>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute rounded-3xl bg-white px-6 py-4 shadow-xl"
                        style={{ left: 680, top: 170, width: 290 }}
                    >
                        <div className="text-5xl font-black" style={{ color: GRONN }}>
                            6 000
                        </div>
                        <div className="text-2xl font-bold text-slate-700">
                            flere elever enn for 15 år siden
                        </div>
                    </motion.div>
                </>
            )}
            <Overskrift tekst={titler[Math.min(beat, 3)]} />
        </>
    );
}

/* ---------- hvilke ---------- */

function Hvilke({ beat }: { beat: number }) {
    const titler = [
        'Det er de små skolene som forsvinner',
        'Omtrent tre av fire nedlagte skoler',
        'Halvparten av de nedlagte skolene',
        'Hvor lå skolene som ble lagt ned?',
    ];
    if (beat >= 3) {
        const B = 860;
        return (
            <>
                <div className="absolute" style={{ left: 70, top: 150, width: B }}>
                    <div className="text-2xl font-bold text-slate-600 mb-3">
                        Alle skolene som ble lagt ned de siste fem årene
                    </div>
                    <div
                        className="relative rounded-2xl bg-slate-200 overflow-hidden"
                        style={{ height: 90 }}
                    >
                        <motion.div
                            className="absolute left-0 top-0 h-full"
                            style={{ background: ORANSJE }}
                            initial={{ width: 0 }}
                            animate={{ width: 0.45 * B }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                        />
                        <motion.div
                            className="absolute top-0 h-full"
                            style={{ background: BLA, left: B - 0.12 * B, width: 0.12 * B }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.2 }}
                        />
                    </div>
                    <div className="relative" style={{ height: 150 }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="absolute left-0 top-3"
                        >
                            <div className="text-6xl font-black" style={{ color: ORANSJE }}>
                                45 %
                            </div>
                            <div className="text-2xl font-bold text-slate-700">
                                i de minst sentrale kommunene
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.4 }}
                            className="absolute right-0 top-3 text-right"
                        >
                            <div className="text-6xl font-black" style={{ color: BLA }}>
                                12 %
                            </div>
                            <div className="text-2xl font-bold text-slate-700">
                                i de mest sentrale
                            </div>
                        </motion.div>
                    </div>
                </div>
                <Overskrift tekst={titler[3]} />
            </>
        );
    }
    // Fire nedlagte skoler, med elevtallet skissert som en liten eller stor gruppe.
    const skoler = [
        { s: 1.6, under100: true, under37: true },
        { s: 1.9, under100: true, under37: true },
        { s: 2.3, under100: true, under37: false },
        { s: 3.2, under100: false, under37: false },
    ];
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {skoler.map((sk, i) => {
                    const x = 160 + i * 230;
                    const merket = (beat === 1 && sk.under100) || (beat === 2 && sk.under37);
                    const dempet = (beat === 1 && !sk.under100) || (beat === 2 && !sk.under37);
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: dempet ? 0.25 : 1 }}
                            transition={{ delay: beat === 0 ? i * 0.3 : 0 }}
                        >
                            {merket && (
                                <circle
                                    cx={x}
                                    cy={290}
                                    r={95}
                                    fill={beat === 1 ? '#fee2e2' : '#ffedd5'}
                                    stroke={beat === 1 ? ROD : ORANSJE}
                                    strokeWidth={5}
                                />
                            )}
                            <g transform={`translate(${x},300)`}>
                                <Skoleikon s={sk.s} kryss={beat === 0 && sk.under100} />
                            </g>
                        </motion.g>
                    );
                })}
            </svg>
            {beat >= 1 && (
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 420 }}
                >
                    <div
                        className="rounded-3xl bg-white px-7 py-3 text-4xl font-black shadow-xl"
                        style={{ color: beat === 1 ? ROD : ORANSJE }}
                    >
                        {beat === 1 ? 'hadde færre enn 100 elever' : 'hadde 37 elever eller færre'}
                    </div>
                </motion.div>
            )}
            <Overskrift tekst={titler[Math.min(beat, 2)]} />
        </>
    );
}

/* ---------- vei ---------- */

function Vei({ beat }: { beat: number }) {
    const titler = [
        'Hvorfor legger kommunene ned skoler?',
        'Hva koster en elev?',
        'Skoleveien i de minst sentrale kommunene',
        'Lærer elevene mer på en stor skole?',
    ];
    return (
        <>
            {beat === 0 && (
                <div className="absolute inset-x-0 flex justify-center gap-8" style={{ top: 160 }}>
                    {[
                        { t: 'Lavt elevtall', u: 'færre barn i bygda' },
                        { t: 'Dårlig kommuneøkonomi', u: 'kommunen har lite penger' },
                    ].map((k, i) => (
                        <motion.div
                            key={k.t}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 1.4 }}
                            className="rounded-3xl bg-white px-8 py-6 text-center shadow-2xl"
                            style={{ width: 380 }}
                        >
                            <div className="text-4xl font-black text-slate-900">{k.t}</div>
                            <div className="text-2xl font-semibold text-slate-600 mt-2">{k.u}</div>
                        </motion.div>
                    ))}
                </div>
            )}
            {beat === 1 && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-x-0 flex flex-col items-center"
                        style={{ top: 100 }}
                    >
                        <div className="text-7xl font-black text-slate-900 tabular-nums">
                            <TelleTall verdi={166800} /> kr
                        </div>
                        <div className="text-2xl font-bold text-slate-600">
                            per elev i gjennomsnitt, 2025
                        </div>
                    </motion.div>
                    <div
                        className="absolute inset-x-0 flex justify-center gap-8"
                        style={{ top: 300 }}
                    >
                        {[
                            {
                                t: 'Stor skole i byen',
                                u: 'koster mindre per elev',
                                s: 3,
                                farge: BLA,
                            },
                            {
                                t: 'Liten skole, spredt bosetting',
                                u: 'koster mer per elev',
                                s: 1.8,
                                farge: ROD,
                            },
                        ].map((k, i) => (
                            <motion.div
                                key={k.t}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.6 + i * 1.2 }}
                                className="flex items-center gap-4 rounded-3xl bg-white px-6 py-4 shadow-xl"
                                style={{ width: 410 }}
                            >
                                <svg viewBox="-50 -40 100 70" style={{ width: 100, height: 70 }}>
                                    <Skoleikon s={k.s * 0.75} />
                                </svg>
                                <div>
                                    <div className="text-2xl font-black text-slate-900 leading-tight">
                                        {k.t}
                                    </div>
                                    <div className="text-2xl font-bold" style={{ color: k.farge }}>
                                        {k.u}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
            {beat === 2 && <Skolevei />}
            {beat >= 3 && (
                <>
                    <div
                        className="absolute inset-x-0 flex items-end justify-center gap-16"
                        style={{ top: 120 }}
                    >
                        {[
                            { t: 'Liten skole', s: 1.6 },
                            { t: 'Stor skole', s: 3 },
                        ].map((k) => (
                            <div key={k.t} className="flex flex-col items-center">
                                <svg viewBox="-60 -60 120 80" style={{ width: 180, height: 120 }}>
                                    <Skoleikon s={k.s} />
                                </svg>
                                <div className="text-3xl font-black text-slate-900">{k.t}</div>
                            </div>
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 330 }}
                    >
                        <div className="rounded-3xl bg-white px-7 py-3 text-3xl font-black text-slate-800 shadow-xl">
                            Liten sammenheng med hvor mye elevene lærer
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 3 }}
                        className="absolute inset-x-0 flex justify-center gap-5"
                        style={{ top: 430 }}
                    >
                        {['Lang skolevei', 'Livet i bygda'].map((t) => (
                            <div
                                key={t}
                                className="rounded-2xl bg-red-600 px-6 py-2 text-3xl font-black text-white shadow-lg"
                            >
                                {t}
                            </div>
                        ))}
                    </motion.div>
                </>
            )}
            <Overskrift tekst={titler[Math.min(beat, 3)]} />
        </>
    );
}

/** Skoleveien som en vei fra hjemmet til skolen. Lengden følger kilometertallet. */
function Skolevei() {
    const km = (x: number) => 110 + (x / 17.2) * 700;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {[
                    { y: 220, lengde: 15.4, farge: '#64748b', delay: 0.3 },
                    { y: 380, lengde: 17.2, farge: ROD, delay: 2 },
                ].map((r) => (
                    <g key={r.y}>
                        <g transform={`translate(80,${r.y + 4})`}>
                            <rect x={-14} y={-12} width={28} height={20} fill="#c08a2e" />
                            <path d="M-17,-11 L0,-24 L17,-11 Z" fill="#334155" />
                        </g>
                        <motion.line
                            x1={110}
                            y1={r.y}
                            y2={r.y}
                            stroke={r.farge}
                            strokeWidth={14}
                            strokeLinecap="round"
                            initial={{ x2: 110 }}
                            animate={{ x2: km(r.lengde) }}
                            transition={{ duration: 1.6, delay: r.delay }}
                        />
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: r.delay + 1.4 }}
                        >
                            <g transform={`translate(${km(r.lengde) + 40},${r.y + 2})`}>
                                <Skoleikon s={1.6} />
                            </g>
                        </motion.g>
                    </g>
                ))}
            </svg>
            {[
                { y: 220, tekst: '2010: 15,4 km', farge: '#334155', delay: 1.2 },
                { y: 380, tekst: '2020: 17,2 km', farge: ROD, delay: 2.9 },
            ].map((r) => (
                <motion.div
                    key={r.y}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: r.delay }}
                    className="absolute text-4xl font-black whitespace-nowrap"
                    style={{ left: 130, top: r.y - 72, color: r.farge }}
                >
                    {r.tekst}
                </motion.div>
            ))}
            <div
                className="absolute text-2xl font-bold text-slate-600"
                style={{ left: 130, top: 460 }}
            >
                Gjennomsnittlig skolevei for elever i 10. klasse
            </div>
        </>
    );
}

export function SentraliseringSkoler({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tall';
    return (
        <Flate bakgrunn="linear-gradient(160deg, #f8fafc 0%, #eef2f7 60%, #fdf6e9 100%)">
            {modus === 'tall' && <Tall beat={beat} />}
            {modus === 'hvilke' && <Hvilke beat={beat} />}
            {modus === 'vei' && <Vei beat={beat} />}
        </Flate>
    );
}
