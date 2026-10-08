// Alle tallene i Rederens kart. Ingen tall for spillbalanse inne i reglene.
// Logisk flate: 960 x 540.

export const TUNING = {
    flate: { w: 960, h: 540 },

    /**
     * Tiden: sekunder per år i hver periode. Seier når året 1969 begynner. Årene ble 30 %
     * kortere etter vurdering 2 (runden ca. 2,5 min); alt som koster olje per år, ble skalert likt.
     */
    tid: {
        start: 1864,
        seier: 1969,
        perioder: [
            { fra: 1864, sek: 1.1 },
            { fra: 1904, sek: 1.4 },
            { fra: 1925, sek: 1.75 },
        ],
    },

    /** Fangsten: en båt som ligger stille innenfor radius av en flokk, tar én hval per intervall. */
    fangst: {
        radius: 40,
        intervall: 0.9,
        /** Olje per fat som kommer hjem. */
        fatVerdi: 2,
        /** Fart på fatene som ruller hjem (px/s). */
        fatFart: 150,
    },

    /**
     * Fødslene: hver levende hval gir en unge med denne sjansen per sekund (aldri over maks).
     * Briefen sa 0,12 per år, men årene går i ulik fart. Per sekund holder regelen «én båt
     * på én flokk er litt for mye» i hele runden: 0,035 x 28 = 0,98 < 1 / 0,9.
     */
    fødsel: {
        perHvalPerSek: 0.035,
    },

    /**
     * Artene: olje per hval (ganger `fangst.fatVerdi`), fødsler (ganger `fødsel.perHvalPerSek`)
     * og hvor lang den tegnede hvalen er når flokken er full (px). Blåhvalen gir mest olje og
     * føder tregest, så den forsvinner først. Seihvalen er liten, men tåler mer.
     */
    arter: {
        blå: { navn: 'blåhval', olje: 1.4, fødsel: 0.3, lengde: 100 },
        finn: { navn: 'finnhval', olje: 1, fødsel: 1, lengde: 76 },
        sei: { navn: 'seihval', olje: 0.75, fødsel: 1.35, lengde: 58 },
    },

    /**
     * IWC-kvoten fra 1946: høyst så mange hval i året. Når årets kvote er tatt, stanser
     * båtene til nyttår. Kvoten var satt for høyt: den stoppet ikke at havet krympet.
     */
    kvote: { fra: 1946, perÅr: 12 },

    /** Havet er tomt når det er færre hval enn dette igjen i havet du fanger i. */
    tomtHav: 6,

    /** Båtene. */
    båt: {
        fart: 180,
        kokeriFart: 70,
        /** En båt som følger en flokk, ligger høyst så langt fra midten av den (px). */
        følgAvstand: 26,
        /** Et slipp teller som et nytt valg når målet flyttes mer enn dette. */
        nyttStedPx: 24,
    },

    /** Økonomien: tønna og vedlikeholdet (olje per båt per år, trekkes ved årsskiftet). */
    økonomi: {
        startTønne: 12,
        vedlikehold: [
            { fra: 1864, båt: 0.73 },
            { fra: 1880, båt: 0.73 },
            { fra: 1904, båt: 1.05 },
            { fra: 1925, båt: 1.4 },
        ],
        kokeri: 2.8,
        /** En båt i havna koster bare denne delen av full pris. */
        havnAndel: 0.35,
        /** Før dette året kan tønna ikke gå under null (brett 1: lær deg ringen først). */
        gulvTil: 1880,
        /** Stasjonen og mannskapet på land: fast olje per år, enten du har båter ute eller ikke. */
        fast: [
            { fra: 1864, kost: 0 },
            { fra: 1880, kost: 0.37 },
            { fra: 1904, kost: 2.8 },
            { fra: 1925, kost: 3.5 },
            { fra: 1928, kost: 5 },
        ],
    },

    /**
     * Oljemarkedet (fra 1929): hvert fat som kommer inn, havner på lageret i verden. Verden
     * kjøper `grense` fat per år (lageret tømmes jevnt). Er lageret over grensa, faller prisen
     * på nye fat - og ved nyttår mister oljen i tønna like mye i verdi. Sesongen 1930-31 ga
     * mer olje enn verden ville kjøpe.
     */
    marked: {
        fra: 1929,
        /** Hvor fullt lageret kan bli (fat) før prisen faller. */
        grense: 15,
        /** Fat verden kjøper per år (lageret tømmes jevnt; 6 fat i sekundet som før årene ble kortere). */
        kjøpPerÅr: 12,
        /**
         * Krisa fra 1931: etter rekordsesongen 1930-31 og krakket kjøpte verden mindre olje.
         * Lageret tømmes saktere, så den som fanger for mye, får prisfallet.
         */
        krise: { fra: 1931, kjøpPerÅr: 6.5 },
        /** Prisen faller så mye per fat lageret er over grensa. */
        fall: 0.06,
        bunn: 0.3,
    },

    /** Fredning: flokkene låses dette året. Båtene der seiler hjem, og ingen kan fange der. */
    fredning: {
        /** Fangst forbudt i Finnmark: flokkene på det første arket låses, båtene seiler hjem, og et øyeblikk etter kommer det nye arket. */
        finnmark: 1904,
        /** Sekunder fra forbudet til det nye arket legges over. */
        finnmarkVent: 1.4,
        /** Blåhvalen fredet: flokkene merket `blåhval` i Sørishavet låses. */
        blåhval: 1966,
    },

    /** Flåten: du starter med så mange båter (én ligger alt ute ved den nærmeste flokken). */
    startBåter: 2,
    /** Båter til salgs: legger seg i havna dette året. Eleven kjøper ved å dra dem ut. */
    tilbud: [
        { fra: 1880, pris: 6, kokeri: false },
        { fra: 1904, pris: 8, kokeri: false },
        { fra: 1910, pris: 8, kokeri: false },
        { fra: 1925, pris: 11, kokeri: true },
        { fra: 1925, pris: 8, kokeri: false },
        { fra: 1928, pris: 8, kokeri: false },
    ],
    /** Høyst så mange båter til salgs i havna samtidig (resten venter). */
    maksTilbud: 2,

    /** Vandring: flokkene følger en sløyfe med litt støy. */
    vandring: {
        støyPx: 6,
        støyFart: 0.7,
    },

    /** Poeng: år drevet, og grønne år (havet krympet ikke) gir mer. */
    poeng: {
        perÅr: 1,
        grønnBonus: [1, 2],
    },

    /** Press: båter mot maks, vandrefart mot maks. */
    press: { maksBåter: 7, maksFart: 14 },

    /** Ranger etter år. */
    ranger: [
        [1864, 'Skipper i Varanger'],
        [1904, 'Stasjonssjef i Grytviken'],
        [1925, 'Kokerisjef'],
        [1946, 'Reder i Sandefjord'],
        [1969, 'Holdt havet i live'],
    ] as [number, string][],
};
