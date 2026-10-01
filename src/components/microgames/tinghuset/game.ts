// Kjerneløkka i Tinghuset: tiden går, mappene kommer, skrankene jobber, sinnet stiger.
// update(g, dt) er hele spillet - visningen og robotene bruker bare den og grepene i rules.ts.

import { TUNING } from './tuning';
import { LEVELS } from './levels';
import { makeOffer, runDesks, runRoutes, runTravel } from './rules';
import { newGame, type Folder, type Game, type Kind } from './state';

export { newGame };
export type { Game, Folder };
export { send, pickCard, straffNivaa, deskLoad, caseTime } from './rules';

const K = TUNING;

/** Sekunder mellom hver ny mappe akkurat nå. */
export function interval(g: Game): number {
    const lv = LEVELS[g.level];
    if (lv.intervall !== null) return lv.intervall;
    // Kurven: lineært mellom punktene [måned, sekunder], flat før første og etter siste.
    const k = K.tilfang.kurve;
    if (g.mnd <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) {
        const [m1, s1] = k[i];
        if (g.mnd > m1) continue;
        const [m0, s0] = k[i - 1];
        return s0 + ((s1 - s0) * (g.mnd - m0)) / (m1 - m0);
    }
    return k[k.length - 1][1];
}

/** 0-1: hvor hardt spillet presser nå - tilfanget og sinnet. */
export function pressure(g: Game): number {
    const tilfang = Math.min(1, K.press.minIntervall / interval(g));
    return Math.min(1, K.press.tilfang * tilfang + K.press.sinne * g.sinne);
}

/** Antall mapper som venter uten dom (i leir eller kø). */
export function waiting(g: Game): number {
    let n = 0;
    for (const f of g.folders) if (f.state === 'leir' || f.state === 'ko') n++;
    return n;
}

/** Hvor mye de ventende mappene veier i sinnet: en mappe i leiren som venter på tvillingen
 *  sin (den har ikke kommet ennå), veier `ventTvilling`, de andre 1. */
export function waitWeight(g: Game): number {
    let n = 0;
    for (const f of g.folders) {
        if (f.state === 'leir') n += f.twin === -1 ? K.sinne.ventTvilling : 1;
        else if (f.state === 'ko') n++;
    }
    return n;
}

function addFolder(g: Game, sak: number, kind: Kind, camp: number, twin: number | null) {
    const f: Folder = {
        id: g.nextId++,
        sak,
        kind,
        camp,
        state: 'leir',
        desk: -1,
        travel: 0,
        born: g.t,
        twin,
    };
    g.folders.push(f);
    g.valg++; // hver ny mappe er et valg: forelegg eller rettssak, nå eller etter tvillingen
    g.events.push({ kind: 'ny', f });
    return f;
}

function pickKind(g: Game): Kind {
    const lv = LEVELS[g.level];
    if (lv.alvorlig <= 0) return 'lett';
    // Brett 2: første alvorlige mappe kommer alene, med en lapp der blikket er.
    if (!g.firstSerious) {
        g.firstSerious = true;
        return 'alvorlig';
    }
    if (g.rng() >= lv.alvorlig) return 'lett';
    if (lv.tykk && (!g.firstThick || g.rng() < K.tilfang.tykkAndel)) {
        g.firstThick = true;
        return 'tykk';
    }
    return 'alvorlig';
}

function spawn(g: Game) {
    const lv = LEVELS[g.level];
    const kind = pickKind(g);
    const camp = Math.floor(g.rng() * g.camps.length);
    const sak = g.nextSak++;
    if (!lv.par) {
        addFolder(g, sak, kind, camp, null);
        return 1;
    }
    const first = addFolder(g, sak, kind, camp, null);
    const other =
        g.camps.length > 1
            ? (camp + 1 + Math.floor(g.rng() * (g.camps.length - 1))) % g.camps.length
            : camp;
    const delay =
        K.tilfang.tvillingMin + g.rng() * (K.tilfang.tvillingMaks - K.tilfang.tvillingMin);
    g.pendingTwins.push({ at: g.t + delay, sak, kind, camp: other, twinOf: first.id });
    first.twin = -1; // tvillingen finnes, men har ikke kommet ennå
    return 2;
}

function runSpawns(g: Game, sdt: number) {
    g.spawnT -= sdt;
    if (g.spawnT <= 0) {
        const hadSerious = g.firstSerious;
        const n = spawn(g);
        // Den første røde mappa får være alene en stund, så eleven ser den.
        const alone = !hadSerious && g.firstSerious ? K.tilfang.alene : 1;
        g.spawnT += interval(g) * n * alone;
    }
    for (let i = g.pendingTwins.length - 1; i >= 0; i--) {
        const p = g.pendingTwins[i];
        if (g.t < p.at) continue;
        g.pendingTwins.splice(i, 1);
        const t = addFolder(g, p.sak, p.kind, p.camp, p.twinOf);
        const a = g.folders.find((f) => f.id === p.twinOf);
        // Er første tvilling alt avgjort, venter dommen i waitingTwin på denne.
        if (a) a.twin = t.id;
    }
}

function nextLevel(g: Game) {
    if (g.level >= LEVELS.length - 1) {
        g.mode = 'won';
        return;
    }
    g.level++;
    const lv = LEVELS[g.level];
    for (const c of lv.leirer)
        if (!g.camps.includes(c)) {
            g.camps.push(c);
            g.events.push({ kind: 'leir', camp: c });
        }
    // Brettet åpner sine rettssaler. Salene eleven har fått fra kort, kommer i tillegg.
    const saler = g.desks.filter((d) => d.kind === 'rett').length;
    const fraKort = Math.max(0, saler - LEVELS[g.level - 1].saler);
    for (let i = saler; i < lv.saler + fraKort; i++)
        g.desks.push({ kind: 'rett', queue: [], current: null, joint: null, left: 0, total: 0 });
    g.inter = K.mellomside;
    g.spawnT = Math.min(g.spawnT, 0.8);
    g.events.push({ kind: 'brett', level: g.level });
}

/** Hopp over mellomsiden (klikk). */
export function skipInter(g: Game) {
    g.inter = 0;
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    g.t += dt;
    if (g.inter > 0) {
        g.inter -= dt;
        return;
    }
    let scale = 1;
    if (g.offer) {
        scale = K.kort.fart;
        g.offer.left -= dt;
        if (g.offer.left <= 0) g.offer = null;
    }
    const sdt = dt * scale;
    const lv = LEVELS[g.level];

    g.mnd += sdt / lv.sekPerMnd;
    if (g.mnd >= lv.tilMnd) {
        g.mnd = lv.tilMnd;
        nextLevel(g);
        if (g.mode !== 'play') return;
    }

    runSpawns(g, sdt);
    runTravel(g, sdt);
    runDesks(g, sdt);
    runRoutes(g, sdt);

    // Sinnet: hver mappe som venter uten dom fyller måleren litt hvert sekund.
    const add = K.sinne.ventPerMappe * waitWeight(g) * sdt;
    g.sinne += add;
    g.fraVent += add;
    g.sinne = Math.min(LEVELS[g.level].sinneTak, Math.max(0, g.sinne));

    // Kortvalget hver tredje måned.
    if (!g.offer && g.mnd >= g.nextOfferMnd) {
        const cards = makeOffer(g);
        g.nextOfferMnd += K.kort.hverMnd;
        // Når alle kortene er brukt opp, kommer det ingen flere kortvalg.
        if (cards.length) {
            g.offer = { cards, left: K.kort.varer };
            g.offers++;
            g.valg++;
            g.events.push({ kind: 'kort' });
        }
    }

    if (g.sinne >= 1 || g.folders.length > K.sinne.maksMapper) {
        g.mode = 'lost';
        g.cause = g.fraMild > g.fraVent ? 'mild' : 'vent';
    }
}
