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
        /** Riksretten er over: fra her går tida sakte, og eleven har roret. */
        rorFra: 1884,
        /** Sekunder per år i rorstrekket (1884,0-1884,5 = ca. 15 s): siste etappe der eleven
         * styrer ned mot Løvebakken. */
        rorTempo: 30,
    },

    // Roret etter riksretten: pil ned / S / trykk lavt styrer ballongen ned, gratis.
    ror: {
        /** Fart ned når eleven styrer (px/s). */
        synk: 340,
        /** Brenneren svarer raskere når Stortinget styrer (s, mot `løft.varmeTau`). */
        varmeTau: 0.07,
        /** Hvor fort farten følger roret og brenneren i rorstrekket (px/s²): Stortinget styrer. */
        akselerasjon: 1300,
        /** Stemmene i dalene: verdt så mye ganger Ueland-gangeren. */
        stemme: 40,
        /** Dalene i rorstrekket: antall, dybde (px under kammen) og kammen. */
        daler: 5,
        kamY: 360,
        dalY: 490,
        /** Fra kanten av kammen til bunnen av dalen (px vei): bratt. */
        bratt: 90,
        /** Stemmen henger så høyt over dalbunnen. */
        stemmeOver: 40,
    },

    // Ny sjanse: krasj eller stemt ut fra 1833 setter deg tilbake til forrige valg.
    sjekk: {
        /** Så mange ganger per runde. */
        sjanser: 3,
        /** Du mister så stor del av det du har spart. */
        straff: 0.15,
        /** Høyde over bakken når du starter igjen. */
        over: 140,
    },

    // Farten fram (px/s) øker litt hvert tiår.
    fart: { fra: 140, til: 200, fraÅr: 1815, tilÅr: 1880 },

    // Ballongen. x er fast på skjermen; y er bunnen av kurven.
    ballong: {
        skjermX: 288,
        /** Fra bunnen av kurven til toppen av ballongen. */
        høyde: 94,
        /** Halv bredde på ballongen (mot fjellknauser i lufta). */
        halvBredde: 31,
        /** Halv bredde på kurven (mot bakken). */
        kurvHalv: 14,
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
        synkTil: 150,
        /** Hver flosshatt som klatrer om bord gjør ballongen tyngre (px/s ekstra synk). */
        perHatt: 0.6,
        /** De første sekundene synker ballongen sakte, så eleven rekker å se hva som skjer. */
        rolig: { sekunder: 4, fra: 0.25 },
    },

    /** «Øv fra 1870» låses opp når eleven har nådd 1884 én gang. */
    øvFra: 1870,

    // Pengene.
    penger: {
        /** Spesidaler per sekund du holder (før kongeveiens flosshatter gjør brenneren dyrere). */
        perSek: 10,
        /** Før Bondetinget i 1833 bestemte embetsmennene: brenneren koster mer (Spd/s). */
        førBonde: 14,
        /** Spart per sekund når du slipper før Ueland kommer om bord (1833). */
        førUeland: 6,
        /** Spart per sekund når du slipper over nær-båndet fra 1833. I båndet: perSek x gangeren. */
        utenfor: 2,
        /** Grensen ved valget: så mye kan du bruke per treårsperiode fra 1833. */
        grense: 26,
        /** Ola-boka (1832): bøndene får flertall, embetsmennene får mindre - brenneren blir
         * så mye billigere resten av runden. */
        olaboka: 0.2,
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

    // Ueland-gangeren (skrapebonus). Spart per sekund = perSek x ganger når du slipper i
    // nær-båndet, og bare `penger.utenfor` over det.
    ganger: {
        fra: 1833,
        /** Nær-båndet: under så mange px over bakken vokser gangeren. */
        nær: 50,
        /** Bakken som teller, fra så langt bak til så langt foran kurven (px vei). */
        vindu: [-90, 30] as [number, number],
        /** Sekunder sammenhengende i båndet per trinn opp. */
        trinn: 1,
        /** Over båndet faller gangeren ett trinn per så mange sekunder. */
        fall: 1.5,
        maks: 10,
        /** Trykk i båndet innen så mange sekunder etter et trinn-tap koster ikke et nytt trinn. */
        fjær: 1.5,
        /** Kongens gave: så mange sekunder med dobbel sparing etter kongeveien. */
        gave: 5,
    },

    // Formene i hver valgperiode fra 1833 (rekkefølgen står i levels.ts).
    form: {
        /** Høyden på tinden over dalen ved første valgperiode. */
        tind: 120,
        /** Høyden på kammen under knausen ved veiskillene. */
        kam: 60,
        /** Kammen blir aldri høyere enn dette (ellers blir kongeveien klemt mot taket). */
        kamMaks: 105,
        /** Kammen varierer litt fra runde til runde (ganges med kam). */
        kamSpenn: [0.8, 1.2] as [number, number],
        /** Skråningen opp til og ned fra kammen (px vei). */
        skrå: 170,
        /** Hver valgperiode blir tinden og kammen så mye høyere (andel av starthøyden). */
        økning: 0.045,
        /** Skrapedalen er åser som bølger: høyden på hver ås (px), og antall åser. */
        bølge: [64, 82] as [number, number],
        åser: 3,
    },

    // Funn som henger lavt i en dal: avstand fra kurven som teller som tatt.
    funn: { radius: 26, overBakken: 24 },

    // Veiskillene: en fjellknaus i lufta. Under = billig, trang åpning. Over = kongeveien:
    // dyrt og åpent, og en flosshatt ekstra.
    veiskille: {
        bredde: 260,
        /** Flat kam før og etter knausen. */
        flate: 90,
        /** Luft fra kammen til undersiden av knausen før 1882 (1,6 ballonghøyder). */
        gapLav: 150,
        /** Luft under knausen etter 1882 (fra dalbunnen). */
        gap: 175,
        /** Kongeveien over knausen: en flosshatt klatrer om bord, og hver slik hatt gjør
         * brenneren så mye dyrere resten av runden. Til gjengjeld: kongens gave, dobbel sparing i `ganger.gave` s. */
        kongeveiKostnad: 0.15,
        /** Tykkelsen på knausen. */
        tykkelse: 24,
        dalY: 474,
        /** Fra dette året er bommen borte (riksretten). */
        åpenFra: 1882,
    },

    // Presset (0-1) som selvspillet måler.
    press: { synk: [110, 170], fart: [140, 200], fjell: [470, 230] },

    // Rangtrinn etter sparte spesidaler (stigende).
    ranger: [
        [0, 'Vararepresentant'],
        [700, 'Bonderepresentant'],
        [1600, 'Sparebonde'],
        [2700, 'Ueland-elev'],
        [3900, 'Dalanes stolthet'],
        [5400, 'Ueland selv'],
    ] as [number, string][],
};

export type Tuning = typeof TUNING;
