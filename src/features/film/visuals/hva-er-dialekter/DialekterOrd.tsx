import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Ordene som avslører oss, på en tavle (1000x562).
 * «deler»: uttale, bøying og ordvalg, ett kort om gangen.
 * «jeg»: et lite ord under lupa, og alle måtene å si det på.
 * «infinitiv»: å kast_ med endelsen som skifter.
 * «tid»: to spor, skrift og tale, fra norrønt til de to skriftspråkene i dag.
 */

type Modus = 'deler' | 'jeg' | 'infinitiv' | 'tid';

const BAKGRUNN = '#f8f5ee';

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
                <div className="px-5 py-1.5 rounded-2xl bg-white text-slate-900 font-display font-black text-3xl shadow-lg whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ------------------------------ deler ------------------------------ */

function Kort({
    tittel,
    aktiv,
    vist,
    children,
}: {
    tittel: string;
    aktiv: boolean;
    vist: boolean;
    children: ReactNode;
}) {
    return (
        <motion.div
            animate={{
                opacity: vist ? (aktiv ? 1 : 0.55) : 0.25,
                y: aktiv ? -8 : 0,
                scale: aktiv ? 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="rounded-3xl bg-white shadow-xl flex flex-col items-center"
            style={{
                width: 280,
                height: 330,
                padding: 18,
                border: aktiv ? '5px solid #f59e0b' : '5px solid transparent',
            }}
        >
            <div className="text-3xl font-black text-slate-900">{tittel}</div>
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-3">
                {vist ? children : <div className="text-7xl font-black text-slate-300">?</div>}
            </div>
        </motion.div>
    );
}

function Lydbolger({ farge }: { farge: string }) {
    return (
        <svg width={120} height={40} viewBox="0 0 120 40">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.rect
                    key={i}
                    x={i * 15 + 2}
                    width={9}
                    rx={4}
                    fill={farge}
                    initial={{ y: 15, height: 10 }}
                    animate={{ y: [15, 4, 15], height: [10, 32, 10] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
                />
            ))}
        </svg>
    );
}

function Deler({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-x-0 flex justify-center gap-8" style={{ top: 120 }}>
            <Kort tittel="Uttale" vist={beat >= 1} aktiv={beat === 1}>
                <Lydbolger farge="#2563eb" />
                <div className="text-4xl font-black text-slate-900">trøtt</div>
                <div className="text-2xl font-bold text-slate-500">eller</div>
                <div className="text-4xl font-black text-slate-900">
                    trø<span className="text-blue-600">y</span>tt
                </div>
            </Kort>
            <Kort tittel="Bøying" vist={beat >= 2} aktiv={beat === 2}>
                <div className="text-2xl font-bold text-slate-500">endingen</div>
                <div className="text-4xl font-black text-slate-900">
                    å kast<span className="text-orange-600 underline">e</span>
                </div>
                <div className="text-2xl font-bold text-slate-500">eller</div>
                <div className="text-4xl font-black text-slate-900">
                    å kast<span className="text-orange-600 underline">a</span>
                </div>
            </Kort>
            <Kort tittel="Ordvalg" vist={beat >= 3} aktiv={beat === 3}>
                <div className="flex flex-col items-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 0 }}
                            animate={{ x: beat === 3 && i === 1 ? 40 : 0 }}
                            transition={{ delay: 0.6, type: 'spring', stiffness: 160, damping: 16 }}
                            className="rounded-xl flex items-center justify-center text-2xl font-black"
                            style={{
                                width: 170,
                                height: 48,
                                background: i === 1 ? '#16a34a' : '#e2e8f0',
                                color: i === 1 ? 'white' : '#64748b',
                            }}
                        >
                            {i === 1 ? 'dette ordet' : 'eller dette'}
                        </motion.div>
                    ))}
                </div>
            </Kort>
        </div>
    );
}

/* ------------------------------ jeg ------------------------------ */

const JEG = ['jeg', 'eg', 'æ', 'e', 'i'];
const JEG_FARGER = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'];

function Jeg({ beat }: { beat: number }) {
    return (
        <>
            {/* Snakkebobla med ordet i */}
            <motion.div
                className="absolute rounded-[40px] bg-white shadow-xl flex items-center justify-center"
                animate={{
                    left: beat >= 2 ? 330 : 250,
                    top: beat >= 2 ? 100 : 140,
                    width: beat >= 2 ? 340 : 500,
                    height: beat >= 2 ? 120 : 200,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            >
                <div className="text-6xl font-black text-slate-900">
                    {beat >= 2 ? (
                        <span>
                            <span className="text-amber-600">«</span>jeg
                            <span className="text-amber-600">»</span>
                        </span>
                    ) : (
                        <span className="text-slate-400 tracking-widest">bla bla bla</span>
                    )}
                </div>
            </motion.div>
            {/* Lupa */}
            {beat <= 1 && (
                <motion.svg
                    width={190}
                    height={190}
                    viewBox="0 0 190 190"
                    className="absolute"
                    style={{ left: 560, top: 190 }}
                    initial={{ x: -260, rotate: -10 }}
                    animate={{ x: [-260, -60, -160], rotate: [-10, 5, 0] }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                >
                    <circle
                        cx={80}
                        cy={80}
                        r={58}
                        fill="#fef3c7"
                        fillOpacity={0.5}
                        stroke="#334155"
                        strokeWidth={12}
                    />
                    <line
                        x1={122}
                        y1={122}
                        x2={176}
                        y2={176}
                        stroke="#334155"
                        strokeWidth={18}
                        strokeLinecap="round"
                    />
                </motion.svg>
            )}
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 400 }}
                >
                    <div className="px-6 py-3 rounded-2xl bg-amber-100 shadow-lg text-center">
                        <div className="text-3xl font-black text-slate-900">Målmerke</div>
                        <div className="text-2xl font-bold text-slate-700">
                            et trekk som skiller én dialekt fra en annen
                        </div>
                    </div>
                </motion.div>
            )}
            {beat >= 2 &&
                JEG.map((ord, i) => {
                    const x = 130 + i * 160;
                    return (
                        <motion.div
                            key={ord}
                            initial={{ opacity: 0, y: -100, left: 470 }}
                            animate={{ opacity: 1, y: 0, left: x }}
                            transition={{
                                delay: 0.3 + i * 0.35,
                                type: 'spring',
                                stiffness: 140,
                                damping: 16,
                            }}
                            className="absolute rounded-3xl shadow-xl flex items-center justify-center text-white font-black"
                            style={{
                                top: 280,
                                width: 120,
                                height: 110,
                                background: JEG_FARGER[i],
                                fontSize: 52,
                            }}
                        >
                            {ord}
                        </motion.div>
                    );
                })}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 430 }}
                >
                    <div className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-3xl font-black shadow-xl">
                        Ett lite ord avslører ofte landsdelen
                    </div>
                </motion.div>
            )}
        </>
    );
}

/* ------------------------------ infinitiv ------------------------------ */

function Infinitiv({ beat }: { beat: number }) {
    const linjer = [
        { ending: 'e', farge: '#2563eb', fra: 0 },
        { ending: 'a', farge: '#dc2626', fra: 0 },
        { ending: '', farge: '#16a34a', fra: 1 },
    ];
    if (beat >= 2) return <Bygder />;
    return (
        <div className="absolute inset-x-0 flex flex-col items-center gap-5" style={{ top: 120 }}>
            <div className="text-2xl font-bold text-slate-600">
                Infinitiv: grunnformen av verbet, med «å» foran
            </div>
            {linjer.map((l, i) =>
                beat >= l.fra ? (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i === 2 ? 0.3 : i * 0.9 + 0.3 }}
                        className="flex items-baseline font-black text-slate-900"
                        style={{ fontSize: 72 }}
                    >
                        å kast
                        <span
                            className="inline-flex justify-center rounded-xl"
                            style={{
                                minWidth: 44,
                                color: l.farge,
                                borderBottom: `6px solid ${l.farge}`,
                            }}
                        >
                            {l.ending || ' '}
                        </span>
                    </motion.div>
                ) : null
            )}
        </div>
    );
}

const BYGD_ENDINGER = ['e', 'a', 'a', '', 'e', 'a'];
const ENDING_FARGE: Record<string, string> = { e: '#2563eb', a: '#dc2626', '': '#16a34a' };

function Bygder() {
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <path
                    d="M 40 430 C 250 380, 420 470, 620 410 S 900 400, 980 430"
                    fill="none"
                    stroke="#a8a29e"
                    strokeWidth={10}
                    strokeDasharray="2 16"
                    strokeLinecap="round"
                />
                {BYGD_ENDINGER.map((_, i) => {
                    const x = 100 + i * 160;
                    return (
                        <g key={i} transform={`translate(${x} 400)`}>
                            <rect x={-38} y={-60} width={76} height={60} fill="#c2410c" />
                            <polygon points="-48,-60 0,-100 48,-60" fill="#57534e" />
                            <rect x={-10} y={-30} width={20} height={30} fill="#7c2d12" />
                        </g>
                    );
                })}
            </svg>
            {BYGD_ENDINGER.map((e, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.3 }}
                    className="absolute flex justify-center"
                    style={{ left: 100 + i * 160 - 75, width: 150, top: 175 }}
                >
                    <div
                        className="px-3 py-2 rounded-2xl bg-white shadow-lg font-black text-3xl whitespace-nowrap"
                        style={{ border: `4px solid ${ENDING_FARGE[e]}` }}
                    >
                        å kast<span style={{ color: ENDING_FARGE[e] }}>{e}</span>
                    </div>
                </motion.div>
            ))}
            <div
                className="absolute rounded-xl bg-white/90 px-3 py-1 text-lg font-semibold text-slate-600"
                style={{ left: 24, bottom: 18 }}
            >
                Tenkt eksempel
            </div>
        </>
    );
}

/* ------------------------------ tid ------------------------------ */

const KOLONNER = [
    { x: 150, navn: 'Vikingtiden' },
    { x: 400, navn: 'Unionen med Danmark' },
    { x: 650, navn: '1840-tallet' },
    { x: 880, navn: 'I dag' },
];
const TRAD = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];

function Tid({ beat }: { beat: number }) {
    const skriftY = 200;
    const taleY = 390;
    const slutt = beat === 0 ? 260 : beat === 1 ? 520 : beat <= 3 ? 760 : 980;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {/* Sporene */}
                <rect x={20} y={skriftY - 50} width={960} height={100} rx={20} fill="#ede9fe" />
                <rect x={20} y={taleY - 70} width={960} height={140} rx={20} fill="#dcfce7" />
                {KOLONNER.map((k, i) =>
                    i > 0 ? (
                        <line
                            key={k.navn}
                            x1={k.x - 125}
                            y1={120}
                            x2={k.x - 125}
                            y2={480}
                            stroke="#cbd5e1"
                            strokeWidth={3}
                            strokeDasharray="6 8"
                        />
                    ) : null
                )}
                {/* Trådene i tale-sporet: dialektene */}
                {TRAD.map((f, i) => {
                    const y = taleY - 50 + i * 20;
                    const d = `M 40 ${taleY} C 150 ${taleY}, 200 ${y}, 290 ${y} L ${Math.max(slutt, 300)} ${y}`;
                    return (
                        <motion.path
                            key={f}
                            d={d}
                            fill="none"
                            stroke={f}
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6 }}
                        />
                    );
                })}
                {/* Aasen samler trådene */}
                {beat >= 3 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect
                            x={612}
                            y={taleY - 62}
                            width={76}
                            height={124}
                            rx={12}
                            fill="#fef3c7"
                            stroke="#92400e"
                            strokeWidth={5}
                        />
                        {TRAD.map((f, i) => (
                            <rect
                                key={f}
                                x={624}
                                y={taleY - 50 + i * 20 - 4}
                                width={52}
                                height={8}
                                rx={4}
                                fill={f}
                            />
                        ))}
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.path
                        d={`M 650 ${taleY - 64} L 650 ${skriftY + 40} L 760 ${skriftY + 30}`}
                        fill="none"
                        stroke="#92400e"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />
                )}
            </svg>
            {/* Etiketter */}
            <div
                className="absolute font-black text-violet-800 text-2xl"
                style={{ left: 34, top: skriftY - 92 }}
            >
                SKRIFT: det folk skrev
            </div>
            <div
                className="absolute font-black text-green-800 text-2xl"
                style={{ left: 34, top: taleY + 78 }}
            >
                TALE: det folk sa
            </div>
            {KOLONNER.map((k, i) =>
                beat >= [0, 1, 3, 4][i] ? (
                    <motion.div
                        key={k.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute flex justify-center"
                        style={{ left: k.x - 120, width: 240, top: 498 }}
                    >
                        <div className="px-3 py-1 rounded-xl bg-slate-800 text-white text-xl font-black whitespace-nowrap">
                            {k.navn}
                        </div>
                    </motion.div>
                ) : null
            )}
            {/* Blokker i skrift-sporet */}
            <Blokk x={150} y={taleY} tekst="norrønt" farge="#78350f" vis />
            <Blokk x={400} y={skriftY} tekst="dansk" farge="#b91c1c" vis={beat >= 1} />
            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute flex justify-center"
                    style={{ left: 280, width: 240, top: taleY - 116 }}
                >
                    <div className="px-3 py-1 rounded-xl bg-white text-green-800 text-2xl font-black shadow">
                        norske dialekter
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute flex justify-center"
                    style={{ left: 530, width: 240, top: taleY - 116 }}
                >
                    <div className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-2xl font-black shadow whitespace-nowrap">
                        Ivar Aasen samler
                    </div>
                </motion.div>
            )}
            {beat >= 4 && (
                <div
                    className="absolute flex flex-col gap-2"
                    style={{ left: 790, top: skriftY - 42 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 }}
                        className="px-4 py-1 rounded-xl text-white text-2xl font-black text-center"
                        style={{ background: '#92400e', width: 160 }}
                    >
                        nynorsk
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="px-4 py-1 rounded-xl text-white text-2xl font-black text-center"
                        style={{ background: '#475569', width: 160 }}
                    >
                        bokmål
                    </motion.div>
                </div>
            )}
        </>
    );
}

function Blokk({
    x,
    y,
    tekst,
    farge,
    vis,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    vis: boolean;
}) {
    return (
        <AnimatePresence>
            {vis && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute flex justify-center"
                    style={{ left: x - 100, width: 200, top: y - 26 }}
                >
                    <div
                        className="px-5 py-1.5 rounded-xl text-white text-3xl font-black shadow-lg"
                        style={{ background: farge }}
                    >
                        {tekst}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    deler: ['Hva skiller dialektene?', 'Uttale', 'Bøying', 'Ordvalg'],
    jeg: ['Hvor kommer du fra?', 'Små spor', 'Ordet for deg selv', 'Ett ord, mange svar'],
    infinitiv: ['Å kaste eller å kasta?', 'Eller bare: å kast', 'Fra bygd til bygd'],
    tid: [
        'Røttene: norrønt',
        'Skriften ble dansk',
        'Talen forble norsk',
        'Ivar Aasen samler dialekter',
        'Grunnlaget for nynorsk',
    ],
};

export function DialekterOrd({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'deler';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <Flate bakgrunn={BAKGRUNN}>
            {modus === 'deler' && <Deler beat={beat} />}
            {modus === 'jeg' && <Jeg beat={beat} />}
            {modus === 'infinitiv' && <Infinitiv beat={beat} />}
            {modus === 'tid' && <Tid beat={beat} />}
            <Overskrift tekst={overskrift} />
        </Flate>
    );
}
