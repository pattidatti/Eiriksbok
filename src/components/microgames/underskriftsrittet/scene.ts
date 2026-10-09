// Visningstilstanden: det 3D-verdenen trenger å huske for juicen (blekkstreker på vei,
// når seglet ble trykket, døra på fogdgården som slås opp, risting, epilogen). Spillreglene
// vet ingenting om dette. Én ref som komponenten fyller fra hendelsene og verden leser i useFrame.

export type Fase = 'spill' | 'fanget' | 'epilog' | 'stille';

export interface Strek {
    tun: number;
    hus: number;
    dristig: boolean;
    født: number;
}

export interface Scene {
    /** Ekte sekunder siden start (går også i sakte film og i fryst bilde). */
    tid: number;
    /** Nye blekkstreker som verden henter og flyr fra huset til hesten. */
    streker: Strek[];
    /** Når seglet ble trykket på hvert tun (ekte tid), -1 = ikke ennå. */
    segl: number[];
    /** Når døra på hver fogdgård sist ble slått opp. */
    blaff: number[];
    fase: Fase;
    faseFra: number;
    /** Skjermrystelse som svinner i ekte tid. */
    rist: number;
    /** Lyset: 0 = natt, 1 = morgen (kommisjonen satt ned), 2 = mars (kaldt). */
    lys: number;
}

export function nyScene(): Scene {
    return { tid: 0, streker: [], segl: [], blaff: [], fase: 'spill', faseFra: 0, rist: 0, lys: 0 };
}

export function settFase(s: Scene, f: Fase) {
    s.fase = f;
    s.faseFra = s.tid;
}
