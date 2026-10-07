// Alle tallene i Gamma. Ingen balansetall inne i reglene.

export const TUNING = {
    /** Tida: én dag i spillsekunder, og runden fra 10. november 1944 til 19. februar 1945. */
    dag: 1.5,
    dager: 101,

    /** Fjellsida på flata (960 x 540): gamma øverst til venstre, fjorden nede til høyre. */
    verden: {
        gammaX: 150,
        /** Inga er inne (skjult, kan fyre) når x <= gammaX + inne. */
        inne: 34,
        strandX: 850,
        minX: 120,
        maxX: 830,
    },

    inga: {
        fart: 150,
        fartMedFang: 105,
        /** Kubber i ett fang. */
        fang: 4,
    },

    /** Vedhaugene: x og hvor mange kubber. Den siste ved stranda tar aldri slutt. */
    haug: [
        { x: 270, kubber: 8 },
        { x: 430, kubber: 14 },
        { x: 600, kubber: 30 },
        { x: 770, kubber: 999 },
    ],

    /** Kubber det er plass til i stabelen ved døra, og hva dere starter med. */
    stabel: { maks: 10, start: 4 },

    varme: {
        start: 70,
        maks: 100,
        /** Fall per sekund i starten og ved slutten av runden. */
        fallFra: 2.5,
        fallTil: 4.0,
        /** Varme per sekund mens du fyrer. */
        fyr: 20,
        /** Sekunder per kubbe mens du fyrer. */
        perKubbe: 0.5,
        /** Under denne er rimet tydelig (bare bilde). */
        rim: 30,
        /** En natt med minst så mye varme er en varm natt (poengene). */
        god: 55,
        /** Poeng for å holde ut til hjelpen kommer. */
        hjelpen: 20,
    },

    røyk: {
        /** Vekst per sekund mens du fyrer, og fall etter. */
        opp: 1.0,
        ned: 0.22,
        /** Røyken synes for lyset over denne. */
        synlig: 0.2,
    },

    patrulje: {
        /** Første båt (dag). Den er en øving: lyset stanser under gamma. */
        førsteDag: 10,
        /** Sekunder mellom båtene i starten og mot slutten (snitt, +-30 %). */
        mellomFra: 13,
        mellomTil: 8.5,
        /** Sekunder båten synes og høres før lyset tennes. */
        varsel: 3.5,
        varselTil: 2.5,
        /** Hvor fort lyset feier opp og ned (px/s) i starten og mot slutten. */
        sveipFra: 200,
        sveipTil: 150,
        /** Halv bredde av lyskjeglen på bakken. */
        bredde: 75,
        /** Hvor høyt opp lyset når: px forbi gamma (negativ = stanser under). */
        rekkevidde: 40,
        øvingRekkevidde: -95,
        /** Sekunder båten bruker på å dra. */
        drar: 2,
    },

    /** Hendelser (dager). */
    jul: { fra: 44, til: 48 },
    storm: { fra: 58, til: 64, fallGanger: 1.8 },

    /** Rangene etter dager holdt ut. */
    ranger: [
        [0, 'Første natt'],
        [21, 'Mørketida'],
        [45, 'Jul i gamma'],
        [70, 'Januarkulda'],
        [100, 'Hjelpen kom'],
    ] as [number, string][],
};
