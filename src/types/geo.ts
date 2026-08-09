import type { Feature, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import * as topojson from 'topojson-client';

/**
 * Egenskapene på et land i verdensgeometrien.
 *
 * Hvilke som finnes varierer med kartfila: world-atlas sin `countries-110m.json`
 * har `name`, mens eldre Natural Earth-baserte filer har `ISO_A3`. Begge er
 * derfor valgfrie. Selve `id`-en (ISO 3166-1 numerisk) ligger på featuren.
 */
export interface GeoFeatureProperties {
    name?: string;
    ISO_A3?: string;
}

/** Ett land, slik `topojson.feature(...)` leverer det. */
export type GeoFeature = Feature<Geometry, GeoFeatureProperties>;

/** Topologien slik den ligger i public/data/world/*.json. */
export type WorldTopology = Topology<{
    countries: GeometryCollection<GeoFeatureProperties>;
}>;

/**
 * Pakker ut landene fra en topojson-topologi.
 *
 * Kartkomponentene gjorde hver sin `(countries as any).features`. Her skjer det
 * ett sted, og fordi topologien er typet treffer vi `feature`-overloaden som
 * returnerer en ferdig FeatureCollection - da trengs ingen cast i det hele tatt.
 */
export function topologyToFeatures(world: WorldTopology): GeoFeature[] {
    return topojson.feature(world, world.objects.countries).features;
}
