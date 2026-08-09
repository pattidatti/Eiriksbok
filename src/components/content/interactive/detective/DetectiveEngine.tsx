import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Scale,
    Star,
    AlertCircle,
    CheckCircle2,
    Copy,
    Download,
    BookOpen,
    GraduationCap,
    Check,
} from 'lucide-react';
import { useDetectiveState } from './useDetectiveState';
import { SourceViewer } from './SourceViewer';
import { ConclusionScreen, type ConclusionResult } from './ConclusionScreen';
import { BriefingScreen } from './BriefingScreen';
import { TheoryBalance } from './TheoryBalance';
import type { DetectiveCase } from './types';
import { METHOD_LABEL, METHOD_EXPLANATION } from './types';
import { useNavigate } from 'react-router-dom';
import { getTheme, themeStyleVars } from './themes';
import { saveCaseProgress } from './useDetectiveProgress';
import { buildReport, copyReport, downloadReport } from './investigationReport';

interface DetectiveEngineProps {
    data: DetectiveCase;
}

function StarRating({ stars, size = 'md' }: { stars: number; size?: 'sm' | 'md' }) {
    const px = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 400 }}
                >
                    <Star
                        className={`${px} ${
                            i <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 fill-slate-200'
                        }`}
                    />
                </motion.div>
            ))}
        </div>
    );
}

export const DetectiveEngine: React.FC<DetectiveEngineProps> = ({ data }) => {
    const state = useDetectiveState(data);
    const navigate = useNavigate();
    const theme = useMemo(() => getTheme(data.theme), [data.theme]);
    const themeVars = useMemo(() => themeStyleVars(theme), [theme]);

    const {
        currentStep,
        currentStepIndex,
        totalSteps,
        nextStep,
        prevStep,
        isFirstStep,
        isLastStep,
        isConclusionVisible,
        setIsConclusionVisible,
        isBriefingVisible,
        setIsBriefingVisible,
    } = state;

    const [activeSourceIndex, setActiveSourceIndex] = useState(0);
    const [finalResult, setFinalResult] = useState<ConclusionResult | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const [theoryOpen, setTheoryOpen] = useState(false);

    const stepId = currentStep?.id;
    const [prevStepId, setPrevStepId] = useState(stepId);
    if (stepId !== prevStepId) {
        setPrevStepId(stepId);
        setActiveSourceIndex(0);
    }

    // Stjerner basert på enten konklusjon eller bevis-andel
    const evidenceStars = useMemo(() => {
        const found = state.collectedClues.size;
        const total = data.status.totalEvidence;
        const pct = total > 0 ? found / total : 0;
        if (pct >= 1) return 3;
        if (pct > 0.5) return 2;
        return 1;
    }, [state.collectedClues.size, data.status.totalEvidence]);

    const displayedStars = finalResult?.stars ?? evidenceStars;

    // Lagre progresjon ved hver bevis-innhenting og ved steg-bytte
    useEffect(() => {
        if (!data.id || state.isCompleted) return;
        if (isBriefingVisible) return;
        saveCaseProgress(data.id, {
            completed: false,
            stars: evidenceStars,
            foundClues: Array.from(state.collectedClues),
            currentStepIndex,
        });
    }, [
        data.id,
        state.collectedClues,
        currentStepIndex,
        evidenceStars,
        isBriefingVisible,
        state.isCompleted,
    ]);

    // Lagre fullføring
    useEffect(() => {
        if (state.isCompleted && data.id) {
            const stars = finalResult?.stars ?? evidenceStars;
            saveCaseProgress(data.id, {
                completed: true,
                stars,
                foundClues: Array.from(state.collectedClues),
                currentStepIndex: null,
                chosenOption: finalResult?.optionId,
                chosenEvidence: finalResult?.evidenceUsed,
            });
            // «Min læring»: sak løst - stjerner (1-3) normaliseres til 0-1
            import('../../../../features/progress/useProgressStore').then(
                ({ useProgressStore }) => {
                    useProgressStore.getState().recordActivity({
                        kind: 'detective-solved',
                        activityId: `detektiv/${data.id}`,
                        score: stars / 3,
                        title: data.title,
                    });
                }
            );
        }
    }, [state.isCompleted, data.id, data.title, finalResult, evidenceStars, state.collectedClues]);

    if (isBriefingVisible && data.briefing) {
        return (
            <div style={themeVars} className="flex-1 flex flex-col min-h-0">
                <BriefingScreen
                    briefing={data.briefing}
                    onStart={() => setIsBriefingVisible(false)}
                />
            </div>
        );
    }

    if (state.isCompleted) {
        const found = state.collectedClues.size;
        const total = data.status.totalEvidence;
        const missed = total - found;
        const methods = Array.from(
            new Set(state.collectedClueDetails.map((c) => c.method).filter(Boolean))
        ) as Array<NonNullable<(typeof state.collectedClueDetails)[number]['method']>>;

        const report = buildReport(
            data,
            state.collectedClueDetails,
            finalResult,
            displayedStars
        );

        const onCopy = async () => {
            const ok = await copyReport(report);
            setCopyStatus(ok ? 'copied' : 'failed');
            setTimeout(() => setCopyStatus('idle'), 2200);
        };

        return (
            <div
                style={themeVars}
                className="flex-1 flex flex-col p-4 md:p-6 bg-[var(--det-bg)] text-[var(--det-text)] overflow-y-auto custom-scrollbar"
            >
                <div className="max-w-3xl w-full mx-auto">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border"
                        style={{
                            background:
                                'color-mix(in srgb, var(--det-accent) 20%, transparent)',
                            color: 'var(--det-accent)',
                            borderColor:
                                'color-mix(in srgb, var(--det-accent) 35%, transparent)',
                        }}
                    >
                        <Search className="w-8 h-8" />
                    </motion.div>

                    <h2 className="text-2xl font-display font-bold text-[var(--det-text)] text-center mb-2">
                        Saken er avsluttet
                    </h2>

                    <div className="flex justify-center mb-3">
                        <StarRating stars={displayedStars} />
                    </div>

                    <p className="text-base text-[var(--det-text-muted)] text-center mb-6">
                        Du fant{' '}
                        <span className="text-[var(--det-accent)] font-bold">
                            {found} av {total}
                        </span>{' '}
                        bevis
                        {finalResult && (
                            <>
                                {' '}
                                ·{' '}
                                <span
                                    className={
                                        finalResult.isCorrect
                                            ? 'text-emerald-600 font-bold'
                                            : 'text-amber-600 font-bold'
                                    }
                                >
                                    {finalResult.isCorrect ? 'Korrekt konklusjon' : 'Avvik fra konsensus'}
                                </span>
                            </>
                        )}
                    </p>

                    {state.collectedClueDetails.length > 0 && (
                        <div className="mb-5">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                Dine funn
                            </h3>
                            <div className="space-y-2">
                                {state.collectedClueDetails.map((clue) => (
                                    <div
                                        key={clue.id}
                                        className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-emerald-800">
                                                "{clue.text}"
                                            </p>
                                            <p className="text-sm text-[var(--det-text-muted)] leading-snug mt-0.5">
                                                {clue.insight}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {methods.length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)] border border-[var(--det-border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="w-4 h-4 text-[var(--det-accent)]" />
                                <h3 className="text-xs font-bold text-[var(--det-text)] uppercase tracking-wider">
                                    Historiske metoder du øvde på
                                </h3>
                            </div>
                            <ul className="space-y-1.5">
                                {methods.map((m) => (
                                    <li key={m} className="text-sm text-[var(--det-text-muted)] leading-snug">
                                        <span className="font-semibold text-[var(--det-text)]">
                                            {METHOD_LABEL[m]}.
                                        </span>{' '}
                                        {METHOD_EXPLANATION[m]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {data.kompetansemaal && data.kompetansemaal.length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)] border border-[var(--det-border)]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Kompetansemål trent
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {data.kompetansemaal.map((k) => (
                                    <span
                                        key={k}
                                        className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--det-accent)]/10 text-[var(--det-accent)] border border-[var(--det-accent)]/20"
                                    >
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.relatedArticles && data.relatedArticles.length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)] border border-[var(--det-border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-[var(--det-accent)]" />
                                <h3 className="text-xs font-bold text-[var(--det-text)] uppercase tracking-wider">
                                    Les videre
                                </h3>
                            </div>
                            <ul className="space-y-1.5">
                                {data.relatedArticles.map((a) => (
                                    <li key={a.path}>
                                        <a
                                            href={a.path}
                                            className="text-sm text-[var(--det-accent)] hover:underline"
                                        >
                                            {a.title} →
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {missed > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 mb-5 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            Du gikk glipp av {missed} bevis - spill igjen for å finne alle.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={onCopy}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--det-border)] bg-[var(--det-surface)] hover:bg-[var(--det-elevated)] text-[var(--det-text)] font-semibold text-base transition-colors"
                        >
                            {copyStatus === 'copied' ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    Kopiert
                                </>
                            ) : copyStatus === 'failed' ? (
                                <>
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    Klarte ikke
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Kopier rapport
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => downloadReport(report, data.title)}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--det-border)] bg-[var(--det-surface)] hover:bg-[var(--det-elevated)] text-[var(--det-text)] font-semibold text-base transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Last ned (.md)
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/oving/detektiv')}
                            className="flex-1 px-6 py-3 bg-[var(--det-elevated)] text-[var(--det-text)] rounded-xl font-semibold hover:bg-[var(--det-border)] transition-colors text-base"
                        >
                            Tilbake til oversikten
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all text-base"
                            style={{ background: 'var(--det-accent)' }}
                        >
                            Spill igjen
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isConclusionVisible) {
        return (
            <div
                style={themeVars}
                className="flex-1 flex flex-col min-h-0 relative bg-[var(--det-bg)]"
            >
                {data.briefing?.image && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <img
                            src={data.briefing.image}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ filter: 'blur(8px)' }}
                        />
                        <div className="absolute inset-0 bg-[var(--det-bg)]/80" />
                    </div>
                )}
                <div className="relative flex-1 flex flex-col min-h-0">
                    <ConclusionScreen
                        conclusionData={data.conclusion_engine}
                        collectedClues={state.collectedClueDetails}
                        onRestart={() => setIsConclusionVisible(false)}
                        onSubmit={(result) => {
                            setFinalResult(result);
                            state.setIsCompleted(true);
                        }}
                    />
                </div>
            </div>
        );
    }

    const multiSource = currentStep.sources.length > 1;
    const activeSource = currentStep.sources[activeSourceIndex] || currentStep.sources[0];

    const useTheoryBalance =
        data.schemaVersion === 2 &&
        data.suspects.length > 0 &&
        currentStep.sources.some((s) =>
            s.clues.some((c) => Array.isArray(c.supports) && c.supports.length > 0)
        );

    const found = state.collectedClues.size;
    const totalEvidence = data.status.totalEvidence;
    const foundPct = totalEvidence > 0 ? Math.min(100, (found / totalEvidence) * 100) : 0;
    const allFound = found >= totalEvidence;

    // Spor som gjenstår i den aktive kilden – driver footer-nudgen
    const activeSourceRemaining = activeSource
        ? activeSource.clues.filter((c) => !state.collectedClues.has(c.id)).length
        : 0;

    // Vektskål-knappen dukker først opp når minst ett funnet spor peker mot en teori
    const supportingCluesCount = state.collectedClueDetails.filter(
        (c) => Array.isArray(c.supports) && c.supports.length > 0
    ).length;
    const showTheoryDrawer = useTheoryBalance && supportingCluesCount > 0;

    return (
        <div
            style={themeVars}
            className="relative bg-[var(--det-bg)] text-[var(--det-text)] rounded-2xl overflow-hidden border border-[var(--det-border)] shadow-xl flex flex-col flex-1 min-h-0"
        >
            {/* Header – én tydelig framdriftsindikator */}
            <header className="px-4 py-3 border-b border-[var(--det-border)] bg-[var(--det-surface)] flex items-center justify-between flex-shrink-0 gap-3">
                <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--det-accent)]">
                        Steg {currentStepIndex + 1} av {totalSteps}
                    </span>
                    <h2 className="text-lg font-bold text-[var(--det-text)] font-display truncate">
                        {currentStep.title}
                    </h2>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 w-28 sm:w-40">
                    <motion.span
                        key={found}
                        initial={{ scale: 1.12 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                        className="text-sm font-bold tabular-nums whitespace-nowrap"
                    >
                        <span className={allFound ? 'text-emerald-600' : 'text-[var(--det-accent)]'}>
                            {found}
                        </span>
                        <span className="text-[var(--det-text-muted)]"> av {totalEvidence} spor</span>
                    </motion.span>
                    <div className="w-full h-1.5 rounded-full bg-[var(--det-elevated)] overflow-hidden">
                        <motion.div
                            animate={{ width: `${foundPct}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            className="h-full rounded-full"
                            style={{ background: allFound ? '#059669' : 'var(--det-accent)' }}
                        />
                    </div>
                </div>
            </header>

            {/* Multi-source-faner */}
            {multiSource && (
                <div className="flex border-b border-[var(--det-border)] bg-[var(--det-surface)] flex-shrink-0">
                    {currentStep.sources.map((src, i) => {
                        const cluesInSource = src.clues.length;
                        const foundInSource = src.clues.filter((c) =>
                            state.collectedClues.has(c.id)
                        ).length;
                        const complete = cluesInSource > 0 && foundInSource === cluesInSource;
                        return (
                            <button
                                key={src.id}
                                onClick={() => setActiveSourceIndex(i)}
                                className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors truncate flex items-center justify-center gap-1.5 ${
                                    i === activeSourceIndex
                                        ? 'text-[var(--det-text)] border-b-2 border-[var(--det-accent)] bg-[var(--det-accent)]/5'
                                        : 'text-[var(--det-text-muted)] hover:text-[var(--det-text)]'
                                }`}
                            >
                                <span className="truncate">
                                    Kilde {i + 1}: {src.title}
                                </span>
                                {cluesInSource > 0 && (
                                    <span
                                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                            complete
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-[var(--det-elevated)] text-[var(--det-text-muted)]'
                                        }`}
                                    >
                                        {foundInSource}/{cluesInSource}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Innholdsområde – kilden er helten */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar bg-[var(--det-bg)]">
                <div className="max-w-3xl mx-auto">
                    {currentStep.content && (
                        <p className="text-sm text-[var(--det-text-muted)] mb-4 leading-relaxed">
                            {currentStep.content}
                        </p>
                    )}

                    <SourceViewer
                        source={activeSource}
                        onClueFound={state.collectClue}
                        foundClues={state.collectedClues}
                        paperFontClass={theme.paperFontClass}
                        showHint={found === 0}
                    />
                </div>
            </div>

            {/* Footer med on-demand vektskål + navigasjon */}
            <div className="flex-shrink-0 border-t border-[var(--det-border)] bg-[var(--det-surface)]">
                {showTheoryDrawer && (
                    <div className="px-4 pt-3">
                        <button
                            onClick={() => setTheoryOpen((o) => !o)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[var(--det-border)] bg-[var(--det-bg)] hover:bg-[var(--det-elevated)] transition-colors"
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--det-text)]">
                                <Scale className="w-4 h-4 text-[var(--det-accent)]" />
                                Teorienes vektskål
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[var(--det-accent)]/10 text-[var(--det-accent)]">
                                    {data.suspects.length}
                                </span>
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 text-[var(--det-text-muted)] transition-transform ${
                                    theoryOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {theoryOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3">
                                        <TheoryBalance
                                            suspects={data.suspects}
                                            collectedClues={state.collectedClueDetails}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <footer className="px-4 py-3 flex items-center justify-between gap-3">
                    <button
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-base transition-all ${
                            isFirstStep
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-[var(--det-text-muted)] hover:bg-[var(--det-elevated)] hover:text-[var(--det-text)]'
                        }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Forrige
                    </button>

                    {activeSourceRemaining > 0 && (
                        <span className="hidden sm:block text-xs text-[var(--det-text-muted)] text-center flex-1 truncate">
                            {activeSourceRemaining === 1
                                ? '1 spor igjen i denne kilden'
                                : `${activeSourceRemaining} spor igjen i denne kilden`}
                        </span>
                    )}

                    <button
                        onClick={nextStep}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-bold text-base text-white transition-all shadow-lg hover:opacity-90"
                        style={{
                            background: 'var(--det-accent)',
                            boxShadow:
                                '0 6px 14px color-mix(in srgb, var(--det-accent) 30%, transparent)',
                        }}
                    >
                        {isLastStep ? 'Gå til konklusjon' : 'Neste'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </footer>
            </div>
        </div>
    );
};
