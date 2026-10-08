// Alle tallene i Rederens kart. Ingen tall for spillbalanse inne i reglene.
// Logisk flate: 960 x 540.

export const TUNING = {
    flate: { w: 960, h: 540 },

    /** Tiden: sekunder per år i hver periode. Seier når året 1969 begynner. */
    tid: {
        start: 1864,
        seier: 1969,
        perioder: [
            { fra: 1864, sek: 1.5 },
            { fra: 1904, sek: 2 },
            { fra: 1925, sek: 2.5 },
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

    /** Havet er tomt når det er færre hval enn dette igjen i havet du fanger i. */
    tomtHav: 6,

    /** Båtene. */
    båt: {
        fart: 180,
        kokeriFart: 70,
        /** Slipper du en båt nærmere havna enn dette, legger den seg på plassen sin i havna. */
        havnSnap: 50,
        /** Plassene i havna: rader under havna (dx mellom båtene, dy ned), kokeriet til venstre. */
        havnPlass: { dx: 46, dy: 26, rad: 4, kokeriDx: 80 },
        /** En båt som følger en flokk, ligger høyst så langt fra midten av den (px). */
        følgAvstand: 14,
        /** Et slipp teller som et nytt valg når målet flyttes mer enn dette. */
        nyttStedPx: 24,
    },

    /** Økonomien: tønna og vedlikeholdet (olje per båt per år, trekkes ved årsskiftet). */
    økonomi: {
        startTønne: 12,
        vedlikehold: [
            { fra: 1864, båt: 1 },
            { fra: 1880, båt: 1 },
            { fra: 1904, båt: 1.5 },
            { fra: 1925, båt: 2.5 },
        ],
        kokeri: 5,
        /** En båt i havna koster bare denne delen av full pris. */
        havnAndel: 0.35,
        /** Før dette året kan tønna ikke gå under null (brett 1: lær deg ringen først). */
        gulvTil: 1880,
    },

    /** Flåten: antall båter (uten kokeriet) fra hvert år. Nye båter legger seg i havna;
     *  eleven velger selv hvor mange som går ut. */
    flåte: [
        { fra: 1864, båter: 1 },
        { fra: 1880, båter: 2 },
        { fra: 1904, båter: 3 },
        { fra: 1910, båter: 4 },
        { fra: 1925, båter: 5 },
        { fra: 1928, båter: 6 },
        { fra: 1931, båter: 7 },
    ],
    kokeriFra: 1925,

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
        [1969, 'Den som fortsatt fangstet i 1969'],
    ] as [number, string][],
};
