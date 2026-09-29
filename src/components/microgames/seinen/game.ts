// SEINEN SNUR - spillreglene. Ren TypeScript uten React, så robotene kan spille
// hundrevis av runder i simuleringen (npx tsx) uten nettleser.
//
// Fagkjernen: Vikingene under Rollo herjet langs Seinen og truet Paris. I 911 ga kong
// Karl den enfoldige dem landet ved elvemunningen - mot at de forsvarte det mot andre
// vikinger. Plyndreren ble vasall og forsvarer. Samme grep (ramme en båt) får motsatt
// regel: før 911 gir frankiske båter sølv, etter 911 koster de landet, og da er det
// vikingskipene som må stoppes.

export const W = 1280;
export const H = 720;

/** Før avtalen: 885 (beleiringen av Paris) til 911. */
export const P1 = 26;
/** Etter avtalen: 911 til 933, da Normandie fikk mer land i vest. */
export const P2 = 100;
export const YEAR_A = 885;
export const YEAR_T = 911;
export const YEAR_B = 933;
export const LAND = 6;
/** Plyndrer du nok sølv før 911, gir kongen deg mer land - men da kommer det flere vikinger. */
export const MAX_LAND = 8;
export const SILVER_PER_LAND = 4;
/** Så mange kongelige sølvkister gir ett liv tilbake. */
export const CHESTS_PER_LIFE = 3;
export const HP = 3;

/** Rouen: kommer et vikingskip forbi her, er det inne i landet ditt. */
export const ROUEN_Y = 292;
export const PARIS_Y = 64;

const SHIP_R = 24;
const BOAT_R = 22;
/** Farten som skal til for å ramme (px/s). Saktere enn dette er bare en dult. */
export const RAM_V = 150;
const MAXV = 330;
const ACCEL = 3.2;
export const VOLLEY_T = 1.05;
export const VOLLEY_R = 40;
/** Kongens båter seiler i egen fil langs venstre bredd etter 911. */
export const KING_U = -0.74;
/** Så mange kongsbåter rammet før kongen tar tilbake en landsby. */
export const ANGER_MAX = 2;
/** Farten til vikingskipene (px/s) i 911, og hvor mye den øker til 933. */
const VIKING_V0 = 60;
const VIKING_DV = 88;
/** Står skipet saktere enn dette når et vikingskip kommer borti, entrer de det. */
export const BOARD_V = 90;

export type Phase = 'plyndring' | 'avtale';
export type Cause = 'skutt' | 'bordet' | 'vikinger' | 'kongen';
export type Mode = 'play' | 'won' | 'lost';

/** Elva: midtlinja og halve bredden som funksjon av y (havet nederst, Paris øverst). */
export const riverX = (y: number) => 640 + 190 * Math.sin(y / 132 + 0.6) + 60 * Math.sin(y / 61);
export const riverHalf = (y: number) => 62 + 150 * Math.pow(Math.max(0, y) / H, 2.2);

export interface Ship {
    x: number;
    y: number;
    vx: number;
    vy: number;
    hp: number;
    hit: number; // > 0: nettopp truffet (blink)
    heading: number;
}

export interface Boat {
    id: number;
    kind: 'frank' | 'viking';
    x: number;
    y: number;
    u: number; // sideveis plass i elva: andel av bredden (frankere, -1..1) eller piksler fra midten (vikinger)
    v: number; // fart langs elva (px/s, + = nedover mot havet)
    fleeing: number; // > 0: rammet, på vei bort
    silver: number;
    /** Farten et rammet skip sklir med - treffer det en annen båt, rammer det den også. */
    sx: number;
    sy: number;
    chain: number;
    /** Har det rammede skipet alt knust mot bredden? */
    wrecked: boolean;
    /** Ligger (eller lå) skipet fast foran kjettingen? Da er det et lett bytte: dobbel poeng. */
    caught?: boolean;
}

export interface Fort {
    x: number;
    y: number;
    range: number;
    cd: number;
    name: string;
}

export interface Volley {
    id: number;
    x: number;
    y: number;
    t: number; // sekunder til pilene lander
    fx: number;
    fy: number;
}

export interface Village {
    x: number;
    y: number;
    alive: boolean;
    lost: Cause | null;
}

export type GameEvent =
    | { e: 'year'; year: number }
    | { e: 'barge'; x: number; y: number }
    | { e: 'viking'; x: number; y: number; n: number }
    | { e: 'ram'; kind: 'frank' | 'viking'; x: number; y: number; points: number; betrayal: boolean; chain: number; caught?: boolean }
    | { e: 'boarded'; x: number; y: number; hp: number; lostLife: boolean }
    | { e: 'cleanWave'; x: number; y: number }
    | { e: 'wreck'; x: number; y: number; points: number }
    | { e: 'anger'; x: number; y: number; anger: number }
    | { e: 'calm'; anger: number }
    | { e: 'repaired'; x: number; y: number }
    | { e: 'grant'; land: number; extra: number }
    | { e: 'chain'; up: boolean }
    | { e: 'chainBreak' }
    | { e: 'chainHolds'; x: number; y: number }
    | { e: 'kingWaits'; x: number; y: number }
    | { e: 'bump'; x: number; y: number }
    | { e: 'volley'; x: number; y: number; fx: number; fy: number }
    | { e: 'arrows'; x: number; y: number; hit: boolean }
    | { e: 'passed'; x: number; y: number; village: number }
    | { e: 'kingTakes'; village: number }
    | { e: 'treaty' }
    | { e: 'pairs' }
    | { e: 'flock' }
    | { e: 'points'; n: number; x: number; y: number }
    | { e: 'won' }
    | { e: 'lost'; cause: Cause };

export interface Game {
    seed: number;
    t: number;
    mode: Mode;
    phase: Phase;
    score: number;
    ids: number;
    rng: () => number;
    ship: Ship;
    target: [number, number] | null;
    boats: Boat[];
    forts: Fort[];
    volleys: Volley[];
    villages: Village[];
    combo: number;
    /** Kongens vrede: hvor mange av båtene hans du har rammet siden sist han tok en landsby. */
    anger: number;
    /** Kongelige sølvkister: CHESTS_PER_LIFE gir ett liv tilbake. */
    chests: number;
    /** Landsbyene kongen ga deg i 911 (LAND + det sølvet kjøpte). */
    land: number;
    /** Ekstra vikingskip per bølge fordi du plyndret mye. */
    extra: number;
    /** Holdt du forrige bølge unna Rouen uten å røre kongens båter? Da roer kongen seg. */
    waveClean: boolean;
    /** Sekunder etter et rammestøt der ingen kan entre skipet. */
    ramGrace: number;
    /** Et vikingskip er nær, og skipet ligger for sakte (rød ring). */
    boardWarn: boolean;
    /** Skipene i bølgen som er ute nå. */
    wave: number[];
    chain: Chain;
    year: number;
    bargeCd: number;
    vikingCd: number;
    cause: Cause | null;
    valg: number;
    events: GameEvent[];
    shake: number;
    repair: number;
    stats: {
        silver: number;
        stopped: number;
        betrayed: number;
        passed: number;
        bestCombo: number;
        bestChain: number;
        wrecked: number;
    };
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
    const rng = mulberry(seed);
    const fortAt = (y: number, side: number, range: number, name: string): Fort => ({
        x: riverX(y) + side * (riverHalf(y) + 34),
        y,
        range,
        cd: 1.5 + rng(),
        name,
    });
    const villages: Village[] = [];
    // Landsbyene ved elvemunningen: på begge bredder mellom Rouen og havet.
    for (let i = 0; i < MAX_LAND; i++) {
        const y = 346 + i * 44;
        const side = i % 2 === 0 ? -1 : 1;
        villages.push({ x: riverX(y) + side * (riverHalf(y) + 58), y, alive: i < LAND, lost: null });
    }
    const y0 = 640;
    return {
        seed,
        t: 0,
        mode: 'play',
        phase: 'plyndring',
        score: 0,
        ids: 1,
        rng,
        ship: { x: riverX(y0), y: y0, vx: 0, vy: -60, hp: HP, hit: 0, heading: -Math.PI / 2 },
        target: null,
        boats: [],
        forts: [
            fortAt(PARIS_Y + 34, 0, 200, 'Paris'),
            fortAt(200, -1, 130, 'Pîtres'),
            fortAt(ROUEN_Y + 4, -1, 110, 'Rouen'),
        ],
        volleys: [],
        villages,
        combo: 0,
        anger: 0,
        chests: 0,
        land: LAND,
        extra: 0,
        waveClean: false,
        ramGrace: 0,
        boardWarn: false,
        wave: [],
        chain: { up: false, hp: 1, broken: 0, wait: 0 },
        year: YEAR_A,
        bargeCd: 0.8,
        vikingCd: 2,
        cause: null,
        valg: 0,
        events: [],
        shake: 0,
        repair: 0,
        stats: { silver: 0, stopped: 0, betrayed: 0, passed: 0, bestCombo: 0, bestChain: 0, wrecked: 0 },
    };
}

export const yearAt = (t: number) =>
    t < P1
        ? Math.floor(YEAR_A + ((YEAR_T - YEAR_A) * t) / P1)
        : Math.min(YEAR_B, Math.floor(YEAR_T + ((YEAR_B - YEAR_T) * (t - P1)) / P2));
/** Poengmultiplikator: rekka har ikke tak. */
export const mult = (g: Game) => 1 + g.combo * 0.1;
export const speedOf = (s: Ship) => Math.hypot(s.vx, s.vy);
export const landLeft = (g: Game) => g.villages.filter((v) => v.alive).length;

/** Styr mot et punkt (pekeren, eller robotens mål). null = slipp årene. */
/** Kjettingen over Seinen ved Rouen (etter 911). */
export interface Chain {
    up: boolean;
    /** 0-1: hvor mye kjettingen tåler før den ryker. */
    hp: number;
    /** Sekunder til en røket kjetting er reparert. */
    broken: number;
    /** Hvor lenge kongens båter har ventet bak den (sekunder siden forrige vrede). */
    wait: number;
}
/** Vinsjen som heiser kjettingen, på høyre bredd ved Rouen. */
export const winchAt = (): [number, number] => [riverX(ROUEN_Y) + riverHalf(ROUEN_Y) + 40, ROUEN_Y + 30];
/** Skipene stopper så langt foran kjettingen. */
const CHAIN_GAP = 20;
const CHAIN_WEAR = 0.1; // per skip som presser mot den, per sekund
const CHAIN_FIX = 0.1; // per sekund når den er senket
const CHAIN_BROKEN_S = 8;
/** Så lenge kan kongens båter vente før kongen blir sint. */
export const KING_PATIENCE = 2.5;

/**
 * Heis eller senk kjettingen. Oppe stopper den vikingskipene før Rouen - men også kongens
 * handelsbåter på vei ned til havet. Vasallen skulle holde vikingene ute, ikke stenge
 * kongens elv.
 */
export function toggleChain(g: Game) {
    if (g.phase !== 'avtale' || g.mode !== 'play' || g.chain.broken > 0) return;
    g.chain.up = !g.chain.up;
    g.valg++;
    g.events.push({ e: 'chain', up: g.chain.up });
}

export function steerTo(g: Game, x: number | null, y?: number) {
    g.target = x === null || y === undefined ? null : [x, y];
}

function addPoints(g: Game, n: number, x: number, y: number) {
    const p = Math.round(n * mult(g));
    g.score += p;
    g.events.push({ e: 'points', n: p, x, y });
}

function spawnBarge(g: Game) {
    // Etter 911 seiler kongens båter i egen fil langs venstre bredd - resten av elva er din.
    const u = g.phase === 'avtale' ? KING_U + (g.rng() - 0.5) * 0.12 : (g.rng() - 0.5) * 1.3;
    const y = -20;
    g.boats.push({
        id: g.ids++,
        kind: 'frank',
        x: riverX(y) + u * riverHalf(y),
        y,
        u,
        v: 48 + g.rng() * 16,
        fleeing: 0,
        silver: 100,
        sx: 0,
        sy: 0,
        chain: 0,
        wrecked: false,
    });
    g.valg++;
    g.events.push({ e: 'barge', x: riverX(40), y: 40 });
}

export type Formation = 'en' | 'rekke' | 'linje' | 'kile' | 'splitt';

/**
 * Vikingskipene kommer i formasjoner: på rekke (etter hverandre), på linje (side om side)
 * eller i kile. Et skip du rammer, sklir inn i naboen - tette flåter gir kjedekrasj.
 */
function spawnViking(g: Game, n: number, form: Formation) {
    const f = Math.min(1, (g.t - P1) / P2);
    const v = -(VIKING_V0 + VIKING_DV * f) * (0.92 + g.rng() * 0.16);
    // Plassene i formasjonen, i piksler: [til siden, bakover]. Tett nok til kjedekrasj.
    const slots: [number, number][] = [];
    for (let i = 0; i < n; i++) {
        if (form === 'rekke' || form === 'en') slots.push([0, i * 50]);
        // To rekker langs hver sin bredd samtidig: du rekker bare én av dem i full fart.
        else if (form === 'splitt') slots.push([i % 2 ? 130 : -130, Math.floor(i / 2) * 50]);
        else if (form === 'linje') slots.push([((i % 3) - 1) * 48, Math.floor(i / 3) * 50]);
        else {
            // Kile: høvdingskipet først, så par bak på hver side.
            const row = Math.ceil(i / 2);
            const side = i === 0 ? 0 : i % 2 ? -1 : 1;
            slots.push(row <= 2 ? [side * row * 46, row * 42] : [side * 46, row * 42]);
        }
    }
    const minX = Math.min(...slots.map((q) => q[0]));
    const maxX = Math.max(...slots.map((q) => q[0]));
    const room = Math.max(0, riverHalf(H) * 0.8 - (maxX - minX) / 2 - 20);
    const ox0 = (g.rng() - 0.5) * 2 * room - (minX + maxX) / 2;
    for (const [dx, dy] of slots) {
        const y = H + 30 + dy;
        const b: Boat = {
            id: g.ids++,
            kind: 'viking',
            x: 0,
            y,
            u: ox0 + dx,
            v,
            fleeing: 0,
            silver: 0,
            sx: 0,
            sy: 0,
            chain: 0,
            wrecked: false,
        };
        placeBoat(b);
        g.boats.push(b);
        g.wave.push(b.id);
    }
    g.valg++;
    g.events.push({ e: 'viking', x: riverX(H - 20), y: H - 20, n });
}

/** Frankiske båter ligger på en andel av elvebredden (u), vikingskip på en fast avstand i piksler. */
function placeBoat(b: Boat) {
    const half = riverHalf(b.y);
    if (b.kind === 'frank') b.x = riverX(b.y) + b.u * half * 0.8;
    else {
        const lim = Math.max(0, half * 0.85 - 12);
        b.x = riverX(b.y) + Math.max(-lim, Math.min(lim, b.u));
    }
}

/** En båt blir rammet (av deg, eller av et skip som sklir - chain > 0). */
function hit(g: Game, b: Boat, vx: number, vy: number, chain: number) {
    b.fleeing = 0.001;
    b.sx = vx;
    b.sy = vy;
    b.chain = chain;
    if (chain > 0) g.stats.bestChain = Math.max(g.stats.bestChain, chain + 1);
    const bonus = chain > 0 ? 1 + chain : 1;
    if (b.kind === 'frank') {
        g.stats.silver += 1;
        if (g.phase === 'plyndring') {
            g.combo++;
            g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
            g.events.push({ e: 'ram', kind: 'frank', x: b.x, y: b.y, points: 0, betrayal: false, chain });
            addPoints(g, 100 * bonus, b.x, b.y);
        } else {
            // Etter 911: sølvet frister, men rekka ryker og kongen blir sint. Rammer du
            // ANGER_MAX av båtene hans, tar han tilbake en landsby.
            g.stats.betrayed++;
            g.events.push({ e: 'ram', kind: 'frank', x: b.x, y: b.y, points: 0, betrayal: true, chain });
            // Kongens sølv vokser med rekka: fristelsen er størst når du har mest å tape.
            const silver = 15 * Math.max(6, g.combo);
            g.score += silver;
            g.events.push({ e: 'points', n: silver, x: b.x, y: b.y });
            g.waveClean = false;
            g.chests++;
            if (g.chests >= CHESTS_PER_LIFE && g.ship.hp < HP) {
                g.chests = 0;
                g.ship.hp++;
                g.events.push({ e: 'repaired', x: g.ship.x, y: g.ship.y });
            }
            g.chests = Math.min(g.chests, CHESTS_PER_LIFE);
            angerUp(g, b.x, b.y);
        }
    } else {
        g.stats.stopped++;
        // Kjedekrasj bærer rekka: skip nummer to i kjeden gir +2, nummer tre +3 ...
        g.combo += 1 + chain;
        g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
        g.events.push({ e: 'ram', kind: 'viking', x: b.x, y: b.y, points: 0, betrayal: false, chain, caught: !!b.caught });
        // Et skip som ligger fast foran kjettingen, gir dobbelt.
        addPoints(g, 150 * bonus * (b.caught ? 2 : 1), b.x, b.y);
    }
}

/** Kongen blir sintere. Er vreden full, tar han en landsby - og rekka ryker. */
function angerUp(g: Game, x: number, y: number) {
    g.anger++;
    g.waveClean = false;
    g.events.push({ e: 'anger', x, y, anger: g.anger });
    if (g.anger >= ANGER_MAX) {
        g.anger = 0;
        g.combo = 0;
        const v = loseVillage(g, 'kongen');
        if (v >= 0) g.events.push({ e: 'kingTakes', village: v });
    }
}

function loseVillage(g: Game, cause: Cause): number {
    // Landsbyen nærmest Rouen går først - landet krymper mot havet.
    const v = g.villages.find((x) => x.alive);
    if (!v) return -1;
    v.alive = false;
    v.lost = cause;
    return g.villages.indexOf(v);
}

/** Hvor hardt spillet presser nå (0-1). */
export function pressure(g: Game): number {
    if (g.phase === 'plyndring') {
        let danger = 0;
        for (const f of g.forts) {
            const d = Math.hypot(g.ship.x - f.x, g.ship.y - f.y);
            if (d < f.range * 1.3) danger += 0.25;
        }
        return Math.min(1, 0.15 + 0.15 * (g.t / P1) + danger + 0.15 * (HP - g.ship.hp));
    }
    let threat = 0;
    for (const b of g.boats)
        if (b.kind === 'viking' && !b.fleeing && b.y < H) threat += Math.max(0, 1 - (b.y - ROUEN_Y) / 420);
    const f = Math.min(1, (g.t - P1) / P2);
    return Math.min(1, 0.3 + 0.3 * f + Math.min(0.3, threat * 0.12) + 0.1 * (1 - landLeft(g) / g.land));
}

export function update(g: Game, dt: number) {
    if (dt <= 0) return;
    g.t += dt;
    g.shake = Math.max(0, g.shake - dt * 3);
    const s = g.ship;
    s.hit = Math.max(0, s.hit - dt);
    g.ramGrace = Math.max(0, g.ramGrace - dt);
    if (g.mode !== 'play') {
        for (const b of g.boats) if (b.fleeing) b.fleeing += dt;
        return;
    }

    const y = yearAt(g.t);
    if (y !== g.year) {
        g.year = y;
        g.events.push({ e: 'year', year: y });
        if (y === 920) g.events.push({ e: 'pairs' });
        if (y === 926) g.events.push({ e: 'flock' });
    }
    if (g.phase === 'plyndring' && g.t >= P1) {
        g.phase = 'avtale';
        g.volleys = [];
        s.hp = HP;
        g.combo = 0;
        g.vikingCd = 2.2;
        const extra = Math.min(MAX_LAND - LAND, Math.floor(g.stats.silver / SILVER_PER_LAND));
        g.extra = extra;
        g.land = LAND + extra;
        for (let i = 0; i < g.land; i++) g.villages[i].alive = true;
        g.events.push({ e: 'treaty' });
        g.events.push({ e: 'grant', land: g.land, extra });
    }

    // Skipet: følger målet med treghet, holdes i elva.
    let dvx = 0;
    let dvy = 0;
    if (g.target) {
        const dx = g.target[0] - s.x;
        const dy = g.target[1] - s.y;
        const d = Math.hypot(dx, dy);
        const sp = Math.min(MAXV, d * 3.2);
        if (d > 1) {
            dvx = (dx / d) * sp;
            dvy = (dy / d) * sp;
        }
    }
    const k = Math.min(1, ACCEL * dt);
    s.vx += (dvx - s.vx) * k;
    s.vy += (dvy - s.vy) * k;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    // Teppets borde øverst og nederst er HUD - skipet holder seg mellom dem.
    s.y = Math.max(44, Math.min(H - 56, s.y));
    const cx = riverX(s.y);
    const hw = riverHalf(s.y) - SHIP_R * 0.7;
    if (s.x < cx - hw) {
        s.x = cx - hw;
        s.vx = Math.abs(s.vx) * 0.3;
    } else if (s.x > cx + hw) {
        s.x = cx + hw;
        s.vx = -Math.abs(s.vx) * 0.3;
    }
    if (speedOf(s) > 20) s.heading = Math.atan2(s.vy, s.vx);

    // Båtene flyter langs elva. Rammede båter sklir i støtretningen og kan ta med seg andre.
    let held = 0;
    let kingHeld: Boat | null = null;
    for (const b of g.boats) {
        if (b.fleeing) {
            b.fleeing += dt;
            b.x += b.sx * dt;
            b.y += b.sy * dt;
            const damp = Math.max(0, 1 - 2.4 * dt);
            b.sx *= damp;
            b.sy *= damp;
            b.y += (b.kind === 'viking' ? 50 : -20) * dt * Math.min(1, b.fleeing);
            // Sklir skipet i full fart inn i bredden, knuses det: bonus.
            const off = b.x - riverX(b.y);
            const half = riverHalf(b.y) * 0.95;
            if (Math.abs(off) > half) {
                const sp = Math.hypot(b.sx, b.sy);
                b.x = riverX(b.y) + Math.sign(off) * half;
                if (!b.wrecked && b.kind === 'viking' && sp > 110 && b.fleeing < 1.2) {
                    b.wrecked = true;
                    g.stats.wrecked++;
                    const pts = Math.round(100 * mult(g));
                    g.events.push({ e: 'wreck', x: b.x, y: b.y, points: pts });
                    addPoints(g, 100, b.x, b.y);
                }
                b.sx *= -0.2;
                b.sy *= 0.5;
            }
            continue;
        }
        let ny = b.y + b.v * dt;
        // Kjettingen: vikingskip nedenfra og kongens båter ovenfra stopper foran den.
        if (g.chain.up) {
            if (b.kind === 'viking' && b.y >= ROUEN_Y + CHAIN_GAP && ny < ROUEN_Y + CHAIN_GAP) {
                ny = ROUEN_Y + CHAIN_GAP;
                held++;
                b.caught = true;
            } else if (b.kind === 'frank' && g.phase === 'avtale' && b.y <= ROUEN_Y - CHAIN_GAP && ny > ROUEN_Y - CHAIN_GAP) {
                ny = ROUEN_Y - CHAIN_GAP;
                kingHeld = b;
            }
        }
        b.y = ny;
        placeBoat(b);
    }

    // Kjettingen slites av skipene som presser mot den, og ryker til slutt.
    const c = g.chain;
    if (c.broken > 0) c.broken = Math.max(0, c.broken - dt);
    if (c.up) {
        c.hp -= CHAIN_WEAR * held * dt;
        if (c.hp <= 0) {
            c.hp = 0;
            c.up = false;
            c.broken = CHAIN_BROKEN_S;
            g.events.push({ e: 'chainBreak' });
        }
    } else if (c.broken <= 0) c.hp = Math.min(1, c.hp + CHAIN_FIX * dt);
    if (held > 0 && c.up) g.events.push({ e: 'chainHolds', x: riverX(ROUEN_Y), y: ROUEN_Y + CHAIN_GAP });
    // Kongens båter som venter bak kjettingen, gjør kongen sint.
    if (kingHeld && c.up) {
        c.wait += dt;
        if (c.wait >= KING_PATIENCE) {
            c.wait = 0;
            angerUp(g, kingHeld.x, kingHeld.y);
            g.events.push({ e: 'kingWaits', x: kingHeld.x, y: kingHeld.y });
        }
    } else c.wait = Math.max(0, c.wait - dt);

    // Ramming.
    const sp = speedOf(s);
    for (const b of g.boats) {
        if (b.fleeing) continue;
        const d = Math.hypot(b.x - s.x, b.y - s.y);
        if (d > SHIP_R + BOAT_R) continue;
        // Farten inn mot båten avgjør: et streif i sidefart er bare en dult.
        const into = ((b.x - s.x) * s.vx + (b.y - s.y) * s.vy) / (d || 1);
        // Etter 911 skal det en ordentlig ramming til for å ta en frankisk båt - et streif er et uhell.
        const need = b.kind === 'frank' && g.phase === 'avtale' ? RAM_V * 1.25 : RAM_V * 0.75;
        if (sp < RAM_V || into < need) {
            // Bare en dult: båtene glir fra hverandre.
            const nx = (s.x - b.x) / (d || 1);
            const ny = (s.y - b.y) / (d || 1);
            s.x = b.x + nx * (SHIP_R + BOAT_R);
            s.y = b.y + ny * (SHIP_R + BOAT_R);
            if (b.kind === 'viking' && g.phase === 'avtale' && s.hit <= 0 && g.ramGrace <= 0 && sp < BOARD_V) {
                // Et vikingskip som kommer borti deg i sakte fart, prøver å entre. Har du en
                // rekke, koster det rekka; står rekka på null, mister du et liv.
                const lostLife = g.combo === 0;
                if (lostLife) s.hp--;
                s.hit = 1;
                g.shake = 0.5;
                g.combo = 0;
                s.vx = nx * 200;
                s.vy = ny * 200;
                g.events.push({ e: 'boarded', x: s.x, y: s.y, hp: s.hp, lostLife });
            } else g.events.push({ e: 'bump', x: b.x, y: b.y });
            continue;
        }
        g.shake = 0.6;
        hit(g, b, s.vx * 0.9, s.vy * 0.9, 0);
        // Skipet beholder farten gjennom støtet, og mannskapet er klart til neste i et halvt sekund.
        s.vx *= 0.7;
        s.vy *= 0.7;
        g.ramGrace = 0.6;
    }
    // Kjedekrasj: et skip som sklir, rammer det det treffer.
    for (const a of g.boats) {
        if (!a.fleeing || a.fleeing > 1.2 || Math.hypot(a.sx, a.sy) < 110) continue;
        for (const b of g.boats) {
            if (b.fleeing || b === a) continue;
            if (Math.hypot(b.x - a.x, b.y - a.y) > BOAT_R * 2) continue;
            if (b.kind === 'frank' && g.phase === 'avtale') {
                // Kongens båter tar bare en dult av et skip som sklir - det er ikke du som rammet.
                a.sx *= -0.4;
                a.sy *= -0.4;
                g.events.push({ e: 'bump', x: b.x, y: b.y });
                continue;
            }
            hit(g, b, a.sx * 0.85, a.sy * 0.85, a.chain + 1);
        }
    }

    // Varsel: et vikingskip er nær, og du ligger for sakte - gi gass!
    g.boardWarn =
        g.phase === 'avtale' &&
        sp < BOARD_V &&
        g.ramGrace <= 0 &&
        g.boats.some(
            (b) => b.kind === 'viking' && !b.fleeing && Math.hypot(b.x - s.x, b.y - s.y) < SHIP_R + BOAT_R + 34
        );

    // Vikingskip som kommer forbi Rouen, tar en landsby.
    for (const b of g.boats) {
        if (b.kind !== 'viking' || b.fleeing || b.y > ROUEN_Y) continue;
        b.fleeing = -1; // fjernes
        g.stats.passed++;
        g.combo = 0;
        g.waveClean = false;
        const v = loseVillage(g, 'vikinger');
        g.events.push({ e: 'passed', x: b.x, y: b.y, village: v });
    }
    g.boats = g.boats.filter(
        (b) => b.fleeing >= 0 && b.fleeing < 2 && b.y > -60 && b.y < H + 260
    );

    if (g.phase === 'plyndring') {
        // Sølvbåter kommer ned fra Paris.
        g.bargeCd -= dt;
        if (g.bargeCd <= 0) {
            spawnBarge(g);
            g.bargeCd = 2.2 + g.rng() * 1.2;
        }
        // Borgene og broene skyter på den som kommer for nær.
        for (const f of g.forts) {
            f.cd -= dt;
            const d = Math.hypot(s.x - f.x, s.y - f.y);
            if (f.cd <= 0 && d < f.range) {
                f.cd = 2.0 + g.rng() * 0.6;
                // Bueskytterne sikter der skipet er på vei.
                const tx = s.x + s.vx * VOLLEY_T * 0.8;
                const ty = s.y + s.vy * VOLLEY_T * 0.8;
                g.volleys.push({ id: g.ids++, x: tx, y: ty, t: VOLLEY_T, fx: f.x, fy: f.y });
                g.valg++;
                g.events.push({ e: 'volley', x: tx, y: ty, fx: f.x, fy: f.y });
            }
        }
        for (const v of g.volleys) {
            v.t -= dt;
            if (v.t <= 0) {
                const hit = Math.hypot(s.x - v.x, s.y - v.y) < VOLLEY_R + SHIP_R * 0.5;
                g.events.push({ e: 'arrows', x: v.x, y: v.y, hit });
                if (hit) {
                    s.hp--;
                    s.hit = 0.6;
                    g.shake = 0.5;
                    g.combo = 0;
                }
            }
        }
        g.volleys = g.volleys.filter((v) => v.t > 0);
        if (s.hp <= 0) return lose(g, 'skutt');
    } else {
        const f = Math.min(1, (g.t - P1) / P2);
        // Frankiske sølvbåter krysser fortsatt - nå er de kongens.
        g.bargeCd -= dt;
        if (g.bargeCd <= 0) {
            spawnBarge(g);
            g.bargeCd = 3.4 + g.rng() * 1.6;
        }
        // Er bølgen ryddet, kommer neste straks. Ingen slapp forbi: +2 på rekka.
        if (g.wave.length && !g.boats.some((b) => g.wave.includes(b.id) && !b.fleeing)) {
            g.wave = [];
            if (g.waveClean) {
                g.combo += 2;
                g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
                g.events.push({ e: 'cleanWave', x: s.x, y: s.y });
            }
            g.vikingCd = Math.min(g.vikingCd, 1.5);
        }
        // Vikingskipene kommer fra havet.
        g.vikingCd -= dt;
        if (g.vikingCd <= 0) {
            // Flåtene blir større og tettere: rekker og linjer først, fra 920 kiler.
            // Plyndret du mye før 911, har ryktet spredt seg: ett skip ekstra per ekstra landsby.
            if (g.waveClean && g.anger > 0) {
                g.anger--;
                g.events.push({ e: 'calm', anger: g.anger });
            }
            g.waveClean = true;
            const r = g.rng();
            let n = 2;
            let form: Formation = 'rekke';
            if (g.year >= 926) {
                n = 5 + Math.floor(g.rng() * 2);
                form = r < 0.3 ? 'kile' : r < 0.55 ? 'rekke' : r < 0.75 ? 'splitt' : 'linje';
            } else if (g.year >= 920) {
                n = 4 + Math.floor(g.rng() * 2);
                form = r < 0.35 ? 'rekke' : r < 0.7 ? 'linje' : 'kile';
            } else if (g.year >= 915) {
                n = 4;
                form = r < 0.5 ? 'rekke' : 'linje';
            } else n = 3;
            n += g.extra;
            spawnViking(g, n, form);
            g.vikingCd = 6 - 1.2 * f;
        }
        // Mannskapet reparerer skipet: ett liv tilbake hvert 20. sekund.
        if (s.hp < HP) {
            g.repair += dt;
            if (g.repair >= 20) {
                g.repair = 0;
                s.hp++;
            }
        } else g.repair = 0;
        if (s.hp <= 0) return lose(g, 'bordet');
        if (landLeft(g) <= 0) {
            const by = (c: Cause) => g.villages.filter((v) => v.lost === c).length;
            return lose(g, by('kongen') > by('vikinger') ? 'kongen' : 'vikinger');
        }
        if (g.t >= P1 + P2) {
            g.mode = 'won';
            addPoints(g, 400 * landLeft(g), W / 2, 420);
            g.events.push({ e: 'won' });
        }
    }
}

function lose(g: Game, cause: Cause) {
    g.mode = 'lost';
    g.cause = cause;
    g.events.push({ e: 'lost', cause });
}
