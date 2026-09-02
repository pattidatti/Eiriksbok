import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drum, Archive, Sparkles, Home, RotateCcw, Check } from 'lucide-react';

// Lyspære-øyeblikket:
// "Etter denne interaksjonen skal eleven forstå at den samme trommen er to helt
// forskjellige ting på én gang - et nummerert objekt i en samling og en levende
// hellig gjenstand - og at det er nettopp derfor det betyr så mye at den kom hjem."

interface Stopp {
    year: string;
    place: string;
    headline: string;
    // Slik ble trommen sett på av dem som eide den i samlingen
    samling: string;
    // Slik ble den sett på av dem den ble tatt fra
    eiere: string;
    home?: boolean;
}

interface TrommensReiseProps {
    title?: string;
    lead?: string;
    stops: Stopp[];
    conclusion?: string;
}

export function TrommensReise({
    title = 'Trommens reise',
    lead = 'Klikk deg gjennom stoppene. Se hva den samme trommen var - to steder samtidig.',
    stops,
    conclusion = 'Samme tromme. To helt ulike svar på hva den er. Derfor handler en tilbakeføring om mer enn et objekt som bytter hylle.',
}: TrommensReiseProps) {
    const [active, setActive] = useState<number | null>(null);
    const [visited, setVisited] = useState<number[]>([]);

    const allDone = visited.length === stops.length && stops.length > 0;
    const current = active !== null ? stops[active] : null;

    const handlePick = (i: number) => {
        setActive(i);
        setVisited((v) => (v.includes(i) ? v : [...v, i]));
    };

    const handleReset = () => {
        setActive(null);
        setVisited([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Drum className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{lead}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: stoppene */}
            <div className="px-6 pt-5">
                <div className="flex flex-wrap gap-2">
                    {stops.map((s, i) => {
                        const isActive = active === i;
                        const isDone = visited.includes(i);
                        return (
                            <motion.button
                                key={s.year + s.place}
                                onClick={() => handlePick(i)}
                                whileTap={{ scale: 0.96 }}
                                animate={{
                                    scale: isActive ? 1.03 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                                className={`flex-1 min-w-[120px] text-left rounded-xl border px-3 py-2.5 transition-colors ${
                                    isActive
                                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                        : isDone
                                          ? 'bg-emerald-50 border-emerald-200 hover:shadow-md'
                                          : 'bg-slate-50 border-slate-200 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`text-xs font-bold ${
                                            isActive ? 'text-indigo-700' : 'text-slate-500'
                                        }`}
                                    >
                                        {s.year}
                                    </span>
                                    {isDone && !isActive && (
                                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    )}
                                    {s.home && (
                                        <Home className="w-3 h-3 text-amber-600 shrink-0" />
                                    )}
                                </div>
                                <div
                                    className={`text-sm font-medium leading-tight ${
                                        isActive ? 'text-indigo-900' : 'text-slate-700'
                                    }`}
                                >
                                    {s.place}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* To blikk på samme tromme */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {current ? (
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                        >
                            <p className="text-sm font-semibold text-slate-800 mb-3">
                                {current.headline}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Archive className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Som samlingen ser den
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {current.samling}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                            Som eierne ser den
                                        </span>
                                    </div>
                                    <p className="text-sm text-amber-900 leading-relaxed">
                                        {current.eiere}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-400 italic py-6 text-center"
                        >
                            Velg et stopp over for å se de to blikkene på trommen.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {allDone ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                className="shrink-0 mt-0.5"
                            >
                                <Home className="w-4 h-4 text-emerald-600" />
                            </motion.span>
                            <span className="leading-relaxed">{conclusion}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="teller"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Du har sett {visited.length} av {stops.length} stopp.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                    {stops.map((s, i) => (
                        <motion.span
                            key={s.year + s.place}
                            animate={{
                                scale: visited.includes(i) ? 1 : 0.72,
                            }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                visited.includes(i) ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
