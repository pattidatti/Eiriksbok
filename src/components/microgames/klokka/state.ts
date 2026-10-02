// Typene og en ny runde. Ingen regler her - de står i rules.ts og game.ts.

import { seeded, type Rng } from '../sim';
import { ALLE_BÅTER, BRETT, type BåtData, type Side } from './levels';
import { TUNING } from './tuning';

export type Klasse = 1 | 2 | 3;

export interface Båt extends BåtData {
    nr: number; // indeks i ALLE_BÅTER
    brett: number;
    /** venter = ikke ute ennå, henger = klar ved dekket, fires = på vei ned, nede = på vannet. */
    tilstand: 'venter' | 'henger' | 'fires' | 'nede' | 'tapt';
    folk: number;
    fra: [number, number, number]; // hvor mange fra første, andre og tredje klasse
    /** 0 = ved dekket, 1 = på vannet. */
    ned: number;
    nedeKl: number | null;
    /** Sammenleggbar båt som stuerten har rigget (kan svinge ut med en gang). */
    rigget: boolean;
}

/** Hvor stuerten går: ned til porten, eller rigge neste sammenleggbare båt. */
export type StuertMål = 'port' | 'rigg';

export interface Gruppe {
    id: number;
    klasse: Klasse;
    antall: number;
    /** 0 = i lugarene, 1 = på båtdekket. */
    pos: number;
    gang: number; // sekunder hele veien
    iKø: boolean;
}

export interface Hendelse {
    t: number;
    slag:
        | 'ombord'
        | 'nede'
        | 'brett'
        | 'rakett'
        | 'tapt'
        | 'vunnet'
        | 'ankommer'
        | 'bytt'
        | 'port'
        | 'sving'
        | 'stuert'
        | 'rigget';
    side?: Side;
    tekst?: string;
    /** Båten hendelsen gjelder (indeks i båter). */
    båt?: number;
    /** Plassen i båten (ved ombord). */
    plass?: number;
}

export interface Game {
    rng: Rng;
    t: number; // spillsekunder etter 00.45
    mode: 'play' | 'won' | 'lost';
    /** Hvorfor runden ble tapt: for mange tomme plasser, eller båtene gikk tapt. */
    årsak: 'tomme' | 'tapt' | null;
    /** Båtene vannet eller krengningen tok, med årsak. */
    tapte: { navn: string; årsak: 'vann' | 'lås'; kl: number }[];
    /** Fasen i natta (indeks i BRETT), styrt av klokka. */
    brett: number;
    båter: Båt[];
    /** Båten som henger på hver side nå (indeks i båter), eller null. */
    davit: Record<Side, number | null>;
    svingTil: Record<Side, number>;
    grupper: Gruppe[]; // på vei opp
    kø: Gruppe[]; // på dekket, i den rekkefølgen de kom
    nesteGruppe: Record<Klasse, number>;
    /** Folk fra hver klasse som ennå ikke har gått opp fra lugarene. */
    igjen: Record<Klasse, number>;
    portÅpner: number;
    portÅpen: boolean;
    /** Porten glir igjen her (etter at stuerten åpnet den). */
    portLukkes: number;
    /** Når porten sist åpnet eller lukket seg (til animasjonen). */
    portEndret: number;
    /** Første gang porten åpnet seg (null = aldri). */
    portFørst: number | null;
    /** Når stuerten sist ble sendt (null = aldri), hvor, og om jobben er gjort. */
    stuertSendt: number | null;
    stuertMål: StuertMål;
    stuertGjort: boolean;
    /** Turer stuerten har gått til porten og til båtene. */
    turer: { port: number; rigg: number };
    nesteId: number;
    /** Siden landgangen peker mot. Køen går selv inn i båten på den siden. */
    landgang: Side;
    /** Landgangen står stille til dette tidspunktet (etter et sidebytte). */
    landgangKlar: number;
    /** Brøkdel av en person som er på vei over landgangen. */
    landgangRest: number;
    hold: Side | null;
    holdT: number;
    /** Ærlige valg: sidebytter og firinger som starter. */
    valg: number;
    hendelser: Hendelse[];
    raketter: number[]; // tidspunkt for raketter som er skutt opp
}

export function newGame(seed: number): Game {
    const rng = seeded(seed);
    const [p0, p1] = TUNING.port.åpner;
    const båter: Båt[] = [];
    BRETT.forEach((br, bi) =>
        br.båter.forEach((d) =>
            båter.push({
                ...d,
                nr: båter.length,
                brett: bi,
                tilstand: 'venter',
                folk: 0,
                fra: [0, 0, 0],
                ned: 0,
                nedeKl: null,
                rigget: false,
            })
        )
    );
    if (båter.length !== ALLE_BÅTER.length) throw new Error('båtlista stemmer ikke');
    const g: Game = {
        rng,
        t: TUNING.start,
        mode: 'play',
        årsak: null,
        tapte: [],
        brett: 0,
        båter,
        davit: { B: null, S: null },
        svingTil: { B: 0, S: 0 },
        grupper: [],
        kø: [],
        nesteGruppe: { 1: 0, 2: 0, 3: 0 },
        igjen: {
            1: TUNING.klasser[1].antall - 4,
            2: TUNING.klasser[2].antall,
            3: TUNING.klasser[3].antall,
        },
        portÅpner: p0 + rng() * (p1 - p0),
        portÅpen: false,
        portLukkes: -1,
        portEndret: -9,
        portFørst: null,
        stuertSendt: null,
        stuertMål: 'port',
        stuertGjort: true,
        turer: { port: 0, rigg: 0 },
        nesteId: 1,
        landgang: 'S',
        landgangKlar: 0,
        landgangRest: 0,
        hold: null,
        holdT: 0,
        valg: 0,
        hendelser: [],
        raketter: TUNING.raketter.filter((r) => r < TUNING.start),
    };
    // Runden starter midt i det: en gruppe står allerede i køen og flere er i trappa.
    g.kø.push({ id: g.nesteId++, klasse: 1, antall: 14, pos: 1, gang: 1, iKø: true });
    g.igjen[1] -= 10;
    for (const [klasse, antall, pos] of [
        [1, 9, 0.75],
        [1, 7, 0.4],
        [2, 10, 0.2],
    ] as [Klasse, number, number][]) {
        g.igjen[klasse] -= antall;
        g.grupper.push({ id: g.nesteId++, klasse, antall, pos, gang: 9, iKø: false });
    }
    for (const k of [1, 2, 3] as Klasse[])
        g.nesteGruppe[k] = Math.max(TUNING.start, TUNING.klasser[k].åpner) + 2;
    return g;
}
