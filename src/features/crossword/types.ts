// Delte typer for Kryssord (/oving/kryssord).
// Ingen React her - kun data. Generatoren og spill-hooken deler disse.

export type Direction = 'across' | 'down';

export type BankKind = 'begrep' | 'person';

export type Difficulty = 'lett' | 'middels' | 'vanskelig';

// Ett mulig svar i ordbanken, ferdig normalisert.
export interface BankEntry {
    id: string;
    // Svaret slik det skrives i rutene: KUN A-Z + ÆØÅ, store bokstaver
    answer: string;
    // Ordet slik det egentlig ser ut ('Håkon den gode', 'Adam Smith')
    display: string;
    // Ledetråden eleven leser. Selve svaret er maskert bort.
    clue: string;
    kind: BankKind;
    subject?: string;
    era?: string;
    // Lenke til artikkel/persongalleri, vises etter at ordet er løst
    link?: string;
    // Artiklene ordet er nevnt i ('historie/vikingtiden/rikssamlingen').
    // Grunnlaget for modusen «det du har lest».
    articles?: string[];
}

// Et ord som faktisk fikk plass i rutenettet
export interface PlacedWord {
    id: string;
    number: number;
    row: number;
    col: number;
    dir: Direction;
    answer: string;
    clue: string;
    kind: BankKind;
    display: string;
    subject?: string;
    link?: string;
}

export interface PuzzleCell {
    row: number;
    col: number;
    solution: string;
    // Nummeret som vises i hjørnet (kun på ruter der et ord starter)
    number?: number;
    acrossId?: string;
    downId?: string;
}

export interface Puzzle {
    rows: number;
    cols: number;
    // Nøkkel: `${row}:${col}` - se cellKey()
    cells: Record<string, PuzzleCell>;
    words: PlacedWord[];
    seed: number;
}

export const cellKey = (row: number, col: number): string => `${row}:${col}`;

export interface DifficultyPreset {
    id: Difficulty;
    label: string;
    tagline: string;
    maxSize: number;
    targetWords: number;
    minLength: number;
    maxLength: number;
    hints: number;
    // Skal et fullt utfylt, men feil ord si fra med en gang?
    autoCheck: boolean;
    // Hvor mange ganger eleven kan trykke «Sjekk». Uten en grense kan et
    // vanskelig brett brute-forces med sjekk mellom hvert forsøk.
    checks: number;
}

export const DIFFICULTIES: DifficultyPreset[] = [
    {
        id: 'lett',
        label: 'Lett',
        tagline: 'Korte ord, romslig rutenett og tre gratis hint.',
        maxSize: 11,
        targetWords: 8,
        minLength: 3,
        maxLength: 8,
        hints: 3,
        autoCheck: true,
        checks: 5,
    },
    {
        id: 'middels',
        label: 'Middels',
        tagline: 'Flere ord som krysser hverandre. To hint.',
        maxSize: 13,
        targetWords: 13,
        minLength: 4,
        maxLength: 11,
        hints: 2,
        autoCheck: true,
        checks: 3,
    },
    {
        id: 'vanskelig',
        label: 'Vanskelig',
        tagline: 'Stort brett, lange ord og ingen som sier fra hvis du bommer.',
        maxSize: 15,
        targetWords: 16,
        minLength: 5,
        maxLength: 12,
        hints: 1,
        autoCheck: false,
        checks: 2,
    },
];

export type ContentFilter = 'blandet' | 'begreper' | 'personer';

export interface PuzzleFilters {
    subject: string | null;
    content: ContentFilter;
    era: string | null;
    // Bare ord som står i artikler eleven har lest
    onlyRead: boolean;
}
