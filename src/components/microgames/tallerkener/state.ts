// Typene i Elleve år og en ny runde. Ingen regler her.

import { seeded, type Rng } from '../sim';
import { SLOTS } from './levels';
import { TUNING, type PlateKind } from './tuning';

export interface Plate {
    kind: PlateKind;
    /** Snurr: under `slakk` vakler den, over `overspinn` gløder den, over `flyr` flyr den. */
    spin: number;
    /** Kombo-ganger (x2, x3 ...) og hvor lenge den varer. */
    kombo: number;
    komboT: number;
    /** Den vakler nå (brukt til å telle valg én gang per vakling). */
    vakler: boolean;
}

export type SlotState = 'stengt' | 'tom' | 'aktiv' | 'tatt';

export interface Slot {
    id: number;
    state: SlotState;
    plate: Plate | null;
    /** Har stanga hatt en tallerken før? Da koster en ny gull. */
    brukt: boolean;
}

export interface Page {
    slot: number;
    kind: PlateKind;
    /** Sekunder igjen før siden går ut igjen. */
    t: number;
    pris: number;
}

export interface Tin {
    /** 'oppe' = i taket, 'nede' = i rekkevidde, 'oser' = snurrer foran rampen og gir gull. */
    state: 'oppe' | 'nede' | 'oser';
    /** Tid igjen i tilstanden. */
    t: number;
    /** Tid til neste gang den senker seg. */
    neste: number;
    /** Gull den øser denne gangen (totalt). */
    gull: number;
}

export type GameEvent =
    | { type: 'aar'; aar: number }
    | { type: 'brett'; nr: number }
    | { type: 'faller'; slot: number }
    | { type: 'flyr'; slot: number }
    | { type: 'kombo'; n: number }
    | { type: 'tittel' }
    | { type: 'side'; slot: number }
    | { type: 'ny'; slot: number }
    | { type: 'tin-ned' }
    | { type: 'parlament'; slot: number }
    | { type: 'storm' }
    | { type: 'seier' }
    | { type: 'slutt' };

export type Cause = 'kiste' | 'parlament';

export interface Game {
    rng: Rng;
    /** Spilte sekunder. */
    t: number;
    mode: 'play' | 'over';
    /** Nådde 1640 med gull i kista. */
    won: boolean;
    cause: Cause | null;
    gull: number;
    slots: Slot[];
    page: Page | null;
    pageNeste: number;
    tin: Tin;
    /** Stenger parlamentet har tatt (heist opp i taket). */
    tatt: number;
    /** Året da parlamentets tallerken ble tatt første gang (null = aldri). */
    forsteParlament: number | null;
    /** Rundemultiplikatoren: øker med kombo, nullstilles når en tallerken faller. */
    mult: number;
    score: number;
    /** Gull fra egne tallerkener (uten parlamentet). */
    egetGull: number;
    titler: number;
    faller: number;
    flyr: number;
    kombos: number;
    valg: number;
    sistAar: number;
    sistBrett: number;
    events: GameEvent[];
}

export function newPlate(kind: PlateKind): Plate {
    return { kind, spin: TUNING.snurr.start, kombo: 1, komboT: 0, vakler: false };
}

export function newGame(seed: number): Game {
    const slots: Slot[] = SLOTS.map((_, id) => ({
        id,
        state: 'stengt',
        plate: null,
        brukt: false,
    }));
    slots[0].state = 'aktiv';
    slots[0].plate = newPlate('skip');
    slots[0].plate.spin = 0.45;
    slots[0].brukt = true;
    return {
        rng: seeded(seed),
        t: 0,
        mode: 'play',
        won: false,
        cause: null,
        gull: TUNING.kiste.start,
        slots,
        page: null,
        pageNeste: 0,
        tin: { state: 'oppe', t: 0, neste: 0, gull: 0 },
        tatt: 0,
        forsteParlament: null,
        mult: 1,
        score: 0,
        egetGull: 0,
        titler: 0,
        faller: 0,
        flyr: 0,
        kombos: 0,
        valg: 1,
        sistAar: TUNING.tid.start,
        sistBrett: 1,
        events: [],
    };
}
