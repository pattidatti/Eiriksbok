// Tilstanden i Tinghuset: typene og en ny runde. Ingen regler her - de står i rules.ts
// (sende, avgjøre, par) og game.ts (tiden, tilfanget, sinnet).

import { seeded, type Rng } from '../sim';
import { LEVELS, type CampId } from './levels';

/** lett = vanlig NS-medlem (grå), alvorlig = angiver/statspoliti (rødt hjørne), tykk =
 *  profittør (økonomisk landssvik), utenlov = en kvinne med tysk kjæreste - ingen lov forbød det. */
export type Kind = 'lett' | 'alvorlig' | 'tykk' | 'utenlov';
/** avvis = «ingen lov - ingen sak»: saken henlegges uten straff. interner = straff uten dom
 *  (bare for tyskerjente-saker): gata roer seg, men det skjer uten lov og teller mot deg. */
export type Route = 'forelegg' | 'rett' | 'avvis' | 'interner';
export type FolderState = 'leir' | 'reiser' | 'ko' | 'behandles';
export type Cause = 'vent' | 'mild';

export interface Folder {
    id: number;
    /** Saksnummer. To mapper med samme nummer er et par (like saker). */
    sak: number;
    kind: Kind;
    /** Indeks i g.camps. */
    camp: number;
    state: FolderState;
    /** Skranken mappa er sendt til, -1 i leiren. */
    desk: number;
    /** Igjen av reisen langs streken (s). */
    travel: number;
    /** Tidspunktet mappa dukket opp (g.t). */
    born: number;
    /** Tvillingens id, eller null for en mappe uten par. */
    twin: number | null;
    /** Den sjeldne saken om drap og tortur (dødsstraff var mulig). */
    grov?: boolean;
}

export interface Verdict {
    id: number;
    sak: number;
    kind: Kind;
    route: Route;
    /** Skranken som avgjorde saken. */
    desk: number;
    /** Leiren mappa kom fra (den dømte sitter der etterpå). */
    camp: number;
    /** Måneden saken ble avgjort i (desimal). */
    mnd: number;
    /** Forelegg på en alvorlig sak (eller en ekte landssviksak som ble avvist). */
    mild: boolean;
    /** En sak uten lov som likevel ble straffet. */
    ulovlig: boolean;
    grov: boolean;
    /** Straffenivå-trinnet saken ble avgjort på (0 = 100 %). */
    trinn: number;
    /** Den trykte dommen: «7 år fengsel», «Bot og tap av rettigheter». */
    dom: string;
}

export interface Desk {
    kind: Route;
    /** Mapper som venter (id-er), første først. */
    queue: number[];
    /** Mappa som behandles nå. */
    current: number | null;
    left: number;
    /** Hvor lang tid saken tar i alt (for visningen). */
    total: number;
}

export type GameEvent =
    | { kind: 'avgjort'; v: Verdict }
    | { kind: 'formildt'; v: Verdict }
    | { kind: 'avvist'; v: Verdict }
    | { kind: 'ulovlig'; v: Verdict }
    | { kind: 'jevnt'; a: Verdict; b: Verdict; poeng: number }
    | { kind: 'ulikt'; a: Verdict; b: Verdict }
    | { kind: 'ny'; f: Folder }
    | { kind: 'brett'; level: number }
    | { kind: 'sal' }
    | { kind: 'interner' }
    | { kind: 'trinn'; trinn: number }
    | { kind: 'leir'; camp: CampId };

export interface Game {
    rng: Rng;
    mode: 'play' | 'won' | 'lost';
    cause: Cause | null;
    /** Spilte sekunder (vanlig tid, også mellomsider og sakte film). */
    t: number;
    /** Kalendermåned, desimal. 0 = mai 1945. */
    mnd: number;
    level: number;
    /** > 0: mellomside mellom brett, spillet står. */
    inter: number;
    camps: CampId[];
    folders: Folder[];
    desks: Desk[];
    /** Avgjorte mapper som venter på tvillingen sin, etter saksnummer. */
    waitingTwin: Map<number, Verdict>;
    nextId: number;
    nextSak: number;
    spawnT: number;
    pendingTwins: { at: number; sak: number; kind: Kind; camp: number; twinOf: number }[];
    /** Første alvorlige mappe på brett 2 kommer alene. */
    firstSerious: boolean;
    firstThick: boolean;
    /** Antall nye mapper (til saker uten lov i brett 1) og om den grove saken har kommet. */
    spawnN: number;
    grovDone: boolean;
    sinne: number;
    /** Hvor sinnet kom fra (to nyanser av rødt i måleren). */
    fraVent: number;
    fraMild: number;
    /** Sinnet fra saker uten lov som ble avvist (lys rød i måleren, aldri tapsårsak). */
    fraAvvist: number;
    /** Straffenivå-trinnet nå (for hendelsen når et trinn faller). */
    trinn: number;
    score: number;
    mult: number;
    jevne: number;
    ulike: number;
    avgjort: number;
    alvorligRett: number;
    formildt: number;
    /** Saker uten lov: avvist (riktig) og straffet likevel. */
    avvist: number;
    ulovlig: number;
    /** Trekket på slutten: straffet uten dom (regnes ved slutt). */
    trekk: number;
    valg: number;
    /** Leirer med fast rute til forelegg (indekser i camps). Brettene gir dem. */
    ruter: number[];
    ruteT: number;
    /** Det skjeveste paret (største avstand i måneder eller ulik vei). */
    skjevest: { a: Verdict; b: Verdict; skjevhet: number } | null;
    events: GameEvent[];
}

export function newGame(seed: number): Game {
    const lv = LEVELS[0];
    return {
        rng: seeded(seed),
        mode: 'play',
        cause: null,
        t: 0,
        mnd: 0,
        level: 0,
        inter: 0,
        camps: [...lv.leirer],
        folders: [],
        // Rettssalen kommer med den første angiveren (game.ts).
        desks: [
            { kind: 'forelegg', queue: [], current: null, left: 0, total: 0 },
            { kind: 'avvis', queue: [], current: null, left: 0, total: 0 },
        ],
        waitingTwin: new Map(),
        nextId: 1,
        nextSak: 11,
        spawnT: 0.6,
        pendingTwins: [],
        firstSerious: false,
        firstThick: false,
        spawnN: 0,
        grovDone: false,
        sinne: 0,
        fraVent: 0,
        fraMild: 0,
        fraAvvist: 0,
        trinn: 0,
        score: 0,
        mult: 1,
        jevne: 0,
        ulike: 0,
        avgjort: 0,
        alvorligRett: 0,
        formildt: 0,
        avvist: 0,
        ulovlig: 0,
        trekk: 0,
        valg: 0,
        ruter: [],
        ruteT: 0,
        skjevest: null,
        events: [],
    };
}

export const folderById = (g: Game, id: number) => g.folders.find((f) => f.id === id);
