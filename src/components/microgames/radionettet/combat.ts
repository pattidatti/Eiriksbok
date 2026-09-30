import { COMBAT, ENEMIES, KORT_TALL, ORDERS, SCORE, UNITS, type Armor, type EKind, type Kind } from './tuning';
import { MAP_D, MAP_W } from './levels';
import { roadAt, waveDef, slagDef, isAir, power, har, type G, type IO, type Unit, type Enemy } from './game';

// Kampen i en bølge, ett tidssteg om gangen. Fagregelen står i canTarget():
// en enhet i radionettet kan skyte på alt nettet ser, ikke bare det den ser selv.

/** Sekunder mellom skudd per enhetstype (skaden er dps * periode). */
const PERIOD: Record<Kind, number> = { inf: 0.7, vogn: 1.5, pv: 1.6, art: COMBAT.artSalve, lv: 0.45, jag: 0.5, bomb: 1, fsk: 0.7 };
const E_PERIOD: Record<EKind, number> = { einf: 0.8, evogn: 1.6, epak: 1.8, estuka: 1, ejag: 0.5, ebatt: 1 };
const AIR_ALT = 3.2;
const JAG_SPEED = 3.9;
const BOMB_SPEED = 3;

const d2 = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);
const ux = (u: Unit) => (isAir(u.kind) ? u.ax : u.x);
const uz = (u: Unit) => (isAir(u.kind) ? u.az : u.z);
const flying = (u: Unit) => isAir(u.kind) && u.mode !== 'bakke';
const alive = (e: Enemy) => !e.dead && !e.passed;

/** Egne øyne: tåka krymper dem, speiderne gjør infanteriet skarpere. */
function eyes(g: G, u: Unit, camo: boolean) {
    const st = UNITS[u.kind];
    const scout = (u.kind === 'inf' || u.kind === 'fsk') && har(g, 'speidere') ? KORT_TALL.speidere : 0;
    return ((camo ? st.camo : st.sight) + scout) * (waveDef(g).sikt ?? 1);
}

/** Ser enheten fienden med egne øyne? Kamuflert panservern og batterier ses bare på kloss hold. */
function sees(g: G, u: Unit, e: Enemy): boolean {
    const st = UNITS[u.kind];
    const d = d2(ux(u), uz(u), e.x, e.z);
    if (ENEMIES[e.kind].fly) {
        if (u.kind === 'lv') return d <= st.sight;
        if (u.kind === 'jag' && flying(u)) return d <= (u.linked ? COMBAT.flyØyne : st.sight);
        return false;
    }
    if (isAir(u.kind)) return false;
    return d <= eyes(g, u, e.dug);
}

function netVision(g: G) {
    g.netSeen.clear();
    const [hx, hz] = slagDef(g).hq;
    for (const e of g.enemies) {
        if (!alive(e)) continue;
        if (!ENEMIES[e.kind].fly && !e.dug && d2(hx, hz, e.x, e.z) <= 2.2) g.netSeen.add(e.id);
    }
    for (const u of g.units) {
        if (u.dead || !u.linked) continue;
        for (const e of g.enemies) if (alive(e) && !g.netSeen.has(e.id) && sees(g, u, e)) g.netSeen.add(e.id);
    }
}

function canTarget(g: G, u: Unit, e: Enemy) {
    const st = UNITS[u.kind];
    const a = ENEMIES[e.kind].armor;
    if (!alive(e) || st.dps[a] <= 0) return false;
    if (d2(ux(u), uz(u), e.x, e.z) > st.range) return false;
    if (sees(g, u, e)) return true;
    return u.linked && g.netSeen.has(e.id);
}

function hit(g: G, e: Enemy, dmg: number, io: IO) {
    if (!alive(e)) return;
    e.hp -= dmg;
    e.kick = 1;
    if (e.hp <= 0) {
        e.dead = true;
        g.kills += 1;
        g.score += SCORE.drap[e.kind];
        g.fx.push(fx('smell', e.x, e.z, e.alt, false, ENEMIES[e.kind].fly ? 1.2 : 0.7));
        io.event((ENEMIES[e.kind].fly ? 'flyNed:' : 'drept:') + e.kind, e.x, e.z);
    }
}

function splash(g: G, x: number, z: number, r: number, dmg: Record<Armor, number>, io: IO) {
    for (const e of g.enemies)
        if (alive(e) && !ENEMIES[e.kind].fly && d2(x, z, e.x, e.z) <= r) hit(g, e, dmg[ENEMIES[e.kind].armor], io);
    g.fx.push(fx('granat', x, z, 0, false, 0.6));
}

function fx(kind: 'skudd' | 'smell' | 'granat' | 'kutt' | 'sperre', x: number, z: number, alt: number, fiende: boolean, life = 0.18) {
    return { kind, x, z, x2: x, z2: z, alt, t: 0, life, fiende };
}

/** Tunge løp (vogner og panservern) sender en synlig granat, lettere våpen et kort sporlys. */
const HEAVY = new Set(['vogn', 'pv', 'evogn', 'epak']);
function shot(g: G, x: number, z: number, x2: number, z2: number, alt: number, fiende: boolean, by: string, hard = false) {
    g.fx.push({ kind: 'skudd', x, z, x2, z2, alt, t: 0, life: HEAVY.has(by) ? 0.2 : 0.14, fiende, by, hard });
}

// ---- Fienden kommer ---------------------------------------------------------------
function spawn(g: G, io: IO) {
    const w = waveDef(g);
    w.groups.forEach((gr, i) => {
        const n = g.spawned[i];
        if (n >= gr.n || g.waveT < gr.t + n * gr.gap) return;
        g.spawned[i] += 1;
        if (n === 0) g.valg += 1;
        const st = ENEMIES[gr.kind];
        const r = Math.min(g.roads.length - 1, gr.vei ?? 0);
        const [x, z] = gr.pos ?? (st.fly ? [MAP_W + 1, -0.5 + g.rng() * 3] : g.roads[r].pts[0]);
        const batt = gr.kind === 'ebatt';
        g.enemies.push({
            id: g.nextId++,
            kind: gr.kind,
            r,
            s: 0,
            x,
            z,
            alt: st.fly ? AIR_ALT + 0.6 : 0,
            hp: st.hp,
            maxHp: st.hp,
            // Batteriet står nedgravd og skjult hele tiden.
            dug: batt,
            cd: g.rng() * 0.5,
            targetId: -1,
            timer: batt ? COMBAT.battStart + g.rng() * 2 : 0,
            phase: 'inn',
            heading: Math.PI,
            dead: false,
            passed: false,
            kick: 0,
            revealed: false,
        });
        if (n === 0) io.event('ny:' + gr.kind, x, z);
    });
}

// ---- Dine enheter ------------------------------------------------------------------
function actGround(g: G, u: Unit, dt: number, io: IO) {
    u.cd -= dt;
    if (u.cd > 0) return;
    const st = UNITS[u.kind];
    const mult = power(u);
    let best: Enemy | null = null;
    let bestScore = -Infinity;
    for (const e of g.enemies) {
        if (!canTarget(g, u, e)) continue;
        // Skyt det du gjør mest skade på, og det som har kommet lengst.
        const sc = st.dps[ENEMIES[e.kind].armor] * 100 + e.s;
        if (sc > bestScore) {
            bestScore = sc;
            best = e;
        }
    }
    if (!best) return;
    const p = PERIOD[u.kind];
    u.cd = p;
    u.kick = 1;
    const own = sees(g, u, best);
    if (!own) g.netShots += 1;
    if (u.kind === 'art') {
        splash(g, best.x, best.z, st.splash ?? 1, { soft: st.dps.soft * p * mult, armor: st.dps.armor * p * mult, gun: st.dps.gun * p * mult, air: 0 }, io);
        io.event('salve', u.x, u.z);
    } else {
        hit(g, best, st.dps[ENEMIES[best.kind].armor] * p * mult, io);
        shot(g, u.x, u.z, best.x, best.z, best.alt, false, u.kind, ENEMIES[best.kind].armor === 'armor');
    }
}

function steer(u: Unit, tx: number, tz: number, speed: number, dt: number) {
    const dx = tx - u.ax;
    const dz = tz - u.az;
    const d = Math.hypot(dx, dz);
    if (d < 1e-3) return 0;
    const step = Math.min(d, speed * dt);
    u.ax += (dx / d) * step;
    u.az += (dz / d) * step;
    u.heading = Math.atan2(dx, dz);
    return d - step;
}

function actJag(g: G, u: Unit, dt: number, t: number, io: IO) {
    if (u.mode === 'bakke') return;
    u.alt = AIR_ALT;
    // I nettet følger jagerne bombeflyene i nettet.
    const escort = u.linked ? g.units.find((b) => b.kind === 'bomb' && !b.dead && b.linked && flying(b)) : undefined;
    let target: Enemy | null = null;
    let bd = Infinity;
    for (const e of g.enemies) {
        if (!alive(e) || !ENEMIES[e.kind].fly) continue;
        if (!(sees(g, u, e) || (u.linked && g.netSeen.has(e.id)))) continue;
        const d = d2(u.ax, u.az, e.x, e.z);
        const pri = e.kind === 'ejag' && escort ? d - 3 : d;
        if (pri < bd) {
            bd = pri;
            target = e;
        }
    }
    if (target) {
        u.mode = 'jakt';
        steer(u, target.x, target.z, JAG_SPEED, dt);
        u.cd -= dt;
        if (u.cd <= 0 && d2(u.ax, u.az, target.x, target.z) <= UNITS.jag.range) {
            u.cd = PERIOD.jag;
            hit(g, target, UNITS.jag.dps.air * PERIOD.jag * power(u) * (har(g, 'fly') ? KORT_TALL.fly : 1), io);
            shot(g, u.ax, u.az, target.x, target.z, target.alt, false, u.kind);
        }
        return;
    }
    u.mode = 'patrulje';
    const cx = escort ? escort.ax : MAP_W * 0.55;
    const cz = escort ? escort.az : MAP_D * 0.45;
    const a = t * 0.9 + u.id;
    steer(u, cx + Math.cos(a) * COMBAT.patrulje, cz + Math.sin(a) * COMBAT.patrulje, JAG_SPEED, dt);
}

function densest(g: G): [number, number] | null {
    let best: [number, number] | null = null;
    let bs = 0;
    for (const e of g.enemies) {
        if (!alive(e) || ENEMIES[e.kind].fly || !g.netSeen.has(e.id)) continue;
        let s = 0;
        for (const f of g.enemies) if (alive(f) && !ENEMIES[f.kind].fly && d2(e.x, e.z, f.x, f.z) <= COMBAT.bombSprut) s += f.maxHp;
        if (s > bs) {
            bs = s;
            best = [e.x, e.z];
        }
    }
    return best;
}

function actBomb(g: G, u: Unit, dt: number, io: IO) {
    if (u.mode === 'bakke') {
        u.alt = 0;
        u.toktCd -= dt;
        if (u.toktCd > 0) return;
        // I nettet vet bombeflyene hvor fienden står tettest. Alene gjetter de et sted på veien.
        let tgt = u.linked ? densest(g) : null;
        const road = g.roads[Math.floor(g.rng() * g.roads.length)];
        if (!tgt && !u.linked) tgt = roadAt(road, road.len * (0.1 + g.rng() * 0.5));
        if (!tgt) {
            u.toktCd = 1;
            return;
        }
        u.mode = 'tokt';
        u.tx = tgt[0];
        u.tz = tgt[1];
        io.event('tokt', u.x, u.z);
        return;
    }
    u.alt = Math.min(AIR_ALT + 0.5, u.alt + dt * 2);
    if (u.mode === 'tokt') {
        if (steer(u, u.tx, u.tz, BOMB_SPEED, dt) <= 0.05) {
            splash(g, u.tx, u.tz, COMBAT.bombSprut, scaled(COMBAT.bombSkade, power(u) * (har(g, 'fly') ? KORT_TALL.fly : 1)), io);
            g.shake = Math.max(g.shake, 0.5);
            io.event('bomber', u.tx, u.tz);
            u.mode = 'hjem';
        }
        return;
    }
    if (steer(u, u.x, u.z, BOMB_SPEED, dt) <= 0.05) {
        u.mode = 'bakke';
        u.toktCd = COMBAT.bombTokt;
    }
}

function scaled(r: Record<Armor, number>, k: number): Record<Armor, number> {
    return { soft: r.soft * k, armor: r.armor * k, gun: r.gun * k, air: 0 };
}

// ---- Fiendens enheter ----------------------------------------------------------------
function hurtUnit(g: G, u: Unit, dmg: number, io: IO) {
    u.hp -= dmg;
    u.kick = 1;
    if (u.hp <= 0 && !u.dead) {
        u.dead = true;
        u.linked = false;
        u.linking = 0;
        g.tap += 1;
        g.fx.push(fx('smell', ux(u), uz(u), u.alt, true, 0.9));
        io.event((isAir(u.kind) ? 'egetFlyNed:' : 'tapt:') + u.kind, ux(u), uz(u));
    }
}

/** Et nedslag på en av dine: full skade på den, en del på naboene (straffer klumper). */
function impact(g: G, tgt: Unit, dmg: number, io: IO) {
    hurtUnit(g, tgt, dmg, io);
    for (const u of g.units)
        if (u !== tgt && !u.dead && !isAir(u.kind) && d2(u.x, u.z, tgt.x, tgt.z) <= COMBAT.sprut) hurtUnit(g, u, dmg * COMBAT.sprutAndel, io);
}

/** Linja til enheten ryker. */
function cut(g: G, u: Unit, io: IO) {
    if (!(u.linked || u.linking > 0)) return;
    u.linked = false;
    u.linking = 0;
    g.valg += 1;
    g.fx.push(fx('kutt', u.x, u.z, 0, true, 1.4));
    io.event('kutt', u.x, u.z);
}

/** Batteriet: skjult utenfor veien, skyter på dem i nettet og kutter linjene deres. */
function actBatt(g: G, e: Enemy, dt: number, io: IO) {
    e.timer -= dt;
    if (e.timer > 0) return;
    e.timer = COMBAT.battSalve;
    const ground = g.units.filter((u) => !u.dead && !isAir(u.kind));
    if (!ground.length) return;
    const linked = ground.filter((u) => u.linked);
    const pool = linked.length ? linked : ground;
    const u = pool[Math.floor(g.rng() * pool.length)];
    e.kick = 1;
    if (!e.revealed) {
        e.revealed = true;
        if (!g.kjentBatt.some(([x, z]) => x === e.x && z === e.z)) g.kjentBatt.push([e.x, e.z]);
    }
    io.event('batteri', e.x, e.z);
    impact(g, u, COMBAT.kuttSkade, io);
    g.fx.push(fx('granat', u.x, u.z, 0, true, 0.6));
    cut(g, u, io);
}

function actEnemyGround(g: G, e: Enemy, dt: number, io: IO) {
    const st = ENEMIES[e.kind];
    const [hx, hz] = slagDef(g).hq;
    // Panservernet graver seg ned når det ser en stridsvogn.
    // Ser det ingen vogn på en stund, kjører det videre.
    if (e.kind === 'epak') {
        const vogn = g.units.some((u) => !u.dead && u.kind === 'vogn' && d2(u.x, u.z, e.x, e.z) <= COMBAT.pakGraverVed);
        if (vogn && g.waveT < COMBAT.bølgeMaks) {
            e.dug = true;
            e.timer = 0;
        } else if (e.dug && (e.timer += dt) > COMBAT.pakBlir) e.dug = false;
    }
    let target: Unit | null = null;
    let td = Infinity;
    for (const u of g.units) {
        if (u.dead || isAir(u.kind)) continue;
        const d = d2(u.x, u.z, e.x, e.z);
        if (d > st.range) continue;
        const a = UNITS[u.kind].armor;
        const pri = d - st.dps[a] / 8;
        if (pri < td) {
            td = pri;
            target = u;
        }
    }
    const hqInRange = d2(hx, hz, e.x, e.z) <= st.range;
    let speed = st.speed * (waveDef(g).fart ?? 1);
    // Infanteriet stopper for å skyte, vogner kjører sakte videre, panservernet stopper bare nedgravd.
    if (target || hqInRange) speed = e.kind === 'evogn' ? st.speed * COMBAT.vognKjørerMensDenSkyter : e.kind === 'einf' ? 0 : speed;
    if (e.dug) speed = 0;
    const road = g.roads[e.r];
    e.s += speed * dt;
    [e.x, e.z] = roadAt(road, e.s);
    if (e.s >= road.len) {
        e.passed = true;
        g.linje -= st.brudd;
        io.event('brudd', e.x, e.z);
        return;
    }
    e.cd -= dt;
    if (e.cd > 0) return;
    const p = E_PERIOD[e.kind];
    if (target) {
        e.cd = p;
        e.kick = 1;
        hurtUnit(g, target, st.dps[UNITS[target.kind].armor] * p, io);
        shot(g, e.x, e.z, target.x, target.z, 0, true, e.kind, UNITS[target.kind].armor === 'armor');
    } else if (hqInRange) {
        e.cd = p;
        e.kick = 1;
        g.hqHp -= st.dps.soft * p;
        shot(g, e.x, e.z, hx, hz, 0, true, e.kind, true);
        io.event('hqTreff', hx, hz);
    }
}

function moveAir(e: Enemy, tx: number, tz: number, dt: number) {
    const dx = tx - e.x;
    const dz = tz - e.z;
    const d = Math.hypot(dx, dz);
    const step = Math.min(d, ENEMIES[e.kind].speed * dt);
    if (d > 1e-3) {
        e.x += (dx / d) * step;
        e.z += (dz / d) * step;
        e.heading = Math.atan2(dx, dz);
    }
    return d - step;
}

function actStuka(g: G, e: Enemy, dt: number, io: IO) {
    if (e.phase === 'ut') {
        moveAir(e, -3, -3, dt);
        e.alt = Math.min(AIR_ALT + 1, e.alt + dt * 3);
        if (e.x < -2 || e.z < -2) e.passed = true;
        return;
    }
    let tgt = g.units.find((u) => u.id === e.targetId && !u.dead);
    if (!tgt) {
        const ground = g.units.filter((u) => !u.dead && !isAir(u.kind));
        if (!ground.length) {
            e.phase = 'ut';
            return;
        }
        // Stupbomberne går etter det som holder nettet sammen, helst der flest står tett.
        const linked = ground.filter((u) => u.linked);
        const pool = linked.length && g.rng() < 0.75 ? linked : ground;
        const crowd = (u: Unit) => ground.filter((v) => d2(u.x, u.z, v.x, v.z) <= COMBAT.sprut).length + g.rng() * 0.5;
        tgt = pool.reduce((a, b) => (crowd(b) > crowd(a) ? b : a));
        e.targetId = tgt.id;
    }
    const left = moveAir(e, tgt.x, tgt.z, dt);
    if (left < 1.6) e.phase = 'stup';
    if (e.phase === 'stup') e.alt = Math.max(0.8, e.alt - dt * 4.5);
    if (left <= 0.05) {
        impact(g, tgt, COMBAT.stukaSkade, io);
        g.fx.push(fx('smell', tgt.x, tgt.z, 0, true, 0.8));
        g.shake = Math.max(g.shake, 0.4);
        cut(g, tgt, io);
        e.phase = 'ut';
    }
}

function actEJag(g: G, e: Enemy, dt: number, io: IO) {
    let tgt: Unit | null = null;
    let bd = Infinity;
    for (const u of g.units) {
        if (u.dead || !flying(u)) continue;
        const d = d2(u.ax, u.az, e.x, e.z) - (u.kind === 'bomb' ? 4 : 0);
        if (d < bd) {
            bd = d;
            tgt = u;
        }
    }
    e.timer += dt;
    if (!tgt) {
        // Ingen fly å jakte på: kretser over fronten en stund, så drar de hjem.
        if (e.timer > 14) {
            moveAir(e, -3, -3, dt);
            if (e.x < -2 || e.z < -2) e.passed = true;
            return;
        }
        const a = g.t * 0.7 + e.id;
        moveAir(e, MAP_W * 0.7 + Math.cos(a) * 2.5, MAP_D * 0.35 + Math.sin(a) * 2, dt);
        return;
    }
    moveAir(e, tgt.ax, tgt.az, dt);
    e.cd -= dt;
    if (e.cd <= 0 && d2(tgt.ax, tgt.az, e.x, e.z) <= ENEMIES.ejag.range) {
        e.cd = E_PERIOD.ejag;
        hurtUnit(g, tgt, ENEMIES.ejag.dps.air * E_PERIOD.ejag, io);
        shot(g, e.x, e.z, tgt.ax, tgt.az, AIR_ALT, true, e.kind);
    }
}

// ---- Tidssteget -------------------------------------------------------------------------
export function stepWave(g: G, dt: number, io: IO) {
    spawn(g, io);
    if (g.pendingSperre) {
        g.pendingSperre.t -= dt;
        if (g.pendingSperre.t <= 0) {
            const { x, z } = g.pendingSperre;
            const o = ORDERS.sperreild;
            for (let k = 0; k < 5; k++) {
                const a = (k / 5) * Math.PI * 2;
                g.fx.push(fx('granat', x + Math.cos(a) * o.radius * 0.6, z + Math.sin(a) * o.radius * 0.6, 0, false, 0.7));
            }
            splash(g, x, z, o.radius, o.skade, io);
            g.shake = 0.8;
            io.event('sperreild', x, z);
            g.pendingSperre = null;
        }
    }
    netVision(g);
    for (const u of g.units) {
        if (u.dead) continue;
        u.kick = Math.max(0, u.kick - dt * 4);
        if (u.kind === 'jag') actJag(g, u, dt, g.waveT, io);
        else if (u.kind === 'bomb') actBomb(g, u, dt, io);
        else actGround(g, u, dt, io);
    }
    for (const e of g.enemies) {
        if (!alive(e)) continue;
        e.kick = Math.max(0, e.kick - dt * 4);
        if (e.kind === 'estuka') actStuka(g, e, dt, io);
        else if (e.kind === 'ebatt') actBatt(g, e, dt, io);
        else if (e.kind === 'ejag') actEJag(g, e, dt, io);
        else actEnemyGround(g, e, dt, io);
    }
    for (const f of g.fx) f.t += dt;
    g.fx = g.fx.filter((f) => f.t < f.life);
    g.shake = Math.max(0, g.shake - dt * 1.5);
}

