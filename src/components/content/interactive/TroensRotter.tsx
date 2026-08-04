import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Church, Mountain, GitMerge, RotateCcw, Check, X } from 'lucide-react';

// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at når en
// religion møter en kultur, endrer begge seg - læstadianismen har røtter både i
// kirken og i samisk kultur, og noen trekk ble til først i selve møtet.

type Origin = 'kirke' | 'samisk' | 'begge';

interface Trait {
    id: string;
    label: string;
    detail: string;
    origin: Origin;
    explanation: string;
}

interface TroensRotterProps {
    title?: string;
    prompt?: string;
    traits: Trait[];
    conclusion?: string;
}

type Phase = 'answering' | 'revealed' | 'done';

const OPTIONS: { id: Origin; label: string; icon: typeof Church; ring: string; text: string }[] = [
    {
        id: 'kirke',
        label: 'Kom med kirken',
        icon: Church,
        ring: 'hover:border-indigo-400 hover:bg-indigo-50',
        text: 'text-indigo-600',
    },
    {
        id: 'samisk',
        label: 'Kom fra samisk kultur',
        icon: Mountain,
        ring: 'hover:border-amber-400 hover:bg-amber-50',
        text: 'text-amber-600',
    },
    {
        id: 'begge',
        label: 'Ble til i møtet',
        icon: GitMerge,
        ring: 'hover:border-emerald-400 hover:bg-emerald-50',
        text: 'text-emerald-600',
    },
];

export function TroensRotter({
    title = 'Hvor kommer troen fra?',
    prompt = 'Les trekket, og velg hvor det har rota si.',
    traits,
    conclusion = 'To røtter, én stamme. Læstadianismen er verken ren kirkelære eller ren samisk tradisjon - den ble til da de to møttes.',
}: TroensRotterProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('answering');
    const [wrong, setWrong] = useState<Origin | null>(null);
    const [misses, setMisses] = useState(0);
    const [counts, setCounts] = useState<Record<Origin, number>>({
        kirke: 0,
        samisk: 0,
        begge: 0,
    });

    const total = traits.length;
    const current = traits[Math.min(index, total - 1)];
    const placed = counts.kirke + counts.samisk + counts.begge;

    const handleReset = () => {
        setIndex(0);
        setPhase('answering');
        setWrong(null);
        setMisses(0);
        setCounts({ kirke: 0, samisk: 0, begge: 0 });
    };

    const handlePick = (origin: Origin) => {
        if (phase !== 'answering') return;
        if (origin !== current.origin) {
            setWrong(origin);
            setMisses((m) => m + 1);
            return;
        }
        setWrong(null);
        setCounts((c) => ({ ...c, [origin]: c[origin] + 1 }));
        setPhase('revealed');
    };

    const handleNext = () => {
        if (index + 1 >= total) {
            setPhase('done');
        } else {
            setIndex((i) => i + 1);
            setPhase('answering');
        }
    };

    // Rot-tykkelse vokser med antall trekk plassert på hver side.
    const leftWidth = 3 + counts.kirke * 3.5;
    const rightWidth = 3 + counts.samisk * 3.5;
    const trunkHeight = 18 + (placed / total) * 62;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sprout className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            <div className="p-5 sm:p-6 grid gap-5 sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)] sm:gap-6">
                {/* Treet - de to røttene og stammen */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <svg viewBox="0 0 200 170" className="w-full h-[150px]" role="presentation">
                        {/* Bakke */}
                        <line
                            x1="12"
                            y1="122"
                            x2="188"
                            y2="122"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />
                        {/* Venstre rot: kirken */}
                        <motion.path
                            d="M100 122 C 76 138, 52 142, 26 156"
                            fill="none"
                            stroke="#6366f1"
                            strokeLinecap="round"
                            animate={{ strokeWidth: leftWidth }}
                            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                        />
                        {/* Høyre rot: samisk kultur */}
                        <motion.path
                            d="M100 122 C 124 138, 148 142, 174 156"
                            fill="none"
                            stroke="#f59e0b"
                            strokeLinecap="round"
                            animate={{ strokeWidth: rightWidth }}
                            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                        />
                        {/* Stammen */}
                        <motion.rect
                            x="93"
                            width="14"
                            rx="5"
                            fill="#10b981"
                            initial={{ y: 104, height: 18 }}
                            animate={{ y: 122 - trunkHeight, height: trunkHeight }}
                            transition={{ type: 'spring', stiffness: 170, damping: 20 }}
                        />
                        {/* Krone - kommer først når alt er plassert */}
                        <AnimatePresence>
                            {phase === 'done' && (
                                <motion.circle
                                    cx="100"
                                    cy="34"
                                    r="30"
                                    fill="#34d399"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.95 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                                    style={{ transformOrigin: '100px 34px' }}
                                />
                            )}
                        </AnimatePresence>
                    </svg>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-center">
                            <p className="text-[11px] font-semibold text-indigo-600">Kirken</p>
                            <p className="text-lg font-bold text-slate-700 tabular-nums">
                                {counts.kirke}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-semibold text-amber-600">
                                Samisk kultur
                            </p>
                            <p className="text-lg font-bold text-slate-700 tabular-nums">
                                {counts.samisk}
                            </p>
                        </div>
                    </div>
                    <p className="text-center text-[11px] text-emerald-600 font-semibold mt-1">
                        Ble til i møtet: {counts.begge}
                    </p>
                </div>

                {/* Trekk-kort og valg */}
                <div className="min-w-0">
                    {phase === 'done' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 h-full flex flex-col justify-center"
                        >
                            <p className="text-sm font-bold text-emerald-800 mb-1.5">
                                Treet står ferdig
                            </p>
                            <p className="text-sm text-emerald-700 leading-relaxed">{conclusion}</p>
                            <p className="text-xs text-emerald-600 mt-2.5">
                                {misses === 0
                                    ? 'Du plasserte alle trekkene riktig på første forsøk.'
                                    : `Du bommet ${misses} ${misses === 1 ? 'gang' : 'ganger'} underveis.`}
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    Trekk {index + 1} av {total}
                                </span>
                                <div className="flex gap-1">
                                    {traits.map((t, i) => (
                                        <span
                                            key={t.id}
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                i < placed ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={current.id}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                    <p className="font-semibold text-slate-800 leading-snug">
                                        {current.label}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {current.detail}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            <div className="grid gap-2 mt-3">
                                {OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isWrong = wrong === opt.id;
                                    const isRight = phase === 'revealed' && current.origin === opt.id;
                                    return (
                                        <motion.button
                                            key={opt.id}
                                            onClick={() => handlePick(opt.id)}
                                            animate={isWrong ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                                            transition={{ duration: 0.34 }}
                                            className={`w-full rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                                                isRight
                                                    ? 'border-emerald-400 bg-emerald-50'
                                                    : isWrong
                                                      ? 'border-rose-300 bg-rose-50'
                                                      : `border-slate-200 bg-white ${opt.ring}`
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                {isRight ? (
                                                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                ) : isWrong ? (
                                                    <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                                ) : (
                                                    <Icon
                                                        className={`w-4 h-4 flex-shrink-0 ${opt.text}`}
                                                    />
                                                )}
                                                <span className="text-sm font-semibold text-slate-700 leading-tight">
                                                    {opt.label}
                                                </span>
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${index}-${wrong ?? 'none'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            phase === 'revealed' || phase === 'done'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : wrong
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'done'
                            ? 'Se på treet: begge røttene bærer den samme stammen.'
                            : phase === 'revealed'
                              ? current.explanation
                              : wrong
                                ? 'Ikke helt. Tenk over om dette trekket kom med misjonærene, om det alt var der i samisk kultur, eller om det oppsto først da de to møttes.'
                                : 'Velg en av de tre knappene over.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'revealed' ? (
                    <button
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 >= total ? 'Se treet' : 'Neste trekk'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {phase === 'done' ? 'Ferdig' : 'Velg rot for trekket'}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
