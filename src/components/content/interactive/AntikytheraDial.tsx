import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, Sun, Moon, RotateCcw, Sparkles } from 'lucide-react';

interface AntikytheraDialProps {
    title?: string;
    intro?: string;
}

// Lyspære-øyeblikket:
// Etter denne interaksjonen skal eleven forstå at ETT tak på sveiva driver
// både sola og månen - men månen mye fortere - fordi tannhjulene har ulik
// størrelse. Nettopp det gjorde at maskinen kunne spå hvor sol og måne var,
// til og med formørkelser, år fram i tid.
//
// Månen går rundt jorda rundt 13 ganger i løpet av det året sola bruker på én
// runde. Vi lar derfor måneviseren gå 13 ganger så fort som solviseren.

const YEAR_MONTHS = 12;
const MOON_LAPS_PER_YEAR = 13;

export function AntikytheraDial({
    title = 'Vri tidshjulet',
    intro = 'Dra i sveiva og se maskinen flytte både sola og månen på én gang.',
}: AntikytheraDialProps) {
    const [months, setMonths] = useState(0);
    const [auto, setAuto] = useState(false);

    // Solviseren: én runde (360 grader) på et helt år.
    const sunAngle = (months / YEAR_MONTHS) * 360;
    // Måneviseren: 13 runder på samme år.
    const moonAngle = (months / YEAR_MONTHS) * 360 * MOON_LAPS_PER_YEAR;

    const sunLaps = months / YEAR_MONTHS;
    const moonLaps = (months / YEAR_MONTHS) * MOON_LAPS_PER_YEAR;
    const newMoons = Math.floor(moonLaps - sunLaps);

    // Fasen utledes direkte av tiden - ingen egen state å holde i synk.
    const phase: 'idle' | 'active' | 'complete' =
        months >= YEAR_MONTHS - 0.01 ? 'complete' : months > 0 ? 'active' : 'idle';

    // Auto-spol ett helt år med jevn framdrift.
    useEffect(() => {
        if (!auto) return;
        let raf = 0;
        const step = () => {
            setMonths((m) => {
                const next = Math.min(YEAR_MONTHS, m + 0.09);
                if (next >= YEAR_MONTHS) {
                    setAuto(false);
                    return YEAR_MONTHS;
                }
                raf = requestAnimationFrame(step);
                return next;
            });
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [auto]);

    const onSlide = (v: number) => {
        setAuto(false);
        setMonths(v);
    };

    const handleReset = () => {
        setAuto(false);
        setMonths(0);
    };

    const feedback =
        phase === 'complete'
            ? 'Ett helt år: sola gikk 1 runde, månen 13. Ulik fart, samme sveiv.'
            : months === 0
              ? 'Sett i gang: dra spaken, eller trykk «Spol ett år».'
              : `Se forskjellen: måneviseren spinner mens solviseren så vidt beveger seg.`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Cog className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6 flex flex-col items-center">
                <div className="relative w-60 h-60 select-none">
                    {/* Urskive / stjernehimmel */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-50 to-slate-100 border-2 border-amber-200 shadow-inner" />
                    {/* 12 tannhakk rundt kanten */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const a = (i / 12) * Math.PI * 2;
                        const r = 110;
                        return (
                            <div
                                key={i}
                                className="absolute w-1.5 h-3 rounded-full bg-amber-300"
                                style={{
                                    left: `calc(50% + ${Math.sin(a) * r}px - 3px)`,
                                    top: `calc(50% - ${Math.cos(a) * r}px - 6px)`,
                                }}
                            />
                        );
                    })}

                    {/* Formørkelses-port øverst */}
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 flex flex-col items-center">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-400">
                            Port
                        </div>
                    </div>

                    {/* Solviseren */}
                    <motion.div
                        className="absolute left-1/2 top-1/2 origin-bottom"
                        style={{ width: 6, height: 96, marginLeft: -3, marginTop: -96 }}
                        animate={{ rotate: sunAngle }}
                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    >
                        <div className="w-1.5 h-full mx-auto rounded-full bg-amber-400" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                    </motion.div>

                    {/* Måneviseren */}
                    <motion.div
                        className="absolute left-1/2 top-1/2 origin-bottom"
                        style={{ width: 6, height: 78, marginLeft: -3, marginTop: -78 }}
                        animate={{ rotate: moonAngle }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    >
                        <div className="w-1 h-full mx-auto rounded-full bg-slate-400" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center shadow-md">
                            <Moon className="w-4 h-4 text-slate-600" />
                        </div>
                    </motion.div>

                    {/* Nav i midten */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 border-2 border-amber-200 shadow" />
                </div>

                {/* Sveiva (slider) */}
                <div className="w-full mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Vri sveiva</span>
                        <span>{Math.round(months)} av 12 måneder</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={YEAR_MONTHS}
                        step={0.05}
                        value={months}
                        onChange={(e) => onSlide(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                        aria-label="Vri sveiva for å flytte tiden framover"
                    />
                </div>

                {/* Live tellere */}
                <div className="grid grid-cols-3 gap-2 w-full mt-4">
                    <Counter icon={<Sun className="w-4 h-4" />} label="Solrunder" value={sunLaps.toFixed(1)} tint="amber" />
                    <Counter icon={<Moon className="w-4 h-4" />} label="Månerunder" value={moonLaps.toFixed(1)} tint="slate" />
                    <Counter icon={<Sparkles className="w-4 h-4" />} label="Nymåner" value={String(newMoons)} tint="indigo" />
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            phase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feedback}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Payoff ved fullført år */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm"
                    >
                        Ett tak på sveiva flyttet både sola og månen - men månen 13 ganger så fort. Det er
                        fordi et lite tannhjul spinner fort og et stort spinner sakte. Nettopp slik kunne
                        Antikythera-mekanismen regne ut hvor sol og måne ville stå, og til og med spå
                        formørkelser, år fram i tid.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={() => {
                        if (months >= YEAR_MONTHS - 0.01) handleReset();
                        setAuto(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Spol ett år
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function Counter({
    icon,
    label,
    value,
    tint,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tint: 'amber' | 'slate' | 'indigo';
}) {
    const tints = {
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        slate: 'bg-slate-50 border-slate-200 text-slate-600',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    };
    return (
        <div className={`rounded-lg border px-2 py-2 text-center ${tints[tint]}`}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                {icon}
                {label}
            </div>
            <div className="text-lg font-bold tabular-nums">{value}</div>
        </div>
    );
}
