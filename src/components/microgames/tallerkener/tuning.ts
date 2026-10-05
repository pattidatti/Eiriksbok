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
        /** Tallerkenene blir tyngre: tapet øker med denne andelen per år (fra 1629). */
        tapPerAar: 0.12,
        /** Hvor lenge en kombo varer (s). */
        komboTid: 2,
    },

    /**
     * Tallerkentypene (hver stang er en egen kilde): gull per sekund når den snurrer godt, hvor
     * tung den er, og `tak` = mest gull stanga kan gi på ett år (så egne kilder ikke dekker krigen).
     */
    typer: {
        skip: { gull: 1.0, vekt: 1.0, tak: 15 },
        monopol: { gull: 1.6, vekt: 1.35, tak: 24 },
        vapen: { gull: 2.5, vekt: 1.9, tak: 32 },
    },

    /** Runden starter med disse tallerkenene på stengene 0, 1, 2 ... */
    start: ['skip', 'skip', 'monopol'] as const,

    /** Én bue: når bare naboer (avstand på scenen) og har nedkjøling før neste bue kan treffe. */
    bue: { nabo: 0.8, nedkjoling: 0.6 },

    /** Protester (Hampden 1637): fra `fra` hvert `hver` s får én tallerken et vakle-dytt. */
    protest: { fra: 1634, hver: 20, dytt: 0.4 },

    /** Kista. */
    kiste: {
        start: 25,
        /** Forbruk (gull/s) per år fra 1629. Siste verdi gjelder videre før 1639. */
        forbruk: [4, 4.5, 5.5, 6.5, 7.5, 8, 8.5, 9, 9.5, 10],
        /** Skottene trekker så mye gull fra kista per sekund fra 1639 (i tillegg til forbruket). */
        krig: 45,
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
        /** Sjansen for et monopol (ellers skipsskatt). */
        monopolSjanse: 0.3,
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
        /** En parlamentsøkt før krigen (1639) koster så mange stenger: den du velger og naboen. */
        forKrigen: 2,
        /** Gull den øser (totalt, over `oser` sekunder) før 1637, fra 1637 og fra 1639. */
        gull: 50,
        gullSent: 70,
        gullStorm: 300,
        oser: 3,
        /** Krokene i taket: fulle = parlamentet har tatt alle stengene. */
        kroker: 6,
    },

    /**
     * Poeng ved hvert årsskifte: gull i kista x stenger igjen.
     * Taper du før 1640 (tom kiste eller ingen stenger igjen), ganges poengene med `tap`.
     */
    poeng: { tap: 0.5 },

    /**
     * Pressmåleren (0-1) i snapshot: andelen slakke tallerkener og hvor tynn kista er
     * (sekunder med forbruk den holder, mot `reserveRef`).
     */
    press: { reserveRef: 25, andelKiste: 0.5 },
};

export type PlateKind = keyof typeof TUNING.typer;
