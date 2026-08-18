import React, { useRef } from 'react';
import { DIMENSIONS } from './dimensionMeta';
import { useLens } from '../../features/religion-nav/links';

interface LensRailProps {
    /** Kompakt variant: bare ikon og kortnavn, til trange topper */
    size?: 'normal' | 'compact';
    className?: string;
}

/**
 * Linsen som pillerad. Dette er den samme linsen som dimensjonshjulet på
 * religionsprofilen styrer - den ligger i `?dim=` og følger eleven mellom
 * hub, profil, tema og sammenligning. Railen brukes der det ikke er plass
 * til hjulet.
 */
export const LensRail: React.FC<LensRailProps> = ({ size = 'normal', className = '' }) => {
    const { dim, setDim } = useLens();
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const onKeyDown = (event: React.KeyboardEvent) => {
        const current = DIMENSIONS.findIndex((d) => d.key === dim);
        let next = -1;
        if (event.key === 'ArrowRight') next = (current + 1) % DIMENSIONS.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + DIMENSIONS.length) % DIMENSIONS.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = DIMENSIONS.length - 1;
        if (next < 0) return;
        event.preventDefault();
        setDim(DIMENSIONS[next].key);
        tabRefs.current[next]?.focus();
    };

    const pad = size === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs md:text-sm';

    return (
        <div
            role="tablist"
            aria-label="Velg spørsmål"
            onKeyDown={onKeyDown}
            className={`flex flex-wrap gap-1.5 ${className}`}
        >
            {DIMENSIONS.map((dimension, index) => {
                const isActive = dimension.key === dim;
                const Icon = dimension.icon;
                return (
                    <button
                        key={dimension.key}
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => setDim(dimension.key)}
                        title={dimension.question}
                        className={`inline-flex items-center gap-1.5 rounded-full border font-bold transition-all ${pad} ${
                            isActive
                                ? 'text-white shadow-md'
                                : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:shadow-sm'
                        }`}
                        style={{
                            backgroundColor: isActive ? dimension.color : undefined,
                            borderColor: isActive ? dimension.color : `${dimension.color}40`,
                        }}
                    >
                        <Icon
                            size={size === 'compact' ? 13 : 15}
                            style={{ color: isActive ? '#ffffff' : dimension.color }}
                        />
                        {dimension.short}
                    </button>
                );
            })}
        </div>
    );
};
