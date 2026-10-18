import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as topojson from 'topojson-client';
import { geoBounds } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../components/atlas/useAtlasWorld';

/**
 * Verdenskartet til filmene.
 *
 * Uten argument: det grove kartet (1:110 millioner), samme som atlaset. Det holder for
 * hele verden og store regioner.
 *
 * Med `utsnitt` ([[vest, sør], [øst, nord]] i lengde/bredde): det fine kartet (1:50
 * millioner, Natural Earth via world-atlas), men BARE landene som ligger i utsnittet.
 * Bruk det når kartet zoomer inn på et lite område (Finnmark, Lofoten, Gaza), der det
 * grove kartet blir klumper uten fjorder.
 *
 * Hvorfor ikke alltid fint: hele verden i 1:50 millioner ga over ett sekund per bilde i
 * avspillingen på strupet CPU (målt 2026-10-17, Chromebook-nivå). Med bare landene i
 * utsnittet koster det omtrent det samme som det grove kartet.
 *
 * Fila ligger lokalt (`public/data/world/`), aldri på CDN. Til det fine kartet er lastet,
 * gis det grove, så kartet aldri står tomt.
 */
export type Utsnitt = [[number, number], [number, number]];

const FIN_URL = '/data/world/countries-50m.json';
const NOKKEL = ['film-verden-50m'];

interface FinLand {
    land: GeoFeature;
    /** [vest, sør, øst, nord]; vest > øst betyr at landet krysser datolinja. */
    boks: [number, number, number, number];
}

async function hentFin(): Promise<FinLand[]> {
    const res = await fetch(FIN_URL);
    if (!res.ok) throw new Error('Kunne ikke laste det detaljerte verdenskartet');
    const world = await res.json();
    const fc = topojson.feature(world, world.objects.countries) as unknown as {
        features: GeoFeature[];
    };
    return fc.features.map((land) => {
        const [[v, s], [o, n]] = geoBounds(land as never);
        return { land, boks: [v, s, o, n] };
    });
}

function overlapper([v, s, o, n]: FinLand['boks'], [[uv, us], [uo, un]]: Utsnitt) {
    if (n < us || s > un) return false;
    if (v > o) return true; // krysser datolinja: ta det med heller enn å regne
    return !(o < uv || v > uo);
}

function lesFlagg(navn: string) {
    try {
        return localStorage.getItem(navn) === '1';
    } catch {
        return false;
    }
}

export function useFilmVerden(utsnitt?: Utsnitt) {
    const grov = useAtlasWorld();
    const { data: fin } = useQuery({
        queryKey: NOKKEL,
        queryFn: hentFin,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60,
        retry: 1,
        enabled: !!utsnitt,
    });
    const nokkel = utsnitt ? utsnitt.flat().join(',') : '';
    const valgt = useMemo(() => {
        if (!utsnitt || !fin) return null;
        // Litt slakk rundt utsnittet, så land som bare så vidt er med også kommer med.
        const [[v, s], [o, n]] = utsnitt;
        const med: Utsnitt = [
            [v - 2, s - 2],
            [o + 2, n + 2],
        ];
        return fin.filter((l) => overlapper(l.boks, med)).map((l) => l.land);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fin, nokkel]);
    // Kun i utvikling: localStorage «film-kart-grov» = '1' viser det grove kartet, til sammenligning.
    const tvingGrov = import.meta.env.DEV && lesFlagg('film-kart-grov');
    return {
        geographies: (tvingGrov ? null : valgt) ?? grov.geographies,
        loading: !valgt && grov.loading,
        error: grov.error,
        detaljert: !!valgt && !tvingGrov,
    };
}
