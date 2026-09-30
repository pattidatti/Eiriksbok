import type { Rng } from '../sim';
import {
    COLS,
    UNITS,
    BENCH,
    boardCap,
    boardCount,
    buy,
    colClosed,
    move,
    reroll,
    sell,
    startBattle,
    fireAbility,
    pickReward,
    unitAt,
    sellValue,
    type G,
    type IO,
    type Kind,
    type Klasse,
    type LeaderId,
    type Loc,
    type Unit,
} from './game';

// Selvspill-robotene for Hammer og ambolt. De bruker de samme grepene som eleven (buy,
// move, sell, reroll, startBattle, fireAbility, pickReward) og ser bare det eleven ser:
// butikken, brettet, benken og fiendehæren som står på andre siden av sletta.
//
// Eierens krav: minst fire hærtyper skal kunne vinne. Derfor én vinner per hærtype, med
// hver sin hærfører. Alle vinnerne LESER fiendehæren og kjøper motsvaret i tillegg til
// kjernen sin. Taperne gjør det eleven gjør når hun ikke har forstått regelen:
//   dyr      - kjøper alltid det dyreste kortet og setter det på første ledige plass.
//   ensartet - bare ryttere, uansett hva fienden stiller med.

export type BotStyle =
    | 'makedonsk'
    | 'persisk'
    | 'steppe'
    | 'elefant'
    | 'blandet'
    | 'halvgod'
    | 'dyr'
    | 'ensartet'
    | 'tilfeldig';

interface BotDef {
    forventer: 'vinner' | 'middels' | 'taper';
    tilfeldig?: boolean;
    beskrivelse: string;
    style: BotStyle;
    leader: LeaderId;
}

export const BOTS: Record<BotStyle, BotDef> = {
    makedonsk: {
        forventer: 'vinner',
        style: 'makedonsk',
        leader: 'aleksander',
        beskrivelse:
            'Makedonsk hammer og ambolt: falanks i midten, hetairoi på flanken, Kilen når fienden er bundet - og kjøper motsvar mot det fienden stiller.',
    },
    persisk: {
        forventer: 'vinner',
        style: 'persisk',
        leader: 'mazaios',
        beskrivelse: 'Persisk pilsverm: udødelige og hoplitter foran, bueskyttere og slyngekastere bak, Pilregn når linjene møtes.',
    },
    steppe: {
        forventer: 'vinner',
        style: 'steppe',
        leader: 'oxyartes',
        beskrivelse: 'Steppehær: hesteskyttere som holder avstand og skyter på tregt fotfolk, lett infanteri foran i smale pass, Skinnflukt og det parthiske skuddet.',
    },
    elefant: {
        forventer: 'vinner',
        style: 'elefant',
        leader: 'poros',
        beskrivelse: 'Indisk hær: elefanter foran mot ryttere, langbuer bak, Elefantstorm når elefantene står fast.',
    },
    blandet: {
        forventer: 'vinner',
        style: 'blandet',
        leader: 'parmenion',
        beskrivelse: 'Hellenistisk blandingshær: tar inn folk fra hver slått hær for hellenisme-bonusen, og bygger motsvar.',
    },
    halvgod: {
        forventer: 'middels',
        style: 'halvgod',
        leader: 'aleksander',
        beskrivelse: 'Kan regelen, men leser fienden bare annenhver runde, sparer ikke og bruker Kilen tilfeldig.',
    },
    dyr: {
        forventer: 'taper',
        style: 'dyr',
        leader: 'aleksander',
        beskrivelse: 'Kjøper alltid det dyreste kortet, setter det på første ledige plass og ser aldri på fienden.',
    },
    ensartet: {
        forventer: 'taper',
        style: 'ensartet',
        leader: 'aleksander',
        beskrivelse: 'Bare ryttere, uansett hva fienden stiller med - en ensartet hær.',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        style: 'tilfeldig',
        leader: 'aleksander',
        beskrivelse: 'Knappemoser: kjøper, flytter og rullers om tilfeldig, og går til slag når det faller seg.',
    },
};

const CORE: Partial<Record<BotStyle, Partial<Record<Kind, number>>>> = {
    makedonsk: { falanks: 3, hetairoi: 2.5, hypaspist: 1.2, agrianer: 1, kreter: 1.2, tessaler: 1.4, hoplitt: 1.2 },
    halvgod: { falanks: 3, hetairoi: 2.5, hypaspist: 1.2, agrianer: 1, kreter: 1.2, tessaler: 1.4, hoplitt: 1.2 },
    persisk: { udodelig: 3, slynge: 2.5, bue: 2, kardak: 1.2, vogn: 0.8, hoplitt: 2, asp: 1.6 },
    steppe: { baktrer: 4.5, skyter: 4.5, dahe: 3.5, udodelig: 1.2, kardak: 1, slynge: 1, bue: 1, asp: 1.5 },
    elefant: { elefant: 3.2, inder: 2.2, indrytter: 1.2, kardak: 1.2, udodelig: 1.2, bue: 1 },
    blandet: { falanks: 2, hoplitt: 1.6, kreter: 1.6, hypaspist: 1.2, agrianer: 1.2, tessaler: 1.2 },
};

/** Hvor mye av fiendens hær (pris x stjerner) som er av hver klasse, 0-1. */
function enemyShare(g: G) {
    const w: Record<Klasse | 'pike' | 'kite', number> = {
        tung: 0,
        lett: 0,
        kav: 0,
        skytter: 0,
        vogn: 0,
        elefant: 0,
        pike: 0,
        kite: 0,
    };
    let tot = 0;
    for (const row of g.enemy)
        for (const u of row) {
            if (!u) continue;
            const d = UNITS[u.kind];
            const v = Math.max(1, d.cost) * u.star;
            w[d.kite ? 'kite' : d.klasse] += v;
            if (d.pike) w.pike += v;
            tot += v;
        }
    if (g.enemyCommander === 'poros') {
        w.elefant += 6;
        tot += 6;
    }
    if (tot) for (const k of Object.keys(w) as (keyof typeof w)[]) w[k] /= tot;
    return w;
}

/** Hvor godt passer enheten mot fiendehæren (lesingen)? Speiler reglene i game.ts. */
function counterScore(g: G, k: Kind) {
    const e = enemyShare(g);
    const d = UNITS[k];
    let s = 0;
    if (d.pike) s += 5 * e.kav + 1.5 * e.elefant - 2 * e.skytter;
    if (d.klasse === 'lett') s += 7 * (e.vogn + e.elefant) + 5 * (e.skytter + e.kite) - 1.5 * e.kav;
    if (d.klasse === 'kav' && !d.kite) s += 6 * e.skytter - 5 * e.pike - 6 * e.elefant - 3 * e.kite - 3 * e.vogn;
    if (d.kite) s += 4 * e.tung - 2 * e.skytter - 3 * e.elefant;
    if (d.klasse === 'skytter') s += 5 * e.tung + 3 * e.kite - 4 * e.kav - 2 * e.elefant;
    if (d.klasse === 'tung' && !d.pike) s += 2 * e.lett - 3 * e.vogn;
    if (d.klasse === 'tung') s -= 3 * e.vogn + 3 * e.skytter;
    if (d.klasse === 'elefant') s += 5 * e.kav - 5 * e.lett - 2 * e.skytter;
    if (d.klasse === 'vogn') s += 3 * e.tung + 2 * e.skytter - 6 * e.lett;
    return s * 1.5;
}

function boardUnitsOnly(g: G): Unit[] {
    const out: Unit[] = [];
    for (const row of g.board) for (const u of row) if (u) out.push(u);
    return out;
}

function owned(g: G): Unit[] {
    const out: Unit[] = [];
    for (const row of g.board) for (const u of row) if (u) out.push(u);
    for (const u of g.bench) if (u) out.push(u);
    return out;
}

function copies(g: G, k: Kind, star = 1) {
    return owned(g).filter((u) => u.kind === k && u.star === star).length;
}

function wantScore(g: G, style: BotStyle, k: Kind, reads: boolean) {
    const core = CORE[style] ?? {};
    let s = core[k] ?? 0;
    // Hellenisme: alle som leser, blander inn nye folk rundt kjernen (opptil fem).
    if (style !== 'halvgod') {
        const folks = new Set(boardUnitsOnly(g).map((u) => UNITS[u.kind].folk));
        if (!folks.has(UNITS[k].folk) && folks.size < 5) s += style === 'blandet' ? 2.2 : style === 'steppe' ? 0.6 : 1.6;
        if (style === 'blandet') s += 0.4;
    }
    if (reads) s += counterScore(g, k);
    s += copies(g, k) * 1.6;
    // En hær trenger en front og noen bak.
    const front = g.board[0].filter((u) => u && !UNITS[u.kind].hero).length;
    const kl = UNITS[k].klasse;
    if (front < 2 && (kl === 'tung' || kl === 'elefant')) s += 1.5;
    const shooters = owned(g).filter((u) => UNITS[u.kind].klasse === 'skytter').length;
    if (kl === 'skytter' && shooters >= 4) s -= 2;
    // Steppehæren: hesteskytterne hører hjemme bak. Er bakre rekke full (smalt pass),
    // trengs fotfolk foran - ellers står de skjøre rytterne i første linje.
    if (style === 'steppe') {
        const openCols = [0, 1, 2, 3, 4].filter((c) => !colClosed(g, c));
        const backFree = openCols.filter((c) => !g.board[1][c]).length;
        const wall = openCols.filter((c) => {
            const u = g.board[0][c];
            return u && ['tung', 'lett', 'elefant'].includes(UNITS[u.kind].klasse);
        }).length;
        if (UNITS[k].kite && backFree === 0) s -= 3;
        // Fotfolk foran - men bare det som tåler det fienden kommer med.
        if ((kl === 'tung' || kl === 'lett') && wall < Math.min(3, openCols.length) && counterScore(g, k) >= 0) s += 2.5;
    }
    return s;
}

// ---------------------------------------------------------------------------
// Plassering: hvor hører en enhet hjemme?
// ---------------------------------------------------------------------------

function prefSlots(g: G, u: Unit): [number, number][] {
    const d = UNITS[u.kind];
    const F: [number, number][] = [
        [0, 2],
        [0, 1],
        [0, 3],
        [0, 0],
        [0, 4],
    ];
    const B: [number, number][] = [
        [1, 2],
        [1, 1],
        [1, 3],
        [1, 0],
        [1, 4],
    ];
    const FL: [number, number][] = [
        [0, 4],
        [1, 4],
        [0, 0],
        [1, 0],
    ];
    if (d.klasse === 'skytter' || d.kite) return [...B, ...F];
    if (d.klasse === 'kav') return [...FL, ...B, ...F];
    if (d.klasse === 'lett') {
        // Mot vogner og elefanter: stå rett foran dem.
        const cols: number[] = [];
        for (let c = 0; c < COLS; c++) {
            const e = g.enemy[0]?.[c];
            if (e && (UNITS[e.kind].klasse === 'vogn' || UNITS[e.kind].klasse === 'elefant')) cols.push(c);
        }
        return [...cols.map((c) => [0, c] as [number, number]), ...F, ...B];
    }
    return [...F, ...B];
}

type Variant = 'standard' | 'speil' | 'reserve';

/** Idéell oppstilling: hver enhet får sin rute. */
function layoutUnits(g: G, units: Unit[], v: Variant = 'standard'): Map<Unit, [number, number]> {
    const rank = (u: Unit) => {
        const k = UNITS[u.kind].klasse;
        const base = { tung: 0, elefant: 1, lett: 2, vogn: 3, kav: 4, skytter: 5 }[k];
        return base * 10 - u.star - (UNITS[u.kind].hero ? 0.5 : 0);
    };
    const sorted = [...units].sort((a, b) => rank(a) - rank(b));
    const taken = new Set<string>();
    const out = new Map<Unit, [number, number]>();
    for (const u of sorted) {
        let prefs = prefSlots(g, u);
        const d = UNITS[u.kind];
        if (d.klasse === 'kav' && !d.kite) {
            if (v === 'speil') prefs = prefs.map(([r, c]) => [r, 4 - c] as [number, number]);
            if (v === 'reserve')
                prefs = [
                    [1, 2],
                    [1, 1],
                    [1, 3],
                    ...prefs,
                ];
        }
        // Leseren: blant de ledige rutene i riktig rekke, velg kolonnen der enheten møter
        // det den slår. Rekkefølgen i prefs avgjør bare ved likt.
        const open = prefs.filter(([r, c]) => !colClosed(g, c) && !taken.has(r + ':' + c));
        if (!open.length) continue;
        const row0 = open[0][0];
        const flank = d.klasse === 'kav' && !d.kite;
        let pickRC = open[0];
        if (!flank) {
            let bestS = -Infinity;
            open.forEach(([r, c], i) => {
                if (r !== row0) return;
                const sc = laneScore(g, u.kind, c) - i * 0.01;
                if (sc > bestS) {
                    bestS = sc;
                    pickRC = [r, c];
                }
            });
        }
        taken.add(pickRC[0] + ':' + pickRC[1]);
        out.set(u, pickRC);
    }
    return out;
}

/** Hvor godt enheten passer mot fienden i kolonnen rett overfor. */
function laneScore(g: G, k: Kind, col: number) {
    let s = 0;
    let n = 0;
    for (let dc = -1; dc <= 1; dc++) {
        const c = col + dc;
        if (c < 0 || c >= COLS) continue;
        const w = dc === 0 ? 1 : 0.35;
        for (let r = 0; r < 2; r++) {
            const e = g.enemy[r]?.[c];
            if (!e) continue;
            s += w * matchup(k, e.kind) * (r === 0 ? 1 : 0.6) * e.star;
            n += w;
        }
    }
    return n ? s / n : 0;
}

/** Grovt: hvor godt a gjør det mot b (positivt = a vinner). */
function matchup(a: Kind, b: Kind) {
    const A = UNITS[a];
    const B = UNITS[b];
    let s = 0;
    if (A.pike && B.klasse === 'kav' && !B.kite) s += 2;
    if (A.klasse === 'lett' && (B.klasse === 'vogn' || B.klasse === 'elefant')) s += 3;
    if (A.klasse === 'lett' && (B.klasse === 'skytter' || B.kite)) s += 1.5;
    if (A.klasse === 'skytter' && B.klasse === 'tung') s += 1.5;
    if (A.klasse === 'elefant' && B.klasse === 'kav') s += 2;
    if (A.klasse === 'tung' && B.klasse === 'lett') s += 0.5;
    if (B.pike && A.klasse === 'kav') s -= 2;
    if ((B.klasse === 'vogn' || B.klasse === 'elefant') && A.klasse !== 'lett') s -= 1.5;
    if (B.klasse === 'skytter' && A.klasse === 'tung') s -= 1;
    return s;
}

function layout(g: G): Map<Unit, [number, number]> {
    const units: Unit[] = [];
    for (const row of g.board) for (const u of row) if (u) units.push(u);
    return layoutUnits(g, units);
}

export function gridOf(map: Map<Unit, [number, number]>): (Unit | null)[][] {
    const grid: (Unit | null)[][] = [Array(COLS).fill(null), Array(COLS).fill(null)];
    for (const [u, [r, c]] of map) grid[r][c] = u;
    return grid;
}

function findLoc(g: G, u: Unit): Loc | null {
    for (let r = 0; r < 2; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c] === u) return { at: 'board', row: r, col: c };
    for (let i = 0; i < BENCH; i++) if (g.bench[i] === u) return { at: 'bench', i };
    return null;
}

/** Ett flytt mot en oppstilling. true = flyttet noe. */
export function arrange(g: G, want: Map<Unit, [number, number]> = layout(g)): boolean {
    for (const [u, [r, c]] of want) {
        if (g.board[r][c] === u) continue;
        const from = findLoc(g, u);
        if (from && move(g, from, { at: 'board', row: r, col: c })) return true;
    }
    return false;
}

function freeBoardSlot(g: G, u: Unit, smart: boolean): Loc | null {
    const list: [number, number][] = smart
        ? prefSlots(g, u)
        : [
              [0, 0],
              [0, 1],
              [0, 2],
              [0, 3],
              [0, 4],
              [1, 0],
              [1, 1],
              [1, 2],
              [1, 3],
              [1, 4],
          ];
    for (const [r, c] of list) if (!g.board[r][c] && !colClosed(g, c)) return { at: 'board', row: r, col: c };
    return null;
}

function unitValue(g: G, style: BotStyle, u: Unit, reads: boolean) {
    return wantScore(g, style, u.kind, reads) + (u.star - 1) * 4 + UNITS[u.kind].cost * 0.3;
}

// ---------------------------------------------------------------------------
// Roboten
// ---------------------------------------------------------------------------

interface Mem {
    round: number;
    rerolls: number;
    moves: number;
    sold: number;
    target: Map<Unit, [number, number]> | null;
}
const MEM = new WeakMap<G, Mem>();

export function botTick(g: G, style: BotStyle, io: IO | null, rng: Rng, n: number) {
    void n;
    let m = MEM.get(g);
    if (!m) {
        m = { round: -1, rerolls: 0, moves: 0, sold: 0, target: null };
        MEM.set(g, m);
    }
    if (m.round !== g.round) {
        m.round = g.round;
        m.rerolls = 0;
        m.moves = 0;
        m.sold = 0;
        m.target = null;
    }
    if (style === 'tilfeldig') return randomTick(g, io, rng);
    if (g.phase === 'belonning') return rewardTick(g, style, io);
    if (g.phase === 'slag') return battleTick(g, style, io, rng);
    if (g.phase !== 'plan') return;
    if (style === 'dyr') return expensiveTick(g, io);
    if (style === 'ensartet') return uniformTick(g, io, m);
    const reads = style !== 'halvgod' || g.round % 3 === 0;
    const saves = style !== 'halvgod';

    // 1. Benk -> brett.
    for (let i = 0; i < BENCH; i++) {
        const u = g.bench[i];
        if (!u) continue;
        if (boardCount(g) < boardCap(g)) {
            const to = freeBoardSlot(g, u, style !== 'halvgod');
            if (to && move(g, { at: 'bench', i }, to)) return;
        } else {
            // Bytt ut den svakeste på brettet om benken har noe bedre.
            let worst: { loc: Loc; v: number } | null = null;
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < COLS; c++) {
                    const b = g.board[r][c];
                    if (!b || UNITS[b.kind].hero) continue;
                    const v = unitValue(g, style, b, reads);
                    if (!worst || v < worst.v) worst = { loc: { at: 'board', row: r, col: c }, v };
                }
            if (worst && unitValue(g, style, u, reads) > worst.v + 0.8 && move(g, { at: 'bench', i }, worst.loc)) return;
        }
    }
    // 2. Kjøp det som passer best.
    const reserve = saves && g.round >= 1 && boardCount(g) >= boardCap(g) - 1 ? 10 : 0;
    let best = -1;
    const rich = g.gold >= reserve + 5 && g.bench.some((x) => !x);
    let bestS = boardCount(g) < boardCap(g) ? -0.5 : rich ? 0.4 : 1.2;
    g.shop.forEach((card, i) => {
        if (card.sold || card.cost > g.gold) return;
        let s: number;
        if (card.item) s = 3.5;
        else {
            s = wantScore(g, style, card.kind!, reads) + (reads && card.scout ? 1 : 0);
            const benchFull = g.bench.every(Boolean);
            const boardFull = boardCount(g) >= boardCap(g);
            if (boardFull && copies(g, card.kind!) === 0) s -= 2.5;
            if (benchFull && copies(g, card.kind!) < 2) s = -9;
        }
        const after = g.gold - card.cost;
        if (after < reserve && !(card.kind && copies(g, card.kind) >= 2)) s -= 3;
        if (s > bestS) {
            bestS = s;
            best = i;
        }
    });
    if (best >= 0 && buy(g, best, io)) return;
    // 2b. Bygg om: selg en enhet som passer dårlig mot neste fiende når butikken har et
    // klart bedre svar (salg gir full pris tilbake).
    if (reads && style !== 'halvgod' && m.sold < 3) {
        let cardBest = -Infinity;
        let cardCost = 0;
        for (const c of g.shop)
            if (!c.sold && c.kind) {
                const v = wantScore(g, style, c.kind, true);
                if (v > cardBest) {
                    cardBest = v;
                    cardCost = c.cost;
                }
            }
        for (let r = 0; r < 2; r++)
            for (let c = 0; c < COLS; c++) {
                const u = g.board[r][c];
                if (!u || UNITS[u.kind].hero || u.star > 2) continue;
                // En stjerne koster mer å bygge opp igjen: krev et større misforhold.
                const gap = u.star > 1 ? 1.5 : 2.5;
                const v = unitValue(g, style, u, true) - (u.star - 1) * 4 + (u.star - 1) * 1.5;
                if (v < cardBest - gap && g.gold + sellValue(u) >= cardCost) {
                    if (sell(g, { at: 'board', row: r, col: c }, io)) {
                        m.sold++;
                        return;
                    }
                }
            }
    }
    // 3. Selg benkfyll som ikke blir noe.
    if (g.bench.every(Boolean)) {
        for (let i = 0; i < BENCH; i++) {
            const u = g.bench[i]!;
            if (copies(g, u.kind, u.star) < 2 && sell(g, { at: 'bench', i }, io)) return;
        }
    }
    // 4. Still opp riktig.
    if (m.moves < 24 && style !== 'halvgod' && arrange(g)) {
        m.moves++;
        return;
    }
    // 5. Rull om hvis det er råd til det og brettet ikke er fullt.
    const room = boardCount(g) < boardCap(g) || g.round >= 4;
    const maxRolls = 3 + Math.max(0, Math.floor((g.gold - reserve) / 4));
    if (room && style !== 'halvgod' && m.rerolls < maxRolls && g.gold >= reserve + 3 && reroll(g, io)) {
        m.rerolls++;
        return;
    }
    startBattle(g, io);
}

function battleTick(g: G, style: BotStyle, io: IO | null, rng: Rng) {
    if (g.abilityUsed || !g.abilityReady) return;
    if (style === 'dyr' || style === 'ensartet') {
        fireAbility(g, io);
        return;
    }
    if (style === 'halvgod') {
        if (rng() < 0.08) fireAbility(g, io);
        return;
    }
    const own = g.squads.filter((s) => s.side === 0 && !s.dead && !s.fled);
    const foe = g.squads.filter((s) => s.side === 1 && !s.dead && !s.fled);
    const foeEngaged = foe.filter((s) => s.engaged >= 0).length;
    const ownEngaged = own.filter((s) => s.engaged >= 0).length;
    const t = g.battleT;
    let go = false;
    switch (g.leader) {
        case 'aleksander':
            go = foeEngaged >= 2 || t > 14;
            break;
        case 'parmenion':
            go = ownEngaged >= 2 || t > 12;
            break;
        case 'mazaios':
            go = foeEngaged >= 1 || t > 8;
            break;
        case 'oxyartes':
            go = own.some((s) => UNITS[s.kind].klasse === 'kav' && s.engaged >= 0 && s.charged) || foeEngaged >= 2 || t > 10;
            break;
        case 'poros':
            go = own.some((s) => UNITS[s.kind].klasse === 'elefant' && (s.engaged >= 0 || s.hp < s.max * 0.5)) || t > 10;
            break;
    }
    if (go) fireAbility(g, io);
}

function rewardTick(g: G, style: BotStyle, io: IO | null) {
    const opts = g.reward ?? [];
    let best = opts.length - 1;
    let bestS = -Infinity;
    opts.forEach((o, i) => {
        let s = 0;
        if (o.item) s = 3;
        else if (o.gold) s = 1.5;
        else if (o.kind) {
            s = style === 'dyr' ? UNITS[o.kind].cost : style === 'ensartet' ? (UNITS[o.kind].klasse === 'kav' ? 5 : -1) : wantScore(g, style, o.kind, true);
        }
        if (s > bestS) {
            bestS = s;
            best = i;
        }
    });
    pickReward(g, best, io);
}

function expensiveTick(g: G, io: IO | null) {
    for (let i = 0; i < BENCH; i++) {
        const u = g.bench[i];
        if (!u) continue;
        const to = freeBoardSlot(g, u, false);
        if (to && boardCount(g) < boardCap(g) && move(g, { at: 'bench', i }, to)) return;
    }
    let best = -1;
    let bestC = 0;
    g.shop.forEach((c, i) => {
        if (c.sold || c.cost > g.gold) return;
        if (c.kind && g.bench.every(Boolean) && copies(g, c.kind) < 2) return;
        if (c.cost > bestC) {
            bestC = c.cost;
            best = i;
        }
    });
    if (best >= 0 && buy(g, best, io)) return;
    startBattle(g, io);
}

function uniformTick(g: G, io: IO | null, m: Mem) {
    for (let i = 0; i < BENCH; i++) {
        const u = g.bench[i];
        if (!u) continue;
        const to = freeBoardSlot(g, u, false);
        if (to && boardCount(g) < boardCap(g) && move(g, { at: 'bench', i }, to)) return;
    }
    let best = -1;
    let bestC = -1;
    g.shop.forEach((c, i) => {
        if (c.sold || !c.kind || c.cost > g.gold) return;
        if (UNITS[c.kind].klasse !== 'kav') return;
        if (g.bench.every(Boolean) && copies(g, c.kind) < 2) return;
        const v = c.cost + copies(g, c.kind) * 2;
        if (v > bestC) {
            bestC = v;
            best = i;
        }
    });
    if (best >= 0 && buy(g, best, io)) return;
    if (m.rerolls < 4 && g.gold >= 3 && reroll(g, io)) {
        m.rerolls++;
        return;
    }
    startBattle(g, io);
}

function randomTick(g: G, io: IO | null, rng: Rng) {
    if (g.phase === 'belonning') {
        pickReward(g, Math.floor(rng() * (g.reward?.length ?? 1)), io);
        return;
    }
    if (g.phase === 'slag') {
        if (rng() < 0.1) fireAbility(g, io);
        return;
    }
    if (g.phase !== 'plan') return;
    const r = rng();
    if (r < 0.35) buy(g, Math.floor(rng() * g.shop.length), io);
    else if (r < 0.6) {
        const from: Loc = rng() < 0.5 ? { at: 'bench', i: Math.floor(rng() * BENCH) } : { at: 'board', row: Math.floor(rng() * 2), col: Math.floor(rng() * COLS) };
        const to: Loc = rng() < 0.7 ? { at: 'board', row: Math.floor(rng() * 2), col: Math.floor(rng() * COLS) } : { at: 'bench', i: Math.floor(rng() * BENCH) };
        if (unitAt(g, from)) move(g, from, to);
    } else if (r < 0.7) reroll(g, io);
    else if (r < 0.75) sell(g, { at: 'bench', i: Math.floor(rng() * BENCH) }, io);
    else if (r < 0.82) startBattle(g, io);
}

