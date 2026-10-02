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
        /** På den høye siden går det tregere: perSek x (1 - dette x krengning / maks). */
        høySide: 0.35,
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
    /**
     * Kortere lunte ved krengning: på den lave siden (den skipet krenger mot) når vannet
     * festet tidligere. Fristen flyttes så mange sekunder fram per grad krengning.
     */
    lunteKrengning: 2.6,

    // Vannet: høyde 0 = G-dekk, 7 = båtdekket. Punkter i tid (til tegningen og presset).
    vann: [
        { t: kl('00.45'), dekk: 0 },
        { t: kl('01.10'), dekk: 1.5 },
        { t: kl('01.40'), dekk: 3.5 },
        { t: kl('02.00'), dekk: 5.5 },
        { t: kl('02.20'), dekk: 7.2 },
    ],

    // Alvoret: i 1912 nektet mange å gå i de første båtene. Hver båt som er nede (og hver
    // nødrakett) får flere til å forstå at skipet synker. Tilstrømningen fra første og andre
    // klasse ganges med min(1, base + perBåt x båter nede + perRakett x raketter).
    alvor: { base: 0.22, perBåt: 0.16, perRakett: 0.05 },

    // Folk på vei opp. Hver klasse har en trapp, et antall (granskningen 1912) og faser
    // med intervall og gruppestørrelse. gang = sekunder fra lugarene til båtdekket.
    klasser: {
        1: {
            antall: 322,
            åpner: kl('00.45'),
            gang: [4, 7] as [number, number],
            faser: [
                { fra: kl('00.45'), intervall: [3, 5], størrelse: [6, 12] },
                { fra: kl('01.05'), intervall: [2.6, 4], størrelse: [8, 14] },
            ],
        },
        2: {
            antall: 277,
            åpner: kl('00.55'),
            gang: [8, 14] as [number, number],
            faser: [
                { fra: kl('00.55'), intervall: [3, 5], størrelse: [8, 16] },
                { fra: kl('01.15'), intervall: [2.6, 4], størrelse: [10, 18] },
            ],
        },
        3: {
            antall: 709,
            åpner: kl('01.12'),
            gang: [18, 26] as [number, number],
            faser: [{ fra: kl('01.12'), intervall: [1.6, 2.2], størrelse: [8, 14] }],
        },
    } as Record<
        1 | 2 | 3,
        {
            antall: number;
            åpner: number;
            gang: [number, number];
            faser: { fra: number; intervall: number[]; størrelse: number[] }[];
        }
    >,
    /** Alvoret virker bare på disse klassene (tredje klasse holdes uansett bak porten). */
    alvorKlasser: [1, 2] as const,
    /**
     * Gitterporten for tredje klasse: hvor langt opp den står (0-1, 3/7 = D-dekk), og når
     * den åpnes av seg selv hvis ingen sender stuerten (sent - i 1912 fant mange aldri veien).
     */
    port: { pos: 3 / 7, åpner: [kl('01.58'), kl('02.02')] as [number, number] },

    /**
     * Stuerten (verb nummer to): eleven sender ham ned for å åpne porten. Mens han er borte,
     * står landgangen stille - båtene venter. Han kan sendes én gang, fra `fra`.
     */
    stuert: { fra: kl('01.12'), ned: 5, borte: 10 },

    /** Nødrakettene (klokkeslett). Hver gjør folk litt mer redde (se alvor). */
    raketter: [kl('00.55'), kl('01.00'), kl('01.10'), kl('01.20'), kl('01.30'), kl('01.40')],

    // Planleggeren (rules.ts, sisteStart): sekunder mellom to firinger med samme hånd.
    plan: { pause: 0.3 },

    // Presset (0-1) i snapshot: vann, krengning og kø.
    press: { vann: 0.55, krengning: 0.2, kø: 0.25, køFull: 60 },

    // Rangtrinnene etter reddet: siste rad der reddet > grensen, gjelder. Første trinn er
    // seieren (flere enn i 1912), de neste er for «én natt til».
    ranger: [
        [705, 'Flere enn i 1912'],
        [800, 'Rolig hånd'],
        [870, 'Hver plass teller'],
    ] as [number, string][],
} as const;
