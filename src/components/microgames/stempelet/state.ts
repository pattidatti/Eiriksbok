// Tilstanden i Stempelet. Ren data uten React, så simuleringen og nettleseren deler den.

import { seeded, type Rng } from '../sim';
import { PLASSER, PERSONER } from './levels';
import { TUNING } from './tuning';

export type Årsak = 'papirløse' | 'stengt';

export interface Pass {
    id: number;
    plass: number;
    person: number;
    /** Sekunder igjen på båndet. */
    igjen: number;
    /** Sekunder til personen reiser videre med gyldig pass. */
    blir: number;
    /** Sekunder et fullt bånd varer for dette passet. */
    varer: number;
    /** Kan personen betale gebyret? Fast for personen: mynt eller tom lomme. */
    betaler: boolean;
    /** Lomma når passet er til fornyelse: 'mynt', 'tom', eller null (gyldig ennå). */
    lomme: 'mynt' | 'tom' | null;
    /** Grå sak: personen ble papirløs og har kommet tilbake. Koster mer å stemple. */
    grå: boolean;
    /** Sekunder passet har ristet. */
    rist: number;
    /** Ganger denne personen er fornyet i runden. */
    fornyet: number;
    /** Stempelmerker på passet (for visningen): fullt eller skjevt. */
    merker: boolean[];
}

export interface Venter {
    person: number;
    /** Sekunder til personen kommer tilbake på bordet. */
    om: number;
}

export interface Frimerke {
    /** Sekunder igjen før arket glir bort. */
    igjen: number;
}

export interface Stempel {
    x: number;
    z: number;
    /** Der pekeren er. */
    tx: number;
    tz: number;
    /** Sekunder holdt inne, eller null når det ikke holdes. */
    hold: number | null;
}

/** Det spillet vil vise eleven. Komponenten tømmer lista hver frame. */
export type Ut =
    | { type: 'slag'; id: number; fullt: boolean; lomme: 'mynt' | 'tom'; grå: boolean }
    | { type: 'gyldig'; id: number }
    | { type: 'tomKasse'; id: number }
    | { type: 'bom' }
    | { type: 'frimerke' }
    | { type: 'frimerkeKom' }
    | { type: 'frimerkeBort' }
    | { type: 'utløpt'; id: number; plass: number }
    | { type: 'tilbake'; id: number }
    | { type: 'forny'; id: number; lomme: 'mynt' | 'tom' }
    | { type: 'nyttPass'; id: number }
    | { type: 'reist'; id: number; plass: number; person: number }
    | { type: 'husleie'; beløp: number }
    | { type: 'nyttÅr'; år: number; brett: number }
    | { type: 'arkiv'; person: number }
    | { type: 'tap'; årsak: Årsak }
    | { type: 'seier' };

export interface Game {
    rng: Rng;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    /** Spilte sekunder. */
    t: number;
    /** Brettet (0-7). */
    brett: number;
    /** Sekunder inn i året. */
    iÅr: number;
    kasse: number;
    pass: Pass[];
    skuff: Venter[];
    frimerke: Frimerke | null;
    /** Når frimerkearket kommer i år (sekunder inn i året), eller null. */
    frimerkeVed: number | null;
    stempel: Stempel;
    /** Til neste nye pass. */
    nyOm: number;
    nesteId: number;
    /** Saker fornyet (poengene). */
    saker: number;
    /** Fulle slag på rad og lengste rekke. */
    rekke: number;
    lengsteRekke: number;
    /** Beslutningspunkter så langt (et pass blir til fornyelse, et ark kommer, en grå sak kommer tilbake). */
    valg: number;
    /** Teller for jevn fordeling av tomme lommer (se trekkBetaler). */
    tomTeller: number;
    /** Er første pass med tom lomme kommet (brett 2)? */
    førsteTom: boolean;
    /** Personer som har fått arkivkortet i runden. */
    arkiv: number[];
    /** Personer som reiste videre med gyldig pass. */
    hjulpet: number;
    /** Hendelser til visningen (lyd, lapper). Tømmes av komponenten og av simuleringen. */
    ut: Ut[];
}

export function newGame(seed: number): Game {
    const rng = seeded(seed);
    const g: Game = {
        rng,
        mode: 'play',
        årsak: null,
        t: 0,
        brett: 0,
        iÅr: 0,
        kasse: TUNING.kasse.start,
        pass: [],
        skuff: [],
        frimerke: null,
        frimerkeVed: null,
        stempel: { x: 0, z: 2.2, tx: 0, tz: 2.2, hold: null },
        nyOm: 7,
        nesteId: 1,
        saker: 0,
        rekke: 0,
        lengsteRekke: 0,
        valg: 0,
        tomTeller: 0,
        førsteTom: false,
        arkiv: [],
        hjulpet: 0,
        ut: [],
    };
    g.tomTeller = rng() * 0.5;
    // Tre pass ved start, alle med mynt. Det første rister.
    TUNING.pass.start.forEach((andel, i) => {
        const p = lagPass(g, i, ledigPerson(g));
        p.igjen = p.varer * andel;
    });
    return g;
}

export function varighet(g: Game): number {
    const { varerMin, varerMaks } = TUNING.pass;
    return varerMin + g.rng() * (varerMaks - varerMin);
}

export function lagPass(g: Game, plass: number, person: number): Pass {
    const varer = varighet(g);
    const p: Pass = {
        id: g.nesteId++,
        plass,
        person,
        igjen: varer,
        blir: TUNING.pass.blirMin + g.rng() * (TUNING.pass.blirMaks - TUNING.pass.blirMin),
        varer,
        betaler: true,
        lomme: null,
        grå: false,
        rist: 0,
        fornyet: 0,
        merker: [],
    };
    g.pass.push(p);
    return p;
}

export function ledigPlass(g: Game, maks: number): number | null {
    for (let i = 0; i < Math.min(maks, PLASSER.length); i++)
        if (!g.pass.some((p) => p.plass === i)) return i;
    return null;
}

/** En person som ikke er på bordet eller i skuffen nå. */
export function ledigPerson(g: Game): number {
    const opptatt = new Set([...g.pass.map((p) => p.person), ...g.skuff.map((s) => s.person)]);
    const frie = PERSONER.map((_, i) => i).filter((i) => !opptatt.has(i));
    return frie.length ? frie[Math.floor(g.rng() * frie.length)] : Math.floor(g.rng() * 20);
}

export function papirløse(g: Game): number {
    return g.skuff.length + g.pass.filter((p) => p.grå).length;
}

export function husleie(brett: number): number {
    const h = TUNING.kasse.husleie;
    return h[Math.min(brett, h.length - 1)];
}
