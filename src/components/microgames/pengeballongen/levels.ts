// Brettene og opptrappingen som data. Alt går i én flyvetur: et nytt brett er bare en ny
// bildetekst i nedre marg og nye regler for terrenget. Terrenget lages av terrain.ts.

/** [min, maks]. */
export type Spenn = [number, number];

export interface Brett {
    fra: number;
    /** Bildeteksten i nedre marg. */
    sted: string;
    /** Banneret når brettet starter (2-4 ord). */
    tittel: string;
    // Terrenget (y er overflaten, 540 er bunnen av bildet). Fra 1833 bruker terrenget bare
    // `dal` herfra - resten styres av formen på valgperioden (FORMER).
    /** Sekunder mellom hver fjellrygg. */
    mellom: Spenn;
    /** Høyden på toppen av ryggene. */
    topp: Spenn;
    /** Dalbunnen. */
    dal: Spenn;
    /** Andel av ryggen som er flat kam (godt for skraping). */
    kam: Spenn;
    /** Sjanse for at kongen legger inn en brå utgift (en spiss topp) på en rygg. */
    utgift: number;
}

export const BRETT: Brett[] = [
    {
        fra: 1815,
        sted: '1815 - Parti af Hallingdal',
        tittel: 'Hold for penger',
        mellom: [3.2, 4],
        topp: [395, 425],
        dal: [478, 490],
        kam: [0.1, 0.2],
        utgift: 0,
    },
    {
        fra: 1824,
        sted: '1824 - Parti ved Ringerike',
        tittel: 'Ola-boka',
        mellom: [2.9, 3.6],
        topp: [365, 410],
        dal: [472, 486],
        kam: [0.1, 0.25],
        utgift: 0,
    },
    {
        fra: 1833,
        sted: '1833 - Parti ved Egersund',
        tittel: 'Ueland om bord',
        mellom: [2.8, 3.6],
        topp: [350, 395],
        dal: [470, 484],
        kam: [0.45, 0.6],
        utgift: 0,
    },
    {
        fra: 1842,
        sted: '1842 - Parti af Filefjeld',
        tittel: 'Kongens utgifter',
        mellom: [2.5, 3.3],
        topp: [320, 380],
        dal: [466, 482],
        kam: [0.25, 0.45],
        utgift: 0.3,
    },
    {
        fra: 1854,
        sted: '1854 - Parti ved Eidsvoll',
        tittel: 'Hovedbanen',
        mellom: [2.4, 3.1],
        topp: [305, 370],
        dal: [462, 480],
        kam: [0.25, 0.45],
        utgift: 0.35,
    },
    {
        fra: 1866,
        sted: '1866 - Parti af Jotunfjeldene',
        tittel: 'Embetsverket vokser',
        mellom: [2.2, 3],
        topp: [290, 360],
        dal: [460, 478],
        kam: [0.25, 0.45],
        utgift: 0.4,
    },
    {
        fra: 1882,
        sted: '1884 - Løvebakken',
        tittel: 'Riksretten',
        mellom: [3, 3.4],
        topp: [380, 400],
        dal: [470, 480],
        kam: [0.3, 0.4],
        utgift: 0,
    },
];

export function brettFor(år: number): number {
    let i = 0;
    for (let k = 0; k < BRETT.length; k++) if (år >= BRETT[k].fra) i = k;
    return i;
}

/** Den fristende høye sletta rett før det første ekte valget (brett 2). */
export const SLETTE = { fra: 1831.4, til: 1832.7, y: 335 };

/**
 * Hver valgperiode fra 1833 har sin egen form:
 * tind = høy topp (dyr), skrapedal = bølgende åser (Ueland-gangeren),
 * banen = jernbanen (fra 1854): en lang stigning opp til en stasjon - fyr tidlig og jevnt.
 * Før 1854 veksler tind og skrapedal. Fra 1854 kommer en bane hver tredje periode, så
 * midten av runden får noe nytt å spille på.
 */
export type Form = 'tind' | 'skrapedal' | 'banen';
export function formFor(p: number, år0: number, banenFra: number): Form {
    if (år0 < banenFra) return p % 2 === 0 ? 'tind' : 'skrapedal';
    const q = Math.round((år0 - banenFra) / 3) % 3;
    return q === 0 ? 'banen' : q === 1 ? 'skrapedal' : 'tind';
}

/** Jernbanene: navnet på skiltet ved stasjonen, etter året perioden starter. */
export const BANER: { år: number; navn: string; bevilg?: boolean }[] = [
    { år: 1854, navn: 'Hovedbanen 1854' },
    { år: 1863, navn: 'Kongsvingerbanen 1862', bevilg: true },
    { år: 1872, navn: 'Drammenbanen 1872', bevilg: true },
];

/**
 * Riksretten 1882-1884: tre riksrett-stemmer henger lavt i dalen. Hver stemme kutter ett tau
 * som holder Kongens regjering (klippa som henger over dalen). Det tredje tauet = roret.
 */
export const RIKSRETT = [1882.35, 1882.95, 1883.55];
/** Kongens regjering henger over dalen her (år), med bunnen så høyt (skjerm-y). */
export const REGJERING = { år: 1883.95, bunn: 300 };

/** Statens faste utgifter: navnene som står på fjellene (etter tur). Fjellet må betales hver gang. */
export const FASTE = ['Prestelønn', 'Veier', 'Festning', 'Dommere', 'Hæren', 'Embetslønn'];

/** Kongens navngitte utgifter: en brå spiss på tinden i perioden. */
export const UTGIFTER: { år: number; navn: string; bevilg?: boolean }[] = [
    { år: 1840.5, navn: 'Ny festning' },
    // Med bevilgningsport: Stortinget velger om staten skal betale for det.
    { år: 1846.5, navn: 'Embetskontor' },
    { år: 1870.5, navn: 'Telegrafen', bevilg: true },
    { år: 1879.5, navn: 'Rørosbanen', bevilg: true },
];

export type FunnId = 'olaboka' | 'jordskatten' | 'formannskap' | 'hovedbanen' | 'ibsen' | 'roret';

/** Funn som henger lavt i en dal (samles på tvers av runder). */
export const FUNN: { id: FunnId; år: number; navn: string; fakta: string; over?: number }[] = [
    {
        id: 'olaboka',
        år: 1831.3,
        // Ola-boka henger høyere enn de andre funnene: den endrer spillet, så de fleste skal nå den.
        over: 90,
        navn: 'Ola-boka',
        fakta: 'I 1832 ga John Neergaard ut et lite hefte som ba bøndene stemme på bønder.',
    },
    {
        id: 'jordskatten',
        år: 1836.4,
        navn: 'Jordskatten strøket',
        fakta: 'I 1836 tok Stortinget bort skatten på jord, fordi bøndene ville spare.',
    },
    {
        id: 'formannskap',
        år: 1837.4,
        navn: 'Formannskapslovene',
        fakta: '14. januar 1837 fikk bygdene og byene styre seg selv med egne folkevalgte.',
    },
    {
        id: 'hovedbanen',
        år: 1855.2,
        navn: 'Hovedbanens billett',
        fakta: 'I 1854 åpnet den første jernbanen i Norge, fra Christiania til Eidsvoll.',
    },
    {
        id: 'ibsen',
        år: 1863.5,
        navn: 'Ibsens søknad',
        fakta: 'Henrik Ibsen søkte om penger flere ganger. I 1866 ga Stortinget ham fast lønn som dikter.',
    },
    {
        id: 'roret',
        år: 1883.75,
        navn: 'Sverdrups ror',
        fakta: 'I 1884 måtte kongen la Johan Sverdrup danne regjering. Nå styrte flertallet.',
    },
];
