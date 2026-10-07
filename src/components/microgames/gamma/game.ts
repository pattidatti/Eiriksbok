// Kjerneløkka i Gamma: Inga bærer ved, fyrer i gamma og unngår lyset fra patruljebåten.
// Ren TypeScript: komponenten, robotene og simuleringen kjører den samme koden.

import { brettFor } from './levels';
import {
    dagNå,
    fall,
    fyrer,
    iLyset,
    inne,
    julNå,
    lysTopp,
    mellomrom,
    røykSynes,
    sveipFart,
    varsel,
} from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export type Årsak = 'funnet' | 'frosset';

export interface Patrulje {
    fase: 'kommer' | 'lyser' | 'drar';
    /** Sekunder igjen av fasen (kommer/drar). */
    igjen: number;
    /** Lysets treffpunkt på bakken. */
    lysX: number;
    /** -1 = feier oppover mot gamma, 1 = ned mot stranda. */
    retning: -1 | 1;
    sveip: number;
    sveipMaks: number;
    øving: boolean;
    /** Båtens x i fjorden (bilde). */
    båtX: number;
}

export type Hendelse =
    | { type: 'brett'; brett: number }
    | { type: 'plukk'; x: number }
    | { type: 'lever'; kubber: number }
    | { type: 'båt' }
    | { type: 'lys' }
    | { type: 'båtDrar' }
    | { type: 'tap'; årsak: Årsak }
    | { type: 'seier' };

export interface Game {
    t: number;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    x: number;
    /** Hvilken vei Inga gikk sist (bilde). */
    vendt: -1 | 1;
    fang: number;
    stabel: number;
    haug: number[];
    varme: number;
    røyk: number;
    /** Sekunder igjen til neste kubbe brenner opp mens du fyrer. */
    brenn: number;
    patrulje: Patrulje | null;
    nesteBåt: number;
    båter: number;
    brett: number;
    input: { dir: -1 | 0 | 1; hold: boolean };
    /** Spillfølelse: beslutninger tatt. */
    valg: number;
    /** Poengene: netter familien hadde det varmt. */
    varmeNetter: number;
    dag: number;
    sist: { dir: -1 | 0 | 1; fyrer: boolean };
    hendelser: Hendelse[];
    rng: () => number;
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
        t: 0,
        mode: 'play',
        årsak: null,
        x: T.verden.gammaX,
        vendt: 1,
        fang: 0,
        stabel: T.stabel.start,
        haug: T.haug.map((h) => h.kubber),
        varme: T.varme.start,
        røyk: 0,
        brenn: T.varme.perKubbe,
        patrulje: null,
        nesteBåt: T.patrulje.førsteDag * T.dag,
        båter: 0,
        brett: 0,
        input: { dir: 0, hold: false },
        valg: 0,
        varmeNetter: 0,
        dag: 0,
        sist: { dir: 0, fyrer: false },
        hendelser: [],
        rng: mulberry(seed),
    };
}

/** Grepene: gå (venstre/høyre/stå) og hold for å fyre. Samme for elev og robot. */
export function gå(g: Game, dir: -1 | 0 | 1) {
    g.input.dir = dir;
}
export function hold(g: Game, på: boolean) {
    g.input.hold = på;
}

function tap(g: Game, årsak: Årsak) {
    g.mode = 'lost';
    g.årsak = årsak;
    g.input = { dir: 0, hold: false };
    g.hendelser.push({ type: 'tap', årsak });
}

function bevegInga(g: Game, dt: number) {
    const dir = g.input.dir;
    if (dir !== 0) g.vendt = dir;
    const fart = g.fang > 0 ? T.inga.fartMedFang : T.inga.fart;
    g.x = Math.max(T.verden.minX, Math.min(T.verden.maxX, g.x + dir * fart * dt));
    // Plukker ved når hun står ved en haug med tomt fang.
    if (g.fang === 0) {
        T.haug.forEach((h, i) => {
            if (g.fang === 0 && g.haug[i] > 0 && Math.abs(g.x - h.x) < 14) {
                const n = Math.min(T.inga.fang, g.haug[i]);
                g.haug[i] -= n;
                g.fang = n;
                g.valg++;
                g.hendelser.push({ type: 'plukk', x: h.x });
            }
        });
    }
    // Legger fanget i stabelen når hun kommer inn.
    if (g.fang > 0 && inne(g) && g.stabel < T.stabel.maks) {
        const n = Math.min(g.fang, T.stabel.maks - g.stabel);
        g.stabel += n;
        g.fang -= n;
        g.hendelser.push({ type: 'lever', kubber: n });
    }
}

function fyring(g: Game, dt: number) {
    const på = fyrer(g);
    if (på) {
        g.varme = Math.min(T.varme.maks, g.varme + T.varme.fyr * dt);
        g.røyk = Math.min(1, g.røyk + T.røyk.opp * dt);
        g.brenn -= dt;
        if (g.brenn <= 0) {
            g.stabel--;
            g.brenn += T.varme.perKubbe;
        }
    } else {
        g.varme -= fall(g) * dt;
        g.røyk = Math.max(0, g.røyk - T.røyk.ned * dt);
    }
    if (på !== g.sist.fyrer) g.valg++;
    if (g.input.dir !== g.sist.dir && g.input.dir !== 0) g.valg++;
    g.sist = { dir: g.input.dir, fyrer: på };
}

function patruljer(g: Game, dt: number) {
    const p = g.patrulje;
    if (!p) {
        if (julNå(g)) return;
        g.nesteBåt -= dt;
        if (g.nesteBåt > 0) return;
        const øving = g.båter === 0;
        g.båter++;
        g.patrulje = {
            fase: 'kommer',
            igjen: varsel(g),
            lysX: T.verden.strandX,
            retning: -1,
            sveip: 0,
            sveipMaks: 1,
            øving,
            båtX: 1000,
        };
        g.valg++;
        g.hendelser.push({ type: 'båt' });
        return;
    }
    if (p.fase === 'kommer') {
        p.båtX += (910 - p.båtX) * Math.min(1, dt * 1.5);
        p.igjen -= dt;
        if (p.igjen <= 0) {
            p.fase = 'lyser';
            g.hendelser.push({ type: 'lys' });
        }
    } else if (p.fase === 'lyser') {
        p.lysX += p.retning * sveipFart(g) * dt;
        const topp = lysTopp(p.øving);
        if (p.retning < 0 && p.lysX <= topp) {
            p.lysX = topp;
            p.retning = 1;
        } else if (p.retning > 0 && p.lysX >= T.verden.strandX) {
            p.sveip++;
            if (p.sveip >= p.sveipMaks) {
                p.fase = 'drar';
                p.igjen = T.patrulje.drar;
                g.hendelser.push({ type: 'båtDrar' });
            } else p.retning = -1;
        }
        if (!p.øving) {
            if (!inne(g) && iLyset(g, g.x)) tap(g, 'funnet');
            else if (røykSynes(g) && iLyset(g, T.verden.gammaX)) tap(g, 'funnet');
        }
    } else {
        p.båtX += 60 * dt;
        p.igjen -= dt;
        if (p.igjen <= 0) {
            g.patrulje = null;
            const m = mellomrom(g);
            g.nesteBåt = m * (0.7 + 0.6 * g.rng());
        }
    }
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    g.t += dt;
    const d = Math.floor(dagNå(g));
    if (d > g.dag) {
        g.dag = d;
        if (g.varme >= T.varme.god) g.varmeNetter++;
    }
    const b = brettFor(dagNå(g));
    if (b !== g.brett) {
        g.brett = b;
        g.hendelser.push({ type: 'brett', brett: b });
    }
    bevegInga(g, dt);
    fyring(g, dt);
    patruljer(g, dt);
    if (g.mode !== 'play') return;
    // Når hjelpen kommer, vinner du - også om bålet holder på å gå ut.
    if (dagNå(g) >= T.dager) {
        g.mode = 'won';
        g.varmeNetter += T.varme.hjelpen;
        g.patrulje = null;
        g.hendelser.push({ type: 'seier' });
        return;
    }
    if (g.varme <= 0) {
        g.varme = 0;
        tap(g, 'frosset');
    }
}
