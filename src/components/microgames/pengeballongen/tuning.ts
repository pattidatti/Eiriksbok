// Alle tallene for Pengeballongen. Endre her først - reglene i rules.ts, terrain.ts og
// game.ts har ingen balansetall selv. Flata er 960 x 540 logiske piksler, y vokser nedover.

export const TUNING = {
    // Tida: runden tar ca. 100 s. 1815-1833 går fort (ca. 15 s), deretter ca. 5 s per
    // valgperiode på tre år. Runden går fra 1815 til ballongen lander i 1884.
    år: {
        start: 1815,
        /** Sekunder per år før det første ekte valget. */
        førValg: 0.83,
        /** Her bytter tida fart (= penger.førsteEkteValg). */
        skifte: 1833,
        /** Sekunder per år fra 1833. */
        etterValg: 1.65,
        /** Ballongen lander på Løvebakken her (seier). */
        slutt: 1884.5,
    },

    // Farten fram (px/s) øker litt hvert tiår.
    fart: { fra: 140, til: 200, fraÅr: 1815, tilÅr: 1880 },

    // Ballongen. x er fast på skjermen; y er bunnen av kurven.
    ballong: {
        skjermX: 288,
        /** Fra bunnen av kurven til toppen av ballongen. */
        høyde: 78,
        /** Halv bredde på ballongen (mot fjellknauser i lufta). */
        halvBredde: 26,
        /** Halv bredde på kurven (mot bakken). */
        kurvHalv: 12,
        startY: 300,
        /** Øverste kant ballongen kan nå (toppen av ballongen). */
        tak: 6,
    },

    // Løftet. Hold = brenneren varmes; varmen kommer og går med en liten forsinkelse.
    løft: {
        /** Sekunder før varmen i ballongen følger knappen (treghet). */
        varmeTau: 0.18,
        /** Hvor fort farten nærmer seg målet når ballongen skal opp (px/s²). */
        akselerasjon: 650,
        /** ... og når den allerede faller og faller fortere. Lufta kjøles sakte (lett å fjære). */
        akselerasjonNed: 350,
        /** Stigefart med full varme helt nede (px/s). */
        stigLav: 330,
        /** Stigefart med full varme helt oppe. Tynn luft: høyt oppe koster det mer å holde seg. */
        stigHøy: -120,
        /** Hvor brått løftet faller med høyden (1 = jevnt, høyere = mest høyt oppe). */
        tynnLuft: 1.6,
        /** Synkefart uten varme i 1815 og 1880 (før flosshattene). */
        synkFra: 110,
        synkTil: 122,
        /** Hver flosshatt som klatrer om bord gjør ballongen tyngre (px/s ekstra synk). */
        perHatt: 0.6,
        /** De første sekundene synker ballongen sakte, så eleven rekker å se hva som skjer. */
        rolig: { sekunder: 4, fra: 0.25 },
    },

    // Pengene.
    penger: {
        /** Spesidaler per sekund du holder. */
        perSek: 10,
        /** Grensen ved valget: så mye kan du bruke per treårsperiode fra 1833. */
        grense: 29,
        /** Valgårene. Før 1833 vinker bøndene deg forbi. */
        førsteValg: 1827,
        førsteEkteValg: 1833,
        sisteValg: 1881,
        hvert: 3,
        /** Pengestabelen dukker opp i margen her (brett 2). */
        stabelFra: 1824,
        /** Første flosshatt klatrer om bord ved dette valget. */
        hattFra: 1836,
    },

    // Ueland-gangeren (skrapebonus). Spart per sekund = perSek x ganger når du ikke holder.
    ganger: {
        fra: 1833,
        /** Nær-båndet: under så mange px over bakken vokser gangeren. Over = straks ×1. */
        nær: 45,
        /** Sekunder i båndet per trinn. */
        trinn: 1.2,
        maks: 5,
    },

    // Formene i hver valgperiode fra 1833 (rekkefølgen står i levels.ts).
    form: {
        /** Høyden på tinden over dalen ved første valgperiode. */
        tind: 120,
        /** Høyden på kammen under knausen ved veiskillene. */
        kam: 40,
        /** Kammen blir aldri høyere enn dette (ellers blir kongeveien klemt mot taket). */
        kamMaks: 95,
        /** Kammen varierer litt fra runde til runde (ganges med kam). */
        kamSpenn: [0.8, 1.2] as [number, number],
        /** Skråningen opp til og ned fra kammen (px vei). */
        skrå: 170,
        /** Hver valgperiode blir tinden og kammen så mye høyere (andel av starthøyden). */
        økning: 0.06,
        /** Hvor mye skrapedalen bølger (px opp og ned). */
        bølge: 5,
    },

    // Funn som henger lavt i en dal: avstand fra kurven som teller som tatt.
    funn: { radius: 26, overBakken: 24 },

    // Veiskillene: en fjellknaus i lufta. Under = billig, trang åpning. Over = kongeveien:
    // dyrt og åpent, og en flosshatt ekstra.
    veiskille: {
        bredde: 260,
        /** Flat kam før og etter knausen. */
        flate: 150,
        /** Luft fra kammen til undersiden av knausen før 1882 (ca. 1,5 ballonghøyder). */
        gapLav: 135,
        /** Luft under knausen etter 1882 (fra dalbunnen). */
        gap: 150,
        /** Flosshatter som klatrer om bord når du tar kongeveien over knausen. */
        kongeveiHatt: 1,
        /** Tykkelsen på knausen. */
        tykkelse: 40,
        dalY: 474,
        /** Fra dette året er bommen borte (riksretten). */
        åpenFra: 1882,
    },

    // Presset (0-1) som selvspillet måler.
    press: { synk: [110, 170], fart: [140, 200], fjell: [470, 230] },

    // Rangtrinn etter sparte spesidaler (stigende).
    ranger: [
        [0, 'Vararepresentant'],
        [400, 'Bonderepresentant'],
        [900, 'Sparebonde'],
        [1500, 'Ueland-elev'],
        [2200, 'Dalanes stolthet'],
        [3000, 'Ueland selv'],
    ] as [number, string][],
};

export type Tuning = typeof TUNING;
