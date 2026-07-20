// Orienterings-hjelpere for mikrospill-scener.
//
// Konvensjon i kittet: en del som har en "front" (f.eks. `Boat`, `Person`,
// `Animal`) peker **mot +Z** i sin egen lokale ramme. For å snu den mot et mål
// eller langs en retning trenger du en rotasjon om Y - disse funksjonene regner
// den ut, så du slipper hånd-skrevet `Math.atan2` (en klassisk kilde til
// "master/nese peker feil vei"-feil).

export type XZ = [number, number];

/**
 * Y-rotasjon (radianer) som snur en +Z-vendt del til å peke langs retningen
 * `dir` (i XZ-planet). `faceAlong([1, 0])` → peker mot +X (π/2).
 */
export function faceAlong(dir: XZ): number {
    return Math.atan2(dir[0], dir[1]);
}

/**
 * Y-rotasjon (radianer) som får en +Z-vendt del ved `from` til å peke mot `to`
 * (begge i XZ). Bruk til "båten seiler mot havna" / "figuren ser mot fienden".
 */
export function headingToRotation(from: XZ, to: XZ): number {
    return faceAlong([to[0] - from[0], to[1] - from[1]]);
}

/**
 * Full `[x, y, z]`-rotasjons-tuple for en +Z-vendt del som skal peke langs `dir`.
 * Bekvem når en komponent tar en `rotation`-prop.
 */
export function rotationAlong(dir: XZ): [number, number, number] {
    return [0, faceAlong(dir), 0];
}
