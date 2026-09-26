// Kartet på plottebordet: Sørøst-England, Kanalen og kysten på kontinentet.
// Bordet ligger i XZ-planet. Nord er opp på skjermen (-z), øst er til høyre (+x).
// Én enhet er omtrent 20 km. Ren data og geometri - ingen React, ingen three.

export type XZ = [number, number];

export const TABLE_W = 23;
export const TABLE_D = 15.6;
export const HALF_W = TABLE_W / 2;
export const HALF_D = TABLE_D / 2;

/** England, med klokka fra nordvest. */
export const ENGLAND: XZ[] = [
    [-HALF_W, -HALF_D],
    [-HALF_W, 2.2],
    [-9.2, 2.35],
    [-7.6, 2.0],
    [-6.4, 1.85],
    [-5.6, 2.4],
    [-4.2, 2.35],
    [-2.6, 2.55],
    [-0.8, 2.45],
    [1.0, 2.3],
    [2.4, 2.75],
    [3.6, 2.6],
    [4.8, 2.15],
    [6.0, 1.75],
    [6.9, 1.2],
    [7.35, 0.4],
    [7.45, -0.45],
    [6.4, -0.75],
    [5.2, -0.95],
    [4.3, -1.3],
    [5.4, -1.75],
    [6.9, -2.0],
    [7.9, -2.4],
    [8.35, -3.4],
    [8.75, -4.7],
    [8.9, -6.0],
    [9.4, -HALF_D],
];

/** Frankrike og Belgia. */
export const CONTINENT: XZ[] = [
    [-HALF_W, 6.35],
    [-9.0, 6.05],
    [-6.8, 6.5],
    [-4.6, 6.2],
    [-2.2, 6.05],
    [0.4, 5.7],
    [2.8, 5.55],
    [4.6, 5.2],
    [6.1, 4.55],
    [7.6, 4.0],
    [9.4, 3.3],
    [HALF_W, 2.55],
    [HALF_W, HALF_D],
    [-HALF_W, HALF_D],
];

export function inPoly(x: number, z: number, poly: XZ[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i];
        const [xj, zj] = poly[j];
        if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
}

export const overEngland = (x: number, z: number) => inPoly(x, z, ENGLAND);

export interface Base {
    id: string;
    name: string;
    /** Skvadronen som står her (navnet på statustavla). */
    squadron: string;
    pos: XZ;
}

export const BASES: Base[] = [
    { id: 'tangmere', name: 'Tangmere', squadron: '43', pos: [-6.0, 1.05] },
    { id: 'kenley', name: 'Kenley', squadron: '615', pos: [0.9, 0.2] },
    { id: 'biggin', name: 'Biggin Hill', squadron: '32', pos: [3.3, -0.15] },
    { id: 'hornchurch', name: 'Hornchurch', squadron: '54', pos: [4.1, -2.75] },
    { id: 'manston', name: 'Manston', squadron: '600', pos: [6.55, -0.1] },
];

export interface Station {
    id: string;
    name: string;
    pos: XZ;
}

/** Chain Home. Hver stasjon eier havet nærmest seg (sin sektor). */
export const STATIONS: Station[] = [
    { id: 'ventnor', name: 'Ventnor', pos: [-5.0, 2.25] },
    { id: 'pevensey', name: 'Pevensey', pos: [2.3, 2.55] },
    { id: 'dover', name: 'Dover', pos: [5.8, 1.7] },
    { id: 'bawdsey', name: 'Bawdsey', pos: [8.55, -4.3] },
];

export const LONDON: XZ = [2.4, -1.75];
/** Retning Nord-England: raidet fra Sola 15. august. */
export const NORTH: XZ = [7.6, -7.1];

/** Hvor raidene letter fra (kysten på kontinentet), med klokka fra vest. */
export const SPAWNS: XZ[] = [
    [-8.6, 7.0],
    [-5.4, 7.0],
    [-2.0, 6.9],
    [1.2, 6.7],
    [4.2, 6.4],
    [7.2, 5.3],
    [10.6, 3.9],
];
/** Sola: nordøst utenfor bordet. */
export const SOLA: XZ = [HALF_W - 0.4, -HALF_D + 0.4];

export const dist = (a: XZ, b: XZ) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Radarsektoren et punkt over havet hører til (nærmeste stasjon). */
export function sectorOf(x: number, z: number): number {
    let best = 0;
    let bd = Infinity;
    STATIONS.forEach((s, i) => {
        const d = Math.hypot(x - s.pos[0], z - s.pos[1]);
        if (d < bd) {
            bd = d;
            best = i;
        }
    });
    return best;
}
