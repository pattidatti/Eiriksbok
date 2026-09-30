// Banene i «Frisk puss!»: kolliderbokser, stiger, tau, hindre, sjekkpunkter og funn.
// Ren data uten three.js. Rommet er 40 m langt (x), 13 m bredt (z) og 20 m høyt (y).
//
// Kameraregelen bak banene: ruten går SIDELENGS langs en vegg og sikksakker oppover, alt ligger i
// et smalt belte inntil veggen, og høyere etasjer ligger rett over lavere. Da står kameraet i det
// åpne kirkerommet og aldri mellom figuren og en vegg.
//
// Bane 1 «Første dag» går langs nordveggen. Bane 2 «Skapelsen» går rundt kapellet mot klokka:
// sørveggen (kameraet står i nord), en bro langs østveggen (kameraet står i vest) og nordveggen
// (kameraet står i sør). Kameraet snur seg mykt når eleven går rundt hjørnet (camZones).

export type Kind =
    | 'gulv'
    | 'vegg'
    | 'stein' // gesims og søyle: grep og veggsprett
    | 'bjelke' // veggbjelker i hull i veggen: bærer alltid
    | 'planke' // løse arbeidsplanker: knaker og ramler
    | 'bro' // broene
    | 'mester' // mesterens plattform: mål
    | 'skranke' // marmorskranken og kalkkaret på gulvet
    | 'kalk'; // tørr puss som løsner i kjede

export interface Box {
    id: number;
    min: [number, number, number];
    max: [number, number, number];
    kind: Kind;
    /** Kan klatres på (malt søyle, gesims). */
    grip?: boolean;
    /** Smal bjelke langs denne aksen: balanse. */
    narrow?: 'x' | 'z';
    /** Våt puss: glatt, du sklir. */
    wet?: boolean;
    /** Kanten øverst i en snarvei (kantgrep etter veggsprett gir bonus). */
    stunt?: string;
    /** Hvilken plankegruppe (løse planker) boksen hører til. */
    grp?: number;
}

export interface Ladder {
    x: number;
    z: number;
    y0: number;
    y1: number;
    /** Retningen stigen vender ut fra veggen (x, z). */
    n: [number, number];
    /** Hvor du havner når du går av på toppen (relativt til stigen). */
    exit: [number, number];
}

export interface Rope {
    x: number;
    z: number;
    yTop: number;
    yBot: number;
}

export type V3 = [number, number, number];

/** Bramantes tau-stillas: plattform som svinger mellom A og B. */
export interface StageDef {
    half: V3;
    a: V3;
    b: V3;
    sag: number;
    period: number;
    /** Hvor fort du kan lande på det uten å bli kastet av (m/s). */
    maxLand: number;
}

/** Talje med en sekk som svinger på tvers over en bjelke. */
export interface TaljeDef {
    x: number;
    zc: number;
    amp: number;
    period: number;
    y0: number;
    half: number;
}

/**
 * Talje-heisen: en sekk heises opp og ned. Når sekken går ned, går motvekt-kroken opp, og den
 * som henger i kroken, blir dratt med. Sekken går ned i sin egen søyle ved siden av kroken.
 */
export interface HeisDef {
    x: number;
    z: number;
    /** Bunnen (der du griper kroken). */
    y0: number;
    /** Hvor høyt kroken drar deg. */
    lift: number;
    period: number;
    /** Hvor du går av på toppen (relativt til kroken). */
    exit: [number, number];
    /** Sekkens søyle (relativt til kroken, langs x). */
    loadDx: number;
    offset: number;
}

/** Trekk fra et vindu: vindkast med fast takt, varslet. */
export interface WindDef {
    min: V3;
    max: V3;
    dir: [number, number];
    period: number;
    dur: number;
    warn: number;
    offset: number;
}

/** Tørr puss som løsner i kjede: flisene faller én og én etter at du har tråkket på den første. */
export interface CrumbleDef {
    tiles: Box[];
    delay: number;
    gap: number;
}

/** Løse planker som ligger på hverandre: knaker én, knaker alle. */
export interface PlankGroup {
    boxes: Box[];
    creak: number;
    fall: number;
}

/** Hvor kameraet står som standard: vinkelen når figuren er i dette området. */
export interface CamZone {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
    yaw: number;
}

export interface Checkpoint {
    p: V3;
    /** Hvor langt ned paven settes når du starter her. */
    popeBelow: number;
    /** Hvilken vei figuren ser når den starter her. */
    facing: number;
}

export interface Find {
    id: string;
    title: string;
    p: V3;
}

export interface Fork {
    p: V3;
    r: number;
    name: string;
}

/** Første gang figuren kommer hit, står et lærings-øyeblikk om hinderet. */
export interface Intro {
    key: string;
    p: V3;
    r: number;
}

export type LevelId = 'forste' | 'skapelsen';

export interface Level {
    id: LevelId;
    name: string;
    mirror: boolean;
    /** Arbeidsdagen: hele runden kan ikke vare lenger enn dette (sekunder). */
    clock: number;
    /**
     * Puss-klokka per etappe (giornata): sekunder fra kalkkaret ved sjekkpunkt i til neste.
     * Siste tall er etappen fra siste sjekkpunkt til mesteren.
     */
    etapper: number[];
    target: number;
    popeStart: number;
    popeSpeed: number;
    popeClimb: number;
    popeHigh: number;
    /** Kalkslammets fart (utfordringen), m/s, og hvor mye raskere per sjekkpunkt. */
    slam: [number, number];
    static: Box[];
    planks: PlankGroup[];
    stages: StageDef[];
    taljer: TaljeDef[];
    heiser: HeisDef[];
    winds: WindDef[];
    crumbles: CrumbleDef[];
    ladders: Ladder[];
    ropes: Rope[];
    start: V3;
    checkpoints: Checkpoint[];
    finds: Find[];
    forks: Fork[];
    intros: Intro[];
    popePath: V3[];
    goalY: number;
    master: { p: V3; rotY: number };
    /** Midten av dagens felt i taket (puss-klokka). */
    field: V3;
    marks: number[];
    camZones: CamZone[];
}

// ----- Rommet -----
export const ROOM = { x0: -20, x1: 20, z0: -6.5, z1: 6.5, h: 20 };

let nextId = 0;
const box = (
    min: V3,
    max: V3,
    kind: Kind,
    extra: Partial<Pick<Box, 'grip' | 'narrow' | 'wet' | 'stunt' | 'grp'>> = {}
): Box => ({ id: nextId++, min, max, kind, ...extra });

const shell = (): Box[] => [
    box([-21, -1, -8], [21, 0, 8], 'gulv'),
    box([-21, 0, -8], [21, 21, ROOM.z0], 'vegg'), // nord
    box([-21, 0, ROOM.z1], [21, 21, 8], 'vegg'), // sør
    box([-22, 0, -8], [ROOM.x0, 21, 8], 'vegg'), // vest
    box([ROOM.x1, 0, -8], [22, 21, 8], 'vegg'), // øst
    box([-21, ROOM.h, -8], [21, 21, 8], 'vegg'), // taket
];

// ===========================================================================
// Bane 1: «Første dag» (opplæring). Langs nordveggen, uendret fra den godkjente gråboksen.
// ===========================================================================

const B1_STATIC: Box[] = [
    ...shell(),
    // Gulvet: marmorskranken på tvers
    box([-14, 0, -3], [-13.4, 1.1, ROOM.z1], 'skranke'),
    // Veggsprett-sjakta i vest: søylen og vestveggen
    box([-18.4, 0, ROOM.z0], [-17.6, 5, -4.9], 'stein', { grip: false, stunt: 'sjakt' }),
    // Gesimsen (5 m), sjekkpunkt 1
    box([-17.6, 4.6, ROOM.z0], [-6, 5, -4.9], 'stein'),
    // To veggbjelker over vinduet (trygg vei)
    box([-5, 5.65, ROOM.z0], [-3.2, 6, -5.2], 'bjelke'),
    box([-1.6, 5.65, ROOM.z0], [0.2, 6, -5.2], 'bjelke'),
    // Gesimsen fortsetter etter vinduet
    box([1, 4.6, ROOM.z0], [9.2, 5, -4.9], 'stein'),
    // Malt søyle med grep (sidegren til funn)
    box([2, 5, ROOM.z0], [3.2, 7.9, -5.7], 'stein', { grip: true }),
    // Bjelkerekka (13 m): landing, sjekkpunkt 2
    box([3.5, 12.6, ROOM.z0], [7.4, 13, -3.8], 'bjelke'),
    // Smal bjelke under talja: balanse
    box([-2, 12.7, -4.4], [3.5, 13, -4.1], 'bjelke', { narrow: 'x' }),
    // Tre veggbjelker med gap
    box([-4.2, 12.6, ROOM.z0], [-3, 13, -3.9], 'bjelke'),
    box([-6.4, 12.6, ROOM.z0], [-5.2, 13, -3.9], 'bjelke'),
    box([-8.6, 12.6, ROOM.z0], [-7.4, 13, -3.9], 'bjelke'),
    // Hylla ved tauet (sidegren til funn)
    box([11.2, 15.4, ROOM.z0], [13.4, 15.8, -5.2], 'bjelke'),
    // Buebroen i fire trinn på langs under hvelvet, videre mot vest og opp
    box([-10.6, 13, -5.8], [-8.6, 14, -3.2], 'bro'),
    box([-12.6, 14, -5.8], [-10.6, 15, -3.2], 'bro'),
    box([-14.6, 15, -5.8], [-12.6, 16, -3.2], 'bro'),
    box([-16.6, 16, -5.8], [-14.6, 17, -3.2], 'bro'),
    // Mesteren under dagens felt (18 m), ytterst i vest
    box([-20, 17, ROOM.z0], [-16.6, 18, -2.5], 'mester'),
];

const B1_PLANKS: PlankGroup[] = [
    {
        creak: 0.6,
        fall: 1.2,
        boxes: [
            box([-6, 4.85, -5.1], [-3.67, 5, -4.3], 'planke', { grp: 0 }),
            box([-3.67, 4.85, -5.1], [-1.33, 5, -4.3], 'planke', { grp: 0 }),
            box([-1.33, 4.85, -5.1], [1, 5, -4.3], 'planke', { grp: 0 }),
        ],
    },
];

const FORSTE: Level = {
    id: 'forste',
    name: 'Første dag',
    mirror: false,
    clock: 150,
    // Middels robot: 3,8 / 10,4 / 11,9 s. Stramt: 25-30 % margin, ett søl per etappe er så vidt nok.
    etapper: [6, 14, 16],
    target: 40,
    // Paven kommer tidlig. Han tar den som står og nøler, ikke den som går jevnt.
    popeStart: 1,
    popeSpeed: 3.1,
    popeClimb: 1.3,
    popeHigh: 2.0,
    slam: [0.16, 0.04],
    static: B1_STATIC,
    planks: B1_PLANKS,
    stages: [
        {
            half: [0.9, 0.1, 0.8],
            a: [4.6, 12.7, -2.0], // midten av plattformen, toppen ligger 0,1 over
            b: [-13.6, 16.6, -2.9], // toppen står litt over trinn 3 i ytterpunktet, så du går rett av
            sag: 2.6,
            period: 4.4,
            maxLand: 3.2,
        },
    ],
    taljer: [{ x: 0.8, zc: -4.25, amp: 1.6, period: 3.0, y0: 13.35, half: 0.4 }],
    heiser: [],
    winds: [],
    crumbles: [],
    ladders: [
        { x: -11, z: -4.55, y0: 0, y1: 5, n: [0, 1], exit: [0, -1.05] },
        { x: 8.0, z: -6.15, y0: 5, y1: 13, n: [0, 1], exit: [-1.1, 0] },
    ],
    ropes: [{ x: 10.2, z: -4.6, yTop: 19.5, yBot: 11.5 }],
    start: [-16, 0, -2],
    checkpoints: [
        { p: [-16, 0, -2], popeBelow: 0, facing: Math.PI },
        { p: [-11, 5, -5.65], popeBelow: 8, facing: Math.PI },
        { p: [6.4, 13, -5.6], popeBelow: 8, facing: Math.PI },
    ],
    finds: [
        { id: 'kartong', title: 'Kartong med prikkhull', p: [-19.2, 3.9, -5.7] },
        { id: 'stokk', title: 'Pavens stokk', p: [12.5, 16.6, -5.9] },
        { id: 'flis', title: 'Stjernehimmel-flisen', p: [2.6, 8.6, -6.1] },
    ],
    forks: [
        { p: [-17, 0, -1], r: 3, name: 'sjakt eller stige' },
        { p: [-13.7, 0, -2.5], r: 2.2, name: 'over eller rundt skranken' },
        { p: [-7, 5, -5.6], r: 1.6, name: 'planker eller bjelker' },
        { p: [2.6, 5, -5.2], r: 1.6, name: 'søyla med funnet' },
        { p: [5.5, 13, -5], r: 2.2, name: 'tau-stillaset eller bjelkene' },
        { p: [2.2, 13, -4.25], r: 1.4, name: 'vente på talja' },
        { p: [-8, 13, -4.6], r: 1.8, name: 'broen' },
    ],
    // Hver hindertype får et lærings-øyeblikk første gang du nærmer deg den (også på trygg vei).
    intros: [
        { key: 'planke', p: [-9.2, 5, -5.6], r: 1.8 },
        { key: 'tau', p: [7.2, 13, -5.3], r: 1.8 },
        { key: 'talje', p: [3.8, 13, -4.8], r: 1.6 },
    ],
    // Paven klatrer bare på det som bærer: denne stien, i rekkefølge.
    popePath: [
        [-2, 0, 5.8], // døra midt på sørveggen
        [-11, 0, -4.2],
        [-11, 5, -4.2],
        [-11, 5, -5.6],
        [-6, 5, -5.6],
        [-4.1, 6, -5.8],
        [-0.7, 6, -5.8],
        [1.5, 5, -5.3],
        [8.0, 5, -5.8],
        [8.0, 13, -5.8],
        [6.4, 13, -5.2],
        [3.5, 13, -4.25],
        [-2, 13, -4.25],
        [-8, 13, -4.6],
        [-9.6, 14, -4.5],
        [-11.6, 15, -4.5],
        [-13.6, 16, -4.5],
        [-15.6, 17, -4.5],
        [-18.3, 18, -4.5],
    ],
    goalY: 18,
    master: { p: [-19.2, 18, -4.6], rotY: Math.PI / 2 },
    field: [-17.5, ROOM.h - 0.02, -3.2],
    marks: [0, 5, 13, 18],
    camZones: [{ x0: -99, x1: 99, z0: -99, z1: 99, yaw: 0 }],
};

// ===========================================================================
// Bane 2: «Skapelsen». Rundt kapellet mot klokka: holder du «venstre», følger du ruten.
//
//   Sør (kameraet i nord):  gulvet mot øst -> gesimsen (4,5 m) mot vest, tørr puss i kjede
//                           -> vindusbeltet (8,5 m) mot øst, to vinduer med trekk
//   Øst (kameraet i vest):  broen langs østveggen (8,5 m) mot nord
//   Nord (kameraet i sør):  bjelkene (8,5 m) mot vest, talja og tørr kalk -> den andre broen
//                           (12,4 m) mot øst, våt puss -> buebroen (16,2-17 m) mot vest -> mesteren
//
// Snarveiene hopper over et helt «ut og tilbake»:
//   1. Talje-heisen i øst: fra gulvet rett opp til vindusbeltet (hopper over gesimsen og vinduene).
//   2. Tau-flukten: fra bjelkene i nord over til den andre broen i vest (hopper over bjelkene).
//   3. Vindussjakta i vest: veggsprett fra den andre broen rett opp til mesteren.
// ===========================================================================

const S_Z = (d0: number, d1: number): [number, number] => [ROOM.z1 - d1, ROOM.z1 - d0];
const sBox = (x0: number, x1: number, y0: number, y1: number, d: number, kind: Kind, extra = {}) => {
    const [z0, z1] = S_Z(0, d);
    return box([x0, y0, z0], [x1, y1, z1], kind, extra);
};
const nBox = (x0: number, x1: number, y0: number, y1: number, d: number, kind: Kind, extra = {}) =>
    box([x0, y0, ROOM.z0], [x1, y1, ROOM.z0 + d], kind, extra);

const T1 = 4.5; // gesimsen sør
const T2 = 8.5; // vindusbeltet sør, broen i øst og bjelkene nord
const N2 = 12.4; // den andre broen
const N3 = 16.2; // buebroen

const B2_STATIC: Box[] = [
    ...shell(),
    // --- Gulvet ---
    // Kalkkaret foran talje-heisen: for høyt til å hoppe over med bøtta
    box([13, 0, 2.6], [16.3, 2.4, 3.9], 'skranke'),
    // Pilaren bak heisen (under vindusbeltet), så veien til kroken går forbi sekken
    sBox(14.1, 20, 0, T2 - 0.4, 1.6, 'stein'),
    // --- Gesimsen sør (4,5 m) ---
    sBox(5, 13, T1 - 0.4, T1, 1.6, 'stein'),
    sBox(-20, -3, T1 - 0.4, T1, 1.6, 'stein'),
    // --- Vindusbeltet sør (8,5 m) ---
    sBox(-14.5, -10.5, T2 - 0.4, T2, 1.6, 'stein'), // vestpilaren
    sBox(-9.4, -8.3, T2 - 0.35, T2, 1.2, 'bjelke'), // vindu 2: veggbjelker
    sBox(-7.2, -6.1, T2 - 0.35, T2, 1.2, 'bjelke'),
    sBox(-5, 2, T2 - 0.4, T2, 1.6, 'stein'), // midtpilaren
    box([-2, 11.0, ROOM.z1 - 1.0], [-0.8, 11.3, ROOM.z1], 'bjelke'), // hylle over midtpilaren (funn)
    sBox(3.1, 4.2, T2 - 0.35, T2, 1.2, 'bjelke'), // vindu 1: veggbjelker
    sBox(5.3, 6.4, T2 - 0.35, T2, 1.2, 'bjelke'),
    sBox(7.5, 9.5, T2 - 0.4, T2, 1.6, 'stein'),
    sBox(10.6, 11.7, T2 - 0.35, T2, 1.2, 'bjelke'), // vindu 3: veggbjelker
    sBox(12.7, 13.7, T2 - 0.35, T2, 1.2, 'bjelke'),
    sBox(14.8, 20, T2 - 0.4, T2, 1.6, 'stein'), // østpilaren
    // --- Broen langs østveggen (8,5 m) ---
    box([16.8, T2 - 0.4, -4.9], [20, T2, 4.9], 'bro'),
    box([19.2, T2, -1], [20, 11.4, 0.5], 'stein', { grip: true }), // malt søyle (funn)
    // --- Bjelkene nord (8,5 m) ---
    nBox(10.5, 20, T2 - 0.4, T2, 2.7, 'bjelke'), // landing ved tau-stillaset, sjekkpunkt 2
    box([4.5, T2 - 0.3, -4.4], [10.5, T2, -4.1], 'bjelke', { narrow: 'x' }), // smal bjelke under talja
    nBox(2.3, 3.5, T2 - 0.4, T2, 2.6, 'bjelke'),
    nBox(0.1, 1.3, T2 - 0.4, T2, 2.6, 'bjelke'),
    nBox(-2.1, -0.9, T2 - 0.4, T2, 2.6, 'bjelke'),
    nBox(-20, -9.1, T2 - 0.4, T2, 1.6, 'stein'), // etter den tørre kalken
    nBox(18.3, 20, 11.2, 11.6, 1.3, 'bjelke'), // hylla ved tauet (funn)
    // --- Den andre broen (12,4 m) ---
    box([-20, N2 - 0.4, ROOM.z0], [-13.4, N2, -3.2], 'bro'), // dekket ved tau-stillaset og sjakta
    box([-18.4, N2, ROOM.z0], [-17.6, 17.0, -4.9], 'stein', { stunt: 'sjakt' }), // sjakt-søylen
    nBox(-12.6, -7, N2 - 0.4, N2, 1.6, 'bro'),
    nBox(-7, -3, N2 - 0.4, N2, 1.6, 'bro', { wet: true }),
    nBox(-2, 3, N2 - 0.4, N2, 1.6, 'bro'),
    nBox(3, 6.5, N2 - 0.4, N2, 1.6, 'bro', { wet: true }),
    nBox(6.5, 15, N2 - 0.4, N2, 1.6, 'bro'),
    // --- Buebroen (16,2-17 m) og mesteren (18 m) ---
    nBox(4, 12, N3 - 0.4, N3, 1.6, 'bro'),
    nBox(13.2, 16, N3 - 0.4, N3, 1.3, 'bjelke'), // hylle bak stigen (funn)
    nBox(-4, 3, 16.2, 16.6, 1.6, 'bro'),
    nBox(-13.5, -5, 16.6, 17.0, 1.6, 'bro'),
    box([-16.9, 17, ROOM.z0], [-13.5, 18, -3.2], 'mester'),
];

// Tørr puss: flisene faller i den rekkefølgen de står her, så den første er der du kommer fra.
const tilesS = (x0: number, n: number): Box[] =>
    Array.from({ length: n }, (_, i) => sBox(x0 - (i + 1), x0 - i, T1 - 0.4, T1, 1.6, 'kalk'));
const tilesN = (x0: number, n: number): Box[] =>
    Array.from({ length: n }, (_, i) => nBox(x0 - (i + 1), x0 - i, T2 - 0.4, T2, 1.6, 'kalk'));

const SKAPELSEN: Level = {
    id: 'skapelsen',
    name: 'Skapelsen',
    mirror: false,
    clock: 300,
    // Middels robot: 9,0 / 32,2 / 22,3 / 7,9 s.
    etapper: [13, 43, 30, 11],
    target: 75,
    popeStart: 10,
    popeSpeed: 2.4,
    popeClimb: 1.3,
    popeHigh: 1.55,
    slam: [0.12, 0.04],
    static: B2_STATIC,
    planks: [
        {
            creak: 0.4,
            fall: 0.85,
            boxes: [box([-10.5, T2 - 0.15, 4.4], [-5, T2, 5.3], 'planke', { grp: 0 })],
        },
        {
            creak: 0.4,
            fall: 0.85,
            boxes: [box([2, T2 - 0.15, 4.4], [7.5, T2, 5.3], 'planke', { grp: 1 })],
        },
        {
            creak: 0.4,
            fall: 0.85,
            boxes: [box([9.5, T2 - 0.15, 4.4], [14.8, T2, 5.3], 'planke', { grp: 2 })],
        },
    ],
    stages: [
        {
            half: [0.9, 0.1, 0.8],
            a: [12, T2 - 0.3, -2.0],
            b: [-15.5, N2 + 0.3, -2.9],
            sag: 3.0,
            period: 6.0,
            maxLand: 3.2,
        },
    ],
    taljer: [
        { x: 7.5, zc: -4.25, amp: 1.5, period: 3.0, y0: T2 + 0.35, half: 0.4 },
        // Over den andre broen: sekken svinger inn over gangen og ut igjen.
        { x: 9, zc: -4.9, amp: 1.4, period: 3.0, y0: N2 + 0.35, half: 0.4 },
    ],
    heiser: [
        { x: 15.5, z: 4.4, y0: 0, lift: T2, period: 6, exit: [0, 1.2], loadDx: -0.9, offset: 0 },
    ],
    winds: [
        {
            min: [-10.5, 7.8, 2.5],
            max: [-5, 12, ROOM.z1],
            dir: [0, -1],
            period: 7,
            dur: 1.5,
            warn: 1.0,
            offset: 0,
        },
        {
            min: [2, 7.8, 2.5],
            max: [7.5, 12, ROOM.z1],
            dir: [0, -1],
            period: 7,
            dur: 1.5,
            warn: 1.0,
            offset: 3.5,
        },
        {
            min: [9.5, 7.8, 2.5],
            max: [14.8, 12, ROOM.z1],
            dir: [0, -1],
            period: 7,
            dur: 1.5,
            warn: 1.0,
            offset: 5.2,
        },
    ],
    crumbles: [
        { tiles: tilesS(5, 8), delay: 0.5, gap: 0.24 },
        { tiles: tilesN(-3.1, 6), delay: 0.5, gap: 0.24 },
    ],
    ladders: [
        { x: 13.6, z: 6.15, y0: 0, y1: T1, n: [0, -1], exit: [-1.1, 0] },
        { x: -15.1, z: 6.15, y0: T1, y1: T2, n: [0, -1], exit: [1.1, 0] },
        { x: -13, z: -6.15, y0: T2, y1: N2, n: [0, 1], exit: [1.1, 0] },
        { x: 12.6, z: -6.15, y0: N2, y1: N3, n: [0, 1], exit: [-1.1, 0] },
    ],
    ropes: [{ x: 17.0, z: -4.3, yTop: 16, yBot: 9.8 }],
    start: [-2, 0, 3],
    checkpoints: [
        { p: [-2, 0, 3], popeBelow: 0, facing: Math.PI / 2 },
        { p: [12.4, T1, 5.7], popeBelow: 8, facing: -Math.PI / 2 },
        { p: [16, T2, -5.0], popeBelow: 8, facing: -Math.PI / 2 },
        { p: [10.8, N3, -5.6], popeBelow: 8, facing: -Math.PI / 2 },
    ],
    finds: [
        { id: 'sixtus', title: 'Sixtus-medaljen', p: [-19, 0.9, 5.8] },
        { id: 'meisel', title: 'Meiselen', p: [15.2, 3.3, 3.25] },
        { id: 'botticelli', title: 'Botticellis pensel', p: [-19, 5.4, 5.7] },
        { id: 'lapis', title: 'Lapis-steinen', p: [-1.4, 12.1, 6.0] },
        { id: 'pipe', title: 'Røykpipa', p: [19.6, 12.1, -0.25] },
        { id: 'sot', title: 'Sotfilla', p: [19.2, 12.5, -5.9] },
        { id: 'giornata', title: 'Dagsverk-merket', p: [-19, 9.4, -5.7] },
        { id: 'nakke', title: 'Diktet om nakken', p: [14.4, 13.3, -5.7] },
        { id: 'adam', title: 'Adams hånd (skisse)', p: [15.3, 17.1, -5.7] },
    ],
    forks: [
        { p: [-6, 0, 3], r: 3, name: 'funnet i hjørnet' },
        { p: [12, 0, 4.4], r: 2.5, name: 'heisen eller stigen' },
        { p: [12, T1, 5.2], r: 2, name: 'kalkkaret' },
        { p: [-11.2, T2, 5.6], r: 1.8, name: 'planker eller bjelker' },
        { p: [1.5, T2, 5.6], r: 1.8, name: 'vente på trekken' },
        { p: [18.4, T2, 0], r: 2.5, name: 'søyla på broen' },
        { p: [13, T2, -5], r: 2.5, name: 'tau-stillaset eller bjelkene' },
        { p: [11, T2, -4.25], r: 1.4, name: 'vente på talja' },
        { p: [-15.5, N2, -4.5], r: 2.5, name: 'sjakta eller broen' },
        { p: [-11.5, N2, -5.7], r: 1.8, name: 'den våte broen' },
        { p: [7, N2, -5.7], r: 1.4, name: 'talja over broen' },
        { p: [11, N3, -5.6], r: 2, name: 'hylla bak stigen' },
    ],
    intros: [
        { key: 'heis', p: [13.2, 0, 4.4], r: 1.6 },
        { key: 'kalk', p: [7, T1, 5.7], r: 1.8 },
        { key: 'planke', p: [-13.6, T2, 5.6], r: 1.6 },
        { key: 'trekk', p: [-11.4, T2, 5.8], r: 1.6 },
        { key: 'tau', p: [14.6, T2, -5.2], r: 2 },
        { key: 'talje', p: [11.6, T2, -4.6], r: 1.4 },
        { key: 'vaat', p: [-8.4, N2, -5.7], r: 1.8 },
    ],
    popePath: [
        [0, 0, -5.8], // døra midt på nordveggen
        [13.6, 0, 5.8],
        [13.6, T1, 5.8],
        [12.4, T1, 5.7],
        [-15.1, T1, 5.7],
        [-15.1, T2, 5.9],
        [-14, T2, 5.8],
        [18.4, T2, 5.8],
        [18.4, T2, -4.5],
        [16, T2, -5.6],
        [-13, T2, -5.6],
        [-13, N2, -5.8],
        [-11.9, N2, -5.6],
        [12.6, N2, -5.6],
        [12.6, N3, -5.8],
        [11.5, N3, -5.6],
        [-13.2, 17, -5.6],
        [-15.2, 18, -5.0],
    ],
    goalY: 18,
    master: { p: [-15.6, 18, -5.2], rotY: Math.PI / 2 },
    field: [-15.2, ROOM.h - 0.02, -3.2],
    marks: [0, T1, T2, N2, N3, 18],
    camZones: [
        // Sørveggen: kameraet står i nord og ser mot sør.
        { x0: -99, x1: 16.5, z0: 1.5, z1: 99, yaw: Math.PI },
        // Broen i øst: kameraet står i vest og ser mot øst.
        { x0: 16.5, x1: 99, z0: -99, z1: 99, yaw: 1.5 * Math.PI },
        // Nordveggen: kameraet står i sør og ser mot nord.
        { x0: -99, x1: 16.5, z0: -99, z1: -1.5, yaw: 2 * Math.PI },
    ],
};

// ===========================================================================
// Speilvendt bane (utfordringen): x -> -x
// ===========================================================================

const mv = (p: V3): V3 => [-p[0], p[1], p[2]];
const mb = (b: Box): Box => ({
    ...b,
    min: [-b.max[0], b.min[1], b.min[2]],
    max: [-b.min[0], b.max[1], b.max[2]],
});

function mirrorLevel(L: Level): Level {
    return {
        ...L,
        mirror: true,
        static: L.static.map(mb),
        planks: L.planks.map((g) => ({ ...g, boxes: g.boxes.map(mb) })),
        stages: L.stages.map((s) => ({ ...s, a: mv(s.a), b: mv(s.b) })),
        taljer: L.taljer.map((t) => ({ ...t, x: -t.x })),
        heiser: L.heiser.map((h) => ({ ...h, x: -h.x, exit: [-h.exit[0], h.exit[1]], loadDx: -h.loadDx })),
        winds: L.winds.map((w) => ({
            ...w,
            min: [-w.max[0], w.min[1], w.min[2]],
            max: [-w.min[0], w.max[1], w.max[2]],
            dir: [-w.dir[0], w.dir[1]],
        })),
        crumbles: L.crumbles.map((c) => ({ ...c, tiles: c.tiles.map(mb) })),
        ladders: L.ladders.map((l) => ({
            ...l,
            x: -l.x,
            n: [-l.n[0], l.n[1]],
            exit: [-l.exit[0], l.exit[1]],
        })),
        ropes: L.ropes.map((r) => ({ ...r, x: -r.x })),
        start: mv(L.start),
        checkpoints: L.checkpoints.map((c) => ({ ...c, p: mv(c.p), facing: -c.facing })),
        finds: L.finds.map((f) => ({ ...f, p: mv(f.p) })),
        forks: L.forks.map((f) => ({ ...f, p: mv(f.p) })),
        intros: L.intros.map((f) => ({ ...f, p: mv(f.p) })),
        popePath: L.popePath.map(mv),
        master: { p: mv(L.master.p), rotY: -L.master.rotY },
        field: mv(L.field),
        camZones: L.camZones.map((z) => ({ x0: -z.x1, x1: -z.x0, z0: z.z0, z1: z.z1, yaw: -z.yaw })),
    };
}

const CACHE = new Map<string, Level>();

/** Banen, eventuelt speilvendt. Samme objekt hver gang (trygt å bruke som nøkkel). */
export function getLevel(id: LevelId, mirror = false): Level {
    const key = id + (mirror ? ':speil' : '');
    let L = CACHE.get(key);
    if (!L) {
        const base = id === 'forste' ? FORSTE : SKAPELSEN;
        L = mirror ? mirrorLevel(base) : base;
        CACHE.set(key, L);
    }
    return L;
}

export const LEVELS: LevelId[] = ['forste', 'skapelsen'];

/** Alle funn på tvers av banene (Lærlingens kiste). */
export const ALL_FINDS: Find[] = [...FORSTE.finds, ...SKAPELSEN.finds];
