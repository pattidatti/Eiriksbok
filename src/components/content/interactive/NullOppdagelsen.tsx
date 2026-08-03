import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Lock, Sparkles, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal kjenne at et tall trenger en null for å holde
// den tomme plassen. Uten null blir "2 5" umulig å lese: er det 25, 205 eller
// 2005? Med null blir det ett tall alle leser likt. Det er nettopp denne ideen
// indiske matematikere ga verden, og som vi bruker hver dag i matten.

interface NullOppdagelsenProps {
    title?: string;
    // Tallet eleven skal skrive. Må ha en null inni seg (f.eks. 205, 305, 407).
    target?: string;
    // Navn på plassene, fra venstre. Må ha like mange elementer som target.
    columns?: string[];
}

type Phase = 'idle' | 'active' | 'complete';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export function NullOppdagelsen({
    title = 'Skriv tallet uten null',
    target = '205',
    columns = ['Hundrere', 'Tiere', 'Enere'],
}: NullOppdagelsenProps) {
    const digits = useMemo(() => target.split('').map(Number), [target]);
    const zeroIndex = digits.indexOf(0);

    const [slots, setSlots] = useState<(number | null)[]>(() => digits.map(() => null));
    const [selected, setSelected] = useState(0);
    const [zeroUnlocked, setZeroUnlocked] = useState(false);

    const filled = slots.filter((s) => s !== null).length;
    const solved = slots.every((s, i) => s === digits[i]);
    // Eleven har kjent tvetydigheten: alle sifrene utenom nullen står riktig,
    // men nullplassen er fortsatt tom.
    const ambiguous =
        !zeroUnlocked &&
        slots.every((s, i) => (i === zeroIndex ? s === null : s === digits[i]));

    const phase: Phase = solved ? 'complete' : filled === 0 ? 'idle' : 'active';

    const nextEmpty = (from: (number | null)[]) => {
        const i = from.findIndex((s) => s === null);
        return i === -1 ? 0 : i;
    };

    const placeDigit = (d: number) => {
        if (solved) return;
        setSlots((prev) => {
            const next = [...prev];
            next[selected] = d;
            setSelected(nextEmpty(next));
            return next;
        });
    };

    const clearSlot = (i: number) => {
        if (solved) return;
        setSlots((prev) => {
            const next = [...prev];
            next[i] = null;
            return next;
        });
        setSelected(i);
    };

    const handleReset = () => {
        setSlots(digits.map(() => null));
        setSelected(0);
        setZeroUnlocked(false);
    };

    // Slik ser det ut på papiret for en som ikke har nullen: sifrene uten
    // tomrommet, tolket på tre måter.
    const written = slots.filter((s) => s !== null).join(' ');
    const misreadings = useMemo(() => {
        const bare = digits.filter((d) => d !== 0).join('');
        return [bare, target, target + '0'];
    }, [digits, target]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Hash className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sett sifrene i rutene så det står {target}. Nullen er låst.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                {/* Plassene */}
                <div className="flex justify-center gap-3 sm:gap-4">
                    {slots.map((value, i) => {
                        const isSelected = selected === i && !solved;
                        const isRight = solved || value === digits[i];
                        return (
                            <button
                                key={i}
                                onClick={() => (value === null ? setSelected(i) : clearSlot(i))}
                                className="flex flex-col items-center gap-2 focus:outline-none"
                                aria-label={`${columns[i]}, ${value === null ? 'tom' : value}`}
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    {columns[i]}
                                </span>
                                <motion.span
                                    animate={{
                                        scale: isSelected ? 1.06 : 1,
                                        borderColor: isSelected
                                            ? '#6366f1'
                                            : value !== null && isRight
                                              ? '#a7f3d0'
                                              : '#e2e8f0',
                                    }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                    className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 flex items-center justify-center text-3xl sm:text-4xl font-bold tabular-nums ${
                                        value === null
                                            ? 'bg-slate-50 text-slate-300'
                                            : 'bg-white text-slate-800 shadow-sm'
                                    }`}
                                >
                                    {value === null ? (
                                        <span className="text-slate-200">·</span>
                                    ) : (
                                        <motion.span
                                            key={value}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 18,
                                            }}
                                        >
                                            {value}
                                        </motion.span>
                                    )}
                                </motion.span>
                            </button>
                        );
                    })}
                </div>

                {/* Sifrene eleven kan velge */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {DIGITS.map((d) => {
                        const locked = d === 0 && !zeroUnlocked;
                        return (
                            <motion.button
                                key={d}
                                onClick={() => !locked && placeDigit(d)}
                                disabled={locked || solved}
                                whileTap={locked || solved ? undefined : { scale: 0.9 }}
                                animate={
                                    d === 0 && zeroUnlocked
                                        ? { scale: [1, 1.35, 1] }
                                        : { scale: 1 }
                                }
                                transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                                className={`w-11 h-11 rounded-xl border text-lg font-bold tabular-nums transition-colors ${
                                    locked
                                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                                        : d === 0
                                          ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                                }`}
                                aria-label={locked ? 'Null er låst' : `Sett inn ${d}`}
                            >
                                {locked ? <Lock className="w-4 h-4 mx-auto" /> : d}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {solved ? (
                        <motion.div
                            key="ok"
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                            <span>
                                <span className="font-semibold">{target}.</span> Nullen sier at
                                plassen er tom, og da leser alle det samme tallet. Det er derfor
                                nullen er et tall og ikke bare et hull.
                            </span>
                        </motion.div>
                    ) : ambiguous ? (
                        <motion.div
                            key="tvil"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                        >
                            <p>
                                På papiret står det bare{' '}
                                <span className="font-bold tabular-nums">{written}</span> med et
                                tomrom imellom. Hva mener du?
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {misreadings.map((m) => (
                                    <span
                                        key={m}
                                        className="px-2.5 py-1 rounded-md bg-white border border-rose-200 font-bold tabular-nums text-rose-700"
                                    >
                                        {m}?
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'idle'
                                ? `Trykk et siffer for å sette det i den valgte ruta. Prøv å skrive ${target} uten å bruke null.`
                                : 'Trykk en rute for å tømme den igjen.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {zeroUnlocked ? (
                    <span className="text-sm text-slate-500">
                        Nullen er låst opp. Sett den i {columns[zeroIndex].toLowerCase()}.
                    </span>
                ) : (
                    <button
                        onClick={() => setZeroUnlocked(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Lås opp nullen
                    </button>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
