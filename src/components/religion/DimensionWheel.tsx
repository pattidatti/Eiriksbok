import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { DIMENSIONS, type DimensionKey } from './dimensionMeta';

interface DimensionWheelProps {
    religionName: string;
    /** Religionens egen farge - brukes på navet og fremdriftsringen */
    color: string;
    selected: DimensionKey;
    /** Dimensjoner eleven har åpnet. Fylles gradvis, og fyller hjulet. */
    visited: Set<DimensionKey>;
    /** Dimensjoner som faktisk har innhold i datafila */
    available: Set<DimensionKey>;
    onSelect: (key: DimensionKey) => void;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const R_OUTER = 148;
const R_INNER = 58;
const R_HUB = 52;
const SLICE = 360 / DIMENSIONS.length;
// Luft mellom kilene, i grader. Gjør hjulet til sju tydelige felt i stedet
// for én sammenhengende skive.
const GAP = 2;
const LABEL_RADIUS = 104;

const polar = (radius: number, degrees: number) => {
    const rad = ((degrees - 90) * Math.PI) / 180;
    return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)] as const;
};

/** Ringutsnitt (donut-kile) mellom to vinkler */
function wedgePath(startDeg: number, endDeg: number) {
    const [x0, y0] = polar(R_OUTER, startDeg);
    const [x1, y1] = polar(R_OUTER, endDeg);
    const [x2, y2] = polar(R_INNER, endDeg);
    const [x3, y3] = polar(R_INNER, startDeg);
    return [
        `M ${x0} ${y0}`,
        `A ${R_OUTER} ${R_OUTER} 0 0 1 ${x1} ${y1}`,
        `L ${x2} ${y2}`,
        `A ${R_INNER} ${R_INNER} 0 0 0 ${x3} ${y3}`,
        'Z',
    ].join(' ');
}

export const DimensionWheel: React.FC<DimensionWheelProps> = ({
    religionName,
    color,
    selected,
    visited,
    available,
    onSelect,
}) => {
    const pathRefs = useRef<(SVGPathElement | null)[]>([]);
    const progress = visited.size / DIMENSIONS.length;
    const hubCircumference = 2 * Math.PI * R_HUB;

    const move = (delta: number) => {
        const current = DIMENSIONS.findIndex((d) => d.key === selected);
        const next = (current + delta + DIMENSIONS.length) % DIMENSIONS.length;
        onSelect(DIMENSIONS[next].key);
        pathRefs.current[next]?.focus();
    };

    return (
        <div
            className="relative w-full max-w-[340px] mx-auto aspect-square select-none"
            role="radiogroup"
            aria-label={`Velg dimensjon for ${religionName}`}
            onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    move(1);
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    move(-1);
                }
            }}
        >
            <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="w-full h-full overflow-visible"
                aria-hidden="false"
            >
                {DIMENSIONS.map((dim, index) => {
                    const isSelected = selected === dim.key;
                    const isVisited = visited.has(dim.key);
                    const hasContent = available.has(dim.key);
                    const mid = index * SLICE + SLICE / 2;
                    // Valgt kile skyves litt ut fra navet, som et uttrekk i en skuff
                    const [ox, oy] = polar(6, mid);

                    return (
                        <motion.path
                            key={dim.key}
                            ref={(el) => {
                                pathRefs.current[index] = el;
                            }}
                            d={wedgePath(index * SLICE + GAP / 2, (index + 1) * SLICE - GAP / 2)}
                            fill={dim.color}
                            fillOpacity={isSelected ? 0.92 : isVisited ? 0.34 : 0.13}
                            stroke={dim.color}
                            strokeOpacity={isSelected ? 1 : 0.35}
                            strokeWidth={isSelected ? 2 : 1}
                            animate={{
                                x: isSelected ? ox - CENTER : 0,
                                y: isSelected ? oy - CENTER : 0,
                                opacity: hasContent ? 1 : 0.4,
                            }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            whileHover={{ scale: 1.035 }}
                            whileTap={{ scale: 0.99 }}
                            style={{ transformBox: 'view-box', transformOrigin: '160px 160px' }}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${dim.label}. ${dim.question}`}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => onSelect(dim.key)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onSelect(dim.key);
                                }
                            }}
                            className="cursor-pointer focus:outline-none focus-visible:stroke-slate-900 focus-visible:[stroke-width:3]"
                        />
                    );
                })}

                {/* Navet: fremdriftsring rundt religionsnavnet */}
                <circle cx={CENTER} cy={CENTER} r={R_HUB} fill="#ffffff" />
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={R_HUB}
                    fill="none"
                    stroke={color}
                    strokeOpacity={0.15}
                    strokeWidth={4}
                />
                <motion.circle
                    cx={CENTER}
                    cy={CENTER}
                    r={R_HUB}
                    fill="none"
                    stroke={color}
                    strokeWidth={4}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    style={{ strokeDasharray: hubCircumference }}
                    animate={{ strokeDashoffset: hubCircumference * (1 - progress) }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
            </svg>

            {/* Etiketter og ikoner legges over SVG-en som HTML, i prosent av
                boksen, slik at de følger med når hjulet skalerer. */}
            {DIMENSIONS.map((dim, index) => {
                const mid = index * SLICE + SLICE / 2;
                const [x, y] = polar(LABEL_RADIUS, mid);
                const isSelected = selected === dim.key;
                const Icon = dim.icon;

                return (
                    <div
                        key={dim.key}
                        className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
                        style={{
                            left: `${(x / SIZE) * 100}%`,
                            top: `${(y / SIZE) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '72px',
                        }}
                    >
                        <Icon
                            size={18}
                            strokeWidth={2.2}
                            style={{ color: isSelected ? '#ffffff' : dim.color }}
                        />
                        <span
                            className={`text-[10px] leading-tight font-bold text-center ${
                                isSelected ? 'text-white' : 'text-slate-700'
                            }`}
                        >
                            {dim.short}
                        </span>
                    </div>
                );
            })}

            {/* Navteksten */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center px-6">
                    {religionName}
                </span>
                <span className="text-lg font-display font-bold" style={{ color }}>
                    {visited.size}/{DIMENSIONS.length}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">lest</span>
            </div>
        </div>
    );
};
