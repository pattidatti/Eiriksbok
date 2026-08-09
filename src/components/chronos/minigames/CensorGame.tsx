import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { MiniGameHeader } from './MiniGameHeader';

type LetterToken =
    | { type: 'text'; content: string }
    | { type: 'phrase'; id: string; text: string; shouldCensor: boolean; reason: string };

interface CensorGameProps {
    config: {
        onComplete: { nextNodeId: string };
        paragraphs: Array<{
            id: string;
            tokens: LetterToken[];
        }>;
    };
    onComplete: () => void;
}

export const CensorGame: React.FC<CensorGameProps> = ({ config, onComplete }) => {
    const [censored, setCensored] = useState<Set<string>>(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    const allPhrases = config.paragraphs.flatMap((p) =>
        p.tokens.filter((t): t is Extract<LetterToken, { type: 'phrase' }> => t.type === 'phrase')
    );

    const toggleCensor = (id: string) => {
        if (submitted) return;
        setCensored((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmit = () => {
        setSubmitted(true);
        setTimeout(() => onComplete(), 3500);
    };

    const correctlyCensored = allPhrases.filter(
        (p) => p.shouldCensor && censored.has(p.id)
    ).length;
    const incorrectlyCensored = allPhrases.filter(
        (p) => !p.shouldCensor && censored.has(p.id)
    ).length;
    const missedCensor = allPhrases.filter(
        (p) => p.shouldCensor && !censored.has(p.id)
    ).length;

    return (
        <div className="bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden">
            <MiniGameHeader icon={Scissors} title="Militærsensur" />

            {/* Letter */}
            <div className="p-5 bg-amber-50/60 border-b border-stone-200">
                <div className="bg-white rounded-2xl p-5 shadow-inner border border-amber-100">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                        <span>Fra: Menig Thomas Berg, 2. bataljon</span>
                        <span>•</span>
                        <span>Til: Harald Berg, Bergen</span>
                    </div>
                    <div className="space-y-3 font-serif text-sm text-stone-800 leading-relaxed">
                        {config.paragraphs.map((para) => (
                            <p key={para.id}>
                                {para.tokens.map((token, i) => {
                                    if (token.type === 'text') {
                                        return (
                                            <span
                                                key={i}
                                                className={
                                                    submitted && showOriginal ? '' : ''
                                                }
                                            >
                                                {token.content}
                                            </span>
                                        );
                                    }
                                    const isCensored = censored.has(token.id);
                                    const isCorrect = token.shouldCensor;
                                    return (
                                        <motion.button
                                            key={token.id}
                                            onClick={() => toggleCensor(token.id)}
                                            whileTap={{ scale: 0.97 }}
                                            title={submitted ? (isCorrect ? `Riktig: ${token.reason}` : 'Uskyldig — ikke nødvendig å sensurere') : 'Klikk for å sensurere'}
                                            className={`inline rounded px-0.5 transition-all duration-200 cursor-pointer ${
                                                submitted
                                                    ? isCensored
                                                        ? isCorrect
                                                            ? 'bg-emerald-900 text-emerald-900 line-through decoration-emerald-900'
                                                            : 'bg-amber-400/50 text-amber-900 line-through'
                                                        : isCorrect && !showOriginal
                                                          ? 'bg-rose-200 text-rose-800 underline decoration-rose-400 decoration-dotted'
                                                          : ''
                                                    : isCensored
                                                      ? 'bg-stone-900 text-stone-900 rounded'
                                                      : 'bg-yellow-100 hover:bg-yellow-200 text-stone-800 rounded underline decoration-dotted decoration-stone-400'
                                            }`}
                                        >
                                            {submitted && isCensored && !showOriginal ? '█'.repeat(Math.ceil(token.text.length / 2)) : token.text}
                                        </motion.button>
                                    );
                                })}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback after submit */}
            {submitted && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 space-y-3"
                >
                    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-stone-200">
                        <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-stone-800 mb-1">Sensurresultat</p>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                <span className="text-emerald-700 font-bold">{correctlyCensored} riktig strøket</span>
                                {incorrectlyCensored > 0 && (
                                    <span>
                                        {' '}· <span className="text-amber-700 font-bold">{incorrectlyCensored} uskyldige fraser strøket</span>
                                    </span>
                                )}
                                {missedCensor > 0 && (
                                    <span>
                                        {' '}· <span className="text-rose-700 font-bold">{missedCensor} farlig innhold slapp igjennom</span>
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-stone-500 mt-2 italic">
                                {missedCensor === 0
                                    ? 'Ingen sensitiv informasjon nådde familien. Thomas\'s posisjon og moral er beskyttet.'
                                    : `${missedCensor} phrase${missedCensor > 1 ? 'r' : ''} med sensitiv informasjon nådde Bergen. Fienden leser også brev.`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="w-full py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
                    >
                        {showOriginal ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showOriginal ? 'Skjul original' : 'Vis hva familien fikk lese'}
                    </button>
                </motion.div>
            )}

            {!submitted && (
                <div className="p-4">
                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors"
                    >
                        Send sensurert brev
                    </button>
                </div>
            )}
        </div>
    );
};
