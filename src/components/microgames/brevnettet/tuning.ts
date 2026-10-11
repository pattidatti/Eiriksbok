// Alle tallene i Brevnettet. Reglene i game.ts leser herfra - endre balansen her,
// og kjør simuleringen på nytt (npx tsx scripts/sim-microgame.mts --ids brevnettet).

export const TUNING = {
    /** Veven i verdensenheter. Stuene plasseres innenfor denne rammen. */
    vev: { minX: -7.2, maxX: 7.2, minY: -3.3, maxY: 3.0 },
    /** Minste avstand mellom to prikker (stuer og Hauge) når en ny stue plasseres. */
    avstand: 2.0,
    /** Nye stuer dukker opp i den ytre delen av hver halvdel (0 = hvor som helst, 1 = helt ute). */
    kantAndel: 0.4,
    /** Flest stuer på veven samtidig (plassen og visningen tåler ikke flere). */
    maksStuer: 26,
    /** Knaggen rommer så mange nøster (garn du ikke bruker, går tapt). */
    nøsterTak: 10,
    /** Flest tråder samtidig. */
    maksTråder: 60,

    tråd: {
        /** Lengste tråd mellom to stuer. Hauges tråder har ingen grense. */
        maksLengde: 7.5,
    },

    hauge: {
        /** Sekunder Hauge sitter inne etter en arrestasjon før han slippes ut. */
        inne: 3,
        /** Han slippes ut minst så langt fra nærmeste tente stue (vokser per arrestasjon). */
        utAvstand: 3,
        utAvstandVekst: 0.4,
        /** Den nye stua ved siden av ham når han slippes ut. */
        nyStueAvstand: 2.2,
    },

    lensmann: {
        /** Første gang (1797) rir han ekstra sakte. */
        førsteVarsel: 5,
        /** Nøster per stue som fortsatt lyser etter et raid, og flest nøster per raid. */
        nøsterPerStue: 1,
        nøsterMaks: 5,
        /** Ekstra nøster per stue i en ring (minst to tente naboer) etter et raid. */
        nøsterPerRing: 1,
        /** Fengselsårene: sekunder mellom hvert klipp (først, sist) og varselet på tråden. */
        klippHver: [1.4, 1.0] as [number, number],
        klippVarsel: 2,
        /** Fra dette brettet (3 = 1799) merker han også tråden som bærer mest i hvert raid. */
        raidKlippFra: 3,
        /** Tilfeldig slingring på tiden mellom klippene (andel opp eller ned). */
        klippSpredning: 0.4,
    },

    fengsel: {
        /** Når i fengselsårene Hauge slippes ut til saltverket (1809), og hvor lenge. */
        saltverk: 19,
        saltverkSek: 5,
        /** Sitter Hauge alt inne når 1804 kommer: så lenge varer varselet før de store klippene. */
        storeKlipp: 5,
        /** Nøster vennene sender hvert fengselsår. */
        nøsterPerÅr: 0,
    },

    ring: {
        /** Når ringen er så full, teller det som et nytt valg (ofre stua?). */
        snartFull: 0.6,
        /** Kljåsteiner som kan falle før tapet. */
        steiner: 3,
    },

    /** Brevfart langs tråden (enheter per sekund). Brevene er bare pynt, de gir ikke poeng. */
    brevFart: 2.4,

    /** Sjanse for at en ny stue er en av de navngitte (Sara Oust, Fennefoss ...). */
    navnSjanse: 0.18,
} as const;

/** Rangene etter tente stuer i 1814 (stigende terskel). */
export const RANGER: [number, string][] = [
    [0, 'Husandakt'],
    [3, 'Vennegruppe'],
    [7, 'Lesere'],
    [12, 'Haugianere'],
    [20, 'Bondeopposisjon'],
];
