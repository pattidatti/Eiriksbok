import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    Monitor,
    Clock,
    Eye,
    EyeOff,
    MessageSquare,
    Library,
    ExternalLink,
    Pause,
    BookOpen,
    Clapperboard,
    Play
} from 'lucide-react';
import type { PresentationData, LearningPathStep } from '../../types';
import { usePresentationSync } from '../../hooks/usePresentationSync';
import { SlideEraTimeline } from './SlideEraTimeline';
import { resolveTimelineConfig } from './resolveTimelineConfig';
import { computeNext, computePrev } from './presentationNav';
import { useFilmInfo } from '../../features/film/useFilmInfo';
import { filmLenke } from '../../features/film/filmIndex';

interface PresentationControllerProps {
    data: PresentationData;
    onClose: () => void;
    steps?: LearningPathStep[];
}

const findFirstInternalLink = (step: LearningPathStep | undefined): string | null => {
    if (!step?.links) return null;
    for (const link of step.links) {
        const isExternal = link.external || link.url.startsWith('http');
        if (!isExternal) return link.url;
    }
    return null;
};

/** Lærerens bilde av film-lysbildet: plakaten og hva som skjer på projektoren. */
const FilmForhandsvisning = ({ sti }: { sti: string }) => {
    const { tittel, bilde, lengde, scener } = useFilmInfo(sti);
    return (
        <div className="flex-1 min-h-0 flex gap-8 items-center">
            <div className="relative w-1/2 aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-2xl ring-1 ring-white/10">
                {bilde && <img src={bilde} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xl">
                    <Play className="w-7 h-7 translate-x-0.5 fill-current" />
                </span>
            </div>
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold uppercase tracking-widest">
                    <Clapperboard className="w-4 h-4" />
                    Film{lengde ? ` · ${lengde}` : ''}{scener ? ` · ${scener} scener` : ''}
                </div>
                <h1 className="text-3xl font-bold leading-tight">{tittel ?? ' '}</h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                    Filmen spilles av på projektoren. Klikk play der, eller trykk mellomrom.
                </p>
                <p className="text-sm text-slate-500">
                    Ingen projektor åpen?{' '}
                    <a
                        href={filmLenke(sti) ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 font-bold hover:text-indigo-200 inline-flex items-center gap-1"
                    >
                        Åpne filmen i ny fane <ExternalLink className="w-3 h-3" />
                    </a>
                </p>
            </div>
        </div>
    );
};

export const PresentationController: React.FC<PresentationControllerProps> = ({ data, onClose, steps }) => {
    const { state, updateState } = usePresentationSync(data.id, 'controller');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const currentSlide = data.slides[state.currentSlideIndex] || data.slides[0] || { title: 'Laster...', layout: 'title' };
    const timeline = useMemo(() => resolveTimelineConfig(data), [data]);

    // Map stepId -> step for quick lookup
    const stepIndexById = useMemo(() => {
        const map = new Map<string, { step: LearningPathStep; index: number }>();
        (steps || []).forEach((s, i) => map.set(s.id, { step: s, index: i }));
        return map;
    }, [steps]);

    const linkedStep = currentSlide.linksToStepId ? stepIndexById.get(currentSlide.linksToStepId) : null;
    const linkedArticleUrl = findFirstInternalLink(linkedStep?.step);

    // First slide index per step (used for jump-to-step)
    const firstSlideIndexByStep = useMemo(() => {
        const map = new Map<string, number>();
        data.slides.forEach((slide, idx) => {
            if (slide.linksToStepId && !map.has(slide.linksToStepId)) {
                map.set(slide.linksToStepId, idx);
            }
        });
        return map;
    }, [data.slides]);

    // Reset to first slide on initial load if we are the controller and it's a fresh mounting
    const hasInitialReset = React.useRef(false);
    useEffect(() => {
        if (!hasInitialReset.current) {
            console.log(`[PresentationController] Initial Reset for ${data.id}`);
            updateState({ currentSlideIndex: 0, currentRevealIndex: -1 });
            hasInitialReset.current = true;
        }
    }, [updateState, data.id]);

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetPresentation = () => {
        if (confirm('Vil du starte presentasjonen på nytt? Alle prosjektør-visninger vil også bli nullstilt.')) {
            updateState({ currentSlideIndex: 0, currentRevealIndex: -1 });
            setElapsedSeconds(0);
        }
    };

    const next = () => updateState(prev => computeNext(prev, data.slides));

    const prev = () => updateState(prevState => computePrev(prevState, data.slides));

    const jumpToSlide = (idx: number) => {
        updateState({ currentSlideIndex: idx, currentRevealIndex: -1 });
        // Drop focus so Space/Enter don't re-trigger this button later.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };

    const toggleBlackout = () => updateState(prev => ({ isBlackout: !prev.isBlackout }));

    // Keyboard navigation. Bound once with a ref so handlers always reach the
    // latest next/prev/toggleBlackout closures without re-attaching listeners.
    // We intentionally DO NOT bind Space: a focused step-progress button would
    // re-activate on Space and jump back to that step's first slide.
    const navRef = React.useRef({ next, prev, toggleBlackout });
    useEffect(() => {
        navRef.current = { next, prev, toggleBlackout };
    });
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                navRef.current.next();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                navRef.current.prev();
            } else if (e.key === 'b' || e.key === 'B') {
                navRef.current.toggleBlackout();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const openProjectorWindow = () => {
        window.open(
            `${window.location.href}/projector`,
            'projector',
            'width=1280,height=720'
        );
    };

    const phaseLabel = currentSlide.phase
        ? { opptakt: 'Akt 1 — Opptakt', konfrontasjon: 'Akt 2 — Konfrontasjon', resolusjon: 'Akt 3 — Resolusjon' }[currentSlide.phase]
        : null;

    const isTaskPause = currentSlide.layout === 'task-pause' || currentSlide.pauseForTask;

    return (
        <div className="fixed inset-0 bg-slate-900 text-white flex flex-col font-sans select-none overflow-hidden">
            {/* Header / Stats */}
            <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-white/10 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0" title="Lukk">
                        <Library className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold truncate">{data.title}</h2>
                    {phaseLabel && (
                        <span className="hidden lg:inline text-[10px] text-amber-300 font-bold mt-0.5 px-2 py-0.5 border border-amber-300/30 rounded uppercase tracking-widest flex-shrink-0">
                            {phaseLabel}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2 text-indigo-300 font-mono text-lg">
                        <Clock className="w-5 h-5" />
                        {formatTime(elapsedSeconds)}
                    </div>
                    <div className="text-slate-400 font-mono text-sm">
                        {state.currentSlideIndex + 1} / {data.slides.length}
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <button
                        onClick={resetPresentation}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Start på nytt"
                    >
                        <Library className="w-5 h-5" />
                    </button>
                    <button
                        onClick={openProjectorWindow}
                        className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors text-sm"
                    >
                        <Monitor className="w-4 h-4" />
                        Åpne projektør
                    </button>
                </div>
            </div>

            {/* Step progress bar (only if we have learning path steps) */}
            {steps && steps.length > 0 && (
                <div className="bg-slate-850 bg-slate-800/60 px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mr-2">
                            Læringssti
                        </span>
                        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                            {steps.map((s, i) => {
                                const isActive = linkedStep?.index === i;
                                const targetIdx = firstSlideIndexByStep.get(s.id);
                                const isClickable = targetIdx !== undefined;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => isClickable && jumpToSlide(targetIdx!)}
                                        disabled={!isClickable}
                                        title={`${i + 1}. ${s.title}`}
                                        className={`group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                                            isActive
                                                ? 'bg-indigo-500 text-white'
                                                : isClickable
                                                    ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer'
                                                    : 'bg-white/5 text-slate-600 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        <span className="text-[10px] font-mono font-bold">
                                            {i + 1}
                                        </span>
                                        <span className="hidden xl:inline text-xs truncate max-w-[140px]">
                                            {s.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Dashboard Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Slide Preview & Local Navigation */}
                <div className="w-2/3 flex flex-col p-6">
                    <div className={`flex-1 rounded-2xl border relative overflow-hidden flex flex-col p-12 ${
                        isTaskPause ? 'bg-amber-950/40 border-amber-500/30' : 'bg-slate-950 border-white/5'
                    }`}>
                        {timeline && currentSlide.layout !== 'title' && !isTaskPause && (currentSlide.year !== undefined || currentSlide.yearRange) && (
                            <div className="-mx-12 -mt-12 mb-6 pt-4 px-2 bg-slate-900/40 border-b border-white/5">
                                <SlideEraTimeline
                                    year={currentSlide.year}
                                    yearRange={currentSlide.yearRange}
                                    start={timeline.start}
                                    end={timeline.end}
                                    milestones={timeline.milestones}
                                    variant="controller"
                                />
                            </div>
                        )}
                        <span className={`font-bold uppercase tracking-widest text-sm mb-4 ${
                            isTaskPause ? 'text-amber-400' : 'text-indigo-500'
                        }`}>
                            {isTaskPause ? 'Pause for oppgave' : currentSlide.film ? 'Film på projektoren' : 'Projektør-preview'}
                        </span>
                        {currentSlide.layout === 'film' && currentSlide.film ? (
                            <FilmForhandsvisning sti={currentSlide.film} />
                        ) : (
                        <h1 className="text-4xl font-bold mb-6">{currentSlide.title}</h1>
                        )}

                        {isTaskPause && currentSlide.taskPrompt && (
                            <div className="text-2xl text-amber-100 leading-relaxed mb-6">
                                {currentSlide.taskPrompt}
                            </div>
                        )}

                        <div className="space-y-4">
                            {currentSlide.points?.map((p, idx) => (
                                <div
                                    key={p.id}
                                    className={`text-xl transition-opacity duration-300 ${idx <= state.currentRevealIndex ? 'opacity-100' : 'opacity-20 text-slate-500'}`}
                                >
                                    • {p.text}
                                </div>
                            ))}
                        </div>

                        {linkedStep && (
                            <div className="mt-auto pt-6 flex items-center gap-3 flex-wrap">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                    Hører til steg {linkedStep.index + 1}: {linkedStep.step.title}
                                </span>
                                {linkedArticleUrl && (
                                    <a
                                        href={linkedArticleUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 rounded-lg text-xs font-bold border border-indigo-500/30"
                                    >
                                        <BookOpen className="w-3 h-3" />
                                        Åpne artikkel
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls Bar */}
                    <div className="mt-6 flex justify-between items-center bg-slate-800 p-4 rounded-2xl">
                        <div className="flex gap-4">
                            <button
                                onClick={toggleBlackout}
                                className={`p-4 rounded-xl transition-colors ${state.isBlackout ? 'bg-red-500 text-white' : 'hover:bg-white/10 text-slate-300'}`}
                                title="Skjul/vis projektor (B)"
                            >
                                {state.isBlackout ? <EyeOff /> : <Eye />}
                            </button>
                            {isTaskPause && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-500/30 rounded-xl text-amber-200">
                                    <Pause className="w-4 h-4" />
                                    <span className="text-sm font-bold">
                                        Elevene jobber{currentSlide.suggestedMinutes ? ` (~${currentSlide.suggestedMinutes} min)` : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <button onClick={prev} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-2xl">
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button onClick={next} className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-2xl shadow-lg shadow-indigo-900/50">
                                NESTE
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Auto-Notes Engine */}
                <div className="w-1/3 border-l border-white/10 bg-slate-800/50 p-6 flex flex-col gap-6 overflow-y-auto">
                    {phaseLabel && (
                        <div className="text-[10px] text-amber-300 font-bold px-2 py-1 border border-amber-300/30 rounded uppercase tracking-widest self-start">
                            {phaseLabel}
                        </div>
                    )}
                    <section>
                        <h3 className="flex items-center gap-2 text-indigo-400 font-bold mb-4 uppercase tracking-wider text-sm">
                            <MessageSquare className="w-4 h-4" />
                            Lærernotater
                        </h3>
                        <div className="bg-slate-900 rounded-xl p-5 border border-white/5 leading-relaxed text-base text-slate-200">
                            {currentSlide.teacherNotes ? (
                                currentSlide.teacherNotes.split('\n\n').map((p, i) => (
                                    <p key={i} className="mb-3 last:mb-0">{p}</p>
                                ))
                            ) : (
                                <span className="text-slate-500 italic">Ingen spesifikke notater for denne sliden.</span>
                            )}
                        </div>
                    </section>

                    {currentSlide.talkingPoints && currentSlide.talkingPoints.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm">
                                <Library className="w-4 h-4" />
                                Diskusjonspunkter
                            </h3>
                            <ul className="space-y-3">
                                {currentSlide.talkingPoints.map((tp, i) => (
                                    <li key={i} className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 text-emerald-100 text-sm">
                                        {tp}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {linkedStep && (
                        <section>
                            <h3 className="flex items-center gap-2 text-slate-400 font-bold mb-3 uppercase tracking-wider text-xs">
                                <BookOpen className="w-3 h-3" />
                                Aktiv læringssti-steg
                            </h3>
                            <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                                    Steg {linkedStep.index + 1}
                                </div>
                                <div className="font-bold text-slate-100 mb-1">{linkedStep.step.title}</div>
                                <div className="text-xs text-slate-400 italic">{linkedStep.step.type}</div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};
