import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, Check, X, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: etter denne interaksjonen skal eleven kjenne igjen
// grunnmønsteret i Daodejing - at boka nesten alltid velger det myke, det
// stille og det tomme framfor det harde, det høylytte og det fulle.

interface DaodejingParadoksetProps {
    title?: string;
    intro?: string;
}

interface Paradox {
    start: string;
    options: [string, string];
    correct: 0 | 1;
    why: string;
}

const PARADOXES: Paradox[] = [
    {
        start: 'Den som vet,',
        options: ['sier lite.', 'snakker mest.'],
        correct: 0,
        why: 'Kapittel 56. Den som virkelig har skjønt noe, trenger ikke overbevise hele rommet.',
    },
    {
        start: 'Det mykeste i verden',
        options: ['gir etter for det hardeste.', 'overvinner det hardeste.'],
        correct: 1,
        why: 'Kapittel 43. Vann sliter ned stein. Det tar lang tid, men steinen taper til slutt.',
    },
    {
        start: 'Den beste lederen er den folket',
        options: ['roper høyest for.', 'nesten ikke merker.'],
        correct: 1,
        why: 'Kapittel 17. Går alt av seg selv, sier folk etterpå at de klarte det selv.',
    },
    {
        start: 'Hjulet er til nytte på grunn av',
        options: ['det tomme hullet i midten.', 'de tretti eikene.'],
        correct: 0,
        why: 'Kapittel 11. Uten hullet i navet er hjulet bare en trekloss. Det tomme gjør jobben.',
    },
    {
        start: 'Ingenting i verden er mykere enn vann, og likevel',
        options: ['viker det for alt som er hardt.', 'er ingenting bedre til å slite ned det harde.'],
        correct: 1,
        why: 'Kapittel 78. Dette er bildet hele boka bygger på: å gi etter er ikke å tape.',
    },
];

type Phase = 'choosing' | 'answered' | 'complete';

export function DaodejingParadokset({
    title = 'Hva står det egentlig i Daodejing?',
    intro = 'Velg slutten du tror Laozi skrev.',
}: DaodejingParadoksetProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('choosing');
    const [picked, setPicked] = useState<number | null>(null);
    const [hits, setHits] = useState(0);

    const item = PARADOXES[index];
    const isLast = index === PARADOXES.length - 1;

    const handlePick = (i: number) => {
        if (phase !== 'choosing') return;
        setPicked(i);
        if (i === item.correct) setHits((h) => h + 1);
        setPhase('answered');
    };

    const handleNext = () => {
        if (isLast) {
            setPhase('complete');
            return;
        }
        setIndex((n) => n + 1);
        setPicked(null);
        setPhase('choosing');
    };

    const handleReset = () => {
        setIndex(0);
        setPhase('choosing');
        setPicked(null);
        setHits(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Feather className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Framdriftsprikker */}
            <div className="px-6 pt-4 flex items-center gap-1.5">
                {PARADOXES.map((_, i) => (
                    <motion.span
                        key={i}
                        animate={{
                            backgroundColor:
                                i < index || phase === 'complete'
                                    ? '#6366f1'
                                    : i === index
                                      ? '#a5b4fc'
                                      : '#e2e8f0',
                        }}
                        className="h-1.5 flex-1 rounded-full"
                    />
                ))}
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="text-center py-2"
                        >
                            <motion.div
                                initial={{ rotate: -14, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 mb-3"
                            >
                                <Sparkles className="w-7 h-7 text-emerald-600" />
                            </motion.div>
                            <p className="text-slate-800 font-semibold mb-1">
                                Du traff {hits} av {PARADOXES.length}
                            </p>
                            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                                Legg merke til mønsteret: fem ganger på rad velger Daodejing det
                                myke, det stille og det tomme. Det er ikke tilfeldig. Boka mener at
                                den som slutter å presse, får mest gjort.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <p className="text-lg text-slate-800 font-display mb-4 leading-snug">
                                «{item.start} ...»
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {item.options.map((opt, i) => {
                                    const isCorrect = i === item.correct;
                                    const show = phase === 'answered';
                                    const tone = !show
                                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                        : isCorrect
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          : picked === i
                                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-400';
                                    return (
                                        <motion.button
                                            key={i}
                                            onClick={() => handlePick(i)}
                                            disabled={show}
                                            whileTap={show ? undefined : { scale: 0.97 }}
                                            className={`text-left px-4 py-3 rounded-xl border text-sm leading-snug transition-colors ${tone}`}
                                        >
                                            <span className="flex items-start gap-2">
                                                {show && isCorrect && (
                                                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                                                )}
                                                {show && !isCorrect && picked === i && (
                                                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                                                )}
                                                <span>{opt}</span>
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm min-h-[3.25rem] flex items-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${index}-${phase}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="leading-snug"
                    >
                        {phase === 'answered'
                            ? item.why
                            : phase === 'complete'
                              ? 'Vann gir etter for alt, og likevel former det landskapet. Det er derfor Laozi bruker det som bilde på dao.'
                              : 'Begge slutter setningen på en måte som gir mening. Bare én av dem står i boka.'}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={handleNext}
                    disabled={phase !== 'answered'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {isLast ? 'Se mønsteret' : 'Neste'}
                </button>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
