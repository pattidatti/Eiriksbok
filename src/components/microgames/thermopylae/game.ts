// TRE DAGER I PORTEN - spillreglene (ingen React, ingen three).
//
// Thermopylae, august 480 fvt. Du er én hoplitt ved den gamle fokiske muren i passet mellom
// fjellet (venstre, -x) og havet (høyre, +x). Perserne kommer forfra (-z). Leiren ligger bak
// muren (+z). Muren har én port.
//
// Fagkjernen er geometri, ikke tekst: fiendene finner plass rundt deg der det er plass. I porten
// dekker muren sidene, så bare tre når deg - og ingen kommer forbi. På stranda får åtte plass
// rundt deg, og resten går gjennom den åpne porten til leiren. Dag 3 kommer De udødelige bakfra
// over fjellstien (Efialtes), og porten har to sider.
//
// Koordinater: x på tvers (klippe -x, hav +x), z langs passet (perserne -z, leiren +z).
// yaw = 0 ser mot -z. Framover = (-sin yaw, -cos yaw), høyre = (cos yaw, -sin yaw).

export const DAYS = 3;
/** Dag 1 er kort (opplæring), dag 2 og 3 er fulle. */
export const DAY_LEN = [40, 60, 60];
export const DAY_START = [0, 40, 100];
export const RUN_SECONDS = 160;
export const OVERTIME_MAX = 45;
export const HP_MAX = 100;
export const GUARD_MAX = 100;
export const BREACH_MAX = 10;
/** Hver perser som slipper forbi porten, koster poeng. */
export const BREACH_COST = 300;
/** Sekunder en perser plyndrer i leiren før han teller som forbi. */
export const PLUNDER_S = 4;
/** Den som hentes igjen i leiren, gir bonus i stedet for straff. */
export const CATCH_BONUS = 150;

export const WALL_Z = 0;
export const WALL_HALF = 0.35;
export const GATE_HALF = 1.2;
export const WALL_H = 1.9;
export const CAMP_Z = 3;
export const SPAWN_Z = -36;
export const BACK_SPAWN: [number, number] = [-3.2, 22];
export const PLAYER_R = 0.55;
export const ENEMY_R = 0.42;
export const EYE = 1.65;
export const REACH = 2.6;
export const STRIKE_REACH = 2.0;
export const SLOT_R = 1.45;
/** Hvor langt et utfall rekker ekstra mot en fiende som vakler eller glir. */
export const LUNGE = 1.1;
/** Parering: skjoldet løftet de siste så mange sekundene før slaget treffer. */
export const PARRY_WINDOW = 0.4;

/** Halve bredden av passet ved z: der klippa og havet går. */
export function hw(z: number): number {
    if (z >= 2) return 5;
    if (z >= -10) return 4.5;
    if (z >= -16) return 4.5 + ((-10 - z) / 6) * 9.5;
    return 14;
}

export type Kind = 'lev' | 'imm' | 'boss';
export type EState =
    | 'march' // på vei inn i passet
    | 'engage' // på vei til plassen sin rundt spilleren
    | 'ready' // står på plassen, venter på å slå
    | 'windup' // løfter våpenet - varselet
    | 'recover' // etter et slag: åpen for kontring
    | 'stagger' // parert eller dyttet: vakler
    | 'knocked' // glir bakover etter et dytt
    | 'wait' // ingen plass rundt spilleren: venter i andre rekke
    | 'toclimb' // går mot muren for å klatre (De udødelige)
    | 'climb' // klatrer over muren
    | 'rush' // løper mot leiren
    | 'pursue' // forfølger en hoplitt på (falsk) flukt
    | 'plunder' // kom forbi og plyndrer i leiren - kan ennå hentes
    | 'dead';

export interface Enemy {
    id: number;
    kind: Kind;
    from: 'front' | 'back';
    x: number;
    z: number;
    y: number;
    vx: number;
    vz: number;
    vy: number;
    face: number;
    hp: number;
    state: EState;
    timer: number;
    slot: number;
    feint: boolean;
    feinted: boolean;
    waitT: number;
    climbX: number;
    spin: number;
    spinV: number;
    sea: boolean;
    counted: boolean;
    seen: boolean;
    /** Når varselet startet: skjold løftet etter dette er en parering. */
    timerStart: number;
}

export type PickKind = 'gull' | 'suppe';
export interface Pickup {
    id: number;
    kind: PickKind;
    x: number;
    z: number;
    life: number;
}

export interface Fx {
    kind: 'blod' | 'klang' | 'plask' | 'stov' | 'parer';
    x: number;
    y: number;
    z: number;
    t: number;
    n: number;
}

export type Cause = 'fall' | 'brudd';
export type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';
export type At = () => [number, number, number] | null;

export interface Sfx {
    stab: () => void;
    whiff: () => void;
    hit: (big: boolean) => void;
    clang: () => void;
    parry: () => void;
    hurt: () => void;
    shove: () => void;
    splash: () => void;
    warn: () => void;
    volley: () => void;
    pick: () => void;
    breach: () => void;
    horn: () => void;
    win: () => void;
    lose: () => void;
}

export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string, seconds?: number) => void;
    pin: (key: string, t: string, at: At, o?: { until?: () => boolean; seconds?: number }) => void;
    beat: (key: string, title: string, t: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, t: string, weight?: number) => void;
    timeScale: () => number;
    float: (t: string, p: [number, number, number], color?: string, big?: boolean) => void;
    lose: (cause: Cause) => void;
    win: () => void;
}

export interface G {
    rng: () => number;
    t: number;
    day: number;
    // spilleren
    px: number;
    pz: number;
    yaw: number;
    hp: number;
    guard: number;
    shield: boolean;
    shieldAt: number;
    guardBroken: number;
    atkCd: number;
    shoveCd: number;
    inFwd: number;
    inSide: number;
    inTurn: number;
    hurtT: number;
    // verden
    enemies: Enemy[];
    pickups: Pickup[];
    fx: Fx[];
    nextId: number;
    spawnFront: number;
    spawnImm: number;
    spawnBack: number;
    bossSpawned: boolean;
    bossDead: boolean;
    volleys: number[];
    volleyWarn: number; // >0: sekunder til pilene treffer
    volleyDark: number;
    gold: number;
    // tall
    score: number;
    kills: number;
    seaKills: number;
    combo: number;
    bestCombo: number;
    breaches: number;
    hours: number;
    lastHour: number;
    lastWindup: number;
    /** Falsk flukt: sekunder siden flukten begynte, -1 = ingen. */
    flight: number;
    flightCd: number;
    feigned: number;
    torches: number;
    caught: number;
    /** Skyvekampen i porten (othismos), 0-1. Full = du skyves bakover. */
    push: number;
    surgeIn: number;
    surge: number;
    valg: number;
    parries: number;
    beachT: number;
    gateT: number;
    // slutt
    won: boolean;
    overtime: number;
    ended: '' | 'vunnet' | 'tapt';
    cause: Cause;
    // juice (leses av visningen)
    hitstop: number;
    shake: number;
    flash: number;
    swingAt: number;
    swingKind: 'stikk' | 'dytt';
    slowmo: number;
    lastKillAt: [number, number, number];
    flags: Set<string>;
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

export function newGame(seed = Math.floor(Math.random() * 1e9)): G {
    return {
        rng: mulberry(seed),
        t: 0,
        day: 1,
        px: 0,
        pz: 1.8,
        yaw: 0,
        hp: HP_MAX,
        guard: GUARD_MAX,
        shield: false,
        shieldAt: -9,
        guardBroken: 0,
        atkCd: 0,
        shoveCd: 0,
        inFwd: 0,
        inSide: 0,
        inTurn: 0,
        hurtT: 0,
        enemies: [],
        pickups: [],
        fx: [],
        nextId: 1,
        spawnFront: 1.2,
        spawnImm: 3,
        spawnBack: 2,
        bossSpawned: false,
        bossDead: false,
        volleys: [18, 32, 55, 80, 112, 130],
        volleyWarn: 0,
        volleyDark: 0,
        gold: 0,
        score: 0,
        kills: 0,
        seaKills: 0,
        combo: 0,
        bestCombo: 0,
        breaches: 0,
        hours: 0,
        lastHour: 0,
        lastWindup: -9,
        flight: -1,
        flightCd: 0,
        feigned: 0,
        torches: 0,
        caught: 0,
        push: 0,
        surgeIn: 20,
        surge: 0,
        valg: 0,
        parries: 0,
        beachT: 0,
        gateT: 0,
        won: false,
        overtime: 0,
        ended: '',
        cause: 'fall',
        hitstop: 0,
        shake: 0,
        flash: 0,
        swingAt: -9,
        swingKind: 'stikk',
        slowmo: 0,
        lastKillAt: [0, 0, 0],
        flags: new Set(),
    };
}

// ---------- hjelpere ----------

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const wrap = (a: number) => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
};
export const fwdX = (yaw: number) => -Math.sin(yaw);
export const fwdZ = (yaw: number) => -Math.cos(yaw);
/** Yaw som ser fra (ax,az) mot (bx,bz). */
export const yawTo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(-(bx - ax), -(bz - az));
/** Vinkel fra spillerens blikk til et punkt (0 = rett fram). */
export function angleTo(g: G, x: number, z: number) {
    return wrap(yawTo(g.px, g.pz, x, z) - g.yaw);
}
const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(bx - ax, bz - az);

export const alive = (e: Enemy) => e.state !== 'dead';
const active = (e: Enemy) => alive(e) && e.state !== 'rush' && e.state !== 'climb';

/** Står spilleren i porten, er den stengt. */
export function gatePlugged(g: G) {
    return Math.abs(g.px) < 0.75 && Math.abs(g.pz - WALL_Z) < 0.9;
}
export function inGate(g: G) {
    return gatePlugged(g);
}
/** Ute på den brede stranda. */
export function onBeach(g: G) {
    return g.pz < -11;
}

export function comboMult(c: number) {
    return Math.min(5, 1 + Math.floor(c / 4));
}

export function dayT(g: G) {
    return g.won ? DAY_LEN[2] : g.t - DAY_START[g.day - 1];
}

/** Fjern elementer på stedet (samme resultat som filter, uten ny liste hvert steg). */
function compact<T>(list: T[], keep: (x: T) => boolean) {
    let j = 0;
    for (let i = 0; i < list.length; i++) if (keep(list[i])) list[j++] = list[i];
    list.length = j;
}

// ---------- kollisjon ----------

/** Holder en figur inne i passet og utenfor muren (bortsett fra porten). */
function collide(x: number, z: number, prevZ: number, r: number, climbing = false): [number, number] {
    const h = hw(z);
    x = clamp(x, -h + r, h - r);
    z = clamp(z, -40, 26);
    if (!climbing && Math.abs(z - WALL_Z) < WALL_HALF + r) {
        const inOpening = Math.abs(x) < GATE_HALF - r * 0.4;
        if (!inOpening) {
            // Kom fra en side - bli på den siden. Eller skyv inn i åpningen hvis nesten der.
            if (Math.abs(x) < GATE_HALF + 0.15) x = Math.sign(x || 1) * (GATE_HALF - r * 0.4 - 0.01);
            else z = prevZ <= WALL_Z ? WALL_Z - WALL_HALF - r : WALL_Z + WALL_HALF + r;
        }
    }
    return [x, z];
}

/** Er det fri vei fra a til b uten å krysse muren utenfor porten (eller en stengt port)? */
function crosses(_g: G, az: number, bz: number) {
    return (az < WALL_Z) !== (bz < WALL_Z);
}

// ---------- plasser rundt spilleren ----------

const SLOTS = 8;
function slotPos(g: G, s: number): [number, number] {
    const a = (s / SLOTS) * Math.PI * 2;
    return [g.px + Math.sin(a) * SLOT_R, g.pz - Math.cos(a) * SLOT_R];
}

/** Kan en fiende fra denne siden av muren stå på plass s? */
function slotOk(g: G, s: number, e: Enemy): boolean {
    const [x, z] = slotPos(g, s);
    const h = hw(z);
    if (Math.abs(x) > h - 0.35) return false;
    if (Math.abs(z - WALL_Z) < WALL_HALF + 0.35 && Math.abs(x) > GATE_HALF - 0.2) return false;
    // På andre siden av muren: bare mulig gjennom en åpen port.
    if (crosses(g, e.z, z) && gatePlugged(g)) return false;
    // Portåpningen selv er spillerens plass når porten er stengt.
    return true;
}

function slotTaken(g: G, s: number, self: Enemy) {
    for (const o of g.enemies)
        if (o !== self && o.slot === s && (o.state === 'engage' || o.state === 'ready' || o.state === 'windup' || o.state === 'recover' || o.state === 'stagger'))
            return true;
    return false;
}

function pickSlot(g: G, e: Enemy): number {
    const a = Math.atan2(e.x - g.px, -(e.z - g.pz));
    let best = -1;
    let bestD = 1e9;
    for (let s = 0; s < SLOTS; s++) {
        if (!slotOk(g, s, e) || slotTaken(g, s, e)) continue;
        const sa = (s / SLOTS) * Math.PI * 2;
        const d = Math.abs(wrap(sa - a));
        if (d < bestD) {
            bestD = d;
            best = s;
        }
    }
    return best;
}

// ---------- oppretting ----------

const STATS: Record<Kind, { hp: number; speed: number; dmg: number; windup: number }> = {
    lev: { hp: 1, speed: 3.0, dmg: 9, windup: 0.75 },
    imm: { hp: 2, speed: 3.4, dmg: 13, windup: 0.6 },
    boss: { hp: 6, speed: 2.7, dmg: 26, windup: 0.95 },
};

function spawn(g: G, kind: Kind, from: 'front' | 'back', x: number, z: number): Enemy {
    const e: Enemy = {
        id: g.nextId++,
        kind,
        from,
        x,
        z,
        y: 0,
        vx: 0,
        vz: 0,
        vy: 0,
        face: from === 'front' ? Math.PI : 0,
        hp: STATS[kind].hp,
        state: 'march',
        timer: 0,
        slot: -1,
        feint: false,
        feinted: false,
        waitT: 0,
        climbX: 0,
        spin: 0,
        spinV: 0,
        sea: false,
        counted: false,
        seen: false,
        timerStart: 0,
    };
    g.enemies.push(e);
    return e;
}

// ---------- spillerens grep (samme for elev og robot) ----------

export function setMove(g: G, fwd: number, side: number) {
    g.inFwd = clamp(fwd, -1, 1);
    g.inSide = clamp(side, -1, 1);
}
export function setTurn(g: G, t: number) {
    g.inTurn = clamp(t, -1, 1);
}
/** Musa (pointer lock) eller roboten: snu blikket direkte. */
export function look(g: G, dyaw: number) {
    g.yaw = wrap(g.yaw + dyaw);
}

export function setShield(g: G, on: boolean) {
    if (g.guardBroken > 0) on = false;
    if (on && !g.shield) g.shieldAt = g.t;
    g.shield = on;
}

/** Myk sikting: fienden nærmest midten av blikket, innen rekkevidde. */
export function softTarget(g: G, reach = REACH, cone = 0.8): Enemy | null {
    let best: Enemy | null = null;
    let bestS = 1e9;
    for (const e of g.enemies) {
        if (!alive(e) || e.state === 'rush') continue;
        const d = dist(g.px, g.pz, e.x, e.z);
        // Den som vakler eller glir bakover etter et dytt, når du med et utfall.
        const lunge = e.state === 'knocked' || e.state === 'stagger' ? LUNGE : 0;
        if (d > reach + lunge + ENEMY_R) continue;
        if (crosses(g, g.pz, e.z) && Math.abs(e.x) > GATE_HALF && e.state !== 'climb') continue;
        const a = Math.abs(angleTo(g, e.x, e.z));
        if (a > cone) continue;
        const s = a * 2 + d * 0.3;
        if (s < bestS) {
            bestS = s;
            best = e;
        }
    }
    return best;
}

/** Mellomrom: stikk - eller dytt med skjoldet hvis skjoldet (Shift) er oppe. */
export function attack(g: G, io: IO) {
    if (g.ended || g.guardBroken > 0) return;
    if (g.flight >= FLIGHT_MIN) return turnAround(g, io);
    if (g.shield) return shove(g, io);
    if (g.atkCd > 0) return;
    g.atkCd = 0.36;
    g.swingAt = g.t + g.rng() * 1e-6;
    g.swingKind = 'stikk';
    const e = softTarget(g);
    if (!e) {
        io.sfx.whiff();
        return;
    }
    // Myk sikting: blikket trekkes mot den du stikker.
    g.yaw = wrap(g.yaw + angleTo(g, e.x, e.z) * 0.6);
    // Utfall: står han utenfor spydets vanlige rekkevidde, tar du et skritt fram.
    const far = dist(g.px, g.pz, e.x, e.z) - REACH;
    if (far > 0) {
        const L = dist(g.px, g.pz, e.x, e.z) || 1;
        const step = Math.min(LUNGE, far + 0.1);
        const pz = g.pz;
        [g.px, g.pz] = collide(g.px + ((e.x - g.px) / L) * step, g.pz + ((e.z - g.pz) / L) * step, pz, PLAYER_R);
    }
    io.sfx.stab();
    const open =
        e.state === 'recover' ||
        e.state === 'stagger' ||
        e.state === 'windup' ||
        e.state === 'climb' ||
        e.state === 'toclimb' ||
        e.state === 'knocked' ||
        e.state === 'pursue' ||
        e.state === 'plunder';
    if (e.kind === 'boss' && e.state !== 'stagger') {
        clang(g, e, io);
        return;
    }
    if (e.kind === 'imm' && !open && Math.abs(wrap(e.face - yawTo(e.x, e.z, g.px, g.pz))) < 1.2) {
        clang(g, e, io);
        return;
    }
    const dmg = e.kind === 'imm' && e.state === 'stagger' ? 2 : 1;
    e.hp -= dmg;
    const dx = e.x - g.px;
    const dz = e.z - g.pz;
    const L = Math.hypot(dx, dz) || 1;
    if (e.hp <= 0) kill(g, e, io, dx / L, dz / L, 6);
    else {
        e.state = 'stagger';
        e.timer = 0.6;
        e.x += (dx / L) * 0.4;
        e.z += (dz / L) * 0.4;
        io.sfx.hit(false);
        g.hitstop = Math.max(g.hitstop, 0.05);
        g.fx.push({ kind: 'blod', x: e.x, y: 1.3, z: e.z, t: 0, n: 6 });
    }
}

function clang(g: G, e: Enemy, io: IO) {
    io.sfx.clang();
    g.fx.push({ kind: 'klang', x: e.x, y: 1.3, z: e.z, t: 0, n: 5 });
    g.hitstop = Math.max(g.hitstop, 0.04);
    g.shake = Math.max(g.shake, 0.15);
    if (!g.flags.has('klang')) {
        g.flags.add('klang');
        io.beat(
            'klang',
            'Skjoldet hans er oppe',
            'De udødelige tar stikk forfra. Løft skjoldet (Shift) når spydet gløder, og stikk mens han vakler.',
            () => [e.x, 1.6, e.z],
        );
    }
    if (e.kind === 'boss' && !g.flags.has('boss-klang')) {
        g.flags.add('boss-klang');
        io.pin('boss-klang', 'Shift rett før han slår!', () => (alive(e) ? [e.x, 2.4, e.z] : null), { seconds: 6 });
    }
}

function shove(g: G, io: IO) {
    if (g.shoveCd > 0) return;
    g.shoveCd = 0.95;
    g.swingAt = g.t + g.rng() * 1e-6;
    g.swingKind = 'dytt';
    io.sfx.shove();
    g.shake = Math.max(g.shake, 0.25);
    let n = 0;
    for (const e of g.enemies) {
        if (!alive(e) || e.state === 'rush' || e.state === 'climb') continue;
        const d = dist(g.px, g.pz, e.x, e.z);
        if (d > 2.4) continue;
        if (Math.abs(angleTo(g, e.x, e.z)) > 1.0) continue;
        if (e.kind === 'boss' && e.state !== 'stagger') {
            clang(g, e, io);
            continue;
        }
        const L = d || 1;
        knock(g, e, ((e.x - g.px) / L) * 8.5, ((e.z - g.pz) / L) * 8.5);
        n++;
    }
    if (n) {
        g.push = Math.max(0, g.push - 0.28);
        g.hitstop = Math.max(g.hitstop, 0.07);
        g.guard = Math.max(0, g.guard - 8);
    }
}

function knock(g: G, e: Enemy, vx: number, vz: number) {
    e.state = 'knocked';
    e.timer = 0.75;
    e.vx = vx;
    e.vz = vz;
    e.slot = -1;
    g.fx.push({ kind: 'stov', x: e.x, y: 0.2, z: e.z, t: 0, n: 5 });
}

function kill(g: G, e: Enemy, io: IO, dx: number, dz: number, force: number) {
    if (e.state === 'plunder') {
        g.score += CATCH_BONUS;
        g.caught++;
        io.float(`HENTET +${CATCH_BONUS}`, [e.x, 2.6, e.z], '#9fe6a0', true);
    }
    e.state = 'dead';
    e.timer = 0;
    e.slot = -1;
    // Kroppen slenges i bue: bakover, opp, og roterer.
    e.vx = dx * force;
    e.vz = dz * force;
    e.vy = 3.5 + g.rng() * 2.5 + (e.sea ? 3 : 0);
    e.spinV = (g.rng() < 0.5 ? -1 : 1) * (4 + g.rng() * 6);
    g.kills++;
    g.combo += e.sea ? 2 : 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    const base = e.kind === 'boss' ? 300 : e.kind === 'imm' ? 25 : 10;
    const pts = base * (e.sea ? 3 : 1) * comboMult(g.combo) * (g.gold > 0 ? 2 : 1);
    g.score += pts;
    g.lastKillAt = [e.x, 1.4, e.z];
    io.float(`+${pts}`, [e.x, 2.2, e.z], e.sea ? '#1fb3c4' : '#d9a441', e.sea || e.kind !== 'lev');
    g.fx.push({ kind: e.sea ? 'plask' : 'blod', x: e.x, y: e.sea ? 0 : 1.2, z: e.z, t: 0, n: e.sea ? 10 : 12 });
    g.hitstop = Math.max(g.hitstop, e.kind === 'boss' ? 0.25 : 0.075);
    g.shake = Math.max(g.shake, e.kind === 'boss' ? 0.8 : 0.22);
    io.sfx.hit(e.kind !== 'lev' || e.sea);
    if (e.sea) {
        g.seaKills++;
        io.sfx.splash();
        g.slowmo = Math.max(g.slowmo, 0.5);
        if (!g.flags.has('hav')) {
            g.flags.add('hav');
            io.lesson('hav', 'Passet lå mellom fjellet og havet. Perserne kunne ikke gå rundt - bare gjennom.', 1);
        }
    }
    if (e.kind === 'boss') {
        g.bossDead = true;
        g.slowmo = 1.4;
        io.banner('HYDARNES FALT', '#d9a441', 2.2);
        io.lesson('boss', 'Hydarnes ledet De udødelige over fjellstien Efialtes viste dem. Du stoppet ham ved porten.', 2);
    }
    // Stranda: av og til ligger det igjen noe der ute.
    if (e.z < -9 && g.rng() < 0.12) dropPickup(g, g.rng() < 0.5 ? 'gull' : 'suppe', e.x, e.z);
}

function dropPickup(g: G, kind: PickKind, x: number, z: number) {
    g.pickups.push({ id: g.nextId++, kind, x: clamp(x, -hw(z) + 1, hw(z) - 1), z, life: 15 });
    g.valg++;
}

// ---------- hovedløkka ----------

function hurtPlayer(g: G, dmg: number, io: IO) {
    g.hp -= dmg;
    g.combo = 0;
    g.hurtT = 0.4;
    g.flash = 1;
    g.shake = Math.max(g.shake, 0.4);
    io.sfx.hurt();
}

/** Skjoldkraften tappes; går den tom, faller skjoldet et øyeblikk. */
function drainGuard(g: G, n: number, io: IO) {
    g.guard -= n;
    if (g.guard > 0) return;
    g.guard = 0;
    g.guardBroken = 1.1;
    g.shield = false;
    io.float('SKJOLDET GIR ETTER', [g.px + fwdX(g.yaw) * 1.5, 1.6, g.pz + fwdZ(g.yaw) * 1.5], '#c8321f', true);
}

function frontal(g: G, x: number, z: number, cone = 1.3) {
    return Math.abs(angleTo(g, x, z)) < cone;
}

function strike(g: G, e: Enemy, io: IO) {
    const d = dist(g.px, g.pz, e.x, e.z);
    e.state = 'recover';
    e.timer = e.kind === 'boss' ? 1.0 : 0.85;
    if (d > STRIKE_REACH + (e.kind === 'boss' ? 0.4 : 0)) {
        // Dukket unna: slaget går i lufta.
        g.fx.push({ kind: 'stov', x: e.x, y: 0.3, z: e.z, t: 0, n: 3 });
        return;
    }
    if (g.shield && frontal(g, e.x, e.z)) {
        // Parering: skjoldet løftet etter at varselet kom. Et skjold som bare holdes oppe,
        // blokkerer - men koster kraft, og finter lurer det.
        const parry = g.shieldAt >= e.timerStart && g.t - g.shieldAt <= PARRY_WINDOW;
        if (parry) {
            e.state = 'stagger';
            e.timer = e.kind === 'boss' ? 1.9 : 1.3;
            g.parries++;
            g.push = Math.max(0, g.push - 0.1);
            io.sfx.parry();
            g.fx.push({ kind: 'parer', x: e.x, y: 1.4, z: e.z, t: 0, n: 8 });
            g.hitstop = Math.max(g.hitstop, 0.09);
            g.shake = Math.max(g.shake, 0.3);
            if (!g.flags.has('parer')) {
                g.flags.add('parer');
                io.lesson('parer', 'En hoplitt bar et tungt bronseskjold, aspis. Det tålte slag som knuste perserens vidjeskjold.', 1);
            }
        } else {
            io.sfx.clang();
            g.fx.push({ kind: 'klang', x: e.x, y: 1.4, z: e.z, t: 0, n: 4 });
            if (gatePlugged(g)) g.push = Math.min(1, g.push + 0.06);
            drainGuard(g, e.kind === 'boss' ? 45 : e.kind === 'imm' ? 28 : 20, io);
        }
        return;
    }
    hurtPlayer(g, STATS[e.kind].dmg, io);
    g.fx.push({ kind: 'blod', x: g.px + (e.x - g.px) * 0.4, y: 1.3, z: g.pz + (e.z - g.pz) * 0.4, t: 0, n: 4 });
}

function windupCount(g: G) {
    let n = 0;
    for (const e of g.enemies) if (e.state === 'windup') n++;
    return n;
}

function maxWindups(g: G) {
    return g.won || g.day >= 3 ? 2 : 1;
}

/** Slagene kommer ett og ett med et lite mellomrom, så hvert varsel kan leses. */
function windupGap(g: G) {
    return g.won ? 0.3 : g.day === 1 ? 0.8 : g.day === 2 ? 0.6 : 0.5;
}

function updateEnemy(g: G, e: Enemy, dt: number, io: IO) {
    const st = STATS[e.kind];
    const prevZ = e.z;
    if (e.state === 'dead') {
        e.timer += dt;
        e.vy -= 14 * dt;
        e.x += e.vx * dt;
        e.z += e.vz * dt;
        e.y += e.vy * dt;
        e.spin += e.spinV * dt;
        const floor = e.sea ? -1.6 : 0;
        if (e.y < floor) {
            e.y = floor;
            e.vy = e.sea ? 0 : -e.vy * 0.25;
            e.vx *= 0.5;
            e.vz *= 0.5;
            e.spinV *= 0.5;
        }
        if (!e.sea) {
            const h = hw(e.z);
            if (e.x > h) {
                e.sea = true;
            }
            e.x = Math.max(e.x, -h + 0.3);
        }
        return;
    }
    const d = dist(g.px, g.pz, e.x, e.z);
    let tx = e.x;
    let tz = e.z;
    let speed = st.speed * (g.won ? 1.15 : 1);

    if (e.state === 'knocked') {
        e.timer -= dt;
        e.x += e.vx * dt;
        e.z += e.vz * dt;
        const k = Math.exp(-dt * 3.2);
        e.vx *= k;
        e.vz *= k;
        // Havet: den som dyttes over kanten, er borte.
        if (e.x > hw(e.z) - 0.1) {
            e.sea = true;
            kill(g, e, io, 0.8, 0, 3);
            return;
        }
        // Domino: den som glir inn i en annen, velter ham også.
        const sp = Math.hypot(e.vx, e.vz);
        if (sp > 3)
            for (const o of g.enemies) {
                if (o === e || !alive(o) || o.state === 'knocked' || o.state === 'rush' || o.state === 'climb' || o.kind === 'boss') continue;
                if (dist(o.x, o.z, e.x, e.z) < ENEMY_R * 2.1) knock(g, o, e.vx * 0.75, e.vz * 0.75);
            }
        // Klippa: bråstopp.
        if (e.x < -hw(e.z) + ENEMY_R + 0.05 && e.vx < -1) {
            e.vx = 0;
            e.timer += 0.3;
            g.fx.push({ kind: 'stov', x: e.x, y: 1, z: e.z, t: 0, n: 6 });
        }
        [e.x, e.z] = collide(e.x, e.z, prevZ, ENEMY_R);
        if (e.timer <= 0) {
            e.state = 'stagger';
            e.timer = 0.45;
        }
        return;
    }

    if (e.state === 'stagger' || e.state === 'recover') {
        e.timer -= dt;
        if (e.timer <= 0) {
            e.state = e.slot >= 0 && slotOk(g, e.slot, e) ? 'ready' : 'engage';
            e.timer = 0.4 + g.rng() * 0.8;
        }
        return;
    }

    if (e.state === 'windup') {
        e.face = yawTo(e.x, e.z, g.px, g.pz);
        e.timer -= dt;
        if (e.feint && !e.feinted && e.timer < st.windup * 0.5) {
            // Finte: senker våpenet - og slår raskt etterpå. Løftet du skjoldet for den, koster
            // det halve kraften.
            e.feinted = true;
            if (g.shield && g.shieldAt >= e.timerStart && d < 2.6 && frontal(g, e.x, e.z)) {
                io.sfx.clang();
                io.float('FINTE!', [e.x, 2.3, e.z], '#2c5fb3', true);
                drainGuard(g, 50, io);
            }
            e.state = 'ready';
            e.timer = 0.22;
            return;
        }
        if (e.timer <= 0) strike(g, e, io);
        return;
    }

    if (e.state === 'climb') {
        e.timer -= dt;
        const k = 1 - Math.max(0, e.timer) / 2.2;
        e.y = Math.sin(Math.min(1, k) * Math.PI) * (WALL_H + 0.1);
        e.z = WALL_Z - 0.8 + k * 1.6;
        e.x = e.climbX;
        if (e.timer <= 0) {
            e.state = 'rush';
            e.y = 0;
        }
        return;
    }

    if (e.state === 'pursue') {
        // Forfølgeren løper i uorden rett mot ryggen din.
        tx = g.px;
        tz = g.pz;
        speed *= 1.3;
        if (d < PLAYER_R + ENEMY_R + 0.2) {
            tx = e.x;
            tz = e.z;
        }
    } else if (e.state === 'rush') {
        tx = 0;
        tz = CAMP_Z + 2;
        if (e.z < WALL_Z - 0.2) tx = clamp(e.x, -0.5, 0.5);
        if (e.z > CAMP_Z) {
            // Kom seg forbi: plyndrer i leiren til tiden er ute.
            e.state = 'plunder';
            e.timer = PLUNDER_S;
            e.climbX = [-2.5, 0, 2.5][Math.floor(g.rng() * 3)];
            g.valg++;
            io.pin('plyndrer', 'Han plyndrer! Hent ham!', () => (e.state === 'plunder' ? [e.x, 2.3, e.z] : null), {
                seconds: PLUNDER_S,
            });
            return;
        }
        speed *= 1.1;
    } else if (e.state === 'plunder') {
        tx = e.climbX;
        tz = 5.2;
        e.timer -= dt;
        if (e.timer <= 0) {
            // For sent: han er forbi for godt.
            g.breaches++;
            g.score = Math.max(0, g.score - BREACH_COST);
            e.state = 'dead';
            e.hp = 0;
            e.counted = true;
            e.y = -50;
            io.sfx.breach();
            io.float(`FORBI! −${BREACH_COST}`, [e.x, 2, e.z], '#2c5fb3', true);
            g.valg++;
            if (!g.flags.has('brudd')) {
                g.flags.add('brudd');
                io.beat(
                    'brudd',
                    'Porten sto åpen',
                    'Når du ikke står i porten, går perserne rett forbi deg og inn i leiren.',
                    () => [e.x, 1.6, e.z],
                    () => gatePlugged(g),
                );
            }
            return;
        }
    } else if (e.state === 'toclimb') {
        tx = e.climbX;
        tz = WALL_Z - WALL_HALF - ENEMY_R - 0.05;
        if (dist(e.x, e.z, tx, tz) < 0.3) {
            e.state = 'climb';
            e.timer = 2.2;
            g.valg++;
            if (!g.flags.has('klatrer')) {
                g.flags.add('klatrer');
                io.pin('klatrer', 'Han klatrer over muren!', () => (alive(e) && e.state === 'climb' ? [e.x, e.y + 1.8, e.z] : null), {
                    seconds: 5,
                });
            }
            return;
        }
    } else {
        // march / engage / ready / wait
        const wants = e.from === 'back' || d < 9 || e.state !== 'march';
        if (!wants) {
            // Gjennom passet mot porten.
            tx = clamp(e.x, -3, 3) * 0.6;
            tz = WALL_Z - 1;
            if (!gatePlugged(g) && e.z > WALL_Z - 3 && d > 4) {
                e.state = 'rush';
            }
        } else {
            if (e.slot < 0 || !slotOk(g, e.slot, e) || slotTaken(g, e.slot, e)) {
                e.slot = pickSlot(g, e);
                if (e.slot >= 0) {
                    e.state = 'engage';
                    if (!e.seen) {
                        e.seen = true;
                        g.valg++;
                    }
                } else if (e.state !== 'wait') {
                    e.state = 'wait';
                    e.waitT = 0;
                }
            }
            if (e.state === 'wait') {
                e.waitT += dt;
                // Andre rekke: står og trykker bak dem som slåss.
                const a = Math.atan2(e.x - g.px, -(e.z - g.pz));
                tx = g.px + Math.sin(a) * 3.2;
                tz = g.pz - Math.cos(a) * 3.2;
                if (e.from === 'front' && e.waitT > 2.2) {
                    if (!gatePlugged(g)) e.state = 'rush';
                    else if (e.kind === 'imm' && !g.won && g.day === 2) {
                        e.state = 'toclimb';
                        const side = g.rng() < 0.5 ? -1 : 1;
                        e.climbX = side * (2.1 + g.rng() * 1.6);
                    } else e.waitT = 0;
                }
            } else {
                const [sx, sz] = slotPos(g, e.slot);
                tx = sx;
                tz = sz;
                const ds = dist(e.x, e.z, sx, sz);
                if (e.state === 'engage' && ds < 0.35) {
                    e.state = 'ready';
                    e.timer = (e.kind === 'imm' ? 0.6 : 0.9) + g.rng() * (g.day >= 3 ? 0.7 : 1.1);
                }
                if (e.state === 'ready') {
                    e.face = yawTo(e.x, e.z, g.px, g.pz);
                    e.timer -= dt;
                    if (ds > 0.8) e.state = 'engage';
                    else if (e.timer <= 0 && d < STRIKE_REACH + 0.3 && windupCount(g) < maxWindups(g) && g.t - g.lastWindup > windupGap(g)) {
                        g.lastWindup = g.t;
                        e.state = 'windup';
                        e.timer = st.windup * (e.feinted ? 0.75 : 1);
                        e.timerStart = g.t;
                        e.feint = e.kind === 'imm' && !e.feinted && g.rng() < 0.35;
                        if (e.feinted) e.feinted = false;
                        g.valg++;
                        if (!g.flags.has('varsel')) {
                            g.flags.add('varsel');
                            io.pin('varsel', 'Hold Shift når spydet gløder!', () => (alive(e) ? [e.x, 2.3, e.z] : null), {
                                until: () => g.parries > 0,
                                seconds: 8,
                            });
                        }
                        return;
                    }
                }
            }
        }
    }

    // Skal den til andre siden av muren, går veien gjennom porten.
    if (crosses(g, e.z, tz) && Math.abs(e.x) > 0.5) {
        tx = clamp(e.x, -0.4, 0.4);
        tz = e.z < WALL_Z ? WALL_Z - 0.9 : WALL_Z + 0.9;
    }
    // Bevegelse mot målet.
    const dx = tx - e.x;
    const dz = tz - e.z;
    const L = Math.hypot(dx, dz);
    if (L > 0.05) {
        const s = Math.min(speed * dt, L);
        e.x += (dx / L) * s;
        e.z += (dz / L) * s;
        if (e.state !== 'ready') e.face = Math.atan2(-dx, -dz);
    }
    [e.x, e.z] = collide(e.x, e.z, prevZ, ENEMY_R);
}

function separate(g: G) {
    const list = g.enemies;
    for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (!alive(a) || a.state === 'climb') continue;
        for (let j = i + 1; j < list.length; j++) {
            const b = list[j];
            if (!alive(b) || b.state === 'climb') continue;
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const d2 = dx * dx + dz * dz;
            const R = ENEMY_R * 2;
            if (d2 > R * R || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            const push = (R - d) * 0.5;
            a.x -= (dx / d) * push;
            a.z -= (dz / d) * push;
            b.x += (dx / d) * push;
            b.z += (dz / d) * push;
        }
        // Spilleren er fast: fiendene skyves ut.
        const dx = a.x - g.px;
        const dz = a.z - g.pz;
        const d = Math.hypot(dx, dz);
        const R = ENEMY_R + PLAYER_R;
        if (d < R && d > 1e-6 && a.state !== 'dead') {
            a.x = g.px + (dx / d) * R;
            a.z = g.pz + (dz / d) * R;
        }
        const pz = a.z;
        [a.x, a.z] = collide(a.x, a.z, pz, ENEMY_R);
    }
}

function spawning(g: G, dt: number, io: IO) {
    const dT = dayT(g);
    const ot = g.won;
    const aliveOf = (k: Kind, from: 'front' | 'back') => {
        let n = 0;
        for (const e of g.enemies) if (alive(e) && e.kind === k && e.from === from) n++;
        return n;
    };
    const frontX = () => (g.rng() * 2 - 1) * 11;

    // Medere forfra hele tiden.
    g.spawnFront -= dt;
    const levCap = ot ? 14 : g.day === 1 ? 12 : 8;
    const levEvery = ot ? 0.6 : g.day === 1 ? Math.max(0.75, 1.3 - dT * 0.015) : 1.5;
    if (g.spawnFront <= 0 && aliveOf('lev', 'front') < levCap) {
        g.spawnFront = levEvery;
        // I flokker: to-tre av gangen.
        const n = 1 + (g.rng() < 0.45 ? 1 : 0) + (g.rng() < 0.2 ? 1 : 0);
        const x0 = frontX();
        for (let i = 0; i < n; i++) spawn(g, 'lev', 'front', x0 + (i - 1) * 1.1, SPAWN_Z - i * 1.2);
    }
    // De udødelige fra dag 2.
    if (g.day >= 2 || ot) {
        g.spawnImm -= dt;
        const cap = ot ? 6 : g.day === 2 ? 5 : 4;
        if (g.spawnImm <= 0 && aliveOf('imm', 'front') < cap) {
            g.spawnImm = ot ? 2.2 : g.day === 2 ? 3.4 : 4.2;
            spawn(g, 'imm', 'front', frontX(), SPAWN_Z);
        }
    }
    // Dag 3: faklene på fjellstien varsler dem før de kommer.
    if (g.day >= 3 && !ot && dT >= 1 && !g.flags.has('fakler')) {
        g.flags.add('fakler');
        g.torches = 1;
        io.sfx.horn();
        io.pin('fakler', 'Fakler på fjellstien bak deg!', () => [BACK_SPAWN[0], 3.5, BACK_SPAWN[1]], { seconds: 6 });
        g.valg++;
    }
    // Dag 3: bakfra over fjellstien.
    if ((g.day >= 3 && dT >= 9) || ot) {
        g.spawnBack -= dt;
        const cap = ot ? 6 : 4;
        if (g.spawnBack <= 0 && aliveOf('imm', 'back') + aliveOf('lev', 'back') < cap) {
            g.spawnBack = ot ? 2 : 3.4;
            spawn(g, g.rng() < 0.5 ? 'imm' : 'lev', 'back', BACK_SPAWN[0] + g.rng() * 2, BACK_SPAWN[1]);
            if (!g.flags.has('bakfra')) {
                g.flags.add('bakfra');
                io.sfx.horn();
                io.beat(
                    'bakfra',
                    'Efialtes viste dem stien',
                    'En greker viste perserne en sti over fjellet. Nå kommer De udødelige bakfra - snu deg!',
                    () => [BACK_SPAWN[0], 2, BACK_SPAWN[1] - 6],
                );
                io.lesson('bakfra', 'Forræderen Efialtes viste perserne en sti over fjellet. Da kom de bakfra, og passet kunne ikke holdes.', 3);
            }
        }
        if (!g.bossSpawned && !ot && dT >= 28) {
            g.bossSpawned = true;
            const b = spawn(g, 'boss', 'back', BACK_SPAWN[0] + 1, BACK_SPAWN[1] - 2);
            io.banner('HYDARNES', '#2c5fb3', 2.4);
            io.sfx.horn();
            g.valg += 2;
            io.pin('boss', 'Sjefen for De udødelige', () => (alive(b) ? [b.x, 3, b.z] : null), { seconds: 5 });
        }
    }
    // Gjenstander på stranda: fristelsen.
    if (!ot && (Math.abs(dT - 12) < dt / 2 + 1e-9 || Math.abs(dT - 38) < dt / 2 + 1e-9)) {
        dropPickup(g, dT < 20 ? 'suppe' : 'gull', (g.rng() * 2 - 1) * 7, -14 - g.rng() * 8);
    }
}

// ---------- skyvekampen (othismos) ----------
//
// I porten presser perserne på skjoldet ditt. Jo flere som står tett foran, jo fortere fylles
// måleren. Dytt tømmer den. Blir den full, skyves du bakover ut av porten - og porten står åpen.
// Fra dag 2 kommer et stormløp omtrent hvert 20. sekund.

function othismos(g: G, dt: number, io: IO) {
    if (g.won || !gatePlugged(g)) {
        g.push = Math.max(0, g.push - 0.2 * dt);
        return;
    }
    let n = 0;
    for (const e of g.enemies)
        if (
            alive(e) &&
            e.z < WALL_Z &&
            (e.state === 'ready' || e.state === 'wait' || e.state === 'engage' || e.state === 'windup') &&
            dist(e.x, e.z, g.px, g.pz) < 3.4
        )
            n++;
    const rate = n >= 2 ? 0.05 * n * (g.day >= 2 ? 1.3 : 1) : -0.05;
    g.push = clamp(g.push + rate * dt, 0, 1);
    if (g.day >= 2) {
        g.surgeIn -= dt;
        if (g.surgeIn <= 0) {
            g.surgeIn = 18 + g.rng() * 5;
            g.surge = 1;
            g.valg++;
            io.banner('DE PRESSER!', '#2c5fb3', 1.2);
        }
    }
    if (g.surge > 0) {
        g.surge -= dt;
        g.push = Math.min(1, g.push + 0.32 * dt);
    }
    if (g.push >= 1) {
        // Skjøvet bakover ut av porten.
        const pz = g.pz;
        [g.px, g.pz] = collide(g.px, g.pz + 1.7, pz, PLAYER_R);
        g.guardBroken = Math.max(g.guardBroken, 0.7);
        g.shield = false;
        g.push = 0.35;
        g.shake = Math.max(g.shake, 0.5);
        g.valg++;
        io.sfx.hurt();
        io.banner('SKJØVET BAKOVER', '#c8321f', 1.4);
        io.beat(
            'othismos',
            'Skyvekampen',
            'Perserne presser på skjoldet ditt. Dytt dem tilbake (Shift + mellomrom) før du blir skjøvet ut.',
        );
        io.lesson('othismos', 'Grekerne kalte skyvekampen othismos: rekke mot rekke, skjold mot skjold, til den ene ga etter.', 1.5);
    }
}

// ---------- falsk flukt (Herodot 7.211) ----------
//
// Spartanerne snudde ryggen til som om de flyktet. Perserne løp etter i uorden - og da snudde
// spartanerne og hogg dem ned. Her: rygg ut av porten med blikket mot fienden, så følger de
// etter. Snu (stikk eller gå fram) innen FLIGHT_MAX sekunder, så vakler hele flokken.
// Venter du for lenge, løper de forbi deg og inn i leiren.

export const FLIGHT_MIN = 0.35;
export const FLIGHT_MAX = 2.2;

function feignedFlight(g: G, dt: number, io: IO) {
    g.flightCd = Math.max(0, g.flightCd - dt);
    if (g.flight < 0) {
        if (g.flightCd > 0 || g.won || g.inFwd > -0.5 || g.pz < WALL_Z + 0.7 || Math.abs(g.yaw) > 0.8) return;
        const near = g.enemies.filter(
            (e) => alive(e) && e.from === 'front' && e.z < WALL_Z && e.kind !== 'boss' && dist(e.x, e.z, g.px, g.pz) < 6 &&
                e.state !== 'rush' && e.state !== 'climb' && e.state !== 'toclimb' && e.state !== 'knocked',
        );
        if (near.length < 2) return;
        g.flight = 0;
        g.valg++;
        for (const e of near) {
            e.state = 'pursue';
            e.slot = -1;
        }
        io.float('DE FØLGER ETTER!', [g.px + fwdX(g.yaw) * 2.5, 2, g.pz + fwdZ(g.yaw) * 2.5], '#f2c230', true);
        if (!g.flags.has('flukt')) {
            g.flags.add('flukt');
            io.pin('flukt', 'Snu nå! Mellomrom eller W!', () => [g.px + fwdX(g.yaw) * 2, 1.4, g.pz + fwdZ(g.yaw) * 2], {
                until: () => g.flight < 0,
                seconds: 3,
            });
        }
        return;
    }
    g.flight += dt;
    if (g.flight >= FLIGHT_MIN && g.inFwd > 0.5) return turnAround(g, io);
    if (g.flight > FLIGHT_MAX) {
        // For sent: de løper forbi.
        for (const e of g.enemies) if (e.state === 'pursue') e.state = 'rush';
        g.flight = -1;
        g.flightCd = 4;
    }
}

function turnAround(g: G, io: IO) {
    let n = 0;
    for (const e of g.enemies) {
        if (e.state !== 'pursue') continue;
        if (dist(e.x, e.z, g.px, g.pz) < 4.2) {
            e.state = 'stagger';
            e.timer = 1.6;
            n++;
        } else e.state = 'engage';
    }
    g.flight = -1;
    g.flightCd = 6;
    if (!n) return;
    g.feigned++;
    g.valg++;
    g.combo += 2;
    g.slowmo = Math.max(g.slowmo, 0.6);
    g.shake = Math.max(g.shake, 0.35);
    io.sfx.parry();
    io.banner('FALSK FLUKT!', '#f2c230', 1.4);
    io.lesson(
        'flukt',
        'Herodot forteller at spartanerne lot som de flyktet. Perserne løp etter i uorden - og spartanerne snudde og hogg dem ned.',
        2,
    );
}

function volleys(g: G, dt: number, io: IO) {
    if (g.volleyWarn > 0) {
        g.volleyWarn -= dt;
        g.volleyDark = Math.min(1, g.volleyDark + dt * 1.5);
        if (g.volleyWarn <= 0) {
            io.sfx.volley();
            if (g.shield && g.guardBroken <= 0) {
                g.fx.push({ kind: 'klang', x: g.px, y: 2.1, z: g.pz, t: 0, n: 6 });
                g.guard = Math.max(0, g.guard - 10);
            } else hurtPlayer(g, 24, io);
            // Pilene tar også noen av dem som står i andre rekke.
            for (const e of g.enemies)
                if (alive(e) && e.kind === 'lev' && e.state === 'wait' && g.rng() < 0.3) {
                    e.hp = 0;
                    kill(g, e, io, 0, 1, 1);
                    g.combo = Math.max(0, g.combo - 1);
                }
        }
        return;
    }
    g.volleyDark = Math.max(0, g.volleyDark - dt * 0.8);
    if (g.won) return;
    if (g.volleys.length && g.t >= g.volleys[0]) {
        g.volleys.shift();
        g.volleyWarn = 2.1;
        g.valg++;
        io.sfx.warn();
        if (!g.flags.has('piler')) {
            g.flags.add('piler');
            io.pin('piler', 'Piler! Hold Shift - skjold opp!', () => [g.px + fwdX(g.yaw) * 6, 4, g.pz + fwdZ(g.yaw) * 6], {
                until: () => g.shield,
                seconds: 2.2,
            });
            io.lesson('piler', '«Så mye bedre, da slåss vi i skyggen», skal en spartaner ha sagt om de persiske pilene.', 1);
        }
    }
}

export function update(g: G, dt: number, io: IO) {
    if (g.ended) return;
    if (g.hitstop > 0) {
        g.hitstop -= dt;
        return;
    }
    if (g.slowmo > 0) {
        g.slowmo -= dt;
        dt *= 0.35;
    }
    g.t += dt;
    const prevDay = g.day;
    g.day = g.t < DAY_START[1] ? 1 : g.t < DAY_START[2] ? 2 : 3;
    if (g.day !== prevDay && !g.won) {
        io.banner(`DAG ${g.day}`, '#d9a441', 2);
        io.sfx.horn();
        g.valg++;
        if (g.day === 2) {
            io.banner('DE UDØDELIGE', '#2c5fb3', 2);
            io.lesson('udodelige', 'De udødelige var kongens beste soldater: 10 000 mann, og en ny sto klar hver gang en falt.', 1);
        }
    }
    g.hours = Math.min(36, (g.day - 1) * 12 + Math.floor((dayT(g) / DAY_LEN[g.day - 1]) * 12));

    // Spilleren
    if (g.guardBroken > 0) {
        g.guardBroken -= dt;
        g.shield = false;
    }
    if (!g.shield) g.guard = Math.min(GUARD_MAX, g.guard + 22 * dt);
    else drainGuard(g, 12 * dt, io);
    g.atkCd = Math.max(0, g.atkCd - dt);
    g.shoveCd = Math.max(0, g.shoveCd - dt);
    g.hurtT = Math.max(0, g.hurtT - dt);
    g.gold = Math.max(0, g.gold - dt);
    g.yaw = wrap(g.yaw - g.inTurn * 2.7 * dt);
    const sp = (g.shield ? 2.3 : 4.3) * dt;
    const f = g.inFwd;
    const s = g.inSide;
    const n = Math.hypot(f, s) || 1;
    if (f || s) {
        const mx = (fwdX(g.yaw) * f + Math.cos(g.yaw) * s) / Math.max(1, n);
        const mz = (fwdZ(g.yaw) * f - Math.sin(g.yaw) * s) / Math.max(1, n);
        const pz = g.pz;
        let nx = g.px + mx * sp;
        let nz = g.pz + mz * sp;
        [nx, nz] = collide(nx, nz, pz, PLAYER_R);
        nz = clamp(nz, -34, 8);
        g.px = nx;
        g.pz = nz;
    }
    if (gatePlugged(g)) g.gateT += dt;
    feignedFlight(g, dt, io);
    if (onBeach(g)) {
        g.beachT += dt;
        if (!g.flags.has('stranda') && g.beachT > 2.5) {
            let around = 0;
            for (const e of g.enemies) if (active(e) && dist(e.x, e.z, g.px, g.pz) < 2.4) around++;
            if (around >= 4) {
                g.flags.add('stranda');
                io.beat(
                    'stranda',
                    'Omringet',
                    'På den brede stranda får alle plass rundt deg. Gå tilbake til porten - der når bare tre deg.',
                    () => [g.px + fwdX(g.yaw) * 2, 1.6, g.pz + fwdZ(g.yaw) * 2],
                    () => g.pz > -6,
                );
            }
        }
    }
    // Gjenstander
    for (const p of g.pickups) {
        p.life -= dt;
        if (p.life > 0 && dist(p.x, p.z, g.px, g.pz) < 1.1) {
            p.life = 0;
            io.sfx.pick();
            if (p.kind === 'gull') {
                g.gold = 12;
                io.float('XERXES’ GULL ×2', [p.x, 1.6, p.z], '#d9a441', true);
                io.lesson('gull', 'Xerxes lovet gull til den som viste vei rundt passet. Efialtes tok imot.', 1);
            } else {
                g.hp = Math.min(HP_MAX, g.hp + 35);
                io.float('SVART SUPPE +35', [p.x, 1.6, p.z], '#c8321f', true);
                io.lesson('suppe', 'Spartanerne var kjent for «svart suppe» av blod og eddik. Andre grekere syntes den var grusom.', 0.5);
            }
        }
    }
    compact(g.pickups, (p) => p.life > 0);

    spawning(g, dt, io);
    volleys(g, dt, io);
    othismos(g, dt, io);
    for (const e of g.enemies) updateEnemy(g, e, dt, io);
    separate(g);
    // De døde blir liggende en stund før de ryddes bort (bare pynt - de teller ikke).
    compact(g.enemies, (e) => e.state !== 'dead' || (e.timer < 7 && e.y > -40));

    // Timer holdt gir poeng.
    if (!g.won && g.hours > g.lastHour) g.score += 40 * (g.hours - g.lastHour);
    g.lastHour = g.hours;

    // Slutt
    if (!g.won && g.breaches >= BREACH_MAX) {
        g.ended = 'tapt';
        g.cause = 'brudd';
        io.lesson('brudd-slutt', 'Grekerne holdt Thermopylae i to dager fordi passet var så smalt. Et åpent pass holder ingen.', 2);
        io.lose('brudd');
        return;
    }
    if (g.hp <= 0) {
        g.hp = 0;
        if (g.won) {
            g.ended = 'vunnet';
            io.win();
        } else {
            g.ended = 'tapt';
            g.cause = 'fall';
            io.lose('fall');
        }
        return;
    }
    if (!g.won && g.t >= RUN_SECONDS) {
        g.won = true;
        g.slowmo = 1.2;
        g.score += 500;
        io.banner('HÆREN ER UNNA', '#d9a441', 2.6);
        io.sfx.win();
        io.lesson('seier', 'Leonidas sendte hovedhæren bort og ble igjen. Thermopylae var et tap - men det vant tid til Salamis.', 3);
        g.valg++;
    }
    if (g.won) {
        g.overtime += dt;
        g.score += 12 * dt * comboMult(g.combo);
        if (g.overtime >= OVERTIME_MAX) {
            g.ended = 'vunnet';
            io.win();
        }
    }
}

/** Juice-tellere som går i sanntid (også i hitstop). */
export function stepFx(g: G, dt: number) {
    g.shake = Math.max(0, g.shake - dt * 2.2);
    g.flash = Math.max(0, g.flash - dt * 2.5);
    for (const f of g.fx) f.t += dt;
    if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40);
    compact(g.fx, (f) => f.t < 1.2);
}

export function progress(g: G) {
    return clamp(g.t / RUN_SECONDS, 0, 1);
}

export function pressure(g: G) {
    let near = 0;
    for (const e of g.enemies) if (active(e) && dist(e.x, e.z, g.px, g.pz) < 3.5) near++;
    return clamp(
        0.15 + 0.45 * progress(g) + near * 0.05 + (g.volleyWarn > 0 ? 0.15 : 0) + (g.breaches / BREACH_MAX) * 0.2 + (g.won ? 0.2 : 0),
        0,
        1,
    );
}

export function finalScore(g: G) {
    return Math.floor(g.score);
}

/** Klokka: time på døgnet (6 til 18) for sola og HUD-en. */
export function clockHour(g: G) {
    if (g.won) return 18 + Math.min(1.5, g.overtime / 30);
    return 6 + (dayT(g) / DAY_LEN[g.day - 1]) * 12;
}
