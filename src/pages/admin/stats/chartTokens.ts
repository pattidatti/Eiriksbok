// Farger og skalaer for dashbordets diagrammer.
//
// Egen fil, ikke sammen med komponentene: Fast Refresh slår seg av for en fil
// som eksporterer både komponenter og konstanter.
//
// Fargene er validert for fargeblindhet (dataviz-validatoren): parene under
// klarer både CVD- og normalsyn-terskelen mot hverandre, og alle har minst
// 3:1 kontrast mot den lyse flaten. Fagfargene ligger ett hakk mørkere enn
// appens egne (src/utils/subjectColors.ts) nettopp for å klare det kravet -
// samme fargefamilie, men lesbar som tynn strek. Fargen bekrefter alltid en
// etikett som allerede står der; den bærer aldri identiteten alene.

/** Serie 1 og 2 - blå og oransje, paret med størst avstand for alle synstyper. */
export const SERIE_1 = '#2a78d6';
export const SERIE_2 = '#eb6834';
export const RUTENETT = '#e2e8f0';
export const TEKST_SVAK = '#64748b';

/** Fagfarger stemt for diagram. Slås opp med fag-id fra manifestet. */
export const FAG_FARGE: Record<string, string> = {
    historie: '#d97706',
    norsk: '#e11d48',
    krle: '#047857',
    samfunnskunnskap: '#0284c7',
    samfunnsfag: '#0f766e',
    musikk: '#7c3aed',
    verktoy: '#64748b',
};

export const fagFarge = (id: string): string => FAG_FARGE[id] ?? '#64748b';

/** Sekvensiell rampe til varmekartet: én tone, lys -> mørk. */
export const RAMPE = ['#f1f5f9', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4338ca'];

export const rampeSteg = (andel: number): string => {
    if (andel <= 0) return RAMPE[0];
    const i = Math.min(RAMPE.length - 1, 1 + Math.floor(andel * (RAMPE.length - 1)));
    return RAMPE[i];
};
