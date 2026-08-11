import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, RotateCcw } from 'lucide-react';

interface Step {
    id: number;
    name: string;
    category: 'visdom' | 'etikk' | 'meditasjon';
    description: string;
    insight: string;
}

const STEPS: Step[] = [
    {
        id: 1,
        name: 'Riktig syn',
        category: 'visdom',
        description:
            'Å se De fire edle sannhetene slik de er: at lidelsen finnes, at den har en årsak, og at den kan ta slutt.',
        insight: 'Du kan ikke finne veien ut før du vet hvor du står.',
    },
    {
        id: 2,
        name: 'Riktig tenkning',
        category: 'visdom',
        description:
            'Å vende tankene bort fra begjær og vond vilje, og mot velvilje for alt som lever.',
        insight: 'Handlingen begynner som en tanke.',
    },
    {
        id: 3,
        name: 'Riktig tale',
        category: 'etikk',
        description:
            'Å la være å lyve. Usannhet er en av de handlingene buddhistisk etikk krever at man holder seg unna.',
        insight: 'Ord kan bygge opp eller rive ned.',
    },
    {
        id: 4,
        name: 'Riktig handling',
        category: 'etikk',
        description:
            'Å avholde seg fra drap, tyveri og ukyskhet. Dette er kjernen i de buddhistiske levereglene.',
        insight: 'Kroppen din skal gjøre godt i verden, ikke skade.',
    },
    {
        id: 5,
        name: 'Riktig levemåte',
        category: 'etikk',
        description:
            'Å tjene til livets opphold på en måte som ikke skader andre. Yrker som bygger på drap, bedrag eller handel med rusmidler faller utenfor.',
        insight: 'Også jobben din er en etisk handling.',
    },
    {
        id: 6,
        name: 'Riktig bestrebelse',
        category: 'meditasjon',
        description:
            'Å arbeide bevisst med å svekke skadelige tanker og styrke de gode. Frigjøring krever innsats over tid.',
        insight: 'Sinnet endrer seg ikke av seg selv. Det må trenes.',
    },
    {
        id: 7,
        name: 'Riktig oppmerksomhet',
        category: 'meditasjon',
        description:
            'Å være våken for hva som skjer i kropp, følelser og tanker akkurat nå. Kalles også aktpågivenhet.',
        insight: 'Å se hva som skjer, er første skritt mot å slippe taket.',
    },
    {
        id: 8,
        name: 'Riktig konsentrasjon',
        category: 'meditasjon',
        description: 'Å samle sinnet, fra oppmerksomhet på kroppens handlinger til dyp meditasjon.',
        insight: 'Dyp ro åpner for innsikt som hverdagssinnet ikke når.',
    },
];

const CATEGORIES = {
    visdom: {
        label: 'Visdom',
        sanskrit: 'Prajna',
        header: 'bg-amber-50 border-amber-200',
        headerText: 'text-amber-700',
        card: 'border-amber-200 bg-amber-50/40 hover:bg-amber-50',
        cardRevealed: 'border-amber-300 bg-amber-50',
        iconClass: 'text-amber-500',
        insightClass: 'text-amber-600',
    },
    etikk: {
        label: 'Etikk',
        sanskrit: 'Sila',
        header: 'bg-blue-50 border-blue-200',
        headerText: 'text-blue-700',
        card: 'border-blue-200 bg-blue-50/40 hover:bg-blue-50',
        cardRevealed: 'border-blue-300 bg-blue-50',
        iconClass: 'text-blue-500',
        insightClass: 'text-blue-600',
    },
    meditasjon: {
        label: 'Meditasjon',
        sanskrit: 'Samadhi',
        header: 'bg-purple-50 border-purple-200',
        headerText: 'text-purple-700',
        card: 'border-purple-200 bg-purple-50/40 hover:bg-purple-50',
        cardRevealed: 'border-purple-300 bg-purple-50',
        iconClass: 'text-purple-500',
        insightClass: 'text-purple-600',
    },
} as const;

export function DharmahjuletUtforsker() {
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    const allRevealed = revealed.size === 8;

    const reveal = (id: number) => {
        if (!revealed.has(id)) setRevealed((prev) => new Set([...prev, id]));
    };

    const reset = () => setRevealed(new Set());

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <motion.span
                        className="text-2xl select-none leading-none"
                        animate={allRevealed ? { rotate: 360 } : { rotate: 0 }}
                        transition={
                            allRevealed ? { duration: 1.2, ease: 'easeInOut', repeat: 1 } : {}
                        }
                    >
                        ☸
                    </motion.span>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                            Den åttedelte veien
                        </h3>
                        <p className="text-xs text-slate-500">Klikk hver del for å avdekke den</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{revealed.size} / 8</span>
                    <button
                        onClick={reset}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Start på nytt"
                    >
                        <RotateCcw size={13} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-400 to-purple-400"
                    style={{ width: 0 }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${(revealed.size / 8) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-3 gap-3">
                {(
                    Object.entries(CATEGORIES) as [
                        keyof typeof CATEGORIES,
                        (typeof CATEGORIES)[keyof typeof CATEGORIES],
                    ][]
                ).map(([catKey, cat]) => (
                    <div key={catKey} className="space-y-2">
                        {/* Category header */}
                        <div className={`rounded-lg border px-3 py-2 ${cat.header}`}>
                            <div className={`text-xs font-bold ${cat.headerText}`}>{cat.label}</div>
                            <div className={`text-xs opacity-70 ${cat.headerText}`}>
                                {cat.sanskrit}
                            </div>
                        </div>

                        {/* Step cards */}
                        {STEPS.filter((s) => s.category === catKey).map((step) => {
                            const isRevealed = revealed.has(step.id);
                            return (
                                <motion.button
                                    key={step.id}
                                    onClick={() => reveal(step.id)}
                                    className={`w-full text-left rounded-lg border p-2.5 transition-colors cursor-pointer ${
                                        isRevealed ? cat.cardRevealed : cat.card
                                    }`}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5 flex-shrink-0">
                                            {isRevealed ? (
                                                <CheckCircle2 size={14} className={cat.iconClass} />
                                            ) : (
                                                <Lock size={14} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div
                                                className={`text-xs font-semibold leading-tight ${
                                                    isRevealed ? cat.headerText : 'text-slate-500'
                                                }`}
                                            >
                                                {step.id}. {step.name}
                                            </div>
                                            <AnimatePresence>
                                                {isRevealed && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.28 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                        <p
                                                            className={`text-xs mt-1 italic leading-snug ${cat.insightClass}`}
                                                        >
                                                            {step.insight}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Victory */}
            <AnimatePresence>
                {allRevealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3"
                    >
                        <span className="text-xl select-none">☸</span>
                        <div>
                            <p className="text-sm font-bold text-emerald-700">
                                Alle åtte deler avdekket!
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                Ifølge buddhistisk lære henger visdom, etikk og meditasjon sammen
                                til én vei mot nirvana.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-[11px] text-slate-400 leading-snug">
                Navn og inndeling følger Store norske leksikon, «Den åttedelte veien» og
                «Buddhisme».
            </p>
        </div>
    );
}
