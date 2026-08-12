import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ComparisonEntity, MatrixRow } from './types';

interface ComparisonMatrixProps {
    rows: MatrixRow[];
    entities: ComparisonEntity[];
}

// Fargene brukes til å vise at flere religioner har samme svar. De er
// bevisst dempet: tabellen skal leses, ikke blinke. Rekkefølgen er fast, så
// samme mønster får samme farge hver gang eleven kommer tilbake til en rad.
const BUCKET_TINTS = [
    { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' },
    { bg: '#eef2ff', border: '#a5b4fc', text: '#3730a3' },
    { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
];

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ rows, entities }) => {
    // En bucket får farge bare hvis minst to av de VALGTE religionene deler
    // den. Fargen betyr altså «dette svaret deler du med noen andre her».
    const tintByRow = useMemo(() => {
        const map = new Map<string, Map<string, (typeof BUCKET_TINTS)[number]>>();
        for (const row of rows) {
            const counts = new Map<string, number>();
            for (const entity of entities) {
                const bucket = row.values[entity.id]?.bucket;
                if (bucket) counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
            }
            const shared = [...counts.entries()]
                .filter(([, n]) => n >= 2)
                .map(([bucket]) => bucket);
            const tints = new Map<string, (typeof BUCKET_TINTS)[number]>();
            shared.forEach((bucket, index) => {
                tints.set(bucket, BUCKET_TINTS[index % BUCKET_TINTS.length]);
            });
            map.set(row.key, tints);
        }
        return map;
    }, [rows, entities]);

    const hasAnyTint = useMemo(
        () => [...tintByRow.values()].some((tints) => tints.size > 0),
        [tintByRow]
    );

    if (rows.length === 0 || entities.length === 0) return null;

    // 1fr per religion, og en litt smalere første kolonne til radetiketten
    const gridTemplate = `minmax(104px, 0.7fr) repeat(${entities.length}, minmax(130px, 1fr))`;

    return (
        <section className="mb-8" aria-label="Rask oversikt">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h2 className="font-display font-bold text-lg text-text-main">Rask oversikt</h2>
                {hasAnyTint && (
                    <p className="text-xs text-text-muted">
                        Like farger i en rad betyr samme svar.
                    </p>
                )}
            </div>

            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div
                    className="min-w-[560px] rounded-2xl border border-border-main bg-bg-card overflow-hidden"
                    role="table"
                >
                    <div
                        role="row"
                        className="grid border-b border-border-main bg-bg-subtle/60"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        <span role="columnheader" className="sr-only">
                            Spørsmål
                        </span>
                        <div aria-hidden className="px-3 py-2.5" />
                        {entities.map((entity) => (
                            <div
                                key={entity.id}
                                role="columnheader"
                                className="px-3 py-2.5 font-display font-bold text-sm text-text-main border-l border-border-main"
                                style={{ boxShadow: `inset 0 3px 0 ${entity.color || '#6366f1'}` }}
                            >
                                {entity.name}
                            </div>
                        ))}
                    </div>

                    {rows.map((row, rowIndex) => {
                        const tints = tintByRow.get(row.key);
                        return (
                            <div
                                key={row.key}
                                role="row"
                                className={`grid ${
                                    rowIndex > 0 ? 'border-t border-border-main' : ''
                                }`}
                                style={{ gridTemplateColumns: gridTemplate }}
                            >
                                <div
                                    role="rowheader"
                                    className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-text-muted self-center"
                                >
                                    {row.label}
                                </div>
                                {entities.map((entity) => {
                                    const cell = row.values[entity.id];
                                    const tint = cell?.bucket ? tints?.get(cell.bucket) : undefined;
                                    return (
                                        <div
                                            key={entity.id}
                                            role="cell"
                                            className="px-2 py-2 border-l border-border-main"
                                        >
                                            <motion.span
                                                layout
                                                className="block h-full rounded-lg px-2.5 py-2 text-sm leading-snug border"
                                                style={{
                                                    backgroundColor: tint?.bg ?? 'transparent',
                                                    borderColor: tint?.border ?? 'transparent',
                                                    color: tint?.text ?? 'var(--text-main)',
                                                }}
                                            >
                                                {cell?.text ?? '–'}
                                            </motion.span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
