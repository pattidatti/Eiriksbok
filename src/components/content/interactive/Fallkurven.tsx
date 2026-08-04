import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, RotateCcw, Lightbulb, Check } from 'lucide-react';

interface Measure {
    id: string;
    label: string;
    short: string;
    /* Fem verdier, 0-100, for arene i YEARS. 100 = hoyeste nivaet malestokken nadde. */
    points: number[];
    verdictLabel: string;
    tone: 'fall' | 'vekst';
    note: string;
}

interface FallkurvenProps {
    title?: string;
    intro?: string;
    measures?: Measure[];
    payoff?: string;
    disclaimer?: string;
}

const YEARS = [150, 300, 400, 500, 600];
const FALL_YEAR = 476;

const DEFAULT_MEASURES: Measure[] = [
    {
        id: 'bly',
        label: 'Blyforurensning i Grønlandsisen',
        short: 'Bly i isen',
        points: [100, 25, 20, 15, 12],
        verdictLabel: 'Falt 300 år før 476',
        tone: 'fall',
        note: 'Bly i isbreene måler hvor mye sølv og bly romerne gravde ut, altså hvor mye økonomien gikk. Toppen kom i det første og andre århundret. Utslippene stupte da antoninerpesten kom rundt år 165, og holdt seg lave i over 500 år (McConnell mfl., 2018).',
    },
    {
        id: 'keramikk',
        label: 'Dreid keramikk i Britannia',
        short: 'Keramikk i Britannia',
        points: [100, 95, 35, 0, 0],
        verdictLabel: 'Falt rundt 476',
        tone: 'fall',
        note: 'Kunsten å lage keramikk på dreieskive forsvant fra Britannia tidlig på 400-tallet, og kom ikke tilbake på nesten 300 år. Folk der fikk dårligere ting enn de hadde hatt før romerne kom (Ward-Perkins, 2005).',
    },
    {
        id: 'roma',
        label: 'Folketallet i Roma by',
        short: 'Roma bys folketall',
        points: [100, 70, 53, 7, 3],
        verdictLabel: 'Falt 60 år etter 476',
        tone: 'fall',
        note: 'I år 150 kan Roma ha hatt 1 500 000 innbyggere. Nedgangen begynte da keiseren flyttet til Konstantinopel i 330. De verste ødeleggelsene kom under Justinians kriger i 534-553, da akveduktene ble brutt. Da var byen nede i rundt 50 000 (Lima, 2026).',
    },
    {
        id: 'kirker',
        label: 'Nye steinkirker i Roma',
        short: 'Nye kirker i Roma',
        points: [0, 30, 100, 60, 45],
        verdictLabel: 'Steg mens riket falt',
        tone: 'vekst',
        note: 'Peterskirken ble innviet i 326. Santa Maria Maggiore, Santa Sabina og Santo Stefano Rotondo ble alle reist på 400-tallet. Det ble bygd nye basilikaer i Roma nettopp i tiårene da riket skal ha falt (Prusac Lindhagen, 2021).',
    },
];

/* Diagram-geometri i viewBox-koordinater. */
const W = 320;
const H = 176;
const PAD_L = 30;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;

const px = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (YEARS.length - 1);
const py = (v: number) => PAD_T + ((100 - v) / 100) * (H - PAD_T - PAD_B);

/* x-posisjonen til ar 476, interpolert mellom 400 og 500. */
const FALL_X = px(2) + ((FALL_YEAR - YEARS[2]) / (YEARS[3] - YEARS[2])) * (px(3) - px(2));

const toPath = (points: number[]) => points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');

/* Hvor likt tegnet eleven? 100 % = helt likt. */
function matchPercent(drawn: number[], real: number[]): number {
    const diff = real.reduce((sum, v, i) => sum + Math.abs(v - drawn[i]), 0);
    return Math.max(0, Math.round(100 - diff / real.length));
}

export function Fallkurven({
    title = 'Fallkurven',
    intro = 'Tegn hvordan du tror det gikk, og se hva forskerne har målt. Bytt målestokk med knappene.',
    measures = DEFAULT_MEASURES,
    payoff = 'Fire målestokker, samme århundrer, fire helt ulike svar. Ingen av dem har vendepunktet sitt i år 476. Derfor er historikerne uenige om Romerriket falt.',
    disclaimer = 'Kurvene er grove anslag, tegnet for å vise formen, ikke eksakte målinger. Det som er sikkert belagt, står i notatet under hver målestokk.',
}: FallkurvenProps) {
    const [activeId, setActiveId] = useState(measures[0].id);
    const [drawn, setDrawn] = useState<Record<string, number[]>>(() => {
        const start: Record<string, number[]> = {};
        for (const m of measures) start[m.id] = YEARS.map(() => 50);
        return start;
    });
    const [revealed, setRevealed] = useState<string[]>([]);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const active = measures.find((m) => m.id === activeId) ?? measures[0];
    const isRevealed = revealed.includes(active.id);
    const allRevealed = revealed.length === measures.length;

    const match = useMemo(
        () => matchPercent(drawn[active.id] ?? [], active.points),
        [drawn, active]
    );

    /* Gjor om en peker-hendelse til en verdi 0-100 pa det handtaket som dras. */
    const applyPointer = (clientX: number, clientY: number, index: number) => {
        const svg = svgRef.current;
        if (!svg) return;
        const box = svg.getBoundingClientRect();
        const y = ((clientY - box.top) / box.height) * H;
        const raw = 100 - ((y - PAD_T) / (H - PAD_T - PAD_B)) * 100;
        const value = Math.max(0, Math.min(100, Math.round(raw / 5) * 5));
        // clientX brukes ikke: handtakene star fast i x-retning, eleven drar bare opp og ned.
        void clientX;
        setDrawn((prev) => {
            const next = [...(prev[active.id] ?? [])];
            if (next[index] === value) return prev;
            next[index] = value;
            return { ...prev, [active.id]: next };
        });
    };

    const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
        if (isRevealed) return;
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setDragIndex(index);
        applyPointer(e.clientX, e.clientY, index);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragIndex === null || isRevealed) return;
        applyPointer(e.clientX, e.clientY, dragIndex);
    };

    const endDrag = () => setDragIndex(null);

    const handleReveal = () => {
        if (isRevealed) return;
        setRevealed((prev) => [...prev, active.id]);
    };

    const handleReset = () => {
        const start: Record<string, number[]> = {};
        for (const m of measures) start[m.id] = YEARS.map(() => 50);
        setDrawn(start);
        setRevealed([]);
        setActiveId(measures[0].id);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <LineChart className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Malestokk-velger */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {measures.map((m) => {
                    const done = revealed.includes(m.id);
                    const isActive = m.id === active.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setActiveId(m.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {done && (
                                <Check
                                    className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`}
                                />
                            )}
                            {m.short}
                        </button>
                    );
                })}
            </div>

            {/* Diagram */}
            <div className="px-5 pt-3">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto select-none"
                    style={{ touchAction: 'none' }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerLeave={endDrag}
                    onPointerCancel={endDrag}
                    role="img"
                    aria-label={`Diagram: ${active.label}. Dra punktene for å tegne din egen kurve.`}
                >
                    {/* Vannrette hjelpelinjer */}
                    {[0, 25, 50, 75, 100].map((v) => (
                        <g key={v}>
                            <line
                                x1={PAD_L}
                                y1={py(v)}
                                x2={W - PAD_R}
                                y2={py(v)}
                                stroke="#e2e8f0"
                                strokeWidth={1}
                            />
                            <text x={PAD_L - 6} y={py(v) + 3} textAnchor="end" fontSize={7} fill="#94a3b8">
                                {v}
                            </text>
                        </g>
                    ))}

                    {/* 476-markoren */}
                    <line
                        x1={FALL_X}
                        y1={PAD_T - 4}
                        x2={FALL_X}
                        y2={H - PAD_B}
                        stroke="#f43f5e"
                        strokeWidth={1.2}
                        strokeDasharray="3 3"
                    />
                    <text x={FALL_X} y={PAD_T - 6} textAnchor="middle" fontSize={7.5} fill="#f43f5e" fontWeight="bold">
                        476
                    </text>

                    {/* Arstall pa x-aksen */}
                    {YEARS.map((year, i) => (
                        <text
                            key={year}
                            x={px(i)}
                            y={H - PAD_B + 12}
                            textAnchor="middle"
                            fontSize={7.5}
                            fill="#94a3b8"
                        >
                            {year}
                        </text>
                    ))}

                    {/* Elevens kurve */}
                    <motion.path
                        d={toPath(drawn[active.id] ?? [])}
                        fill="none"
                        stroke={isRevealed ? '#c7d2fe' : '#6366f1'}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ opacity: isRevealed ? 0.65 : 1 }}
                    />

                    {/* Fasitkurven */}
                    <AnimatePresence>
                        {isRevealed && (
                            <motion.path
                                key={`real-${active.id}`}
                                d={toPath(active.points)}
                                fill="none"
                                stroke={active.tone === 'vekst' ? '#059669' : '#e11d48'}
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Drahandtak */}
                    {(drawn[active.id] ?? []).map((v, i) => (
                        <g key={i}>
                            {!isRevealed && (
                                <circle
                                    cx={px(i)}
                                    cy={py(v)}
                                    r={11}
                                    fill="transparent"
                                    style={{ cursor: 'ns-resize' }}
                                    onPointerDown={handlePointerDown(i)}
                                />
                            )}
                            <motion.circle
                                cx={px(i)}
                                cy={py(v)}
                                r={dragIndex === i ? 5.5 : 4}
                                fill="#ffffff"
                                stroke={isRevealed ? '#c7d2fe' : '#6366f1'}
                                strokeWidth={2.2}
                                pointerEvents="none"
                                animate={{ opacity: isRevealed ? 0.65 : 1 }}
                            />
                        </g>
                    ))}
                </svg>
                <p className="mt-1 text-[11px] text-slate-400">
                    Loddrett: hvor mye som er igjen, i prosent av det høyeste nivået. Vannrett: år etter Kristus.
                </p>
            </div>

            {/* Fasit og forklaring */}
            <div className="px-5 pb-4 pt-2">
                <AnimatePresence mode="wait">
                    {!isRevealed ? (
                        <motion.p
                            key={`hint-${active.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                        >
                            Dra de fem punktene opp og ned. Hvordan tror du det gikk med {active.label.toLowerCase()}? Trykk «Vis fasit» når du er fornøyd.
                        </motion.p>
                    ) : (
                        <motion.div
                            key={`result-${active.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <motion.div
                                initial={{ scale: 0.94 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                className={`rounded-xl border px-4 py-3 ${
                                    active.tone === 'vekst'
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-rose-50 border-rose-200'
                                }`}
                            >
                                <div className="flex items-baseline justify-between gap-3">
                                    <p
                                        className={`text-sm font-bold ${
                                            active.tone === 'vekst' ? 'text-emerald-800' : 'text-rose-800'
                                        }`}
                                    >
                                        {active.verdictLabel}
                                    </p>
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                                        Treff: {match} %
                                    </span>
                                </div>
                                <p
                                    className={`mt-1 text-sm leading-snug ${
                                        active.tone === 'vekst' ? 'text-emerald-900' : 'text-rose-900'
                                    }`}
                                >
                                    {active.note}
                                </p>
                            </motion.div>

                            {allRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                                >
                                    <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-900 leading-snug">{payoff}</p>
                                </motion.div>
                            )}

                            <p className="text-[11px] text-slate-400 leading-snug">{disclaimer}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={handleReveal}
                    disabled={isRevealed}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    {isRevealed ? 'Fasit vist' : 'Vis fasit'}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
