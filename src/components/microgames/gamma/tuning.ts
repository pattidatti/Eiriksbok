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
        /** Varme per sekund mens en kubbe brenner. */
        fyr: 10,
        /** Sekunder én kubbe brenner (varme og røyk), og hvor mange som får plass på bålet. */
        perKubbe: 1.0,
        bålMaks: 3,
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

    /** Spillfølelsen (bare bilde og lyd, ingen spillregler). */
    juice: {
        /** Sekunder en kubbe flyr fra stabelen til bålet, og fra armene til stabelen. */
        kubbeFlyr: 0.32,
        /** Hvor høyt kubben buer når Inga kaster den på bålet (px). */
        kastBue: 38,
        /** Glør som stiger gjennom ljoren, og røykdotter ut av den, per kubbe. */
        glør: 6,
        dotter: 2,
        /** Rykk i bildet når kubben lander. */
        ristKubbe: 1.4,
        /** Sekunder varmebølgen bruker ut over gamma og snøen. */
        bølge: 0.7,
        /** Kubber lagt på innen så mange sekunder etter hverandre gir et større blus. */
        rekke: 0.7,
        leverFlyr: 0.22,
        /** Gnister når kubben lander, og snøfnugg ved føttene per sekund (tom / med fang). */
        gnister: 16,
        snøTom: 9,
        snøFang: 22,
        /** Pusten når lyset går rett over gamma uten å se røyken: ekte sekunder og fart. */
        pust: 0.45,
        pustFart: 0.3,
        /** Røyk over dette (men under `røyk.synlig`) da lyset passerte = «det gikk så vidt». */
        nesten: 0.04,
        /** Skjermrystelse ved tap og når lyset tennes (px, svinner i ekte tid). */
        ristTap: 7,
        ristLys: 2.5,
        /** Sekunder slutt-bildet står før slutt-skjermen (tapt / vunnet). */
        sluttTap: 2.2,
        sluttSeier: 3.0,
        /** De allierte skipene synes i fjordmunningen fra denne dagen. */
        skipDag: 96,
    },

    /** Rangene etter dager holdt ut. */
    ranger: [
        [0, 'Første natt'],
        [21, 'Mørketida'],
        [45, 'Jul i gamma'],
        [70, 'Januarkulda'],
        [100, 'Hjelpen kom'],
    ] as [number, string][],
};
