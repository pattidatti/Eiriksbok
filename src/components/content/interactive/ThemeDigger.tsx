import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Pickaxe, ChevronDown, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface ThemeDiggerProps {
    title?: string;
    story: string;
    storyDescription: string;
    layers: {
        id: string;
        name: string;
        depth: number;
        question: string;
        options: { text: string; correct: boolean; feedback: string }[];
        color: string;
        icon: string;
    }[];
}

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', glow: 'shadow-amber-300/50' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', glow: 'shadow-emerald-300/50' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', glow: 'shadow-blue-300/50' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', glow: 'shadow-purple-300/50' },
};

const depthGradients = [
    'from-amber-200 to-amber-300',
    'from-yellow-600 to-amber-700',
    'from-stone-500 to-stone-600',
    'from-stone-700 to-stone-800',
];

const spring = { type: 'spring' as const, stiffness: 200, damping: 20 };

export const ThemeDigger = ({
    title = 'Hjertet i teksten',
    story,
    storyDescription,
    layers,
}: ThemeDiggerProps) => {
    const sorted = [...layers].sort((a, b) => a.depth - b.depth);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const [wrongKey, setWrongKey] = useState<string | null>(null);
    const [wrongFeedback, setWrongFeedback] = useState('');
    const [complete, setComplete] = useState(false);
    const currentLayer = sorted.find((l) => !revealedIds.has(l.id));

    // Ingen useCallback: den manuelle memoiseringen her stemte ikke med det React
    // Compiler utleder, og da hoppet compileren over å optimalisere hele
    // komponenten. Uten den memoiserer compileren dette selv.
    const handleAnswer =
        (layerId: string, opt: { correct: boolean; feedback: string }) => {
            if (opt.correct) {
                const next = new Set(revealedIds);
                next.add(layerId);
                setRevealedIds(next);
                setWrongKey(null);
                setWrongFeedback('');
                if (next.size === sorted.length) {
                    setComplete(true);
                    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
                        colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'] });
                }
            } else {
                setWrongKey(layerId + opt.feedback);
                setWrongFeedback(opt.feedback);
                setTimeout(() => setWrongKey(null), 2000);
            }
        };

    return (
        <div className="w-full max-w-2xl mx-auto my-8 font-sans px-4">
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                    <Pickaxe size={20} className="text-amber-600" />
                    <h3 className="text-xl font-display font-bold text-slate-800">{title}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{story}</span> — {storyDescription}
                </p>
                <p className="text-xs text-slate-400">Grav deg ned gjennom lagene for å finne tekstens budskap</p>
            </div>

            <div className="relative">
                {sorted.map((layer, i) => {
                    const revealed = revealedIds.has(layer.id);
                    const isCurrent = currentLayer?.id === layer.id && !complete;
                    const c = colorMap[layer.color] || colorMap.amber;
                    const grad = depthGradients[layer.depth] || depthGradients[0];

                    return (
                        <motion.div key={layer.id} layout className="relative mb-2"
                            style={{ zIndex: sorted.length - i }}>
                            <motion.div
                                className={`relative rounded-xl overflow-hidden border ${
                                    revealed ? `${c.border} shadow-lg ${c.glow}` : 'border-stone-300 shadow-sm'
                                }`}
                                animate={{ y: revealed ? i * 4 : 0 }}
                                transition={spring}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${revealed ? c.bg : grad} transition-colors duration-500`} />
                                {!revealed && (
                                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                                        {[0, 1, 2, 3, 4, 5].map((j) => (
                                            <div key={j} className="absolute w-1 h-1 rounded-full bg-black/30"
                                                style={{ left: `${15 + j * 15}%`, top: `${30 + (j % 3) * 20}%` }} />
                                        ))}
                                    </div>
                                )}
                                <div className="relative p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{layer.icon}</span>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${revealed ? c.text : 'text-white/90'}`}>
                                            {layer.name}
                                        </span>
                                        {revealed && <CheckCircle2 size={14} className="text-green-500" />}
                                        {!revealed && !isCurrent && (
                                            <span className="text-[10px] text-white/50 ml-auto">Låst</span>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {revealed && (
                                            <motion.div initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 150, damping: 18 }}>
                                                <p className={`text-sm ${c.text} font-medium mt-1`}>
                                                    {layer.options.find((o) => o.correct)?.feedback}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <AnimatePresence>
                                        {isCurrent && (
                                            <motion.div initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }} className="mt-3">
                                                <p className="text-sm font-semibold text-white mb-3">{layer.question}</p>
                                                <div className="grid gap-2">
                                                    {layer.options.map((opt, oi) => (
                                                        <motion.button key={oi}
                                                            onClick={() => handleAnswer(layer.id, opt)}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            animate={wrongKey === layer.id + opt.feedback
                                                                ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                                                            className="text-left px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 text-sm font-medium border border-white/50 shadow-sm cursor-pointer">
                                                            <ChevronDown size={12} className="inline mr-1.5 text-slate-400" />
                                                            {opt.text}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <AnimatePresence>
                                                    {wrongKey && wrongFeedback && (
                                                        <motion.div initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                            className="mt-2 flex items-center gap-1.5 text-xs text-red-100 bg-red-500/30 rounded-lg px-3 py-2">
                                                            <XCircle size={14} />{wrongFeedback}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {complete && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.3 }}
                        className="mt-6 rounded-2xl bg-gradient-to-br from-amber-50 to-purple-50 border border-amber-200 p-5 text-center shadow-lg">
                        <Sparkles size={28} className="mx-auto text-amber-500 mb-2" />
                        <h4 className="font-display font-bold text-lg text-slate-800 mb-1">Gravingen er ferdig!</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Du har avdekket alle lagene i <span className="font-semibold">{story}</span>
                        </p>
                        <div className="space-y-2 text-left">
                            {sorted.map((layer) => (
                                <div key={layer.id}
                                    className={`flex items-start gap-2 ${colorMap[layer.color]?.bg || 'bg-slate-100'} rounded-lg px-3 py-2`}>
                                    <span>{layer.icon}</span>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{layer.name}</span>
                                        <p className="text-sm text-slate-700">{layer.options.find((o) => o.correct)?.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
