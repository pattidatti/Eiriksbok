import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ManifestEntity } from './types';

interface EntityPickerProps {
    entities: ManifestEntity[];
    selected: string[];
    onToggle: (id: string) => void;
    maxSelected: number;
    minSelected: number;
}

// Fast epokerekkefølge for filosofi; religioner har ikke group og havner i én rad
const GROUP_ORDER = ['Antikken', 'Middelalderen', 'Opplysningstiden', 'Moderne'];

const shakeAnimation = {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.4 },
};

export const EntityPicker: React.FC<EntityPickerProps> = ({
    entities,
    selected,
    onToggle,
    maxSelected,
    minSelected,
}) => {
    const [shakeId, setShakeId] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    const handleClick = (id: string) => {
        const isSelected = selected.includes(id);
        if (!isSelected && selected.length >= maxSelected) {
            setShakeId(id);
            setHint(`Fjern en først (maks ${maxSelected})`);
            window.setTimeout(() => setShakeId(null), 450);
            return;
        }
        if (isSelected && selected.length <= minSelected) {
            setShakeId(id);
            setHint(`Velg minst ${minSelected} å sammenligne`);
            window.setTimeout(() => setShakeId(null), 450);
            return;
        }
        setHint(null);
        onToggle(id);
    };

    const hasGroups = entities.some((e) => e.group);
    const groups = hasGroups
        ? GROUP_ORDER.map((group) => ({
              group,
              items: entities.filter((e) => e.group === group),
          })).filter((g) => g.items.length > 0)
        : [{ group: null as string | null, items: entities }];

    return (
        <div className="space-y-3">
            {groups.map(({ group, items }) => (
                <div key={group ?? 'alle'} className="flex flex-wrap items-center justify-center gap-2">
                    {group && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted w-full text-center sm:w-auto">
                            {group}
                        </span>
                    )}
                    {items.map((entity) => {
                        const isSelected = selected.includes(entity.id);
                        return (
                            <motion.button
                                key={entity.id}
                                type="button"
                                layout
                                aria-pressed={isSelected}
                                animate={shakeId === entity.id ? shakeAnimation : undefined}
                                whileTap={{ scale: 0.94 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                                onClick={() => handleClick(entity.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                                        : 'bg-bg-card text-text-muted border-border-main hover:text-text-main hover:border-indigo-400'
                                }`}
                            >
                                <span
                                    aria-hidden
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: entity.color || '#94a3b8' }}
                                />
                                {entity.name}
                            </motion.button>
                        );
                    })}
                </div>
            ))}
            <div aria-live="polite" className="text-center min-h-[1.25rem]">
                {hint && <span className="text-xs text-amber-600 font-medium">{hint}</span>}
            </div>
        </div>
    );
};
