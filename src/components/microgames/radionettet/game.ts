import { ECONOMY, RADIO, SCORE, UNITS, COMBAT, ORDERS, PLAN_MAX, KORT, KORT_TALL, type EKind, type Kind, type KortId } from './tuning';
import { SLAG, MAP_W, MAP_D, TOTAL_WAVES, FLYPLASS, type SlagDef, type WaveDef } from './levels';
import { stepWave } from './combat';

// Tilstanden og grepene eleven (og robotene) gjør. Kampen per tidssteg står i combat.ts.

export type Rng = () => number;

export interface Unit {
    id: number;
    kind: Kind;
    /** Rute (bakke) eller flyplass-plass (fly). */
    x: number;
    z: number;
    hp: number;
    maxHp: number;
    /** Kopier på ruta: 3 = veteran. */
    copies: number;
    vet: boolean;
    /** I radionettet (linja er oppe). */
    linked: boolean;
    /** Hvem radioen går gjennom: 0 = kommandovogna, ellers id-en til stafetten. */
    via: number;
    /** >0 mens linja kobles opp. */
    linking: number;
    cd: number;
    /** Fly: posisjon i lufta, fart og tilstand. */
    ax: number;
    az: number;
    alt: number;
    heading: number;
    mode: 'bakke' | 'patrulje' | 'jakt' | 'tokt' | 'hjem';
    tx: number;
    tz: number;
    toktCd: number;
    dead: boolean;
    /** Rekyl og treff for visningen. */
    kick: number;
}

export interface Enemy {
    id: number;
    kind: EKind;
    /** Veien den følger (indeks i g.roads), og hvor langt den har kommet. */
    r: number;
    s: number;
    x: number;
    z: number;
    alt: number;
    hp: number;
    maxHp: number;
    dug: boolean;
    cd: number;
    /** Fly: mål og fase. */
    targetId: number;
    /** Panservern: tid uten vogn i sikte. Jagerfly: tid uten mål. */
    timer: number;
    phase: 'inn' | 'stup' | 'ut';
    heading: number;
    dead: boolean;
    passed: boolean;
    kick: number;
    /** Batteriet har skutt: eleven har sett munningsflammen (plassen er kjent). */
    revealed: boolean;
}

export interface Fx {
    kind: 'skudd' | 'smell' | 'granat' | 'kutt' | 'sperre';
    x: number;
    z: number;
    x2: number;
    z2: number;
    alt: number;
    t: number;
    life: number;
    fiende: boolean;
    /** Hvem som skjøt (enhets- eller fiendetype), for flamme, granat og lyd. */
    by?: string;
    /** Målet er pansret: granaten slår gnister. */
    hard?: boolean;
}

export type Phase = 'plan' | 'wave' | 'slagVunnet' | 'vunnet' | 'tapt';
export type Cause = 'brudd' | 'hq';

export interface G {
    rng: Rng;
    slag: number;
    wave: number;
    phase: Phase;
    t: number;
    waveT: number;
    /** Sekunder i planleggingen. Fienden venter ikke for evig. */
    planT: number;
    forsyninger: number;
    linje: number;
    hqHp: number;
    units: Unit[];
    enemies: Enemy[];
    fx: Fx[];
    shop: (Kind | null)[];
    /** Kortet eleven holder (valgt i butikken, venter på en rute). */
    holding: number;
    spawned: number[];
    nextId: number;
    score: number;
    kills: number;
    tap: number;
    valg: number;
    sperreild: number;
    sperreArmed: boolean;
    pendingSperre: { x: number; z: number; t: number } | null;
    cause: Cause | null;
    stjerner: number[];
    /** Øker hver gang en ny planlegging starter (visningen viser da det nye). */
    planSerial: number;
    shake: number;
    /** Visningen: hva nettet ser akkurat nå (id-er). */
    netSeen: Set<number>;
    /** Samvirke-teller for «Dette skjedde»: skudd på mål nettet så. */
    netShots: number;
    roads: Road[];
    /** Ordrekortene eleven har valgt, og de tre som tilbys etter et vunnet slag. */
    kort: KortId[];
    kortTilbud: KortId[];
    /** Batterier eleven har sett skyte i dette slaget (de står samme sted neste bølge). */
    kjentBatt: [number, number][];
}

export interface IO {
    sfx: (name: string) => void;
    banner: (text: string) => void;
    lesson: (key: string, text: string) => void;
    event: (name: string, x: number, z: number) => void;
}

// ---- Veien -----------------------------------------------------------------
export interface Road {
    pts: [number, number][];
    seg: number[];
    len: number;
}

export function makeRoad(pts: [number, number][]): Road {
    const seg: number[] = [];
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        len += d;
    }
    return { pts, seg, len };
}

export function roadAt(r: Road, s: number): [number, number] {
    let rest = Math.max(0, Math.min(s, r.len));
    for (let i = 0; i < r.seg.length; i++) {
        if (rest <= r.seg[i]) {
            const a = r.pts[i];
            const b = r.pts[i + 1];
            const k = r.seg[i] ? rest / r.seg[i] : 0;
            return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        }
        rest -= r.seg[i];
    }
    return r.pts[r.pts.length - 1];
}

/** Korteste avstand til nærmeste vei. */
export function roadDistAll(g: G, x: number, z: number) {
    let best = Infinity;
    for (const r of g.roads) best = Math.min(best, roadDist(r, x, z));
    return best;
}

/** Korteste avstand fra et punkt til veien. */
export function roadDist(r: Road, x: number, z: number) {
    let best = Infinity;
    for (let i = 1; i < r.pts.length; i++) {
        const [ax, az] = r.pts[i - 1];
        const [bx, bz] = r.pts[i];
        const dx = bx - ax;
        const dz = bz - az;
        const l2 = dx * dx + dz * dz || 1;
        const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        best = Math.min(best, Math.hypot(x - ax - dx * k, z - az - dz * k));
    }
    return best;
}

// ---- Oppsett -------------------------------------------------------------------
export function slagDef(g: G): SlagDef {
    return SLAG[g.slag];
}

export function waveDef(g: G): WaveDef {
    return SLAG[g.slag].waves[g.wave];
}

export function newGame(seed = 1, startSlag = 0): G {
    let s = seed >>> 0 || 1;
    const rng: Rng = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const g: G = {
        rng,
        slag: startSlag,
        wave: 0,
        phase: 'plan',
        t: 0,
        waveT: 0,
        planT: 0,
        forsyninger: 0,
        linje: SCORE.linje,
        hqHp: COMBAT.hqHp,
        units: [],
        enemies: [],
        fx: [],
        shop: [],
        holding: -1,
        spawned: [],
        nextId: 1,
        score: 0,
        kills: 0,
        tap: 0,
        valg: 0,
        sperreild: 0,
        sperreArmed: false,
        pendingSperre: null,
        cause: null,
        stjerner: [],
        planSerial: 0,
        shake: 0,
        netSeen: new Set(),
        netShots: 0,
        roads: SLAG[startSlag].veier.map(makeRoad),
        kort: [],
        kortTilbud: [],
        kjentBatt: [],
    };
    startSlag_(g);
    return g;
}

function startSlag_(g: G) {
    const def = slagDef(g);
    g.roads = def.veier.map(makeRoad);
    g.kortTilbud = [];
    g.kjentBatt = [];
    g.wave = 0;
    g.units = [];
    g.enemies = [];
    g.fx = [];
    g.forsyninger = def.start;
    g.linje = SCORE.linje;
    g.hqHp = COMBAT.hqHp;
    g.sperreild = 0;
    startPlan(g, true);
}

function startPlan(g: G, first: boolean) {
    const w = waveDef(g);
    g.phase = 'plan';
    g.planT = 0;
    if (!first) g.forsyninger += (w.inntekt ?? ECONOMY.perBølge) + (har(g, 'forsyning') ? KORT_TALL.forsyning : 0);
    g.sperreild = (w.sperreild ? ORDERS.perSlag : 0) + (har(g, 'sperre') ? 1 : 0);
    g.sperreArmed = false;
    g.holding = -1;
    g.shop = w.fast ? [...w.fast] : drawShop(g);
    g.valg += g.shop.length;
    // Linjer som er oppe, blir stående. Kanaler kan bli færre enn linjer (ikke i dag).
    for (const u of g.units) {
        u.hp = u.maxHp;
        if (!unitsCanLink(g)) u.linked = false;
    }
    g.planSerial += 1;
}

function drawShop(g: G): Kind[] {
    const pool = waveDef(g).pool;
    return Array.from({ length: 3 }, () => pool[Math.floor(g.rng() * pool.length)]);
}

// ---- Grep: butikk, plassering, radio, bølge, ordre ---------------------------------
export function reroll(g: G) {
    if (g.phase !== 'plan' || g.forsyninger < ECONOMY.bytt) return false;
    g.forsyninger -= ECONOMY.bytt;
    g.shop = drawShop(g);
    g.holding = -1;
    g.valg += 1;
    return true;
}

export function pick(g: G, i: number) {
    const k = g.shop[i];
    if (g.phase !== 'plan' || !k) return false;
    if (UNITS[k].pris > g.forsyninger) return false;
    g.holding = g.holding === i ? -1 : i;
    return true;
}

/** Styrken til en enhet: to like på samme rute er sterkere, tre er en veteran. */
export function power(u: Unit) {
    return COMBAT.kopier[Math.min(u.copies, 3) - 1];
}

export function isAir(k: Kind) {
    return !!UNITS[k].fly;
}

export function har(g: G, k: KortId) {
    return g.kort.includes(k);
}

/** Ruter der ingenting kan stå: vei, elv og kommandovogna. */
export function blocked(g: G, cx: number, cz: number) {
    if (cx < 0 || cz < 0 || cx >= MAP_W || cz >= MAP_D) return true;
    if (roadDistAll(g, cx, cz) < 0.75) return true;
    const elv = slagDef(g).elv;
    if (elv && cx > elv[0] && cx < elv[1]) return true;
    const [hx, hz] = slagDef(g).hq;
    return Math.abs(cx - hx) < 0.6 && Math.abs(cz - hz) < 0.6;
}

/** Kan kortet eleven holder, legges på ruta (x, z)? Bakkeenheter bare der radioen når
 *  (ringen og stafetten); fallskjermsoldater hvor som helst. Fly alltid på flyplassen. */
export function canPlace(g: G, x: number, z: number): boolean {
    const k = g.holding >= 0 ? g.shop[g.holding] : null;
    if (!k || isAir(k)) return false;
    const cx = Math.floor(x) + 0.5;
    const cz = Math.floor(z) + 0.5;
    if (blocked(g, cx, cz)) return false;
    const on = unitAt(g, cx, cz);
    if (on) return on.kind === k && !on.vet;
    return !!UNITS[k].hopp || reachable(g, cx, cz);
}

export function unitAt(g: G, x: number, z: number) {
    return g.units.find((u) => !u.dead && !isAir(u.kind) && Math.abs(u.x - x) < 0.1 && Math.abs(u.z - z) < 0.1);
}

/** Legg kortet på ruta. Fly: (x, z) ignoreres. */
export function place(g: G, x: number, z: number, io?: IO): boolean {
    const i = g.holding;
    const k = i >= 0 ? g.shop[i] : null;
    if (!k || g.phase !== 'plan') return false;
    const pris = UNITS[k].pris;
    if (pris > g.forsyninger) return false;
    let cx = Math.floor(x) + 0.5;
    let cz = Math.floor(z) + 0.5;
    if (isAir(k)) {
        const same = g.units.find((u) => !u.dead && u.kind === k && !u.vet);
        if (same) return merge(g, same, i, pris, io);
        const n = g.units.filter((u) => !u.dead && isAir(u.kind)).length;
        cx = FLYPLASS[0] + (n % 2) * 1.1;
        cz = FLYPLASS[1] - Math.floor(n / 2) * 1.3;
    } else {
        if (!canPlace(g, x, z)) return false;
        const on = unitAt(g, cx, cz);
        if (on) return merge(g, on, i, pris, io);
    }
    g.forsyninger -= pris;
    g.shop[i] = null;
    g.holding = -1;
    const st = UNITS[k];
    g.units.push({
        id: g.nextId++,
        kind: k,
        x: cx,
        z: cz,
        hp: st.hp,
        maxHp: st.hp,
        copies: 1,
        vet: false,
        linked: false,
        via: 0,
        linking: 0,
        cd: 0,
        ax: cx,
        az: cz,
        alt: 0,
        heading: 0,
        mode: 'bakke',
        tx: cx,
        tz: cz,
        toktCd: 3,
        dead: false,
        kick: 0,
    });
    io?.sfx('plasser');
    return true;
}

function merge(g: G, u: Unit, i: number, pris: number, io?: IO) {
    g.forsyninger -= pris;
    g.shop[i] = null;
    g.holding = -1;
    u.copies += 1;
    u.maxHp = UNITS[u.kind].hp * power(u);
    if (u.copies >= 3) {
        u.vet = true;
        io?.sfx('veteran');
        io?.event('veteran', u.x, u.z);
    }
    u.hp = u.maxHp;
    return true;
}

/** Flytt en egen bakkeenhet til en annen ledig rute (bare i planleggingen). */
export function move(g: G, id: number, x: number, z: number) {
    const u = g.units.find((v) => v.id === id);
    if (!u || u.dead || isAir(u.kind) || g.phase !== 'plan') return false;
    const cx = Math.floor(x) + 0.5;
    const cz = Math.floor(z) + 0.5;
    if (blocked(g, cx, cz) || unitAt(g, cx, cz)) return false;
    u.x = u.ax = cx;
    u.z = u.az = cz;
    return true;
}

export function channels(g: G) {
    const k = waveDef(g).kanaler;
    return k > 0 && har(g, 'kanal') ? k + 1 : k;
}

/** Radioringen rundt kommandovogna og hvor langt en stafett når (ruter). */
export function ringOf(g: G) {
    return slagDef(g).ring ?? RADIO.rekkevidde;
}
export function stafettOf(_g: G) {
    return RADIO.stafett;
}

const isRelay = (u: Unit, not = -1) => u.linked && !u.dead && !isAir(u.kind) && u.id !== not;

/** Når radioen hit? Innenfor ringen, eller innenfor stafetten fra en bakkeenhet i nettet. */
export function reachable(g: G, x: number, z: number, not = -1) {
    const [hx, hz] = slagDef(g).hq;
    if (Math.hypot(x - hx, z - hz) <= ringOf(g)) return true;
    const r = stafettOf(g);
    return g.units.some((u) => isRelay(u, not) && Math.hypot(u.x - x, u.z - z) <= r);
}

/** Radioen går fra kommandovogna og videre fra enhet til enhet. Ryker et ledd, faller
 *  de som hang etter det, ut av nettet. Setter også `via` (hvem linja går fra). */
export function relink(g: G, io?: IO) {
    const [hx, hz] = slagDef(g).hq;
    const ring = ringOf(g);
    const r = stafettOf(g);
    const on = new Set<number>();
    const ground = g.units.filter((u) => isRelay(u));
    for (const u of ground)
        if (Math.hypot(u.x - hx, u.z - hz) <= ring) {
            on.add(u.id);
            u.via = 0;
        }
    for (let grew = true; grew; ) {
        grew = false;
        for (const u of ground) {
            if (on.has(u.id)) continue;
            const p = ground.find((v) => on.has(v.id) && Math.hypot(v.x - u.x, v.z - u.z) <= r);
            if (p) {
                on.add(u.id);
                u.via = p.id;
                grew = true;
            }
        }
    }
    for (const u of ground)
        if (!on.has(u.id)) {
            u.linked = false;
            g.valg += 1;
            io?.event('brutt', u.x, u.z);
        }
    for (const u of g.units) {
        if (isAir(u.kind)) u.via = 0;
        else if (u.linking > 0) {
            // Linja som kobles opp, går fra nærmeste stafett når enheten står utenfor ringen.
            const p = Math.hypot(u.x - hx, u.z - hz) <= ring ? undefined : ground.find((v) => on.has(v.id) && Math.hypot(v.x - u.x, v.z - u.z) <= r);
            u.via = p ? p.id : 0;
        }
    }
}

export function unitsCanLink(g: G) {
    return channels(g) > 0;
}

export function usedChannels(g: G) {
    return g.units.filter((u) => !u.dead && (u.linked || u.linking > 0)).length;
}

export function inRange(g: G, u: Unit) {
    return isAir(u.kind) || reachable(g, u.x, u.z, u.id);
}

/** Hvorfor enheten ikke kan kobles nå (null = den kan). */
export function linkBlock(g: G, u: Unit): 'ingenRadio' | 'rekkevidde' | 'fullt' | null {
    if (!unitsCanLink(g)) return 'ingenRadio';
    if (!inRange(g, u)) return 'rekkevidde';
    if (usedChannels(g) >= channels(g)) return 'fullt';
    return null;
}

/** Kjerneverbet: koble en enhet til radionettet, eller koble den fra. */
export function toggleLink(g: G, id: number, io?: IO): boolean {
    const u = g.units.find((v) => v.id === id);
    if (!u || u.dead || g.phase === 'vunnet' || g.phase === 'tapt') return false;
    if (u.linked || u.linking > 0) {
        u.linked = false;
        u.linking = 0;
        io?.sfx('frakoble');
        return true;
    }
    if (linkBlock(g, u)) return false;
    u.linking = RADIO.koble;
    io?.sfx('koble');
    return true;
}

export function startWave(g: G, io?: IO) {
    if (g.phase !== 'plan') return false;
    g.phase = 'wave';
    g.waveT = 0;
    g.holding = -1;
    g.spawned = waveDef(g).groups.map(() => 0);
    for (const u of g.units) {
        if (isAir(u.kind)) {
            u.mode = u.kind === 'jag' ? 'patrulje' : 'bakke';
            u.toktCd = 3;
            u.ax = u.x;
            u.az = u.z;
        }
    }
    io?.sfx('bølge');
    io?.banner(`BØLGE ${g.wave + 1} AV ${slagDef(g).waves.length}`);
    return true;
}

/** Ordren: sperreild på et punkt. Første klikk væpner, neste velger stedet. */
export function sperre(g: G, x: number, z: number, io?: IO) {
    if (g.phase !== 'wave' || g.sperreild <= 0 || g.pendingSperre) return false;
    g.sperreild -= 1;
    g.sperreArmed = false;
    g.pendingSperre = { x, z, t: ORDERS.sperreild.forsinkelse };
    io?.sfx('ordre');
    return true;
}

/** Neste slag etter en seier, med ordrekortet eleven valgte. */
export function nextSlag(g: G, kort?: KortId) {
    if (g.phase !== 'slagVunnet') return false;
    if (kort && g.kortTilbud.includes(kort) && !har(g, kort)) g.kort.push(kort);
    g.slag += 1;
    startSlag_(g);
    return true;
}

// ---- Tidssteget -------------------------------------------------------------------
export function update(g: G, dt: number, io: IO) {
    if (g.phase === 'vunnet' || g.phase === 'tapt') return;
    g.t += dt;
    for (const u of g.units)
        if (u.linking > 0) {
            u.linking -= dt;
            if (u.linking <= 0) {
                u.linking = 0;
                u.linked = !u.dead && inRange(g, u);
            }
        }
    relink(g, io);
    if (g.phase === 'plan') {
        g.planT += dt;
        if (g.planT >= PLAN_MAX) startWave(g, io);
        return;
    }
    if (g.phase !== 'wave') return;
    g.waveT += dt;
    stepWave(g, dt, io);
    if (g.linje <= 0) return lose(g, 'brudd', io);
    if (g.hqHp <= 0) return lose(g, 'hq', io);
    const w = waveDef(g);
    const allSpawned = w.groups.every((gr, i) => g.spawned[i] >= gr.n);
    // Batteriene står til resten er slått: da trekker de seg tilbake.
    if (allSpawned && g.enemies.every((e) => e.dead || e.passed || e.kind === 'ebatt')) waveWon(g, io);
}

function waveWon(g: G, io: IO) {
    g.enemies = [];
    for (const u of g.units) if (isAir(u.kind)) u.mode = 'bakke';
    g.units = g.units.filter((u) => !u.dead);
    const def = slagDef(g);
    if (g.wave + 1 < def.waves.length) {
        g.wave += 1;
        io.sfx('holdt');
        startPlan(g, false);
        return;
    }
    const st = SCORE.stjerner.filter((n) => g.linje >= n).length;
    g.stjerner[g.slag] = Math.max(g.stjerner[g.slag] ?? 0, st);
    g.score += g.linje * SCORE.linjeBonus;
    io.lesson(def.id, def.lærdom);
    io.sfx('seier');
    g.phase = g.slag + 1 < SLAG.length ? 'slagVunnet' : 'vunnet';
    // Tre ordrekort å velge mellom før neste slag (de eleven ikke har).
    const rest = (Object.keys(KORT) as KortId[]).filter((k) => !har(g, k));
    for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(g.rng() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    g.kortTilbud = rest.slice(0, 3);
}

function lose(g: G, cause: Cause, io: IO) {
    g.phase = 'tapt';
    g.cause = cause;
    io.sfx('tap');
}

export const CAUSE_TEXT: Record<Cause, { tittel: string; tips: string }> = {
    brudd: {
        tittel: 'Fienden brøt gjennom',
        tips: 'Enheter alene ser ikke alt. Koble vogna i nettet med infanteri, og artilleriet med dem som ser fienden.',
    },
    hq: {
        tittel: 'Kommandovogna ble slått ut',
        tips: 'Uten kommandovogna er det ingen radio. Still infanteri og luftvern rundt den.',
    },
};

// ---- Målinger for HUD, sim og selvspill -------------------------------------------------
export function wavesDone(g: G) {
    let n = 0;
    for (let i = 0; i < g.slag; i++) n += SLAG[i].waves.length;
    return n + g.wave + (g.phase === 'slagVunnet' || g.phase === 'vunnet' ? 1 : 0);
}

export function progress(g: G) {
    return Math.min(1, wavesDone(g) / TOTAL_WAVES);
}

export function pressure(g: G) {
    const threat = g.enemies.reduce((n, e) => (e.dead || e.passed ? n : n + e.hp / 400), 0);
    const late = wavesDone(g) / TOTAL_WAVES;
    const hurt = 1 - g.linje / SCORE.linje;
    return Math.max(0, Math.min(1, 0.35 * late + 0.4 * Math.min(1, threat) + 0.25 * hurt));
}

export function finalScore(g: G) {
    return Math.round(g.score);
}
