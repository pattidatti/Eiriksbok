// Alle tallene i Taburetten. Lengder er meter langs Karl Johan (x) og over brosteinen (y).
// Spillreglene leser bare herfra - ingen balansetall inne i reglene.

export const TUNING = {
    /** Stolen i lufta og på hendene. */
    fysikk: {
        tyngde: 9.8,
        /** Hold inne = stolen blir så mye tyngre (ruller fortere ned, faller fortere i lufta). */
        tungFaktor: 3.2,
        /** Hvor hardt hendene kaster stolen når den passerer en bølgetopp uten å lene. */
        kast: 1.9,
        minFart: 4.2,
        maksFart: 15,
        /** Hvor fort farten trekkes mot marsjfarten til brettet (per sekund). */
        drag: 0.9,
        /** Helning på landingsstedet som teller som ned- eller oppside. */
        landHelning: 0.12,
        /** «Fin landing!»: ekstra fart. */
        finBoost: 1.3,
        /** Klumsete dunk på oppsiden: farten ganges med dette. */
        dunkFaktor: 0.72,
        /** Høyden på stolen med statsråd (kollisjon mot tråder). */
        stolHøyde: 1.9,
        /** Delsteg per tidssteg, så stolen ikke hopper gjennom en stolpe. */
        delsteg: 3,
    },

    /** Mengden av hender. Løftet regnes fra stripa (hele Stortinget), ikke fra hendene under deg. */
    hender: {
        bølgelengde: 7.5,
        /** Kongens vern: livgarden holder stolen på en lav linje. */
        vernHøyde: 1.6,
        vernAmp: 0.6,
        /** Flertall: grunnhøyde og bølgehøyde = start + k * (andel - 0,5). */
        flertallBase: 2.4,
        flertallBaseK: 7,
        flertallAmp: 0.45,
        flertallAmpK: 3.2,
        /** Uten flertall flater bølgene ut til dette. */
        synkAmp: 0.25,
        /** Hvor fort hendene reiser seg når flertallet får stolen (m/s). */
        stigFart: 3,
        /** Hvor fort bølgehøyden endrer seg (m/s). */
        ampFart: 1.2,
        /** Under denne høyden står stolen i gata (tap). */
        gate: 0.04,
    },

    /** Kongens øyer før dommen: livgarden bærer bare på øyene, den røde mengden imellom drar ned. */
    øy: {
        /** Den første øya er lang, så starten er rolig. */
        førsteSlutt: 26,
        lengde: 9,
        /** Gapet mellom øyene = start + k * (røde seter over 58): større rødt flertall, færre øyer. */
        gapStart: 3,
        gapK: 0.42,
        /** Hvor fort mengden drar stolen ned mellom øyene (m/s). */
        synk: 0.3,
        /** Bølgehøyden mellom øyene (de røde hendene vil ikke bære). */
        amp: 0.6,
        /** Så langt foran stolen øyene legges ut (m). */
        foran: 40,
    },

    /** Anklagen: en fin landing på de røde hendene mellom øyene etter valget 1882. */
    anklag: {
        /** Hver røde sone stolen krysser uten å anklage, gjør gapene så mye lengre (m). */
        bomGap: 4,
        bomMaks: 6,
    },

    /** Jevn synking uten flertall (m/s). Fast fart - ingen flaks. */
    synk: {
        /** Kampanjen: satt slik at Schweigaard når gata et godt stykke inn i brett 3. */
        fart: 0.065,
        /** Feil bytte (en uten flertall, som Schweigaard): stolen dumper så mye med en gang (m). */
        feilFall: 0.8,
        /** Frispillet: synkefarten øker per banner opp til maks. */
        friStart: 0.22,
        friPerBanner: 0.025,
        friMaks: 0.5,
    },

    /** Bytte av passasjer. */
    bytte: {
        /** Perfekt bytte: så nær banneret (sekunder, ±). Krymper i frispillet. */
        perfektVindu: 0.6,
        perfektMin: 0.35,
        perfektKrymp: 0.03,
        /** Så lenge etter banneret kandidaten løper ved siden av og kan tas (sent bytte). */
        sentVindu: 2.5,
        /** Så lenge Sverdrup må holdes oppe etter banneret 26. juni før kongen skriver under. */
        seierSek: 8,
        /** Perfekt bytte kaster stolen opp. */
        perfektKast: 6,
    },

    poeng: {
        perMeter: 1,
        finLanding: 15,
        avisark: 60,
        perfekt: 500,
        /** Anklagen (fin landing på de røde hendene), ganget med multiplikatoren. */
        anklag: 300,
        seier: 5000,
        /** Multiplikatoren bygges av landinger: +1 per fin landing, dunk = x1, perfekt bytte +2. */
        multFin: 1,
        multPerfekt: 2,
        multMaks: 8,
    },

    /** Hindringene i gata. Toppen er høyde over brosteinen; tråder har bunn. */
    hindring: {
        bredde: 1.1,
        /** Hindringen står så langt etter en bølgetopp (andel av bølgelengden). */
        fase: 0.35,
        /** Avisarket henger så høyt som et vanlig kast når (andel av toppen). */
        arkAndel: 0.9,
        kjerre: 0.35,
        lav: 1.45,
        middels: 2.6,
        trådBunn: 6.4,
        /** Hvor langt foran stolen ting dukker opp (m). */
        foran: 34,
        /** Tilfeldig spredning i tiden mellom hindringene (andel). */
        spredning: 0.25,
        /** Høye hindringer før dommen står bare så godt inne på en øy (m). */
        øyMargin: 3,
        /** Hvor nær avisarket stolen må komme. */
        arkRadius: 0.95,
        /** Klaring under dette (m) teller som «Like over!». */
        nesten: 0.35,
    },

    /** Banner: hvor fort det ruller inn (m/s, relativt til stolen) og hvor lenge før det vises. */
    banner: {
        varsel: 6,
    },

    /** Frispillet etter seieren (punkt 4 i briefen). */
    fri: {
        marsjStart: 7,
        fartPerBanner: 0.04,
        intervallStart: 12,
        intervallMin: 7,
        intervallKrymp: 0.6,
        /** Flertallsmarginen (seter av 114 over 57) krymper per banner. */
        marginStart: 23,
        marginMin: 1,
        marginKrymp: 3,
        hindringStart: 3.2,
        hindringMin: 2,
        hindringKrymp: 0.12,
    },

    /** Press (0-1) i snapshot: vekt på fart og på hvor nær gata stolen er. */
    press: {
        fartMin: 5,
        fartMaks: 10,
        vektFart: 0.45,
        vektFare: 0.55,
        /** Fare fra en hindring like foran stolen, etter type. */
        hindring: { kjerre: 0.15, lav: 0.25, middels: 0.8, tråd: 0.8 },
    },
} as const;
