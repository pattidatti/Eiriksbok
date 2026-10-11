// Brettene i Brevnettet: ett brett per år, som data. Opptrappingen følger designbriefen
// punkt 11: 1796 bare tenning, 1797 lensmannen, 1798 venteringen, så alle tre reglene.

export interface Brett {
    år: number;
    /** Vevd tittel som glir inn ved starten av brettet. */
    tittel: string;
    /** Lengste tid på brettet i sekunder. */
    sek: number;
    /** Nøster eleven får når brettet starter (resten kommer per stue som overlever et raid). */
    nøster: number;
    /** Stuer som dukker opp med en gang brettet starter (posisjoner i andeler av veven, eller tilfeldig). */
    startStuer: { x: number; y: number }[];
    /** Sekunder mellom hvert nye par av mørke stuer, én på hver side (null = ingen nye underveis). */
    stueHver: number | null;
    /** Lensmannen: sekunder fra brettets start til første ritt, og mellom rittene (null = han kommer ikke). */
    lensFørst: number | null;
    lensHver: number | null;
    /** Sekunder han rir før han tar Hauge (varselet). */
    varsel: number;
    /** Sekunder før ringen rundt en mørk stue er full (null = ingen ventering ennå). */
    ringTid: number | null;
    /** Brettet slutter når alle stuene lyser (bare første brett). */
    slutterNårAlleLyser?: boolean;
    /** Spøkelsestråden som viser svaret (første gang regelen dukker opp). */
    spøkelse?: 'tenn' | 'bind';
    /** Fengselsårene 1804-1814: Hauge tas for siste gang, lensmannen klipper. */
    fengsel?: boolean;
}

export const BRETT: Brett[] = [
    {
        år: 1796,
        tittel: 'ANNO 1796',
        sek: 22,
        nøster: 4,
        startStuer: [
            { x: 0.64, y: 0.62 },
            { x: 0.34, y: 0.3 },
            { x: 0.43, y: 0.84 },
        ],
        stueHver: null,
        lensFørst: null,
        lensHver: null,
        varsel: 0,
        // Ringen synes fra første sekund, men fylles så sakte at den ikke rekker å bli full.
        ringTid: 50,
        slutterNårAlleLyser: true,
        spøkelse: 'tenn',
    },
    {
        år: 1797,
        tittel: 'ANNO 1797',
        sek: 25,
        nøster: 2,
        startStuer: [{ x: 0.7, y: 0.3 }],
        stueHver: null,
        lensFørst: 9,
        lensHver: null,
        varsel: 5,
        ringTid: 40,
        spøkelse: 'bind',
    },
    {
        år: 1798,
        tittel: 'ANNO 1798',
        sek: 28,
        nøster: 2,
        startStuer: [
            { x: 0.08, y: 0.5 },
            { x: 0.92, y: 0.55 },
        ],
        stueHver: null,
        lensFørst: 21,
        lensHver: null,
        varsel: 4.5,
        ringTid: 20,
    },
    {
        år: 1799,
        tittel: 'ANNO 1799',
        sek: 16,
        nøster: 0,
        startStuer: [],
        stueHver: 13,
        lensFørst: 9,
        lensHver: 18,
        varsel: 4.2,
        ringTid: 18,
    },
    {
        år: 1800,
        tittel: 'ANNO 1800',
        sek: 16,
        nøster: 0,
        startStuer: [],
        stueHver: 12,
        lensFørst: null,
        lensHver: 16,
        varsel: 4.2,
        ringTid: 16,
    },
    {
        år: 1801,
        tittel: 'ANNO 1801',
        sek: 16,
        nøster: 0,
        startStuer: [],
        stueHver: 11,
        lensFørst: null,
        lensHver: 14,
        varsel: 4,
        ringTid: 15,
    },
    {
        år: 1802,
        tittel: 'ANNO 1802',
        sek: 16,
        nøster: 0,
        startStuer: [],
        stueHver: 10,
        lensFørst: null,
        lensHver: 12.5,
        varsel: 4,
        ringTid: 14,
    },
    {
        år: 1803,
        tittel: 'ANNO 1803',
        sek: 16,
        nøster: 0,
        startStuer: [],
        stueHver: 9,
        lensFørst: null,
        lensHver: 11,
        varsel: 3.8,
        ringTid: 13,
    },
    {
        år: 1804,
        tittel: 'ANNO 1804',
        sek: 38,
        nøster: 1,
        startStuer: [],
        stueHver: null,
        lensFørst: 0.5,
        lensHver: null,
        varsel: 3,
        ringTid: null,
        fengsel: true,
    },
];

/** Lengste mulige runde (uten sakte film). */
export const RUNDE_SEK = BRETT.reduce((s, b) => s + b.sek, 0);
