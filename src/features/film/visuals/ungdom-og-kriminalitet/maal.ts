/** Omtrentlig bredde på fet tekst i SVG (litt romslig, så kortene aldri blir for smale). */
export function bredde(tekst: string, fs: number) {
    return tekst.length * fs * 0.58;
}

export const FARGE = {
    blekk: '#0f172a',
    gra: '#475569',
    lys: '#e2e8f0',
    rod: '#dc2626',
    gronn: '#0d9488',
    bla: '#2563eb',
    oransje: '#ea580c',
    lilla: '#7c3aed',
    gul: '#d97706',
};

/** Høyden på et Kort, for å stable dem. */
export function kortHoyde(fs: number, medTekst: boolean) {
    const ts = Math.max(26, Math.round(fs * 0.8));
    return medTekst ? fs + ts + 44 : fs + 34;
}
