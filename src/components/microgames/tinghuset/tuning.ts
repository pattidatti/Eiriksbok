// Alle tallene i Tinghuset. Spillreglene (game.ts, rules.ts) leser herfra og har ingen
// balansetall selv. Endre her, kjør `npx tsx scripts/sim-microgame.mts --ids tinghuset`.

export const TUNING = {
    // Arket (verdenskoordinater, 16:9).
    world: { w: 960, h: 540 },

    // Kalenderen: måned 0 = mai 1945, seier når måned SLUTT_MND er nådd (september 1948).
    kalender: {
        sluttMnd: 40,
        /** Straffenivået synker i synlige trinn: første trinn faller i måned `startMnd` +
         *  `hverMnd`, så hver `hverMnd` måned, `pp` hver gang, aldri under `min`. */
        trinn: { startMnd: 4, hverMnd: 3, pp: 0.05, min: 0.45 },
        /** Mappa blinker med nedtelling når neste trinn er så nær (sekunder). */
        varselSek: 3,
    },

    // Dommene som står på lappen. Et par er jevnt når den trykte dommen er lik.
    dom: {
        /** Forelegg har fast takst uansett straffenivå. */
        forelegg: 'Bot og tap av rettigheter',
        /** Rettssak: grunnstraff ved 100 %; hvert trinn trekker 1 år (alvorlig), et halvt år
         *  (økonomisk) eller 1000 kr (vanlig medlem). */
        alvorligAar: 20,
        tykkAar: 10,
        lettKr: 20000,
    },

    // Skrankene: hvor lenge en sak tar (sekunder spilltid).
    skranke: {
        forelegg: 0.8,
        rettssak: 9,
        tykkRettssak: 18,
        /** Flere dommere: rettssaler så mye raskere (0,1 = 10 %). */
        dommereFart: 0.1,
        /** Tiden mappa bruker på å gli langs streken. */
        reise: 0.35,
        /** Flest rettssaler, forelegg-skranker og dommere kortene kan gi i tillegg til brettets
         *  egne. Brett 4 har fire saler; ett kort til gir bare rundt 20 % mer. Seks skranker får
         *  plass på arket. */
        maksSaler: 1,
        maksForelegg: 0,
        maksDommere: 0,
        /** Fast rute sender én lett mappe så ofte (aldri alvorlige). */
        ruteHvert: 0.5,
    },

    // Sinnet i gatene (0-1). Fullt = tap.
    sinne: {
        /** Per ventende mappe (i leir eller kø) per sekund. */
        ventPerMappe: 0.0025,
        /** Hopp når en alvorlig sak får forelegg. */
        forMildt: 0.12,
        /** Alvorlig sak avgjort i rettssalen trekker ned. */
        rettLetter: 0.015,
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
        /** Jevnt par i rettssalen: så mye x multiplikator, og multiplikatoren +1. */
        jevntPar: 100,
        /** Jevnt par med forelegg (fast takst): så mye x multiplikator, multiplikatoren står. */
        jevntForelegg: 40,
        alvorligRett: 20,
        lettForelegg: 10,
        maksMult: 10,
    },

    // Tilfanget fra brett 2: sekunder mellom hver mappe, lineært mellom punktene [måned, sekunder].
    // Juni 1945 1 per 3 s, januar 1946 1 per 1,5 s, 1947 1 per 0,8 s - mer enn salene rekker.
    tilfang: {
        kurve: [
            [1, 3],
            [8, 1.5],
            [20, 0.8],
            [40, 0.65],
        ] as [number, number][],
        /** Tvillingen dukker opp så lenge etter den første (sekunder, tilfeldig mellom). */
        tvillingMin: 5,
        tvillingMaks: 14,
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
    press: { tilfang: 0.6, sinne: 0.4, minIntervall: 0.65 },
} as const;
