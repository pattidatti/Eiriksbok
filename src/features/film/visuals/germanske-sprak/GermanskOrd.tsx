import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Ordene i filmen om de germanske språkene. Fire moduser:
 *  - kafe:     kafeen i Amsterdam, der nederlandske ord høres ut som norsk og engelsk
 *  - kognater: tabellen fra artikkelen som fylles rad for rad, med urgermansk som bestemor
 *  - tall:     tallene en til ti på norsk og engelsk
 *  - lever:    ukedagene og stedsnavnene som er norrøne
 */

type Modus = 'kafe' | 'kognater' | 'tall' | 'lever';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const NL = '#b45309';
const NO = '#1d4ed8';
const EN = '#c2410c';

export function GermanskOrd({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kafe';
    return (
        <Flate bakgrunn={modus === 'kafe' ? '#f5e9d7' : '#f8fafc'}>
            <div className="absolute inset-0" style={FONT}>
                {modus === 'kafe' && <Kafe beat={beat} playing={playing} />}
                {modus === 'kognater' && <Kognater beat={beat} />}
                {modus === 'tall' && <Tall beat={beat} />}
                {modus === 'lever' && <Lever beat={beat} />}
            </div>
        </Flate>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    className,
    style,
}: {
    children: ReactNode;
    forsinkelse?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: forsinkelse }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
}

/* ---------- kafe ---------- */

const KAFE_ORD = [
    { nl: 'huis', no: 'hus', en: 'house' },
    { nl: 'boek', no: 'bok', en: 'book' },
    { nl: 'melk', no: 'melk', en: 'milk' },
];

function Kafe({ beat, playing }: { beat: number; playing: boolean }) {
    const ordtavle = beat >= 2;
    return (
        <>
            {/* Kafeen: vindu mot kanalen, et bord med to gjester og koppen din. */}
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <rect x={0} y={0} width={1000} height={562} fill="#f5e9d7" />
                <rect x={0} y={400} width={1000} height={162} fill="#c08457" />
                {/* Vinduet */}
                <rect
                    x={30}
                    y={50}
                    width={470}
                    height={290}
                    rx={12}
                    fill="#93c5fd"
                    stroke="#78350f"
                    strokeWidth={10}
                />
                <rect x={35} y={250} width={460} height={85} fill="#60a5fa" />
                {[0, 1, 2, 3, 4].map((i) => (
                    <path
                        key={i}
                        d={`M ${50 + i * 88} 250 L ${50 + i * 88} ${150 + (i % 3) * 18} L ${92 + i * 88} ${118 + (i % 3) * 18} L ${134 + i * 88} ${150 + (i % 3) * 18} L ${134 + i * 88} 250 Z`}
                        fill={['#9a3412', '#7c2d12', '#b45309', '#57534e', '#92400e'][i]}
                    />
                ))}
                {[0, 1, 2, 3, 4].map((i) => (
                    <rect
                        key={`v${i}`}
                        x={80 + i * 88}
                        y={182 + (i % 3) * 18}
                        width={24}
                        height={30}
                        fill="#fde68a"
                    />
                ))}
                <line x1={265} y1={50} x2={265} y2={340} stroke="#78350f" strokeWidth={8} />
                <rect x={135} y={22} width={260} height={50} rx={10} fill="#78350f" />
                <text
                    x={265}
                    y={49}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill="#fef3c7"
                >
                    Amsterdam
                </text>
                {/* Nabobordet med to gjester */}
                <g transform="translate(300 0)">
                    <rect x={-150} y={350} width={300} height={18} rx={6} fill="#78350f" />
                    <rect x={-10} y={368} width={20} height={110} fill="#78350f" />
                    {[-1, 1].map((s) => (
                        <g key={s} transform={`translate(${s * 120} 0)`}>
                            <circle cx={0} cy={250} r={38} fill={s < 0 ? '#fcd9b6' : '#d6a77a'} />
                            <path
                                d="M -52 400 Q -52 292 0 292 Q 52 292 52 400 Z"
                                fill={s < 0 ? '#0f766e' : '#7c3aed'}
                            />
                        </g>
                    ))}
                </g>
                {/* Koppen din i forgrunnen */}
                <g transform="translate(110 480)">
                    <path
                        d="M -50 -40 L 50 -40 L 40 40 L -40 40 Z"
                        fill="#fafaf9"
                        stroke="#57534e"
                        strokeWidth={5}
                    />
                    <path
                        d="M 48 -22 Q 80 -16 46 18"
                        fill="none"
                        stroke="#57534e"
                        strokeWidth={6}
                    />
                    {playing &&
                        [0, 1].map((i) => (
                            <path
                                key={i}
                                d={`M ${-14 + i * 24} -50 q 12 -20 0 -40 q -12 -20 0 -40`}
                                fill="none"
                                stroke="#a8a29e"
                                strokeWidth={4}
                                opacity={0.7}
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0.1;0.7;0.1"
                                    dur="2.4s"
                                    begin={`${i * 1.2}s`}
                                    repeatCount="indefinite"
                                />
                            </path>
                        ))}
                </g>
            </svg>
            {/* Snakkebobla fra nabobordet */}
            {beat >= 1 && (
                <div className="absolute" style={{ left: 545, top: 28, width: 420 }}>
                    <Inn
                        className="relative px-5 py-3 rounded-3xl shadow-xl"
                        style={{ background: '#ffffff' }}
                    >
                        <div className="text-lg font-bold text-slate-500">
                            ved nabobordet: nederlandsk
                        </div>
                        {beat === 1 ? (
                            <div className="text-4xl font-black text-slate-400 tracking-widest">
                                · · · · · ·
                            </div>
                        ) : (
                            <div
                                className="text-4xl font-black whitespace-nowrap"
                                style={{ color: NL }}
                            >
                                huis · boek · melk
                            </div>
                        )}
                    </Inn>
                </div>
            )}
            {/* Ordtavla */}
            {ordtavle && (
                <div className="absolute" style={{ left: 545, top: 170, width: 420 }}>
                    <Inn
                        className="rounded-3xl shadow-xl px-5 py-4"
                        style={{ background: '#ffffff' }}
                    >
                        <div
                            className="grid gap-x-4 gap-y-2"
                            style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}
                        >
                            <Kol farge={NL}>nederlandsk</Kol>
                            <Kol farge={NO}>norsk</Kol>
                            <Kol farge={EN} synlig={beat >= 3}>
                                engelsk
                            </Kol>
                            {KAFE_ORD.map((o, i) => (
                                <Rad key={o.nl} o={o} i={i} beat={beat} />
                            ))}
                        </div>
                        <div style={{ minHeight: 44 }}>
                            {beat >= 4 && (
                                <Inn className="mt-3 text-2xl font-black text-center text-stone-800">
                                    Et slektskap på tusenvis av år
                                </Inn>
                            )}
                        </div>
                    </Inn>
                </div>
            )}
        </>
    );
}

function Kol({
    children,
    farge,
    synlig = true,
}: {
    children: ReactNode;
    farge: string;
    synlig?: boolean;
}) {
    return (
        <div className="text-lg font-black" style={{ color: farge, opacity: synlig ? 1 : 0 }}>
            {children}
        </div>
    );
}

function Rad({ o, i, beat }: { o: (typeof KAFE_ORD)[number]; i: number; beat: number }) {
    const celle = (tekst: string, farge: string, synlig: boolean, d: number) => (
        <div className="text-4xl font-black" style={{ color: farge }}>
            {synlig ? (
                <Inn forsinkelse={d}>
                    <span
                        className={
                            beat >= 4
                                ? 'underline decoration-4 decoration-amber-400 underline-offset-8'
                                : ''
                        }
                    >
                        {tekst}
                    </span>
                </Inn>
            ) : (
                <span style={{ opacity: 0 }}>{tekst}</span>
            )}
        </div>
    );
    return (
        <>
            {celle(o.nl, NL, true, i * 0.2)}
            {celle(o.no, NO, true, 0.4 + i * 0.3)}
            {celle(o.en, EN, beat >= 3, i * 0.3)}
        </>
    );
}

/* ---------- kognater ---------- */

const SPRAK = ['Norsk', 'Engelsk', 'Nederlandsk', 'Tysk', 'Norrønt'];
const SPRAK_FARGE = ['#1d4ed8', '#c2410c', '#b45309', '#be123c', '#7c3aed'];
const RADER: { ord: string[]; fra: number }[] = [
    { ord: ['natt', 'night', 'nacht', 'Nacht', 'nótt'], fra: 0 },
    { ord: ['vann', 'water', 'water', 'Wasser', 'vatn'], fra: 2 },
    { ord: ['hus', 'house', 'huis', 'Haus', 'hús'], fra: 2 },
    { ord: ['grønn', 'green', 'groen', 'grün', 'grœnn'], fra: 3 },
    { ord: ['bok', 'book', 'boek', 'Buch', 'bók'], fra: 4 },
    { ord: ['melk', 'milk', 'melk', 'Milch', 'mjólk'], fra: 4 },
];

function Kognater({ beat }: { beat: number }) {
    const kolSynlig = (k: number) => k < 4 || beat >= 1;
    return (
        <div className="absolute inset-0 px-10 pt-5">
            {/* Øverst: tittelen, og fra beat 4 det felles opphavet som alle kolonnene kommer fra. */}
            <div className="relative" style={{ height: 96 }}>
                <AnimatePresence mode="wait">
                    {beat >= 3 && beat < 4 && (
                        <motion.div
                            key="tittel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="text-4xl font-black text-stone-900">Kognater</div>
                            <div className="text-2xl font-semibold text-stone-500">
                                ord i ulike språk med samme opphav
                            </div>
                        </motion.div>
                    )}
                    {beat >= 4 && (
                        <motion.div
                            key="rot"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center"
                        >
                            <div className="px-6 py-2 rounded-2xl bg-amber-100 border-4 border-amber-500 text-center">
                                <div className="text-3xl font-black text-amber-900">
                                    {beat >= 5 ? 'Bestemor: urgermansk' : 'Samme urgermanske ord'}
                                </div>
                                <div className="text-xl font-bold text-amber-800">
                                    {beat >= 5
                                        ? 'fem søskenbarn som ligner på hver sin måte'
                                        : 'ikke lånt, men arvet'}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Linjer fra opphavet ned til hver kolonne */}
            <svg viewBox="0 0 920 40" className="w-full" style={{ height: 40 }}>
                {beat >= 4 &&
                    [0, 1, 2, 3, 4].map((k) => (
                        <motion.line
                            key={k}
                            x1={460}
                            y1={0}
                            x2={92 + k * 184}
                            y2={40}
                            stroke="#d97706"
                            strokeWidth={4}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: k * 0.1 }}
                        />
                    ))}
            </svg>
            <div className="grid gap-x-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {SPRAK.map((s, k) => (
                    <div
                        key={s}
                        className="text-center text-xl font-black uppercase tracking-wide py-1 rounded-t-xl"
                        style={{
                            color: '#fff',
                            background: SPRAK_FARGE[k],
                            opacity: kolSynlig(k) ? 1 : 0,
                            transition: 'opacity 0.6s',
                            boxShadow: beat >= 5 ? `0 0 0 4px ${SPRAK_FARGE[k]}55` : 'none',
                        }}
                    >
                        {s}
                    </div>
                ))}
                {RADER.map((r) =>
                    r.ord.map((o, k) => {
                        const synlig = beat >= r.fra && kolSynlig(k);
                        const ny = beat === r.fra || (k === 4 && beat === 1 && r.fra === 0);
                        return (
                            <div
                                key={`${r.ord[0]}-${k}`}
                                className="text-center font-black bg-white border-b border-slate-200"
                                style={{ fontSize: 34, lineHeight: '52px', color: SPRAK_FARGE[k] }}
                            >
                                {synlig ? (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            delay: ny ? 0.15 + k * 0.25 : 0,
                                            duration: 0.4,
                                        }}
                                        className="inline-block"
                                    >
                                        {o}
                                    </motion.span>
                                ) : (
                                    <span style={{ opacity: 0 }}>{o}</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

/* ---------- tall ---------- */

const TALL = [
    ['en', 'one'],
    ['to', 'two'],
    ['tre', 'three'],
    ['fire', 'four'],
    ['fem', 'five'],
    ['seks', 'six'],
    ['sju', 'seven'],
    ['åtte', 'eight'],
    ['ni', 'nine'],
    ['ti', 'ten'],
];
/** Hvilken beat hvert tall kommer på. */
const TALL_BEAT = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2];

function Tall({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
            <div className="flex items-center gap-6 text-2xl font-black">
                <span style={{ color: NO }}>norsk</span>
                <span className="text-slate-400">og</span>
                <span style={{ color: EN }}>engelsk</span>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 176px)' }}>
                {TALL.map(([no, en], i) => {
                    const synlig = beat >= TALL_BEAT[i];
                    const lik = beat >= 3;
                    return (
                        <div
                            key={no}
                            className="rounded-2xl bg-white shadow-lg text-center py-2"
                            style={{
                                opacity: synlig ? 1 : 0.15,
                                transition: 'opacity 0.5s',
                                outline: lik ? '4px solid #facc15' : 'none',
                            }}
                        >
                            <div className="text-xl font-black text-slate-400">{i + 1}</div>
                            <Ord tekst={no} farge={NO} uthev={false} />
                            <Ord tekst={en} farge={EN} uthev={false} />
                        </div>
                    );
                })}
            </div>
            <div style={{ height: 56 }}>
                {beat >= 3 && (
                    <Inn className="px-6 py-2 rounded-2xl bg-amber-100 text-3xl font-black text-amber-900">
                        Med fra starten: mange grunnleggende ord
                    </Inn>
                )}
            </div>
        </div>
    );
}

function Ord({ tekst, farge, uthev }: { tekst: string; farge: string; uthev: boolean }) {
    return (
        <div className="text-4xl font-black" style={{ color: farge }}>
            <span>
                <span
                    style={{
                        textDecoration: uthev ? 'underline' : 'none',
                        textDecorationColor: '#eab308',
                        textDecorationThickness: 6,
                        textUnderlineOffset: 6,
                    }}
                >
                    {tekst.slice(0, 1)}
                </span>
                {tekst.slice(1)}
            </span>
        </div>
    );
}

/* ---------- lever ---------- */

const DAGER = [
    { dag: 'tirsdag', norront: 'Týrs dagr', gud: 'Tyr' },
    { dag: 'onsdag', norront: 'Óðins dagr', gud: 'Odin' },
    { dag: 'torsdag', norront: 'Þórs dagr', gud: 'Tor' },
    { dag: 'fredag', norront: 'Freyju dagr', gud: 'Frøya' },
];
const STEDER = [
    { navn: 'Oslo', norront: 'Ásló' },
    { navn: 'Bergen', norront: 'Bjǫrgvin' },
    { navn: 'Trondheim', norront: 'Þróndarheimr' },
];

function Lever({ beat }: { beat: number }) {
    const steder = beat >= 3;
    return (
        <AnimatePresence mode="wait">
            {!steder ? (
                <motion.div
                    key="dager"
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                >
                    <div className="text-3xl font-black text-stone-700">Ukedagene</div>
                    <div className="flex gap-4">
                        {DAGER.map((d, i) => (
                            <div
                                key={d.dag}
                                className="rounded-2xl bg-white shadow-xl text-center flex flex-col justify-start"
                                style={{ width: 210, height: 250, borderTop: '14px solid #7c3aed' }}
                            >
                                <div className="text-4xl font-black text-stone-900 mt-5">
                                    {d.dag}
                                </div>
                                {beat >= 1 && (
                                    <Inn forsinkelse={i * 0.35} className="mt-4">
                                        <div className="text-lg font-bold text-slate-500">
                                            norrønt
                                        </div>
                                        <div className="text-3xl font-black text-violet-700">
                                            {d.norront}
                                        </div>
                                    </Inn>
                                )}
                                {beat >= 2 && (
                                    <Inn
                                        forsinkelse={i * 0.2}
                                        className="mt-4 mx-4 py-1 rounded-xl bg-violet-700 text-white text-3xl font-black"
                                    >
                                        {d.gud}
                                    </Inn>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ height: 50 }}>
                        {beat >= 2 && (
                            <Inn className="text-3xl font-black text-violet-800">
                                Oppkalt etter norrøne guder
                            </Inn>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="steder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0"
                >
                    <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                        <rect width={1000} height={562} fill="#e0f2fe" />
                        {/* Fjell på hver side og en eng i midten: Bjørgvin */}
                        <motion.g
                            animate={{ opacity: beat >= 4 ? 1 : 0.35 }}
                            transition={{ duration: 0.8 }}
                        >
                            <path
                                d="M 0 562 L 0 300 L 120 160 L 230 280 L 330 190 L 430 562 Z"
                                fill="#64748b"
                            />
                            <path
                                d="M 1000 562 L 1000 280 L 880 150 L 780 270 L 690 200 L 580 562 Z"
                                fill="#64748b"
                            />
                            <path d="M 300 562 Q 500 420 700 562 Z" fill="#65a30d" />
                            <path
                                d="M 110 175 L 120 160 L 135 178 Z M 870 165 L 880 150 L 892 168 Z"
                                fill="#f8fafc"
                            />
                        </motion.g>
                    </svg>
                    <div
                        className="absolute inset-x-0 flex justify-center gap-6"
                        style={{ top: 60 }}
                    >
                        {STEDER.map((s, i) => {
                            const fokus = beat >= 4 && s.navn === 'Bergen';
                            const dempet = beat >= 4 && !fokus;
                            return (
                                <Inn key={s.navn} forsinkelse={i * 0.3}>
                                    <div
                                        className="rounded-xl text-center px-5 py-3 shadow-xl"
                                        style={{
                                            background: '#1e40af',
                                            border: '5px solid #fff',
                                            opacity: dempet ? 0.35 : 1,
                                            transform: fokus ? 'scale(1.18)' : 'none',
                                            transition: 'all 0.6s',
                                            minWidth: 230,
                                        }}
                                    >
                                        <div className="text-4xl font-black text-white">
                                            {s.navn}
                                        </div>
                                        <div className="text-2xl font-bold text-blue-100">
                                            {s.norront}
                                        </div>
                                    </div>
                                </Inn>
                            );
                        })}
                    </div>
                    {beat >= 4 && (
                        <div
                            className="absolute inset-x-0 flex justify-center"
                            style={{ top: 330 }}
                        >
                            <Inn className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-4xl font-black text-lime-800">
                                «engen mellom fjellene»
                            </Inn>
                        </div>
                    )}
                    {beat === 3 && (
                        <div
                            className="absolute inset-x-0 flex justify-center"
                            style={{ top: 330 }}
                        >
                            <Inn className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-stone-800">
                                Norrøne stedsnavn
                            </Inn>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
