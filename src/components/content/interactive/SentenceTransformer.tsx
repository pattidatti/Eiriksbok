import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCcw, ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';

interface SentenceTransformerProps {
    title?: string;
    sentences: {
        id: string;
        original: string;
        techniques: {
            id: string;
            name: string;
            icon: string;
            transformed: string;
            overdoseVersion?: string;
        }[];
        sweetSpot: number;
    }[];
}

const METER_COLORS = [
    'bg-green-400',
    'bg-green-400',
    'bg-yellow-400',
    'bg-orange-400',
    'bg-red-500',
    'bg-purple-600',
];
const getMeterColor = (n: number) => METER_COLORS[Math.min(n, METER_COLORS.length - 1)];

const getStatusBadge = (count: number, sweetSpot: number) => {
    if (count === 0) return { text: 'Enkelt', color: 'bg-slate-200 text-slate-500' };
    if (count < sweetSpot) return { text: 'Fortsett...', color: 'bg-amber-100 text-amber-700' };
    if (count === sweetSpot) return { text: 'Balanse!', color: 'bg-emerald-100 text-emerald-700' };
    return { text: 'Overdose!', color: 'bg-purple-100 text-purple-700' };
};

export const SentenceTransformer = ({
    title = 'Mal med ord',
    sentences,
}: SentenceTransformerProps) => {
    const [idx, setIdx] = useState(0);
    const [activeMap, setActiveMap] = useState<Record<string, Set<string>>>({});
    const [celebrated, setCelebrated] = useState<Set<string>>(new Set());

    const s = sentences[idx];
    const active = activeMap[s.id] ?? new Set<string>();
    const count = active.size;
    const isOver = count > s.sweetSpot;
    const isPerfect = count === s.sweetSpot;

    const displayText = useCallback(() => {
        if (count === 0) return s.original;
        const applied = s.techniques.filter((t) => active.has(t.id));
        if (isOver) {
            return (
                applied.map((t) => t.overdoseVersion ?? t.transformed).join(' ') ||
                applied[applied.length - 1].transformed
            );
        }
        return applied[applied.length - 1].transformed;
    }, [s, active, count, isOver]);

    const toggle = (techId: string) => {
        setActiveMap((prev) => {
            const cur = new Set(prev[s.id] ?? []);
            if (cur.has(techId)) cur.delete(techId);
            else cur.add(techId);
            if (cur.size === s.sweetSpot && !celebrated.has(s.id)) {
                setCelebrated((c) => new Set(c).add(s.id));
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
            return { ...prev, [s.id]: cur };
        });
    };

    const reset = () => {
        setActiveMap((p) => {
            const n = { ...p };
            delete n[s.id];
            return n;
        });
        setCelebrated((c) => {
            const n = new Set(c);
            n.delete(s.id);
            return n;
        });
    };

    const pct = Math.min((count / (s.sweetSpot + 2)) * 100, 100);
    const sweetSpotPct = (s.sweetSpot / (s.sweetSpot + 2)) * 100;
    const activeTechniques = s.techniques.filter((t) => active.has(t.id));
    const activeNames = activeTechniques.map((t) => t.name.toLowerCase());
    const status = getStatusBadge(count, s.sweetSpot);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden my-8"
        >
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" /> {title}
                    </h4>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Klikk på virkemidler for å forvandle setningen — finn den perfekte
                        balansen
                    </p>
                </div>
                {sentences.length > 1 && (
                    <span className="text-sm text-slate-400">
                        {idx + 1} / {sentences.length}
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* Goal description */}
                <p className="text-sm text-slate-500 text-center mb-4">
                    Kombiner{' '}
                    <span className="font-semibold text-slate-700">{s.sweetSpot}</span>{' '}
                    virkemidler for å finne den perfekte balansen. For mange gjør teksten
                    overdreven.
                </p>

                {/* Original sentence reference */}
                <div className="mb-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Originalsetning
                    </span>
                    <p className="text-sm text-slate-600 mt-0.5">{s.original}</p>
                </div>

                {/* Dynamic label above transformed text */}
                {count > 0 && (
                    <div className="text-center mb-2">
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                isOver
                                    ? 'bg-purple-100 text-purple-700'
                                    : isPerfect
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {isOver
                                ? 'Overdose — for mange virkemidler'
                                : isPerfect
                                  ? 'Perfekt balanse!'
                                  : `Med ${activeNames.join(' og ')}:`}
                        </span>
                    </div>
                )}

                {/* Transformed text display */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={s.id + '-' + count}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            rotate: isOver ? [0, -1, 1, -0.5, 0.5, 0] : 0,
                        }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={
                            isOver
                                ? { rotate: { repeat: Infinity, duration: 0.8 } }
                                : { duration: 0.3 }
                        }
                        className={`relative text-lg md:text-xl font-medium leading-relaxed text-center px-4 py-6 rounded-lg border-2 transition-colors duration-300 ${
                            isOver
                                ? 'bg-purple-50 border-purple-300 text-purple-900'
                                : isPerfect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : count > 0
                                    ? 'bg-amber-50 border-amber-200 text-slate-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                        style={
                            isOver
                                ? {
                                      textShadow: '0 0 8px rgba(147,51,234,0.3)',
                                      filter: `hue-rotate(${(count - s.sweetSpot) * 20}deg)`,
                                  }
                                : undefined
                        }
                    >
                        {isOver && (
                            <motion.div
                                className="absolute inset-0 rounded-lg bg-gradient-to-b from-purple-200/40 via-transparent to-purple-300/50 pointer-events-none"
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        )}
                        <span className={isOver ? 'italic' : ''}>{displayText()}</span>
                    </motion.div>
                </AnimatePresence>

                {/* Individual transformations list */}
                <AnimatePresence>
                    {activeTechniques.length > 1 && !isOver && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-1.5 overflow-hidden"
                        >
                            <p className="text-xs font-medium text-slate-400 text-center">
                                Hver transformasjon:
                            </p>
                            {activeTechniques.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-start gap-2 px-3 py-1.5 bg-slate-50 rounded-md text-sm"
                                >
                                    <span className="shrink-0">{t.icon}</span>
                                    <span className="text-slate-500 font-medium shrink-0">
                                        {t.name}:
                                    </span>
                                    <span className="text-slate-600 italic">{t.transformed}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Perfect / Overdose feedback */}
                <AnimatePresence>
                    {isPerfect && (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center text-emerald-600 font-bold mt-3 text-sm"
                        >
                            Perfekt balanse!
                        </motion.p>
                    )}
                    {isOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-center"
                        >
                            <p className="text-purple-700 font-semibold text-sm flex items-center justify-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Overdose!
                            </p>
                            <p className="text-purple-600 text-xs mt-1">
                                For mange virkemidler gjør teksten kunstig og vanskelig å lese.
                                Fjern noen for å finne balansen.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Meter */}
                <div className="mt-5">
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-500">
                            {count} av {s.techniques.length} virkemidler valgt
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}
                        >
                            {status.text}
                        </span>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${getMeterColor(count)}`}
                            initial={false}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        />
                        {/* Sweet spot marker */}
                        <div
                            className="absolute top-0 h-full w-0.5 bg-emerald-600/50"
                            style={{ left: `${sweetSpotPct}%` }}
                            title="Perfekt balanse"
                        />
                    </div>
                </div>

                {/* Technique buttons */}
                <div className="mt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center mb-2">
                        Velg virkemidler
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {s.techniques.map((t) => (
                            <motion.button
                                key={t.id}
                                onClick={() => toggle(t.id)}
                                whileTap={{ scale: 0.93 }}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 flex items-center gap-1.5 ${
                                    active.has(t.id)
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:shadow-sm'
                                }`}
                            >
                                <span>{t.icon}</span> {t.name}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer navigation */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-2">
                    {sentences.length > 1 && (
                        <>
                            <button
                                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                                disabled={idx === 0}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() =>
                                    setIdx((i) => Math.min(sentences.length - 1, i + 1))
                                }
                                disabled={idx === sentences.length - 1}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
                <button
                    onClick={reset}
                    disabled={count === 0}
                    className="px-4 py-2 text-slate-500 rounded-lg font-medium hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 flex items-center gap-2 transition-all"
                >
                    <RotateCcw className="w-4 h-4" /> Nullstill
                </button>
            </div>
        </motion.div>
    );
};
