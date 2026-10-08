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
}

export interface Land {
    /** Polygon i logiske piksler. */
    p: [number, number][];
}

export interface Kart {
    id: KartId;
    havn: { x: number; y: number; navn: string };
    land: Land[];
}

export interface Brett {
    fra: number;
    /** Navnet på havet under årstallet. */
    hav: string;
    /** Nytt kartark (nytt hav): de gamle flokkene og havna gjelder ikke lenger. */
    kart?: KartId;
    flokker: FlokkDef[];
    /** Kort lapp når brettet starter. */
    nytt?: string;
}

const f = (
    navn: string,
    cx: number,
    cy: number,
    n: number,
    fart: number,
    o: Partial<FlokkDef> = {}
): FlokkDef => ({ navn, cx, cy, rx: 70, ry: 36, n, maks: 28, fart, fase: 0, ...o });

export const KART: Record<KartId, Kart> = {
    finnmark: {
        id: 'finnmark',
        havn: { x: 850, y: 300, navn: 'Vadsø' },
        land: [
            {
                p: [
                    [0, 0],
                    [960, 0],
                    [960, 250],
                    [880, 270],
                    [800, 230],
                    [600, 220],
                    [470, 120],
                    [330, 90],
                    [160, 70],
                    [0, 90],
                ],
            },
            {
                p: [
                    [960, 330],
                    [880, 340],
                    [760, 420],
                    [620, 470],
                    [520, 540],
                    [960, 540],
                ],
            },
        ],
    },
    georgia: {
        id: 'georgia',
        havn: { x: 480, y: 262, navn: 'Grytviken' },
        land: [
            {
                p: [
                    [360, 250],
                    [420, 215],
                    [520, 225],
                    [610, 255],
                    [590, 300],
                    [500, 305],
                    [400, 295],
                ],
            },
        ],
    },
    sorishavet: {
        id: 'sorishavet',
        havn: { x: 480, y: 52, navn: 'Grytviken' },
        land: [
            {
                p: [
                    [0, 470],
                    [200, 455],
                    [420, 480],
                    [640, 460],
                    [960, 475],
                    [960, 540],
                    [0, 540],
                ],
            },
            {
                p: [
                    [430, 40],
                    [480, 30],
                    [540, 42],
                    [520, 62],
                    [450, 60],
                ],
            },
        ],
    },
};

export const BRETT: Brett[] = [
    {
        fra: 1864,
        hav: 'Varangerfjorden',
        kart: 'finnmark',
        flokker: [f('Varanger', 620, 330, 14, 8, { rx: 80, ry: 40 })],
        nytt: 'Dra båten ut til hvalene.',
    },
    {
        fra: 1880,
        hav: 'Finnmarkskysten',
        flokker: [f('Nordkapp', 230, 250, 18, 9, { rx: 70, ry: 50, fase: 2 })],
        nytt: 'Ny båt i havna. Der koster den lite, ute koster den mer.',
    },
    {
        fra: 1892,
        hav: 'Finnmarkskysten',
        // Reserven: en flokk ingen har fanget i. Grønn ring å flytte til når de andre er røde.
        flokker: [f('Sørøya', 390, 390, 22, 8, { rx: 60, ry: 34, fase: 3 })],
        nytt: 'Ny flokk ved Sørøya. Ingen har fanget her ennå.',
    },
    {
        fra: 1904,
        hav: 'Sør-Georgia',
        kart: 'georgia',
        flokker: [
            f('Nordvest', 230, 150, 16, 10, { fase: 0.5 }),
            f('Nordøst', 740, 140, 14, 11, { fase: 2.5 }),
            f('Sørvest', 210, 420, 18, 10, { fase: 4 }),
            f('Sørøst', 760, 410, 12, 11, { fase: 1 }),
        ],
        nytt: 'Fangst forbudt i Finnmark. Nytt hav: Sør-Georgia.',
    },
    {
        fra: 1925,
        hav: 'Sørishavet',
        kart: 'sorishavet',
        flokker: [
            f('A', 110, 190, 12, 12, { rx: 50, ry: 30, maks: 22 }),
            f('B', 300, 150, 14, 13, { rx: 50, ry: 30, maks: 22, fase: 1 }),
            f('C', 520, 200, 10, 13, { rx: 50, ry: 30, maks: 22, fase: 2 }),
            f('D', 710, 150, 14, 12, { rx: 50, ry: 30, maks: 22, fase: 3 }),
            f('E', 860, 230, 12, 14, { rx: 50, ry: 30, maks: 22, fase: 4 }),
            f('F', 150, 360, 16, 13, { rx: 50, ry: 30, maks: 22, fase: 5 }),
            f('G', 360, 320, 12, 14, { rx: 50, ry: 30, maks: 22, fase: 0.5 }),
            f('H', 570, 380, 14, 13, { rx: 50, ry: 30, maks: 22, fase: 1.5 }),
            f('I', 760, 340, 10, 14, { rx: 50, ry: 30, maks: 22, fase: 2.5 }),
            f('J', 880, 410, 12, 13, { rx: 40, ry: 24, maks: 22, fase: 3.5 }),
        ],
        nytt: 'Kokeriet: en flytende havn. Dra det ut til hvalene.',
    },
];

/** Hvilket brett gjelder i år? */
export function brettFor(år: number): number {
    let i = 0;
    for (let k = 0; k < BRETT.length; k++) if (år >= BRETT[k].fra) i = k;
    return i;
}
