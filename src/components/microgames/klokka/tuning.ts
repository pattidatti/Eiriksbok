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

    /** Seier: redd flere enn dette (de som faktisk ble reddet i 1912) før natta er over. */
    seier: 705,

    // Landgangen: én rampe som peker mot babord eller styrbord. Køen går selv om bord.
    landgang: {
        /** Folk per sekund som går over landgangen og setter seg. */
        perSek: 10,
        /** Sekunder landgangen står stille når du bytter side. */
        bytt: 0.6,
    },

    // Firingen. Sekunder du må holde for å fire en båt helt ned på den lave siden.
    firing: {
        /** Holdet må vare så lenge før tauet begynner å løpe (et kort trykk flytter landgangen i stedet). */
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
        { t: kl('01.38'), grader: 0 },
        { t: kl('02.00'), grader: -6 },
        { t: kl('02.20'), grader: -9 },
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
                // Ingen tror at skipet synker: små grupper som nøler.
                { fra: kl('00.45'), intervall: [6, 9], størrelse: [2, 5] },
                { fra: kl('00.55'), intervall: [3.5, 5], størrelse: [3, 7] },
                { fra: kl('01.10'), intervall: [3, 4], størrelse: [4, 8] },
            ],
        },
        2: {
            åpner: kl('01.00'),
            gang: [8, 14] as [number, number],
            faser: [
                { fra: kl('01.00'), intervall: [2.5, 3.5], størrelse: [5, 10] },
                { fra: kl('01.25'), intervall: [2, 2.8], størrelse: [6, 11] },
            ],
        },
        3: {
            åpner: kl('01.25'),
            gang: [18, 28] as [number, number],
            faser: [{ fra: kl('01.25'), intervall: [2.4, 3.2], størrelse: [8, 14] }],
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
    port: { pos: 0.55, åpner: [kl('01.36'), kl('01.42')] as [number, number] },

    /** Nødrakettene (klokkeslett). Bare til visningen - fasene over gjør gruppene større. */
    raketter: [kl('00.55'), kl('01.00'), kl('01.10'), kl('01.20'), kl('01.30')],

    // Planleggeren (rules.ts, sisteStart): sekunder mellom to firinger med samme hånd.
    plan: { pause: 0.3 },

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
