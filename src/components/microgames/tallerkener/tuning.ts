// Alle tallene i Elleve år (kongens-tallerkener). Endre her, ikke i reglene.
// Ett år = `tid.aar` sekunder. År 0 = 1629.

export const TUNING = {
    /** Kalenderen. */
    tid: {
        aar: 10,
        start: 1629,
        /** Seier: når dette året nås med gull i kista. */
        seier: 1640,
        /** Skottene kommer (stormen, forbruket tredobles). */
        skottene: 1639,
        /** Stormkulissen varsler (bønneboka). */
        varsel: 1637,
    },

    /** Snurr per tallerken: 0 = står stille (faller), 1 = overspinn, over `flyr` = flyr av. */
    snurr: {
        /** Under dette begynner tallerkenen å vakle (synlig fare, et nytt valg). */
        vakle: 0.45,
        /** Under dette er den slakk og gir ikke gull. */
        slakk: 0.25,
        /** Fra dette er det overspinn: dobbelt gull. */
        overspinn: 1.0,
        /** Over dette flyr tallerkenen av stanga. */
        flyr: 1.3,
        /** Snurr en ny tallerken starter med. */
        start: 0.7,
        /** Snurr per enhet sveipefart (fart 1 = et raskt kast). */
        perFart: 0.62,
        /** Hvor fort snurret dør ut per sekund (skip-tallerken i 1629). */
        tap: 0.13,
        /** Tallerkenene blir tyngre: tapet øker med denne andelen per år. */
        tapPerAar: 0.06,
        /** Hvor lenge en kombo varer (s). */
        komboTid: 2,
        /** Rundemultiplikatoren øker så mye per ekstra tallerken i en kombo. */
        rundeMultPerKombo: 0.1,
    },

    /** Tallerkentypene: gull per sekund når den snurrer godt, og hvor tung den er. */
    typer: {
        skip: { gull: 1.0, vekt: 1.0 },
        vapen: { gull: 2.5, vekt: 1.9 },
    },

    /** Kista. */
    kiste: {
        start: 18,
        /** Forbruk (gull/s) per år fra 1629. Siste verdi gjelder videre før 1639. */
        forbruk: [0.3, 0.5, 1.5, 3, 5, 8, 11, 13, 15, 17],
        /** Forbruket ganges med dette i 1639 (skottene). */
        storm: 3,
        /** Etter 1640: forbruket øker med denne andelen per år (overtid). */
        overtidVekst: 0.35,
    },

    /** Sidene som bærer inn nye tallerkener. */
    sider: {
        /** Sekunder mellom hver side (fra brett 2). */
        hver: 7,
        /** Hvor lenge siden venter ved stanga før den går ut igjen. */
        venter: 4,
        /** Pris for en ny tallerken på en tom stang som har mistet sin (gull). */
        erstatt: 6,
        /** Første våpenskjold-tallerken kommer dette året. */
        vapenFra: 1633,
        /** Sjansen for at en side bærer et våpenskjold etter `vapenFra`. */
        vapenSjanse: 0.4,
    },

    /** Parlamentets tinntallerken. */
    parlament: {
        /** Første år den senker seg ned i rekkevidde. */
        fra: 1635,
        /** Sekunder i taket mellom hver gang den senker seg (1635-1638): nede 3 s + 7 s = hvert 10. s */
        hver: 7,
        /** Fra 1639 kommer den oftere. */
        hverStorm: 2,
        /** Hvor lenge den er nede (s). */
        nede: 3,
        /** Gull den øser (totalt, over `oser` sekunder) før 1637, fra 1637 og fra 1639. */
        gull: 50,
        gullSent: 70,
        gullStorm: 220,
        oser: 3,
        /** Krokene i taket: fulle = parlamentet har tatt alle stengene. */
        kroker: 6,
    },

    /** Brett 1: tallerken nummer to heises opp etter så mange sekunder. */
    brett1: { andre: 6 },

    /** Poeng: gull fra egne tallerkener x rundemultiplikator. Parlamentets gull gir ikke poeng. */
    poeng: { perGull: 10 },

    /** Pressmåleren (0-1) i snapshot. */
    press: { forbrukRef: 25, andelForbruk: 0.6 },
};

export type PlateKind = keyof typeof TUNING.typer;
