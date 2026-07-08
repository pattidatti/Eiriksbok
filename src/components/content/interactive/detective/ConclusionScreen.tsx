import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, ArrowLeft, Lightbulb, Info, CheckCircle2, Plus } from 'lucide-react';
import type { ConclusionOption, DetectiveClue, DetectiveConclusion } from './types';

interface ConclusionResult {
    optionId: string;
    isCorrect: boolean;
    evidenceUsed: string[];
    strongEvidenceCount: number;
    weakEvidenceCount: number;
    stars: number;
}

interface ConclusionScreenProps {
    conclusionData: DetectiveConclusion;
    collectedClues: DetectiveClue[];
    onRestart: () => void;
    onSubmit: (result: ConclusionResult) => void;
}

function evaluate(
    option: ConclusionOption,
    selectedEvidenceIds: string[]
): Omit<ConclusionResult, 'optionId'> {
    const supported = new Set(option.supportedBy ?? []);
    let strong = 0;
    let weak = 0;
    for (const id of selectedEvidenceIds) {
        if (supported.has(id)) strong++;
        else weak++;
    }
    const isCorrect = option.correct === true;
    let stars = 1;
    if (isCorrect && strong >= 2) stars = 3;
    else if (isCorrect && strong >= 1) stars = 2;
    else if (!isCorrect && strong >= 1) stars = 1;
    return {
        isCorrect,
        evidenceUsed: selectedEvidenceIds,
        strongEvidenceCount: strong,
        weakEvidenceCount: weak,
        stars,
    };
}

export const ConclusionScreen: React.FC<ConclusionScreenProps> = ({
    conclusionData,
    collectedClues,
    onRestart,
    onSubmit,
}) => {
    const minimum = conclusionData.minimumEvidence ?? 2;
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);

    const selectedOption = useMemo(
        () => conclusionData.options.find((o) => o.id === selectedOptionId) ?? null,
        [conclusionData.options, selectedOptionId]
    );

    const result = useMemo(() => {
        if (!selectedOption) return null;
        return { optionId: selectedOption.id, ...evaluate(selectedOption, selectedEvidence) };
    }, [selectedOption, selectedEvidence]);

    const canSubmit = !!selectedOption && selectedEvidence.length >= minimum;

    const toggleEvidence = (id: string) => {
        if (showResult) return;
        setSelectedEvidence((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const submit = () => {
        if (!result || !canSubmit) return;
        setShowResult(true);
    };

    const confirmAndExit = () => {
        if (!result) return;
        onSubmit(result);
    };

    return (
        <div className="flex-1 flex flex-col bg-[var(--det-bg)] text-[var(--det-text)] rounded-2xl overflow-hidden border border-[var(--det-border)] shadow-xl">
            <div className="flex-1 flex flex-col p-4 md:p-6 max-w-3xl mx-auto w-full overflow-y-auto custom-scrollbar">
                <header className="text-center mb-6">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border"
                        style={{
                            background: 'color-mix(in srgb, var(--det-accent) 12%, transparent)',
                            color: 'var(--det-accent)',
                            borderColor: 'color-mix(in srgb, var(--det-accent) 30%, transparent)',
                        }}
                    >
                        <Flag className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--det-text)] mb-1">
                        Tid for konklusjon
                    </h2>
                    <p className="text-base text-[var(--det-text-muted)]">
                        Velg svaret du tror er riktig, og merk bevisene som støtter det.
                    </p>
                </header>

                {/* 1. Spørsmål og alternativer */}
                <div className="bg-[var(--det-surface)] rounded-xl border border-[var(--det-border)] p-4 mb-4">
                    <h3 className="text-lg font-bold text-[var(--det-text)] mb-3 flex items-center gap-2 leading-snug">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        {conclusionData.question}
                    </h3>

                    <div className="space-y-2">
                        {conclusionData.options.map((option) => {
                            const isSelected = selectedOptionId === option.id;
                            const isCorrectReveal = showResult && option.correct === true;
                            const isWrongChoice =
                                showResult && isSelected && option.correct !== true;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => !showResult && setSelectedOptionId(option.id)}
                                    disabled={showResult}
                                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? 'border-[var(--det-accent)] bg-[var(--det-accent)]/10 text-[var(--det-text)] shadow-sm'
                                            : 'border-[var(--det-border)] bg-[var(--det-bg)] text-[var(--det-text-muted)] hover:border-[var(--det-accent)]/40'
                                    } ${isCorrectReveal ? 'ring-2 ring-emerald-400' : ''} ${
                                        isWrongChoice ? 'ring-2 ring-rose-400' : ''
                                    } ${showResult ? 'cursor-default' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                isSelected
                                                    ? 'border-[var(--det-accent)] bg-[var(--det-accent)]/25'
                                                    : 'border-slate-300'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-[var(--det-accent)]" />
                                            )}
                                        </div>
                                        <span className="font-medium flex-1 text-base leading-snug">
                                            {option.text}
                                        </span>
                                        {isCorrectReveal && (
                                            <span className="text-xs font-bold uppercase text-emerald-600 tracking-wider">
                                                Konsensus
                                            </span>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {showResult && isSelected && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 pt-3 border-t border-[var(--det-border)] text-[var(--det-text-muted)] text-base"
                                            >
                                                <div className="flex gap-2">
                                                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--det-accent)]" />
                                                    <p className="leading-relaxed">
                                                        {option.feedback}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Bevisene dine – én liste som bygger argumentet */}
                <div className="bg-[var(--det-surface)] rounded-xl border border-[var(--det-border)] p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-[var(--det-text)] uppercase tracking-wider">
                            Velg bevisene som støtter svaret
                        </h3>
                        <span className="text-sm text-[var(--det-text-muted)]">
                            <span
                                className={
                                    selectedEvidence.length >= minimum
                                        ? 'text-emerald-600 font-bold'
                                        : 'text-[var(--det-text)] font-bold'
                                }
                            >
                                {selectedEvidence.length}
                            </span>
                            /{minimum} minimum
                        </span>
                    </div>

                    {collectedClues.length === 0 ? (
                        <p className="text-sm text-amber-600 italic py-2">
                            Du har ikke samlet noen bevis. Gå tilbake og let i kildene.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {collectedClues.map((clue) => {
                                const isSelected = selectedEvidence.includes(clue.id);
                                const isStrong =
                                    showResult &&
                                    isSelected &&
                                    selectedOption?.supportedBy?.includes(clue.id);
                                const isWeak =
                                    showResult &&
                                    isSelected &&
                                    !selectedOption?.supportedBy?.includes(clue.id);
                                return (
                                    <button
                                        key={clue.id}
                                        onClick={() => toggleEvidence(clue.id)}
                                        disabled={showResult}
                                        className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all ${
                                            isStrong
                                                ? 'border-emerald-300 bg-emerald-50'
                                                : isWeak
                                                  ? 'border-rose-300 bg-rose-50'
                                                  : isSelected
                                                    ? 'border-[var(--det-accent)] bg-[var(--det-accent)]/10'
                                                    : `border-[var(--det-border)] bg-[var(--det-bg)] ${
                                                          showResult
                                                              ? 'opacity-50'
                                                              : 'hover:border-[var(--det-accent)]/40'
                                                      }`
                                        }`}
                                    >
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                                isSelected
                                                    ? 'bg-[var(--det-accent)]/25'
                                                    : 'bg-[var(--det-elevated)]'
                                            }`}
                                        >
                                            {isSelected ? (
                                                <CheckCircle2 className="w-3 h-3 text-[var(--det-accent)]" />
                                            ) : (
                                                <Plus className="w-3 h-3 text-[var(--det-text-muted)]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-sm text-[var(--det-text)] leading-snug">
                                                "{clue.text}"
                                            </span>
                                            {showResult && isSelected && (
                                                <span
                                                    className={`block text-xs mt-0.5 ${
                                                        isStrong
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-500'
                                                    }`}
                                                >
                                                    {isStrong
                                                        ? 'Styrker dette svaret'
                                                        : 'Passer dårlig til dette svaret'}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. Resultatsammendrag */}
                <AnimatePresence>
                    {showResult && result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-xl bg-[var(--det-surface)] border border-[var(--det-border)]"
                        >
                            <h4 className="text-xs font-bold text-[var(--det-text-muted)] uppercase tracking-wider mb-2">
                                Vurdering av argumentet
                            </h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-lg font-bold text-emerald-600">
                                        {result.strongEvidenceCount}
                                    </div>
                                    <div className="text-xs text-[var(--det-text-muted)] uppercase">
                                        Sterke
                                    </div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-rose-500">
                                        {result.weakEvidenceCount}
                                    </div>
                                    <div className="text-xs text-[var(--det-text-muted)] uppercase">
                                        Svake
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`text-lg font-bold ${
                                            result.isCorrect ? 'text-emerald-600' : 'text-amber-600'
                                        }`}
                                    >
                                        {result.isCorrect ? 'Treffer' : 'Bommer'}
                                    </div>
                                    <div className="text-xs text-[var(--det-text-muted)] uppercase">
                                        Konsensus
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer-knapper */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <button
                        onClick={onRestart}
                        className="flex items-center gap-1.5 px-3 py-2 text-base text-[var(--det-text-muted)] hover:text-[var(--det-text)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Se kildene igjen
                    </button>

                    {!showResult ? (
                        <button
                            disabled={!canSubmit}
                            onClick={submit}
                            className={`px-6 py-3 rounded-xl font-bold text-base transition-all ${
                                canSubmit
                                    ? 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Legg fram argumentet
                        </button>
                    ) : (
                        <button
                            onClick={confirmAndExit}
                            className="px-6 py-3 rounded-xl font-bold text-base text-white hover:opacity-90 transition-all shadow-lg"
                            style={{ background: 'var(--det-accent)' }}
                        >
                            Avslutt saken
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export type { ConclusionResult };
