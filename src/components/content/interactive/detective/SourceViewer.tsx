import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    FileText,
    Eye,
    FlaskConical,
    Pickaxe,
    Maximize2,
    Lightbulb,
    ChevronDown,
} from 'lucide-react';
import type { DetectiveSource, DetectiveClue } from './types';
import { MethodBadge } from './MethodBadge';
import { ImageLightbox } from './ImageLightbox';

const SOURCE_TYPE_CONFIG: Record<
    DetectiveSource['type'],
    { icon: typeof FileText; label: string; color: string; iconColor: string }
> = {
    textual: {
        icon: FileText,
        label: 'Skriftlig kilde',
        color: 'bg-amber-500/10',
        iconColor: 'text-amber-600',
    },
    archaeological: {
        icon: Pickaxe,
        label: 'Arkeologisk funn',
        color: 'bg-orange-500/10',
        iconColor: 'text-orange-600',
    },
    visual: {
        icon: Eye,
        label: 'Visuell kilde',
        color: 'bg-purple-500/10',
        iconColor: 'text-purple-600',
    },
    scientific: {
        icon: FlaskConical,
        label: 'Vitenskapelig analyse',
        color: 'bg-cyan-500/10',
        iconColor: 'text-cyan-600',
    },
};

interface SourceViewerProps {
    source: DetectiveSource;
    onClueFound: (clue: DetectiveClue) => void;
    foundClues: Set<string>;
    paperFontClass?: string;
    /** Vis engangs-instruks om at ordene kan klikkes (til første spor er funnet). */
    showHint?: boolean;
}

function renderTextWithClues(
    text: string,
    clues: DetectiveClue[],
    foundClues: Set<string>,
    onClueFound: (clue: DetectiveClue) => void
): { rendered: React.ReactNode; unmatchedClues: DetectiveClue[] } {
    const unmatched: DetectiveClue[] = [];

    const matchedClues: { clue: DetectiveClue; startIndex: number }[] = [];
    for (const clue of clues) {
        const idx = text.toLowerCase().indexOf(clue.text.toLowerCase());
        if (idx >= 0) {
            matchedClues.push({ clue, startIndex: idx });
        } else {
            unmatched.push(clue);
        }
    }

    if (matchedClues.length === 0) {
        return { rendered: text, unmatchedClues: clues };
    }

    matchedClues.sort((a, b) => a.startIndex - b.startIndex);

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const { clue, startIndex } of matchedClues) {
        if (startIndex < cursor) {
            unmatched.push(clue);
            continue;
        }

        if (startIndex > cursor) {
            parts.push(text.slice(cursor, startIndex));
        }

        const matchedText = text.slice(startIndex, startIndex + clue.text.length);
        const isFound = foundClues.has(clue.id);

        parts.push(
            <InlineClue
                key={clue.id}
                clue={clue}
                displayText={matchedText}
                isFound={isFound}
                onCollect={() => onClueFound(clue)}
            />
        );

        cursor = startIndex + clue.text.length;
    }

    if (cursor < text.length) {
        parts.push(text.slice(cursor));
    }

    return { rendered: <>{parts}</>, unmatchedClues: unmatched };
}

function InlineClue({
    clue,
    displayText,
    isFound,
    onCollect,
}: {
    clue: DetectiveClue;
    displayText: string;
    isFound: boolean;
    onCollect: () => void;
}) {
    const [showInsight, setShowInsight] = useState(false);
    const [justCollected, setJustCollected] = useState(false);

    const handleClick = () => {
        if (!isFound) {
            onCollect();
            setShowInsight(true);
            setJustCollected(true);
            setTimeout(() => setJustCollected(false), 600);
        } else {
            setShowInsight(!showInsight);
        }
    };

    return (
        <span className="relative inline">
            <motion.button
                onClick={handleClick}
                animate={justCollected ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
                className={`inline rounded px-0.5 -mx-0.5 font-semibold transition-colors cursor-pointer ${
                    isFound
                        ? 'bg-emerald-100 text-emerald-800 underline decoration-emerald-500/50'
                        : 'bg-[var(--det-accent)]/10 text-[var(--det-accent)] underline decoration-dotted decoration-2 decoration-[var(--det-accent)]/50 hover:bg-[var(--det-accent)]/20'
                }`}
            >
                {displayText}
                {isFound && (
                    <CheckCircle2 className="inline w-3.5 h-3.5 ml-1 -mt-0.5 text-emerald-500" />
                )}
            </motion.button>
            <AnimatePresence>
                {showInsight && isFound && (
                    <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="block mt-1 mb-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 italic leading-relaxed"
                    >
                        {clue.insight}
                        {clue.method && (
                            <span className="block mt-2 not-italic">
                                <MethodBadge method={clue.method} compact />
                            </span>
                        )}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

function ClueChip({
    clue,
    isFound,
    onCollect,
}: {
    clue: DetectiveClue;
    isFound: boolean;
    onCollect: () => void;
}) {
    return (
        <button
            onClick={() => !isFound && onCollect()}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                isFound
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-[var(--det-accent)]/5 border-[var(--det-accent)]/25 text-[var(--det-text)] hover:bg-[var(--det-accent)]/10 hover:border-[var(--det-accent)]/50'
            }`}
        >
            <span
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isFound ? 'bg-emerald-500 text-white' : 'bg-[var(--det-elevated)]'
                }`}
            >
                {isFound ? (
                    <CheckCircle2 className="w-3 h-3" />
                ) : (
                    <div className="w-1 h-1 rounded-full bg-[var(--det-accent)]" />
                )}
            </span>
            <span className="font-medium">"{clue.text}"</span>
            {isFound && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-700 italic ml-1"
                >
                    - {clue.insight}
                </motion.span>
            )}
        </button>
    );
}

function ClueToast({ clue, onDismiss }: { clue: DetectiveClue; onDismiss: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-2 left-2 right-2 z-10 p-3 rounded-xl bg-emerald-600 border border-emerald-500 shadow-lg shadow-emerald-900/20 flex items-start gap-2.5"
        >
            <CheckCircle2 className="w-5 h-5 text-emerald-100 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="text-base font-bold text-white">Spor sikret!</p>
                <p className="text-sm text-emerald-50 leading-snug mt-0.5">
                    "{clue.text}" - {clue.insight}
                </p>
            </div>
        </motion.div>
    );
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
    source,
    onClueFound,
    foundClues,
    paperFontClass = 'font-serif italic',
    showHint = false,
}) => {
    const [viewMode, setViewMode] = useState<'raw' | 'interpreted'>('interpreted');
    const [contextOpen, setContextOpen] = useState(false);
    const [toastClue, setToastClue] = useState<DetectiveClue | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handleClueFound = useCallback(
        (clue: DetectiveClue) => {
            if (!foundClues.has(clue.id)) {
                setToastClue(clue);
            }
            onClueFound(clue);
        },
        [foundClues, onClueFound]
    );

    const translationText = source.translation || source.interpretation || '';

    const { rendered: highlightedText, unmatchedClues } = useMemo(
        () => renderTextWithClues(translationText, source.clues, foundClues, handleClueFound),
        [translationText, source.clues, foundClues, handleClueFound]
    );

    // "Bakgrunn" = guidance (introduction vises som rammesetning over kilden).
    const hasBackground = !!source.guidance;
    const hasCriticism = !!(source.provenance || source.uncertainty || source.hint);
    const hasContext = hasBackground || hasCriticism;

    const typeConfig = SOURCE_TYPE_CONFIG[source.type];
    const TypeIcon = typeConfig.icon;

    const isVisualSource = source.type === 'visual' || source.type === 'archaeological';
    const imageSrc =
        source.image ||
        (isVisualSource && source.original && !source.original.includes(' ')
            ? source.original
            : undefined);

    const hasClickableClues = source.clues.length > 0;

    return (
        <div className="relative flex flex-col bg-[var(--det-surface)] rounded-xl border border-[var(--det-border)] overflow-hidden shadow-sm">
            <AnimatePresence>
                {toastClue && (
                    <ClueToast
                        key={toastClue.id}
                        clue={toastClue}
                        onDismiss={() => setToastClue(null)}
                    />
                )}
            </AnimatePresence>

            <ImageLightbox
                src={imageSrc ?? ''}
                alt={source.title}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Kilde-header */}
            <div className="flex-shrink-0">
                <div className="px-4 py-3 flex items-center justify-between bg-[var(--det-elevated)] border-b border-[var(--det-border)]">
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className={`w-8 h-8 rounded-lg ${typeConfig.color} flex items-center justify-center ${typeConfig.iconColor} flex-shrink-0`}
                        >
                            <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-base font-bold text-[var(--det-text)] truncate">
                                {source.title}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-xs font-bold uppercase tracking-widest ${typeConfig.iconColor}`}
                                >
                                    {typeConfig.label}
                                </span>
                                <span className="text-xs text-[var(--det-text-muted)]">·</span>
                                <span className="text-sm text-[var(--det-text-muted)] truncate">
                                    {source.metadata.origin}
                                </span>
                            </div>
                        </div>
                    </div>

                    {source.original && (
                        <div className="flex bg-[var(--det-bg)] rounded-lg p-0.5 border border-[var(--det-border)] ml-3 flex-shrink-0">
                            <button
                                onClick={() => setViewMode('raw')}
                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    viewMode === 'raw'
                                        ? 'bg-[var(--det-accent)] text-white shadow-sm'
                                        : 'text-[var(--det-text-muted)] hover:text-[var(--det-text)]'
                                }`}
                            >
                                Original
                            </button>
                            <button
                                onClick={() => setViewMode('interpreted')}
                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    viewMode === 'interpreted'
                                        ? 'bg-[var(--det-accent)] text-white shadow-sm'
                                        : 'text-[var(--det-text-muted)] hover:text-[var(--det-text)]'
                                }`}
                            >
                                {source.type === 'textual' ? 'Norsk oversettelse' : 'Tolkning'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Rammesetning (introduction) */}
                {source.introduction && (
                    <p className="px-4 pt-4 text-sm text-[var(--det-text-muted)] italic leading-relaxed">
                        {source.introduction}
                    </p>
                )}

                {/* Innhold */}
                <div className="p-4">
                    {viewMode === 'raw' ? (
                        <div>
                            {source.type === 'textual' || source.type === 'scientific' ? (
                                <div
                                    className={`${paperFontClass} text-base leading-relaxed p-5 rounded-lg shadow-lg relative`}
                                    style={{
                                        background: 'var(--det-paper-bg)',
                                        color: 'var(--det-paper-text)',
                                        borderLeft: '4px solid var(--det-paper-border)',
                                        borderRight: '1px solid var(--det-paper-border)',
                                        boxShadow:
                                            'inset 0 0 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div className="absolute top-2 right-3 text-xs uppercase tracking-widest opacity-60 font-bold">
                                        Originalfragment
                                    </div>
                                    {source.original}
                                </div>
                            ) : imageSrc ? (
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    className="group relative w-full rounded-lg overflow-hidden shadow-md"
                                >
                                    <img
                                        src={imageSrc}
                                        alt={source.title}
                                        className="w-full h-auto max-h-[60vh] object-contain bg-slate-100"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 rounded-lg bg-black/70 text-white text-sm font-semibold">
                                            <Maximize2 className="w-4 h-4" />
                                            Forstørr
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <p className="text-base text-[var(--det-text-muted)] italic">
                                    Ingen original tilgjengelig.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            {imageSrc && isVisualSource && (
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    className="group relative w-full rounded-lg overflow-hidden shadow-md mb-4"
                                >
                                    <img
                                        src={imageSrc}
                                        alt={source.title}
                                        className="w-full h-auto max-h-[45vh] object-contain bg-slate-100"
                                    />
                                    <div className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-black/70 text-white text-sm font-semibold flex items-center gap-1 opacity-90 group-hover:opacity-100">
                                        <Maximize2 className="w-4 h-4" />
                                        Forstørr
                                    </div>
                                </button>
                            )}

                            {/* Engangs oppgaveinstruks */}
                            <AnimatePresence>
                                {showHint && hasClickableClues && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--det-accent)]/10 border border-[var(--det-accent)]/25 text-sm font-semibold text-[var(--det-accent)]"
                                    >
                                        <Lightbulb className="w-4 h-4 flex-shrink-0" />
                                        Trykk på ordene som lyser opp for å samle spor.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p className="text-base text-[var(--det-text)] leading-relaxed">
                                {highlightedText}
                            </p>

                            {unmatchedClues.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {unmatchedClues.map((clue) => (
                                        <ClueChip
                                            key={clue.id}
                                            clue={clue}
                                            isFound={foundClues.has(clue.id)}
                                            onCollect={() => handleClueFound(clue)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* "Om kilden" – kollapset som standard (bakgrunn + kildekritikk) */}
            {hasContext && (
                <div className="border-t border-[var(--det-border)]">
                    <button
                        onClick={() => setContextOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-[var(--det-text-muted)] hover:text-[var(--det-text)] hover:bg-[var(--det-elevated)] transition-colors"
                    >
                        <span>Om kilden - bakgrunn og kildekritikk</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                                contextOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                    <AnimatePresence initial={false}>
                        {contextOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-3 border-t border-[var(--det-border)] pt-3">
                                    {source.guidance && (
                                        <div>
                                            <span className="text-xs font-bold text-[var(--det-text-muted)] uppercase tracking-wider">
                                                Bakgrunn:{' '}
                                            </span>
                                            <span className="text-base text-[var(--det-text)] leading-relaxed">
                                                {source.guidance}
                                            </span>
                                        </div>
                                    )}
                                    {source.provenance && (
                                        <div>
                                            <span className="text-xs font-bold text-[var(--det-text-muted)] uppercase tracking-wider">
                                                Opphav:{' '}
                                            </span>
                                            <span className="text-base text-[var(--det-text)] leading-relaxed">
                                                {source.provenance}
                                            </span>
                                        </div>
                                    )}
                                    {source.uncertainty && (
                                        <div>
                                            <span
                                                className="text-xs font-bold uppercase tracking-wider"
                                                style={{ color: 'var(--det-warning)' }}
                                            >
                                                Usikkerhet:{' '}
                                            </span>
                                            <span className="text-base text-[var(--det-text)] leading-relaxed italic">
                                                {source.uncertainty}
                                            </span>
                                        </div>
                                    )}
                                    {source.hint && (
                                        <div>
                                            <span className="text-xs font-bold text-[var(--det-text-muted)] uppercase tracking-wider">
                                                Hint:{' '}
                                            </span>
                                            <span className="text-base text-[var(--det-text-muted)] italic">
                                                {source.hint}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
