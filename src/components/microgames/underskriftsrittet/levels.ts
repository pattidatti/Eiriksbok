// Brettene i Underskriftsrittet som data: opptrappingen fra designbriefen punkt 11.
// Hvert brett er sitt eget utsnitt av kartet med origo i midten. Nord er -z.

export type LyktModus = 'står' | 'går' | 'leter';

export interface Bygd {
    navn: string;
    x: number;
    z: number;
    telemark: boolean;
    /** Hvordan lyktene som tennes her, oppfører seg (brett 1 lærer bort én ting om gangen). */
    modus: LyktModus;
}

export interface Brett {
    tittel: string;
    /** Banneret når brettet starter. */
    måned: string;
    /** Sekunder til måneden er over. Brett 1 har en skjult reserve så runden alltid går videre. */
    sekunder: number;
    visKalender: boolean;
    start: [number, number];
    /** Utgangen mot neste ark (vises når alle bygdene har segl). */
    ut: [number, number];
    bygder: Bygd[];
    /** Landeveien som linjestykker. */
    vei: [number, number][];
    /** Åsene: x, z, radius. */
    åser: [number, number, number][];
    /** Fogdgårdene: lyktene tennes her (eller 10-18 m mot gården). Nær gård = kort lunte. */
    fogder: [number, number][];
    /** Første lykt i hver bygd tennes ved dette navnet, så hvert n-te navn i hele brettet. */
    førsteLykt: number;
    navnPerLykt: number;
    lyktFart: number;
    /** Sekunder i lyset før du er tatt. */
    fangTid: number;
    dragoner: boolean;
    /** Brettet kan ikke tapes før lykt nummer to i brettet er tent. */
    trygt: boolean;
}

export const BRETT: Brett[] = [
    {
        tittel: 'Vestre Moland',
        måned: 'SEPTEMBER 1786',
        sekunder: 95,
        visKalender: false,
        start: [0, 9],
        ut: [20, -20],
        bygder: [
            { navn: 'Vestre Moland', x: 0, z: 0, telemark: false, modus: 'står' },
            { navn: 'Birkeland', x: 13, z: -11, telemark: false, modus: 'går' },
        ],
        vei: [
            [0, 14],
            [0, 6],
            [6, -4],
            [13, -6],
            [20, -20],
        ],
        åser: [[-12, -8, 6]],
        fogder: [
            [-11, -3],
            [22, -2],
        ],
        førsteLykt: 10,
        navnPerLykt: 99,
        lyktFart: 1.1,
        fangTid: 0.8,
        dragoner: false,
        trygt: true,
    },
    {
        tittel: 'Nedenes',
        måned: 'OKTOBER 1786',
        sekunder: 80,
        visKalender: true,
        start: [0, 16],
        ut: [0, -24],
        bygder: [
            { navn: 'Landvik', x: -14, z: 4, telemark: false, modus: 'leter' },
            { navn: 'Eide', x: 13, z: 6, telemark: false, modus: 'leter' },
            { navn: 'Øyestad', x: -12, z: -14, telemark: false, modus: 'leter' },
            { navn: 'Froland', x: 14, z: -14, telemark: false, modus: 'leter' },
        ],
        vei: [
            [0, 20],
            [0, 8],
            [-14, 4],
            [0, 8],
            [13, 6],
            [0, -4],
            [-12, -14],
            [0, -4],
            [14, -14],
            [0, -4],
            [0, -24],
        ],
        åser: [[-1, -11, 5]],
        fogder: [
            [-23, -4],
            [4, -23],
        ],
        førsteLykt: 5,
        navnPerLykt: 5,
        lyktFart: 2.1,
        fangTid: 0.8,
        dragoner: false,
        trygt: false,
    },
    {
        tittel: 'Telemark',
        måned: 'NOVEMBER 1786',
        sekunder: 100,
        visKalender: true,
        start: [0, 16],
        ut: [0, -24],
        bygder: [
            { navn: 'Treungen', x: -13, z: 6, telemark: true, modus: 'leter' },
            { navn: 'Drangedal', x: 14, z: 2, telemark: true, modus: 'leter' },
            { navn: 'Nissedal', x: 2, z: -12, telemark: true, modus: 'leter' },
            { navn: 'Fyresdal', x: -14, z: -16, telemark: true, modus: 'leter' },
        ],
        vei: [
            [0, 22],
            [0, 10],
            [-13, 6],
            [0, 10],
            [14, 2],
            [2, -12],
            [-14, -16],
        ],
        åser: [
            [-6, -4, 5],
            [12, -14, 5],
        ],
        fogder: [
            [-24, -4],
            [17, -8],
        ],
        førsteLykt: 4,
        navnPerLykt: 4,
        lyktFart: 2.5,
        fangTid: 0.5,
        dragoner: true,
        trygt: false,
    },
];

/** Måneden som står i kartusjen, ut fra brett og hvor langt i brettet du er. */
export function månedNavn(brett: number, andel: number): string {
    if (brett === 0) return 'SEPTEMBER';
    if (brett === 1) return 'OKTOBER';
    return andel < 0.5 ? 'NOVEMBER' : 'DESEMBER';
}
