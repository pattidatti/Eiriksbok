import {
    BASES,
    STATIONS,
    SPAWNS,
    LONDON,
    NORTH,
    SOLA,
    HALF_W,
    HALF_D,
    overEngland,
    sectorOf,
    dist,
    type XZ,
} from './geo';

// Spillreglene for Plottebordet - ren TypeScript, ingen React. 3D-scenen leser
// tilstanden hver frame, og UI-et får beskjed gjennom IO-grensesnittet.
//
// Fagkjernen (fra artikkelen) er to regler som avgjør hele runden:
//  1. Radaren ser flyene over havet, lenge før kysten. En skvadron trenger tid
//     til å klatre opp til bombeflyene. Sendes den når plottet dukker opp, rekker
//     den det. Sendes den når flyene er over land, er det for sent.
//  2. Et fly som flyr rundt og leter, bruker opp drivstoffet og må lande. Står
//     skvadronen og tanker når angrepet kommer, blir den tatt på bakken.

export type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';
export type Cause = 'luft' | 'fly';
export type SqState = 'klar' | 'lufta' | 'kamp' | 'hjem' | 'tanker';

export const DAYS = 35; // 13. august -> 17. september
export const DAY_S = 5.2;
export const RUN_SECONDS = DAYS * DAY_S;
export const PLANES = 12;
export const FUEL = 34;
export const REFUEL = 7;
/** Sekunder fra start til skvadronen er oppe i bombeflyenes høyde. */
export const CLIMB_S = 5.5;
export const RAID_SPEED = 0.5;
const ENGAGE_R = 0.62;
const SIGHT_R = 0.95; // hva en patrulje ser med egne øyne
const DPS = 1.05;
const LOSS = 0.04;
const TURN_FRAC = 0.6;
const GROUND_LOSS = 6;
const CRATER_S = 9;
const STATION_DOWN = 10;
const REPLACE_S = 8;
export const RADAR_RANGE = 7.5;

export interface Squadron {
    i: number;
    state: SqState;
    planes: number;
    pos: XZ;
    /** 0 = på bakken, 1 = i bombeflyenes høyde. */
    alt: number;
    fuel: number;
    refuel: number;
    order: { kind: 'raid'; id: number } | { kind: 'punkt'; p: XZ } | null;
    engaged: number; // raid-id, -1 = ingen
    heading: number;
    replaceT: number;
    orbit: number;
    /** Sist skvadronen fikk en ordre (for statustavla og robotene). */
    orderedAt: number;
}

export type TargetKind = 'base' | 'station' | 'london' | 'north';
export interface Raid {
    id: number;
    pos: XZ;
    home: XZ;
    target: { kind: TargetKind; idx: number; p: XZ };
    size: number;
    size0: number;
    state: 'inn' | 'snur' | 'bombet';
    visible: boolean;
    seenOnce: boolean;
    /** Sett av radar (over havet) eller først av observatørene (over land). */
    seenBy: 'radar' | 'observer' | null;
    heading: number;
    fade: number;
    engagedBy: number;
}

export interface Fx {
    kind: 'spark' | 'bomb' | 'smoke' | 'ring';
    p: [number, number, number];
    v: [number, number, number];
    life: number;
    max: number;
}

export interface G {
    t: number;
    day: number;
    meter: number;
    squadrons: Squadron[];
    raids: Raid[];
    nextId: number;
    spawnT: number;
    stationDown: number[];
    crater: number[];
    londonHits: number;
    score: number;
    chain: number;
    bestChain: number;
    turned: number;
    turnedOverSea: number;
    hits: number;
    groundLosses: number;
    orders: number;
    /** Ordre gitt først når raidet allerede var over land (for sent til å klatre). */
    lateOrders: number;
    done: Set<string>;
    unlocked: Set<string>;
    fx: Fx[];
    shake: number;
    /** Hvor mange raid som traff mål fordi skvadronen kom for sent eller stod på bakken. */
    lateHits: number;
    patrolSeconds: number;
    cause: Cause;
    blitz: boolean;
    waveQueue: number[];
}

export interface Sfx {
    phone: () => void;
    scramble: () => void;
    engage: () => void;
    turn: (mult: number) => void;
    bomb: () => void;
    land: () => void;
    refuse: () => void;
    alarm: () => void;
    tick: () => void;
    win: () => void;
    lose: () => void;
}

export interface IO {
    sfx: Sfx;
    banner: (t: string, s?: string, color?: string) => void;
    toast: (t: string) => void;
    float: (t: string, x: number, z: number, color?: string) => void;
    lose: (c: Cause) => void;
    win: () => void;
}

const MONTHS = ['august', 'september'];
export function dateOf(t: number): { d: number; m: string; label: string } {
    const day = Math.min(DAYS, Math.floor(t / DAY_S));
    const d0 = 13 + day;
    const d = d0 > 31 ? d0 - 31 : d0;
    const m = d0 > 31 ? MONTHS[1] : MONTHS[0];
    return { d, m, label: `${d}. ${m}` };
}

export const chainMult = (chain: number) => Math.min(4, 1 + Math.floor(chain / 3));

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function newGame(): G {
    return {
        t: 0,
        day: 0,
        meter: 0,
        squadrons: BASES.map((b, i) => ({
            i,
            state: 'klar',
            planes: PLANES,
            pos: [b.pos[0], b.pos[1]],
            alt: 0,
            fuel: FUEL,
            refuel: 0,
            order: null,
            engaged: -1,
            heading: Math.PI,
            replaceT: 0,
            orbit: i * 1.3,
            orderedAt: -99,
        })),
        raids: [],
        nextId: 1,
        spawnT: 1.2,
        stationDown: STATIONS.map(() => 0),
        crater: BASES.map(() => 0),
        londonHits: 0,
        score: 0,
        chain: 0,
        bestChain: 0,
        turned: 0,
        turnedOverSea: 0,
        hits: 0,
        groundLosses: 0,
        orders: 0,
        lateOrders: 0,
        done: new Set(),
        unlocked: new Set(['chainhome']),
        fx: [],
        shake: 0,
        lateHits: 0,
        patrolSeconds: 0,
        cause: 'luft',
        blitz: false,
        waveQueue: [],
    };
}

export const totalPlanes = (g: G) => g.squadrons.reduce((s, q) => s + q.planes, 0);
export const airborne = (q: Squadron) => q.state === 'lufta' || q.state === 'kamp' || q.state === 'hjem';
export const findRaid = (g: G, id: number) => g.raids.find((r) => r.id === id);
export const raidActive = (r: Raid | undefined): r is Raid => !!r && r.state === 'inn';

// ---------------------------------------------------------------------------
// Ordre (samme grep for eleven og robotene)
// ---------------------------------------------------------------------------

export type OrderResult = 'ok' | 'tanker' | 'krater' | 'hjem' | 'tom';

/** Send skvadron `i` mot et raid (id) eller et punkt på bordet (patrulje). */
export function order(g: G, i: number, target: { raid: number } | { p: XZ }, io: IO): OrderResult {
    const q = g.squadrons[i];
    if (!q) return 'tom';
    if (q.state === 'tanker') {
        io.sfx.refuse();
        return 'tanker';
    }
    if (q.planes < 1) {
        io.sfx.refuse();
        return 'tom';
    }
    if (q.state === 'klar' && g.crater[i] > 0) {
        io.sfx.refuse();
        return 'krater';
    }
    // Slipp på egen flyplass = land.
    if ('p' in target && dist(target.p, BASES[i].pos) < 0.7) {
        if (airborne(q)) {
            q.state = 'hjem';
            q.order = null;
            q.engaged = -1;
            return 'hjem';
        }
        return 'hjem';
    }
    if (q.state === 'klar') {
        q.state = 'lufta';
        q.alt = 0;
        q.fuel = FUEL;
        io.sfx.scramble();
    } else if (q.state === 'hjem' && q.fuel < 6) {
        io.sfx.refuse();
        return 'tom';
    } else if (q.state === 'hjem') q.state = 'lufta';
    q.order = 'raid' in target ? { kind: 'raid', id: target.raid } : { kind: 'punkt', p: [target.p[0], target.p[1]] };
    if (q.state === 'kamp' && 'raid' in target && target.raid !== q.engaged) {
        q.state = 'lufta';
        q.engaged = -1;
    }
    q.orderedAt = g.t;
    g.orders += 1;
    if ('raid' in target) {
        const r = findRaid(g, target.raid);
        if (r && overEngland(r.pos[0], r.pos[1])) g.lateOrders += 1;
    }
    return 'ok';
}

// ---------------------------------------------------------------------------
// Raidene
// ---------------------------------------------------------------------------

function pickTarget(g: G): Raid['target'] {
    const day = g.day;
    if (g.blitz) return { kind: 'london', idx: 0, p: [LONDON[0] + rnd(-0.4, 0.4), LONDON[1] + rnd(-0.3, 0.3)] };
    // Ørneangrepet: de første dagene går mange raid mot radarstasjonene.
    if (day < 5 && Math.random() < 0.35) {
        const idx = Math.floor(Math.random() * 3); // Ventnor, Pevensey, Dover
        return { kind: 'station', idx, p: [...STATIONS[idx].pos] as XZ };
    }
    // Før 24. august: mest flyplassene nær kysten. Så også dem inne i landet.
    const pool = day < 11 ? [0, 4, 2, 1] : [0, 1, 2, 3, 4, 2, 1, 3];
    const idx = pool[Math.floor(Math.random() * pool.length)];
    return { kind: 'base', idx, p: [...BASES[idx].pos] as XZ };
}

export function spawnRaid(g: G, target: Raid['target'], size: number, from?: XZ) {
    let home = from;
    if (!home) {
        // Et av de tre utgangspunktene nærmest målet.
        const near = [...SPAWNS].sort((a, b) => dist(a, target.p) - dist(b, target.p)).slice(0, 3);
        home = near[Math.floor(Math.random() * near.length)];
    }
    const r: Raid = {
        id: g.nextId++,
        pos: [home[0] + rnd(-0.3, 0.3), home[1] + rnd(-0.2, 0.2)],
        home: [home[0], home[1]],
        target,
        size,
        size0: size,
        state: 'inn',
        visible: false,
        seenOnce: false,
        seenBy: null,
        heading: 0,
        fade: 0,
        engagedBy: 0,
    };
    r.heading = Math.atan2(target.p[0] - r.pos[0], target.p[1] - r.pos[1]);
    g.raids.push(r);
    return r;
}

function raidSize(day: number) {
    if (day < 11) return Math.round(rnd(9, 13));
    if (day < 25) return Math.round(rnd(13, 18));
    return Math.round(rnd(14, 20));
}

function spawnInterval(day: number) {
    if (day < 5) return rnd(5.4, 6.6);
    if (day < 11) return rnd(4.4, 5.4);
    if (day < 25) return rnd(3.8, 4.6);
    if (day < 33) return rnd(4.4, 5.4);
    return rnd(5.5, 7);
}

function visibleNow(g: G, r: Raid): 'radar' | 'observer' | null {
    if (overEngland(r.pos[0], r.pos[1])) return 'observer';
    const s = sectorOf(r.pos[0], r.pos[1]);
    if (g.stationDown[s] > 0) return null;
    const st = STATIONS[s].pos;
    if (dist(st, r.pos) > RADAR_RANGE) return null;
    return 'radar';
}

// ---------------------------------------------------------------------------
// Hendelser langs datoene
// ---------------------------------------------------------------------------

function events(g: G, io: IO) {
    const once = (id: string, fn: () => void) => {
        if (g.done.has(id)) return;
        g.done.add(id);
        fn();
    };
    const day = g.day;
    if (day >= 2)
        once('sola', () => {
            spawnRaid(g, { kind: 'north', idx: 0, p: [...NORTH] as XZ }, 16, SOLA);
            g.unlocked.add('sola');
            io.sfx.alarm();
            io.banner('15. AUGUST', 'Radaren ser 63 bombefly fra Sola i Norge på vei mot Nord-England. Send en skvadron nordover!', '#8a2a22');
        });
    if (day >= 5)
        once('goring', () => {
            g.unlocked.add('goring');
            io.banner('18. AUGUST', 'Radarmastene står fortsatt. Göring tviler på at det er noen vits i å angripe dem mer.', '#3d4a5c');
        });
    if (day >= 11)
        once('verste', () => {
            g.unlocked.add('verste');
            io.sfx.alarm();
            io.banner('24. AUGUST', 'De verste ukene. Nå bombes flyplassene nesten hver dag - også dem inne i landet.', '#8a2a22');
        });
    if (day >= 25)
        once('blitz', () => {
            g.blitz = true;
            g.unlocked.add('blitz');
            g.crater = g.crater.map(() => 0);
            g.meter = Math.max(0, g.meter - 20);
            io.banner('7. SEPTEMBER', 'Hitler bytter mål: bombene faller på London. For folk i byen er det forferdelig - men RAF får reparere flyplassene.', '#3d4a5c');
        });
    if (day >= 33)
        once('femtende', () => {
            g.unlocked.add('femtende');
            io.sfx.alarm();
            io.banner('15. SEPTEMBER', 'To store bølger på vei mot London. Bruk alle skvadronene du har.', '#8a2a22');
            g.waveQueue = [0, 0.4, 0.8, 7, 7.4, 7.8].map((d) => g.t + d);
        });
}

// ---------------------------------------------------------------------------
// Én frame
// ---------------------------------------------------------------------------

function addFx(g: G, kind: Fx['kind'], x: number, y: number, z: number, n: number, spread = 0.5) {
    for (let k = 0; k < n; k++) {
        if (g.fx.length > 220) g.fx.shift();
        const up = kind === 'smoke' ? rnd(0.3, 0.7) : rnd(-0.2, 1.2);
        g.fx.push({
            kind,
            p: [x, y, z],
            v: [rnd(-spread, spread), up, rnd(-spread, spread)],
            life: 0,
            max: kind === 'smoke' ? rnd(1.6, 2.6) : kind === 'ring' ? 0.9 : rnd(0.4, 0.8),
        });
    }
}

function bomb(g: G, r: Raid, io: IO) {
    r.state = 'bombet';
    g.hits += 1;
    g.chain = 0;
    const [x, z] = r.target.p;
    const k = clamp(r.size / 12, 0.6, 1.6);
    addFx(g, 'bomb', x, 0.2, z, 12, 0.7);
    addFx(g, 'smoke', x, 0.3, z, 6, 0.25);
    g.shake = Math.max(g.shake, 0.5);
    io.sfx.bomb();
    // Kom en skvadron for sent? Da var den i lufta, men ikke oppe ennå.
    if (g.squadrons.some((q) => q.order?.kind === 'raid' && q.order.id === r.id)) g.lateHits += 1;
    if (r.target.kind === 'base') {
        const i = r.target.idx;
        g.meter += 11.5 * k;
        g.crater[i] = CRATER_S;
        const q = g.squadrons[i];
        if (q.state === 'klar' || q.state === 'tanker') {
            const lost = Math.min(q.planes, GROUND_LOSS);
            q.planes -= lost;
            g.groundLosses += lost;
            io.float(`${Math.round(lost)} FLY TAPT PÅ BAKKEN`, x, z, '#ffb4a0');
            if (!g.done.has('bakken')) {
                g.done.add('bakken');
                io.toast(`${BASES[i].name} ble bombet mens skvadronen stod på bakken. Fly som tanker, kan ikke forsvare seg.`);
            }
        } else io.float(`${BASES[i].name.toUpperCase()} BOMBET`, x, z, '#ffb4a0');
    } else if (r.target.kind === 'station') {
        g.meter += 5 * k;
        g.stationDown[r.target.idx] = STATION_DOWN;
        io.float(`${STATIONS[r.target.idx].name.toUpperCase()} UTE`, x, z, '#ffb4a0');
        if (!g.done.has('hull')) {
            g.done.add('hull');
            io.toast(`Radaren i ${STATIONS[r.target.idx].name} er slått ut. Raid i den sektoren ser du først når de krysser kysten - til den er reparert.`);
        }
    } else if (r.target.kind === 'london') {
        g.meter += 3.2 * k;
        g.londonHits += 1;
        io.float('LONDON BOMBET', x, z, '#ffb4a0');
    } else {
        g.meter += 9 * k;
        io.float('NORD-ENGLAND BOMBET', x, z, '#ffb4a0');
    }
}

function turnBack(g: G, r: Raid, io: IO) {
    r.state = 'snur';
    const sea = !overEngland(r.pos[0], r.pos[1]);
    g.chain += 1;
    g.bestChain = Math.max(g.bestChain, g.chain);
    g.turned += 1;
    if (sea) g.turnedOverSea += 1;
    const mult = chainMult(g.chain);
    const pts = Math.round(r.size0 * 10 * (sea ? 2 : 1) * mult);
    g.score += pts;
    io.sfx.turn(mult);
    io.float(sea ? `+${pts} SNUDD OVER HAVET` : `+${pts} SNUDD`, r.pos[0], r.pos[1], sea ? '#ffd76a' : '#e8f0ff');
    addFx(g, 'ring', r.pos[0], 1.6, r.pos[1], 1, 0);
    if (g.turned === 1) io.toast('Raidet snudde! Jo tidligere du sender skvadronen, jo lenger ute over havet møter den bombeflyene.');
    if (sea && !g.unlocked.has('filter')) g.unlocked.add('filter');
    if (g.turned >= 12) g.unlocked.add('sektor');
}

export function update(g: G, dt: number, io: IO) {
    g.t += dt;
    const day = Math.floor(g.t / DAY_S);
    if (day !== g.day) {
        g.day = day;
        g.score += 25;
        io.sfx.tick();
    }
    if (g.t >= RUN_SECONDS) {
        g.unlocked.add('seelowe');
        io.win();
        return;
    }
    events(g, io);

    // Nye raid
    if (g.waveQueue.length) {
        while (g.waveQueue.length && g.waveQueue[0] <= g.t) {
            g.waveQueue.shift();
            spawnRaid(g, pickTarget(g), Math.round(rnd(16, 20)));
        }
    } else if (!g.done.has('femtende') || g.day >= 34) {
        g.spawnT -= dt;
        if (g.spawnT <= 0) {
            g.spawnT = spawnInterval(g.day);
            spawnRaid(g, pickTarget(g), raidSize(g.day));
        }
    }

    for (let i = 0; i < g.stationDown.length; i++)
        if (g.stationDown[i] > 0) {
            g.stationDown[i] = Math.max(0, g.stationDown[i] - dt);
            if (g.stationDown[i] === 0) io.float(`${STATIONS[i].name.toUpperCase()} I DRIFT`, STATIONS[i].pos[0], STATIONS[i].pos[1], '#bfe7c0');
        }
    for (let i = 0; i < g.crater.length; i++) g.crater[i] = Math.max(0, g.crater[i] - dt);

    // --- raidene flyr ---
    for (const r of g.raids) {
        const was = r.visible;
        const seen = r.state === 'inn' ? visibleNow(g, r) : r.visible ? 'radar' : null;
        r.visible = r.state !== 'inn' ? r.visible : !!seen;
        if (r.visible && !was && r.state === 'inn' && !r.seenOnce) {
            r.seenOnce = true;
            r.seenBy = seen;
            io.sfx.phone();
            if (r.size0 >= 15 && !g.done.has('stor')) {
                g.done.add('stor');
                io.toast(`Et stort raid (${r.size0}+) er på vei. Én skvadron rekker ikke å snu det alene - send to.`);
            }
            if (seen === 'observer' && !g.done.has('observer')) {
                g.done.add('observer');
                g.unlocked.add('observer');
                io.toast('Observatørene melder fly over kysten - radaren så dem ikke. Nå er det dårlig tid.');
            }
        }
        r.fade = clamp(r.fade + (r.visible ? dt * 2 : -dt * 2), 0, 1);
        if (r.state === 'inn') {
            const dx = r.target.p[0] - r.pos[0];
            const dz = r.target.p[1] - r.pos[1];
            const d = Math.hypot(dx, dz);
            const sp = RAID_SPEED * (r.engagedBy > 0 ? 0.7 : 1);
            if (d < 0.12) bomb(g, r, io);
            else {
                r.heading = Math.atan2(dx, dz);
                r.pos[0] += (dx / d) * sp * dt;
                r.pos[1] += (dz / d) * sp * dt;
            }
        } else {
            // Hjem igjen. Raidene forsvinner når de er utenfor bordet eller over kontinentet.
            const dx = r.home[0] - r.pos[0];
            const dz = r.home[1] - r.pos[1];
            const d = Math.hypot(dx, dz) || 1;
            r.heading = Math.atan2(dx, dz);
            r.pos[0] += (dx / d) * RAID_SPEED * 1.2 * dt;
            r.pos[1] += (dz / d) * RAID_SPEED * 1.2 * dt;
            if (d < 0.3) r.visible = false;
        }
        r.engagedBy = 0;
    }
    g.raids = g.raids.filter((r) => r.state === 'inn' || r.fade > 0.01 || r.visible);

    // --- skvadronene ---
    for (const q of g.squadrons) {
        const base = BASES[q.i].pos;
        if (q.state === 'klar' || q.state === 'tanker') {
            q.pos[0] = base[0];
            q.pos[1] = base[1];
            q.alt = Math.max(0, q.alt - dt);
            if (q.state === 'tanker') {
                q.refuel -= dt;
                if (q.refuel <= 0) {
                    q.state = 'klar';
                    q.fuel = FUEL;
                }
            }
            if (q.planes < PLANES) {
                q.replaceT += dt;
                if (q.replaceT >= REPLACE_S) {
                    q.replaceT = 0;
                    q.planes = Math.min(PLANES, Math.floor(q.planes) + 1);
                }
            }
            continue;
        }
        q.fuel -= dt;
        q.alt = Math.min(1, q.alt + dt / CLIMB_S);
        const speed = 0.35 + 0.95 * q.alt * q.alt;
        const home = dist(q.pos, base);
        if (q.state !== 'hjem' && q.fuel < home / 1.3 + 2.5) {
            q.state = 'hjem';
            q.order = null;
            q.engaged = -1;
            if (!g.done.has('drivstoff')) {
                g.done.add('drivstoff');
                io.toast(`Skvadron ${BASES[q.i].squadron} har lite drivstoff og må lande. Flyene kan bare være i lufta i kort tid.`);
            }
        }
        if (q.order?.kind === 'punkt' && q.state === 'lufta') g.patrolSeconds += dt;

        let goal: XZ | null = null;
        if (q.state === 'hjem') goal = base;
        else if (q.state === 'kamp') {
            const r = findRaid(g, q.engaged);
            if (!raidActive(r)) {
                if (q.order?.kind === 'raid' && q.order.id === q.engaged) q.order = null;
                q.state = 'lufta';
                q.engaged = -1;
            } else {
                r.engagedBy += 1;
                q.orbit += dt * 2.4;
                goal = [r.pos[0] + Math.cos(q.orbit + q.i) * 0.35, r.pos[1] + Math.sin(q.orbit + q.i) * 0.35];
                // Kampen: raidet mister fly, skvadronen også.
                r.size -= dt * DPS * (q.planes / PLANES);
                q.planes = Math.max(0, q.planes - dt * LOSS * (r.size / PLANES));
                if (Math.random() < dt * 6) addFx(g, 'spark', r.pos[0] + rnd(-0.3, 0.3), 1.6, r.pos[1] + rnd(-0.3, 0.3), 2, 0.8);
                if (r.size <= r.size0 * TURN_FRAC) turnBack(g, r, io);
                if (q.planes < 1) {
                    q.state = 'hjem';
                    q.engaged = -1;
                    q.order = null;
                }
            }
        }
        if (q.state === 'lufta') {
            if (q.order?.kind === 'raid') {
                const r = findRaid(g, q.order.id);
                if (raidActive(r)) {
                    // Sikt litt foran raidet, som kontrollørene gjorde.
                    const lead = Math.min(2.5, dist(q.pos, r.pos) / Math.max(0.5, speed)) * RAID_SPEED;
                    goal = [r.pos[0] + Math.sin(r.heading) * lead, r.pos[1] + Math.cos(r.heading) * lead];
                } else q.order = null;
            }
            if (q.order?.kind === 'punkt') {
                const p = q.order.p;
                if (dist(q.pos, p) < 0.5) {
                    q.orbit += dt * 1.2;
                    goal = [p[0] + Math.cos(q.orbit) * 0.4, p[1] + Math.sin(q.orbit) * 0.4];
                } else goal = p;
            }
            if (!goal) {
                // Ingen ordre: sirkle der du er og vent på ny kurs.
                q.orbit += dt * 1.2;
                goal = [q.pos[0] + Math.cos(q.orbit) * 0.3, q.pos[1] + Math.sin(q.orbit) * 0.3];
            }
            // Finn et raid å gå løs på: det du er sendt mot, eller et du ser selv.
            if (q.alt >= 0.95) {
                let best: Raid | null = null;
                let bd = Infinity;
                for (const r of g.raids) {
                    if (r.state !== 'inn') continue;
                    const d = dist(q.pos, r.pos);
                    const ordered = q.order?.kind === 'raid' && q.order.id === r.id;
                    const reach = ordered ? ENGAGE_R : q.order?.kind === 'punkt' || !q.order ? SIGHT_R : ENGAGE_R * 0.8;
                    if (d < reach && d < bd) {
                        bd = d;
                        best = r;
                    }
                }
                if (best) {
                    q.state = 'kamp';
                    q.engaged = best.id;
                    io.sfx.engage();
                    if (!g.done.has('tallyho')) {
                        g.done.add('tallyho');
                        io.toast('Skvadronen er oppe i høyden og går løs på bombeflyene!');
                    }
                }
            }
        }
        if (goal) {
            const dx = goal[0] - q.pos[0];
            const dz = goal[1] - q.pos[1];
            const d = Math.hypot(dx, dz);
            if (d > 1e-3) {
                const step = Math.min(d, speed * dt * (q.state === 'kamp' ? 1.6 : 1));
                q.pos[0] += (dx / d) * step;
                q.pos[1] += (dz / d) * step;
                const want = Math.atan2(dx, dz);
                let diff = want - q.heading;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                q.heading += diff * Math.min(1, dt * 5);
            }
        }
        q.pos[0] = clamp(q.pos[0], -HALF_W + 0.3, HALF_W - 0.3);
        q.pos[1] = clamp(q.pos[1], -HALF_D + 0.3, HALF_D - 0.3);
        if (q.state === 'hjem' && dist(q.pos, base) < 0.15) {
            q.state = 'tanker';
            q.refuel = REFUEL;
            q.order = null;
            q.alt = 0.2;
            io.sfx.land();
        }
    }

    g.meter = Math.max(0, g.meter - dt * 0.3);
    g.shake = Math.max(0, g.shake - dt * 1.6);
    if (g.meter >= 100) {
        g.meter = 100;
        g.cause = 'luft';
        io.lose('luft');
        return;
    }
    if (totalPlanes(g) < 10) {
        g.cause = 'fly';
        io.lose('fly');
    }
}

export function stepFx(g: G, dt: number) {
    for (const f of g.fx) {
        f.life += dt;
        f.p[0] += f.v[0] * dt;
        f.p[1] += f.v[1] * dt;
        f.p[2] += f.v[2] * dt;
        if (f.kind === 'spark' || f.kind === 'bomb') f.v[1] -= dt * 2.4;
    }
    g.fx = g.fx.filter((f) => f.life < f.max);
}
