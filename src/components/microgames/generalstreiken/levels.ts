// Brettene: opptrappingen fra designbriefens punkt 11 som data.
// Ett brett = ett rutenett (utsnitt av kartet), Paris sin plass, hvor mange fabrikker som
// blinker, målet og bølgen. Koordinatene er ruter (0,0 er øverst til venstre).

export interface NavnFabrikk {
    navn: string;
    x: number;
    y: number;
}

export interface Brett {
    nr: 1 | 2 | 3;
    navn: string;
    /** Rutenettet. */
    b: number;
    h: number;
    /** Sorbonne i Paris: her starter hodet. */
    paris: { x: number; y: number };
    /** Fabrikker som blinker samtidig. */
    samtidig: number;
    /** Fartstak på dette brettet (ruter/s). */
    fartTak: number;
    /** Har brettet GRENELLE-knappen? (brett 1 har den ikke) */
    knapp: boolean;
    /** Mål i millioner. Brett 1: vunnet når du når det. Ellers: AVSLUTT med minst så mye. */
    mål: number;
    /** Bølgen etter Grenelle: ledd/s ved start og økning per sekund. */
    bølge: { start: number; økning: number };
    /** Viser kalenderen 13.-30. mai? Uten kalender gjelder `frist` (sekunder) i stedet. */
    kalender: boolean;
    /** Sekunder før de Gaulle-tilhengerne kommer uansett (uten avtale = tap). */
    frist: number;
    /** Får fjerne fabrikker ekstra verdi? */
    fjernBonus: boolean;
    fabrikker: NavnFabrikk[];
}

export const BRETT: Brett[] = [
    {
        nr: 1,
        navn: 'Sorbonne, 13. mai',
        b: 22,
        h: 15,
        paris: { x: 11, y: 7 },
        samtidig: 2,
        fartTak: 6,
        knapp: false,
        mål: 1,
        bølge: { start: 0, økning: 0 },
        kalender: false,
        frist: 70,
        fjernBonus: false,
        fabrikker: [
            { navn: 'Citroën', x: 6, y: 9 },
            { navn: 'Renault Billancourt', x: 4, y: 6 },
            { navn: 'Nanterre', x: 16, y: 4 },
        ],
    },
    {
        nr: 2,
        navn: 'Grenelle, 27. mai',
        b: 32,
        h: 22,
        paris: { x: 22, y: 9 },
        samtidig: 3,
        fartTak: 9,
        knapp: true,
        mål: 3,
        bølge: { start: 0.4, økning: 0.05 },
        kalender: false,
        frist: 55,
        fjernBonus: false,
        fabrikker: [
            { navn: 'Renault Cléon', x: 15, y: 6 },
            { navn: 'Sud-Aviation Nantes', x: 4, y: 17 },
            { navn: 'Verftene i Saint-Nazaire', x: 2, y: 15 },
            { navn: 'Renault Flins', x: 18, y: 8 },
        ],
    },
    {
        nr: 3,
        navn: 'Hele Frankrike, mai 68',
        b: 44,
        h: 30,
        paris: { x: 24, y: 8 },
        samtidig: 4,
        fartTak: 11,
        knapp: true,
        mål: 8,
        bølge: { start: 0.5, økning: 0.1 },
        kalender: true,
        frist: 51,
        fjernBonus: true,
        fabrikker: [
            { navn: 'Peugeot Sochaux', x: 39, y: 14 },
            { navn: 'Berliet Lyon', x: 32, y: 20 },
            { navn: 'Rhodiaceta Lyon', x: 31, y: 21 },
            { navn: 'Gruvene i nord', x: 26, y: 1 },
            { navn: 'Jernbanen', x: 20, y: 14 },
            { navn: 'Sud-Aviation Toulouse', x: 18, y: 27 },
            { navn: 'Havna i Marseille', x: 34, y: 28 },
            { navn: 'Renault Cléon', x: 17, y: 6 },
        ],
    },
];
