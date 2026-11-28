import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    Cpu,
    MemoryStick,
    Magnet,
    Factory,
    Camera,
    Lightbulb,
    RotateCcw,
    Check,
    Sparkles,
} from 'lucide-react';

type IconKey = 'design' | 'chip' | 'memory' | 'magnet' | 'factory' | 'camera';
type Side = 'usa' | 'kina' | 'verden';

interface Part {
    id: string;
    label: string;
    // Hvor delen lages eller kommer fra (forenklet)
    origin: string;
    icon: IconKey;
}

interface Effect {
    // 0 = merker lite, 1 = merker noe, 2 = merker mye
    level: 0 | 1 | 2;
    text: string;
}

interface Move {
    id: string;
    actor: 'USA' | 'Kina';
    label: string;
    hits: string[];
    effects: Record<Side, Effect>;
    explanation: string;
}

interface MobilenIHandelskrigenProps {
    title?: string;
    parts: Part[];
    moves: Move[];
    conclusion: string;
}

type Phase = 'idle' | 'active' | 'complete';

const ICONS: Record<IconKey, typeof Cpu> = {
    design: Smartphone,
    chip: Cpu,
    memory: MemoryStick,
    magnet: Magnet,
    factory: Factory,
    camera: Camera,
};

const SIDES: { id: Side; label: string }[] = [
    { id: 'usa', label: 'USA' },
    { id: 'kina', label: 'Kina' },
    { id: 'verden', label: 'Resten av verden og Norge' },
];

const LEVEL_TEXT = ['Merker lite', 'Merker noe', 'Merker mye'];
const LEVEL_STYLE = [
    'bg-slate-100 text-slate-600 border-slate-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
];

export function MobilenIHandelskrigen({
    title = 'Hvem treffer handelskrigen?',
    parts,
    moves,
    conclusion,
}: MobilenIHandelskrigenProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tried, setTried] = useState<string[]>([]);

    const active = moves.find((m) => m.id === activeId) ?? null;
    const allTried = tried.length === moves.length;

    const handleMove = (id: string) => {
        setActiveId(id);
        setPhase('active');
        setTried((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const handleReset = () => {
        setPhase('idle');
        setActiveId(null);
        setTried([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et grep i handelskrigen og se hvilke deler av mobilen som blir rammet.
                    </p>
                </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
                {/* Mobilen med delene */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        En mobil (forenklet)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {parts.map((part) => {
                            const Icon = ICONS[part.icon] ?? Cpu;
                            const hit = active?.hits.includes(part.id) ?? false;
                            return (
                                <motion.div
                                    key={part.id}
                                    animate={
                                        hit
                                            ? { scale: [1, 1.06, 1], x: [0, -3, 3, -2, 0] }
                                            : { scale: 1, x: 0 }
                                    }
                                    transition={{ duration: 0.45 }}
                                    className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
                                        hit
                                            ? 'bg-rose-50 border-rose-300'
                                            : 'bg-white border-slate-200'
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                                            hit ? 'text-rose-600' : 'text-indigo-500'
                                        }`}
                                    />
                                    <div className="min-w-0">
                                        <p
                                            className={`text-sm font-medium leading-tight hyphens-auto break-words ${
                                                hit ? 'text-rose-700' : 'text-slate-700'
                                            }`}
                                        >
                                            {part.label}
                                        </p>
                                        <p className="text-xs text-slate-500">{part.origin}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Grepene */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Velg et grep
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {moves.map((move) => {
                            const isActive = move.id === activeId;
                            const done = tried.includes(move.id);
                            return (
                                <motion.button
                                    key={move.id}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleMove(move.id)}
                                    className={`text-left rounded-xl border px-3 py-2.5 flex items-center gap-2 ${
                                        isActive
                                            ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span
                                        className={`text-xs font-bold rounded-full px-2 py-1 shrink-0 ${
                                            move.actor === 'USA'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {move.actor}
                                    </span>
                                    <span className="text-sm text-slate-700 flex-1">
                                        {move.label}
                                    </span>
                                    {done && (
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Hvem merker det */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {SIDES.map((side) => {
                            const effect = active?.effects[side.id];
                            return (
                                <motion.div
                                    key={`${side.id}-${activeId ?? 'none'}`}
                                    initial={{ opacity: 0.4, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`rounded-lg border px-2 py-2 text-center ${
                                        effect
                                            ? LEVEL_STYLE[effect.level]
                                            : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                >
                                    <p className="text-xs font-semibold leading-tight">
                                        {side.label}
                                    </p>
                                    <p className="text-xs mt-1">
                                        {effect ? LEVEL_TEXT[effect.level] : '?'}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase === 'complete' ? 'complete' : (activeId ?? 'idle')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            phase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : active
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                        {phase === 'complete' ? (
                            <div className="flex items-start gap-2">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: [0.5, 1.3, 1] }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                </motion.span>
                                <p>{conclusion}</p>
                            </div>
                        ) : active ? (
                            <div className="space-y-2">
                                <p>{active.explanation}</p>
                                <ul className="space-y-1">
                                    {SIDES.map((side) => (
                                        <li key={side.id}>
                                            <span className="font-semibold">{side.label}:</span>{' '}
                                            {active.effects[side.id].text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p>Ingen grep valgt ennå. Prøv alle tre.</p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    disabled={!allTried || phase === 'complete'}
                    onClick={() => setPhase('complete')}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2"
                >
                    <Lightbulb className="w-4 h-4" />
                    {allTried
                        ? 'Hva lærte du?'
                        : `Prøv alle grepene (${tried.length}/${moves.length})`}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
