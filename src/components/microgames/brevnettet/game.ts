// Spillreglene i Brevnettet: tilstand, update og grepet (bind). Ingen React, ingen three.
// Tre regler (designbriefen punkt 3): bare Hauge tenner, lensmannen kutter, mørke stuer
// venter ikke for alltid. Tallene står i tuning.ts, brettene i levels.ts.

import { seeded, type Rng } from '../sim';
import { BRETT, RUNDE_SEK } from './levels';
import { TUNING } from './tuning';
import { HAUGE, avstand, finnTråd, harHauge, iFare, tenteNaboer, type Punkt, type Stue, type Tråd } from './net';

const T = TUNING;

export type Fase = 'spiller' | 'vunnet' | 'tapt';
export type Årsak = 'mørkt' | 'ringer' | 'fengsel';

export type Hendelse =
    | { k: 'år'; brett: number }
    | { k: 'ny'; id: number }
    | { k: 'tent'; id: number }
    | { k: 'tråd'; id: number }
    | { k: 'rir' }
    /** Den store arrestasjonen i 1804 er varslet: alle tråder som bærer alene, er merket. */
    | { k: 'stor'; sek: number }
    /** siste = den store arrestasjonen i 1804. berget = stuer eleven reddet under rittet. */
    | {
          k: 'arrest';
          rakna: number[];
          siste: boolean;
          ring: number[];
          nøster: number;
          berget: number[];
          akkurat: boolean;
      }
    | { k: 'ut' }
    | { k: 'kuttVarsel'; id: number }
    | { k: 'knytt'; id: number; akkurat: boolean }
    | { k: 'kutt'; rakna: number[]; x: number; y: number }
    | { k: 'gaOpp'; x: number; y: number }
    /** En tråd som ryker (for visningen: løse ender som pisker). */
    | { k: 'ryk'; a: Punkt; b: Punkt; hauge: boolean };

export interface Lensmann {
    /** Sekunder siden han red ut. */
    t: number;
    /** Sekunder han rir før han tar Hauge. */
    varsel: number;
    /** Hvor han red ut fra (kanten av veven). */
    fra: Punkt;
    /** Stuer som var i fare en gang under rittet, og når eleven sist reddet en. */
    fare: Set<number>;
    sistRedd: number;
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
    /** Stue-år: hvert nytt år legges antall tente stuer til. */
    poeng: number;
    /** Året som sist ga stue-år. */
    sistÅr: number;
    valg: number;
    stueT: number;
    lensT: number | null;
    lens: Lensmann | null;
    /** Der lensmannen venter og rir ut fra neste gang (stien er synlig). */
    lensFra: Punkt;
    /** Fengselsårene: Hauge er tatt for siste gang, og lensmannen klipper tråder. */
    klipper: boolean;
    klippT: number;
    saltverk: 'før' | 'ute' | 'ferdig';
    arrestasjoner: number;
    navnBrukt: string[];
    hendelser: Hendelse[];
    /** Til «Dette skjedde»: stuer som raknet, flest som levde videre etter et raid, tråder knyttet om. */
    stat: { raknet: number; reddetMaks: number; knyttet: number };
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
        sistÅr: 1796,
        valg: 0,
        stueT: 0,
        lensT: null,
        lens: null,
        lensFra: { x: V.maxX + 0.85, y: 0.4 },
        klipper: false,
        klippT: 0,
        saltverk: 'før',
        arrestasjoner: 0,
        navnBrukt: [],
        hendelser: [],
        stat: { raknet: 0, reddetMaks: 0, knyttet: 0 },
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

/** Nye nøster på knaggen (den rommer bare `nøsterTak`). */
function gi(g: Game, n: number) {
    g.nøster = Math.min(T.nøsterTak, g.nøster + n);
}

function startBrett(g: Game, i: number) {
    const b = BRETT[i];
    g.brett = i;
    g.brettT = 0;
    gi(g, b.nøster);
    for (const p of b.startStuer) leggStue(g, fraAndel(p.x, p.y));
    g.stueT = b.stueHver ?? 0;
    if (b.lensFørst !== null) g.lensT = b.lensFørst;
    else if (b.lensHver !== null && g.lensT === null) g.lensT = b.lensHver;
    if (b.fengsel && g.hauge.inne) {
        // Hauge satt allerede inne da 1804 kom: da er dette den siste arrestasjonen.
        g.hauge.utOm = Infinity;
        g.lensT = null;
        g.klipper = true;
        g.klippT = T.lensmann.klippHver[0] + T.fengsel.storeKlipp;
        merkAlleSvake(g, T.fengsel.storeKlipp);
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
        født: 0,
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

/** Ledig plass: nær et punkt, eller hvor som helst (side -1 = venstre halvdel, 1 = høyre). */
function ledigPlass(g: Game, nær?: Punkt, radius = 0, side = 0, kant = 0): Punkt | null {
    // kant > 0: bare den ytre delen av halvdelen (nye stuer dukker opp ute ved kanten).
    const indre = 0.6 + (V.maxX - 0.6) * kant;
    const fra = side > 0 ? indre : V.minX;
    const til = side < 0 ? -indre : V.maxX;
    for (let k = 0; k < 60; k++) {
        const p = nær
            ? { x: nær.x + (g.rng() * 2 - 1) * radius, y: nær.y + (g.rng() * 2 - 1) * radius }
            : { x: fra + g.rng() * (til - fra), y: V.minY + g.rng() * (V.maxY - V.minY) };
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
    const pa = node(g, a);
    const pb = node(g, b);
    if (!pa || !pb) return false;
    const finnes = finnTråd(g.tråder, a, b);
    if (finnes) {
        // Knyt om: en tråd lensmannen har merket, kan knyttes fast igjen for ett nøste.
        if (finnes.kutt <= 0) return false;
        const akkurat = finnes.kutt < 0.7;
        finnes.kutt = 0;
        g.nøster--;
        g.stat.knyttet++;
        g.hendelser.push({ k: 'knytt', id: finnes.id, akkurat });
        return true;
    }
    if (g.tråder.length >= T.maksTråder) return false;
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
    if (!pa || !pb) return false;
    const finnes = finnTråd(g.tråder, a, b);
    if (finnes) return finnes.kutt > 0;
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
    g.stat.raknet += ut.length;
    return ut.map((s) => s.id);
}

/** Tente stuer med minst to tråder til andre tente stuer (tåler ett klipp). */
export const ringStuer = (g: Game) =>
    tente(g).filter((s) => tenteNaboer(g.stuer, g.tråder, s.id) >= 2);

/** Fjern trådene som `vekk` sier, og meld hver av dem som en tråd som ryker. */
function rykk(g: Game, vekk: (t: Tråd) => boolean) {
    const igjen: Tråd[] = [];
    for (const t of g.tråder) {
        if (!vekk(t)) {
            igjen.push(t);
            continue;
        }
        const a = node(g, t.a);
        const b = node(g, t.b);
        if (a && b)
            g.hendelser.push({
                k: 'ryk',
                a: { x: a.x, y: a.y },
                b: { x: b.x, y: b.y },
                hauge: harHauge(t),
            });
    }
    g.tråder = igjen;
}

function tap(g: Game, årsak: Årsak) {
    g.fase = 'tapt';
    g.årsak = årsak;
}

function arrest(g: Game, lens: Lensmann | null) {
    const siste = !!brett(g).fengsel;
    rykk(g, harHauge);
    g.hauge.inne = true;
    g.hauge.utOm = brett(g).fengsel ? Infinity : T.hauge.inne;
    g.arrestasjoner++;
    const rakna = rakne(g);
    g.stat.reddetMaks = Math.max(g.stat.reddetMaks, tente(g).length);
    // Garnet kommer fra vennene: hver stue som fortsatt lyser, gir et nøste, og stuer i en
    // ring (minst to tråder til tente stuer) gir et ekstra. Ringer betaler seg.
    const L = T.lensmann;
    const iRing = ringStuer(g).length;
    const før = g.nøster;
    gi(g, Math.min(L.nøsterMaks, Math.floor(tente(g).length * L.nøsterPerStue)) + iRing * L.nøsterPerRing);
    const berget = lens
        ? [...lens.fare].filter((id) => g.stuer.get(id)?.lys && !rakna.includes(id))
        : [];
    g.hendelser.push({
        k: 'arrest',
        rakna,
        siste,
        ring: ringStuer(g).map((s) => s.id),
        nøster: g.nøster - før,
        berget,
        akkurat: !!lens && berget.length > 0 && lens.varsel - lens.sistRedd < 1,
    });
    if (brett(g).fengsel && !g.klipper) {
        g.klipper = true;
        g.klippT = T.lensmann.klippHver[0] + 0.6;
    }
    if (!tente(g).length) tap(g, brett(g).fengsel ? 'fengsel' : 'mørkt');
}

function rid(g: Game, varsel: number) {
    g.lens = { t: 0, varsel, fra: g.lensFra, fare: new Set(), sistRedd: -9 };
    // Fra 1799 klipper han også tråden mellom stuene som bærer mest, når han tar Hauge.
    if (brett(g).fengsel && g.saltverk === 'før') merkAlleSvake(g, varsel);
    else if (g.brett >= T.lensmann.raidKlippFra && !brett(g).fengsel) merkVerste(g, varsel);
    const side = g.rng() < 0.5 ? -1 : 1;
    // Han venter ved kanten, under knaggen med nøstene (HUD-en oppe til høyre).
    g.lensFra = { x: side * (V.maxX + 0.85), y: V.minY + g.rng() * (V.maxY - 1.8 - V.minY) };
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

/**
 * Lensmannen merker tråden som bærer mest: den som får flest stuer til å rakne om den ryker.
 * Henger ingen stue på én tråd (ringer, ikke rekker), gjør klippet ingen skade.
 */
function merkVerste(g: Game, sek: number) {
    const mål = g.tråder.filter(
        (t) => t.kutt === 0 && !harHauge(t) && g.stuer.get(t.a)?.lys && g.stuer.get(t.b)?.lys
    );
    let verst: Tråd[] = [];
    let skade = -1;
    for (const t of mål) {
        const n = iFare(
            g.stuer,
            g.tråder.filter((x) => x !== t && x.kutt <= 0 && !(g.lens && harHauge(x)))
        ).length;
        if (n > skade) {
            skade = n;
            verst = [];
        }
        if (n === skade) verst.push(t);
    }
    if (!verst.length) return;
    const t = verst[Math.floor(g.rng() * verst.length)];
    t.kutt = sek;
    t.kuttFra = sek;
    g.valg++;
    g.hendelser.push({ k: 'kuttVarsel', id: t.id });
}

/**
 * Den store arrestasjonen i 1804: lensmannen merker ALLE tråder som en stue henger på alene.
 * Stuer i en ring (to tråder eller flere) står igjen; rekker rakner fra endene.
 */
function merkAlleSvake(g: Game, sek: number) {
    const lys = (id: number) => !!g.stuer.get(id)?.lys;
    const ene = (id: number) => tenteNaboer(g.stuer, g.tråder, id) === 1;
    for (const t of g.tråder) {
        if (t.kutt > 0 || harHauge(t) || !lys(t.a) || !lys(t.b)) continue;
        if (!ene(t.a) && !ene(t.b)) continue;
        t.kutt = sek;
        t.kuttFra = sek;
        g.hendelser.push({ k: 'kuttVarsel', id: t.id });
    }
    g.valg++;
    g.hendelser.push({ k: 'stor', sek });
}

function klipp(g: Game, dt: number) {
    const b = brett(g);
    g.klippT -= dt;
    if (g.klippT > 0) return;
    merkVerste(g, T.lensmann.klippVarsel);
    const k = Math.min(1, g.brettT / b.sek);
    const [a, z] = T.lensmann.klippHver;
    const slingring = 1 + (g.rng() * 2 - 1) * T.lensmann.klippSpredning;
    g.klippT = (a + (z - a) * k) * slingring;
}

/** Merkede tråder teller ned og ryker (både under raidene og i fengselsårene). */
function kuttTikk(g: Game, dt: number) {
    for (const t of [...g.tråder]) {
        if (t.kutt <= 0) continue;
        t.kutt -= dt;
        if (t.kutt > 0) continue;
        rykk(g, (x) => x === t);
        const sa = g.stuer.get(t.a)!;
        const sb = g.stuer.get(t.b)!;
        const rakna = rakne(g);
        g.hendelser.push({ k: 'kutt', rakna, x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 });
        if (!tente(g).length) return tap(g, brett(g).fengsel ? 'fengsel' : 'mørkt');
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
        rykk(g, (t) => t.a === s.id || t.b === s.id);
        g.stuer.delete(s.id);
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
        t.brev += (t.retning * T.brevFart * dt) / len;
        if (t.brev > 0 && t.brev < 1) continue;
        t.brev = Math.min(1, Math.max(0, t.brev));
        t.retning = t.brev >= 1 ? -1 : 1;
    }
}

function avslutt(g: Game) {
    const n = tente(g).length;
    if (n >= 2) g.fase = 'vunnet';
    else tap(g, 'fengsel');
}

export function update(g: Game, dt: number) {
    if (g.fase !== 'spiller') return;
    const b = brett(g);
    g.t += dt;
    g.brettT += dt;
    for (const s of g.stuer.values()) {
        if (s.rakner >= 0) s.rakner += dt;
        if (s.tent >= 0) s.tent += dt;
        s.født += dt;
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
            // To og to, ute ved kanten på hver sin side: den ene der lensmannen venter,
            // så eleven må velge mellom å nå ut og å sikre det som er nær stien hans.
            const side = g.lensFra.x < 0 ? -1 : 1;
            for (const sd of [side, -side]) {
                const p =
                    ledigPlass(g, undefined, 0, sd, T.kantAndel) ?? ledigPlass(g, undefined, 0, sd);
                if (p) leggStue(g, p);
            }
        }
    }

    // Lensmannen rir mot Hauge.
    if (g.lens) {
        const L = g.lens;
        L.t += dt;
        // Følg med på hvem som er i fare, og når eleven redder en (til «akkurat!»).
        const nå = truet(g);
        for (const id of L.fare) if (!nå.has(id) && g.stuer.get(id)?.lys) L.sistRedd = L.t;
        for (const id of nå) L.fare.add(id);
        if (L.t >= L.varsel) {
            g.lens = null;
            if (!g.hauge.inne) arrest(g, L);
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

    if (g.klipper) klipp(g, dt);
    kuttTikk(g, dt);
    if (g.fase !== 'spiller') return;
    ringer(g, dt);
    if (g.fase !== 'spiller') return;
    brev(g, dt);

    const år = visÅr(g);
    if (år > g.sistÅr) {
        g.poeng += (år - g.sistÅr) * tente(g).length;
        // Fengselsårene: vennene sender garn med brevene, ett nøste per år.
        if (b.fengsel) gi(g, (år - g.sistÅr) * T.fengsel.nøsterPerÅr);
        g.sistÅr = år;
    }

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

/**
 * Stuene som rakner om ingenting gjøres: når lensmannen rir (alle som bare henger på Hauge)
 * og når en tråd er merket rødt i fengselsårene. Visningen lar dem synke og blinke.
 */
export function truet(g: Game): Set<number> {
    const ut = new Set<number>();
    if (g.lens) for (const s of iFare(g.stuer, g.tråder)) ut.add(s.id);
    if (g.tråder.some((t) => t.kutt > 0))
        for (const s of iFare(
            g.stuer,
            g.tråder.filter((t) => t.kutt <= 0)
        ))
            ut.add(s.id);
    return ut;
}
