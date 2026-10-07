// Alle tallene for Pengeballongen. Endre her først - reglene i rules.ts, terrain.ts og
// game.ts har ingen balansetall selv. Flata er 960 x 540 logiske piksler, y vokser nedover.

export const TUNING = {
    // Tida: runden tar ca. 100 s. 1815-1833 går fort (ca. 15 s), deretter ca. 5 s per
    // valgperiode på tre år. Runden går fra 1815 til ballongen lander i 1884.
    år: {
        start: 1815,
        /** Sekunder per år før det første ekte valget. */
        førValg: 1.2,
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

    // Roret etter riksretten: nå styrer du helt. Hold = opp, pil ned / S / trykk lavt = ned,
    // ingen av dem = rett fram. Fjellene i rorstrekket har en port under som bare roret når.
    ror: {
        /** Fart ned når eleven styrer (px/s). */
        synk: 230,
        /** Fart opp når eleven holder (px/s). */
        stig: 230,
        /** Pil ned styrer mot så mange px over den høyeste bakken så langt foran (px). */
        over: 38,
        foran: 120,
        /** Brenneren svarer raskere når Stortinget styrer (s, mot `løft.varmeTau`). */
        varmeTau: 0.07,
        /** Hvor fort farten følger roret og brenneren i rorstrekket (px/s²): Stortinget styrer. */
        akselerasjon: 1300,
        /** Stemmene i dalene: verdt så mye ganger Ueland-gangeren. */
        stemme: 6,
        /** Dalene i rorstrekket: antall, dybde (px under kammen) og kammen. */
        daler: 3,
        kamY: 360,
        dalY: 490,
        /** Fra kanten av kammen til bunnen av dalen (px vei): bratt. */
        bratt: 200,
        /** Den flate dalbunnen der porten står (px vei). */
        bunn: 320,
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
        varmeTau: 0.22,
        /** Hvor fort farten nærmer seg målet når ballongen skal opp (px/s²). */
        akselerasjon: 600,
        /** ... og når den allerede faller og faller fortere. Lufta kjøles sakte, så et sent
         * trykk er ikke krasj: ballongen faller mykt. */
        akselerasjonNed: 150,
        /** Stigefart med full varme helt nede (px/s). */
        stigLav: 330,
        /** Stigefart med full varme helt oppe. Tynn luft: høyt oppe koster det mer å holde seg. */
        stigHøy: -120,
        /** Hvor brått løftet faller med høyden (1 = jevnt, høyere = mest høyt oppe). */
        tynnLuft: 1.6,
        /** Synkefart uten varme i 1815 og 1880 (før flosshattene). */
        synkFra: 85,
        synkTil: 115,
        /** Hver flosshatt som klatrer om bord gjør ballongen tyngre (px/s ekstra synk). */
        perHatt: 0.6,
        /** De første sekundene synker ballongen sakte, så eleven rekker å se hva som skjer. */
        rolig: { sekunder: 4, fra: 0.25 },
    },

    /** «Øv fra 1870» låses opp når eleven har nådd 1884 én gang. */
    øvFra: 1870,

    // Pengene.
    penger: {
        /** Spesidaler per sekund du holder. */
        perSek: 10,
        /** Før Bondetinget i 1833 bestemte embetsmennene: brenneren koster mer (Spd/s). */
        førBonde: 14,
        /** Spart per sekund når du slipper før Ueland kommer om bord (1833). */
        førUeland: 6,
        /** Spart per sekund når du slipper over nær-båndet fra 1833. I båndet: perSek x gangeren. */
        utenfor: 2,
        /** Grensen ved valget: så mye kan du bruke per treårsperiode i 1833 ... */
        grense: 26,
        /** ... og ved det siste valget (1881). Bøndene teller strengere med årene. */
        grenseSlutt: 22,
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
        /** Her kommer Ueland om bord (ca. 40 s), alene - første port kommer først i 1854 (ca. 57 s). */
        fra: 1844,
        /** Nær-båndet: under så mange px over bakken vokser gangeren. */
        nær: 70,
        /** Bakken som teller, fra så langt bak til så langt foran kurven (px vei). */
        vindu: [-90, 30] as [number, number],
        /** Sekunder sammenhengende i båndet per trinn opp. */
        trinn: 0.5,
        /** Over båndet faller gangeren ett trinn per så mange sekunder (fort: høyt koster). */
        fall: 1.0,
        maks: 10,
    },

    // Formene i hver valgperiode fra 1833 (rekkefølgen står i levels.ts).
    form: {
        /** Høyden på tinden over dalen ved første valgperiode. */
        tind: 120,
        /** Hver valgperiode blir tinden og kammen så mye høyere (andel av starthøyden). */
        økning: 0.045,
        /** Skrapedalen er åser som bølger: høyden på hver ås (px), og antall åser. */
        bølge: [64, 82] as [number, number],
        åser: 3,
    },

    // Funn som henger lavt i en dal: avstand fra kurven som teller som tatt.
    funn: { radius: 26, overBakken: 24 },

    // Jernbanene fra 1854 (Hovedbanen): en lang stigning opp til en stasjon. Ballongen må
    // fyre tidlig og jevnt langs skinnene - å vente til bakken er der, koster dobbelt i tynn luft.
    banen: {
        /** Fra dette året erstatter banen den tredje formen i hver runde av former. */
        fra: 1854,
        /** Høyden på stasjonen over dalen (ganges med økningen per periode). */
        høyde: 150,
        /** Stigningen starter og slutter (andel av perioden), stasjonen er flat til `stasjon`. */
        opp: [0.06, 0.6] as [number, number],
        stasjon: 0.76,
        /** Toget kjører oppover skinnene med denne farten (px/s, saktere enn ballongen). */
        tog: 70,
    },

    // Bevilgningsportene midt i runden (Embetskontor, Telegrafen, Drammenbanen): en port i dalen
    // rett før fjellet. Gli under banneret = bevilg: prisen trekkes fra sekken og en bit av
    // valgbudsjettet, men staten bærer deg over fjellet. Fly over porten = nei til kongen: Ueland gir
    // bonus, men du må fyre deg over fjellet selv, og det tar av budsjettet.
    bevilg: {
        /** Prisen på den første porten (Spd. fra sekken), og så mye dyrere hver neste. */
        pris: 25,
        økning: 5,
        /** Banneret henger så høyt over bakken: kurven under denne høyden = bevilget. */
        åpning: 160,
        /** Porten står så langt foran der stigningen begynner (px vei). */
        foran: 70,
        /** Flat dal fra så langt før stigningen (px vei), så banneret henger like høyt hele veien. */
        dal: 320,
        /** Fjellet med port flyttes så langt fram i perioden (andel), så det er tid til å synke. */
        skyv: 0.2,
        /** Høyden på fjellet bak en port (andel av et vanlig fjell). 1 = like høyt: et nei går an
         * tidlig i runden, men ikke ved de store sene prosjektene. Lavere = nei blir alltid riktig. */
        fjell: 1.0,
        /** Bevilget: kongens embetsmenn tar så mye av valgbudsjettet (Spd.) - bøndene ser det. */
        budsjett: 6,
        /** Sa nei: Ueland gir så mye x gangeren til Spart, og gangeren går så mange trinn opp. */
        nei: 4,
        neiTrinn: 2,
    },

    // Dalen etter riksretten 1882-1884, med tre riksrett-stemmer (årene står i levels.ts).
    veiskille: {
        dalY: 474,
        /** Riksrett-stemmene henger så høyt over dalbunnen (lavt i dalen, men ikke helt nede). */
        stemmeOver: 95,
        /** Hver riksrett-stemme er verdt så mye ganger Ueland-gangeren. */
        verdi: 5,
        /** Riksretten: fra dette året er kongens bommer borte, og Sverdrup kommer om bord. */
        riksrett: 1882,
    },

    // Rorstrekket: fjell med en port under. Før roret kunne du bare betale deg over;
    // med roret dykker du under fjellet og henter stemmene.
    port: {
        /** Luft under fjellet over dalbunnen (ballongen er 94 px høy). */
        gap: 180,
        /** Toppen av fjellet (skjerm-y): over himmelen, så det går ikke an å fly over. */
        topp: -40,
        /** Bredden på fjellet over porten (px vei). */
        bredde: 130,
    },

    // Presset (0-1) som selvspillet måler.
    press: { synk: [85, 125], fart: [140, 200], fjell: [470, 230] },

    // Rangtrinn etter sparte spesidaler (stigende).
    ranger: [
        [0, 'Vararepresentant'],
        [100, 'Bonderepresentant'],
        [250, 'Sparebonde'],
        [400, 'Ueland-elev'],
        [600, 'Dalanes stolthet'],
        [850, 'Ueland selv'],
    ] as [number, string][],
};

export type Tuning = typeof TUNING;
