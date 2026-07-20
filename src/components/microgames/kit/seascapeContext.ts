import React from 'react';

// Felles vann-kontekst for mikrospill. Ligger i egen fil (ikke i scene-parts.tsx)
// så scene-parts-filene kun eksporterer komponenter - det holder React Fast
// Refresh glad. `Seascape` (i scene-parts.tsx) fyller konteksten; `Boat` (i
// scene-parts-extra.tsx) leser den for DEV-vakthunden.
export type SeascapeBounds = { x: [number, number]; z: [number, number] };
export type SeascapeInfo = { waterY: number; bounds: SeascapeBounds | null };

export const SeascapeContext = React.createContext<SeascapeInfo>({ waterY: 0, bounds: null });

/** Les nærmeste Seascape (vannlinje + utstrekning). `bounds: null` = ingen Seascape over. */
export function useSeascape(): SeascapeInfo {
    return React.useContext(SeascapeContext);
}
