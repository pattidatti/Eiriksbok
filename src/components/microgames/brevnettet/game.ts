// Spillreglene i Brevnettet: tilstand, update og grepet (bind). Ingen React, ingen three.
// Tre regler (designbriefen punkt 3): bare Hauge tenner, lensmannen kutter, mørke stuer
// venter ikke for alltid. Tallene står i tuning.ts, brettene i levels.ts.

import { seeded, type Rng } from '../sim';
import { BRETT, RUNDE_SEK } from './levels';
import { TUNING } from './tuning';
import {
    HAUGE,
    avstand,
    finnTråd,
    gruppe,
    harHauge,
    iFare,
    tenteNaboer,
    type Punkt,
    type Stue,
    type Tråd,
} from './net';

const T = TUNING;

export type Fase = 'spiller' | 'vunnet' | 'tapt';
export type Årsak = 'mørkt' | 'ringer' | 'fengsel';

export type Hendelse =
    | { k: 'år'; brett: number }
    | { k: 'ny'; id: number }
    | { k: 'tent'; id: number }
    | { k: 'tråd'; id: number }
    | { k: 'rir' }
    | { k: 'arrest'; rakna: number[] }
    | { k: 'ut' }
    | { k: 'kuttVarsel'; id: number }
    | { k: 'kutt'; rakna: number[]; x: number; y: number }
    | { k: 'gaOpp'; x: number; y: number }
    | { k: 'brev'; x: number; y: number; p: number };

export interface Lensmann {
    /** Sekunder siden han red ut. */
    t: number;
    /** Sekunder han rir før han tar Hauge. */
    varsel: number;
    /** Hvor han red ut fra (kanten av veven). */
    fra: Punkt;
}

export interface Game {
    rng: Rng;
    t: number;
    brett: number;
    brettT: number;
    fase: Fase;
    årsak?: Årsak;
    stuer: Map<number, Stue>;
    tråder: Tråd[];
    nesteId: number;
    hauge: { x: number; y: number; inne: boolean; utOm: number };
    nøster: number;
    /** Kljåsteiner som har falt (stuer som ga opp). */
    steiner: number;
    poeng: number;
    valg: number;
    stueT: number;
    lensT: number | null;
    lens: Lensmann | null;
    /** Fengselsårene: Hauge er tatt for siste gang, og lensmannen klipper tråder. */
    klipper: boolean;
    klippT: number;
    saltverk: 'før' | 'ute' | 'ferdig';
    arrestasjoner: number;
    navnBrukt: string[];
    hendelser: Hendelse[];
}

export const NAVN = [
    'Sara Oust',
    'Marthe Gabestad',
    'Papirmølla på Eiker',
    'Fennefoss',
    'Teglverket på Eg',
    'Kobbergruva i Vingelen',
];

const V = T.vev;
const fraAndel = (fx: number, fy: number): Punkt => ({
    x: V.minX + fx * (V.maxX - V.minX),
    y: V.minY + fy * (V.maxY - V.minY),
});

export function newGame(seed: number): Game {
    const g: Game = {
        rng: seeded(seed),
        t: 0,
        brett: 0,
        brettT: 0,
        fase: 'spiller',
        stuer: new Map(),
        tråder: [],
        nesteId: 1,
        hauge: { x: -0.2, y: -0.2, inne: false, utOm: 0 },
        nøster: 0,
        steiner: 0,
        poeng: 0,
        valg: 0,
        stueT: 0,
        lensT: null,
        lens: null,
        klipper: false,
        klippT: 0,
        saltverk: 'før',
        arrestasjoner: 0,
        navnBrukt: [],
        hendelser: [],
    };
    startBrett(g, 0);
    return g;
}

const brett = (g: Game) => BRETT[g.brett];
export const tente = (g: Game) => [...g.stuer.values()].filter((s) => s.lys);
export const mørke = (g: Game) => [...g.stuer.values()].filter((s) => !s.lys);

/** Prikken med denne id-en (Hauge eller en stue). */
export function node(g: Game, id: number): Punkt | null {
    if (id === HAUGE) return g.hauge.inne ? null : g.hauge;
    return g.stuer.get(id) ?? null;
}

function startBrett(g: Game, i: number) {
    const b = BRETT[i];
    g.brett = i;
    g.brettT = 0;
    g.nøster += b.nøster;
    for (const p of b.startStuer) leggStue(g, fraAndel(p.x, p.y));
    g.stueT = b.stueHver ?? 0;
    if (b.lensFørst !== null) g.lensT = b.lensFørst;
    else if (b.lensHver !== null && g.lensT === null) g.lensT = b.lensHver;
    if (b.fengsel && g.hauge.inne) {
        // Hauge satt allerede inne da 1804 kom: da er dette den siste arrestasjonen.
        g.hauge.utOm = Infinity;
        g.lensT = null;
        g.klipper = true;
        g.klippT = T.lensmann.klippHver[0];
    }
    g.hendelser.push({ k: 'år', brett: i });
}

function leggStue(g: Game, p: Punkt) {
    if (g.stuer.size >= T.maksStuer) return null;
    const ledige = NAVN.filter((n) => !g.navnBrukt.includes(n));
    const navn =
        g.brett >= 3 && ledige.length && g.rng() < T.navnSjanse
            ? ledige[Math.floor(g.rng() * ledige.length)]
            : undefined;
    if (navn) g.navnBrukt.push(navn);
    const s: Stue = {
        id: g.nesteId++,
        x: p.x,
        y: p.y,
        lys: false,
        ring: 0,
        ringVarslet: false,
        rakner: -1,
        tent: -1,
        navn,
    };
    g.stuer.set(s.id, s);
    g.valg++;
    g.hendelser.push({ k: 'ny', id: s.id });
    return s;
}

/** Nærmeste prikk (stue eller Hauge) fra et punkt. */
function nærmeste(g: Game, p: Punkt, bareTente = false) {
    let d = Infinity;
    for (const s of g.stuer.values()) if (!bareTente || s.lys) d = Math.min(d, avstand(s, p));
    if (!bareTente && !g.hauge.inne) d = Math.min(d, avstand(g.hauge, p));
    return d;
}

function ledigPlass(g: Game, nær?: Punkt, radius = 0): Punkt | null {
    for (let k = 0; k < 60; k++) {
        const p = nær
            ? { x: nær.x + (g.rng() * 2 - 1) * radius, y: nær.y + (g.rng() * 2 - 1) * radius }
            : { x: V.minX + g.rng() * (V.maxX - V.minX), y: V.minY + g.rng() * (V.maxY - V.minY) };
        if (p.x < V.minX || p.x > V.maxX || p.y < V.minY || p.y > V.maxY) continue;
        if (nærmeste(g, p) >= T.avstand) return p;
    }
    return null;
}

/**
 * Grepet: dra en tråd fra prikk a til prikk b. Samme funksjon for eleven og robotene.
 * Fra Hauge til en mørk stue tenner den. Mellom to stuer tenner den ingenting, men holder.
 */
export function bind(g: Game, a: number, b: number): boolean {
    if (g.fase !== 'spiller' || a === b || g.nøster < 1) return false;
    if (g.tråder.length >= T.maksTråder) return false;
    const pa = node(g, a);
    const pb = node(g, b);
    if (!pa || !pb || finnTråd(g.tråder, a, b)) return false;
    const hauge = a === HAUGE || b === HAUGE;
    const stue = g.stuer.get(a === HAUGE ? b : a)!;
    if (hauge && stue.lys) return false;
    if (!hauge && avstand(pa, pb) > T.tråd.maksLengde) return false;
    const t: Tråd = { id: g.nesteId++, a, b, brev: 0, retning: 1, kutt: 0, alder: 0 };
    g.tråder.push(t);
    g.nøster--;
    g.hendelser.push({ k: 'tråd', id: t.id });
    if (hauge) {
        stue.lys = true;
        stue.ring = 0;
        stue.ringVarslet = false;
        stue.tent = 0;
        stue.rakner = -1;
        g.hendelser.push({ k: 'tent', id: stue.id });
    }
    return true;
}

/** Kan tråden a-b lages nå? (Til visningen og robotene.) */
export function kanBinde(g: Game, a: number, b: number) {
    if (g.fase !== 'spiller' || a === b || g.nøster < 1) return false;
    const pa = node(g, a);
    const pb = node(g, b);
    if (!pa || !pb || finnTråd(g.tråder, a, b)) return false;
    if (a === HAUGE || b === HAUGE) return !g.stuer.get(a === HAUGE ? b : a)!.lys;
    return avstand(pa, pb) <= T.tråd.maksLengde;
}

/** Fagregelen etter et kutt: stuer uten tråd til en annen tent stue rakner. */
function rakne(g: Game) {
    const ut = iFare(g.stuer, g.tråder);
    for (const s of ut) {
        s.lys = false;
        s.ring = 0;
        s.ringVarslet = false;
        s.rakner = 0;
    }
    return ut.map((s) => s.id);
}

function tap(g: Game, årsak: Årsak) {
    g.fase = 'tapt';
    g.årsak = årsak;
}

function arrest(g: Game) {
    g.tråder = g.tråder.filter((t) => !harHauge(t));
    g.hauge.inne = true;
    g.hauge.utOm = brett(g).fengsel ? Infinity : T.hauge.inne;
    g.arrestasjoner++;
    const rakna = rakne(g);
    g.hendelser.push({ k: 'arrest', rakna });
    if (brett(g).fengsel && !g.klipper) {
        g.klipper = true;
        g.klippT = T.lensmann.klippHver[0];
    }
    if (!tente(g).length) tap(g, brett(g).fengsel ? 'fengsel' : 'mørkt');
}

function rid(g: Game, varsel: number) {
    const fra = g.rng() < 0.5 ? { x: V.minX - 1.2, y: V.maxY } : { x: V.maxX + 1.2, y: V.maxY };
    g.lens = { t: 0, varsel, fra };
    g.valg++;
    g.hendelser.push({ k: 'rir' });
}

/** Hauge slippes ut midt i mørket, stadig lenger unna nettet, og en ny stue venter ved ham. */
function slippUt(g: Game, nyStue: boolean) {
    const min = T.hauge.utAvstand + T.hauge.utAvstandVekst * g.arrestasjoner;
    let best: Punkt | null = null;
    let bestD = -1;
    for (let k = 0; k < 30; k++) {
        const p = ledigPlass(g);
        if (!p) continue;
        const d = Math.min(nærmeste(g, p, true), min + 2);
        if (d > bestD) {
            bestD = d;
            best = p;
        }
    }
    const p = best ?? { x: 0, y: 0 };
    g.hauge.x = p.x;
    g.hauge.y = p.y;
    g.hauge.inne = false;
    g.valg++;
    g.hendelser.push({ k: 'ut' });
    if (nyStue) {
        const q = ledigPlass(g, p, T.hauge.nyStueAvstand);
        if (q) leggStue(g, q);
    }
}

function klipp(g: Game, dt: number) {
    const b = brett(g);
    g.klippT -= dt;
    if (g.klippT <= 0) {
        const mål = g.tråder.filter(
            (t) => t.kutt === 0 && !harHauge(t) && g.stuer.get(t.a)?.lys && g.stuer.get(t.b)?.lys
        );
        // Han leter etter de svake trådene: en stue som bare har den ene tråden, rakner.
        const svake = mål.filter(
            (t) =>
                tenteNaboer(g.stuer, g.tråder, t.a) === 1 ||
                tenteNaboer(g.stuer, g.tråder, t.b) === 1
        );
        const fra = svake.length && g.rng() < T.lensmann.klippSvak ? svake : mål;
        if (fra.length) {
            const t = fra[Math.floor(g.rng() * fra.length)];
            t.kutt = T.lensmann.klippVarsel;
            g.valg++;
            g.hendelser.push({ k: 'kuttVarsel', id: t.id });
        }
        const k = Math.min(1, g.brettT / b.sek);
        const [a, z] = T.lensmann.klippHver;
        g.klippT = a + (z - a) * k;
    }
    for (const t of [...g.tråder]) {
        if (t.kutt <= 0) continue;
        t.kutt -= dt;
        if (t.kutt > 0) continue;
        g.tråder = g.tråder.filter((x) => x !== t);
        const sa = g.stuer.get(t.a)!;
        const sb = g.stuer.get(t.b)!;
        const rakna = rakne(g);
        g.hendelser.push({ k: 'kutt', rakna, x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 });
        if (!tente(g).length) return tap(g, 'fengsel');
    }
}

function ringer(g: Game, dt: number) {
    const tid = brett(g).ringTid;
    if (tid === null) return;
    for (const s of [...g.stuer.values()]) {
        if (s.lys) continue;
        s.ring += dt / tid;
        if (s.ring >= T.ring.snartFull && !s.ringVarslet) {
            s.ringVarslet = true;
            g.valg++;
        }
        if (s.ring < 1) continue;
        g.stuer.delete(s.id);
        g.tråder = g.tråder.filter((t) => t.a !== s.id && t.b !== s.id);
        g.steiner++;
        g.hendelser.push({ k: 'gaOpp', x: s.x, y: s.y });
        if (g.steiner >= T.ring.steiner) return tap(g, 'ringer');
    }
}

function brev(g: Game, dt: number) {
    for (const t of g.tråder) {
        t.alder += dt;
        const a = node(g, t.a);
        const b = node(g, t.b);
        if (!a || !b) continue;
        const len = Math.max(0.5, avstand(a, b));
        t.brev += (t.retning * T.poeng.brevFart * dt) / len;
        if (t.brev > 0 && t.brev < 1) continue;
        t.brev = Math.min(1, Math.max(0, t.brev));
        t.retning = t.brev >= 1 ? -1 : 1;
        if (harHauge(t)) continue;
        const sa = g.stuer.get(t.a)!;
        const sb = g.stuer.get(t.b)!;
        if (!sa.lys || !sb.lys) continue;
        const p = T.poeng.brev * gruppe(g.stuer, g.tråder, sa.id);
        g.poeng += p;
        const mål = t.brev >= 1 ? sb : sa;
        g.hendelser.push({ k: 'brev', x: mål.x, y: mål.y, p });
    }
}

function avslutt(g: Game) {
    const n = tente(g).length;
    if (n >= 2) {
        g.fase = 'vunnet';
        g.poeng += n * T.poeng.tentIMål;
    } else tap(g, 'fengsel');
}

export function update(g: Game, dt: number) {
    if (g.fase !== 'spiller') return;
    const b = brett(g);
    g.t += dt;
    g.brettT += dt;
    for (const s of g.stuer.values()) {
        if (s.rakner >= 0) s.rakner += dt;
        if (s.tent >= 0) s.tent += dt;
    }

    // Hauge slippes ut etter en arrestasjon (ikke i fengselsårene).
    if (g.hauge.inne && !b.fengsel) {
        g.hauge.utOm -= dt;
        if (g.hauge.utOm <= 0) slippUt(g, true);
    }

    // Saltverket 1809: fem sekunder ute, så tar lensmannen ham igjen.
    if (b.fengsel && g.klipper) {
        const F = T.fengsel;
        if (g.saltverk === 'før' && g.brettT >= F.saltverk) {
            g.saltverk = 'ute';
            slippUt(g, !mørke(g).length);
        }
        if (g.saltverk === 'ute' && !g.lens && g.brettT >= F.saltverk + F.saltverkSek - 1.5)
            rid(g, 1.5);
    }

    // Nye mørke stuer.
    if (b.stueHver !== null) {
        g.stueT -= dt;
        if (g.stueT <= 0) {
            g.stueT = b.stueHver;
            const p = ledigPlass(g);
            if (p) leggStue(g, p);
        }
    }

    // Lensmannen rir mot Hauge.
    if (g.lens) {
        g.lens.t += dt;
        if (g.lens.t >= g.lens.varsel) {
            g.lens = null;
            if (!g.hauge.inne) arrest(g);
            if (g.saltverk === 'ute') g.saltverk = 'ferdig';
            g.lensT = brett(g).lensHver;
            if (g.fase !== 'spiller') return;
        }
    } else if (g.lensT !== null && !g.hauge.inne) {
        g.lensT -= dt;
        if (g.lensT <= 0) {
            g.lensT = null;
            rid(g, g.arrestasjoner === 0 ? T.lensmann.førsteVarsel : b.varsel);
        }
    }

    if (g.klipper) {
        klipp(g, dt);
        if (g.fase !== 'spiller') return;
    }
    ringer(g, dt);
    if (g.fase !== 'spiller') return;
    brev(g, dt);

    const alleLyser = g.stuer.size > 0 && mørke(g).length === 0;
    if ((b.slutterNårAlleLyser && g.brettT > 6 && alleLyser) || g.brettT >= b.sek) {
        if (g.brett === BRETT.length - 1) avslutt(g);
        else startBrett(g, g.brett + 1);
    }
}

/** Året som står i veven (fengselsårene går fra 1804 til 1814 i løpet av sluttbrettet). */
export function visÅr(g: Game) {
    const b = brett(g);
    if (!b.fengsel) return b.år;
    return Math.min(1814, b.år + Math.floor((g.brettT / b.sek) * 10));
}

/** 0-1 mot 1814. */
export function framdrift(g: Game) {
    let før = 0;
    for (let i = 0; i < g.brett; i++) før += BRETT[i].sek;
    return Math.min(1, (før + g.brettT) / RUNDE_SEK);
}

/** 0-1: hvor hardt spillet presser nå. */
export function press(g: Game) {
    const ringMaks = Math.max(0, ...mørke(g).map((s) => s.ring));
    const varsel = g.lens || g.tråder.some((t) => t.kutt > 0) ? 0.15 : 0;
    const fare = Math.min(0.15, iFare(g.stuer, g.tråder).length * 0.03);
    const p = 0.1 + framdrift(g) * 0.45 + ringMaks * 0.2 + varsel + fare + (g.klipper ? 0.1 : 0);
    return Math.min(1, p);
}
