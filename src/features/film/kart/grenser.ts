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
 * Øst-Tyskland (DDR, 1949-1990). Verdenskartet har bare ett Tyskland. Grensa mot vest (den
 * indre tyske grensa, fra Lübeckbukta til Tsjekkoslovakia) er tegnet her; mot øst, nord og sør
 * går polygonet med vilje langt ut over landegrensa, så det skal klippes etter Tyskland:
 *
 * ```tsx
 * <clipPath id="tyskland"><path d={sti(tyskland as never) ?? ''} /></clipPath>
 * <path d={sti(OST_TYSKLAND as never) ?? ''} fill={ostFarge} clipPath="url(#tyskland)" />
 * <path d={sti(VEST_BERLIN as never) ?? ''} fill={vestFarge} />
 * ```
 *
 * Gjelder ethvert kart over Europa fra etter 1949 til 1990. Fra 1945 til 1949 var det soner.
 */
export const OST_TYSKLAND = {
    type: 'Polygon',
    coordinates: [
        [
            [10.9, 54.4],
            [15.2, 55.0],
            [15.6, 53.0],
            [15.6, 50.6],
            [12.6, 50.0],
            [12.1, 50.32],
            [11.9, 50.42],
            [11.7, 50.4],
            [11.42, 50.5],
            [11.17, 50.34],
            [10.95, 50.36],
            [10.75, 50.33],
            [10.5, 50.36],
            [10.25, 50.48],
            [10.05, 50.6],
            [9.95, 50.72],
            [9.97, 50.84],
            [10.05, 50.97],
            [10.15, 51.12],
            [9.95, 51.32],
            [10.35, 51.52],
            [10.65, 51.6],
            [10.6, 51.75],
            [10.62, 51.9],
            [11.05, 52.2],
            [10.9, 52.45],
            [10.95, 52.65],
            [11.3, 52.9],
            [11.57, 53.04],
            [11.25, 53.14],
            [10.6, 53.37],
            [10.82, 53.7],
            [10.8, 53.89],
            [10.9, 53.96],
            [10.95, 54.05],
            [10.9, 54.4],
        ],
    ],
} as const;

/** Vest-Berlin, en vestlig øy midt i Øst-Tyskland. Tegnes over `OST_TYSKLAND` i vestens farge. */
export const VEST_BERLIN = {
    type: 'Polygon',
    coordinates: [
        [
            [13.12, 52.6],
            [13.4, 52.66],
            [13.43, 52.52],
            [13.48, 52.42],
            [13.3, 52.37],
            [13.1, 52.42],
            [13.12, 52.6],
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
