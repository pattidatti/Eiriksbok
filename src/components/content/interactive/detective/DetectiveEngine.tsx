import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    ChevronRight,
    ChevronLeft,
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
                                : 'text-slate-700 fill-slate-800'
                        }`}
                    />
                </motion.div>
            ))}
        </div>
    );
}

function ProgressDots({ count, current }: { count: number; current: number }) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ scale: i === current ? [1, 1.4, 1] : 1 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 400 }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                        i < current
                            ? 'bg-emerald-500'
                            : i === current
                              ? 'bg-[var(--det-accent)]'
                              : 'bg-slate-700'
                    }`}
                />
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
    }, [state.isCompleted, data.id, finalResult, evidenceStars, state.collectedClues]);

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
                className="flex-1 flex flex-col p-4 md:p-6 bg-[var(--det-bg)] text-slate-100 overflow-y-auto custom-scrollbar"
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

                    <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
                        Saken er avsluttet
                    </h2>

                    <div className="flex justify-center mb-3">
                        <StarRating stars={displayedStars} />
                    </div>

                    <p className="text-base text-slate-300 text-center mb-6">
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
                                            ? 'text-emerald-400 font-bold'
                                            : 'text-amber-400 font-bold'
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
                                        className="flex items-start gap-2 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-emerald-200">
                                                "{clue.text}"
                                            </p>
                                            <p className="text-sm text-slate-300 leading-snug mt-0.5">
                                                {clue.insight}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {methods.length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)]/60 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="w-4 h-4 text-[var(--det-accent)]" />
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Historiske metoder du øvde på
                                </h3>
                            </div>
                            <ul className="space-y-1.5">
                                {methods.map((m) => (
                                    <li key={m} className="text-sm text-slate-300 leading-snug">
                                        <span className="font-semibold text-white">
                                            {METHOD_LABEL[m]}.
                                        </span>{' '}
                                        {METHOD_EXPLANATION[m]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {data.kompetansemaal && data.kompetansemaal.length > 0 && (
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)]/60 border border-white/5">
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
                        <div className="mb-5 p-3 rounded-xl bg-[var(--det-surface)]/60 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-[var(--det-accent)]" />
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
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
                        <div className="flex items-center gap-2 text-sm text-amber-400/90 mb-5 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            Du gikk glipp av {missed} bevis - spill igjen for å finne alle.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={onCopy}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 text-slate-200 font-semibold text-base transition-colors"
                        >
                            {copyStatus === 'copied' ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    Kopiert
                                </>
                            ) : copyStatus === 'failed' ? (
                                <>
                                    <AlertCircle className="w-4 h-4 text-rose-400" />
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
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 text-slate-200 font-semibold text-base transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Last ned (.md)
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/oving/detektiv')}
                            className="flex-1 px-6 py-3 bg-[var(--det-surface)] text-slate-200 rounded-xl font-semibold hover:bg-[var(--det-surface)]/80 transition-colors text-base"
                        >
                            Tilbake til oversikten
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all text-base"
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

    return (
        <div
            style={themeVars}
            className="relative bg-[var(--det-bg)] text-slate-200 rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0"
        >
            {/* Persistent hero-backdrop */}
            {data.briefing?.image && (
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
                    <img
                        src={data.briefing.image}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'blur(12px)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--det-bg)]/60 via-transparent to-[var(--det-bg)]/90" />
                </div>
            )}

            <div className="relative flex flex-col flex-1 min-h-0">
                {/* Header */}
                <header className="px-4 py-3 border-b border-white/5 bg-black/30 backdrop-blur-md flex items-center justify-between flex-shrink-0 gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--det-accent)]">
                                Steg {currentStepIndex + 1} av {totalSteps}
                            </span>
                            <span className="text-xs text-slate-600 hidden sm:inline">·</span>
                            <span className="text-xs uppercase tracking-widest text-slate-600 hidden sm:inline truncate">
                                {theme.eraLabel}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-white font-display truncate">
                            {currentStep.title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <StarRating stars={evidenceStars} size="sm" />
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
                            <ProgressDots count={totalSteps} current={currentStepIndex} />
                            <motion.span
                                key={state.collectedClues.size}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                className="text-sm font-bold tabular-nums text-slate-300"
                            >
                                <span
                                    className={
                                        state.collectedClues.size >= data.status.totalEvidence
                                            ? 'text-emerald-400'
                                            : 'text-[var(--det-accent)]'
                                    }
                                >
                                    {state.collectedClues.size}
                                </span>
                                /{data.status.totalEvidence}
                            </motion.span>
                        </div>
                    </div>
                </header>

                {/* TheoryBalance (kun v2 med supports) */}
                {useTheoryBalance && (
                    <TheoryBalance
                        suspects={data.suspects}
                        collectedClues={state.collectedClueDetails}
                    />
                )}

                {/* Multi-source-faner */}
                {multiSource && (
                    <div className="flex border-b border-white/5 bg-black/20 flex-shrink-0">
                        {currentStep.sources.map((src, i) => {
                            const cluesInSource = src.clues.length;
                            const foundInSource = src.clues.filter((c) =>
                                state.collectedClues.has(c.id)
                            ).length;
                            const complete =
                                cluesInSource > 0 && foundInSource === cluesInSource;
                            return (
                                <button
                                    key={src.id}
                                    onClick={() => setActiveSourceIndex(i)}
                                    className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors truncate flex items-center justify-center gap-1.5 ${
                                        i === activeSourceIndex
                                            ? 'text-white border-b-2 border-[var(--det-accent)] bg-[var(--det-accent)]/5'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <span className="truncate">
                                        Kilde {i + 1}: {src.title}
                                    </span>
                                    {cluesInSource > 0 && (
                                        <span
                                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                                complete
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-white/5 text-slate-400'
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

                {/* Innholdsområde */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                    <div className="max-w-3xl mx-auto">
                        {currentStep.content && (
                            <p className="text-base text-slate-300 mb-4 italic leading-relaxed">
                                {currentStep.content}
                            </p>
                        )}

                        <SourceViewer
                            source={activeSource}
                            onClueFound={state.collectClue}
                            foundClues={state.collectedClues}
                            paperFontClass={theme.paperFontClass}
                        />
                    </div>
                </div>

                {/* Navigasjonsfooter */}
                <footer className="px-4 py-3 border-t border-white/5 bg-black/30 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-base transition-all ${
                            isFirstStep
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Forrige
                    </button>

                    <button
                        onClick={nextStep}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-bold text-base transition-all shadow-lg"
                        style={{
                            background: 'var(--det-accent)',
                            color: '#0a0c10',
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
