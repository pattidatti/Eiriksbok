// Formatet til et forelesningsmanus. Se docs/Design documents/auditoriet-blueprint.md §4.
//
// Et manus er en liste med segmenter på 1-3 setninger. Hvert segment kan bytte
// lysbilde, starte en gest og sette humøret til foreleseren. Et lysbilde blir stående
// til et senere segment bytter det.

export type Gest =
    | 'peke-lerret'
    | 'aapne-hender'
    | 'telle-fingre'
    | 'lene-frem'
    | 'hand-pa-bryst'
    | 'riste-hode'
    | 'nikke';

export const GESTER: Gest[] = [
    'peke-lerret',
    'aapne-hender',
    'telle-fingre',
    'lene-frem',
    'hand-pa-bryst',
    'riste-hode',
    'nikke',
];

export type Humor = 'noytral' | 'glad' | 'nysgjerrig' | 'alvorlig' | 'overrasket';

export interface KartSted {
    navn: string;
    lat: number;
    lng: number;
    /** Tegnes i aksentfarge og med større prikk. */
    uthev?: boolean;
}

export type Lysbilde =
    | { type: 'tittel'; tekst: string; undertekst?: string; del?: string }
    | { type: 'bilde'; src: string; tekst?: string }
    | { type: 'punkter'; tittel: string; punkter: string[] }
    | { type: 'ord'; ord: string; betydning: string }
    | { type: 'aarstall'; aar: string; tekst: string }
    | { type: 'tidslinje'; tittel: string; hendelser: { aar: string; tekst: string }[]; uthev?: number }
    | { type: 'kart'; tittel: string; steder: KartSted[]; rute?: [number, number][] }
    | { type: 'sporsmal'; tekst: string }
    | { type: 'fakta'; tittel: string; tekst: string }
    | { type: 'sitat'; tekst: string; kilde?: string }
    /** Friminutt mellom to forelesninger. Tegnes med nedtelling til `starter` (epoch ms). */
    | { type: 'pause'; neste: string; starter: number; sal: string };

export interface Segment {
    si: string;
    lysbilde?: Lysbilde;
    gest?: Gest;
    humor?: Humor;
}

export interface Forelesning {
    id: string;
    tittel: string;
    /** Artikkelen manuset bygger på, som absolutt sti. */
    kilde: string;
    fag: string;
    emne: string;
    /** Hash av artikkelens `content` da manuset ble skrevet. Endres artikkelen, er manuset utdatert. */
    sourceHash: string;
    foreleser: { navn: string; rolle: string };
    /** 'manus' = skrevet for muntlig fremføring. 'auto' = laget av artikkelen uten AI. */
    type?: 'manus' | 'auto';
    segmenter: Segment[];
}

/** Spørsmålene hentes fra artikkelens Quiz-komponent, ikke fra manuset. */
export interface Sporsmal {
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
}
