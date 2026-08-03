import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

export interface Shot {
    id: string;
    name: string;
    englishName: string;
    framing: string;
    useCase: string;
    example: string;
}

interface ShotTypeExplorerProps {
    title?: string;
    shots: Shot[];
}

const ACCENT: Record<string, { main: string; light: string; text: string }> = {
    'extreme-wide': { main: '#6366f1', light: '#eef2ff', text: 'text-indigo-700' },
    'wide': { main: '#7c3aed', light: '#f5f3ff', text: 'text-violet-700' },
    'medium': { main: '#db2777', light: '#fdf2f8', text: 'text-pink-700' },
    'close-up': { main: '#d97706', light: '#fffbeb', text: 'text-amber-700' },
    'extreme-close-up': { main: '#dc2626', light: '#fef2f2', text: 'text-red-700' },
};

// How many units down (out of 160) are "in frame" — null = whole figure
const CUT_Y: Record<string, number | null> = {
    'extreme-wide': null,
    'wide': null,
    'medium': 99,
    'close-up': 52,
    'extreme-close-up': 32,
};

// Person silhouette in SVG space 0 0 100 160.
// Modulnivå, ikke inne i SilhouetteDiagram: en komponent som defineres på nytt
// hver render får ny identitet, og React bygger SVG-nodene på nytt hver gang.
const PersonShape = ({
    fill,
    opacity = 1,
    transform,
}: {
    fill: string;
    opacity?: number;
    transform?: string;
}) => (
    <g fill={fill} opacity={opacity} transform={transform}>
        <circle cx="50" cy="16" r="14" />
        <rect x="35" y="30" width="30" height="68" rx="5" />
        <rect x="21" y="30" width="12" height="42" rx="4" />
        <rect x="67" y="30" width="12" height="42" rx="4" />
        <rect x="35" y="98" width="12" height="56" rx="4" />
        <rect x="53" y="98" width="12" height="56" rx="4" />
    </g>
);

function SilhouetteDiagram({
    framing,
    accentColor,
    clipId,
}: {
    framing: string;
    accentColor: string;
    clipId: string;
}) {
    const cutY = CUT_Y[framing];
    const isExtremeWide = framing === 'extreme-wide';

    // Person silhouette in SVG space 0 0 100 160
    // head: cy=16 r=14 → y: 2–30
    // body: rect 35,30 w=30 h=68 → y: 30–98
    // arms: rect 21,30 w=12 h=42 and rect 67,30 w=12 h=42
    // legs: rect 35,98 w=12 h=56 and rect 53,98 w=12 h=56

    // For extreme-wide: scale person to 24% and position near the ground line
    const personTransform = isExtremeWide ? 'translate(38, 88) scale(0.24)' : undefined;

    return (
        <svg
            viewBox="0 0 100 160"
            className="w-full"
            style={{ maxHeight: '144px' }}
            aria-hidden="true"
        >
            <defs>
                {cutY !== null && (
                    <clipPath id={clipId}>
                        <rect x="0" y="0" width="100" height={cutY} />
                    </clipPath>
                )}
            </defs>

            {/* Background */}
            <rect x="0" y="0" width="100" height="160" fill="#f8fafc" rx="6" />

            {/* Landscape context for extreme-wide */}
            {isExtremeWide && (
                <>
                    <path
                        d="M0,108 Q25,100 50,104 Q75,108 100,103 L100,122 L0,122 Z"
                        fill="#dbeafe"
                        opacity="0.6"
                    />
                    <line x1="0" y1="122" x2="100" y2="122" stroke="#e2e8f0" strokeWidth="1.5" />
                    <line
                        x1="8"
                        y1="132"
                        x2="92"
                        y2="132"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        opacity="0.5"
                    />
                </>
            )}

            {/* Gray background person (only shown for cut shots) */}
            {cutY !== null && <PersonShape fill="#cbd5e1" opacity={0.25} />}

            {/* Colored person — clipped for cut shots, full/scaled for others */}
            {cutY !== null ? (
                <g clipPath={`url(#${clipId})`}>
                    <PersonShape fill={accentColor} />
                </g>
            ) : (
                <PersonShape fill={accentColor} transform={personTransform} />
            )}

            {/* Frame cut dashed line */}
            {cutY !== null && (
                <line
                    x1="2"
                    y1={cutY}
                    x2="98"
                    y2={cutY}
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeDasharray="6,3"
                />
            )}

            {/* Outer frame border */}
            <rect
                x="1"
                y="1"
                width="98"
                height="158"
                fill="none"
                stroke={accentColor}
                strokeWidth="1.5"
                rx="5"
                opacity="0.35"
            />
        </svg>
    );
}

export const ShotTypeExplorer = ({ title = 'Kameraavstander', shots }: ShotTypeExplorerProps) => {
    const [idx, setIdx] = useState(0);
    const [uid] = useState(() => `se-${Math.random().toString(36).slice(2, 7)}`);

    const prev = () => setIdx((i) => (i - 1 + shots.length) % shots.length);
    const next = () => setIdx((i) => (i + 1) % shots.length);

    const shot = shots[idx];
    const accent = ACCENT[shot.framing] ?? ACCENT['wide'];
    const clipId = `${uid}-clip-${shot.framing}`;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-xl mx-auto my-6">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center gap-3">
                <Camera className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold">{title}</h3>
                <span className="ml-auto text-xs text-slate-500">
                    {idx + 1} / {shots.length}
                </span>
            </div>

            {/* Content */}
            <div className="p-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={shot.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18 }}
                        className="grid grid-cols-[110px_1fr] gap-5 items-start"
                    >
                        {/* Silhouette diagram */}
                        <SilhouetteDiagram
                            framing={shot.framing}
                            accentColor={accent.main}
                            clipId={clipId}
                        />

                        {/* Shot info */}
                        <div>
                            <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${accent.text}`}
                                style={{ backgroundColor: accent.light }}
                            >
                                {shot.id.toUpperCase().replace(/-/g, ' ')}
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                {shot.name}
                            </h4>
                            <p className="text-xs text-slate-400 mb-2">({shot.englishName})</p>
                            <p className={`text-sm font-semibold mb-1.5 ${accent.text}`}>
                                {shot.useCase}
                            </p>
                            <p className="text-sm text-slate-500 italic">"{shot.example}"</p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <button
                        onClick={prev}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                        <ChevronLeft className="w-4 h-4" /> Forrige
                    </button>

                    <div className="flex gap-2">
                        {shots.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setIdx(i)}
                                className="w-2.5 h-2.5 rounded-full transition-colors"
                                style={{
                                    backgroundColor:
                                        i === idx
                                            ? ACCENT[s.framing]?.main ?? '#64748b'
                                            : '#e2e8f0',
                                }}
                                aria-label={s.name}
                            />
                        ))}
                    </div>

                    <button
                        onClick={next}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                        Neste <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
