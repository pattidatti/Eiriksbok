import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Check, X, Search, Ship, Stamp, RotateCcw } from 'lucide-react';

interface Claim {
    text: string;
    verdict: 'bevist' | 'ikke-forst' | 'falsk';
    why: string;
}

interface Verdict {
    id: 'bevist' | 'ikke-forst' | 'falsk';
    label: string;
    hint: string;
    icon: typeof Search;
}

interface AmerikaBevisSorteringProps {
    title?: string;
    claims?: Claim[];
}

type Phase = 'active' | 'complete';

const VERDICTS: Verdict[] = [
    { id: 'bevist', label: 'Bevist av funn', hint: 'Fysiske spor i bakken', icon: Search },
    { id: 'ikke-forst', label: 'Sant, men ikke først', hint: 'Skjedde – men andre var der før', icon: Ship },
    { id: 'falsk', label: 'Forfalskning', hint: 'Ser gammelt ut, men er falskt', icon: Stamp },
];

const DEFAULT_CLAIMS: Claim[] = [
    {
        text: 'Nordboerne hadde en boplass på Newfoundland rundt år 1000.',
        verdict: 'bevist',
        why: 'Ekteparet Ingstad gravde fram åtte hustufter ved L’Anse aux Meadows i 1968 – ekte spor i bakken.',
    },
    {
        text: 'Forskere daterte tømmeret på boplassen til nøyaktig år 1021.',
        verdict: 'bevist',
        why: 'En solstorm i år 993 satte en markørring i trærne. Forskerne talte ringene og landet på 1021 (Kuitems m.fl., 2021).',
    },
    {
        text: 'Christofer Columbus krysset Atlanteren i 1492.',
        verdict: 'ikke-forst',
        why: 'Reisen er godt dokumentert og sann. Men nordboerne var i Amerika nesten 500 år før ham.',
    },
    {
        text: 'Kensington-steinen viser at nordmenn nådde Minnesota i 1362.',
        verdict: 'falsk',
        why: 'Runeforskere mener steinen er en forfalskning, laget av bonden Olof Ohman rundt 1890.',
    },
];

export function AmerikaBevisSortering({
    title = 'Bevisvekten: Hvem nådde Amerika først?',
    claims = DEFAULT_CLAIMS,
}: AmerikaBevisSorteringProps) {
    const [phase, setPhase] = useState<Phase>('active');
    const [idx, setIdx] = useState(0);
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    const [solved, setSolved] = useState(0);

    const current = claims[idx];

    const handlePick = (id: Verdict['id']) => {
        if (result === 'correct') return;
        if (id === current.verdict) {
            setResult('correct');
            const nextSolved = solved + 1;
            setSolved(nextSolved);
            setTimeout(() => {
                if (idx + 1 >= claims.length) {
                    setPhase('complete');
                } else {
                    setIdx(idx + 1);
                    setResult(null);
                }
            }, 1100);
        } else {
            setResult('wrong');
        }
    };

    const handleReset = () => {
        setPhase('active');
        setIdx(0);
        setResult(null);
        setSolved(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les påstanden og vei bevisene. Hvor sterk står den?
                    </p>
                </div>
            </div>

            {/* Fremdriftsprikker */}
            <div className="px-6 pt-4 flex items-center gap-2">
                {claims.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                            i < solved
                                ? 'bg-emerald-400'
                                : i === idx && phase === 'active'
                                ? 'bg-indigo-400'
                                : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6">
                {phase === 'active' ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Påstand {idx + 1} av {claims.length}
                                </span>
                                <p className="mt-2 text-lg font-semibold text-slate-800 leading-snug">
                                    {current.text}
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {VERDICTS.map((v) => {
                                    const Icon = v.icon;
                                    const chosenRight =
                                        result === 'correct' && v.id === current.verdict;
                                    return (
                                        <motion.button
                                            key={v.id}
                                            whileHover={{ scale: result === 'correct' ? 1 : 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handlePick(v.id)}
                                            disabled={result === 'correct'}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-colors ${
                                                chosenRight
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-sm font-semibold leading-tight">
                                                {v.label}
                                            </span>
                                            <span className="text-[11px] text-slate-400 leading-tight">
                                                {v.hint}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="rounded-xl bg-emerald-50 border border-emerald-200 px-6 py-8 text-center"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                            <Check className="h-7 w-7 text-emerald-600" />
                        </div>
                        <p className="mt-3 text-lg font-bold text-emerald-800">
                            Du veide alle bevisene!
                        </p>
                        <p className="mx-auto mt-1.5 max-w-md text-sm text-emerald-700 leading-relaxed">
                            En påstand om fortiden er bare verdt bevisene bak den. Fysiske spor i
                            bakken slår en god historie – derfor vet vi at nordboerne var her først,
                            og at Kensington-steinen er falsk.
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'active' && result && (
                        <motion.div
                            key={`${idx}-${result}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                x: result === 'wrong' ? [0, -6, 6, -4, 4, 0] : 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm ${
                                result === 'correct'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                            }`}
                        >
                            {result === 'correct' ? (
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : (
                                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            <span>
                                {result === 'correct' ? current.why : 'Ikke helt. Tenk over hvilke bevis som faktisk finnes, og prøv igjen.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
