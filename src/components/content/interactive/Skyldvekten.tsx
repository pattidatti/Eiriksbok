import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, RotateCcw, Minus, Plus, Sparkles } from 'lucide-react';

interface Power {
    id: string;
    name: string;
    note: string;
}

interface Verdict {
    id: string;
    name: string;
    year: string;
    claim: string;
    shares: Record<string, number>;
}

interface SkyldvektenProps {
    title?: string;
    intro?: string;
    powers?: Power[];
    verdicts?: Verdict[];
    disclaimer?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const DEFAULT_POWERS: Power[] = [
    { id: 'tyskland', name: 'Tyskland', note: 'Ga Østerrike-Ungarn fri støtte 5. juli' },
    { id: 'osterrike', name: 'Østerrike-Ungarn', note: 'Sendte ultimatumet og erklærte krig' },
    { id: 'serbia', name: 'Serbia', note: 'Kunne ikke godta alle de ti kravene' },
    { id: 'russland', name: 'Russland', note: 'Mobiliserte til støtte for Serbia' },
    { id: 'frankrike', name: 'Frankrike', note: 'Bundet til Russland gjennom allianse' },
    { id: 'storbritannia', name: 'Storbritannia', note: 'Gikk med da Belgia ble angrepet' },
];

const DEFAULT_VERDICTS: Verdict[] = [
    {
        id: 'versailles',
        name: 'Fredsavtalen i Versailles',
        year: '1919',
        claim: 'Tyskland og landets allierte har ansvaret for hele krigen og all skaden den førte med seg.',
        shares: { tyskland: 60, osterrike: 40, serbia: 0, russland: 0, frankrike: 0, storbritannia: 0 },
    },
    {
        id: 'fischer',
        name: 'Fritz Fischer',
        year: '1961',
        claim: 'Tyske ledere ville ha krig og planla den. Skylda ligger tyngst i Berlin.',
        shares: { tyskland: 70, osterrike: 20, serbia: 5, russland: 5, frankrike: 0, storbritannia: 0 },
    },
    {
        id: 'clark',
        name: 'Christopher Clark',
        year: '2012',
        claim: 'Ingen ville ha akkurat denne krigen. Alle tok sjanser, og til sammen gikk de i søvne inn i den.',
        shares: {
            tyskland: 20,
            osterrike: 20,
            serbia: 15,
            russland: 20,
            frankrike: 15,
            storbritannia: 10,
        },
    },
];

const TOTAL = 100;
const STEP = 5;

function emptyShares(powers: Power[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const p of powers) out[p.id] = 0;
    return out;
}

// Hvor likt er elevens fordeling og historikerens? 100 % = helt likt.
function matchPercent(a: Record<string, number>, b: Record<string, number>, powers: Power[]): number {
    let diff = 0;
    for (const p of powers) diff += Math.abs((a[p.id] ?? 0) - (b[p.id] ?? 0));
    return Math.max(0, Math.round(100 - diff / 2));
}

export function Skyldvekten({
    title = 'Skyldvekten',
    intro = 'Du har 100 ansvarspoeng. Fordel dem mellom stormaktene, og se hvilken historiker du ligner mest på.',
    powers = DEFAULT_POWERS,
    verdicts = DEFAULT_VERDICTS,
    disclaimer = 'Tallene er en forenkling laget for å vise hvor ulikt de tre svarene vekter ansvaret. Historikerne selv oppgir ikke prosenter.',
}: SkyldvektenProps) {
    const [shares, setShares] = useState<Record<string, number>>(() => emptyShares(powers));
    const [phase, setPhase] = useState<Phase>('idle');

    const used = useMemo(
        () => powers.reduce((sum, p) => sum + (shares[p.id] ?? 0), 0),
        [powers, shares]
    );
    const left = TOTAL - used;

    const results = useMemo(
        () =>
            verdicts
                .map((v) => ({ verdict: v, match: matchPercent(shares, v.shares, powers) }))
                .sort((a, b) => b.match - a.match),
        [verdicts, shares, powers]
    );

    const change = (id: string, delta: number) => {
        if (phase === 'complete') return;
        setShares((prev) => {
            const cur = prev[id] ?? 0;
            const next = Math.max(0, Math.min(cur + delta, cur + left));
            if (next === cur) return prev;
            return { ...prev, [id]: next };
        });
        if (phase === 'idle') setPhase('active');
    };

    const handleReset = () => {
        setShares(emptyShares(powers));
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Poengteller */}
            <div className="px-5 pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Poeng igjen å fordele
                </span>
                <motion.span
                    key={left}
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1 }}
                    className={`text-lg font-bold tabular-nums ${
                        left === 0 ? 'text-emerald-600' : 'text-slate-700'
                    }`}
                >
                    {left}
                </motion.span>
            </div>

            {/* Fordelingsrader */}
            <div className="px-5 py-3 space-y-2">
                {powers.map((p) => {
                    const value = shares[p.id] ?? 0;
                    return (
                        <div key={p.id} className="flex items-center gap-3">
                            <div className="w-32 sm:w-44 flex-shrink-0">
                                <p className="text-sm font-semibold text-slate-700 leading-tight">
                                    {p.name}
                                </p>
                                <p className="hidden sm:block text-[11px] text-slate-400 leading-tight">
                                    {p.note}
                                </p>
                            </div>

                            <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                                <motion.div
                                    animate={{ width: `${value}%` }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                    className="h-full bg-indigo-500 rounded-lg"
                                />
                            </div>

                            <span className="w-9 text-right text-sm font-bold tabular-nums text-slate-600">
                                {value}
                            </span>

                            <div className="flex gap-1 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => change(p.id, -STEP)}
                                    disabled={value === 0 || phase === 'complete'}
                                    aria-label={`Færre poeng til ${p.name}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => change(p.id, STEP)}
                                    disabled={left === 0 || phase === 'complete'}
                                    aria-label={`Flere poeng til ${p.name}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 transition"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pb-4">
                <AnimatePresence mode="wait">
                    {phase !== 'complete' ? (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                        >
                            {left > 0
                                ? `Fordel alle 100 poengene. Du kan gi alt til ett land eller spre dem utover.`
                                : 'Alle poengene er fordelt. Trykk «Sammenlign med historikerne».'}
                        </motion.p>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <motion.div
                                initial={{ scale: 0.94 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                            >
                                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-800">
                                    Du ligner mest på{' '}
                                    <span className="font-bold">
                                        {results[0].verdict.name} ({results[0].verdict.year})
                                    </span>
                                    . Legg merke til at alle tre svarene bygger på nøyaktig de samme
                                    hendelsene i juli 1914. Det er ikke fakta de er uenige om, men
                                    hvordan ansvaret skal veies.
                                </p>
                            </motion.div>

                            <div className="grid gap-2 sm:grid-cols-3">
                                {results.map((r, i) => (
                                    <motion.div
                                        key={r.verdict.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 * i }}
                                        className={`rounded-xl border p-3 ${
                                            i === 0
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {r.verdict.name}
                                            </p>
                                            <span className="text-xs font-semibold text-slate-400">
                                                {r.verdict.year}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                                            {r.verdict.claim}
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {powers.map((p) => (
                                                <div key={p.id} className="flex items-center gap-1.5">
                                                    <span className="w-20 text-[10px] text-slate-500 truncate">
                                                        {p.name}
                                                    </span>
                                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-slate-500 rounded-full"
                                                            style={{
                                                                width: `${r.verdict.shares[p.id] ?? 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-indigo-600">
                                            Likhet med ditt svar: {r.match} %
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            <p className="text-[11px] text-slate-400 leading-snug">{disclaimer}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setPhase('complete')}
                    disabled={left !== 0 || phase === 'complete'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Sammenlign med historikerne
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
