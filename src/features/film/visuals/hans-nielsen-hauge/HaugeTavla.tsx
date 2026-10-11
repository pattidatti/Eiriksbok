import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Gavel, ScrollText } from 'lucide-react';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Tegnede tavler fra Hauges historie: loven som forbød møtene, bøkene, dommen, forskerne
 * som teller haugianere på Stortinget, og dagen loven ble opphevet. Folk tegnes som enkle
 * figurer. Presten har hvit pipekrage, Hauge har brun jakke.
 */

type Modus = 'lov' | 'boker' | 'kvinner' | 'dom' | 'forskere' | 'fri';

const HAUGE = '#7c3aed';
const ROD = '#b91c1c';
const GRONN = '#15803d';
const GULL = '#b45309';
const PAPIR = '#f8f1e3';

export function HaugeTavla({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lov';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: PAPIR }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={bildeNokkel(modus, beat)}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {modus === 'lov' && <Lov beat={beat} />}
                    {modus === 'boker' && <Boker beat={beat} />}
                    {modus === 'kvinner' && <Kvinner beat={beat} />}
                    {modus === 'dom' && <Dom beat={beat} />}
                    {modus === 'forskere' && <Forskere beat={beat} />}
                    {modus === 'fri' && <Fri beat={beat} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Når nøkkelen skifter, tones bildet ut og inn. Ellers bygger bildet seg videre. */
function bildeNokkel(modus: Modus, beat: number) {
    if (modus === 'lov') return `lov-${['hauge', 'makt', 'stue', 'stue', 'vei', 'mote'][Math.min(beat, 5)]}`;
    if (modus === 'forskere') return `forskere-${beat <= 1 ? 'sal' : 'tall'}`;
    if (modus === 'boker') return `boker-${beat === 0 ? 'hylle' : 'opplag'}`;
    if (modus === 'kvinner') return `kvinner-${beat === 0 ? 'stue' : 'andel'}`;
    return modus;
}

/* ---------- Figurer ---------- */

function Person({
    x,
    y,
    farge,
    s = 1,
    prest,
    hatt,
    kjole,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
    prest?: boolean;
    hatt?: boolean;
    kjole?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d={kjole ? 'M -52 0 L -22 -98 Q 0 -104 22 -98 L 52 0 Z' : 'M -38 0 Q -40 -95 0 -100 Q 40 -95 38 0 Z'}
                fill={prest ? '#111827' : farge}
            />
            {kjole && <path d="M -30 -150 Q 0 -178 30 -150 L 30 -128 Q 0 -140 -30 -128 Z" fill="#f5f5f4" />}
            {prest && <ellipse cx={0} cy={-102} rx={34} ry={12} fill="#ffffff" stroke="#d1d5db" strokeWidth={3} />}
            <circle cx={0} cy={-130} r={26} fill="#e8c4a0" />
            {hatt && <rect x={-28} y={-168} width={56} height={22} rx={6} fill="#1f2937" />}
            {hatt && <rect x={-40} y={-150} width={80} height={8} rx={4} fill="#1f2937" />}
        </g>
    );
}

function Bord({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 150} y={y} width={300} height={22} rx={6} fill="#8b5a2b" />
            <rect x={x - 130} y={y + 22} width={18} height={70} fill="#6b4423" />
            <rect x={x + 112} y={y + 22} width={18} height={70} fill="#6b4423" />
            <rect x={x - 40} y={y - 16} width={80} height={16} rx={3} fill="#1f2937" />
        </g>
    );
}

/** Stua: vegger, vindu og bord. Folk rundt bordet. */
function Stue({ prest, hauge, kvinne }: { prest?: boolean; hauge?: boolean; kvinne?: boolean }) {
    return (
        <g>
            <rect x={160} y={160} width={900} height={620} rx={18} fill="#f3e3c3" stroke="#c9a874" strokeWidth={8} />
            <rect x={160} y={700} width={900} height={80} fill="#c9a874" />
            <rect x={760} y={240} width={180} height={150} rx={8} fill="#bfdcf2" stroke="#8b5a2b" strokeWidth={8} />
            <line x1={850} x2={850} y1={240} y2={390} stroke="#8b5a2b" strokeWidth={6} />
            <Bord x={600} y={590} />
            <Person x={420} y={700} farge="#2f3b52" />
            <Person x={520} y={705} farge="#7c2d12" s={0.9} />
            <Person x={680} y={705} farge="#065f46" s={0.9} />
            <Person x={780} y={700} farge="#6b4e3d" />
            {hauge && (
                <motion.g initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <Person x={300} y={700} farge="#6b4423" s={1.15} />
                </motion.g>
            )}
            {kvinne && (
                <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Person x={300} y={700} farge="#be185d" s={1.25} kjole />
                    <rect x={330} y={520} width={60} height={76} rx={5} fill="#1f2937" transform="rotate(-14 360 558)" />
                </motion.g>
            )}
            {prest && (
                <motion.g initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Person x={930} y={700} farge="#111827" s={1.15} prest />
                </motion.g>
            )}
        </g>
    );
}

function Merkelapp({
    x,
    y,
    tekst,
    farge,
    forsinkelse = 0,
    stor,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    forsinkelse?: number;
    stor?: boolean;
}) {
    const fs = stor ? 50 : 38;
    const b = tekst.length * fs * 0.56 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 18 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect x={x - b / 2} y={y - fs} width={b} height={fs * 1.7} rx={16} fill={farge} />
            <text x={x} y={y + fs * 0.32} textAnchor="middle" fontSize={fs} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
        </motion.g>
    );
}

function Stempel({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -10 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect x={x - 220} y={y - 60} width={440} height={120} rx={14} fill="none" stroke={farge} strokeWidth={12} />
            <text x={x} y={y + 24} textAnchor="middle" fontSize={72} fontWeight={900} fill={farge} letterSpacing={6}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Svg({ children }: { children: React.ReactNode }) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            {children}
        </svg>
    );
}

/** Kort til høyre med tekst. */
function Kort({ linjer }: { linjer: { tekst: string; farge?: string; fraBeat?: number }[] }) {
    return (
        <div className="absolute right-[4%] top-0 bottom-0 w-[30%] flex flex-col justify-center gap-4">
            {linjer.map((l, i) => (
                <motion.div
                    key={l.tekst}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.4, type: 'spring', stiffness: 160, damping: 20 }}
                    className={
                        l.farge
                            ? 'px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-2xl md:text-3xl shadow-xl border-l-[10px]'
                            : 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl'
                    }
                    style={l.farge ? { borderColor: l.farge } : undefined}
                >
                    {l.tekst}
                </motion.div>
            ))}
        </div>
    );
}

/* ---------- Loven ---------- */

function Lov({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Svg>
                    <rect x={0} y={640} width={1600} height={260} fill="#a3c585" />
                    <g transform="translate(260 380)">
                        <rect x={0} y={60} width={300} height={200} fill="#a5432f" />
                        <path d="M -20 70 L 150 -30 L 320 70 Z" fill="#3d3a36" />
                        <rect x={120} y={160} width={60} height={100} fill="#4b3a2e" />
                    </g>
                    <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <Person x={760} y={700} farge="#6b4423" s={2.2} />
                        <rect x={800} y={520} width={70} height={90} rx={6} fill="#1f2937" transform="rotate(-12 835 565)" />
                    </motion.g>
                </Svg>
                <Kort linjer={[{ tekst: 'Hans Nielsen Hauge' }, { tekst: 'Født 1771 på gården Hauge', farge: HAUGE }, { tekst: 'Kunne Bibelen godt', farge: HAUGE }]} />
            </>
        );
    }
    if (beat === 1) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 px-10 py-5 rounded-3xl bg-amber-400 shadow-2xl"
                >
                    <Crown className="w-16 h-16 text-slate-900" strokeWidth={2.5} />
                    <span className="text-5xl font-black text-slate-900">KONGEN: all makt</span>
                </motion.div>
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6 }} className="w-3 h-12 bg-slate-700 origin-top" />
                <div className="flex gap-10">
                    {['Kirken', 'Troen'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + i * 0.4 }}
                            className="px-10 py-4 rounded-2xl bg-white shadow-xl text-4xl font-black text-slate-900 border-b-8"
                            style={{ borderColor: HAUGE }}
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="text-3xl font-bold text-slate-600"
                >
                    Danmark-Norge
                </motion.div>
            </div>
        );
    }
    if (beat <= 3) {
        return (
            <>
                <Svg>
                    <Stue prest={beat === 3} />
                    {beat === 2 && <Merkelapp x={610} y={110} tekst="Konventikkel: et lite, privat møte" farge={HAUGE} />}
                    {beat === 3 && <Merkelapp x={610} y={110} tekst="Lov: presten har kontroll" farge={GRONN} />}
                </Svg>
                <motion.div
                    initial={{ opacity: 0, rotate: 6, x: 40 }}
                    animate={{ opacity: 1, rotate: 3, x: 0 }}
                    className="absolute right-[5%] top-[22%] w-[26%] rounded-xl bg-[#fffbeb] shadow-2xl border-4 border-stone-400 p-5 text-center"
                >
                    <ScrollText className="w-14 h-14 mx-auto text-stone-700" />
                    <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2 break-words">Konventikkel-plakaten</div>
                    <div className="text-4xl font-black text-stone-600 mt-1">1741</div>
                </motion.div>
            </>
        );
    }
    if (beat === 4) {
        return (
            <Svg>
                <rect x={0} y={600} width={1600} height={300} fill="#a3c585" />
                <path d="M -50 900 Q 500 640 800 660 T 1650 600 L 1650 660 Q 1100 700 800 730 T -50 990 Z" fill="#d6c3a0" />
                <motion.g initial={{ x: -200 }} animate={{ x: 0 }} transition={{ duration: 2.5, ease: 'easeOut' }}>
                    <Person x={760} y={700} farge="#6b4423" s={1.6} />
                    <line x1={820} y1={720} x2={850} y2={480} stroke="#6b4423" strokeWidth={10} strokeLinecap="round" />
                </motion.g>
                <motion.g initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 }} style={{ transformOrigin: '780px 520px' }}>
                    <circle cx={780} cy={520} r={190} fill="none" stroke={ROD} strokeWidth={22} />
                    <line x1={646} y1={386} x2={914} y2={654} stroke={ROD} strokeWidth={22} />
                </motion.g>
                <Merkelapp x={800} y={140} tekst="Forbudt: reise rundt og preke" farge={ROD} stor />
            </Svg>
        );
    }
    return (
        <>
            <Svg>
                <Stue hauge />
                <Stempel x={610} y={330} tekst="ULOVLIG" farge={ROD} />
            </Svg>
            <Kort
                linjer={[
                    { tekst: 'Hauge mente:' },
                    { tekst: 'Vanlige folk kan snakke om Gud', farge: HAUGE },
                    { tekst: 'uten en prest i midten', farge: HAUGE },
                ]}
            />
        </>
    );
}

/* ---------- Bøkene ---------- */

const BOKFARGER = ['#7c2d12', '#1e3a8a', '#065f46', '#78350f', '#4c1d95', '#334155'];

function Boker({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 ? (
                <Svg>
                    {[0, 1, 2].map((rad) => (
                        <rect key={rad} x={90} y={300 + rad * 200} width={900} height={20} rx={6} fill="#8b5a2b" />
                    ))}
                    {Array.from({ length: 33 }, (_, i) => {
                        const rad = Math.floor(i / 11);
                        const kol = i % 11;
                        return (
                            <motion.rect
                                key={i}
                                x={110 + kol * 78}
                                y={300 + rad * 200 - 150}
                                width={64}
                                height={150}
                                rx={6}
                                fill={BOKFARGER[(i * 7) % BOKFARGER.length]}
                                stroke={PAPIR}
                                strokeWidth={3}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.07, type: 'spring', stiffness: 200, damping: 18 }}
                                style={{ transformOrigin: 'center bottom', transformBox: 'fill-box' }}
                            />
                        );
                    })}
                </Svg>
            ) : (
                <>
                    <Svg>
                        {Array.from({ length: 200 }, (_, i) => {
                            const rad = Math.floor(i / 20);
                            const kol = i % 20;
                            return (
                                <motion.rect
                                    key={i}
                                    x={100 + kol * 45}
                                    y={150 + rad * 66}
                                    width={32}
                                    height={52}
                                    rx={4}
                                    fill={BOKFARGER[(i * 7) % BOKFARGER.length]}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.012 }}
                                    style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                                />
                            );
                        })}
                    </Svg>
                    <div className="absolute left-[6%] top-[5%] px-5 py-2 rounded-xl bg-white shadow-lg text-xl md:text-2xl font-bold text-slate-700">
                        Hver lille bok er 1 000 eksemplarer
                    </div>
                </>
            )}
            <div className="absolute right-[4%] top-0 bottom-0 w-[32%] flex flex-col justify-center gap-5">
                <Stort verdi={33} etikett="bøker og småskrifter" />
                {beat >= 1 && <Stort verdi={200000} etikett="eksemplarer fram til 1805" prefiks="ca. " />}
                {beat >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-5 py-4 rounded-2xl bg-amber-300 text-slate-900 font-black text-2xl md:text-3xl shadow-xl"
                    >
                        Den mest leste forfatteren i Norge
                    </motion.div>
                )}
            </div>
        </>
    );
}

/* ---------- Kvinnene ---------- */

const ROSA = '#be185d';

function Kvinner({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Svg>
                    <Stue kvinne />
                    <Merkelapp x={610} y={110} tekst="En kvinne leder møtet" farge={ROSA} />
                </Svg>
                <Kort linjer={[{ tekst: 'Hauge lot kvinner' }, { tekst: 'preke', farge: ROSA }, { tekst: 'lede møter', farge: ROSA }]} />
            </>
        );
    }
    const rader = [
        { n: 4, tekst: 'Opptil en fjerdedel?', under: '1 av 4 predikanter', fraBeat: 1 },
        { n: 10, tekst: 'Nærmere ti prosent?', under: '1 av 10 predikanter', fraBeat: 2 },
    ];
    return (
        <>
            <Svg>
                {rader.map((r, k) =>
                    beat >= r.fraBeat ? (
                        <g key={r.tekst}>
                            <text x={90} y={150 + k * 360} fontSize={52} fontWeight={900} fill="#111827">
                                {r.tekst}
                            </text>
                            {Array.from({ length: r.n }, (_, i) => (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                >
                                    <Person
                                        x={140 + i * (r.n === 4 ? 150 : 96)}
                                        y={400 + k * 360}
                                        farge={i === 0 ? ROSA : '#94a3b8'}
                                        s={r.n === 4 ? 1.15 : 0.85}
                                        kjole={i === 0}
                                    />
                                </motion.g>
                            ))}
                            <text x={r.n === 4 ? 760 : 1110} y={340 + k * 360} fontSize={36} fontWeight={800} fill={ROSA}>
                                {r.under}
                            </text>
                        </g>
                    ) : null
                )}
            </Svg>
            {beat >= 3 && (
                <div className="absolute right-[4%] top-[8%] flex flex-col gap-3 items-end">
                    {['Sara Oust', 'Marthe Olsdatter Gabestad'].map((navn, i) => (
                        <motion.div
                            key={navn}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.5 }}
                            className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-2xl md:text-3xl shadow-xl border-l-[10px]"
                            style={{ borderColor: ROSA }}
                        >
                            {navn}
                        </motion.div>
                    ))}
                </div>
            )}
        </>
    );
}

function Stort({ verdi, etikett, prefiks = '' }: { verdi: number; etikett: string; prefiks?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-6 py-4 rounded-2xl bg-white shadow-xl"
        >
            <div className="text-5xl md:text-6xl font-black tabular-nums" style={{ color: HAUGE }}>
                {prefiks}
                <TelleTall verdi={verdi} />
            </div>
            <div className="text-xl md:text-2xl font-bold text-slate-600">{etikett}</div>
        </motion.div>
    );
}

/* ---------- Dommen ---------- */

function Dom({ beat }: { beat: number }) {
    return (
        <>
            <Svg>
                <rect x={120} y={430} width={760} height={260} rx={14} fill="#6b4423" />
                <rect x={100} y={410} width={800} height={40} rx={10} fill="#8b5a2b" />
                <Person x={340} y={430} farge="#1f2937" s={1.1} hatt />
                <Person x={500} y={430} farge="#1f2937" s={1.2} hatt />
                <Person x={660} y={430} farge="#1f2937" s={1.1} hatt />
                <Person x={500} y={860} farge="#6b4423" s={1.3} />
                {beat >= 1 &&
                    Array.from({ length: 14 }, (_, i) => (
                        <motion.ellipse
                            key={i}
                            cx={720 + (i % 5) * 30 - Math.floor(i / 5) * 10}
                            cy={820 - Math.floor(i / 5) * 18}
                            rx={26}
                            ry={10}
                            fill="#eab308"
                            stroke="#a16207"
                            strokeWidth={3}
                            initial={{ opacity: 0, y: -60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                        />
                    ))}
            </Svg>
            <div className="absolute top-[6%] left-[8%] flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-xl">
                <Gavel className="w-10 h-10" />
                <span className="text-3xl md:text-4xl font-black">1814: Dommen</span>
            </div>
            <div className="absolute right-[4%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
                {beat >= 1 && (
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="px-6 py-3 rounded-2xl bg-white shadow-xl">
                        <div className="text-5xl font-black tabular-nums" style={{ color: GULL }}>
                            <TelleTall verdi={1000} /> riksdaler
                        </div>
                        <div className="text-xl font-bold text-slate-600">i bot, datidens penger</div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="px-5 py-3 rounded-2xl bg-white shadow-xl border-l-[10px]" style={{ borderColor: ROD }}>
                        <div className="text-2xl font-black" style={{ color: ROD }}>Dømt for:</div>
                        <div className="text-xl md:text-2xl font-bold text-slate-900">brutt Konventikkelplakaten</div>
                        <div className="text-xl md:text-2xl font-bold text-slate-900">kritisert prestene</div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="px-5 py-3 rounded-2xl bg-white shadow-xl border-l-[10px]" style={{ borderColor: GRONN }}>
                        <div className="text-2xl font-black" style={{ color: GRONN }}>Frifunnet for:</div>
                        <div className="text-xl md:text-2xl font-bold text-slate-900">å lage en egen kirke</div>
                        <div className="text-xl md:text-2xl font-bold text-slate-900">å lure penger fra vennene</div>
                    </motion.div>
                )}
            </div>
        </>
    );
}

/* ---------- Forskerne ---------- */

const FORSKERE = [
    { verdi: 35, etikett: 'fram til 1860', fraBeat: 2, farge: '#0d9488' },
    { verdi: 49, etikett: 'før 1880-årene', fraBeat: 3, farge: '#2563eb' },
    { verdi: 56, etikett: '1814 til 1880', fraBeat: 3, farge: HAUGE },
];

function Forskere({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <>
                <Svg>
                    <rect x={100} y={120} width={1400} height={70} rx={14} fill="#1f2937" />
                    <text x={800} y={170} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                        STORTINGET, 1830- OG 1840-TALLET
                    </text>
                    {Array.from({ length: 6 }, (_, i) => (
                        <Person key={`b${i}`} x={180 + i * 100} y={760} farge="#15803d" s={0.95} />
                    ))}
                    {beat >= 1 &&
                        Array.from({ length: 6 }, (_, i) => (
                            <motion.g key={`e${i}`} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}>
                                <Person x={920 + i * 100} y={760} farge="#1f2937" s={0.95} hatt />
                            </motion.g>
                        ))}
                    <Merkelapp x={430} y={330} tekst="Bondeopposisjonen" farge={GRONN} />
                    {beat >= 1 && <Merkelapp x={1170} y={330} tekst="Embetsmennene" farge="#1f2937" forsinkelse={0.4} />}
                    {beat >= 1 && (
                        <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} x={800} y={600} textAnchor="middle" fontSize={90} fontWeight={900} fill={ROD}>
                            mot
                        </motion.text>
                    )}
                </Svg>
            </>
        );
    }
    const synlige = FORSKERE.filter((f) => beat >= f.fraBeat);
    return (
        <>
            <div className="absolute top-[7%] left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl bg-amber-300 text-slate-900 font-black text-3xl md:text-4xl shadow-xl whitespace-nowrap">
                Hvor mange haugianere på Stortinget?
            </div>
            <div className="absolute left-[6%] right-[26%] bottom-[12%] top-[26%] flex items-end justify-center gap-[6%]">
                {FORSKERE.map((f, i) => {
                    const vis = synlige.includes(f);
                    return (
                        <div key={f.etikett} className="flex flex-col items-center justify-end h-full w-[22%]">
                            {vis && (
                                <>
                                    <div className="text-5xl md:text-6xl font-black tabular-nums" style={{ color: f.farge }}>
                                        <TelleTall verdi={f.verdi} />
                                    </div>
                                    <motion.div
                                        className="w-full rounded-t-2xl"
                                        style={{ background: f.farge }}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(f.verdi / 60) * 78}%` }}
                                        transition={{ duration: 1.2, delay: i * 0.2 }}
                                    />
                                </>
                            )}
                            <div className="mt-2 text-xl md:text-2xl font-bold text-slate-700 text-center whitespace-nowrap">
                                {vis ? f.etikett : ''}
                            </div>
                            <div className="text-lg font-semibold text-slate-500">{vis ? `forsker ${i === 2 ? '3 og 4' : i + 1}` : ''}</div>
                        </div>
                    );
                })}
            </div>
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                    animate={{ opacity: 1, scale: 1, rotate: -4 }}
                    className="absolute right-[3%] top-[40%] px-6 py-4 rounded-2xl bg-white shadow-2xl border-4 text-center"
                    style={{ borderColor: ROD }}
                >
                    <div className="text-3xl font-black text-slate-900 line-through decoration-red-600 decoration-[6px]">MEDLEMSKORT</div>
                    <div className="text-xl font-bold text-slate-600">fantes ikke</div>
                </motion.div>
            )}
        </>
    );
}

/* ---------- 1842 ---------- */

function Fri({ beat }: { beat: number }) {
    return (
        <>
            <Svg>
                <Stue />
                {beat >= 1 && <Merkelapp x={610} y={110} tekst="Lov: møter uten presten" farge={GRONN} />}
            </Svg>
            <div className="absolute right-[4%] top-0 bottom-0 w-[30%] flex flex-col justify-center gap-5">
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative rounded-xl bg-[#fffbeb] shadow-2xl border-4 border-stone-400 p-5 text-center"
                >
                    <ScrollText className="w-12 h-12 mx-auto text-stone-700" />
                    <div className="text-2xl md:text-3xl font-black text-slate-900 mt-1 break-words">Konventikkel-plakaten</div>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        className="absolute left-3 right-3 top-1/2 h-3 bg-red-600 origin-left rotate-[-8deg]"
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-4xl font-black mt-2"
                        style={{ color: ROD }}
                    >
                        Opphevet 1842
                    </motion.div>
                </motion.div>
                {beat >= 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 }}
                        className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-2xl shadow-xl border-l-[10px]"
                        style={{ borderColor: HAUGE }}
                    >
                        Samme år: Det Norske Misjonsselskap
                    </motion.div>
                )}
            </div>
        </>
    );
}
