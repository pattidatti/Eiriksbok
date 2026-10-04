// Brettene: opptrappingen fra designbriefens punkt 11 og gråboks-diagnosen som data.
// Ett brett = ett rutenett (utsnitt av kartet), Paris sin plass, regionene der fabrikkene
// dukker opp, hvor mange som blinker, målet og bølgen. Koordinatene er ruter (0,0 er øverst
// til venstre). Rutenettet er lite nok til at én rute er minst 24 px ved 1366x768.

export interface NavnFabrikk {
    navn: string;
    x: number;
    y: number;
}

/** Et område der nye fabrikker kan dukke opp. `vekt` = hvor ofte. */
export interface Region {
    navn: string;
    x: number;
    y: number;
    r: number;
    vekt: number;
}

export interface Brett {
    nr: 1 | 2 | 3;
    navn: string;
    /** Rutenettet. */
    b: number;
    h: number;
    /** Sorbonne i Paris: her starter hodet. */
    paris: { x: number; y: number };
    /** Fabrikker som blinker samtidig (maks 4). */
    samtidig: number;
    /** Fartstak på dette brettet (ruter/s). */
    fartTak: number;
    /** Har brettet GRENELLE-knappen? (brett 1 har den ikke) */
    knapp: boolean;
    /** Mål i millioner. Brett 1: vunnet når du når det. Ellers: AVSLUTT med minst så mye. */
    mål: number;
    /**
     * Bølgen etter Grenelle: ledd/s ved start, ganges med `vekst` for hver fabrikk du tar
     * etter Grenelle, og øker litt med tiden (`økning` ledd/s per sekund).
     */
    bølge: { start: number; vekst: number; økning: number };
    /** Viser kalenderen 13.-30. mai? Uten kalender gjelder `frist` (sekunder) i stedet. */
    kalender: boolean;
    /** Sekunder før de Gaulle-tilhengerne kommer uansett (uten avtale = tap). */
    frist: number;
    /** Får fjerne fabrikker ekstra verdi? */
    fjernBonus: boolean;
    /** Kan fjerne fabrikker bli x2 en kort stund? */
    x2: boolean;
    /** Ledd kjeden vokser med for hver fabrikk (verdien deles på leddene). */
    leddPer: number;
    /** Fabrikkene kommer i klynger: alle `samtidig` på én gang, tett i én region. */
    klynge: boolean;
    /** Kan et krasj splitte streiken (tap)? Brett 1 lærer krasjet uten å ta runden. */
    splitt: boolean;
    regioner: Region[];
    fabrikker: NavnFabrikk[];
}

export const BRETT: Brett[] = [
    {
        nr: 1,
        navn: 'Sorbonne, 13. mai',
        b: 22,
        h: 14,
        paris: { x: 11, y: 7 },
        samtidig: 3,
        fartTak: 8,
        knapp: false,
        mål: 2.5,
        bølge: { start: 0, vekst: 1, økning: 0 },
        kalender: false,
        frist: 32,
        fjernBonus: false,
        x2: false,
        leddPer: 2,
        klynge: true,
        splitt: false,
        regioner: [
            { navn: 'Latinerkvarteret', x: 11, y: 7, r: 3, vekt: 1 },
            { navn: 'Billancourt', x: 4, y: 10, r: 2, vekt: 1 },
            { navn: 'Nanterre', x: 4, y: 3, r: 2, vekt: 1 },
            { navn: 'Saint-Denis', x: 13, y: 2, r: 2, vekt: 1 },
            { navn: 'Vincennes', x: 18, y: 8, r: 2, vekt: 1 },
            { navn: 'Orly', x: 12, y: 12, r: 2, vekt: 1 },
        ],
        fabrikker: [
            { navn: 'Citroën', x: 6, y: 9 },
            { navn: 'Renault Billancourt', x: 3, y: 10 },
            { navn: 'Nanterre', x: 4, y: 3 },
        ],
    },
    {
        nr: 2,
        navn: 'Grenelle, 27. mai',
        b: 28,
        h: 18,
        paris: { x: 21, y: 6 },
        samtidig: 3,
        fartTak: 10,
        knapp: true,
        mål: 4,
        bølge: { start: 0.7, vekst: 1.12, økning: 0.03 },
        kalender: false,
        frist: 30,
        fjernBonus: true,
        x2: true,
        leddPer: 1,
        klynge: false,
        splitt: true,
        regioner: [
            { navn: 'Paris', x: 21, y: 6, r: 3, vekt: 0.3 },
            { navn: 'Normandie', x: 13, y: 4.5, r: 2, vekt: 0.2 },
            { navn: 'Le Mans', x: 12, y: 11, r: 3, vekt: 0.2 },
            { navn: 'Nantes', x: 4, y: 13, r: 3, vekt: 0.3 },
        ],
        fabrikker: [
            { navn: 'Renault Cléon', x: 14, y: 3 },
            { navn: 'Sud-Aviation Nantes', x: 5, y: 14 },
            { navn: 'Verftene i Saint-Nazaire', x: 2, y: 12 },
            { navn: 'Renault Flins', x: 18, y: 5 },
        ],
    },
    {
        nr: 3,
        navn: 'Hele Frankrike, mai 68',
        b: 34,
        h: 20,
        paris: { x: 17, y: 5 },
        samtidig: 4,
        fartTak: 11,
        knapp: true,
        mål: 6,
        bølge: { start: 0.5, vekst: 1.12, økning: 0.06 },
        kalender: true,
        frist: 30,
        fjernBonus: true,
        x2: true,
        leddPer: 1,
        klynge: false,
        splitt: true,
        regioner: [
            { navn: 'Paris', x: 17, y: 5, r: 3, vekt: 0.12 },
            { navn: 'Nord', x: 20, y: 1, r: 2, vekt: 0.08 },
            { navn: 'Normandie', x: 10, y: 3, r: 2, vekt: 0.06 },
            { navn: 'Nantes', x: 4, y: 10, r: 3, vekt: 0.16 },
            { navn: 'Lyon', x: 25, y: 14, r: 3, vekt: 0.16 },
            { navn: 'Sochaux', x: 30, y: 9, r: 2, vekt: 0.12 },
            { navn: 'Marseille', x: 26, y: 18, r: 2, vekt: 0.15 },
            { navn: 'Toulouse', x: 11, y: 17, r: 3, vekt: 0.15 },
        ],
        fabrikker: [
            { navn: 'Peugeot Sochaux', x: 30, y: 9 },
            { navn: 'Berliet Lyon', x: 24, y: 13 },
            { navn: 'Rhodiaceta Lyon', x: 26, y: 15 },
            { navn: 'Gruvene i nord', x: 20, y: 1 },
            { navn: 'Jernbanen', x: 15, y: 10 },
            { navn: 'Sud-Aviation Toulouse', x: 11, y: 17 },
            { navn: 'Havna i Marseille', x: 26, y: 18 },
            { navn: 'Renault Cléon', x: 10, y: 3 },
            { navn: 'Sud-Aviation Nantes', x: 4, y: 10 },
        ],
    },
];
