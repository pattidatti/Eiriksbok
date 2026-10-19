/**
 * Hjelpere for kartene i filmene: grenser verdenskartet tegner annerledes enn i tiden filmen
 * handler om, og rammen en projeksjon skal tilpasses.
 */

export type LngLat = [number, number];

/**
 * Krim. Verdenskartet (Natural Earth) tegner halvøya som russisk. Handler filmen om tiden før
 * 2014, tegn denne over Russland i Ukrainas farge, etter landene:
 * `<path d={sti(KRIM as never) ?? ''} fill={ukrainaFarge} />`.
 */
export const KRIM = {
    type: 'Polygon',
    coordinates: [
        [
            [33.4, 46.1],
            [34.6, 46.2],
            [35.5, 45.6],
            [36.7, 45.5],
            [36.5, 45.1],
            [35.2, 44.7],
            [33.5, 44.35],
            [32.4, 45.35],
            [33.4, 46.1],
        ],
    ],
} as const;

/**
 * Rammen en projeksjon skal tilpasses med `fitExtent`, fra hjørnet [vest, sør] til
 * [øst, nord]. Gir et rutenett av punkter som `MultiPoint`, aldri en Polygon:
 *
 * - En Polygon-ramme har lett feil vinding, og da tilpasses kartet til hele verden.
 * - I kjegleprojeksjon (`geoConicConformal`) bøyer breddegradene seg. Med bare to hjørner
 *   blir sørkanten kuttet midt i utsnittet; punktene langs kantene tar den med.
 *
 * `projeksjon.fitExtent([[40, 40], [1560, 860]], rammePunkter([4, 44], [62, 63]) as never)`
 */
export function rammePunkter(sorvest: LngLat, nordost: LngLat) {
    const coordinates: LngLat[] = [];
    for (let i = 0; i <= 8; i++)
        for (let j = 0; j <= 4; j++)
            coordinates.push([
                sorvest[0] + ((nordost[0] - sorvest[0]) * i) / 8,
                sorvest[1] + ((nordost[1] - sorvest[1]) * j) / 4,
            ]);
    return { type: 'MultiPoint' as const, coordinates };
}
