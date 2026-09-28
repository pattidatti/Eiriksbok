import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import type { SortActivityItem } from '../../../types';
import { useStepSounds } from '../../../hooks/useStepSounds';

interface SortActivityProps {
    prompt: string;
    buckets: string[];
    items: SortActivityItem[];
    onComplete: (score: number) => void;
}

const BUCKET_STYLES = [
    {
        head: 'bg-indigo-600',
        ring: 'hover:ring-indigo-400',
        chip: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    {
        head: 'bg-amber-500',
        ring: 'hover:ring-amber-400',
        chip: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
        head: 'bg-teal-600',
        ring: 'hover:ring-teal-400',
        chip: 'bg-teal-50 text-teal-900 border-teal-200',
    },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Ett kort om gangen: eleven trykker på kolonnen kortet hører hjemme i.
// Kortet flyr ned i kolonnen, og forklaringen vises før neste kort.
export function SortActivity({ prompt, buckets, items, onComplete }: SortActivityProps) {
    const sounds = useStepSounds();
    const deck = useMemo(() => shuffle(items), [items]);
    const [index, setIndex] = useState(0);
    const [placed, setPlaced] = useState<{ item: SortActivityItem; right: boolean }[]>([]);
    const [verdict, setVerdict] = useState<{ right: boolean; bucket: number } | null>(null);

    const done = index >= deck.length;
    const current = deck[index];
    const score = placed.filter((p) => p.right).length;

    const choose = (bucket: number) => {
        if (verdict || done) return;
        const right = current.bucket === bucket;
        sounds.play(right ? 'correct' : 'incorrect');
        setVerdict({ right, bucket });
        setPlaced((p) => [...p, { item: current, right }]);
    };

    const next = () => {
        const nextIndex = index + 1;
        setVerdict(null);
        setIndex(nextIndex);
        if (nextIndex >= deck.length) {
            sounds.play('complete');
            onComplete(deck.length ? score / deck.length : 1);
        } else {
            sounds.play('advance');
        }
    };

    return (
        <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <p className="font-bold text-slate-800">{prompt}</p>
                <span className="text-xs font-black text-slate-400 bg-white border border-slate-200 rounded-full px-2.5 py-1 flex-shrink-0">
                    {Math.min(index + 1, deck.length)} / {deck.length}
                </span>
            </div>

            {/* Kortet som skal sorteres */}
            <div className="min-h-[7.5rem] flex items-center justify-center mb-4">
                <AnimatePresence mode="wait">
                    {!done ? (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -20, scale: 0.9, rotate: -2 }}
                            animate={
                                verdict
                                    ? verdict.right
                                        ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
                                        : {
                                              opacity: 1,
                                              x: [0, -10, 10, -6, 6, 0],
                                              rotate: 0,
                                              transition: { duration: 0.4 },
                                          }
                                    : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                            }
                            exit={{ opacity: 0, y: 40, scale: 0.6 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className={`w-full max-w-md rounded-2xl border-2 px-5 py-4 text-center shadow-lg ${
                                verdict
                                    ? verdict.right
                                        ? 'border-emerald-400 bg-emerald-50 shadow-emerald-100'
                                        : 'border-rose-300 bg-rose-50 shadow-rose-100'
                                    : 'border-slate-200 bg-white shadow-slate-200/60'
                            }`}
                        >
                            <p className="text-lg font-bold text-slate-900">{current.text}</p>
                            {verdict && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-2 text-sm text-slate-700"
                                >
                                    <p
                                        className={`font-bold ${verdict.right ? 'text-emerald-700' : 'text-rose-700'}`}
                                    >
                                        {verdict.right
                                            ? 'Riktig!'
                                            : `Nei - dette hører til «${buckets[current.bucket]}».`}
                                    </p>
                                    {current.explanation && (
                                        <p className="mt-1">{current.explanation}</p>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <p className="text-2xl font-black text-slate-900">
                                {score} av {deck.length} riktig
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                {score === deck.length
                                    ? 'Perfekt sortert!'
                                    : 'Bra jobbet. Nå vet du forskjellen.'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {verdict && !done && (
                <div className="flex justify-center mb-4">
                    <motion.button
                        type="button"
                        onClick={next}
                        autoFocus
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-md"
                    >
                        {index === deck.length - 1 ? 'Se resultatet' : 'Neste kort'}
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>
            )}

            {/* Kolonnene - selve knappene */}
            <div className={`grid gap-3 ${buckets.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {buckets.map((label, b) => {
                    const style = BUCKET_STYLES[b % BUCKET_STYLES.length];
                    const inBucket = placed.filter((p) => p.item.bucket === b);
                    const clickable = !verdict && !done;
                    return (
                        <motion.button
                            key={b}
                            type="button"
                            onClick={() => choose(b)}
                            disabled={!clickable}
                            whileHover={clickable ? { y: -3 } : undefined}
                            whileTap={clickable ? { scale: 0.97 } : undefined}
                            className={`text-left rounded-2xl bg-white border-2 border-slate-200 overflow-hidden transition-shadow min-h-[8rem] flex flex-col ${
                                clickable
                                    ? `cursor-pointer ring-0 hover:ring-4 ${style.ring} shadow-sm`
                                    : 'cursor-default'
                            } ${verdict && verdict.bucket === b ? (verdict.right ? 'border-emerald-400' : 'border-rose-300') : ''}`}
                        >
                            <span
                                className={`${style.head} text-white font-bold text-sm sm:text-base px-3 py-2.5 text-center`}
                            >
                                {label}
                            </span>
                            <span className="flex flex-wrap gap-1.5 p-2">
                                <AnimatePresence>
                                    {inBucket.map((p) => (
                                        <motion.span
                                            key={p.item.text}
                                            initial={{ opacity: 0, scale: 0.4, y: -30 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                            }}
                                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${style.chip}`}
                                        >
                                            {p.right ? (
                                                <Check className="w-3 h-3 text-emerald-600" />
                                            ) : (
                                                <X className="w-3 h-3 text-rose-500" />
                                            )}
                                            {p.item.text}
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                                {clickable && inBucket.length === 0 && (
                                    <span className="text-xs text-slate-400 italic px-1 py-1">
                                        Trykk her
                                    </span>
                                )}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
