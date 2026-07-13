import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mountain,
    Pickaxe,
    Flame,
    Coins,
    Crown,
    Landmark,
    RotateCcw,
    Sparkles,
} from 'lucide-react';

interface SolvetsReiseProps {
    title?: string;
}

// Signaturkomponent for artikkelen om Christian IV og sølvet på Kongsberg.
// Lyspære-øyeblikket: sølvet i fjellet ga kongen penger, og pengene ga makt.
// Eleven bygger verdikjeden i riktig rekkefølge og ser kongens rikdom vokse
// for hvert steg. Da sitter innsikten igjen: en naturressurs ble til kongemakt.

type Phase = 'building' | 'complete';

interface Stage {
    id: string;
    label: string;
    detail: string;
    wealth: number;
    Icon: typeof Mountain;
}

// Riktig rekkefølge på sølvets reise fra fjell til kongemakt.
const STAGES: Stage[] = [
    {
        id: 'aare',
        label: 'Sølvåre i fjellet',
        detail: 'Dypt inne i fjellet ved Kongsberg ligger årer av rent sølv i berget.',
        wealth: 0,
        Icon: Mountain,
    },
    {
        id: 'gruve',
        label: 'Gruvearbeiderne hakker',
        detail: 'Tusenvis av arbeidere hakker sølvmalmen løs dypt under jorda.',
        wealth: 500,
        Icon: Pickaxe,
    },
    {
        id: 'smelte',
        label: 'Smeltehytta renser',
        detail: 'Malmen smeltes i glødende ovner, så det rene sølvet skilles ut fra steinen.',
        wealth: 1800,
        Icon: Flame,
    },
    {
        id: 'mynt',
        label: 'Myntverket lager mynter',
        detail: 'Sølvet presses til blanke mynter med kongens ansikt på.',
        wealth: 5000,
        Icon: Coins,
    },
    {
        id: 'kasse',
        label: 'Kongens skattkammer',
        detail: 'Myntene havner i kongens kasse i København.',
        wealth: 9000,
        Icon: Crown,
    },
    {
        id: 'makt',
        label: 'Byer, veier og soldater',
        detail: 'Med sølvpengene bygde kongen nye byer, veier og en hær.',
        wealth: 14000,
        Icon: Landmark,
    },
];

// Fast «stokket» visningsrekkefølge på knappene (ikke sortert, ikke tilfeldig).
const SHUFFLED: string[] = ['mynt', 'aare', 'kasse', 'gruve', 'makt', 'smelte'];

export function SolvetsReise({ title = 'Sølvets reise' }: SolvetsReiseProps) {
    const [placed, setPlaced] = useState<string[]>([]);
    const [wrongId, setWrongId] = useState<string | null>(null);

    const phase: Phase = placed.length === STAGES.length ? 'complete' : 'building';

    const byId = useMemo(() => {
        const m: Record<string, Stage> = {};
        STAGES.forEach((s) => (m[s.id] = s));
        return m;
    }, []);

    const nextStage = STAGES[placed.length];
    const lastPlaced = placed.length > 0 ? byId[placed[placed.length - 1]] : null;
    const wealth = lastPlaced ? lastPlaced.wealth : 0;

    const handlePick = (id: string) => {
        if (phase === 'complete') return;
        if (id === nextStage.id) {
            setWrongId(null);
            setPlaced((p) => [...p, id]);
        } else {
            setWrongId(id);
            window.setTimeout(() => setWrongId((w) => (w === id ? null : w)), 500);
        }
    };

    const handleReset = () => {
        setPlaced([]);
        setWrongId(null);
    };

    const remaining = SHUFFLED.filter((id) => !placed.includes(id));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk stegene i riktig rekkefølge og følg sølvet fra fjellet til kongens makt.
                    </p>
                </div>
            </div>

            {/* Verdikjede-sporet */}
            <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {STAGES.map((stage, i) => {
                        const isPlaced = placed.includes(stage.id);
                        const isCurrent = i === placed.length && phase === 'building';
                        const Icon = stage.Icon;
                        return (
                            <div
                                key={stage.id}
                                className={`relative rounded-xl border px-3 py-3 flex items-center gap-2 min-h-[64px] ${
                                    isPlaced
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : isCurrent
                                          ? 'bg-amber-50 border-amber-300 border-dashed'
                                          : 'bg-slate-50 border-slate-200 border-dashed'
                                }`}
                            >
                                <span
                                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isPlaced
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {i + 1}
                                </span>
                                <AnimatePresence mode="wait">
                                    {isPlaced ? (
                                        <motion.div
                                            key="filled"
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className="flex items-center gap-2 min-w-0"
                                        >
                                            <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-emerald-800 leading-tight">
                                                {stage.label}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <span
                                            key="empty"
                                            className={`text-sm leading-tight ${
                                                isCurrent ? 'text-amber-600 font-medium' : 'text-slate-400'
                                            }`}
                                        >
                                            {isCurrent ? 'Hva skjer nå?' : '?'}
                                        </span>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Kongens rikdom */}
                <div className="mt-5 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <Crown className="w-4 h-4" /> Kongens rikdom
                    </span>
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={wealth}
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                            className="text-lg font-bold text-amber-700 tabular-nums"
                        >
                            {wealth.toLocaleString('nb-NO')} daler
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 min-h-[52px] flex items-center">
                {phase === 'complete' ? (
                    <span className="flex items-center gap-2 text-emerald-700">
                        <Sparkles className="w-4 h-4" /> Kongen ble mektig! Sølvet i fjellet ble til
                        penger, og pengene ble til byer, veier og soldater.
                    </span>
                ) : lastPlaced ? (
                    <span>{lastPlaced.detail}</span>
                ) : (
                    <span className="text-slate-500">
                        Alt begynner i fjellet. Hvilket steg kommer først?
                    </span>
                )}
            </div>

            {/* Valgknapper eller fullført-tilstand */}
            <div className="px-6 pb-5">
                {phase === 'building' ? (
                    <div className="flex flex-wrap gap-2">
                        {remaining.map((id) => {
                            const stage = byId[id];
                            const Icon = stage.Icon;
                            const isWrong = wrongId === id;
                            return (
                                <motion.button
                                    key={id}
                                    onClick={() => handlePick(id)}
                                    animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                                        isWrong
                                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 text-indigo-500" />
                                    {stage.label}
                                </motion.button>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3"
                    >
                        <span className="text-sm font-medium text-emerald-800">
                            Du fulgte hele sølvets reise fra berget til kongemakten.
                        </span>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" /> Prøv igjen
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Kontrollrad ved bygging */}
            {phase === 'building' && placed.length > 0 && (
                <div className="px-6 pb-5 -mt-2 flex justify-end">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Tilbakestill
                    </button>
                </div>
            )}
        </div>
    );
}
