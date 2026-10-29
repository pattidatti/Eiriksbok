/** Land-id-er (ISO 3166 numerisk, som i verdenskartet) for kartene i filmen. */

/** Sovjetunionen var flere av dagens land. Verdenskartet tegner dem hver for seg. */
export const SOVJET = [
    '643',
    '804',
    '112',
    '398',
    '860',
    '795',
    '417',
    '762',
    '031',
    '051',
    '268',
    '498',
    '440',
    '428',
    '233',
];
/** Østblokken i Europa (uten Sovjetunionen og Øst-Tyskland). */
export const OSTBLOKK = ['616', '348', '203', '703', '642', '100'];
/** Land i vest som fikk Marshallhjelp og var med i den demokratiske vestdelen. */
export const VESTEUROPA = [
    '250',
    '826',
    '380',
    '528',
    '056',
    '442',
    '208',
    '578',
    '620',
    '372',
    '352',
    '040',
    '752',
    '756',
];

export const id = (g: unknown) => String((g as { id?: string | number }).id ?? '');
