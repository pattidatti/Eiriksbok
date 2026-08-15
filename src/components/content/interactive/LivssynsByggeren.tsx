import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Check, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';

interface ByggerOption {
    id: string;
    label: string;
    // Riktig = svaret dette livssynet faktisk gir. De andre er ekte svar fra
    // andre tradisjoner, ikke tullesvar.
    correct?: boolean;
    // Vises når eleven velger kortet. Skal forklare hvem som svarer slik.
    feedback: string;
}

interface ByggerSlot {
    id: string;
    question: string;
    // Kort merkelapp på selve byggeklossen når den er lagt inn.
    tag: string;
    options: ByggerOption[];
}

interface LivssynsByggerenProps {
    title?: string;
    intro?: string;
    slots: ByggerSlot[];
    successTitle?: string;
    successText?: string;
}

type Phase = 'building' | 'complete';

export function LivssynsByggeren({
    title = 'Livssynsbyggeren',
    intro = 'Et livssyn er et samlet svar på de store spørsmålene. Bygg svarene, ett spørsmål om gangen.',
    slots,
    successTitle = 'Livssynet er ferdig bygd',
    successText = 'Fire svar, ett livssyn.',
}: LivssynsByggerenProps) {
    const [filled, setFilled] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
    const [wrongId, setWrongId] = useState<string | null>(null);

    const activeIndex = useMemo(() => slots.findIndex((s) => !filled[s.id]), [slots, filled]);
    const phase: Phase = activeIndex === -1 ? 'complete' : 'building';
    const active = activeIndex >= 0 ? slots[activeIndex] : null;

    function choose(slot: ByggerSlot, option: ByggerOption) {
        if (option.correct) {
            setFilled((prev) => ({ ...prev, [slot.id]: option.label }));
            setFeedback({ text: option.feedback, ok: true });
            setWrongId(null);
        } else {
            setFeedback({ text: option.feedback, ok: false });
            setWrongId(option.id);
            window.setTimeout(() => setWrongId(null), 600);
        }
    }

    function reset() {
        setFilled({});
        setFeedback(null);
        setWrongId(null);
    }

    return (
        <div className="my-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-start gap-2.5">
                    <Compass className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <h4 className="font-display font-bold text-slate-900 leading-tight">
                            {title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-0.5 leading-snug">{intro}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 grid gap-4 md:grid-cols-2">
                {/* Byggverket: de fire spørsmålene */}
                <div className="space-y-2">
                    {slots.map((slot, i) => {
                        const answer = filled[slot.id];
                        const isActive = i === activeIndex;
                        return (
                            <motion.div
                                key={slot.id}
                                layout
                                className={`rounded-xl border px-3 py-2 ${
                                    answer
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : isActive
                                          ? 'bg-white border-indigo-300 shadow-sm'
                                          : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex-shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${
                                            answer
                                                ? 'bg-emerald-500 text-white'
                                                : isActive
                                                  ? 'bg-indigo-600 text-white'
                                                  : 'bg-slate-300 text-white'
                                        }`}
                                    >
                                        {answer ? <Check className="w-3 h-3" /> : i + 1}
                                    </span>
                                    <p
                                        className={`text-xs font-semibold leading-snug ${
                                            answer
                                                ? 'text-emerald-900'
                                                : isActive
                                                  ? 'text-slate-900'
                                                  : 'text-slate-400'
                                        }`}
                                    >
                                        {slot.question}
                                    </p>
                                </div>
                                <AnimatePresence>
                                    {answer && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-xs text-emerald-800 mt-1.5 pl-7 leading-relaxed"
                                        >
                                            <span className="font-bold">{slot.tag}: </span>
                                            {answer}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Valgflate + feedback */}
                <div className="flex flex-col">
                    <AnimatePresence mode="wait">
                        {active ? (
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-2"
                            >
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Velg svaret
                                </p>
                                {active.options.map((opt) => (
                                    <motion.button
                                        key={opt.id}
                                        onClick={() => choose(active, opt)}
                                        whileTap={{ scale: 0.98 }}
                                        animate={
                                            wrongId === opt.id ? { x: [0, -6, 6, -4, 0] } : { x: 0 }
                                        }
                                        className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-md shadow-sm transition text-sm text-slate-700 leading-snug"
                                    >
                                        {opt.label}
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <p className="font-bold text-emerald-900">{successTitle}</p>
                                </div>
                                <p className="text-sm text-emerald-800 mt-1.5 leading-relaxed">
                                    {successText}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feedback-sonen ligger alltid i DOM-et */}
                    <div className="mt-3">
                        <div
                            className={`rounded-xl border px-3 py-2 text-xs leading-relaxed min-h-[3.25rem] flex items-start gap-2 ${
                                feedback
                                    ? feedback.ok
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                                {feedback
                                    ? feedback.text
                                    : 'Velg et svar, så får du vite hvem som svarer slik.'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {phase === 'complete'
                        ? 'Alle fire spørsmålene er besvart.'
                        : `Spørsmål ${activeIndex + 1} av ${slots.length}`}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-xs font-bold transition"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
