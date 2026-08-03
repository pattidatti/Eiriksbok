import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ArticleContent } from '../../ArticleContent';
import { useStepSounds } from '../../../hooks/useStepSounds';
import type { ContentBlock } from '../../../types';
import type { StepRendererProps } from './types';

// Artikkelen rendres direkte i steget. Hvis steget har `articleAnchors`,
// brytes innholdet opp i seksjoner — ett comprehension-spørsmål låser opp
// neste seksjon. Hvis ingen anker er definert, vises artikkelen i sin
// helhet og elev bekrefter "Jeg har lest".
export const InlineArticleStep: React.FC<StepRendererProps> = ({
    step,
    onComplete,
    isAlreadyCompleted,
}) => {
    const [content, setContent] = useState<ContentBlock[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [revealedIndex, setRevealedIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const sounds = useStepSounds();

    const anchors = useMemo(
        () => [...(step.articleAnchors ?? [])].sort((a, b) => a.afterBlockIndex - b.afterBlockIndex),
        [step.articleAnchors]
    );

    // En manglende lenke er ikke noe vi trenger å hente for å oppdage — det ses
    // direkte på steget. Bare selve nettverksfeilene går via state.
    const missingUrl = !step.articleUrl;

    useEffect(() => {
        if (!step.articleUrl) return;
        const path = `/content${step.articleUrl}.json`;
        let cancelled = false;
        fetch(path)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data?.content)) {
                    setContent(data.content);
                } else {
                    setError('Artikkelen mangler innhold.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Kunne ikke laste artikkelen.');
            });
        return () => {
            cancelled = true;
        };
    }, [step.articleUrl]);

    if (missingUrl || error) {
        return (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900">
                {missingUrl ? 'Mangler artikkellenke.' : error}
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                Laster artikkelen...
            </div>
        );
    }

    // Hvis ingen anker, vis hele artikkelen i én blokk
    if (anchors.length === 0) {
        return (
            <article className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        {step.articleTitle ?? 'Artikkel'}
                    </span>
                </div>
                <ArticleContent content={content} />
                <div className="mt-8 pt-5 border-t border-slate-100">
                    <button
                        onClick={() => {
                            sounds.play('complete');
                            onComplete({ score: 1, completed: true });
                        }}
                        disabled={isAlreadyCompleted}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {isAlreadyCompleted ? 'Allerede fullført' : 'Jeg har lest hele'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </article>
        );
    }

    // Med anker: del artikkelen opp i sekvensielle "rounds".
    // Hver round = [start, anchor.afterBlockIndex], så spørsmål, så neste runde.
    const totalRounds = anchors.length + 1;
    const currentAnchor = anchors[revealedIndex];

    const sliceStart =
        revealedIndex === 0 ? 0 : anchors[revealedIndex - 1].afterBlockIndex + 1;
    const sliceEnd = currentAnchor
        ? currentAnchor.afterBlockIndex + 1
        : content.length;
    const visibleBlocks = content.slice(sliceStart, sliceEnd);

    const handleAnswer = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
        sounds.play('select');
    };

    const handleConfirm = () => {
        if (selectedOption === null || !currentAnchor) return;
        setShowFeedback(true);
        sounds.play(selectedOption === currentAnchor.question.correct ? 'correct' : 'incorrect');
    };

    const handleAdvance = () => {
        const nextAnswers = [...answers, selectedOption!];
        setAnswers(nextAnswers);
        setSelectedOption(null);
        setShowFeedback(false);

        const isLast = revealedIndex === anchors.length - 1;
        if (isLast) {
            const correctCount = nextAnswers.filter(
                (a, i) => a === anchors[i].question.correct
            ).length;
            const score = correctCount / anchors.length;
            sounds.play('complete');
            onComplete({ score, completed: true, answers: nextAnswers });
        } else {
            setRevealedIndex(revealedIndex + 1);
            sounds.play('advance');
        }
    };

    return (
        <article className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        {step.articleTitle ?? 'Artikkel'}
                    </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                    Seksjon {revealedIndex + 1}/{totalRounds}
                </span>
            </div>

            <motion.div
                key={revealedIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <ArticleContent content={visibleBlocks} />
            </motion.div>

            <AnimatePresence mode="wait">
                {currentAnchor && (
                    <motion.div
                        key={'anchor-' + revealedIndex}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="mt-7 pt-5 border-t-2 border-dashed border-indigo-200 bg-indigo-50/50 -mx-5 md:-mx-8 px-5 md:px-8 py-5 rounded-b-2xl"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                            Sjekk forståelsen før du leser videre
                        </span>
                        <p className="text-base md:text-lg font-bold text-slate-900 mt-1 mb-4">
                            {currentAnchor.question.question}
                        </p>
                        <div className="space-y-2 mb-4">
                            {currentAnchor.question.options.map((opt, i) => {
                                const isSelected = selectedOption === i;
                                const isCorrectOpt = i === currentAnchor.question.correct;
                                let cls =
                                    'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm md:text-base ';
                                if (showFeedback) {
                                    if (isCorrectOpt) {
                                        cls +=
                                            'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold';
                                    } else if (isSelected) {
                                        cls += 'border-rose-400 bg-rose-50 text-rose-900';
                                    } else {
                                        cls += 'border-slate-200 bg-white text-slate-500';
                                    }
                                } else if (isSelected) {
                                    cls +=
                                        'border-indigo-500 bg-white text-indigo-900 font-semibold';
                                } else {
                                    cls +=
                                        'border-slate-200 bg-white text-slate-700 hover:border-indigo-300';
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={showFeedback}
                                        className={cls}
                                    >
                                        <span className="font-mono text-xs mr-3 text-slate-400">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {showFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl p-3 mb-4 ${
                                    selectedOption === currentAnchor.question.correct
                                        ? 'bg-emerald-50 border border-emerald-200'
                                        : 'bg-rose-50 border border-rose-200'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    {selectedOption === currentAnchor.question.correct ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p
                                        className={`text-xs ${
                                            selectedOption === currentAnchor.question.correct
                                                ? 'text-emerald-900'
                                                : 'text-rose-900'
                                        }`}
                                    >
                                        {currentAnchor.question.explanation ??
                                            (selectedOption === currentAnchor.question.correct
                                                ? 'Riktig!'
                                                : 'Ikke helt. Se på riktig svar over.')}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex justify-end">
                            {!showFeedback ? (
                                <button
                                    onClick={handleConfirm}
                                    disabled={selectedOption === null}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    Sjekk svar
                                </button>
                            ) : (
                                <button
                                    onClick={handleAdvance}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-slate-800 transition"
                                >
                                    {revealedIndex === anchors.length - 1
                                        ? 'Fullfør artikkelen'
                                        : 'Les videre'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
};
