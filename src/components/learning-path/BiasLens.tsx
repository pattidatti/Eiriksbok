import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

// --- Types ---

export type PerspectiveId = 'neutral' | 'german' | 'french';

export interface Replacement {
    original: string;
    replacement: string;
    explanation?: string;
}

export interface Perspective {
    id: PerspectiveId;
    label: string;
    description: string;
    theme: {
        color: string; // The highlight color for words (e.g., Red-800)
        bgColor: string; // The paper background color
        borderColor: string;
        textColor: string; // The base text color (usually dark gray/black)
        moodClass?: string;
    };
    replacements: Replacement[];
}

export interface BiasLensProps {
    title?: string;
    baseContent?: string;
    lenses?: Perspective[];
    // Bakoverkompatibelt alias: km-artiklar bruker sources-format
    sources?: { name: string; type: string; stance: string; content: string }[];
}

// Enkel kjeldekort-layout for sources-format (alias frå eldre km-artiklar)
const SourcesView: React.FC<{
    title: string;
    sources: { name: string; type: string; stance: string; content: string }[];
}> = ({ title, sources }) => {
    const [active, setActive] = useState<number | null>(null);
    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(active === i ? null : i)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                            active === i
                                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                        <p className="text-xs font-semibold text-slate-800 mb-0.5">{s.name}</p>
                        <p className="text-xs text-slate-500 mb-2">{s.type}</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{s.content}</p>
                        <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${
                            s.stance.includes('Nøytral') || s.stance.includes('Nyansert')
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                        }`}>{s.stance}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Component ---

// Sjølve linse-visninga. Skild ut som eigen komponent slik at BiasLens kan velje
// visning utan å kalle hooks betinga — React krev lik hook-rekkjefølgje kvar render.
const LensView: React.FC<{ title: string; baseContent: string; lenses: Perspective[] }> = ({
    title,
    baseContent,
    lenses,
}) => {
    const [activeLensId, setActiveLensId] = useState<PerspectiveId>('neutral');
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const activeLens = lenses.find((l) => l.id === activeLensId);

    // Parse content
    const contentSegments = useMemo(() => {
        if (!activeLens || activeLensId === 'neutral') {
            return [{ text: baseContent, type: 'text' }];
        }

        let segments: { text: string; type: 'text' | 'morphed'; explanation?: string }[] = [
            { text: baseContent, type: 'text' },
        ];

        activeLens.replacements.forEach((rep) => {
            const newSegments: typeof segments = [];
            segments.forEach((seg) => {
                if (seg.type === 'morphed') {
                    newSegments.push(seg);
                    return;
                }

                const parts = seg.text.split(rep.original);
                if (parts.length === 1) {
                    newSegments.push(seg);
                    return;
                }

                parts.forEach((part, index) => {
                    if (part) newSegments.push({ text: part, type: 'text' });
                    if (index < parts.length - 1) {
                        newSegments.push({
                            text: rep.replacement,
                            type: 'morphed',
                            explanation: rep.explanation,
                        });
                    }
                });
            });
            segments = newSegments;
        });

        return segments;
    }, [baseContent, activeLensId, activeLens]);

    return (
        <div
            className={`relative w-full overflow-hidden rounded-xl border-2 transition-all duration-500 ease-in-out shadow-sm ${activeLens?.theme.bgColor || 'bg-white'
                } ${activeLens?.theme.borderColor || 'border-slate-100'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 bg-black/5">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800 font-display">
                    {title}
                </h3>
                {activeLens && (
                    <motion.span
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={activeLens.id}
                        style={{ color: activeLens.theme.color }}
                        className="text-xs font-bold uppercase tracking-widest"
                    >
                        {activeLens.label}
                    </motion.span>
                )}
            </div>

            {/* Content Area */}
            <div className="relative px-8 py-10">
                <div className="prose prose-lg prose-slate max-w-none leading-loose">
                    <p className={`font-serif text-xl md:text-2xl transition-colors duration-300 ${activeLens?.theme.textColor || 'text-slate-900'}`}>
                        {contentSegments.map((seg, i) => (
                            <React.Fragment key={i}>
                                {seg.type === 'text' ? (
                                    <span>{seg.text}</span>
                                ) : (
                                    <span className="relative inline-block">
                                        <motion.span
                                            layout
                                            initial={{ opacity: 0, backgroundColor: 'transparent' }}
                                            animate={{ opacity: 1, backgroundColor: activeLens?.theme.color + '10' }} // 10 = alpha approx 0.06
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                color: activeLens?.theme.color,
                                                textDecorationColor: activeLens?.theme.color
                                            }}
                                            className="cursor-help font-bold underline decoration-2 underline-offset-4 rounded px-1 -mx-1"
                                            onClick={() =>
                                                setActiveTooltip(activeTooltip === seg.text ? null : seg.text)
                                            }
                                            onMouseEnter={() => setActiveTooltip(seg.text)}
                                            onMouseLeave={() => setActiveTooltip(null)}
                                        >
                                            {seg.text}
                                        </motion.span>

                                        {/* Tooltip */}
                                        <AnimatePresence>
                                            {activeTooltip === seg.text && 'explanation' in seg && seg.explanation && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-1/2 mb-3 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-xl z-20 text-left"
                                                >
                                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        <Info size={12} />
                                                        Historikerens notat
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed font-sans">{seg.explanation}</p>
                                                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white"></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </p>
                </div>
            </div>

            {/* Controls - Bottom Bar */}
            <div className="flex flex-wrap gap-2 border-t border-black/5 bg-slate-50 px-6 py-4">
                {/* Neutral Button */}
                <LensButton
                    isActive={activeLensId === 'neutral'}
                    label="Nøytral"
                    onClick={() => setActiveLensId('neutral')}
                    activeColor="#475569" // Slate-600
                />

                {lenses.map((lens) => (
                    <LensButton
                        key={lens.id}
                        isActive={activeLensId === lens.id}
                        label={lens.label}
                        onClick={() => setActiveLensId(lens.id)}
                        activeColor={lens.theme.color}
                    />
                ))}
            </div>
        </div>
    );
};

export const BiasLens: React.FC<BiasLensProps> = ({
    title = 'The Rhetoric Decoder',
    baseContent = '',
    lenses = [],
    sources,
}) => {
    // Bruk sources-visning dersom lenses ikkje er oppgitt
    if (sources && sources.length > 0 && lenses.length === 0) {
        return <SourcesView title={title} sources={sources} />;
    }
    return <LensView title={title} baseContent={baseContent} lenses={lenses} />;
};

// --- Helper Subcomponent ---

const LensButton = ({
    isActive,
    label,
    onClick,
    activeColor,
}: {
    isActive: boolean;
    label: string;
    onClick: () => void;
    activeColor: string;
}) => {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 border ${isActive
                    ? 'bg-white shadow-sm scale-105'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
                }`}
            style={{
                borderColor: isActive ? activeColor : 'transparent',
                color: isActive ? activeColor : undefined
            }}
        >
            {label}
            {isActive && (
                <span className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full -translate-x-1/2" style={{ backgroundColor: activeColor }} />
            )}
        </button>
    );
};
