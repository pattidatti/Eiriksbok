/**
 * Artikkelfilm: en artikkel fortalt som film. Manuset er en liste scener. Hver scene
 * har én visuell komponent og en rekke replikker. Replikkene leses opp én etter én,
 * og indeksen til replikken som leses nå er scenens «beat». Visualene reagerer på
 * beat, ikke på sekunder - da holder synken uansett hvor fort stemmen på maskinen er.
 */

export interface FilmReplikk {
    /** Det stemmen sier, og det tekstingen viser. */
    si: string;
    /** Hva stemmen skal si når det skiller seg fra tekstingen (f.eks. «tjue på tolv» for 23.40). */
    uttale?: string;
}

/** Bakgrunnslyd under stemmen (se useFilmAmbiens.ts). «stille» skrur den av. */
export type FilmLyd = 'hav' | 'vind' | 'storm' | 'ild' | 'regn' | 'rom' | 'stille';

export interface FilmScene {
    id: string;
    /** Kapittelnavn i tidslinja nederst. Scener uten kapittel hører til forrige. */
    kapittel?: string;
    visual: {
        type: string;
        props?: Record<string, unknown>;
    };
    /** Bakgrunnslyd fra denne scenen og fram til en scene setter en annen. */
    lyd?: FilmLyd;
    /** Klokkeslett som vises i hjørnet, ett per beat (null = skjul). */
    klokke?: (string | null)[];
    replikker: FilmReplikk[];
}

export interface FilmManus {
    id: string;
    tittel: string;
    /** Lenke tilbake til artikkelen. */
    kilde: string;
    bilde?: string;
    /** Tall i filmen som ikke står i artikkelen, med begrunnelse (sjekkes av validate-film). */
    utenforArtikkel?: { tall: number | string; begrunnelse: string }[];
    /**
     * Siste uavhengige vurdering (rubrikken i build_film.md §5). Forbedringskjøringen i
     * nattrutinen velger filmen med lavest sum, så den som er svakest blir løftet først.
     */
    vurdering?: {
        dato: string;
        viser: number;
        lesbart: number;
        variasjon: number;
        forstaelig: number;
        tro: number;
        sum: number;
    };
    scener: FilmScene[];
}

/** Det hver visual får fra spilleren. */
export interface VisualProps<P = Record<string, unknown>> {
    /** Replikken i scenen som leses nå (0-basert). */
    beat: number;
    /** Om filmen går. Visualer fryser animasjoner når den står på pause. */
    playing: boolean;
    props: P;
}
