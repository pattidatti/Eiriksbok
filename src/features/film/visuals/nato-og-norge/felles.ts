import * as THREE from 'three';

/** Felles for filmen om NATO og Norge: land-id-er, farger og små hjelpere. */

/** ISO 3166-1 numerisk, slik verdenskartet bruker dem. */
export const ID = {
    norge: '578',
    sverige: '752',
    finland: '246',
    danmark: '208',
    island: '352',
    russland: '643',
    ukraina: '804',
    tyskland: '276',
    tsjekkia: '203',
    slovakia: '703',
};

/**
 * NATO-landene i Europa før 2022, etter tabellen i artikkelens NatoVokser-komponent
 * (Hilde & Cooper, 2026). Canada og USA er utenfor kartet.
 */
/** De europeiske av de tolv landene fra 1949 (Canada og USA er utenfor kartet). */
export const NATO_1949 = ['056', '208', '250', '352', '380', '442', '528', '578', '620', '826'];

export const NATO_FOR_2022 = [
    '056', '208', '250', '352', '380', '442', '528', '578', '620', '826', // 1949
    '300', '792', // 1952
    '276', // 1955
    '724', // 1982
    '616', '203', '348', // 1999
    '100', '233', '428', '440', '642', '703', '705', // 2004
    '008', '191', // 2009
    '499', // 2017
    '807', // 2020
];

/** Sovjetunionen, omtrentlig, tegnet med dagens land. */
export const SOVJET = [
    '643', '804', '112', '233', '428', '440', '498', '268', '051', '031', '398', '860', '795',
    '417', '762',
];

export const FARGE = {
    hav: '#dbeafe',
    land: '#e5e7eb',
    nato: '#2563eb',
    natoLys: '#a5c4f5',
    natoMork: '#1e3a8a',
    utenfor: '#fde68a',
    sok: '#34d399',
    russlandLys: '#fecaca',
    rod: '#dc2626',
    rodMork: '#991b1b',
    gul: '#f59e0b',
    tysk: '#475569',
    mork: '#0f172a',
};

/** Omtrentlig bredde på en tekstlinje i px (ca. 0,55 x skriftstørrelse per tegn). */
export function kortBredde(tekst: string, str: number) {
    return tekst.length * str * 0.55;
}

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
export function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Bryter tekst i linjer på høyst `maks` tegn. */
export function brytLinjer(tekst: string | undefined, maks = 30) {
    if (!tekst) return [];
    const ut: string[] = [];
    let linje = '';
    for (const o of tekst.split(' ')) {
        if ((linje + ' ' + o).trim().length > maks) {
            ut.push(linje.trim());
            linje = o;
        } else linje += ' ' + o;
    }
    if (linje.trim()) ut.push(linje.trim());
    return ut;
}
