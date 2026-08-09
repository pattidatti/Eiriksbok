import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { MiniGameHeader } from './MiniGameHeader';

interface Telegram {
    id: string;
    from: string;
    preview: string;
    correctBucket: 'urgent' | 'wait';
}

interface TelegramGameProps {
    config: {
        onComplete: { nextNodeId: string };
        telegrams: Telegram[];
    };
    onComplete: (results: { correct: number; total: number }) => void;
}

export const TelegramGame: React.FC<TelegramGameProps> = ({ config, onComplete }) => {
    const [sorted, setSorted] = useState<Record<string, 'urgent' | 'wait'>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleChoose = (bucket: 'urgent' | 'wait') => {
        const telegram = config.telegrams[currentIndex];
        const newSorted = { ...sorted, [telegram.id]: bucket };
        setSorted(newSorted);

        const isLast = currentIndex === config.telegrams.length - 1;
        if (isLast) {
            let correct = 0;
            config.telegrams.forEach((t) => {
                if (newSorted[t.id] === t.correctBucket) correct++;
            });
            setScore(correct);
            setSubmitted(true);
            setTimeout(() => {
                onComplete({ correct, total: config.telegrams.length });
            }, 2500);
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    if (submitted) {
        const pct = score / config.telegrams.length;
        return (
            <div className="flex flex-col items-center justify-center p-4 bg-stone-100 rounded-3xl border border-stone-200">
                <CheckCircle className="text-emerald-600 mb-1.5" size={24} />
                <h3 className="text-base font-bold text-stone-800 mb-1.5">
                    {score}/{config.telegrams.length} riktig prioritert
                </h3>
                <p className="text-stone-600 text-center text-xs">
                    {pct >= 0.8
                        ? 'Utmerket diplomatisk instinkt — de kritiske meldingene ble fanget opp.'
                        : pct >= 0.5
                          ? 'Noen feilprioritering i kaosen — noen viktige meldinger gikk tapt.'
                          : 'Katastrofal prioritering — de viktigste diplomatiske signalene ble oversett.'}
                </p>
            </div>
        );
    }

    const telegram = config.telegrams[currentIndex];

    return (
        <div className="bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden">
            <MiniGameHeader
                icon={Mail}
                title="Telegram-triage"
                badge={
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                        {currentIndex + 1}/{config.telegrams.length}
                    </span>
                }
            />

            {/* Progress bar */}
            <div className="h-0.5 bg-stone-700">
                <div
                    className="h-full bg-stone-400 transition-all duration-300"
                    style={{ width: `${(currentIndex / config.telegrams.length) * 100}%` }}
                />
            </div>

            {/* Telegram-kort med slide-animasjon */}
            <div className="p-3 min-h-[80px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={telegram.id}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -30, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 truncate">
                            Fra: {telegram.from}
                        </div>
                        <p className="text-sm text-stone-700 leading-relaxed italic">
                            &quot;{telegram.preview}&quot;
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Faste action-knapper */}
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleChoose('urgent')}
                    className="py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-red-600"
                >
                    <AlertTriangle size={11} />
                    Haster
                </button>
                <button
                    onClick={() => handleChoose('wait')}
                    className="py-2.5 rounded-xl bg-stone-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-stone-700"
                >
                    <Clock size={11} />
                    Kan vente
                </button>
            </div>
        </div>
    );
};
