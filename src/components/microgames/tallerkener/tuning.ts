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
        /** Etter 1640 går årene fortere: så mange sekunder per år i borgerkrigen. */
        aarOvertid: 3,
        /** Siste år i runden: Karl ble dømt i 1649. */
        slutt: 1649,
    },

    /**
     * Hendelsene i midten (én ny ting hvert år). `saape`: et tvunget monopol (såpemonopolet);
     * `innland`: skipsskatten kreves i hele landet (en tvungen skip-tallerken bakerst, og alle
     * skip-tallerkener blir tyngre); `hampden`: alle skip-tallerkener får protest på en gang;
     * `skotter`: skottene marsjerer inn og trekker `marsj` gull/s før krigen.
     */
    hendelser: {
        saape: 1632,
        innland: 1635,
        hampden: 1637,
        skotter: 1638,
        marsj: 0.8,
        innlandTyngre: 0.1,
        /** Innlandets nye skip-tallerkener langt bak mister snurret så mye fortere. */
        innlandFort: 1.4,
        /** Så mange sveip den røde Hampden-tallerkenen trenger. */
        hampdenSveip: 2,
    },

    /**
     * Borgerkrigen etter 1640 er en kort epilog du ikke kan tape: hæren tar stengene dine i
     * stasjonene (1642 krig, 1645 New Model Army, 1648 Prides utrenskning, 1649 rettssaken).
     */
    borgerkrig: { stasjoner: [1642, 1645, 1648, 1649] },

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
        /** Snurr en ny tvungen tittel-tallerken ikke mister de første sekundene (den er lett). */
        lett: 2,
        /** Hvor lenge en kombo varer (s). */
        komboTid: 2,
    },

    /**
     * Tallerkentypene (hver stang er en egen kilde): gull per sekund når den snurrer godt, hvor
     * tung den er, og `tak` = mest gull stanga kan gi på ett år (så egne kilder ikke dekker krigen).
     */
    typer: {
        // `tyngre` = tapet øker med denne andelen per år fra 1629 (skipsskatten blir mest forhatt).
        skip: { gull: 1.55, vekt: 1.0, tak: 22, tyngre: 0.09 },
        monopol: { gull: 2.4, vekt: 1.35, tak: 34, tyngre: 0.08 },
        vapen: { gull: 3.0, vekt: 1.9, tak: 38, tyngre: 0.08 },
    },

    /** Runden starter med disse tallerkenene på stengene 0, 1, 2 ... */
    start: ['skip', 'skip', 'monopol'] as const,

    /** Én bue: når bare naboer (avstand på scenen) og har nedkjøling før neste bue kan treffe. */
    bue: { nabo: 0.8, nedkjoling: 0.6 },

    /**
     * Protester (Hampden 1637): fra `fra` hvert `hver` s mister tallerkenen som tjener mest,
     * halve snurret (`andel`) og slingrer rødt uten å gi gull i `tid` s.
     */
    protest: { fra: 1634, hver: 8, andel: 0.5, tid: 1.5 },

    /** Tvungne titler: disse årene settes en ny våpenskjold-tallerken inn på en ledig stang. */
    titler: [1633, 1636, 1639],

    /** Kista. */
    kiste: {
        start: 25,
        /** Forbruk (gull/s) per år fra 1629. Siste verdi gjelder videre før 1639. */
        forbruk: [4, 4.5, 5.5, 6.5, 7.5, 8, 8.5, 8.5, 8, 7.5],
        /** Skottene trekker så mye gull fra kista per sekund fra 1639 (i tillegg til forbruket). */
        krig: 22,
        /** Hoffet: over `over` gull i kista forsvinner `andel` av overskuddet per sekund. */
        hoff: { over: 45, andel: 0.2 },
        /** Etter 1640: forbruket øker med denne andelen per år (overtid). */
        overtidVekst: 0.12,
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
        /** Første år den senker seg ned i rekkevidde: låst til skottene kommer, slik Karl måtte. */
        fra: 1639,
        /** Sekunder i taket mellom hver gang den senker seg (1635-1638): nede 3 s + 7 s = hvert 10. s */
        hver: 7,
        /** Fra 1639 kommer den oftere. */
        hverStorm: 0.3,
        /** Hvor lenge den er nede (s). */
        nede: 3,
        /** Parlamentet tilbyr så mange stenger (de rikeste); eleven velger én av dem. */
        tilbud: 2,
        /** Gull den øser (totalt, over `oser` sekunder) før 1637, fra 1637 og fra 1639. */
        gull: 50,
        gullSent: 70,
        gullStorm: 400,
        oser: 3,
        /** Krokene i taket: fulle = parlamentet har tatt alle stengene. */
        kroker: 3,
    },

    /**
     * Poeng ved hvert årsskifte: gull tjent det året (egne tallerkener) x stenger igjen.
     * Taper du før 1640 (tom kiste eller ingen stenger igjen), ganges poengene med `tap`.
     */
    poeng: { tap: 0.5 },

    /**
     * Pressmåleren (0-1) i snapshot: hvor tynn kista er (sekunder med forbruk den holder, mot
     * `reserveRef`), andelen slakke tallerkener og andelen stenger parlamentet har tatt.
     */
    press: { reserveRef: 25, andelKiste: 0.4, andelSlakk: 0.35, andelMakt: 0.25 },
};

export type PlateKind = keyof typeof TUNING.typer;
