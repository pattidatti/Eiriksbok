// Brettene og kartarkene som data. Et brett starter et bestemt år og kan legge et nytt
// kartark over (nytt hav, ny havn) eller bare nye flokker på det gamle arket.

export type KartId = 'finnmark' | 'georgia' | 'sorishavet';

export interface FlokkDef {
    navn: string;
    /** Midten av sløyfa flokken vandrer i. */
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    n: number;
    maks: number;
    /** Vandrefart langs sløyfa (px/s). */
    fart: number;
    /** Hvor på sløyfa flokken starter (radianer). */
    fase: number;
    /** Blåhval: fredes i 1966. */
    blåhval?: boolean;
}

export interface Land {
    /** Polygon i logiske piksler. */
    p: [number, number][];
    /** Is i stedet for land (lysere, kaldere farge). */
    is?: boolean;
}

/** Et navn på kartet (stedsnavn i kursiv, store bokstaver for land). */
export interface Navn {
    t: string;
    x: number;
    y: number;
    stor?: boolean;
    vinkel?: number;
}

export interface Kart {
    id: KartId;
    havn: { x: number; y: number; navn: string };
    /** Havna som sone: slipper du en båt her, legger den seg på plassen sin. */
    sone: { x0: number; y0: number; x1: number; y1: number };
    /** Faste plasser for båtene (og båter til salgs) i havna, og kokeriets plass. */
    plasser: [number, number][];
    kokeriPlass: [number, number];
    land: Land[];
    navn: Navn[];
    /** Kompassrosa. */
    rose: { x: number; y: number; r: number };
    /** Steder med prikkete dybdekurver og et lite dybdetall. */
    dyp: { x: number; y: number; r: number; tall: string }[];
    /** Hvor gulnet arket er (0 = nytt, 1 = gammelt og flekkete). */
    alder: number;
}

export interface Brett {
    fra: number;
    /** Navnet på havet under årstallet. */
    hav: string;
    /** Nytt kartark (nytt hav): de gamle flokkene og havna gjelder ikke lenger. */
    kart?: KartId;
    flokker: FlokkDef[];
}

const f = (
    navn: string,
    cx: number,
    cy: number,
    n: number,
    fart: number,
    o: Partial<FlokkDef> = {}
): FlokkDef => ({ navn, cx, cy, rx: 70, ry: 36, n, maks: 28, fart, fase: 0, ...o });

const rader = (xs: number[], ys: number[]): [number, number][] =>
    ys.flatMap((y) => xs.map((x) => [x, y] as [number, number]));

export const KART: Record<KartId, Kart> = {
    finnmark: {
        id: 'finnmark',
        havn: { x: 884, y: 280, navn: 'Vadsø' },
        sone: { x0: 700, y0: 262, x1: 940, y1: 338 },
        plasser: [
            [836, 300],
            [836, 324],
            [786, 300],
            [786, 324],
            [736, 300],
            [736, 324],
        ],
        kokeriPlass: [880, 320],
        land: [
            {
                p: [
                    [0, 0],
                    [960, 0],
                    [960, 250],
                    [900, 262],
                    [860, 250],
                    [800, 232],
                    [700, 228],
                    [600, 218],
                    [530, 160],
                    [470, 120],
                    [400, 112],
                    [330, 90],
                    [250, 96],
                    [160, 70],
                    [80, 92],
                    [0, 86],
                ],
            },
            {
                p: [
                    [960, 336],
                    [900, 342],
                    [860, 350],
                    [760, 420],
                    [690, 448],
                    [620, 470],
                    [560, 500],
                    [520, 540],
                    [960, 540],
                ],
            },
        ],
        navn: [
            { t: 'FINNMARK', x: 560, y: 70, stor: true },
            { t: 'Varangerfjorden', x: 560, y: 260, vinkel: -0.05 },
            { t: 'Nordkapp', x: 160, y: 108 },
            { t: 'Barentshavet', x: 150, y: 450, vinkel: -0.08 },
            { t: 'Vadsø', x: 900, y: 240 },
        ],
        rose: { x: 84, y: 380, r: 40 },
        dyp: [
            { x: 300, y: 420, r: 46, tall: '120' },
            { x: 640, y: 300, r: 30, tall: '60' },
            { x: 60, y: 200, r: 34, tall: '200' },
        ],
        alder: 0,
    },
    georgia: {
        id: 'georgia',
        havn: { x: 476, y: 212, navn: 'Grytviken' },
        sone: { x0: 368, y0: 124, x1: 592, y1: 226 },
        plasser: [...rader([405, 455, 505, 555], [190, 166]), [430, 142], [530, 142]],
        kokeriPlass: [480, 142],
        land: [
            {
                p: [
                    [350, 252],
                    [392, 226],
                    [440, 222],
                    [476, 214],
                    [520, 226],
                    [580, 238],
                    [620, 258],
                    [604, 292],
                    [560, 300],
                    [500, 312],
                    [440, 300],
                    [390, 292],
                ],
            },
            {
                p: [
                    [640, 300],
                    [660, 290],
                    [676, 300],
                    [662, 312],
                ],
            },
        ],
        navn: [
            { t: 'SØR-GEORGIA', x: 486, y: 270, stor: true },
            { t: 'Grytviken', x: 476, y: 248 },
            { t: 'Scotiahavet', x: 470, y: 470, vinkel: -0.04 },
        ],
        rose: { x: 860, y: 300, r: 44 },
        dyp: [
            { x: 120, y: 290, r: 40, tall: '800' },
            { x: 480, y: 380, r: 36, tall: '300' },
            { x: 830, y: 60, r: 30, tall: '1500' },
        ],
        alder: 0.45,
    },
    sorishavet: {
        id: 'sorishavet',
        havn: { x: 480, y: 50, navn: 'Grytviken' },
        sone: { x0: 352, y0: 30, x1: 648, y1: 154 },
        plasser: rader([380, 440, 500, 560, 620], [84, 110]),
        kokeriPlass: [500, 136],
        land: [
            {
                is: true,
                p: [
                    [0, 446],
                    [80, 440],
                    [120, 452],
                    [230, 444],
                    [300, 432],
                    [380, 446],
                    [460, 438],
                    [520, 452],
                    [660, 444],
                    [760, 448],
                    [840, 440],
                    [960, 448],
                    [960, 540],
                    [0, 540],
                ],
            },
            {
                p: [
                    [430, 40],
                    [456, 30],
                    [480, 30],
                    [520, 36],
                    [540, 46],
                    [518, 60],
                    [470, 62],
                    [446, 56],
                ],
            },
        ],
        navn: [
            { t: 'ANTARKTIS', x: 480, y: 480, stor: true },
            { t: 'Sørishavet', x: 220, y: 270, vinkel: -0.05 },
            { t: 'Grytviken', x: 590, y: 40 },
        ],
        rose: { x: 70, y: 70, r: 40 },
        dyp: [
            { x: 460, y: 270, r: 40, tall: '3000' },
            { x: 840, y: 90, r: 30, tall: '2400' },
        ],
        alder: 1,
    },
};

export const BRETT: Brett[] = [
    {
        fra: 1864,
        hav: 'Varangerfjorden',
        kart: 'finnmark',
        flokker: [
            // Flokken ved Vadsø er den første båten allerede ute på (rød ring fra start).
            f('Vadsø', 630, 362, 16, 6, { rx: 36, ry: 18, maks: 21 }),
            f('Varanger', 430, 300, 21, 7, { rx: 64, ry: 32, fase: 1.2 }),
        ],
    },
    {
        fra: 1880,
        hav: 'Finnmarkskysten',
        flokker: [f('Nordkapp', 230, 250, 18, 9, { rx: 70, ry: 50, fase: 2 })],
    },
    {
        fra: 1892,
        hav: 'Finnmarkskysten',
        // Reserven: en flokk ingen har fanget i. Grønn ring å flytte til når de andre er røde.
        flokker: [f('Sørøya', 390, 410, 22, 8, { rx: 60, ry: 30, fase: 3 })],
    },
    {
        fra: 1904,
        hav: 'Sør-Georgia',
        kart: 'georgia',
        flokker: [
            f('Nordvest', 220, 162, 16, 10, { fase: 0.5 }),
            f('Nordøst', 740, 214, 14, 11, { fase: 2.5 }),
            f('Sørvest', 210, 410, 18, 10, { fase: 4 }),
            f('Sørøst', 740, 410, 12, 11, { fase: 1 }),
        ],
    },
    {
        fra: 1925,
        hav: 'Sørishavet',
        kart: 'sorishavet',
        flokker: [
            f('A', 110, 200, 18, 12, { rx: 50, ry: 30, maks: 22 }),
            f('B', 270, 190, 20, 13, { rx: 50, ry: 30, maks: 22, fase: 1, blåhval: true }),
            f('C', 520, 220, 16, 13, { rx: 50, ry: 30, maks: 22, fase: 2 }),
            f('D', 730, 212, 20, 12, { rx: 50, ry: 30, maks: 22, fase: 3, blåhval: true }),
            f('E', 880, 260, 18, 14, { rx: 40, ry: 30, maks: 22, fase: 4 }),
            f('F', 140, 360, 20, 13, { rx: 50, ry: 30, maks: 22, fase: 5 }),
            f('G', 360, 330, 17, 14, { rx: 50, ry: 30, maks: 22, fase: 0.5 }),
            f('H', 580, 364, 19, 13, { rx: 50, ry: 30, maks: 22, fase: 1.5, blåhval: true }),
            f('I', 760, 340, 16, 14, { rx: 50, ry: 30, maks: 22, fase: 2.5 }),
            f('J', 880, 392, 18, 13, { rx: 40, ry: 22, maks: 22, fase: 3.5 }),
        ],
    },
];

/** Hvilket brett gjelder i år? */
export function brettFor(år: number): number {
    let i = 0;
    for (let k = 0; k < BRETT.length; k++) if (år >= BRETT[k].fra) i = k;
    return i;
}

/** Ligger punktet i havna (sona)? */
export const iSone = (k: Kart, x: number, y: number) =>
    x >= k.sone.x0 && x <= k.sone.x1 && y >= k.sone.y0 && y <= k.sone.y1;
