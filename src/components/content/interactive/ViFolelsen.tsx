import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Languages,
    BookOpen,
    Flag,
    Music,
    Map,
    Crown,
    Swords,
    RotateCcw,
    Sparkles,
    TriangleAlert,
} from 'lucide-react';

interface Ingredient {
    id: string;
    label: string;
    weight: number;
    Icon: React.ComponentType<{ className?: string }>;
    // Splitter-ingrediens: samler folk raskt, men ved å stenge andre ute.
    warning?: boolean;
    note: string;
}

const INGREDIENTS: Ingredient[] = [
    { id: 'sprak', label: 'Felles språk', weight: 16, Icon: Languages, note: 'Når folk snakker samme språk, føles de som ett folk.' },
    { id: 'historie', label: 'Felles historie', weight: 15, Icon: BookOpen, note: 'En felles fortid gir folk en følelse av å høre sammen.' },
    { id: 'symboler', label: 'Flagg og symboler', weight: 15, Icon: Flag, note: 'Flagget er et bilde alle kan samle seg om.' },
    { id: 'sang', label: 'Nasjonalsang', weight: 13, Icon: Music, note: 'Å synge det samme gir en sterk vi-følelse.' },
    { id: 'land', label: 'Felles land', weight: 13, Icon: Map, note: 'Et land med grenser gir folket et sted som er "vårt".' },
    { id: 'helter', label: 'Helter og myter', weight: 13, Icon: Crown, note: 'Felles helter og fortellinger binder folk sammen.' },
    { id: 'fiende', label: 'Felles fiende', weight: 24, Icon: Swords, warning: true, note: 'En felles fiende samler folk lynraskt, men bare ved å peke ut noen som ikke hører til.' },
];

const BORN_AT = 70;

type Phase = 'idle' | 'building' | 'complete';

interface ViFolelsenProps {
    title?: string;
}

export function ViFolelsen({ title = 'Hva skaper en nasjon?' }: ViFolelsenProps) {
    const [added, setAdded] = useState<Set<string>>(new Set());
    const [lastId, setLastId] = useState<string | null>(null);

    const meter = useMemo(() => {
        let sum = 0;
        for (const ing of INGREDIENTS) if (added.has(ing.id)) sum += ing.weight;
        return Math.min(100, sum);
    }, [added]);

    const phase: Phase = meter >= BORN_AT ? 'complete' : added.size > 0 ? 'building' : 'idle';
    const lastIng = INGREDIENTS.find((i) => i.id === lastId) ?? null;
    const usedFiende = added.has('fiende');

    const toggle = (ing: Ingredient) => {
        setAdded((prev) => {
            const next = new Set(prev);
            if (next.has(ing.id)) next.delete(ing.id);
            else next.add(ing.id);
            return next;
        });
        setLastId(ing.id);
    };

    const reset = () => {
        setAdded(new Set());
        setLastId(null);
    };

    // Fargen på måleren skifter fra grå til grønn etter hvert som vi-følelsen vokser.
    const barColor =
        phase === 'complete' ? 'bg-emerald-500' : meter > 35 ? 'bg-indigo-500' : 'bg-slate-400';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk på det folk deler, og se vi-følelsen vokse.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate: ingredienskort */}
            <div className="p-6 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {INGREDIENTS.map((ing) => {
                        const on = added.has(ing.id);
                        const Icon = ing.Icon;
                        const activeStyle = ing.warning
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-700';
                        return (
                            <motion.button
                                key={ing.id}
                                onClick={() => toggle(ing)}
                                whileTap={{ scale: 0.94 }}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                                    on
                                        ? activeStyle + ' shadow-sm'
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <span
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        on
                                            ? ing.warning
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-indigo-500 text-white'
                                            : 'bg-white text-slate-400 border border-slate-200'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </span>
                                <span className="text-xs font-semibold leading-tight">{ing.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Vi-følelse-måler */}
            <div className="px-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                    <span>Vi-følelse</span>
                    <span className={phase === 'complete' ? 'text-emerald-600' : 'text-slate-600'}>
                        {meter}%
                    </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        animate={{ width: `${meter}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-6 pt-4 pb-2 min-h-[76px]">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800"
                        >
                            <div className="flex items-center gap-2 font-semibold text-emerald-700">
                                <Sparkles className="w-4 h-4" />
                                En nasjon er født!
                            </div>
                            <p className="mt-1 leading-snug">
                                Folk som deler språk, historie og symboler, kjenner seg som ett folk.
                                {usedFiende
                                    ? ' Men merk: en felles fiende samler raskt ved å stenge andre ute. Den samme følelsen kan både forene og splitte.'
                                    : ' Det er denne følelsen vi kaller nasjonalisme.'}
                            </p>
                        </motion.div>
                    ) : lastIng ? (
                        <motion.div
                            key={lastIng.id + (added.has(lastIng.id) ? '-on' : '-off')}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg px-4 py-3 text-sm border ${
                                lastIng.warning && added.has(lastIng.id)
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {lastIng.warning && added.has(lastIng.id) && (
                                    <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="leading-snug">
                                    {added.has(lastIng.id)
                                        ? lastIng.note
                                        : `Du fjernet "${lastIng.label}". Vi-følelsen synker.`}
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400 italic px-1 py-3"
                        >
                            Velg det folk har felles. Hvor mye skal til før en nasjon blir til?
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {phase === 'complete'
                        ? 'Prøv uten "felles fiende" og se hva som skjer.'
                        : `${added.size} valgt`}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
