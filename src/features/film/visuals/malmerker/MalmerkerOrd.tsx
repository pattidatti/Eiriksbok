import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { MalmerkerNorge } from './MalmerkerNorge';
import type { Region } from './regioner';

/**
 * Ordene i filmen. «buss»: to stemmer på bussen, «æ» og «eg». «jamvekt»: verbene som
 * deles i to grupper (kløyvd infinitiv), og Vestlandet der alle ender likt. «apokope»: den
 * siste vokalen som faller av. «detektiv»: tre spor som til sammen peker på ett sted.
 * Tegnes på en flate på 1000x562.
 */

type Modus = 'buss' | 'jamvekt' | 'apokope' | 'detektiv';

const fram = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 24 }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="px-5 py-1.5 rounded-xl bg-white/90 text-slate-800 font-black shadow"
                    style={{ fontSize: 30 }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ---------------------------------------------------------------- buss */

function Person({ x, farge, hode }: { x: number; farge: string; hode: string }) {
    return (
        <g>
            <circle cx={x} cy={265} r={34} fill={hode} />
            <path
                d={`M${x - 52},380 Q${x - 50},305 ${x},300 Q${x + 50},305 ${x + 52},380 Z`}
                fill={farge}
            />
        </g>
    );
}

function Boble({
    x,
    y,
    tekst,
    farge,
    hale,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    hale: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <path
                d={`M${x - 20},${y + 50} L${hale},${y + 105} L${x + 20},${y + 50} Z`}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={4}
            />
            <rect
                x={x - 80}
                y={y - 55}
                width={160}
                height={110}
                rx={30}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={68} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Buss({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0" width={1000} height={562}>
                {/* Vinduet med landskap som glir forbi. */}
                <rect x={0} y={0} width={1000} height={562} fill="#475569" />
                <rect x={40} y={60} width={920} height={200} rx={20} fill="#bae6fd" />
                <clipPath id="malmerker-vindu">
                    <rect x={40} y={60} width={920} height={200} rx={20} />
                </clipPath>
                <g clipPath="url(#malmerker-vindu)">
                    <motion.g
                        animate={playing ? { x: [0, -500] } : undefined}
                        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    >
                        {[0, 500, 1000].map((dx) => (
                            <g key={dx}>
                                <path
                                    d={`M${dx},260 L${dx + 120},150 L${dx + 230},230 L${dx + 340},130 L${dx + 500},260 Z`}
                                    fill="#64748b"
                                />
                                <path
                                    d={`M${dx + 300},152 L${dx + 340},130 L${dx + 375},155 Z`}
                                    fill="#f8fafc"
                                />
                                <rect x={dx} y={235} width={500} height={30} fill="#4d7c0f" />
                            </g>
                        ))}
                    </motion.g>
                </g>
                {/* Stolper og seter. */}
                <rect x={492} y={60} width={16} height={502} fill="#cbd5e1" />
                <Person x={250} farge="#b45309" hode="#e7c3a1" />
                <Person x={750} farge="#1d4ed8" hode="#c08a5e" />
                <rect x={130} y={360} width={250} height={202} rx={26} fill="#0f766e" />
                <rect x={630} y={360} width={250} height={202} rx={26} fill="#0f766e" />
                <rect x={130} y={360} width={250} height={26} rx={12} fill="#115e59" />
                <rect x={630} y={360} width={250} height={26} rx={12} fill="#115e59" />
                <AnimatePresence>
                    {beat >= 0 && (
                        <Boble key="ae" x={330} y={130} tekst="æ" farge="#b91c1c" hale={275} />
                    )}
                    {beat >= 1 && (
                        <Boble key="eg" x={670} y={130} tekst="eg" farge="#1d4ed8" hale={725} />
                    )}
                </AnimatePresence>
            </svg>
            <AnimatePresence>
                {beat >= 2 && (
                    <div
                        key="sp"
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 420 }}
                    >
                        <motion.div
                            {...fram}
                            className="px-6 py-2 rounded-2xl bg-white text-slate-900 font-black shadow-xl"
                            style={{ fontSize: 40 }}
                        >
                            Hvor kommer de fra?
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ------------------------------------------------------------- jamvekt */

function Ordkort({ children, farge }: { children: ReactNode; farge: string }) {
    return (
        <div
            className="rounded-xl bg-white font-extrabold text-slate-800 shadow text-center"
            style={{ fontSize: 30, padding: '6px 18px', border: `3px solid ${farge}` }}
        >
            {children}
        </div>
    );
}

function Gruppe({
    slutt,
    farge,
    vis,
    dempet,
    children,
}: {
    slutt: string;
    farge: string;
    vis: boolean;
    dempet: boolean;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? (dempet ? 0.35 : 1) : 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl flex flex-col items-center"
            style={{
                width: 360,
                height: 250,
                background: `${farge}22`,
                border: `4px solid ${farge}`,
                padding: 16,
                gap: 12,
            }}
        >
            <div className="font-black" style={{ fontSize: 56, color: farge, lineHeight: 1 }}>
                {slutt}
            </div>
            {children}
        </motion.div>
    );
}

function Jamvekt({ beat }: { beat: number }) {
    const titler = [
        'Endelsen: slutten av ordet',
        'Østlandet og Trøndelag',
        'Kløyvd infinitiv: to grupper',
        'Regelen bak: jamvekt',
        'Vestlandet: ingen todeling',
    ];
    return (
        <>
            <Overskrift tekst={titler[Math.min(beat, titler.length - 1)]} />
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="endelse"
                        {...fram}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                        <div className="font-black text-white" style={{ fontSize: 110 }}>
                            å værr
                            <span
                                style={{
                                    color: '#d97706',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: 12,
                                }}
                            >
                                a
                            </span>
                        </div>
                        <div className="font-bold text-amber-400" style={{ fontSize: 30 }}>
                            ↑ endelsen
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {beat >= 1 && (
                <div
                    className="absolute flex justify-center"
                    style={{ left: 0, right: 0, top: 110, gap: 60 }}
                >
                    <Gruppe slutt="-a" farge="#d97706" vis dempet={beat >= 4}>
                        <Ordkort farge="#d97706">å værra</Ordkort>
                    </Gruppe>
                    <Gruppe slutt="ikke -a" farge="#2563eb" vis dempet={beat >= 4}>
                        {beat >= 2 ? (
                            <Ordkort farge="#2563eb">å skrive</Ordkort>
                        ) : (
                            <div className="font-black text-blue-300" style={{ fontSize: 44 }}>
                                ?
                            </div>
                        )}
                    </Gruppe>
                </div>
            )}
            <AnimatePresence>
                {beat === 3 && (
                    <motion.div
                        key="norront"
                        {...fram}
                        className="absolute flex justify-center items-center"
                        style={{ left: 0, right: 0, top: 400, gap: 28 }}
                    >
                        <div className="font-bold text-slate-100" style={{ fontSize: 26 }}>
                            I norrønt:
                        </div>
                        <div className="flex items-center" style={{ gap: 10 }}>
                            <div
                                style={{
                                    width: 70,
                                    height: 26,
                                    borderRadius: 8,
                                    background: '#fbbf24',
                                }}
                            />
                            <span className="font-bold text-white" style={{ fontSize: 26 }}>
                                korte ord
                            </span>
                        </div>
                        <div className="flex items-center" style={{ gap: 10 }}>
                            <div
                                style={{
                                    width: 170,
                                    height: 26,
                                    borderRadius: 8,
                                    background: '#93c5fd',
                                }}
                            />
                            <span className="font-bold text-white" style={{ fontSize: 26 }}>
                                lange ord
                            </span>
                        </div>
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="ulikt"
                        {...fram}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 460 }}
                    >
                        <div className="font-black text-amber-300" style={{ fontSize: 30 }}>
                            oppfører seg fortsatt ulikt
                        </div>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="vest"
                        {...fram}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 395 }}
                    >
                        <div
                            className="rounded-2xl bg-white font-black text-blue-800 shadow-xl text-center"
                            style={{
                                fontSize: 34,
                                padding: '14px 30px',
                                border: '4px solid #1d4ed8',
                            }}
                        >
                            Vestlandet: alle verbene ender likt
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ------------------------------------------------------------- apokope */

function Faller({
    ord,
    vokal,
    faller,
    stor,
}: {
    ord: string;
    vokal: string;
    faller: boolean;
    stor: boolean;
}) {
    return (
        <motion.div
            animate={{ scale: stor ? 1 : 0.6, opacity: stor ? 1 : 0.7 }}
            transition={{ duration: 0.6 }}
            className="font-black text-white flex items-baseline justify-center"
            style={{ fontSize: 120, lineHeight: 1.1 }}
        >
            <span>{ord}</span>
            <motion.span
                initial={false}
                animate={
                    faller ? { y: 260, rotate: 40, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }
                }
                transition={{ duration: faller ? 1.4 : 0.3, ease: 'easeIn' }}
                style={{ color: '#fb7185', display: 'inline-block' }}
            >
                {vokal}
            </motion.span>
        </motion.div>
    );
}

function Apokope({ beat }: { beat: number }) {
    const titler = [
        'Trøndelag og deler av Nord-Norge',
        'Den siste vokalen faller bort',
        'Apokope',
        'Fast regel, ikke slurv',
    ];
    return (
        <>
            <Overskrift tekst={titler[Math.min(beat, titler.length - 1)]} />
            <div
                className="absolute rounded-2xl bg-sky-100"
                style={{
                    right: 24,
                    bottom: 24,
                    padding: 6,
                    opacity: beat <= 1 ? 1 : 0,
                    transition: 'opacity 0.5s',
                }}
            >
                <MalmerkerNorge
                    farger={{ vest: '#e2ddd2', ost: '#e2ddd2', trond: '#fb7185', nord: '#fecdd3' }}
                    bredde={170}
                    hoyde={205}
                />
            </div>
            <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 100 }}>
                <Faller ord="å kast" vokal="e" faller={beat >= 1} stor={beat <= 1} />
                <AnimatePresence>
                    {beat >= 2 && (
                        <motion.div key="kjop" {...fram}>
                            <Faller ord="å kjøp" vokal="e" faller={beat >= 2} stor />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {beat === 2 && (
                    <motion.div
                        key="forkl"
                        {...fram}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 440 }}
                    >
                        <div
                            className="rounded-2xl bg-white/95 font-bold text-slate-800"
                            style={{ fontSize: 28, padding: '10px 24px' }}
                        >
                            apokope = den siste vokalen faller bort
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="regel"
                        {...fram}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 430, gap: 30 }}
                    >
                        <div
                            className="rounded-2xl bg-white font-black text-slate-500 flex items-center"
                            style={{ fontSize: 32, padding: '10px 24px', gap: 14 }}
                        >
                            slurv <span style={{ color: '#dc2626', fontSize: 40 }}>✗</span>
                        </div>
                        <div
                            className="rounded-2xl bg-white font-black text-emerald-700 flex items-center"
                            style={{
                                fontSize: 32,
                                padding: '10px 24px',
                                gap: 14,
                                border: '4px solid #059669',
                            }}
                        >
                            fast regel <span style={{ color: '#059669', fontSize: 40 }}>✓</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ------------------------------------------------------------ detektiv */

const GRA = '#e2ddd2';
const SPOR: { tekst: string; peker: string; lys: Region[] }[] = [
    { tekst: 'Sier «æ»', peker: 'Trøndelag eller Nord-Norge', lys: ['trond', 'nord'] },
    { tekst: 'Tjukk l i «sol»', peker: 'Østlandet eller Trøndelag', lys: ['ost', 'trond'] },
    { tekst: 'Sier «å kast»', peker: 'Trøndelag og deler av Nord-Norge', lys: ['trond', 'nord'] },
];

function Detektiv({ beat }: { beat: number }) {
    // Regionene som passer med alle sporene så langt.
    let igjen: Region[] = ['vest', 'ost', 'trond', 'nord'];
    SPOR.slice(0, beat).forEach((s) => {
        igjen = igjen.filter((r) => s.lys.includes(r));
    });
    const ferdig = beat >= 3;
    const farger = {} as Record<Region, string>;
    (['vest', 'ost', 'trond', 'nord'] as Region[]).forEach((r) => {
        farger[r] =
            beat === 0 ? '#cbd5e1' : igjen.includes(r) ? (ferdig ? '#10b981' : '#f59e0b') : GRA;
    });
    return (
        <>
            <div
                className="absolute flex flex-col"
                style={{ left: 40, top: 40, width: 560, gap: 18 }}
            >
                <div className="font-black text-white" style={{ fontSize: 36 }}>
                    Dialektdetektiven
                </div>
                {SPOR.map((s, i) => (
                    <motion.div
                        key={s.tekst}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: beat > i ? 1 : 0, x: beat > i ? 0 : -30 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-2xl bg-white shadow-xl"
                        style={{ padding: '12px 20px', borderLeft: '10px solid #f59e0b' }}
                    >
                        <div className="font-black text-slate-900" style={{ fontSize: 30 }}>
                            Spor {i + 1}: {s.tekst}
                        </div>
                        <div className="font-semibold text-slate-600" style={{ fontSize: 22 }}>
                            peker mot {s.peker}
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="absolute" style={{ left: 640, top: 50 }}>
                <div className="rounded-3xl bg-sky-100 shadow-xl" style={{ padding: 10 }}>
                    <MalmerkerNorge farger={farger} bredde={320} hoyde={390} />
                </div>
            </div>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="silhuett"
                        {...fram}
                        className="absolute flex flex-col items-center"
                        style={{ left: 200, top: 130 }}
                    >
                        <div
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: 999,
                                background: '#94a3b8',
                            }}
                        />
                        <div
                            style={{
                                width: 200,
                                height: 150,
                                borderRadius: '100px 100px 20px 20px',
                                background: '#94a3b8',
                                marginTop: 10,
                            }}
                        />
                        <div
                            className="absolute font-black text-white"
                            style={{ top: 18, fontSize: 70 }}
                        >
                            ?
                        </div>
                    </motion.div>
                )}
                {beat === 0 && (
                    <motion.div
                        key="hvem"
                        {...fram}
                        className="absolute font-black text-white text-center"
                        style={{ left: 620, top: 470, width: 380, fontSize: 30 }}
                    >
                        Hvor kommer hun fra?
                    </motion.div>
                )}
                {ferdig && (
                    <motion.div
                        key="svar"
                        {...fram}
                        className="absolute flex justify-center"
                        style={{ left: 640, top: 466, width: 340 }}
                    >
                        <div
                            className="rounded-2xl bg-emerald-500 font-black text-white shadow-xl"
                            style={{ fontSize: 38, padding: '6px 26px' }}
                        >
                            Trøndelag!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export function MalmerkerOrd({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'buss';
    const bakgrunn =
        modus === 'buss'
            ? '#475569'
            : modus === 'apokope'
              ? '#1e293b'
              : modus === 'detektiv'
                ? '#334155'
                : '#3f3a52';
    return (
        <Flate bakgrunn={bakgrunn}>
            {modus === 'buss' && <Buss beat={beat} playing={playing} />}
            {modus === 'jamvekt' && <Jamvekt beat={beat} />}
            {modus === 'apokope' && <Apokope beat={beat} />}
            {modus === 'detektiv' && <Detektiv beat={beat} />}
        </Flate>
    );
}
