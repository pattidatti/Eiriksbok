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
export const P1 = 44;
/** Etter avtalen: 911 til 933, da Normandie fikk mer land i vest. */
export const P2 = 100;
export const YEAR_A = 885;
export const YEAR_T = 911;
export const YEAR_B = 933;
export const LAND = 6;
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
const VOLLEY_T = 1.05;
export const VOLLEY_R = 40;
/** Sekunder en plyndrer trenger ved landsbyen. */
export const RAID_T = 3.4;
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
    u: number; // sideveis plass i elva (-1..1)
    v: number; // fart langs elva (px/s, + = nedover mot havet)
    fleeing: number; // > 0: rammet, på vei bort
    silver: number;
    /** Farten et rammet skip sklir med - treffer det en annen båt, rammer det den også. */
    sx: number;
    sy: number;
    /** Plyndrere: landsbyen de skal i land ved (-1 = seiler mot Rouen), og hvor langt plyndringen er kommet. */
    raid: number;
    raidT: number;
    chain: number;
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
    | { e: 'ram'; kind: 'frank' | 'viking'; x: number; y: number; points: number; betrayal: boolean; chain: number }
    | { e: 'boarded'; x: number; y: number; hp: number }
    | { e: 'raid'; village: number; x: number; y: number }
    | { e: 'raided'; village: number; x: number; y: number }
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
    for (let i = 0; i < LAND; i++) {
        const y = 360 + i * 56;
        const side = i % 2 === 0 ? -1 : 1;
        villages.push({ x: riverX(y) + side * (riverHalf(y) + 58), y, alive: true, lost: null });
    }
    const y0 = 690;
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
            fortAt(PARIS_Y, 0, 250, 'Paris'),
            fortAt(190, -1, 185, 'Pîtres'),
            fortAt(430, 1, 150, 'Rouen'),
        ],
        volleys: [],
        villages,
        combo: 0,
        year: YEAR_A,
        bargeCd: 0.8,
        vikingCd: 2,
        cause: null,
        valg: 0,
        events: [],
        shake: 0,
        repair: 0,
        stats: { silver: 0, stopped: 0, betrayed: 0, passed: 0, bestCombo: 0, bestChain: 0 },
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
export function steerTo(g: Game, x: number | null, y?: number) {
    g.target = x === null || y === undefined ? null : [x, y];
}

function addPoints(g: Game, n: number, x: number, y: number) {
    const p = Math.round(n * mult(g));
    g.score += p;
    g.events.push({ e: 'points', n: p, x, y });
}

function spawnBarge(g: Game) {
    // Etter 911 holder kongens båter seg langs breddene - midten er din.
    const u =
        g.phase === 'avtale'
            ? (g.rng() < 0.5 ? -1 : 1) * (0.2 + g.rng() * 0.35)
            : (g.rng() - 0.5) * 1.3;
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
        raid: -1,
        raidT: 0,
        chain: 0,
    });
    g.valg++;
    g.events.push({ e: 'barge', x: riverX(40), y: 40 });
}

function spawnViking(g: Game, n: number) {
    const f = Math.min(1, (g.t - P1) / P2);
    for (let i = 0; i < n; i++) {
        const u = (g.rng() - 0.5) * 1.4;
        const y = H + 30 + i * 60;
        // Fra 915 går noen i land og plyndrer en landsby i stedet for å seile mot Rouen.
        const alive = g.villages.map((v, k) => (v.alive ? k : -1)).filter((k) => k >= 0);
        const raid = g.year >= 915 && alive.length && g.rng() < 0.4 ? alive[Math.floor(g.rng() * alive.length)] : -1;
        g.boats.push({
            id: g.ids++,
            kind: 'viking',
            x: riverX(y) + u * riverHalf(y),
            y,
            u,
            v: -(56 + 75 * f) * (0.9 + g.rng() * 0.2),
            fleeing: 0,
            silver: 0,
            sx: 0,
            sy: 0,
            raid,
            raidT: 0,
            chain: 0,
        });
    }
    g.valg++;
    g.events.push({ e: 'viking', x: riverX(H - 20), y: H - 20, n });
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
            // Etter 911: sølvet frister, men kongen tar tilbake en landsby.
            g.stats.betrayed++;
            g.events.push({ e: 'ram', kind: 'frank', x: b.x, y: b.y, points: 0, betrayal: true, chain });
            addPoints(g, 250, b.x, b.y);
            g.combo = 0;
            const v = loseVillage(g, 'kongen');
            if (v >= 0) g.events.push({ e: 'kingTakes', village: v });
        }
    } else {
        g.stats.stopped++;
        g.combo++;
        g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
        g.events.push({ e: 'ram', kind: 'viking', x: b.x, y: b.y, points: 0, betrayal: false, chain });
        addPoints(g, 150 * bonus, b.x, b.y);
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
    return Math.min(1, 0.3 + 0.3 * f + Math.min(0.3, threat * 0.12) + 0.1 * (1 - landLeft(g) / LAND));
}

export function update(g: Game, dt: number) {
    if (dt <= 0) return;
    g.t += dt;
    g.shake = Math.max(0, g.shake - dt * 3);
    const s = g.ship;
    s.hit = Math.max(0, s.hit - dt);
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
        g.events.push({ e: 'treaty' });
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
    s.y = Math.max(16, Math.min(H - 12, s.y));
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
    for (const b of g.boats) {
        if (b.fleeing) {
            b.fleeing += dt;
            b.x += b.sx * dt;
            b.y += b.sy * dt;
            const damp = Math.max(0, 1 - 2.4 * dt);
            b.sx *= damp;
            b.sy *= damp;
            b.y += (b.kind === 'viking' ? 50 : -20) * dt * Math.min(1, b.fleeing);
            continue;
        }
        const village = b.raid >= 0 ? g.villages[b.raid] : null;
        if (village && !village.alive) b.raid = -1;
        if (village && village.alive && b.y <= village.y + 8) {
            // Plyndreren legger til ved landsbyen.
            const side = village.x < riverX(village.y) ? -1 : 1;
            b.u += (side * 0.95 - b.u) * Math.min(1, 2 * dt);
            if (Math.abs(b.u - side * 0.95) < 0.08) {
                if (b.raidT === 0) {
                    g.valg++;
                    g.events.push({ e: 'raid', village: b.raid, x: village.x, y: village.y });
                }
                b.raidT += dt;
                if (b.raidT >= RAID_T) {
                    village.alive = false;
                    village.lost = 'vikinger';
                    g.stats.passed++;
                    g.combo = 0;
                    g.events.push({ e: 'raided', village: b.raid, x: village.x, y: village.y });
                    b.fleeing = 0.001;
                    b.sy = 90;
                    b.sx = 0;
                }
            }
        } else b.y += b.v * dt;
        b.x = riverX(b.y) + b.u * riverHalf(b.y) * 0.8;
    }

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
            if (b.kind === 'viking' && g.phase === 'avtale' && s.hit <= 0 && sp < BOARD_V) {
                // Et vikingskip som kommer borti deg i sakte fart, entrer skipet.
                s.hp--;
                s.hit = 1;
                g.shake = 0.5;
                g.combo = 0;
                s.vx = nx * 160;
                s.vy = ny * 160;
                g.events.push({ e: 'boarded', x: s.x, y: s.y, hp: s.hp });
            } else g.events.push({ e: 'bump', x: b.x, y: b.y });
            continue;
        }
        g.shake = 0.6;
        hit(g, b, s.vx * 0.9, s.vy * 0.9, 0);
        s.vx *= 0.45;
        s.vy *= 0.45;
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

    // Vikingskip som kommer forbi Rouen, tar en landsby.
    for (const b of g.boats) {
        if (b.kind !== 'viking' || b.fleeing || b.y > ROUEN_Y) continue;
        b.fleeing = -1; // fjernes
        g.stats.passed++;
        g.combo = 0;
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
            g.bargeCd = 4.4 + g.rng() * 2;
        }
        // Vikingskipene kommer fra havet.
        g.vikingCd -= dt;
        if (g.vikingCd <= 0) {
            const n = g.year >= 926 && g.rng() < 0.45 ? 3 : g.year >= 920 && g.rng() < 0.5 ? 2 : 1;
            spawnViking(g, n);
            g.vikingCd = (3.2 - 1.7 * f) * (0.8 + g.rng() * 0.4) + (n - 1) * 1.2;
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
