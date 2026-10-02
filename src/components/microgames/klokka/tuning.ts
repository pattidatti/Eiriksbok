// Alle tallene for Båtdekket klokka 00.45. Endre her først - reglene i rules.ts
// og game.ts har ingen balansetall selv.

/** Spillsekunder per minutt på klokka. 00.45 til 02.20 er 95 minutter. */
export const SEK_PER_MIN = 2.2;

/** Klokkeslett («01.40») til spillsekunder etter 00.45. */
export const kl = (hhmm: string) => {
    const [h, m] = hhmm.split('.').map(Number);
    return (h * 60 + m - 45) * SEK_PER_MIN;
};

export const TUNING = {
    // Klokka: runden slutter når skipet er borte.
    slutt: kl('02.20'),

    // Firingen. Sekunder du må holde for å fire en båt helt ned på den lave siden.
    firing: {
        /** Holdet må vare så lenge før tauet begynner å løpe (et kort trykk vinker i stedet). */
        holdForsinkelse: 0.2,
        livbåt: 4.2,
        kutter: 3.4,
        /** Sammenleggbare skyves av rett fra dekket. */
        sammenleggbar: 1.6,
        /** På den høye siden går det tregere: ganger med 1 + dette x (krengning / maks). */
        høyTreghet: 0.9,
        /** Sekunder før neste båt henger klar på daviten. */
        svingUt: 1.6,
        /** Sekunder brettkortet står før de nye båtene svinger ut. */
        kort: 2.0,
    },

    // Krengningen i grader (pluss = mot styrbord, minus = mot babord), som punkter i tid.
    krengning: [
        { t: kl('00.45'), grader: 0 },
        { t: kl('01.05'), grader: 1.5 },
        { t: kl('01.30'), grader: 3 },
        { t: kl('01.40'), grader: 0 },
        { t: kl('02.10'), grader: -7 },
        { t: kl('02.20'), grader: -8 },
    ],
    /** Krenger skipet så mye mot babord, låses livbåtene og kutterne på styrbord mot skroget. */
    låsGrader: 5,
    /** Sekunder før fristen tauet blinker rødt. */
    varsel: 10,

    // Vannet: høyde 0 = G-dekk, 7 = båtdekket. Punkter i tid (til tegningen og presset).
    vann: [
        { t: kl('00.45'), dekk: 0 },
        { t: kl('01.10'), dekk: 1.5 },
        { t: kl('01.40'), dekk: 3.5 },
        { t: kl('02.00'), dekk: 5.5 },
        { t: kl('02.20'), dekk: 7.2 },
    ],

    // Folk på vei opp. Hver klasse har en trapp og faser med intervall og gruppestørrelse.
    // gang = sekunder fra lugarene til båtdekket (trengsel gir spredning).
    klasser: {
        1: {
            åpner: kl('00.45'),
            gang: [4, 7] as [number, number],
            faser: [
                { fra: kl('00.45'), intervall: [5, 7], størrelse: [2, 6] },
                { fra: kl('00.50'), intervall: [3, 4.5], størrelse: [3, 8] },
                { fra: kl('01.10'), intervall: [2.8, 4], størrelse: [4, 9] },
            ],
        },
        2: {
            åpner: kl('01.00'),
            gang: [8, 14] as [number, number],
            faser: [
                { fra: kl('01.00'), intervall: [2.2, 3.2], størrelse: [5, 11] },
                { fra: kl('01.30'), intervall: [1.8, 2.6], størrelse: [6, 12] },
            ],
        },
        3: {
            åpner: kl('01.20'),
            gang: [18, 28] as [number, number],
            faser: [{ fra: kl('01.20'), intervall: [1.6, 2.4], størrelse: [10, 18] }],
        },
    } as Record<
        1 | 2 | 3,
        {
            åpner: number;
            gang: [number, number];
            faser: { fra: number; intervall: number[]; størrelse: number[] }[];
        }
    >,
    /** Gitterporten for tredje klasse: hvor langt opp den står (0-1), og når den åpnes. */
    port: { pos: 0.55, åpner: [kl('01.33'), kl('01.38')] as [number, number] },

    /** Nødrakettene (klokkeslett). Bare til visningen - fasene over gjør gruppene større. */
    raketter: [kl('00.50'), kl('01.00'), kl('01.10'), kl('01.20'), kl('01.30')],

    // Planleggeren (rules.ts, sisteStart): typisk gruppe og sekunder per vink.
    plan: { gruppe: 10, vinkSek: 0.25 },

    // Presset (0-1) i snapshot: vann, krengning og kø.
    press: { vann: 0.55, krengning: 0.2, kø: 0.25, køFull: 60 },

    // Rangene etter tomme plasser: siste rad der tomme < grensen, gjelder.
    ranger: [
        [Infinity, 'Som i 1912'],
        [472, 'Bedre enn 1912'],
        [300, 'Rolig hånd'],
        [150, 'Hver plass teller'],
        [40, 'Ingen tomme hull'],
    ] as [number, string][],
} as const;
