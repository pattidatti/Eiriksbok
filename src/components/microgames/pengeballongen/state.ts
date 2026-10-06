// Typene og en ny runde. Ingen regler her.

import type { FunnId } from './levels';
import { lagTerreng, type Terreng } from './terrain';
import { TUNING } from './tuning';

export type Årsak = 'fjell' | 'valg';

export type Hendelse =
    | { slag: 'brett'; brett: number }
    | { slag: 'valg'; år: number; ekte: boolean; brukt: number; hatt: boolean }
    | { slag: 'stemtUt'; år: number; brukt: number }
    | { slag: 'funn'; id: FunnId }
    | { slag: 'ganger'; ganger: number }
    | { slag: 'veiskille'; vei: 'over' | 'under'; hatt: boolean }
    | { slag: 'krasj' }
    | { slag: 'landet' };

export interface Game {
    seed: number;
    ter: Terreng;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    /** Spilte sekunder. */
    t: number;
    år: number;
    brett: number;
    /** Hvor langt ballongen har kommet (verdens-x for ballongen). */
    x: number;
    /** Bunnen av kurven (skjerm-y, 540 er bunnen). */
    y: number;
    vy: number;
    /** 0-1: hvor varm ballongen er (følger knappen med forsinkelse). */
    varme: number;
    /** Holder eleven knappen nå? */
    hold: boolean;
    /** Brukt totalt, og siden forrige valg (pengestabelen). */
    brukt: number;
    periode: number;
    /** Poengene: pengene du ikke brukte. */
    spart: number;
    ganger: number;
    gangerTid: number;
    /** Summen av ganger x sekunder fra 1833 (snittet måles av simuleringen). */
    gangerSum: number;
    gangerTidSum: number;
    hatter: number;
    /** Neste valg i ter.valg. */
    nesteValg: number;
    /** Neste valgpunkt som ikke er telt. */
    nesteVp: number;
    valg: number;
    funn: FunnId[];
    /** Er stabelen i margen tatt i bruk (fra 1824)? */
    stabel: boolean;
    hendelser: Hendelse[];
    /** Høyden per 8 px vei (spøkelsesballongen). */
    spor: number[];
}

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function newGame(seed: number): Game {
    return {
        seed,
        ter: lagTerreng(mulberry(seed)),
        mode: 'play',
        årsak: null,
        t: 0,
        år: TUNING.år.start,
        brett: 0,
        x: 0,
        y: TUNING.ballong.startY,
        vy: 0,
        varme: 0,
        hold: false,
        brukt: 0,
        periode: 0,
        spart: 0,
        ganger: 1,
        gangerTid: 0,
        gangerSum: 0,
        gangerTidSum: 0,
        hatter: 0,
        nesteValg: 0,
        nesteVp: 0,
        valg: 0,
        funn: [],
        stabel: false,
        hendelser: [],
        spor: [],
    };
}
