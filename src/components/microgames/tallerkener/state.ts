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
    /** Gull stanga har gitt i år (taket er `TUNING.typer[kind].tak`). */
    aarGull: number;
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
    | { type: 'protest'; slot: number }
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
    score: number;
    /** Gull fra egne tallerkener (uten parlamentet). */
    egetGull: number;
    titler: number;
    faller: number;
    flyr: number;
    kombos: number;
    /** Ærlige valg: når to eller flere vakler samtidig, og hver gang parlamentet senker seg. */
    valg: number;
    /** Neste bue kan ikke treffe før dette tidspunktet (nedkjøling). */
    bueKlar: number;
    /** Sekunder til neste protest (fra `TUNING.protest.fra`). */
    protestNeste: number;
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
        aarGull: 0,
    }));
    TUNING.start.forEach((kind, i) => {
        const s = slots[i];
        s.state = 'aktiv';
        s.plate = newPlate(kind);
        s.plate.spin = 0.45 + 0.1 * i;
        s.brukt = true;
    });
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
        score: 0,
        egetGull: 0,
        titler: 0,
        faller: 0,
        flyr: 0,
        kombos: 0,
        valg: 0,
        bueKlar: 0,
        protestNeste: TUNING.protest.hver,
        sistAar: TUNING.tid.start,
        sistBrett: 1,
        events: [],
    };
}
