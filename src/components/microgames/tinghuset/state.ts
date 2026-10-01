// Tilstanden i Tinghuset: typene og en ny runde. Ingen regler her - de står i rules.ts
// (sende, avgjøre, par, kort) og game.ts (tiden, tilfanget, sinnet).

import { seeded, type Rng } from '../sim';
import { LEVELS, type CampId } from './levels';
import { TUNING } from './tuning';

/** lett = vanlig NS-medlem (grå), alvorlig = angiver/statspoliti (rødt hjørne), tykk = økonomisk. */
export type Kind = 'lett' | 'alvorlig' | 'tykk';
export type Route = 'forelegg' | 'rett';
export type FolderState = 'leir' | 'reiser' | 'ko' | 'behandles';
export type CardId = 'rettssal' | 'dommere' | 'rute' | 'felles' | 'forelegg';
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
}

export interface Verdict {
    id: number;
    sak: number;
    kind: Kind;
    route: Route;
    /** Måneden saken ble avgjort i (desimal). */
    mnd: number;
    /** Forelegg på en alvorlig sak. */
    mild: boolean;
    /** Straffen i år fengsel (0 = bot). */
    aar: number;
}

export interface Desk {
    kind: Route;
    /** Mapper som venter (id-er), første først. */
    queue: number[];
    /** Mappa som behandles nå (og tvillingen ved felles behandling). */
    current: number | null;
    joint: number | null;
    left: number;
    /** Hvor lang tid saken tar i alt (for visningen). */
    total: number;
}

export type GameEvent =
    | { kind: 'avgjort'; v: Verdict }
    | { kind: 'formildt'; v: Verdict }
    | { kind: 'jevnt'; a: Verdict; b: Verdict; poeng: number }
    | { kind: 'ulikt'; a: Verdict; b: Verdict }
    | { kind: 'ny'; f: Folder }
    | { kind: 'brett'; level: number }
    | { kind: 'kort' }
    | { kind: 'leir'; camp: CampId };

export interface Offer {
    cards: CardId[];
    /** Igjen før kortene legges bort (vanlig tid). */
    left: number;
}

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
    sinne: number;
    /** Hvor sinnet kom fra (to nyanser av rødt i måleren). */
    fraVent: number;
    fraMild: number;
    score: number;
    mult: number;
    jevne: number;
    ulike: number;
    avgjort: number;
    alvorligRett: number;
    formildt: number;
    valg: number;
    offer: Offer | null;
    nextOfferMnd: number;
    offers: number;
    dommere: number;
    /** Leirer med fast rute til forelegg (indekser i camps). */
    ruter: number[];
    ruteT: number;
    felles: boolean;
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
        desks: [{ kind: 'forelegg', queue: [], current: null, joint: null, left: 0, total: 0 }],
        waitingTwin: new Map(),
        nextId: 1,
        nextSak: 11,
        spawnT: 0.6,
        pendingTwins: [],
        firstSerious: false,
        firstThick: false,
        sinne: 0,
        fraVent: 0,
        fraMild: 0,
        score: 0,
        mult: 1,
        jevne: 0,
        ulike: 0,
        avgjort: 0,
        alvorligRett: 0,
        formildt: 0,
        valg: 0,
        offer: null,
        nextOfferMnd: TUNING.kort.forsteMnd,
        offers: 0,
        dommere: 0,
        ruter: [],
        ruteT: 0,
        felles: false,
        skjevest: null,
        events: [],
    };
}

export const folderById = (g: Game, id: number) => g.folders.find((f) => f.id === id);
