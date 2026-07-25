// Typer for Kjedereaksjonen (`/oving/kjedereaksjonen`) - 2D-sidescroller der
// årsak-virkning-kjeden er bakken eleven løper på.
// Ingen React, ingen store-imports - kun datatyper og konstanter.

/** Et galt alternativ, med forklaringen eleven møter i feilsporet. */
export interface KjedeFeil {
    tekst: string;
    /** Hvorfor dette ikke skjedde. Under 20 ord, forklarende - aldri irettesettende. */
    hvorfor: string;
}

/**
 * Ett ledd i årsakskjeden. `tekst` er den riktige virkningen av forrige ledd,
 * og blir samtidig årsaken i neste ledd. Det er dette som gjør kjeden til en
 * ekte kjede og ikke en samling løsrevne spørsmål.
 */
export interface KjedeLedd {
    tekst: string;
    feil: KjedeFeil[];
    /** Artikkelen leddet bygger på. Vises som lenke på broen til slutt. */
    link?: string;
}

export type Kulisse = 'middelalder' | 'industri' | 'moderne';

export interface Kjede {
    id: string;
    title: string;
    subjectId: string;
    topicId: string;
    epoke: string;
    kulisse: Kulisse;
    ingress: string;
    /** Utgangspunktet. Står i den første steinen eleven løper på. */
    start: string;
    /** Etterordet på oppsummeringsskjermen. */
    slutt: string;
    ledd: KjedeLedd[];
}

export interface KjedeIndexEntry {
    id: string;
    title: string;
    subjectId: string;
    topicId: string;
    epoke: string;
    ingress: string;
    antallLedd: number;
}

// ---------------------------------------------------------------------------
// Drivkrefter (RPG-laget)
// ---------------------------------------------------------------------------

export type DrivkraftId = 'makt' | 'natur' | 'okonomi' | 'religion';

export interface Drivkraft {
    id: DrivkraftId;
    navn: string;
    /** Hva evnen gjør, i spillets språk. */
    effekt: string;
    /** Hvorfor akkurat denne drivkraften gir akkurat denne evnen. */
    begrunnelse: string;
}

// ---------------------------------------------------------------------------
// Kjøretilstand
// ---------------------------------------------------------------------------

/** Ett valg i en runde, slik oppsummeringen trenger å kjenne det. */
export interface LeddResultat {
    /** Indeks i `kjede.ledd`. */
    index: number;
    tekst: string;
    link?: string;
    /** Traff eleven på første forsøk? */
    riktig: boolean;
    /** Påstanden eleven valgte når den var gal - vises som omvei under broen. */
    valgtFeil?: KjedeFeil;
}

export interface KjedeResultat {
    kjedeId: string;
    title: string;
    subjectId: string;
    topicId: string;
    /** Kom eleven helt frem, eller tok Glemselen henne igjen? */
    fullfort: boolean;
    ledd: LeddResultat[];
    riktigeForsteForsok: number;
    bestStreak: number;
    drivkrefter: DrivkraftId[];
    /** Sekunder brukt på runden. */
    tid: number;
}
