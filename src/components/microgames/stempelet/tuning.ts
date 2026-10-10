// Alle tallene i Stempelet. Endre her og kjør simuleringen
// (npx tsx scripts/sim-microgame.mts --ids stempelet) - ikke i reglene.

export const TUNING = {
    /** Ett brett = ett år på kontoret. Åtte år, 1931-1938. */
    år: { sekunder: 24, første: 1931, antall: 8 },

    /** Passet: hvor lenge et fullt bånd varer, og når det må fornyes. */
    pass: {
        varerMin: 16,
        varerMaks: 20,
        /** Under denne andelen av fullt bånd er passet «til fornyelse»: lomma vises, stempelet virker. */
        fornyFra: 0.5,
        /** Under denne andelen rister passet og båndet er rødt. */
        ristFra: 0.25,
        /** Nye pass kommer med så mye bånd igjen (andel av fullt). */
        nyttMin: 0.55,
        nyttMaks: 0.9,
        /** Sekunder personen blir på bordet før passet har hjulpet dem videre (jobb, nytt land). */
        blirMin: 40,
        blirMaks: 70,
        /** De tre passene ved start (andel bånd igjen). Det første rister. */
        start: [0.24, 0.48, 0.72],
        /** En ny tom lomme får båndet til et mynt-pass, pluss/minus halvparten av dette (s). */
        parAvstand: 1.5,
    },

    /**
     * Stempelet: følger pekeren med litt forsinkelse. Timingringen er tatt bort (vurdering 1):
     * hvert slag er fullt, så ferdigheten er hvem du tar først og hva kassa tåler.
     */
    stempel: {
        /** Hvor fort stempelet tar igjen pekeren (1/s). Høyere = mindre tregt. */
        følg: 10,
        /** Stempelet løftes til topps her mens eleven holder (bare visning). */
        lysTil: 0.4,
        /** Treffsonen rundt midten av et pass (halv bredde og halv dybde). */
        treffX: 0.72,
        treffZ: 0.55,
    },

    /** Kassa: gebyrer, frimerker og husleie (mynter). */
    kasse: {
        start: 12,
        mynt: 1,
        tomLomme: 2,
        gråSak: 3,
        frimerke: 4,
        /** Husleia ved hvert årsskifte, 1931-1938. 1931 har ingen penger (bare stempel og bånd). */
        husleie: [0, 6, 8, 9, 10, 10, 10, 8] as number[],
    },

    /** Frimerkearket: når det kommer i året, og hvor lenge det ligger. */
    frimerke: { fraSek: 4, tilSek: 14, ligger: 8 },

    /** Grå saker: tid i venteskuffen før personen kommer tilbake på bordet. */
    grå: { venter: 6 },

    /** «I siste liten»: et slag på et pass med mindre enn så mange sekunder igjen. */
    redning: { igjen: 1.2 },

    /** Dilemma: to pass med under `igjen` s bånd samtidig, høyst én gang per `pause` s. */
    dilemma: { igjen: 2.2, pause: 14 },

    /** Tap: så mange papirløse samtidig (i skuffen og grå på bordet). */
    tap: { papirløse: 6 },

    /** Rangene: saker fornyet. */
    ranger: [
        [0, 'Kontorbud'],
        [30, 'Ekspeditør'],
        [70, 'Saksbehandler'],
        [110, 'Kontorsjef'],
        [140, 'Direktør for Nansenkontoret'],
    ] as [number, string][],

    /** Press (0-1): vekt på fullt bord og på tomme lommer. */
    press: { bord: 0.6, tomme: 0.4, maksBord: 10, maksTomme: 0.5 },
} as const;
