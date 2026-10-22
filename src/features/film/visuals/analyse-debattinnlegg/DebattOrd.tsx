import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Brain, Check, TrendingDown, VenetianMask, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Ordverkstedet: ordet «ferdighetstyv» som deles i to, en svak og en sterk analysesetning,
 * og rammen HVA - HVORDAN - HVORFOR som en tråd syr sammen til én tekst.
 */

type Modus = 'tyv' | 'skriv' | 'ramme' | 'tabell';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLA = '#2563eb';
const ROD = '#dc2626';
const GRONN = '#16a34a';

function Inn({ children, k, forsinkelse = 0 }: { children: ReactNode; k: string; forsinkelse?: number }) {
    return (
        <motion.div
            key={k}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}

function Kort({
    farge,
    ikon,
    tittel,
    tekst,
    bredde,
}: {
    farge: string;
    ikon?: ReactNode;
    tittel: string;
    tekst?: ReactNode;
    bredde: number;
}) {
    return (
        <div
            className="rounded-3xl bg-white shadow-xl px-6 py-4 flex items-start gap-4"
            style={{ width: bredde, borderTop: `8px solid ${farge}` }}
        >
            {ikon && (
                <div
                    className="shrink-0 rounded-2xl flex items-center justify-center text-white"
                    style={{ width: 56, height: 56, background: farge }}
                >
                    {ikon}
                </div>
            )}
            <div className="min-w-0">
                <div className="text-2xl font-black text-slate-900 leading-tight" style={FONT}>
                    {tittel}
                </div>
                {tekst && <div className="text-lg font-semibold text-slate-600 mt-1 leading-snug">{tekst}</div>}
            </div>
        </div>
    );
}

/* ---------- Ordet ---------- */

function Ordet({ delt }: { delt: boolean }) {
    return (
        <div className="flex items-baseline justify-center" style={{ ...FONT, fontSize: 92, fontWeight: 900 }}>
            <motion.span layout style={{ color: delt ? BLA : '#0f172a' }} transition={{ duration: 0.8 }}>
                {delt ? 'ferdighet' : 'ferdighets'}
            </motion.span>
            <AnimatePresence>
                {delt && (
                    <motion.span
                        key="pluss"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-slate-400"
                        style={{ margin: '0 36px' }}
                    >
                        +
                    </motion.span>
                )}
            </AnimatePresence>
            <motion.span layout style={{ color: ROD }} transition={{ duration: 0.8 }}>
                tyv
            </motion.span>
        </div>
    );
}

function TyvModus({ beat }: { beat: number }) {
    const nede: Record<number, ReactNode> = {
        0: (
            <Inn k="b0">
                <div className="rounded-full bg-slate-900 text-white px-8 py-3 text-2xl font-bold" style={FONT}>
                    Hofmanns ord om KI
                </div>
            </Inn>
        ),
        1: (
            <div className="flex gap-8">
                <Inn k="b1a">
                    <Kort farge={ROD} ikon={<TrendingDown size={32} />} tittel="1. Svekker" tekst="ferdighetene vi har" bredde={380} />
                </Inn>
                <Inn k="b1b" forsinkelse={0.5}>
                    <Kort farge={ROD} ikon={<Ban size={32} />} tittel="2. Hindrer" tekst="oss i å lære nye" bredde={380} />
                </Inn>
            </div>
        ),
        2: (
            <div className="flex gap-8">
                <Inn k="b2a">
                    <Kort farge={BLA} tittel="ferdighet" tekst="noe du kan" bredde={380} />
                </Inn>
                <Inn k="b2b" forsinkelse={0.4}>
                    <Kort farge={ROD} tittel="tyv" tekst="en som stjeler fra deg" bredde={380} />
                </Inn>
            </div>
        ),
        3: (
            <Inn k="b3">
                <div className="relative rounded-3xl bg-slate-200 px-10 py-6 text-center" style={{ width: 760 }}>
                    <div className="text-lg font-bold uppercase tracking-widest text-slate-500">Han kunne skrevet</div>
                    <div className="relative inline-block mt-2 text-3xl font-semibold text-slate-800" style={FONT}>
                        teknologi som svekker ferdighetene våre
                        <motion.div
                            className="absolute left-0 right-0 bg-red-600 rounded"
                            style={{ top: '52%', height: 5, originX: 0 }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 1.6 }}
                        />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 1.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 2.2 }}
                        className="absolute -top-5 -right-5 rotate-6 rounded-xl bg-red-600 text-white px-4 py-1 text-2xl font-black"
                        style={FONT}
                    >
                        Kjedelig
                    </motion.div>
                </div>
            </Inn>
        ),
        4: (
            <Inn k="b4">
                <div className="flex items-center gap-6 rounded-3xl bg-slate-900 text-white px-8 py-5 shadow-2xl">
                    <div className="rounded-full bg-white/10 p-4">
                        <VenetianMask size={72} />
                    </div>
                    <div>
                        <div className="text-4xl font-black" style={FONT}>
                            En metafor
                        </div>
                        <div className="text-2xl font-semibold text-slate-300 mt-1">et bilde i hodet ditt</div>
                    </div>
                </div>
            </Inn>
        ),
    };
    return (
        <>
            <div className="absolute left-0 right-0 flex justify-center" style={{ top: '12%' }}>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                    <Ordet delt={beat >= 2} />
                </motion.div>
            </div>
            <div className="absolute left-0 right-0 flex justify-center" style={{ top: '48%' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={beat} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {nede[Math.min(beat, 4)]}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}

/* ---------- Svak og sterk analyse ---------- */

function Merk({ children, farge }: { children: ReactNode; farge: string }) {
    return (
        <span className="rounded-md px-1" style={{ background: `${farge}22`, color: farge, fontWeight: 800 }}>
            {children}
        </span>
    );
}

function SkrivModus({ beat }: { beat: number }) {
    return (
        <>
            <div className="absolute left-0 right-0 flex justify-center" style={{ top: '6%' }}>
                <div className="flex items-center gap-5 text-4xl font-black text-slate-900" style={FONT}>
                    <span className="text-slate-500 line-through decoration-red-600 decoration-4">Pek på ordet</span>
                    <span className="text-slate-400">→</span>
                    <span style={{ color: GRONN }}>Forklar hva ordet gjør</span>
                </div>
            </div>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="pil"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 flex items-center justify-center gap-10"
                        style={{ top: '36%' }}
                    >
                        <div className="rounded-3xl bg-white shadow-xl px-8 py-5 text-5xl font-black" style={{ ...FONT, color: ROD }}>
                            ferdighetstyv
                        </div>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            style={{ originX: 0, width: 160, height: 10, background: '#0f172a', borderRadius: 5 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.5 }}
                            className="rounded-3xl bg-slate-900 text-white px-8 py-5 flex items-center gap-4"
                        >
                            <Brain size={56} />
                            <span className="text-4xl font-black" style={FONT}>
                                leseren?
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.div
                        key="svak"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: beat >= 2 ? 0.75 : 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute flex items-start gap-5 rounded-3xl bg-white shadow-xl px-7 py-5"
                        style={{ left: '8%', width: '84%', top: '22%', borderLeft: `10px solid ${ROD}` }}
                    >
                        <div className="shrink-0 rounded-full p-2 text-white" style={{ background: ROD }}>
                            <X size={36} />
                        </div>
                        <div>
                            <div className="text-xl font-black uppercase tracking-widest" style={{ color: ROD }}>
                                Svakt
                            </div>
                            <div className="text-2xl font-semibold text-slate-700 mt-1 leading-snug">
                                Forfatteren bruker metaforen ferdighetstyv for å vise at KI er dumt.
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        key="sterk"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute flex items-start gap-5 rounded-3xl bg-white shadow-xl px-7 py-5"
                        style={{ left: '8%', width: '84%', top: '48%', borderLeft: `10px solid ${GRONN}` }}
                    >
                        <div className="shrink-0 rounded-full p-2 text-white" style={{ background: GRONN }}>
                            <Check size={36} />
                        </div>
                        <div>
                            <div className="text-xl font-black uppercase tracking-widest" style={{ color: GRONN }}>
                                Sterkt
                            </div>
                            <div className="text-2xl font-semibold text-slate-700 mt-1 leading-snug">
                                Metaforen <Merk farge={ROD}>gjør KI til en kriminell</Merk>. Det skaper{' '}
                                <Merk farge={ROD}>patos</Merk>, fordi vi føler at noe verdifullt blir tatt fra oss.
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="sjekk"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute left-0 right-0 flex justify-center gap-6"
                        style={{ top: '80%' }}
                    >
                        {['Hvorfor ble ordet valgt?', 'Hvilken virkning har det?'].map((t) => (
                            <div key={t} className="rounded-full bg-slate-900 text-white px-7 py-3 text-2xl font-bold" style={FONT}>
                                {t}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Rammen ---------- */

const BOKSER = [
    {
        tittel: 'HVA',
        sporsmal: 'Hva mener avsenderen?',
        svar: ['Hovedsynet:', 'KI gjør oss sløve'],
        farge: '#0f172a',
        fraBeat: 1,
    },
    {
        tittel: 'HVORDAN',
        sporsmal: 'Hvilke grep bruker han?',
        svar: ['etos', 'logos', 'patos', 'metaforer'],
        farge: '#7c3aed',
        fraBeat: 2,
    },
    {
        tittel: 'HVORFOR',
        sporsmal: 'Hva gjør grepene med leseren?',
        svar: ['Virkningen:', 'vi blir redde', 'og stoler på ham'],
        farge: GRONN,
        fraBeat: 3,
    },
];
const CHIP: Record<string, string> = { etos: GRONN, logos: BLA, patos: ROD, metaforer: '#d97706' };

function RammeModus({ beat }: { beat: number }) {
    return (
        <>
            <div className="absolute left-0 right-0 text-center text-4xl font-black text-slate-900" style={{ ...FONT, top: '6%' }}>
                Tre spørsmål som ramme
            </div>
            <div className="absolute flex justify-between" style={{ left: '5%', right: '5%', top: '20%', height: '52%' }}>
                {BOKSER.map((b) => {
                    const fylt = beat >= b.fraBeat;
                    return (
                        <motion.div
                            key={b.tittel}
                            initial={false}
                            animate={{ scale: beat === b.fraBeat ? 1.04 : 1, opacity: fylt || beat === 0 ? 1 : 0.55 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-3xl shadow-xl px-6 py-5 flex flex-col"
                            style={{
                                width: '27%',
                                background: fylt ? '#ffffff' : '#f1f5f9',
                                border: `4px ${fylt ? 'solid' : 'dashed'} ${b.farge}`,
                            }}
                        >
                            <div className="text-4xl font-black" style={{ ...FONT, color: b.farge }}>
                                {b.tittel}
                            </div>
                            <div className="text-lg font-semibold text-slate-500 mt-1 leading-snug">{b.sporsmal}</div>
                            <AnimatePresence>
                                {fylt && (
                                    <motion.div
                                        key="svar"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="mt-4 flex flex-wrap gap-2"
                                    >
                                        {b.svar.map((s) =>
                                            CHIP[s] ? (
                                                <span
                                                    key={s}
                                                    className="rounded-full px-4 py-1 text-xl font-bold text-white"
                                                    style={{ background: CHIP[s] }}
                                                >
                                                    {s}
                                                </span>
                                            ) : (
                                                <span key={s} className="w-full text-2xl font-bold text-slate-800 leading-tight">
                                                    {s}
                                                </span>
                                            )
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full pointer-events-none">
                {[0, 1].map((i) => (
                    <motion.path
                        key={i}
                        d={i === 0 ? 'M 524 400 L 572 400' : 'M 1028 400 L 1076 400'}
                        stroke="#94a3b8"
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: beat >= i + 2 ? 1 : 0, opacity: beat >= i + 2 ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    />
                ))}
                {beat >= 4 && (
                    <motion.path
                        d="M 60 700 C 300 640, 360 760, 560 690 S 820 650, 1000 700 S 1300 760, 1540 680"
                        fill="none"
                        stroke="#d97706"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                    />
                )}
            </svg>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="vev"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        className="absolute left-0 right-0 flex justify-center"
                        style={{ top: '80%' }}
                    >
                        <div className="rounded-full bg-amber-500 text-white px-8 py-3 text-3xl font-black shadow-xl" style={FONT}>
                            Vev det sammen til én tekst
                        </div>
                    </motion.div>
                )}
                {beat === 0 && (
                    <motion.div
                        key="tom"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 text-center text-2xl font-bold text-slate-500"
                        style={{ top: '80%' }}
                    >
                        Funnene dine skal inn i rammen
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Logos mot patos, rad for rad ---------- */

const RADER = [
    { navn: 'Mål', logos: 'overbevise med bevis og logikk', patos: 'engasjere med medfølelse og frykt' },
    { navn: 'Språk', logos: 'nøytralt, presist, med tall', patos: 'billedlig, ladet, personlig' },
    { navn: 'Styrke', logos: 'vanskelig å motsi', patos: 'får folk til å handle med en gang' },
    { navn: 'Risiko', logos: 'kan virke tørt og kjedelig', patos: 'kan virke manipulerende' },
];

function TabellModus({ beat }: { beat: number }) {
    return (
        <div className="absolute flex flex-col gap-3" style={{ left: '5%', right: '5%', top: '6%' }}>
            <div className="grid gap-3" style={{ gridTemplateColumns: '18% 1fr 1fr' }}>
                <div />
                {[
                    ['Logos', 'til hodet', BLA],
                    ['Patos', 'til hjertet', ROD],
                ].map(([t, u, f]) => (
                    <div key={t} className="rounded-2xl px-6 py-3 text-white shadow-lg" style={{ background: f }}>
                        <span className="text-4xl font-black" style={FONT}>
                            {t}
                        </span>
                        <span className="text-2xl font-semibold opacity-90 ml-3">{u}</span>
                    </div>
                ))}
            </div>
            {RADER.map((r, i) => {
                const vis = beat >= i;
                const na = beat === i;
                const risiko = r.navn === 'Risiko';
                return (
                    <motion.div
                        key={r.navn}
                        initial={false}
                        animate={{ opacity: vis ? 1 : 0, x: vis ? 0 : -30, scale: na ? 1.02 : 1 }}
                        transition={{ duration: 0.6 }}
                        className="grid gap-3"
                        style={{ gridTemplateColumns: '18% 1fr 1fr' }}
                    >
                        <div
                            className="rounded-2xl flex items-center px-5 text-3xl font-black text-white"
                            style={{ ...FONT, background: risiko ? '#d97706' : '#0f172a' }}
                        >
                            {r.navn}
                        </div>
                        {[
                            [r.logos, BLA],
                            [r.patos, ROD],
                        ].map(([t, f]) => (
                            <div
                                key={t}
                                className="rounded-2xl bg-white shadow-md px-6 py-4 text-2xl font-bold text-slate-800 leading-snug"
                                style={{ borderLeft: `8px solid ${risiko ? '#d97706' : f}`, minHeight: 92 }}
                            >
                                {t}
                            </div>
                        ))}
                    </motion.div>
                );
            })}
        </div>
    );
}

export function DebattOrd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'tyv';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}>
            {modus === 'tyv' && <TyvModus beat={beat} />}
            {modus === 'skriv' && <SkrivModus beat={beat} />}
            {modus === 'ramme' && <RammeModus beat={beat} />}
            {modus === 'tabell' && <TabellModus beat={beat} />}
        </div>
    );
}
