// INN MOT STRANDA - spillreglene. Ren TypeScript uten React, så robotene kan spille
// hundrevis av runder i simuleringen (npx tsx) uten nettleser.
//
// Fagkjernen: De allierte gikk i land ved lavvann. Da sto de tyske strandhindrene
// (stålkryss og påler med miner) synlige på sanden, og ingeniørene kunne sprenge
// spor gjennom dem. Når tidevannet stiger, forsvinner hindrene under vann - da er
// sporene den eneste trygge veien inn. Og uten flåten var stranda umulig: slagskipene
// måtte skyte ut bunkerne på skrenten, ellers ble landgangsbåtene skutt i stykker.

export const W = 1600;
export const H = 900;

/** Bølger (dine landgangsbåter) i én runde, og hvor mange som må i land. */
export const WAVES = 8;
export const NEED = 5;

/** Vannlinja: y ved lavvann og ved slutten av runden (tidevannet stiger oppover). */
export const TIDE_LOW = 444;
export const TIDE_HIGH = 318;
/** Tid før tidevannet har nådd toppen (sekunder spilltid). */
export const TIDE_SECONDS = 80;

/** Stranda: tørr sand opp til denne linja, så skrenten. */
export const BEACH_TOP = 262;
/** Beltet der hindrene står (mellom fjære og flo). */
export const OBST_Y0 = 330;
export const OBST_Y1 = 440;

export const BOAT_START_Y = 860;
export const BOAT_W = 30;
export const BOAT_L = 58;
const BOAT_SPEED = 42; // px/s framover (normal fart)
const STEER_SPEED = 250; // px/s sidelengs
export const BOAT_HP = 1;

export const SHELL_R = 46; // sprengradius
const SHELL_WARN = 1.6; // sekunder fra ringen vises til granaten slår ned

export const RELOAD = 2.8;
/** Salven sprer seg rundt siktepunktet; en granat innenfor HIT_R av en bunker tar den. */
export const SALVO_SPREAD = 46;
const HIT_R = 30;
/** Sekunder før en ødelagt bunker er bemannet igjen. */
export const REMAN = 12;
const NAVAL_FLIGHT = 1.1; // sekunder fra klikk til nedslag
export const LANE_W = 64; // bredden på et sprengt spor

export type Cause = 'skutt' | 'mine';
export type Mode = 'play' | 'won' | 'lost';

export interface Boat {
    id: number;
    x: number;
    y: number;
    hp: number;
    mine: boolean; // eleven styrer denne
    steer: number; // -1..1 (AI-båtene: litt drift)
    sunk: number; // > 0: synker (sekunder)
    landed: number; // > 0: i land (sekunder siden)
    wake: number;
}

export interface Obstacle {
    id: number;
    x: number;
    y: number;
    kind: 'kryss' | 'pale';
    gone: boolean; // sprengt av ingeniørene
}

export interface Bunker {
    id: number;
    x: number;
    y: number;
    active: boolean;
    hp: number;
    cd: number; // sekunder til neste skudd
    flash: number;
    dead: number; // > 0: sekunder siden den ble ødelagt
    /** 0-1: hvor godt skytterne har skutt seg inn. En bunker i fred treffer bedre og bedre. */
    zero: number;
}

export interface Shell {
    id: number;
    x: number;
    y: number;
    t: number; // sekunder til nedslag
    from: number; // bunker-id
    atMe: boolean;
}

export interface Naval {
    id: number;
    x: number;
    y: number;
    t: number;
}

export interface Fx {
    kind: 'splash' | 'boom' | 'naval' | 'mine' | 'lane' | 'wreck' | 'barrage' | 'tracer';
    /** Sporlys: hvor skuddet går. */
    x2?: number;
    y2?: number;
    x: number;
    y: number;
    t: number;
    life: number;
}

export type GameEvent =
    | { e: 'wave'; n: number }
    | { e: 'shell'; x: number; y: number; atMe: boolean }
    | { e: 'impact'; x: number; y: number; water: boolean }
    | { e: 'near'; x: number; y: number }
    | { e: 'hit'; x: number; y: number; hp: number }
    | { e: 'sunk'; x: number; y: number; cause: Cause; mine: boolean }
    | { e: 'landed'; x: number; y: number; mine: boolean; lane: boolean }
    | { e: 'fire'; x: number; y: number }
    | { e: 'reload' }
    | { e: 'bunker'; x: number; y: number; dead: boolean }
    | { e: 'newBunker'; x: number; y: number }
    | { e: 'points'; n: number; x: number; y: number }
    | { e: 'submerged' }
    | { e: 'lane'; x: number; mine: boolean }
    | { e: 'nolane'; x: number }
    | { e: 'won' }
    | { e: 'lost'; cause: Cause };

export interface Game {
    seed: number;
    t: number;
    mode: Mode;
    score: number;
    ids: number;
    wave: number; // hvilken bølge (1..WAVES) som går nå
    landed: number;
    lost: number;
    combo: number;
    me: Boat | null;
    nextBoat: number; // sekunder til neste bølge
    boats: Boat[]; // alle båter, også AI-båtene ved siden av
    nextAi: number;
    obstacles: Obstacle[];
    lanes: number[]; // x-midten av sprengte spor
    bunkers: Bunker[];
    shells: Shell[];
    navals: Naval[];
    reload: number; // sekunder til slagskipene kan skyte igjen
    nextBunker: number;
    fx: Fx[];
    events: GameEvent[];
    /** Styring fra eleven eller roboten: -1..1 sidelengs, fart 0.6..1.5. */
    input: { steer: number; throttle: number; targetX: number | null };
    cause: Cause | null;
    valg: number;
    stats: {
        dodged: number;
        bunkers: number;
        aiLanded: number;
        laneLandings: number;
        hits: number;
    };
    submergedSaid: boolean;
    shake: number;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function rand(g: { seed: number }) {
    let t = (g.seed = (g.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Vannlinja nå (y). Stiger oppover stranda med tiden. */
export function waterline(g: Game) {
    const p = clamp(g.t / TIDE_SECONDS, 0, 1);
    // Tidevannet stiger saktest i starten, raskest midt i (som et ekte tidevann).
    const s = (1 - Math.cos(p * Math.PI)) / 2;
    return TIDE_LOW + (TIDE_HIGH - TIDE_LOW) * s;
}

/** Klokkeslett på stranda: 06:30 ved start. */
export function clock(g: Game) {
    const min = 6 * 60 + 30 + Math.floor(g.t * 0.8);
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function inLane(g: Game, x: number) {
    return g.lanes.some((l) => Math.abs(l - x) < LANE_W / 2);
}

export function obstacleVisible(g: Game, o: Obstacle) {
    return !o.gone && o.y < waterline(g) - 6;
}

const BUNKER_SPOTS: [number, number][] = [
    [190, 196],
    [470, 170],
    [760, 206],
    [1040, 176],
    [1320, 200],
    [1480, 150],
];

export function newGame(seed: number): Game {
    const g: Game = {
        seed,
        t: 0,
        mode: 'play',
        score: 0,
        ids: 1,
        wave: 0,
        landed: 0,
        lost: 0,
        combo: 0,
        me: null,
        nextBoat: 0.6,
        boats: [],
        nextAi: 2,
        obstacles: [],
        lanes: [],
        bunkers: BUNKER_SPOTS.map(([x, y], i) => ({
            id: i,
            x,
            y,
            active: false,
            hp: 1,
            cd: 2.5 + i * 0.7,
            flash: 0,
            dead: 0,
            zero: 0,
        })),
        shells: [],
        navals: [],
        reload: 0,
        nextBunker: 16,
        fx: [],
        events: [],
        input: { steer: 0, throttle: 1, targetX: null },
        cause: null,
        valg: 0,
        stats: { dodged: 0, bunkers: 0, aiLanded: 0, laneLandings: 0, hits: 0 },
        submergedSaid: false,
        shake: 0,
    };
    // To bunkere skyter fra start; resten våkner etter hvert.
    const order = [2, 3, 1, 4, 0, 5];
    g.bunkers[order[0]].active = true;
    g.bunkers[order[1]].active = true;
    (g as Game & { order?: number[] }).order = order;
    // Strandhindrene: rader av stålkryss og påler i fjærebeltet.
    // Tre rader, forskjøvet: det finnes alltid en sikksakk-vei gjennom, men aldri en rett linje.
    for (let row = 0; row < 3; row++) {
        const y = OBST_Y0 + 12 + row * ((OBST_Y1 - OBST_Y0 - 24) / 2);
        const n = 16;
        for (let i = 0; i < n; i++) {
            const x = 60 + ((i + [0, 0.5, 0.25][row] + (rand(g) - 0.5) * 0.3) * (W - 120)) / n;
            g.obstacles.push({
                id: g.ids++,
                x,
                y: y + (rand(g) - 0.5) * 14,
                kind: rand(g) < 0.6 ? 'kryss' : 'pale',
                gone: false,
            });
        }
    }
    return g;
}

export function pressure(g: Game) {
    const active = g.bunkers.filter((b) => b.active && b.dead === 0).length;
    const tide = clamp(g.t / TIDE_SECONDS, 0, 1);
    return clamp(0.15 + 0.1 * active + 0.35 * tide, 0, 1);
}

export const mult = (g: Game) => 1 + Math.min(4, g.combo);

// ---------------------------------------------------------------------------
// Input: samme grep for eleven og robotene
// ---------------------------------------------------------------------------

/** Styr sidelengs: -1 venstre, 0 rett fram, 1 høyre. */
export function steer(g: Game, dir: number) {
    g.input.steer = clamp(dir, -1, 1);
    g.input.targetX = null;
}

/** Styr mot et punkt på tvers av stranda (pekeren holdt nede på havet). */
export function steerTo(g: Game, x: number | null) {
    g.input.targetX = x === null ? null : clamp(x, 40, W - 40);
}

/** Gass: 0,6 (sakte) til 1,5 (full fart). */
export function throttle(g: Game, v: number) {
    g.input.throttle = clamp(v, 0.6, 1.5);
}

export function bunkerAt(g: Game, x: number, y: number) {
    let best: Bunker | null = null;
    let bd = 70 * 70;
    for (const b of g.bunkers) {
        if (!b.active || b.dead > 0) continue;
        const d = (b.x - x) ** 2 + (b.y - y) ** 2;
        if (d < bd) {
            bd = d;
            best = b;
        }
    }
    return best;
}

/**
 * Be flåten skyte en salve mot skrenten. Tre granater slår ned spredt rundt punktet
 * eleven sikter på; treffer én av dem en bunker, er den ute. Slagskipene må lade om
 * mellom salvene, så eleven må velge hvilken bunker som er farligst akkurat nå.
 */
export function fire(g: Game, x: number, y: number): 'ild' | 'lader' | 'ingen' {
    if (g.mode !== 'play') return 'ingen';
    if (y > BEACH_TOP + 24) return 'ingen';
    if (g.reload > 0) return 'lader';
    g.reload = RELOAD;
    for (let k = 0; k < 3; k++) {
        const a = rand(g) * Math.PI * 2;
        const r = Math.sqrt(rand(g)) * SALVO_SPREAD;
        g.navals.push({
            id: g.ids++,
            x: x + Math.cos(a) * r,
            y: y + Math.sin(a) * r * 0.8,
            t: NAVAL_FLIGHT + k * 0.14,
        });
    }
    g.events.push({ e: 'fire', x, y });
    return 'ild';
}

// ---------------------------------------------------------------------------
// Ett steg
// ---------------------------------------------------------------------------

function spawnMine(g: Game) {
    g.wave++;
    const x = 200 + rand(g) * (W - 400);
    g.me = {
        id: g.ids++,
        x,
        y: BOAT_START_Y,
        hp: BOAT_HP,
        mine: true,
        steer: 0,
        sunk: 0,
        landed: 0,
        wake: 0,
    };
    g.boats.push(g.me);
    g.input = { steer: 0, throttle: 1, targetX: null };
    g.valg++;
    g.events.push({ e: 'wave', n: g.wave });
}

function spawnAi(g: Game) {
    const x = 80 + rand(g) * (W - 160);
    if (g.me && Math.abs(g.me.x - x) < 120 && g.me.y > 600) return;
    g.boats.push({
        id: g.ids++,
        x,
        y: BOAT_START_Y + 20,
        hp: 1,
        mine: false,
        steer: (rand(g) - 0.5) * 0.3,
        sunk: 0,
        landed: 0,
        wake: 0,
    });
}

function sink(g: Game, b: Boat, cause: Cause) {
    b.sunk = 0.001;
    g.fx.push({ kind: cause === 'mine' ? 'mine' : 'boom', x: b.x, y: b.y, t: 0, life: 1.4 });
    // Vraket brenner videre en stund.
    g.fx.push({ kind: 'wreck', x: b.x, y: b.y, t: 0, life: 14 });
    g.events.push({ e: 'sunk', x: b.x, y: b.y, cause, mine: b.mine });
    if (b.mine) {
        g.lost++;
        g.combo = 0;
        g.cause = cause;
        g.me = null;
        g.nextBoat = 2.2;
        g.shake = 0.8;
    }
}

function land(g: Game, b: Boat) {
    b.landed = 0.001;
    const lane = inLane(g, b.x);
    if (b.mine) {
        g.landed++;
        g.combo++;
        if (lane) g.stats.laneLandings++;
        // Båter i land på rad gir mer: det er dyktigheten spillet belønner.
        const pts = 150 + 50 * Math.min(4, g.combo - 1) + (lane ? 100 : 0);
        g.score += pts;
        g.events.push({ e: 'points', n: pts, x: b.x, y: b.y - 40 });
        g.me = null;
        g.nextBoat = 1.8;
    } else {
        g.stats.aiLanded++;
        g.score += 20;
    }
    g.events.push({ e: 'landed', x: b.x, y: b.y, mine: b.mine, lane });
    // Ingeniørene sprenger et spor gjennom hindrene der båten gikk i land - men bare
    // mens alle hindrene i sporet står på tørr sand. Når tidevannet har dekket dem,
    // når ingeniørene dem ikke. Et gult spor er derfor alltid trygt helt inn.
    if (!lane) {
        const wl = waterline(g);
        const col = g.obstacles.filter((o) => !o.gone && Math.abs(o.x - b.x) < LANE_W / 2 + 24);
        if (col.every((o) => o.y < wl - 4)) {
            for (const o of col) o.gone = true;
            g.lanes.push(b.x);
            g.fx.push({ kind: 'lane', x: b.x, y: (OBST_Y0 + OBST_Y1) / 2, t: 0, life: 1.6 });
            g.events.push({ e: 'lane', x: b.x, mine: b.mine });
        } else if (b.mine) g.events.push({ e: 'nolane', x: b.x });
    }
}

function bunkerShot(g: Game, bk: Bunker) {
    bk.flash = 0.25;
    // Sikter på din båt oftest, ellers på en av de andre.
    const me = g.me;
    const ai = g.boats.filter((b) => !b.mine && b.sunk === 0 && b.landed === 0 && b.y < 820);
    const atMe = !!me && me.y < 840 && (ai.length === 0 || rand(g) < 0.62);
    const tgt = atMe ? me : ai.length ? ai[Math.floor(rand(g) * ai.length)] : null;
    if (!tgt) return;
    // Skytteren leder skuddet: der båten vil være når granaten lander, pluss spredning.
    const v = BOAT_SPEED * (tgt.mine ? g.input.throttle : 1);
    const lead = SHELL_WARN * (0.7 + rand(g) * 0.5);
    // Skyter seg inn: spredningen krymper for hvert skudd bunkeren får skyte i fred.
    const spread = 1.25 - bk.zero;
    const x =
        tgt.x +
        (tgt.mine ? g.input.steer * STEER_SPEED * lead * 0.3 * bk.zero : 0) +
        (rand(g) - 0.5) * 70 * spread;
    const y = tgt.y - v * lead + (rand(g) - 0.5) * 50 * spread;
    bk.zero = Math.min(1, bk.zero + 0.18);
    g.shells.push({ id: g.ids++, x, y, t: SHELL_WARN, from: bk.id, atMe });
    g.fx.push({ kind: 'tracer', x: bk.x, y: bk.y + 16, x2: x, y2: y, t: 0, life: 0.35 });
    if (atMe) g.valg++;
    g.events.push({ e: 'shell', x, y, atMe });
}

function bunkerGap(g: Game) {
    // Batteriene skyter oftere jo lenger dagen går.
    return clamp(5.2 - (g.t / TIDE_SECONDS) * 1.6, 3.6, 5.2);
}

export function update(g: Game, dt: number) {
    g.shake = Math.max(0, g.shake - dt * 1.8);
    tickFx(g, dt);
    if (g.mode !== 'play') {
        for (const b of g.boats) if (b.sunk > 0) b.sunk += dt;
        return;
    }
    g.t += dt;
    const wl = waterline(g);

    if (!g.submergedSaid && g.obstacles.some((o) => !o.gone && o.y > wl) && g.t > 25) {
        g.submergedSaid = true;
        g.events.push({ e: 'submerged' });
    }

    // Nye båter
    if (!g.me && g.wave < WAVES) {
        g.nextBoat -= dt;
        if (g.nextBoat <= 0) spawnMine(g);
    }
    g.nextAi -= dt;
    if (g.nextAi <= 0 && g.wave <= WAVES) {
        spawnAi(g);
        g.nextAi = 2.2 + rand(g) * 1.8;
    }

    // Båtene
    for (const b of g.boats) {
        if (b.sunk > 0) {
            b.sunk += dt;
            continue;
        }
        if (b.landed > 0) {
            b.landed += dt;
            continue;
        }
        let vx: number;
        let v = BOAT_SPEED;
        if (b.mine) {
            const inp = g.input;
            if (inp.targetX !== null) vx = clamp((inp.targetX - b.x) / 40, -1, 1) * STEER_SPEED;
            else vx = inp.steer * STEER_SPEED;
            v *= inp.throttle;
        } else {
            vx = b.steer * 40;
        }
        b.x = clamp(b.x + vx * dt, 30, W - 30);
        b.y -= v * dt;
        b.wake += dt;
        // Hinder: en båt som treffer et stålkryss eller en mine, går ned.
        for (const o of g.obstacles) {
            if (o.gone) continue;
            // Baugen treffer: hinderet må ligge like foran eller under forenden av båten.
            if (
                Math.abs(o.x - b.x) < BOAT_W / 2 + 9 &&
                o.y > b.y - BOAT_L / 2 - 4 &&
                o.y < b.y - BOAT_L / 2 + 16
            ) {
                o.gone = true;
                sink(g, b, 'mine');
                break;
            }
        }
        if (b.sunk > 0) continue;
        // Båten går på grunn når baugen når vannkanten; rampa går ned.
        if (b.y - BOAT_L / 2 <= wl + 2) land(g, b);
    }
    g.boats = g.boats.filter(
        (b) => (b.sunk === 0 || b.sunk < 3) && (b.landed === 0 || b.landed < 5)
    );

    // Bunkerne
    g.nextBunker -= dt;
    if (g.nextBunker <= 0) {
        const order = (g as Game & { order?: number[] }).order ?? [];
        const next = order.map((i) => g.bunkers[i]).find((b) => !b.active);
        if (next) {
            next.active = true;
            next.cd = 1.5;
            g.valg++;
            g.events.push({ e: 'newBunker', x: next.x, y: next.y });
        }
        g.nextBunker = 17;
    }
    for (const bk of g.bunkers) {
        bk.flash = Math.max(0, bk.flash - dt);
        if (bk.dead > 0) {
            bk.dead += dt;
            // Nye soldater tar over stillingen: en ødelagt bunker skyter igjen etter en stund.
            if (bk.dead > REMAN) {
                bk.dead = 0;
                bk.zero = 0;
                bk.cd = 2;
                g.valg++;
                g.events.push({ e: 'newBunker', x: bk.x, y: bk.y });
            }
            continue;
        }
        if (!bk.active) continue;
        bk.cd -= dt;
        if (bk.cd <= 0) {
            bunkerShot(g, bk);
            bk.cd = bunkerGap(g) * (0.8 + rand(g) * 0.4);
        }
    }

    // Granatene
    for (const s of g.shells) {
        s.t -= dt;
        if (s.t > 0) continue;
        const water = s.y > wl;
        g.fx.push({ kind: water ? 'splash' : 'boom', x: s.x, y: s.y, t: 0, life: 0.9 });
        g.events.push({ e: 'impact', x: s.x, y: s.y, water });
        // Nedslag nær båten din rister bildet.
        if (g.me) {
            const d = Math.hypot(g.me.x - s.x, g.me.y - s.y);
            if (d < 260) g.shake = Math.max(g.shake, 0.35 * (1 - d / 260));
        }
        for (const b of g.boats) {
            if (b.sunk > 0 || b.landed > 0) continue;
            const d = Math.hypot(b.x - s.x, b.y - s.y);
            if (d < SHELL_R) {
                b.hp--;
                if (b.mine) {
                    g.stats.hits++;
                    g.shake = 0.5;
                    g.events.push({ e: 'hit', x: b.x, y: b.y, hp: b.hp });
                }
                if (b.hp <= 0) sink(g, b, 'skutt');
            } else if (b.mine && s.atMe && d < SHELL_R + 45) {
                g.stats.dodged++;
                g.score += 5;
                g.events.push({ e: 'near', x: s.x, y: s.y });
            }
        }
    }
    g.shells = g.shells.filter((s) => s.t > 0);

    // Flåtens granater
    if (g.reload > 0) {
        g.reload -= dt;
        if (g.reload <= 0) g.events.push({ e: 'reload' });
    }
    for (const n of g.navals) {
        n.t -= dt;
        if (n.t > 0) continue;
        g.fx.push({ kind: 'naval', x: n.x, y: n.y, t: 0, life: 1.8 });
        g.shake = Math.max(g.shake, 0.3);
        const bk = g.bunkers.find(
            (b) => b.active && b.dead === 0 && Math.hypot(b.x - n.x, b.y - n.y) < HIT_R
        );
        if (bk) {
            bk.dead = 0.001;
            g.stats.bunkers++;
            // Granatene den ikke rakk å skyte, forsvinner med den.
            g.shells = g.shells.filter((s) => s.from !== bk.id || s.t < 0.4);
            // Tatt tidlig, før skytterne har skutt seg inn, er verdt mest.
            const pts = 10 + Math.round(20 * (1 - bk.zero));
            g.score += pts;
            g.events.push({ e: 'bunker', x: bk.x, y: bk.y, dead: true });
            g.events.push({ e: 'points', n: pts, x: bk.x, y: bk.y - 40 });
        }
    }
    g.navals = g.navals.filter((n) => n.t > 0);

    // Utfall
    if (g.landed >= NEED && g.wave >= WAVES && !g.me) {
        g.mode = 'won';
        g.score += 500;
        g.events.push({ e: 'won' });
    } else if (WAVES - g.lost < NEED) {
        g.mode = 'lost';
        g.events.push({ e: 'lost', cause: g.cause ?? 'skutt' });
    } else if (g.wave >= WAVES && !g.me && g.nextBoat <= 0.5) {
        // Alle bølgene er brukt opp.
        if (g.landed >= NEED) {
            g.mode = 'won';
            g.score += 500;
            g.events.push({ e: 'won' });
        } else {
            g.mode = 'lost';
            g.events.push({ e: 'lost', cause: g.cause ?? 'skutt' });
        }
    }
}

function tickFx(g: Game, dt: number) {
    for (const f of g.fx) f.t += dt;
    g.fx = g.fx.filter((f) => f.t < f.life);
}
