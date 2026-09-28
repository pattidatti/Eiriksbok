import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderActivityItem } from '../../../types';
import { useStepSounds } from '../../../hooks/useStepSounds';

interface OrderActivityProps {
    prompt: string;
    items: OrderActivityItem[]; // i riktig rekkefølge
    onComplete: (score: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    // Aldri la den stokkede rekkefølgen være fasiten.
    if (a.length > 1 && a.every((x, i) => x === arr[i])) [a[0], a[1]] = [a[1], a[0]];
    return a;
}

// Eleven trykker brikkene i riktig rekkefølge. Riktig brikke flyr inn på neste
// ledige plass og viser årstallet sitt; feil brikke rister og blir stående.
export function OrderActivity({ prompt, items, onComplete }: OrderActivityProps) {
    const sounds = useStepSounds();
    const pool = useMemo(() => shuffle(items), [items]);
    const [placedCount, setPlacedCount] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [shaking, setShaking] = useState<{ text: string; n: number } | null>(null);

    const done = placedCount >= items.length;

    const tap = (item: OrderActivityItem) => {
        if (done) return;
        if (item === items[placedCount]) {
            const nextCount = placedCount + 1;
            setPlacedCount(nextCount);
            if (nextCount >= items.length) {
                sounds.play('complete');
                onComplete(Math.max(0, 1 - mistakes / items.length));
            } else {
                sounds.play('drop');
            }
        } else {
            sounds.play('incorrect');
            setMistakes((m) => m + 1);
            setShaking((s) => ({ text: item.text, n: (s?.n ?? 0) + 1 }));
        }
    };

    return (
        <div className="@container rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-4 sm:p-5">
            <p className="font-bold text-slate-800 mb-4">{prompt}</p>
            <div className="grid @lg:grid-cols-2 gap-4">
                {/* Tidslinja som fylles opp */}
                <ol className="relative space-y-2 pl-8">
                    <span className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200 rounded" />
                    {items.map((item, i) => {
                        const filled = i < placedCount;
                        const isNext = i === placedCount;
                        return (
                            <li key={i} className="relative min-h-[3rem] flex items-center">
                                <span
                                    className={`absolute -left-8 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border-2 ${
                                        filled
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isNext
                                              ? 'bg-white border-indigo-500 text-indigo-600'
                                              : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                                >
                                    {i + 1}
                                </span>
                                <AnimatePresence mode="wait">
                                    {filled ? (
                                        <motion.div
                                            key="filled"
                                            layoutId={`order-${item.text}`}
                                            className="w-full rounded-xl bg-emerald-50 border-2 border-emerald-300 px-3 py-2"
                                        >
                                            {item.label && (
                                                <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-700">
                                                    {item.label}
                                                </span>
                                            )}
                                            <span className="text-sm font-semibold text-slate-800">
                                                {item.text}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <div
                                            key="empty"
                                            className={`w-full rounded-xl border-2 border-dashed px-3 py-3 text-xs ${
                                                isNext
                                                    ? 'border-indigo-300 bg-indigo-50/40 text-indigo-500 font-semibold'
                                                    : 'border-slate-200 text-slate-300'
                                            }`}
                                        >
                                            {isNext
                                                ? i === 0
                                                    ? 'Hva kom først?'
                                                    : 'Hva kom så?'
                                                : ' '}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </li>
                        );
                    })}
                </ol>

                {/* Brikkene */}
                <div className="flex flex-col gap-2">
                    {done ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl bg-emerald-50 border border-emerald-200 p-4"
                        >
                            <p className="text-2xl font-black text-emerald-800">
                                Riktig rekkefølge!
                            </p>
                            <p className="text-sm text-emerald-700 mt-1">
                                {mistakes === 0
                                    ? 'Uten én eneste bom.'
                                    : `${mistakes} bom på veien.`}
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Trykk på brikkene i riktig rekkefølge
                            </p>
                            {pool.map((item) => {
                                const idx = items.indexOf(item);
                                if (idx < placedCount) return null;
                                const isShaking = shaking?.text === item.text;
                                return (
                                    <motion.button
                                        key={`${item.text}-${isShaking ? shaking?.n : 0}`}
                                        layoutId={`order-${item.text}`}
                                        type="button"
                                        onClick={() => tap(item)}
                                        animate={isShaking ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                                        transition={{ duration: 0.35 }}
                                        whileHover={{ scale: 1.02, x: 3 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`w-full text-left rounded-xl bg-white border-2 px-3 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-400 hover:shadow-md cursor-pointer ${
                                            isShaking ? 'border-rose-300' : 'border-slate-200'
                                        }`}
                                    >
                                        {item.text}
                                    </motion.button>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
