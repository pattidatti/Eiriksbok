import { geoMercator, type GeoProjection } from 'd3-geo';
import type { Utsnitt } from '../../kart/useFilmVerden';

/**
 * Norge delt i de fire dialektområdene, brukt av MalmerkerNorge, MalmerkerKart og
 * MalmerkerOrd. Grensene er en grov skisse i lengde/bredde. De klippes etter Norges
 * omriss, så havet og nabolandene aldri blir farget.
 */

export type LngLat = [number, number];
export type Region = 'vest' | 'ost' | 'trond' | 'nord';
export const REGIONER: Region[] = ['vest', 'ost', 'trond', 'nord'];

export const NORGE_ID = 578;
export const NORGE_UTSNITT: Utsnitt = [
    [4, 57.5],
    [31.5, 71.5],
];

/** Skillet mellom østnorsk og vestnorsk langs Langfjella, omtrentlig (sør til nord). */
export const LANGFJELLA: LngLat[] = [
    [9.72, 59.02],
    [9.15, 59.25],
    [8.4, 59.42],
    [7.75, 59.8],
    [7.6, 60.3],
    [7.85, 60.9],
    [8.2, 61.4],
    [8.4, 61.9],
    [8.275, 62.15],
    [8.15, 62.4],
    [7.7, 62.78],
    [7.3, 62.98],
];

/** Mellom Romsdal og Nordmøre og ut i havet. */
const NORDMORE: LngLat[] = [
    [7.3, 62.98],
    [6.8, 63.1],
    [2, 63.1],
];
/** Mellom Østlandet og Trøndelag (Dovre og østover), omtrentlig. */
const DOVRE: LngLat[] = [
    [8.275, 62.15],
    [9.5, 62.25],
    [12.5, 62.3],
    [33, 62.3],
];
const NORD_GRENSE = 65.05;

const POLYGONER: Record<Region, LngLat[]> = {
    vest: [[2, 56], [9.72, 56], ...LANGFJELLA, ...NORDMORE],
    ost: [[9.72, 56], [33, 56], ...[...DOVRE].reverse(), ...LANGFJELLA.slice(0, 9).reverse()],
    trond: [
        ...[...NORDMORE].reverse(),
        ...LANGFJELLA.slice(8).reverse(),
        ...DOVRE.slice(1),
        [33, NORD_GRENSE],
        [2, NORD_GRENSE],
    ],
    nord: [
        [2, NORD_GRENSE],
        [33, NORD_GRENSE],
        [33, 73],
        [2, 73],
    ],
};

export const REGION_NAVN: Record<Region, string> = {
    vest: 'Vestlandet',
    ost: 'Østlandet',
    trond: 'Trøndelag',
    nord: 'Nord-Norge',
};

/** Der navnet eller ordet for regionen står på kartet. */
export const REGION_MIDT: Record<Region, LngLat> = {
    vest: [6.6, 60.7],
    ost: [10.9, 60.5],
    trond: [11.2, 63.85],
    nord: [20.5, 69.35],
};

export function lagProjeksjon(
    ramme: [[number, number], [number, number]],
    utsnitt: Utsnitt = [
        [4.6, 57.9],
        [31.1, 71.2],
    ]
): GeoProjection {
    return geoMercator().fitExtent(ramme, {
        type: 'MultiPoint',
        coordinates: utsnitt,
    } as never);
}

/** Plan sti gjennom projiserte punkter (ikke geoPath: da avgjør vindingen hva som fylles). */
export function linje(proj: GeoProjection, punkter: LngLat[], lukk = false) {
    const d = punkter
        .map((p, i) => {
            const [x, y] = proj(p) as [number, number];
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join('');
    return lukk ? `${d}Z` : d;
}

export function regionSti(proj: GeoProjection, r: Region) {
    return linje(proj, POLYGONER[r], true);
}
