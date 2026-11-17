/** Fargene til personene i filmen, brukt både i 3D og i 2D. */
export const FARGE = {
    mathias: '#ea580c',
    randi: '#2563eb',
    mekler: '#9333ea',
    stat: '#475569',
    rod: '#dc2626',
    gronn: '#16a34a',
    tekst: '#0f172a',
    dempet: '#64748b',
};

/** Omtrentlig bredde på en tekstlinje i SVG-enheter. */
export function bredde(tekst: string, storrelse: number) {
    return tekst.length * storrelse * 0.58;
}
