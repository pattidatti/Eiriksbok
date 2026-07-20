import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Zap, Play, RotateCcw, Sparkles } from 'lucide-react';

interface SpredningsKartProps {
    title?: string;
}

type Model = 'bolge' | 'sprang';
type Phase = 'idle' | 'running' | 'done';

interface Sted {
    id: string;
    navn: string;
    x: number;
    y: number;
    by: boolean; // true = by, false = bygd
}

// Kilden der det nye trekket oppstår.
const KILDE: Sted = { id: 'oslo', navn: 'Oslo', x: 250, y: 402, by: true };

// De andre stedene. Byene ligger spredt; bygdene ligger imellom.
const STEDER: Sted[] = [
    { id: 'bergen', navn: 'Bergen', x: 116, y: 330, by: true },
    { id: 'trondheim', navn: 'Trondheim', x: 214, y: 232, by: true },
    { id: 'tromso', navn: 'Tromsø', x: 300, y: 92, by: true },
    { id: 'voss', navn: 'bygd', x: 168, y: 300, by: false },
    { id: 'hallingdal', navn: 'bygd', x: 214, y: 356, by: false },
    { id: 'oppdal', navn: 'bygd', x: 205, y: 288, by: false },
    { id: 'namdal', navn: 'bygd', x: 240, y: 176, by: false },
    { id: 'helgeland', navn: 'bygd', x: 262, y: 138, by: false },
];

const dist = (a: Sted, b: Sted) => Math.hypot(a.x - b.x, a.y - b.y);
const BYER = STEDER.filter((s) => s.by).sort((a, b) => dist(KILDE, a) - dist(KILDE, b));
const MAX_DIST = Math.max(...STEDER.map((s) => dist(KILDE, s)));

const BOLGE_MS = 3400;
const SPRANG_HOPP_MS = 850;

export function SpredningsKart({ title = 'Spredningskartet' }: SpredningsKartProps) {
    const [model, setModel] = useState<Model>('bolge');
    const [phase, setPhase] = useState<Phase>('idle');
    const [lit, setLit] = useState<Set<string>>(new Set());
    const [pulse, setPulse] = useState<{ to: Sted; key: number } | null>(null);
    const [seen, setSeen] = useState({ bolge: false, sprang: false });
    const [runId, setRunId] = useState(0);
    const timers = useRef<number[]>([]);

    const clearTimers = () => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
    };

    useEffect(() => () => clearTimers(), []);

    const resetSpread = () => {
        clearTimers();
        setLit(new Set());
        setPulse(null);
        setPhase('idle');
    };

    const handleReset = () => {
        resetSpread();
        setSeen({ bolge: false, sprang: false });
    };

    const pickModel = (m: Model) => {
        if (m === model) return;
        setModel(m);
        resetSpread();
    };

    const light = (id: string) =>
        setLit((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });

    const slippLos = () => {
        clearTimers();
        setLit(new Set());
        setPulse(null);
        setPhase('running');
        setRunId((r) => r + 1);

        if (model === 'bolge') {
            // Ringen brer seg utover. Hvert sted tar opp trekket når ringen når det —
            // nære steder først, fjerne sist. Både byer og bygder.
            STEDER.forEach((s) => {
                const t = (dist(KILDE, s) / MAX_DIST) * BOLGE_MS;
                timers.current.push(window.setTimeout(() => light(s.id), t));
            });
            timers.current.push(
                window.setTimeout(() => {
                    setPhase('done');
                    setSeen((p) => ({ ...p, bolge: true }));
                }, BOLGE_MS + 250)
            );
        } else {
            // Trekket hopper fra by til by. Bygdene imellom blir hoppet over.
            BYER.forEach((by, i) => {
                const start = i * SPRANG_HOPP_MS;
                timers.current.push(
                    window.setTimeout(() => setPulse({ to: by, key: runId * 100 + i }), start)
                );
                timers.current.push(
                    window.setTimeout(() => {
                        light(by.id);
                        setPulse(null);
                    }, start + SPRANG_HOPP_MS)
                );
            });
            timers.current.push(
                window.setTimeout(() => {
                    setPhase('done');
                    setSeen((p) => ({ ...p, sprang: true }));
                }, BYER.length * SPRANG_HOPP_MS + 250)
            );
        }
    };

    const bothSeen = seen.bolge && seen.sprang;
    const ringMax = MAX_DIST + 34;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Waves className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en modell og slipp et nytt dialekttrekk løs fra Oslo. Se hvordan det brer
                        seg.
                    </p>
                </div>
            </div>

            {/* Modellvelger */}
            <div className="px-6 pt-4 flex gap-2">
                {(
                    [
                        { id: 'bolge', navn: 'Bølgemodellen', ikon: Waves },
                        { id: 'sprang', navn: 'Sprangmodellen', ikon: Zap },
                    ] as const
                ).map((m) => {
                    const active = model === m.id;
                    const Ikon = m.ikon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => pickModel(m.id)}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                                active
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            <Ikon className="w-4 h-4" />
                            {m.navn}
                        </button>
                    );
                })}
            </div>

            {/* Kart */}
            <div className="px-6 pt-4">
                <div className="relative mx-auto max-w-[420px]">
                    <svg
                        viewBox="0 0 400 480"
                        className="w-full h-auto rounded-lg bg-gradient-to-b from-sky-50 to-blue-50"
                    >
                        {/* Stilisert landmasse */}
                        <path
                            d="M250 452 C 150 452 120 400 150 350 C 120 330 150 300 160 288 C 130 260 175 230 195 250 C 175 200 205 150 235 165 C 250 110 285 70 312 78 C 340 96 320 150 300 175 C 320 210 270 250 258 262 C 285 300 255 340 262 360 C 300 380 300 440 250 452 Z"
                            fill="#eef4ec"
                            stroke="#d5e2d3"
                            strokeWidth="2"
                        />

                        {/* Faste forbindelseslinjer by-til-by (svake, kun synlige i sprang) */}
                        {model === 'sprang' &&
                            BYER.map((by) => (
                                <line
                                    key={`ln-${by.id}`}
                                    x1={KILDE.x}
                                    y1={KILDE.y}
                                    x2={by.x}
                                    y2={by.y}
                                    stroke="#c7b3f0"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                />
                            ))}

                        {/* Bølgeringen som brer seg utover fra kilden */}
                        <AnimatePresence>
                            {model === 'bolge' && phase === 'running' && (
                                <motion.circle
                                    key={`ring-${runId}`}
                                    cx={KILDE.x}
                                    cy={KILDE.y}
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="3"
                                    initial={{ r: 0, opacity: 0.55 }}
                                    animate={{ r: ringMax, opacity: 0 }}
                                    transition={{ duration: BOLGE_MS / 1000, ease: 'linear' }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Sprang-pulsen som hopper fra kilden til en by */}
                        <AnimatePresence>
                            {pulse && (
                                <motion.circle
                                    key={`pulse-${pulse.key}`}
                                    r={6}
                                    fill="#7c3aed"
                                    initial={{ cx: KILDE.x, cy: KILDE.y }}
                                    animate={{ cx: pulse.to.x, cy: pulse.to.y }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: SPRANG_HOPP_MS / 1000, ease: 'easeInOut' }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Steder */}
                        {[KILDE, ...STEDER].map((s) => {
                            const isLit = s.id === KILDE.id || lit.has(s.id);
                            const r = s.by ? 9 : 5.5;
                            const litFill = s.by ? '#4f46e5' : '#22c55e';
                            return (
                                <g key={s.id}>
                                    <motion.circle
                                        cx={s.x}
                                        cy={s.y}
                                        r={r}
                                        animate={{
                                            scale: isLit ? 1 : 0.9,
                                            fill: isLit ? litFill : '#cbd5e1',
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                        style={{ originX: `${s.x}px`, originY: `${s.y}px` }}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                    />
                                    {s.by && (
                                        <text
                                            x={s.x}
                                            y={s.y - 14}
                                            textAnchor="middle"
                                            className="fill-slate-600"
                                            style={{ fontSize: 13, fontWeight: 600 }}
                                        >
                                            {s.navn}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Tegnforklaring */}
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" /> By
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{' '}
                            Bygd
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />{' '}
                            Har ikke trekket
                        </span>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'done' && !bothSeen && (
                        <motion.div
                            key={model}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            {model === 'bolge' ? (
                                <>
                                    <strong>Bølgemodellen:</strong> trekket brer seg som ringer i
                                    vann. Nabo tar det opp etter nabo — også bygdene. De nære stedene
                                    får trekket først, de fjerne sist. Prøv sprangmodellen og se
                                    forskjellen.
                                </>
                            ) : (
                                <>
                                    <strong>Sprangmodellen:</strong> trekket hopper fra by til by og
                                    hopper rett over bygdene imellom. Derfor kan Oslo og Tromsø dele
                                    et trekk som bygdene mellom dem ikke har.
                                </>
                            )}
                        </motion.div>
                    )}

                    {bothSeen && (
                        <motion.div
                            key="both"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2"
                        >
                            <Sparkles className="w-5 h-5 shrink-0 text-emerald-500" />
                            <span>
                                <strong>To modeller, to mønstre.</strong> Bølgemodellen forklarer de
                                myke overgangene fra bygd til bygd. Sprangmodellen forklarer hvorfor
                                byene ligner hverandre mens bygdene imellom henger igjen. I dag, med
                                mobil og internett, hopper trekk stadig oftere i sprang.
                            </span>
                        </motion.div>
                    )}

                    {phase !== 'done' && (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400"
                        >
                            {phase === 'running'
                                ? 'Trekket sprer seg …'
                                : 'Trykk «Slipp trekket løs» for å se modellen i arbeid.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    onClick={slippLos}
                    disabled={phase === 'running'}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Slipp trekket løs
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
