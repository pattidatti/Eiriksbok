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
    /** Hvilken vei (indeks i `veier`). Standard 0. */
    vei?: number;
    /** Batteri: står fast her (utenfor veien). */
    pos?: [number, number];
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
    /** Fiendens fart ganges med dette (en rolig åpning skal ikke bli treg). */
    fart?: number;
    /** Tåke: egne øyne ganges med dette (Bastogne). Nettet ser fortsatt det noen ser. */
    sikt?: number;
    /** Forsyninger før denne bølgen, i stedet for `ECONOMY.perBølge` (omringet). */
    inntekt?: number;
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
    /** Veiene fienden følger, fra inngang til utgang. Vei 1 og 2 kan møte vei 0 underveis. */
    veier: [number, number][][];
    hq: [number, number];
    /** Radioringen rundt kommandovogna (ruter). Standard `RADIO.rekkevidde`. */
    ring?: number;
    /** En elv på tvers av kartet (x fra, x til); veien krysser den på en bru. */
    elv?: [number, number];
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
        // Kommandovogna står langt fram og ringen er stor: eleven kan stille opp nær der fienden
        // kommer inn, og kampen begynner noen sekunder etter «Bølge» (eier: «kjedelig å vente»).
        veier: [[[16.6, 2], [12.5, 2], [12.5, 6.5], [7.5, 6.5], [7.5, 3], [-0.6, 3]]],
        hq: [4.5, 5.5],
        ring: 7,
        start: 10,
        seier: 'Evakueringen lyktes. 338 000 soldater kom seg over til England.',
        lærdom:
            'I 1940 hadde tyskerne radio i hver stridsvogn. Vogner, infanteri og fly jobbet sammen, og det var derfor lynkrigen gikk så fort.',
        waves: [
            {
                groups: [{ t: 0.5, kind: 'einf', n: 5, gap: 1.8 }],
                pool: ['inf', 'vogn'],
                fast: ['inf', 'vogn', 'inf'],
                kanaler: 0,
                fart: 1.6,
            },
            {
                groups: [
                    { t: 0.5, kind: 'einf', n: 3, gap: 2 },
                    { t: 5, kind: 'epak', n: 1, gap: 1 },
                    { t: 9, kind: 'einf', n: 3, gap: 2 },
                ],
                pool: ['inf', 'vogn'],
                kanaler: 3,
                fart: 1.3,
                nytt: {
                    key: 'radio',
                    tittel: 'Radioen',
                    tekst: 'Fiendens panservern gjemmer seg. Bare infanteriet ser det. Klikk vogna og infanteriet innenfor ringen, så deler de øyne.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'einf', n: 4, gap: 2 },
                    { t: 6, kind: 'epak', n: 2, gap: 4 },
                    { t: 12, kind: 'evogn', n: 1, gap: 7 },
                    { t: 22, kind: 'einf', n: 3, gap: 2 },
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
        veier: [
            [[16.6, 7.5], [12, 7.5], [12, 2.5], [7.5, 2.5], [7.5, 7], [3.5, 7], [3.5, 4], [-0.6, 4]],
            [[10, -0.6], [10, 2.5], [7.5, 2.5], [7.5, 7], [3.5, 7], [3.5, 4], [-0.6, 4]],
        ],
        hq: [1.5, 6.5],
        ring: 6,
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
                    { t: 1, kind: 'evogn', n: 2, gap: 3 },
                    { t: 12, kind: 'einf', n: 4, gap: 2 },
                    { t: 20, kind: 'evogn', n: 1, gap: 3, vei: 1 },
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
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [14.5, 1] },
                    { t: 6, kind: 'epak', n: 2, gap: 3 },
                    { t: 10, kind: 'evogn', n: 2, gap: 3, vei: 1 },
                    { t: 24, kind: 'einf', n: 4, gap: 1.6 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv'],
                kanaler: 3,
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
        veier: [
            [[16.6, 1.5], [9, 1.5], [9, 8], [4, 8], [4, 2.5], [-0.6, 2.5]],
            [[16.6, 9.2], [13, 9.2], [13, 5], [9, 5], [9, 8], [4, 8], [4, 2.5], [-0.6, 2.5]],
        ],
        hq: [1.5, 5.5],
        ring: 6,
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
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [15, 6.5] },
                    { t: 4, kind: 'evogn', n: 3, gap: 3, vei: 1 },
                    { t: 8, kind: 'epak', n: 2, gap: 3 },
                    { t: 14, kind: 'einf', n: 5, gap: 1.6 },
                    { t: 24, kind: 'estuka', n: 3, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag'],
                fast: ['jag', 'pv', 'inf'],
                kanaler: 4,
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
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [15, 6.5] },
                    { t: 3, kind: 'ejag', n: 2, gap: 2 },
                    { t: 8, kind: 'epak', n: 3, gap: 2.5, vei: 1 },
                    { t: 12, kind: 'einf', n: 6, gap: 1.4 },
                    { t: 18, kind: 'estuka', n: 3, gap: 2 },
                    { t: 22, kind: 'evogn', n: 3, gap: 3, vei: 1 },
                    { t: 30, kind: 'ejag', n: 2, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb'],
                fast: ['bomb', 'jag', 'pv'],
                kanaler: 4,
                nytt: {
                    key: 'bomb',
                    tittel: 'Bombefly',
                    tekst: 'Bombeflyene treffer det nettet ser. Men fiendens jagere venter. Koble jagerne i nettet sammen med bombeflyene.',
                },
            },
        ],
    },
    {
        id: 'normandie',
        sted: 'Normandie, Frankrike',
        dato: 'Juni 1944',
        bånd: 'NORMANDIE · JUNI 1944',
        veier: [
            [[16.6, 3], [12, 3], [12, 6], [7, 6], [7, 4], [-0.6, 4]],
            [[16.6, 8.5], [10, 8.5], [10, 6], [7, 6], [7, 4], [-0.6, 4]],
        ],
        hq: [2, 6.5],
        ring: 6,
        start: 30,
        seier: 'Brohodet holdt. I slutten av august var over to millioner allierte soldater i Frankrike.',
        lærdom:
            'Natt til 6. juni 1944 hoppet fallskjermsoldater ut bak de tyske linjene. De landet spredt og alene, men med radio kunne de samle seg og holde bruer og veikryss til styrkene fra stranda kom fram.',
        waves: [
            {
                groups: [
                    { t: 1, kind: 'einf', n: 5, gap: 2 },
                    { t: 10, kind: 'einf', n: 4, gap: 2, vei: 1 },
                    { t: 16, kind: 'evogn', n: 1, gap: 1 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'fsk'],
                fast: ['fsk', 'fsk', 'inf'],
                kanaler: 4,
                nytt: {
                    key: 'fsk',
                    lapp: 'Kan hoppe ut bak fiendens linjer',
                    kort: 0,
                    tittel: 'Fallskjermsoldater',
                    tekst: 'Fallskjermsoldatene kan hoppe ut hvor som helst. I nettet sender de radioen videre, alene er de omringet.',
                },
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 2, gap: 3 },
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [14.5, 0.8] },
                    { t: 4, kind: 'einf', n: 5, gap: 1.8, vei: 1 },
                    { t: 8, kind: 'epak', n: 1, gap: 3 },
                    { t: 14, kind: 'estuka', n: 2, gap: 3 },
                    { t: 20, kind: 'evogn', n: 1, gap: 3, vei: 1 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'fsk'],
                kanaler: 4,
                sperreild: true,
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 2, gap: 3.5 },
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [14.5, 0.8] },
                    { t: 10, kind: 'evogn', n: 1, gap: 3, vei: 1 },
                    { t: 14, kind: 'einf', n: 4, gap: 1.8 },
                    { t: 16, kind: 'epak', n: 1, gap: 3, vei: 1 },
                    { t: 20, kind: 'estuka', n: 2, gap: 3 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb', 'fsk'],
                kanaler: 4,
                sperreild: true,
            },
        ],
    },
    {
        id: 'bastogne',
        sted: 'Bastogne, Belgia',
        dato: 'Desember 1944',
        bånd: 'BASTOGNE · DESEMBER 1944',
        // Omringet: tre veier inn mot byen, og ingen vei ut.
        veier: [
            [[16.6, 4], [12, 4], [12, 6.5], [8, 6.5], [8, 5], [5.5, 5]],
            [[9.5, -0.6], [9.5, 2.5], [5.5, 2.5], [5.5, 5]],
            [[11, 10.6], [11, 8.5], [5.5, 8.5], [5.5, 5]],
        ],
        hq: [2.5, 5],
        ring: 6,
        start: 27,
        seier: 'Bastogne holdt til de amerikanske stridsvognene brøt gjennom ringen 26. desember.',
        lærdom:
            'I tåka ved Bastogne kunne ingen fly hjelpe. Soldatene i byen var omringet og hadde lite ammunisjon. Da skyene lettet 23. desember, slapp flyene forsyninger og angrep de tyske kolonnene.',
        waves: [
            {
                groups: [
                    { t: 1, kind: 'einf', n: 5, gap: 2 },
                    { t: 6, kind: 'einf', n: 4, gap: 2, vei: 1 },
                    { t: 12, kind: 'einf', n: 4, gap: 2, vei: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'fsk'],
                kanaler: 4,
                sikt: 0.6,
                nytt: { key: 'tåke', lapp: 'Tåke: bare nettet ser langt nå', tittel: 'Tåke', tekst: 'I tåka ser hver enhet bare det som står rett foran den. Nettet samler det alle ser.' },
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 1, gap: 3 },
                    { t: 3, kind: 'ebatt', n: 1, gap: 1, pos: [14.5, 8.8] },
                    { t: 6, kind: 'einf', n: 5, gap: 1.8, vei: 2 },
                    { t: 10, kind: 'epak', n: 1, gap: 3, vei: 1 },
                    { t: 18, kind: 'evogn', n: 1, gap: 3, vei: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'fsk'],
                kanaler: 4,
                sikt: 0.6,
                sperreild: true,
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 2, gap: 3 },
                    { t: 3, kind: 'ebatt', n: 1, gap: 1, pos: [14.5, 8.8] },
                    { t: 8, kind: 'evogn', n: 1, gap: 3, vei: 1 },
                    { t: 10, kind: 'einf', n: 4, gap: 1.8, vei: 2 },
                    { t: 14, kind: 'epak', n: 1, gap: 3 },
                    { t: 16, kind: 'ejag', n: 2, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb', 'fsk'],
                fast: ['bomb', 'jag', 'inf'],
                kanaler: 4,
                inntekt: 16,
                sperreild: true,
                nytt: { key: 'klart', lapp: 'Skyene letter! Flyene kan hjelpe igjen', kort: 0, tittel: 'Klarvær', tekst: 'Skyene letter. Nå kan flyene slippe forsyninger og angripe.' },
            },
        ],
    },
    {
        id: 'rhinen',
        sted: 'Remagen, Tyskland',
        dato: 'Mars 1945',
        bånd: 'RHINEN · MARS 1945',
        // Brohodet: de allierte har tatt brua og holder østsiden av elva.
        veier: [
            [[16.6, 2], [12, 2], [12, 6.5], [6, 6.5], [6, 4.5], [-0.6, 4.5]],
            [[13.5, 10.6], [13.5, 8.5], [8.5, 8.5], [8.5, 6.5], [6, 6.5], [6, 4.5], [-0.6, 4.5]],
        ],
        hq: [3, 7],
        ring: 6,
        elv: [0.4, 1.8],
        start: 34,
        seier: 'De allierte kom over Rhinen. Seks uker senere var krigen i Europa over.',
        lærdom:
            'I mars 1945 tok amerikanerne brua ved Remagen, og 16 000 fallskjermsoldater hoppet over Rhinen. Nå kunne de allierte koble infanteri, vogner, artilleri og fly sammen med radio, og de hadde mer av alt.',
        waves: [
            {
                groups: [
                    { t: 1, kind: 'einf', n: 5, gap: 1.8 },
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [15, 5] },
                    { t: 6, kind: 'epak', n: 1, gap: 3 },
                    { t: 10, kind: 'evogn', n: 2, gap: 3 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'fsk'],
                kanaler: 4,
                sperreild: true,
                nytt: { key: 'brua', lapp: 'Hold brua! Kommer de over, taper du', tittel: 'Brua ved Remagen', tekst: 'Fienden vil ta tilbake brua. Slipper de over elva, er slaget tapt.' },
            },
            {
                groups: [
                    { t: 1, kind: 'estuka', n: 2, gap: 2.5 },
                    { t: 3, kind: 'evogn', n: 2, gap: 3, vei: 1 },
                    { t: 4, kind: 'ebatt', n: 1, gap: 1, pos: [15, 5] },
                    { t: 8, kind: 'einf', n: 5, gap: 1.5 },
                    { t: 14, kind: 'epak', n: 1, gap: 3, vei: 1 },
                    { t: 20, kind: 'ejag', n: 2, gap: 2 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb', 'fsk'],
                fast: ['fsk', 'fsk', 'jag'],
                kanaler: 4,
                sperreild: true,
                nytt: { key: 'varsity', lapp: 'Hopp bak fienden, der batteriet står', kort: 0, tittel: 'Over Rhinen', tekst: 'Fallskjermsoldatene hopper bak fiendens linjer og finner det skjulte artilleriet.' },
            },
            {
                groups: [
                    { t: 1, kind: 'evogn', n: 2, gap: 3 },
                    { t: 2, kind: 'ebatt', n: 1, gap: 1, pos: [15, 5] },
                    { t: 6, kind: 'evogn', n: 2, gap: 3, vei: 1 },
                    { t: 9, kind: 'einf', n: 5, gap: 1.4 },
                    { t: 13, kind: 'epak', n: 1, gap: 3, vei: 1 },
                    { t: 17, kind: 'estuka', n: 2, gap: 2.5 },
                    { t: 21, kind: 'ejag', n: 2, gap: 2 },
                    { t: 28, kind: 'einf', n: 3, gap: 1.8, vei: 1 },
                ],
                pool: ['inf', 'vogn', 'art', 'pv', 'lv', 'jag', 'bomb', 'fsk'],
                kanaler: 4,
                sperreild: true,
            },
        ],
    },
];

export const TOTAL_WAVES = SLAG.reduce((n, s) => n + s.waves.length, 0);
