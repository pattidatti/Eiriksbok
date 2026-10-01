// Alle tallene i Tinghuset. Spillreglene (game.ts, rules.ts) leser herfra og har ingen
// balansetall selv. Endre her, kjør `npx tsx scripts/sim-microgame.mts --ids tinghuset`.

export const TUNING = {
    // Arket (verdenskoordinater, 16:9).
    world: { w: 960, h: 540 },

    // Kalenderen: måned 0 = mai 1945, seier når måned SLUTT_MND er nådd (september 1948).
    kalender: {
        sluttMnd: 40,
        /** Straffenivået synker lineært fra 100 % til (1 - fall) over så mange måneder. */
        straffFall: 0.5,
        straffMnd: 39,
        /** Et par er jevnt når begge avgjøres samme vei og innen så mange måneder. */
        jevnMnd: 2,
    },

    // Skrankene: hvor lenge en sak tar (sekunder spilltid).
    skranke: {
        forelegg: 1,
        rettssak: 5,
        tykkRettssak: 10,
        /** Flere dommere: rettssaler så mye raskere (0,25 = 25 %). */
        dommereFart: 0.25,
        /** Tiden mappa bruker på å gli langs streken. */
        reise: 0.35,
        /** Flest rettssaler og forelegg-skranker kortene kan gi. */
        maksSaler: 3,
        maksForelegg: 2,
        maksDommere: 2,
        /** Fast rute sender én lett mappe så ofte. */
        ruteHvert: 0.5,
    },

    // Sinnet i gatene (0-1). Fullt = tap.
    sinne: {
        /** Per ventende mappe (i leir eller kø) per sekund. */
        ventPerMappe: 0.004,
        /** Hopp når en alvorlig sak får forelegg. */
        forMildt: 0.12,
        /** Alvorlig sak avgjort i rettssalen trekker ned. */
        rettLetter: 0.03,
        /** Fast tak på mapper på arket - over det er sinnet sprukket uansett. */
        maksMapper: 160,
    },

    // Kortvalget hver tredje måned.
    kort: {
        forsteMnd: 7,
        hverMnd: 3,
        /** Spillet går i denne farten mens kortene ligger oppe. */
        fart: 0.3,
        /** Sekunder (vanlig tid) før kortene legges bort. */
        varer: 8,
    },

    // Poeng uten tak.
    poeng: {
        jevntPar: 100,
        alvorligRett: 20,
        lettForelegg: 10,
        maksMult: 5,
    },

    // Tilfanget i siste del (mars 1946 - august 1948): intervallet går lineært fra start til slutt.
    tilfang: {
        senStart: 2.2,
        senSlutt: 0.45,
        /** Tvillingen dukker opp så lenge etter den første (sekunder, tilfeldig mellom). */
        tvillingMin: 0.3,
        tvillingMaks: 2.5,
        /** Andelen tykke økonomiske mapper blant de alvorlige i siste del. */
        tykkAndel: 0.15,
        /** Andel alvorlige saker (angivere, statspoliti) fra brett 2. */
        alvorligAndel: 0.35,
        /** Den første røde mappa får være alene så mange intervaller. */
        alene: 2,
    },

    // Mellomsidene mellom brettene (sekunder, eller klikk).
    mellomside: 2,

    // Hvor hardt spillet presser: vekt på tilfang og på sinne i `press`.
    press: { tilfang: 0.6, sinne: 0.4, minIntervall: 0.45 },
} as const;
