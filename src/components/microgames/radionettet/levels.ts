import type { EKind, Kind } from './tuning';

// Slagene og opptrappingen. Hver bølge innfører én ting (designbrief punkt 11).
// Kartet er 16 x 10 ruter: x mot høyre, z mot kamera. Fienden kommer inn fra høyre.

export interface Group {
    /** Sekunder etter at bølgen starter. */
    t: number;
    kind: EKind;
    n: number;
    /** Sekunder mellom hver i gruppa. */
    gap: number;
}

export interface Nytt {
    key: string;
    tittel: string;
    tekst: string;
    /** Kort lapp (maks 7 ord) i stedet for et lærings-øyeblikk. Maks tre øyeblikk per runde, så
     *  bare samvirket (radio, artilleri, bombefly) får øyeblikk; resten får en lapp ved kortet. */
    lapp?: string;
    /** Kortet i butikken lappen peker på. */
    kort?: number;
}

export interface WaveDef {
    groups: Group[];
    /** Hva butikken kan by på. */
    pool: Kind[];
    /** Faste kort i opplæringen (erstatter trekning første gang). */
    fast?: Kind[];
    /** Radiokanaler kommandovogna har i denne bølgen (0 = ingen radio ennå). */
    kanaler: number;
    /** Fiendens artilleri kutter en tilfeldig radiolinje så ofte (s). Uten = aldri. */
    kutt?: number;
    /** Sperreild tilgjengelig. */
    sperreild?: boolean;
    /** Det nye i bølgen: lærings-øyeblikket når planleggingen starter. */
    nytt?: Nytt;
}

export interface SlagDef {
    id: string;
    sted: string;
    dato: string;
    /** Banneret øverst. */
    bånd: string;
    /** Veien fienden følger, fra inngang til utgang. */
    vei: [number, number][];
    hq: [number, number];
    /** Forsyninger ved starten av slaget. */
    start: number;
    waves: WaveDef[];
    seier: string;
    /** Læringspunkt etter slaget («Dette skjedde»). */
    lærdom: string;
}

export const MAP_W = 16;
export const MAP_D = 10;
/** Flyplassen: der jager- og bombefly står mellom toktene. */
export const FLYPLASS: [number, number] = [-1.6, 8.6];

export const SLAG: SlagDef[] = [
    {
        id: 'dunkerque',
        sted: 'Dunkerque, Frankrike',
        dato: 'Mai 1940',
        bånd: 'DUNKERQUE · MAI 1940',
        vei: [[16.6, 2], [11, 2], [11, 6.5], [6, 6.5], [6, 3], [-0.6, 3]],
        hq: [2, 5.5],
        start: 8,
        seier: 'Evakueringen lyktes. 338 000 soldater kom seg over til England.',
        lærdom:
            'I 1940 hadde tyskerne radio i hver stridsvogn. Vogner, infanteri og fly jobbet sammen, og det var derfor lynkrigen gikk så fort.',
        waves: [
            {
                groups: [{ t: 1, kind: 'einf', n: 4, gap: 3 }],
                pool: ['inf', 'vogn'],
                fast: ['inf', 'vogn', 'inf'],
                kanaler: 0,
            },
            {
                groups: [
                    { t: 1, kind: 'einf', n: 3, gap: 2.5 },
                    { t: 7, kind: 'epak', n: 1, gap: 1 },
                    { t: 12, kind: 'einf', n: 3, gap: 2.5 },
                ],
                pool: ['inf', 'vogn'],
                kanaler: 3,
                nytt: {
                    key: 'radio',
                    tittel: 'Radioen',
                    tekst: 'Fiendens panservern gjemmer seg. Bare infanteriet ser det. Klikk vogna og infanteriet innenfor ringen, så deler de øyne.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'einf', n: 4, gap: 2 },
                    { t: 6, kind: 'epak', n: 2, gap: 3 },
                    { t: 10, kind: 'evogn', n: 2, gap: 4 },
                    { t: 18, kind: 'einf', n: 4, gap: 2 },
                ],
                pool: ['inf', 'vogn'],
                fast: ['inf', 'inf', 'inf'],
                kanaler: 3,
                nytt: {
                    key: 'veteran',
                    lapp: 'Tre like på samme rute: veteran',
                    kort: 0,
                    tittel: 'Veteraner',
                    tekst: 'Legg tre like enheter på samme rute. Da blir de én veteran som tåler og slår over dobbelt så hardt.',
                },
            },
        ],
    },
    {
        id: 'alamein',
        sted: 'El Alamein, Egypt',
        dato: 'Oktober 1942',
        bånd: 'EL ALAMEIN · OKTOBER 1942',
        vei: [[16.6, 7.5], [12, 7.5], [12, 2.5], [7.5, 2.5], [7.5, 7], [3.5, 7], [3.5, 4], [-0.6, 4]],
        hq: [1.5, 6.5],
        start: 14,
        seier: 'Panserarmeen ble stoppet. Det var første gang de allierte vant et stort slag på landjorda.',
        lærdom:
            'Ved El Alamein hadde britene mer artilleri enn fienden, og de brukte det på det infanteriet og flyene så. Artilleri som ikke ser målet, skyter i blinde.',
        waves: [
            {
                groups: [
                    { t: 1, kind: 'einf', n: 6, gap: 1.6 },
                    { t: 14, kind: 'einf', n: 6, gap: 1.6 },
                ],
                pool: ['inf', 'vogn', 'art'],
                fast: ['art', 'inf', 'vogn'],
                kanaler: 3,
                nytt: {
                    key: 'art',
                    tittel: 'Artilleri',
                    tekst: 'Artilleriet skyter langt, men ser nesten ingenting selv. Koble det i nettet, så skyter det alt infanteriet ser.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 3, gap: 3 },
                    { t: 12, kind: 'einf', n: 4, gap: 2 },
                    { t: 18, kind: 'evogn', n: 2, gap: 3 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv'],
                fast: ['pv', 'pv', 'inf'],
                kanaler: 3,
                nytt: {
                    key: 'pv',
                    lapp: 'Panservern knuser vogner, taper mot infanteri',
                    kort: 0,
                    tittel: 'Panservern',
                    tekst: 'Panservernet er billig og knuser stridsvogner, men taper mot infanteri. Still det bak ditt eget infanteri.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'einf', n: 5, gap: 1.5 },
                    { t: 6, kind: 'epak', n: 2, gap: 3 },
                    { t: 10, kind: 'evogn', n: 3, gap: 3 },
                    { t: 22, kind: 'einf', n: 6, gap: 1.4 },
                    { t: 26, kind: 'evogn', n: 2, gap: 3 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv'],
                kanaler: 3,
                kutt: 14,
                sperreild: true,
                nytt: {
                    key: 'sperreild',
                    lapp: 'Nytt: sperreild! Trykk S i bølgen',
                    tittel: 'Sperreild',
                    tekst: 'Du har én sperreild. Trykk S og klikk et sted på veien. Granatene faller to sekunder senere.',
                },
            },
        ],
    },
    {
        id: 'kursk',
        sted: 'Kursk, Sovjetunionen',
        dato: 'Juli 1943',
        bånd: 'KURSK · JULI 1943',
        vei: [[16.6, 1.5], [9, 1.5], [9, 8], [4, 8], [4, 2.5], [-0.6, 2.5]],
        hq: [1.5, 5.5],
        start: 24,
        seier: 'Den tyske kilen ble brutt. Etter Kursk var det Sovjetunionen som angrep.',
        lærdom:
            'Ved Kursk gravde sovjetiske soldater dype belter av panservern og infanteri, og kampflyene deres dekket bakken. Bombefly uten jagere ble skutt ned i hopetall.',
        waves: [
            {
                groups: [
                    { t: 1, kind: 'einf', n: 5, gap: 2 },
                    { t: 5, kind: 'estuka', n: 2, gap: 4 },
                    { t: 14, kind: 'einf', n: 4, gap: 2 },
                    { t: 20, kind: 'estuka', n: 3, gap: 3 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv'],
                fast: ['lv', 'lv', 'inf'],
                kanaler: 3,
                kutt: 12,
                nytt: {
                    key: 'lv',
                    lapp: 'Luftvern skyter ned stupbomberne',
                    kort: 0,
                    tittel: 'Luftvern',
                    tekst: 'Stupbomberne går etter enhetene i radionettet og kutter linja. Luftvern skyter dem ned. Koble opp igjen når en linje ryker.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'estuka', n: 3, gap: 2.5 },
                    { t: 4, kind: 'evogn', n: 3, gap: 3 },
                    { t: 8, kind: 'epak', n: 2, gap: 3 },
                    { t: 14, kind: 'einf', n: 5, gap: 1.6 },
                    { t: 24, kind: 'estuka', n: 3, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag'],
                fast: ['jag', 'pv', 'inf'],
                kanaler: 4,
                kutt: 10,
                nytt: {
                    key: 'jag',
                    lapp: 'Jagere i nettet ser fly langt unna',
                    kort: 0,
                    tittel: 'Jagerfly',
                    tekst: 'Jagerne patruljerer over kartet. I nettet ser de fiendtlige fly langt unna og rekker å møte dem. Du har nå fire kanaler.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 3, gap: 2.5 },
                    { t: 3, kind: 'ejag', n: 2, gap: 2 },
                    { t: 8, kind: 'epak', n: 3, gap: 2.5 },
                    { t: 12, kind: 'einf', n: 6, gap: 1.4 },
                    { t: 18, kind: 'estuka', n: 3, gap: 2 },
                    { t: 22, kind: 'evogn', n: 4, gap: 2.5 },
                    { t: 30, kind: 'ejag', n: 2, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb'],
                fast: ['bomb', 'jag', 'pv'],
                kanaler: 4,
                kutt: 9,
                nytt: {
                    key: 'bomb',
                    tittel: 'Bombefly',
                    tekst: 'Bombeflyene treffer det nettet ser. Men fiendens jagere venter. Koble jagerne i nettet sammen med bombeflyene.',
                },
            },
        ],
    },
];

export const TOTAL_WAVES = SLAG.reduce((n, s) => n + s.waves.length, 0);
