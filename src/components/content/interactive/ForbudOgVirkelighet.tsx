import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, Eye, Sparkles, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal forstå at et forbud på papiret ikke er det
// samme som frihet i virkeligheten. Eleven drar et årstall gjennom hundre år
// og ser hele tida to ting ved siden av hverandre: hva loven sa, og hva som
// faktisk skjedde. Avstanden mellom de to kortene ER poenget.

interface Milepael {
    year: string;
    title: string;
    law: string;
    reality: string;
}

interface ForbudOgVirkelighetProps {
    title?: string;
    hint?: string;
    milestones: Milepael[];
    payoff?: string;
}

type Phase = 'idle' | 'active' | 'complete';

export function ForbudOgVirkelighet({
    title = 'Forbudet og virkeligheten',
    hint = 'Dra årstallet bortover. Se hva loven sa - og hva som faktisk skjedde.',
    milestones,
    payoff = 'Hver gang loven tok et steg, tok virkeligheten kortere steg. Et forbud er en begynnelse, ikke en slutt.',
}: ForbudOgVirkelighetProps) {
    const [index, setIndex] = useState(0);
    const [visited, setVisited] = useState<number[]>([0]);

    const siste = milestones.length - 1;
    const aktiv = milestones[Math.min(index, siste)];
    const alleSett = visited.length === milestones.length;
    const phase: Phase = alleSett ? 'complete' : visited.length > 1 ? 'active' : 'idle';

    const velg = (i: number) => {
        setIndex(i);
        setVisited((v) => (v.includes(i) ? v : [...v, i]));
    };

    const handleReset = () => {
        setIndex(0);
        setVisited([0]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{hint}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: årstallet */}
            <div className="px-6 pt-6">
                <div className="flex items-baseline gap-3 mb-3">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={aktiv.year}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="font-display text-4xl font-bold text-slate-800 tabular-nums"
                        >
                            {aktiv.year}
                        </motion.span>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={aktiv.title}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm font-medium text-slate-500"
                        >
                            {aktiv.title}
                        </motion.span>
                    </AnimatePresence>
                </div>

                <input
                    type="range"
                    min={0}
                    max={siste}
                    step={1}
                    value={index}
                    onChange={(e) => velg(Number(e.target.value))}
                    aria-label="Velg årstall"
                    className="w-full accent-indigo-600 cursor-pointer"
                />

                {/* Milepæl-prikker: viser hvor langt eleven har kommet */}
                <div className="flex justify-between mt-2 mb-5">
                    {milestones.map((m, i) => (
                        <button
                            key={m.year}
                            onClick={() => velg(i)}
                            aria-label={`Gå til ${m.year}`}
                            className="group flex flex-col items-center gap-1 px-1"
                        >
                            <motion.span
                                animate={{ scale: i === index ? 1.4 : 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className={`block w-2.5 h-2.5 rounded-full ${
                                    visited.includes(i) ? 'bg-indigo-500' : 'bg-slate-300'
                                }`}
                            />
                            <span
                                className={`text-[10px] tabular-nums ${
                                    i === index
                                        ? 'text-indigo-600 font-bold'
                                        : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                            >
                                {m.year}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* De to sannhetene side om side */}
            <div className="px-6 grid gap-3 sm:grid-cols-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`lov-${aktiv.year}`}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 14 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                På papiret
                            </span>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed">{aktiv.law}</p>
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`ekte-${aktiv.year}`}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <Eye className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                I virkeligheten
                            </span>
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed">{aktiv.reality}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <motion.span
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5" />
                            </motion.span>
                            <span>{payoff}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="venter"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Du har sett {visited.length} av {milestones.length} årstall. Dra videre
                            for å se resten.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    onClick={() => velg(Math.min(index + 1, siste))}
                    disabled={index === siste}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        index === siste
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    Neste årstall
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
